---
name: groupi-design
description: Direction artistique du frontend GROUPI ("Atelier Clair") — palette, typographie, mise en page (nav latérale), composants (cartes, tableaux, badges, tuiles KPI, boutons). À charger avant tout travail visuel sur apps/web (nouvel écran, nouveau composant, refonte de page) pour rester cohérent avec le reste de l'application plutôt que d'inventer un style ad hoc par page.
---

# GROUPI — Direction artistique "Atelier Clair"

Choisie le 2026-07-27 parmi 3 pistes proposées (Atelier Clair / Chaleureux / Terminal Pro) pour répondre à un retour utilisateur explicite : le frontend existant était fonctionnel mais "moche, pas attirant, pas organisé". Le point le plus faible identifié était l'absence de hiérarchie de navigation (un simple bandeau du haut) plutôt que la palette elle-même, qui était déjà correcte.

**Principe directeur** : évolution sobre du système existant, pas une révolution. On garde le bleu marine/gris ardoise extraits du logo GROUPI comme ancrage de marque, on introduit un seul accent secondaire (turquoise) dérivé du bleu marine pour les éléments interactifs/informatifs, et on résout l'organisation par la mise en page (navigation latérale) plutôt que par plus de couleur.

Source de vérité technique : `apps/web/src/index.css` (tokens `:root` + composants partagés) et `apps/web/src/components/AppLayout.tsx` (ossature nav latérale). Ce document explique les *intentions* derrière ces fichiers — en cas de divergence, le code a raison, mais devrait être corrigé pour recoller à ce document plutôt que l'inverse.

## Palette

Tokens CSS déjà définis dans `index.css` (`:root` pour le clair, `@media (prefers-color-scheme: dark)` pour le sombre — jamais de couleur en dur dans un composant, toujours `var(--token)`).

| Rôle | Token | Clair | Sombre |
|---|---|---|---|
| Marque primaire (nav, CTA primaire) | `--brand-navy` | `#0e3a5c` | `#6fa8d6` |
| Marque secondaire | `--brand-slate` | `#6b7880` | `#93a1ab` |
| Accent interactif (liens, icônes de mise en avant, focus) | `--link` | `#0f7a8c` (turquoise, dérivé du navy) | `#3fb6c4` |
| Fond de page | `--bg-shell` | `#f6f7f9` | `#0b1119` |
| Surface (cartes, tableaux) | `--surface` | `#ffffff` | `#151e29` |
| Bordure | `--border` / `--border-strong` | `#e3e7eb` / `#cfd6dc` | `#263140` / `#34404d` |
| Texte courant / atténué / titres | `--text` / `--text-muted` / `--text-h` | `#47535e` / `#6b7880` / `#0f2438` | `#c2cbd3` / `#8b98a3` / `#f1f5f9` |
| Succès / Danger / Avertissement / Info | `--success` `--danger` `--warning` `--info` (+ `-bg`) | voir `index.css` | idem, variantes sombres déjà définies |

Règles :
- Le bleu marine (`--accent`, alias de `--brand-navy`) reste la couleur des **actions primaires** (bouton principal, nav active, focus ring des formulaires) — ne pas le remplacer par le turquoise.
- Le turquoise (`--link`) est réservé aux **éléments secondaires informatifs** : icônes de tuiles KPI, liens "Voir tout →", petits accents. Ne jamais l'utiliser pour un bouton primaire ni pour du texte de statut (les statuts utilisent toujours success/danger/warning/info, jamais l'accent de marque).
- Une seule couleur d'accent "de marque" visible à la fois dans une zone donnée — ne pas mélanger navy et turquoise sur le même élément.
- Toujours vérifier le rendu en sombre : les deux thèmes sont définis dans `index.css`, jamais un seul.

## Typographie

