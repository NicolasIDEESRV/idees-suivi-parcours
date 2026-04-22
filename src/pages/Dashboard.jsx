import { useState, useMemo } from "react";
import { daysUntil, urgC, fmt } from "../lib/utils";
import { Card } from "../components/ui";

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

// ─── Badge "dernier RDV" ──────────────────────────────────────────────────────
function rdvBadge(last) {
  if (!last) return { cls: "bg-red-100 text-red-700 border-red-200", label: "Jamais" };
  const days = Math.floor((new Date() - new Date(last.date)) / 86_400_000);
  if (days < 30) return { cls: "bg-green-100 text-green-700 border-green-200",   label: `− ${days}j` };
  if (days < 60) return { cls: "bg-orange-100 text-orange-700 border-orange-200", label: `+ ${days}j` };
  return             { cls: "bg-red-100 text-red-700 border-red-200",             label: `+ ${days}j` };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard({ user, salaries, entretiens, sites = [], setPage, setSelectedSalarie }) {
  const todayStr = new Date().toISOString().slice(0, 10);

  // ── Filtres hiérarchiques (admin uniquement) ──────────────────────────────
  const [selFiliale,  setSelFiliale]  = useState([]);
  const [selSecteur,  setSelSecteur]  = useState([]);
  const [selActivite, setSelActivite] = useState([]);
  const [selSite,     setSelSite]     = useState([]);

  const filialesList  = [...new Set(sites.map(s => s.filiale).filter(Boolean))].sort();
  const secteursList  = [...new Set(
    sites.filter(s => !selFiliale.length || selFiliale.includes(s.filiale))
      .map(s => s.secteur).filter(Boolean)
  )].sort();
  const activitesList = [...new Set(
    sites.filter(s =>
      (!selFiliale.length  || selFiliale.includes(s.filiale)) &&
      (!selSecteur.length  || selSecteur.includes(s.secteur))
    ).map(s => s.activite).filter(Boolean)
  )].sort();
  const sitesList = [...new Set(
    sites.filter(s =>
      (!selFiliale.length  || selFiliale.includes(s.filiale))  &&
      (!selSecteur.length  || selSecteur.includes(s.secteur))  &&
      (!selActivite.length || selActivite.includes(s.activite))
    ).map(s => s.nom).filter(Boolean)
  )].sort();

  const filteredSiteIds = useMemo(() => {
    if (!selFiliale.length && !selSecteur.length && !selActivite.length && !selSite.length) return null;
    return sites.filter(s =>
      (!selFiliale.length  || selFiliale.includes(s.filiale))  &&
      (!selSecteur.length  || selSecteur.includes(s.secteur))  &&
      (!selActivite.length || selActivite.includes(s.activite)) &&
      (!selSite.length     || selSite.includes(s.nom))
    ).map(s => s.id);
  }, [sites, selFiliale, selSecteur, selActivite, selSite]);

  // ── Périmètre salarié ────────────────────────────────────────────────────
  const base = user.role === "admin"
    ? salaries
    : salaries.filter(s => s.site_id === user.site_id);

  const mine   = filteredSiteIds ? base.filter(s => filteredSiteIds.includes(s.site_id)) : base;
  const actifs = mine.filter(s => !s.dateSortie);

  const finProches = actifs.filter(s => {
    const d = daysUntil(s.dateFinContrat);
    return d !== null && d <= 60 && d >= 0;
  });

  const myE = entretiens.filter(e => mine.some(s => s.id === e.salarie_id));

  const objDeadlines = myE
    .flatMap(e => (e.objectifs || []).map(o => ({ ...o, sal: mine.find(s => s.id === e.salarie_id) })))
    .filter(o => o.intitule && (o.atteint == null) && daysUntil(o.deadline) !== null && daysUntil(o.deadline) <= 14);

  const prochains = myE
    .filter(e => { const d = daysUntil(e.date); return d !== null && d >= 0 && d <= 30 && !e.synthese; })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // ── Dernier RDV par salarié actif ─────────────────────────────────────────
  const dernierRdv = useMemo(() => {
    return actifs.map(s => {
      const done = entretiens
        .filter(e => e.salarie_id === s.id && e.date && e.date <= todayStr)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      return { sal: s, last: done[0] || null };
    }).sort((a, b) => {
      // Jamais vu → en haut, puis du plus ancien au plus récent
      if (!a.last && !b.last) return 0;
      if (!a.last) return -1;
      if (!b.last) return 1;
      return new Date(a.last.date) - new Date(b.last.date);
    });
  }, [actifs, entretiens, todayStr]);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const nbRetard = objDeadlines.filter(o => daysUntil(o.deadline) <= 0).length;
  const kpis = [
    { l: "Salariés actifs",     v: actifs.length,    c: "border-gray-200",                                                 p: "salaries" },
    { l: "Entretiens (30j)",    v: prochains.length, c: prochains.length > 0 ? "border-indigo-300" : "border-gray-200",   p: "planning" },
    { l: "Fins proches (60j)",  v: finProches.length,c: finProches.length > 0 ? "border-red-300"   : "border-gray-200",   p: "preco"    },
    { l: "Objectifs en retard", v: nbRetard,         c: nbRetard > 0         ? "border-orange-300" : "border-gray-200",   p: "planning" },
  ];

  const showFilters = user.role === "admin" && filialesList.length > 0;

  return (
    <div className="p-6">
      {/* En-tête */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Bonjour, {user.prenom} 👋</h1>
        <p className="text-gray-400 text-sm">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Filtres hiérarchiques */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <CheckGroup label="Filiale" options={filialesList} selected={selFiliale}
              onChange={v => { setSelFiliale(v); setSelSecteur([]); setSelActivite([]); setSelSite([]); }} />
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
          {filteredSiteIds && (
            <p className="text-xs text-indigo-600 font-medium mt-2">
              {mine.length} salarié{mine.length > 1 ? "s" : ""} dans la sélection
            </p>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {kpis.map(k => (
          <button key={k.l} onClick={() => setPage(k.p)}
            className={`bg-white rounded-2xl border p-5 text-left hover:shadow-md transition-all ${k.c}`}>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{k.l}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{k.v}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Dernier RDV ──────────────────────────────────────────────────── */}
        <Card title={`Dernier rendez-vous — ${actifs.length} actifs`}>
          {dernierRdv.length === 0
            ? <p className="text-sm text-gray-400 text-center py-4">Aucun salarié actif</p>
            : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
                {dernierRdv.map(({ sal, last }) => {
                  const badge = rdvBadge(last);
                  return (
                    <button key={sal.id}
                      onClick={() => { setSelectedSalarie(sal); setPage("fiche"); }}
                      className="w-full text-left p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 flex items-center justify-between gap-2 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">{sal.nom} {sal.prenom}</p>
                        {last
                          ? <p className="text-xs text-gray-400 truncate">{fmt(last.date)} · {last.type}</p>
                          : <p className="text-xs text-gray-400 italic">Aucun entretien enregistré</p>
                        }
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )
          }
          {/* Légende */}
          <div className="flex gap-3 mt-3 pt-2 border-t border-gray-100">
            <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-medium">−30j</span>
            <span className="text-xs text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full font-medium">+1 mois</span>
            <span className="text-xs text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-medium">+2 mois</span>
          </div>
        </Card>

        {/* ── Fins de parcours proches ──────────────────────────────────── */}
        <Card title="Fins de parcours proches">
          {finProches.length === 0
            ? <p className="text-sm text-gray-400 text-center py-4">Aucune alerte ✓</p>
            : (
              <div className="space-y-2">
                {finProches.map(s => (
                  <button key={s.id} onClick={() => { setSelectedSalarie(s); setPage("fiche"); }}
                    className="w-full text-left p-3 rounded-xl bg-orange-50 border border-orange-100 hover:bg-orange-100">
                    <span className="font-semibold text-orange-900">{s.nom} {s.prenom}</span>
                    <span className="text-orange-600 ml-2 text-sm">· {daysUntil(s.dateFinContrat)}j</span>
                  </button>
                ))}
              </div>
            )
          }
        </Card>

        {/* ── Objectifs à échéance ──────────────────────────────────────── */}
        <Card title="Objectifs arrivant à échéance">
          {objDeadlines.length === 0
            ? <p className="text-sm text-gray-400 text-center py-4">Aucun objectif urgent</p>
            : (
              <div className="space-y-2">
                {objDeadlines.map((o, i) => {
                  const d = daysUntil(o.deadline);
                  return (
                    <button key={i}
                      onClick={() => { if (o.sal) { setSelectedSalarie(o.sal); setPage("fiche"); } }}
                      className={`w-full text-left p-3 rounded-xl border ${urgC(d)}`}>
                      <p className="text-sm font-semibold">🎯 {o.intitule}</p>
                      <p className="text-xs mt-0.5">
                        {o.sal?.nom} {o.sal?.prenom} ·{" "}
                        {d < 0 ? `Dépassé de ${Math.abs(d)}j` : d === 0 ? "Aujourd'hui" : `Dans ${d}j`}
                      </p>
                    </button>
                  );
                })}
              </div>
            )
          }
        </Card>

        {/* ── Prochains entretiens ──────────────────────────────────────── */}
        <Card title="Prochains entretiens">
          {prochains.length === 0
            ? <p className="text-sm text-gray-400 text-center py-4">Aucun entretien planifié</p>
            : (
              <div className="space-y-2">
                {prochains.slice(0, 5).map(e => {
                  const sal = mine.find(s => s.id === e.salarie_id);
                  if (!sal) return null;
                  return (
                    <button key={e.id} onClick={() => { setSelectedSalarie(sal); setPage("fiche"); }}
                      className="w-full text-left p-3 rounded-xl bg-indigo-50 border border-indigo-100 hover:bg-indigo-100">
                      <div className="flex justify-between">
                        <span className="font-semibold text-indigo-900">{sal.nom} {sal.prenom}</span>
                        <span className="text-xs text-indigo-500">{fmt(e.date)}</span>
                      </div>
                      <p className="text-xs text-indigo-600">{e.type}</p>
                    </button>
                  );
                })}
              </div>
            )
          }
        </Card>

      </div>
    </div>
  );
}
