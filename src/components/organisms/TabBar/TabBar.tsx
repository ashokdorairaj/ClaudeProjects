import React, { useRef, useState, useLayoutEffect, useCallback } from 'react';
import './TabBar.css';

export interface TabItem {
  key: string;
  label?: string;
  icon?: React.ReactNode;
  /** Dot badge shown at the top-right corner of the tab (use for unread/alert presence). */
  badge?: string;
  /** Inline item count rendered after the label. */
  counter?: number;
  additionalText?: string;
  disabled?: boolean;
  valueState?: 'Positive' | 'Negative' | 'Critical' | 'Information';
}

/**
 * Horizontal tab strip for switching between peer content sections within a page.
 *
 * @see src/pages/docs/tabbar.md
 *
 * @constraints
 * - Use `type="text"` (default) for label-only tabs; `"icon-text"` when icons add meaningful context; `"icon"` only for well-known icon-only sets.
 * - Overflow is handled automatically — tabs that don't fit are moved to a "More" dropdown.
 * - `semantic=true` enables `valueState` color coding on individual `TabItem` entries — use for status-driven views only.
 * - `badge` on a `TabItem` is for presence indicators (unread count) — do not use as a general-purpose label.
 * - Always control the selected state externally via `selectedKey` + `onSelect`; never mutate items array.
 *
 * @example
 * <TabBar
 *   items={[
 *     { key: 'overview', label: 'Overview' },
 *     { key: 'details', label: 'Details', counter: 3 },
 *     { key: 'attachments', label: 'Attachments', badge: '2' },
 *   ]}
 *   selectedKey={tab}
 *   onSelect={setTab}
 * />
 */
export interface TabBarProps {
  items: TabItem[];
  selectedKey?: string;
  type?: 'text' | 'icon' | 'icon-text';
  formFactor?: 'cozy' | 'compact';
  semantic?: boolean;
  onSelect?: (key: string) => void;
  className?: string;
}

export const TabBar: React.FC<TabBarProps> = ({
  items,
  selectedKey,
  type = 'text',
  formFactor = 'cozy',
  semantic = false,
  onSelect,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLUListElement>(null);
  const [overflowKeys, setOverflowKeys] = useState<string[]>([]);
  const [overflowOpen, setOverflowOpen] = useState(false);

  const measureOverflow = useCallback(() => {
    const container = containerRef.current;
    const tabsList = tabsRef.current;
    if (!container || !tabsList) return;

    // Reset to measure true widths
    setOverflowKeys([]);

    requestAnimationFrame(() => {
      const containerWidth = container.offsetWidth;
      // Reserve space for the overflow button (approx 80px for "More ˅")
      const overflowBtnWidth = 80;
      const tabEls = Array.from(
        tabsList.querySelectorAll<HTMLLIElement>('[data-tab-key]')
      );

      let usedWidth = 0;
      const hidden: string[] = [];

      for (const el of tabEls) {
        usedWidth += el.offsetWidth;
        if (usedWidth + overflowBtnWidth > containerWidth) {
          const key = el.getAttribute('data-tab-key') ?? '';
          hidden.push(key);
        }
      }

      setOverflowKeys(hidden);
    });
  }, []);

  useLayoutEffect(() => {
    measureOverflow();
    const obs = new ResizeObserver(measureOverflow);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [items, measureOverflow]);

  const hiddenItems = items.filter((t) => overflowKeys.includes(t.key));

  const valueStateClass = (item: TabItem) => {
    if (!semantic || !item.valueState) return '';
    return `fd-tab-bar__tab--${item.valueState.toLowerCase()}`;
  };

  const containerClass = [
    'fd-tab-bar',
    formFactor === 'compact' ? 'fd-tab-bar--compact' : '',
    type === 'icon' ? 'fd-tab-bar--icon' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClass} ref={containerRef} role="tablist">
      <ul className="fd-tab-bar__tabs" ref={tabsRef} role="presentation">
        {items.map((item) => {
          const isSelected = item.key === selectedKey;
          const isHidden = overflowKeys.includes(item.key);

          const tabClass = [
            'fd-tab-bar__tab',
            isSelected ? 'fd-tab-bar__tab--selected' : '',
            item.disabled ? 'fd-tab-bar__tab--disabled' : '',
            valueStateClass(item),
            isHidden ? 'fd-tab-bar__tab--hidden' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <li
              key={item.key}
              className={tabClass}
              data-tab-key={item.key}
              role="tab"
              aria-selected={isSelected}
              aria-disabled={item.disabled ? 'true' : undefined}
              onClick={() => {
                if (!item.disabled) onSelect?.(item.key);
              }}
              tabIndex={item.disabled ? -1 : 0}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !item.disabled) {
                  onSelect?.(item.key);
                }
              }}
            >
              {/* Inner row: icon + label + counter + additionalText */}
              <span className="fd-tab-bar__tab-inner">
                {(type === 'icon' || type === 'icon-text') && item.icon && (
                  <span className="fd-tab-bar__icon" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                {(type === 'text' || type === 'icon-text') && item.label && (
                  <span className="fd-tab-bar__label">{item.label}</span>
                )}
                {type === 'icon' && !item.label && item.icon && (
                  // icon-only: icon already rendered above, label hidden
                  null
                )}
                {item.counter !== undefined && (
                  <span className="fd-tab-bar__counter">{item.counter}</span>
                )}
                {item.additionalText && (
                  <span className="fd-tab-bar__additional-text">
                    {item.additionalText}
                  </span>
                )}
              </span>

              {/* Badge dot – absolutely positioned at top-right */}
              {item.badge && (
                <span
                  className="fd-tab-bar__badge"
                  aria-label={`${item.badge} notifications`}
                >
                  {item.badge}
                </span>
              )}

              {/* Selection bar – absolutely positioned at bottom, only shown when selected */}
              <span className="fd-tab-bar__indicator" aria-hidden="true" />
            </li>
          );
        })}
      </ul>

      {hiddenItems.length > 0 && (
        <div className="fd-tab-bar__overflow-wrapper">
          <button
            className="fd-tab-bar__overflow-btn"
            onClick={() => setOverflowOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={overflowOpen}
            type="button"
            aria-label="More tabs"
          >
            {/* Figma: "More ˅" label for named overflow, "+N ˅" for count overflow */}
            {hiddenItems.length === 1 && hiddenItems[0].label
              ? hiddenItems[0].label
              : `+${hiddenItems.length}`}
            <span className="fd-tab-bar__overflow-chevron" aria-hidden="true">
              ˅
            </span>
          </button>
          {overflowOpen && (
            <ul
              className="fd-tab-bar__overflow-menu"
              role="listbox"
              onBlur={() => setOverflowOpen(false)}
            >
              {hiddenItems.map((item) => (
                <li
                  key={item.key}
                  className={[
                    'fd-tab-bar__overflow-item',
                    item.key === selectedKey ? 'fd-tab-bar__overflow-item--selected' : '',
                    item.disabled ? 'fd-tab-bar__overflow-item--disabled' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  role="option"
                  aria-selected={item.key === selectedKey}
                  onClick={() => {
                    if (!item.disabled) {
                      onSelect?.(item.key);
                      setOverflowOpen(false);
                    }
                  }}
                >
                  {item.icon && (
                    <span className="fd-tab-bar__icon" aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  {item.label}
                  {item.counter !== undefined && (
                    <span className="fd-tab-bar__counter">{item.counter}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default TabBar;
