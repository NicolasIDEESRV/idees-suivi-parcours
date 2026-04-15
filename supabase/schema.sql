-- ════════════════════════════════════════════════════════════════════════════
-- ID'EES — SUIVI PARCOURS — SCHÉMA COMPLET
-- Supabase / PostgreSQL
-- ════════════════════════════════════════════════════════════════════════════
-- Rôles applicatifs
--   admin      : accès total toutes tables, tous sites, peut supprimer
--   direction  : lecture totale tous sites ; écriture salariés/entretiens/
--                objectifs sur tous sites ; pas de suppression
--   cip        : CRUD complet sur son site uniquement ; pas de suppression
-- ════════════════════════════════════════════════════════════════════════════

-- ─── EXTENSIONS ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ════════════════════════════════════════════════════════════════════════════
-- TYPES ÉNUMÉRÉS
-- ════════════════════════════════════════════════════════════════════════════

-- Rôle utilisateur (3 niveaux)
CREATE TYPE role_utilisateur AS ENUM ('admin', 'direction', 'cip');

-- Prescripteurs IAE
CREATE TYPE prescripteur_type AS ENUM (
  'FRANCE TRAVAIL',
  'SERVICES SOCIAUX',
  'CAP EMPLOI',
  'MISSION LOCALE',
  'PLIE',
  'SIAE',
  'SERVICES DE JUSTICE',
  'SANS PRESCRIPTION',
  'AUTRE'
);

-- Statut accueil salarié
CREATE TYPE statut_accueil_type AS ENUM ('Accueilli', 'Inscrit', 'En attente');

-- Niveau de formation
CREATE TYPE niveau_formation_type AS ENUM (
  'Niveau 3 (CAP/BEP et moins)',
  'Niveau 4 (Bac ou Bac pro)',
  'Niveau 5 à 8 (Bac+2 et +)'
);

-- Niveau de langue
CREATE TYPE niveau_langue_type AS ENUM (
  'Débutant', 'A1', 'A2', 'B1', 'B2', 'C1', 'Natif'
);

-- Type d'entretien (inclut jalons)
CREATE TYPE type_entretien_type AS ENUM (
  'Accueil',
  'Diagnostic socio-pro',
  'Validation période d''essai',
  'Suivi',
  'Boîte à outils',
  'Définition des objectifs',
  'Bilan intermédiaire',
  'Bilan de sortie',
  'Projet pro',
  'Autre'
);

-- Clé de jalon (4 jalons obligatoires)
CREATE TYPE jalon_key_type AS ENUM ('j1', 'j2', 'j3', 'j4');

-- Type de sortie ASP
CREATE TYPE type_sortie_type AS ENUM (
  'Dynamique', 'Durable', 'Transition', 'Positive', 'Autre', 'Retrait'
);

-- Situation à la sortie
CREATE TYPE situation_sortie_type AS ENUM (
  'CDI',
  'CDD +6 mois',
  'CDD -6 mois',
  'Intérim',
  'Création d''entreprise',
  'Formation qualifiante',
  'Contrat aidé',
  'Recherche emploi',
  'Inactif',
  'Sans nouvelles',
  'Décès',
  'Rupture employeur',
  'Décision administrative'
);

-- Statut d'un frein à l'entrée
CREATE TYPE frein_statut_entree AS ENUM ('IDENTIFIÉ', 'À TRAITER', 'EN COURS', 'OK');

-- Statut d'un frein à la sortie
CREATE TYPE frein_statut_sortie AS ENUM ('TOUJOURS EXISTANT', 'EN COURS', 'RÉSOLU');

-- Moyen de transport
CREATE TYPE moyen_transport_type AS ENUM (
  'Transports en commun',
  'Voiture (permis B)',
  'Voiture sans permis',
  'Vélo',
  'Trottinette',
  'À pied',
  'Covoiturage',
  'Autre'
);


