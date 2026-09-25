import React, { useState } from 'react';
import { Icon } from '../../atoms/Icon';
import './Notifications.css';

/* ──────────────────────────────────────────────────────
   NotificationListItem
   ────────────────────────────────────────────────────── */
export type NotificationType = 'alert' | 'message' | 'event';
export type NotificationImportance = 'high' | 'medium' | 'low';

/**
 * Single notification row inside a `NotificationPanel` or `NotificationGroup`.
 * Displays title, description, source metadata, and optional expand/dismiss actions.
 *
 * @see src/pages/docs/notifications.md
 *
 * @constraints
 * - Always provide a unique `id` when rendering inside a list — used as the React key.
 * - Use `important=true` sparingly — only for truly urgent items requiring immediate attention.
 * - `fullDescription` enables an inline More/Less toggle; use instead of truncation when content matters.
 * - Wire `onClose` to remove the item from state; the component does not manage its own visibility.
 * - Wrap multiple `NotificationListItem` elements in `NotificationGroup` to support collapsible sections.
 *
 * @example
 * <NotificationPanel>
 *   <NotificationGroup title="Today">
 *     <NotificationListItem
 *       title="Purchase Order #4521 approved"
 *       description="Approved by Jane Smith"
 *       avatarIcon="approvals"
 *       timestamp="2 min ago"
 *       onClose={() => dismiss(item.id)}
 *     />
 *   </NotificationGroup>
 * </NotificationPanel>
 */
export interface NotificationListItemProps {
  id?: string;
  title: string;
  description?: string;
  /** Avatar icon name from the SAP icon set */
  avatarIcon?: string;
  /** Avatar background CSS color or var(--sap...) token */
  avatarColor?: string;
  read?: boolean;
  important?: boolean;
  productName?: string;
  featureName?: string;
  timestamp?: string;
  /** Extended description revealed by More/Less toggle */
  fullDescription?: string;
  onOverflow?: () => void;
  onClose?: () => void;
  onMore?: () => void;
  formFactor?: 'cozy' | 'compact';
  className?: string;
}

