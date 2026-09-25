import React from 'react';
import type { ValueState } from '../../../tokens';
import './Tag.css';

export type TagColor =
  | 'none'
  /* Filled (dark bg, white text) */
  | 'set1' | 'set2' | 'set3' | 'set4' | 'set5'
  | 'set6' | 'set7' | 'set8' | 'set9' | 'set10'
  /* Tinted (light bg, dark text) */
  | 'set1b' | 'set2b' | 'set3b' | 'set4b' | 'set5b'
  | 'set6b' | 'set7b' | 'set8b' | 'set9b' | 'set10b';

/**
 * Content label, category marker, or removable filter chip.
 *
 * @see src/pages/docs/tag.md
 *
 * @constraints
 * - Use `valueState` for semantic meaning (success/error/warning/info).
 * - Use `color` for decorative category coloring (set1–set10, set1b–set10b).
 * - `valueState` takes priority over `color` when both are set.
 * - Do not use Tag as the primary status indicator for decisions; use `MessageStrip`.
 * - `dismissible=true` requires `onDismiss` to actually remove the tag from state.
 *
 * @example
 * // Status tag
 * <Tag valueState="Positive">Active</Tag>
 *
 * @example
 * // Removable filter chip
 * <Tag color="set3" dismissible onDismiss={() => removeFilter('category')}>Electronics</Tag>
 */
export interface TagProps {
  children: React.ReactNode;
  /** Semantic color variant */
  color?: TagColor;
  /** Value state overrides color with semantic meaning */
  valueState?: ValueState;
  /** Larger design variant */
  large?: boolean;
  /** Show only icon (no text) */
  iconOnly?: boolean;
  icon?: React.ReactNode;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Interactive – shows hover/active states */
  interactive?: boolean;
  /** Show X dismiss button */
  dismissible?: boolean;
  onClick?: React.MouseEventHandler<HTMLSpanElement>;
  onDismiss?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

const valueStateClass: Record<ValueState, string> = {
  None: 'fd-tag--none',
  Positive: 'fd-tag--success',
  Negative: 'fd-tag--error',
  Critical: 'fd-tag--warning',
  Information: 'fd-tag--information',
};

export const Tag: React.FC<TagProps> = ({
  children,
  color = 'none',
  valueState,
  large = false,
  iconOnly = false,
  icon,
  leftIcon,
  interactive = false,
  dismissible = false,
  onClick,
  onDismiss,
  className = '',
}) => {
  const classes = [
    'fd-tag',
    valueState ? valueStateClass[valueState] : `fd-tag--${color}`,
    large ? 'fd-tag--large' : '',
    iconOnly ? 'fd-tag--icon-only' : '',
    interactive ? 'fd-tag--interactive' : '',
    dismissible ? 'fd-tag--dismissible' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classes}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {leftIcon && <span className="fd-tag__icon">{leftIcon}</span>}
      {!iconOnly && <span className="fd-tag__text">{children}</span>}
      {icon && <span className="fd-tag__icon">{icon}</span>}
      {dismissible && (
        <button
          type="button"
          className="fd-tag__dismiss"
          aria-label="Remove"
          onClick={(e) => { e.stopPropagation(); onDismiss?.(e); }}
          tabIndex={0}
        >
          ×
        </button>
      )}
    </span>
  );
};

export default Tag;