-- ════════════════════════════════════════════════════════════════════════════
-- TABLE : sites
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE sites (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom        TEXT        NOT NULL,
  ville      TEXT        NOT NULL,
  actif      BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE sites IS 'Structures / sites de l''association';


-- ════════════════════════════════════════════════════════════════════════════
-- TABLE : profiles
-- Étend auth.users (Supabase Auth)
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE profiles (
  id         UUID            PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  nom        TEXT            NOT NULL,
  prenom     TEXT            NOT NULL,
  email      TEXT            NOT NULL UNIQUE,
  role       role_utilisateur NOT NULL DEFAULT 'cip',
  -- NULL pour admin et direction (accès tous sites)
  site_id    UUID            REFERENCES sites(id) ON DELETE SET NULL,
  actif      BOOLEAN         NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ     NOT NULL DEFAULT now(),

  CONSTRAINT profiles_cip_must_have_site CHECK (
    role != 'cip' OR site_id IS NOT NULL
  )
);

COMMENT ON TABLE  profiles        IS 'Utilisateurs applicatifs (admin, direction, CIP)';
COMMENT ON COLUMN profiles.role   IS 'admin = accès total ; direction = lecture totale + écriture ; cip = son site uniquement';
COMMENT ON COLUMN profiles.site_id IS 'NULL pour admin et direction. Obligatoire pour le rôle cip.';


-- ════════════════════════════════════════════════════════════════════════════
-- TABLE : salaries
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE salaries (
  id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- ── Rattachement ─────────────────────────────────────────────────────────
  site_id  UUID NOT NULL REFERENCES sites(id),
  cip_id   UUID NOT NULL REFERENCES profiles(id),

  -- ── État civil ───────────────────────────────────────────────────────────
  nom               TEXT    NOT NULL,
  prenom            TEXT    NOT NULL,
  date_naissance    DATE,
  sexe              CHAR(1) CHECK (sexe IN ('F', 'M', '')),
  nationalite       TEXT    NOT NULL DEFAULT 'Française',
  adresse           TEXT,
  cp                TEXT,
  ville_residence   TEXT,
  telephone         TEXT,
  mail              TEXT,

  -- ── Parcours IAE ─────────────────────────────────────────────────────────
  date_entree               DATE                NOT NULL,
  date_sortie               DATE,
  date_fin_contrat          DATE,
  date_fin_agrement         DATE,
  titre_sejour              DATE,          -- date d'expiration du titre de séjour
  id_ft                     TEXT,          -- identifiant France Travail
  date_premier_inscription  DATE,
  prescripteur              prescripteur_type   NOT NULL DEFAULT 'FRANCE TRAVAIL',
  nom_prenom_prescripteur   TEXT,
  statut_accueil            statut_accueil_type NOT NULL DEFAULT 'Inscrit',

  -- ── Suivi judiciaire / social ─────────────────────────────────────────────
  suivi_spip   BOOLEAN NOT NULL DEFAULT false,
  coord_spip   TEXT,
  suivi_social TEXT,
  commentaires TEXT,

  -- ── Critères d'éligibilité ────────────────────────────────────────────────
  deld               BOOLEAN NOT NULL DEFAULT false,
  duree_chomage_mois INTEGER NOT NULL DEFAULT 0,
  brsa               BOOLEAN NOT NULL DEFAULT false,
  th                 BOOLEAN NOT NULL DEFAULT false,  -- Travailleur Handicapé
  ass                BOOLEAN NOT NULL DEFAULT false,  -- Allocation Spécifique de Solidarité
  sans_ressources    BOOLEAN NOT NULL DEFAULT false,
  resident_qpv       BOOLEAN NOT NULL DEFAULT false,

  -- ── Activité ──────────────────────────────────────────────────────────────
  heures_travaillees INTEGER NOT NULL DEFAULT 0,

  -- ── Formation & compétences ───────────────────────────────────────────────
  niveau_formation  niveau_formation_type,
  cv                BOOLEAN             NOT NULL DEFAULT false,
  niveau_langue     niveau_langue_type,
  niveaux_scolaire  TEXT,
  lecture           BOOLEAN             NOT NULL DEFAULT false,
  ecriture          BOOLEAN             NOT NULL DEFAULT false,
  calcul            BOOLEAN             NOT NULL DEFAULT false,
  diplomes          TEXT,
  formations        TEXT,
  equipement_info   TEXT,
  acces_internet    BOOLEAN             NOT NULL DEFAULT false,

  -- ── Projet professionnel ──────────────────────────────────────────────────
  projet_pro    TEXT,
  domaines_pro  TEXT[]  NOT NULL DEFAULT '{}',   -- tableau de 3 domaines max
  preconisation TEXT,

  -- ── Situation personnelle ─────────────────────────────────────────────────
  situation_maritale TEXT,
  nb_enfants         INTEGER NOT NULL DEFAULT 0,
  age_enfants        TEXT,
  mode_garde         TEXT,
  hebergement        TEXT,
  demarche           TEXT,
  sports             TEXT,
  benevolat          TEXT,

  -- ── Santé ─────────────────────────────────────────────────────────────────
  securite_sociale TEXT    NOT NULL DEFAULT 'Oui',
  css              BOOLEAN NOT NULL DEFAULT false,
  css_jusqu_au     DATE,
  restrictions     TEXT,
  traitement       TEXT,
  addictions       TEXT,

  -- ── Ressources ────────────────────────────────────────────────────────────
  revenus  NUMERIC(10,2) NOT NULL DEFAULT 0,
  charges  NUMERIC(10,2) NOT NULL DEFAULT 0,
  dettes   TEXT,

  -- ── Mobilité ──────────────────────────────────────────────────────────────
  permis_b        BOOLEAN             NOT NULL DEFAULT false,
  vehicule        BOOLEAN             NOT NULL DEFAULT false,
  moyen_transport moyen_transport_type,
  deplacements    TEXT,

  -- ── Freins (JSONB) ────────────────────────────────────────────────────────
  -- Structure : { "Logement": "EN COURS", "Mobilité": "OK", ... }
  -- Clés = FREINS[] ; valeurs = frein_statut_entree (entrée) ou frein_statut_sortie (sortie)
  freins_entree JSONB NOT NULL DEFAULT '{}',
  freins_sortie JSONB NOT NULL DEFAULT '{}',

  -- ── Badges Open Badge (JSONB) ──────────────────────────────────────────────
  -- Structure : { "Interaction": 3, "Autonomie": 2, ... }  valeurs 0-5
  badges JSONB NOT NULL DEFAULT '{}',

  -- ── Sortie ────────────────────────────────────────────────────────────────
  type_sortie        type_sortie_type,
  situation_sortie   situation_sortie_type,
  date_first_emploi  DATE,
  accord_suivi_post  BOOLEAN NOT NULL DEFAULT false,
  accord_transmission BOOLEAN NOT NULL DEFAULT false,
  a_rappeler         BOOLEAN NOT NULL DEFAULT false,

  -- ── Synthèses ──────────────────────────────────────────────────────────────
  synth_besoins_entree TEXT,
  synth_besoins_sortie TEXT,
  synth_parcours       TEXT,

  -- ── Audit ──────────────────────────────────────────────────────────────────
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- ── Contraintes métier ─────────────────────────────────────────────────────
  CONSTRAINT salaries_sortie_coherente CHECK (
    date_sortie IS NULL OR date_sortie >= date_entree
  ),
  CONSTRAINT salaries_fin_contrat_coherente CHECK (
    date_fin_contrat IS NULL OR date_fin_contrat >= date_entree
  )
);

COMMENT ON TABLE  salaries              IS 'Salariés en insertion (IAE)';
COMMENT ON COLUMN salaries.freins_entree IS 'JSONB {frein: statut_entree} — ex: {"Mobilité":"EN COURS"}';
COMMENT ON COLUMN salaries.freins_sortie IS 'JSONB {frein: statut_sortie} — ex: {"Mobilité":"RÉSOLU"}';
COMMENT ON COLUMN salaries.badges        IS 'JSONB {badge: niveau} — ex: {"Interaction":3}  valeurs 1-5';
COMMENT ON COLUMN salaries.domaines_pro  IS 'Tableau max 3 domaines professionnels';


-- ════════════════════════════════════════════════════════════════════════════
-- TABLE : entretiens
-- Contient à la fois les entretiens libres et les jalons obligatoires
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE entretiens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- ── Relations ─────────────────────────────────────────────────────────────
  salarie_id  UUID NOT NULL REFERENCES salaries(id) ON DELETE CASCADE,
  cip_id      UUID NOT NULL REFERENCES profiles(id),
  assigned_to UUID NOT NULL REFERENCES profiles(id),

  -- ── Contenu ───────────────────────────────────────────────────────────────
  date         DATE                NOT NULL,
  type         type_entretien_type NOT NULL,
  sujets       TEXT,
  synthese     TEXT,
  participants TEXT,

  -- ── Jalons ────────────────────────────────────────────────────────────────
  est_jalon       BOOLEAN       NOT NULL DEFAULT false,
  jalon_key       jalon_key_type,         -- j1 / j2 / j3 / j4
  jalon_label     TEXT,                   -- libellé affiché
  jalon_confirmed BOOLEAN       NOT NULL DEFAULT false,

  -- ── Objectifs : date de bilan (pour type "Définition des objectifs") ───────
  date_bilan DATE,

  -- ── Audit ─────────────────────────────────────────────────────────────────
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- ── Contraintes ───────────────────────────────────────────────────────────
  CONSTRAINT entretiens_jalon_key_requis CHECK (
    NOT est_jalon OR jalon_key IS NOT NULL
  ),
  CONSTRAINT entretiens_un_jalon_par_type UNIQUE NULLS NOT DISTINCT (salarie_id, jalon_key)
);

