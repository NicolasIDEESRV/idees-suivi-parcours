// ════════════════════════════════════════════════════════════════════════════
// EXPORT EXCEL — 3 types : Salariés / Stats / Entretiens
// Utilise SheetJS (xlsx) qui fonctionne côté navigateur.
// ════════════════════════════════════════════════════════════════════════════
import * as XLSX from "xlsx";
import { dureeM, getAge } from "./utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const v  = (x) => x ?? "";
const b  = (x) => x ? "Oui" : "Non";
const pct = (n, d) => d ? `${Math.round((n / d) * 100)} %` : "—";

/** Filtre les salariés actifs au moins 1 jour dans la période */
function filterPeriod(salaries, dateDebut, dateFin) {
  return salaries.filter(s => {
    if (!s.dateEntree) return false;
    const from = dateDebut || "0000-01-01";
    const to   = dateFin   || "9999-12-31";
    const entree = s.dateEntree;
    const sortie = s.dateSortie || "9999-12-31";
    return entree <= to && sortie >= from;
  });
}

/** Applique les filtres hiérarchiques sur les salariés */
function filterScope(salaries, scopeIds) {
  return scopeIds ? salaries.filter(s => scopeIds.includes(s.site_id)) : salaries;
}

/** Largeur automatique des colonnes */
function autoWidth(ws, rows) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  ws["!cols"] = keys.map(k => ({
    wch: Math.min(60, Math.max(k.length + 2, ...rows.map(r => String(r[k] ?? "").length)))
  }));
}

/** En-tête de ligne gelé */
function freezeHeader(ws) {
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
}

