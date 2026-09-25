import React, { useId, useState } from 'react';
import type { FormFactor, ValueState } from '../../../tokens';
import './TextArea.css';

export interface TextAreaProps {
  /** Controlled value */
  value?: string;
  /** Initial value (uncontrolled) */
  defaultValue?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Label displayed above the textarea */
  label?: string;
  /** Number of visible text rows (default 4) */
  rows?: number;
  /** Maximum character count */
  maxLength?: number;
  /** Show live character counter below the textarea (requires maxLength) */
  showCounter?: boolean;
  /** Border / background value-state feedback */
  valueState?: ValueState;
  /** Assistive message shown below */
  valueStateMessage?: string;
  /** Cozy (default) or Compact density */
  formFactor?: FormFactor;
  /** Disabled state */
  disabled?: boolean;
  /** Read-only state */
  readOnly?: boolean;
  /** Mark as required */
  required?: boolean;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  className?: string;
}

const valueStateClass: Record<ValueState, string> = {
  None: '',
  Positive: 'fd-textarea--success',
  Negative: 'fd-textarea--error',
  Critical: 'fd-textarea--warning',
  Information: 'fd-textarea--information',
};

export const TextArea: React.FC<TextAreaProps> = ({
  value: valueProp,
  defaultValue = '',
  placeholder,
  label,
  rows = 4,
  maxLength,
  showCounter = false,
  valueState = 'None',
  valueStateMessage,
  formFactor = 'cozy',
  disabled = false,
  readOnly = false,
  required = false,
  onChange,
  className = '',
}) => {
  const autoId = useId();
  const messageId = `${autoId}-msg`;

  const isControlled = valueProp !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);

  const currentValue = isControlled ? (valueProp as string) : internalValue;
  const charCount = currentValue.length;

  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    if (!isControlled) setInternalValue(e.target.value);
    onChange?.(e);
  };

  const textareaClasses = [
    'fd-textarea',
    formFactor === 'compact' ? 'fd-textarea--compact' : '',
    valueStateClass[valueState],
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={['fd-textarea-wrapper', disabled ? 'fd-textarea-wrapper--disabled' : '', className].filter(Boolean).join(' ')}>
      {label && (
        <label className="fd-label" htmlFor={autoId}>
          {label}
          {required && (
            <span className="fd-label__required" aria-hidden="true">
              {' '}*
            </span>
          )}
        </label>
      )}
      <textarea
        id={autoId}
        className={textareaClasses}
        value={currentValue}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        onChange={handleChange}
        aria-describedby={valueStateMessage ? messageId : undefined}
        aria-invalid={valueState === 'Negative' ? 'true' : undefined}
        aria-required={required ? 'true' : undefined}
      />
      {showCounter && maxLength !== undefined && (
        <div className="fd-textarea__counter" aria-live="polite" aria-atomic="true">
          {maxLength - charCount} characters left
        </div>
      )}
      {valueStateMessage && (
        <p
          id={messageId}
          className={`fd-textarea__message fd-textarea__message--${valueState.toLowerCase()}`}
          role="alert"
        >
          {valueStateMessage}
        </p>
      )}
    </div>
  );
};

export default TextArea;
