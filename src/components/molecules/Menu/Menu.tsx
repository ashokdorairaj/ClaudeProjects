import React, { useEffect, useRef, useState } from 'react';
import './Menu.css';

export interface MenuItemProps {
  label: string;
  /** Icon rendered to the left of the label */
  icon?: React.ReactNode;
  /** Keyboard shortcut hint, e.g. 'Ctrl+S' */
  shortcut?: string;
  /** Draws a separator line below this item */
  separator?: boolean;
  selected?: boolean;
  disabled?: boolean;
  /** Nested sub-menu items */
  submenu?: MenuItemProps[];
  onClick?: () => void;
  formFactor?: 'cozy' | 'compact';
  className?: string;
}

export interface MenuProps {
  items: MenuItemProps[];
  open?: boolean;
  anchorElement?: HTMLElement | null;
  placement?: 'bottom-start' | 'bottom-end' | 'right-start';
  formFactor?: 'cozy' | 'compact';
  onClose?: () => void;
  className?: string;
}

/* ── Single item ──────────────────────────────────── */
const MenuItemComponent: React.FC<
  MenuItemProps & { compact?: boolean; onClose?: () => void }
> = ({
  label,
  icon,
  shortcut,
  separator,
  selected = false,
  disabled = false,
  submenu,
  onClick,
  compact = false,
  onClose,
  className = '',
}) => {
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const itemRef = useRef<HTMLLIElement>(null);
  const submenuRef = useRef<HTMLUListElement>(null);

  const handleClick = () => {
    if (disabled) return;
    if (submenu && submenu.length > 0) {
      setSubmenuOpen((v) => !v);
      return;
    }
    onClick?.();
    onClose?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
    if (e.key === 'ArrowRight' && submenu && submenu.length > 0) {
      setSubmenuOpen(true);
    }
    if (e.key === 'ArrowLeft') {
      setSubmenuOpen(false);
    }
    if (e.key === 'Escape') {
      setSubmenuOpen(false);
    }
  };

  /* Position submenu to the right of the item */
  const [submenuPos, setSubmenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (submenuOpen && itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      setSubmenuPos({
        top: rect.top + window.scrollY,
        left: rect.right + window.scrollX,
      });
    }
  }, [submenuOpen]);

  const classes = [
    'fd-menu__item',
    selected ? 'fd-menu__item--selected' : '',
    disabled ? 'fd-menu__item--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <li
        ref={itemRef}
        className={classes}
        role="menuitem"
        aria-disabled={disabled}
        aria-haspopup={submenu && submenu.length > 0 ? 'menu' : undefined}
        aria-expanded={
          submenu && submenu.length > 0 ? submenuOpen : undefined
        }
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => {
          if (submenu && submenu.length > 0) setSubmenuOpen(true);
        }}
        onMouseLeave={() => {
          if (submenu && submenu.length > 0) setSubmenuOpen(false);
        }}
      >
        {icon && (
          <span className="fd-menu__item-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="fd-menu__item-text">{label}</span>
        {shortcut && !submenu && (
          <span className="fd-menu__item-shortcut">{shortcut}</span>
        )}
        {submenu && submenu.length > 0 && (
          <span className="fd-menu__submenu-arrow" aria-hidden="true" />
        )}
      </li>

      {/* Inline separator */}
      {separator && <li className="fd-menu__separator" role="separator" />}

      {/* Submenu panel */}
      {submenu && submenu.length > 0 && submenuOpen && (
        <ul
          ref={submenuRef}
          className={`fd-menu__submenu fd-menu__list${compact ? ' fd-menu--compact' : ''}`}
          role="menu"
          style={{
            top: submenuPos.top,
            left: submenuPos.left,
          }}
        >
          {submenu.map((subItem, idx) => (
            <MenuItemComponent
              key={idx}
              {...subItem}
              compact={compact}
              onClose={onClose}
            />
          ))}
        </ul>
      )}
    </>
  );
};

/* ── Menu container ───────────────────────────────── */
export const Menu: React.FC<MenuProps> = ({
  items,
  open = false,
  anchorElement,
  placement = 'bottom-start',
  formFactor = 'cozy',
  onClose,
  className = '',
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  /* Calculate position from anchor element */
  useEffect(() => {
    if (!open || !anchorElement) return;

    const rect = anchorElement.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    let top = 0;
    let left = 0;

    if (placement === 'bottom-start') {
      top = rect.bottom + scrollY;
      left = rect.left + scrollX;
    } else if (placement === 'bottom-end') {
      top = rect.bottom + scrollY;
      left = rect.right + scrollX;
    } else if (placement === 'right-start') {
      top = rect.top + scrollY;
      left = rect.right + scrollX;
    }

    setPosition({ top, left });
  }, [open, anchorElement, placement]);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        anchorElement !== e.target &&
        !anchorElement?.contains(e.target as Node)
      ) {
        onClose?.();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, anchorElement, onClose]);

  if (!open) return null;

  const compact = formFactor === 'compact';

  const classes = [
    'fd-menu',
    compact ? 'fd-menu--compact' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const style: React.CSSProperties = anchorElement
    ? { top: position.top, left: position.left }
    : {};

  return (
    <div
      ref={menuRef}
      className={classes}
      role="menu"
      style={style}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose?.();
      }}
    >
      <ul className="fd-menu__list" role="presentation">
        {items.map((item, idx) => (
          <MenuItemComponent
            key={idx}
            {...item}
            compact={compact}
            onClose={onClose}
          />
        ))}
      </ul>
    </div>
  );
};

export default Menu;
