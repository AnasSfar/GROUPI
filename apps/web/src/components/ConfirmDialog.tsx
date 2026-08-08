import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm doit être utilisé à l’intérieur de <ConfirmProvider>.');
  }
  return ctx;
}

/**
 * Confirmation avant action irréversible (suppression...), dans l'esprit de ToastProvider : un
 * point d'entrée global (Promise<boolean>) plutôt qu'un état + une modale dupliqués à chaque
 * page. Réutilise .terms-modal* (déjà générique, voir la modale d'invitation d'AdminUsersPage).
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setPending(typeof options === 'string' ? { message: options, resolve } : { ...options, resolve });
    });
  }, []);

  function settle(result: boolean) {
    setPending((prev) => {
      prev?.resolve(result);
      return null;
    });
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending &&
        createPortal(
          <div className="terms-modal-backdrop" onClick={() => settle(false)}>
            <div className="terms-modal" onClick={(e) => e.stopPropagation()}>
              <h2>{pending.title ?? 'Confirmer'}</h2>
              <p>{pending.message}</p>
              <div className="terms-modal-actions">
                <button type="button" className="ghost" onClick={() => settle(false)}>
                  {pending.cancelLabel ?? 'Annuler'}
                </button>
                <button
                  type="button"
                  className={pending.danger ? 'danger' : undefined}
                  onClick={() => settle(true)}
                  autoFocus
                >
                  {pending.confirmLabel ?? 'Confirmer'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </ConfirmContext.Provider>
  );
}


export type { ConfirmOptions };
