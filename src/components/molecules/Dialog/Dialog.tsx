import React, { useEffect, useRef } from 'react';
import type { FormFactor } from '../../../tokens';
import './Dialog.css';

/**
 * Modal overlay for focused user tasks requiring confirmation or data entry.
 *
 * @see src/pages/docs/dialog.md
 *
 * @constraints
 * - Use only when the user must complete or dismiss the task before continuing.
 * - Footer must contain at least one dismiss action (Cancel/Close). Never leave the dialog unclosable.
 * - `showClose=false` by default (SAP Horizon spec) — rely on footer buttons for dismiss.
 * - Do not use for brief confirmations — use `Toast` or `MessageStrip` instead.
 * - Set `scrollable=true` when body content may overflow; keep header/footer always visible.
 *
 * @example
 * <Dialog
 *   open={isOpen}
 *   title="Confirm Deletion"
 *   footer={<><Button design="Negative" onClick={handleDelete}>Delete</Button><Button onClick={() => setOpen(false)}>Cancel</Button></>}
 *   onClose={() => setOpen(false)}
 * >
 *   Are you sure you want to delete this record?
 * </Dialog>
 */
export interface DialogProps {
  /** Controls whether the dialog is visible */
  open?: boolean;
  /** Dialog header title */
  title?: string;
  /** Content rendered in the scrollable body */
  children?: React.ReactNode;
  /** Footer slot — typically Button actions */
  footer?: React.ReactNode;
  /** When true the body scrolls independently; header and footer stay fixed */
  scrollable?: boolean;
  /** Show resize corner handle */
  resizable?: boolean;
  /** Cozy (default) or Compact density */
  formFactor?: FormFactor;
  /** Called when the dialog requests to close (Escape, backdrop click, or close button) */
  onClose?: () => void;
  /**
   * Show the × close button in the header.
   * Defaults to false — matching the SAP Fiori Horizon spec where the header
   * contains only the title and the footer actions are the primary dismiss path.
   * Set to true when the dialog needs an explicit header-level dismiss affordance.
   */
  showClose?: boolean;
  /** Dialog width — defaults to '480px' */
  width?: string;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  open = false,
  title,
  children,
  footer,
  scrollable = false,
  resizable = false,
  formFactor = 'cozy',
  onClose,
  showClose = false,
  width = '480px',
  className = '',
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else {
      if (el.open) el.close();
    }
  }, [open]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose?.();
  };

  // Sync native cancel event (Escape key) → onClose
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const handler = () => onClose?.();
    el.addEventListener('cancel', handler);
    return () => el.removeEventListener('cancel', handler);
  }, [onClose]);

  const classes = [
    'fd-dialog',
    formFactor === 'compact' ? 'fd-dialog--compact' : '',
    scrollable ? 'fd-dialog--scrollable' : '',
    resizable ? 'fd-dialog--resizable' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <dialog
      ref={dialogRef}
      className={classes}
      style={{ width }}
      onClick={handleBackdropClick}
      aria-modal="true"
      aria-labelledby={title ? 'fd-dialog-title' : undefined}
    >
      <div className="fd-dialog__inner" onClick={e => e.stopPropagation()}>

        {title && (
          <div className="fd-dialog__header">
            <h2 id="fd-dialog-title" className="fd-dialog__title">{title}</h2>
            {showClose && onClose && (
              <button
                className="fd-dialog__close"
                onClick={onClose}
                aria-label="Close dialog"
                type="button"
              >
                <img src="/icons/decline.svg" alt="" aria-hidden="true" width={14} height={14} />
              </button>
            )}
          </div>
        )}

        <div className="fd-dialog__body">{children}</div>

        {footer && <div className="fd-dialog__footer">{footer}</div>}

        {resizable && (
          <div className="fd-dialog__resize-handle" aria-hidden="true">
            <img src="/icons/resize-corner.svg" alt="" width={10} height={10} />
          </div>
        )}
      </div>
    </dialog>
  );
};

export default Dialog;
