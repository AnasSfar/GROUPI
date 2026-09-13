# AVENANT 01 AU RÉFÉRENTIEL FONCTIONNEL GROUPI

**Titre** : Onboarding par invitation du Professeur, groupes de niveau, portail Parent cloisonné, comptes sans e-mail, ajustements CA prévisionnel
**Version** : 1.1 (avenant au référentiel V1.0)
**Date** : 2026-09-11
**Statut** : Validé — à implémenter

---

## 0. Objet et portée

Cet avenant redéfinit **le parcours d'entrée d'un élève dans GROUPI**, **le périmètre de visibilité du Parent**, **l'identité des comptes** (téléphone uniquement, e-mail entièrement retiré) et **les canaux de notification** (in-app uniquement en V1.1 ; SMS/WhatsApp en évolution). Il **remplace ou amende** des règles des chapitres 3, 5, 6, 8, 9, 10, 11, 12, 16, 18, 23 et 25 du référentiel V1.0. Là où une règle de cet avenant contredit le référentiel V1.0, **c'est cet avenant qui fait foi** ; le reste du référentiel V1.0 reste inchangé et applicable.

### 0.1 Les décisions structurantes

| # | Décision | Impact principal |
|---|---|---|
| 1 | **Portail Parent cloisonné** : le Parent ne voit *que* ce qui concerne ses propres enfants — jamais un autre groupe, un autre Professeur, un autre élève, un tarif de référence marché. | Ch. 6, 12, 16 ; suppression de la recherche publique de groupes côté Parent. |
| 2 | **Onboarding piloté par le Professeur** : le Professeur possède **un lien d'invitation général** (un seul, non lié à un groupe ni à un niveau) qu'il envoie aux Parents. Le Parent crée son compte via ce lien, ajoute l'enfant, et l'enfant est **automatiquement rattaché au groupe de niveau** du Professeur **correspondant au niveau déclaré par le Parent**. GROUPI crée automatiquement, pour chaque Professeur, un **groupe de niveau (salle d'attente)** par niveau qu'il enseigne. Le Professeur crée ensuite ses **groupes standard** (ex. `7G1`) et y **affecte** les élèves de la salle d'attente (ex. `7ème`). | Nouveaux chapitres A, B, C ; amende Ch. 10 et 12. |
| 3 | **Navigation du portail Parent** : d'abord le choix de l'**enfant** (masqué si un seul), puis le choix de la **matière** (masqué si une seule), puis le suivi. | Ch. 16.4. |
| 4 | **CA prévisionnel** : suppression de la ventilation intermédiaire (« trimestre / semestre »). Il ne reste que **« Mois en cours »** et **« Année académique en cours »**. | Ch. 16.3, 25.11. |
| 5 | **« Année en cours » = année académique**, jamais l'année civile (2025 / 2026). | Ch. 25.11, moteur de calcul du CA. |
| 6 | **Identité téléphone, e-mail supprimé** : le **numéro de téléphone** est le seul identifiant. L'e-mail est **entièrement retiré du produit** (aucune saisie, aucun affichage, aucun usage). | Ch. 9. |
| 7 | **Aucun envoi automatique en V1.1** (option A) : pas de code de vérification, pas de notification externe — il n'existe aucun canal gratuit. Le numéro n'est que validé en format ; le lien du Professeur sert d'ancre de confiance. Notifications = **in-app uniquement**. Le prof peut **partager le lien / une annonce sur WhatsApp manuellement** (bouton `wa.me`). Réinitialisation du mot de passe = **assistée** (prof/support génère un lien à usage unique). Vérification + notifications par **SMS ou WhatsApp** = évolution documentée (I.6), sans réécriture (façade `MessagingService`). | Ch. 9, 18. |
| 8 | **Le Parent n'a plus besoin de validation administrative** : le compte Parent créé via un lien d'invitation est **actif immédiatement** (le lien du Professeur fait foi). | Ch. 8.4. |
| 9 | **Le Professeur non validé n'a accès à rien** : tant que son compte n'est pas validé par un Administrateur, il ne voit qu'un **écran « En attente de validation »** avec un moyen de contacter le support (téléphone / WhatsApp). | Ch. 5, 8.3. |

### 0.2 Décisions de cadrage retenues

- **Préinscriptions conservées** (Ch. 11) comme outil de préparation de la rentrée, **mais** restreintes aux Professeurs auxquels l'élève est **déjà rattaché** (voir §D.4).
- **Recherche publique de groupes + demande d'inscription à l'initiative du Parent : supprimées.** Le Parent n'initie plus jamais une inscription.
- **Groupes de niveau créés automatiquement à la validation administrative des niveaux enseignés** du Professeur (`TeacherSchoolLevel.isValidated = true`), un par niveau et par année académique `OPEN`.
- **Lien d'invitation : un seul lien général par Professeur** (non lié à un groupe ni à un niveau), **réutilisable** pour toutes les familles, **rotable et révocable** par le Professeur. Un même enfant ne peut être rattaché qu'une fois par ce biais (consommation idempotente par enfant).
- **Le niveau de rattachement est celui déclaré par le Parent** dans la situation scolaire de l'enfant lors de l'ajout — pas un paramètre du lien.
- **Inscription Parent en libre-service : retirée du parcours.** Le lien d'invitation est le seul point d'entrée d'une famille.
- **Aucun message automatique en V1.1** (option A) : ni code de vérification, ni notification externe (SMS/WhatsApp) — pas de canal gratuit. Notifications = in-app seul ; réinitialisation du mot de passe assistée ; façade `MessagingService` prête pour brancher SMS/WhatsApp plus tard (options B/C, Ch. I.6).

### 0.3 Terminologie ajoutée (à respecter, cf. Ch. 2.19)

| Terme officiel | Définition | Ne jamais dire |
|---|---|---|
| **Groupe de niveau** (ou *salle d'attente*) | Groupe technique, sans planning ni facturation, qui rassemble tous les élèves rattachés à un Professeur pour un niveau scolaire donné et une année académique, en attente d'affectation dans un groupe standard. | « classe d'attente », « file », « pool » (dans l'UI FR) |
| **Groupe standard** | Groupe pédagogique au sens du Ch. 10 (planning, séances, tarif, capacité, comptabilité). C'est le « Groupe » du référentiel V1.0. | « vrai groupe », « groupe payant » |
| **Rattachement** | Lien d'un élève à un **groupe de niveau**. N'est ni administratif, ni pédagogique, ni comptable. | « inscription » (réservé au groupe standard) |
| **Affectation** | Action du Professeur qui fait passer un élève d'un groupe de niveau vers un groupe standard (crée une **Inscription** active). | « transfert », « migration » |
| **Lien d'invitation Parent** | Lien général et réutilisable, propre à un Professeur, permettant à une famille d'entrer dans GROUPI. | « parrainage », « code promo » |

---

## CHAPITRE A — ONBOARDING PAR INVITATION DU PROFESSEUR

### A.1 Objet

Décrit comment un Professeur fait entrer une nouvelle famille dans GROUPI au moyen de son lien d'invitation général, et comment l'élève est rattaché automatiquement au groupe de niveau correspondant au niveau déclaré.

### A.2 Principes

1. **Le Professeur est le seul point d'entrée d'une nouvelle famille.** Un Parent ne découvre plus GROUPI en cherchant un groupe : il y est invité par un Professeur qu'il connaît déjà hors plateforme.
2. **Un seul lien général par Professeur**, non lié à un groupe ni à un niveau. Le Professeur le partage largement (WhatsApp, SMS, affichette…). Il peut le **révoquer / régénérer** (rotation) ; l'ancien lien devient alors invalide.
3. Le lien **ne réserve jamais** de place, **ne crée jamais** d'inscription dans un groupe standard ni d'écriture comptable. Il ne fait que faire entrer la famille et **rattacher l'enfant au groupe de niveau** correspondant au niveau que le Parent déclare.
4. Le lien **n'attribue aucun rôle privilégié** au-delà du rôle `PARENT`.
5. **Le compte Parent créé via un lien d'invitation est immédiatement `ACTIVE`** — aucune validation administrative (décision #8). Le lien émis par un Professeur déjà validé tient lieu de garantie d'entrée.
6. Un enfant déjà rattaché à un Professeur via ce lien ne peut pas l'être une seconde fois (idempotence par enfant).

### A.3 Le lien d'invitation

#### A.3.1 Le lien du Professeur

- Généré automatiquement à la **validation du profil Professeur** (ou au premier accès à l'espace « Inviter des parents »).
- **Action principale : « Générer / afficher mon lien » puis « Copier le lien »** — un clic copie l'URL complète dans le presse-papier du Professeur (feedback « lien copié »). C'est le geste d'invitation de référence ; il ne dépend d'aucun canal externe.
- **Action secondaire (facultative) : « Partager sur WhatsApp »** — ouvre WhatsApp (`https://wa.me/?text=<message + lien>`) avec un message pré-rempli ; le Professeur choisit lui-même le contact. Ce partage **ne remplace pas** l'action « Copier le lien » et n'envoie rien automatiquement.
- Le Professeur peut aussi : **régénérer** le lien (l'ancien jeton est invalidé), **le désactiver / réactiver** (plus aucune consommation possible tant qu'il est désactivé).
- Le lien contient un jeton opaque non devinable ; sa forme en base est **hachée**.
- Le lien est rattaché à l'**année académique `OPEN` courante** ; à l'ouverture d'une nouvelle année, GROUPI reconduit automatiquement un lien pour la nouvelle année (le Professeur garde une URL stable si possible, sinon il partage la nouvelle).

#### A.3.2 Consultation du lien (visiteur non authentifié)

Page de bienvenue affichant **uniquement** :
- le **nom et prénom du Professeur** ;
- un texte : « `<Professeur>` vous invite à suivre la scolarité de votre enfant sur GROUPI » ;
- l'**année académique** ;
- appels à action « Créer mon compte » / « J'ai déjà un compte ».

Aucune autre donnée du Professeur (groupes, élèves, tarifs, niveaux, coordonnées) n'est exposée.

#### A.3.3 Consommation du lien (Parent)

**Cas 1 — nouveau Parent.** Création d'un compte (Ch. I) : **numéro de téléphone (obligatoire, identifiant)**, identité (nom, prénom), ville, mot de passe, acceptation des CGU — **aucun e-mail**. En V1.1, pas de code de vérification (le lien du Professeur fait foi, RM-SEC-051) : le compte est créé directement **`ACTIVE`**, sans validation admin. Le Parent est connecté et poursuit vers l'ajout de l'enfant.

**Cas 2 — Parent existant.** Connexion, puis ajout / rattachement de l'enfant.

**Cas 3 — ajout de l'enfant et rattachement.** Le Parent renseigne : nom, prénom, (date de naissance facultative), **établissement scolaire** (référentiel officiel), **niveau scolaire**, classe (indicatif). À la validation :
1. Création du `Student` + sa **situation scolaire** de l'année académique courante (Ch. 7) — `ACTIVE` si évolution de routine, `PENDING_VALIDATION` sinon (règles Ch. 7 inchangées).
2. **Le niveau de rattachement est le niveau déclaré dans cette situation scolaire.** Si ce niveau correspond à un **niveau enseigné validé** du Professeur → l'élève est **rattaché automatiquement** au **groupe de niveau** de ce Professeur (`LevelPoolMembership`, source `INVITATION`). Le Professeur reçoit `NOT-INV-002`.
3. **Sinon** → l'enfant est créé, **non rattaché** ; le Professeur reçoit `NOT-INV-003` et peut ajouter ce niveau à ses niveaux enseignés (déclenche la création du groupe de niveau puis un re-rattachement proposé).
4. Consommation tracée : `LevelPoolMembership.invitation_id`, `AuditLog`. Le lien reste **actif** pour les autres familles.

Un même Parent invité par **plusieurs** Professeurs suit un lien par Professeur : le premier crée le compte + l'enfant, les suivants (Parent connecté) ajoutent un nouvel enfant **ou** rattachent un enfant existant au nouveau Professeur (le niveau de la situation scolaire active de l'enfant doit correspondre).

### A.4 Objets métier et modèle de données

| Objet | Rôle |
|---|---|
| `ParentInvitation` | **Nouveau.** Lien général réutilisable d'un Professeur. |
| `TeacherProfile` | Émetteur du lien. |
| `AcademicYear` | Année du lien. |
| `ParentProfile` / `User` | Compte créé (`ACTIVE`) ou connecté. |
| `Student` + `StudentSchoolSituation` | Enfant + niveau déclaré (détermine le groupe de niveau). |
| `LevelPoolMembership` | Rattachement produit (voir Ch. B). |

```
model ParentInvitation {
  id                uuid  PK
  teacher_id        uuid  FK -> teacher_profile
  academic_year_id  uuid  FK -> academic_year
  token_hash        text  UNIQUE                  // hash du jeton ; jamais en clair en base
  status            enum  ParentInvitationStatus  // ACTIVE | DISABLED | EXPIRED
  expires_at        timestamptz?                  // = fin de l'année académique
  created_at        timestamptz
  rotated_at        timestamptz?                  // dernière régénération
  @@unique([teacher_id, academic_year_id])        // un seul lien actif par Professeur et par année
}

enum ParentInvitationStatus { ACTIVE  DISABLED  EXPIRED }
```

- `EXPIRED` appliqué **paresseusement à la lecture** (comme `Enrollment.EXPIRED`) : pas de cron dédié.
- La traçabilité « qui a consommé quoi » vit dans `LevelPoolMembership` (`invitation_id`, `source = INVITATION`) et `AuditLog`, pas dans `ParentInvitation`.

### A.5 Règles métier — `RM-INV-*`

| Code | Règle |
|---|---|
| RM-INV-001 | Chaque Professeur dont le profil est `VALIDATED` dispose d'exactement un lien d'invitation `ACTIVE` par année académique `OPEN`. |
| RM-INV-002 | Le lien d'invitation n'est lié ni à un groupe, ni à un niveau, ni à une matière. |
| RM-INV-003 | Le jeton est stocké haché ; sa valeur en clair n'est visible que par le Professeur, dans son espace. |
| RM-INV-004 | Le Professeur peut régénérer son lien (rotation) : l'ancien jeton devient immédiatement invalide. |
| RM-INV-005 | Le Professeur peut désactiver / réactiver son lien ; désactivé, aucune consommation n'aboutit. |
| RM-INV-006 | Le lien expire automatiquement à la fin de son année académique ; un lien est reconduit pour la nouvelle année. |
| RM-INV-007 | La consommation d'un lien crée un compte Parent directement **`ACTIVE`**, sans validation administrative (le lien du Professeur fait foi ; en V1.1 pas de vérification du numéro, cf. I.2). |
| RM-INV-008 | La page de consultation d'un lien n'expose que : nom/prénom du Professeur et année académique. |
| RM-INV-009 | La consommation ne crée jamais d'inscription dans un groupe standard, ni de séance, ni d'écriture comptable, ni de compte de suivi comptable. |
| RM-INV-010 | La consommation ne consomme jamais de capacité d'abonnement ni de capacité d'un groupe standard. |
| RM-INV-011 | Le niveau de rattachement est celui de la situation scolaire déclarée par le Parent pour l'enfant, pour l'année académique courante. |
| RM-INV-012 | Si ce niveau correspond à un niveau enseigné validé du Professeur, l'élève est rattaché automatiquement au groupe de niveau correspondant. |
| RM-INV-013 | Sinon, l'enfant est créé sans rattachement et le Professeur est notifié ; aucune erreur bloquante pour le Parent. |
| RM-INV-014 | Un enfant déjà rattaché à un Professeur ne peut pas l'être une seconde fois via le lien (idempotence). |
| RM-INV-015 | Un lien ne peut être consommé que par un compte ayant (ou obtenant à cet instant) le rôle `PARENT`. |
| RM-INV-016 | Un Professeur suspendu ou sans abonnement actif ne peut pas générer/rotater son lien ; les consommations en cours restent possibles tant que le lien est `ACTIVE` (à confirmer — voir Ch. H). |
| RM-INV-017 | Toute génération, rotation, désactivation et consommation est historisée (`AuditLog`). |

### A.6 Cas d'erreur — `ERR-INV-*`

| Code | Situation | Résultat attendu |
|---|---|---|
| ERR-INV-001 | Jeton inexistant ou malformé | Page « lien invalide ». |
| ERR-INV-002 | Lien désactivé par le Professeur | Page « invitation indisponible, contactez votre professeur ». |
| ERR-INV-003 | Lien expiré (année clôturée) | Page « invitation expirée ». |
| ERR-INV-004 | Lien rotationné (ancien jeton) | Page « lien invalide ». |
| ERR-INV-005 | Année académique du lien clôturée à la consommation | Consommation refusée, Professeur notifié. |
| ERR-INV-006 | Consommation par un compte non-Parent qui ne peut pas obtenir le rôle Parent (ex. Administrateur) | Refusée. |
| ERR-INV-007 | Enfant déjà rattaché à ce Professeur | Rattachement ignoré (idempotent), pas d'erreur. |
| ERR-INV-008 | Rattachement d'un enfant existant dont la situation scolaire active n'est pas au niveau attendu | Bloqué jusqu'à mise à jour de la situation scolaire (Ch. 7). |

### A.7 Événements — `EVT-INV-*`

| Code | Événement |
|---|---|
| EVT-INV-001 | Lien d'invitation généré. |
| EVT-INV-002 | Lien d'invitation rotationné. |
| EVT-INV-003 | Lien d'invitation désactivé / réactivé. |
| EVT-INV-004 | Lien d'invitation expiré. |
| EVT-INV-005 | Lien consommé — compte + enfant + rattachement. |
| EVT-INV-006 | Lien consommé — compte + enfant créés, rattachement impossible (niveau hors périmètre du Professeur). |

### A.8 Notifications — `NOT-INV-*`

| Code | Notification | Destinataire | Priorité | Canal |
|---|---|---|---|---|
| NOT-INV-001 | Votre lien d'invitation est prêt / a été régénéré | Professeur | Information | in-app |
| NOT-INV-002 | Un élève a rejoint votre salle d'attente `<niveau>` via votre lien | Professeur | Important | in-app *(WhatsApp en option B/C)* |
| NOT-INV-003 | Un Parent invité a déclaré un enfant en `<niveau>`, hors de vos niveaux enseignés | Professeur | Important | in-app *(WhatsApp en option B/C)* |
| NOT-INV-004 | Bienvenue sur GROUPI — `<enfant>` est bien rattaché·e au suivi de `<Professeur>` | Parent | Important | in-app *(WhatsApp en option B/C)* |

---

## CHAPITRE B — GROUPES DE NIVEAU (SALLES D'ATTENTE)

### B.1 Objet

Décrit le groupe de niveau : un conteneur technique, automatiquement créé, qui rassemble les élèves rattachés à un Professeur pour un niveau donné, en amont de toute affectation dans un groupe standard.

### B.2 Principes

1. Un groupe de niveau est **créé et archivé automatiquement par GROUPI**, jamais à la main.
2. Il **n'a ni planning, ni séance, ni tarif, ni facturation, ni capacité limitée**.
3. Il **n'est jamais visible** par un autre Professeur ni par un Parent en tant que « groupe » : côté Parent, l'enfant apparaît comme « en attente d'affectation chez `<Professeur>` ».
4. Il sert de **vivier** : le Professeur pioche dedans pour constituer ses groupes standard.
5. Un élève **reste** dans le groupe de niveau après affectation à un ou plusieurs groupes standard du même Professeur. Il en sort sur retrait explicite, archivage de l'élève, ou clôture de l'année.

### B.3 Création et cycle de vie automatiques

| Déclencheur | Effet |
|---|---|
| Un `TeacherSchoolLevel` passe `isValidated = true` (validation admin, RM-TPR-004) | GROUPI crée, s'il n'existe pas, un groupe de niveau `(teacher, schoolLevel, academicYear OPEN)` pour chaque année `OPEN`. |
| Ouverture d'une nouvelle année académique | Création des groupes de niveau manquants pour chaque `(Professeur, niveau validé)`. Application paresseuse admise. |
| Un `TeacherSchoolLevel` est retiré / invalidé | Groupe de niveau conservé tant qu'il a des rattachements ou un historique ; `ARCHIVED` sinon. Jamais de suppression physique avec historique. |
| Clôture de l'année académique | Groupe de niveau + rattachements en lecture seule (Ch. 24.3). |

**Unicité** : au plus un groupe de niveau par `(teacher_id, school_level_id, academic_year_id)`.

### B.4 Différences groupe de niveau ↔ groupe standard

| Caractéristique | Groupe de niveau | Groupe standard (Ch. 10) |
|---|---|---|
| Création | Automatique | Par le Professeur |
| Matière | Aucune | Obligatoire |
| Planning / séances | Non | Oui |
| Tarif | Non | Oui |
| Capacité maximale | Illimitée | Définie par le Professeur |
| Compte de suivi comptable | Non | Oui (un par inscription) |
| Compte dans la capacité d'abonnement | **Non** | Oui |
| Lien élève ↔ groupe | `LevelPoolMembership` (**Rattachement**) | `Enrollment` (**Inscription**) |
| Statut du groupe | `ACTIVE` / `ARCHIVED` | `DRAFT → ACTIVE → FULL → CLOSED → ARCHIVED` |
| Changement de groupe (Ch. 20) | Non applicable | Applicable |

### B.5 Modèle de données

```
enum GroupKind { LEVEL_POOL  STANDARD }

model Group {
  ...                                   // champs V1.0 inchangés
  kind          GroupKind  @default(STANDARD)
  subject_id    uuid?                    // NULLABLE ; non nul si kind = STANDARD (contrainte applicative)
  // kind = LEVEL_POOL : public_price = 0, capacity = 0 (=> illimité), pas de GroupSchedule/Session,
  //                     status ∈ { ACTIVE, ARCHIVED }
  @@unique([teacherId, schoolLevelId, academicYearId, kind])   // effectif pour LEVEL_POOL
}

model LevelPoolMembership {
  id             uuid  PK
  student_id     uuid  FK -> student
  group_id       uuid  FK -> group          // group.kind = LEVEL_POOL
  status         enum  LevelPoolMembershipStatus   // ACTIVE | REMOVED
  source         enum  MembershipSource            // INVITATION | TEACHER_MANUAL | SITUATION_SYNC
  invitation_id  uuid? FK -> parent_invitation
  created_at     timestamptz
  removed_at     timestamptz?
  removed_by_id  uuid? FK -> user
  @@unique([student_id, group_id])
}
```

> **Alternative écartée** : réutiliser `Enrollment` pour les rattachements. Rejetée car une Inscription est « le lien administratif, pédagogique **et comptable** » (Ch. 12.1) ; un rattachement n'est aucun des trois, et cela polluerait les indicateurs d'inscription (Ch. 12.14).

### B.6 Règles métier — `RM-POOL-*`

| Code | Règle |
|---|---|
| RM-POOL-001 | Un groupe de niveau est créé exclusivement par GROUPI, un par `(Professeur, niveau enseigné validé, année académique OPEN)`. |
| RM-POOL-002 | Un groupe de niveau n'a jamais de matière, de planning, de séance, de tarif ni de compte de suivi comptable. |
| RM-POOL-003 | Un groupe de niveau a une capacité illimitée et ne consomme jamais la capacité d'abonnement du Professeur. |
| RM-POOL-004 | Un élève est rattaché via un `LevelPoolMembership` ; ce rattachement n'est ni une inscription ni une préinscription. |
| RM-POOL-005 | Le rattachement exige une situation scolaire de l'élève au niveau du groupe, pour l'année académique du groupe. |
| RM-POOL-006 | Un élève reste rattaché après affectation dans un ou plusieurs groupes standard du même Professeur. |
| RM-POOL-007 | Le Professeur peut retirer un élève de son groupe de niveau ; le rattachement passe `REMOVED`, jamais supprimé physiquement s'il a servi de source à une affectation. |
| RM-POOL-008 | Le retrait du groupe de niveau n'affecte jamais les inscriptions actives de l'élève dans des groupes standard. |
| RM-POOL-009 | Un groupe de niveau n'apparaît jamais dans une liste de groupes standard ; il a son propre espace « Salle d'attente `<niveau>` ». |
| RM-POOL-010 | Côté Parent, un rattachement se présente comme « `<enfant>` — en attente d'affectation chez `<Professeur>` (`<niveau>`) », sans jamais nommer un groupe standard non rejoint ni un autre élève. |
| RM-POOL-011 | La clôture de l'année académique verrouille le groupe de niveau et ses rattachements. |
| RM-POOL-012 | Un groupe de niveau vide et sans historique dont le niveau n'est plus enseigné est archivé automatiquement. |
| RM-POOL-013 | Deux Professeurs enseignant le même niveau ont deux groupes de niveau distincts et cloisonnés. |
| RM-POOL-014 | Si la situation scolaire de l'élève change de niveau en cours d'année (validation Ch. 7), GROUPI propose au Professeur un re-rattachement (`source = SITUATION_SYNC`) ; jamais automatique sans revue. |

### B.7 Cas d'erreur — `ERR-POOL-*`

| Code | Situation | Résultat attendu |
|---|---|---|
| ERR-POOL-001 | Rattachement sans situation scolaire active pour l'année | Refusé. |
| ERR-POOL-002 | Rattachement à un niveau ≠ situation scolaire active | Refusé. |
| ERR-POOL-003 | Rattachement d'un élève archivé | Refusé. |
| ERR-POOL-004 | Retrait d'un élève ayant une inscription active dans un groupe standard du Professeur | Autorisé avec avertissement (l'inscription reste active). |
| ERR-POOL-005 | Écriture sur un groupe de niveau d'une année clôturée | Refusée. |
| ERR-POOL-006 | Création manuelle d'un groupe `kind = LEVEL_POOL` | Refusée. |

