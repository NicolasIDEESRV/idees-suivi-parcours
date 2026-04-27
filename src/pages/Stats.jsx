import { useState, useMemo } from "react";
import { PRESCRIPTEURS, TYPES_SORTIE_ASP, NIVEAUX_LANGUE, MOYENS_TRANSPORT } from "../lib/constants";
import { getAge, dureeM, getScopeIds } from "../lib/utils";

// ─── Palette couleurs ─────────────────────────────────────────────────────────
const PALETTE = [
  "#4F46E5","#7C3AED","#2563EB","#0891B2","#059669",
  "#D97706","#DC2626","#DB2777","#65A30D","#9333EA",
];

// ─── Camembert SVG ────────────────────────────────────────────────────────────
function PieChart({ data, size = 160 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="text-xs text-gray-400 text-center py-4">Aucune donnée</p>;
  const r = size / 2 - 10;
  const cx = size / 2, cy = size / 2;
  let angle = -Math.PI / 2;
  const slices = data.filter(d => d.value > 0).map(d => {
    const startAngle = angle;
    const sweep = (d.value / total) * 2 * Math.PI;
    angle += sweep;
    return { ...d, startAngle, sweep };
  });
  const arc = (sa, sw, radius) => {
    const x1 = cx + radius * Math.cos(sa),  y1 = cy + radius * Math.sin(sa);
    const x2 = cx + radius * Math.cos(sa + sw), y2 = cy + radius * Math.sin(sa + sw);
    return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${sw > Math.PI ? 1 : 0} 1 ${x2} ${y2} Z`;
  };
  return (
    <div className="flex items-center gap-4 flex-wrap justify-center">
      <svg width={size} height={size} className="shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={arc(s.startAngle, s.sweep, r)} fill={s.color} className="hover:opacity-80 cursor-default">
            <title>{s.label} : {s.value} ({Math.round(s.value / total * 100)}%)</title>
          </path>
        ))}
        <circle cx={cx} cy={cy} r={r * 0.42} fill="white" />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#111827">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="#9CA3AF">total</text>
      </svg>
      <div className="space-y-1 min-w-0">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: s.color }} />
            <span className="text-gray-600 truncate max-w-[130px]">{s.label}</span>
            <span className="font-semibold text-gray-800 ml-auto pl-2">{s.value}</span>
            <span className="text-gray-400 w-8 text-right">{Math.round(s.value / total * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Barre de stat ────────────────────────────────────────────────────────────
function StatRow({ label, n, total, color = "#4F46E5", n2, total2, color2 = "#059669", compare = false }) {
  const pct  = total  > 0 ? Math.round(n  / total  * 100) : 0;
  const pct2 = total2 > 0 ? Math.round(n2 / total2 * 100) : 0;
  if (!compare) {
    return (
      <div className="py-1.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600 truncate mr-2">{label}</span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-bold text-gray-900">{n}</span>
            {total > 0 && <span className="text-xs text-gray-400 w-9 text-right">{pct}%</span>}
          </div>
        </div>
        {total > 0 && (
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
          </div>
        )}
      </div>
    );
  }
  // Mode comparatif : deux barres
  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600 truncate mr-2">{label}</span>
        <div className="flex items-center gap-3 text-xs shrink-0">
          <span className="font-bold text-indigo-700">{n} <span className="font-normal text-gray-400">({pct}%)</span></span>
          <span className="text-gray-200">|</span>
          <span className="font-bold text-emerald-700">{n2} <span className="font-normal text-gray-400">({pct2}%)</span></span>
        </div>
      </div>
      <div className="space-y-0.5">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct2}%`, background: color2 }} />
        </div>
      </div>
    </div>
  );
}

// ─── Carte ────────────────────────────────────────────────────────────────────
function Card({ title, children, span = 1 }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 p-4 ${span === 2 ? "md:col-span-2" : ""}`}>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{title}</h3>
      {children}
    </div>
  );
}

// ─── CheckGroup ───────────────────────────────────────────────────────────────
function CheckGroup({ label, options, selected, onChange }) {
  const toggle = (v) => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  const allOn  = selected.length === 0;
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => onChange([])}
          className={`px-2.5 py-1 rounded-lg border text-xs font-medium ${allOn ? "bg-indigo-600 text-white border-indigo-600" : "text-gray-500 border-gray-200 hover:border-indigo-300"}`}
        >Tous</button>
        {options.map(o => (
          <button key={o} onClick={() => toggle(o)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium ${selected.includes(o) ? "bg-indigo-600 text-white border-indigo-600" : "text-gray-600 border-gray-200 hover:border-indigo-300"}`}
          >{o}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Sélecteur de période ─────────────────────────────────────────────────────
