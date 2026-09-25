import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ButtonDesign, FormFactor } from '../../../tokens';
import { Icon } from '../Icon';
import './Button.css';
import './SplitButton.css';

export interface SplitButtonMenuItem {
  key: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface SplitButtonProps {
  label: string;
  design?: ButtonDesign;
  formFactor?: FormFactor;
  disabled?: boolean;
  onMainClick?: () => void;
  menuItems?: SplitButtonMenuItem[];
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

export const SplitButton: React.FC<SplitButtonProps> = ({
  label,
  design = 'Default',
  formFactor = 'cozy',
  disabled = false,
  onMainClick,
  menuItems = [],
  onMenuSelect,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const designClass = designMap[design];
  const compactClass = formFactor === 'compact' ? 'fd-button--compact' : '';

  const mainClasses = [
    'fd-button',
    'fd-split-button__main',
    designClass,
    compactClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const arrowClasses = [
    'fd-button',
    'fd-button--icon-only',
    'fd-split-button__arrow',
    designClass,
    compactClass,
  ]
    .filter(Boolean)
    .join(' ');

  const wrapperClasses = [
    'fd-split-button',
    open ? 'fd-split-button--open' : '',
    disabled ? 'fd-split-button--disabled' : '',
    formFactor === 'compact' ? 'fd-split-button--compact' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleArrowClick = useCallback(() => {
    if (!disabled) {
      setOpen((prev) => !prev);
    }
  }, [disabled]);

  const handleMenuSelect = useCallback(
    (key: string) => {
      setOpen(false);
      onMenuSelect?.(key);
    },
    [onMenuSelect]
  );

  // Close on outside click
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

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Focus first menu item when opened
  useEffect(() => {
    if (open && menuRef.current) {
      const firstItem = menuRef.current.querySelector<HTMLElement>(
        '.fd-split-button__menu-item:not([aria-disabled="true"])'
      );
      firstItem?.focus();
    }
  }, [open]);

  return (
    <div className={wrapperClasses} ref={containerRef}>
      {/* Main action button */}
      <button
        type="button"
        className={mainClasses}
        disabled={disabled}
        onClick={() => !disabled && onMainClick?.()}
        aria-haspopup="false"
      >
        <span className="fd-button__text">{label}</span>
      </button>

      {/* Arrow / dropdown trigger */}
      <button
        type="button"
        className={arrowClasses}
        disabled={disabled}
        onClick={handleArrowClick}
        aria-label="Show more actions"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="fd-button__icon fd-split-button__chevron" aria-hidden="true">
          <Icon name="slim-arrow-down" size={16} />
        </span>
      </button>

      {/* Dropdown menu */}
      {open && menuItems.length > 0 && (
        <ul
          className="fd-split-button__menu"
          role="listbox"
          aria-label={`${label} actions`}
          ref={menuRef}
        >
          {menuItems.map((item) => (
            <li
              key={item.key}
              className={[
                'fd-split-button__menu-item',
                item.disabled ? 'fd-split-button__menu-item--disabled' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              role="option"
              aria-selected={false}
              aria-disabled={item.disabled}
              tabIndex={item.disabled ? -1 : 0}
              onClick={() => {
                if (!item.disabled) {
                  handleMenuSelect(item.key);
                }
              }}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !item.disabled) {
                  handleMenuSelect(item.key);
                }
                if (e.key === 'ArrowDown') {
                  const next = (e.currentTarget as HTMLElement)
                    .nextElementSibling as HTMLElement | null;
                  next?.focus();
                }
                if (e.key === 'ArrowUp') {
                  const prev = (e.currentTarget as HTMLElement)
                    .previousElementSibling as HTMLElement | null;
                  prev?.focus();
                }
              }}
            >
              {item.icon && (
                <span className="fd-split-button__menu-item-icon" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              <span className="fd-split-button__menu-item-text">{item.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SplitButton;
