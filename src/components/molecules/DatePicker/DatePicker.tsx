import React, { useEffect, useRef, useState } from 'react';
import type { FormFactor, ValueState } from '../../../tokens';
import { Calendar } from '../Calendar';
import './DatePicker.css';

/* ── Helpers ─────────────────────────────────────────────── */

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ── Types ─────────────────────────────────────────────────── */

export interface DatePickerProps {
  value?: Date;
  placeholder?: string;
  label?: string;
  minDate?: Date;
  maxDate?: Date;
  formFactor?: FormFactor;
  disabled?: boolean;
  valueState?: ValueState;
  valueStateMessage?: string;
  onChange?: (date: Date) => void;
  className?: string;
}

/* ── Component ──────────────────────────────────────────────── */

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  placeholder = 'MMM DD, YYYY',
  label,
  minDate,
  maxDate,
  formFactor = 'cozy',
  disabled = false,
  valueState = 'None',
  valueStateMessage,
  onChange,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const stateClass = valueState !== 'None' ? `fd-datepicker--${valueState.toLowerCase()}` : '';

  const rootClasses = [
    'fd-datepicker-container',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const inputClasses = [
    'fd-datepicker',
    stateClass,
    formFactor === 'compact' ? 'fd-datepicker--compact' : '',
    disabled ? 'fd-datepicker--disabled' : '',
    open ? 'fd-datepicker--open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClasses} ref={rootRef}>
      {label && <label className="fd-datepicker__label">{label}</label>}
      <div className={inputClasses}>
        <input
          type="text"
          readOnly
          className="fd-datepicker__input"
          value={value ? formatDate(value) : ''}
          placeholder={placeholder}
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); !disabled && setOpen((o) => !o); }
            if (e.key === 'Escape') setOpen(false);
          }}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={label ?? 'Date picker'}
        />
        <button
          type="button"
          className="fd-datepicker__icon-btn"
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          tabIndex={-1}
          aria-hidden="true"
        >
          <CalendarIcon />
        </button>
      </div>

      {valueState !== 'None' && valueStateMessage && (
        <div className={`fd-datepicker__state-msg fd-datepicker__state-msg--${valueState.toLowerCase()}`}>
          {valueStateMessage}
        </div>
      )}

      {open && (
        <div className="fd-datepicker__popover" role="dialog" aria-modal="true" aria-label="Choose date">
          <Calendar
            value={value}
            minDate={minDate}
            maxDate={maxDate}
            formFactor={formFactor}
            selection="single"
            onChange={(d) => {
              onChange?.(d);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

/* ── Calendar icon SVG ───────────────────────────────────────── */

const CalendarIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="1" y="3" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
    <path d="M1 6h14" stroke="currentColor" strokeWidth="1.25" />
    <path d="M5 1v3M11 1v3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    <circle cx="5" cy="10" r="1" fill="currentColor" />
    <circle cx="8" cy="10" r="1" fill="currentColor" />
    <circle cx="11" cy="10" r="1" fill="currentColor" />
  </svg>
);

export default DatePicker;