function PeriodPicker({ from, to, onChange }) {
  const now = new Date(), yy = now.getFullYear(), mm = String(now.getMonth() + 1).padStart(2, "0");
  const shortcuts = [
    { label: "Cette année",     f: `${yy}-01-01`,    t: `${yy}-12-31`    },
    { label: "Année passée",    f: `${yy-1}-01-01`,  t: `${yy-1}-12-31`  },
    { label: "Ce mois",         f: `${yy}-${mm}-01`, t: `${yy}-${mm}-31` },
    { label: "6 derniers mois", f: new Date(new Date().setMonth(now.getMonth()-6)).toISOString().slice(0,10), t: new Date().toISOString().slice(0,10) },
    { label: "Tout",            f: "",               t: ""               },
  ];
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Période d'activité</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {shortcuts.map(s => (
          <button key={s.label} onClick={() => onChange(s.f, s.t)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium ${from === s.f && to === s.t ? "bg-indigo-600 text-white border-indigo-600" : "text-gray-500 border-gray-200 hover:border-indigo-300"}`}
          >{s.label}</button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input type="date" value={from} onChange={e => onChange(e.target.value, to)}
          className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300" />
        <span className="text-xs text-gray-400">→</span>
        <input type="date" value={to} onChange={e => onChange(from, e.target.value)}
          className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300" />
      </div>
    </div>
  );
}

// ─── Blocs de stats réutilisables ─────────────────────────────────────────────
function buildStats(pop) {
  const T = pop.length;
  return {
    T,
    age: [
      { l: "≤ 25 ans",   n: pop.filter(s => { const a = getAge(s.dateNaissance); return a && a <= 25; }).length },
      { l: "26 – 45 ans", n: pop.filter(s => { const a = getAge(s.dateNaissance); return a && a >= 26 && a <= 45; }).length },
      { l: "46 – 50 ans", n: pop.filter(s => { const a = getAge(s.dateNaissance); return a && a >= 46 && a <= 50; }).length },
      { l: "> 50 ans",   n: pop.filter(s => { const a = getAge(s.dateNaissance); return a && a > 50; }).length },
    ],
    niv: [
      { l: "Niv. 3 (CAP/BEP)", n: pop.filter(s => s.niveauFormation?.startsWith("Niveau 3")).length },
      { l: "Niv. 4 (Bac)",     n: pop.filter(s => s.niveauFormation?.startsWith("Niveau 4")).length },
      { l: "Niv. 5+ (Bac+2)", n: pop.filter(s => s.niveauFormation?.startsWith("Niveau 5")).length },
    ],
    presc: PRESCRIPTEURS.map(p => ({ l: p, n: pop.filter(s => s.prescripteur === p).length })).filter(x => x.n > 0),
    langue: NIVEAUX_LANGUE.map((l, i) => ({ label: l, value: pop.filter(s => s.niveauLangue === l).length, color: PALETTE[i] })).filter(d => d.value > 0),
    mob:    MOYENS_TRANSPORT.map((m, i) => ({ label: m, value: pop.filter(s => s.moyenTransport === m).length, color: PALETTE[i] })).filter(d => d.value > 0),
    publics: [
      { l: "DELD",         n: pop.filter(s => s.deld).length,        c: "#7C3AED" },
      { l: "BRSA",         n: pop.filter(s => s.brsa).length,        c: "#2563EB" },
      { l: "TH",           n: pop.filter(s => s.th).length,          c: "#0891B2" },
      { l: "ASS",          n: pop.filter(s => s.ass).length,         c: "#D97706" },
      { l: "Résident QPV", n: pop.filter(s => s.residentQPV).length, c: "#059669" },
    ],
    sexe: [
      { l: "Hommes",  n: pop.filter(s => s.sexe === "M").length },
      { l: "Femmes",  n: pop.filter(s => s.sexe === "F").length },
    ],
    permis: {
      avecPermis:  pop.filter(s =>  s.permisB).length,
      avecVehicule:pop.filter(s =>  s.vehicule).length,
      sansPermis:  pop.filter(s => !s.permisB && !s.vehicule).length,
    },
    cv:      pop.filter(s => s.cv).length,
    lecture: pop.filter(s => s.lecture).length,
    ecriture:pop.filter(s => s.ecriture).length,
    calcul:  pop.filter(s => s.calcul).length,
  };
}

// ─── Vue simple (entrée OU sortie) ────────────────────────────────────────────
function VueSimple({ pop, sortis, title, color }) {
  const s = buildStats(pop);
  const C = color;
  const sortieData = TYPES_SORTIE_ASP
    .map((t, i) => ({ label: t.label, value: sortis.filter(x => x.typeSortie === t.code).length, color: PALETTE[i % PALETTE.length] }))
    .filter(d => d.value > 0);
  const sp3 = sortis.filter(x => dureeM(x.dateEntree, x.dateSortie) >= 3);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

      {/* Âge */}
      <Card title="Tranches d'âge">
        {s.age.map(g => <StatRow key={g.l} label={g.l} n={g.n} total={s.T} color={C} />)}
      </Card>

      {/* Sexe */}
      <Card title="Répartition H/F">
        {s.sexe.map(g => <StatRow key={g.l} label={g.l} n={g.n} total={s.T} color={C} />)}
      </Card>

      {/* Publics prioritaires */}
      <Card title="Publics prioritaires">
        {s.publics.map(p => <StatRow key={p.l} label={p.l} n={p.n} total={s.T} color={p.c} />)}
      </Card>

      {/* Formation */}
      <Card title="Niveau de formation">
        {s.niv.map(g => <StatRow key={g.l} label={g.l} n={g.n} total={s.T} color={C} />)}
        <div className="border-t border-gray-100 mt-2 pt-2">
          <StatRow label="CV disponible" n={s.cv}       total={s.T} color="#059669" />
          <StatRow label="Lecture OK"    n={s.lecture}  total={s.T} color="#059669" />
          <StatRow label="Écriture OK"   n={s.ecriture} total={s.T} color="#059669" />
          <StatRow label="Calcul OK"     n={s.calcul}   total={s.T} color="#059669" />
        </div>
      </Card>

      {/* Mobilité */}
      <Card title="Mobilité">
        <StatRow label="Permis B"              n={s.permis.avecPermis}  total={s.T} color={C} />
        <StatRow label="Véhicule"              n={s.permis.avecVehicule} total={s.T} color={C} />
        <StatRow label="Ni permis ni véhicule" n={s.permis.sansPermis}  total={s.T} color="#DC2626" />
      </Card>

      {/* Prescripteurs */}
      <Card title="Prescripteurs">
        {s.presc.length === 0
          ? <p className="text-xs text-gray-400 text-center py-2">Non renseigné</p>
          : s.presc.map(p => <StatRow key={p.l} label={p.l} n={p.n} total={s.T} color={C} />)
        }
      </Card>

      {/* Langue */}
      <Card title="Niveau de langue">
        <PieChart data={s.langue} size={150} />
      </Card>

      {/* Transport */}
      <Card title="Moyen de transport">
        <PieChart data={s.mob} size={150} />
      </Card>

      {/* Sorties */}
      {sortis.length > 0 && (
        <Card title={`Types de sortie — +3 mois (${sp3.length})`}>
          {sp3.length > 0
            ? <PieChart data={sortieData} size={150} />
            : <p className="text-xs text-gray-400 text-center py-4">Aucune sortie +3 mois</p>}
          <div className="border-t border-gray-100 mt-3 pt-3">
            <StatRow label="Sorties ≥ 3 mois" n={sp3.length}                total={sortis.length} color="#059669" />
            <StatRow label="Sorties < 3 mois"  n={sortis.length - sp3.length} total={sortis.length} color="#DC2626" />
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Vue Comparatif ───────────────────────────────────────────────────────────
function VueComparatif({ popE, popS }) {
  const e = buildStats(popE);
  const s = buildStats(popS);
  const CE = "#4F46E5", CS = "#059669";

  const CompCard = ({ title, rows }) => (
    <Card title={title}>
      <div className="flex text-xs font-semibold mb-2">
        <span className="flex-1 text-gray-400 uppercase tracking-wide text-[10px]">Indicateur</span>
        <span className="text-indigo-600 w-20 text-right">Entrée</span>
        <span className="text-emerald-600 w-20 text-right">Sortie</span>
      </div>
      {rows.map(({ l, nE, nS, cE = CE, cS = CS }) => (
        <StatRow key={l} compare label={l} n={nE} total={e.T} color={cE} n2={nS} total2={s.T} color2={cS} />
      ))}
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Légende */}
      <div className="flex gap-4 text-xs font-semibold">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" /> À l'entrée ({e.T})</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> À la sortie ({s.T})</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

        <CompCard title="Tranches d'âge" rows={e.age.map((g, i) => ({ l: g.l, nE: g.n, nS: s.age[i]?.n ?? 0 }))} />

        <CompCard title="Répartition H/F" rows={e.sexe.map((g, i) => ({ l: g.l, nE: g.n, nS: s.sexe[i]?.n ?? 0 }))} />

        <CompCard title="Publics prioritaires" rows={e.publics.map((p, i) => ({ l: p.l, nE: p.n, nS: s.publics[i]?.n ?? 0, cE: p.c, cS: p.c }))} />

        <CompCard title="Niveau de formation" rows={[
          ...e.niv.map((g, i) => ({ l: g.l, nE: g.n, nS: s.niv[i]?.n ?? 0 })),
          { l: "CV", nE: e.cv, nS: s.cv },
        ]} />

        <CompCard title="Mobilité" rows={[
          { l: "Permis B",              nE: e.permis.avecPermis,  nS: s.permis.avecPermis  },
          { l: "Véhicule",              nE: e.permis.avecVehicule,nS: s.permis.avecVehicule},
          { l: "Ni permis ni véhicule", nE: e.permis.sansPermis,  nS: s.permis.sansPermis, cE:"#DC2626", cS:"#DC2626" },
        ]} />

        <CompCard title="Prescripteurs" rows={
          PRESCRIPTEURS.map(p => ({
            l:  p,
            nE: e.presc.find(x => x.l === p)?.n ?? 0,
            nS: s.presc.find(x => x.l === p)?.n ?? 0,
          })).filter(r => r.nE > 0 || r.nS > 0)
        } />
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function Stats({ user, salaries, sites = [] }) {
  const now = new Date().getFullYear();

  const [selFilialeS,  setSelFilialeS]  = useState([]);
  const [selSecteurS,  setSelSecteurS]  = useState([]);
  const [selActiviteS, setSelActiviteS] = useState([]);
  const [selSiteS,     setSelSiteS]     = useState([]);
  const [periodFrom, setPeriodFrom] = useState(`${now}-01-01`);
  const [periodTo,   setPeriodTo]   = useState(`${now}-12-31`);
  const [modeVue,    setModeVue]    = useState("entree"); // entree | sortie | comparatif

  const filialesList  = [...new Set(sites.map(s => s.filiale).filter(Boolean))].sort();
  const secteursList  = [...new Set(sites.filter(s => selFilialeS.length === 0 || selFilialeS.includes(s.filiale)).map(s => s.secteur).filter(Boolean))].sort();
  const activitesList = [...new Set(sites.filter(s => (selFilialeS.length === 0 || selFilialeS.includes(s.filiale)) && (selSecteurS.length === 0 || selSecteurS.includes(s.secteur))).map(s => s.activite).filter(Boolean))].sort();
  const sitesList     = [...new Set(sites.filter(s => (selFilialeS.length === 0 || selFilialeS.includes(s.filiale)) && (selSecteurS.length === 0 || selSecteurS.includes(s.secteur)) && (selActiviteS.length === 0 || selActiviteS.includes(s.activite))).map(s => s.nom).filter(Boolean))].sort();

  const filteredSiteIds = useMemo(() => {
    if (!selFilialeS.length && !selSecteurS.length && !selActiviteS.length && !selSiteS.length) return null;
    return sites.filter(s =>
      (!selFilialeS.length  || selFilialeS.includes(s.filiale))  &&
      (!selSecteurS.length  || selSecteurS.includes(s.secteur))  &&
      (!selActiviteS.length || selActiviteS.includes(s.activite)) &&
      (!selSiteS.length     || selSiteS.includes(s.nom))
    ).map(s => s.id);
  }, [sites, selFilialeS, selSecteurS, selActiviteS, selSiteS]);

  // Population de base (scope + période)
  const allFiltered = useMemo(() => {
    const scopeIds = getScopeIds(user, sites);
    let base = scopeIds === null ? salaries : salaries.filter(s => scopeIds.includes(s.site_id));
    if (filteredSiteIds !== null) base = base.filter(s => filteredSiteIds.includes(s.site_id));
    if (periodFrom || periodTo) {
      base = base.filter(s => {
        const entree = s.dateEntree ? new Date(s.dateEntree) : null;
        const sortie = s.dateSortie ? new Date(s.dateSortie) : null;
        const pFrom  = periodFrom   ? new Date(periodFrom)   : null;
        const pTo    = periodTo     ? new Date(periodTo)     : null;
        if (!entree) return false;
        return (!pTo || entree <= pTo) && (!pFrom || !sortie || sortie >= pFrom);
      });
    }
    return base;
  }, [salaries, user, filteredSiteIds, periodFrom, periodTo]);

  const popEntree = useMemo(() => allFiltered.filter(s => !s.dateSortie), [allFiltered]);
  const popSortie = useMemo(() => allFiltered.filter(s =>  s.dateSortie), [allFiltered]);

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Bandeau filtres sticky ── */}
      <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 px-6 pt-4 pb-4 shadow-sm">
        <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Statistiques</h1>
            <p className="text-xs text-gray-400">
              {allFiltered.length} salarié{allFiltered.length > 1 ? "s" : ""} dans la période ·
              {" "}{popEntree.length} actif{popEntree.length > 1 ? "s" : ""} ·
              {" "}{popSortie.length} sorti{popSortie.length > 1 ? "s" : ""}
            </p>
          </div>
          {/* Toggle vue */}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden text-xs font-semibold bg-white">
            {[
              { v: "entree",      l: "À l'entrée",  desc: `${popEntree.length} actifs` },
              { v: "sortie",      l: "À la sortie", desc: `${popSortie.length} sortis` },
              { v: "comparatif",  l: "Comparatif",  desc: "" },
            ].map(({ v, l, desc }) => (
              <button key={v} onClick={() => setModeVue(v)}
                className={`px-4 py-2 transition-colors flex flex-col items-center leading-tight ${modeVue === v ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
              >
                <span>{l}</span>
                {desc && <span className={`text-[10px] font-normal ${modeVue === v ? "text-indigo-200" : "text-gray-400"}`}>{desc}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {filialesList.length > 0 && <CheckGroup label="Filiale" options={filialesList} selected={selFilialeS} onChange={v => { setSelFilialeS(v); setSelSecteurS([]); setSelActiviteS([]); setSelSiteS([]); }} />}
          {secteursList.length > 0  && <CheckGroup label="Secteur" options={secteursList} selected={selSecteurS} onChange={v => { setSelSecteurS(v); setSelActiviteS([]); setSelSiteS([]); }} />}
          {activitesList.length > 0 && <CheckGroup label="Activité" options={activitesList} selected={selActiviteS} onChange={v => { setSelActiviteS(v); setSelSiteS([]); }} />}
          {sitesList.length > 1     && <CheckGroup label="Site" options={sitesList} selected={selSiteS} onChange={setSelSiteS} />}
          <PeriodPicker from={periodFrom} to={periodTo} onChange={(f, t) => { setPeriodFrom(f); setPeriodTo(t); }} />
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="p-6">
        {allFiltered.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">Aucun salarié correspondant aux filtres.</div>
        )}

        {allFiltered.length > 0 && modeVue === "entree" && (
          <VueSimple pop={popEntree} sortis={[]} title="À l'entrée" color="#4F46E5" />
        )}
        {allFiltered.length > 0 && modeVue === "sortie" && (
          <VueSimple pop={popSortie} sortis={popSortie} title="À la sortie" color="#059669" />
        )}
        {allFiltered.length > 0 && modeVue === "comparatif" && (
          <VueComparatif popE={popEntree} popS={popSortie} />
        )}
      </div>
    </div>
  );
}
