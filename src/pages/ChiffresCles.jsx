import { useState, useEffect, useCallback } from "react";
import ExcelJS from "exceljs";
import { getHeuresMensuelles, upsertHeuresMensuelles } from "../lib/api/heures";
import { PRESCRIPTEURS } from "../lib/constants";
import { SiteOptions } from "../components/ui";

// ─── Constantes ────────────────────────────────────────────────────────────────

const MOIS_LABELS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

// Catégories de sortie ASP → Chiffres clés
const CATS = {
  durables:    ["CDI","CDIA","CDISTRUCT","CDD P6","INST","INT FP"],
  transitions: ["CDD M6","CDDA"],
  positives:   ["EMB SIAE","FORMA","ASP","RETRAITE"],
  essais:      ["ESSAI EU","ESSAI SA"],
  autres:      ["CHOMAGE","SANSNOUV","INACTIF"],
  retraits:    ["RUPTURE_FG","CONGELD","DECES","JUSTICE"],
};

const TABS = [
  { id: "synthese", label: "Chiffres clés" },
  { id: "etpi",     label: "ETPI / ETPP"   },
  { id: "formation",label: "Formation"      },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ageAu1er(dateNaissance, annee) {
  if (!dateNaissance) return null;
  const b = new Date(dateNaissance);
  const ref = new Date(annee, 0, 1);
  let age = annee - b.getFullYear();
  if (ref < new Date(annee, b.getMonth(), b.getDate())) age--;
  return age;
}

function isActifDansAnnee(sal, annee) {
  if (sal.isCandidat || !sal.dateEntree) return false;
  const entree = new Date(sal.dateEntree);
  if (entree > new Date(annee, 11, 31)) return false;
  if (sal.dateSortie && new Date(sal.dateSortie) < new Date(annee, 0, 1)) return false;
  return true;
}

function isSortieInAnnee(sal, annee) {
  if (!sal.dateSortie || sal.isCandidat) return false;
  return new Date(sal.dateSortie).getFullYear() === annee;
}

function isInAnnee(dateStr, annee) {
  if (!dateStr) return false;
  return new Date(dateStr).getFullYear() === annee;
}

function moisParcours(sal) {
  if (!sal.dateEntree || !sal.dateSortie) return null;
  return (new Date(sal.dateSortie) - new Date(sal.dateEntree)) / (1000 * 60 * 60 * 24 * 30.44);
}

function pct(n, total) {
  return total ? n / total : 0;
}

function fmt(n, dec = 0) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return Number(n).toFixed(dec);
}

function filterSitesByUser(sites, user) {
  if (user.role === "admin") return sites;
  const ids = user.site_ids ?? (user.site_id ? [user.site_id] : []);
  return ids.length === 0 ? sites : sites.filter(s => ids.includes(s.id));
}

// ─── Mini composant : ligne KPI ──────────────────────────────────────────────

