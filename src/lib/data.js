import { JALONS_DEF } from "./constants";
import { todayStr, addDays } from "./utils";

export const MOCK_USERS = [
  { id: "u1", nom: "GERLAND",  prenom: "Nicolas",    email: "n.gerland@idees.fr", role: "admin", site_id: null, password: "admin123" },
  { id: "u2", nom: "GADY",     prenom: "Emmanuelle", email: "e.gady@idees.fr",    role: "cip",   site_id: "s1", password: "cip123" },
  { id: "u3", nom: "LEBRUN",   prenom: "Sophie",     email: "s.lebrun@idees.fr",  role: "cip",   site_id: "s2", password: "cip456" },
];

export const MOCK_SITES = [
  { id: "s1", nom: "ID'EES R&V — Firminy",           ville: "Firminy" },
  { id: "s2", nom: "ID'EES Logistique — Saint-Étienne", ville: "Saint-Étienne" },
];

export const newSal = (o = {}) => ({
  id: "sal" + Date.now() + Math.random().toString(36).slice(2),
  site_id: "s1", cip_id: "u2",
  nom: "", prenom: "", dateNaissance: "", sexe: "", nationalite: "Française",
  adresse: "", cp: "", ville: "", telephone: "", mail: "",
  dateEntree: todayStr, dateSortie: "", dateFinContrat: "", dateFinAgrement: "",
  titreSejour: "", idFT: "", datePremierInscription: "",
  prescripteur: "FRANCE TRAVAIL", nomPrenomPrescripteur: "",
  suiviSPIP: false, coordSPIP: "", commentaires: "", suiviSocial: "",
  statutAccueil: "Inscrit", deld: false, dureeCHomageMois: 0,
  brsa: false, th: false, ass: false, sansRessources: false, residentQPV: false,
  heuresTravaillees: 0,
  niveauFormation: "Niveau 3 (CAP/BEP et moins)",
  cv: false, niveauLangue: "A1", projetPro: "", domainesPro: ["", "", ""],
  preconisation: "", situationMaritale: "", nbEnfants: 0, ageEnfants: "",
  modeGarde: "", hebergement: "",
  securiteSociale: "Oui", css: false, cssJusquau: "",
  restrictions: "", traitement: "", addictions: "",
  revenus: 0, charges: 0, dettes: "",
  permisB: false, vehicule: false, moyenTransport: "", deplacements: "",
  niveauScolaire: "", lecture: false, ecriture: false, calcul: false,
  diplomes: "", formations: "", equipementInfo: "", accesInternet: false,
  demarche: "", sports: "", benevolat: "",
  freinsEntree: {}, freinsSortie: {}, badges: {},
  typeSortie: "", situationSortie: "", dateFirstEmploi: "",
  accordSuiviPost: false, accordTransmission: false, aRappeler: false,
  synthBesoinsEntree: "", synthBesoinsSortie: "", synthParcours: "",
  // Candidat
  isCandidat: false,
  candidatureRecueLe: "", appelerLe: "", vuEntretienLe: "",
  impressionGlobale: "", impressionDetail: "",
  orientationCandidat: "", orientationMotif: "", orientationSiteId: null,
  activitesPrio: [],
  // Sécurité sociale
  numSecuSociale: "",
  ...o,
});

export const genJalons = (dateEntree, salId, cipId) =>
  JALONS_DEF.map(j => ({
    id: "j_" + j.key + "_" + Date.now() + Math.random().toString(36).slice(2),
    salarie_id: salId, cip_id: cipId, assignedTo: cipId,
    type: j.type, date: addDays(dateEntree, j.offsetDays),
    sujets: j.desc, synthese: "", participants: j.participants,
    jalon: true, jalonKey: j.key, jalonLabel: j.label,
    confirmed: false, objectifs: [],
  }));

