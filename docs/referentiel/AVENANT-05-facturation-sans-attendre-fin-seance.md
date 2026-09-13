# AVENANT 05 — Validation de l'appel sans attendre la fin théorique de la séance

Statut : validé, implémenté sur la branche `avenant-01-onboarding`.

## Contexte

Certains Professeurs souhaitent pouvoir encaisser un paiement pendant le cours,
juste après avoir fait l'appel — pas seulement une fois la séance officiellement
terminée. Or la facturation (génération des écritures comptables `SESSION`, Ch.15.9)
n'est déclenchée que par la validation définitive de l'appel
(`AttendanceService.validate`), et RM-SES-038 interdisait cette validation tant que
l'heure de fin théorique de la séance n'était pas atteinte ou dépassée. Un Professeur
qui terminait de renseigner les présences en début de cours devait donc attendre la fin
théorique (parfois 1h30-2h plus tard) avant de pouvoir accepter un paiement.

## Changement

- **RM-SES-038** est amendée : *« Une séance ne peut être marquée comme TERMINEE que
  lorsque son heure de fin planifiée est atteinte ou dépassée »* devient *« Une séance
  peut être marquée comme TERMINEE dès que la séance a commencé et que tous les élèves
  actifs ont reçu un statut de présence — sans attendre que son heure de fin planifiée
  soit atteinte »*.
- `AttendanceService.validate` (`apps/api/src/attendance/attendance.service.ts`) :
  suppression du contrôle bloquant sur `theoreticalEnd(session)`. Restent inchangés :
  - la séance doit avoir commencé (`theoreticalStart`, ERR-ATT-004) ;
  - tous les élèves actifs doivent avoir un statut de présence renseigné (RM-ATT-027) ;
  - une séance déjà validée ne peut pas être re-validée (ERR-ATT-005).
- `theoreticalEnd` reste utilisé ailleurs (calcul du délai de verrouillage à 48h,
  `computeLockDeadline`/`lockIfDue`, et le job temporel de verrouillage automatique) —
  seule la validation manuelle de l'appel n'attend plus cette échéance.
- Effet en cascade côté paiements : la page "Saisir les paiements" d'une séance
  (`TeacherAllSessionsPage.tsx`, modale de la vue calendrier) n'est accessible que pour
  une séance Terminée/Verrouillée (facturation déjà réalisée) — ce comportement était déjà
  correct côté règle métier, il devient simplement atteignable plus tôt dans la même
  séance puisque la validation elle-même n'attend plus la fin théorique.

## Point laissé ouvert

- RM-SES-037 (« Les présences ne peuvent être saisies que pour une séance dont l'état
  est TERMINEE ») reste en décalage avec l'implémentation réelle (la saisie se fait
  pendant que la séance est PLANIFIEE, avant validation) — décalage pré-existant à cet
  avenant, non traité ici.

_Fin de l'avenant 05._