function KpiRow({ label, unite, valeur, ratio, noBorder }) {
  const pctVal = ratio != null ? Math.round(ratio * 100) : null;
  return (
    <tr className={`${noBorder ? "" : "border-b border-gray-50"} hover:bg-gray-50/60`}>
      <td className="py-1.5 px-3 text-xs text-gray-700">{label}</td>
      <td className="py-1.5 px-2 text-xs text-gray-400 text-center w-16">{unite}</td>
      <td className="py-1.5 px-3 text-xs font-semibold text-gray-900 text-right w-24">{valeur}</td>
      <td className="py-1.5 px-3 w-32">
        {pctVal != null && (
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${Math.min(pctVal,100)}%` }} />
            </div>
            <span className="text-xs text-gray-400 w-9 text-right">{pctVal}%</span>
          </div>
        )}
      </td>
    </tr>
  );
}

function SectionHeader({ title }) {
  return (
    <tr>
      <td colSpan={4} className="pt-4 pb-1 px-3">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{title}</span>
      </td>
    </tr>
  );
}

// ─── SiteMultiPicker (filtre hiérarchique) ────────────────────────────────────

function SiteMultiPicker({ sites, value = [], onChange }) {
  const [filiale, setFiliale]   = useState("");
  const [secteur, setSecteur]   = useState("");
  const [activite, setActivite] = useState("");

  const filialesList  = [...new Set(sites.map(s => s.filiale).filter(Boolean))];
  const secteursList  = [...new Set(sites.filter(s => !filiale || s.filiale === filiale).map(s => s.secteur).filter(Boolean))];
  const activitesList = [...new Set(sites.filter(s => (!filiale || s.filiale === filiale) && (!secteur || s.secteur === secteur)).map(s => s.activite).filter(Boolean))];
  const sitesFiltres  = sites.filter(s =>
    (!filiale  || s.filiale  === filiale)  &&
    (!secteur  || s.secteur  === secteur)  &&
    (!activite || s.activite === activite)
  );

  const toggle    = id => onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);
  const toggleAll = () => {
    const ids = sitesFiltres.map(s => s.id);
    const allChecked = ids.every(id => value.includes(id));
    onChange(allChecked ? value.filter(id => !ids.includes(id)) : [...new Set([...value, ...ids])]);
  };
  const Chip = ({ label, active, onClick }) => (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${active ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"}`}
    >{label}</button>
  );
  const selectedSites = sites.filter(s => value.includes(s.id));

  return (
    <div className="space-y-3">
      {selectedSites.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedSites.map(s => (
            <span key={s.id} className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-0.5 rounded-full border border-indigo-200">
              {[s.filiale, s.nom].filter(Boolean).join(" › ")}
              <button type="button" onClick={() => toggle(s.id)} className="ml-0.5 text-indigo-400 hover:text-red-500">×</button>
            </span>
          ))}
          <button type="button" onClick={() => onChange([])} className="text-xs text-red-400 hover:text-red-600 px-1">Tout effacer</button>
        </div>
      )}
      {filialesList.length > 1 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Filiale</p>
          <div className="flex flex-wrap gap-2">
            <Chip label="Toutes" active={!filiale} onClick={() => { setFiliale(""); setSecteur(""); setActivite(""); }} />
            {filialesList.map(f => <Chip key={f} label={f} active={filiale === f} onClick={() => { setFiliale(f); setSecteur(""); setActivite(""); }} />)}
          </div>
        </div>
      )}
      {secteursList.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Secteur</p>
          <div className="flex flex-wrap gap-2">
            <Chip label="Tous" active={!secteur} onClick={() => { setSecteur(""); setActivite(""); }} />
            {secteursList.map(s => <Chip key={s} label={s} active={secteur === s} onClick={() => { setSecteur(s); setActivite(""); }} />)}
          </div>
        </div>
      )}
      {activitesList.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Activité</p>
          <div className="flex flex-wrap gap-2">
            <Chip label="Toutes" active={!activite} onClick={() => setActivite("")} />
            {activitesList.map(a => <Chip key={a} label={a} active={activite === a} onClick={() => setActivite(a)} />)}
          </div>
        </div>
      )}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sites ({sitesFiltres.length})</p>
          {sitesFiltres.length > 1 && (
            <button type="button" onClick={toggleAll} className="text-xs text-indigo-500 hover:text-indigo-700">
              {sitesFiltres.every(s => value.includes(s.id)) ? "Tout décocher" : "Tout cocher"}
            </button>
          )}
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {sitesFiltres.map(s => (
            <label key={s.id} className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" checked={value.includes(s.id)} onChange={() => toggle(s.id)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-xs text-gray-700 group-hover:text-indigo-700">
                {s.nom}{s.ville ? ` — ${s.ville}` : ""}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Onglet ETPI / ETPP ───────────────────────────────────────────────────────

function KpiEtp({ label, heures, color }) {
  const etp = heures / 1820;
  return (
    <div className={`rounded-xl border p-4 text-center ${color === "indigo" ? "bg-indigo-50 border-indigo-200" : "bg-emerald-50 border-emerald-200"}`}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color === "indigo" ? "text-indigo-700" : "text-emerald-700"}`}>{etp.toFixed(2)}</p>
      <p className="text-xs text-gray-400 mt-0.5">{heures.toFixed(0)} h / 1820</p>
    </div>
  );
}

function EtpiTab({ sites, user }) {
  const scopedSites   = filterSitesByUser(sites, user);
  const anneeActuelle = new Date().getFullYear();
  const [annee,   setAnnee]   = useState(anneeActuelle);
  const [mois,    setMois]    = useState(new Date().getMonth() + 1);
  const [rows,    setRows]    = useState([]);
  const [edits,   setEdits]   = useState({});
  const [saving,  setSaving]  = useState({});
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState("");
  const [fFiliale,  setFFiliale]  = useState("");
  const [fSecteur,  setFSecteur]  = useState("");
  const [fActivite, setFActivite] = useState("");
  const [fSite,     setFSite]     = useState("");

  const allActive = scopedSites.filter(s => s.actif !== false);
  const filialesList  = [...new Set(allActive.map(s => s.filiale).filter(Boolean))];
  const secteursList  = [...new Set(allActive.filter(s => !fFiliale || s.filiale === fFiliale).map(s => s.secteur).filter(Boolean))];
  const activitesList = [...new Set(allActive.filter(s => (!fFiliale || s.filiale === fFiliale) && (!fSecteur || s.secteur === fSecteur)).map(s => s.activite).filter(Boolean))];
  const sitesList     = [...new Set(allActive.filter(s => (!fFiliale || s.filiale === fFiliale) && (!fSecteur || s.secteur === fSecteur) && (!fActivite || s.activite === fActivite)).map(s => s.nom).filter(Boolean))];
  const activeSites   = allActive.filter(s =>
    (!fFiliale  || s.filiale  === fFiliale)  &&
    (!fSecteur  || s.secteur  === fSecteur)  &&
    (!fActivite || s.activite === fActivite) &&
    (!fSite     || s.nom      === fSite)
  );

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try { setRows(await getHeuresMensuelles(annee)); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [annee]);
  useEffect(() => { load(); setEdits({}); }, [load]);

  const eKey   = (siteId, m) => `${siteId}_${m}`;
  const getDbRow = (siteId, m) => rows.find(r => r.site_id === siteId && r.mois === m) ?? null;
  const getVal = (siteId, m) => {
    const k = eKey(siteId, m);
    if (edits[k]) return edits[k];
    const r = getDbRow(siteId, m);
    return { nb_salaries_insertion: r?.nb_salaries_insertion ?? 0, heures_insertion: r?.heures_insertion ?? 0, nb_permanents: r?.nb_permanents ?? 0, heures_permanents: r?.heures_permanents ?? 0 };
  };
  const setVal = (siteId, m, field, raw) => {
    const k = eKey(siteId, m);
    setEdits(prev => ({ ...prev, [k]: { ...getVal(siteId, m), [field]: parseFloat(raw) || 0 } }));
  };
  const isDirty  = (siteId, m) => !!edits[eKey(siteId, m)];
  const save = async (siteId, m) => {
    const k = eKey(siteId, m);
    if (!edits[k]) return;
    setSaving(p => ({ ...p, [k]: true })); setErr("");
    try {
      await upsertHeuresMensuelles({ site_id: siteId, annee, mois: m, ...edits[k] });
      await load();
      setEdits(p => { const n = { ...p }; delete n[k]; return n; });
    } catch (e) { setErr(e.message); }
    finally { setSaving(p => ({ ...p, [k]: false })); }
  };

  const filteredSiteIds = new Set(activeSites.map(s => s.id));
  const filteredRows    = rows.filter(r => filteredSiteIds.has(r.site_id));
  const totalHI = filteredRows.reduce((s, r) => s + (r.heures_insertion   || 0), 0);
  const totalHP = filteredRows.reduce((s, r) => s + (r.heures_permanents  || 0), 0);
  const moisRows = activeSites.map(s => getVal(s.id, mois));
  const moisHI   = moisRows.reduce((s, r) => s + (r.heures_insertion   || 0), 0);
  const moisHP   = moisRows.reduce((s, r) => s + (r.heures_permanents  || 0), 0);

  const NumCell = ({ siteId, m, field, placeholder }) => {
    const v = getVal(siteId, m)[field];
    return (
      <input type="number" min="0" step="0.5" value={v || ""} placeholder={placeholder}
        onChange={e => setVal(siteId, m, field, e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-200" />
    );
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Sélecteur année */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 border border-gray-200 rounded-xl overflow-hidden">
          <button onClick={() => setAnnee(a => a - 1)} className="px-3 py-2 text-gray-500 hover:bg-gray-50 text-sm font-bold">◀</button>
          <span className="px-4 py-2 text-sm font-bold text-gray-900">{annee}</span>
          <button onClick={() => setAnnee(a => a + 1)} className="px-3 py-2 text-gray-500 hover:bg-gray-50 text-sm font-bold">▶</button>
        </div>
        <p className="text-xs text-gray-400">ETPI = heures insertion / 1820 · ETPP = heures permanents / 1820</p>
      </div>

      {/* Filtres */}
      {(filialesList.length > 1 || secteursList.length > 0 || activitesList.length > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Filtrer l'affichage</p>
          <div className="flex gap-3 flex-wrap items-end">
            {filialesList.length > 1 && (
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1">Filiale</label>
                <select value={fFiliale} onChange={e => { setFFiliale(e.target.value); setFSecteur(""); setFActivite(""); }}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200">
                  <option value="">Toutes</option>
                  {filialesList.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            )}
            {secteursList.length > 0 && (
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1">Secteur</label>
                <select value={fSecteur} onChange={e => { setFSecteur(e.target.value); setFActivite(""); }}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200">
                  <option value="">Tous</option>
                  {secteursList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            {activitesList.length > 0 && (
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1">Activité</label>
                <select value={fActivite} onChange={e => setFActivite(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200">
                  <option value="">Toutes</option>
                  {activitesList.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            )}
            {sitesList.length > 1 && (
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1">Site</label>
                <select value={fSite} onChange={e => setFSite(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200">
                  <option value="">Tous</option>
                  {sitesList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            {(fFiliale || fSecteur || fActivite || fSite) && (
              <button onClick={() => { setFFiliale(""); setFSecteur(""); setFActivite(""); setFSite(""); }}
                className="text-xs text-gray-400 hover:text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100">
                ✕ Effacer
              </button>
            )}
          </div>
        </div>
      )}

      {/* KPI annuels */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-white border-gray-200 p-4 text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Heures insertion</p>
          <p className="text-2xl font-bold text-gray-800">{totalHI.toFixed(0)} h</p>
          <p className="text-xs text-gray-400 mt-0.5">annuel</p>
        </div>
        <KpiEtp label="ETPI annuel" heures={totalHI} color="indigo" />
        <div className="rounded-xl border bg-white border-gray-200 p-4 text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Heures permanents</p>
          <p className="text-2xl font-bold text-gray-800">{totalHP.toFixed(0)} h</p>
          <p className="text-xs text-gray-400 mt-0.5">annuel</p>
        </div>
        <KpiEtp label="ETPP annuel" heures={totalHP} color="emerald" />
      </div>

      {/* Onglets mois */}
      <div className="flex gap-1 flex-wrap border-b border-gray-200 pb-0">
        {MOIS_LABELS.map((l, i) => {
          const m = i + 1;
          const hasData = activeSites.some(s => filteredSiteIds.has(s.id) && getDbRow(s.id, m));
          return (
            <button key={m} onClick={() => setMois(m)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors relative ${mois === m ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {l}
              {hasData && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-400" />}
            </button>
          );
        })}
      </div>

      {/* Tableau du mois */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">{MOIS_LABELS[mois - 1]} {annee}</p>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>Insertion : <strong className="text-indigo-700">{moisHI.toFixed(0)} h</strong></span>
              <span>Permanents : <strong className="text-emerald-700">{moisHP.toFixed(0)} h</strong></span>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Site</th>
                <th className="text-right p-3 text-xs font-semibold text-indigo-500 uppercase">Nb sal. insertion</th>
                <th className="text-right p-3 text-xs font-semibold text-indigo-500 uppercase">Heures insertion</th>
                <th className="text-right p-3 text-xs font-semibold text-emerald-600 uppercase">Nb permanents</th>
                <th className="text-right p-3 text-xs font-semibold text-emerald-600 uppercase">Heures perm.</th>
                <th className="p-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {activeSites.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-300 text-sm">Aucun site actif</td></tr>
              )}
              {activeSites.map(site => {
                const k = eKey(site.id, mois);
                return (
                  <tr key={site.id} className={`border-b border-gray-50 ${isDirty(site.id, mois) ? "bg-amber-50" : ""}`}>
                    <td className="p-3">
                      <p className="font-medium text-gray-800 text-xs">{site.nom}</p>
                      {site.filiale && <p className="text-gray-400 text-xs">{site.filiale}</p>}
                    </td>
                    <td className="p-2"><NumCell siteId={site.id} m={mois} field="nb_salaries_insertion" placeholder="0" /></td>
                    <td className="p-2"><NumCell siteId={site.id} m={mois} field="heures_insertion" placeholder="0.0" /></td>
                    <td className="p-2"><NumCell siteId={site.id} m={mois} field="nb_permanents" placeholder="0" /></td>
                    <td className="p-2"><NumCell siteId={site.id} m={mois} field="heures_permanents" placeholder="0.0" /></td>
                    <td className="p-2 text-right">
                      <button onClick={() => save(site.id, mois)} disabled={!isDirty(site.id, mois) || saving[k]}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white disabled:opacity-30 hover:bg-indigo-700 transition-colors">
                        {saving[k] ? "…" : "Enreg."}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {err && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}
    </div>
  );
}

// ─── Onglet Formation ─────────────────────────────────────────────────────────

function FormationTab({ sites, user }) {
  const scopedSites   = filterSitesByUser(sites, user);
  const anneeActuelle = new Date().getFullYear();
  const [annee,   setAnnee]   = useState(anneeActuelle);
  const [mois,    setMois]    = useState(new Date().getMonth() + 1);
  const [rows,    setRows]    = useState([]);
  const [edits,   setEdits]   = useState({});
  const [saving,  setSaving]  = useState({});
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState("");

  const allActive = scopedSites.filter(s => s.actif !== false);

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try { setRows(await getHeuresMensuelles(annee)); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [annee]);
  useEffect(() => { load(); setEdits({}); }, [load]);

  const eKey   = (siteId, m) => `${siteId}_${m}`;
  const getDbRow = (siteId, m) => rows.find(r => r.site_id === siteId && r.mois === m) ?? null;
  const getVal = (siteId, m) => {
    const k = eKey(siteId, m);
    if (edits[k]) return edits[k];
    const r = getDbRow(siteId, m);
    return {
      nb_insertion_formes:        r?.nb_insertion_formes        ?? 0,
      heures_formation_insertion: r?.heures_formation_insertion ?? 0,
      nb_permanents_formes:       r?.nb_permanents_formes       ?? 0,
      heures_formation_permanents:r?.heures_formation_permanents?? 0,
      budget_formation:           r?.budget_formation           ?? 0,
    };
  };
  const setVal = (siteId, m, field, raw) => {
    const k = eKey(siteId, m);
    setEdits(prev => ({ ...prev, [k]: { ...getVal(siteId, m), [field]: parseFloat(raw) || 0 } }));
  };
  const isDirty = (siteId, m) => !!edits[eKey(siteId, m)];
  const save = async (siteId, m) => {
    const k = eKey(siteId, m);
    if (!edits[k]) return;
    setSaving(p => ({ ...p, [k]: true })); setErr("");
    try {
      // On merge avec les données ETPI existantes pour ne pas les écraser
      const existing = getDbRow(siteId, m) ?? {};
      await upsertHeuresMensuelles({ site_id: siteId, annee, mois: m, ...existing, ...edits[k] });
      await load();
      setEdits(p => { const n = { ...p }; delete n[k]; return n; });
    } catch (e) { setErr(e.message); }
    finally { setSaving(p => ({ ...p, [k]: false })); }
  };

  const allSiteIds   = new Set(allActive.map(s => s.id));
  const filteredRows = rows.filter(r => allSiteIds.has(r.site_id));
  const totals = {
    insFormes:  filteredRows.reduce((s, r) => s + (r.nb_insertion_formes         || 0), 0),
    hFormIns:   filteredRows.reduce((s, r) => s + (r.heures_formation_insertion  || 0), 0),
    permFormes: filteredRows.reduce((s, r) => s + (r.nb_permanents_formes        || 0), 0),
    hFormPerm:  filteredRows.reduce((s, r) => s + (r.heures_formation_permanents || 0), 0),
    budget:     filteredRows.reduce((s, r) => s + (r.budget_formation            || 0), 0),
  };

  const NumCell = ({ siteId, m, field, placeholder }) => {
    const v = getVal(siteId, m)[field];
    return (
      <input type="number" min="0" step="0.5" value={v || ""} placeholder={placeholder}
        onChange={e => setVal(siteId, m, field, e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-200" />
    );
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Sélecteur année */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 border border-gray-200 rounded-xl overflow-hidden">
          <button onClick={() => setAnnee(a => a - 1)} className="px-3 py-2 text-gray-500 hover:bg-gray-50 text-sm font-bold">◀</button>
          <span className="px-4 py-2 text-sm font-bold text-gray-900">{annee}</span>
          <button onClick={() => setAnnee(a => a + 1)} className="px-3 py-2 text-gray-500 hover:bg-gray-50 text-sm font-bold">▶</button>
        </div>
        <p className="text-xs text-gray-400">Saisie mensuelle des données de formation par site.</p>
      </div>

      {/* KPI annuels */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { l: "Sal. insertion formés", v: totals.insFormes,  unit: "NB", color: "indigo" },
          { l: "Heures formation ins.", v: totals.hFormIns.toFixed(0),   unit: "h",  color: "indigo" },
          { l: "Permanents formés",     v: totals.permFormes, unit: "NB", color: "emerald" },
          { l: "Heures form. perm.",    v: totals.hFormPerm.toFixed(0),  unit: "h",  color: "emerald" },
          { l: "Budget formation",      v: totals.budget.toLocaleString("fr-FR"), unit: "€", color: "gray" },
        ].map(({ l, v, unit, color }) => (
          <div key={l} className={`rounded-xl border p-4 text-center ${color === "indigo" ? "bg-indigo-50 border-indigo-200" : color === "emerald" ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"}`}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{l}</p>
            <p className={`text-2xl font-bold ${color === "indigo" ? "text-indigo-700" : color === "emerald" ? "text-emerald-700" : "text-gray-700"}`}>{v}</p>
            <p className="text-xs text-gray-400 mt-0.5">annuel · {unit}</p>
          </div>
        ))}
      </div>

      {/* Onglets mois */}
      <div className="flex gap-1 flex-wrap border-b border-gray-200 pb-0">
        {MOIS_LABELS.map((l, i) => {
          const m = i + 1;
          return (
            <button key={m} onClick={() => setMois(m)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${mois === m ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {l}
            </button>
          );
        })}
      </div>

      {/* Tableau du mois */}
      {loading ? (
        <div className="flex justify-center py-10"><div className="w-6 h-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">{MOIS_LABELS[mois - 1]} {annee}</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Site</th>
                <th className="text-right p-3 text-xs font-semibold text-indigo-500 uppercase">Sal. insertion formés</th>
                <th className="text-right p-3 text-xs font-semibold text-indigo-500 uppercase">Heures form. insertion</th>
                <th className="text-right p-3 text-xs font-semibold text-emerald-600 uppercase">Permanents formés</th>
                <th className="text-right p-3 text-xs font-semibold text-emerald-600 uppercase">Heures form. perm.</th>
                <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase">Budget (€)</th>
                <th className="p-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {allActive.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-300 text-sm">Aucun site actif</td></tr>}
              {allActive.map(site => {
                const k = eKey(site.id, mois);
                return (
                  <tr key={site.id} className={`border-b border-gray-50 ${isDirty(site.id, mois) ? "bg-amber-50" : ""}`}>
                    <td className="p-3">
                      <p className="font-medium text-gray-800 text-xs">{site.nom}</p>
                      {site.filiale && <p className="text-gray-400 text-xs">{site.filiale}</p>}
                    </td>
                    <td className="p-2"><NumCell siteId={site.id} m={mois} field="nb_insertion_formes" placeholder="0" /></td>
                    <td className="p-2"><NumCell siteId={site.id} m={mois} field="heures_formation_insertion" placeholder="0.0" /></td>
                    <td className="p-2"><NumCell siteId={site.id} m={mois} field="nb_permanents_formes" placeholder="0" /></td>
                    <td className="p-2"><NumCell siteId={site.id} m={mois} field="heures_formation_permanents" placeholder="0.0" /></td>
                    <td className="p-2"><NumCell siteId={site.id} m={mois} field="budget_formation" placeholder="0" /></td>
                    <td className="p-2 text-right">
                      <button onClick={() => save(site.id, mois)} disabled={!isDirty(site.id, mois) || saving[k]}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white disabled:opacity-30 hover:bg-indigo-700 transition-colors">
                        {saving[k] ? "…" : "Enreg."}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {err && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}
    </div>
  );
}

// ─── Export Excel (format BASE DE DONNÉES) ────────────────────────────────────

async function exportToExcel({ annee, nomStructure, kpis }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ID'EES Suivi Parcours";
  wb.created = new Date();

  const ws = wb.addWorksheet("BASE DE DONNÉES");
  ws.getColumn("A").width = 56;
  ws.getColumn("B").width = 10;
  ws.getColumn("C").width = 18;

  // Styles
  const sectionFill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FF374151" } };
  const headerFill   = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
  const sectionFont  = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
  const boldFont     = { bold: true, size: 10 };
  const normalFont   = { size: 10 };
  const centerAlign  = { horizontal: "center" };
  const rightAlign   = { horizontal: "right" };
  const thinBorder   = { style: "thin", color: { argb: "FFD1D5DB" } };
  const cellBorder   = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };

  let r = 1;

  const addTitle = (title) => {
    const row = ws.getRow(r);
    row.height = 22;
    const cell = row.getCell("A");
    cell.value = title;
    cell.font = { bold: true, size: 14, color: { argb: "FF1E3A5F" } };
    ws.mergeCells(`A${r}:C${r}`);
    r++;
  };

  const addInfo = (label, value) => {
    const row = ws.getRow(r);
    row.getCell("A").value = label;
    row.getCell("A").font  = boldFont;
    row.getCell("B").value = value;
    row.getCell("B").font  = normalFont;
    ws.mergeCells(`B${r}:C${r}`);
    r++;
  };

  const addSection = (title) => {
    r++; // ligne vide avant
    const row = ws.getRow(r);
    row.height = 16;
    ["A","B","C"].forEach(col => {
      const cell = row.getCell(col);
      cell.fill   = sectionFill;
      cell.font   = sectionFont;
      cell.border = cellBorder;
    });
    row.getCell("A").value = title;
    ws.mergeCells(`A${r}:C${r}`);
    r++;
  };

  const addRow = (label, unite, valeur, isPercent = false) => {
    const row = ws.getRow(r);
    row.height = 15;
    const cA = row.getCell("A");
    const cB = row.getCell("B");
    const cC = row.getCell("C");
    cA.value  = label;
    cA.font   = normalFont;
    cB.value  = unite;
    cB.font   = { ...normalFont, color: { argb: "FF6B7280" } };
    cB.alignment = centerAlign;
    if (isPercent && typeof valeur === "number") {
      cC.value    = valeur;
      cC.numFmt   = "0.00%";
    } else {
      cC.value    = valeur;
      cC.numFmt   = typeof valeur === "number" ? "#,##0.00" : "@";
    }
    cC.alignment = rightAlign;
    cC.font = normalFont;
    ["A","B","C"].forEach(col => { row.getCell(col).border = cellBorder; });
    r++;
  };

  // ── Contenu ──────────────────────────────────────────────────────────────────
  addTitle(`CHIFFRES CLÉS ${annee}`);
  r++;
  addInfo("NOM STRUCTURE", nomStructure);
  addInfo("ANNÉE",         String(annee));

  // SALARIÉS INSERTION
  addSection("SALARIÉS INSERTION");
  addRow("HOMMES", "NB", kpis.hommesN);
  addRow("HOMMES", "%",  pct(kpis.hommesN, kpis.totalActifs), true);
  addRow("FEMMES", "NB", kpis.femmesN);
  addRow("FEMMES", "%",  pct(kpis.femmesN, kpis.totalActifs), true);
  addRow("TOTAL H/F",                    "NB",   kpis.totalActifs);
  addRow("HEURES TRAVAILLÉES HOMMES",    "HR",   kpis.heuresH);
  addRow("HEURES TRAVAILLÉES FEMMES",    "HR",   kpis.heuresF);
  addRow("TOTAL H/F - HEURES TRAVAILLÉES","HR",  kpis.heuresTotal);
  addRow("HOMMES - ETPI",                "ETPI", kpis.heuresH / 1820);
  addRow("FEMMES - ETPI",                "ETPI", kpis.heuresF / 1820);
  addRow("TOTAL H/F - ETPI",             "ETPI", kpis.heuresTotal / 1820);

  // ÂGE
  addSection("ÂGE");
  addRow("Jusqu'à 25 ans",  "NB", kpis.ag25);
  addRow("Jusqu'à 25 ans",  "%",  pct(kpis.ag25, kpis.totalActifs), true);
  addRow("26 à 45 ans",     "NB", kpis.ag26_45);
  addRow("26 à 45 ans",     "%",  pct(kpis.ag26_45, kpis.totalActifs), true);
  addRow("46 à 50 ans",     "NB", kpis.ag46_50);
  addRow("46 à 50 ans",     "%",  pct(kpis.ag46_50, kpis.totalActifs), true);
  addRow("50 ans et +",     "NB", kpis.ag51);
  addRow("50 ans et +",     "%",  pct(kpis.ag51, kpis.totalActifs), true);

  // FORMATION (niveau)
  addSection("FORMATION (niveau d'études)");
  addRow("Niveau 8 à 5 (Bac+2 et au-delà)", "NB", kpis.niv5_8);
  addRow("Niveau 8 à 5 (Bac+2 et au-delà)", "%",  pct(kpis.niv5_8, kpis.totalActifs), true);
  addRow("Niveau 4 (Bac ou Bac pro)",        "NB", kpis.niv4);
  addRow("Niveau 4 (Bac ou Bac pro)",        "%",  pct(kpis.niv4, kpis.totalActifs), true);
  addRow("Niveau 3 (CAP/BEP et moins)",      "NB", kpis.niv3);
  addRow("Niveau 3 (CAP/BEP et moins)",      "%",  pct(kpis.niv3, kpis.totalActifs), true);

  // PRESCRIPTEURS
  addSection("PRESCRIPTEURS");
  PRESCRIPTEURS.forEach(p => {
    const n = kpis.prescrCount[p] ?? 0;
    addRow(p, "NB", n);
    addRow(p, "%",  pct(n, kpis.totalActifs), true);
  });

  // ACCUEILS / RECRUTEMENTS
  addSection("ACCUEILS, RECRUTEMENTS");
  addRow("SI ACCUEILLIS (candidats reçus)", "NB", kpis.siAccueillis);
  addRow("SI INSCRITS (contrats signés)",   "NB", kpis.siInscrits);

  // PUBLICS PRIORITAIRES
  addSection("PUBLICS PRIORITAIRES");
  const pp = [
    ["DELD - Demandeur d'Emploi Longue Durée", kpis.deldN],
    ["BRSA - Bénéficiaire du RSA",              kpis.brsaN],
    ["TH - Travailleur Handicapé",              kpis.thN],
    ["ASS - Allocation Solidarité Spécifique",  kpis.assN],
    ["SANS RESSOURCES",                         kpis.sansRessN],
    ["RÉSIDENT QPV",                            kpis.qpvN],
  ];
  pp.forEach(([label, n]) => {
    addRow(label, "NB", n);
    addRow(label, "%",  pct(n, kpis.totalActifs), true);
  });

  // SORTIES + 3 MOIS
  addSection("SORTIES + DE 3 MOIS");
  addRow("DYNAMIQUES (Emploi + Formation)", "NB", kpis.dynamiques);
  addRow("DYNAMIQUES",                      "%",  pct(kpis.dynamiques, kpis.totalSortiesPlus3), true);
  addRow("DURABLES",                         "NB", kpis.durables);
  addRow("DURABLES",                         "%",  pct(kpis.durables, kpis.totalSortiesPlus3), true);
  addRow("TRANSITIONS",                      "NB", kpis.transitions);
  addRow("TRANSITIONS",                      "%",  pct(kpis.transitions, kpis.totalSortiesPlus3), true);
  addRow("POSITIVES (Formation, SIAE…)",     "NB", kpis.positives);
  addRow("POSITIVES",                        "%",  pct(kpis.positives, kpis.totalSortiesPlus3), true);
  addRow("ESSAI (SA + EU)",                  "NB", kpis.essais);
  addRow("ESSAI (SA + EU)",                  "%",  pct(kpis.essais, kpis.totalSortiesPlus3), true);
  addRow("Total sorties de + 3 mois",        "NB", kpis.totalSortiesPlus3);
  addRow("RETRAITS (congé LD, rupture FG, décès, justice)", "NB", kpis.retraits);
  addRow("SORTIES - DE 3 MOIS",              "NB", kpis.sortiesMoins3);
  addRow("TOTAL SORTIES",                    "NB", kpis.totalSorties);

  // AUTRES DONNÉES DE PARCOURS
  addSection("AUTRES DONNÉES DE PARCOURS");
  addRow("Temps annuel moyen travaillé en heures (Insertion)", "HR",   kpis.heuresMoyennes);
  addRow("Temps moyen de parcours (en mois)",                  "MOIS", kpis.moisMoyen);

  // SALARIÉS PERMANENTS
  addSection("SALARIÉS PERMANENTS");
  addRow("Nb permanents (pointe annuelle)", "NB",   kpis.nbPermanents);
  addRow("Total heures permanents",         "HR",   kpis.totalHP);
  addRow("ETPP (1820 H)",                   "ETPP", kpis.totalHP / 1820);

  // TOTAL
  addSection("TOTAL SALARIÉS");
  addRow("TOTAL ETPI + ETPP", "ETPI+ETPP", (kpis.heuresTotal / 1820) + (kpis.totalHP / 1820));
  addRow("TOTAL SALARIÉS",    "NB",        kpis.totalActifs + kpis.nbPermanents);

  // FORMATION (saisie)
  addSection("FORMATION");
  addRow("Salariés insertion formés",        "NB", kpis.insFormes);
  addRow("Nombre d'heures de formation insertion", "HR", kpis.hFormIns);
  addRow("Salariés permanents formés",       "NB", kpis.permFormes);
  addRow("Nombre d'heures de formation permanents", "HR", kpis.hFormPerm);
  addRow("Budget formation",                 "€",  kpis.budgetFormation);

  // ── Export ───────────────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement("a");
  a.href       = url;
  a.download   = `Chiffres_Cles_${annee}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Onglet Synthèse ──────────────────────────────────────────────────────────

function SyntheseTab({ salaries, sites, user }) {
  const anneeActuelle = new Date().getFullYear();
  const [annee,     setAnnee]     = useState(anneeActuelle);
  const [fSiteId,   setFSiteId]   = useState("all");
  const [heuresMens,setHeuresMens]= useState([]);
  const [exporting, setExporting] = useState(false);

  const userSites = filterSitesByUser(sites, user);

  useEffect(() => {
    getHeuresMensuelles(annee).then(setHeuresMens).catch(() => {});
  }, [annee]);

  // Scope sites
  const displaySites  = fSiteId === "all" ? userSites : userSites.filter(s => s.id === fSiteId);
  const displaySiteIds= new Set(displaySites.map(s => s.id));

  // Salariés dans le scope
  const salScope = salaries.filter(sal => displaySiteIds.has(sal.site_id));

  // ── Salariés insertion actifs dans l'année ──────────────────────────────────
  const actifs     = salScope.filter(sal => isActifDansAnnee(sal, annee));
  const totalActifs = actifs.length;
  const hommesN    = actifs.filter(s => s.sexe === "M").length;
  const femmesN    = actifs.filter(s => s.sexe === "F").length;
  const heuresH    = actifs.filter(s => s.sexe === "M").reduce((s, x) => s + (x.heuresTravaillees || 0), 0);
  const heuresF    = actifs.filter(s => s.sexe === "F").reduce((s, x) => s + (x.heuresTravaillees || 0), 0);
  const heuresTotal= heuresH + heuresF;

  // ── Âge au 01/01 de l'année ────────────────────────────────────────────────
  const ages   = actifs.map(s => ageAu1er(s.dateNaissance, annee)).filter(a => a !== null);
  const ag25   = ages.filter(a => a <= 25).length;
  const ag26_45= ages.filter(a => a >= 26 && a <= 45).length;
  const ag46_50= ages.filter(a => a >= 46 && a <= 50).length;
  const ag51   = ages.filter(a => a > 50).length;

  // ── Niveaux de formation ────────────────────────────────────────────────────
  const niv5_8 = actifs.filter(s => s.niveauFormation?.startsWith("Niveau 5")).length;
  const niv4   = actifs.filter(s => s.niveauFormation?.startsWith("Niveau 4")).length;
  const niv3   = actifs.filter(s => s.niveauFormation?.startsWith("Niveau 3")).length;

  // ── Prescripteurs ───────────────────────────────────────────────────────────
  const prescrCount = {};
  PRESCRIPTEURS.forEach(p => { prescrCount[p] = actifs.filter(s => s.prescripteur === p).length; });

  // ── Accueils / Recrutements ─────────────────────────────────────────────────
  const siInscrits   = salScope.filter(sal => !sal.isCandidat && isInAnnee(sal.dateEntree, annee)).length;
  const siAccueillis = salScope.filter(sal =>
    sal.isCandidat && (isInAnnee(sal.candidatureRecueLe, annee) || isInAnnee(sal.vuEntretienLe, annee))
  ).length + siInscrits;

  // ── Publics prioritaires ────────────────────────────────────────────────────
  const deldN     = actifs.filter(s => s.deld).length;
  const brsaN     = actifs.filter(s => s.brsa).length;
  const thN       = actifs.filter(s => s.th).length;

  const assN      = actifs.filter(s => s.ass).length;
  const sansRessN = actifs.filter(s => s.sansRessources).length;
  const qpvN      = actifs.filter(s => s.residentQPV).length;

  // ── Sorties ─────────────────────────────────────────────────────────────────
  const sortiesAnnee     = salScope.filter(sal => isSortieInAnnee(sal, annee));
  const totalSorties     = sortiesAnnee.length;
  const retraitsListe    = sortiesAnnee.filter(sal => CATS.retraits.includes(sal.typeSortie));
  const horsRetrait      = sortiesAnnee.filter(sal => !CATS.retraits.includes(sal.typeSortie));
  const avecDuree        = horsRetrait.map(sal => ({ ...sal, mois: moisParcours(sal) }));
  const sortiesPlus3Liste= avecDuree.filter(s => s.mois !== null && s.mois >= 3);
  const sortiesMoins3    = avecDuree.filter(s => s.mois !== null && s.mois < 3).length;
  const totalSortiesPlus3= sortiesPlus3Liste.length;
  const retraits         = retraitsListe.length;
  const durables         = sortiesPlus3Liste.filter(s => CATS.durables.includes(s.typeSortie)).length;
  const transitions      = sortiesPlus3Liste.filter(s => CATS.transitions.includes(s.typeSortie)).length;
  const positives        = sortiesPlus3Liste.filter(s => CATS.positives.includes(s.typeSortie)).length;
  const essais           = sortiesPlus3Liste.filter(s => CATS.essais.includes(s.typeSortie)).length;
  const dynamiques       = durables + transitions + positives;

  // ── Autres données de parcours ──────────────────────────────────────────────
  const heuresMoyennes = totalActifs > 0 ? heuresTotal / totalActifs : 0;
  const moisParcoursList= actifs.map(moisParcours).filter(m => m !== null);
  const moisMoyen = moisParcoursList.length > 0
    ? moisParcoursList.reduce((a, b) => a + b, 0) / moisParcoursList.length : 0;

  // ── Heures mensuelles (ETPP + Formation) ────────────────────────────────────
  const hScopeRows  = heuresMens.filter(r => displaySiteIds.has(r.site_id));
  const totalHP     = hScopeRows.reduce((s, r) => s + (r.heures_permanents              || 0), 0);
  const nbPermanents= hScopeRows.reduce((acc, r) => Math.max(acc, r.nb_permanents || 0), 0);
  const insFormes   = hScopeRows.reduce((s, r) => s + (r.nb_insertion_formes             || 0), 0);
  const hFormIns    = hScopeRows.reduce((s, r) => s + (r.heures_formation_insertion      || 0), 0);
  const permFormes  = hScopeRows.reduce((s, r) => s + (r.nb_permanents_formes            || 0), 0);
  const hFormPerm   = hScopeRows.reduce((s, r) => s + (r.heures_formation_permanents     || 0), 0);
  const budgetFormation = hScopeRows.reduce((s, r) => s + (r.budget_formation            || 0), 0);

  const kpis = {
    hommesN, femmesN, totalActifs, heuresH, heuresF, heuresTotal,
    ag25, ag26_45, ag46_50, ag51,
    niv5_8, niv4, niv3,
    prescrCount,
    siAccueillis, siInscrits,
    deldN, brsaN, thN, assN, sansRessN, qpvN,
    dynamiques, durables, transitions, positives, essais,
    totalSortiesPlus3, retraits, sortiesMoins3, totalSorties,
    heuresMoyennes, moisMoyen,
    nbPermanents, totalHP,
    insFormes, hFormIns, permFormes, hFormPerm, budgetFormation,
  };

  const nomStructure = displaySites.length === 1 ? displaySites[0].nom : "ID'EES — Toutes filiales";

  const handleExport = async () => {
    setExporting(true);
    try { await exportToExcel({ annee, nomStructure, kpis }); }
    catch (e) { alert("Erreur export : " + e.message); }
    finally { setExporting(false); }
  };

  // ── Rendu ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-4xl">

      {/* Barre de contrôles */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Année */}
        <div className="flex items-center gap-1 border border-gray-200 rounded-xl overflow-hidden">
          <button onClick={() => setAnnee(a => a - 1)} className="px-3 py-2 text-gray-500 hover:bg-gray-50 text-sm font-bold">◀</button>
          <span className="px-4 py-2 text-sm font-bold text-gray-900">{annee}</span>
          <button onClick={() => setAnnee(a => a + 1)} className="px-3 py-2 text-gray-500 hover:bg-gray-50 text-sm font-bold">▶</button>
        </div>
        {/* Filtre site */}
        {userSites.length > 1 && (
          <select value={fSiteId} onChange={e => setFSiteId(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200">
            <option value="all">Tous les sites</option>
            <SiteOptions sites={userSites} />
          </select>
        )}
        {/* Export */}
        <button onClick={handleExport} disabled={exporting}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L10 11.586V3a1 1 0 112 0v8.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
          </svg>
          {exporting ? "Export…" : "Exporter Excel"}
        </button>
      </div>

      {/* Table principale */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Indicateur</th>
              <th className="text-center p-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-16">Unité</th>
              <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Valeur</th>
              <th className="p-3 w-36 text-xs font-semibold text-gray-400 uppercase tracking-wide">%</th>
            </tr>
          </thead>
          <tbody>

            {/* SALARIÉS INSERTION */}
            <SectionHeader title="Salariés insertion" />
            <KpiRow label="Hommes"          unite="NB"   valeur={hommesN}            ratio={pct(hommesN, totalActifs)} />
            <KpiRow label="Femmes"          unite="NB"   valeur={femmesN}            ratio={pct(femmesN, totalActifs)} />
            <KpiRow label="Total H/F"       unite="NB"   valeur={totalActifs} />
            <KpiRow label="Heures travaillées — Hommes" unite="h" valeur={heuresH.toFixed(0)} />
            <KpiRow label="Heures travaillées — Femmes" unite="h" valeur={heuresF.toFixed(0)} />
            <KpiRow label="Total heures travaillées"    unite="h" valeur={heuresTotal.toFixed(0)} />
            <KpiRow label="ETPI Hommes"     unite="ETPI" valeur={fmt(heuresH / 1820, 2)} />
            <KpiRow label="ETPI Femmes"     unite="ETPI" valeur={fmt(heuresF / 1820, 2)} />
            <KpiRow label="ETPI Total"      unite="ETPI" valeur={fmt(heuresTotal / 1820, 2)} />

            {/* ÂGE */}
            <SectionHeader title="Âge (au 1er janvier)" />
            <KpiRow label="≤ 25 ans"    unite="NB" valeur={ag25}    ratio={pct(ag25,    totalActifs)} />
            <KpiRow label="26 — 45 ans" unite="NB" valeur={ag26_45} ratio={pct(ag26_45, totalActifs)} />
            <KpiRow label="46 — 50 ans" unite="NB" valeur={ag46_50} ratio={pct(ag46_50, totalActifs)} />
            <KpiRow label="50 ans et +" unite="NB" valeur={ag51}    ratio={pct(ag51,    totalActifs)} />

            {/* NIVEAU DE FORMATION */}
            <SectionHeader title="Niveau de formation" />
            <KpiRow label="Niveau 8 à 5 (Bac+2 et +)" unite="NB" valeur={niv5_8} ratio={pct(niv5_8, totalActifs)} />
            <KpiRow label="Niveau 4 (Bac ou Bac pro)"  unite="NB" valeur={niv4}   ratio={pct(niv4,   totalActifs)} />
            <KpiRow label="Niveau 3 (CAP/BEP et moins)"unite="NB" valeur={niv3}   ratio={pct(niv3,   totalActifs)} />

            {/* PRESCRIPTEURS */}
            <SectionHeader title="Prescripteurs" />
            {PRESCRIPTEURS.map(p => (
              <KpiRow key={p} label={p} unite="NB" valeur={prescrCount[p] ?? 0} ratio={pct(prescrCount[p] ?? 0, totalActifs)} />
            ))}

            {/* ACCUEILS */}
            <SectionHeader title="Accueils / Recrutements" />
            <KpiRow label="SI Accueillis (candidats reçus)" unite="NB" valeur={siAccueillis} />
            <KpiRow label="SI Inscrits (contrats signés)"   unite="NB" valeur={siInscrits} />

            {/* PUBLICS PRIORITAIRES */}
            <SectionHeader title="Publics prioritaires" />
            <KpiRow label="DELD — Demandeur d'Emploi Longue Durée" unite="NB" valeur={deldN}     ratio={pct(deldN,     totalActifs)} />
            <KpiRow label="BRSA — Bénéficiaire du RSA"             unite="NB" valeur={brsaN}     ratio={pct(brsaN,     totalActifs)} />
            <KpiRow label="TH — Travailleur Handicapé"             unite="NB" valeur={thN}       ratio={pct(thN,       totalActifs)} />
            <KpiRow label="ASS — Allocation Solidarité Spécifique" unite="NB" valeur={assN}      ratio={pct(assN,      totalActifs)} />
            <KpiRow label="Sans ressources"                        unite="NB" valeur={sansRessN} ratio={pct(sansRessN, totalActifs)} />
            <KpiRow label="Résident QPV"                           unite="NB" valeur={qpvN}      ratio={pct(qpvN,      totalActifs)} />

            {/* SORTIES +3 MOIS */}
            <SectionHeader title="Sorties + de 3 mois" />
            <KpiRow label="Dynamiques (Emploi + Formation)" unite="NB" valeur={dynamiques}       ratio={pct(dynamiques,    totalSortiesPlus3)} />
            <KpiRow label="Durables"                        unite="NB" valeur={durables}         ratio={pct(durables,      totalSortiesPlus3)} />
            <KpiRow label="Transitions"                     unite="NB" valeur={transitions}      ratio={pct(transitions,   totalSortiesPlus3)} />
            <KpiRow label="Positives (Formation, SIAE…)"   unite="NB" valeur={positives}        ratio={pct(positives,     totalSortiesPlus3)} />
            <KpiRow label="Essai (SA + EU)"                 unite="NB" valeur={essais}           ratio={pct(essais,        totalSortiesPlus3)} />
            <KpiRow label="Total sorties + 3 mois"          unite="NB" valeur={totalSortiesPlus3} />
            <KpiRow label="Retraits (congé LD, rupture FG, décès, justice)" unite="NB" valeur={retraits} />
            <KpiRow label="Sorties — de 3 mois"             unite="NB" valeur={sortiesMoins3} />
            <KpiRow label="Total sorties"                   unite="NB" valeur={totalSorties} />

            {/* AUTRES DONNÉES DE PARCOURS */}
            <SectionHeader title="Autres données de parcours" />
            <KpiRow label="Temps annuel moyen travaillé (Insertion)" unite="h"    valeur={fmt(heuresMoyennes, 1)} />
            <KpiRow label="Temps moyen de parcours"                  unite="mois" valeur={fmt(moisMoyen, 1)} />

            {/* SALARIÉS PERMANENTS */}
            <SectionHeader title="Salariés permanents" />
            <KpiRow label="Nb permanents (pointe annuelle)" unite="NB"   valeur={nbPermanents} />
            <KpiRow label="Total heures permanents"         unite="h"    valeur={fmt(totalHP, 0)} />
            <KpiRow label="ETPP (1820 H)"                  unite="ETPP" valeur={fmt(totalHP / 1820, 2)} />

            {/* TOTAL */}
            <SectionHeader title="Total salariés" />
            <KpiRow label="Total ETPI + ETPP"  unite="ETPI+ETPP" valeur={fmt((heuresTotal / 1820) + (totalHP / 1820), 2)} />
            <KpiRow label="Total salariés (insertion + permanents)" unite="NB" valeur={totalActifs + nbPermanents} />

            {/* FORMATION */}
            <SectionHeader title="Formation" />
            <KpiRow label="Salariés insertion formés"        unite="NB" valeur={insFormes} ratio={insFormes ? pct(insFormes, totalActifs) : null} />
            <KpiRow label="Heures de formation — Insertion"  unite="h"  valeur={fmt(hFormIns, 0)} />
            <KpiRow label="Salariés permanents formés"       unite="NB" valeur={permFormes} />
            <KpiRow label="Heures de formation — Permanents" unite="h"  valeur={fmt(hFormPerm, 0)} />
            <KpiRow label="Budget formation"                 unite="€"  valeur={budgetFormation ? budgetFormation.toLocaleString("fr-FR") + " €" : "—"} noBorder />
          </tbody>
        </table>
      </div>

      {totalActifs === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 text-center">
          Aucun salarié actif trouvé pour {annee} dans ce périmètre.
        </div>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ChiffresCles({ user, salaries, sites }) {
  const [tab, setTab] = useState("synthese");

  if (user.role !== "admin" && user.role !== "direction") {
    return <div className="p-8 text-red-600 text-sm">Accès refusé.</div>;
  }

  return (
    <div className="p-8 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Chiffres clés</h1>
        <p className="text-sm text-gray-400 mt-1">
          Synthèse annuelle calculée automatiquement · Saisie ETPI/ETPP et Formation
        </p>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "synthese"  && <SyntheseTab  salaries={salaries} sites={sites} user={user} />}
      {tab === "etpi"      && <EtpiTab      sites={sites} user={user} />}
      {tab === "formation" && <FormationTab sites={sites} user={user} />}
    </div>
  );
}
