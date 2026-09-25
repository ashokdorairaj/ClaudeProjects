import React, { useId } from 'react';
import './RadioButton.css';

export interface RadioButtonProps {
  checked?: boolean;
  defaultChecked?: boolean;
  label?: string;
  disabled?: boolean;
  name?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  className?: string;
  id?: string;
}

export const RadioButton: React.FC<RadioButtonProps> = ({
  checked,
  defaultChecked,
  label,
  disabled = false,
  name,
  value,
  onChange,
  className = '',
  id,
}) => {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className={['fd-radio-wrapper', disabled ? 'fd-radio-wrapper--disabled' : '', className].filter(Boolean).join(' ')}>
      <div className="fd-radio__touch">
        <div className="fd-radio__box">
          <input
            id={inputId}
            type="radio"
            className="fd-radio__input"
            checked={checked}
            defaultChecked={defaultChecked}
            disabled={disabled}
            name={name}
            value={value}
            onChange={onChange}
          />
          <span className="fd-radio__circle" aria-hidden="true" />
        </div>
      </div>
      {label && (
        <label className="fd-radio__label" htmlFor={inputId}>{label}</label>
      )}
    </div>
  );
};

export default RadioButton;
