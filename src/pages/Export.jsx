import { useState, useMemo } from "react";
import { getScopeIds, dureeM } from "../lib/utils";
import { exportSalaries, exportEntretiens, exportStats } from "../lib/export";

// ─── Filtre multi-sélection (chips) ──────────────────────────────────────────
function CheckGroup({ label, options, selected, onChange }) {
  const toggle = v => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => onChange([])}
          className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
            selected.length === 0 ? "bg-indigo-600 text-white border-indigo-600" : "text-gray-500 border-gray-200 hover:border-indigo-300"
          }`}>Tous</button>
        {options.map(o => (
          <button key={o} onClick={() => toggle(o)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
              selected.includes(o) ? "bg-indigo-600 text-white border-indigo-600" : "text-gray-600 border-gray-200 hover:border-indigo-300"
            }`}>{o}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Carte type d'export ──────────────────────────────────────────────────────
function TypeCard({ icon, title, desc, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`text-left p-4 rounded-2xl border-2 transition-all w-full ${
        active ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white hover:border-indigo-300"
      }`}>
      <div className="text-2xl mb-2">{icon}</div>
      <p className={`text-sm font-bold ${active ? "text-indigo-800" : "text-gray-800"}`}>{title}</p>
      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{desc}</p>
    </button>
  );
}

