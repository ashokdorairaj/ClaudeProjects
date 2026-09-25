import React, { useId, useState } from 'react';
import './Select.css';
import type { FormFactor, ValueState } from '../../../tokens';

export interface SelectOption {
  key: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

/**
 * Single-select dropdown for a bounded, predefined set of options.
 *
 * @see src/pages/docs/select.md
 *
 * @constraints
 * - Use only for predefined options. For free-text or search-as-you-type, use `Input` with suggestions instead.
 * - Always provide a `label` — unlabelled selects are inaccessible.
 * - When `valueState` is not `None`, provide a `valueStateMessage` to explain the error or warning.
 * - Do not exceed ~20 options; for large datasets use a `ComboBox` or search-enabled variant.
 *
 * @example
 * <Select
 *   label="Priority"
 *   value={priority}
 *   options={[
 *     { key: 'high', label: 'High' },
 *     { key: 'medium', label: 'Medium' },
 *     { key: 'low', label: 'Low' },
 *   ]}
 *   onChange={setPriority}
 * />
 */
export interface SelectProps {
  options: SelectOption[];
  value?: string;
  placeholder?: string;
  label?: string;
  formFactor?: FormFactor;
  disabled?: boolean;
  required?: boolean;
  valueState?: ValueState;
  valueStateMessage?: string;
  onChange?: (key: string) => void;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

const valueStateClass: Record<ValueState, string> = {
  None: '',
  Positive: 'fd-select--positive',
  Negative: 'fd-select--negative',
  Critical: 'fd-select--critical',
  Information: 'fd-select--information',
};

const valueStateIcon: Record<ValueState, string> = {
  None: '',
  Positive: '✓',
  Negative: '✕',
  Critical: '⚠',
  Information: 'ℹ',
};

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  placeholder = 'Select...',
  label,
  formFactor = 'cozy',
  disabled = false,
  required = false,
  valueState = 'None',
  valueStateMessage,
  onChange,
  className = '',
  style,
  id,
}) => {
  const autoId = useId();
  const selectId = id ?? autoId;
  const labelId = `${selectId}-label`;
  const messageId = `${selectId}-msg`;

  const [open, setOpen] = useState(false);
  const selectedOption = options.find(o => o.key === value);

  return (
    <div className={['fd-select-container', className].filter(Boolean).join(' ')} style={style}>
      {label && (
        <label
          id={labelId}
          className="fd-select__label"
        >
          {label}
          {required && <span className="fd-select__label-required" aria-hidden="true"> *</span>}
        </label>
      )}
      <div
        id={selectId}
        className={[
          'fd-select',
          valueStateClass[valueState],
          formFactor === 'compact' ? 'fd-select--compact' : '',
          disabled ? 'fd-select--disabled' : '',
          open ? 'fd-select--open' : '',
        ].filter(Boolean).join(' ')}
        onClick={() => !disabled && setOpen(o => !o)}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={label ? labelId : undefined}
        aria-describedby={valueStateMessage ? messageId : undefined}
        aria-invalid={valueState === 'Negative' ? true : undefined}
        aria-required={required || undefined}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o); }
          if (e.key === 'Escape') setOpen(false);
        }}
        onBlur={e => {
          if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
        }}
      >
        <span className="fd-select__text">
          {selectedOption
            ? selectedOption.label
            : <span className="fd-select__placeholder">{placeholder}</span>}
        </span>
        {valueState !== 'None' && (
          <span className="fd-select__state-icon" aria-hidden="true">
            {valueStateIcon[valueState]}
          </span>
        )}
        <span className="fd-select__arrow" aria-hidden="true" />

        {open && (
          <ul className="fd-select__list" role="listbox" aria-label={label ?? placeholder}>
            {options.map(opt => (
              <li
                key={opt.key}
                className={[
                  'fd-select__option',
                  opt.key === value ? 'fd-select__option--selected' : '',
                  opt.disabled ? 'fd-select__option--disabled' : '',
                ].filter(Boolean).join(' ')}
                role="option"
                aria-selected={opt.key === value}
                aria-disabled={opt.disabled || undefined}
                onClick={e => {
                  e.stopPropagation();
                  if (!opt.disabled) { onChange?.(opt.key); setOpen(false); }
                }}
              >
                {opt.icon && <span className="fd-select__option-icon">{opt.icon}</span>}
                {opt.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      {valueState !== 'None' && valueStateMessage && (
        <p
          id={messageId}
          className={`fd-select__message fd-select__message--${valueState.toLowerCase()}`}
          role="alert"
        >
          {valueStateMessage}
        </p>
      )}
    </div>
  );
};

export default Select;
