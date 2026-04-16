-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION : hiérarchie organisationnelle sur la table sites
-- À exécuter dans Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════════════════════

-- Hiérarchie : FILIALE → SECTEUR → ACTIVITÉ
ALTER TABLE sites ADD COLUMN IF NOT EXISTS filiale  TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS secteur  TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS activite TEXT;

-- Mise à jour des sites existants
UPDATE sites SET
  filiale  = 'ID''EES R&V',
  secteur  = 'Tri des déchets ménagers recyclables',
  activite = 'Tri des déchets ménagers recyclables'
WHERE id = '00000000-0000-0000-0000-000000000001';

UPDATE sites SET
  filiale  = 'ID''EES Logistique',
  secteur  = 'Logistique',
  activite = 'Logistique'
WHERE id = '00000000-0000-0000-0000-000000000002';