// ─── Aperçu du périmètre ──────────────────────────────────────────────────────
function PreviewBadge({ label, count, color = "indigo" }) {
  const cls = {
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    green:  "bg-green-50  text-green-700  border-green-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
  }[color];
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 ${cls}`}>
      <span className="text-xl font-bold">{count}</span>
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export default function Export({ user, salaries, entretiens, sites, profiles }) {
  // ── Type d'export ─────────────────────────────────────────────────────────
  const [exportType, setExportType] = useState("salaries"); // "salaries"|"entretiens"|"stats"

  // ── Plage de dates ────────────────────────────────────────────────────────
  const thisYear = new Date().getFullYear();
  const [dateDebut, setDateDebut] = useState(`${thisYear}-01-01`);
  const [dateFin,   setDateFin]   = useState(`${thisYear}-12-31`);

  // ── Filtres hiérarchiques ─────────────────────────────────────────────────
  const [selFiliale,  setSelFiliale]  = useState([]);
  const [selSecteur,  setSelSecteur]  = useState([]);
  const [selActivite, setSelActivite] = useState([]);
  const [selSite,     setSelSite]     = useState([]);

  // ── Sites accessibles (périmètre du rôle) ────────────────────────────────
  const accessibleSites = useMemo(() => {
    const ids = getScopeIds(user, sites);
    return ids ? sites.filter(s => ids.includes(s.id)) : sites;
  }, [user, sites]);

  const filialesList  = [...new Set(accessibleSites.map(s => s.filiale).filter(Boolean))].sort();
  const secteursList  = [...new Set(
    accessibleSites.filter(s => !selFiliale.length || selFiliale.includes(s.filiale))
      .map(s => s.secteur).filter(Boolean)
  )].sort();
  const activitesList = [...new Set(
    accessibleSites.filter(s =>
      (!selFiliale.length || selFiliale.includes(s.filiale)) &&
      (!selSecteur.length || selSecteur.includes(s.secteur))
    ).map(s => s.activite).filter(Boolean)
  )].sort();
  const sitesList = [...new Set(
    accessibleSites.filter(s =>
      (!selFiliale.length  || selFiliale.includes(s.filiale))  &&
      (!selSecteur.length  || selSecteur.includes(s.secteur))  &&
      (!selActivite.length || selActivite.includes(s.activite))
    ).map(s => s.nom).filter(Boolean)
  )].sort();

  // IDs des sites après filtres hiérarchiques
  const filteredSiteIds = useMemo(() => {
    const noFilter = !selFiliale.length && !selSecteur.length && !selActivite.length && !selSite.length;
    const baseScopeIds = getScopeIds(user, sites); // périmètre rôle
    const candidats = noFilter
      ? accessibleSites
      : accessibleSites.filter(s =>
          (!selFiliale.length  || selFiliale.includes(s.filiale))  &&
          (!selSecteur.length  || selSecteur.includes(s.secteur))  &&
          (!selActivite.length || selActivite.includes(s.activite)) &&
          (!selSite.length     || selSite.includes(s.nom))
        );
    const ids = candidats.map(s => s.id);
    // Si admin et aucun filtre hiérarchique → null (pas de restriction)
    if (baseScopeIds === null && noFilter) return null;
    return ids;
  }, [user, sites, accessibleSites, selFiliale, selSecteur, selActivite, selSite]);

  // ── Compteurs d'aperçu ────────────────────────────────────────────────────
  const preview = useMemo(() => {
    const from = dateDebut || "0000-01-01";
    const to   = dateFin   || "9999-12-31";

    const baseSals = filteredSiteIds
      ? salaries.filter(s => filteredSiteIds.includes(s.site_id))
      : salaries;

    const salCount = baseSals.filter(s => {
      if (!s.dateEntree) return false;
      const sortie = s.dateSortie || "9999-12-31";
      return s.dateEntree <= to && sortie >= from;
    }).length;

    const baseSalIds = new Set(baseSals.map(s => s.id));
    const entCount = entretiens.filter(e =>
      e.date && e.date >= from && e.date <= to && baseSalIds.has(e.salarie_id)
    ).length;

    return { salaries: salCount, entretiens: entCount };
  }, [salaries, entretiens, filteredSiteIds, dateDebut, dateFin]);

  // ── Raccourcis périodes ───────────────────────────────────────────────────
  const shortcuts = [
    { label: "Cette année",        from: `${thisYear}-01-01`,         to: `${thisYear}-12-31` },
    { label: "Année dernière",     from: `${thisYear - 1}-01-01`,     to: `${thisYear - 1}-12-31` },
    { label: "6 derniers mois",    from: (() => { const d = new Date(); d.setMonth(d.getMonth() - 6); return d.toISOString().slice(0,10); })(), to: new Date().toISOString().slice(0,10) },
    { label: "Tout",               from: "",                           to: "" },
  ];

  // ── Exporter ──────────────────────────────────────────────────────────────
  const [exporting, setExporting] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const handleExport = async () => {
    setExporting(true);
    setLastResult(null);
    try {
      const args = { salaries, entretiens, sites, profiles, scopeIds: filteredSiteIds, dateDebut: dateDebut || null, dateFin: dateFin || null };
      let result;
      if (exportType === "salaries")   result = exportSalaries(args);
      if (exportType === "entretiens") result = exportEntretiens(args);
      if (exportType === "stats")      result = exportStats(args);
      setLastResult(result);
    } catch (e) {
      setLastResult({ error: e.message });
    } finally {
      setExporting(false);
    }
  };

  const exportCount = exportType === "entretiens" ? preview.entretiens : preview.salaries;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Export de données</h1>
        <p className="text-sm text-gray-400 mt-1">Générez un fichier Excel filtré par période et périmètre.</p>
      </div>

      {/* ── Type d'export ─────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-gray-200 p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Type d'export</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <TypeCard
            icon="👥" title="Salariés"
            desc="Fiche complète de chaque salarié : identité, parcours, formation, mobilité, freins, projet, sortie."
            active={exportType === "salaries"}
            onClick={() => setExportType("salaries")}
          />
          <TypeCard
            icon="📅" title="Entretiens"
            desc="Liste des entretiens réalisés : date, type, salarié concerné, responsable, synthèse, objectifs."
            active={exportType === "entretiens"}
            onClick={() => setExportType("entretiens")}
          />
          <TypeCard
            icon="📊" title="Statistiques"
            desc="Classeur multi-onglets : synthèse globale, répartition par site, types de sortie, prescripteurs, publics prioritaires."
            active={exportType === "stats"}
            onClick={() => setExportType("stats")}
          />
        </div>
      </section>

      {/* ── Plage de dates ────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-gray-200 p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Période</p>

        {/* Raccourcis */}
        <div className="flex flex-wrap gap-2 mb-4">
          {shortcuts.map(s => (
            <button key={s.label}
              onClick={() => { setDateDebut(s.from); setDateFin(s.to); }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                dateDebut === s.from && dateFin === s.to
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "text-gray-600 border-gray-200 hover:border-indigo-300"
              }`}>
              {s.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Du</label>
            <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Au</label>
            <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
        </div>

        {(!dateDebut && !dateFin) && (
          <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2 mt-3">
            ⚠ Aucune période définie — toutes les données seront incluses.
          </p>
        )}
      </section>

      {/* ── Filtres hiérarchiques ──────────────────────────────────────────── */}
      {accessibleSites.length > 1 && (
        <section className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Périmètre organisationnel</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {filialesList.length > 0 && (
              <CheckGroup label="Filiale" options={filialesList} selected={selFiliale}
                onChange={v => { setSelFiliale(v); setSelSecteur([]); setSelActivite([]); setSelSite([]); }} />
            )}
            {secteursList.length > 0 && (
              <CheckGroup label="Secteur" options={secteursList} selected={selSecteur}
                onChange={v => { setSelSecteur(v); setSelActivite([]); setSelSite([]); }} />
            )}
            {activitesList.length > 0 && (
              <CheckGroup label="Activité" options={activitesList} selected={selActivite}
                onChange={v => { setSelActivite(v); setSelSite([]); }} />
            )}
            {sitesList.length > 1 && (
              <CheckGroup label="Site" options={sitesList} selected={selSite} onChange={setSelSite} />
            )}
          </div>
        </section>
      )}

      {/* ── Aperçu ────────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-gray-200 p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Aperçu du périmètre</p>
        <div className="flex flex-wrap gap-3">
          <PreviewBadge
            label={exportType === "entretiens" ? "entretien(s) à exporter" : "salarié(s) à exporter"}
            count={exportCount}
            color={exportCount === 0 ? "orange" : "indigo"}
          />
          {exportType !== "entretiens" && (
            <PreviewBadge label="entretien(s) dans la période" count={preview.entretiens} color="green" />
          )}
        </div>
        {exportCount === 0 && (
          <p className="text-xs text-orange-600 mt-3">
            Aucune donnée ne correspond aux filtres sélectionnés.
          </p>
        )}
      </section>

      {/* ── Bouton export ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleExport}
          disabled={exporting || exportCount === 0}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-semibold px-8 py-3 rounded-xl text-sm transition-colors flex items-center gap-2"
        >
          {exporting ? (
            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Génération…</>
          ) : (
            <>⬇ Exporter en Excel</>
          )}
        </button>

        {lastResult && !lastResult.error && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
            ✓ Fichier généré — {lastResult.count} ligne{lastResult.count > 1 ? "s" : ""} exportée{lastResult.count > 1 ? "s" : ""}
          </p>
        )}
        {lastResult?.error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
            ⚠ Erreur : {lastResult.error}
          </p>
        )}
      </div>
    </div>
  );
}