COMMENT ON TABLE  entretiens              IS 'Entretiens et jalons obligatoires du parcours';
COMMENT ON COLUMN entretiens.est_jalon    IS 'true = jalon obligatoire (j1-j4), false = entretien libre';
COMMENT ON COLUMN entretiens.jalon_key   IS 'Clé du jalon : j1=Diagnostic, j2=Validation PE, j3=Boîte outils, j4=Objectifs';
COMMENT ON COLUMN entretiens.date_bilan  IS 'Date de revue des objectifs (entretiens type Définition des objectifs)';


-- ════════════════════════════════════════════════════════════════════════════
-- TABLE : objectifs
-- Objectifs fixés lors d'un entretien, évalués lors des bilans
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE objectifs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- ── Relations ─────────────────────────────────────────────────────────────
  entretien_id UUID NOT NULL REFERENCES entretiens(id) ON DELETE CASCADE,
  salarie_id   UUID NOT NULL REFERENCES salaries(id)  ON DELETE CASCADE,

  -- ── Contenu ───────────────────────────────────────────────────────────────
  intitule    TEXT    NOT NULL,
  deadline    DATE,
  -- NULL = en cours ; true = atteint ; false = non atteint
  atteint     BOOLEAN,
  commentaire TEXT,

  -- ── Audit ─────────────────────────────────────────────────────────────────
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  objectifs          IS 'Objectifs personnalisés du salarié, liés à un entretien';
COMMENT ON COLUMN objectifs.atteint  IS 'NULL = en cours ; true = atteint ; false = non atteint';


