import { toggleTheme, useTheme } from '../hooks/useTheme';
import { IconMoon, IconSun } from './icons';

interface ThemeToggleProps {
  /** `floating` : bouton flottant autonome (pages hors chrome applicatif). Défaut : intégré. */
  variant?: 'inline' | 'floating';
}

/**
 * Bascule clair / sombre. Le thème est un choix explicite mémorisé sur l'appareil — l'app démarre
 * toujours en clair, jamais sur le réglage système (voir utils/theme.ts).
 */
export function ThemeToggle({ variant = 'inline' }: ThemeToggleProps) {
  const theme = useTheme();
  const nextIsDark = theme === 'light';
  const label = nextIsDark ? 'Passer en thème sombre' : 'Passer en thème clair';

  return (
    <button
      type="button"
      className={'theme-toggle' + (variant === 'floating' ? ' theme-toggle-floating' : '')}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      aria-pressed={theme === 'dark'}
    >
      {nextIsDark ? <IconMoon width={16} height={16} /> : <IconSun width={16} height={16} />}
    </button>
  );
}
