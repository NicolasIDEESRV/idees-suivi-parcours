import { useState } from "react";
import { daysUntil, dureeM, urgC, fmt } from "../lib/utils";

export default function VuePreco({ user, salaries, sites, entretiens, setPage, setSelectedSalarie, onOpenSortie }) {
  const [fs,  setFs]  = useState(user.site_id || "all");
  const [fst, setFst] = useState("actifs");

  const list = salaries.filter(s =>
    (fs === "all" || s.site_id === fs) &&
    (fst === "tous" || (fst === "actifs" && !s.dateSortie) || (fst === "sortis" && s.dateSortie))
  );

  const headers = ["NOM Prénom","Fin agrément","TS","PB","VH","CV","Langue","Entrée","Fin contrat","Mois","Sortie","Dyn.","Rappeler","Préco","Suivi social","Projet","Domaines","Action"];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Vue PRECO</h1>
        <div className="flex gap-2">
          {user.role === "admin" && (
            <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white" value={fs} onChange={e => setFs(e.target.value)}>
              <option value="all">Tous les sites</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
          )}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {[{ id: "actifs", l: "Actifs" }, { id: "sortis", l: "Sortis" }, { id: "tous", l: "Tous" }].map(f => (
              <button key={f.id} onClick={() => setFst(f.id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${fst === f.id ? "bg-white text-indigo-700 shadow-sm" : "text-gray-600"}`}>{f.l}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
        <table className="text-xs min-w-full">
          <thead className="bg-indigo-50 border-b border-indigo-100">
            <tr>
              {headers.map(h => <th key={h} className="text-left px-3 py-2.5 font-semibold text-indigo-700 whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {list.map(s => {
              const dA  = daysUntil(s.dateFinAgrement);
              const dC  = daysUntil(s.dateFinContrat);
              const dT  = daysUntil(s.titreSejour);
              const dyn = ["Dynamique","Durable","Transition"].includes(s.typeSortie);
              return (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-indigo-50 transition-colors">
                  <td className="px-3 py-2.5">
                    <button onClick={() => { setSelectedSalarie(s); setPage("fiche"); }} className="font-semibold text-gray-900 hover:text-indigo-600 whitespace-nowrap">
                      {s.nom} {s.prenom}
                    </button>
                  </td>
                  <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full border font-medium ${urgC(dA)}`}>{fmt(s.dateFinAgrement)}</span></td>
                  <td className="px-3 py-2.5">
                    {s.titreSejour
                      ? <span className={`px-2 py-0.5 rounded-full border font-medium ${urgC(dT)}`}>{fmt(s.titreSejour)}</span>
                      : <span className="text-gray-200">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center">{s.permisB  ? <span className="text-green-600 font-bold">✓</span> : <span className="text-gray-300">✗</span>}</td>
                  <td className="px-3 py-2.5 text-center">{s.vehicule ? <span className="text-green-600 font-bold">✓</span> : <span className="text-gray-300">✗</span>}</td>
                  <td className="px-3 py-2.5 text-center">{s.cv       ? <span className="text-green-600 font-bold">✓</span> : <span className="text-gray-300">✗</span>}</td>
                  <td className="px-3 py-2.5"><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s.niveauLangue || "—"}</span></td>
                  <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{fmt(s.dateEntree)}</td>
                  <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full border font-medium ${urgC(dC)}`}>{fmt(s.dateFinContrat)}</span></td>
                  <td className="px-3 py-2.5 text-center font-semibold">{dureeM(s.dateEntree, s.dateSortie)}</td>
                  <td className="px-3 py-2.5 text-center">
                    {s.dateSortie
                      ? <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Sorti</span>
                      : <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Actif</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {s.dateSortie
                      ? (dyn ? <span className="text-green-600 font-bold">✓</span> : <span className="text-red-400">✗</span>)
                      : <span className="text-gray-200">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {s.aRappeler
                      ? <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">OUI</span>
                      : <span className="text-gray-200">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 max-w-28"><span className="line-clamp-2">{s.preconisation || "—"}</span></td>
                  <td className="px-3 py-2.5 text-gray-500">{s.suiviSocial || "—"}</td>
                  <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{s.projetPro || "—"}</td>
                  <td className="px-3 py-2.5 text-gray-500">{s.domainesPro?.filter(Boolean).join(", ") || "—"}</td>
                  <td className="px-3 py-2.5">
                    {!s.dateSortie && (
                      <button onClick={() => onOpenSortie(s)} className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg border border-red-200">Sortir</button>
                    )}
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr><td colSpan={18} className="p-8 text-center text-gray-300">Aucun salarié</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