export const MOCK_SAL = [
  newSal({
    id: "sal1", nom: "D'ASCIANO", prenom: "Sabrina", dateNaissance: "1985-06-14", sexe: "F",
    dateEntree: "2024-01-15", dateFinContrat: addDays(todayStr, 25), dateFinAgrement: addDays(todayStr, 55),
    prescripteur: "SERVICES SOCIAUX", nomPrenomPrescripteur: "Marie DUPONT",
    cv: true, niveauLangue: "B1", deld: true, dureeCHomageMois: 14, brsa: true, residentQPV: true,
    heuresTravaillees: 920, niveauFormation: "Niveau 3 (CAP/BEP et moins)",
    projetPro: "Agent de tri / Logistique", domainesPro: ["Logistique", "Environnement", ""],
    preconisation: "Remise à niveau FLE + permis B",
    hebergement: "Locataire", permisB: false, vehicule: false, moyenTransport: "Transports en commun",
    freinsEntree: {
      "Situation familiale": "À TRAITER", "Logement": "OK", "Santé": "EN COURS",
      "Ressources / Dettes": "À TRAITER", "Mobilité": "IDENTIFIÉ", "Parcours scolaire": "EN COURS",
      "Niveau de langue": "OK", "Expériences pro": "IDENTIFIÉ", "Autonomie administrative": "OK",
    },
    badges: { "Interaction": 3, "Autonomie": 2, "Fiabilité": 4, "Adaptabilité": 3, "Apprendre à apprendre": 2 },
    synthBesoinsEntree: "Salarié motivée, freins : mobilité et ressources.",
  }),
  newSal({
    id: "sal2", nom: "BENALI", prenom: "Karim", dateNaissance: "1992-03-22", sexe: "M",
    dateEntree: "2024-04-01", dateFinContrat: addDays(todayStr, 90), dateFinAgrement: addDays(todayStr, 120),
    prescripteur: "SANS PRESCRIPTION",
    cv: false, niveauLangue: "Natif", heuresTravaillees: 720,
    niveauFormation: "Niveau 3 (CAP/BEP et moins)",
    projetPro: "Logistique", domainesPro: ["Logistique", "", ""],
    preconisation: "Savoir-être",
    hebergement: "Hébergé famille", permisB: true, vehicule: false, moyenTransport: "Vélo",
    freinsEntree: {
      "Situation familiale": "OK", "Logement": "À TRAITER", "Santé": "OK",
      "Ressources / Dettes": "OK", "Mobilité": "OK", "Parcours scolaire": "À TRAITER",
      "Niveau de langue": "OK", "Expériences pro": "À TRAITER", "Autonomie administrative": "IDENTIFIÉ",
    },
    badges: { "Interaction": 2, "Autonomie": 1, "Fiabilité": 2, "Adaptabilité": 2, "Apprendre à apprendre": 1 },
    synthBesoinsEntree: "Jeune en difficulté.",
  }),
  newSal({
    id: "sal3", site_id: "s2", cip_id: "u3",
    nom: "FONTAINE", prenom: "Djamila", dateNaissance: "1978-11-05", sexe: "F",
    dateEntree: "2023-09-01", dateSortie: "2024-06-30",
    dateFinContrat: "2024-08-31", dateFinAgrement: "2024-09-30",
    prescripteur: "FRANCE TRAVAIL",
    cv: true, niveauLangue: "Natif", deld: true, th: true, residentQPV: true,
    heuresTravaillees: 980, niveauFormation: "Niveau 4 (Bac ou Bac pro)",
    projetPro: "Assistante administrative", domainesPro: ["Administration", "Accueil", ""],
    preconisation: "Formation bureautique",
    hebergement: "Locataire", permisB: true, vehicule: true, moyenTransport: "Voiture (permis B)",
    freinsEntree: {
      "Situation familiale": "OK", "Logement": "OK", "Santé": "EN COURS",
      "Ressources / Dettes": "OK", "Mobilité": "OK", "Parcours scolaire": "OK",
      "Niveau de langue": "OK", "Expériences pro": "À TRAITER", "Autonomie administrative": "OK",
    },
    freinsSortie: {
      "Situation familiale": "RÉSOLU", "Logement": "RÉSOLU", "Santé": "EN COURS",
      "Ressources / Dettes": "RÉSOLU", "Mobilité": "RÉSOLU", "Parcours scolaire": "RÉSOLU",
      "Niveau de langue": "RÉSOLU", "Expériences pro": "RÉSOLU", "Autonomie administrative": "RÉSOLU",
    },
    badges: { "Interaction": 4, "Autonomie": 3, "Fiabilité": 4, "Adaptabilité": 3, "Apprendre à apprendre": 3 },
    typeSortie: "Durable", situationSortie: "CDI", dateFirstEmploi: "2024-05-01",
    accordSuiviPost: true, accordTransmission: true,
    synthBesoinsEntree: "Bonne autonomie.", synthBesoinsSortie: "Compétences consolidées.",
    synthParcours: "Sortie en emploi durable.",
  }),
];

export const MOCK_ENT = [
  { id: "e1", salarie_id: "sal1", cip_id: "u2", assignedTo: "u2", date: "2024-01-15", type: "Accueil",           sujets: "Présentation structure",  synthese: "Bonne réceptivité.", jalon: false, objectifs: [] },
  { id: "e2", salarie_id: "sal1", cip_id: "u2", assignedTo: "u2", date: "2024-03-01", type: "Suivi",             sujets: "Freins mobilité",         synthese: "Progrès notables.",  jalon: false, objectifs: [] },
  { id: "e3", salarie_id: "sal1", cip_id: "u2", assignedTo: "u2", date: addDays(todayStr, 15), type: "Bilan intermédiaire", sujets: "", synthese: "", jalon: false, objectifs: [] },
  {
    id: "e_obj1", salarie_id: "sal1", cip_id: "u2", assignedTo: "u2",
    date: "2024-02-15", type: "Définition des objectifs",
    sujets: "Objectifs prioritaires", synthese: "3 objectifs définis.",
    jalon: false, dateBilan: addDays(todayStr, 10),
    objectifs: [
      { id: "ob1", intitule: "Obtenir le permis B",   deadline: addDays(todayStr, 90), atteint: null,  commentaire: "" },
      { id: "ob2", intitule: "Mettre à jour le CV",   deadline: addDays(todayStr, 5),  atteint: true,  commentaire: "CV mis à jour le 15/03" },
      { id: "ob3", intitule: "Ouvrir son compte CPF", deadline: addDays(todayStr, -10),atteint: null,  commentaire: "" },
    ],
  },
  { id: "e4", salarie_id: "sal2", cip_id: "u2", assignedTo: "u2", date: "2024-04-01", type: "Accueil", sujets: "Contexte judiciaire", synthese: "Méfiance initiale.", jalon: false, objectifs: [] },
  { id: "e5", salarie_id: "sal3", cip_id: "u3", assignedTo: "u3", date: "2023-09-01", type: "Accueil", sujets: "Présentation",        synthese: "Très motivée.",     jalon: false, objectifs: [] },
];
