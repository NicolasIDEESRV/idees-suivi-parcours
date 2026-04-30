import { useState, useMemo } from "react";
import { PRESCRIPTEURS, TYPES_SORTIE_ASP, NIVEAUX_LANGUE, MOYENS_TRANSPORT, FREINS } from "../lib/constants";
import { getAge, dureeM, getScopeIds } from "../lib/utils";

// ─── Groupes de sortie ────────────────────────────────────────────────────────
const SORTIE_GROUPES = [
  {
    label:      "Sorties dynamiques",
    icon:       "↗",
    colorText:  "text-emerald-700",
    colorBg:    "bg-emerald-50",
    colorBdr:   "border-emerald-200",
    barColor:   "#059669",
    subGroups: [
      { label: "Durables",    cat: "Emplois durables",      color: "#059669", bar: "bg-emerald-500" },
      { label: "Transition",  cat: "Emplois de transition", color: "#10B981", bar: "bg-emerald-400" },
      { label: "Positives",   cat: "Sorties positives",     color: "#34D399", bar: "bg-emerald-300" },
    ],
  },
  {
    label:      "Autres sorties",
    icon:       "→",
    colorText:  "text-amber-700",
    colorBg:    "bg-amber-50",
    colorBdr:   "border-amber-200",
    barColor:   "#D97706",
    subGroups: [
      { label: "Autres",      cat: "Autres sorties",        color: "#D97706", bar: "bg-amber-400" },
    ],
  },
  {
    label:      "Retraits",
    icon:       "↙",
    colorText:  "text-red-700",
    colorBg:    "bg-red-50",
    colorBdr:   "border-red-200",
    barColor:   "#DC2626",
    subGroups: [
      { label: "Retraits",    cat: "Retraits",              color: "#DC2626", bar: "bg-red-400" },
    ],
  },
];

// Couleur de camembert par type
const PALETTE = [
  "#059669","#10B981","#34D399","#6EE7B7",
  "#D97706","#F59E0B","#FCD34D",
  "#DC2626","#F87171","#FCA5A5",
  "#4F46E5","#7C3AED","#2563EB",
];

// ─── Mini barre horizontale ───────────────────────────────────────────────────
function MiniBar({ n, total, color = "#4F46E5", label, sub }) {
  const pct = total > 0 ? Math.round(n / total * 100) : 0;
  return (
    <div className="py-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600 truncate mr-2">{label}{sub && <span className="text-gray-400 ml-1">{sub}</span>}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold text-gray-900">{n}</span>
          {total > 0 && <span className="text-xs text-gray-400 w-9 text-right">{pct}%</span>}
        </div>
      </div>
      {total > 0 && (
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
        </div>
      )}
    </div>
  );
}

// ─── Barre comparative (deux populations) ────────────────────────────────────
function CompareBar({ label, nE, totalE, nS, totalS }) {
  const pE = totalE > 0 ? Math.round(nE / totalE * 100) : 0;
  const pS = totalS > 0 ? Math.round(nS / totalS * 100) : 0;
  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600 truncate mr-2">{label}</span>
        <div className="flex items-center gap-2 text-xs shrink-0">
          <span className="font-bold text-indigo-700 w-14 text-right">{nE} <span className="font-normal text-gray-400">({pE}%)</span></span>
          <span className="text-gray-200">|</span>
          <span className="font-bold text-emerald-700 w-14 text-right">{nS} <span className="font-normal text-gray-400">({pS}%)</span></span>
        </div>
      </div>
      <div className="space-y-0.5">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pE}%` }} />
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pS}%` }} />
        </div>
      </div>
    </div>
  );
}

