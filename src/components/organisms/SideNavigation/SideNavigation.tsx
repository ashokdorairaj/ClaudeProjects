import React, { useState } from 'react';
import './SideNavigation.css';

/** Navigable leaf — no children, renders as `<a>` or `<button>` */
export interface NavLeafItem {
  kind?: 'leaf';
  key: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  disabled?: boolean;
  externalLink?: boolean;
}

/** Non-interactive section label — groups visible child items beneath it */
export interface NavGroupItem {
  kind: 'group';
  key: string;
  label: string;
  icon?: React.ReactNode;
  items: NavItem[];
}

/** Expandable parent — clicking toggles child visibility, does not navigate */
export interface NavParentItem {
  kind: 'parent';
  key: string;
  label: string;
  icon?: React.ReactNode;
  items: NavItem[];
  disabled?: boolean;
}

export type NavItem = NavLeafItem | NavGroupItem | NavParentItem;

/**
 * Left-rail primary navigation for an application. Supports groups, nested items, footer actions, and collapse.
 *
 * @see src/pages/docs/side-navigation.md
 *
 * @constraints
 * - Use `kind="group"` on a `NavGroupItem` to create a non-interactive section header with required children.
 * - Use `kind="parent"` on a `NavParentItem` for an expandable item that does not navigate.
 * - Leaf items (`kind="leaf"` or omitted) are the only type that support `href` and navigation.
 * - Set `href` on leaf items for browser-native navigation; use `onSelect` for SPA routing without full-page reload.
 * - `footerItems` are pinned to the bottom of the nav (e.g. Settings, Help) — keep to ≤3 items.
 * - `collapsed=true` hides labels and shows icons only — always provide `icon` on every top-level item when `onCollapse` is wired.
 * - Do not nest items more than 2 levels deep (group/parent → leaf).
 *
 * @example
 * <SideNavigation
 *   items={[
 *     { key: 'home', label: 'Home', icon: <Icon name="home" /> },
 *     { key: 'orders', label: 'Orders', icon: <Icon name="sales-order" />, items: [
 *       { key: 'open', label: 'Open Orders' },
 *       { key: 'history', label: 'Order History' },
 *     ]},
 *   ]}
 *   selectedKey={currentKey}
 *   onSelect={navigate}
 *   onCollapse={setCollapsed}
 * />
 */
export interface SideNavigationProps {
  items: NavItem[];
  selectedKey?: string;
  collapsed?: boolean;
  formFactor?: 'cozy' | 'compact';
  onSelect?: (key: string) => void;
  onCollapse?: (collapsed: boolean) => void;
  /** Slot above the nav list — renders with bottom border */
  header?: React.ReactNode;
  /** Fixed-bottom items rendered in the footer section (below the separator) */
  footerItems?: NavItem[];
  /** Legacy arbitrary footer slot (below footerItems) */
  footer?: React.ReactNode;
  className?: string;
}

interface NavItemNodeProps {
  item: NavItem;
  /** 0 = top-level, 1 = child item */
  level: number;
  selectedKey?: string;
  collapsed?: boolean;
  expandedKeys: Set<string>;
  onToggleExpand: (key: string) => void;
  onSelect?: (key: string) => void;
}

/** Chevron icons using SAP slim-arrow paths */
const ChevronRight: React.FC = () => (
  <svg
    className="fd-side-nav__chevron-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 12 12"
    width="12"
    height="12"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M4.293 1.293a1 1 0 0 1 1.414 0l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414-1.414L7.586 6 4.293 2.707a1 1 0 0 1 0-1.414z" />
  </svg>
);

const ChevronDown: React.FC = () => (
  <svg
    className="fd-side-nav__chevron-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 12 12"
    width="12"
    height="12"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M1.293 3.293a1 1 0 0 1 1.414 0L6 6.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 0-1.414z" />
  </svg>
);

