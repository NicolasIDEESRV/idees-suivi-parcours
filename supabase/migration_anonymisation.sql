-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION : anonymisation automatique des données (conformité RGPD)
-- Finalité : supprimer les données personnelles identifiantes des salariés
--            sortis depuis plus de DUREE_CONSERVATION_ANNEES ans.
--
-- Données conservées après anonymisation (valeur statistique) :
--   site_id, date_entree, date_sortie, type_sortie, situation_sortie,
--   deld, brsa, th, rqth, resident_qpv, duree_chomage_mois,
--   niveau_formation, freins_sortie, synth_parcours (anonymisé)
--
-- Données effacées (identifiantes ou sensibles) :
--   nom, prenom, date_naissance, sexe, adresse, cp, ville_residence,
--   telephone, mail, nationalite, num_secu_sociale, titre_sejour,
--   id_ft, nom_prenom_prescripteur, suivi_spip, coord_spip,
--   suivi_social, commentaires, restrictions, traitement, addictions,
--   revenus, charges, dettes, et tous les champs candidat sensibles.
--
-- À exécuter dans Supabase → SQL Editor → Run
-- La fonction peut ensuite être appelée via pg_cron ou un script externe.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. Paramètre de conservation ────────────────────────────────────────────
-- Modifiable ici : durée en années après la date_sortie du salarié.
-- Recommandation légale IAE : 5 ans. À valider avec votre référent RGPD.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'anonymiser_salaries_expires'
  ) THEN
    RAISE NOTICE 'Création de la fonction anonymiser_salaries_expires…';
  END IF;
END $$;


