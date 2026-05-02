# AUDIT SÉCURITÉ — ID'EES Suivi Parcours
> Réalisé le 2 mai 2026 — Application React + Vite + Supabase (PostgreSQL) + Vercel

---

## Résumé exécutif

| # | Point audité | Statut | Priorité |
|---|-------------|--------|----------|
| 1 | RLS — cloisonnement des données par site | ✅ Fait | — |
| 2 | Authentification et gestion des sessions | ⚠️ Partiel | Moyenne |
| 3 | Environnement de test séparé | ❌ À faire | Haute |
| 4 | Durée de conservation et anonymisation des données | ❌ À faire | Haute |
| 5 | Architecture multi-sites / multi-filiales | ✅ Fait | — |
| 6 | Sauvegardes automatiques | ❌ À faire | **Critique** |
| 7 | Documentation technique | ⚠️ Partiel | Moyenne |

---

## Point 1 — RLS (Row Level Security)
### ✅ Fait — Cloisonnement strict par site, correctement configuré sur toutes les tables

**Ce qui est en place :**

Le RLS est activé sur les **5 tables** contenant des données personnelles :
- `sites` — référentiel des structures
- `profiles` — comptes utilisateurs
- `salaries` — fiches des salariés et candidats
- `entretiens` — compte-rendus d'entretiens
- `objectifs` — objectifs fixés lors des entretiens

**Logique de cloisonnement vérifiée dans le code :**

| Rôle | Accès |
|------|-------|
| `admin` | Toutes les données, tous les sites, toutes les opérations |
| `direction` | Lecture de tous les sites + écriture salariés/entretiens/objectifs |
| `cip` | Uniquement les données du ou des sites qui lui sont affectés |

Les politiques RLS sont implémentées à deux niveaux :
1. **Schéma initial** (`schema.sql`) — politiques de base
2. **Migration multi-sites** (`migration_profile_sites.sql`) — politiques mises à jour pour supporter plusieurs sites par utilisateur (`site_ids UUID[]`)

Les **vues SQL** (`v_salaries_actifs`, `v_objectifs_en_cours`, etc.) utilisent `security_invoker = true`, ce qui garantit que le RLS s'applique même lors des requêtes sur les vues.

**Fonctions helpers sécurisées :**
- `auth_user_role()` — récupère le rôle de l'utilisateur courant (SECURITY DEFINER)
- `auth_user_site_id()` — récupère le site de l'utilisateur courant (SECURITY DEFINER)
- `is_admin()` / `is_admin_or_direction()` — raccourcis sécurisés

**Verdict :** La sécurité des données entre sites est robuste. Un CIP du site A ne peut, en aucun cas, lire, modifier ou créer des données du site B — même en tentant des requêtes directes sur la base.

---

## Point 2 — Authentification et gestion des sessions
### ⚠️ Partiel — Connexion sécurisée, mais absence de déconnexion automatique par inactivité

**Ce qui est en place :**

- Authentification via **Supabase Auth** (JWT signé, bcrypt pour les mots de passe)
- Sessions persistantes avec **renouvellement automatique du token** (`autoRefreshToken: true`)
- Bouton de déconnexion explicite (`signOut`) présent dans l'application
- Flux d'invitation sécurisé par lien à usage unique (PKCE)
- Réinitialisation de mot de passe par email
- Les clés API sont lues depuis les variables d'environnement (`.env.local`), jamais codées en dur

**Ce qui manque :**

- ❌ **Aucune déconnexion automatique après inactivité** — si un utilisateur laisse l'application ouverte sans y toucher, la session reste active indéfiniment (le token est renouvelé automatiquement).
  > *Risque : poste laissé sans surveillance accessible par un tiers*
