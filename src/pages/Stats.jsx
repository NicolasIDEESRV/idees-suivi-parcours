import { PRESCRIPTEURS, TYPES_SORTIE, NIVEAUX_LANGUE, MOYENS_TRANSPORT } from "../lib/constants";
import { getAge, dureeM } from "../lib/utils";

const R2 = ({ l, n, t }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
    <span className="text-gray-600 text-xs">{l}</span>
    <div className="flex gap-2">
      <span className="font-bold text-gray-900 w-5 text-right">{n}</span>
      {t > 0 && <span className="text-xs text-gray-400 w-8 text-right">{Math.round(n / t * 100)}%</span>}
    </div>
  </div>
);

const SC = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-4">
    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{title}</h3>
    {children}
  </div>
);

export default function Stats({ user, salaries }) {
  const list = user.role === "admin" ? salaries : salaries.filter(s => s.site_id === user.site_id);
  const ins  = list.filter(s => s.statutAccueil !== "Accueilli");
  const T    = ins.length;

  const ages = { "≤25": 0, "26-45": 0, "46-50": 0, "50+": 0 };
  ins.forEach(s => {
    const a = getAge(s.dateNaissance);
    if (!a) return;
    if (a <= 25) ages["≤25"]++;
    else if (a <= 45) ages["26-45"]++;
    else if (a <= 50) ages["46-50"]++;
    else ages["50+"]++;
  });

  const niv = { "Niv.3": 0, "Niv.4": 0, "Niv.5+": 0 };
  ins.forEach(s => {
    if (!s.niveauFormation) return;
    if (s.niveauFormation.startsWith("Niveau 3")) niv["Niv.3"]++;
    else if (s.niveauFormation.startsWith("Niveau 4")) niv["Niv.4"]++;
    else niv["Niv.5+"]++;
  });

  const prc = {};
  PRESCRIPTEURS.forEach(p => prc[p] = 0);
  ins.forEach(s => { if (s.prescripteur && prc[s.prescripteur] !== undefined) prc[s.prescripteur]++; });

  const sortis = list.filter(s => s.dateSortie);
  const sp3    = sortis.filter(s => dureeM(s.dateEntree, s.dateSortie) >= 3);
  const tc     = {};
  TYPES_SORTIE.forEach(t => tc[t] = 0);
  sp3.forEach(s => { if (s.typeSortie) tc[s.typeSortie] = (tc[s.typeSortie] || 0) + 1; });

  const langues = {};
  NIVEAUX_LANGUE.forEach(l => langues[l] = 0);
  ins.forEach(s => { if (s.niveauLangue && langues[s.niveauLangue] !== undefined) langues[s.niveauLangue]++; });

  const mob = {};
  MOYENS_TRANSPORT.forEach(m => mob[m] = 0);
  ins.forEach(s => { if (s.moyenTransport && mob[s.moyenTransport] !== undefined) mob[s.moyenTransport]++; });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-5">Statistiques · {T} inscrits</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SC title="Accueil">
          <R2 l="Accueillis" n={list.filter(s => s.statutAccueil === "Accueilli").length} t={0} />
          <R2 l="Inscrits"   n={T} t={0} />
        </SC>

        <SC title="Âge">
          {Object.entries(ages).map(([k, v]) => <R2 key={k} l={k} n={v} t={T} />)}
        </SC>

        <SC title="Formation">
          {Object.entries(niv).map(([k, v]) => <R2 key={k} l={k} n={v} t={T} />)}
        </SC>

        <SC title="Niveau de langue">
          {Object.entries(langues).filter(([, v]) => v > 0).map(([k, v]) => <R2 key={k} l={k} n={v} t={T} />)}
          {Object.values(langues).every(v => v === 0) && <p className="text-xs text-gray-400 text-center py-2">Non renseigné</p>}
        </SC>

        <SC title="CV">
          <R2 l="CV disponible" n={ins.filter(s => s.cv).length}  t={T} />
          <R2 l="CV à faire"    n={ins.filter(s => !s.cv).length} t={T} />
        </SC>

        <SC title="Mobilité — Permis & véhicule">
          <R2 l="Permis B"                n={ins.filter(s =>  s.permisB).length}              t={T} />
          <R2 l="Véhicule"                n={ins.filter(s =>  s.vehicule).length}             t={T} />
          <R2 l="Permis B sans véhicule"  n={ins.filter(s =>  s.permisB && !s.vehicule).length} t={T} />
          <R2 l="Ni permis ni véhicule"   n={ins.filter(s => !s.permisB && !s.vehicule).length} t={T} />
        </SC>

        <SC title="Transport">
          {Object.entries(mob).filter(([, v]) => v > 0).map(([k, v]) => <R2 key={k} l={k} n={v} t={T} />)}
          {Object.values(mob).every(v => v === 0) && <p className="text-xs text-gray-400 text-center py-2">Non renseigné</p>}
        </SC>

        <SC title="Publics prioritaires">
          <R2 l="DELD" n={ins.filter(s => s.deld).length}        t={T} />
          <R2 l="BRSA" n={ins.filter(s => s.brsa).length}        t={T} />
          <R2 l="TH"   n={ins.filter(s => s.th).length}          t={T} />
          <R2 l="ASS"  n={ins.filter(s => s.ass).length}         t={T} />
          <R2 l="QPV"  n={ins.filter(s => s.residentQPV).length} t={T} />
        </SC>

        <SC title="Prescripteurs">
          {PRESCRIPTEURS.map(p => <R2 key={p} l={p.length > 20 ? p.slice(0, 20) + "…" : p} n={prc[p]} t={T} />)}
        </SC>

        <SC title="Types de sortie (+3 mois)">
          {TYPES_SORTIE.map(t => <R2 key={t} l={t} n={tc[t] || 0} t={sp3.length} />)}
          <div className="pt-2 mt-2 border-t border-gray-100">
            <R2 l="Total +3 mois" n={sp3.length}                                                        t={0} />
            <R2 l="−3 mois"       n={sortis.filter(s => dureeM(s.dateEntree, s.dateSortie) < 3).length} t={0} />
          </div>
        </SC>
      </div>
    </div>
  );
}
