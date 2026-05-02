-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION : correction contrainte entretiens_un_jalon_par_type
-- Problème : la contrainte bloque la création de tout entretien du même type
--            (ex : 2e entretien "Accueil"), même pour des entretiens normaux.
-- Cause    : la contrainte était définie sans filtre — elle s'appliquait à
--            TOUS les entretiens au lieu de se limiter aux jalons.
-- Fix      : on la recrée en index partiel (WHERE est_jalon = true).
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. Supprimer l'ancienne contrainte trop large ───────────────────────────
ALTER TABLE entretiens DROP CONSTRAINT IF EXISTS entretiens_un_jalon_par_type;

-- ─── 2. Recréer en index partiel — jalons uniquement ─────────────────────────
-- Un seul jalon de chaque type autorisé par salarié.
-- Les entretiens normaux (est_jalon = false) ne sont pas affectés.
CREATE UNIQUE INDEX IF NOT EXISTS entretiens_un_jalon_par_type
  ON entretiens (salarie_id, type)
  WHERE est_jalon = true;