-- ════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ════════════════════════════════════════════════════════════════════════════

CREATE INDEX idx_profiles_role        ON profiles(role);
CREATE INDEX idx_profiles_site_id     ON profiles(site_id);

CREATE INDEX idx_salaries_site_id     ON salaries(site_id);
CREATE INDEX idx_salaries_cip_id      ON salaries(cip_id);
CREATE INDEX idx_salaries_date_sortie ON salaries(date_sortie);
CREATE INDEX idx_salaries_actifs      ON salaries(site_id) WHERE date_sortie IS NULL;
CREATE INDEX idx_salaries_a_rappeler  ON salaries(a_rappeler) WHERE a_rappeler = true;
CREATE INDEX idx_salaries_fin_contrat ON salaries(date_fin_contrat) WHERE date_sortie IS NULL;

CREATE INDEX idx_entretiens_salarie   ON entretiens(salarie_id);
CREATE INDEX idx_entretiens_cip       ON entretiens(cip_id);
CREATE INDEX idx_entretiens_assigned  ON entretiens(assigned_to);
CREATE INDEX idx_entretiens_date      ON entretiens(date);
CREATE INDEX idx_entretiens_jalons    ON entretiens(salarie_id, jalon_key) WHERE est_jalon = true;

CREATE INDEX idx_objectifs_salarie    ON objectifs(salarie_id);
CREATE INDEX idx_objectifs_entretien  ON objectifs(entretien_id);
CREATE INDEX idx_objectifs_deadline   ON objectifs(deadline);
CREATE INDEX idx_objectifs_en_cours   ON objectifs(deadline, salarie_id) WHERE atteint IS NULL;