// ─── Camembert SVG ────────────────────────────────────────────────────────────
function PieChart({ data, size = 140 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="text-xs text-gray-300 text-center py-4">Aucune donnée</p>;
  const r = size / 2 - 8;
  const cx = size / 2, cy = size / 2;
  let angle = -Math.PI / 2;
  const slices = data.filter(d => d.value > 0).map(d => {
    const sa = angle;
    const sw = (d.value / total) * 2 * Math.PI;
    angle += sw;
    return { ...d, sa, sw };
  });
  const arc = (sa, sw) => {
    const x1 = cx + r * Math.cos(sa), y1 = cy + r * Math.sin(sa);
    const x2 = cx + r * Math.cos(sa + sw), y2 = cy + r * Math.sin(sa + sw);
    return `M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 ${sw > Math.PI ? 1 : 0} 1 ${x2} ${y2}Z`;
  };
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <svg width={size} height={size} className="shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={arc(s.sa, s.sw)} fill={s.color}>
            <title>{s.label} : {s.value} ({Math.round(s.value / total * 100)}%)</title>
          </path>
        ))}
        <circle cx={cx} cy={cy} r={r * 0.45} fill="white" />
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#111827">{total}</text>
        <text x={cx} y={cy + 9} textAnchor="middle" fontSize="8" fill="#9CA3AF">total</text>
      </svg>
      <div className="space-y-1 min-w-0 flex-1">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
            <span className="text-gray-600 truncate flex-1">{s.label}</span>
            <span className="font-semibold text-gray-800">{s.value}</span>
            <span className="text-gray-400 w-8 text-right">{Math.round(s.value / total * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Carte stats ──────────────────────────────────────────────────────────────
function Card({ title, children, span = 1, accent }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 overflow-hidden ${span === 2 ? "md:col-span-2" : ""}`}>
      {accent && <div className="h-1" style={{ background: accent }} />}
      <div className="p-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
        {children}
      </div>
    </div>
  );
}

// ─── KPI ──────────────────────────────────────────────────────────────────────
function Kpi({ label, value, sub, color = "#4F46E5", icon }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3">
      {icon && (
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg" style={{ background: color + "18" }}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-2xl font-black leading-none" style={{ color }}>{value}</p>
        <p className="text-xs font-semibold text-gray-500 mt-0.5 truncate">{label}</p>
        {sub && <p className="text-xs text-gray-400 truncate">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Bloc "Types de sortie" par catégorie ─────────────────────────────────────
function SortiesCategorisees({ sortis }) {
  const total = sortis.length;
  if (total === 0) return <p className="text-xs text-gray-300 text-center py-8">Aucune sortie dans la période</p>;

  const getCatCount = (cat) =>
    TYPES_SORTIE_ASP.filter(t => t.categorie === cat)
      .reduce((s, t) => s + sortis.filter(x => x.typeSortie === t.code).length, 0);

  const getCodeCount = (code) => sortis.filter(x => x.typeSortie === code).length;

  return (
    <div className="space-y-3">
      {SORTIE_GROUPES.map(groupe => {
        const groupTotal = groupe.subGroups.reduce((s, sg) => s + getCatCount(sg.cat), 0);
        const pct = total > 0 ? Math.round(groupTotal / total * 100) : 0;
        if (groupTotal === 0) return null;

        return (
          <div key={groupe.label} className={`rounded-xl border p-3 ${groupe.colorBg} ${groupe.colorBdr}`}>
            {/* En-tête groupe */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className={`text-base font-bold ${groupe.colorText}`}>{groupe.icon}</span>
                <span className={`text-sm font-bold ${groupe.colorText}`}>{groupe.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-black ${groupe.colorText}`}>{groupTotal}</span>
                <span className="text-xs text-gray-400">{pct}%</span>
              </div>
            </div>

            {/* Barre globale groupe */}
            <div className="h-2 bg-white/60 rounded-full overflow-hidden mb-3">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: groupe.barColor }} />
            </div>

            {/* Sous-groupes */}
            <div className="space-y-2">
              {groupe.subGroups.map(sg => {
                const sgCount = getCatCount(sg.cat);
                if (sgCount === 0) return null;
                const codes = TYPES_SORTIE_ASP.filter(t => t.categorie === sg.cat);
                return (
                  <div key={sg.cat}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: sg.color }} />
                      <span className="text-xs font-semibold text-gray-600">{sg.label}</span>
                      <span className="text-xs text-gray-400 ml-auto">{sgCount} · {Math.round(sgCount / total * 100)}%</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-3.5">
                      {codes.map(t => {
                        const n = getCodeCount(t.code);
                        if (n === 0) return null;
                        return (
                          <span key={t.code} className="text-xs bg-white/80 border border-current/20 px-2 py-0.5 rounded-full font-medium" style={{ color: sg.color }}>
                            {t.label} <strong>{n}</strong>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Sorties sans type renseigné */}
      {sortis.filter(x => !x.typeSortie).length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200">
          <span className="text-xs text-gray-400">Non renseigné :</span>
          <span className="text-sm font-bold text-gray-500">{sortis.filter(x => !x.typeSortie).length}</span>
        </div>
      )}
    </div>
  );
}

// ─── Filtre sous forme de chips ───────────────────────────────────────────────
function CheckGroup({ label, options, selected, onChange }) {
  const allOn = selected.length === 0;
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1">
        <button onClick={() => onChange([])}
          className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${allOn ? "bg-indigo-600 text-white border-indigo-600" : "text-gray-500 border-gray-200 hover:border-indigo-300"}`}
        >Tous</button>
        {options.map(o => (
          <button key={o} onClick={() => onChange(selected.includes(o) ? selected.filter(x => x !== o) : [...selected, o])}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${selected.includes(o) ? "bg-indigo-600 text-white border-indigo-600" : "text-gray-600 border-gray-200 hover:border-indigo-300"}`}
          >{o}</button>
        ))}
      </div>
    </div>
  );
}

