// Génère le fichier de consolidation — ExcelJS (couleurs + formules Excel FR)
import ExcelJS from 'exceljs';

const OUTPUT = 'C:\\Users\\IRVF_GERLAND\\Documents\\CLAUDE CODE\\idees-suivi-parcours\\consolidation_import_salaries.xlsx';

// ─── Colonnes ─────────────────────────────────────────────────────────────────
// [db, fr_label, source, is_date]
// source: null=manuel, "XY99"=INDIRECT simple,
//         "BOOL:XY"=Oui/Non→VRAI/FAUX, "FREIN:XY"=OUI→IDENTIFIÉ
const COLS = [
  ["nom",                      "Nom",                              null,        false],
  ["prenom",                   "Prénom",                           null,        false],
  ["nom_naissance",            "Nom de naissance",                 "E11",       false],
  ["date_naissance",           "Date naissance (AAAA-MM-JJ)",      "J11",       true ],
  ["sexe",                     "Sexe (M ou F)",                    "E12",       false],
  ["nationalite",              "Nationalité",                      "J12",       false],
  ["adresse",                  "Adresse",                          "E13",       false],
  ["cp",                       "Code postal",                      "E14",       false],
  ["ville_residence",          "Ville",                            "J14",       false],
  ["telephone",                "Téléphone",                        "E15",       false],
  ["mail",                     "Email",                            "J15",       false],
  ["date_entree",              "Date entrée (AAAA-MM-JJ)",         "E17",       true ],
  ["date_fin_contrat",         "Fin contrat (AAAA-MM-JJ)",         "AL7",       true ],
  ["date_fin_agrement",        "Fin agrément (AAAA-MM-JJ)",        "AL8",       true ],
  ["titre_sejour",             "Titre séjour expiration",          "AL9",       false],
  ["id_ft",                    "ID France Travail",                "E18",       false],
  ["date_premier_inscription", "1ère inscription FT (AAAA-MM-JJ)","J18",       true ],
  ["prescripteur",             "Prescripteur",                     "E19",       false],
  ["nom_prenom_prescripteur",  "Nom prescripteur",                 "J19",       false],
  ["statut_accueil",           "Statut accueil",                   null,        false],
  ["suivi_spip",               "Suivi SPIP (VRAI/FAUX)",           "BOOL:E20",  false],
  ["coord_spip",               "Coordonnées SPIP",                 "J20",       false],
  ["suivi_social",             "Suivi social",                     "J21",       false],
  ["commentaires",             "Commentaires",                     "E21",       false],
  ["deld",                     "DELD (VRAI/FAUX)",                 null,        false],
  ["duree_chomage_mois",       "Durée chômage (mois)",             null,        false],
  ["brsa",                     "BRSA (VRAI/FAUX)",                 null,        false],
  ["th",                       "TH - Trav. Handicapé",            null,        false],
  ["ass",                      "ASS (VRAI/FAUX)",                  null,        false],
  ["sans_ressources",          "Sans ressources (VRAI/FAUX)",      null,        false],
  ["resident_qpv",             "Résident QPV (VRAI/FAUX)",         null,        false],
  ["niveau_formation",         "Niveau formation",                 null,        false],
  ["cv",                       "CV (VRAI/FAUX)",                   null,        false],
  ["niveau_langue",            "Niveau langue",                    "F71",       false],
  ["niveaux_scolaire",         "Niveau scolaire",                  "E63",       false],
  ["lecture",                  "Lecture",                          "F64",       false],
  ["ecriture",                 "Écriture",                         "F65",       false],
  ["calcul",                   "Calcul",                           "F66",       false],
  ["diplomes",                 "Diplômes",                         "E67",       false],
  ["formations",               "Formations suivies",               "E68",       false],
  ["experiences_pro",          "Expériences professionnelles",     "E78",       false],
  ["equipement_info",          "Équipement informatique",          "E90",       false],
  ["acces_internet",           "Accès internet (VRAI/FAUX)",       "BOOL:E91",  false],
  ["projet_pro",               "Projet pro / Métier visé",         "E84",       false],
  ["domaines_pro_1",           "Domaine pro 1",                    "J84",       false],
  ["domaines_pro_2",           "Domaine pro 2",                    "J85",       false],
  ["domaines_pro_3",           "Domaine pro 3",                    "J86",       false],
  ["preconisation",            "Préconisation",                    null,        false],
  ["situation_maritale",       "Situation maritale",               "E29",       false],
  ["nb_enfants",               "Nb enfants",                       "E30",       false],
  ["age_enfants",              "Âge des enfants",                  "J30",       false],
  ["mode_garde",               "Mode de garde",                    "E31",       false],
  ["personnes_charge",         "Personnes à charge",               "J31",       false],
  ["hebergement",              "Hébergement",                      "E35",       false],
  ["demarche",                 "Démarches administratives",        "E92",       false],
  ["sports",                   "Sports / Loisirs",                 "E96",       false],
  ["benevolat",                "Bénévolat",                        "E97",       false],
  ["securite_sociale",         "Sécurité sociale",                 "E39",       false],
  ["css",                      "CSS/Mutuelle (VRAI/FAUX)",         "BOOL:E40",  false],
  ["css_jusqu_au",             "CSS jusqu'au (AAAA-MM-JJ)",        "J40",       true ],
  ["restrictions",             "Restrictions / RQTH",              "E41",       false],
  ["traitement",               "Traitement médical",               "E42",       false],
  ["addictions",               "Addictions",                       "E43",       false],
  ["autres_sante",             "Autres (santé)",                   "E44",       false],
  ["revenus",                  "Revenus (€/mois)",                 "E48",       false],
  ["charges",                  "Charges (€/mois)",                 "E49",       false],
  ["dettes",                   "Dettes",                           "E50",       false],
  ["permis_b",                 "Permis B (VRAI/FAUX)",             "BOOL:E55",  false],
  ["vehicule",                 "Véhicule (VRAI/FAUX)",             "BOOL:J55",  false],
  ["autres_permis",            "Autres permis",                    "E56",       false],
  ["moyen_transport",          "Moyen de transport",               "J56",       false],
  ["deplacements",             "Zone déplacements",                "J57",       false],
  ["frein_situation_familiale","Frein: Sit. familiale",            "FREIN:E32", false],
  ["frein_logement",           "Frein: Logement",                  "FREIN:E36", false],
  ["frein_sante",              "Frein: Santé",                     "FREIN:E45", false],
  ["frein_ressources",         "Frein: Ressources/Dettes",         "FREIN:E52", false],
  ["frein_mobilite",           "Frein: Mobilité",                  "FREIN:E60", false],
  ["frein_parcours_scolaire",  "Frein: Parcours scolaire",         "FREIN:E69", false],
  ["frein_langue",             "Frein: Langue",                    "FREIN:E75", false],
  ["frein_experience_pro",     "Frein: Exp. pro",                  "FREIN:E87", false],
  ["frein_autonomie_admin",    "Frein: Autonomie admin.",           "FREIN:E93", false],
  ["synth_besoins_entree",     "Synthèse besoins entrée",          "D100",      false],
  ["synth_parcours",           "Synthèse du parcours",             "AY86",      false],
  ["site_id",                  "ID Site (UUID Supabase)",          null,        false],
  ["cip_id",                   "ID CIP (UUID Supabase)",           null,        false],
];

