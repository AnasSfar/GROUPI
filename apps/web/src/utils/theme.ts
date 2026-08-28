// Thème clair / sombre — choix explicite de l'utilisateur, jamais le réglage système.
//
// Le thème par défaut est TOUJOURS clair (identité produit « Atelier Clair », skill groupi-design) :
// on n'applique donc pas `prefers-color-scheme` automatiquement. L'utilisateur peut basculer
// manuellement via <ThemeToggle> et son choix est mémorisé sur l'appareil.

export type ThemeChoice = 'light' | 'dark';

const STORAGE_KEY = 'groupi:theme';
export const DEFAULT_THEME: ThemeChoice = 'light';

export function readStoredTheme(): ThemeChoice {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'dark' || raw === 'light' ? raw : DEFAULT_THEME;
  } catch {
    // Stockage indisponible (navigation privée, cookies bloqués...) — on retombe sur le défaut.
    return DEFAULT_THEME;
  }
}

export function storeTheme(theme: ThemeChoice): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Non bloquant : le thème reste appliqué pour la session en cours.
  }
}

/** Reflète le thème sur <html data-theme> — seule source lue par le CSS (voir index.css). */
export function applyTheme(theme: ThemeChoice): void {
  document.documentElement.dataset.theme = theme;
}

/** À appeler une fois au démarrage, avant le premier rendu, pour éviter un flash de thème. */
export function initTheme(): ThemeChoice {
  const theme = readStoredTheme();
  applyTheme(theme);
  return theme;
}
