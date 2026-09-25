import React from 'react';
import './Avatar.css';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type AvatarColor = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10';
export type AvatarType = 'initials' | 'icon' | 'image';

/**
 * Represents a person or entity with initials, image, or icon.
 *
 * @see src/pages/docs/avatar.md
 *
 * @constraints
 * - `initials` is capped at 2 characters — pass full name, component trims it.
 * - Use `src` (not deprecated `image`) for image URLs.
 * - Do not use Avatar for non-person entities (icons, products) — use `Icon` instead.
 * - In ShellBar `profile` slot: use `size="sm"` or `"md"` (max 44 px).
 * - Always provide `ariaLabel` when used in an interactive context.
 *
 * @example
 * // Initials with color
 * <Avatar initials="JD" color="5" size="md" />
 *
 * @example
 * // Image with interactive
 * <Avatar src="/avatars/john.jpg" size="sm" interactive ariaLabel="John Doe profile" onClick={openMenu} />
 */
export interface AvatarProps {
  /** Initials (max 2 chars) */
  initials?: string;
  /** Image URL — alias: `src` */
  src?: string;
  /** @deprecated Use `src` */
  image?: string;
  /** Icon node */
  icon?: React.ReactNode;
  size?: AvatarSize;
  /** Accent color 1-10 (Horizon pastel palette) */
  color?: AvatarColor;
  /** Show border */
  border?: boolean;
  /** Interactive */
  interactive?: boolean;
  onClick?: React.MouseEventHandler<HTMLSpanElement>;
  className?: string;
  /** Accessible label */
  ariaLabel?: string;
}

const sizeMap: Record<AvatarSize, string> = {
  xs:  'fd-avatar--xs',
  sm:  'fd-avatar--sm',
  md:  'fd-avatar--md',
  lg:  'fd-avatar--lg',
  xl:  'fd-avatar--xl',
  xxl: 'fd-avatar--xxl',
};

export const Avatar: React.FC<AvatarProps> = ({
  initials,
  src,
  image,
  icon,
  size = 'md',
  color = '1',
  border = false,
  interactive = false,
  onClick,
  className = '',
  ariaLabel,
}) => {
  // Support both `src` (canonical) and legacy `image` prop
  const imageSrc = src ?? image;

  const classes = [
    'fd-avatar',
    sizeMap[size],
    `fd-avatar--color-${color}`,
    border ? 'fd-avatar--border' : '',
    interactive ? 'fd-avatar--interactive' : '',
    imageSrc ? 'fd-avatar--image' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classes}
      role={interactive ? 'button' : 'img'}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? onClick : undefined}
      aria-label={ariaLabel ?? initials ?? 'Avatar'}
    >
      {imageSrc ? (
        <img className="fd-avatar__img" src={imageSrc} alt={ariaLabel ?? ''} />
      ) : icon ? (
        <span className="fd-avatar__icon">{icon}</span>
      ) : (
        <span className="fd-avatar__initials">{(initials ?? '').slice(0, 2)}</span>
      )}
    </span>
  );
};

export default Avatar;

/* ── AvatarBadge ──────────────────────────────────────────────── */

export type AvatarBadgeType = 'positive' | 'negative' | 'critical' | 'information' | 'neutral';
/**
 * Badge size aligned to parent avatar size:
 * - 'xs' | 'sm' | 'md' → 12 px (Horizon "XS/S/M")
 * - 'lg' | 'xl' | 'xxl' → 16 px (Horizon "L/XL/XXL")
 */
export type AvatarBadgeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export interface AvatarBadgeProps {
  type?: AvatarBadgeType;
  /** Match to the parent Avatar size — xs/sm/md → 12px dot; lg/xl/xxl → 16px dot */
  size?: AvatarBadgeSize;
}

export const AvatarBadge: React.FC<AvatarBadgeProps> = ({
  type = 'neutral',
  size = 'md',
}) => {
  // Map avatar size to badge CSS size class
  const badgeSizeClass =
    size === 'lg' || size === 'xl' || size === 'xxl'
      ? 'fd-avatar-badge--l'
      : 'fd-avatar-badge--sm';

  const classes = [
    'fd-avatar-badge',
    `fd-avatar-badge--${type}`,
    badgeSizeClass,
  ].join(' ');

  return <span className={classes} aria-hidden="true" />;
};

/* ── AvatarGroup ──────────────────────────────────────────────── */

export interface AvatarGroupItem {
  initials?: string;
  /** Image URL */
  src?: string;
  /** @deprecated Use `src` */
  image?: string;
  icon?: React.ReactNode;
  color?: AvatarColor;
  ariaLabel?: string;
}

export interface AvatarGroupProps {
  items: AvatarGroupItem[];
  size?: AvatarSize;
  maxVisible?: number;
  type?: 'individual' | 'group';
  interactive?: boolean;
  onAvatarClick?: (index: number) => void;
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  items,
  size = 'md',
  maxVisible = 4,
  type = 'individual',
  interactive = false,
  onAvatarClick,
  className = '',
}) => {
  const visibleItems = maxVisible > 0 ? items.slice(0, maxVisible) : items;
  const overflowCount = maxVisible > 0 ? Math.max(0, items.length - maxVisible) : 0;

  const groupClasses = [
    'fd-avatar-group',
    `fd-avatar-group--${type}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={groupClasses} role="group">
      {visibleItems.map((item, index) => (
        <Avatar
          key={index}
          initials={item.initials}
          src={item.src ?? item.image}
          icon={item.icon}
          color={item.color ?? '5'}
          size={size}
          border
          interactive={interactive}
          onClick={interactive && onAvatarClick ? () => onAvatarClick(index) : undefined}
          ariaLabel={item.ariaLabel ?? item.initials ?? `Avatar ${index + 1}`}
          className="fd-avatar-group__avatar"
        />
      ))}
      {overflowCount > 0 && (
        <span
          className={[
            'fd-avatar-group__overflow',
            `fd-avatar--${size}`,
            interactive ? 'fd-avatar-group__overflow--interactive' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-label={`${overflowCount} more`}
          role={interactive ? 'button' : 'img'}
          tabIndex={interactive ? 0 : undefined}
        >
          +{overflowCount}
        </span>
      )}
    </div>
  );
};
