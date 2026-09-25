import React from 'react';
import type { FormFactor } from '../../../tokens';
import { Icon } from '../Icon';
import './MessageStrip.css';

export type MessageStripDesign = 'Information' | 'Positive' | 'Negative' | 'Critical';

/**
 * Persistent inline status message relevant to the current page or section.
 *
 * @see src/pages/docs/message-strip.md
 *
 * @constraints
 * - Show at most 2–3 MessageStrips simultaneously — stacking more creates noise.
 * - Use `design="Negative"` for errors, `"Critical"` for warnings, `"Information"` for info.
 * - Do not use for field-level errors — use `Input valueState` instead.
 * - Do not use for brief confirmations — use `Toast` instead.
 *
 * @example
 * // Error state on a form page
 * <MessageStrip design="Negative">Please correct the errors below before saving.</MessageStrip>
 *
 * @example
 * // Dismissible info banner
 * <MessageStrip design="Information" onClose={() => setDismissed(true)}>
 *   This feature is in beta.
 * </MessageStrip>
 */
export interface MessageStripProps {
  /** Visual style — maps to SAP Fiori MessageStrip design types */
  design?: MessageStripDesign;
  children: React.ReactNode;
  /** Override the default type icon */
  icon?: React.ReactNode;
  /** Show dismiss button. Defaults to true */
  dismissible?: boolean;
  onClose?: () => void;
  /** Cozy (default) or Compact density */
  formFactor?: FormFactor;
  className?: string;
}

type DesignConfig = { class: string; iconName: string; role: string };

const designConfig: Record<MessageStripDesign, DesignConfig> = {
  Information: { class: 'fd-message-strip--information', iconName: 'message-information', role: 'status' },
  Positive:    { class: 'fd-message-strip--positive',    iconName: 'message-success',     role: 'status' },
  Negative:    { class: 'fd-message-strip--negative',    iconName: 'message-error',       role: 'alert'  },
  Critical:    { class: 'fd-message-strip--critical',    iconName: 'message-warning',     role: 'alert'  },
};

export const MessageStrip: React.FC<MessageStripProps> = ({
  design = 'Information',
  children,
  icon,
  dismissible = true,
  onClose,
  formFactor = 'cozy',
  className = '',
}) => {
  const config = designConfig[design];

  return (
    <div
      className={[
        'fd-message-strip',
        config.class,
        formFactor === 'compact' ? 'fd-message-strip--compact' : '',
        className,
      ].filter(Boolean).join(' ')}
      role={config.role}
    >
      <span className="fd-message-strip__icon" aria-hidden="true">
        {icon ?? <Icon name={config.iconName} size={16} />}
      </span>
      <span className="fd-message-strip__text">{children}</span>
      {dismissible && (
        <button
          className="fd-message-strip__close"
          onClick={onClose}
          aria-label="Dismiss"
          type="button"
        >
          <Icon name="decline" size={12} />
        </button>
      )}
    </div>
  );
};

export default MessageStrip;