-- ════════════════════════════════════════════════════════════════════════════
-- FONCTIONS HELPERS RLS
-- (SECURITY DEFINER = s'exécutent avec les droits du propriétaire, pas de l'appelant)
-- ════════════════════════════════════════════════════════════════════════════

-- Rôle de l'utilisateur courant
CREATE OR REPLACE FUNCTION auth_user_role()
  RETURNS role_utilisateur
  LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Site de l'utilisateur courant (NULL si admin/direction)
CREATE OR REPLACE FUNCTION auth_user_site_id()
  RETURNS UUID
  LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT site_id FROM profiles WHERE id = auth.uid();
$$;

-- Raccourci : l'utilisateur voit tout (admin ou direction)
CREATE OR REPLACE FUNCTION is_admin_or_direction()
  RETURNS BOOLEAN
  LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT auth_user_role() IN ('admin', 'direction');
$$;

-- Raccourci : admin seul
CREATE OR REPLACE FUNCTION is_admin()
  RETURNS BOOLEAN
  LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT auth_user_role() = 'admin';
$$;


-- ════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE sites      ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE salaries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE entretiens ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectifs  ENABLE ROW LEVEL SECURITY;


-- ─── SITES ───────────────────────────────────────────────────────────────────
-- Lecture : tout utilisateur authentifié
CREATE POLICY "sites_select"
  ON sites FOR SELECT TO authenticated
  USING (true);

-- Création / modification / suppression : admin uniquement
CREATE POLICY "sites_insert_admin"
  ON sites FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "sites_update_admin"
  ON sites FOR UPDATE TO authenticated
  USING (is_admin());

CREATE POLICY "sites_delete_admin"
  ON sites FOR DELETE TO authenticated
  USING (is_admin());


-- ─── PROFILES ────────────────────────────────────────────────────────────────
-- Lecture :
--   admin / direction  → tout le monde
--   cip                → son propre profil + ses collègues du même site
CREATE POLICY "profiles_select"
  ON profiles FOR SELECT TO authenticated
  USING (
    is_admin_or_direction()
    OR id = auth.uid()
    OR (
      auth_user_role() = 'cip'
      AND site_id = auth_user_site_id()
    )
  );

-- Création : admin uniquement (création de comptes utilisateurs)
CREATE POLICY "profiles_insert_admin"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- Mise à jour :
--   admin  → tout profil
--   autres → uniquement son propre profil
CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE TO authenticated
  USING (
    is_admin()
    OR id = auth.uid()
  );

-- Suppression : admin uniquement
CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE TO authenticated
  USING (is_admin());


-- ─── SALARIÉS ────────────────────────────────────────────────────────────────
-- Lecture :
--   admin / direction → tout
--   cip               → son site uniquement
CREATE POLICY "salaries_select"
  ON salaries FOR SELECT TO authenticated
  USING (
    is_admin_or_direction()
    OR (
      auth_user_role() = 'cip'
      AND site_id = auth_user_site_id()
    )
  );

-- Création :
--   admin / direction → tout site
--   cip               → son site uniquement
CREATE POLICY "salaries_insert"
  ON salaries FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_or_direction()
    OR (
      auth_user_role() = 'cip'
      AND site_id = auth_user_site_id()
    )
  );

-- Mise à jour (même logique)
CREATE POLICY "salaries_update"
  ON salaries FOR UPDATE TO authenticated
  USING (
    is_admin_or_direction()
    OR (
      auth_user_role() = 'cip'
      AND site_id = auth_user_site_id()
    )
  );

-- Suppression : admin uniquement
CREATE POLICY "salaries_delete_admin"
  ON salaries FOR DELETE TO authenticated
  USING (is_admin());


-- ─── ENTRETIENS ──────────────────────────────────────────────────────────────
-- Lecture :
--   admin / direction → tout
--   cip               → entretiens des salariés de son site
CREATE POLICY "entretiens_select"
  ON entretiens FOR SELECT TO authenticated
  USING (
    is_admin_or_direction()
    OR (
      auth_user_role() = 'cip'
      AND EXISTS (
        SELECT 1 FROM salaries s
        WHERE s.id = entretiens.salarie_id
          AND s.site_id = auth_user_site_id()
      )
    )
  );

