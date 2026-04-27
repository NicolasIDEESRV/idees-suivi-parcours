// ════════════════════════════════════════════════════════════════════════════
// MAPPERS — conversion DB (snake_case) ↔ App (camelCase)
//
// Hiérarchie organisationnelle :
//   Groupe  = ID'EES (organisation racine, gérée en config)
//   Filiale = table `sites`  (ex. ID'EES R&V, ID'EES Logistique)
//   Secteur / Activité = extension future sur `sites`
// ════════════════════════════════════════════════════════════════════════════

// ─── PROFILE (utilisateur) ───────────────────────────────────────────────────
export const mapProfileFromDB = (row) => ({
  id:        row.id,
  nom:       row.nom,
  prenom:    row.prenom,
  email:     row.email,
  role:      row.role,        // 'admin' | 'direction' | 'cip'
  site_id:   row.site_id,    // premier site (rétrocompatibilité)
  // Tableau de tous les site_id accessibles (prioritaire sur site_id)
  site_ids:  Array.isArray(row.site_ids) && row.site_ids.length > 0
               ? row.site_ids
               : (row.site_id ? [row.site_id] : []),
  actif:     row.actif,
});

// ─── SITE ────────────────────────────────────────────────────────────────────
export const mapSiteFromDB = (row) => ({
  id:       row.id,
  nom:      row.nom,
  ville:    row.ville,
  filiale:  row.filiale  ?? null,  // Niveau 1 : ex. ID'EES R&V
  secteur:  row.secteur  ?? null,  // Niveau 2 : ex. Tri des déchets
  activite: row.activite ?? null,  // Niveau 3 : ex. Tri sélectif
  actif:    row.actif,
});

// ─── SALARIÉ ─────────────────────────────────────────────────────────────────

/** DB row → objet JS utilisé par les composants */
export const mapSalarieFromDB = (row) => ({
  id:      row.id,
  site_id: row.site_id,
  cip_id:  row.cip_id,

  // État civil
  nom:            row.nom,
  prenom:         row.prenom,
  nomNaissance:   row.nom_naissance   ?? "",
  dateNaissance:  row.date_naissance  ?? "",
  sexe:           row.sexe            ?? "",
  nationalite:    row.nationalite     ?? "Française",
  adresse:        row.adresse         ?? "",
  cp:             row.cp              ?? "",
  ville:          row.ville_residence ?? "",
  telephone:      row.telephone       ?? "",
  mail:           row.mail            ?? "",

  // Parcours IAE
  dateEntree:              row.date_entree               ?? "",
  dateSortie:              row.date_sortie               ?? "",
  dateFinContrat:          row.date_fin_contrat          ?? "",
  dateFinAgrement:         row.date_fin_agrement         ?? "",
  titreSejour:             row.titre_sejour              ?? "",
  idFT:                    row.id_ft                     ?? "",
  datePremierInscription:  row.date_premier_inscription  ?? "",
  prescripteur:            row.prescripteur              ?? "FRANCE TRAVAIL",
  nomPrenomPrescripteur:   row.nom_prenom_prescripteur   ?? "",
  statutAccueil:           row.statut_accueil            ?? "Inscrit",

  // Suivi judiciaire / social
  suiviSPIP:   row.suivi_spip   ?? false,
  coordSPIP:   row.coord_spip   ?? "",
  commentaires: row.commentaires ?? "",
  suiviSocial: row.suivi_social ?? "",

  // Critères éligibilité
  deld:            row.deld              ?? false,
  dureeCHomageMois: row.duree_chomage_mois ?? 0,
  brsa:            row.brsa             ?? false,
  th:              row.th               ?? false,
  ass:             row.ass              ?? false,
  sansRessources:  row.sans_ressources  ?? false,
  residentQPV:     row.resident_qpv     ?? false,

  // Activité
  heuresTravaillees: row.heures_travaillees ?? 0,

  // Formation & compétences
  niveauFormation:  row.niveau_formation ?? "Niveau 3 (CAP/BEP et moins)",
  cv:               row.cv               ?? false,
  niveauLangue:     row.niveau_langue    ?? "A1",
  niveauScolaire:   row.niveaux_scolaire ?? "",
  lecture:          row.lecture          ?? false,
  ecriture:         row.ecriture         ?? false,
  calcul:           row.calcul           ?? false,
  diplomes:         row.diplomes         ?? "",
  formations:       row.formations       ?? "",
  experiencesPro:   row.experiences_pro  ?? "",
  equipementInfo:   row.equipement_info  ?? "",
  accesInternet:    row.acces_internet   ?? false,

  // Projet professionnel
  projetPro:    row.projet_pro    ?? "",
  domainesPro:  row.domaines_pro  ?? ["", "", ""],
  preconisation: row.preconisation ?? "",

  // Situation personnelle
  situationMaritale: row.situation_maritale ?? "",
  nbEnfants:         row.nb_enfants         ?? 0,
  ageEnfants:        row.age_enfants        ?? "",
  modeGarde:         row.mode_garde         ?? "",
  personnesCharge:   row.personnes_charge   ?? "",
  hebergement:       row.hebergement        ?? "",
  demarche:          row.demarche           ?? "",
  sports:            row.sports             ?? "",
  benevolat:         row.benevolat          ?? "",

  // Santé
  securiteSociale: row.securite_sociale ?? "Oui",
  css:             row.css              ?? false,
  cssJusquau:      row.css_jusqu_au     ?? "",
  restrictions:    row.restrictions     ?? "",
  traitement:      row.traitement       ?? "",
  addictions:      row.addictions       ?? "",
  autresSante:     row.autres_sante     ?? "",

  // Ressources
  revenus:  row.revenus  ?? 0,
  charges:  row.charges  ?? 0,
  dettes:   row.dettes   ?? "",

  // Mobilité
  permisB:        row.permis_b        ?? false,
  vehicule:       row.vehicule        ?? false,
  autresPermis:   row.autres_permis   ?? "",
  moyenTransport: row.moyen_transport ?? "",
  deplacements:   row.deplacements    ?? "",

  // Freins & badges (JSONB)
  freinsEntree: row.freins_entree ?? {},
  freinsSortie: row.freins_sortie ?? {},
  badges:       row.badges        ?? {},

  // Sortie
  typeSortie:         row.type_sortie         ?? "",
  situationSortie:    row.situation_sortie     ?? "",
  dateFirstEmploi:    row.date_first_emploi    ?? "",
  accordSuiviPost:    row.accord_suivi_post    ?? false,
  accordTransmission: row.accord_transmission  ?? false,
  aRappeler:          row.a_rappeler           ?? false,

  // Rappel post-sortie
  rappelJusquAu: row.rappel_jusqu_au ?? "",

  // Synthèses
  synthBesoinsEntree: row.synth_besoins_entree ?? "",
  synthBesoinsSortie: row.synth_besoins_sortie ?? "",
  synthParcours:      row.synth_parcours       ?? "",

  // Candidat
  isCandidat:          row.is_candidat           ?? false,
  candidatureRecueLe:  row.candidature_recue_le  ?? "",
  appelerLe:           row.appeler_le             ?? "",
  vuEntretienLe:       row.vu_entretien_le        ?? "",
  impressionGlobale:   row.impression_globale     ?? "",
  impressionDetail:    row.impression_detail      ?? "",
  orientationCandidat: row.orientation_candidat   ?? "",
  orientationMotif:    row.orientation_motif      ?? "",
  orientationSiteId:   row.orientation_site_id    ?? null,
});

