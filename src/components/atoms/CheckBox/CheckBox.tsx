import React, { useId } from 'react';
import type { FormFactor, ValueState } from '../../../tokens';
import './CheckBox.css';

/**
 * Boolean option or multi-select control. Use for independent choices or batch selection.
 *
 * @see src/pages/docs/checkbox.md
 *
 * @constraints
 * - Do not use for immediate-effect toggles — use `Switch` instead.
 * - Use `indeterminate` for "select all" headers with partial selection.
 * - `readOnly` disables interaction but keeps the checkbox visible (differs from `disabled`).
 *
 * @example
 * // Controlled checkbox
 * <CheckBox checked={accepted} label="I agree to the terms" onChange={e => setAccepted(e.target.checked)} />
 *
 * @example
 * // Indeterminate "select all"
 * <CheckBox indeterminate={someSelected} checked={allSelected} label="Select all" onChange={toggleAll} />
 */
export interface CheckBoxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  label?: string;
  formFactor?: FormFactor;
  disabled?: boolean;
  readOnly?: boolean;
  valueState?: Extract<ValueState, 'None' | 'Negative' | 'Critical' | 'Information' | 'Positive'>;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  className?: string;
  id?: string;
  name?: string;
  value?: string;
}

export const CheckBox: React.FC<CheckBoxProps> = ({
  checked,
  defaultChecked,
  indeterminate = false,
  label,
  formFactor = 'cozy',
  disabled = false,
  readOnly = false,
  valueState = 'None',
  onChange,
  className = '',
  id,
  name,
  value,
}) => {
  const autoId = useId();
  const inputId = id ?? autoId;
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const wrapperClass = [
    'fd-checkbox-wrapper',
    formFactor === 'compact' ? 'fd-checkbox-wrapper--compact' : '',
    disabled ? 'fd-checkbox-wrapper--disabled' : '',
    readOnly ? 'fd-checkbox-wrapper--readonly' : '',
    valueState !== 'None' ? `fd-checkbox-wrapper--${valueState.toLowerCase()}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClass}>
      <div className="fd-checkbox__touch">
        <div className="fd-checkbox__box">
          <input
            ref={inputRef}
            id={inputId}
            type="checkbox"
            className="fd-checkbox__input"
            checked={checked}
            defaultChecked={defaultChecked}
            disabled={disabled || readOnly}
            readOnly={readOnly}
            name={name}
            value={value}
            onChange={readOnly ? undefined : onChange}
            aria-invalid={valueState === 'Negative' ? 'true' : undefined}
          />
          <span className="fd-checkbox__checkmark" aria-hidden="true">
            {indeterminate ? (
              <img src="/icons/sys-minus.svg" alt="" className="fd-checkbox__icon" />
            ) : (
              <img src="/icons/accept.svg" alt="" className="fd-checkbox__icon" />
            )}
          </span>
        </div>
      </div>
      {label && (
        <label className="fd-checkbox__label" htmlFor={inputId}>
          {label}
        </label>
      )}
    </div>
  );
};

export default CheckBox;
