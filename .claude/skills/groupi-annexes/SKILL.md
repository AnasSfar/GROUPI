---
name: groupi-annexes
description: Recherche exhaustive dans les annexes du référentiel GROUPI — lexique métier, index de toutes les règles métier (RM-*), catalogue des règles de calcul (CAL-*), catalogue des KPI, catalogue des événements métier (EVT-*), catalogue des statuts, catalogue des notifications (NOT-*), matrice RBAC des autorisations, matrice CRUD, matrice des dépendances, catalogue des cas d'erreur (ERR-*) et cas limites, dictionnaire des objets métier. À utiliser pour vérifier/retrouver un code précis, une permission exacte, ou la définition d'un terme métier — plutôt que de deviner.
---

# GROUPI — Annexes de référence (référentiel Partie VI)

C'est le **fichier de lookup**, pas de lecture linéaire : il est volumineux (~10 000 lignes). Charge ce skill quand tu as besoin de vérifier un fait précis plutôt qu'une explication.

## Contenu (avec ce qu'on y cherche typiquement)

| Annexe | Contenu | Cas d'usage typique |
|---|---|---|
| A | Lexique métier — concepts métier, objets métier, indicateurs, concepts techniques | Vérifier la définition exacte d'un terme avant de nommer une entité |
| B | Index de toutes les règles métier (`RM-*`) | Vérifier qu'un code `RM-XXX-NNN` n'est pas déjà pris, ou retrouver une règle par domaine |
| C | Catalogue des règles de calcul (`CAL-*`) | Retrouver la formule normative d'un indicateur |
| D | Catalogue des indicateurs KPI et tableaux de bord | Savoir quels KPI afficher sur un dashboard donné |
| E | Catalogue des calculs techniques et analytiques | Calculs internes non exposés en KPI |
| F | Catalogue des événements métier (`EVT-*`) | Lister tous les événements qu'un domaine doit émettre/consommer |
| G | Catalogue des statuts | Vérifier le nom exact et les transitions d'une énumération de statut |
| H | Catalogue des notifications (`NOT-*`) | Retrouver le déclencheur/contenu exact d'une notification |
| I | **Matrice des autorisations (RBAC)** | Vérifier précisément ce que peut faire chaque rôle sur chaque ressource |
| J | Matrice CRUD | Qui peut Créer/Lire/Modifier/Supprimer quel objet métier |
| K | Matrice des dépendances fonctionnelles | Comprendre ce qui casse si on modifie une fonctionnalité |
| L | Matrice de traçabilité | Lien entre exigences et objets métier |
| M | Catalogue des cas d'erreur (`ERR-*`) | Retrouver le code et le comportement attendu d'une erreur |
| N | Catalogue des cas limites (edge cases) | Vérifier qu'un cas limite est déjà couvert avant d'improviser |
| O | Diagrammes | Support visuel |
| P | Dictionnaire des objets métier | Structure/attributs détaillés d'un objet métier |

## Comment l'utiliser

1. Le fichier complet est [`docs/referentiel/06-partie-6-annexes.md`](../../../docs/referentiel/06-partie-6-annexes.md).
2. **Ne le lis jamais en entier.** Utilise Grep dessus avec le code ou le terme recherché, par exemple :
   - `RM-GRP` pour toutes les règles métier du domaine Groupe
   - `ERR-INS` pour les erreurs du domaine Inscription
   - `Annexe I` pour sauter directement à la matrice RBAC
3. Si tu cherches une règle liée à un domaine fonctionnel précis (pédagogique, financier...), regarde d'abord le chapitre correspondant dans les parties II à V — les annexes sont des catalogues consolidés, pas la source narrative des règles.