export const NotificationListItem: React.FC<NotificationListItemProps> = ({
  title,
  description,
  avatarIcon = 'product',
  avatarColor,
  read = false,
  important = false,
  productName,
  featureName,
  timestamp,
  fullDescription,
  onOverflow,
  onClose,
  onMore,
  formFactor = 'cozy',
  className = '',
}) => {
  const [expanded, setExpanded] = useState(false);

  const cardClasses = [
    'fd-notification-item',
    read ? 'fd-notification-item--read' : '',
    formFactor === 'compact' ? 'fd-notification-item--compact' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const displayDescription = expanded && fullDescription ? fullDescription : description;

  return (
    <div className={cardClasses}>
      {/* Avatar */}
      <div
        className="fd-notification-item__avatar"
        style={avatarColor ? { background: avatarColor } : undefined}
        aria-hidden="true"
      >
        <Icon name={avatarIcon} size={16} />
      </div>

      {/* Text container */}
      <div className="fd-notification-item__content">
        {/* Absolute action buttons (overflow + close) */}
        <div className="fd-notification-item__actions">
          {onOverflow && (
            <button
              type="button"
              className="fd-notification-item__action-btn"
              aria-label="More options"
              onClick={(e) => { e.stopPropagation(); onOverflow(); }}
            >
              <Icon name="overflow" size={16} />
            </button>
          )}
          {onClose && (
            <button
              type="button"
              className="fd-notification-item__action-btn"
              aria-label="Close notification"
              onClick={(e) => { e.stopPropagation(); onClose(); }}
            >
              <Icon name="decline" size={16} />
            </button>
          )}
        </div>

        {/* Title */}
        <div className="fd-notification-item__title-row">
          <span className="fd-notification-item__title">{title}</span>
        </div>

        {/* Description */}
        {displayDescription && (
          <p className="fd-notification-item__description">{displayDescription}</p>
        )}

        {/* Source information + More/Less */}
        <div className="fd-notification-item__source">
          <span className="fd-notification-item__source-info">
            {productName && <span>{productName}</span>}
            {productName && featureName && <span className="fd-notification-item__sep">•</span>}
            {featureName && <span>{featureName}</span>}
            {(productName || featureName) && timestamp && (
              <span className="fd-notification-item__sep">•</span>
            )}
            {timestamp && <span>{timestamp}</span>}
          </span>

          {(fullDescription || onMore) && (
            <button
              type="button"
              className="fd-notification-item__more-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (fullDescription) {
                  setExpanded((v) => !v);
                } else {
                  onMore?.();
                }
              }}
            >
              {expanded ? 'Less' : 'More'}
            </button>
          )}
        </div>

        {/* Importance tag */}
        {important && (
          <div className="fd-notification-item__importance-tag" aria-label="Important">
            <Icon name="high-priority" size={12} />
            <span>Important</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────
   NotificationGroup
   ────────────────────────────────────────────────────── */
export interface NotificationGroupProps {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
}

export const NotificationGroup: React.FC<NotificationGroupProps> = ({
  title,
  children,
  defaultCollapsed = false,
  className = '',
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className={['fd-notification-group', className].filter(Boolean).join(' ')}>
      {/* Group header */}
      <div className="fd-notification-group__header">
        <button
          type="button"
          className={[
            'fd-notification-group__toggle',
            collapsed ? 'fd-notification-group__toggle--collapsed' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-expanded={!collapsed}
          aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
          onClick={() => setCollapsed((v) => !v)}
        >
          <Icon name="slim-arrow-down" size={12} />
        </button>
        <span className="fd-notification-group__title">{title}</span>
      </div>

      {!collapsed && (
        <div className="fd-notification-group__items">{children}</div>
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────────────
   NotificationPanel
   ────────────────────────────────────────────────────── */
export interface NotificationPanelProps {
  title?: string;
  children: React.ReactNode;
  showGrowing?: boolean;
  onLoadMore?: () => void;
  onOverflow?: () => void;
  onMarkAllRead?: () => void;
  onSettings?: () => void;
  className?: string;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  title = 'Notifications',
  children,
  showGrowing = false,
  onLoadMore,
  onOverflow,
  onMarkAllRead,
  onSettings,
  className = '',
}) => {
  return (
    <div className={['fd-notification-panel', className].filter(Boolean).join(' ')}>
      {/* Toolbar */}
      <div className="fd-notification-panel__toolbar">
        <span className="fd-notification-panel__title">{title}</span>
        <div className="fd-notification-panel__toolbar-actions">
          {onOverflow && (
            <button
              type="button"
              className="fd-notification-panel__toolbar-btn"
              aria-label="More actions"
              onClick={onOverflow}
            >
              <Icon name="overflow" size={16} />
            </button>
          )}
          {onMarkAllRead && (
            <button
              type="button"
              className="fd-notification-panel__toolbar-btn"
              aria-label="Mark all as read"
              onClick={onMarkAllRead}
            >
              <Icon name="accept" size={16} />
            </button>
          )}
          {onSettings && (
            <button
              type="button"
              className="fd-notification-panel__toolbar-btn"
              aria-label="Settings"
              onClick={onSettings}
            >
              <Icon name="action-settings" size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="fd-notification-panel__content">
        {children}

        {showGrowing && (
          <button
            type="button"
            className="fd-notification-panel__growing"
            onClick={onLoadMore}
          >
            More
          </button>
        )}
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────
   Legacy: NotificationList wrapper (backward-compat)
   ────────────────────────────────────────────────────── */
export interface NotificationListProps {
  items: NotificationListItemProps[];
  showGrowingButton?: boolean;
  onGrowingButtonClick?: () => void;
  className?: string;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  items,
  showGrowingButton = false,
  onGrowingButtonClick,
  className = '',
}) => (
  <div className={['fd-notification-list', className].filter(Boolean).join(' ')}>
    {items.map((item, i) => (
      <NotificationListItem key={item.id ?? i} {...item} />
    ))}
    {showGrowingButton && (
      <button
        type="button"
        className="fd-notification-panel__growing"
        onClick={onGrowingButtonClick}
      >
        More
      </button>
    )}
  </div>
);

export default NotificationListItem;
