import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ButtonDesign, FormFactor } from '../../../tokens';
import { Icon } from '../Icon';
import './Button.css';
import './MenuButton.css';

export interface IconMenuButtonMenuItem {
  key: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface IconMenuButtonProps {
  /** The icon to display (SAP icon name or ReactNode) */
  icon: React.ReactNode;
  /** Accessible label */
  ariaLabel: string;
  /** Visual design variant */
  design?: ButtonDesign;
  /** Cozy (default) or Compact density */
  formFactor?: FormFactor;
  /** Disabled state */
  disabled?: boolean;
  /** Menu items shown in the dropdown */
  menuItems?: IconMenuButtonMenuItem[];
  /** Called when a menu item is selected */
  onMenuSelect?: (key: string) => void;
  className?: string;
}

const designMap: Record<ButtonDesign, string> = {
  Default: 'fd-button--standard',
  Emphasized: 'fd-button--emphasized',
  Positive: 'fd-button--positive',
  Negative: 'fd-button--negative',
  Attention: 'fd-button--attention',
  Transparent: 'fd-button--transparent',
  Critical: 'fd-button--critical',
  Success: 'fd-button--success',
  Neutral: 'fd-button--neutral',
  Information: 'fd-button--information',
};

export const IconMenuButton: React.FC<IconMenuButtonProps> = ({
  icon,
  ariaLabel,
  design = 'Default',
  formFactor = 'cozy',
  disabled = false,
  menuItems = [],
  onMenuSelect,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const classes = [
    'fd-button',
    'fd-icon-menu-button',
    designMap[design],
    formFactor === 'compact' ? 'fd-button--compact' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const wrapperClasses = [
    'fd-menu-button__wrapper',
    'fd-icon-menu-button__wrapper',
    open ? 'fd-menu-button__wrapper--open' : '',
    disabled ? 'fd-menu-button__wrapper--disabled' : '',
    formFactor === 'compact' ? 'fd-menu-button__wrapper--compact' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleToggle = useCallback(() => {
    if (!disabled) setOpen((prev) => !prev);
  }, [disabled]);

  const handleSelect = useCallback(
    (key: string) => {
      setOpen(false);
      onMenuSelect?.(key);
    },
    [onMenuSelect]
  );

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  useEffect(() => {
    if (open && menuRef.current) {
      const first = menuRef.current.querySelector<HTMLElement>(
        '.fd-menu-button__menu-item:not([aria-disabled="true"])'
      );
      first?.focus();
    }
  }, [open]);

  return (
    <div className={wrapperClasses} ref={containerRef}>
      <button
        type="button"
        className={classes}
        disabled={disabled}
        onClick={handleToggle}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="fd-button__icon">{icon}</span>
        <span className="fd-button__icon fd-menu-button__arrow" aria-hidden="true">
          <Icon name="slim-arrow-down" size={12} />
        </span>
      </button>

      {open && menuItems.length > 0 && (
        <ul
          className="fd-menu-button__menu"
          role="listbox"
          aria-label={`${ariaLabel} options`}
          ref={menuRef}
        >
          {menuItems.map((item) => (
            <li
              key={item.key}
              className={[
                'fd-menu-button__menu-item',
                item.disabled ? 'fd-menu-button__menu-item--disabled' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              role="option"
              aria-selected={false}
              aria-disabled={item.disabled}
              tabIndex={item.disabled ? -1 : 0}
              onClick={() => !item.disabled && handleSelect(item.key)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !item.disabled) handleSelect(item.key);
                if (e.key === 'ArrowDown') (e.currentTarget.nextElementSibling as HTMLElement | null)?.focus();
                if (e.key === 'ArrowUp') (e.currentTarget.previousElementSibling as HTMLElement | null)?.focus();
              }}
            >
              {item.icon && <span className="fd-menu-button__menu-item-icon" aria-hidden="true">{item.icon}</span>}
              <span className="fd-menu-button__menu-item-text">{item.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default IconMenuButton;