-- Création
CREATE POLICY "entretiens_insert"
  ON entretiens FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_or_direction()
    OR (
      auth_user_role() = 'cip'
      AND EXISTS (
        SELECT 1 FROM salaries s
        WHERE s.id = salarie_id
          AND s.site_id = auth_user_site_id()
      )
    )
  );

-- Mise à jour
CREATE POLICY "entretiens_update"
  ON entretiens FOR UPDATE TO authenticated
  USING (
    is_admin_or_direction()
    OR (
      auth_user_role() = 'cip'
      AND EXISTS (
        SELECT 1 FROM salaries s
        WHERE s.id = entretiens.salarie_id
          AND s.site_id = auth_user_site_id()
      )
    )
  );

-- Suppression : admin uniquement
CREATE POLICY "entretiens_delete_admin"
  ON entretiens FOR DELETE TO authenticated
  USING (is_admin());


-- ─── OBJECTIFS ───────────────────────────────────────────────────────────────
-- Lecture
CREATE POLICY "objectifs_select"
  ON objectifs FOR SELECT TO authenticated
  USING (
    is_admin_or_direction()
    OR (
      auth_user_role() = 'cip'
      AND EXISTS (
        SELECT 1 FROM salaries s
        WHERE s.id = objectifs.salarie_id
          AND s.site_id = auth_user_site_id()
      )
    )
  );

-- Création
CREATE POLICY "objectifs_insert"
  ON objectifs FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_or_direction()
    OR (
      auth_user_role() = 'cip'
      AND EXISTS (
        SELECT 1 FROM salaries s
        WHERE s.id = salarie_id
          AND s.site_id = auth_user_site_id()
      )
    )
  );

-- Mise à jour
CREATE POLICY "objectifs_update"
  ON objectifs FOR UPDATE TO authenticated
  USING (
    is_admin_or_direction()
    OR (
      auth_user_role() = 'cip'
      AND EXISTS (
        SELECT 1 FROM salaries s
        WHERE s.id = objectifs.salarie_id
          AND s.site_id = auth_user_site_id()
      )
    )
  );

-- Suppression : admin uniquement
CREATE POLICY "objectifs_delete_admin"
  ON objectifs FOR DELETE TO authenticated
  USING (is_admin());


-- ════════════════════════════════════════════════════════════════════════════
-- TRIGGERS : updated_at automatique
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION set_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_salaries_updated_at
  BEFORE UPDATE ON salaries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_entretiens_updated_at
  BEFORE UPDATE ON entretiens
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_objectifs_updated_at
  BEFORE UPDATE ON objectifs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ════════════════════════════════════════════════════════════════════════════
-- TRIGGER : création automatique du profil à l'inscription Supabase Auth
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION handle_new_user()
  RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, nom, prenom, email, role, site_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nom',    ''),
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::role_utilisateur,
      'cip'
    ),
    CASE
      WHEN NEW.raw_user_meta_data->>'site_id' IS NOT NULL
      THEN (NEW.raw_user_meta_data->>'site_id')::UUID
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ════════════════════════════════════════════════════════════════════════════
-- VUES UTILITAIRES
-- ════════════════════════════════════════════════════════════════════════════

-- ── v_salaries_actifs : salariés sans date de sortie + alertes en jours ────
CREATE OR REPLACE VIEW v_salaries_actifs
WITH (security_invoker = true)    -- respecte le RLS de l'appelant
AS
SELECT
  s.*,
  p.nom          AS cip_nom,
  p.prenom       AS cip_prenom,
  si.nom         AS site_nom,
  si.ville       AS site_ville,
  -- jours restants (négatif = dépassé)
  (s.date_fin_contrat  - CURRENT_DATE) AS jours_fin_contrat,
  (s.date_fin_agrement - CURRENT_DATE) AS jours_fin_agrement,
  (s.titre_sejour      - CURRENT_DATE) AS jours_titre_sejour,
  (s.css_jusqu_au      - CURRENT_DATE) AS jours_css
FROM salaries s
JOIN profiles p  ON p.id  = s.cip_id
JOIN sites    si ON si.id = s.site_id
WHERE s.date_sortie IS NULL;

