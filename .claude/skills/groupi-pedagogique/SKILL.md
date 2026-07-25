---
name: groupi-pedagogique
description: Charge les règles de gestion pédagogique GROUPI — groupes, préinscriptions, inscriptions, séances et gestion des présences. À utiliser pour tout travail sur la création/planning d'un groupe, le tunnel préinscription→inscription, la génération de séances, la saisie de présence, ou le changement de groupe.
---

# GROUPI — Gestion pédagogique (référentiel Partie III, Chapitres 10 à 14)

C'est le **cœur métier** de GROUPI (domaine Pédagogique — voir aussi `groupi-regles-fonctionnelles` pour l'architecture par domaines). Charge ce skill avant de :
- Créer/modifier/dupliquer un groupe, gérer son planning, sa tarification (référence GROUPI vs tarif public vs tarif personnalisé), son cycle de vie.
- Implémenter le tunnel de préinscription (période, transformation en groupes, proposition aux parents, expiration, priorité).
- Implémenter une inscription : recherche de groupe, demande, vérifications automatiques, décision du professeur, tarification, modes de paiement, changement de groupe.
- Générer des séances (récurrence, périodes d'interruption, séances exceptionnelles), gérer leur immuabilité et leur correction.
- Saisir/modifier des présences, calculer les statistiques d'assiduité, détecter un abandon.

## Ce que contient cette partie

| Chapitre | Sujet |
|---|---|
| 10 | Les Groupes — paramètres, planning, tarification, duplication, cycle de vie, suppression |
| 11 | Les Préinscriptions — période, tableau de bord Professeur, transformation en groupes, expiration |
| 12 | Les Inscriptions — recherche, demande, vérifications auto, décision, paiement, changement de groupe |
| 13 | Les Séances — génération, immuabilité, séances exceptionnelles, statuts de présence |
| 14 | Gestion des présences — saisie, statuts, impact comptable, détection d'abandon, registre |

## Comment l'utiliser

1. Lis le fichier complet : [`docs/referentiel/03-partie-3-gestion-pedagogique.md`](../../../docs/referentiel/03-partie-3-gestion-pedagogique.md) (le plus volumineux après les annexes — c'est normal, c'est le domaine le plus riche en règles).
2. Chaque chapitre a une section **"Principe d'immuabilité"** ou équivalent (ex. séances réalisées, écritures comptables) — ne jamais concevoir un modèle de données qui permette de modifier librement une séance passée ou une présence déjà comptabilisée sans passer par les règles de correction définies.
3. Les impacts comptables des présences/inscriptions relèvent du domaine Comptable — croise avec `groupi-financier` (Chapitre 15, Moteur comptable) dès qu'une action pédagogique génère une écriture.
4. Les événements métier (`EVT-*`) émis par ce domaine sont consommés par Comptable, Communication et Pilotage (voir Chapitre 27, architecture par domaines) — pense à les documenter si tu ajoutes une action.
