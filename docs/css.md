# Charte CSS et design GROUPI

Ce document resume les choix de design actuels de GROUPI et les regles a suivre quand on ajoute ou modifie du CSS. Le fichier source principal est `apps/web/src/index.css`.

## Direction visuelle

GROUPI est une application de gestion pedagogique et administrative. L'interface doit rester claire, dense et efficace:

- shell clair avec fond legerement gris;
- surfaces blanches ou sombres via variables;
- navigation laterale bleu marine stable;
- barre de contexte sticky en haut du contenu;
- cartes, tableaux, formulaires et modales sobres;
- accent principal navy pour les actions;
- accent secondaire teal pour les liens, icones informatives et tuiles;
- mode sombre via variables CSS et `prefers-color-scheme`.

Eviter les effets decoratifs gratuits, les gradients trop visibles dans l'app connectee, les grosses compositions marketing et les palettes monotones. La landing publique peut etre plus expressive, mais elle doit conserver les tokens globaux.

## Tokens principaux

Les couleurs, rayons, polices, focus et ombres passent par des variables dans `:root`.

### Couleurs de marque

```css
--brand-navy: #0e3a5c;
--brand-navy-hover: #0a2c46;
--brand-navy-soft: #e8eef3;
--brand-slate: #6b7880;
--sidebar-bg: #0e3a5c;
```

`--sidebar-bg` reste volontairement sombre dans les deux themes. Ne pas utiliser `--brand-navy` pour les grands aplats de sidebar ou couverture.

### Couleurs UI

```css
--text: #47535e;
--text-muted: #6b7880;
--text-h: #0f2438;
--text-on-accent: #ffffff;

--bg: #ffffff;
--bg-shell: #f6f7f9;
--surface: #ffffff;
--surface-muted: #f9fafb;

--border: #e3e7eb;
--border-strong: #cfd6dc;
--code-bg: #f1f3f5;
```

Ne pas mettre de couleurs en dur dans les vues connectees. Preferer les variables, sauf pour un visuel ponctuel de landing ou un asset.

### Accents

```css
--accent: var(--brand-navy);
--accent-hover: var(--brand-navy-hover);
--accent-bg: var(--brand-navy-soft);
--accent-border: #b9cbda;

--link: #0f7a8c;
--link-bg: #e3f2f4;
--link-border: #b8dfe5;
```

Utiliser `--accent` pour les CTA et actions principales. Utiliser `--link` pour les liens, icones informatives, raccourcis et elements de lecture secondaire.

### Couleurs semantiques

```css
--success: #1a7d4a;
--success-bg: #e5f5ec;
--danger: #c0392b;
--danger-bg: #fbeae8;
--warning: #b8720a;
--warning-bg: #fdf1de;
--info: #1f5f8b;
--info-bg: #e7eef3;
```

Utiliser ces tons pour les badges, alertes, etats de presence, paiements, erreurs et confirmations.

### Rayons, focus et ombres

```css
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 16px;
--radius-pill: 999px;
--focus-ring: 0 0 0 3px var(--accent-bg);

--shadow-sm: 0 1px 2px rgba(15, 36, 56, 0.04);
--shadow-md: 0 8px 24px rgba(15, 36, 56, 0.08), 0 2px 6px rgba(15, 36, 56, 0.05);
--shadow-lg: 0 14px 34px rgba(15, 36, 56, 0.12), 0 4px 12px rgba(15, 36, 56, 0.08);
--shadow-accent: 0 12px 28px -12px color-mix(in srgb, var(--accent) 60%, transparent);
```

Regle generale:

- `6px` pour champs, boutons denses et petites icones;
- `10px` pour cartes, tableaux et sections;
- `16px` pour modales et grands conteneurs;
- `pill` pour badges, jauges, pastilles et notifications.

## Typographie

```css
--sans: 'Inter', system-ui, 'Segoe UI', Roboto, sans-serif;
--heading: var(--sans);
--mono: ui-monospace, Consolas, monospace;
```

Base: `16px / 155%`. Les vues denses utilisent souvent `13px` a `14px`. Les titres restent sobres:

- `h1`: 26px, titre de page;
- `h2`: 17px, titre de section;
- `h3`: 14px uppercase pour sous-sections.

## Layout app

Classes principales:

- `.app-shell`: conteneur horizontal pleine hauteur;
- `.app-sidebar`: navigation laterale sticky;
- `.app-sidebar-link`: lien de navigation par role;
- `.app-main`: zone de contenu;
- `.workspace-bar`: barre de contexte sticky;
- `.app-main-inner`: contenu centre, max `1180px`.

Sur tablette, la sidebar passe en rail d'icones. Sur mobile, reduire les labels longs et verifier que les actions restent tactiles.

## Composants communs

### Pages

Utiliser:

- `.page-header` pour titre, sous-texte et actions;
- `.page-actions` pour les actions de page;
- `.page-center` pour les pages centrees.

