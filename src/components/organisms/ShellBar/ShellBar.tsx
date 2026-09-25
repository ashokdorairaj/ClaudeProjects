import React from 'react';
import './ShellBar.css';

/**
 * Application-level top bar — brand identity, global search, and user/notification actions.
 *
 * @see src/pages/docs/shellbar.md
 *
 * @constraints
 * - There must be exactly **one** `ShellBar` per application layout, mounted outside the page content area.
 * - Place notification bell and user avatar in `actions` / `profile` slots — do not hardcode them in the body.
 * - `onBack` shows a back arrow at the leading edge — use only for detail pages, not top-level navigation.
 * - `design="Inverted"` `Link` components are safe inside ShellBar actions; all others should use `Button design="Transparent"`.
 * - Do not place `Toolbar` or `TabBar` inside `ShellBar` — those belong in the page content area.
 *
 * @example
 * <ShellBar
 *   logo={<img src="/logo.svg" alt="ACME Corp" />}
 *   productName="Procurement"
 *   actions={<Button design="Transparent" icon="bell" iconOnly aria-label="Notifications" />}
 *   profile={<Avatar initials="JD" size="xs" />}
 * />
 */
export interface ShellBarProps {
  /** Brand logo node */
  logo?: React.ReactNode;
  /** Product name */
  productName?: string;
  /** Secondary title (e.g. tenant) */
  secondaryTitle?: string;
  /** Search field node */
  search?: React.ReactNode;
  /** Action items (right-side) */
  actions?: React.ReactNode;
  /** Profile/user avatar */
  profile?: React.ReactNode;
  /** Back navigation button */
  onBack?: () => void;
  /** Height size: cozy = 44px, compact = 32px */
  size?: 'cozy' | 'compact';
  className?: string;
}

export const ShellBar: React.FC<ShellBarProps> = ({
  logo,
  productName,
  secondaryTitle,
  search,
  actions,
  profile,
  onBack,
  size = 'cozy',
  className = '',
}) => {
  return (
    <header
      className={[
        'fd-shellbar',
        size === 'compact' ? 'fd-shellbar--compact' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="banner"
    >
      <div className="fd-shellbar__start">
        {onBack && (
          <button className="fd-shellbar__btn" onClick={onBack} aria-label="Go back" type="button">
            ←
          </button>
        )}
        {logo && <div className="fd-shellbar__logo">{logo}</div>}
        {productName && (
          <div className="fd-shellbar__product">
            <span className="fd-shellbar__product-name">{productName}</span>
            {secondaryTitle && (
              <span className="fd-shellbar__secondary-title">{secondaryTitle}</span>
            )}
          </div>
        )}
      </div>

      {search && (
        <div className="fd-shellbar__center">{search}</div>
      )}

      <div className="fd-shellbar__end">
        {actions && <div className="fd-shellbar__actions">{actions}</div>}
        {profile && <div className="fd-shellbar__profile">{profile}</div>}
      </div>
    </header>
  );
};

export default ShellBar;
