import { useState, useMemo } from "react";
import { daysUntil, urgC, fmt, getScopeIds } from "../lib/utils";

// ─── Pipeline candidats (sans Intérim) ───────────────────────────────────────
const PIPELINE = [
  { key: "evaluation", label: "Évaluation", hex: "#D97706", bg: "#FEF3C7", border: "#FCD34D" },
  { key: "vivier",     label: "Vivier",     hex: "#2563EB", bg: "#DBEAFE", border: "#93C5FD" },
  { key: "recrute",    label: "Recruté",    hex: "#059669", bg: "#D1FAE5", border: "#6EE7B7" },
  { key: "decliner",   label: "Décliné",    hex: "#DC2626", bg: "#FEE2E2", border: "#FCA5A5" },
];

// ─── Périodes ─────────────────────────────────────────────────────────────────
const PERIODS = [
  { key: "all", label: "Tout"        },
  { key: "1m",  label: "Ce mois"     },
  { key: "3m",  label: "3 mois"      },
  { key: "6m",  label: "6 mois"      },
  { key: "12m", label: "12 mois"     },
  { key: "ytd", label: "Année en cours" },
];

function isInPeriod(dateStr, period) {
  if (!dateStr || period === "all") return true;
  const d = new Date(dateStr);
  const now = new Date();
  if (period === "ytd") return d.getFullYear() === now.getFullYear();
  if (period === "1m")  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  const months = parseInt(period);
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - months);
  return d >= cutoff;
}

function periodLabel(period) {
  return PERIODS.find(p => p.key === period)?.label ?? period;
}

// ─── Sélecteur de période ─────────────────────────────────────────────────────
function PeriodSelector({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1">
      {PERIODS.map(p => (
        <button key={p.key} onClick={() => onChange(p.key)}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
            value === p.key
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"
          }`}>
          {p.label}
        </button>
      ))}
    </div>
  );
}

// ─── Filtres scope (filiale/secteur/activité/site) ───────────────────────────
function CheckGroup({ label, options, selected, onChange }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1">
        <button onClick={() => onChange([])}
          className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${selected.length === 0 ? "bg-indigo-600 text-white border-indigo-600" : "text-gray-500 border-gray-200 hover:border-indigo-300"}`}>
          Tous
        </button>
        {options.map(o => (
          <button key={o} onClick={() => onChange(selected.includes(o) ? selected.filter(x => x !== o) : [...selected, o])}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${selected.includes(o) ? "bg-indigo-600 text-white border-indigo-600" : "text-gray-600 border-gray-200 hover:border-indigo-300"}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ value, label, sub, pct, hex, onClick }) {
  return (
    <button onClick={onClick}
      className="flex-1 min-w-0 flex flex-col items-center gap-1 p-3 rounded-xl border transition-all hover:shadow-sm cursor-pointer"
      style={{ borderColor: hex + "40", backgroundColor: hex + "0D" }}>
      <span className="text-3xl font-black leading-none" style={{ color: hex }}>{value}</span>
      <span className="text-xs font-bold uppercase tracking-wide text-gray-600">{label}</span>
      {pct !== undefined && (
        <div className="w-full mt-1">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: hex }} />
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-0.5">{pct.toFixed(0)}%{sub ? ` · ${sub}` : ""}</p>
        </div>
      )}
      {pct === undefined && sub && (
        <p className="text-[10px] text-gray-400">{sub}</p>
      )}
    </button>
  );
}

// ─── Badge dernier RDV ────────────────────────────────────────────────────────
function rdvBadge(last) {
  if (!last) return { cls: "bg-red-100 text-red-700 border-red-200", label: "Jamais" };
  const days = Math.floor((new Date() - new Date(last.date)) / 86_400_000);
  if (days < 30) return { cls: "bg-green-100 text-green-700 border-green-200", label: `−${days}j` };
  if (days < 60) return { cls: "bg-orange-100 text-orange-700 border-orange-200", label: `+${days}j` };
  return { cls: "bg-red-100 text-red-700 border-red-200", label: `+${days}j` };
}

// ─── Section card ─────────────────────────────────────────────────────────────
function Section({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ icon, title, count, color = "#4F46E5", action, onAction }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: color + "18" }}>
          {icon}
        </div>
        <span className="text-sm font-bold text-gray-800">{title}</span>
        {count !== undefined && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: color }}>
            {count}
          </span>
        )}
      </div>
      {action && (
        <button onClick={onAction} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">
          {action} →
        </button>
      )}
    </div>
  );
}

