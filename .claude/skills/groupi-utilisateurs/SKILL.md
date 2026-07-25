---
name: groupi-utilisateurs
description: Charge les règles de gestion des utilisateurs GROUPI — profil Professeur, profil Parent, situation scolaire de l'élève, cycle de vie des comptes (validation/suspension/désactivation), authentification, sessions et sécurité. À utiliser pour tout travail sur inscription/connexion, profils, validation de compte par un admin, mot de passe, sessions, ou 2FA.
---

# GROUPI — Gestion des utilisateurs (référentiel Partie II, Chapitres 5 à 9)

Charge ce skill avant de :
- Construire ou modifier le profil Professeur ou Parent (champs obligatoires, score de complétude, visibilité).
- Gérer la situation scolaire d'un élève (établissement, niveau, historique).
- Implémenter le cycle de vie d'un compte : validation par un Administrateur, suspension, désactivation, demande de suppression.
- Toucher à l'authentification : mots de passe, mot de passe oublié, première connexion, sessions, détection de connexions inhabituelles, verrouillage de compte, 2FA (V2).

## Ce que contient cette partie

| Chapitre | Sujet |
|---|---|
| 5 | Profil Professeur — infos obligatoires, vérification matières/niveaux, score de complétude, visibilité |
| 6 | Profil Parent — création de compte, gestion des enfants, confidentialité |
| 7 | Situation scolaire — infos, évolution, historique, mise à jour en début d'année académique |
| 8 | Cycle de vie des comptes — validation Professeur/Parent, suspension, désactivation, suppression, archivage |
| 9 | Authentification, sessions, sécurité — mots de passe, sessions, détection d'anomalies, 2FA (V2), verrouillage |

## Comment l'utiliser

1. Lis le fichier complet pour cette partie : [`docs/referentiel/02-partie-2-gestion-utilisateurs.md`](../../../docs/referentiel/02-partie-2-gestion-utilisateurs.md). C'est un chapitre dense en règles métier (RM-*), garde-le ouvert pendant l'implémentation plutôt que de résumer de mémoire.
2. Croise avec `groupi-cadre-general` pour les états de compte (`PENDING_VALIDATION`, `ACTIVE`, `SUSPENDED`, `DISABLED`, `ARCHIVED`) et les rôles définis au Chapitre 3.
3. Pour les codes d'erreur (`ERR-*`) et événements (`EVT-*`) précis liés à l'authentification, ils sont listés en fin de chaque section du chapitre 9 — pas besoin d'aller chercher dans les annexes pour ce domaine.
