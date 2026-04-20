-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION : champs manquants table salaries
-- À exécuter dans Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. Champs manquants identifiés via le formulaire papier ─────────────────

ALTER TABLE salaries ADD COLUMN IF NOT EXISTS nom_naissance   TEXT;         -- nom de jeune fille / naissance
ALTER TABLE salaries ADD COLUMN IF NOT EXISTS autres_permis   TEXT;         -- permis moto, poids lourd...
ALTER TABLE salaries ADD COLUMN IF NOT EXISTS autres_sante    TEXT;         -- autres infos santé libres
ALTER TABLE salaries ADD COLUMN IF NOT EXISTS experiences_pro TEXT;         -- expériences pro texte libre
ALTER TABLE salaries ADD COLUMN IF NOT EXISTS personnes_charge TEXT;        -- personnes à charge (description)
ALTER TABLE salaries ADD COLUMN IF NOT EXISTS rappel_jusqu_au DATE;         -- date limite du rappel post-sortie (sortie + 3 mois)

-- ─── 2. Nettoyage des entretiens futurs à la sortie ──────────────────────────
-- Fonction appelée par l'app lors de la sortie d'un salarié.
-- Supprime tous les entretiens FUTURS (date > date_sortie)
-- sauf ceux marqués comme "à rappeler" (géré côté app avec rappel_jusqu_au).

CREATE OR REPLACE FUNCTION nettoyer_echeances_sortie(
  p_salarie_id UUID,
  p_date_sortie DATE
)
RETURNS INTEGER   -- nombre d'entretiens supprimés
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM entretiens
  WHERE salarie_id = p_salarie_id
    AND date > p_date_sortie;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION nettoyer_echeances_sortie TO authenticated;

-- ─── 3. Suppression complète d'un salarié (admin) ────────────────────────────
-- ON DELETE CASCADE sur entretiens + objectifs assure la suppression en cascade.
-- Cette fonction vérifie que l'appelant est admin avant de supprimer.

CREATE OR REPLACE FUNCTION supprimer_salarie(p_salarie_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Accès refusé : seul un admin peut supprimer un salarié.';
  END IF;

  DELETE FROM salaries WHERE id = p_salarie_id;
END;
$$;

GRANT EXECUTE ON FUNCTION supprimer_salarie TO authenticated;
