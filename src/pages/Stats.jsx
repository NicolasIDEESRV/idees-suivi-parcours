import { useState, useMemo } from "react";
import { PRESCRIPTEURS, TYPES_SORTIE, NIVEAUX_LANGUE, MOYENS_TRANSPORT } from "../lib/constants";
import { getAge, dureeM, getScopeIds } from "../lib/utils";

// ─── Palette couleurs pour les camemberts ─────────────────────────────────────
const PALETTE = [
  "#4F46E5","#7C3AED","#2563EB","#0891B2","#059669",
  "#D97706","#DC2626","#DB2777","#65A30D","#9333EA",
];

// ─── Camembert SVG (sans dépendance externe) ──────────────────────────────────
function PieChart({ data, size = 160 }) {
  // data = [{ label, value, color }]
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="text-xs text-gray-400 text-center py-4">Aucune donnée</p>;

  const r = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;

  let angle = -Math.PI / 2; // départ à midi
  const slices = data.filter(d => d.value > 0).map(d => {
    const startAngle = angle;
    const sweep = (d.value / total) * 2 * Math.PI;
    angle += sweep;
    return { ...d, startAngle, sweep };
  });

  const arc = (sa, sw, radius) => {
    const x1 = cx + radius * Math.cos(sa);
    const y1 = cy + radius * Math.sin(sa);
    const x2 = cx + radius * Math.cos(sa + sw);
    const y2 = cy + radius * Math.sin(sa + sw);
    const large = sw > Math.PI ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="flex items-center gap-4 flex-wrap justify-center">
      <svg width={size} height={size} className="shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={arc(s.startAngle, s.sweep, r)} fill={s.color}
            className="hover:opacity-80 transition-opacity cursor-default"
          >
            <title>{s.label} : {s.value} ({Math.round(s.value / total * 100)}%)</title>
          </path>
        ))}
        {/* Trou central = donut */}
        <circle cx={cx} cy={cy} r={r * 0.42} fill="white" />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#111827">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="#9CA3AF">total</text>
      </svg>
      {/* Légende */}
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

