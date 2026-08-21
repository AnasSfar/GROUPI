# Instructions navigation GROUPI

Ce document decrit la navigation actuelle de GROUPI. Respecte la structure existante: ne cree pas une nouvelle navigation sans demande explicite.

## Fichiers importants

- Routes: `apps/web/src/App.tsx`
- Layout connecte: `apps/web/src/components/AppLayout.tsx`
- Styles navigation: `apps/web/src/index.css`
- Icones: `apps/web/src/components/icons.tsx`
- Protections: `apps/web/src/components/ProtectedRoute.tsx`

## Principe general

Il y a deux navigations:

- publique: landing, connexion, inscription, verification, mot de passe oublie;
- connectee: `AppLayout` avec dock bas centre + barre de contexte.

Toutes les pages connectees doivent passer par:

```tsx
<ProtectedRoute>
  <AppLayout />
</ProtectedRoute>
```

La navigation principale connectee est le dock bas centre. N'ajoute pas de sidebar, de deuxieme dock ou de topbar de navigation longue sans demande explicite.

## Routes publiques

Routes sans authentification:

- `/`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/verify-email`
- `/verify-phone`
- `/admin-invitation`

La route fallback `*` redirige vers `/`.

## Routes connectees communes

Routes disponibles aux utilisateurs connectes:

- `/dashboard`
- `/notifications`
- `/account`

`/account` et `/teacher/profile` ne sont pas des entrees du dock. Ils sont accessibles depuis le menu profil ouvert par l'avatar dans la barre de contexte.
`/notifications` n'est pas une entree du dock non plus: le lien et le compteur sont dans la barre de contexte.

## Routes professeur

Ces routes doivent rester protegees par `roles={['TEACHER']}`:

- `/teacher/profile`
- `/teacher/groups`
- `/teacher/students`
- `/teacher/groups/:groupId/sessions`
- `/teacher/groups/:groupId/students`
- `/teacher/groups/:groupId/announcements`
- `/teacher/sessions`
- `/teacher/sessions/:sessionId/attendance`
- `/teacher/sessions/:sessionId/payments`
- `/teacher/enrollments`
- `/teacher/pre-enrollments`
- `/teacher/accounting`
- `/teacher/subscription`
- `/teacher/exports`

Les routes avec `:groupId` ou `:sessionId` sont des routes de detail ou de workflow. Ne les ajoute pas comme items principaux de sidebar.

## Routes parent

Ces routes doivent rester protegees par `roles={['PARENT']}`:

- `/parent/children`
- `/parent/children/:studentId/situation`
- `/parent/children/:studentId/attendance`
- `/parent/children/:studentId/accounting`
- `/parent/groups`
- `/parent/enrollments`
- `/parent/pre-enrollments`
- `/parent/school-requests`
- `/parent/exports`

Les routes enfant detaillees restent accessibles depuis les fiches enfant, pas depuis la sidebar.

## Routes administration

Ces routes doivent rester protegees par `roles={['SUPER_ADMIN', 'ADMIN']}`:

- `/admin/users`
- `/admin/school-situations`
- `/admin/school-requests`
- `/admin/academic-years`
- `/admin/referentials`
- `/admin/subscriptions`
- `/admin/exports`

N'affiche pas les routes admin aux autres roles. La protection doit rester dans `App.tsx`, pas seulement dans l'affichage conditionnel de la sidebar.

## Dock principal

Le dock est dans `AppLayout.tsx` via les classes historiques `.app-sidebar*`, restylees en dock bas centre dans `index.css`:

```tsx
<nav className="app-sidebar-nav" aria-label="Navigation principale">
```

Chaque item doit etre un `NavLink`:

```tsx
<NavLink
  to={item.to}
  title={item.label}
  className={({ isActive }) => 'app-sidebar-link' + (isActive ? ' active' : '')}
