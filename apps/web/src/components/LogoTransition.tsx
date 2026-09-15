import { useEffect, useState } from 'react';

interface LogoTransitionProps {
  message: string;
  subMessage?: string;
  /** true juste avant le démontage (navigation) : fait disparaître l'écran en fondu au lieu de
   *  le laisser être coupé net par le changement de route. */
  leaving?: boolean;
}

/**
 * Overlay plein écran (position: fixed) affiché PAR-DESSUS l'écran encore présent (formulaire de
 * connexion, tableau de bord...) au lieu de remplacer tout l'arbre React. Le premier essai
 * remplaçait la page entière par cet écran via un `return` conditionnel : la page précédente
 * disparaissait alors instantanément dès le changement d'état (React démonte l'ancien arbre et
 * monte le nouveau dans le même rendu), donnant un "boom" sec malgré le fondu appliqué à l'écran
 * qui apparaissait. En overlay fixe, l'ancienne page reste montée et visible dessous pendant tout
 * le fondu d'entrée/sortie : le changement se fait en vrai fondu enchaîné, pas en coupure nette.
 *
 * Le logo GROUPI apparaît puis glisse doucement vers le haut avant qu'un message ne s'affiche en
 * dessous. Réutilisé après connexion et déconnexion pour une transition de marque cohérente.
 */
export function LogoTransition({ message, subMessage, leaving }: LogoTransitionProps) {
  const [mounted, setMounted] = useState(false);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    // requestAnimationFrame plutôt qu'un état initial à true : force le navigateur à peindre
    // l'état "invisible" au moins une fois avant de déclencher la transition vers "visible".
    const raf = requestAnimationFrame(() => setMounted(true));
    const timer = setTimeout(() => setSettled(true), 150);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className={`logo-transition-overlay${mounted && !leaving ? ' is-visible' : ''}`}>
      <div className="logo-transition">
        <div className={`logo-transition-logo${settled ? ' is-settled' : ''}`}>
          <img src="/favicon.png" alt="GROUPI" />
        </div>
        <div className={`logo-transition-text${settled ? ' is-visible' : ''}`}>
          <p>{message}</p>
          {subMessage && <p className="logo-transition-sub">{subMessage}</p>}
        </div>
      </div>
    </div>
  );
}