// ─── Formules en ANGLAIS (langue interne du format xlsx) ─────────────────────
// Le format xlsx stocke toujours les formules en anglais.
// Excel français les affiche traduit à l'ouverture — évite le bug "@" d'Excel 365.
function makeFormula(rowNum, source) {
  if (source === null) return null;

  const A = `$A${rowNum}`;
  const B = `$B${rowNum}`;
  // Construit la référence : 'NOM Prenom'!CELL
  const ref = (cell) => `"'"&${A}&" "&${B}&"'!${cell}"`;

  if (source.startsWith("BOOL:")) {
    const cell = source.slice(5);
    const ind = `INDIRECT(${ref(cell)})`;
    return `=IFERROR(IF(${A}="","",IF(${ind}="Oui",TRUE,IF(${ind}="Non",FALSE,""))),"")`;
  }

  if (source.startsWith("FREIN:")) {
    const cell = source.slice(6);
    const ind = `INDIRECT(${ref(cell)})`;
    return `=IFERROR(IF(${A}="","",IF(${ind}="OUI","IDENTIFIÉ","")),"")`;
  }

  // Simple
  return `=IFERROR(IF(${A}="","",INDIRECT(${ref(source)})),"")`;
}

function srcLabel(source) {
  if (source === null)          return "✏ SAISIE MANUELLE";
  if (source.startsWith("BOOL:"))  return `⚡ ${source.slice(5)} → VRAI/FAUX`;
  if (source.startsWith("FREIN:")) return `⚡ ${source.slice(6)} → IDENTIFIÉ`;
  return `⚡ ${source}`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const C_HDR1_BG  = { argb: "FF1F3864" }; // bleu nuit
const C_HDR1_FG  = { argb: "FFFFFFFF" }; // blanc
const C_HDR2_BG  = { argb: "FFD9E2F3" }; // bleu clair
const C_HDR2_FG  = { argb: "FF1F3864" }; // bleu nuit
const C_SRC_BG   = { argb: "FFF2F2F2" }; // gris très clair
const C_SRC_FG   = { argb: "FF595959" }; // gris
const C_MANUEL   = { argb: "FFFFF2CC" }; // jaune
const C_AUTO     = { argb: "FFE2EFDA" }; // vert clair
const C_BORDER   = { argb: "FFD0D0D0" };

const thin = { style: "thin", color: C_BORDER };
const border = { top: thin, left: thin, bottom: thin, right: thin };

function applyCell(cell, value, bgColor, fgColor, bold = false, italic = false, fontSize = 9, wrapText = false) {
  cell.value = value;
  cell.font  = { name: "Arial", size: fontSize, bold, italic, color: fgColor };
  cell.fill  = { type: "pattern", pattern: "solid", fgColor: bgColor };
  cell.border = border;
  cell.alignment = { vertical: "middle", wrapText };
}

// ─── Création du classeur ─────────────────────────────────────────────────────
const wb = new ExcelJS.Workbook();
wb.creator = "ID'EES Suivi Parcours";

// ══ Feuille 1 : Salariés ══════════════════════════════════════════════════════
const ws = wb.addWorksheet("Salariés");

// Largeurs de colonnes
ws.getColumn(1).width = 20; // A : NOM
ws.getColumn(2).width = 18; // B : Prénom
COLS.forEach(([, fr], i) => {
  if (i >= 2) ws.getColumn(i + 1).width = Math.max(16, Math.min(32, fr.length + 4));
});

// Hauteurs des lignes d'en-tête
ws.getRow(1).height = 22;
ws.getRow(2).height = 30;
ws.getRow(3).height = 18;

// ── Lignes d'en-tête ──────────────────────────────────────────────────────────
COLS.forEach(([db, fr, src], colIdx) => {
  const c1 = ws.getRow(1).getCell(colIdx + 1);
  applyCell(c1, db, C_HDR1_BG, C_HDR1_FG, true, false, 10);
  c1.alignment = { horizontal: "center", vertical: "middle" };

  const c2 = ws.getRow(2).getCell(colIdx + 1);
  applyCell(c2, fr, C_HDR2_BG, C_HDR2_FG, true, false, 9, true);

  const c3 = ws.getRow(3).getCell(colIdx + 1);
  applyCell(c3, srcLabel(src), C_SRC_BG, C_SRC_FG, false, true, 8, false);
});

// ── Lignes de données (4–103) ─────────────────────────────────────────────────
for (let rowNum = 4; rowNum <= 103; rowNum++) {
  const row = ws.getRow(rowNum);
  row.height = 18;

  COLS.forEach(([db, fr, src, isDate], colIdx) => {
    const cell = row.getCell(colIdx + 1);
    const formula = makeFormula(rowNum, src);

    if (formula === null) {
      // Saisie manuelle → jaune
      cell.value = "";
      cell.fill   = { type: "pattern", pattern: "solid", fgColor: C_MANUEL };
      cell.font   = { name: "Arial", size: 9 };
      cell.border = border;
      cell.alignment = { vertical: "middle" };
    } else {
      // Formule automatique → vert
      cell.value  = { formula: formula.slice(1) }; // ExcelJS : sans le "="
      cell.fill   = { type: "pattern", pattern: "solid", fgColor: C_AUTO };
      cell.font   = { name: "Arial", size: 9, color: { argb: "FF1A1A1A" } };
      cell.border = border;
      cell.alignment = { vertical: "middle" };
      if (isDate) cell.numFmt = "YYYY-MM-DD";
    }
  });
}

// Figer les volets à C4 (3 lignes en-tête + 2 colonnes NOM/Prénom)
ws.views = [{ state: "frozen", xSplit: 2, ySplit: 3, activeCell: "C4" }];

// ── Légende en bas ────────────────────────────────────────────────────────────
const legendRow = 106;
ws.getRow(legendRow).getCell(1).value = "Légende :";
ws.getRow(legendRow).getCell(1).font  = { name: "Arial", size: 9, bold: true };

const legJ = ws.getRow(legendRow).getCell(2);
legJ.value = "Fond jaune = saisie manuelle obligatoire";
legJ.font  = { name: "Arial", size: 9 };
legJ.fill  = { type: "pattern", pattern: "solid", fgColor: C_MANUEL };

const legV = ws.getRow(legendRow).getCell(4);
legV.value = "Fond vert = rempli automatiquement (INDIRECT vers l'onglet salarié)";
legV.font  = { name: "Arial", size: 9 };
legV.fill  = { type: "pattern", pattern: "solid", fgColor: C_AUTO };


// ══ Feuille 2 : Instructions ══════════════════════════════════════════════════
const wsI = wb.addWorksheet("Instructions");
wsI.getColumn(1).width = 32;
wsI.getColumn(2).width = 88;

const instRows = [
  { bold: true, size: 13, data: ["GUIDE — Consolidation des fiches salariés vers le fichier d'import", ""] },
  { data: ["", ""] },
  { bold: true, data: ["ÉTAPES D'UTILISATION", ""] },
  { data: ["1.", "Copier TOUTES vos fiches salariés (onglets 'NOM Prénom') dans CE classeur."] },
  { data: ["2.", "Dans l'onglet 'Salariés', saisir le NOM (colonne A) et le Prénom (colonne B)."] },
  { data: ["3.", "Le nom de l'onglet doit être EXACTEMENT : NOM Prénom  (ex : MARTIN Jean)"] },
  { data: ["4.", "Les cellules VERTES se remplissent automatiquement via les formules INDIRECT."] },
  { data: ["5.", "Les cellules JAUNES doivent être saisies manuellement."] },
  { data: ["", ""] },
  { bold: true, data: ["COLONNES À SAISIR MANUELLEMENT (fond jaune)", ""] },
  { data: ["statut_accueil",         "Accueilli / Inscrit / En attente"] },
  { data: ["deld / brsa / th / ass", "VRAI ou FAUX"] },
  { data: ["duree_chomage_mois",     "Nombre entier de mois"] },
  { data: ["sans_ressources",        "VRAI ou FAUX"] },
  { data: ["resident_qpv",           "VRAI ou FAUX"] },
  { data: ["niveau_formation",       "Niveau 3 (CAP/BEP et moins) / Niveau 4 (Bac ou Bac pro) / Niveau 5 à 8 (Bac+2 et +)"] },
  { data: ["cv",                     "VRAI ou FAUX"] },
  { data: ["preconisation",          "Texte libre"] },
  { data: ["site_id",                "UUID depuis Supabase → Table Editor → sites"] },
  { data: ["cip_id",                 "UUID depuis Supabase → Table Editor → profiles"] },
  { data: ["", ""] },
  { bold: true, data: ["CONVERSIONS AUTOMATIQUES", ""] },
  { data: ["Oui / Non → VRAI / FAUX",  "suivi_spip, css, acces_internet, permis_b, vehicule"] },
  { data: ["OUI → IDENTIFIÉ",           "Tous les freins (frein_*)"] },
  { data: ["", ""] },
  { bold: true, data: ["NOM DE L'ONGLET — IMPORTANT", ""] },
  { data: ["", "Le nom de l'onglet doit correspondre EXACTEMENT à : [colonne A] espace [colonne B]"] },
  { data: ["", "Exemple : A4=MARTIN  B4=Jean  →  onglet nommé exactement  MARTIN Jean"] },
  { data: ["", "⚠ Respecter les majuscules, minuscules, accents et espaces !"] },
  { data: ["", ""] },
  { bold: true, data: ["IMPORT DANS L'APPLICATION", ""] },
  { data: ["1.", "Toutes les lignes remplies → Fichier → Enregistrer sous → CSV UTF-8"] },
  { data: ["2.", "Supabase Dashboard → Table Editor → salaries → Import data from CSV"] },
  { data: ["3.", "Vérifier le mapping des colonnes puis cliquer Import"] },
  { data: ["", ""] },
  { bold: true, data: ["VALEURS ACCEPTÉES", ""] },
  { data: ["prescripteur",      "FRANCE TRAVAIL / SERVICES SOCIAUX / CAP EMPLOI / MISSION LOCALE / PLIE / SIAE / SERVICES DE JUSTICE / SANS PRESCRIPTION / AUTRE"] },
  { data: ["niveau_langue",     "Débutant / A1 / A2 / B1 / B2 / C1 / Natif"] },
  { data: ["moyen_transport",   "Transports en commun / Voiture (permis B) / Vélo / À pied / Autre"] },
  { data: ["situation_sortie",  "CDI / CDD +6 mois / CDD -6 mois / Intérim / Création d'entreprise / Formation qualifiante / Contrat aidé / Recherche emploi / Inactif / Sans nouvelles"] },
];

instRows.forEach(({ bold = false, size = 10, data }) => {
  const row = wsI.addRow(data);
  row.getCell(1).font = { name: "Arial", size, bold };
  row.getCell(2).font = { name: "Arial", size: 10 };
  row.getCell(2).alignment = { wrapText: true };
  row.height = bold ? 20 : 16;
});

// ─── Sauvegarde ───────────────────────────────────────────────────────────────
await wb.xlsx.writeFile(OUTPUT);
console.log("✓ Fichier généré :", OUTPUT);
console.log("  Colonnes :", COLS.length, "| Lignes données : 100");
console.log("  Exemple formule C4 :", makeFormula(4, "E11"));