### B.8 Événements — `EVT-POOL-*` / Notifications — `NOT-POOL-*`

| Code | Événement |
|---|---|
| EVT-POOL-001 | Groupe de niveau créé automatiquement. |
| EVT-POOL-002 | Élève rattaché. |
| EVT-POOL-003 | Élève retiré. |
| EVT-POOL-004 | Groupe de niveau archivé automatiquement. |
| EVT-POOL-005 | Re-rattachement proposé (changement de situation scolaire). |

| Code | Notification | Destinataire | Priorité |
|---|---|---|---|
| NOT-POOL-001 | Nouvel élève dans votre salle d'attente `<niveau>` | Professeur | Important |
| NOT-POOL-002 | La situation scolaire de `<élève>` a changé — re-rattachement à revoir | Professeur | Important |

---

## CHAPITRE C — AFFECTATION D'UN ÉLÈVE À UN GROUPE STANDARD

### C.1 Objet

Décrit comment le Professeur constitue un groupe standard (`7G1`) en y **affectant** des élèves de sa salle d'attente (`7ème`), et remplace le tunnel « demande d'inscription à l'initiative du Parent » du Ch. 12.

### C.2 Principes

1. **Le Professeur crée l'inscription.** Plus de demande initiée par le Parent, plus de délai de réponse à 7 jours, plus d'états `PENDING_VALIDATION` / `EXPIRED` pour ce chemin.
2. L'affectation crée directement une **Inscription `ACTIVE`** dans le groupe standard ; le compte de suivi comptable est créé à l'activation (Ch. 12.10 inchangé).
3. L'affectation **consomme** une place du groupe **et** une unité de capacité d'abonnement (contrôles Ch. 10 RM-GRP-018/019, Ch. 12.6 inchangés).
4. Le **Parent est informé** (`NOT-AFF-001`) et peut contester via le fil de commentaires (Ch. 19.3). L'accord préalable du Parent n'est pas requis en V1.1.
5. **Tarification** : tarif public du groupe par défaut, personnalisation possible ensuite (Ch. 10.8/10.9).
6. **Mode de paiement** habituel renseignable par le Professeur à l'affectation (indicatif, Ch. 12.9).

