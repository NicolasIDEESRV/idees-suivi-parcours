import { useState } from "react";
import { daysUntil, urgC, fmt } from "../lib/utils";

export default function Planning({ user, salaries, entretiens, users, setPage, setSelectedSalarie }) {
  const [filterSal,    setFilterSal]    = useState("all");
  const [filterResp,   setFilterResp]   = useState("all");
  const [filterType,   setFilterType]   = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("future");
  const [search,       setSearch]       = useState("");

  const mineSal = user.role === "admin" ? salaries : salaries.filter(s => s.site_id === user.site_id);

  const items = [];

  entretiens.forEach(e => {
    const sal  = mineSal.find(s => s.id === e.salarie_id);
    if (!sal) return;
    const resp = users.find(u => u.id === e.assignedTo);
    items.push({
      id: e.id, type: "entretien", typeLabel: e.type,
      date: e.date, label: e.type,
      salarie: sal, responsible: resp,
      jalon: e.jalon, done: !!e.synthese && new Date(e.date) < new Date(),
      urgency: daysUntil(e.date), color: "indigo",
    });
  });

  entretiens.forEach(e => {
    const sal = mineSal.find(s => s.id === e.salarie_id);
    if (!sal) return;
    (e.objectifs || []).forEach(o => {
      if (!o.intitule) return;
      const resp = users.find(u => u.id === e.assignedTo);
      items.push({
        id: o.id, type: "objectif", typeLabel: "Objectif",
        date: o.deadline, label: o.intitule,
        salarie: sal, responsible: resp,
        done: o.atteint === true, failed: o.atteint === false,
        urgency: daysUntil(o.deadline), color: "purple",
      });
    });
  });

  mineSal.filter(s => !s.dateSortie).forEach(s => {
    const resp = users.find(u => u.id === s.cip_id);
    if (s.dateFinContrat) items.push({ id: "ct_"  + s.id, type: "echeance", typeLabel: "Fin contrat",  date: s.dateFinContrat, label: "Fin de contrat",  salarie: s, responsible: resp, done: false, urgency: daysUntil(s.dateFinContrat), color: "red" });
    if (s.dateFinAgrement) items.push({ id: "ag_" + s.id, type: "echeance", typeLabel: "Fin agrément", date: s.dateFinAgrement, label: "Fin d'agrément", salarie: s, responsible: resp, done: false, urgency: daysUntil(s.dateFinAgrement), color: "orange" });
    if (s.cssJusquau)      items.push({ id: "css_"+ s.id, type: "alerte",   typeLabel: "CSS / Mutuelle", date: s.cssJusquau,    label: "Expiration CSS",  salarie: s, responsible: resp, done: false, urgency: daysUntil(s.cssJusquau),      color: "yellow" });
    if (s.titreSejour)     items.push({ id: "ts_" + s.id, type: "alerte",   typeLabel: "Titre séjour",   date: s.titreSejour,   label: "Titre de séjour", salarie: s, responsible: resp, done: false, urgency: daysUntil(s.titreSejour),     color: "amber" });
  });

  let filtered = items;
  if (filterSal    !== "all") filtered = filtered.filter(i => i.salarie?.id    === filterSal);
  if (filterResp   !== "all") filtered = filtered.filter(i => i.responsible?.id === filterResp);
  if (filterType   !== "all") filtered = filtered.filter(i => i.type            === filterType);
  if (filterPeriod === "future") filtered = filtered.filter(i => !i.done && (i.urgency === null || i.urgency >= -7));
  if (filterPeriod === "past")   filtered = filtered.filter(i => i.done || (i.urgency !== null && i.urgency < 0));
  if (search) filtered = filtered.filter(i => `${i.salarie?.nom} ${i.salarie?.prenom} ${i.label}`.toLowerCase().includes(search.toLowerCase()));
  filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

  const typeColors = { indigo: "bg-indigo-100 text-indigo-700", purple: "bg-purple-100 text-purple-700", red: "bg-red-100 text-red-700", orange: "bg-orange-100 text-orange-700", yellow: "bg-yellow-100 text-yellow-700", amber: "bg-amber-100 text-amber-700" };
  const typeIcons  = { entretien: "💬", objectif: "🎯", echeance: "📋", alerte: "⚠" };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Planning</h1>
        <p className="text-sm text-gray-400">{filtered.length} événement{filtered.length > 1 ? "s" : ""}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-5 flex flex-wrap gap-3">
        <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 min-w-40" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none" value={filterSal} onChange={e => setFilterSal(e.target.value)}>
          <option value="all">Tous les salariés</option>
          {mineSal.map(s => <option key={s.id} value={s.id}>{s.nom} {s.prenom}</option>)}
        </select>
        <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none" value={filterResp} onChange={e => setFilterResp(e.target.value)}>
          <option value="all">Tous les responsables</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>)}
        </select>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[{ id: "all", l: "Tout" }, { id: "entretien", l: "💬 Entretiens" }, { id: "objectif", l: "🎯 Objectifs" }, { id: "echeance", l: "📋 Échéances" }, { id: "alerte", l: "⚠ Alertes" }].map(f => (
            <button key={f.id} onClick={() => setFilterType(f.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${filterType === f.id ? "bg-white text-indigo-700 shadow-sm" : "text-gray-600"}`}>{f.l}</button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[{ id: "future", l: "À venir" }, { id: "past", l: "Passés" }, { id: "all", l: "Tous" }].map(f => (
            <button key={f.id} onClick={() => setFilterPeriod(f.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filterPeriod === f.id ? "bg-white text-indigo-700 shadow-sm" : "text-gray-600"}`}>{f.l}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0
        ? <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center"><p className="text-gray-400 text-sm">Aucun événement pour ces filtres</p></div>
        : (
          <div className="space-y-2">
            {filtered.map((item, i) => {
              const d = item.urgency;
              const prevDate = i > 0 ? filtered[i - 1].date : null;
              const showDate = prevDate !== item.date;
              return (
                <div key={item.id}>
                  {showDate && (
                    <div className="flex items-center gap-3 my-3">
                      <div className="h-px flex-1 bg-gray-200" />
                      <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">
                        {fmt(item.date)}{d === 0 ? " — Aujourd'hui" : d > 0 ? ` — dans ${d}j` : ` — dépassé de ${Math.abs(d)}j`}
                      </span>
                      <div className="h-px flex-1 bg-gray-200" />
                    </div>
                  )}
                  <div
                    className={`bg-white rounded-2xl border p-4 flex items-center gap-4 hover:shadow-sm transition-shadow cursor-pointer ${item.done ? "opacity-60" : ""} ${d !== null && d < 0 && !item.done ? "border-red-200" : d !== null && d <= 7 && !item.done ? "border-orange-200" : "border-gray-200"}`}
                    onClick={() => { if (item.salarie) { setSelectedSalarie(item.salarie); setPage("fiche"); } }}
                  >
                    <div className="text-2xl shrink-0">{typeIcons[item.type]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[item.color]}`}>{item.typeLabel}</span>
                        {item.jalon  && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Jalon</span>}
                        {item.done   && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Fait</span>}
                        {item.failed && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">✗ Non atteint</span>}
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.salarie?.nom} {item.salarie?.prenom}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      {item.responsible && <p className="text-xs text-gray-500 mb-1">{item.responsible.prenom} {item.responsible.nom}</p>}
                      <span className={`text-xs px-2 py-1 rounded-full border font-medium ${urgC(d)}`}>
                        {d === null ? "—" : d < 0 ? `${Math.abs(d)}j dépassé` : d === 0 ? "Aujourd'hui" : `${d}j`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}