/** Objet JS → payload DB (null pour les champs vides, car Supabase préfère null) */
export const mapSalarieToDB = (obj) => ({
  site_id: obj.site_id,
  cip_id:  obj.cip_id,

  nom:             obj.nom,
  prenom:          obj.prenom,
  nom_naissance:   obj.nomNaissance   || null,
  date_naissance:  obj.dateNaissance  || null,
  sexe:            obj.sexe           || null,
  nationalite:     obj.nationalite    || "Française",
  adresse:         obj.adresse        || null,
  cp:              obj.cp             || null,
  ville_residence: obj.ville          || null,
  telephone:       obj.telephone      || null,
  mail:            obj.mail           || null,

  date_entree:               obj.dateEntree              || null,
  date_sortie:               obj.dateSortie              || null,
  date_fin_contrat:          obj.dateFinContrat          || null,
  date_fin_agrement:         obj.dateFinAgrement         || null,
  titre_sejour:              obj.titreSejour             || null,
  id_ft:                     obj.idFT                    || null,
  date_premier_inscription:  obj.datePremierInscription  || null,
  prescripteur:              obj.prescripteur            || "FRANCE TRAVAIL",
  nom_prenom_prescripteur:   obj.nomPrenomPrescripteur   || null,
  statut_accueil:            obj.statutAccueil           || "Inscrit",

  suivi_spip:   obj.suiviSPIP   ?? false,
  coord_spip:   obj.coordSPIP   || null,
  commentaires: obj.commentaires || null,
  suivi_social: obj.suiviSocial  || null,

  deld:              obj.deld             ?? false,
  duree_chomage_mois: obj.dureeCHomageMois ?? 0,
  brsa:              obj.brsa             ?? false,
  th:                obj.th               ?? false,
  ass:               obj.ass              ?? false,
  sans_ressources:   obj.sansRessources   ?? false,
  resident_qpv:      obj.residentQPV      ?? false,

  heures_travaillees: obj.heuresTravaillees ?? 0,

  niveau_formation: obj.niveauFormation || null,
  cv:               obj.cv              ?? false,
  niveau_langue:    obj.niveauLangue    || null,
  niveaux_scolaire: obj.niveauScolaire  || null,
  lecture:          obj.lecture         ?? false,
  ecriture:         obj.ecriture        ?? false,
  calcul:           obj.calcul          ?? false,
  diplomes:         obj.diplomes        || null,
  formations:       obj.formations      || null,
  experiences_pro:  obj.experiencesPro  || null,
  equipement_info:  obj.equipementInfo  || null,
  acces_internet:   obj.accesInternet   ?? false,

  projet_pro:   obj.projetPro    || null,
  domaines_pro: obj.domainesPro  ?? [],
  preconisation: obj.preconisation || null,

  situation_maritale: obj.situationMaritale || null,
  nb_enfants:         obj.nbEnfants         ?? 0,
  age_enfants:        obj.ageEnfants        || null,
  mode_garde:         obj.modeGarde         || null,
  personnes_charge:   obj.personnesCharge   || null,
  hebergement:        obj.hebergement       || null,
  demarche:           obj.demarche          || null,
  sports:             obj.sports            || null,
  benevolat:          obj.benevolat         || null,

  securite_sociale: obj.securiteSociale || "Oui",
  css:              obj.css              ?? false,
  css_jusqu_au:     obj.cssJusquau       || null,
  restrictions:     obj.restrictions     || null,
  traitement:       obj.traitement       || null,
  addictions:       obj.addictions       || null,
  autres_sante:     obj.autresSante      || null,

  revenus:  obj.revenus  ?? 0,
  charges:  obj.charges  ?? 0,
  dettes:   obj.dettes   || null,

  permis_b:        obj.permisB        ?? false,
  vehicule:        obj.vehicule       ?? false,
  autres_permis:   obj.autresPermis   || null,
  moyen_transport: obj.moyenTransport || null,
  deplacements:    obj.deplacements   || null,

  freins_entree: obj.freinsEntree ?? {},
  freins_sortie: obj.freinsSortie ?? {},
  badges:        obj.badges       ?? {},

  type_sortie:         obj.typeSortie         || null,
  situation_sortie:    obj.situationSortie     || null,
  date_first_emploi:   obj.dateFirstEmploi     || null,
  accord_suivi_post:   obj.accordSuiviPost     ?? false,
  accord_transmission: obj.accordTransmission  ?? false,
  a_rappeler:          obj.aRappeler           ?? false,

  rappel_jusqu_au:      obj.rappelJusquAu      || null,

  synth_besoins_entree: obj.synthBesoinsEntree || null,
  synth_besoins_sortie: obj.synthBesoinsSortie || null,
  synth_parcours:       obj.synthParcours      || null,

  // Candidat
  is_candidat:           obj.isCandidat          ?? false,
  candidature_recue_le:  obj.candidatureRecueLe  || null,
  appeler_le:            obj.appelerLe           || null,
  vu_entretien_le:       obj.vuEntretienLe       || null,
  impression_globale:    obj.impressionGlobale   || null,
  impression_detail:     obj.impressionDetail    || null,
  orientation_candidat:  obj.orientationCandidat || null,
  orientation_motif:     obj.orientationMotif    || null,
  orientation_site_id:   obj.orientationSiteId   || null,
});