### C.3 Parcours Professeur

Depuis « Salle d'attente `<niveau>` » ou depuis la page d'un groupe standard :
1. Sélection d'un ou plusieurs élèves du groupe de niveau.
2. Choix du **groupe standard cible** (même niveau ; matière = celle du groupe).
3. Vérifications par élève : capacité groupe, capacité abonnement, pas de doublon actif, situation scolaire cohérente, groupe `ACTIVE`, année `OPEN`.
4. Par élève éligible : `Enrollment` `ACTIVE` (`origin = TEACHER_ASSIGNMENT`), compte de suivi comptable, génération des séances futures (Ch. 13 inchangé).
5. Élèves non éligibles listés avec motif. Pas d'affectation partielle silencieuse.

### C.4 Impacts sur le référentiel V1.0

| Référence V1.0 | Statut |
|---|---|
| Ch. 12.3 « Recherche d'un groupe » (Parent à l'origine) | **Supprimé.** |
| Ch. 12.5 « Demande d'inscription » (Parent) | **Remplacé** par l'affectation Professeur. |
| Ch. 12.6 « Vérifications automatiques » | **Conservé**, appliqué à l'affectation. |
| Ch. 12.7 « Décision du Professeur » (accepter/refuser, délai 7 j) | **Supprimé** pour ce chemin. Le « comportement de paiement » (Ch. 25.9) reste consultable, sans étape de décision formelle. |
| Ch. 12.11 états `PENDING_VALIDATION`, `EXPIRED` | **Non atteints** par l'affectation. Conservés pour les inscriptions issues d'une préinscription (Ch. 11.9). |
| Ch. 12.12 « Changement de groupe » | **Conservé** entre groupes standard du même Professeur. |
| Ch. 11 « Préinscriptions » | **Conservé**, restreint (voir §D.4). Transformation → demande `PENDING_VALIDATION` (inchangé). |

