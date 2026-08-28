import { useSyncExternalStore } from 'react';
import {
  applyTheme,
  readStoredTheme,
  storeTheme,
  type ThemeChoice,
} from '../utils/theme';

// Petit store maison partagé : plusieurs <ThemeToggle> (barre d'espace de travail, landing...)
// restent synchronisés, et un changement dans un autre onglet est répercuté via l'événement
// `storage`.
let current: ThemeChoice = readStoredTheme();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== 'groupi:theme') return;
    const next = readStoredTheme();
    if (next === current) return;
    current = next;
    applyTheme(current);
    emit();
  });
}

export function setTheme(theme: ThemeChoice) {
  if (theme === current) return;
  current = theme;
  applyTheme(theme);
  storeTheme(theme);
  emit();
}

export function toggleTheme() {
  setTheme(current === 'dark' ? 'light' : 'dark');
}

export function useTheme(): ThemeChoice {
  return useSyncExternalStore(subscribe, () => current, () => current);
}
