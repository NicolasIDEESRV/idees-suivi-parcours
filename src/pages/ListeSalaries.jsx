import { useState } from "react";
import { getAge, dureeM, daysUntil, urgC, fmt } from "../lib/utils";

export default function ListeSalaries({ user, salaries, sites, setPage, setSelectedSalarie, onNew, onOpenSortie }) {
  const [search, setSearch] = useState("");
  const [fs,     setFs]     = useState("actifs");

  const mine = user.role === "admin" ? salaries : salaries.filter(s => s.site_id === user.site_id);
  const list = mine.filter(s =>
    `${s.nom} ${s.prenom}`.toLowerCase().includes(search.toLowerCase()) &&
    (fs === "tous" || (fs === "actifs" && !s.dateSortie) || (fs === "sortis" && s.dateSortie))
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Salariés</h1>
        <button onClick={onNew} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-5 py-2.5 rounded-xl font-medium">
          + Nouveau salarié
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-3 flex-wrap">
          <input
            className="flex-1 min-w-40 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="Rechercher…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {[{ id: "actifs", l: "Actifs" }, { id: "sortis", l: "Sortis" }, { id: "tous", l: "Tous" }].map(f => (
              <button key={f.id} onClick={() => setFs(f.id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${fs === f.id ? "bg-white text-indigo-700 shadow-sm" : "text-gray-600"}`}>
                {f.l}
              </button>
            ))}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Salarié","Âge","Entrée","Durée","Fin contrat","Prescripteur","Statut",""].map(h => (
                <th key={h} className="text-left p-3 text-xs font-semibold text-gray-400 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map(s => {
              const d = daysUntil(s.dateFinContrat);
              return (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-indigo-50 cursor-pointer" onClick={() => { setSelectedSalarie(s); setPage("fiche"); }}>
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
                    {!s.dateSortie && (
                      <button onClick={() => onOpenSortie(s)} className="text-xs text-red-500 hover:bg-red-50 px-3 py-1 rounded-lg border border-red-200">
                        Sortir
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-gray-300">Aucun salarié</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
