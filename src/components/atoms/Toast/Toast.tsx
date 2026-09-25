import React, { useEffect, useState } from 'react';
import './Toast.css';

export type ToastPlacement = 'bottom-center' | 'bottom-start' | 'bottom-end' | 'top-center' | 'top-start' | 'top-end';

/**
 * Brief auto-dismiss notification for completed background actions.
 *
 * @see src/pages/docs/toast.md
 *
 * @constraints
 * - Use for success confirmations only ("Saved", "Submitted", "Deleted").
 * - Do not use for errors or warnings — use `MessageStrip` or `Dialog` instead.
 * - Default `duration` is 3000ms. Set to 0 for manual dismiss only.
 * - Controlled via `visible` prop; toggle it to show/hide.
 *
 * @example
 * const [show, setShow] = useState(false);
 * <Button onClick={() => { save(); setShow(true); }}>Save</Button>
 * <Toast message="Changes saved." visible={show} onClose={() => setShow(false)} />
 */
export interface ToastProps {
  message: string;
  /** Duration in ms before auto-dismiss. 0 = no auto-dismiss */
  duration?: number;
  visible?: boolean;
  placement?: ToastPlacement;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  duration = 3000,
  visible = true,
  placement = 'bottom-center',
  onClose,
}) => {
  const [show, setShow] = useState(visible);

  useEffect(() => {
    setShow(visible);
  }, [visible]);

  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        setShow(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  return (
    <div className={['fd-toast', `fd-toast--${placement}`].join(' ')} role="status" aria-live="polite">
      <span className="fd-toast__message">{message}</span>
    </div>
  );
};

export default Toast;