- Police unique pour tout le monde (pas de display face séparée) : `Inter`, repli `system-ui`/`Segoe UI`/Roboto — cohérent avec l'existant, ne pas ajouter de nouvelle police.
- Titres (`h1`/`h2`/`h3`) : poids 600, `letter-spacing: -0.01em`, couleur `--text-h`. `h1` = 22-26px, `h2` = 15-17px (titre de section de carte), `h3` = 13-14px en majuscules avec `letter-spacing` (label de sous-section).
- Chiffres alignés en colonne (montants, occupations de groupe, indicateurs) : toujours `font-variant-numeric: tabular-nums`.
- Labels de badges/étiquettes : majuscules avec `letter-spacing: 0.03-0.04em` uniquement pour les en-têtes de tableau et les labels de tuile KPI — jamais pour du texte courant ou des titres de carte.

## Mise en page

**Navigation latérale, pas un bandeau du haut.** `AppLayout.tsx` définit l'ossature commune à toutes les pages authentifiées :
- Colonne latérale fixe (`--sidebar-width: 232px`) : logo GROUPI en tête, liste de liens de navigation adaptée au rôle (Professeur/Parent/Admin/Super Admin — voir `NAV_ITEMS` dans `AppLayout.tsx`), identité utilisateur + déconnexion en pied de colonne.
- Le contenu (`<Outlet/>`) occupe le reste de la largeur ; chaque page garde son propre `page-header` (titre + description) en haut de son contenu, inchangé.
- Sous ~880px de large, la colonne latérale se réduit à une bande d'icônes (labels masqués) plutôt que de disparaître — pas de tiroir mobile pour l'instant (V1, comme le reste du projet qui reste pragmatique plutôt que de sur-construire).

**Pourquoi ce choix** : avec 25+ écrans (Ch.5 à Ch.22), un simple lien "retour au tableau de bord" ne suffit plus à s'orienter. La nav latérale rend la structure de l'app (par rôle, par domaine) visible en permanence au lieu d'être reconstituée mentalement à chaque page.

## Composants partagés (ne pas dupliquer, réutiliser)

Ces classes existent déjà dans `index.css` et sont utilisées par la quasi-totalité des ~30 pages. Toute nouvelle page doit les réutiliser plutôt qu'inventer un style local :

- **`.card-section`** — bloc de contenu générique (formulaire, section de détail). Bordure fine + ombre très légère, pas de bordure épaisse.
- **`.table-wrap` + `.admin-table`** — tableau de données. En-têtes en majuscules atténuées sur fond `--bg-shell`, lignes séparées par `--border`, survol léger.
- **`.stat-tile`** (dans `.card-grid.stat-grid` ou `.stat-tiles`) — tuile KPI (chiffre + label). Valeur en gros caractère tabulaire, label en majuscules atténuées.
- **`.badge` + `.badge-success/-danger/-warning/-info/-neutral`** — statut. Toujours une couleur sémantique, jamais la couleur de marque.
- **`.dash-card`** — carte cliquable avec icône (grille "Accès rapide" du tableau de bord). Icône dans un chip `--link`-teinté (`.dash-card-icon`), pas navy.
- **`.alert-banner`** — bandeau d'avertissement inline (ex. profil incomplet, alerte d'abandon).
- **Boutons** : primaire = fond `--accent` (navy) ; `.ghost` = transparent, bordure au survol ; `.danger` = bordure/texte `--danger`. Toujours `border-radius: var(--radius-sm)`.

## À éviter

- Ne pas ajouter de couleur "juste pour faire joli" sur un badge de statut — la couleur porte toujours un sens (succès/danger/avertissement/info), jamais décorative.
- Ne pas dupliquer `.card-section`/`.table-wrap`/`.badge` avec un style légèrement différent dans une page spécifique — si un besoin ne rentre pas dans le système existant, l'étendre dans `index.css` (nouvelle variante de classe), pas le contourner localement avec du CSS inline.
- Ne pas utiliser d'ombre portée marquée (`box-shadow` lourde) — la direction "Atelier Clair" préfère les bordures fines aux ombres, sauf pour les éléments réellement flottants (menus, modales).
- Ne pas introduire de nouvelle police ni de nouvelle couleur de marque sans repasser par ce document.
