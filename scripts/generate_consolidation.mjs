// Génère le fichier de consolidation INDIRECT pour import salariés
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.join('C:\\Users\\IRVF_GERLAND\\Downloads\\consolidation_import_salaries.xlsx');

// ─── Définition des colonnes ──────────────────────────────────────────────────
// [db_name, fr_label, source, is_date]
// source: null = saisie manuelle, "XY99" = INDIRECT simple,
//         "BOOL:XY99" = Oui/Non → TRUE/FALSE, "FREIN:XY99" = OUI → IDENTIFIÉ
const COLS = [
  // Col A & B : clés de recherche de l'onglet — saisie manuelle obligatoire
  ["nom",                      "Nom",                             null,        false],
  ["prenom",                   "Prénom",                          null,        false],
  // État civil
  ["nom_naissance",            "Nom de naissance",                "E11",       false],
  ["date_naissance",           "Date naissance (YYYY-MM-DD)",     "J11",       true ],
  ["sexe",                     "Sexe (M ou F)",                   "E12",       false],
  ["nationalite",              "Nationalité",                     "J12",       false],
  ["adresse",                  "Adresse",                         "E13",       false],
  ["cp",                       "Code postal",                     "E14",       false],
  ["ville_residence",          "Ville",                           "J14",       false],
  ["telephone",                "Téléphone",                       "E15",       false],
  ["mail",                     "Email",                           "J15",       false],
  // Parcours IAE
  ["date_entree",              "Date entrée (YYYY-MM-DD)",        "E17",       true ],
  ["date_fin_contrat",         "Fin contrat (YYYY-MM-DD)",        "AL7",       true ],
  ["date_fin_agrement",        "Fin agrément (YYYY-MM-DD)",       "AL8",       true ],
  ["titre_sejour",             "Titre séjour expiration",         "AL9",       false],
  ["id_ft",                    "ID France Travail",               "E18",       false],
  ["date_premier_inscription", "1ère inscription FT (YYYY-MM-DD)","J18",       true ],
  ["prescripteur",             "Prescripteur",                    "E19",       false],
  ["nom_prenom_prescripteur",  "Nom prescripteur",                "J19",       false],
  ["statut_accueil",           "Statut accueil",                  null,        false],
  // Suivi
  ["suivi_spip",               "Suivi SPIP (TRUE/FALSE)",         "BOOL:E20",  false],
  ["coord_spip",               "Coordonnées SPIP",                "J20",       false],
  ["suivi_social",             "Suivi social",                    "J21",       false],
  ["commentaires",             "Commentaires",                    "E21",       false],
  // Éligibilité — saisie manuelle (pas de case dédiée dans la fiche)
  ["deld",                     "DELD (TRUE/FALSE)",               null,        false],
  ["duree_chomage_mois",       "Durée chômage (mois)",            null,        false],
  ["brsa",                     "BRSA (TRUE/FALSE)",               null,        false],
  ["th",                       "TH - Trav. Handicapé",           null,        false],
  ["ass",                      "ASS (TRUE/FALSE)",                null,        false],
  ["sans_ressources",          "Sans ressources (TRUE/FALSE)",    null,        false],
  ["resident_qpv",             "Résident QPV (TRUE/FALSE)",       null,        false],
  // Formation
  ["niveau_formation",         "Niveau formation",                null,        false],
  ["cv",                       "CV (TRUE/FALSE)",                 null,        false],
  ["niveau_langue",            "Niveau langue",                   "F71",       false],
  ["niveaux_scolaire",         "Niveau scolaire",                 "E63",       false],
  ["lecture",                  "Lecture",                         "F64",       false],
  ["ecriture",                 "Écriture",                        "F65",       false],
  ["calcul",                   "Calcul",                          "F66",       false],
  ["diplomes",                 "Diplômes",                        "E67",       false],
  ["formations",               "Formations suivies",              "E68",       false],
  ["experiences_pro",          "Expériences professionnelles",    "E78",       false],
  ["equipement_info",          "Équipement informatique",         "E90",       false],
  ["acces_internet",           "Accès internet (TRUE/FALSE)",     "BOOL:E91",  false],
  // Projet pro
  ["projet_pro",               "Projet pro / Métier visé",        "E84",       false],
  ["domaines_pro_1",           "Domaine pro 1",                   "J84",       false],
  ["domaines_pro_2",           "Domaine pro 2",                   "J85",       false],
  ["domaines_pro_3",           "Domaine pro 3",                   "J86",       false],
  ["preconisation",            "Préconisation",                   null,        false],
  // Situation personnelle
  ["situation_maritale",       "Situation maritale",              "E29",       false],
  ["nb_enfants",               "Nb enfants",                      "E30",       false],
  ["age_enfants",              "Âge des enfants",                 "J30",       false],
  ["mode_garde",               "Mode de garde",                   "E31",       false],
  ["personnes_charge",         "Personnes à charge",              "J31",       false],
  ["hebergement",              "Hébergement",                     "E35",       false],
  ["demarche",                 "Démarches administratives",       "E92",       false],
  ["sports",                   "Sports / Loisirs",                "E96",       false],
  ["benevolat",                "Bénévolat",                       "E97",       false],
  // Santé
  ["securite_sociale",         "Sécurité sociale",                "E39",       false],
  ["css",                      "CSS/Mutuelle (TRUE/FALSE)",       "BOOL:E40",  false],
  ["css_jusqu_au",             "CSS jusqu'au (YYYY-MM-DD)",       "J40",       true ],
  ["restrictions",             "Restrictions / RQTH",             "E41",       false],
  ["traitement",               "Traitement médical",              "E42",       false],
  ["addictions",               "Addictions",                      "E43",       false],
  ["autres_sante",             "Autres (santé)",                  "E44",       false],
  // Ressources
  ["revenus",                  "Revenus (€/mois)",                "E48",       false],
  ["charges",                  "Charges (€/mois)",                "E49",       false],
  ["dettes",                   "Dettes",                          "E50",       false],
  // Mobilité
  ["permis_b",                 "Permis B (TRUE/FALSE)",           "BOOL:E55",  false],
  ["vehicule",                 "Véhicule (TRUE/FALSE)",           "BOOL:J55",  false],
  ["autres_permis",            "Autres permis",                   "E56",       false],
  ["moyen_transport",          "Moyen de transport",              "J56",       false],
  ["deplacements",             "Zone déplacements",               "J57",       false],
  // Freins entrée
  ["frein_situation_familiale","Frein: Sit. familiale",           "FREIN:E32", false],
  ["frein_logement",           "Frein: Logement",                 "FREIN:E36", false],
  ["frein_sante",              "Frein: Santé",                    "FREIN:E45", false],
  ["frein_ressources",         "Frein: Ressources/Dettes",        "FREIN:E52", false],
  ["frein_mobilite",           "Frein: Mobilité",                 "FREIN:E60", false],
  ["frein_parcours_scolaire",  "Frein: Parcours scolaire",        "FREIN:E69", false],
  ["frein_langue",             "Frein: Langue",                   "FREIN:E75", false],
  ["frein_experience_pro",     "Frein: Exp. pro",                 "FREIN:E87", false],
  ["frein_autonomie_admin",    "Frein: Autonomie admin.",          "FREIN:E93", false],
  // Synthèses
  ["synth_besoins_entree",     "Synthèse besoins entrée",         "D100",      false],
  ["synth_parcours",           "Synthèse du parcours",            "AY86",      false],
  // IDs Supabase
  ["site_id",                  "ID Site (UUID Supabase)",         null,        false],
  ["cip_id",                   "ID CIP (UUID Supabase)",          null,        false],
];

