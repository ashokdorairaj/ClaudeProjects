import React from 'react';
import './Toolbar.css';

export type ToolbarDesign = 'Auto' | 'Solid' | 'Transparent' | 'Translucent' | 'Info';

/**
 * Horizontal action bar grouping Buttons, selects, and other controls for a screen section.
 *
 * @see src/pages/docs/toolbar.md
 *
 * @constraints
 * - Place a single `ToolbarSpacer` to push trailing actions to the far right.
 * - Use `ToolbarSeparator` to visually divide groups of related controls.
 * - `dense=true` for compact/list toolbars; omit for page-level toolbars.
 * - `hasOverflow=true` adds the "…" button — wire it to a `Popover` or `Menu` for the hidden items.
 * - Do not place primary Submit/Cancel actions in a Toolbar — those belong in a Dialog footer or Page footer.
 *
 * @example
 * <Toolbar title="Orders">
 *   <Button design="Emphasized" icon="add">New Order</Button>
 *   <ToolbarSeparator />
 *   <Button design="Default" icon="filter">Filter</Button>
 *   <ToolbarSpacer />
 *   <Button design="Transparent" icon="action-settings" iconOnly />
 * </Toolbar>
 */
export interface ToolbarProps {
  /** Toolbar title — rendered as the leftmost text label. */
  title?: string;
  /** Buttons, separators, spacers, and other controls. */
  children?: React.ReactNode;
  /**
   * Background / visual design variant.
   * - `Auto`        – inherits the surrounding surface (default)
   * - `Solid`       – opaque, uses `--sapGroup_TitleBackground`
   * - `Transparent` – fully transparent, no border
   * - `Translucent` – semi-transparent (glass effect)
   * - `Info`        – informational blue strip, uses `--sapInfobar_Background`
   */
  design?: ToolbarDesign;
  /**
   * Compact/dense mode — 32 px height instead of the default 44 px cozy height.
   * Maps to `fd-toolbar--compact`.
   */
  dense?: boolean;
  /**
   * Show the overflow ("…") button at the trailing edge.
   * Use when the toolbar content may not fit in the available width.
   */
  hasOverflow?: boolean;
  className?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  title,
  children,
  design = 'Auto',
  dense = false,
  hasOverflow = false,
  className = '',
}) => {
  const classNames = [
    'fd-toolbar',
    dense ? 'fd-toolbar--compact' : '',
    design !== 'Auto' ? `fd-toolbar--${design.toLowerCase()}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} role="toolbar">
      {title && <span className="fd-toolbar__title">{title}</span>}
      {children}
      {hasOverflow && (
        <button
          className="fd-toolbar__overflow-btn"
          type="button"
          aria-label="More actions"
          aria-haspopup="menu"
        >
          {/* SAP "overflow" icon — three horizontal dots */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="2" cy="8" r="1.5" fill="currentColor" />
            <circle cx="8" cy="8" r="1.5" fill="currentColor" />
            <circle cx="14" cy="8" r="1.5" fill="currentColor" />
          </svg>
        </button>
      )}
    </div>
  );
};

/** Flexible horizontal spacer — pushes subsequent items to the far right. */
export const ToolbarSpacer: React.FC = () => (
  <span className="fd-toolbar__spacer" aria-hidden="true" />
);

/** 1 px vertical divider between groups of toolbar items. */
export const ToolbarSeparator: React.FC = () => (
  <span className="fd-toolbar__separator" role="separator" aria-hidden="true" />
);

export default Toolbar;