>
```

Regles:

- le logo reste le premier element a gauche du dock et renvoie vers `/dashboard`;
- utilise toujours `NavLink` pour les pages principales;
- garde les labels courts;
- mets toujours une icone;
- mets toujours `title={item.label}`;
- n'ajoute pas les pages de detail dans le dock;
- n'utilise pas un bouton pour naviguer vers une page principale;
- ne duplique pas une route dans plusieurs sections visibles pour le meme role;
- garde les sections par domaine metier.

## Sections actuelles

### Accueil

Toujours present:

```tsx
[
  { to: '/dashboard', label: 'Tableau de bord' },
]
```

Les notifications restent accessibles par le bouton compact en haut a droite.

### Professeur

Ordre actuel:

```tsx
[
  { to: '/teacher/groups', label: 'Mes groupes' },
  { to: '/teacher/students', label: 'Mes eleves' },
  { to: '/teacher/sessions', label: 'Mes seances' },
  { to: '/teacher/enrollments', label: 'Inscriptions' },
  { to: '/teacher/accounting', label: 'Paiements' },
  { to: '/teacher/subscription', label: 'Abonnement' },
  { to: '/teacher/pre-enrollments', label: 'Preinscriptions' },
  { to: '/teacher/exports', label: 'Exports' },
]
```

### Parent

Ordre actuel:

```tsx
[
  { to: '/parent/children', label: 'Mes enfants' },
  { to: '/parent/groups', label: 'Rechercher un groupe' },
  { to: '/parent/enrollments', label: 'Mes inscriptions' },
  { to: '/parent/pre-enrollments', label: 'Mes preinscriptions' },
  { to: '/parent/exports', label: 'Exports' },
  { to: '/parent/school-requests', label: 'Etablissements' },
]
```

### Administration

Ordre actuel:

```tsx
[
  { to: '/admin/users', label: 'Comptes utilisateurs' },
  { to: '/admin/school-situations', label: 'Situations scolaires' },
  { to: '/admin/school-requests', label: "Demandes d'etablissement" },
  { to: '/admin/academic-years', label: 'Annees academiques' },
  { to: '/admin/referentials', label: 'Referentiels' },
  { to: '/admin/subscriptions', label: 'Abonnements' },
  { to: '/admin/exports', label: 'Exports' },
]
```

## Ajouter une nouvelle page principale

Quand tu ajoutes une page principale:

1. Ajoute la page lazy dans `App.tsx`.
2. Ajoute la route sous le `AppLayout`.
3. Protege-la avec le bon `ProtectedRoute`.
4. Ajoute l'item dans la bonne section de `AppLayout.tsx`.
5. Choisis une icone existante dans `components/icons.tsx`.
6. Si l'icone n'existe pas, ajoute-la dans `icons.tsx` en suivant le style existant.
7. Verifie que le dock reste centre, scrollable et lisible sur mobile.

Pattern:

```tsx
{ to: '/example', icon: <IconExample />, label: 'Exemple' }
```

Un badge doit signaler quelque chose a traiter, pas decorer. Aujourd'hui, le badge de notifications vit dans la barre de contexte, pas dans le dock.

## Barre de contexte

La barre de contexte est `.workspace-bar`.

Elle contient:

- bouton profil avec avatar ou initiales;
- identifiant du compte;
- lien compact vers les notifications.
- menu profil avec `Profil` et `Se deconnecter`.

Regles:

- ne mets pas de navigation secondaire longue dans `.workspace-bar`;
- le profil se trouve dans le menu avatar, jamais dans le dock;
- les notifications se trouvent dans la barre de contexte, jamais dans le dock;
- les actions doivent rester compactes;
- les labels secondaires peuvent disparaitre sur mobile;
- les boutons ou liens icon-only doivent avoir un `aria-label` ou un texte accessible.

## Etat actif

L'etat actif du dock est `.app-sidebar-link.active`.

Il doit rester:

- fond `var(--accent-bg)`;
- texte `var(--accent)`;
- icone en `currentColor`.

Ne remplace pas ce style par des conditions locales dans les pages.

## Responsive

A respecter:

- le dock est fixe en bas et centre;
- il scrolle horizontalement si les items sont trop nombreux;
- les labels restent disponibles via `title`;
- sous `480px`, les labels visibles disparaissent pour garder des cibles compactes;
- `.workspace-email` disparait sous `640px`;
- les tableaux et pages denses gerent leur propre mobile dans `index.css`;
- le contenu principal reste accessible via le skip link `#main-content`.

## Accessibilite

Patterns a conserver:

- `aria-label="Navigation principale"` sur le `nav`;
- `title={item.label}` sur chaque lien du dock;
- menu profil accessible depuis l'avatar;
- `.skip-link` vers `#main-content`;
- `main id="main-content" tabIndex={-1}`.

## A eviter

- Ajouter une page de detail dans le dock.
- Ajouter une route parent dans la section professeur.
- Ajouter une route professeur dans la section parent.
- Afficher une route admin a un non-admin.
- Creer une sidebar ou une deuxieme navigation globale.
- Mettre des actions contextuelles de page dans le dock.
- Utiliser un label long.
- Ajouter une entree sans icone.
- Protegere une page uniquement par affichage conditionnel.