// ─── Dashboard principal ──────────────────────────────────────────────────────
export default function Dashboard({ user, salaries, entretiens, sites = [], setPage, setSelectedSalarie }) {
  const todayStr = new Date().toISOString().slice(0, 10);

  // ── Filtres scope ────────────────────────────────────────────────────────
  const [selFiliale,  setSelFiliale]  = useState([]);
  const [selSecteur,  setSelSecteur]  = useState([]);
  const [selActivite, setSelActivite] = useState([]);
  const [selSite,     setSelSite]     = useState([]);

  // ── Filtres période ──────────────────────────────────────────────────────
  const [periodesSal,  setPeriodesSal]  = useState("all");
  const [periodesCand, setPeriodesCand] = useState("all");

  const accessibleSites = useMemo(() => {
    if (user.role === "admin") return sites;
    const ids = getScopeIds(user, sites);
    return ids ? sites.filter(s => ids.includes(s.id)) : sites;
  }, [user, sites]);

  const filialesList  = [...new Set(accessibleSites.map(s => s.filiale).filter(Boolean))].sort();
  const secteursList  = [...new Set(accessibleSites.filter(s => !selFiliale.length || selFiliale.includes(s.filiale)).map(s => s.secteur).filter(Boolean))].sort();
  const activitesList = [...new Set(accessibleSites.filter(s => (!selFiliale.length || selFiliale.includes(s.filiale)) && (!selSecteur.length || selSecteur.includes(s.secteur))).map(s => s.activite).filter(Boolean))].sort();
  const sitesList     = [...new Set(accessibleSites.filter(s => (!selFiliale.length || selFiliale.includes(s.filiale)) && (!selSecteur.length || selSecteur.includes(s.secteur)) && (!selActivite.length || selActivite.includes(s.activite))).map(s => s.nom).filter(Boolean))].sort();

  const filteredSiteIds = useMemo(() => {
    if (!selFiliale.length && !selSecteur.length && !selActivite.length && !selSite.length) return null;
    return accessibleSites.filter(s =>
      (!selFiliale.length  || selFiliale.includes(s.filiale))  &&
      (!selSecteur.length  || selSecteur.includes(s.secteur))  &&
      (!selActivite.length || selActivite.includes(s.activite)) &&
      (!selSite.length     || selSite.includes(s.nom))
    ).map(s => s.id);
  }, [accessibleSites, selFiliale, selSecteur, selActivite, selSite]);

  // ── Population de base ───────────────────────────────────────────────────
  const scopeIds = getScopeIds(user, sites);
  const baseAll  = scopeIds === null ? salaries : salaries.filter(s => scopeIds.includes(s.site_id));
  const mine     = filteredSiteIds ? baseAll.filter(s => filteredSiteIds.includes(s.site_id)) : baseAll;

  // ── Salariés ─────────────────────────────────────────────────────────────
  const salAll     = mine.filter(s => !s.isCandidat);
  const actifs     = salAll.filter(s => !s.dateSortie);
  const sortisAll  = salAll.filter(s => s.dateSortie);
  const recrutesInPeriod = salAll.filter(s => isInPeriod(s.dateEntree, periodesSal));
  const sortisInPeriod   = salAll.filter(s => s.dateSortie && isInPeriod(s.dateSortie, periodesSal));
  const totalSal = salAll.length || 1; // éviter /0

  const finProches = actifs.filter(s => { const d = daysUntil(s.dateFinContrat); return d !== null && d <= 60 && d >= 0; });

  const myE = entretiens.filter(e => mine.some(s => s.id === e.salarie_id));
  const objDeadlines = myE
    .flatMap(e => (e.objectifs || []).map(o => ({ ...o, sal: mine.find(s => s.id === e.salarie_id) })))
    .filter(o => o.intitule && (o.atteint == null) && daysUntil(o.deadline) !== null && daysUntil(o.deadline) <= 14);
  const nbRetard = objDeadlines.filter(o => daysUntil(o.deadline) <= 0).length;

  const prochains = myE
    .filter(e => { const d = daysUntil(e.date); return d !== null && d >= 0 && d <= 30 && !e.synthese; })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const dernierRdv = useMemo(() => {
    return actifs.map(s => {
      const done = entretiens.filter(e => e.salarie_id === s.id && e.date <= todayStr)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      return { sal: s, last: done[0] || null };
    }).sort((a, b) => {
      if (!a.last && !b.last) return 0;
      if (!a.last) return -1;
      if (!b.last) return 1;
      return new Date(a.last.date) - new Date(b.last.date);
    });
  }, [actifs, entretiens, todayStr]);

  // ── Candidats ────────────────────────────────────────────────────────────
  const candidatsAll    = mine.filter(s => s.isCandidat);
  const candidatsPeriod = candidatsAll.filter(s => isInPeriod(s.candidatureRecueLe, periodesCand));
  const totalCand       = candidatsPeriod.length || 1;

  const pipelineStats = PIPELINE.map(p => ({
    ...p,
    count: candidatsPeriod.filter(c => c.orientationCandidat === p.key).length,
    pct:   Math.round(candidatsPeriod.filter(c => c.orientationCandidat === p.key).length / totalCand * 100),
  }));
  const sansAvis = candidatsPeriod.filter(c => !c.orientationCandidat).length;

  const showFilters = accessibleSites.length > 1;

  return (
    <div className="p-5 space-y-5">

      {/* ── En-tête ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bonjour, {user.prenom} 👋</h1>
          <p className="text-sm text-gray-400 mt-0.5 capitalize">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {finProches.length > 0 && (
            <button onClick={() => setPage("preco")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors">
              <span className="w-5 h-5 bg-red-200 rounded-full flex items-center justify-center text-xs font-bold">{finProches.length}</span>
              Fins proches ≤60j
            </button>
          )}
          {nbRetard > 0 && (
            <button onClick={() => setPage("planning")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-xl text-orange-700 text-xs font-semibold hover:bg-orange-100 transition-colors">
              <span className="w-5 h-5 bg-orange-200 rounded-full flex items-center justify-center text-xs font-bold">{nbRetard}</span>
              Objectifs dépassés
            </button>
          )}
        </div>
      </div>

      {/* ── Filtres scope ── */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex flex-wrap gap-4">
            <CheckGroup label="Filiale"  options={filialesList}  selected={selFiliale}  onChange={v => { setSelFiliale(v);  setSelSecteur([]); setSelActivite([]); setSelSite([]); }} />
            {secteursList.length  > 0 && <CheckGroup label="Secteur"  options={secteursList}  selected={selSecteur}  onChange={v => { setSelSecteur(v);  setSelActivite([]); setSelSite([]); }} />}
            {activitesList.length > 0 && <CheckGroup label="Activité" options={activitesList} selected={selActivite} onChange={v => { setSelActivite(v); setSelSite([]); }} />}
            {sitesList.length     > 1 && <CheckGroup label="Site"     options={sitesList}     selected={selSite}     onChange={setSelSite} />}
          </div>
          {filteredSiteIds && (
            <p className="text-xs text-indigo-600 font-medium mt-2">
              {mine.length} personne{mine.length > 1 ? "s" : ""} dans la sélection
            </p>
          )}
        </div>
      )}

      {/* ── Bloc principal : Salariés + Candidats ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* ═══ SALARIÉS ═══ */}
        <Section>
          <SectionHeader icon="👥" title="Salariés" color="#4F46E5"
            action="Voir la liste" onAction={() => setPage("salaries")} />
          <div className="p-4 space-y-4">

            {/* Sélecteur période */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Période</p>
              <PeriodSelector value={periodesSal} onChange={setPeriodesSal} />
            </div>

            {/* KPI cards */}
            <div className="flex gap-2">
              <KpiCard
                value={actifs.length}
                label="Actifs"
                pct={Math.round(actifs.length / (salAll.length || 1) * 100)}
                sub={`sur ${salAll.length} au total`}
                hex="#4F46E5"
                onClick={() => setPage("salaries")}
              />
              <KpiCard
                value={recrutesInPeriod.length}
                label="Recrutés"
                pct={Math.round(recrutesInPeriod.length / (actifs.length || 1) * 100)}
                sub={periodesSal !== "all" ? periodLabel(periodesSal) : "entrées total"}
                hex="#059669"
                onClick={() => setPage("salaries")}
              />
              <KpiCard
                value={sortisInPeriod.length}
                label="Sortis"
                pct={Math.round(sortisInPeriod.length / (salAll.length || 1) * 100)}
                sub={periodesSal !== "all" ? periodLabel(periodesSal) : `sur ${sortisAll.length} total`}
                hex="#DC2626"
                onClick={() => setPage("preco")}
              />
            </div>

            {/* Mini liste suivi RDV */}
            {dernierRdv.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Suivi RDV — priorité d'action
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {dernierRdv.slice(0, 5).map(({ sal, last }) => {
                    const badge = rdvBadge(last);
                    return (
                      <button key={sal.id}
                        onClick={() => { setSelectedSalarie(sal); setPage("fiche"); }}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-indigo-700">{sal.nom[0]}{sal.prenom[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{sal.nom} {sal.prenom}</p>
                          <p className="text-[10px] text-gray-400 truncate">
                            {last ? `${fmt(last.date)} · ${last.type}` : "Aucun entretien"}
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* ═══ CANDIDATS ═══ */}
        <Section>
          <SectionHeader icon="👤" title="Candidats"
            count={candidatsPeriod.length}
            color="#8B5CF6"
            action="Voir la liste" onAction={() => setPage("candidats")} />
          <div className="p-4 space-y-4">

            {/* Sélecteur période */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Période — candidatures reçues
              </p>
              <PeriodSelector value={periodesCand} onChange={setPeriodesCand} />
            </div>

            {candidatsPeriod.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">👤</p>
                <p className="text-sm text-gray-400">
                  {periodesCand !== "all" ? `Aucune candidature sur "${periodLabel(periodesCand)}"` : "Aucun candidat en cours"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Barres de pipeline avec % */}
                <div className="space-y-2">
                  {pipelineStats.map(p => (
                    <button key={p.key}
                      onClick={() => setPage("candidats")}
                      className="w-full group">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-gray-700 w-28 text-left shrink-0">{p.label}</span>
                        <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                            style={{ width: `${Math.max(p.pct, p.count > 0 ? 8 : 0)}%`, backgroundColor: p.hex }}>
                            {p.count > 0 && p.pct >= 15 && (
                              <span className="text-[10px] font-bold text-white">{p.pct}%</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 w-16 justify-end">
                          <span className="text-sm font-black" style={{ color: p.hex }}>{p.count}</span>
                          <span className="text-[10px] text-gray-400 font-medium">{p.pct}%</span>
                        </div>
                      </div>
                    </button>
                  ))}

                  {sansAvis > 0 && (
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-gray-400 w-28 text-left shrink-0">Sans avis</span>
                      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gray-300 transition-all duration-500"
                          style={{ width: `${Math.max(Math.round(sansAvis / totalCand * 100), 8)}%` }} />
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 w-16 justify-end">
                        <span className="text-sm font-black text-gray-400">{sansAvis}</span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {Math.round(sansAvis / totalCand * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dernières candidatures */}
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Dernières candidatures</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {[...candidatsPeriod]
                      .sort((a, b) => (b.candidatureRecueLe || "").localeCompare(a.candidatureRecueLe || ""))
                      .slice(0, 4)
                      .map(c => {
                        const p = PIPELINE.find(x => x.key === c.orientationCandidat);
                        return (
                          <button key={c.id}
                            onClick={() => { setSelectedSalarie(c); setPage("fiche"); }}
                            className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-purple-700">{c.nom[0]}{c.prenom[0]}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-800 truncate">{c.nom} {c.prenom}</p>
                              <p className="text-[10px] text-gray-400">{fmt(c.candidatureRecueLe) || "—"}</p>
                            </div>
                            {p && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                                style={{ backgroundColor: p.bg, color: p.hex, border: `1px solid ${p.border}` }}>
                                {p.label}
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* ── Cartes action ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Prochains entretiens */}
        <Section>
          <SectionHeader icon="📅" title="Prochains entretiens" count={prochains.length}
            color="#4F46E5" action="Planning" onAction={() => setPage("planning")} />
          <div className="p-3">
            {prochains.length === 0 ? (
              <p className="text-sm text-gray-300 text-center py-6">Aucun entretien planifié · 30 jours</p>
            ) : (
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {prochains.slice(0, 8).map(e => {
                  const sal = mine.find(s => s.id === e.salarie_id);
                  if (!sal) return null;
                  const d = daysUntil(e.date);
                  return (
                    <button key={e.id}
                      onClick={() => { setSelectedSalarie(sal); setPage("fiche"); }}
                      className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-indigo-700">{d === 0 ? "Auj." : `${d}j`}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{sal.nom} {sal.prenom}</p>
                        <p className="text-xs text-gray-400 truncate">{fmt(e.date)} · {e.type}</p>
                      </div>
                      {d === 0 && <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold shrink-0">Aujourd'hui</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Section>

        <div className="space-y-4">
          {/* Objectifs urgents */}
          <Section>
            <SectionHeader icon="🎯" title="Objectifs urgents" count={objDeadlines.length}
              color="#D97706" action="Planning" onAction={() => setPage("planning")} />
            <div className="p-3">
              {objDeadlines.length === 0 ? (
                <p className="text-sm text-gray-300 text-center py-4">Aucun objectif urgent ✓</p>
              ) : (
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {objDeadlines.slice(0, 5).map((o, i) => {
                    const d = daysUntil(o.deadline);
                    return (
                      <button key={i}
                        onClick={() => { if (o.sal) { setSelectedSalarie(o.sal); setPage("fiche"); } }}
                        className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors hover:opacity-90 ${urgC(d)}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">{o.intitule}</p>
                          <p className="text-[10px] truncate">{o.sal?.nom} {o.sal?.prenom}</p>
                        </div>
                        <span className="text-xs font-bold shrink-0">
                          {d < 0 ? `−${Math.abs(d)}j` : d === 0 ? "Auj." : `${d}j`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Section>

          {/* Fins de parcours */}
          <Section>
            <SectionHeader icon="⏳" title="Fins de parcours proches" count={finProches.length}
              color="#DC2626" action="Vue PRECO" onAction={() => setPage("preco")} />
            <div className="p-3">
              {finProches.length === 0 ? (
                <p className="text-sm text-gray-300 text-center py-4">Aucune fin proche ✓</p>
              ) : (
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {finProches.slice(0, 5).map(s => {
                    const d = daysUntil(s.dateFinContrat);
                    return (
                      <button key={s.id}
                        onClick={() => { setSelectedSalarie(s); setPage("fiche"); }}
                        className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100 hover:bg-red-100 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-red-900 truncate">{s.nom} {s.prenom}</p>
                        </div>
                        <span className="text-xs font-bold text-red-700 shrink-0 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full">
                          {d}j restants
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