### Cartes et sections

Utiliser:

- `.card-section` pour les sections de formulaire ou detail;
- `.card-grid` pour les grilles;
- `.dash-card` pour les tuiles de dashboard;
- `.stat-tiles` / `.stat-tile` pour les statistiques.

Les cartes doivent rester compactes: fond `--surface`, bordure `--border`, rayon `--radius-md`, ombre legere seulement si utile.

### Boutons

Le style global `button` evite les boutons navigateur par defaut. Variantes:

- action principale: `--accent`, texte `--text-on-accent`;
- `button.ghost`: action secondaire discrete;
- `button.danger`: action destructive;
- `.btn-primary`: lien stylise comme bouton principal.

Les boutons icon-only doivent avoir un `aria-label`, un `title` si l'icone n'est pas evidente, et une taille stable.

### Formulaires

Les champs utilisent `--border-strong`, `--bg`, `--text-h`, `--radius-sm` et `--focus-ring`. Reutiliser les patterns existants: `.auth-card`, `.card-section`, `.group-form`, `.search-input`, `.select`.

### Tableaux

Utiliser:

- `.table-wrap` pour le conteneur;
- `.admin-table` pour les tableaux denses;
- `data-label` sur chaque cellule mobile.

Sous `640px`, les lignes deviennent des cartes. Toujours verifier les noms longs, emails, titres et contenus RTL.

### Badges

Base: `.badge`.

Variantes:

- `.badge-neutral`;
- `.badge-success`;
- `.badge-danger`;
- `.badge-warning`;
- `.badge-info`.

Ne pas creer de badge avec une couleur ad hoc si une variante semantique suffit.

### Etats et toasts

Utiliser:

- `.loading-state`;
- `.empty-state`;
- `.loading-spinner`;
- `.toast-container`;
- `.toast`;
- `.toast-success`, `.toast-error`, `.toast-info`.

Les animations doivent rester courtes et respecter `prefers-reduced-motion`.

## Domaines UI specifiques

### Presence et calendriers

Les etats de presence utilisent les couleurs semantiques. Les calendriers hebdomadaires utilisent `.week-calendar-*`, avec `font-variant-numeric: tabular-nums` pour les heures et dates.

### Profil professeur

Le profil utilise `.profile-card`, `.profile-cover`, `.profile-avatar`, `.profile-grid`. La couverture passe par `--profile-cover-bg`; ne pas remettre un gradient en dur dans le bloc.

### Centre d'activites

Les notifications et activites utilisent `.activity-item`, `.activity-row`, `.nav-bell-badge`. Garder les lignes scannables et les dates discretes.

### Landing page

Les classes `.landing-*` peuvent etre plus expressives, mais elles doivent continuer a utiliser les tokens. La landing peut employer des gradients ou apercus produit, mais pas dans les vues connectees sans raison fonctionnelle.

## Responsive

Breakpoints frequents:

- `max-width: 880px`: sidebar en rail;
- `max-width: 860px`: grilles profil en une colonne;
- `max-width: 720px`: calendriers et sections compactes;
- `max-width: 640px`: tableaux en cartes;
- `max-width: 480px`: paddings reduits et composants pleine largeur.

Regles:

- utiliser `minmax(0, 1fr)` dans les grilles;
- utiliser `overflow-x: auto` pour tableaux et calendriers desktop;
- preferer `text-overflow: ellipsis` sur noms, emails et titres;
- eviter les textes longs dans les boutons mobiles;
- tester mentalement chaque fond, texte et bordure en mode sombre.

## Accessibilite

Patterns disponibles:

- `.sr-only`;
- `.skip-link`;
- `:focus-visible`;
- `aria-label` sur boutons icon-only;
- `aria-current` sur navigation active.

Ne jamais transmettre un statut uniquement par la couleur: ajouter un libelle, une icone ou un texte visible.

## Regles quand on ajoute du CSS

1. Chercher d'abord une classe existante dans `index.css`.
2. Utiliser les variables pour couleurs, rayons, ombres et focus.
3. Garder l'app dense et utilitaire.
4. Ajouter les styles pres du bloc correspondant.
5. Prevoir mobile pendant le codage.
6. Ne pas casser le mode sombre.
7. Ne pas ajouter une variante de bouton ou badge si une variante existe.
8. Pour les tableaux, privilegier lisibilite, ellipsis et `data-label`.
9. Pour les modales ou contenus denses, verifier le plein ecran mobile si necessaire.
10. Garder les commentaires CSS courts et utiles.

## Exemple recommande

```css
.new-panel {
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.new-panel-title {
  margin: 0 0 8px;
  color: var(--text-h);
  font-size: 17px;
  font-weight: 600;
}

.new-panel-copy {
  color: var(--text-muted);
  font-size: 13.5px;
  line-height: 1.5;
}

@media (max-width: 480px) {
  .new-panel {
    padding: 16px;
    border-radius: var(--radius-sm);
  }
}
```
