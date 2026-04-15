import { daysUntil, dureeM, urgC, fmt } from "../lib/utils";
import { Card } from "../components/ui";

export default function Dashboard({ user, salaries, entretiens, setPage, setSelectedSalarie }) {
  const mine    = user.role === "admin" ? salaries : salaries.filter(s => s.site_id === user.site_id);
  const actifs  = mine.filter(s => !s.dateSortie);
  const finProches = actifs.filter(s => { const d = daysUntil(s.dateFinContrat); return d !== null && d <= 60 && d >= 0; });
  const myE     = entretiens.filter(e => mine.find(s => s.id === e.salarie_id));
  const objDeadlines = myE
    .flatMap(e => (e.objectifs || []).map(o => ({ ...o, sal: mine.find(s => s.id === e.salarie_id) })))
    .filter(o => o.intitule && (o.atteint === null || o.atteint === undefined) && daysUntil(o.deadline) !== null && daysUntil(o.deadline) <= 14);
  const prochains = myE
    .filter(e => { const d = daysUntil(e.date); return d !== null && d >= 0 && d <= 30 && !e.synthese; })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const kpis = [
    { l: "Salariés actifs",      v: actifs.length,   c: "border-gray-200",   p: "salaries" },
    { l: "Entretiens (30j)",     v: prochains.length, c: prochains.length > 0 ? "border-indigo-300" : "border-gray-200", p: "planning" },
    { l: "Fins proches (60j)",   v: finProches.length, c: finProches.length > 0 ? "border-red-300" : "border-gray-200", p: "preco" },
    { l: "Objectifs en retard",  v: objDeadlines.filter(o => daysUntil(o.deadline) <= 0).length, c: objDeadlines.filter(o => daysUntil(o.deadline) <= 0).length > 0 ? "border-orange-300" : "border-gray-200", p: "planning" },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bonjour, {user.prenom} 👋</h1>
        <p className="text-gray-400 text-sm">{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map(k => (
          <button key={k.l} onClick={() => setPage(k.p)} className={`bg-white rounded-2xl border p-5 text-left hover:shadow-md transition-all ${k.c}`}>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{k.l}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{k.v}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Fins de parcours proches">
          {finProches.length === 0
            ? <p className="text-sm text-gray-400 text-center py-4">Aucune alerte ✓</p>
            : <div className="space-y-2">{finProches.map(s => (
                <button key={s.id} onClick={() => { setSelectedSalarie(s); setPage("fiche"); }} className="w-full text-left p-3 rounded-xl bg-orange-50 border border-orange-100 hover:bg-orange-100">
                  <span className="font-semibold text-orange-900">{s.nom} {s.prenom}</span>
                  <span className="text-orange-600 ml-2 text-sm">· {daysUntil(s.dateFinContrat)}j</span>
                </button>
              ))}</div>
          }
        </Card>

        <Card title="Objectifs arrivant à échéance">
          {objDeadlines.length === 0
            ? <p className="text-sm text-gray-400 text-center py-4">Aucun objectif urgent</p>
            : <div className="space-y-2">{objDeadlines.map((o, i) => {
                const d = daysUntil(o.deadline);
                return (
                  <button key={i} onClick={() => { if (o.sal) { setSelectedSalarie(o.sal); setPage("fiche"); } }} className={`w-full text-left p-3 rounded-xl border ${urgC(d)}`}>
                    <p className="text-sm font-semibold">🎯 {o.intitule}</p>
                    <p className="text-xs mt-0.5">{o.sal?.nom} {o.sal?.prenom} · {d <= 0 ? `Dépassé de ${Math.abs(d)}j` : d === 0 ? "Aujourd'hui" : `Dans ${d}j`}</p>
                  </button>
                );
              })}</div>
          }
        </Card>

        <Card title="Prochains entretiens">
          {prochains.length === 0
            ? <p className="text-sm text-gray-400 text-center py-4">Aucun entretien planifié</p>
            : <div className="space-y-2">{prochains.slice(0, 5).map(e => {
                const sal = mine.find(s => s.id === e.salarie_id);
                if (!sal) return null;
                return (
                  <button key={e.id} onClick={() => { setSelectedSalarie(sal); setPage("fiche"); }} className="w-full text-left p-3 rounded-xl bg-indigo-50 border border-indigo-100 hover:bg-indigo-100">
                    <div className="flex justify-between">
                      <span className="font-semibold text-indigo-900">{sal.nom} {sal.prenom}</span>
                      <span className="text-xs text-indigo-500">{fmt(e.date)}</span>
                    </div>
                    <p className="text-xs text-indigo-600">{e.type}</p>
                  </button>
                );
              })}</div>
          }
        </Card>

        <Card title="Salariés actifs">
          <div className="space-y-2">
            {actifs.slice(0, 4).map(s => {
              const d = daysUntil(s.dateFinContrat);
              return (
                <button key={s.id} onClick={() => { setSelectedSalarie(s); setPage("fiche"); }} className="w-full text-left flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-gray-100">
                  <span className="text-sm font-medium text-gray-800">{s.nom} {s.prenom}</span>
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium ${urgC(d)}`}>{fmt(s.dateFinContrat)}</span>
                </button>
              );
            })}
            {actifs.length > 4 && (
              <button onClick={() => setPage("salaries")} className="text-xs text-indigo-500 hover:underline w-full text-center pt-1">
                +{actifs.length - 4} autres →
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