> **Deux origines d'inscription** désormais : (a) **affectation** Professeur depuis le groupe de niveau (`ACTIVE` immédiat, cas nominal) ; (b) **préinscription confirmée** → demande `PENDING_VALIDATION` → décision Professeur (préparation de rentrée). La demande spontanée du Parent n'existe plus.

### C.5 Modèle de données

```
enum EnrollmentOrigin { TEACHER_ASSIGNMENT  PRE_ENROLLMENT  GROUP_CHANGE }

model Enrollment {
  ...
  origin                EnrollmentOrigin  @default(TEACHER_ASSIGNMENT)
  source_membership_id  uuid?  FK -> level_pool_membership
}
```

### C.6 Règles métier — `RM-AFF-*`

| Code | Règle |
|---|---|
| RM-AFF-001 | Seul le Professeur propriétaire d'un groupe standard peut y affecter un élève. |
| RM-AFF-002 | Un élève ne peut être affecté que s'il est rattaché au groupe de niveau du même Professeur (même niveau, même année). |
| RM-AFF-003 | L'affectation crée une inscription directement `ACTIVE`, jamais `PENDING_VALIDATION`. |
| RM-AFF-004 | Mêmes contrôles de capacité que l'acceptation d'une inscription V1.0 : capacité groupe **et** capacité abonnement (ERR-INS-008). |
| RM-AFF-005 | L'affectation crée le compte de suivi comptable et déclenche la génération des séances de l'élève. |
| RM-AFF-006 | Un élève ne peut avoir qu'une inscription `ACTIVE` par groupe standard et par année (RM-INS existant). |
| RM-AFF-007 | Le Parent est notifié de toute affectation et de tout retrait ; son accord préalable n'est pas requis en V1.1. |
| RM-AFF-008 | Affectation multi-élèves = tout-ou-rien par élève. |
| RM-AFF-009 | Retirer un élève d'un groupe standard = archiver son inscription (Ch. 12.11) ; immuabilité comptable/pédagogique V1.0 inchangée. |
| RM-AFF-010 | Toute affectation / tout retrait est historisé et tracé vers le rattachement source. |

### C.7 Cas d'erreur — `ERR-AFF-*`

| Code | Situation | Résultat attendu |
|---|---|---|
| ERR-AFF-001 | Élève non rattaché au groupe de niveau du Professeur | Refusée. |
| ERR-AFF-002 | Groupe standard complet | Refusée pour cet élève. |
| ERR-AFF-003 | Capacité d'abonnement atteinte | Refusée (`ERR-INS-008`). |
| ERR-AFF-004 | Élève déjà inscrit actif dans ce groupe | Ignorée pour cet élève. |
| ERR-AFF-005 | Groupe cible `DRAFT` / `CLOSED` / `ARCHIVED` | Refusée. |
| ERR-AFF-006 | Niveau du groupe cible ≠ situation scolaire active de l'élève | Refusée. |
| ERR-AFF-007 | Année académique clôturée | Refusée. |
| ERR-AFF-008 | Professeur sans abonnement actif (hors délai de grâce) | Refusée (`ERR-PERM-006`). |

### C.8 Événements / Notifications

| Code | Événement |
|---|---|
| EVT-AFF-001 | Élève affecté à un groupe standard. |
| EVT-AFF-002 | Affectation multiple traitée (n réussies / m refusées). |
| EVT-AFF-003 | Élève retiré d'un groupe standard. |

| Code | Notification | Destinataire | Priorité |
|---|---|---|---|
| NOT-AFF-001 | `<enfant>` a été inscrit·e au groupe `<groupe>` (`<matière>`) par `<Professeur>` | Parent | Important |
| NOT-AFF-002 | `<enfant>` a été retiré·e du groupe `<groupe>` | Parent | Important |
| NOT-AFF-003 | Récapitulatif : `<n>` élèves inscrits au groupe `<groupe>` | Professeur | Information |

---

## CHAPITRE D — PORTAIL PARENT CLOISONNÉ

### D.1 Objet et principe de confidentialité

Le portail Parent n'expose **que** les données des enfants du Parent connecté et **uniquement** dans le contexte des Professeurs auxquels ces enfants sont rattachés ou inscrits. Toute donnée relative à un autre élève, un autre Parent, un autre groupe ou un Professeur tiers est **invisible**. Renforce Ch. 6.11, Ch. 24.11, Ch. 26.10.