// ─── Génération des formules INDIRECT ────────────────────────────────────────
function makeFormula(rowNum, source) {
  const A = `$A${rowNum}`;
  const B = `$B${rowNum}`;
  // Construit: 'NOM Prenom'!CELL
  const sheetRef = (cell) => `"'"&${A}&" "&${B}&"'!${cell}"`;

  if (source === null) return null;

  if (source.startsWith("BOOL:")) {
    const cell = source.slice(5);
    const ind = `INDIRECT(${sheetRef(cell)})`;
    return `=IFERROR(IF(${A}="","",IF(${ind}="Oui",TRUE,IF(${ind}="Non",FALSE,""))),"")`;
  }

  if (source.startsWith("FREIN:")) {
    const cell = source.slice(6);
    const ind = `INDIRECT(${sheetRef(cell)})`;
    return `=IFERROR(IF(${A}="","",IF(${ind}="OUI","IDENTIFIÉ","")),"")`;
  }

  // Simple
  const ind = `INDIRECT(${sheetRef(source)})`;
  return `=IFERROR(IF(${A}="","",${ind}),"")`;
}

// ─── Source annotation label ──────────────────────────────────────────────────
function srcLabel(source) {
  if (source === null) return "✏ SAISIE MANUELLE";
  if (source.startsWith("BOOL:"))  return `⚡ ${source.slice(5)} → TRUE/FALSE`;
  if (source.startsWith("FREIN:")) return `⚡ ${source.slice(6)} → IDENTIFIÉ`;
  return `⚡ ${source}`;
}

// ─── Workbook ─────────────────────────────────────────────────────────────────
const wb = XLSX.utils.book_new();

// ── Feuille 1 : Salariés ──────────────────────────────────────────────────────
const aoa = [];