COMMENT ON VIEW v_salaries_actifs IS 'Salariés actifs (sans date de sortie) avec délais en jours. Respecte le RLS.';


-- ── v_objectifs_en_cours : objectifs non encore évalués ──────────────────
CREATE OR REPLACE VIEW v_objectifs_en_cours
WITH (security_invoker = true)
AS
SELECT
  o.id,
  o.intitule,
  o.deadline,
  o.commentaire,
  (o.deadline - CURRENT_DATE) AS jours_restants,
  s.id       AS salarie_id,
  s.nom      AS salarie_nom,
  s.prenom   AS salarie_prenom,
  s.site_id,
  e.id       AS entretien_id,
  e.assigned_to
FROM objectifs   o
JOIN salaries    s ON s.id = o.salarie_id
JOIN entretiens  e ON e.id = o.entretien_id
WHERE o.atteint IS NULL
  AND o.deadline IS NOT NULL;

COMMENT ON VIEW v_objectifs_en_cours IS 'Objectifs en cours (atteint IS NULL) avec délais. Respecte le RLS.';


-- ── v_jalons_a_confirmer : jalons planifiés non encore confirmés ─────────
CREATE OR REPLACE VIEW v_jalons_a_confirmer
WITH (security_invoker = true)
AS
SELECT
  e.id,
  e.jalon_key,
  e.jalon_label,
  e.date,
  e.participants,
  e.assigned_to,
  s.id     AS salarie_id,
  s.nom    AS salarie_nom,
  s.prenom AS salarie_prenom,
  s.site_id,
  (e.date - CURRENT_DATE) AS jours_avant_jalon
FROM entretiens e
JOIN salaries   s ON s.id = e.salarie_id
WHERE e.est_jalon        = true
  AND e.jalon_confirmed  = false
  AND s.date_sortie      IS NULL;

COMMENT ON VIEW v_jalons_a_confirmer IS 'Jalons obligatoires planifiés mais non encore confirmés. Respecte le RLS.';


-- ── v_stats_site : KPIs agrégés par site ────────────────────────────────
CREATE OR REPLACE VIEW v_stats_site
WITH (security_invoker = true)
AS
SELECT
  si.id                                                       AS site_id,
  si.nom                                                      AS site_nom,
  COUNT(s.id)                                                 AS total_salaries,
  COUNT(s.id) FILTER (WHERE s.date_sortie IS NULL)            AS actifs,
  COUNT(s.id) FILTER (WHERE s.date_sortie IS NOT NULL)        AS sortis,
  COUNT(s.id) FILTER (WHERE s.deld)                           AS deld,
  COUNT(s.id) FILTER (WHERE s.brsa)                           AS brsa,
  COUNT(s.id) FILTER (WHERE s.th)                             AS th,
  COUNT(s.id) FILTER (WHERE s.resident_qpv)                   AS qpv,
  COUNT(s.id) FILTER (WHERE s.permis_b)                       AS avec_permis_b,
  COUNT(s.id) FILTER (WHERE s.cv)                             AS avec_cv,
  ROUND(AVG(
    (COALESCE(s.date_sortie, CURRENT_DATE) - s.date_entree)::NUMERIC / 30
  ), 1)                                                       AS duree_moy_mois,
  COUNT(s.id) FILTER (
    WHERE s.type_sortie IN ('Dynamique','Durable','Transition')
  )                                                           AS sorties_positives
FROM sites    si
LEFT JOIN salaries s ON s.site_id = si.id
GROUP BY si.id, si.nom;

COMMENT ON VIEW v_stats_site IS 'KPIs par site. Accès conditionné par le RLS sur salaries.';


-- ════════════════════════════════════════════════════════════════════════════
-- DONNÉES DE RÉFÉRENCE (sites)
-- ════════════════════════════════════════════════════════════════════════════
-- IDs fixes pour correspondre aux seeds de développement

INSERT INTO sites (id, nom, ville) VALUES
  ('00000000-0000-0000-0000-000000000001', 'ID''EES R&V — Firminy',              'Firminy'),
  ('00000000-0000-0000-0000-000000000002', 'ID''EES Logistique — Saint-Étienne', 'Saint-Étienne')
ON CONFLICT (id) DO NOTHING;
