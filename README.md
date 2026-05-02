# ID'EES Suivi Parcours

Application web interne de suivi des parcours d'insertion pour le Groupe ID'EES (IAE).

---

## À quoi ça sert ?

L'outil permet aux Conseillers en Insertion Professionnelle (CIP) de gérer, en un seul endroit :

- Les **fiches individuelles** des salariés et candidats (état civil, situation sociale, compétences, mobilité)
- Les **entretiens et jalons obligatoires** du parcours (planification, compte-rendu, objectifs)
- Les **alertes** de fin de contrat, jalons à venir, salariés à rappeler
- La **candidatothèque** avec suivi de l'orientation (vivier, recruté, décliné)
- Les **statistiques et exports** (bilan ASP, chiffres clés par site et par groupe)

---

## Architecture technique

| Composant | Technologie |
|-----------|-------------|
| Interface | React 19 + Vite + Tailwind CSS |
| Base de données | PostgreSQL via Supabase |
| Authentification | Supabase Auth (JWT + PKCE) |
| Hébergement front | Vercel (cloud) → à migrer sur serveur interne |
| Hébergement BDD | Supabase Cloud → à migrer sur serveur interne |

---

## Rôles utilisateurs

| Rôle | Accès |
|------|-------|
| `admin` | Accès total à tous les sites, gestion des comptes, suppression |
| `direction` | Lecture de tous les sites + création/modification salariés et entretiens |
| `cip` | Son site uniquement (ou ses sites si multi-affectation) — CRUD complet sauf suppression |

Le cloisonnement est garanti par le **Row Level Security (RLS)** de PostgreSQL : un CIP ne peut jamais accéder aux données d'un autre site, même en tentant des requêtes directes sur la base.

---

## Structure de la base de données

```
sites          → Référentiel des structures (filiale / secteur / activité / site)
profiles       → Comptes utilisateurs (extension de auth.users Supabase)
salaries       → Fiches salariés et candidats
entretiens     → Compte-rendus d'entretiens et jalons obligatoires
objectifs      → Objectifs fixés lors des entretiens
journal_anonymisations → Historique des anonymisations RGPD
```

**Hiérarchie organisationnelle :**
```
Groupe ID'EES
└── Filiale (ex : ID'EES R&V)
    └── Secteur (ex : Tri des déchets ménagers)
        └── Activité (ex : Tri sélectif)
            └── Site (ex : Firminy)
```

---

## Installation et démarrage en développement

### Prérequis
- Node.js 20+
- Un compte Supabase (gratuit) ou une instance Supabase auto-hébergée

### 1. Cloner le projet
```bash
git clone https://github.com/NicolasIDEESRV/idees-suivi-parcours.git
cd idees-suivi-parcours
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer les variables d'environnement
```bash
cp .env.example .env.local
# Éditer .env.local avec les clés de votre projet Supabase
```

### 4. Initialiser la base de données
Dans Supabase → SQL Editor, exécuter dans l'ordre :
1. `supabase/schema.sql` — schéma complet (tables, RLS, fonctions)
2. `supabase/migration_sites_hierarchy.sql` — hiérarchie filiale/secteur/activité
3. `supabase/migration_salaries_fields.sql` — champs complémentaires salariés
4. `supabase/migration_profile_sites.sql` — accès multi-sites
5. `supabase/migration_previous_passage.sql` — lien ancien dossier
6. `supabase/migration_candidat_columns.sql` — colonnes candidat
7. `supabase/migration_fix_contrainte_jalon.sql` — correction contrainte
8. `supabase/migration_anonymisation.sql` — fonction RGPD

### 5. Démarrer l'application
```bash
npm run dev
# → http://localhost:5173
```

---

## Déploiement en production (hébergement interne)

Voir la documentation complète dans `AUDIT_SECURITE.md` pour le plan de déploiement étape par étape.

### Sauvegarde automatique
```bash
# Configurer et programmer le script de sauvegarde
chmod +x scripts/backup.sh
# Modifier les paramètres DB_HOST, DB_USER, etc. dans le script
# Ajouter au cron : 0 2 * * * /opt/idees/scripts/backup.sh
```

### Variables d'environnement en production
Pour l'hébergement interne, l'URL Supabase sera celle de votre serveur :
```
VITE_SUPABASE_URL=http://adresse-de-votre-serveur:8000
VITE_SUPABASE_ANON_KEY=votre_cle_anon_generee_lors_de_linstallation
```

---

## Conformité RGPD

L'application traite des données personnelles sensibles (santé, situation sociale).

- **Cloisonnement** : RLS PostgreSQL sur toutes les tables ✅
- **Chiffrement en transit** : HTTPS/TLS ✅
- **Déconnexion automatique** : après 30 minutes d'inactivité ✅
- **Anonymisation** : fonction SQL automatique après 5 ans (`migration_anonymisation.sql`) ✅
- **Sauvegardes** : script `scripts/backup.sh` à activer sur le serveur interne ✅
- **DPA** : à signer avec Supabase si hébergement cloud (plan Pro minimum)

---

## Fichiers importants

| Fichier | Rôle |
|---------|------|
| `supabase/schema.sql` | Schéma complet de la base + RLS |
| `supabase/migration_*.sql` | Évolutions successives de la base |
| `supabase/migration_anonymisation.sql` | Conformité RGPD |
| `scripts/backup.sh` | Sauvegarde automatique pour serveur interne |
| `.env.example` | Modèle de configuration |
| `AUDIT_SECURITE.md` | Audit sécurité complet avec plan d'actions |
| `src/lib/mappers.js` | Conversion base de données ↔ interface |
| `src/lib/api/` | Fonctions d'accès à la base |
| `src/contexts/AuthContext.jsx` | Gestion de l'authentification et des sessions |

---

## Maintenance et évolutions

Les évolutions, corrections et scripts de déploiement sont produits par **Claude Code** (Anthropic).
L'administrateur système du groupe assure le déploiement et la supervision de l'infrastructure.

Pour toute modification de l'application, ouvrir une session Claude Code dans ce dossier.

---

*Groupe ID'EES — Application développée et maintenue avec Claude Code*
