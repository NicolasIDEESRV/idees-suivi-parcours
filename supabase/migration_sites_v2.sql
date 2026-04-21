-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION : Refonte hiérarchie sites
-- Filiale → Secteur → Activité → Site (nom)
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Supprimer ID'EES Logistique (n'existe pas) ────────────────────────────
DELETE FROM sites WHERE filiale = 'ID''EES Logistique';

-- ── 2. Mettre à jour le site existant ID'EES R&V → FIRMINY ───────────────────
UPDATE sites
SET
  nom      = 'FIRMINY',
  ville    = 'Firminy',
  filiale  = 'ID''EES R&V',
  secteur  = 'Tri des déchets ménagers recyclables',
  activite = 'Tri des déchets ménagers recyclables'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ── 3. Ajouter DIJON et PONTARLIER pour ID'EES R&V ───────────────────────────
INSERT INTO sites (id, nom, ville, filiale, secteur, activite, actif)
VALUES
  (
    '00000000-0000-0000-0000-000000000002',
    'DIJON', 'Dijon',
    'ID''EES R&V',
    'Tri des déchets ménagers recyclables',
    'Tri des déchets ménagers recyclables',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'PONTARLIER', 'Pontarlier',
    'ID''EES R&V',
    'Tri des déchets ménagers recyclables',
    'Tri des déchets ménagers recyclables',
    true
  )
ON CONFLICT (id) DO UPDATE SET
  nom      = EXCLUDED.nom,
  ville    = EXCLUDED.ville,
  filiale  = EXCLUDED.filiale,
  secteur  = EXCLUDED.secteur,
  activite = EXCLUDED.activite,
  actif    = EXCLUDED.actif;

-- ── 4. Créer ID'EES 21 ────────────────────────────────────────────────────────
-- Secteur : SOUS-TRAITANCE INDUSTRIELLE
--   Activité : SOUS-TRAITANCE INDUSTRIELLE
INSERT INTO sites (nom, ville, filiale, secteur, activite, actif)
VALUES (
  'SOUS-TRAITANCE INDUSTRIELLE', '',
  'ID''EES 21', 'SOUS-TRAITANCE INDUSTRIELLE', 'SOUS-TRAITANCE INDUSTRIELLE',
  true
)
ON CONFLICT DO NOTHING;

-- Secteur : EP MULTISERVICES
--   Activité : ENTRETIEN PROPRETÉ
INSERT INTO sites (nom, ville, filiale, secteur, activite, actif)
VALUES (
  'ENTRETIEN PROPRETÉ', '',
  'ID''EES 21', 'EP MULTISERVICES', 'ENTRETIEN PROPRETÉ',
  true
)
ON CONFLICT DO NOTHING;

--   Activité : MULTISERVICES
INSERT INTO sites (nom, ville, filiale, secteur, activite, actif)
VALUES (
  'MULTISERVICES', '',
  'ID''EES 21', 'EP MULTISERVICES', 'MULTISERVICES',
  true
)
ON CONFLICT DO NOTHING;

-- Secteur : EV PU VITI
--   Activité : ESPACES VERTS
INSERT INTO sites (nom, ville, filiale, secteur, activite, actif)
VALUES (
  'ESPACES VERTS', '',
  'ID''EES 21', 'EV PU VITI', 'ESPACES VERTS',
  true
)
ON CONFLICT DO NOTHING;

--   Activité : PROPRETÉ URBAINE
INSERT INTO sites (nom, ville, filiale, secteur, activite, actif)
VALUES (
  'PROPRETÉ URBAINE', '',
  'ID''EES 21', 'EV PU VITI', 'PROPRETÉ URBAINE',
  true
)
ON CONFLICT DO NOTHING;

--   Activité : VITICULTURE
INSERT INTO sites (nom, ville, filiale, secteur, activite, actif)
VALUES (
  'VITICULTURE', '',
  'ID''EES 21', 'EV PU VITI', 'VITICULTURE',
  true
)
ON CONFLICT DO NOTHING;

-- ── Vérification ──────────────────────────────────────────────────────────────
SELECT filiale, secteur, activite, nom, ville
FROM sites
ORDER BY filiale, secteur, activite, nom;
