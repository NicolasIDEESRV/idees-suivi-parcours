// Génère le template d'import salariés (Excel .xlsx)
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.join(__dirname, '..', 'template_import_salaries_complet.xlsx');

// ─── Définition des colonnes ──────────────────────────────────────────────────
const COLS = [
  // État civil
  { db: 'nom',                  fr: 'Nom',                          group: 'ÉTAT CIVIL' },
  { db: 'prenom',               fr: 'Prénom',                       group: 'ÉTAT CIVIL' },
  { db: 'nom_naissance',        fr: 'Nom de naissance',             group: 'ÉTAT CIVIL' },
  { db: 'date_naissance',       fr: 'Date naissance (YYYY-MM-DD)',   group: 'ÉTAT CIVIL' },
  { db: 'sexe',                 fr: 'Sexe (M ou F)',                group: 'ÉTAT CIVIL' },
  { db: 'nationalite',          fr: 'Nationalité',                  group: 'ÉTAT CIVIL' },
  { db: 'adresse',              fr: 'Adresse',                      group: 'ÉTAT CIVIL' },
  { db: 'cp',                   fr: 'Code postal',                  group: 'ÉTAT CIVIL' },
  { db: 'ville_residence',      fr: 'Ville',                        group: 'ÉTAT CIVIL' },
  { db: 'telephone',            fr: 'Téléphone',                    group: 'ÉTAT CIVIL' },
  { db: 'mail',                 fr: 'Email',                        group: 'ÉTAT CIVIL' },
  // Parcours IAE
  { db: 'date_entree',          fr: 'Date entrée (YYYY-MM-DD)',      group: 'PARCOURS IAE' },
  { db: 'date_fin_contrat',     fr: 'Fin contrat (YYYY-MM-DD)',      group: 'PARCOURS IAE' },
  { db: 'date_fin_agrement',    fr: 'Fin agrément (YYYY-MM-DD)',     group: 'PARCOURS IAE' },
  { db: 'titre_sejour',         fr: 'Titre séjour expiration',       group: 'PARCOURS IAE' },
  { db: 'id_ft',                fr: 'ID France Travail',             group: 'PARCOURS IAE' },
  { db: 'date_premier_inscription', fr: '1ère inscription FT',      group: 'PARCOURS IAE' },
  { db: 'prescripteur',         fr: 'Prescripteur',                 group: 'PARCOURS IAE' },
  { db: 'nom_prenom_prescripteur', fr: 'Nom prescripteur',          group: 'PARCOURS IAE' },
  { db: 'statut_accueil',       fr: 'Statut accueil',               group: 'PARCOURS IAE' },
  // Suivi
  { db: 'suivi_spip',           fr: 'Suivi SPIP (TRUE/FALSE)',       group: 'SUIVI' },
  { db: 'coord_spip',           fr: 'Coordonnées SPIP',             group: 'SUIVI' },
  { db: 'suivi_social',         fr: 'Suivi social',                 group: 'SUIVI' },
  { db: 'commentaires',         fr: 'Commentaires',                 group: 'SUIVI' },
  // Critères éligibilité
  { db: 'deld',                 fr: 'DELD (TRUE/FALSE)',             group: 'ÉLIGIBILITÉ' },
  { db: 'duree_chomage_mois',   fr: 'Durée chômage (mois)',          group: 'ÉLIGIBILITÉ' },
  { db: 'brsa',                 fr: 'BRSA (TRUE/FALSE)',             group: 'ÉLIGIBILITÉ' },
  { db: 'th',                   fr: 'TH - Trav. Handicapé',         group: 'ÉLIGIBILITÉ' },
  { db: 'ass',                  fr: 'ASS (TRUE/FALSE)',              group: 'ÉLIGIBILITÉ' },
  { db: 'sans_ressources',      fr: 'Sans ressources (TRUE/FALSE)',  group: 'ÉLIGIBILITÉ' },
  { db: 'resident_qpv',         fr: 'Résident QPV (TRUE/FALSE)',     group: 'ÉLIGIBILITÉ' },
  // Formation
  { db: 'niveau_formation',     fr: 'Niveau formation',             group: 'FORMATION' },
  { db: 'cv',                   fr: 'CV (TRUE/FALSE)',               group: 'FORMATION' },
  { db: 'niveau_langue',        fr: 'Niveau langue',                group: 'FORMATION' },
  { db: 'niveaux_scolaire',     fr: 'Niveau scolaire',              group: 'FORMATION' },
  { db: 'lecture',              fr: 'Lecture (TRUE/FALSE)',          group: 'FORMATION' },
  { db: 'ecriture',             fr: 'Écriture (TRUE/FALSE)',         group: 'FORMATION' },
  { db: 'calcul',               fr: 'Calcul (TRUE/FALSE)',           group: 'FORMATION' },
  { db: 'diplomes',             fr: 'Diplômes',                     group: 'FORMATION' },
  { db: 'formations',           fr: 'Formations suivies',           group: 'FORMATION' },
  { db: 'experiences_pro',      fr: 'Expériences professionnelles',  group: 'FORMATION' },
  { db: 'equipement_info',      fr: 'Équipement informatique',       group: 'FORMATION' },
  { db: 'acces_internet',       fr: 'Accès internet (TRUE/FALSE)',   group: 'FORMATION' },
  // Projet pro
  { db: 'projet_pro',           fr: 'Projet pro / Métier visé',     group: 'PROJET PRO' },
  { db: 'domaines_pro_1',       fr: 'Domaine pro 1',                group: 'PROJET PRO' },
  { db: 'domaines_pro_2',       fr: 'Domaine pro 2',                group: 'PROJET PRO' },
  { db: 'domaines_pro_3',       fr: 'Domaine pro 3',                group: 'PROJET PRO' },
  { db: 'preconisation',        fr: 'Préconisation',                group: 'PROJET PRO' },
  // Situation personnelle
  { db: 'situation_maritale',   fr: 'Situation maritale',           group: 'SITUATION PERS.' },
  { db: 'nb_enfants',           fr: 'Nb enfants',                   group: 'SITUATION PERS.' },
  { db: 'age_enfants',          fr: 'Âge des enfants',              group: 'SITUATION PERS.' },
  { db: 'mode_garde',           fr: 'Mode de garde',                group: 'SITUATION PERS.' },
  { db: 'personnes_charge',     fr: 'Personnes à charge',           group: 'SITUATION PERS.' },
  { db: 'hebergement',          fr: 'Hébergement',                  group: 'SITUATION PERS.' },
  { db: 'demarche',             fr: 'Démarches administratives',    group: 'SITUATION PERS.' },
  { db: 'sports',               fr: 'Sports / Loisirs',             group: 'SITUATION PERS.' },
  { db: 'benevolat',            fr: 'Bénévolat',                    group: 'SITUATION PERS.' },
  // Santé
  { db: 'securite_sociale',     fr: 'Sécurité sociale',             group: 'SANTÉ' },
  { db: 'css',                  fr: 'CSS/Mutuelle (TRUE/FALSE)',     group: 'SANTÉ' },
  { db: 'css_jusqu_au',         fr: 'CSS jusqu\'au (YYYY-MM-DD)',   group: 'SANTÉ' },
  { db: 'restrictions',         fr: 'Restrictions / RQTH',          group: 'SANTÉ' },
  { db: 'traitement',           fr: 'Traitement médical',           group: 'SANTÉ' },
  { db: 'addictions',           fr: 'Addictions',                   group: 'SANTÉ' },
  { db: 'autres_sante',         fr: 'Autres (santé)',               group: 'SANTÉ' },
  // Ressources
  { db: 'revenus',              fr: 'Revenus (€/mois)',              group: 'RESSOURCES' },
  { db: 'charges',              fr: 'Charges (€/mois)',              group: 'RESSOURCES' },
  { db: 'dettes',               fr: 'Dettes',                       group: 'RESSOURCES' },
  // Mobilité
  { db: 'permis_b',             fr: 'Permis B (TRUE/FALSE)',         group: 'MOBILITÉ' },
  { db: 'vehicule',             fr: 'Véhicule (TRUE/FALSE)',         group: 'MOBILITÉ' },
  { db: 'autres_permis',        fr: 'Autres permis',                group: 'MOBILITÉ' },
  { db: 'moyen_transport',      fr: 'Moyen de transport',           group: 'MOBILITÉ' },
  { db: 'deplacements',         fr: 'Zone déplacements',            group: 'MOBILITÉ' },
  // Freins
  { db: 'frein_situation_familiale', fr: 'Frein: Sit. familiale',   group: 'FREINS ENTRÉE' },
  { db: 'frein_logement',       fr: 'Frein: Logement',              group: 'FREINS ENTRÉE' },
  { db: 'frein_sante',          fr: 'Frein: Santé',                 group: 'FREINS ENTRÉE' },
  { db: 'frein_ressources',     fr: 'Frein: Ressources/Dettes',     group: 'FREINS ENTRÉE' },
  { db: 'frein_mobilite',       fr: 'Frein: Mobilité',              group: 'FREINS ENTRÉE' },
  { db: 'frein_parcours_scolaire', fr: 'Frein: Parcours scolaire',  group: 'FREINS ENTRÉE' },
  { db: 'frein_langue',         fr: 'Frein: Langue',                group: 'FREINS ENTRÉE' },
  { db: 'frein_experience_pro', fr: 'Frein: Exp. pro',              group: 'FREINS ENTRÉE' },
  { db: 'frein_autonomie_admin',fr: 'Frein: Autonomie admin.',       group: 'FREINS ENTRÉE' },
  // Synthèses
  { db: 'synth_besoins_entree', fr: 'Synthèse besoins entrée',      group: 'SYNTHÈSES' },
  { db: 'synth_parcours',       fr: 'Synthèse du parcours',         group: 'SYNTHÈSES' },
  // IDs Supabase
  { db: 'site_id',              fr: 'ID Site (UUID Supabase)',       group: 'IDs SUPABASE' },
  { db: 'cip_id',               fr: 'ID CIP (UUID Supabase)',        group: 'IDs SUPABASE' },
];

