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

Les fondations techniques sont solides :

- Le cloisonnement des données par site est garanti au niveau de la base de données — un niveau de protection maximal.
- L'authentification est sécurisée : déconnexion automatique après 30 minutes d'inactivité, politique de mot de passe renforcée (12 caractères minimum, majuscule, chiffre, caractère spécial).
- L'architecture supporte dès maintenant plusieurs filiales et des centaines de salariés sans modification.
- La conformité RGPD est assurée : référents désignés, notices remises aux salariés, suppression automatique des données programmée après 5 ans.

---

**Plan de déploiement en trois phases**

**Phase 1 — Site pilote ID'EES R&V (dans les 2 à 4 semaines)**

Trois actions préalables, réalisables en moins d'une journée :
1. Passer l'hébergement cloud au plan payant (~25 €/mois) pour activer les sauvegardes quotidiennes automatiques.
2. Signer l'accord de sous-traitance RGPD avec l'hébergeur — disponible en ligne dès le plan payant activé.
3. Exécuter un script de mise à jour de la base de données, fourni et documenté.

**Phase 2 — Extension filiale 1 : ID'EES R&V (2 à 3 mois)**

Sans modification du logiciel : création des comptes, formation des CIP (demi-journée par site), import des données.

**Phase 3 — Filiale 2 : ID'EES 21, puis groupe (6 à 12 mois)**

Basculement sur hébergement interne — les données ne quitteront plus notre infrastructure. Scripts de déploiement et de sauvegarde déjà rédigés. Notre administrateur système dispose de tout pour opérer la migration.

---

**Questions anticipées**

*Pourquoi un hébergement cloud payant pour les phases 1 et 2, et pas directement en interne ?*

La raison est le temps, pas le coût. Le démarrage en cloud prend 2 à 4 semaines ; la mise en place d'un hébergement interne mobiliserait l'administrateur système pendant 6 à 10 semaines. Pour 150 € au total (6 mois × 25 €), nous validons l'outil en conditions réelles avant d'investir du temps infrastructure. Si la direction préfère l'interne dès le départ, c'est faisable — le délai de démarrage sera simplement plus long.

*La maintenance est assurée par une IA : que se passe-t-il si elle ne fonctionne plus, ou si la personne qui l'utilise est absente ou quitte l'entreprise ?*

Il faut distinguer deux choses. L'application elle-même — le logiciel qui tourne pour les utilisateurs — ne dépend en rien de l'IA. Elle fonctionne de façon autonome sur nos serveurs, indépendamment de tout outil de développement. L'IA (Claude Code) est uniquement l'outil qui permet d'écrire et de modifier le code, comme Word est l'outil pour rédiger un contrat : si Word disparaît, le contrat existe toujours.

Pour la maintenance future, trois mesures éliminent le risque de dépendance à une personne :

Premièrement, le code source est hébergé sur GitHub, entièrement documenté. N'importe quel développeur web peut reprendre le projet sans délai — il n'est pas dans un format propriétaire.

Deuxièmement, Claude Code peut être utilisé par n'importe quelle personne disposant d'un compte, sur n'importe quel ordinateur. Le projet GitHub suffit pour reprendre exactement là où on en est. Former une deuxième personne à cet usage prend une journée et ne nécessite pas de compétences en développement.

Troisièmement, Anthropic — l'éditeur de Claude — propose un plan Teams qui permet de rattacher l'abonnement au nom de l'entreprise plutôt qu'à une personne. En cas de départ, l'accès reste acquis à l'organisation. Le coût est similaire au plan individuel.

---

**Ressources nécessaires**

| Ressource | Situation |
|-----------|-----------|
| Développement et maintenance | Assuré par Claude Code (IA) — sans prestataire externe, abonnement à rattacher à l'entreprise |
| Administration système | Disponible en interne |
| Hébergement cloud (phases 1 et 2) | ~25 €/mois |
| Hébergement interne (phase 3) | Serveurs existants |

---

**Recommandation**

Le déploiement sur le site pilote peut démarrer dans les deux à quatre semaines, dès la réalisation des trois actions mentionnées. L'extension au groupe est planifiée et maîtrisée. Le risque de dépendance — à un prestataire, à une technologie ou à une personne — est identifié et couvert.

Je reste disponible pour une démonstration ou pour répondre à vos questions.

Bien cordialement,

**Nicolas GERLAND**
Responsable d'exploitation — ID'EES R&V

---
*Un audit technique complet est disponible sur demande.*
