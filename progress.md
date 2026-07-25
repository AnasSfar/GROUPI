# GROUPI — Suivi d'avancement

> Ce fichier est mis à jour à chaque chantier terminé. Il sert de point d'entrée rapide pour savoir où on en est, sans avoir à relire tout l'historique de conversation. Le détail fonctionnel reste dans `docs/referentiel/` et `contexte.md`.

_Dernière mise à jour : 2026-07-25_

## Où on en est

### Fait et vérifié bout-en-bout
- **Modèle de données** (Prisma/PostgreSQL) — domaines Utilisateurs + Pédagogique + Référentiels, ~24 modèles.
- **Ch.9 — Authentification/Sessions/Sécurité** : register/login/refresh/logout, JWT courte durée + refresh token opaque en rotation, verrouillage après échecs, mot de passe oublié.
- **Ch.8 — Cycle de vie des comptes** : machine à états `PENDING_VALIDATION → ACTIVE ⇄ SUSPENDED → DISABLED`, révocation de session atomique, `AuditLog`, écran admin `/admin/users`, script `bootstrap:admin`.
- **Ch.5 — Profil Professeur** : matières/niveaux, score de complétude, écran `/teacher/profile`. Débloque la validation admin des comptes Professeur.
- **Ch.6 — Profil Parent & gestion des enfants** : `GET/PATCH /parent-profile/me`, CRUD `Student` (créer/lister/modifier/archiver/réactiver) sous `/parent-profile/me/students`, création automatique de la première situation scolaire à la création d'un enfant, écran `/parent/children`. Débloque la validation admin des comptes Parent en pratique (avant, rien ne permettait de déclarer un enfant).
- **Ch.7 — Situation scolaire** : `StudentSchoolSituation.status` (ACTIVE/PENDING_VALIDATION/CLOSED/REJECTED). Évolution de routine (même établissement, progression standard vers une nouvelle année académique) → automatique et immédiate. Tout le reste (changement d'établissement, redoublement, réorientation, saut de niveau) → créé en attente, validé/refusé par un Admin (`/admin/school-situations`). Historique complet consultable par le Parent (`/parent/children/:id/situation`).
- **Ch.10 — Groupes (MVP)** : création par le Professeur (planning hebdomadaire, capacité, tarif, mode d'enseignement, facturation des absences, visibilité si complet), vérification `SubjectLevel` (ERR-GRP-001) et validation du profil (ERR-GRP-002), cycle de vie BROUILLON→OUVERT→CLÔTURÉ→ARCHIVÉ, suppression uniquement si BROUILLON sans inscription (ERR-GRP-020), lieux d'enseignement (`TeachingLocation`) CRUD minimal. Recherche publique par les Parents (`/groups/search`, `/parent/groups`) avec champs publics uniquement. Écran `/teacher/groups`.
- **Correctif frontend** : `apiRequest` (client.ts) rafraîchit désormais automatiquement le token d'accès (15 min de durée de vie) et rejoue la requête une fois en cas de 401, au lieu de ne le faire qu'au chargement initial de la page (`/auth/me`). Sans ça, toute action après 15 min d'inactivité sur un onglet ouvert échouait silencieusement en 401 (repéré via un vrai bug rapporté par l'utilisateur en essayant de créer un groupe). Si le refresh échoue aussi (session vraiment expirée), un événement `groupi:session-expired` fait passer `AuthContext` en `unauthenticated` et `ProtectedRoute` redirige vers `/login`.
- **Design system frontend** : refonte complète de `index.css` avec une palette extraite du logo (bleu marine `#0e3a5c` + gris ardoise `#6b7880`, variantes clair/sombre), nav persistante (`AppLayout.tsx`, logo + email + déconnexion sur toutes les pages authentifiées), tableau de bord en grille de cartes cliquables avec icônes SVG maison (`components/icons.tsx`), badges de statut colorés (succès/attente/danger/neutre) sur tous les tableaux, boutons/formulaires/tableaux uniformisés (`.card-section`, `.table-wrap`, `.badge`, boutons primaire/danger/ghost cohérents). Toutes les pages internes utilisent désormais le même vocabulaire visuel au lieu de styles ad hoc par page.
- **CI, tests** : 26 tests unitaires + 12 e2e sur le module auth, GitHub Actions (lint/build/test/e2e sur Postgres réel).

### En cours (cette session)
Les trois chantiers prévus (Ch.6, Ch.7, Ch.10) sont terminés et commités (voir ci-dessus).

## Prochaines étapes

- **Ch.12 — Inscriptions** : demande d'inscription d'un Parent à un Groupe, validation par le Professeur (dépend de Ch.6/Ch.7/Ch.10, prochain chantier naturel).
- **Ch.11 — Préinscriptions** : manifestations d'intérêt pour l'année académique suivante.
- **Ch.13 — Séances** : génération automatique des séances à partir du planning hebdomadaire du groupe.
- **Ch.14 — Présences**.
- Domaine **Comptable/Commercial** (Ch.15-23) : abonnements Professeur, suivi des paiements — non commencé.
- Domaine **Communication** : notifications réelles (email/push) — actuellement `EmailService` est un stub qui ne fait que logguer.

## Hors scope, explicitement différé (pas oublié, juste pas fait)

- RM-TPR-003/004 : ré-validation admin obligatoire après modification des matières/niveaux d'un Professeur déjà validé (les ajouts prennent effet immédiatement aujourd'hui).
- 2FA (Ch.9 §9.9), scoring de risque/détection d'anomalies (Ch.9 §9.7-9.8) — Version 2 ou nécessitent des données de comportement qu'on n'a pas encore.
- Demande d'ajout d'établissement scolaire par un Parent (Ch.6.7) — le référentiel School existant (15 établissements seedés) suffit pour l'instant.
- Auto-service : demande de désactivation de compte par son propre titulaire (Ch.6.12/8.8), anonymisation (Ch.8.8), archivage (Ch.8.9, Version 2).
- Vérification cohérence âge/niveau scolaire (RM-SCH-019) — aucune table de correspondance âge↔niveau n'est définie dans le référentiel disponible, donc non implémentée plutôt qu'inventée.
- Aucun endpoint pour créer une nouvelle `AcademicYear` (une seule est seedée : 2026-2027). Il en faudra un (admin) avant que le passage réel à l'année académique suivante soit testable en conditions normales — pour l'instant vérifié en insérant une ligne de test directement en base puis en la supprimant.
- Ch.10 : génération automatique des séances (Ch.13), contrôle de capacité d'abonnement (ERR-GRP-013, dépend du domaine Commercial non construit), duplication de groupe, liste d'attente (Version 2), tarif de référence calculé automatiquement (Ch.10.7), détection de conflit de planning (ERR-GRP-014), passage automatique en COMPLET (dépend des inscriptions, non construites). Simplification volontaire : matière/niveau/année académique sont verrouillés dès la création du groupe (pas seulement après la 1ère inscription comme le prévoit littéralement le §10.11) — écarte l'ambiguïté tant que les inscriptions n'existent pas.

## Repères pratiques

- `dev.bat` à la racine lance Postgres (Docker) + API (port 3000) + Web (Vite, port 5173/5174).
- `npm run bootstrap:admin --workspace apps/api` crée le Super Admin de dev (idempotent, voir `.env` pour les identifiants).
- Migrations Prisma : `npx prisma migrate dev --name <nom>` depuis `apps/api`.
- **Convention locale : tous les mots de passe des comptes de test/dev sont `admin-local`** (`admin@groupi.local`, `prof1@test.com`, `parent1@test.com`). Nouveaux comptes de test à créer avec ce mot de passe pour rester cohérent.
