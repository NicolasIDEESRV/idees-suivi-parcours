import { useState } from "react";
import { getAge, dureeM, daysUntil, urgC, fmt, getScopeIds } from "../lib/utils";

// ─── Modal de confirmation suppression ───────────────────────────────────────
function ConfirmDeleteModal({ count, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
        <div className="text-center">
          <p className="text-3xl mb-2">⚠️</p>
          <h2 className="text-lg font-bold text-gray-900">Confirmer la suppression</h2>
          <p className="text-sm text-gray-500 mt-1">
            Vous allez supprimer <strong>{count} salarié{count > 1 ? "s" : ""}</strong> et toutes leurs données
            (entretiens, objectifs…). Cette action est <strong>irréversible</strong>.
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
              : `🗑 Supprimer ${count > 1 ? `les ${count}` : "ce"} salarié${count > 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function ListeSalaries({ user, salaries, sites = [], setPage, setSelectedSalarie, onNew, onOpenSortie, onDeleteMany }) {
  const [search,     setSearch]     = useState("");
  const [fs,         setFs]         = useState("actifs");
  const [selected,   setSelected]   = useState(new Set());   // IDs sélectionnés
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  const isAdmin = user.role === "admin";

  const scopeIds = getScopeIds(user, sites);
  const mine = scopeIds === null ? salaries : salaries.filter(s => scopeIds.includes(s.site_id));
  const list = mine.filter(s =>
    `${s.nom} ${s.prenom}`.toLowerCase().includes(search.toLowerCase()) &&
    (fs === "tous" || (fs === "actifs" && !s.dateSortie) || (fs === "sortis" && s.dateSortie))
  );

  // ── Sélection ───────────────────────────────────────────────────────────────
  const allSelected  = list.length > 0 && list.every(s => selected.has(s.id));
  const someSelected = list.some(s => selected.has(s.id));

  const toggleOne = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () => {
    if (allSelected) {
      setSelected(prev => { const next = new Set(prev); list.forEach(s => next.delete(s.id)); return next; });
    } else {
      setSelected(prev => { const next = new Set(prev); list.forEach(s => next.add(s.id)); return next; });
    }
  };

  // ── Suppression groupée ──────────────────────────────────────────────────────
  const handleDeleteMany = async () => {
    setDeleting(true);
    try {
      await onDeleteMany([...selected]);
      setSelected(new Set());
      setConfirmDel(false);
    } finally {
      setDeleting(false);
    }
  };

  const selectedCount = [...selected].filter(id => list.some(s => s.id === id)).length;

  return (
    <div className="p-6">
      {/* ── Modal confirmation ── */}
      {confirmDel && (
        <ConfirmDeleteModal
          count={selectedCount}
          onConfirm={handleDeleteMany}
          onCancel={() => setConfirmDel(false)}
          loading={deleting}
        />
      )}

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Salariés</h1>
        <button onClick={onNew} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-5 py-2.5 rounded-xl font-medium">
          + Nouveau salarié
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* ── Barre de recherche / filtres ── */}
        <div className="p-4 border-b border-gray-100 flex gap-3 flex-wrap items-center">
          <input
            className="flex-1 min-w-40 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="Rechercher…"
            value={search}
            onChange={e => { setSearch(e.target.value); setSelected(new Set()); }}
          />
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {[{ id: "actifs", l: "Actifs" }, { id: "sortis", l: "Sortis" }, { id: "tous", l: "Tous" }].map(f => (
              <button key={f.id} onClick={() => { setFs(f.id); setSelected(new Set()); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${fs === f.id ? "bg-white text-indigo-700 shadow-sm" : "text-gray-600"}`}>
                {f.l}
              </button>
            ))}
          </div>
        </div>

        {/* ── Barre d'action sélection (admin) ── */}
        {isAdmin && someSelected && (
          <div className="px-4 py-2.5 bg-red-50 border-b border-red-100 flex items-center justify-between">
            <p className="text-sm font-medium text-red-700">
              {selectedCount} salarié{selectedCount > 1 ? "s" : ""} sélectionné{selectedCount > 1 ? "s" : ""}
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
              {/* Checkbox "tout sélectionner" — admin uniquement */}
              {isAdmin && (
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                  />
                </th>
              )}
              {["Salarié","Âge","Entrée","Durée","Fin contrat","Prescripteur","Statut",""].map(h => (
                <th key={h} className="text-left p-3 text-xs font-semibold text-gray-400 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map(s => {
              const d   = daysUntil(s.dateFinContrat);
              const sel = selected.has(s.id);
              return (
                <tr
                  key={s.id}
                  className={`border-b border-gray-50 cursor-pointer transition-colors ${sel ? "bg-red-50" : "hover:bg-indigo-50"}`}
                  onClick={() => {
                    if (isAdmin && someSelected) { toggleOne(s.id); return; }
                    setSelectedSalarie(s); setPage("fiche");
                  }}
                >
                  {/* Checkbox individuelle — admin uniquement */}
                  {isAdmin && (
                    <td className="p-3" onClick={e => { e.stopPropagation(); toggleOne(s.id); }}>
                      <input
                        type="checkbox"
                        checked={sel}
                        onChange={() => toggleOne(s.id)}
                        className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="p-3 font-semibold text-gray-900">{s.nom} {s.prenom}</td>
                  <td className="p-3 text-gray-400">{getAge(s.dateNaissance) || "—"}</td>
                  <td className="p-3 text-gray-400">{fmt(s.dateEntree)}</td>
                  <td className="p-3 text-gray-400">{dureeM(s.dateEntree, s.dateSortie)} mois</td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full border font-medium ${urgC(d)}`}>{fmt(s.dateFinContrat)}</span></td>
                  <td className="p-3 text-gray-400 text-xs">{s.prescripteur}</td>
                  <td className="p-3">
                    {s.dateSortie
                      ? <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Sorti</span>
                      : <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Actif</span>}
                  </td>
                  <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                    {!s.dateSortie && !sel && (
                      <button onClick={() => onOpenSortie(s)}
                        className="text-xs text-red-500 hover:bg-red-50 px-3 py-1 rounded-lg border border-red-200">
                        Sortir
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr><td colSpan={isAdmin ? 9 : 8} className="p-8 text-center text-gray-300">Aucun salarié</td></tr>
            )}
          </tbody>
        </table>

        {/* Compteur bas de page */}
        {list.length > 0 && (
          <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-gray-400">
            {list.length} salarié{list.length > 1 ? "s" : ""}
            {isAdmin && selectedCount > 0 && ` · ${selectedCount} sélectionné${selectedCount > 1 ? "s" : ""}`}
          </div>
        )}
      </div>
    </div>
  );
}
