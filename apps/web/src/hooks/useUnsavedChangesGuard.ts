import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Bloque la sortie de page (fermeture d'onglet, rechargement, clic sur un lien interne — nav
 * latérale comprise) tant que `active` est vrai, et demande confirmation via `confirmLeave`
 * avant de laisser passer un clic sur un lien interne. `react-router-dom` v7 n'expose
 * `useBlocker` qu'avec un data router (`createBrowserRouter`) ; l'app utilise `<BrowserRouter>`,
 * d'où cette interception manuelle des clics plutôt qu'un blocage natif du router.
 */
export function useUnsavedChangesGuard(active: boolean, confirmLeave: () => Promise<boolean>) {
  const navigate = useNavigate();
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!activeRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!activeRef.current) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;
      const url = new URL(anchor.href, window.location.origin);
      if (url.origin !== window.location.origin) return;

      e.preventDefault();
      e.stopImmediatePropagation();
      confirmLeave().then((ok) => {
        if (ok) {
          activeRef.current = false;
          navigate(url.pathname + url.search + url.hash);
        }
      });
    }
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [navigate, confirmLeave]);
}
