import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../lib/supabase";

// ─── Mapping frein_* → clé JSONB freins_entree ───────────────────────────────
const FREIN_MAP = {
  frein_situation_familiale: "Situation familiale",
  frein_logement:            "Logement",
  frein_sante:               "Santé",
  frein_ressources:          "Ressources/Dettes",
  frein_mobilite:            "Mobilité",
  frein_parcours_scolaire:   "Parcours scolaire",
  frein_langue:              "Langue",
  frein_experience_pro:      "Expérience pro",
  frein_autonomie_admin:     "Autonomie administrative",
};

// Colonnes qui NE vont PAS directement dans la table (traitées à part)
const SKIP_COLS = new Set([
  ...Object.keys(FREIN_MAP),
  "domaines_pro_1", "domaines_pro_2", "domaines_pro_3",
]);

// Convertit une valeur texte booléenne en vrai booléen
const parseBool = (v) => {
  if (v === true || v === false) return v;
  if (typeof v === "string") {
    if (v.toUpperCase() === "TRUE"  || v === "1" || v.toLowerCase() === "oui") return true;
    if (v.toUpperCase() === "FALSE" || v === "0" || v.toLowerCase() === "non") return false;
  }
  return null;
};

// Booléens stricts dans la DB
const BOOL_COLS = new Set([
  "suivi_spip","deld","brsa","th","ass","sans_ressources","resident_qpv",
  "cv","lecture","ecriture","calcul","acces_internet","permis_b","vehicule","css",
  "accord_suivi_post","accord_transmission","a_rappeler",
]);

