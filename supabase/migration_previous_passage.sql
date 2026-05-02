-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION : lien passage précédent + assouplissement NOT NULL dates contrat
-- À exécuter dans Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. Colonne previous_salarie_id ─────────────────────────────────────────
-- Permet de lier une nouvelle fiche à un ancien dossier (récupération de données).
-- La nouvelle fiche est indépendante ; l'ancienne reste intacte.
-- On utilise SET NULL à la suppression pour éviter les erreurs en cascade.
ALTER TABLE salaries
  ADD COLUMN IF NOT EXISTS previous_salarie_id UUID REFERENCES salaries(id) ON DELETE SET NULL;

COMMENT ON COLUMN salaries.previous_salarie_id IS
  'Lien vers un ancien dossier dont les données ont été récupérées (identité, situation, compétences…). La fiche courante est indépendante.';

-- Index pour accéder rapidement à l''historique depuis la nouvelle fiche
CREATE INDEX IF NOT EXISTS idx_salaries_previous_id ON salaries(previous_salarie_id)
  WHERE previous_salarie_id IS NOT NULL;


-- ─── 2. Assouplissement des contraintes NOT NULL sur les dates de contrat ────
-- Nécessaire pour les candidats qui n'ont pas encore de contrat.
-- Valeurs NULL acceptées ; les dates seront renseignées lors de l'embauche.
ALTER TABLE salaries ALTER COLUMN date_entree      DROP NOT NULL;
ALTER TABLE salaries ALTER COLUMN date_fin_contrat  DROP NOT NULL;
ALTER TABLE salaries ALTER COLUMN date_fin_agrement DROP NOT NULL;

-- Mettre à jour les contraintes CHECK qui référencent date_entree
-- (elles comparent date_sortie >= date_entree et date_fin_contrat >= date_entree)
-- Si date_entree est NULL, la contrainte doit être adaptée.
ALTER TABLE salaries DROP CONSTRAINT IF EXISTS salaries_sortie_coherente;
ALTER TABLE salaries DROP CONSTRAINT IF EXISTS salaries_fin_contrat_coherente;

ALTER TABLE salaries ADD CONSTRAINT salaries_sortie_coherente CHECK (
  date_sortie IS NULL OR date_entree IS NULL OR date_sortie >= date_entree
);
ALTER TABLE salaries ADD CONSTRAINT salaries_fin_contrat_coherente CHECK (
  date_fin_contrat IS NULL OR date_entree IS NULL OR date_fin_contrat >= date_entree
);
