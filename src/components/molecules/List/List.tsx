import React from 'react';
import type { ValueState } from '../../../tokens';
import './List.css';

export type ListSelectionMode = 'None' | 'SingleSelect' | 'MultiSelect';

export interface ListItemProps {
  children?: React.ReactNode;
  title?: string;
  description?: string;
  /** Leading icon */
  icon?: React.ReactNode;
  /** Trailing info text */
  info?: string;
  /** Colour applied to the trailing info text */
  infoState?: ValueState;
  /** Show trailing navigation arrow */
  navigatable?: boolean;
  /** Action buttons/icons on the right */
  actions?: React.ReactNode;
  selected?: boolean;
  disabled?: boolean;
  /** Row interaction type — Active enables click/hover, Detail shows detail icon */
  type?: 'Active' | 'Inactive' | 'Detail';
  onClick?: React.MouseEventHandler<HTMLLIElement>;
  className?: string;
}

export const ListItem: React.FC<ListItemProps> = ({
  children,
  title,
  description,
  icon,
  info,
  infoState = 'None',
  navigatable = false,
  actions,
  selected = false,
  disabled = false,
  type = 'Inactive',
  onClick,
  className = '',
}) => {
  const isInteractive = type === 'Active' || !!onClick;

  return (
    <li
      className={[
        'fd-list-item',
        selected ? 'fd-list-item--selected' : '',
        disabled ? 'fd-list-item--disabled' : '',
        isInteractive ? 'fd-list-item--interactive' : '',
        type === 'Detail' ? 'fd-list-item--detail' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={!disabled ? onClick : undefined}
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      role={isInteractive ? 'option' : undefined}
      tabIndex={isInteractive && !disabled ? 0 : undefined}
      onKeyDown={
        isInteractive && !disabled
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.(e as unknown as React.MouseEvent<HTMLLIElement>);
              }
            }
          : undefined
      }
    >
      {icon && <span className="fd-list-item__icon" aria-hidden="true">{icon}</span>}
      <div className="fd-list-item__content">
        {title && <span className="fd-list-item__title">{title}</span>}
        {description && <span className="fd-list-item__description">{description}</span>}
        {children}
      </div>
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
      {actions && (
        <div className="fd-list-item__actions" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
      {type === 'Detail' && (
        <span className="fd-list-item__detail-indicator" aria-hidden="true" />
      )}
      {navigatable && (
        <span className="fd-list-item__nav-indicator" aria-hidden="true" />
      )}
    </li>
  );
};

export interface ListGroupHeaderProps {
  title: string;
  className?: string;
}

export const ListGroupHeader: React.FC<ListGroupHeaderProps> = ({
  title,
  className = '',
}) => {
  return (
    <li
      className={['fd-list-item', 'fd-list-item--group-header', className]
        .filter(Boolean)
        .join(' ')}
      role="presentation"
      aria-hidden="true"
    >
      <span className="fd-list-item__title">{title}</span>
    </li>
  );
};

/**
 * Scrollable collection of `ListItem` rows with optional group headers and selection support.
 *
 * @see src/pages/docs/list.md
 *
 * @constraints
 * - Use `selectionMode="SingleSelect"` or `"MultiSelect"` — never manage selection by toggling `selected` manually without updating `selectionMode`.
 * - Wrap related items in `ListGroupHeader` to visually section the list; do not use a plain heading element.
 * - `borders=true` (default) adds separator lines — set to `false` for card-embedded lists.
 * - For tabular data with columns use `Table` instead of `List`.
 *
 * @example
 * <List selectionMode="SingleSelect" headerText="Recent Orders">
 *   <ListGroupHeader title="This week" />
 *   <ListItem title="Order #1001" description="Delivered" info="Apr 8" type="Active" onClick={() => nav('/orders/1001')} />
 *   <ListItem title="Order #1002" description="Processing" info="Apr 9" />
 * </List>
 */
export interface ListProps {
  children: React.ReactNode;
  /** Compact / reduced density */
  compact?: boolean;
  /** With separator lines between items */
  borders?: boolean;
  /** Selection mode */
  selectionMode?: ListSelectionMode;
  headerText?: string;
  footerText?: string;
  className?: string;
}

export const List: React.FC<ListProps> = ({
  children,
  compact = false,
  borders = true,
  selectionMode = 'None',
  headerText,
  footerText,
  className = '',
}) => {
  return (
    <div className={['fd-list-container', className].filter(Boolean).join(' ')}>
      {headerText && <div className="fd-list-header">{headerText}</div>}
      <ul
        className={[
          'fd-list',
          compact ? 'fd-list--compact' : '',
          borders ? 'fd-list--borders' : '',
          selectionMode !== 'None' ? `fd-list--${selectionMode === 'SingleSelect' ? 'single' : 'multi'}-select` : '',
        ]
          .filter(Boolean)
          .join(' ')}
        role={selectionMode !== 'None' ? 'listbox' : 'list'}
        aria-multiselectable={selectionMode === 'MultiSelect' || undefined}
      >
        {children}
      </ul>
      {footerText && <div className="fd-list-footer">{footerText}</div>}
    </div>
  );
};

export default List;
