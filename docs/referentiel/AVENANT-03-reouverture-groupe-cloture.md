# AVENANT 03 — Réouverture d'un groupe clôturé

Statut : validé, implémenté sur la branche `avenant-01-onboarding`.

## Contexte

Le Professeur n'avait aucun moyen de revenir sur la clôture d'un groupe : une fois
`CLOSED`, seule l'archive (`ARCHIVED`, définitif) restait accessible. En pratique, un
Professeur peut fermer un groupe par erreur, ou vouloir le rouvrir en cours d'année
(reprise après une pause, erreur de manipulation) sans repartir d'un groupe dupliqué.

## Changement

- **RM-GRP-045** (Ch. 10, Partie 3) est amendée : *« Un groupe clôturé ne peut plus être
  rouvert ni accepter de nouvelles inscriptions »* devient *« Un Professeur peut rouvrir
  un groupe clôturé (retour à l'état OUVERT) ; tant qu'il reste clôturé, aucune nouvelle
  inscription n'est possible »*. Nettoyage documentaire du corps du référentiel non fait
  dans ce chantier (même remarque que l'Avenant 02).
- `ALLOWED_TRANSITIONS` (`apps/api/src/groups/groups.service.ts`) : `CLOSED` gagne la
  transition vers `ACTIVE`, en plus de `ARCHIVED` déjà existante. Réutilise l'endpoint
  `POST /groups/:id/open` déjà existant (utilisé jusqu'ici uniquement pour `DRAFT ->
  ACTIVE`) — aucune nouvelle route.
- **Inchangé** : RM-GRP-038 (*« Un groupe ARCHIVE ne peut jamais redevenir OUVERT »*)
  reste vrai à l'identique — seule la clôture (pas l'archivage) devient réversible.
- Frontend (`TeacherGroupsPage.tsx`) : le bloc d'actions d'un groupe `CLOSED` affiche
  désormais un bouton « Ouvrir » (même appel `groupsApi.openGroup`) à côté de
  « Supprimer » (archiver).

_Fin de l'avenant 03._
