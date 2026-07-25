---
name: groupi-cadre-general
description: Charge le cadre général du référentiel GROUPI — vision/mission, conventions de nommage (naming DB/API/code), acteurs (Super Admin, Admin, Professeur, Parent, Élève) et RBAC, modèle économique (offres, abonnements, capacité). À utiliser dès qu'on démarre un nouveau module, qu'on nomme une entité/table/route/permission, ou qu'on implémente logique de rôle ou de compte/abonnement.
---

# GROUPI — Cadre général (référentiel Partie I, Chapitres 1 à 4)

Charge ce skill avant de :
- Nommer une entité, une table, une colonne, une route API, une permission, un code d'erreur/règle/événement (conventions officielles à respecter à la lettre).
- Implémenter la logique des rôles (Super Administrateur, Administrateur, Professeur, Parent, Élève) ou les vérifications RBAC.
- Toucher au modèle économique : offres d'abonnement, capacité d'inscriptions, dépassement de capacité, changement d'offre.
- Démarrer un tout nouveau chantier et avoir besoin du contexte produit global.

## Ce que contient ce chapitre

| Chapitre | Sujet |
|---|---|
| 1 | Vision, mission, contexte, positionnement, ce que GROUPI n'est pas |
| 2 | **Conventions de nommage** — français/anglais, PascalCase/snake_case/camelCase, codes RM/ERR/EVT/CAL/NOT/WF, terminologie officielle (Groupe vs Séance, Compte vs Compte de suivi comptable, etc.) |
| 3 | Les 5 acteurs, leurs droits, états de compte, règles métier RM-ACC-* |
| 4 | Modèle économique : offres Découverte/Intermédiaire/Pro, capacité, dépassement, paiement des abonnements |

## Comment l'utiliser

1. Lis d'abord [`contexte.md`](../../../contexte.md) à la racine du dépôt pour le résumé condensé (acteurs, offres, conventions clés) — souvent suffisant.
2. Si tu as besoin du détail exact (règle métier précise, cas d'erreur, texte exact d'une convention), lis le fichier complet : [`docs/referentiel/01-partie-1-cadre-general.md`](../../../docs/referentiel/01-partie-1-cadre-general.md).
3. Ne code jamais un nom d'entité, de table ou de route sans vérifier la section 2 (Conventions de nommage) — c'est la source de vérité, pas une suggestion.
4. Pour les permissions RBAC détaillées par rôle, la matrice complète est dans l'Annexe I — voir le skill `groupi-annexes`.
