import React, { useEffect, useRef, useState } from 'react';
import './UserMenu.css';

/* ── Account list item (Other Accounts panel) ──────────── */
export interface UserMenuAccount {
  /** Display name */
  name: string;
  /** First subline (e.g. role) */
  subline1?: string;
  /** Second subline (e.g. org unit) */
  subline2?: string;
  /** Initials for the avatar when no image is supplied */
  initials?: string;
  /** Avatar image URL */
  avatarSrc?: string;
  /** Mark this account as the currently active one */
  active?: boolean;
  onClick?: () => void;
}

/* ── Individual menu list item ──────────────────────────── */
export interface UserMenuItemDef {
  key: string;
  label: string;
  /** Icon node (16 × 16 area) */
  icon?: React.ReactNode;
  /** Render a horizontal separator below this item */
  separator?: boolean;
  /** Show a trailing navigation arrow → */
  navArrow?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

/* ── Component props ────────────────────────────────────── */
export interface UserMenuProps {
  /** Primary user name – bold, 16 px */
  userName: string;
  /** First subline (role, title…) */
  subline1?: string;
  /** Second subline (org, email…) */
  subline2?: string;
  /** Avatar node rendered in the header (48 × 48 recommended) */
  avatar?: React.ReactNode;
  /** Label for the "Manage Accounts" button; omit to hide */
  manageAccountsLabel?: string;
  onManageAccounts?: () => void;
  /** Other accounts shown in the collapsible "Other Accounts" panel */
  otherAccounts?: UserMenuAccount[];
  /** Label for the Other Accounts panel header */
  otherAccountsLabel?: string;
  /** Whether the Other Accounts panel is open by default */
  otherAccountsOpen?: boolean;
  /** Flat menu items (Settings, Legal Info, About…) */
  menuItems?: UserMenuItemDef[];
  /** Label for the footer Sign Out button */
  signOutLabel?: string;
  onSignOut?: () => void;
  open?: boolean;
  anchorElement?: HTMLElement | null;
  /** cozy (default) = 320 px wide, compact = slightly smaller */
  formFactor?: 'cozy' | 'compact';
  onClose?: () => void;
  className?: string;
  /** Override position (top/right in px relative to viewport) */
  style?: React.CSSProperties;
}

/* ── Small account avatar helper ───────────────────────── */
const AccountAvatar: React.FC<{ src?: string; initials?: string }> = ({ src, initials }) => (
  <div className="fd-user-menu__account-avatar">
    {src
      ? <img src={src} alt="" className="fd-user-menu__account-avatar-img" />
      : <span className="fd-user-menu__account-avatar-initials">{initials ?? '?'}</span>
    }
  </div>
);

/* ── Main component ─────────────────────────────────────── */
export const UserMenu: React.FC<UserMenuProps> = ({
  userName,
  subline1,
  subline2,
  avatar,
  manageAccountsLabel = 'Manage Accounts',
  onManageAccounts,
  otherAccounts = [],
  otherAccountsLabel,
  otherAccountsOpen: defaultOtherOpen = false,
  menuItems = [],
  signOutLabel = 'Sign Out',
  onSignOut,
  open = false,
  anchorElement,
  formFactor = 'cozy',
  onClose,
  className = '',
  style,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [accountsExpanded, setAccountsExpanded] = useState(defaultOtherOpen);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);

  // Position below-right of the anchor element
  useEffect(() => {
    if (!open || !anchorElement) { setPosition(null); return; }
    const rect = anchorElement.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
  }, [open, anchorElement]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        (!anchorElement || !anchorElement.contains(target))
      ) {
        onClose?.();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open, anchorElement, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const panelLabel = otherAccountsLabel
    ?? `Other Accounts${otherAccounts.length > 0 ? ` (${otherAccounts.length})` : ''}`;

  return (
    <div
      ref={menuRef}
      className={[
        'fd-user-menu',
        `fd-user-menu--${formFactor}`,
        className,
      ].filter(Boolean).join(' ')}
      style={{
        ...(position ? { top: position.top, right: position.right } : {}),
        ...style,
      }}
      role="dialog"
      aria-label="User menu"
      aria-modal="true"
    >
      {/* ── Content container ── */}
      <div className="fd-user-menu__content">

        {/* User info */}
        <div className="fd-user-menu__user-info">
          {avatar && <div className="fd-user-menu__avatar">{avatar}</div>}
          <p className="fd-user-menu__user-name">{userName}</p>
          {subline1 && <p className="fd-user-menu__subline">{subline1}</p>}
          {subline2 && <p className="fd-user-menu__subline">{subline2}</p>}

          {/* Manage Accounts button */}
          {onManageAccounts && (
            <button
              className="fd-user-menu__manage-btn"
              onClick={onManageAccounts}
              type="button"
            >
              <span className="fd-user-menu__manage-btn-icon" aria-hidden="true">
                {/* person+ icon */}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM1 13.5c0-2.485 2.239-4.5 5-4.5 .36 0 .71.034 1.048.1M12 10v4M10 12h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              {manageAccountsLabel}
            </button>
          )}
        </div>

        {/* Other Accounts collapsible panel */}
        {otherAccounts.length > 0 && (
          <div className="fd-user-menu__panel">
            {/* Panel header */}
            <div className="fd-user-menu__panel-header">
              <button
                className="fd-user-menu__panel-toggle"
                onClick={() => setAccountsExpanded(v => !v)}
                aria-expanded={accountsExpanded}
                type="button"
              >
                <span
                  className={[
                    'fd-user-menu__panel-arrow',
                    accountsExpanded ? 'fd-user-menu__panel-arrow--open' : '',
                  ].filter(Boolean).join(' ')}
                  aria-hidden="true"
                >
                  {/* slim-arrow-right */}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </button>
              <span className="fd-user-menu__panel-title">{panelLabel}</span>
              {/* Add account icon button */}
              <button className="fd-user-menu__panel-action" type="button" aria-label="Add account">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM1 13.5c0-2.485 2.239-4.5 5-4.5M12 10v4M10 12h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Panel list */}
            {accountsExpanded && (
              <ul className="fd-user-menu__accounts" role="list">
                {otherAccounts.map((acc, idx) => (
                  <li
                    key={idx}
                    className="fd-user-menu__account-item"
                    onClick={acc.onClick}
                    role={acc.onClick ? 'button' : undefined}
                    tabIndex={acc.onClick ? 0 : undefined}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && acc.onClick) acc.onClick();
                    }}
                  >
                    <AccountAvatar src={acc.avatarSrc} initials={acc.initials} />
                    <div className="fd-user-menu__account-text">
                      <span className="fd-user-menu__account-name">{acc.name}</span>
                      {acc.subline1 && <span className="fd-user-menu__account-subline">{acc.subline1}</span>}
                      {acc.subline2 && <span className="fd-user-menu__account-subline">{acc.subline2}</span>}
                    </div>
                    {acc.active && (
                      <span className="fd-user-menu__account-check" aria-label="Active account">
                        {/* status-completed checkmark */}
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="8" cy="8" r="7.5" fill="var(--sapPositiveColor,#107E3E)" stroke="var(--sapPositiveColor,#107E3E)"/>
                          <path d="M4.5 8l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    )}
                    {/* bottom separator */}
                    <div className="fd-user-menu__account-sep" aria-hidden="true" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Flat menu items */}
        {menuItems.length > 0 && (
          <ul className="fd-user-menu__items" role="menu">
            {menuItems.map((item) => (
              <React.Fragment key={item.key}>
                <li
                  className={[
                    'fd-user-menu__item',
                    item.disabled ? 'fd-user-menu__item--disabled' : '',
                  ].filter(Boolean).join(' ')}
                  role="menuitem"
                  aria-disabled={item.disabled ? 'true' : undefined}
                  tabIndex={item.disabled ? -1 : 0}
                  onClick={() => { if (!item.disabled) { item.onClick?.(); onClose?.(); } }}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !item.disabled) {
                      item.onClick?.(); onClose?.();
                    }
                  }}
                >
                  {item.icon && (
                    <span className="fd-user-menu__item-icon" aria-hidden="true">{item.icon}</span>
                  )}
                  <span className="fd-user-menu__item-label">{item.label}</span>
                  {item.navArrow && (
                    <span className="fd-user-menu__item-nav-arrow" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </li>
                {item.separator && (
                  <li role="separator" className="fd-user-menu__separator" aria-hidden="true" />
                )}
              </React.Fragment>
            ))}
          </ul>
        )}
      </div>

      {/* ── Footer ── */}
      {onSignOut && (
        <div className="fd-user-menu__footer">
          <button
            className="fd-user-menu__sign-out"
            onClick={() => { onSignOut(); onClose?.(); }}
            type="button"
          >
            {/* log/logout icon */}
            <span className="fd-user-menu__sign-out-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 3h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-3M7 11l4-4-4-4M11 8H2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            {signOutLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
