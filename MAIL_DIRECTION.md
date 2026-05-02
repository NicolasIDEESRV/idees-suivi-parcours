# MAIL_DIRECTION.md
> Brouillon de mail à destination de la direction du Groupe ID'EES
> À adapter avant envoi selon les retours de l'audit et les décisions internes

---

**De :** Nicolas GERLAND — Responsable d'exploitation, ID'EES R&V
**À :** Direction Groupe ID'EES
**Objet :** Déploiement de l'outil de suivi des parcours — État des lieux, sécurité et plan de déploiement groupe

---

Madame, Monsieur,

Je vous adresse ce point d'étape concernant le développement de notre outil interne de suivi des parcours d'insertion, dont je souhaite vous présenter l'avancement, les garanties de sécurité mises en place, et la feuille de route pour un déploiement progressif à l'échelle du groupe.

---

**Qu'est-ce que cet outil et à quoi sert-il ?**

Il s'agit d'une application web développée sur mesure pour les structures IAE du groupe. Elle permet à nos conseillers en insertion professionnelle (CIP) de gérer, en un seul outil, l'ensemble des parcours de nos salariés et candidats :

- Suivi des fiches individuelles (état civil, parcours, situation sociale, compétences, mobilité)
- Planification et enregistrement des entretiens et jalons obligatoires
- Suivi des objectifs fixés lors de chaque entretien
- Gestion des entrées et sorties, avec tableau de bord des alertes (fin de contrat, jalon à venir…)
- Candidatothèque avec suivi de l'orientation des candidats
- Exports statistiques et opérationnels (bilan ASP, chiffres clés)
- Accès différencié selon le profil : CIP (son site uniquement), direction (lecture de tous les sites), administrateur (accès total)

L'outil remplace les fichiers Excel ou les outils non adaptés qui étaient utilisés jusqu'ici, et centralise l'information de façon sécurisée.

---

**Ce qui est déjà en place et fonctionne bien**

Je suis heureux de vous indiquer que les fondations de l'application sont solides :