- ❌ **Pas de politique de complexité des mots de passe** — Supabase accepte par défaut des mots de passe de 6 caractères minimum.
- ❌ **Pas de double authentification (MFA/2FA)** — Supabase supporte le TOTP (application d'authentification) mais ce n'est pas activé.

**Actions recommandées (court terme) :**

1. Ajouter un timer d'inactivité de 30 minutes → déconnexion automatique *(Claude Code peut implémenter cela)*
2. Configurer dans Supabase : longueur minimale des mots de passe à 12 caractères *(paramètre dans le dashboard Supabase → Authentication → Settings)*
3. Optionnel mais recommandé pour les rôles admin : activer le MFA

---

## Point 3 — Environnement de test séparé (staging)
### ❌ À faire — Un seul environnement, les tests se font en production

**État actuel :**

- Un seul fichier `.env.local` pointant vers la base Supabase de production
- Aucun fichier `.env.staging` ou `.env.production`
- Les déploiements Vercel publient directement en production depuis la branche `main`
- Aucune base Supabase de test identifiée

**Risque concret :**

Toute modification de l'application (nouvelle fonctionnalité, migration SQL) est testée directement sur les données réelles. En cas d'erreur de migration, les données de production peuvent être altérées ou perdues.

**Ce qu'il faudrait mettre en place :**

1. **Créer un second projet Supabase** (gratuit) dédié aux tests — avec des données fictives
2. **Créer un fichier `.env.staging`** pointant vers ce projet de test
3. **Configurer Vercel** pour avoir deux environnements : `preview` (branche `develop`) → base de test / `production` (branche `main`) → base réelle
4. **Procédure type :** toute modification est testée sur staging → validée → déployée en production

> Note : Claude Code peut créer et maintenir l'environnement staging complet.

---

## Point 4 — Durée de conservation et anonymisation des données
### ❌ À faire — Aucun mécanisme automatique de suppression ou d'anonymisation

**État actuel :**

- Le champ `date_sortie` enregistre la date de fin de parcours d'un salarié
- Le champ `rappel_jusqu_au` (sortie + 3 mois) est calculé lors de la sortie
- Une fonction `nettoyer_echeances_sortie` supprime les entretiens futurs lors d'une sortie
- **Mais** : aucune suppression ou anonymisation automatique des données personnelles après une durée définie

**Obligation légale (RGPD — Article 5.1.e) :**

Les données personnelles doivent être conservées « sous une forme permettant l'identification des personnes concernées pendant une durée n'excédant pas celle nécessaire au regard des finalités pour lesquelles elles sont traitées ».

Pour des données de parcours IAE, la durée de conservation recommandée est généralement **5 ans après la fin du contrat** (à valider avec votre DPO ou référent RGPD).

**Ce qu'il faudrait mettre en place :**

1. Définir la politique de conservation avec votre direction (ex : 5 ans après `date_sortie`)
2. Créer une **fonction SQL planifiée** (cron Supabase ou script externe) qui, chaque nuit :
   - Détecte les fiches dont `date_sortie` dépasse la durée de conservation
   - Anonymise les données personnelles (nom → "Anonymisé", prénom → "Anonymisé", numéro sécu → null, etc.)
   - Conserve uniquement les données statistiques agrégées
3. Journaliser les anonymisations effectuées

> Note : Claude Code peut écrire la fonction SQL et le script d'anonymisation complets.

---

## Point 5 — Architecture multi-sites / multi-filiales
### ✅ Fait — Conçue pour évoluer au niveau groupe dès maintenant

**Ce qui est en place :**

- Table `sites` avec hiérarchie complète : **Filiale → Secteur → Activité → Site**
- Chaque salarié est rattaché à un `site_id`
- Chaque utilisateur (CIP, direction) peut être affecté à **un ou plusieurs sites** (`site_ids UUID[]`)
- Les filtres hiérarchiques (filiale/secteur/activité/site) sont implémentés dans les pages Salariés et Candidats
- Le RLS garantit l'isolation stricte des données entre sites
- Les statistiques et exports fonctionnent par périmètre (site, filiale, groupe)

**Capacité de montée en charge :**

| Scénario | Volumétrie estimée | Faisabilité |
|----------|-------------------|-------------|
| 1 site pilote | 40 salariés | ✅ Immédiat |
| 1 filiale (5-10 sites) | 200-400 salariés | ✅ Immédiat |
| 2 filiales (10-20 sites) | 400-800 salariés | ✅ Sans modification |
| Groupe complet | Quelques milliers | ✅ Avec renforcement serveur |

L'ajout d'une nouvelle filiale ou d'un nouveau site ne nécessite aucune modification du code — uniquement l'insertion d'une ligne dans la table `sites` et la création des comptes utilisateurs.

---

## Point 6 — Sauvegardes automatiques
### ❌ À faire — Critique : aucune sauvegarde en place sur le plan actuel

**État actuel :**

- L'application est hébergée sur **Supabase Free** (plan gratuit)
- Sur ce plan, **Supabase ne garantit aucune sauvegarde automatique**
- Aucun script de sauvegarde n'existe dans le projet
- En cas de suppression accidentelle ou de corruption, les données sont irrécupérables

**Risque :** Perte totale et irréversible de toutes les données en cas d'incident.

**Solutions disponibles selon l'hébergement choisi :**

| Hébergement | Solution sauvegarde | Fréquence | Coût |
|-------------|-------------------|-----------|------|
| Supabase Free (actuel) | Aucune garantie | — | 0 € |
| Supabase Pro | Point-in-Time Recovery inclus | Quotidienne | ~25 $/mois |
| Supabase Team | PITR continu | Continue | ~599 $/mois |
| **Self-hosted (interne)** | Script pg_dump + cron | À définir | Coût infra |

**Pour l'hébergement interne (recommandé par la direction) :**

Claude Code peut générer le script complet de sauvegarde automatique :
- Export PostgreSQL chiffré chaque nuit
- Rotation sur 30 jours
- Alerte par email en cas d'échec
- Procédure de restauration documentée

> ⚠️ **Action immédiate requise** : avant tout import de données réelles, mettre en place une solution de sauvegarde.

---

## Point 7 — Documentation technique
### ⚠️ Partiel — Schéma bien documenté, mais pas de README projet

**Ce qui existe :**

- `schema.sql` — très bien commenté : tables, colonnes, contraintes, rôles, RLS
- `supabase/` — 8 fichiers de migration avec commentaires explicites
- Code source commenté (mappers, API, composants)

**Ce qui manque :**

- ❌ Le `README.md` est le template par défaut de Vite — il ne décrit pas l'application
- ❌ Pas de document décrivant : comment installer, configurer et déployer l'application
- ❌ Pas de guide utilisateur (même minimal) pour les CIP et administrateurs
- ❌ Pas de description des variables d'environnement requises
- ❌ Pas de changelog des évolutions

**Impact :** Sans documentation, toute personne reprenant le projet (prestataire, successeur, administrateur système) devra lire l'intégralité du code pour comprendre comment l'application fonctionne.

> Note : Claude Code peut générer un README complet et une documentation technique à tout moment.

---

## Synthèse des actions prioritaires

### 🔴 Critique (avant tout import de données réelles)
- [ ] Mettre en place une solution de sauvegarde automatique (script pg_dump ou passage Supabase Pro)
- [ ] Décider de l'hébergement définitif (cloud Supabase Pro ou serveur interne)

### 🟠 Haute priorité (court terme — dans le mois)
- [ ] Créer un environnement de test séparé (projet Supabase staging + branche `develop`)
- [ ] Définir et implémenter la politique de conservation des données (RGPD)
- [ ] Ajouter la déconnexion automatique par inactivité (30 min)
- [ ] Signer un accord de sous-traitance RGPD (DPA) avec Supabase si on reste sur le cloud

### 🟡 Moyen terme (1 à 3 mois)
- [ ] Rédiger le README technique complet
- [ ] Mettre à jour la politique de mot de passe (12 caractères minimum)
- [ ] Envisager le MFA pour les rôles admin
- [ ] Rédiger la notice RGPD à destination des salariés

### 🟢 Long terme (avant déploiement groupe)
- [ ] Mettre en place la réplication PostgreSQL (haute disponibilité)
- [ ] Configurer le monitoring et les alertes
- [ ] Documenter les procédures de restauration et les tester

---

## Contexte technique de référence

| Composant | Technologie | Version |
|-----------|------------|---------|
| Frontend | React + Vite | React 19 |
| Base de données | PostgreSQL (via Supabase) | PostgreSQL 15 |
| Authentification | Supabase Auth (JWT/PKCE) | — |
| Hébergement frontend | Vercel | — |
| Hébergement BDD | Supabase Cloud (Free) — *à migrer* | — |
| CI/CD | GitHub → Vercel (auto-deploy) | — |

---

*Document généré par Claude Code — à conserver et mettre à jour à chaque évolution majeure de l'application.*