// Ligne 1 : noms DB
aoa.push(COLS.map(([db]) => db));
// Ligne 2 : labels français
aoa.push(COLS.map(([, fr]) => fr));
// Ligne 3 : annotation source
aoa.push(COLS.map(([, , src]) => srcLabel(src)));
// Lignes 4-103 : formules
for (let row = 4; row <= 103; row++) {
  aoa.push(COLS.map(([, , src]) => makeFormula(row, src) ?? ""));
}

const ws = XLSX.utils.aoa_to_sheet(aoa);

// Largeurs de colonnes
ws["!cols"] = COLS.map(([db, fr]) => ({ wch: Math.max(16, Math.min(34, fr.length + 3)) }));

// Freeze 3 premières lignes + 2 premières colonnes (gel à C4)
ws["!freeze"] = { xSplit: 2, ySplit: 3 };

XLSX.utils.book_append_sheet(wb, ws, "Salariés");

// ── Feuille 2 : Instructions ──────────────────────────────────────────────────
const inst = [
  ["GUIDE — Consolidation des fiches salariés"],
  [""],
  ["ÉTAPES D'UTILISATION"],
  ["1.", "Copier TOUTES vos fiches salariés (onglets 'NOM Prénom') dans CE classeur."],
  ["2.", "Dans l'onglet 'Salariés', saisir le NOM (colonne A) et le Prénom (colonne B) de chaque salarié."],
  ["3.", "Le nom de l'onglet doit être EXACTEMENT : NOM PRÉNOM (ex: MARTIN Jean)"],
  ["4.", "Les cellules à fond VERT se remplissent automatiquement (formules INDIRECT)."],
  ["5.", "Les cellules à fond JAUNE doivent être remplies MANUELLEMENT."],
  [""],
  ["COLONNES À SAISIR MANUELLEMENT (fond jaune)"],
  ["statut_accueil",         "Accueilli / Inscrit / En attente"],
  ["deld / brsa / th / ass", "TRUE ou FALSE"],
  ["duree_chomage_mois",     "Nombre entier de mois"],
  ["sans_ressources",        "TRUE ou FALSE"],
  ["resident_qpv",           "TRUE ou FALSE"],
  ["niveau_formation",       "Niveau 3 (CAP/BEP et moins) / Niveau 4 (Bac ou Bac pro) / Niveau 5 à 8 (Bac+2 et +)"],
  ["cv",                     "TRUE ou FALSE"],
  ["preconisation",          "Texte libre"],
  ["site_id",                "UUID depuis Supabase → Table Editor → sites"],
  ["cip_id",                 "UUID depuis Supabase → Table Editor → profiles"],
  [""],
  ["CONVERSIONS AUTOMATIQUES"],
  ["Oui / Non → TRUE / FALSE", "suivi_spip, css, acces_internet, permis_b, vehicule"],
  ["OUI → IDENTIFIÉ",          "Tous les freins (frein_*)"],
  [""],
  ["IMPORTANT — NOM DE L'ONGLET"],
  ["", "Le nom de l'onglet doit être EXACTEMENT [valeur colonne A] espace [valeur colonne B]"],
  ["", "Exemple : A4=MARTIN  B4=Jean  →  onglet nommé 'MARTIN Jean'"],
  ["", "⚠ Attention aux majuscules, minuscules et aux espaces !"],
  [""],
  ["IMPORT DANS L'APPLICATION"],
  ["1.", "Toutes les lignes remplies → Fichier → Enregistrer sous → CSV UTF-8"],
  ["2.", "Supabase Dashboard → Table Editor → salaries → Import data from CSV"],
  ["3.", "Vérifier le mapping des colonnes puis cliquer Import"],
  [""],
  ["VALEURS ACCEPTÉES"],
  ["prescripteur",       "FRANCE TRAVAIL / SERVICES SOCIAUX / CAP EMPLOI / MISSION LOCALE / PLIE / SIAE / SERVICES DE JUSTICE / SANS PRESCRIPTION / AUTRE"],
  ["niveau_langue",      "Débutant / A1 / A2 / B1 / B2 / C1 / Natif"],
  ["moyen_transport",    "Transports en commun / Voiture (permis B) / Vélo / À pied / Autre"],
];

const wsInst = XLSX.utils.aoa_to_sheet(inst);
wsInst["!cols"] = [{ wch: 28 }, { wch: 90 }];
XLSX.utils.book_append_sheet(wb, wsInst, "Instructions");

// ─── Sauvegarde ───────────────────────────────────────────────────────────────
XLSX.writeFile(wb, OUTPUT);
console.log("✓ Fichier généré :", OUTPUT);
console.log("  Colonnes :", COLS.length);
console.log("  Lignes données : 100 (lignes 4–103)");
console.log("");
console.log("Exemple formule C4 :");
console.log(makeFormula(4, "E11"));
