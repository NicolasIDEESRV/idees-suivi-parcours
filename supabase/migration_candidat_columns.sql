-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION : colonnes complémentaires entretien candidat
-- À exécuter dans Supabase → SQL Editor → Run
-- ⚠ À exécuter AVANT tout enregistrement avec le code mis à jour
-- ════════════════════════════════════════════════════════════════════════════

-- ─── Informations collectées lors de l'entretien candidat ────────────────────
ALTER TABLE salaries ADD COLUMN IF NOT EXISTS autre_accompagnateur  TEXT;
ALTER TABLE salaries ADD COLUMN IF NOT EXISTS en_recherche_depuis   TEXT;
ALTER TABLE salaries ADD COLUMN IF NOT EXISTS piece_identite        TEXT;
ALTER TABLE salaries ADD COLUMN IF NOT EXISTS titre_sejour_validite DATE;
ALTER TABLE salaries ADD COLUMN IF NOT EXISTS contrainte_physique   TEXT;
ALTER TABLE salaries ADD COLUMN IF NOT EXISTS contrainte_horaire    TEXT;

-- ─── Orientation multi-sites (tableau d'UUIDs) ───────────────────────────────
ALTER TABLE salaries ADD COLUMN IF NOT EXISTS orientation_site_ids  UUID[];

-- Index GIN pour requêtes rapides par site pressentis
CREATE INDEX IF NOT EXISTS idx_salaries_orientation_sites
  ON salaries USING GIN (orientation_site_ids)
  WHERE orientation_site_ids IS NOT NULL;

-- ─── Commentaires ────────────────────────────────────────────────────────────
COMMENT ON COLUMN salaries.autre_accompagnateur  IS
  'Autre accompagnateur signalé lors de l''entretien candidat (CIP, AS, ML, autre organisme…)';
COMMENT ON COLUMN salaries.en_recherche_depuis   IS
  'Durée de recherche active déclarée par le candidat (ex : "6 à 12 mois")';
COMMENT ON COLUMN salaries.piece_identite        IS
  'Type de pièce d''identité vérifié : cni | passeport | titre';
COMMENT ON COLUMN salaries.titre_sejour_validite IS
  'Date de validité du titre de séjour (renseigné si piece_identite = titre)';
COMMENT ON COLUMN salaries.contrainte_physique   IS
  'Description des contraintes physiques / de santé signalées par le candidat';
COMMENT ON COLUMN salaries.contrainte_horaire    IS
  'Résultat de la vérification horaires : "Aucune contrainte" | motif de réserve | motif de refus';
COMMENT ON COLUMN salaries.orientation_site_ids  IS
  'Sites pressentis pour l''orientation candidat (recruter ou vivier) — plusieurs choix possibles';
