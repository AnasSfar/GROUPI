---
name: groupi-financier
description: Charge les règles de gestion financière et transverse GROUPI — moteur comptable, tableaux de bord, exports de données, notifications et centre d'activités, communication entre acteurs, changement de groupe, abonnements Professeur, droits liés aux abonnements, référentiels métier (matières/niveaux/établissements). À utiliser pour tout travail sur comptabilité, paiements, statistiques, exports, notifications, ou gestion d'abonnement.
---

# GROUPI — Gestion financière (référentiel Partie IV, Chapitres 15 à 23)

Charge ce skill avant de :
- Toucher au **moteur comptable** : comptes de suivi comptable, écritures, soldes, immuabilité comptable, indicateurs financiers.
- Construire un tableau de bord (Professeur, Parent, Administrateur, Super Administrateur).
- Implémenter un export de données (formats, critères de sélection, confidentialité, journal des exports).
- Gérer les notifications, le centre d'activités, ou la communication entre Professeur/Parent (fil de commentaires, annonces de groupe).
- Implémenter le changement de groupe d'un élève (impact pédagogique et comptable).
- Gérer les abonnements Professeur (offres, renouvellement, suspension) et les droits associés (feature-gating).
- Modéliser les référentiels métier partagés : matières, niveaux scolaires, établissements, villes.

## Ce que contient cette partie

| Chapitre | Sujet |
|---|---|
| 15 | **Moteur comptable** — compte de suivi, immuabilité, calcul du solde, types d'écritures, indicateurs financiers |
| 16 | Tableaux de bord — par rôle, actualisation, alertes |
| 17 | Exportation des données — données exportables, formats, confidentialité, journal |
| 18 | Notifications et centre d'activités — priorités, canaux, politique de diffusion |
| 19 | Communication entre acteurs — commentaires, annonces de groupe, ce qui est interdit |
| 20 | Changement de groupe — initiateur, types, validation, impacts |
| 21 | Gestion des abonnements — offres, durée, renouvellement, suspension/réactivation |
| 22 | Gestion des droits liés aux abonnements — contrôle d'accès aux fonctionnalités selon l'offre |
| 23 | Les référentiels métier — matières, niveaux, établissements, villes, seeds |

## Comment l'utiliser

1. Lis le fichier complet : [`docs/referentiel/04-partie-4-gestion-financiere.md`](../../../docs/referentiel/04-partie-4-gestion-financiere.md).
2. Rappel important (RM du domaine Comptable, Ch. 15/27) : **le domaine Comptable ne réalise jamais de paiement, il n'en fait que le suivi** — et les paiements d'abonnement (Ch. 21, domaine Commercial) ne touchent **jamais** les comptes de suivi comptable des élèves. Ne pas mélanger ces deux flux d'argent dans le modèle de données.
3. Pour l'offre/capacité d'abonnement (montants, quotas), voir aussi `groupi-cadre-general` (Chapitre 4) qui définit les 3 offres.
4. Les catalogues détaillés (notifications, statuts, indicateurs KPI) sont dans les Annexes D/E/G/H — voir le skill `groupi-annexes` si tu as besoin de l'exhaustif plutôt que du principe.
