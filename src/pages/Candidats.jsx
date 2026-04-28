import { useState } from "react";
import { fmt, getScopeIds } from "../lib/utils";

// ─── Badges impression / orientation ─────────────────────────────────────────
const IMP_STYLE = {
  tres_bien: "bg-green-100 text-green-800 border-green-200",
  bien:      "bg-blue-100  text-blue-800  border-blue-200",
  doute:     "bg-orange-100 text-orange-800 border-orange-200",
  decliner:  "bg-red-100   text-red-800   border-red-200",
};
const IMP_LABEL = {
  tres_bien: "Très bien",
  bien:      "Bien",
  doute:     "Doute",
  decliner:  "À décliner",
};
const ORI_STYLE = {
  recrute:  "bg-green-100  text-green-800  border-green-200",
  vivier:   "bg-blue-100   text-blue-800   border-blue-200",
  interim:  "bg-purple-100 text-purple-800 border-purple-200",
  decliner: "bg-red-100    text-red-800    border-red-200",
};
const ORI_LABEL = {
  recrute:  "Recruté",
  vivier:   "Vivier",
  interim:  "Intérim ?",
  decliner: "Décliner",
};

function Badge({ map, labelMap, value }) {
  if (!value) return <span className="text-gray-300 text-xs">—</span>;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${map[value] || "bg-gray-100 text-gray-500 border-gray-200"}`}>
      {labelMap[value] || value}
    </span>
  );
}

// ─── Modal confirmation suppression ──────────────────────────────────────────
function ConfirmDeleteModal({ count, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
        <div className="text-center">
          <p className="text-3xl mb-2">⚠️</p>
          <h2 className="text-lg font-bold text-gray-900">Confirmer la suppression</h2>
          <p className="text-sm text-gray-500 mt-1">
            Vous allez supprimer <strong>{count} candidat{count > 1 ? "s" : ""}</strong>. Cette action est <strong>irréversible</strong>.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Annuler
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Suppression…</>
              : `🗑 Supprimer`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function Candidats({ user, salaries, sites = [], setPage, setSelectedSalarie, onNew, onDeleteMany, onConvertToSalarie }) {
  const [search,     setSearch]     = useState("");
  const [sortCol,    setSortCol]    = useState("candidatureRecueLe");
  const [sortDir,    setSortDir]    = useState(-1); // plus récents en premier
  const [selected,   setSelected]   = useState(new Set());
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  const isAdmin = user.role === "admin";

  // Seuls les candidats dans le périmètre de l'utilisateur
  const scopeIds = getScopeIds(user, sites);
  const candidats = salaries.filter(s => {
    if (!s.isCandidat) return false;
    if (scopeIds !== null && !scopeIds.includes(s.site_id)) return false;
    return `${s.nom} ${s.prenom}`.toLowerCase().includes(search.toLowerCase());
  });

  const sorted = [...candidats].sort((a, b) => {
    let va = a[sortCol] ?? "";
    let vb = b[sortCol] ?? "";
    return String(va).localeCompare(String(vb), "fr") * sortDir;
  });

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => -d);
    else { setSortCol(col); setSortDir(1); }
  };
  const sortIcon = (col) => sortCol === col ? (sortDir === 1 ? " ↑" : " ↓") : " ↕";

  // ── Sélection ───────────────────────────────────────────────────────────────
  const allSelected  = candidats.length > 0 && candidats.every(s => selected.has(s.id));
  const someSelected = candidats.some(s => selected.has(s.id));

  const toggleOne = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleAll = () => {
    if (allSelected) {
      setSelected(prev => { const next = new Set(prev); candidats.forEach(s => next.delete(s.id)); return next; });
    } else {
      setSelected(prev => { const next = new Set(prev); candidats.forEach(s => next.add(s.id)); return next; });
    }
  };

  const selectedCount = [...selected].filter(id => candidats.some(s => s.id === id)).length;

  const handleDeleteMany = async () => {
    setDeleting(true);
    try {
      await onDeleteMany([...selected].filter(id => candidats.some(s => s.id === id)));
      setSelected(new Set());
      setConfirmDel(false);
    } finally {
      setDeleting(false);
    }
  };

  // Helper site name
  const siteName = (siteId) => {
    const s = sites.find(x => x.id === siteId);
    return s ? [s.filiale, s.nom].filter(Boolean).join(" › ") : "—";
  };

  const cols = [
    { label: "Candidat",        col: "nom" },
    { label: "Candidature le",  col: "candidatureRecueLe" },
    { label: "À appeler le",    col: "appelerLe" },
    { label: "Entretien le",    col: "vuEntretienLe" },
    { label: "Impression",      col: "impressionGlobale" },
    { label: "Orientation",     col: "orientationCandidat" },
    { label: "Site cible",      col: null },
    { label: "",                col: null },
  ];

  return (
    <div className="p-6">
      {confirmDel && (
        <ConfirmDeleteModal
          count={selectedCount}
          onConfirm={handleDeleteMany}
          onCancel={() => setConfirmDel(false)}
          loading={deleting}
        />
      )}

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Candidats</h1>
        <button onClick={onNew}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-5 py-2.5 rounded-xl font-medium">
          + Nouveau candidat
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* ── Barre recherche ── */}
        <div className="p-4 border-b border-gray-100">
          <input
            className="w-full max-w-sm border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
            placeholder="Rechercher un candidat…"
            value={search}
            onChange={e => { setSearch(e.target.value); setSelected(new Set()); }}
          />
        </div>

        {/* ── Barre sélection admin ── */}
        {isAdmin && someSelected && (
          <div className="px-4 py-2.5 bg-red-50 border-b border-red-100 flex items-center justify-between">
            <p className="text-sm font-medium text-red-700">
              {selectedCount} candidat{selectedCount > 1 ? "s" : ""} sélectionné{selectedCount > 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setSelected(new Set())}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-white">
                Tout déselectionner
              </button>
              <button onClick={() => setConfirmDel(true)}
                className="text-sm text-white bg-red-600 hover:bg-red-700 px-4 py-1.5 rounded-lg font-semibold">
                🗑 Supprimer la sélection
              </button>
            </div>
          </div>
        )}

        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {isAdmin && (
                <th className="p-3 w-10">
                  <input type="checkbox" checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded accent-purple-600 cursor-pointer" />
                </th>
              )}
              {cols.map(({ label, col }) => (
                <th key={label}
                  onClick={() => col && toggleSort(col)}
                  className={`text-left p-3 text-xs font-semibold uppercase select-none ${col ? "text-gray-500 cursor-pointer hover:text-purple-600" : "text-gray-400"}`}
                >
                  {label}{col ? sortIcon(col) : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(s => {
              const sel = selected.has(s.id);
              return (
                <tr key={s.id}
                  className={`border-b border-gray-50 cursor-pointer transition-colors ${sel ? "bg-red-50" : "hover:bg-purple-50"}`}
                  onClick={() => {
                    if (isAdmin && someSelected) { toggleOne(s.id); return; }
                    setSelectedSalarie(s); setPage("fiche");
                  }}
                >
                  {isAdmin && (
                    <td className="p-3" onClick={e => { e.stopPropagation(); toggleOne(s.id); }}>
                      <input type="checkbox" checked={sel} onChange={() => toggleOne(s.id)}
                        className="w-4 h-4 rounded accent-purple-600 cursor-pointer" />
                    </td>
                  )}
                  <td className="p-3 font-semibold text-gray-900">{s.nom} {s.prenom}</td>
                  <td className="p-3 text-gray-500 text-xs">{fmt(s.candidatureRecueLe) || "—"}</td>
                  <td className="p-3 text-gray-500 text-xs">{fmt(s.appelerLe) || "—"}</td>
                  <td className="p-3 text-gray-500 text-xs">{fmt(s.vuEntretienLe) || "—"}</td>
                  <td className="p-3"><Badge map={IMP_STYLE} labelMap={IMP_LABEL} value={s.impressionGlobale} /></td>
                  <td className="p-3"><Badge map={ORI_STYLE} labelMap={ORI_LABEL} value={s.orientationCandidat} /></td>
                  <td className="p-3 text-gray-400 text-xs">{s.orientationSiteId ? siteName(s.orientationSiteId) : "—"}</td>
                  <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                    {!sel && onConvertToSalarie && (
                      <button
                        onClick={() => onConvertToSalarie(s)}
                        className="text-xs text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200 whitespace-nowrap font-medium"
                        title="Convertir ce candidat en salarié"
                      >
                        → Salarié
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {candidats.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 9 : 8} className="p-8 text-center text-gray-300">
                  Aucun candidat
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {candidats.length > 0 && (
          <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-gray-400">
            {candidats.length} candidat{candidats.length > 1 ? "s" : ""}
            {isAdmin && selectedCount > 0 && ` · ${selectedCount} sélectionné${selectedCount > 1 ? "s" : ""}`}
          </div>
        )}
      </div>
    </div>
  );
}
