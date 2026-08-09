import { Children, isValidElement, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { KeyboardEvent, ReactNode } from 'react';

interface SelectOption {
  value: string;
  label: string;
  disabled: boolean;
}

interface SelectChangeEvent {
  target: { value: string };
}

interface SelectProps {
  value: string;
  onChange: (e: SelectChangeEvent) => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  'aria-label'?: string;
  /** Affiche un champ de recherche en tête de liste — utile pour les longues listes
   * (ex. les ~6000 établissements ou les villes) où le défilement seul est inutilisable. */
  searchable?: boolean;
  searchPlaceholder?: string;
}

// <option> peut recevoir plusieurs enfants JSX (ex. {firstName} {lastName}) :
// props.children est alors un tableau, pas une string, d'où l'aplatissement récursif.
function childrenToText(children: ReactNode): string {
  if (children == null || typeof children === 'boolean') return '';
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(childrenToText).join('');
  if (isValidElement(children)) {
    return childrenToText((children.props as { children?: ReactNode }).children);
  }
  return '';
}

function parseOptions(children: ReactNode): SelectOption[] {
  const options: SelectOption[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === 'option') {
      const props = child.props as { value?: string; children?: ReactNode; disabled?: boolean };
      options.push({
        value: props.value ?? '',
        label: childrenToText(props.children),
        disabled: props.disabled ?? false,
      });
    }
  });
  return options;
}

// Insensible aux accents (Béja/Beja, établissement/etablissement...) pour que la recherche
// reste tolérante quel que soit le clavier utilisé.
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Remplacement du <select> natif : la popup native n'est pas stylable en CSS
 * (rendu OS, pas navigateur), donc toute demande de "liste stylée" passe par
 * un combobox maison. Consomme les mêmes <option value=""> enfants qu'un
 * <select> natif et un onChange({ target: { value } }) compatible, pour rester
 * un remplacement quasi direct dans les pages existantes.
 */
export function Select({
  value,
  onChange,
  children,
  disabled,
  className,
  id,
  name,
  searchable,
  searchPlaceholder,
  ...rest
}: SelectProps) {
  const options = parseOptions(children);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [listPosition, setListPosition] = useState({ top: 0, left: 0, width: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const typeaheadRef = useRef('');
  const typeaheadTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const filteredOptions = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const needle = normalize(query);
    return options.filter((o) => normalize(o.label).includes(needle));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, query, searchable]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (popupRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // La liste est rendue dans un portail (voir plus bas) pour échapper à
  // l'overflow: hidden/auto des conteneurs ancêtres (ex. .table-wrap), qui
  // sinon la découpe au lieu de la laisser s'ouvrir par-dessus. On calcule
  // donc sa position en position: fixed à partir du bouton déclencheur.
  useLayoutEffect(() => {
    if (!open) return;
    function updatePosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setListPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  // La liste peut être plus large que le bouton (width: max-content en CSS) : sur un écran
  // étroit, un déclencheur proche du bord droit produirait un popup qui déborde du viewport.
  // Un second passage, une fois la liste rendue (donc sa largeur réelle connue), la recale.
  useLayoutEffect(() => {
    if (!open || !popupRef.current) return;
    const margin = 8;
    const overflowRight = popupRef.current.getBoundingClientRect().right - (window.innerWidth - margin);
    if (overflowRight > 0) {
      setListPosition((prev) => ({ ...prev, left: Math.max(margin, prev.left - overflowRight) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, listPosition.top, listPosition.width]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(Math.max(0, selectedIndex));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || !searchable) return;
    setActiveIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    if (open && searchable) {
      searchInputRef.current?.focus();
    }
  }, [open, searchable]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  function commit(index: number) {
    const opt = filteredOptions[index];
    if (!opt || opt.disabled) return;
    onChange({ target: { value: opt.value } });
  }

  function moveActive(delta: number) {
    if (filteredOptions.length === 0) return;
    setActiveIndex((prev) => {
      let next = prev;
      for (let i = 0; i < filteredOptions.length; i++) {
        next = (next + delta + filteredOptions.length) % filteredOptions.length;
        if (!filteredOptions[next].disabled) break;
      }
      return next;
    });
  }

  function runTypeahead(key: string) {
    window.clearTimeout(typeaheadTimer.current);
    typeaheadRef.current += key.toLowerCase();
    const query = typeaheadRef.current;
    const startIndex = open ? activeIndex + 1 : selectedIndex + 1;
    const ordered = [...options.slice(startIndex), ...options.slice(0, startIndex)];
    const match = ordered.find((o) => !o.disabled && o.label.toLowerCase().startsWith(query));
    typeaheadTimer.current = window.setTimeout(() => {
      typeaheadRef.current = '';
    }, 600);
    if (!match) return;
    const matchIndex = options.indexOf(match);
    if (open) {
      setActiveIndex(matchIndex);
    } else {
      commit(matchIndex);
    }
  }

  function handleTriggerKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) setOpen(true);
        else moveActive(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) setOpen(true);
        else moveActive(-1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (open) {
          commit(activeIndex);
          setOpen(false);
        } else {
          setOpen(true);
        }
        break;
      case 'Escape':
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        if (!searchable && e.key.length === 1 && /[a-z0-9]/i.test(e.key)) {
          e.preventDefault();
          runTypeahead(e.key);
        }
    }
  }

  function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        moveActive(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveActive(-1);
        break;
      case 'Enter':
        e.preventDefault();
        commit(activeIndex);
        setOpen(false);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
    }
  }

  return (
    <div className={['select', className].filter(Boolean).join(' ')} ref={rootRef}>
      <button
        type="button"
        id={id}
        name={name}
        className="select-trigger"
        disabled={disabled}
        ref={triggerRef}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={handleTriggerKeyDown}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={rest['aria-label']}
      >
        <span className="select-value">{selectedOption?.label ?? ''}</span>
      </button>
      {open &&
        createPortal(
          <div
            className="select-popup"
            ref={popupRef}
            style={{ position: 'fixed', top: listPosition.top, left: listPosition.left, minWidth: listPosition.width }}
          >
            {searchable && (
              <div className="select-search">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  placeholder={searchPlaceholder ?? 'Rechercher...'}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  aria-label={searchPlaceholder ?? 'Rechercher'}
                />
              </div>
            )}
            <ul className="select-list" role="listbox" ref={listRef} tabIndex={-1}>
              {filteredOptions.map((opt, index) => (
                <li
                  key={opt.value + index}
                  data-index={index}
                  role="option"
                  aria-selected={opt.value === value}
                  aria-disabled={opt.disabled}
                  className={['select-option', index === activeIndex ? 'is-active' : '', opt.disabled ? 'is-disabled' : '']
                    .filter(Boolean)
                    .join(' ')}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (opt.disabled) return;
                    commit(index);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </li>
              ))}
              {filteredOptions.length === 0 && <li className="select-empty">Aucun résultat</li>}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}
