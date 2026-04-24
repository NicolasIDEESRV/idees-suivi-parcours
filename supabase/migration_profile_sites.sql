-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION : Accès multi-sites pour les profils CIP et Direction
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Ajouter la colonne site_ids (tableau d'UUIDs) ─────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS site_ids uuid[] NOT NULL DEFAULT '{}';

-- ── 2. Migrer les données existantes (site_id → site_ids) ────────────────────
--    Tous les profils qui ont déjà un site_id reçoivent site_ids = [site_id]
UPDATE profiles
SET site_ids = ARRAY[site_id]
WHERE site_id IS NOT NULL AND array_length(site_ids, 1) IS NULL;

-- ── 3. Mettre à jour la Edge Function invite-user ────────────────────────────
--    ⚠️ La fonction Supabase "invite-user" doit aussi persister site_ids.
--    Ajoutez dans son code (TypeScript) :
--      site_ids: body.site_ids ?? (body.site_id ? [body.site_id] : [])
--    lors de l'upsert dans la table profiles.

-- ── 4. Mettre à jour les politiques RLS ──────────────────────────────────────

-- ---- Table salaries ----
-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "salaries_select_policy" ON salaries;
DROP POLICY IF EXISTS "salaries_insert_policy" ON salaries;
DROP POLICY IF EXISTS "salaries_update_policy" ON salaries;
DROP POLICY IF EXISTS "salaries_delete_policy" ON salaries;

-- SELECT : admin voit tout, les autres voient uniquement les salariés de leurs sites
CREATE POLICY "salaries_select_policy" ON salaries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND (
          p.role = 'admin'
          OR salaries.site_id = ANY(p.site_ids)
        )
    )
  );

-- INSERT : même périmètre
CREATE POLICY "salaries_insert_policy" ON salaries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND (
          p.role = 'admin'
          OR salaries.site_id = ANY(p.site_ids)
        )
    )
  );

-- UPDATE : même périmètre
CREATE POLICY "salaries_update_policy" ON salaries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND (
          p.role = 'admin'
          OR salaries.site_id = ANY(p.site_ids)
        )
    )
  );

-- DELETE : admin uniquement
CREATE POLICY "salaries_delete_policy" ON salaries
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ---- Table entretiens ----
DROP POLICY IF EXISTS "entretiens_select_policy" ON entretiens;
DROP POLICY IF EXISTS "entretiens_insert_policy" ON entretiens;
DROP POLICY IF EXISTS "entretiens_update_policy" ON entretiens;

CREATE POLICY "entretiens_select_policy" ON entretiens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN salaries s ON s.id = entretiens.salarie_id
      WHERE p.id = auth.uid()
        AND (
          p.role = 'admin'
          OR s.site_id = ANY(p.site_ids)
        )
    )
  );

CREATE POLICY "entretiens_insert_policy" ON entretiens
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN salaries s ON s.id = entretiens.salarie_id
      WHERE p.id = auth.uid()
        AND (
          p.role = 'admin'
          OR s.site_id = ANY(p.site_ids)
        )
    )
  );

CREATE POLICY "entretiens_update_policy" ON entretiens
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN salaries s ON s.id = entretiens.salarie_id
      WHERE p.id = auth.uid()
        AND (
          p.role = 'admin'
          OR s.site_id = ANY(p.site_ids)
        )
    )
  );

-- ── 5. Vérification ──────────────────────────────────────────────────────────
SELECT id, nom, prenom, role, site_id, site_ids
FROM profiles
ORDER BY role, nom;
