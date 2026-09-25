import React, { useId } from 'react';
import type { FormFactor, ValueState } from '../../../tokens';
import './Input.css';

/**
 * Single-line free-text entry field. Always pair with a `Label`.
 *
 * @see src/pages/docs/input.md
 *
 * @constraints
 * - Always pair with a `Label` (via `label` prop or external `<Label htmlFor>`).
 * - Use `valueState` + `valueStateMessage` together for validation feedback.
 * - Do not use for constrained choices — use `Select`, `RadioButton`, or `CheckBox`.
 * - `trailingAction` slot expects a single `IconButton` or small action, not arbitrary content.
 *
 * @example
 * <Input label="Name" required placeholder="Enter full name"
 *   valueState="Negative" valueStateMessage="Name is required" />
 *
 * @example
 * // Controlled
 * <Input value={val} onChange={e => setVal(e.target.value)} label="Search" type="search" />
 */
export interface InputProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  description?: string;
  valueState?: ValueState;
  valueStateMessage?: string;
  formFactor?: FormFactor;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url';
  /** Icon rendered inside input (left) */
  icon?: React.ReactNode;
  /** Action button/icon on the right */
  trailingAction?: React.ReactNode;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  name?: string;
}

const valueStateClass: Record<ValueState, string> = {
  None: '',
  Positive: 'fd-input--success',
  Negative: 'fd-input--error',
  Critical: 'fd-input--warning',
  Information: 'fd-input--information',
};

// SAP Fiori value-state icon characters (matches UI5 status indicator symbols)
const valueStateIcon: Record<ValueState, string> = {
  None: '',
  Positive: '\u2714',      // ✔ heavy check mark
  Negative: '\u2716',      // ✖ heavy multiplication X
  Critical: '\u26A0',      // ⚠ warning sign
  Information: '\u2139',   // ℹ information source
};

export const Input: React.FC<InputProps> = ({
  value,
  defaultValue,
  placeholder,
  label,
  description,
  valueState = 'None',
  valueStateMessage,
  formFactor = 'cozy',
  disabled = false,
  readOnly = false,
  required = false,
  type = 'text',
  icon,
  trailingAction,
  onChange,
  onFocus,
  onBlur,
  className = '',
  style,
  id,
  name,
}) => {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-msg`;

  const wrapperClass = [
    'fd-input-wrapper',
    formFactor === 'compact' ? 'fd-input-wrapper--compact' : '',
    valueStateClass[valueState],
    disabled ? 'fd-input-wrapper--disabled' : '',
    readOnly ? 'fd-input-wrapper--readonly' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="fd-form-field" style={style}>
      {label && (
        <label className="fd-label" htmlFor={inputId}>
          {label}
          {required && <span className="fd-label__required" aria-hidden="true"> *</span>}
        </label>
      )}
      <div className={wrapperClass}>
        {icon && <span className="fd-input__icon fd-input__icon--left">{icon}</span>}
        <input
          id={inputId}
          name={name}
          type={type}
          className="fd-input"
          value={value}
          defaultValue={defaultValue}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          aria-describedby={valueStateMessage ? messageId : undefined}
          aria-invalid={valueState === 'Negative' ? 'true' : undefined}
        />
        {valueState !== 'None' && (
          <span className="fd-input__value-state-icon" aria-hidden="true">
            {valueStateIcon[valueState]}
          </span>
        )}
        {trailingAction && (
          <span className="fd-input__trailing-action">{trailingAction}</span>
        )}
      </div>
      {description && (
        <p className="fd-input__description">{description}</p>
      )}
      {valueStateMessage && (
        <p id={messageId} className={`fd-input__message fd-input__message--${valueState.toLowerCase()}`} role="alert">
          {valueStateMessage}
        </p>
      )}
    </div>
  );
};

export default Input;