### D.2 Ce qui disparaît du portail Parent

| Fonction V1.0 | V1.1 |
|---|---|
| Recherche de groupes (`ParentGroupSearchPage`, `GET /groups/search`, `GET /parent/groups`) | **Supprimée** (écran + endpoints). |
| Fiche Professeur / groupe public / disponibilités / tarif public avant inscription | **Supprimée.** |
| Tarif de référence marché (Ch. 10.7) côté Parent | Jamais exposé au Parent. |
| Demande d'inscription à l'initiative du Parent (`POST /enrollments`) | **Supprimée** (Ch. C). |
| `NOT-GRP-008` « nouveau groupe dans votre matière/niveau » | **Supprimée.** |
| Annuaire / liste de Professeurs | Inexistante, confirmée inexistante. |

### D.3 Navigation à trois niveaux (décision #3)

**Niveau 1 — Mes enfants.** Liste des enfants (cartes : prénom, niveau, résumé). **Un seul enfant → niveau masqué.**

**Niveau 2 — Les matières de l'enfant.** Liste des matières où l'enfant a une inscription active (chacune → un Professeur). Entrée spéciale **« En attente d'affectation »** si l'enfant a un rattachement sans inscription standard correspondante (affiche seulement « chez `<Professeur>`, `<niveau>` »). **Une seule matière et rien en attente → niveau masqué.**

**Niveau 3 — Suivi (enfant × matière × Professeur).** Prochaines séances, séances annulées/reportées, changements de mode ; présences et retards (lecture seule) ; commentaires pédagogiques ; solde + relevé du compte de suivi comptable de cette inscription ; annonces de groupe ; signalement d'absence ; « Demander un changement de groupe » (cible restreinte, D.4).

**Vue transverse par enfant** (Ch. 16.4, conservée) : situation financière globale = somme des soldes ; comptes distincts par groupe.

### D.4 Préinscriptions et changement de groupe dans le portail cloisonné

- **Préinscription (Ch. 11)** : le Parent ne peut préinscrire un enfant **que** chez un Professeur auquel l'enfant est **déjà rattaché** (groupe de niveau) ou **déjà/anciennement inscrit** (groupe standard, toute année). Le reste du Ch. 11 est inchangé.
- **Changement de groupe (Ch. 20)** : le groupe cible appartient obligatoirement **au même Professeur** que l'inscription d'origine. Un changement de Professeur se fait hors plateforme puis via son lien d'invitation.

### D.5 Règles métier — `RM-PAR-019` et suivantes (extension du Ch. 6.19)

| Code | Règle |
|---|---|
| RM-PAR-019 | Le portail Parent n'expose aucune donnée relative à un élève, un Parent, un groupe ou un Professeur non directement liés aux enfants du Parent connecté. |
| RM-PAR-020 | Le Parent n'a plus accès à aucune fonction de recherche ou de découverte de groupes ou de Professeurs. |
| RM-PAR-021 | Le Parent ne peut plus initier de demande d'inscription ; l'entrée d'un enfant dans un groupe standard résulte d'une affectation Professeur (Ch. C) ou d'une préinscription confirmée (Ch. 11). |
| RM-PAR-022 | La navigation masque tout niveau de choix à option unique (un seul enfant / une seule matière). |
| RM-PAR-023 | Un rattachement est présenté sans jamais nommer un groupe standard non rejoint ni un autre élève de la salle d'attente. |
| RM-PAR-024 | Le Parent ne peut préinscrire un enfant que chez un Professeur auquel cet enfant est déjà rattaché ou a déjà été inscrit. |
| RM-PAR-025 | Le groupe cible d'une demande de changement de groupe appartient au Professeur de l'inscription d'origine. |
| RM-PAR-026 | Listes, compteurs et indicateurs du portail Parent sont calculés en restreignant aux enfants du Parent connecté. |
| RM-PAR-027 | Un Parent sans enfant rattaché ni inscrit voit un portail « vide » invitant à utiliser un lien d'invitation reçu d'un Professeur. |
| RM-PAR-028 | Le compte Parent créé via un lien d'invitation est `ACTIVE` sans validation administrative (voir aussi Ch. 8). |

### D.6 Cas d'erreur — extension `ERR-PAR-*`

| Code | Situation | Résultat attendu |
|---|---|---|
| ERR-PAR-020 | Accès à un groupe / une séance / un compte comptable hors périmètre du Parent | 404 / accès refusé, sans divulgation d'existence. |
| ERR-PAR-021 | Préinscription visée sur un Professeur non éligible | Refusée. |
| ERR-PAR-022 | Demande de changement vers un groupe d'un autre Professeur | Refusée. |
| ERR-PAR-023 | Appel à un endpoint de recherche de groupes supprimé | 404 / 410 Gone. |

---

## CHAPITRE E — CA PRÉVISIONNEL DU TABLEAU DE BORD PROFESSEUR (décisions #4 et #5)

### E.1 Ventilation

**Avant (implémentation V1)** : « Mois en cours », « Trimestre en cours », « Toute l'année » (année civile).
**Après (V1.1)** : deux vues seulement —
1. **CA prévisionnel du mois en cours** ;
2. **CA prévisionnel de l'année académique en cours**.

La ventilation intermédiaire (« trimestre » / « semestre ») est **supprimée** de l'API (`periodRevenue.currentQuarter`) et de l'écran.

### E.2 « Année en cours » = année académique

Périmètre « année » = `[AcademicYear.startDate ; AcademicYear.endDate]` de l'année académique `OPEN` contenant la date du jour (à défaut : la plus récente `OPEN`). **Jamais** l'année civile.

### E.3 Règle de calcul révisée (amende Ch. 25.11)

> **CA prévisionnel** = somme, sur les **séances `PLANNED`** des groupes **standard** du Professeur dont la date est **≤ borne de fin de période**, du **tarif appliqué** (personnalisé sinon public) à chaque inscription **`ACTIVE`** concernée
> **+** le CA déjà **réalisé** sur la période (garantit *prévisionnel ≥ réalisé ≥ encaissé*).
>
> - Période « mois en cours » : borne = dernier jour du mois calendaire.
> - Période « année académique en cours » : borne = `AcademicYear.endDate` de l'année `OPEN`.
> - Groupes de niveau **exclus** (RM-POOL-002).
> - Recalcul à la demande, jamais stocké (RM-CPT-031 inchangé).

### E.4 Règles métier

| Code | Règle |
|---|---|
| RM-DSH-050 | Le CA prévisionnel du tableau de bord Professeur n'est ventilé que sur : mois calendaire en cours et année académique en cours. |
| RM-DSH-051 | Toute borne « année » d'un indicateur du tableau de bord Professeur est l'année académique `OPEN` courante, jamais l'année civile. |
| RM-CAL-050 | Le CA prévisionnel exclut systématiquement les groupes de niveau. |

### E.5 Impact technique

- `accounting.service.ts` : `currentRevenuePeriods()` → retirer `currentQuarter` ; `currentYear` → bornes = année académique `OPEN`.
- `computePeriodRevenueSet()` / `getTeacherIndicators()` → retirer `currentQuarter`.
- `accountingApi.ts` : `periodRevenue` → `{ currentMonth, currentAcademicYear }`.
- `DashboardPage.tsx` : `TeacherAccountingPeriodTable` → 2 cartes.
- Tests e2e `accounting` / `dashboard` : mettre à jour.

---

## CHAPITRE I — IDENTITÉ TÉLÉPHONE, SANS E-MAIL, NOTIFICATIONS IN-APP (décisions #6 et #7)

> **Décision de cadrage (option A)** : la V1.1 **n'envoie aucun message automatique** (ni code de vérification, ni notification externe) — il n'existe aucun canal gratuit pour cela. Le lien d'invitation du Professeur sert d'ancre de confiance. L'ajout d'une vérification et de notifications par **SMS** ou **WhatsApp** (options B / C) est une **évolution** décrite en I.6, sans réécriture grâce à la façade `MessagingService`.

### I.1 Identité des comptes — amende Ch. 9.2 / RM-SEC-001

1. **Le numéro de téléphone est le seul identifiant** de tout compte Professeur et Parent (Administrateur : voir Ch. H). Il est **obligatoire et unique**, normalisé E.164 (indicatif tunisien `+216` par défaut).
2. **L'e-mail est entièrement retiré du produit.** Aucun écran ne le demande, ne l'affiche, ne l'utilise. Aucune notification, aucune vérification, aucune réinitialisation ne passe par e-mail. La colonne `User.email` est conservée nullable le temps de migrer les comptes existants, puis dépréciée (jamais lue par le code applicatif) ; son index unique est retiré.
3. Écrans d'inscription / connexion / réinitialisation **entièrement « téléphone »** — plus aucun champ e-mail.

