# AVENANT 04 — Un seul créneau de planning par groupe

Statut : validé, implémenté sur la branche `avenant-01-onboarding`.

## Contexte

RM-GRP-007 autorisait un groupe à avoir « un ou plusieurs créneaux récurrents »
(ex. Lundi ET Mercredi pour le même groupe). En pratique, le Professeur a explicitement
demandé qu'un groupe ne porte jamais plus d'un seul créneau hebdomadaire — un besoin de
cours à deux créneaux par semaine se traduit par deux groupes distincts plutôt que par un
planning à plusieurs créneaux sur un même groupe.

Ce chantier fait suite à un bug corrigé dans la même session : la popup « Modifier le
planning » permettait d'« ajouter » un nouveau créneau à côté de l'existant au lieu de le
remplacer, ce qui créait des doublons. Une fois ce bouton retiré côté interface (plus
aucun moyen d'ajouter un second créneau depuis l'UI), il devenait cohérent d'interdire
formellement plus d'un créneau également côté API.

## Changement

- **RM-GRP-007** est amendée : *« Le planning du groupe est défini par un ou plusieurs
  créneaux récurrents »* devient *« Le planning du groupe est défini par exactement un
  créneau récurrent (jour, heure, durée, mode, lieu) »*.
- `CreateGroupDto.schedules` et `UpdateGroupDto.schedules`
  (`apps/api/src/groups/dto/`) : ajout de `@ArrayMaxSize(1)` (en plus du `@ArrayMinSize(1)`
  déjà existant) — création et modification d'un groupe refusent désormais tout tableau de
  plus d'un créneau (400).
- Frontend (`TeacherGroupsPage.tsx`) : la popup « Modifier le planning » n'a jamais de
  bouton « Ajouter » (déjà le cas depuis le fix du bug de doublon) ; le formulaire de
  création n'en a jamais eu non plus.
- **Nettoyage de données** : un groupe existant (« 8G1 », créé pendant les tests de cette
  session) portait deux `GroupSchedule` strictement identiques, résidu du bug de doublon
  ci-dessus — supprimé manuellement en base (aucune séance n'y était rattachée).

## Point laissé ouvert

- Les tests e2e `groups.e2e-spec.ts` (b)/(c)/(d) (« Groups — schedule update ») échouent
  déjà **avant** cet avenant, pour une raison indépendante : ils créent plusieurs groupes
  successifs avec un planning strictement identique (même matière/niveau/année/créneau),
  ce qui déclenche RM-GRP-024 (« pas deux groupes actifs avec un planning identique ») dès
  le deuxième `createGroup`. Ajusté pour rester à un seul créneau (cohérent avec cet
  avenant) mais le problème de fond (schedules dupliqués entre tests indépendants) n'a pas
  été corrigé — hors périmètre de ce chantier.

_Fin de l'avenant 04._