// Exemple de ligne
const EXEMPLE = [
  'Martin', 'Jean', '', '1985-06-15', 'M', 'Française',
  '12 rue des Acacias', '42700', 'Firminy', '0612345678', 'jean.martin@mail.fr',
  '2024-01-15', '2025-01-14', '2025-01-14', '', '1234567A', '2020-03-01',
  'FRANCE TRAVAIL', 'Dupont Marie', 'Inscrit',
  'FALSE', '', 'Suivi AS', '',
  'TRUE', '18', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE',
  'Niveau 3 (CAP/BEP et moins)', 'FALSE', 'A2', 'CM2', 'TRUE', 'TRUE', 'TRUE',
  'CAP Plomberie', 'SST 2023', 'Régie municipale 2019-2021', 'Oui', 'TRUE',
  'Tri des déchets', 'Environnement', '', '', 'Formation qualifiante',
  'Célibataire', '2', '8, 12', 'Famille', 'Mère', 'Locataire', 'CAF en cours', 'Football', '',
  'Oui', 'FALSE', '', '', '', '', '',
  '1200', '800', '',
  'TRUE', 'FALSE', '', 'Transports en commun', 'Firminy + Saint-Étienne',
  'EN COURS', '', '', '', 'OK', '', '', '', '',
  'Difficultés de mobilité à l\'entrée', '',
  '00000000-0000-0000-0000-000000000001', '(UUID du CIP)',
];