// ─── ENTRETIEN ────────────────────────────────────────────────────────────────

/** DB row (avec objectifs[] joinés) → objet JS */
export const mapEntretienFromDB = (row) => ({
  id:          row.id,
  salarie_id:  row.salarie_id,
  cip_id:      row.cip_id,
  assignedTo:  row.assigned_to,

  date:         row.date      ?? "",
  type:         row.type      ?? "",
  sujets:       row.sujets    ?? "",
  synthese:     row.synthese  ?? "",
  participants: row.participants ?? "",

  jalon:       row.est_jalon       ?? false,
  jalonKey:    row.jalon_key       ?? null,
  jalonLabel:  row.jalon_label     ?? null,
  confirmed:   row.jalon_confirmed ?? false,
  dateBilan:   row.date_bilan      ?? "",

  // objectifs joinés via select('*, objectifs(*)')
  objectifs: (row.objectifs ?? []).map(mapObjectifFromDB),
});

/** Objet JS → payload DB entretien (sans objectifs, gérés séparément) */
export const mapEntretienToDB = (obj) => ({
  salarie_id:  obj.salarie_id,
  cip_id:      obj.cip_id || obj.assignedTo || null,
  assigned_to: obj.assignedTo || obj.cip_id || null,

  date:         obj.date         || null,
  type:         obj.type         || null,
  sujets:       obj.sujets       || null,
  synthese:     obj.synthese     || null,
  participants: obj.participants || null,

  est_jalon:       obj.jalon     ?? false,
  jalon_key:       obj.jalonKey  ?? null,
  jalon_label:     obj.jalonLabel ?? null,
  jalon_confirmed: obj.confirmed  ?? false,
  date_bilan:      obj.dateBilan  || null,
});

// ─── OBJECTIF ─────────────────────────────────────────────────────────────────

export const mapObjectifFromDB = (row) => ({
  id:          row.id,
  intitule:    row.intitule    ?? "",
  deadline:    row.deadline    ?? "",
  atteint:     row.atteint     ?? null,   // null | true | false
  commentaire: row.commentaire ?? "",
});

export const mapObjectifToDB = (obj, entretienId, salarieId) => ({
  entretien_id: entretienId,
  salarie_id:   salarieId,
  intitule:     obj.intitule    || "",
  deadline:     obj.deadline    || null,
  atteint:      obj.atteint     ?? null,
  commentaire:  obj.commentaire || null,
});