function PeriodPicker({ from, to, onChange }) {
  const now = new Date(), yy = now.getFullYear(), mm = String(now.getMonth() + 1).padStart(2, "0");
  const shortcuts = [
    { label: "Cette année",     f: `${yy}-01-01`,    t: `${yy}-12-31`    },
    { label: "Année passée",    f: `${yy-1}-01-01`,  t: `${yy-1}-12-31`  },
    { label: "6 derniers mois", f: new Date(new Date().setMonth(now.getMonth()-6)).toISOString().slice(0,10), t: new Date().toISOString().slice(0,10) },
    { label: "Tout",            f: "",               t: ""               },
  ];
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Période</p>
      <div className="flex flex-wrap gap-1 mb-2">
        {shortcuts.map(s => (
          <button key={s.label} onClick={() => onChange(s.f, s.t)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${from === s.f && to === s.t ? "bg-indigo-600 text-white border-indigo-600" : "text-gray-500 border-gray-200 hover:border-indigo-300"}`}
          >{s.label}</button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input type="date" value={from} onChange={e => onChange(e.target.value, to)}
          className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300" />
        <span className="text-xs text-gray-300">→</span>
        <input type="date" value={to} onChange={e => onChange(from, e.target.value)}
          className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300" />
      </div>
    </div>
  );
}

// ─── Calcul stats ─────────────────────────────────────────────────────────────
function buildStats(pop) {
  const T = pop.length;
  return {
    T,
    age: [
      { l: "≤ 25 ans",    n: pop.filter(s => { const a = getAge(s.dateNaissance); return a && a <= 25; }).length },
      { l: "26 – 45 ans", n: pop.filter(s => { const a = getAge(s.dateNaissance); return a && a >= 26 && a <= 45; }).length },
      { l: "46 – 50 ans", n: pop.filter(s => { const a = getAge(s.dateNaissance); return a && a >= 46 && a <= 50; }).length },
      { l: "> 50 ans",    n: pop.filter(s => { const a = getAge(s.dateNaissance); return a && a > 50; }).length },
    ],
    niv: [
      { l: "Niv. 3 (CAP/BEP)", n: pop.filter(s => s.niveauFormation?.startsWith("Niveau 3")).length },
      { l: "Niv. 4 (Bac)",     n: pop.filter(s => s.niveauFormation?.startsWith("Niveau 4")).length },
      { l: "Niv. 5+ (Bac+2)",  n: pop.filter(s => s.niveauFormation?.startsWith("Niveau 5")).length },
    ],
    presc: PRESCRIPTEURS.map(p => ({ l: p, n: pop.filter(s => s.prescripteur === p).length })).filter(x => x.n > 0),
    langue: NIVEAUX_LANGUE.map((l, i) => ({ label: l, value: pop.filter(s => s.niveauLangue === l).length, color: PALETTE[i] })).filter(d => d.value > 0),
    mob:    MOYENS_TRANSPORT.map((m, i) => ({ label: m, value: pop.filter(s => s.moyenTransport === m).length, color: PALETTE[i] })).filter(d => d.value > 0),
    publics: [
      { l: "DELD",         n: pop.filter(s => s.deld).length,         c: "#7C3AED" },
      { l: "BRSA",         n: pop.filter(s => s.brsa).length,         c: "#2563EB" },
      { l: "TH",           n: pop.filter(s => s.th).length,           c: "#0891B2" },
      { l: "RQTH",         n: pop.filter(s => s.rqth).length,         c: "#0E7490" },
      { l: "ASS",          n: pop.filter(s => s.ass).length,          c: "#D97706" },
      { l: "Résident QPV", n: pop.filter(s => s.residentQPV).length,  c: "#059669" },
    ],
    sexe: [
      { l: "Femmes",  n: pop.filter(s => s.sexe === "F").length, c: "#DB2777" },
      { l: "Hommes",  n: pop.filter(s => s.sexe === "M").length, c: "#2563EB" },
    ],
    permis: {
      avecPermis:   pop.filter(s =>  s.permisB).length,
      avecVehicule: pop.filter(s =>  s.vehicule).length,
      sansPermis:   pop.filter(s => !s.permisB && !s.vehicule).length,
    },
    cv:       pop.filter(s => s.cv).length,
    freins: {
      entree: FREINS.map(f => ({
        f,
        ok:     pop.filter(s => s.freinsEntree?.[f] === "OK").length,
        cours:  pop.filter(s => s.freinsEntree?.[f] === "EN COURS").length,
        traiter:pop.filter(s => s.freinsEntree?.[f] === "À TRAITER").length,
        id:     pop.filter(s => s.freinsEntree?.[f] === "IDENTIFIÉ").length,
      })),
      sortie: FREINS.map(f => ({
        f,
        resolu:    pop.filter(s => s.freinsSortie?.[f] === "RÉSOLU").length,
        cours:     pop.filter(s => s.freinsSortie?.[f] === "EN COURS").length,
        toujours:  pop.filter(s => s.freinsSortie?.[f] === "TOUJOURS EXISTANT").length,
      })),
    },
  };
}

// ─── Vue entrée ───────────────────────────────────────────────────────────────
function VueEntree({ pop }) {
  const s = buildStats(pop);
  const C = "#4F46E5";

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Salariés actifs"  value={s.T}    color="#4F46E5" icon="👥" />
        <Kpi label="Femmes"   value={`${s.T > 0 ? Math.round(s.sexe[0].n/s.T*100) : 0}%`} sub={`${s.sexe[0].n} / ${s.T}`} color="#DB2777" icon="👩" />
        <Kpi label="Publics prioritaires" value={s.publics.reduce((a,p)=>a+p.n,0)} sub="DELD · BRSA · TH · ASS" color="#7C3AED" icon="⭐" />
        <Kpi label="Avec CV"  value={`${s.T > 0 ? Math.round(s.cv/s.T*100) : 0}%`} sub={`${s.cv} salariés`} color="#059669" icon="📄" />
      </div>

      {/* Grille cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

        <Card title="Tranches d'âge" accent={C}>
          {s.age.map(g => <MiniBar key={g.l} label={g.l} n={g.n} total={s.T} color={C} />)}
        </Card>

        <Card title="Répartition Femmes / Hommes" accent="#DB2777">
          {s.sexe.map(g => <MiniBar key={g.l} label={g.l} n={g.n} total={s.T} color={g.c} />)}
        </Card>

        <Card title="Publics prioritaires" accent="#7C3AED">
          {s.publics.map(p => <MiniBar key={p.l} label={p.l} n={p.n} total={s.T} color={p.c} />)}
        </Card>

        <Card title="Niveau de langue" accent="#0891B2">
          <PieChart data={s.langue} size={130} />
        </Card>

        <Card title="Moyen de transport" accent="#D97706">
          <PieChart data={s.mob} size={130} />
        </Card>

        <Card title="Mobilité" accent="#059669">
          <MiniBar label="Permis B"              n={s.permis.avecPermis}   total={s.T} color="#059669" />
          <MiniBar label="Véhicule"              n={s.permis.avecVehicule} total={s.T} color="#059669" />
          <MiniBar label="Ni permis ni véhicule" n={s.permis.sansPermis}   total={s.T} color="#DC2626" />
        </Card>

        <Card title="Niveau de formation" accent={C}>
          {s.niv.map(g => <MiniBar key={g.l} label={g.l} n={g.n} total={s.T} color={C} />)}
        </Card>

        <Card title="Prescripteurs" accent="#9333EA">
          {s.presc.length === 0
            ? <p className="text-xs text-gray-300 text-center py-2">Non renseigné</p>
            : s.presc.sort((a,b) => b.n - a.n).map(p => <MiniBar key={p.l} label={p.l} n={p.n} total={s.T} color="#9333EA" />)}
        </Card>

      </div>
    </div>
  );
}

// ─── Vue sortie ───────────────────────────────────────────────────────────────
function VueSortie({ sortis }) {
  const s = buildStats(sortis);
  const sp3 = sortis.filter(x => dureeM(x.dateEntree, x.dateSortie) >= 3);
  const C = "#059669";

  // Taux de sortie dynamique
  const nbDyn = SORTIE_GROUPES[0].subGroups.reduce((acc, sg) => {
    return acc + TYPES_SORTIE_ASP
      .filter(t => t.categorie === sg.cat)
      .reduce((s, t) => s + sortis.filter(x => x.typeSortie === t.code).length, 0);
  }, 0);
  const tauxDyn = sortis.length > 0 ? Math.round(nbDyn / sortis.length * 100) : 0;
  const dureeMoy = sortis.length > 0
    ? (sortis.reduce((acc, s) => acc + (dureeM(s.dateEntree, s.dateSortie) || 0), 0) / sortis.length).toFixed(1)
    : "—";

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Salariés sortis"   value={sortis.length} color="#059669" icon="🏁" />
        <Kpi label="Sorties +3 mois"   value={sp3.length} sub={`${sortis.length > 0 ? Math.round(sp3.length/sortis.length*100) : 0}% du total`} color="#0891B2" icon="⏱" />
        <Kpi label="Sorties dynamiques" value={`${tauxDyn}%`} sub={`${nbDyn} sur ${sortis.length}`} color="#059669" icon="↗" />
        <Kpi label="Durée moy. parcours" value={`${dureeMoy} m`} sub="mois moyens" color="#7C3AED" icon="📅" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

        {/* Types de sortie — carte centrale */}
        <Card title="Types de sortie" span={2} accent="#059669">
          <SortiesCategorisees sortis={sortis} />
        </Card>

        <Card title="Répartition H/F" accent="#DB2777">
          {s.sexe.map(g => <MiniBar key={g.l} label={g.l} n={g.n} total={s.T} color={g.c} />)}
        </Card>

        <Card title="Publics prioritaires" accent="#7C3AED">
          {s.publics.map(p => <MiniBar key={p.l} label={p.l} n={p.n} total={s.T} color={p.c} />)}
        </Card>

        <Card title="Durée de parcours" accent="#0891B2">
          {[
            { l: "< 3 mois",   n: sortis.filter(x => dureeM(x.dateEntree, x.dateSortie) < 3).length },
            { l: "3 – 6 mois", n: sortis.filter(x => { const d = dureeM(x.dateEntree, x.dateSortie); return d >= 3 && d < 6; }).length },
            { l: "6 – 12 mois",n: sortis.filter(x => { const d = dureeM(x.dateEntree, x.dateSortie); return d >= 6 && d < 12; }).length },
            { l: "> 12 mois",  n: sortis.filter(x => dureeM(x.dateEntree, x.dateSortie) >= 12).length },
          ].map(g => <MiniBar key={g.l} label={g.l} n={g.n} total={s.T} color="#0891B2" />)}
        </Card>

        <Card title="Niveau de langue à la sortie" accent="#0891B2">
          <PieChart data={s.langue} size={130} />
        </Card>

        <Card title="Prescripteurs" accent="#9333EA">
          {s.presc.length === 0
            ? <p className="text-xs text-gray-300 text-center py-2">Non renseigné</p>
            : s.presc.sort((a,b) => b.n - a.n).map(p => <MiniBar key={p.l} label={p.l} n={p.n} total={s.T} color="#9333EA" />)}
        </Card>

      </div>
    </div>
  );
}

// ─── Vue comparatif (simplifiée : langue, transport, mobilité, freins) ────────
function VueComparatif({ popE, popS }) {
  const e = buildStats(popE);
  const s = buildStats(popS);

  if (e.T === 0 && s.T === 0) return (
    <p className="text-center py-16 text-gray-400 text-sm">Aucune donnée pour le comparatif</p>
  );

  return (
    <div className="space-y-4">
      {/* Légende */}
      <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3 flex gap-6 text-sm flex-wrap">
        <span className="flex items-center gap-2 font-semibold">
          <span className="w-4 h-3 rounded bg-indigo-500 inline-block" />
          <span className="text-indigo-700">À l'entrée</span>
          <span className="text-gray-400 font-normal">({e.T} actifs)</span>
        </span>
        <span className="flex items-center gap-2 font-semibold">
          <span className="w-4 h-3 rounded bg-emerald-500 inline-block" />
          <span className="text-emerald-700">À la sortie</span>
          <span className="text-gray-400 font-normal">({s.T} sortis)</span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        {/* Niveau de langue */}
        <Card title="Niveau de langue" accent="#0891B2">
          {NIVEAUX_LANGUE.map(l => {
            const nE = e.langue.find(x => x.label === l)?.value ?? 0;
            const nS = s.langue.find(x => x.label === l)?.value ?? 0;
            if (nE === 0 && nS === 0) return null;
            return <CompareBar key={l} label={l} nE={nE} totalE={e.T} nS={nS} totalS={s.T} />;
          })}
        </Card>

        {/* Moyen de transport */}
        <Card title="Moyen de transport" accent="#D97706">
          {MOYENS_TRANSPORT.map(m => {
            const nE = e.mob.find(x => x.label === m)?.value ?? 0;
            const nS = s.mob.find(x => x.label === m)?.value ?? 0;
            if (nE === 0 && nS === 0) return null;
            return <CompareBar key={m} label={m} nE={nE} totalE={e.T} nS={nS} totalS={s.T} />;
          })}
        </Card>

        {/* Mobilité */}
        <Card title="Mobilité" accent="#059669">
          <CompareBar label="Permis B"              nE={e.permis.avecPermis}   totalE={e.T} nS={s.permis.avecPermis}   totalS={s.T} />
          <CompareBar label="Véhicule"              nE={e.permis.avecVehicule} totalE={e.T} nS={s.permis.avecVehicule} totalS={s.T} />
          <CompareBar label="Ni permis ni véhicule" nE={e.permis.sansPermis}   totalE={e.T} nS={s.permis.sansPermis}   totalS={s.T} />
        </Card>

        {/* Freins identifiés */}
        <Card title="Freins — résolution" accent="#7C3AED">
          <div className="space-y-1 mb-3">
            <div className="flex text-[10px] font-bold text-gray-400 uppercase tracking-wide gap-2">
              <span className="flex-1">Frein</span>
              <span className="w-16 text-right text-indigo-500">OK entrée</span>
              <span className="w-16 text-right text-emerald-500">Résolu sortie</span>
            </div>
            {FREINS.map(f => {
              const okE  = e.freins.entree.find(x => x.f === f)?.ok ?? 0;
              const resS = s.freins.sortie.find(x => x.f === f)?.resolu ?? 0;
              return (
                <div key={f} className="flex items-center gap-2 py-0.5 text-xs">
                  <span className="flex-1 text-gray-600 truncate">{f}</span>
                  <div className="w-16 text-right">
                    <span className="font-semibold text-indigo-700">{okE}</span>
                    <span className="text-gray-400 ml-0.5">{e.T > 0 ? `(${Math.round(okE/e.T*100)}%)` : ""}</span>
                  </div>
                  <div className="w-16 text-right">
                    <span className="font-semibold text-emerald-700">{resS}</span>
                    <span className="text-gray-400 ml-0.5">{s.T > 0 ? `(${Math.round(resS/s.T*100)}%)` : ""}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-400 border-t border-gray-100 pt-2">
            OK entrée = frein déjà levé à l'arrivée · Résolu sortie = frein levé pendant le parcours
          </p>
        </Card>

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
  const [modeVue,    setModeVue]    = useState("entree");

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

  const allFiltered = useMemo(() => {
    const scopeIds = getScopeIds(user, sites);
    let base = scopeIds === null ? salaries : salaries.filter(s => scopeIds.includes(s.site_id));
    base = base.filter(s => !s.isCandidat); // pas les candidats
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
  }, [salaries, user, sites, filteredSiteIds, periodFrom, periodTo]);

  const popEntree = useMemo(() => allFiltered.filter(s => !s.dateSortie), [allFiltered]);
  const popSortie = useMemo(() => allFiltered.filter(s =>  s.dateSortie), [allFiltered]);

  const VUES = [
    { v: "entree",     l: "À l'entrée",   desc: `${popEntree.length} actifs`,  color: "#4F46E5" },
    { v: "sortie",     l: "À la sortie",  desc: `${popSortie.length} sortis`,  color: "#059669" },
    { v: "comparatif", l: "Comparatif",   desc: "Évolution",                   color: "#7C3AED" },
  ];
  const vueActive = VUES.find(v => v.v === modeVue);

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Header sticky ── */}
      <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 px-6 pt-4 pb-4 shadow-sm">

        {/* Titre + toggle vue */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Statistiques</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {allFiltered.length} salarié{allFiltered.length > 1 ? "s" : ""} ·
              {" "}<span className="text-indigo-600 font-medium">{popEntree.length} actifs</span> ·
              {" "}<span className="text-emerald-600 font-medium">{popSortie.length} sortis</span>
            </p>
          </div>

          {/* Toggle */}
          <div className="flex rounded-xl bg-white border border-gray-200 overflow-hidden text-xs font-semibold">
            {VUES.map(({ v, l, desc }) => (
              <button key={v} onClick={() => setModeVue(v)}
                className={`px-4 py-2.5 transition-colors flex flex-col items-center leading-tight ${modeVue === v ? "text-white" : "text-gray-500 hover:bg-gray-50"}`}
                style={modeVue === v ? { background: vueActive?.color } : {}}
              >
                <span>{l}</span>
                <span className={`text-[10px] font-normal ${modeVue === v ? "opacity-70" : "text-gray-400"}`}>{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-4">
          {filialesList.length > 0 && <CheckGroup label="Filiale"  options={filialesList}  selected={selFilialeS}  onChange={v => { setSelFilialeS(v);  setSelSecteurS([]); setSelActiviteS([]); setSelSiteS([]); }} />}
          {secteursList.length  > 0 && <CheckGroup label="Secteur" options={secteursList}  selected={selSecteurS}  onChange={v => { setSelSecteurS(v);  setSelActiviteS([]); setSelSiteS([]); }} />}
          {activitesList.length > 0 && <CheckGroup label="Activité" options={activitesList} selected={selActiviteS} onChange={v => { setSelActiviteS(v); setSelSiteS([]); }} />}
          {sitesList.length     > 1 && <CheckGroup label="Site"    options={sitesList}     selected={selSiteS}     onChange={setSelSiteS} />}
          <PeriodPicker from={periodFrom} to={periodTo} onChange={(f, t) => { setPeriodFrom(f); setPeriodTo(t); }} />
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="p-6">
        {allFiltered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-gray-400 text-sm">Aucun salarié correspondant aux filtres sélectionnés.</p>
          </div>
        ) : (
          <>
            {modeVue === "entree"     && <VueEntree pop={popEntree} />}
            {modeVue === "sortie"     && <VueSortie sortis={popSortie} />}
            {modeVue === "comparatif" && <VueComparatif popE={popEntree} popS={popSortie} />}
          </>
        )}
      </div>
    </div>
  );
}
