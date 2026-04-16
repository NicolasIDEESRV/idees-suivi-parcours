-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION : hiérarchie organisationnelle sur la table sites
-- À exécuter dans Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════════════════════

-- Ajout des colonnes filiale et secteur
ALTER TABLE sites ADD COLUMN IF NOT EXISTS filiale TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS secteur  TEXT;

-- Mise à jour des sites existants
UPDATE sites SET
  filiale = 'ID''EES R&V',
  secteur = 'Tri des déchets ménagers recyclables'
WHERE id = '00000000-0000-0000-0000-000000000001';

UPDATE sites SET
  filiale = 'ID''EES Logistique',
  secteur = 'Logistique'
WHERE id = '00000000-0000-0000-0000-000000000002';
