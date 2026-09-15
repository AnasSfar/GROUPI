import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

/**
 * Sur natif, quand l'app est ouverte via un lien (App Link https vérifié, ou schéma personnalisé
 * groupi://), Capacitor émet `appUrlOpen` avec l'URL complète au lieu de simplement naviguer la
 * WebView — on doit extraire le chemin et le donner à React Router nous-mêmes. Aucun effet sur le
 * web (où le navigateur gère déjà nativement la navigation par URL).
 */
export function DeepLinkListener() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handle = CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      try {
        const { pathname, search, hash } = new URL(url);
        navigate(`${pathname}${search}${hash}`);
      } catch {
        /* URL non standard — ignorée */
      }
    });

    return () => {
      handle.then((h) => h.remove());
    };
  }, [navigate]);

  return null;
}