// ─── Créer le workbook ────────────────────────────────────────────────────────
const wb = XLSX.utils.book_new();

// ─── SHEET 1 : Salariés ───────────────────────────────────────────────────────
const sheetData = [
  COLS.map(c => c.db),                              // Ligne 1 : noms DB
  COLS.map(c => c.fr),                              // Ligne 2 : labels français
  ['⚠ EXEMPLE - NE PAS IMPORTER', ...EXEMPLE.slice(1)],  // Ligne 3 : exemple
  ...Array(100).fill(COLS.map(() => '')),            // Lignes 4-103 : vides
];

const ws = XLSX.utils.aoa_to_sheet(sheetData);

// Largeurs de colonnes
ws['!cols'] = COLS.map(c => ({ wch: Math.min(35, Math.max(14, c.fr.length + 2)) }));

// Freeze 2 premières lignes
ws['!freeze'] = { xSplit: 0, ySplit: 2 };

XLSX.utils.book_append_sheet(wb, ws, 'Salariés');

// ─── SHEET 2 : Instructions ───────────────────────────────────────────────────
const instructions = [
  ['GUIDE D\'IMPORTATION DES SALARIÉS — ID\'EES Suivi Parcours'],
  [''],
  ['AVANT DE COMMENCER'],
  ['1. Supprimer la ligne 3 (exemple) avant d\'importer'],
  ['2. Remplir une ligne par salarié (ne pas modifier les noms de colonnes en ligne 1)'],
  ['3. Sauvegarder en CSV UTF-8 pour l\'import Supabase'],
  ['4. Les cellules vides = valeur NULL en base de données'],
  [''],
  ['OBTENIR LES UUID'],
  ['site_id', '→ Supabase Dashboard → Table Editor → sites → copier l\'UUID de votre site'],
  ['cip_id',  '→ Supabase Dashboard → Table Editor → profiles → copier l\'UUID du CIP'],
  [''],
  ['FORMATS OBLIGATOIRES'],
  ['Champ', 'Format', 'Exemple'],
  ['Dates', 'YYYY-MM-DD', '2024-01-15'],
  ['Booléens', 'TRUE ou FALSE (majuscules)', 'TRUE'],
  ['Vide/inconnu', 'Laisser la cellule vide', ''],
  ['Revenus/Charges', 'Nombre entier (€)', '1200'],
  [''],
  ['VALEURS ACCEPTÉES PAR CHAMP'],
  ['prescripteur', 'FRANCE TRAVAIL / SERVICES SOCIAUX / CAP EMPLOI / MISSION LOCALE / PLIE / SIAE / SERVICES DE JUSTICE / SANS PRESCRIPTION / AUTRE'],
  ['statut_accueil', 'Accueilli / Inscrit / En attente'],
  ['niveau_formation', 'Niveau 3 (CAP/BEP et moins) / Niveau 4 (Bac ou Bac pro) / Niveau 5 à 8 (Bac+2 et +)'],
  ['niveau_langue', 'Débutant / A1 / A2 / B1 / B2 / C1 / Natif'],
  ['moyen_transport', 'Transports en commun / Voiture (permis B) / Vélo / À pied / Autre'],
  ['freins (colonnes frein_*)', 'IDENTIFIÉ / À TRAITER / EN COURS / OK   (laisser vide = pas de frein)'],
  [''],
  ['IMPORT DANS SUPABASE'],
  ['1.', 'Enregistrer le fichier en CSV (Fichier → Enregistrer sous → CSV UTF-8)'],
  ['2.', 'Supabase Dashboard → Table Editor → salaries'],
  ['3.', 'Bouton "Insert" → "Import data from CSV"'],
  ['4.', 'Vérifier le mapping des colonnes'],
  ['5.', 'Cliquer "Import"'],
  [''],
  ['NOTE IMPORTANTE — domaines_pro'],
  ['Les colonnes domaines_pro_1, domaines_pro_2, domaines_pro_3 doivent être'],
  ['converties en tableau après l\'import CSV via SQL Editor :'],
  ['UPDATE salaries SET domaines_pro = ARRAY[domaines_pro_1, domaines_pro_2, domaines_pro_3]'],
  ['(cette étape sera automatisée dans une prochaine version)'],
  [''],
  ['GROUPES DE COLONNES DANS LE FICHIER'],
  ['Groupe', 'Colonnes DB', 'Description'],
  ['ÉTAT CIVIL', 'nom → mail', 'Identité et coordonnées'],
  ['PARCOURS IAE', 'date_entree → statut_accueil', 'Dates et prescripteur'],
  ['SUIVI', 'suivi_spip → commentaires', 'Suivi judiciaire et social'],
  ['ÉLIGIBILITÉ', 'deld → resident_qpv', 'Critères IAE (booléens)'],
  ['FORMATION', 'niveau_formation → acces_internet', 'Compétences et formation'],
  ['PROJET PRO', 'projet_pro → preconisation', 'Objectif professionnel'],
  ['SITUATION PERS.', 'situation_maritale → benevolat', 'Vie personnelle'],
  ['SANTÉ', 'securite_sociale → autres_sante', 'Informations santé'],
  ['RESSOURCES', 'revenus → dettes', 'Situation financière'],
  ['MOBILITÉ', 'permis_b → deplacements', 'Transport et déplacements'],
  ['FREINS ENTRÉE', 'frein_* (9 colonnes)', 'IDENTIFIÉ / À TRAITER / EN COURS / OK'],
  ['SYNTHÈSES', 'synth_besoins_entree, synth_parcours', 'Textes libres de synthèse'],
  ['IDs SUPABASE', 'site_id, cip_id', 'UUID à copier depuis Supabase'],
];

const wsInstr = XLSX.utils.aoa_to_sheet(instructions);
wsInstr['!cols'] = [{ wch: 25 }, { wch: 85 }, { wch: 30 }];
XLSX.utils.book_append_sheet(wb, wsInstr, 'Instructions');

// ─── Sauvegarder ─────────────────────────────────────────────────────────────
XLSX.writeFile(wb, OUTPUT);
console.log('✓ Template généré :', OUTPUT);
console.log('  Colonnes :', COLS.length);
console.log('  Lignes données : 100 (+ 3 header/exemple)');
