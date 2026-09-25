import React, { useId } from 'react';
import type { FormFactor } from '../../../tokens';
import './Switch.css';

/**
 * Immediate-effect on/off toggle. The change takes effect instantly without a submit step.
 *
 * @see src/pages/docs/checkbox.md
 *
 * @constraints
 * - Use only when the toggle has an **immediate** side-effect (e.g. enable notifications, dark mode).
 * - Do not use in multi-step forms requiring a submit — use `CheckBox` instead.
 * - `textLabel` adds ON/OFF text inside the track; use only when the label alone is ambiguous.
 *
 * @example
 * <Switch checked={darkMode} label="Dark mode" onChange={e => setDarkMode(e.target.checked)} />
 */
export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  label?: string;
  formFactor?: FormFactor;
  disabled?: boolean;
  /** Show on/off text labels inside track */
  textLabel?: boolean;
  /** Semantic type: green (ON) / red (OFF) track with accept/decline icons */
  semantic?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  className?: string;
  id?: string;
  name?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  defaultChecked,
  label,
  formFactor = 'cozy',
  disabled = false,
  textLabel = false,
  semantic = false,
  onChange,
  className = '',
  id,
  name,
}) => {
  const autoId = useId();
  const inputId = id ?? autoId;

  const wrapperClass = [
    'fd-switch-wrapper',
    formFactor === 'compact' ? 'fd-switch-wrapper--compact' : '',
    disabled ? 'fd-switch-wrapper--disabled' : '',
    textLabel ? 'fd-switch-wrapper--text' : '',
    semantic ? 'fd-switch-wrapper--semantic' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClass}>
      <label className="fd-switch" htmlFor={inputId}>
        <input
          id={inputId}
          name={name}
          type="checkbox"
          className="fd-switch__input"
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          onChange={onChange}
          role="switch"
        />
        <span className="fd-switch__track">
          {textLabel && <span className="fd-switch__track-label fd-switch__track-label--on">ON</span>}
          <span className="fd-switch__thumb" />
          {textLabel && <span className="fd-switch__track-label fd-switch__track-label--off">OFF</span>}
        </span>
      </label>
      {label && (
        <label className="fd-switch__label" htmlFor={inputId}>
          {label}
        </label>
      )}
    </div>
  );
};

export default Switch;
