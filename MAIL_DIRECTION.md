# Mail à la direction — ID'EES Suivi Parcours

**De :** Nicolas GERLAND — Responsable d'exploitation, ID'EES R&V
**À :** Direction Groupe ID'EES
**Objet :** Outil de suivi des parcours — Bilan, sécurité et plan de déploiement

---

Madame, Monsieur,

Je vous présente un point d'étape sur notre outil de suivi des parcours d'insertion, développé en interne pour l'ensemble du Groupe ID'EES.

---

**L'outil en quelques mots**

Il s'agit d'une application web qui centralise le suivi individuel de chaque salarié et candidat : fiche de parcours, entretiens, jalons obligatoires, objectifs, alertes de fin de contrat, statistiques et exports ASP. Chaque conseiller n'accède qu'aux données de son site. La direction consulte l'ensemble du groupe. L'outil est opérationnel et testé.

---

**Ce qui est en place**

Sur le plan technique, les fondations sont solides :

- Le cloisonnement des données par site est garanti au niveau de la base de données, pas seulement de l'interface — un niveau de protection maximal.
- L'authentification est sécurisée, avec déconnexion automatique après 30 minutes d'inactivité et politique de mot de passe renforcée (12 caractères, majuscule, chiffre, caractère spécial).
- L'architecture supporte dès maintenant plusieurs filiales et centaines de salariés sans modification.
- La conformité RGPD est intégrée : les référents sont désignés, les notices remises aux salariés, et la suppression automatique des données après 5 ans est programmée dans l'application.

---

**Plan de déploiement en trois phases**

**Phase 1 — Site pilote ID'EES R&V (dans les 2 à 4 semaines)**

Trois actions préalables sont nécessaires, toutes réalisables en moins d'une journée :

1. Passer l'hébergement cloud au plan payant (~25 €/mois) pour activer les sauvegardes quotidiennes automatiques.
2. Signer l'accord de sous-traitance RGPD avec l'hébergeur — disponible en ligne, une fois le plan payant activé.
3. Exécuter un script SQL de mise à jour de la base de données, fourni et documenté.

Une fois ces trois points réalisés, l'import des données du site pilote peut démarrer.

**Phase 2 — Déploiement filiale 1 : ID'EES R&V étendu (2 à 3 mois)**

L'extension à d'autres sites de la filiale se fait sans modification du logiciel : création des comptes utilisateurs, formation des CIP (demi-journée par site), import des données. Aucun coût supplémentaire.

**Phase 3 — Déploiement filiale 2 : ID'EES 21, puis groupe (6 à 12 mois)**

À partir du déploiement sur ID'EES 21, nous basculerons sur un hébergement interne sur nos propres serveurs. Les données ne quitteront plus notre infrastructure. Les scripts de déploiement, de configuration et de sauvegarde sont déjà rédigés et documentés. Notre administrateur système dispose de tout ce qu'il faut pour opérer la migration.

---

**Ressources nécessaires**

| Ressource | Besoin | Situation |
|-----------|--------|-----------|
| Développement | Évolutions et maintenance | Assuré par Claude Code (IA) — sans prestataire externe |
| Administration système | Déploiement interne à partir de la phase 3 | Disponible en interne |
| Hébergement cloud | Phases 1 et 2 | ~25 €/mois |
| Hébergement interne | Phase 3 | Serveurs existants |

---

**Recommandation**

Le déploiement sur le site pilote peut démarrer dans les deux à quatre semaines. Les conditions techniques et réglementaires seront réunies dès la réalisation des trois actions mentionnées ci-dessus. L'extension au groupe est planifiée et maîtrisée, sans dépendance externe pour la maintenance courante.

Je reste disponible pour une démonstration ou pour répondre à vos questions.

Bien cordialement,

**Nicolas GERLAND**
Responsable d'exploitation — ID'EES R&V

---
*Pour aller plus loin : un audit technique complet est disponible dans le fichier AUDIT_SECURITE.md du projet.*
