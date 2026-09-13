# Bugs connus

Bugs identifiés mais pas encore corrigés (ou dont la cause exacte vaut la peine d'être gardée en
mémoire pour éviter de la re-découvrir de zéro). Cocher/supprimer une fois corrigé.

## [ ] Popup du composant `Select` : la correction anti-débordement est écrasée par le scroll listener

**Composant** : [`apps/web/src/components/Select.tsx`](apps/web/src/components/Select.tsx)

**Symptôme** : sur un écran étroit (mobile), la liste déroulante d'un `<Select searchable>` dont le
texte le plus long dépasse la largeur du bouton déclencheur (ex. "Niveau scolaire" avec des options
comme « 2ème année secondaire - Technologies de l'informatique ») s'ouvre en débordant du viewport à
droite — visible sur `InvitationAcceptPage` (page publique d'invitation Parent) une fois le champ
"Niveau scolaire" passé du `<select>` natif au composant `Select` maison.

**Cause exacte (confirmée par instrumentation console + Playwright headless, 2026-09-14)** :

Il y a deux `useLayoutEffect` qui se marchent dessus dans `Select.tsx` :

1. Lignes ~124-138 : calcule `{ top, left, width }` à partir du **rect du bouton déclencheur
   uniquement** (`triggerRef`), à l'ouverture, puis à chaque `resize`/`scroll` (listener `window`
   posé en phase de capture, donc déclenché par N'IMPORTE QUEL scroll, y compris interne à la page).
2. Lignes ~143-151 : une fois la popup rendue (donc sa largeur réelle `max-content` connue, capée à
   `min(360px, 90vw)` en CSS), recale `left` si la popup déborde à droite du viewport.

Séquence observée en pratique (log réel) :
```
updatePosition          -> left=61, width=238   (position brute du trigger)
overflow-correction #1  -> rect encore à left=0 (avant le re-render) -> pas de débordement détecté
overflow-correction #2  -> rect réel left=61,width=324 -> overflowRight=33 -> corrige left
updatePosition (rappel) -> left=61, width=238   (ÉCRASE la correction précédente !)
```

Le 2ème `updatePosition` est déclenché par le listener `scroll` (capture) : quand le `Select` est
`searchable`, il fait `searchInputRef.current?.focus()` à l'ouverture ([ligne ~168-170]), et ce focus
programmatique provoque un scroll (mise au point de l'élément dans la fenêtre), qui remonte via
capture au listener `window.addEventListener('scroll', updatePosition, true)`. `updatePosition` ne
connaît que la position du trigger, pas le débordement de la popup — il réapplique donc `left=61`
et annule la correction faite juste avant. Résultat : la popup reste mal positionnée et déborde.

**Pourquoi "réapparu"** : ce bug existe dans `Select.tsx` depuis longtemps mais ne se déclenchait pas
sur "Niveau scolaire" tant que ce champ utilisait un `<select>` HTML natif (pas de popup maison). Il
est réapparu au moment où ce champ est passé à `<Select searchable>` (pour remplacer le `<select>`
natif qui, lui, causait un autre bug de débordement — voir historique de conversation) : c'est
précisément l'ajout de `searchable` (donc du `.focus()` sur le champ de recherche) qui déclenche le
scroll parasite.

**Piste de correction (pas encore appliquée)** :
- Le plus simple : dans l'effet de correction (#2), ne pas se contenter de corriger `left` — faire en
  sorte que le recalcul brut de `updatePosition` (#1) ne puisse jamais écraser une correction déjà
  appliquée pour la MÊME ouverture. Par exemple, fusionner les deux effets en un seul qui, après
  chaque `updatePosition`, réapplique immédiatement la correction anti-débordement (au lieu de deux
  effets indépendants qui peuvent s'exécuter dans le désordre suite à un scroll).
- Alternative : ne pas focaliser automatiquement `searchInputRef` avant que la position finale
  (post-correction) soit stabilisée, ou supprimer le `capture: true` bien trop large du listener
  `scroll` (il ne devrait écouter que le scroll d'ancêtres réels du trigger, pas tout scroll de la
  page).

**Comment reproduire** :
1. Ouvrir `/invitation/:token` sur un viewport ≤ 375px de large.
2. Ouvrir un `<Select searchable>` dont la plus longue option ne tient pas à côté du trigger (ex.
   "Niveau scolaire").
3. Observer que la popup déborde à droite de l'écran malgré la logique de recalage.