const NavItemNode: React.FC<NavItemNodeProps> = ({
  item,
  level,
  selectedKey,
  collapsed,
  expandedKeys,
  onToggleExpand,
  onSelect,
}) => {
  const hasChildren = item.kind === 'group' || item.kind === 'parent';
  const isSelected = selectedKey === item.key;
  const isExpanded = expandedKeys.has(item.key);
  const isChild = level > 0;

  // Group headers: non-interactive label row
  if (item.kind === 'group' && !collapsed) {
    return (
      <li role="none">
        <div className="fd-side-nav__group-header">
          <span className="fd-side-nav__group-text">{item.label}</span>
          <span className="fd-side-nav__group-chevron" aria-hidden="true">
            <ChevronDown />
          </span>
        </div>
        <ul className="fd-side-nav__children" role="menu">
          {item.items.map((child) => (
            <NavItemNode
              key={child.key}
              item={child}
              level={1}
              selectedKey={selectedKey}
              collapsed={collapsed}
              expandedKeys={expandedKeys}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
            />
          ))}
        </ul>
      </li>
    );
  }

  const isDisabled = item.kind !== 'group' ? item.disabled : false;

  const classNames = [
    'fd-side-nav__item',
    isChild ? 'fd-side-nav__item--child' : '',
    isSelected ? 'fd-side-nav__item--selected' : '',
    hasChildren ? 'fd-side-nav__item--has-children' : '',
    hasChildren && isExpanded ? 'fd-side-nav__item--expanded' : '',
    isDisabled ? 'fd-side-nav__item--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = (e: React.MouseEvent) => {
    if (isDisabled) return;
    if (item.kind === 'parent') {
      e.preventDefault();
      onToggleExpand(item.key);
    } else {
      onSelect?.(item.key);
    }
  };

  const labelTitle = collapsed ? item.label : undefined;
  const href = item.kind !== 'group' && item.kind !== 'parent' ? item.href : undefined;
  const externalLink = item.kind !== 'group' && item.kind !== 'parent' ? item.externalLink : false;

  const inner = (
    <>
      {/* Collapsed: icon wrapped in touch-area container */}
      {collapsed ? (
        <span className="fd-side-nav__icon-container" aria-hidden="true">
          {item.icon ? (
            <span className="fd-side-nav__icon">{item.icon}</span>
          ) : null}
        </span>
      ) : (
        <>
          {item.icon && (
            <span className="fd-side-nav__icon" aria-hidden="true">
              {item.icon}
            </span>
          )}
          <span className="fd-side-nav__text">{item.label}</span>
        </>
      )}

      {/* Expand/collapse chevron — expanded mode only */}
      {!collapsed && hasChildren && (
        <span className="fd-side-nav__expand-btn" aria-hidden="true">
          {isExpanded ? <ChevronDown /> : <ChevronRight />}
        </span>
      )}

      {/* Collapsed: small arrow indicator when item has children */}
      {collapsed && hasChildren && (
        <span className="fd-side-nav__collapsed-arrow" aria-hidden="true">
          <ChevronRight />
        </span>
      )}

      {/* Selected accent bar */}
      {isSelected && (
        <span className="fd-side-nav__selection-bar" aria-hidden="true" />
      )}
    </>
  );

  return (
    <li role="none">
      {href && item.kind !== 'parent' ? (
        <a
          className={classNames}
          href={isDisabled ? undefined : href}
          title={labelTitle}
          aria-current={isSelected ? 'page' : undefined}
          aria-disabled={isDisabled ? 'true' : undefined}
          target={externalLink ? '_blank' : undefined}
          rel={externalLink ? 'noopener noreferrer' : undefined}
          onClick={(e) => {
            if (isDisabled) e.preventDefault();
            else onSelect?.(item.key);
          }}
          role="menuitem"
        >
          {inner}
        </a>
      ) : (
        <button
          className={classNames}
          title={labelTitle}
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-disabled={isDisabled ? 'true' : undefined}
          disabled={isDisabled}
          onClick={handleClick}
          type="button"
          role="menuitem"
        >
          {inner}
        </button>
      )}

      {item.kind === 'parent' && isExpanded && !collapsed && (
        <ul className="fd-side-nav__children" role="menu">
          {item.items.map((child) => (
            <NavItemNode
              key={child.key}
              item={child}
              level={1}
              selectedKey={selectedKey}
              collapsed={collapsed}
              expandedKeys={expandedKeys}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export const SideNavigation: React.FC<SideNavigationProps> = ({
  items,
  selectedKey,
  collapsed = false,
  formFactor = 'cozy',
  onSelect,
  onCollapse,
  header,
  footerItems,
  footer,
  className = '',
}) => {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const handleToggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const classNames = [
    'fd-side-nav',
    collapsed ? 'fd-side-nav--collapsed' : '',
    formFactor === 'compact' ? 'fd-side-nav--compact' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const hasFooterContent = (footerItems && footerItems.length > 0) || footer || onCollapse;

  return (
    <nav className={classNames} aria-label="Side navigation">
      {header && <div className="fd-side-nav__header">{header}</div>}

      {/* Scrollable main content area */}
      <div className="fd-side-nav__content">
        <ul className="fd-side-nav__list" role="menu">
          {items.map((item) => (
            <NavItemNode
              key={item.key}
              item={item}
              level={0}
              selectedKey={selectedKey}
              collapsed={collapsed}
              expandedKeys={expandedKeys}
              onToggleExpand={handleToggleExpand}
              onSelect={onSelect}
            />
          ))}
        </ul>
      </div>

      {/* Fixed footer section */}
      {hasFooterContent && (
        <div className="fd-side-nav__footer">
          <div className="fd-side-nav__footer-separator" aria-hidden="true" />

          {footerItems && footerItems.length > 0 && (
            <ul className="fd-side-nav__list fd-side-nav__footer-list" role="menu">
              {footerItems.map((item) => (
                <NavItemNode
                  key={item.key}
                  item={item}
                  level={0}
                  selectedKey={selectedKey}
                  collapsed={collapsed}
                  expandedKeys={expandedKeys}
                  onToggleExpand={handleToggleExpand}
                  onSelect={onSelect}
                />
              ))}
            </ul>
          )}

          {footer}

          {onCollapse && (
            <button
              className="fd-side-nav__collapse-toggle"
              onClick={() => onCollapse(!collapsed)}
              aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
              type="button"
            >
              {collapsed ? (
                <ChevronRight />
              ) : (
                <svg
                  className="fd-side-nav__chevron-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 12 12"
                  width="12"
                  height="12"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M7.707 1.293a1 1 0 0 0-1.414 0l-4 4a1 1 0 0 0 0 1.414l4 4a1 1 0 0 0 1.414-1.414L4.414 6l3.293-3.293a1 1 0 0 0 0-1.414z" />
                </svg>
              )}
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default SideNavigation;
