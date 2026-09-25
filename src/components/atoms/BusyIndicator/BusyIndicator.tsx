import React from 'react';
import './BusyIndicator.css';

export type BusyIndicatorSize = 'sm' | 'md' | 'lg';

/**
 * Loading spinner for async operations. Show while fetching data or processing.
 *
 * @see src/pages/docs/busy-indicator.md
 *
 * @constraints
 * - Debounce below 200ms — do not show for operations that complete near-instantly.
 * - Do not use for known-% completion — use `ProgressIndicator` instead.
 * - `inline=false` renders as a full overlay; use inside a relatively-positioned container.
 *
 * @example
 * // Inline while loading a list
 * {loading ? <BusyIndicator label="Loading orders…" /> : <List>{rows}</List>}
 */
export interface BusyIndicatorProps {
  size?: BusyIndicatorSize;
  label?: string;
  /** Show inline (not overlay) */
  inline?: boolean;
  className?: string;
}

export const BusyIndicator: React.FC<BusyIndicatorProps> = ({
  size = 'md',
  label,
  inline = true,
  className = '',
}) => {
  return (
    <div
      className={['fd-busy-indicator', `fd-busy-indicator--${size}`, inline ? 'fd-busy-indicator--inline' : 'fd-busy-indicator--overlay', className].filter(Boolean).join(' ')}
      role="status"
      aria-label={label ?? 'Loading'}
    >
      <div className="fd-busy-indicator__dots">
        <span className="fd-busy-indicator__dot" />
        <span className="fd-busy-indicator__dot" />
        <span className="fd-busy-indicator__dot" />
      </div>
      {label && (
        <span className="fd-busy-indicator__label">{label}</span>
      )}
    </div>
  );
};

export default BusyIndicator;
