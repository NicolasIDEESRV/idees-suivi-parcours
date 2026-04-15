export const PRESCRIPTEURS = ["FRANCE TRAVAIL","SERVICES SOCIAUX","CAP EMPLOI","MISSION LOCALE","PLIE","SIAE","SERVICES DE JUSTICE","SANS PRESCRIPTION","AUTRE"];
export const NIVEAUX = ["Niveau 3 (CAP/BEP et moins)","Niveau 4 (Bac ou Bac pro)","Niveau 5 à 8 (Bac+2 et +)"];
export const TYPES_SORTIE = ["Dynamique","Durable","Transition","Positive","Autre","Retrait"];
export const TYPES_ENTRETIEN = ["Accueil","Diagnostic socio-pro","Validation période d'essai","Suivi","Boîte à outils","Définition des objectifs","Bilan intermédiaire","Bilan de sortie","Projet pro","Autre"];
export const FREINS = ["Situation familiale","Logement","Santé","Ressources / Dettes","Mobilité","Parcours scolaire","Niveau de langue","Expériences pro","Autonomie administrative"];
export const FREINS_E = ["IDENTIFIÉ","À TRAITER","EN COURS","OK"];
export const FREINS_S = ["TOUJOURS EXISTANT","EN COURS","RÉSOLU"];
export const BADGES = ["Interaction","Autonomie","Fiabilité","Adaptabilité","Apprendre à apprendre"];
export const NIVEAUX_LANGUE = ["Débutant","A1","A2","B1","B2","C1","Natif"];
export const DOMAINES_PRO = ["Logistique","Environnement","Tri / Recyclage","Manutention","Administration","Accueil","Nettoyage","Restauration","BTP","Autre"];
export const SITUATIONS_SORTIE = ["CDI","CDD +6 mois","CDD -6 mois","Intérim","Création d'entreprise","Formation qualifiante","Contrat aidé","Recherche emploi","Inactif","Sans nouvelles","Décès","Rupture employeur","Décision administrative"];
export const MOYENS_TRANSPORT = ["Transports en commun","Voiture (permis B)","Voiture sans permis","Vélo","Trottinette","À pied","Covoiturage","Autre"];

export const JALONS_DEF = [
  { key: "j1", label: "Diagnostic socio-pro",       type: "Diagnostic socio-pro",       offsetDays: 7,  desc: "1er entretien CIP — Identifier contraintes, besoins, freins, projet pro. Signature engagement.", participants: "CIP + Salarié" },
  { key: "j2", label: "Validation période d'essai", type: "Validation période d'essai", offsetDays: 21, desc: "Vision globale, poursuite parcours, remise passeport métier.",                                  participants: "Encadrant + CIP + Salarié" },
  { key: "j3", label: "Boîte à outils",             type: "Boîte à outils",             offsetDays: 30, desc: "Ouverture CPF + Ameli, prime activité, mise à jour CV.",                                       participants: "CIP + Salarié" },
  { key: "j4", label: "Définition des objectifs",   type: "Définition des objectifs",   offsetDays: 60, desc: "Identification freins prioritaires, projet pro, objectifs avant fin de contrat.",               participants: "CIP + Salarié" },
];