### I.2 Vérification du numéro — amende Ch. 9.3 / 9.5

1. **En V1.1, le numéro n'est pas vérifié par un code.** À l'inscription, GROUPI valide seulement le **format** du numéro et son **unicité**.
2. Le compte Parent créé via un lien d'invitation est **présumé légitime** : le Professeur émetteur en répond (RM-SEC-051). Il devient **`ACTIVE` immédiatement** (décision #8), sans validation admin.
3. Le compte Professeur reste `PENDING_VALIDATION` en attente de l'Administrateur (Ch. J) — inchangé.
4. `PhoneVerificationToken` reste au modèle, **non utilisé** en V1.1 (réactivé avec l'option B/C).
5. Un numéro mal saisi n'est détecté qu'au moment où le Professeur constate qu'il ne joint pas la famille — risque accepté, l'onboarding étant piloté par un Professeur qui connaît la famille.

### I.3 Mot de passe oublié — remplace Ch. 9.4

Sans e-mail ni canal d'envoi automatique, la réinitialisation est **assistée** en V1.1 :
1. Le Parent / Professeur signale l'oubli (écran « mot de passe oublié » → « contactez votre professeur ou le support »).
2. Le **Professeur** (pour un de ses Parents) ou un **Administrateur** (support) déclenche depuis son espace la génération d'un **lien de réinitialisation à usage unique** (`PasswordResetToken`, déjà au modèle), affiché à l'écran.
3. Ce lien est transmis **hors bande** (le Professeur le communique au Parent par son propre WhatsApp, en personne, par téléphone…).
4. Le Parent ouvre le lien → nouvel écran de mot de passe → toutes les sessions actives sont révoquées (RM-SEC existant).
5. L'auto-réinitialisation par code (SMS/WhatsApp) est activée avec l'option B/C.

### I.4 Canaux de notification V1.1 — remplace Ch. 18.8

| Canal | Usage V1.1 |
|---|---|
| **In-app** (centre d'activités) | **Seul canal actif.** Toutes les activités, tous rôles, toutes priorités. Jamais désactivable. Cloche + badge non-lus déjà en place. |
| **Partage WhatsApp manuel** (`wa.me`) | **Pas un canal de notification.** Boutons côté Professeur : « Copier le lien » et « Partager sur WhatsApp » sur le lien d'invitation (Ch. A.3.1) et sur une annonce de groupe (Ch. 19.4). Ouvre WhatsApp avec un texte + lien pré-remplis ; le Professeur choisit le destinataire et envoie lui-même. Aucun message automatique, aucune API, aucun coût. |
| ~~E-mail~~ | **Supprimé.** |
| **WhatsApp / SMS automatisés** | **Non branchés en V1.1** — évolution I.6. |

6. Politique de diffusion Ch. 18.9 en V1.1 : **tout est in-app** (`INFORMATION`, `IMPORTANT`, `CRITICAL`). Le niveau de priorité reste porté par l'activité (utile pour le tri, la mise en avant, et le futur routage externe).
7. **Façade obligatoire dès maintenant** : `NotificationChannel` (`IN_APP` / `WHATSAPP` / `SMS`) + `MessagingService` unique ; **tous** les déclencheurs métier passent par lui. En V1.1 il ne route que `IN_APP`. `EmailService` et le module `email/` sont **retirés**.

### I.5 Colonne « canal » des notifications (Annexe H)

Chaque `NOT-*` conserve dans le catalogue une **cible de canal** (`in-app` en V1.1, `in-app + WhatsApp` prévu pour `IMPORTANT`/`CRITICAL` en option B/C). Cela documente à l'avance le routage sans l'activer.

### I.6 Évolution — vérification et notifications par SMS / WhatsApp (options B / C, hors V1.1)

À activer plus tard, sans réécrire les déclencheurs (façade en place) :

- **Option B — SMS** : code de vérification + réinitialisation + notifications `IMPORTANT`/`CRITICAL` par SMS. Couvre 100 % des numéros. Fournisseur = agrégateur SMS tunisien (`SmsService` existe déjà en ébauche). Coût ~1 SMS par inscription / reset + par notification externe.
- **Option C — WhatsApp + repli SMS** : code et notifications par **WhatsApp Business Cloud API (Meta)** — appels **REST HTTPS sans état**, **compatibles serverless Vercel** (le problème de connexion permanente ne concerne que les clients non officiels type Baileys, écartés) ; repli SMS si le numéro n'est pas sur WhatsApp ou si la livraison échoue.
  - Prérequis (délai Meta de quelques jours) : compte Meta Business + numéro WhatsApp dédié + vérification d'entreprise + **templates à faire approuver** (un *authentication* pour les codes, un *utility* par famille de notification).
  - Coût : facturation Meta **par message** (*authentication* + *utility*), faible mais non nul.
  - `WhatsAppService` : `sendTemplate(to, name, vars[])` / `sendText` (fenêtre 24 h) ; webhook `POST /webhooks/whatsapp` (signature Meta) pour les accusés de livraison.
- Dans les deux cas : `PhoneVerificationToken` est réactivé (code 6 chiffres, 10 min, 3 tentatives, renvoi 60 s) pour l'inscription **et** la réinitialisation ; le compte Parent invité passe `ACTIVE` **après** vérification du code.

### I.7 Règles métier — `RM-SEC-050+` / `RM-NOT-050+`

| Code | Règle |
|---|---|
| RM-SEC-050 | Le numéro de téléphone est le seul identifiant de compte ; il est obligatoire, unique et normalisé (E.164). |
| RM-SEC-051 | En V1.1, le numéro n'est pas vérifié par code ; un compte Parent issu d'un lien d'invitation est présumé légitime (le Professeur émetteur en répond) et devient `ACTIVE` immédiatement. |
| RM-SEC-052 | Le produit n'utilise aucune adresse e-mail : aucune saisie, aucun affichage, aucune notification, aucune réinitialisation par e-mail. |
| RM-SEC-053 | Sans e-mail ni canal automatique, la réinitialisation du mot de passe est assistée : un Professeur ou un Administrateur génère un lien à usage unique, transmis hors bande au titulaire. Elle révoque toutes les sessions actives. |
| RM-NOT-050 | En V1.1, toute notification est délivrée **in-app** uniquement ; l'in-app n'est jamais désactivable. |
| RM-NOT-051 | Tous les déclencheurs métier passent par le `MessagingService` (façade `NotificationChannel`) ; aucun appel direct à un fournisseur. L'ajout de SMS/WhatsApp ne doit modifier aucun déclencheur. |
| RM-NOT-052 | Le niveau de priorité (`INFORMATION` / `IMPORTANT` / `CRITICAL`) reste porté par chaque activité même si un seul canal est actif, pour le tri et le futur routage externe. |

### I.8 Cas d'erreur — `ERR-SEC-050+`

| Code | Situation | Résultat attendu |
|---|---|---|
| ERR-SEC-050 | Numéro de téléphone déjà utilisé | Inscription refusée (équivalent `ERR-ACC-017`). |
| ERR-SEC-051 | Numéro au format invalide | Inscription bloquée à la saisie (validation de format). |
| ERR-SEC-052 | Réinitialisation demandée sans Professeur ni Administrateur disponible pour la déclencher | Message « contactez le support » + coordonnées support. |

### I.9 Impact technique

- Prisma : `User.email` nullable conservé (migration), **retirer l'index unique** et toute lecture applicative. Pas de nouveau champ de préférence de canal en V1.1 (à ajouter avec l'option B/C).
- `auth` : DTO register / login / forgot-password → **téléphone uniquement**, plus de champ e-mail. Inscription = saisie + validation de format → compte créé (`ACTIVE` Parent invité / `PENDING_VALIDATION` Professeur). Pas d'étape de code.
- `MessagingService` (nouveau, façade `NotificationChannel` = `IN_APP` / `WHATSAPP` / `SMS`) : ne route que `IN_APP` en V1.1. `notifications.service.ts` passe par lui.
- **Supprimer** le module `email/` (`EmailService`, templates, `SMTP_*`) et tous ses appels — audit complet des déclencheurs (inscriptions, changement de groupe, préinscriptions, présences, abonnements, scheduler `temporal-jobs`).
- Réinitialisation assistée : endpoint `POST /teacher/parents/:id/password-reset-link` (Professeur, sur un de ses Parents) et `POST /admin/users/:id/password-reset-link` (permission support) → renvoie l'URL à afficher.
- Front : `RegisterPage` / `LoginPage` / `ForgotPasswordPage` → téléphone seul ; `ForgotPasswordPage` explique la procédure assistée. `VerifyPhonePage` → retirée du flux (conservée pour l'option B/C). `AccountSettingsPage` → retirer l'e-mail. `AppLayout` et toutes les pages → retirer tout affichage d'e-mail (afficher nom / téléphone).
- Espace Professeur : bouton « Copier le lien » (copie presse-papier) + « Partager sur WhatsApp » (`wa.me`) sur le lien d'invitation et les annonces. Bouton « Générer un lien de réinitialisation » sur la fiche d'un Parent.

---

## CHAPITRE J — PROFESSEUR NON VALIDÉ : ACCÈS VERROUILLÉ (décision #9)

### J.1 Principe — amende Ch. 5.6 / 8.3

Tant que le compte Professeur n'est pas validé par un Administrateur (`User.status = PENDING_VALIDATION` **ou** `TeacherProfile.status ≠ VALIDATED`), le Professeur **n'a accès à aucune fonctionnalité** : ni tableau de bord, ni groupes, ni salles d'attente, ni lien d'invitation, ni abonnement, ni référentiels.

Il ne voit qu'un **écran unique « En attente de validation »** comportant :
- l'état de sa demande (soumise le…, en cours d'examen) ;
- le rappel des informations / pièces éventuellement manquantes (score de complétude, Ch. 5.5) ;
- un **moyen de contacter le support** : numéro de téléphone / WhatsApp du support ;
- un bouton « Compléter mon profil » (seul écran d'édition accessible, si la complétude bloque la validation).

### J.2 Règles métier — `RM-TPR-050+`

| Code | Règle |
|---|---|
| RM-TPR-050 | Un Professeur non validé n'accède qu'à l'écran « En attente de validation » et, le cas échéant, à l'édition de son profil. Toute autre route lui est refusée (redirection vers cet écran). |
| RM-TPR-051 | L'API refuse (403 `ERR-PERM-*`) toute opération Professeur — lecture comme écriture — tant que le profil n'est pas `VALIDATED`, hors profil et déconnexion. |
| RM-TPR-052 | L'écran « En attente de validation » affiche toujours un canal de contact du support (téléphone / WhatsApp). |
| RM-TPR-053 | Dès la validation, le Professeur accède à l'ensemble de son espace et son lien d'invitation est généré (RM-INV-001) ; ses groupes de niveau sont créés pour ses niveaux validés (RM-POOL-001). |
| RM-TPR-054 | Le passage `VALIDATED → PENDING_VALIDATION` (ajout d'une matière/niveau non validé, RM-TPR-003/004) **ne reverrouille pas** tout l'espace : seules les fonctions liées à la matière/au niveau en attente sont indisponibles (comportement V1.0 conservé). Le verrouillage total ne concerne que la **première** validation. |

### J.3 Cas d'erreur — `ERR-TPR-050+`

| Code | Situation | Résultat attendu |
|---|---|---|
| ERR-TPR-050 | Appel d'un endpoint Professeur par un compte jamais validé | 403, message « compte en attente de validation ». |
| ERR-TPR-051 | Navigation directe (URL) vers un écran Professeur avant la première validation | Redirection vers « En attente de validation ». |

### J.4 Impact technique

- `PermissionsGuard` / nouveau `TeacherValidatedGuard` : bloque toutes les routes Professeur si première validation absente (liste blanche : `teacher-profile`, `auth`).
- Front : `ProtectedRoute` / layout Professeur → si `teacherProfile.status` jamais passé `VALIDATED`, rendre `<TeacherPendingValidationScreen>` et rien d'autre.
- Paramètres : `SUPPORT_PHONE`, `SUPPORT_WHATSAPP` (config/env) affichés sur l'écran d'attente.

---

## CHAPITRE F — SYNTHÈSE DES IMPACTS SUR LE RÉFÉRENTIEL V1.0

| Chapitre / Annexe V1.0 | Nature de l'impact |
|---|---|
| **Ch. 5 — Profil Professeur** | §5.6 : accès verrouillé tant que non validé (Ch. J). Génération du lien d'invitation à la validation. |
| **Ch. 3 — Acteurs** | §3.5 : l'invitation d'un Administrateur ne peut plus se faire par e-mail — voir Ch. H (point ouvert : lien partagé hors bande, ou création directe avec mot de passe temporaire). |
| **Ch. 6 — Profil Parent** | §6.3 : création via lien d'invitation, compte `ACTIVE` immédiat. §6.8/6.11 : visibilité renforcée (Ch. D). Nouvelles RM-PAR-019→028, ERR-PAR-020→023. |
| **Ch. 7 — Situation scolaire** | Inchangé sur le fond. Crée le contexte du rattachement (niveau) ; RM-POOL-005/014, RM-INV-011. |
| **Ch. 8 — Cycle de vie des comptes** | §8.4 « Validation des Parents » : **supprimée** pour les comptes créés via invitation (compte `ACTIVE` direct). §8.3 « Validation des Professeurs » : renforcée — accès nul avant validation (Ch. J). |
| **Ch. 9 — Authentification** | §9.2 identifiant = **téléphone uniquement**, e-mail retiré. §9.3/9.5 : **pas de vérification du numéro par code en V1.1** (le lien d'invitation vaut garantie) ; réactivable en option B/C. §9.4 : réinitialisation du mot de passe **assistée** (lien à usage unique généré par un prof/admin, transmis hors bande). RM-SEC-001 amendée (RM-SEC-050→053). |
| **Ch. 10 — Groupes** | `Group.kind` (`LEVEL_POOL` / `STANDARD`), `subject_id` nullable. Ch. 10 s'applique aux `STANDARD`. Nouveau Ch. B. |
| **Ch. 11 — Préinscriptions** | Conservé, restreint aux Professeurs déjà liés (RM-PAR-024). Transformation → demande `PENDING_VALIDATION` (inchangé). |
| **Ch. 12 — Inscriptions** | §12.3–12.7 supprimés pour le chemin nominal → **affectation** (Ch. C). États `PENDING_VALIDATION`/`EXPIRED` conservés pour le chemin préinscription. `Enrollment.origin`, `source_membership_id`. |
| **Ch. 16 — Tableaux de bord** | §16.3 : CA prévisionnel 2 périodes, année = académique (Ch. E). §16.4 : navigation 3 niveaux (Ch. D.3). Espace Professeur : « Salles d'attente » + « Inviter des parents ». |
| **Ch. 18 — Notifications** | §18.8 canaux V1.1 : **in-app uniquement** (non désactivable). E-mail **supprimé**. SMS/WhatsApp automatisés = évolution I.6. Façade `MessagingService` + `NotificationChannel` en place, ne route que `IN_APP`. RM-NOT-050→052. |
| **Ch. 20 — Changement de groupe** | Groupe cible = même Professeur (RM-PAR-025). Sinon inchangé. |
| **Ch. 22 — Droits liés aux abonnements** | Génération/rotation du lien d'invitation et affectation soumises au `SubscriptionGuard`. Consultation toujours autorisée. |
| **Ch. 23 — Référentiels** | Aucun nouveau référentiel. `SchoolLevel` : clé du groupe de niveau. |
| **Ch. 25 — Règles de calcul** | §25.11 : borne « année » = année académique ; exclusion des groupes de niveau (RM-CAL-050). |
| **Annexe B (RM)** | Ajouter RM-INV-001→017, RM-POOL-001→014, RM-AFF-001→010, RM-PAR-019→028, RM-DSH-050/051, RM-CAL-050, RM-SEC-050→053, RM-NOT-050→052, RM-TPR-050→054. |
| **Annexe F (Événements)** | Ajouter EVT-INV-*, EVT-POOL-*, EVT-AFF-*. |
| **Annexe G (Statuts)** | Ajouter `ParentInvitationStatus`, `LevelPoolMembershipStatus`, `MembershipSource`, `GroupKind`, `EnrollmentOrigin`, `NotificationChannel` (`IN_APP`/`WHATSAPP`/`SMS`). |
| **Annexe H (Notifications)** | Ajouter NOT-INV-*, NOT-POOL-*, NOT-AFF-*. Retirer NOT-GRP-008. Colonne « canal » = `in-app` en V1.1 (cible `in-app + WhatsApp` documentée pour `IMPORTANT`/`CRITICAL` en option B/C). |
| **Annexe I (RBAC)** | Nouveaux domaines : INV (`PERM-INV-001` gérer son lien — Prof), POOL (`PERM-POOL-001` consulter sa salle d'attente, `PERM-POOL-002` retirer un élève — Prof), AFF (`PERM-AFF-001` affecter, `PERM-AFF-002` retirer d'un groupe standard — Prof). **Retrait** de `PERM-GRP-005` (col. Parent) et `PERM-INS-001` (Parent). Nouveau `PERM-*` : accès Professeur conditionné à la validation (Ch. J). |
| **Annexe J (CRUD)** | `ParentInvitation` : C/R/U (rotation/désactivation) par Prof ; R par visiteur. `LevelPoolMembership` : C (système/Prof) / R / U (retrait). `Group(kind=LEVEL_POOL)` : C/D système uniquement. |
| **Annexe M (Erreurs)** | Ajouter ERR-INV-*, ERR-POOL-*, ERR-AFF-*, ERR-PAR-020→023, ERR-SEC-050→052, ERR-TPR-050/051. |
| **Annexe P (Objets métier)** | Ajouter `ParentInvitation`, `LevelPoolMembership`. Modifier `Group` (`kind`, `subjectId?`), `Enrollment` (`origin`, `sourceMembershipId`), `User` (e-mail déprécié, index unique retiré). Retirer les objets liés à `EmailService`. |

---

## CHAPITRE G — PLAN D'IMPLÉMENTATION (CHECKLIST, HORS PÉRIMÈTRE DE L'AVENANT)

**Migrations Prisma**
- [ ] `GroupKind` + `group.kind` (défaut `STANDARD`), `group.subject_id` nullable + backfill `STANDARD`.
- [ ] `parent_invitation` + `ParentInvitationStatus`.
- [ ] `level_pool_membership` + `LevelPoolMembershipStatus` + `MembershipSource`.
- [ ] `enrollment.origin` + `EnrollmentOrigin` + `enrollment.source_membership_id` + backfill.
- [ ] `user.email` : supprimer l'index unique, retirer toute lecture applicative (colonne conservée le temps de la migration).
- [ ] `NotificationChannel` enum (`IN_APP` / `WHATSAPP` / `SMS`) — seul `IN_APP` utilisé en V1.1.

**API — nouveaux modules**
- [ ] `parent-invitations/` : `GET /teacher/invitation` (mon lien), `POST /teacher/invitation/rotate`, `POST /teacher/invitation/disable|enable`, `GET /public/invitations/:token` (preview), `POST /public/invitations/:token/accept` (crée le compte `ACTIVE` + enfant + rattachement, sans code de vérification en V1.1).
- [ ] `level-pools/` : `GET /teacher/level-pools`, `GET /teacher/level-pools/:id/members`, `DELETE /teacher/level-pools/:id/members/:studentId`.
- [ ] `groups/:id/members` : `POST` (affectation multi-élèves), `DELETE /:studentId`.
- [ ] Hook validation `TeacherSchoolLevel` → création idempotente des groupes de niveau.
- [ ] Hook ouverture `AcademicYear` → groupes de niveau + lien d'invitation manquants.
- [ ] `TeacherValidatedGuard` (verrouillage total avant première validation).
- [ ] `MessagingService` (façade `NotificationChannel` = `IN_APP` / `WHATSAPP` / `SMS`) : ne route que `IN_APP` en V1.1 ; `notifications.service.ts` passe par lui. `WhatsAppService` / `SmsService` : **non branchés** (option B/C).
- [ ] **Supprimer le module `email/`** (`EmailService`, templates, `SMTP_*`) et auditer/retirer tous ses appels (inscriptions, changement de groupe, préinscriptions, présences, abonnements, `temporal-jobs`).
- [ ] Réinitialisation assistée : `POST /teacher/parents/:id/password-reset-link` (Prof) + `POST /admin/users/:id/password-reset-link` (support) → renvoient l'URL à transmettre hors bande. `PhoneVerificationToken` non utilisé en V1.1.

**API — suppressions / modifications**
- [ ] Retirer `GET /groups/search`, `GET /parent/groups` (410).
- [ ] Retirer `POST /enrollments` (demande Parent) ; conserver la transformation de préinscription.
- [ ] `accounting.service` : CA prévisionnel 2 périodes + année académique.
- [ ] `pre-enrollments` : restreindre la cible (RM-PAR-024).
- [ ] `group-change` : restreindre le groupe cible au même Professeur (RM-PAR-025).
- [ ] `auth` : **téléphone comme seul identifiant**, retirer le champ e-mail de tous les DTO (register / login / forgot-password) ; inscription = saisie + validation de format, pas d'étape de code ; `ForgotPasswordPage` explique la procédure assistée.
- [ ] `SubscriptionGuard` sur `parent-invitations` (rotation) et `groups/:id/members` (POST).

**Web — écrans**
- [ ] Supprimer `ParentGroupSearchPage`.
- [ ] `ParentChildrenPage` → navigation 3 niveaux, masquage des sélecteurs à option unique.
- [ ] Page publique `/invitation/:token`.
- [ ] Espace Professeur : « Inviter des parents » (afficher le lien + **bouton « Copier le lien »** avec copie presse-papier + bouton secondaire « Partager sur WhatsApp » `wa.me` + rotation/désactivation), « Salles d'attente » (par niveau + affectation vers un groupe).
- [ ] `<TeacherPendingValidationScreen>` (contact support téléphone / WhatsApp).
- [ ] `RegisterPage` / `LoginPage` / `ForgotPasswordPage` : **téléphone seul**, plus aucun champ e-mail. `ForgotPasswordPage` → écran « contactez votre professeur ou le support ». `VerifyPhonePage` retirée du flux (conservée pour option B/C).
- [ ] `AccountSettingsPage` : retirer l'e-mail.
- [ ] `AppLayout` et toutes les pages : retirer tout affichage d'adresse e-mail (afficher nom / téléphone).
- [ ] Bouton « Copier le lien » + « Partager sur WhatsApp » (`wa.me`) sur le lien d'invitation et les annonces de groupe (Ch. 19.4). Bouton « Générer un lien de réinitialisation » sur la fiche d'un Parent.
- [ ] `DashboardPage` : CA prévisionnel 2 cartes.

**Tests e2e** : invitation (preview / consommation / rotation / désactivation / idempotence enfant / compte `ACTIVE` direct, sans code), groupes de niveau (création auto, rattachement selon niveau déclaré, unicité), affectation (capacités, multi-élèves, refus partiels), cloisonnement Parent (accès croisé refusé), Professeur non validé (403 partout sauf profil), absence totale d'e-mail (aucun DTO/route/écran ne l'accepte), réinitialisation assistée (lien généré par prof/admin, usage unique, révocation des sessions), notifications (in-app uniquement, façade), CA prévisionnel (2 périodes, borne académique).

---

## CHAPITRE H — POINTS LAISSÉS OUVERTS

1. **Consentement du Parent à l'affectation** : V1.1 = notification sans blocage. État `Enrollment.PENDING_PARENT_ACK` non retenu pour l'instant.
2. **Multi-Parent (Ch. 6 V2)** : un enfant reste rattaché à un seul compte Parent (RM-PAR-012 inchangé).
3. **Vérification & notifications par SMS / WhatsApp (option B ou C — hors V1.1)** : décision différée. Si retenu : choisir l'option (B SMS seul, universel, simple ; C WhatsApp + repli SMS, plus riche, setup Meta) ; budgéter le coût par message ; pour C, ouvrir le compte Meta Business + vérification d'entreprise + templates à faire approuver (délai de quelques jours). La façade `MessagingService` est déjà en place, l'ajout ne touche aucun déclencheur.
4. **Administrateurs (Ch. 3.5)** : l'invitation admin par e-mail n'existe plus. Trancher : (a) lien admin partagé hors bande (le Super Admin le transmet lui-même) ; (b) création directe avec mot de passe temporaire. `AdminInvitationToken` reste au modèle.
5. **Lien d'invitation quand le Professeur perd son abonnement** : les consommations en cours restent-elles possibles ? (RM-INV-016 à confirmer — proposition : oui pour le rattachement en salle d'attente, non pour l'affectation.)
6. **Nom par défaut d'un groupe standard** proposé depuis une salle d'attente (`7G1`, `7G2`…) : auto-incrément éditable.
7. **Rétention** : politique RGPD (Ch. 26.14) pour les invitations expirées et les numéros de téléphone.
8. **Rattachement rétroactif** des familles déjà présentes (démo / early adopters) : script de backfill à cadrer.
9. **Suppression douce des endpoints de recherche** : 404 vs 410 vs redirection — choix technique.

---

_Fin de l'avenant 01._