// ════════════════════════════════════════════════════════════════════════════
// EXPORT 1 — SALARIÉS (fiche complète)
// ════════════════════════════════════════════════════════════════════════════
export function exportSalaries({ salaries, entretiens, sites, scopeIds, dateDebut, dateFin }) {
  const base    = filterScope(salaries, scopeIds);
  const dataset = filterPeriod(base, dateDebut, dateFin);

  if (dataset.length === 0) return { count: 0, exported: false };

  const rows = dataset.map(s => {
    const site      = sites.find(x => x.id === s.site_id) ?? {};
    const ents      = entretiens.filter(e => e.salarie_id === s.id);
    const dernierE  = ents.filter(e => e.date).sort((a, b) => b.date.localeCompare(a.date))[0];
    const duree     = dureeM(s.dateEntree, s.dateSortie);

    return {
      // Identité
      "NOM":                  v(s.nom),
      "Prénom":               v(s.prenom),
      "Date naissance":       v(s.dateNaissance),
      "Âge":                  getAge(s.dateNaissance) ?? "",
      "Sexe":                 v(s.sexe),
      "Téléphone":            v(s.telephone),
      "Mail":                 v(s.mail),
      // Organisation
      "Filiale":              v(site.filiale),
      "Secteur":              v(site.secteur),
      "Activité":             v(site.activite),
      "Site":                 v(site.nom),
      // Parcours
      "Date entrée":          v(s.dateEntree),
      "Date fin contrat":     v(s.dateFinContrat),
      "Date fin agrément":    v(s.dateFinAgrement),
      "Date sortie":          v(s.dateSortie),
      "Durée (mois)":         duree,
      "Statut":               s.dateSortie ? "Sorti(e)" : "Actif(ve)",
      "Type sortie":          v(s.typeSortie),
      "Situation à la sortie": v(s.situationSortie),
      // Prescripteur
      "Prescripteur":         v(s.prescripteur),
      "Référent prescripteur": v(s.nomPrenomPrescripteur),
      // Publics prioritaires
      "DELD":                 b(s.deld),
      "BRSA":                 b(s.brsa),
      "TH / RQTH":            b(s.th),
      "ASS":                  b(s.ass),
      "Sans ressources":      b(s.sansRessources),
      "Résident QPV":         b(s.residentQPV),
      // Formation
      "Niveau formation":     v(s.niveauFormation),
      "Niveau langue":        v(s.niveauLangue),
      "Lecture":              b(s.lecture),
      "Écriture":             b(s.ecriture),
      "Calcul":               b(s.calcul),
      "Diplômes":             v(s.diplomes),
      "CV":                   b(s.cv),
      // Mobilité
      "Permis B":             b(s.permisB),
      "Véhicule":             b(s.vehicule),
      "Moyen transport":      v(s.moyenTransport),
      "Zone déplacement":     v(s.deplacements),
      // Situation personnelle
      "Hébergement":          v(s.hebergement),
      "Situation maritale":   v(s.situationMaritale),
      "Nb enfants":           s.nbEnfants ?? 0,
      // Projet
      "Projet professionnel": v(s.projetPro),
      "Préconisation":        v(s.preconisation),
      // Entretiens
      "Nb entretiens":        ents.length,
      "Dernier entretien":    v(dernierE?.date),
      "Type dernier entretien": v(dernierE?.type),
      // Synthèses
      "Synthèse besoins entrée": v(s.synthBesoinsEntree),
      "Synthèse besoins sortie": v(s.synthBesoinsSortie),
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  autoWidth(ws, rows);
  freezeHeader(ws);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Salariés");

  const filename = `export_salaries_${dateDebut || "tout"}_${dateFin || "tout"}.xlsx`;
  XLSX.writeFile(wb, filename);
  return { count: dataset.length, exported: true };
}

// ════════════════════════════════════════════════════════════════════════════
// EXPORT 2 — ENTRETIENS
// ════════════════════════════════════════════════════════════════════════════
export function exportEntretiens({ salaries, entretiens, sites, profiles, scopeIds, dateDebut, dateFin }) {
  const baseSals = filterScope(salaries, scopeIds);
  const baseSalIds = new Set(baseSals.map(s => s.id));

  const from = dateDebut || "0000-01-01";
  const to   = dateFin   || "9999-12-31";

  const dataset = entretiens.filter(e =>
    e.date && e.date >= from && e.date <= to && baseSalIds.has(e.salarie_id)
  ).sort((a, b) => a.date.localeCompare(b.date));

  if (dataset.length === 0) return { count: 0, exported: false };

  const rows = dataset.map(e => {
    const sal  = salaries.find(s => s.id === e.salarie_id) ?? {};
    const site = sites.find(x => x.id === sal.site_id) ?? {};
    const resp = profiles.find(p => p.id === e.assignedTo);
    const objTotal   = (e.objectifs ?? []).length;
    const objAtteints = (e.objectifs ?? []).filter(o => o.atteint === true).length;

    return {
      "Date":               v(e.date),
      "Type":               v(e.type),
      "Jalon":              e.jalon ? "Oui" : "Non",
      "NOM Salarié":        v(sal.nom),
      "Prénom Salarié":     v(sal.prenom),
      "Filiale":            v(site.filiale),
      "Secteur":            v(site.secteur),
      "Activité":           v(site.activite),
      "Site":               v(site.nom),
      "Responsable":        resp ? `${resp.prenom} ${resp.nom}` : "",
      "Sujets abordés":     v(e.sujets),
      "Synthèse":           v(e.synthese),
      "Participants":       v(e.participants),
      "Nb objectifs":       objTotal,
      "Objectifs atteints": objAtteints,
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  autoWidth(ws, rows);
  freezeHeader(ws);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Entretiens");

  const filename = `export_entretiens_${dateDebut || "tout"}_${dateFin || "tout"}.xlsx`;
  XLSX.writeFile(wb, filename);
  return { count: dataset.length, exported: true };
}

// ════════════════════════════════════════════════════════════════════════════
// EXPORT 3 — STATISTIQUES (classeur multi-onglets)
// ════════════════════════════════════════════════════════════════════════════
export function exportStats({ salaries, entretiens, sites, scopeIds, dateDebut, dateFin }) {
  const base    = filterScope(salaries, scopeIds);
  const dataset = filterPeriod(base, dateDebut, dateFin);

  if (dataset.length === 0) return { count: 0, exported: false };

  const actifs = dataset.filter(s => !s.dateSortie);
  const sortis = dataset.filter(s =>  s.dateSortie);

  const EMPLOI_TYPES = ["CDI", "CDD", "Intérim", "Alternance", "Contrat aidé", "Création d'entreprise"];
  const isEmploi = (s) => EMPLOI_TYPES.some(t => (s.typeSortie ?? "").includes(t));
  const sortiesEmploi = sortis.filter(isEmploi);

  const avgDuree = dataset.length
    ? Math.round(dataset.reduce((acc, s) => acc + dureeM(s.dateEntree, s.dateSortie), 0) / dataset.length)
    : 0;

  // ── Onglet 1 : Synthèse ────────────────────────────────────────────────────
  const sheetSynthese = XLSX.utils.aoa_to_sheet([
    ["Indicateur", "Valeur"],
    ["Période", `${dateDebut || "Début"} → ${dateFin || "Aujourd'hui"}`],
    ["Périmètre", scopeIds ? `${scopeIds.length} site(s) sélectionné(s)` : "Tous les sites"],
    [],
    ["EFFECTIFS"],
    ["Total salariés sur la période", dataset.length],
    ["Salariés actifs (en cours)",    actifs.length],
    ["Salariés sortis",               sortis.length],
    [],
    ["SORTIES"],
    ["Sorties emploi",                sortiesEmploi.length],
    ["Taux de sortie emploi",         pct(sortiesEmploi.length, sortis.length)],
    [],
    ["PARCOURS"],
    ["Durée moyenne (mois)",          avgDuree],
    [],
    ["PUBLICS PRIORITAIRES"],
    ["DELD",           dataset.filter(s => s.deld).length,           pct(dataset.filter(s => s.deld).length, dataset.length)],
    ["BRSA",           dataset.filter(s => s.brsa).length,           pct(dataset.filter(s => s.brsa).length, dataset.length)],
    ["TH / RQTH",      dataset.filter(s => s.th).length,             pct(dataset.filter(s => s.th).length, dataset.length)],
    ["ASS",            dataset.filter(s => s.ass).length,            pct(dataset.filter(s => s.ass).length, dataset.length)],
    ["Sans ressources",dataset.filter(s => s.sansRessources).length, pct(dataset.filter(s => s.sansRessources).length, dataset.length)],
    ["Résident QPV",   dataset.filter(s => s.residentQPV).length,    pct(dataset.filter(s => s.residentQPV).length, dataset.length)],
  ]);
  sheetSynthese["!cols"] = [{ wch: 35 }, { wch: 15 }, { wch: 10 }];

  // ── Onglet 2 : Par site ────────────────────────────────────────────────────
  const parSiteRows = [["Filiale", "Secteur", "Activité", "Site", "Total", "Actifs", "Sortis", "Emploi", "Taux emploi", "Durée moy. (mois)"]];
  const activeSites = sites.filter(s => !scopeIds || scopeIds.includes(s.id));
  activeSites.forEach(site => {
    const ss = dataset.filter(s => s.site_id === site.id);
    if (!ss.length) return;
    const sActifs  = ss.filter(s => !s.dateSortie).length;
    const sSortis  = ss.filter(s =>  s.dateSortie).length;
    const sEmploi  = ss.filter(isEmploi).length;
    const sDuree   = Math.round(ss.reduce((acc, s) => acc + dureeM(s.dateEntree, s.dateSortie), 0) / ss.length);
    parSiteRows.push([v(site.filiale), v(site.secteur), v(site.activite), v(site.nom), ss.length, sActifs, sSortis, sEmploi, pct(sEmploi, sSortis), sDuree]);
  });
  const sheetSite = XLSX.utils.aoa_to_sheet(parSiteRows);
  sheetSite["!cols"] = [{ wch: 18 }, { wch: 22 }, { wch: 22 }, { wch: 18 }, ...Array(6).fill({ wch: 12 })];

  // ── Onglet 3 : Types de sortie ─────────────────────────────────────────────
  const sortieCount = {};
  sortis.forEach(s => { const t = s.typeSortie || "Non renseigné"; sortieCount[t] = (sortieCount[t] || 0) + 1; });
  const parSortieRows = [["Type de sortie", "Nb", "%"]];
  Object.entries(sortieCount).sort((a, b) => b[1] - a[1])
    .forEach(([t, n]) => parSortieRows.push([t, n, pct(n, sortis.length)]));
  const sheetSortie = XLSX.utils.aoa_to_sheet(parSortieRows);
  sheetSortie["!cols"] = [{ wch: 35 }, { wch: 8 }, { wch: 8 }];

  // ── Onglet 4 : Prescripteurs ───────────────────────────────────────────────
  const prescCount = {};
  dataset.forEach(s => { const p = s.prescripteur || "Non renseigné"; prescCount[p] = (prescCount[p] || 0) + 1; });
  const parPrescRows = [["Prescripteur", "Nb", "%"]];
  Object.entries(prescCount).sort((a, b) => b[1] - a[1])
    .forEach(([p, n]) => parPrescRows.push([p, n, pct(n, dataset.length)]));
  const sheetPresc = XLSX.utils.aoa_to_sheet(parPrescRows);
  sheetPresc["!cols"] = [{ wch: 30 }, { wch: 8 }, { wch: 8 }];

  // ── Onglet 5 : Entretiens ──────────────────────────────────────────────────
  const baseSalIds = new Set(dataset.map(s => s.id));
  const from = dateDebut || "0000-01-01";
  const to   = dateFin   || "9999-12-31";
  const entsFiltered = entretiens.filter(e =>
    e.date && e.date >= from && e.date <= to && baseSalIds.has(e.salarie_id)
  );
  const typeEntCount = {};
  entsFiltered.forEach(e => { const t = e.type || "Non renseigné"; typeEntCount[t] = (typeEntCount[t] || 0) + 1; });
  const parTypeEntRows = [["Type d'entretien", "Nb"]];
  Object.entries(typeEntCount).sort((a, b) => b[1] - a[1])
    .forEach(([t, n]) => parTypeEntRows.push([t, n]));
  parTypeEntRows.push([], ["Total entretiens", entsFiltered.length]);
  const sheetEntTypes = XLSX.utils.aoa_to_sheet(parTypeEntRows);
  sheetEntTypes["!cols"] = [{ wch: 30 }, { wch: 8 }];

  // ── Assemblage ─────────────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheetSynthese,  "Synthèse");
  XLSX.utils.book_append_sheet(wb, sheetSite,      "Par site");
  XLSX.utils.book_append_sheet(wb, sheetSortie,    "Types de sortie");
  XLSX.utils.book_append_sheet(wb, sheetPresc,     "Prescripteurs");
  XLSX.utils.book_append_sheet(wb, sheetEntTypes,  "Entretiens - types");

  const filename = `export_stats_${dateDebut || "tout"}_${dateFin || "tout"}.xlsx`;
  XLSX.writeFile(wb, filename);
  return { count: dataset.length, exported: true };
}
