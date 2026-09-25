import React, { useId, useState } from 'react';
import type { FormFactor, ValueState } from '../../../tokens';
import './StepInput.css';

export interface StepInputProps {
  /** Controlled value */
  value?: number;
  /** Initial value (uncontrolled) */
  defaultValue?: number;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Increment/decrement step (default 1) */
  step?: number;
  /** Label displayed above the control */
  label?: string;
  /** Cozy (default) or Compact density */
  formFactor?: FormFactor;
  /** Disabled state */
  disabled?: boolean;
  /** Border / background value-state feedback */
  valueState?: ValueState;
  /** Assistive text shown below the control */
  valueStateMessage?: string;
  /** Called with the new numeric value on every change */
  onChange?: (value: number) => void;
  className?: string;
}

const valueStateClass: Record<ValueState, string> = {
  None: '',
  Positive: 'fd-step-input--success',
  Negative: 'fd-step-input--error',
  Critical: 'fd-step-input--warning',
  Information: 'fd-step-input--information',
};

export const StepInput: React.FC<StepInputProps> = ({
  value: valueProp,
  defaultValue = 0,
  min,
  max,
  step = 1,
  label,
  formFactor = 'cozy',
  disabled = false,
  valueState = 'None',
  valueStateMessage,
  onChange,
  className = '',
}) => {
  const autoId = useId();
  const messageId = `${autoId}-msg`;

  const isControlled = valueProp !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);

  const currentValue = isControlled ? (valueProp as number) : internalValue;

  const updateValue = (next: number) => {
    let clamped = next;
    if (min !== undefined) clamped = Math.max(min, clamped);
    if (max !== undefined) clamped = Math.min(max, clamped);
    if (!isControlled) setInternalValue(clamped);
    onChange?.(clamped);
  };

  const handleDecrement = () => updateValue(currentValue - step);
  const handleIncrement = () => updateValue(currentValue + step);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value);
    if (!Number.isNaN(parsed)) {
      updateValue(parsed);
    }
  };

  const atMin = min !== undefined && currentValue <= min;
  const atMax = max !== undefined && currentValue >= max;

  const wrapperClasses = [
    'fd-step-input',
    formFactor === 'compact' ? 'fd-step-input--compact' : '',
    disabled ? 'fd-step-input--disabled' : '',
    valueStateClass[valueState],
  ]
    .filter(Boolean)
    .join(' ');

  const fieldClasses = [
    'fd-step-input-field',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={fieldClasses}>
      {label && (
        <label className="fd-label" htmlFor={autoId}>
          {label}
        </label>
      )}
      <div className={wrapperClasses}>
        <button
          type="button"
          className="fd-step-input__btn fd-step-input__btn--dec"
          aria-label="Decrease value"
          disabled={disabled || atMin}
          onClick={handleDecrement}
          tabIndex={disabled ? -1 : 0}
        >
          {/* Unicode MINUS SIGN U+2212 — matches SAP Fiori icon glyph */}
          &#x2212;
        </button>
        <input
          id={autoId}
          type="number"
          className="fd-step-input__input"
          value={currentValue}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={handleInputChange}
          aria-describedby={valueStateMessage ? messageId : undefined}
          aria-invalid={valueState === 'Negative' ? 'true' : undefined}
        />
        <button
          type="button"
          className="fd-step-input__btn fd-step-input__btn--inc"
          aria-label="Increase value"
          disabled={disabled || atMax}
          onClick={handleIncrement}
          tabIndex={disabled ? -1 : 0}
        >
          {/* Unicode PLUS SIGN U+002B */}
          &#x002B;
        </button>
      </div>
      {valueStateMessage && (
        <p
          id={messageId}
          className={`fd-step-input__message fd-step-input__message--${valueState.toLowerCase()}`}
          role="alert"
        >
          {valueStateMessage}
        </p>
      )}
    </div>
  );
};

export default StepInput;
