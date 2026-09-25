import React from 'react';
import './ToolHeader.css';

/**
 * Page-level heading bar combining a title, optional description, and primary action buttons.
 *
 * @see src/pages/docs/tool-header.md
 *
 * @constraints
 * - Use exactly **one** `ToolHeader` per page, positioned directly below `ShellBar` (or `TabBar` if tabs are present).
 * - Place primary CTA buttons (Create, Save, Submit) in `actions`; limit to 3–4 top-level buttons.
 * - `navigationAction` is for a single back-button or breadcrumb — do not pass a full `Toolbar` there.
 * - Do not use `ToolHeader` inside a `Dialog` or `Panel` — it is a full-page layout element.
 *
 * @example
 * <ToolHeader
 *   title="Purchase Orders"
 *   description="Manage and track all purchase orders"
 *   navigationAction={<Button design="Transparent" icon="nav-back" iconOnly onClick={goBack} />}
 *   actions={<><Button design="Emphasized" icon="add">New Order</Button><Button design="Default" icon="filter">Filter</Button></>}
 * />
 */
export interface ToolHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  navigationAction?: React.ReactNode;
  formFactor?: 'cozy' | 'compact';
  className?: string;
}

export const ToolHeader: React.FC<ToolHeaderProps> = ({
  title,
  description,
  actions,
  navigationAction,
  formFactor = 'cozy',
  className = '',
}) => {
  const classNames = [
    'fd-tool-header',
    formFactor === 'compact' ? 'fd-tool-header--compact' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={classNames}>
      {navigationAction && (
        <div className="fd-tool-header__nav">{navigationAction}</div>
      )}

      <div className="fd-tool-header__content">
        <h1 className="fd-tool-header__title">{title}</h1>
        {description && (
          <p className="fd-tool-header__description">{description}</p>
        )}
      </div>

      {actions && (
        <div className="fd-tool-header__actions">{actions}</div>
      )}
    </header>
  );
};

export default ToolHeader;