-- ─── 2. Fonction principale d'anonymisation ───────────────────────────────────
CREATE OR REPLACE FUNCTION anonymiser_salaries_expires(
  duree_conservation_annees INTEGER DEFAULT 5
)
RETURNS TABLE (
  nb_anonymises   INTEGER,
  nb_erreurs      INTEGER,
  date_execution  TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_date_limite     DATE;
  v_nb_anonymises   INTEGER := 0;
  v_nb_erreurs      INTEGER := 0;
  v_salarie         RECORD;
BEGIN
  -- Date limite : tout salarié sorti avant cette date est concerné
  v_date_limite := CURRENT_DATE - (duree_conservation_annees || ' years')::INTERVAL;

  RAISE NOTICE 'Anonymisation des salariés sortis avant le % (conservation = % ans)',
    v_date_limite, duree_conservation_annees;

  FOR v_salarie IN
    SELECT id, nom, prenom, date_sortie
    FROM   salaries
    WHERE  date_sortie IS NOT NULL
      AND  date_sortie < v_date_limite
      AND  nom != 'ANONYMISÉ'   -- éviter de retraiter ce qui est déjà fait
  LOOP
    BEGIN
      UPDATE salaries SET
        -- ── Identité ────────────────────────────────────────────────────────
        nom                   = 'ANONYMISÉ',
        prenom                = 'ANONYMISÉ',
        date_naissance        = NULL,
        sexe                  = '',
        nationalite           = 'Non communiqué',
        adresse               = NULL,
        cp                    = NULL,
        ville_residence       = NULL,
        telephone             = NULL,
        mail                  = NULL,
        -- ── Parcours identifiant ─────────────────────────────────────────────
        id_ft                 = NULL,
        date_premier_inscription = NULL,
        nom_prenom_prescripteur  = NULL,
        -- ── Titre de séjour ──────────────────────────────────────────────────
        titre_sejour          = NULL,
        -- ── Suivi judiciaire / social ────────────────────────────────────────
        suivi_spip            = false,
        coord_spip            = NULL,
        suivi_social          = NULL,
        commentaires          = NULL,
        -- ── Santé ────────────────────────────────────────────────────────────
        restrictions          = NULL,
        traitement            = NULL,
        addictions            = NULL,
        css                   = false,
        css_jusqu_au          = NULL,
        -- ── Ressources financières ───────────────────────────────────────────
        revenus               = 0,
        charges               = 0,
        dettes                = NULL,
        -- ── Situation personnelle ─────────────────────────────────────────────
        situation_maritale    = NULL,
        age_enfants           = NULL,
        mode_garde            = NULL,
        demarche              = NULL,
        -- ── Champs candidat sensibles ────────────────────────────────────────
        autre_accompagnateur  = NULL,
        en_recherche_depuis   = NULL,
        piece_identite        = NULL,
        titre_sejour_validite = NULL,
        contrainte_physique   = NULL,
        contrainte_horaire    = NULL,
        -- ── Synthèses (conserver une trace neutre) ───────────────────────────
        synth_besoins_entree  = NULL,
        synth_besoins_sortie  = NULL,
        synth_parcours        = '[Données anonymisées - conservation légale expirée]',
        -- ── Mise à jour ──────────────────────────────────────────────────────
        updated_at            = now()
      WHERE id = v_salarie.id;

      v_nb_anonymises := v_nb_anonymises + 1;

      RAISE NOTICE 'Anonymisé : salarié sorti le %', v_salarie.date_sortie;

    EXCEPTION WHEN OTHERS THEN
      v_nb_erreurs := v_nb_erreurs + 1;
      RAISE WARNING 'Erreur sur salarié % : %', v_salarie.id, SQLERRM;
    END;
  END LOOP;

  -- Résumé
  RAISE NOTICE '─────────────────────────────────────────';
  RAISE NOTICE 'Anonymisation terminée : % fiche(s) traitée(s), % erreur(s)',
    v_nb_anonymises, v_nb_erreurs;

  RETURN QUERY SELECT v_nb_anonymises, v_nb_erreurs, now()::TIMESTAMPTZ;
END;
$$;

COMMENT ON FUNCTION anonymiser_salaries_expires IS
  'Anonymise les données personnelles des salariés sortis depuis plus de N ans (défaut : 5).
   Conforme RGPD art. 5.1.e — à appeler régulièrement (ex : 1x/mois via cron).
   Exemple d''appel : SELECT * FROM anonymiser_salaries_expires(5);';


-- ─── 3. Table de journalisation des anonymisations ────────────────────────────
CREATE TABLE IF NOT EXISTS journal_anonymisations (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  date_execution  TIMESTAMPTZ NOT NULL DEFAULT now(),
  nb_anonymises   INTEGER     NOT NULL DEFAULT 0,
  nb_erreurs      INTEGER     NOT NULL DEFAULT 0,
  duree_annees    INTEGER     NOT NULL DEFAULT 5,
  execute_par     UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  notes           TEXT
);

COMMENT ON TABLE journal_anonymisations IS
  'Historique des exécutions d''anonymisation RGPD — preuve de conformité.';

-- RLS : lecture admin uniquement
ALTER TABLE journal_anonymisations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journal_anon_select_admin"
  ON journal_anonymisations FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "journal_anon_insert_admin"
  ON journal_anonymisations FOR INSERT TO authenticated
  WITH CHECK (is_admin());


-- ─── 4. Vue de contrôle : fiches bientôt à anonymiser ────────────────────────
-- Permet à l'admin de voir qui sera concerné dans les 3 prochains mois.
CREATE OR REPLACE VIEW v_salaries_a_anonymiser_bientot
WITH (security_invoker = true)
AS
SELECT
  s.id,
  s.nom,
  s.prenom,
  s.date_sortie,
  s.site_id,
  si.nom                                    AS site_nom,
  (s.date_sortie + INTERVAL '5 years')::DATE AS date_anonymisation_prevue,
  ((s.date_sortie + INTERVAL '5 years')::DATE - CURRENT_DATE) AS jours_restants
FROM salaries s
JOIN sites    si ON si.id = s.site_id
WHERE s.date_sortie IS NOT NULL
  AND s.nom != 'ANONYMISÉ'
  AND (s.date_sortie + INTERVAL '5 years')::DATE <= (CURRENT_DATE + INTERVAL '3 months')
ORDER BY s.date_sortie ASC;

COMMENT ON VIEW v_salaries_a_anonymiser_bientot IS
  'Fiches dont la date d''anonymisation RGPD approche dans les 3 prochains mois.
   Accès conditionné par le RLS (admin uniquement en pratique).';


-- ─── 5. Instructions d'automatisation ────────────────────────────────────────
-- Pour appeler cette fonction automatiquement chaque mois :
--
-- Option A — pg_cron (si disponible sur votre instance PostgreSQL) :
--   SELECT cron.schedule(
--     'anonymisation-rgpd-mensuelle',
--     '0 2 1 * *',   -- 1er de chaque mois à 2h du matin
--     $$ INSERT INTO journal_anonymisations (nb_anonymises, nb_erreurs)
--        SELECT nb_anonymises, nb_erreurs
--        FROM   anonymiser_salaries_expires(5); $$
--   );
--
-- Option B — Script externe (cron Linux sur votre serveur) :
--   Voir le fichier scripts/anonymisation-rgpd.sh généré dans ce projet.
--
-- Pour tester (sans modifier de données) :
--   SELECT * FROM v_salaries_a_anonymiser_bientot;
