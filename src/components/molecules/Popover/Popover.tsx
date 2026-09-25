import React, { useEffect, useRef, useState } from 'react';
import './Popover.css';

export type PopoverPlacement =
  | 'bottom'
  | 'top'
  | 'left'
  | 'right'
  | 'bottom-start'
  | 'bottom-end';

/**
 * Anchored overlay panel for contextual detail, settings, or quick actions tied to a trigger element.
 *
 * @see src/pages/docs/popover.md
 *
 * @constraints
 * - Always pair with an `anchorElement` ref — placement is calculated from the anchor bounds.
 * - Use for non-blocking context: help text, filter panels, quick-edit forms. For blocking tasks use `Dialog`.
 * - `placement="bottom-start"` (default: `"bottom"`) aligns to the left edge of the anchor — preferred for buttons.
 * - Close on outside click and Escape is handled internally via `onClose`; always wire `onClose` to toggle `open`.
 * - Do not stack Popovers; close the current one before opening another.
 *
 * @example
 * const [open, setOpen] = useState(false);
 * const ref = useRef<HTMLButtonElement>(null);
 * <Button ref={ref} onClick={() => setOpen(o => !o)}>Filters</Button>
 * <Popover open={open} anchorElement={ref.current} placement="bottom-start" onClose={() => setOpen(false)}>
 *   <FilterForm />
 * </Popover>
 */
export interface PopoverProps {
  open?: boolean;
  anchorElement?: HTMLElement | null;
  placement?: PopoverPlacement;
  title?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  /** Show a CSS arrow pointing to the anchor (default: true) */
  showArrow?: boolean;
  /** CSS width of the popover (default: 'auto') */
  width?: string;
  onClose?: () => void;
  className?: string;
}

interface Coords {
  top: number;
  left: number;
  arrowTop: number;
  arrowLeft: number;
}

const ARROW_SIZE = 8; // px
const GAP = 6; // px between anchor and popover

function calcPosition(
  anchor: HTMLElement,
  popover: HTMLElement,
  placement: PopoverPlacement
): Coords {
  const ar = anchor.getBoundingClientRect();
  const pr = popover.getBoundingClientRect();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  let top = 0;
  let left = 0;

  switch (placement) {
    case 'bottom':
      top = ar.bottom + scrollY + ARROW_SIZE + GAP;
      left = ar.left + scrollX + ar.width / 2 - pr.width / 2;
      break;
    case 'bottom-start':
      top = ar.bottom + scrollY + ARROW_SIZE + GAP;
      left = ar.left + scrollX;
      break;
    case 'bottom-end':
      top = ar.bottom + scrollY + ARROW_SIZE + GAP;
      left = ar.right + scrollX - pr.width;
      break;
    case 'top':
      top = ar.top + scrollY - pr.height - ARROW_SIZE - GAP;
      left = ar.left + scrollX + ar.width / 2 - pr.width / 2;
      break;
    case 'left':
      top = ar.top + scrollY + ar.height / 2 - pr.height / 2;
      left = ar.left + scrollX - pr.width - ARROW_SIZE - GAP;
      break;
    case 'right':
      top = ar.top + scrollY + ar.height / 2 - pr.height / 2;
      left = ar.right + scrollX + ARROW_SIZE + GAP;
      break;
  }

  /* Arrow position */
  let arrowTop = 0;
  let arrowLeft = 0;

  switch (placement) {
    case 'bottom':
      arrowTop = ar.bottom + scrollY + GAP;
      arrowLeft = ar.left + scrollX + ar.width / 2 - ARROW_SIZE;
      break;
    case 'bottom-start':
      arrowTop = ar.bottom + scrollY + GAP;
      arrowLeft = ar.left + scrollX + ar.width / 2 - ARROW_SIZE;
      break;
    case 'bottom-end':
      arrowTop = ar.bottom + scrollY + GAP;
      arrowLeft = ar.right + scrollX - ar.width / 2 - ARROW_SIZE;
      break;
    case 'top':
      arrowTop = ar.top + scrollY - ARROW_SIZE - GAP;
      arrowLeft = ar.left + scrollX + ar.width / 2 - ARROW_SIZE;
      break;
    case 'left':
      arrowTop = ar.top + scrollY + ar.height / 2 - ARROW_SIZE;
      arrowLeft = ar.left + scrollX - ARROW_SIZE - GAP;
      break;
    case 'right':
      arrowTop = ar.top + scrollY + ar.height / 2 - ARROW_SIZE;
      arrowLeft = ar.right + scrollX + GAP;
      break;
  }

  return { top, left, arrowTop, arrowLeft };
}

export const Popover: React.FC<PopoverProps> = ({
  open = false,
  anchorElement,
  placement = 'bottom',
  title,
  children,
  footer,
  showArrow = true,
  width = 'auto',
  onClose,
  className = '',
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<Coords>({
    top: -9999,
    left: -9999,
    arrowTop: -9999,
    arrowLeft: -9999,
  });

  /* Recalculate position when opened */
  useEffect(() => {
    if (!open || !anchorElement || !popoverRef.current) return;
    const c = calcPosition(anchorElement, popoverRef.current, placement);
    setCoords(c);
  }, [open, anchorElement, placement]);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;

    const handleOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorElement !== e.target &&
        !anchorElement?.contains(e.target as Node)
      ) {
        onClose?.();
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, anchorElement, onClose]);

  if (!open) return null;

  const hasHeader = !!title;
  const hasFooter = !!footer;

  const popoverClasses = ['fd-popover', className].filter(Boolean).join(' ');

  return (
    <>
      {/* Arrow */}
      {showArrow && (
        <span
          className={`fd-popover__arrow fd-popover__arrow--${placement}`}
          style={{
            top: coords.arrowTop,
            left: coords.arrowLeft,
          }}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        ref={popoverRef}
        className={popoverClasses}
        role="dialog"
        aria-modal="false"
        aria-label={title}
        tabIndex={-1}
        style={{
          top: coords.top,
          left: coords.left,
          width,
        }}
      >
        {hasHeader && (
          <div className="fd-popover__header">
            <h2 className="fd-popover__title">{title}</h2>
          </div>
        )}
        <div className="fd-popover__body">{children}</div>
        {hasFooter && (
          <div className="fd-popover__footer">{footer}</div>
        )}
      </div>
    </>
  );
};

export default Popover;