// ─── Ligne de stat avec barre de progression ──────────────────────────────────
function StatRow({ label, n, total, color = "#4F46E5" }) {
  const pct = total > 0 ? Math.round(n / total * 100) : 0;
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

// ─── Carte de section ─────────────────────────────────────────────────────────
function Card({ title, children, span = 1 }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 p-4 ${span === 2 ? "md:col-span-2" : ""}`}>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{title}</h3>
      {children}
    </div>
  );
}

// ─── Checkbox multi-sélection ─────────────────────────────────────────────────
function CheckGroup({ label, options, selected, onChange }) {
  const toggle = (v) => onChange(
    selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]
  );
  const allOn = selected.length === 0;
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => onChange([])}
          className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
            allOn ? "bg-indigo-600 text-white border-indigo-600" : "text-gray-500 border-gray-200 hover:border-indigo-300"
          }`}
        >Tous</button>
        {options.map(o => (
          <button key={o} onClick={() => toggle(o)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
              selected.includes(o)
                ? "bg-indigo-600 text-white border-indigo-600"
                : "text-gray-600 border-gray-200 hover:border-indigo-300"
            }`}
          >{o}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Sélecteur de période ─────────────────────────────────────────────────────
function PeriodPicker({ from, to, onChange }) {
  const now = new Date();
  const yy  = now.getFullYear();
  const mm  = String(now.getMonth() + 1).padStart(2, "0");

  const shortcuts = [
    { label: "Cette année",     f: `${yy}-01-01`,     t: `${yy}-12-31`     },
    { label: "Année passée",    f: `${yy-1}-01-01`,   t: `${yy-1}-12-31`   },
    { label: "Ce mois",         f: `${yy}-${mm}-01`,  t: `${yy}-${mm}-31`  },
    { label: "6 derniers mois", f: new Date(now.setMonth(now.getMonth()-6)).toISOString().slice(0,10), t: new Date().toISOString().slice(0,10) },
    { label: "Tout",            f: "",                t: ""                },
  ];

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Période d'activité</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {shortcuts.map(s => (
          <button key={s.label} onClick={() => onChange(s.f, s.t)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
              from === s.f && to === s.t
                ? "bg-indigo-600 text-white border-indigo-600"
                : "text-gray-500 border-gray-200 hover:border-indigo-300"
            }`}
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

// ─── Page Stats ───────────────────────────────────────────────────────────────
export default function Stats({ user, salaries, sites = [] }) {
  const now = new Date().getFullYear();

  // ── Filtres ──────────────────────────────────────────────────────────────────
  const [selFilialeS,  setSelFilialeS]  = useState([]);
  const [selSecteurS,  setSelSecteurS]  = useState([]);
  const [selActiviteS, setSelActiviteS] = useState([]);
  const [selSiteS,     setSelSiteS]     = useState([]);
  const [periodFrom, setPeriodFrom]   = useState(`${now}-01-01`);
  const [periodTo,   setPeriodTo]     = useState(`${now}-12-31`);
  const [modeVue,    setModeVue]      = useState("inscrits"); // inscrits | sortis | tous

  // Hiérarchie disponible depuis les sites (cascadée)
  const filialesList  = [...new Set(sites.map(s => s.filiale).filter(Boolean))].sort();
  const secteursList  = [...new Set(
    sites.filter(s => selFilialeS.length === 0 || selFilialeS.includes(s.filiale))
      .map(s => s.secteur).filter(Boolean)
  )].sort();
  const activitesList = [...new Set(
    sites.filter(s =>
      (selFilialeS.length === 0 || selFilialeS.includes(s.filiale)) &&
      (selSecteurS.length === 0 || selSecteurS.includes(s.secteur))
    ).map(s => s.activite).filter(Boolean)
  )].sort();
  const sitesList = [...new Set(
    sites.filter(s =>
      (selFilialeS.length  === 0 || selFilialeS.includes(s.filiale))  &&
      (selSecteurS.length  === 0 || selSecteurS.includes(s.secteur))  &&
      (selActiviteS.length === 0 || selActiviteS.includes(s.activite))
    ).map(s => s.nom).filter(Boolean)
  )].sort();

  // IDs des sites correspondant aux filtres hiérarchiques
  const filteredSiteIds = useMemo(() => {
    const noFilter = selFilialeS.length === 0 && selSecteurS.length === 0 && selActiviteS.length === 0 && selSiteS.length === 0;
    if (noFilter) return null; // tout
    return sites.filter(s =>
      (selFilialeS.length  === 0 || selFilialeS.includes(s.filiale))  &&
      (selSecteurS.length  === 0 || selSecteurS.includes(s.secteur))  &&
      (selActiviteS.length === 0 || selActiviteS.includes(s.activite)) &&
      (selSiteS.length     === 0 || selSiteS.includes(s.nom))
    ).map(s => s.id);
  }, [sites, selFilialeS, selSecteurS, selActiviteS, selSiteS]);

  // ── Filtrage de la liste principale ──────────────────────────────────────────
  const allFiltered = useMemo(() => {
    const scopeIds = getScopeIds(user, sites);
    let base = scopeIds === null ? salaries : salaries.filter(s => scopeIds.includes(s.site_id));

    // Filtre hiérarchique
    if (filteredSiteIds !== null) {
      base = base.filter(s => filteredSiteIds.includes(s.site_id));
    }

    // Filtre période : actif au moins 1 jour pendant la période
    if (periodFrom || periodTo) {
      base = base.filter(s => {
        const entree  = s.dateEntree  ? new Date(s.dateEntree)  : null;
        const sortie  = s.dateSortie  ? new Date(s.dateSortie)  : null;
        const pFrom   = periodFrom ? new Date(periodFrom) : null;
        const pTo     = periodTo   ? new Date(periodTo)   : null;

        if (!entree) return false;
        // actif si entrée ≤ fin_période ET (pas sorti OU sortie ≥ début_période)
        const afterStart = !pTo   || entree <= pTo;
        const beforeEnd  = !pFrom || !sortie || sortie >= pFrom;
        return afterStart && beforeEnd;
      });
    }

    return base;
  }, [salaries, user, filteredSiteIds, periodFrom, periodTo]);

  // Sous-ensembles selon le mode
  const list = useMemo(() => {
    if (modeVue === "inscrits") return allFiltered.filter(s => !s.dateSortie);
    if (modeVue === "sortis")   return allFiltered.filter(s =>  s.dateSortie);
    return allFiltered;
  }, [allFiltered, modeVue]);

  const ins    = list.filter(s => s.statutAccueil !== "Accueilli");
  const T      = ins.length;
  const sortis = allFiltered.filter(s => s.dateSortie);
  const sp3    = sortis.filter(s => dureeM(s.dateEntree, s.dateSortie) >= 3);

  // ── Calculs ───────────────────────────────────────────────────────────────────

  // Âges
  const ageGroups = [
    { l: "≤ 25 ans", n: ins.filter(s => { const a = getAge(s.dateNaissance); return a && a <= 25; }).length },
    { l: "26 – 45 ans", n: ins.filter(s => { const a = getAge(s.dateNaissance); return a && a >= 26 && a <= 45; }).length },
    { l: "46 – 50 ans", n: ins.filter(s => { const a = getAge(s.dateNaissance); return a && a >= 46 && a <= 50; }).length },
    { l: "> 50 ans", n: ins.filter(s => { const a = getAge(s.dateNaissance); return a && a > 50; }).length },
  ];

  // Formation
  const nivGroups = [
    { l: "Niv. 3 (CAP/BEP et moins)", n: ins.filter(s => s.niveauFormation?.startsWith("Niveau 3")).length },
    { l: "Niv. 4 (Bac)",              n: ins.filter(s => s.niveauFormation?.startsWith("Niveau 4")).length },
    { l: "Niv. 5+ (Bac+2 et +)",      n: ins.filter(s => s.niveauFormation?.startsWith("Niveau 5")).length },
  ];

  // Prescripteurs
  const prcCounts = PRESCRIPTEURS.map(p => ({
    l: p, n: ins.filter(s => s.prescripteur === p).length
  })).filter(x => x.n > 0);

  // Langues (pour camembert)
  const langueData = NIVEAUX_LANGUE
    .map((l, i) => ({ label: l, value: ins.filter(s => s.niveauLangue === l).length, color: PALETTE[i] }))
    .filter(d => d.value > 0);

  // Transports (pour camembert)
  const mobData = MOYENS_TRANSPORT
    .map((m, i) => ({ label: m, value: ins.filter(s => s.moyenTransport === m).length, color: PALETTE[i] }))
    .filter(d => d.value > 0);

  // Types de sortie (pour camembert + liste)
  const sortieData = TYPES_SORTIE
    .map((t, i) => ({ label: t, value: sp3.filter(s => s.typeSortie === t).length, color: PALETTE[i] }))
    .filter(d => d.value > 0);

  // Publics prioritaires
  const publics = [
    { l: "DELD",         n: ins.filter(s => s.deld).length,        c: "#7C3AED" },
    { l: "BRSA",         n: ins.filter(s => s.brsa).length,        c: "#2563EB" },
    { l: "TH",           n: ins.filter(s => s.th).length,          c: "#0891B2" },
    { l: "ASS",          n: ins.filter(s => s.ass).length,         c: "#D97706" },
    { l: "Résident QPV", n: ins.filter(s => s.residentQPV).length, c: "#059669" },
  ];

  const C_INDIGO = "#4F46E5";

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Bandeau filtres sticky ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 px-6 pt-4 pb-4 shadow-sm">
        <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Statistiques</h1>
            <p className="text-xs text-gray-400">
              {allFiltered.length} salarié{allFiltered.length > 1 ? "s" : ""} dans la période ·
              {" "}{list.filter(s => !s.dateSortie).length} actif{list.filter(s => !s.dateSortie).length > 1 ? "s" : ""}
            </p>
          </div>
          {/* Mode vue */}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden text-xs font-medium bg-white">
            {[["inscrits","Actifs"],["sortis","Sortis"],["tous","Tous"]].map(([v,l]) => (
              <button key={v} onClick={() => setModeVue(v)}
                className={`px-4 py-2 transition-colors ${modeVue === v ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
              >{l}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Filiale */}
          {filialesList.length > 0 && (
            <CheckGroup label="Filiale" options={filialesList}
              selected={selFilialeS}
              onChange={v => { setSelFilialeS(v); setSelSecteurS([]); setSelActiviteS([]); setSelSiteS([]); }}
            />
          )}
          {/* Secteur */}
          {secteursList.length > 0 && (
            <CheckGroup label="Secteur" options={secteursList}
              selected={selSecteurS}
              onChange={v => { setSelSecteurS(v); setSelActiviteS([]); setSelSiteS([]); }}
            />
          )}
          {/* Activité */}
          {activitesList.length > 0 && (
            <CheckGroup label="Activité" options={activitesList}
              selected={selActiviteS}
              onChange={v => { setSelActiviteS(v); setSelSiteS([]); }}
            />
          )}
          {/* Site */}
          {sitesList.length > 1 && (
            <CheckGroup label="Site" options={sitesList}
              selected={selSiteS}
              onChange={setSelSiteS}
            />
          )}
          {/* Période */}
          <PeriodPicker
            from={periodFrom} to={periodTo}
            onChange={(f, t) => { setPeriodFrom(f); setPeriodTo(t); }}
          />
        </div>
      </div>

      {/* ── Contenu stats ─────────────────────────────────────────────────────── */}
      <div className="p-6">
        {T === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">
            Aucun salarié correspondant aux filtres sélectionnés.
          </div>
        )}

        {T > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

            {/* Accueil */}
            <Card title="Accueil & statut">
              <StatRow label="Actifs (inscrits)" n={allFiltered.filter(s => !s.dateSortie).length} total={allFiltered.length} color={C_INDIGO} />
              <StatRow label="Sortis"             n={sortis.length}                                 total={allFiltered.length} color="#6B7280" />
              <StatRow label="Accueillis"         n={list.filter(s => s.statutAccueil === "Accueilli").length} total={list.length} color="#0891B2" />
              <StatRow label="En attente"         n={list.filter(s => s.statutAccueil === "En attente").length} total={list.length} color="#D97706" />
            </Card>

            {/* Âge */}
            <Card title="Tranches d'âge">
              {ageGroups.map(g => <StatRow key={g.l} label={g.l} n={g.n} total={T} color={C_INDIGO} />)}
            </Card>

            {/* Publics prioritaires */}
            <Card title="Publics prioritaires">
              {publics.map(p => <StatRow key={p.l} label={p.l} n={p.n} total={T} color={p.c} />)}
            </Card>

            {/* Formation */}
            <Card title="Niveau de formation">
              {nivGroups.map(g => <StatRow key={g.l} label={g.l} n={g.n} total={T} color={C_INDIGO} />)}
              <div className="border-t border-gray-100 mt-2 pt-2">
                <StatRow label="CV disponible" n={ins.filter(s => s.cv).length} total={T} color="#059669" />
                <StatRow label="Lecture OK"    n={ins.filter(s => s.lecture).length}  total={T} color="#059669" />
                <StatRow label="Écriture OK"   n={ins.filter(s => s.ecriture).length} total={T} color="#059669" />
                <StatRow label="Calcul OK"     n={ins.filter(s => s.calcul).length}   total={T} color="#059669" />
              </div>
            </Card>

            {/* Mobilité */}
            <Card title="Mobilité — Permis & véhicule">
              <StatRow label="Permis B"               n={ins.filter(s =>  s.permisB).length}              total={T} color={C_INDIGO} />
              <StatRow label="Véhicule"               n={ins.filter(s =>  s.vehicule).length}             total={T} color={C_INDIGO} />
              <StatRow label="Permis B sans véhicule" n={ins.filter(s =>  s.permisB && !s.vehicule).length} total={T} color="#D97706" />
              <StatRow label="Ni permis ni véhicule"  n={ins.filter(s => !s.permisB && !s.vehicule).length} total={T} color="#DC2626" />
            </Card>

            {/* Prescripteurs */}
            <Card title="Prescripteurs">
              {prcCounts.length === 0
                ? <p className="text-xs text-gray-400 text-center py-2">Non renseigné</p>
                : prcCounts.map(p => <StatRow key={p.l} label={p.l} n={p.n} total={T} color={C_INDIGO} />)
              }
            </Card>

            {/* Camembert Langue */}
            <Card title="Niveau de langue">
              <PieChart data={langueData} size={160} />
            </Card>

            {/* Camembert Transport */}
            <Card title="Moyen de transport">
              <PieChart data={mobData} size={160} />
            </Card>

            {/* Sorties + Camembert */}
            <Card title={`Types de sortie — +3 mois (${sp3.length})`}>
              {sp3.length > 0
                ? <PieChart data={sortieData} size={160} />
                : <p className="text-xs text-gray-400 text-center py-4">Aucune sortie +3 mois</p>
              }
              <div className="border-t border-gray-100 mt-3 pt-3 space-y-1">
                <StatRow label="Sorties ≥ 3 mois" n={sp3.length}     total={sortis.length} color="#059669" />
                <StatRow label="Sorties < 3 mois"  n={sortis.length - sp3.length} total={sortis.length} color="#DC2626" />
              </div>
            </Card>

            {/* Situations de sortie */}
            {sortis.length > 0 && (
              <Card title="Situations à la sortie" span={2}>
                <div className="grid grid-cols-2 gap-x-6">
                  {["CDI","CDD +6 mois","CDD -6 mois","Intérim","Création d'entreprise","Formation qualifiante","Contrat aidé","Recherche emploi","Inactif","Sans nouvelles","Décès","Rupture employeur","Décision administrative"]
                    .map(s => {
                      const n = sortis.filter(x => x.situationSortie === s).length;
                      if (n === 0) return null;
                      return <StatRow key={s} label={s} n={n} total={sortis.length} color={C_INDIGO} />;
                    })
                    .filter(Boolean)
                  }
                </div>
              </Card>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
