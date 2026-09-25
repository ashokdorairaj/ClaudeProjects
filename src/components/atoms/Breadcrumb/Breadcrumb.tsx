import React, { useState, useRef, useEffect } from 'react';
import './Breadcrumb.css';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  currentItem?: string;
  className?: string;
}

const Sep = () => (
  <li className="fd-breadcrumb__item" aria-hidden="true">
    <span className="fd-breadcrumb__separator">/</span>
  </li>
);

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  currentItem,
  className = '',
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Collapse middle items when there are more than 2 navigable items
  const shouldCollapse = items.length > 2;
  // When collapsed, only show the last item in the breadcrumb trail
  const visibleItems = shouldCollapse ? [items[items.length - 1]] : items;
  // Hidden items go into the popover
  const hiddenItems = shouldCollapse ? items.slice(0, items.length - 1) : [];

  // Close popover on outside click
  useEffect(() => {
    if (!popoverOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popoverOpen]);

  // Close on Escape
  useEffect(() => {
    if (!popoverOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setPopoverOpen(false); btnRef.current?.focus(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [popoverOpen]);

  return (
    <nav aria-label="Breadcrumb" className={['fd-breadcrumb-nav', className].filter(Boolean).join(' ')}>
      <ol className="fd-breadcrumb">

        {/* Overflow button with popover */}
        {shouldCollapse && (
          <>
            <li className="fd-breadcrumb__item fd-breadcrumb__item--overflow">
              <div className="fd-breadcrumb__overflow-wrap">
                <button
                  ref={btnRef}
                  type="button"
                  className={['fd-breadcrumb__overflow-btn', popoverOpen ? 'fd-breadcrumb__overflow-btn--open' : ''].filter(Boolean).join(' ')}
                  aria-label="Show more breadcrumbs"
                  aria-expanded={popoverOpen}
                  aria-haspopup="listbox"
                  onClick={() => setPopoverOpen(o => !o)}
                >
                  <span className="fd-breadcrumb__overflow-dots">•••</span>
                  <span className="fd-breadcrumb__overflow-arrow">˅</span>
                </button>

                {popoverOpen && (
                  <div
                    ref={popoverRef}
                    className="fd-breadcrumb__popover"
                    role="listbox"
                    aria-label="Hidden breadcrumb items"
                  >
                    {hiddenItems.map((item, i) => (
                      <div
                        key={i}
                        role="option"
                        aria-selected={i === 0}
                        className={['fd-breadcrumb__popover-item', i === 0 ? 'fd-breadcrumb__popover-item--selected' : ''].filter(Boolean).join(' ')}
                        onClick={() => {
                          setPopoverOpen(false);
                          if (item.onClick) item.onClick();
                          else if (item.href) window.location.href = item.href;
                        }}
                      >
                        {item.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </li>
            <Sep />
          </>
        )}

        {/* Navigable items */}
        {visibleItems.map((item, i) => (
          <React.Fragment key={i}>
            {!shouldCollapse && i > 0 && <Sep />}
            <li className="fd-breadcrumb__item">
              {item.href ? (
                <a className="fd-breadcrumb__link" href={item.href}>
                  {item.label}
                </a>
              ) : (
                <button type="button" className="fd-breadcrumb__link" onClick={item.onClick}>
                  {item.label}
                </button>
              )}
            </li>
          </React.Fragment>
        ))}

        {/* Current page */}
        {currentItem && (
          <>
            <Sep />
            <li className="fd-breadcrumb__item">
              <span className="fd-breadcrumb__current" aria-current="page">
                {currentItem}
              </span>
            </li>
          </>
        )}

      </ol>
    </nav>
  );
};

export default Breadcrumb;
