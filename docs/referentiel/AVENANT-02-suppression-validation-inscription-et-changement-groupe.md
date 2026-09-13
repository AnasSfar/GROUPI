# AVENANT 02 — Suppression de la validation manuelle d'inscription et refonte du changement de groupe

Statut : validé, implémenté sur la branche `avenant-01-onboarding` à la suite de l'Avenant 01.

## Contexte

L'Avenant 01 a introduit l'affectation Professeur depuis une salle d'attente
(`Group.kind = LEVEL_POOL`) comme chemin nominal d'entrée dans un groupe standard :
l'inscription y est créée directement `ACTIVE`, sans étape de décision. Cet avenant
généralise ce principe à **toutes** les inscriptions, et simplifie en conséquence le
changement de groupe.

## 1. Plus de validation manuelle d'une inscription

- `EnrollmentStatus` perd les valeurs `PENDING_VALIDATION`, `REJECTED`, `CANCELLED`,
  `EXPIRED` — il ne reste que `ACTIVE`, `SUSPENDED`, `ARCHIVED`.
- `PreEnrollmentsService.confirm()` (Ch. 11.9/11.11) crée désormais directement une
  `Enrollment ACTIVE` (compte comptable créé dans la même transaction), au lieu d'une
  inscription `PENDING_VALIDATION` nécessitant un accept/reject du Professeur.
- Retirés : `POST /groups/:groupId/enrollments/:id/accept`, `.../reject`,
  `POST /enrollments/:id/cancel`, `POST /pre-enrollments/:id/withdraw-confirmation`,
  l'expiration automatique à J+7 (RM-INS-026), et les cascades d'auto-clôture d'une
  inscription en attente lors de l'archivage d'un groupe ou d'un élève
  (RM-INS-025/029/031, ex-ERR-INS-*).
- Ce chantier rend obsolètes, dans le corps du référentiel (parties 3/5/6), les règles
  RM-INS-017/019/020/025/026/029/031/038/040/049/054/055/056/058 et les codes
  ERR-INS-017/019/020/029/031, dans la mesure où elles décrivent ce mécanisme de
  décision/expiration désormais supprimé. Nettoyage documentaire non fait dans ce
  chantier (chantier code uniquement) — à prévoir séparément.

## 2. Changement de groupe : décision unilatérale et immédiate du Professeur

- Le module `group-change` (Ch. 20.3, `GroupChangeRequest`/`GroupChangeStatus`, contrôleurs
  Parent et Professeur) est **entièrement supprimé** — Parent et Professeur inclus. Un
  Parent ne peut plus demander, confirmer ni décliner un changement de groupe.
- Remplacé par une action directe et immédiate du Professeur :
  `POST /groups/:groupId/enrollments/:id/change-group` (`EnrollmentsService.changeGroup`).
  Le groupe cible doit lui appartenir, être un groupe standard actif/complet, de même
  matière et même niveau scolaire que le groupe d'origine. L'ancienne inscription est
  archivée et une nouvelle inscription `ACTIVE` est créée immédiatement dans le groupe
  cible (`origin: GROUP_CHANGE`), avec report du solde comptable
  (`AccountingService.carryOverBalanceForGroupChange`, réutilisé tel quel).
- Il n'y a plus de proposition, de délai de confirmation, ni de date d'effet différée :
  le changement est instantané, à l'image d'une affectation depuis une salle d'attente.
- Rend obsolètes RM-CHG-001 à 021, ERR-CHG-*, NOT-CHG-*, PERM-CHG-* (parties 4/5/6) et
  RM-PAR-025/ERR-PAR-022 (Avenant 01, Ch. D.4) — nettoyage documentaire non fait dans ce
  chantier.

## Points laissés ouverts

- Réécriture complète des parties 3/4/5/6 du référentiel pour retirer les règles citées
  ci-dessus (RM-INS-*, RM-CHG-*, ERR-CHG-*, PERM-CHG-*) — hors périmètre de ce chantier,
  qui n'a porté que sur le code (API + Web + tests e2e).
- Historique : les migrations Prisma antérieures à cet avenant restent en base telles
  quelles (immuables) ; seule la nouvelle migration (`..._avenant02_immediate_enrollment_
  and_group_change`) retire les valeurs d'enum et la table devenues obsolètes.

_Fin de l'avenant 02._
