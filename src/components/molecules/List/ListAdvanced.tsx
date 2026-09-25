import React from 'react';
import './ListAdvanced.css';

export type ObjectStatusType = 'positive' | 'negative' | 'critical' | 'information' | 'neutral';
export type ValueState = 'None' | 'Positive' | 'Negative' | 'Critical' | 'Information';

export interface ListItemAdvancedProps {
  /** Primary text */
  title: string;
  /** Secondary byline text */
  description?: string;
  /** Icon node rendered to the left */
  icon?: React.ReactNode;
  /** Image URL – renders as a thumbnail */
  thumbnail?: string;
  /** Trailing info text (e.g. "Pending", "3 of 5") */
  info?: string;
  /** Colours the trailing info text */
  infoState?: ValueState;
  /** Highlight as selected */
  selected?: boolean;
  /** Disable interactions */
  disabled?: boolean;
  /** Makes item clickable with hover effect */
  interactive?: boolean;
  /** Shows a › navigation arrow on the right */
  navigationIndicator?: boolean;
  /** Action buttons/icons on the right */
  actions?: React.ReactNode;
  /** Input selector type rendered before content */
  selector?: 'checkbox' | 'radio' | 'none';
  selectorChecked?: boolean;
  onSelectorChange?: (checked: boolean) => void;
  /** Renders row as a group/section header */
  groupHeader?: boolean;
  /** Draws a separator line below this item */
  separator?: boolean;
  /** Status badge */
  objectStatus?: { text: string; type: ObjectStatusType };
  /** Numeric counter badge */
  counter?: number;
  /** Footer sub-text below description */
  footer?: string;
  /** Density — cozy (default, 44px) or compact (26px) */
  formFactor?: 'cozy' | 'compact';
  onClick?: () => void;
  className?: string;
}

export const ListItemAdvanced: React.FC<ListItemAdvancedProps> = ({
  title,
  description,
  icon,
  thumbnail,
  info,
  infoState = 'None',
  selected = false,
  disabled = false,
  interactive = false,
  navigationIndicator = false,
  actions,
  selector = 'none',
  selectorChecked = false,
  onSelectorChange,
  groupHeader = false,
  separator = false,
  objectStatus,
  counter,
  footer,
  formFactor = 'cozy',
  onClick,
  className = '',
}) => {
  const isInteractive = interactive || !!onClick;

  const classes = [
    'fd-list-item',
    groupHeader ? 'fd-list-item--group-header' : '',
    selected ? 'fd-list-item--selected' : '',
    disabled ? 'fd-list-item--disabled' : '',
    isInteractive && !groupHeader ? 'fd-list-item--interactive' : '',
    separator ? 'fd-list-item--separator' : '',
    formFactor === 'compact' ? 'fd-list-item--compact' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleSelectorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelectorChange?.(e.target.checked);
  };

  const handleClick = () => {
    if (!disabled) onClick?.();
  };

  return (
    <li
      className={classes}
      onClick={!disabled && isInteractive ? handleClick : undefined}
      aria-selected={selected || undefined}
      aria-disabled={disabled || undefined}
      role={isInteractive ? 'option' : undefined}
      tabIndex={isInteractive && !disabled ? 0 : undefined}
      onKeyDown={
        isInteractive && !disabled
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
    >
      {/* Selector */}
      {selector !== 'none' && (
        <span className="fd-list-item__selector">
          <input
            type={selector}
            checked={selectorChecked}
            onChange={handleSelectorChange}
            disabled={disabled}
            aria-label={title}
            tabIndex={-1}
          />
        </span>
      )}

      {/* Thumbnail */}
      {thumbnail && (
        <img
          src={thumbnail}
          alt=""
          className="fd-list-item__thumbnail"
          aria-hidden="true"
        />
      )}

      {/* Icon (only when no thumbnail) */}
      {icon && !thumbnail && (
        <span className="fd-list-item__icon" aria-hidden="true">
          {icon}
        </span>
      )}

      {/* Content area */}
      <div className="fd-list-item__content">
        <span className="fd-list-item__title">{title}</span>
        {description && (
          <span className="fd-list-item__description">{description}</span>
        )}
        {footer && <span className="fd-list-item__footer">{footer}</span>}
      </div>

      {/* Trailing info text */}
      {info && (
        <span
          className={[
            'fd-list-item__info',
            infoState !== 'None' ? `fd-list-item__info--${infoState.toLowerCase()}` : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {info}
        </span>
      )}

      {/* Object status */}
      {objectStatus && (
        <span
          className={`fd-list-item__object-status fd-list-item__object-status--${objectStatus.type}`}
        >
          {objectStatus.text}
        </span>
      )}

      {/* Counter */}
      {counter !== undefined && (
        <span className="fd-list-item__counter">{counter}</span>
      )}

      {/* Actions */}
      {actions && (
        <div
          className="fd-list-item__actions"
          onClick={(e) => e.stopPropagation()}
        >
          {actions}
        </div>
      )}

      {/* Navigation indicator */}
      {navigationIndicator && (
        <span
          className="fd-list-item__nav-indicator"
          aria-hidden="true"
        />
      )}
    </li>
  );
};

export default ListItemAdvanced;