*La sécurité des accès est strictement cloisonnée.* Un CIP d'un site ne peut accéder, même par erreur ou tentative malveillante, aux données d'un autre site. Ce cloisonnement est garanti au niveau de la base de données elle-même (et non seulement au niveau de l'interface), ce qui constitue le niveau de protection le plus robuste techniquement.

*L'architecture est prête pour le groupe.* L'organisation filiale → secteur → activité → site est déjà intégrée. Ajouter une nouvelle filiale ou un nouveau site ne nécessite aucune modification du logiciel — uniquement la création d'une ligne dans le référentiel et des comptes utilisateurs. L'application peut accueillir dès maintenant plusieurs centaines de salariés sans modification technique.

*Les rôles et les droits sont bien définis.* Trois niveaux d'accès sont opérationnels : administrateur (configuration, gestion des comptes), direction (consultation consolidée de tous les sites), CIP (son périmètre uniquement).

*L'authentification est sécurisée.* La connexion utilise des jetons sécurisés à durée de vie limitée. Les mots de passe ne sont jamais stockés en clair. Un système d'invitation par lien sécurisé permet de créer les comptes des nouveaux utilisateurs.

---

**Ce qui reste à faire — Plan en trois phases**

**Phase 1 — Court terme (avant déploiement sur le site pilote — 4 à 6 semaines)**

Trois points sont à traiter en priorité avant d'importer des données réelles :

1. *Mettre en place les sauvegardes automatiques.* Actuellement, aucune sauvegarde n'est configurée sur l'environnement d'hébergement gratuit utilisé pour le développement. C'est le point le plus urgent à résoudre avant tout usage en production. Deux options s'offrent à nous : basculer vers un hébergement payant (environ 25 €/mois) qui inclut des sauvegardes quotidiennes, ou héberger l'application sur nos propres serveurs avec une sauvegarde automatique configurée chaque nuit. La direction ayant exprimé sa préférence pour un hébergement interne, c'est cette seconde option que nous recommandons.

2. *Créer un environnement de test.* Avant de déployer toute évolution sur la version utilisée en production, nous avons besoin d'un espace de test avec des données fictives. Cela permet de valider les mises à jour sans risque pour les données réelles.

3. *Définir notre politique de conservation des données.* Le RGPD nous impose de ne pas conserver les données personnelles au-delà de la durée nécessaire. Il nous faut décider collectivement de cette durée (par exemple : 5 ans après la date de sortie du salarié) et mettre en place la suppression automatique au-delà. Cette décision est d'ordre organisationnel et nécessite votre validation.

**Phase 2 — Moyen terme (déploiement filiale 1 et 2 — 2 à 4 mois)**

Une fois le site pilote opérationnel et validé, l'extension aux premières filiales est rapide. Elle implique :

- La création des sites et comptes utilisateurs dans l'outil
- La formation des CIP et responsables de site
- La migration éventuelle des données existantes depuis les outils actuels
- La désignation d'un référent RGPD au sein du groupe, chargé de tenir le registre des traitements

**Phase 3 — Déploiement groupe (6 à 12 mois)**

Le déploiement à l'échelle du groupe nécessitera un renforcement de l'infrastructure serveur, la mise en place d'une réplication des données pour garantir la continuité de service, et probablement un accord de niveau de service (SLA) avec notre administrateur système.

---

**Points de vigilance liés aux données personnelles**

Notre outil traite des données sensibles : informations d'identité, données sociales, informations de santé (restrictions médicales, addictions, traitement…). Ces données relèvent du RGPD et, pour certaines, de l'article 9 qui impose des obligations renforcées.

Les mesures techniques sont en place (cloisonnement, chiffrement des communications). Ce qui reste à formaliser côté organisation :

- Désigner un référent chargé de la conformité RGPD au sein du groupe (ou mandater notre DPO)
- Informer les salariés du traitement de leurs données (notice d'information simple à remettre à l'entrée)
- Tenir un registre des traitements (document interne listant quelles données on collecte, pourquoi et combien de temps)

Ces démarches sont obligatoires mais accessibles — elles ne remettent pas en cause le projet, elles en sont le complément naturel.

---

**Ressources nécessaires**

| Ressource | Besoin | Disponible en interne ? |
|-----------|--------|------------------------|
| Administrateur système | Configuration du serveur interne, déploiement initial, surveillance | Oui |
| Développement applicatif | Évolutions, corrections, scripts de déploiement | Via Claude Code (IA) |
| Référent RGPD | Registre des traitements, notice salariés | À désigner |
| Budget hébergement | Serveur interne (VM existante) ou OVH ~15-30 €/mois | Faible |
| Budget formation | Formation des CIP à l'outil — environ 1/2 journée par site | À prévoir |

Sur le volet développement, je souhaite attirer votre attention sur un point : nous avons la possibilité d'utiliser un outil d'intelligence artificielle spécialisé (Claude Code) pour assurer la maintenance et les évolutions de l'application sans avoir recours à un développeur externe. Cet outil analyse le code existant, produit les modifications demandées et les déploie. Notre administrateur système supervise et exécute les opérations techniques. C'est un modèle que nous avons déjà testé avec succès pour le développement de cet outil.

---

**Recommandation et conclusion**

Le déploiement sur le site pilote est techniquement prêt, sous réserve de la mise en place des sauvegardes et de l'environnement de test. Je recommande de franchir cette étape dans les 4 à 6 semaines à venir, sur la base d'un hébergement interne conformément à la décision de la direction.

Le déploiement groupe est une perspective réaliste à l'horizon 6 à 12 mois, sans surcoût significatif ni dépendance à un prestataire externe pour la maintenance courante.

Je reste à votre disposition pour présenter l'outil en démonstration et répondre à vos questions.

Bien cordialement,

**Nicolas GERLAND**
Responsable d'exploitation — ID'EES R&V

---
*Ce mail s'appuie sur un audit technique complet de l'application, disponible dans le fichier AUDIT_SECURITE.md.*
