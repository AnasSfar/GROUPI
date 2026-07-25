# GROUPI — Contexte projet

> Ce fichier est le point d'entrée pour comprendre GROUPI avant de coder. Il résume le référentiel fonctionnel officiel (`RÉFÉRENTIEL FONCTIONNEL GROUPI.docx` / `.pdf`, Version 1.0). **En cas de doute ou de divergence, le référentiel fait foi**, pas ce résumé.
>
> Le texte intégral, découpé par partie, est dans [`docs/referentiel/`](docs/referentiel/). Des skills Claude Code par domaine (`.claude/skills/`) chargent la bonne partie selon le sujet sur lequel on travaille — invoque-les plutôt que de relire tout le document.

## État du dépôt

Ce dépôt ne contient aujourd'hui **que le référentiel fonctionnel** (docx, pdf, et sa version markdown découpée). Aucun code applicatif n'a encore été écrit. La stack technique (langage, framework, base de données) reste à définir — ce document ne préjuge de rien à ce sujet, il ne fait que transcrire les règles métier.

## Qu'est-ce que GROUPI ?

GROUPI est une **plateforme numérique de gestion des cours particuliers**, pensée pour le marché tunisien. Elle remplace les cahiers, tableurs Excel, groupes WhatsApp et appels téléphoniques que les professeurs de cours particuliers utilisent aujourd'hui pour gérer leur activité.

- **Mission** : automatiser les tâches administratives des professeurs (groupes, séances, présences, paiements) pour leur libérer du temps pédagogique, tout en donnant aux parents une visibilité claire sur le suivi de leurs enfants.
- **Ce que GROUPI n'est pas** : pas un outil pédagogique, ne remplace pas la méthode d'enseignement du professeur (référentiel §1.10).
- **Bénéficiaires** : Professeurs (utilisateurs principaux, payants), Parents (gratuit), indirectement les Élèves.

## Les acteurs (référentiel Chapitre 3, partie I)

GROUPI repose sur 5 catégories d'acteurs :

| Acteur | Rôle |
|---|---|
| **Super Administrateur** | Rôle unique (un seul compte actif à la fois), tous les droits, créé à l'initialisation du système |
| **Administrateur** | Agit par délégation du Super Admin, permissions configurées individuellement, ne peut jamais modifier ses propres droits |
| **Professeur** | Utilisateur principal et payant ; propriétaire exclusif de ses groupes ; données isolées des autres professeurs |
| **Parent** | Compte gratuit ; peut représenter plusieurs enfants ; un Élève n'est rattaché qu'à un seul Parent en V1 |
| **Élève** | **N'a pas de compte utilisateur en V1** — c'est un objet métier autonome piloté par son Parent, mais dont l'historique persiste indépendamment |

Un utilisateur peut cumuler les rôles Professeur + Parent sur le même compte (`User` générique), mais **un seul compte GROUPI par personne** (RM-ACC-001), et une adresse email = un seul compte (RM-ACC-017).

États de compte : `PENDING_VALIDATION → ACTIVE → SUSPENDED / DISABLED → ARCHIVED`. Un Professeur/Parent doit être validé par un Admin avant de pouvoir créer des groupes / inscrire un enfant.

## Modèle économique (Chapitre 4, partie I)

Les **Parents utilisent la plateforme gratuitement**. Les **Professeurs souscrivent un abonnement** (personnel, non transférable) :

| Offre | Prix | Durée | Capacité (inscriptions actives simultanées) |
|---|---|---|---|
| Découverte | Gratuite | 30 jours calendaires | 20 |
| Intermédiaire | 49 TND | Jusqu'à fin d'année académique | 50 |
| Pro | 99 TND | Jusqu'à fin d'année académique | Illimitée |

Le contrôle de capacité se fait en temps réel à chaque validation d'inscription. Le passage à une offre inférieure est refusé tant que le nombre d'inscriptions actives dépasse la nouvelle capacité.

## Architecture métier — les 8 domaines (Chapitre 27, partie V)

Le référentiel définit l'organisation fonctionnelle cible en domaines indépendants communiquant par **événements métier asynchrones**, chaque donnée ayant un domaine propriétaire unique (Source of Truth) :

