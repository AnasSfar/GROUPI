---
name: groupi-regles-fonctionnelles
description: Charge les règles fonctionnelles transverses GROUPI — règles générales (historisation, archivage, traçabilité, verrouillage, confidentialité), règles de calcul (solde, taux d'assiduité, taux d'occupation...), architecture métier en domaines, workflows métier, et feuille de route produit. À utiliser pour toute décision d'architecture transverse, formule de calcul, ou question "cette règle s'applique-t-elle partout ?".
---

# GROUPI — Règles fonctionnelles (référentiel Partie V, Chapitres 24 à 30)

Charge ce skill avant de :
- Concevoir un mécanisme transverse : historisation, archivage, suppression, verrouillage de données, atomicité d'une opération, intégrité référentielle.
- Implémenter une **règle de calcul** précise : solde comptable, taux d'assiduité, taux d'occupation d'un groupe, score de complétude, chiffre d'affaires (prévisionnel/facturé/encaissé), comportement de paiement.
- Découper le code en modules/services : voir l'**architecture métier en 8 domaines** (Chapitre 27) — c'est la référence pour toute décision de structuration.
- Modéliser un workflow métier de bout en bout (Chapitre 28).
- Situer une fonctionnalité dans le temps : court/moyen/long terme, priorisation V2 (Chapitre 29, feuille de route).

## Ce que contient cette partie

| Chapitre | Sujet |
|---|---|
| 24 | Règles transversales — gestion du temps, année académique, historisation, archivage, traçabilité, verrouillage, confidentialité, atomicité |
| 25 | Règles de calcul — solde, taux d'assiduité, absences consécutives, taux d'occupation, CA prévisionnel/encaissé/facturé |
| 26 | Règles métier générales — unicité des comptes, séparation des responsabilités, immuabilité, protection des données |
| 27 | **Architecture métier** — les 8 domaines (Utilisateurs, Pédagogique, Comptable, Commercial, Communication, Pilotage, Référentiels, Administration), leurs dépendances |
| 28 | Workflows métier de bout en bout |
| 29 | Feuille de route et évolutions — court/moyen/long terme, GROUPI School, priorisation V2 |
| 30 | Conclusion |

## Comment l'utiliser

1. Lis le fichier complet : [`docs/referentiel/05-partie-5-regles-fonctionnelles.md`](../../../docs/referentiel/05-partie-5-regles-fonctionnelles.md).
2. **Avant toute décision de découpage en services/modules**, relis le Chapitre 27 en entier — c'est la carte officielle des frontières de domaine, avec la règle "chaque donnée a un domaine propriétaire unique, les autres domaines ne peuvent jamais la modifier directement".
3. Pour une formule de calcul exacte (ex. taux d'assiduité, score de complétude), le Chapitre 25 donne la définition normative — ne pas improviser une formule différente.
4. Le Chapitre 29 (roadmap) sert à savoir si une fonctionnalité demandée est bien prévue en V1 ou si elle relève d'une V2/évolution future — utile pour cadrer le scope avant de coder.
