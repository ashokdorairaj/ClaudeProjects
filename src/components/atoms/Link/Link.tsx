import React from 'react';
import './Link.css';

export type LinkDesign = 'Default' | 'Emphasized' | 'Subtle' | 'Inverted';

/**
 * Inline navigation element — for text-based navigation within content or table cells.
 *
 * @see src/pages/docs/link.md
 *
 * @constraints
 * - Use for navigation only. For non-navigating actions use `Button design="Transparent"`.
 * - `design="Inverted"` is for use on dark backgrounds (e.g. inside ShellBar).
 * - External links (`target="_blank"`) automatically get `rel="noopener noreferrer"`.
 *
 * @example
 * // In-app navigation
 * <Link href="/orders/123">View Order #123</Link>
 *
 * @example
 * // External with icon
 * <Link href="https://sap.com" target="_blank" icon="inspect" iconPosition="right">SAP Docs</Link>
 */
export interface LinkProps {
  children: React.ReactNode;
  href?: string;
  target?: string;
  rel?: string;
  /** Default = Regular weight · Emphasized = Bold · Subtle = text-color underlined · Inverted = on dark bg */
  design?: LinkDesign;
  disabled?: boolean;
  /** SAP icon name string (e.g. "inspect") or any ReactNode */
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  className?: string;
}

export const Link: React.FC<LinkProps> = ({
  children,
  href = '#',
  target,
  rel,
  design = 'Default',
  disabled = false,
  icon,
  iconPosition = 'right',
  onClick,
  className = '',
}) => {
  const classes = [
    'fd-link',
    design === 'Emphasized' ? 'fd-link--emphasized' : '',
    design === 'Subtle'     ? 'fd-link--subtle'     : '',
    design === 'Inverted'   ? 'fd-link--inverted'   : '',
    disabled                ? 'fd-link--disabled'   : '',
    icon                    ? 'fd-link--icon'        : '',
    className,
  ].filter(Boolean).join(' ');

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled) { e.preventDefault(); return; }
    onClick?.(e);
  };

  // Accept a plain string as an SAP icon name
  const iconEl = typeof icon === 'string'
    ? <img src={`/icons/${icon}.svg`} alt="" aria-hidden="true" width={14} height={14} className="fd-link__icon-img" />
    : icon;

  return (
    <a
      href={disabled ? undefined : href}
      target={target}
      rel={target === '_blank' ? (rel ?? 'noopener noreferrer') : rel}
      className={classes}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      onClick={handleClick}
    >
      {iconEl && iconPosition === 'left'  && <span className="fd-link__icon" aria-hidden="true">{iconEl}</span>}
      <span className="fd-link__text">{children}</span>
      {iconEl && iconPosition === 'right' && <span className="fd-link__icon" aria-hidden="true">{iconEl}</span>}
    </a>
  );
};

export default Link;