**Domaines cœur** (priorité disponibilité/robustesse) :
- **Utilisateurs** — comptes, rôles, validations, auth, sessions
- **Pédagogique** — cœur du produit : groupes, séances, inscriptions, préinscriptions, présences, changements de groupe
- **Comptable** — suivi financier des inscriptions (ne réalise jamais les paiements, en assure seulement le suivi)
- **Commercial** — abonnements des professeurs, indépendant du moteur comptable des élèves (les paiements d'abonnement ne touchent jamais les comptes de suivi des élèves)

**Domaines support** :
- **Communication** — notifications, centre d'activités, annonces
- **Pilotage** — tableaux de bord, indicateurs, exports
- **Référentiels** — matières, niveaux scolaires, établissements, villes
- **Administration**

C'est la structuration à utiliser pour découper le futur code en modules/services.

## Conventions de nommage (Chapitre 2, partie I) — À RESPECTER dans tout le code

- **Français** pour le fonctionnel, **anglais** pour tout ce qui est technique (DB, API, code).
- **Objets métier** : PascalCase singulier — `User`, `TeacherProfile`, `ParentProfile`, `Student`, `Group`, `Session`, `Enrollment`, `Payment`, `Notification`, `AcademicYear`. (`User` = compte générique auth ; `TeacherProfile`/`ParentProfile` = données métier par rôle rattachées à un `User` ; `Student` est une entité autonome sans compte.)
- **Tables SQL** : anglais, singulier, snake_case — `user`, `teacher_profile`, `group`, `session`, `attendance`, `payment`. PK toujours `id` (UUID). FK = `[objet]_id` (ex. `group_id`), sauf référence directe au compte générique → `user_id`.
- **Colonnes** : snake_case anglais — `created_at`, `updated_at`, `deleted_at`, `first_name`.
- **Énumérations** : anglais, MAJUSCULES — `PENDING`, `ACTIVE`, `SUSPENDED`, `ARCHIVED`.
- **Permissions RBAC** : `[RESOURCE]_[ACTION]` — ex. `GRP_CREATE`, `SES_VALIDATE`, `PAY_CREATE`.
- **Règles métier** : `RM-[DOMAINE]-[NUMÉRO]` (ex. `RM-GRP-001`). **Workflows** : `WF-[DOMAINE]-[NUMÉRO]`. **Erreurs** : `ERR-[DOMAINE]-[NUMÉRO]`. **Calculs** : `CAL-[DOMAINE]-[NUMÉRO]`. **Notifications** : `NOT-[DOMAINE]-[NUMÉRO]`. **Événements** : `EVT-[DOMAINE]-[NUMÉRO]`. Ces codes sont uniques dans tout le référentiel — vérifier l'Annexe B/F avant d'en créer de nouveaux.
- **API REST** : anglais, pluriel, kebab-case, versionnée — `/api/v1/groups`, `/api/v1/enrollments`. **PATCH privilégié sur PUT**. `DELETE` = soft delete uniquement.
- **Variables** : camelCase (`teacherId`, `groupCapacity`). **Classes** : PascalCase (`TeacherService`, `EnrollmentController`). **Composants front** : PascalCase.tsx. **Booléens** : préfixes `is`/`has`/`can` (`isValidated`, `hasPendingPayment`, `canCancel`).
- **Dates** : stockage UTC systématique, affichage converti en `Africa/Tunis` (UTC+1), format technique `YYYY-MM-DD`.
- **Terminologie officielle à respecter strictement** (référentiel §2.19) — ne jamais utiliser les synonymes proscrits :
  - **Groupe** (jamais "Classe"/"Cours" pour un ensemble d'élèves) — un ensemble d'élèves inscrits ensemble sur une période
  - **Séance** (jamais "Cours" pour une occurrence) — occurrence ponctuelle rattachée à un Groupe
  - **Inscription** / **Préinscription** (jamais "Adhésion"/"Réservation")
  - **Compte** = authentification uniquement (jamais "Profil" dans ce sens)
  - **Compte de suivi comptable** (jamais "Solde élève"/"Wallet") — entité comptable liée à une inscription, à ne pas confondre avec "Compte" (auth)
  - **Année académique** (jamais "Année scolaire")

## Cas d'usage / lecture recommandée par sujet

| Tu travailles sur... | Va lire... |
|---|---|
| Auth, comptes, rôles, sessions, RBAC | `docs/referentiel/01-partie-1-cadre-general.md` (Ch. 3) + `02-partie-2-gestion-utilisateurs.md` (Ch. 9) |
| Profils Professeur/Parent, validation de compte | `docs/referentiel/02-partie-2-gestion-utilisateurs.md` (Ch. 5-8) |
| Groupes, inscriptions, séances, présences | `docs/referentiel/03-partie-3-gestion-pedagogique.md` (Ch. 10-14) |
| Comptabilité, paiements, abonnements, exports, notifications | `docs/referentiel/04-partie-4-gestion-financiere.md` (Ch. 15-23) |
| Règles transversales, calculs, architecture, roadmap | `docs/referentiel/05-partie-5-regles-fonctionnelles.md` (Ch. 24-30) |
| Chercher un code d'erreur/règle/événement précis, la matrice RBAC, le lexique | `docs/referentiel/06-partie-6-annexes.md` (grep par code, ex. `RM-GRP`, `ERR-INS`) |

Chaque partie détaille systématiquement, par chapitre : Objet, Principes, Règles métier, Cas d'erreur, Événements métier, Notifications, Objets métier concernés — c'est la structure à retrouver dans l'implémentation (services, exceptions, event bus, notifications).
