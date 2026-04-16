-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION : flux d'invitation sécurisé
-- À exécuter UNE SEULE FOIS dans Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════════════════════


-- ─── 1. Insérer les sites (idempotent) ──────────────────────────────────────

INSERT INTO sites (id, nom, ville) VALUES
  ('00000000-0000-0000-0000-000000000001', 'ID''EES R&V — Firminy',              'Firminy'),
  ('00000000-0000-0000-0000-000000000002', 'ID''EES Logistique — Saint-Étienne', 'Saint-Étienne')
ON CONFLICT (id) DO NOTHING;


-- ─── 2. Corriger le trigger handle_new_user ──────────────────────────────────
-- À l'invitation, Supabase crée auth.users avec raw_user_meta_data contenant
-- {role, site_id} définis par l'admin. Le trigger crée automatiquement le profil.
-- Si les métadonnées sont incomplètes (ex: invitation via Dashboard sans méta),
-- on laisse passer sans erreur : le profil sera créé par complete_my_profile().

CREATE OR REPLACE FUNCTION handle_new_user()
  RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_role     role_utilisateur;
  v_site_id  UUID;
BEGIN
  -- Lire le rôle depuis les métadonnées (défini par l'admin à l'invitation)
  BEGIN
    v_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::role_utilisateur,
      'cip'
    );
  EXCEPTION WHEN invalid_text_representation THEN
    v_role := 'cip';
  END;

  -- Lire le site_id depuis les métadonnées
  BEGIN
    v_site_id := (NEW.raw_user_meta_data->>'site_id')::UUID;
  EXCEPTION WHEN others THEN
    v_site_id := NULL;
  END;

  -- Ne créer le profil que si les contraintes sont satisfaites
  -- (cip doit avoir un site_id, sinon on attend complete_my_profile)
  IF v_role != 'cip' OR v_site_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, nom, prenom, email, role, site_id, actif)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'nom',    ''),
      COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
      NEW.email,
      v_role,
      v_site_id,
      false   -- inactif jusqu'à complétion du profil
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;


-- ─── 3. Fonction complete_my_profile ────────────────────────────────────────
-- Appelée depuis SetPassword après que l'utilisateur a saisi son nom/prénom.
-- SECURITY DEFINER : contourne le RLS "insert admin only".
-- Le rôle est lu depuis auth.users.raw_user_meta_data (défini par l'admin).
-- L'utilisateur NE PEUT PAS choisir son propre rôle.

CREATE OR REPLACE FUNCTION complete_my_profile(
  p_nom    TEXT,
  p_prenom TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email    TEXT;
  v_role     role_utilisateur;
  v_site_id  UUID;
  v_meta     JSONB;
BEGIN
  -- Récupérer email + métadonnées depuis auth.users
  SELECT email, raw_user_meta_data
  INTO v_email, v_meta
  FROM auth.users
  WHERE id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;

  -- Rôle depuis métadonnées (admin l'a défini à l'invitation)
  BEGIN
    v_role := COALESCE((v_meta->>'role')::role_utilisateur, 'cip');
  EXCEPTION WHEN invalid_text_representation THEN
    v_role := 'cip';
  END;

  -- Site depuis métadonnées
  BEGIN
    v_site_id := (v_meta->>'site_id')::UUID;
  EXCEPTION WHEN others THEN
    v_site_id := NULL;
  END;

  -- Vérification de cohérence (protection côté DB)
  IF v_role = 'cip' AND v_site_id IS NULL THEN
    RAISE EXCEPTION 'Profil CIP incomplet : site non défini dans les métadonnées.';
  END IF;

  -- Upsert du profil
  INSERT INTO public.profiles (id, nom, prenom, email, role, site_id, actif)
  VALUES (auth.uid(), p_nom, p_prenom, v_email, v_role, v_site_id, true)
  ON CONFLICT (id) DO UPDATE SET
    nom     = EXCLUDED.nom,
    prenom  = EXCLUDED.prenom,
    role    = EXCLUDED.role,
    site_id = EXCLUDED.site_id,
    actif   = true;
END;
$$;

GRANT EXECUTE ON FUNCTION complete_my_profile TO authenticated;


-- ─── 4. Fonction send_invite (appelée par l'admin depuis l'app) ──────────────
-- Enregistre les paramètres d'invitation. L'envoi de l'email se fait via
-- la Edge Function invite-user (utilise la service_role key).
-- Cette table sert de journal des invitations.

CREATE TABLE IF NOT EXISTS invitations_pending (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      TEXT        NOT NULL,
  role       role_utilisateur NOT NULL DEFAULT 'cip',
  site_id    UUID        REFERENCES sites(id) ON DELETE SET NULL,
  invited_by UUID        REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE invitations_pending ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitations_admin_only"
  ON invitations_pending FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
