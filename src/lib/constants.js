export const PRESCRIPTEURS = ["FRANCE TRAVAIL","SERVICES SOCIAUX","CAP EMPLOI","MISSION LOCALE","PLIE","SIAE","SERVICES DE JUSTICE","SANS PRESCRIPTION","AUTRE"];
export const NIVEAUX = ["Niveau 3 (CAP/BEP et moins)","Niveau 4 (Bac ou Bac pro)","Niveau 5 à 8 (Bac+2 et +)"];
// Nouveau système de types de sortie ASP
export const TYPES_SORTIE_ASP = [
  { code: "CDI",        label: "CDI",        categorie: "Emplois durables",      codeASP: "04", motifGuidance: "DATE DEBUT · POSTE · ENTREPRISE · (info supplémentaire)" },
  { code: "CDIA",       label: "CDIA",       categorie: "Emplois durables",      codeASP: "19", motifGuidance: "DATE DEBUT · POSTE · ENTREPRISE · (info supplémentaire)" },
  { code: "CDISTRUCT",  label: "CDISTRUCT",  categorie: "Emplois durables",      codeASP: "01", motifGuidance: "DATE DEBUT · FILIALE EI/ETTI DU GROUPE · POSTE" },
  { code: "CDD P6",     label: "CDD P6",     categorie: "Emplois durables",      codeASP: "13", motifGuidance: "TYPE CONTRAT (CDD/CTT) · DURÉE · POSTE · ENTREPRISE" },
  { code: "INST",       label: "INST",       categorie: "Emplois durables",      codeASP: "07", motifGuidance: "STATUT · DATE DEBUT · POSTE" },
  { code: "INT FP",     label: "INT FP",     categorie: "Emplois durables",      codeASP: "17", motifGuidance: "TYPE CONTRAT · DATE DEBUT · POSTE · ENTREPRISE" },
  { code: "CDD M6",     label: "CDD M6",     categorie: "Emplois de transition", codeASP: "14", motifGuidance: "TYPE CONTRAT (CTT/CDD) · DURÉE · POSTE · ENTREPRISE" },
  { code: "CDDA",       label: "CDDA",       categorie: "Emplois de transition", codeASP: "20", motifGuidance: "TYPE CONTRAT (CTT/CDD) · DURÉE · POSTE · ENTREPRISE" },
  { code: "EMB SIAE",   label: "EMB SIAE",   categorie: "Sorties positives",     codeASP: "02", motifGuidance: "TYPE CONTRAT · DURÉE · POSTE · NOM SIAE" },
  { code: "FORMA",      label: "FORMA",      categorie: "Sorties positives",     codeASP: "08", motifGuidance: "INTITULÉ FORMATION · DURÉE · ORGANISME" },
  { code: "ASP",        label: "ASP",        categorie: "Sorties positives",     codeASP: "18", motifGuidance: "MOTIF · DATE" },
  { code: "RETRAITE",   label: "RETRAITE",   categorie: "Sorties positives",     codeASP: "21", motifGuidance: "DATE DEBUT" },
  { code: "CHOMAGE",    label: "CHOMAGE",    categorie: "Autres sorties",        codeASP: "10", motifGuidance: "CHOMAGE / FIN AGRÉMENT / ARRÊT PARCOURS · DATE" },
  { code: "SANSNOUV",   label: "SANSNOUV",   categorie: "Autres sorties",        codeASP: "12", motifGuidance: "DATE" },
  { code: "ESSAI EU",   label: "ESSAI EU",   categorie: "Autres sorties",        codeASP: "26", motifGuidance: "DATE DEBUT" },
  { code: "ESSAI SA",   label: "ESSAI SA",   categorie: "Autres sorties",        codeASP: "27", motifGuidance: "DATE" },
  { code: "INACTIF",    label: "INACTIF",    categorie: "Autres sorties",        codeASP: "09", motifGuidance: "DATE" },
  { code: "RUPTURE_FG", label: "RUPTURE FG", categorie: "Retraits",              codeASP: "25", motifGuidance: "DATE" },
  { code: "CONGELD",    label: "CONGELD",    categorie: "Retraits",              codeASP: "22", motifGuidance: "TYPE · DATE DEBUT · DURÉE" },
  { code: "DECES",      label: "DECES",      categorie: "Retraits",              codeASP: "23", motifGuidance: "DATE" },
  { code: "JUSTICE",    label: "JUSTICE",    categorie: "Retraits",              codeASP: "24", motifGuidance: "DATE DEBUT · DURÉE" },
];
export const TYPES_SORTIE = TYPES_SORTIE_ASP.map(t => t.code);
export function getTypeSortieASP(code) { return TYPES_SORTIE_ASP.find(t => t.code === code) ?? null; }
export const TYPES_SORTIE_PAR_CAT = TYPES_SORTIE_ASP.reduce((acc, t) => { (acc[t.categorie] = acc[t.categorie] || []).push(t); return acc; }, {});
export const TYPES_ENTRETIEN = ["Accueil","Diagnostic socio-pro","Validation période d'essai","Suivi","Boîte à outils","Définition des objectifs","Bilan intermédiaire","Bilan de sortie","Projet pro","Autre"];
export const FREINS = ["Situation familiale","Logement","Santé","Ressources / Dettes","Mobilité","Parcours scolaire","Niveau de langue","Expériences pro","Autonomie administrative"];
export const FREINS_E = ["IDENTIFIÉ","À TRAITER","EN COURS","OK"];
export const FREINS_S = ["TOUJOURS EXISTANT","EN COURS","RÉSOLU"];
export const BADGES = ["Interaction","Autonomie","Fiabilité","Adaptabilité","Apprendre à apprendre"];
export const NIVEAUX_LANGUE = ["Débutant","A1","A2","B1","B2","C1","Natif"];
export const DOMAINES_PRO = ["Logistique","Environnement","Tri / Recyclage","Manutention","Administration","Accueil","Nettoyage","Restauration","BTP","Autre"];
export const MOYENS_TRANSPORT = ["Transports en commun","Voiture (permis B)","Voiture sans permis","Vélo","Trottinette","À pied","Covoiturage","Autre"];

export const JALONS_DEF = [
  { key: "j1", label: "Diagnostic socio-pro",       type: "Diagnostic socio-pro",       offsetDays: 7,  desc: "1er entretien CIP — Identifier contraintes, besoins, freins, projet pro. Signature engagement.", participants: "CIP + Salarié" },
  { key: "j2", label: "Validation période d'essai", type: "Validation période d'essai", offsetDays: 21, desc: "Vision globale, poursuite parcours, remise passeport métier.",                                  participants: "Encadrant + CIP + Salarié" },
  { key: "j3", label: "Boîte à outils",             type: "Boîte à outils",             offsetDays: 30, desc: "Ouverture CPF + Ameli, prime activité, mise à jour CV.",                                       participants: "CIP + Salarié" },
  { key: "j4", label: "Définition des objectifs",   type: "Définition des objectifs",   offsetDays: 60, desc: "Identification freins prioritaires, projet pro, objectifs avant fin de contrat.",               participants: "CIP + Salarié" },
];