// Convertit une ligne Excel (objet {header: valeur}) en payload Supabase
function rowToPayload(row, siteIdOverride, cipIdOverride) {
  const payload = {};

  for (const [key, rawVal] of Object.entries(row)) {
    if (SKIP_COLS.has(key)) continue;
    if (key === "" || key === undefined) continue;

    let val = rawVal === undefined || rawVal === "" ? null : rawVal;

    // Booleans
    if (BOOL_COLS.has(key) && val !== null) {
      val = parseBool(val);
    }
    // Nombres
    if ((key === "nb_enfants" || key === "revenus" || key === "charges" || key === "duree_chomage_mois" || key === "heures_travaillees") && val !== null) {
      val = Number(val) || 0;
    }
    // Dates : s'assurer que c'est une string YYYY-MM-DD
    if (typeof val === "number" && (key.startsWith("date_") || key.endsWith("_au"))) {
      // ExcelJS stocke parfois les dates comme des numéros de série
      const d = XLSX.SSF.parse_date_code(val);
      if (d) val = `${d.y}-${String(d.m).padStart(2,"0")}-${String(d.d).padStart(2,"0")}`;
    }

    payload[key] = val;
  }

  // Champs calculés
  payload.freins_entree = {};
  for (const [dbKey, appKey] of Object.entries(FREIN_MAP)) {
    const v = row[dbKey];
    if (v && v !== "") payload.freins_entree[appKey] = v;
  }

  payload.domaines_pro = [
    row.domaines_pro_1 || "",
    row.domaines_pro_2 || "",
    row.domaines_pro_3 || "",
  ].filter(Boolean);

  // Overrides site / CIP
  if (siteIdOverride) payload.site_id = siteIdOverride;
  if (cipIdOverride)  payload.cip_id  = cipIdOverride;

  return payload;
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function Import({ user, sites }) {
  const fileRef  = useRef(null);
  const [file,      setFile]      = useState(null);
  const [rows,      setRows]      = useState([]);   // données parsées
  const [headers,   setHeaders]   = useState([]);   // noms DB (ligne 1)
  const [labelRow,  setLabelRow]  = useState([]);   // noms FR (ligne 2)
  const [parseErr,  setParseErr]  = useState("");
  const [siteOver,  setSiteOver]  = useState("");   // override site_id
  const [importing, setImporting] = useState(false);
  const [progress,  setProgress]  = useState(null); // { done, total, errors[] }
  const [done,      setDone]      = useState(false);

  // ── Lecture du fichier ────────────────────────────────────────────────────
  const parseFile = useCallback((f) => {
    setParseErr("");
    setRows([]);
    setHeaders([]);
    setLabelRow([]);
    setProgress(null);
    setDone(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb   = XLSX.read(e.target.result, { type: "array", cellDates: true });
        // Chercher l'onglet "Salariés" ou prendre le premier
        const name = wb.SheetNames.find(n => n.toLowerCase().includes("salari")) ?? wb.SheetNames[0];
        const ws   = wb.Sheets[name];
        const aoa  = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        if (aoa.length < 2) throw new Error("Le fichier semble vide (moins de 2 lignes).");

        const dbRow = aoa[0].map(c => String(c ?? "").trim());
        const frRow = aoa[1].map(c => String(c ?? "").trim());

        // Vérifier que la 1ère colonne ressemble à une clé DB
        if (!dbRow[0] || dbRow[0].includes(" ") || dbRow[0] === frRow[0]) {
          throw new Error("Ligne 1 introuvable : assurez-vous que la ligne 1 contient les noms de colonnes DB (ex: nom, prenom, date_entree…).");
        }

        // Lignes de données (sauter la ligne 3 si c'est l'exemple)
        const dataRows = aoa.slice(2).filter((r, i) => {
          if (i === 0 && String(r[0]).includes("EXEMPLE")) return false;
          return r.some(c => c !== "" && c !== null && c !== undefined);
        });

        // Convertir en objets {dbKey: valeur}
        const parsed = dataRows.map(r => {
          const obj = {};
          dbRow.forEach((k, i) => { if (k) obj[k] = r[i] ?? ""; });
          return obj;
        });

        setHeaders(dbRow);
        setLabelRow(frRow);
        setRows(parsed);
      } catch (err) {
        setParseErr(err.message);
      }
    };
    reader.readAsArrayBuffer(f);
  }, []);

  const onFileChange = (f) => {
    if (!f) return;
    setFile(f);
    parseFile(f);
  };

  // Drag & drop
  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) onFileChange(f);
  };

  // ── Import vers Supabase ──────────────────────────────────────────────────
  const handleImport = async () => {
    if (!rows.length) return;
    setImporting(true);
    setDone(false);
    const errors = [];
    let done = 0;

    for (const row of rows) {
      try {
        const payload = rowToPayload(row, siteOver || null, null);

        // Valider champs obligatoires
        if (!payload.nom || !payload.prenom) {
          errors.push({ nom: payload.nom || "(vide)", err: "Nom ou prénom manquant" });
          continue;
        }
        if (!payload.site_id) {
          errors.push({ nom: `${payload.nom} ${payload.prenom}`, err: "site_id manquant — sélectionnez un site ci-dessus" });
          continue;
        }


        const { error } = await supabase.from("salaries").insert(payload);
        if (error) throw new Error(error.message);
        done++;
      } catch (err) {
        errors.push({ nom: `${row.nom ?? ""} ${row.prenom ?? ""}`.trim() || "(inconnu)", err: err.message });
      }
      setProgress({ done, total: rows.length, errors: [...errors] });
    }

    setProgress({ done, total: rows.length, errors });
    setImporting(false);
    setDone(true);
  };

  // ── UI ────────────────────────────────────────────────────────────────────
  const siteOptions = sites;

  const PREVIEW_COLS = ["nom", "prenom", "date_entree", "prescripteur", "site_id"];
  const previewHeaders = headers.filter(h => PREVIEW_COLS.includes(h));

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import de salariés</h1>
        <p className="text-sm text-gray-400 mt-1">
          Importez votre fichier Excel de saisie. Les données seront ajoutées dans la base.
        </p>
      </div>

      {/* ── Zone de dépôt ─────────────────────────────────────────────────── */}
      <div
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
          file ? "border-indigo-400 bg-indigo-50" : "border-gray-300 bg-white hover:border-indigo-300 hover:bg-gray-50"
        }`}
      >
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
          onChange={e => onFileChange(e.target.files[0])} />
        <p className="text-3xl mb-2">📂</p>
        {file
          ? <p className="text-sm font-semibold text-indigo-700">{file.name}</p>
          : <p className="text-sm text-gray-500">Cliquez ou glissez votre fichier Excel ici</p>
        }
        <p className="text-xs text-gray-400 mt-1">.xlsx · .xls · .csv</p>
      </div>

      {/* ── Erreur de lecture ──────────────────────────────────────────────── */}
      {parseErr && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          ⚠ {parseErr}
        </div>
      )}

      {/* ── Résultat du parsing ───────────────────────────────────────────── */}
      {rows.length > 0 && (
        <>
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800 flex items-center gap-2">
            <span className="text-lg">✓</span>
            <span><strong>{rows.length} salarié{rows.length > 1 ? "s" : ""}</strong> détecté{rows.length > 1 ? "s" : ""} dans le fichier</span>
          </div>

          {/* ── Overrides site / CIP ──────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Affecter un site à tous les salariés importés
            </p>
            <p className="text-xs text-gray-400">
              Si votre fichier contient déjà le site_id Supabase, laissez vide. Sinon, sélectionnez ici.
            </p>
            <div className="max-w-sm">
              <label className="text-xs font-medium text-gray-600 block mb-1">Site <span className="text-red-500">*</span></label>
              <select value={siteOver} onChange={e => setSiteOver(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200">
                <option value="">— Utiliser les IDs du fichier —</option>
                {siteOptions.map(s => (
                  <option key={s.id} value={s.id}>
                    {[s.filiale, s.secteur !== s.activite ? s.activite : null, s.nom].filter(Boolean).join(" › ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Aperçu des 5 premières lignes ─────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Aperçu (5 premières lignes)
            </p>
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left text-gray-500 font-semibold">#</th>
                    {previewHeaders.map(h => (
                      <th key={h} className="px-3 py-2 text-left text-gray-500 font-semibold whitespace-nowrap">
                        {labelRow[headers.indexOf(h)] || h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                      {previewHeaders.map(h => (
                        <td key={h} className="px-3 py-2 text-gray-700 truncate max-w-[140px]">
                          {String(row[h] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 5 && (
                <p className="text-xs text-gray-400 mt-2 pl-1">… et {rows.length - 5} autre{rows.length - 5 > 1 ? "s" : ""}</p>
              )}
            </div>
          </div>

          {/* ── Bouton import ──────────────────────────────────────────────── */}
          {!done && (
            <div className="flex items-center gap-4">
              <button
                onClick={handleImport}
                disabled={importing}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-semibold px-8 py-3 rounded-xl text-sm transition-colors flex items-center gap-2"
              >
                {importing
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Import en cours…</>
                  : <>⬆ Importer {rows.length} salarié{rows.length > 1 ? "s" : ""}</>
                }
              </button>
              {importing && progress && (
                <p className="text-sm text-indigo-600">
                  {progress.done} / {progress.total}…
                </p>
              )}
            </div>
          )}

          {/* ── Résultats ──────────────────────────────────────────────────── */}
          {progress && (
            <div className="space-y-3">
              {progress.done > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
                  ✓ <strong>{progress.done}</strong> salarié{progress.done > 1 ? "s" : ""} importé{progress.done > 1 ? "s" : ""} avec succès
                </div>
              )}
              {progress.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
                  <p className="font-semibold text-red-800 mb-2">⚠ {progress.errors.length} erreur{progress.errors.length > 1 ? "s" : ""} :</p>
                  <ul className="space-y-1">
                    {progress.errors.map((e, i) => (
                      <li key={i} className="text-red-700">
                        <span className="font-medium">{e.nom}</span> — {e.err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {done && (
                <button onClick={() => { setFile(null); setRows([]); setDone(false); setProgress(null); }}
                  className="text-sm text-indigo-600 hover:underline">
                  ← Importer un autre fichier
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Guide rapide ──────────────────────────────────────────────────── */}
      {!file && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs text-amber-800 space-y-2">
          <p className="font-semibold text-sm">📋 Format attendu</p>
          <ul className="space-y-1 list-disc list-inside">
            <li><strong>Ligne 1</strong> : noms des colonnes DB (<code>nom</code>, <code>prenom</code>, <code>date_entree</code>…)</li>
            <li><strong>Ligne 2</strong> : libellés en français (ignorée)</li>
            <li><strong>Ligne 3+</strong> : une ligne par salarié</li>
            <li>Onglet nommé <strong>"Salariés"</strong> (ou 1er onglet)</li>
          </ul>
          <p className="mt-2">⚠ La ligne exemple du template (marquée "EXEMPLE") est automatiquement ignorée.</p>
        </div>
      )}
    </div>
  );
}
