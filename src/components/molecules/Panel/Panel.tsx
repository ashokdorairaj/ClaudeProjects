import React, { useId, useState } from 'react';
import type { FormFactor } from '../../../tokens';
import { Icon } from '../../atoms/Icon';
import './Panel.css';

/**
 * Collapsible content region with a titled header and optional action buttons.
 *
 * @see src/pages/docs/panel.md
 *
 * @constraints
 * - Use to group related form sections or details that benefit from show/hide toggle.
 * - `fixed=true` hides the toggle and keeps the panel always expanded — use for permanently visible sections.
 * - Provide at most 4 icon buttons in `actions`; excess buttons overflow outside the panel header.
 * - For a page-level expandable region, prefer `Panel` over a custom accordion.
 *
 * @example
 * // Controlled panel
 * <Panel title="Shipping Address" collapsed={collapsed} onToggle={setCollapsed}>
 *   <FormItem label="Street"><Input /></FormItem>
 * </Panel>
 *
 * @example
 * // Fixed (always-open) panel
 * <Panel title="Summary" fixed>
 *   <Text>Total: $1,234.56</Text>
 * </Panel>
 */
export interface PanelProps {
  /** Panel heading text */
  title?: string;
  /** Panel body content */
  children?: React.ReactNode;
  /** Up to 4 icon buttons rendered to the right of the title */
  actions?: React.ReactNode;
  /** Controlled collapsed state */
  collapsed?: boolean;
  /** Initial collapsed state (uncontrolled) */
  defaultCollapsed?: boolean;
  /** When true the toggle button is hidden and the panel is always open */
  fixed?: boolean;
  /** Cozy (default) or Compact density */
  formFactor?: FormFactor;
  /** Called when the user toggles the panel; receives the new collapsed state */
  onToggle?: (collapsed: boolean) => void;
  className?: string;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  children,
  actions,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  fixed = false,
  formFactor = 'cozy',
  onToggle,
  className = '',
}) => {
  const headerId = useId();
  const contentId = useId();

  // Uncontrolled internal state – only used when collapsedProp is undefined
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);

  const isControlled = collapsedProp !== undefined;
  const isCollapsed = fixed ? false : isControlled ? collapsedProp : internalCollapsed;

  const handleToggle = () => {
    if (fixed) return;
    const next = !isCollapsed;
    if (!isControlled) {
      setInternalCollapsed(next);
    }
    onToggle?.(next);
  };

  const panelClasses = [
    'fd-panel',
    formFactor === 'compact' ? 'fd-panel--compact' : '',
    fixed ? 'fd-panel--fixed' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const contentClasses = [
    'fd-panel__content',
    isCollapsed ? 'fd-panel__content--collapsed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={panelClasses}>
      <div
        className="fd-panel__header"
        id={headerId}
      >
        {!fixed && (
          <button
            type="button"
            className="fd-panel__toggle-btn"
            aria-expanded={!isCollapsed}
            aria-controls={contentId}
            onClick={handleToggle}
            aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
          >
            <span
              className={[
                'fd-panel__toggle-icon',
                isCollapsed ? 'fd-panel__toggle-icon--collapsed' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-hidden="true"
            >
              <Icon name="slim-arrow-down" size={16} />
            </span>
          </button>
        )}
        {title && (
          <span className="fd-panel__title">{title}</span>
        )}
        {actions && (
          <div className="fd-panel__actions" role="toolbar" aria-label="Panel actions">
            {actions}
          </div>
        )}
      </div>
      <div
        id={contentId}
        className={contentClasses}
        role="region"
        aria-labelledby={headerId}
      >
        <div className="fd-panel__content-inner">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Panel;
