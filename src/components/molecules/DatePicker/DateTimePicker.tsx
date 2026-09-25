import React, { useEffect, useRef, useState } from 'react';
import type { FormFactor, ValueState } from '../../../tokens';
import { Calendar } from '../Calendar';
import './DatePicker.css';

/* ── Helpers ─────────────────────────────────────────────── */

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/* ── Clock face constants ────────────────────────────────── */

const CLOCK_SIZE = 288;
const CLOCK_RADIUS = 113;
const CLOCK_CENTER = CLOCK_SIZE / 2; // 144

function getNumberPosition(n: number): { x: number; y: number } {
  // 12 is at top (270° = -90°), 3 at right (0°), etc.
  const angle = ((n - 3) / 12) * 2 * Math.PI;
  return {
    x: CLOCK_CENTER + CLOCK_RADIUS * Math.cos(angle),
    y: CLOCK_CENTER + CLOCK_RADIUS * Math.sin(angle),
  };
}

/* ── Clock Face ──────────────────────────────────────────── */

interface ClockFaceProps {
  mode: 'hour' | 'minute';
  hour: number;     // 0–11 (12-hour)
  minute: number;   // 0–59
  onHourSelect: (h: number) => void;
  onMinuteSelect: (m: number) => void;
}

const ClockFace: React.FC<ClockFaceProps> = ({ mode, hour, minute, onHourSelect, onMinuteSelect }) => {
  const items = Array.from({ length: 12 }, (_, i) => i + 1);

  const getSelectedNumber = () => {
    if (mode === 'hour') return hour === 0 ? 12 : hour;
    // For minutes, show minute/5 rounded to nearest 5, mapped to 1–12
    const nearest = Math.round(minute / 5);
    return nearest === 0 ? 12 : nearest;
  };

  const selectedNum = getSelectedNumber();

  const handleClick = (n: number) => {
    if (mode === 'hour') {
      onHourSelect(n === 12 ? 0 : n);
    } else {
      onMinuteSelect((n === 12 ? 0 : n) * 5);
    }
  };

  const getLabel = (n: number) => {
    if (mode === 'hour') return String(n);
    return pad(n === 12 ? 0 : n * 5);
  };

  return (
    <div className="fd-clock" aria-label={mode === 'hour' ? 'Select hour' : 'Select minute'}>
      <span className="fd-clock__center-label">
        {mode === 'hour' ? 'Hours' : 'Minutes'}
      </span>
      {items.map((n) => {
        const { x, y } = getNumberPosition(n);
        const isSelected = n === selectedNum;
        return (
          <button
            key={n}
            type="button"
            className={`fd-clock__number${isSelected ? ' fd-clock__number--selected' : ''}`}
            style={{
              left: x - 22,
              top: y - 22,
            }}
            onClick={() => handleClick(n)}
            aria-label={`${mode === 'hour' ? 'Hour' : 'Minute'} ${getLabel(n)}`}
            aria-pressed={isSelected}
          >
            {getLabel(n)}
          </button>
        );
      })}
    </div>
  );
};

/* ── Types ─────────────────────────────────────────────────── */

export interface DateTimePickerProps {
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

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  placeholder = 'MMM DD, YYYY HH:MM AM',
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value);

  // Internal time state: hour in 0–11, ampm
  const initH24 = value ? value.getHours() : 9;
  const [hour12, setHour12] = useState<number>(initH24 % 12 === 0 ? 12 : initH24 % 12);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(initH24 < 12 ? 'AM' : 'PM');
  const [minute, setMinute] = useState<number>(value ? value.getMinutes() : 0);
  const [clockMode, setClockMode] = useState<'hour' | 'minute'>('hour');

  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setSelectedDate(value);
      const h24 = value.getHours();
      setHour12(h24 % 12 === 0 ? 12 : h24 % 12);
      setAmpm(h24 < 12 ? 'AM' : 'PM');
      setMinute(value.getMinutes());
    }
  }, [value]);

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

  const to24Hour = (h12: number, ap: 'AM' | 'PM'): number => {
    if (ap === 'AM') return h12 === 12 ? 0 : h12;
    return h12 === 12 ? 12 : h12 + 12;
  };

  const handleDaySelect = (d: Date) => {
    setSelectedDate(d);
  };

  const handleHourSelect = (h: number) => {
    setHour12(h === 0 ? 12 : h);
    setClockMode('minute');
  };

  const handleMinuteSelect = (m: number) => {
    setMinute(m);
    setClockMode('hour');
  };

  const handleOk = () => {
    if (!selectedDate) return;
    const h24 = to24Hour(hour12, ampm);
    const result = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      h24,
      minute,
      0,
      0,
    );
    onChange?.(result);
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
    setClockMode('hour');
  };

  const displayValue = selectedDate
    ? `${formatDate(selectedDate)} ${pad(hour12)}:${pad(minute)} ${ampm}`
    : '';

  const stateClass = valueState !== 'None' ? `fd-datepicker--${valueState.toLowerCase()}` : '';

  const rootClasses = ['fd-datepicker-container', className].filter(Boolean).join(' ');

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
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); !disabled && setOpen((o) => !o); }
            if (e.key === 'Escape') setOpen(false);
          }}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={label ?? 'Date and time picker'}
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
        <div
          className="fd-datepicker__popover fd-datepicker__popover--datetime"
          role="dialog"
          aria-modal="true"
          aria-label="Choose date and time"
        >
          <div className="fd-datetime__body">
            {/* Left: Calendar */}
            <Calendar
              value={selectedDate}
              minDate={minDate}
              maxDate={maxDate}
              formFactor={formFactor}
              selection="single"
              onChange={handleDaySelect}
            />

            {/* Separator */}
            <div className="fd-datetime__separator" aria-hidden="true" />

            {/* Right: Time section */}
            <div className="fd-datetime__time-section">
              {/* Hours & minutes display */}
              <div className="fd-datetime__hm-row">
                <button
                  type="button"
                  className={`fd-datetime__hm-btn${clockMode === 'hour' ? ' fd-datetime__hm-btn--active' : ''}`}
                  onClick={() => setClockMode('hour')}
                  aria-label="Select hour"
                  aria-pressed={clockMode === 'hour'}
                >
                  {pad(hour12)}
                </button>
                <span className="fd-datetime__hm-sep" aria-hidden="true">:</span>
                <button
                  type="button"
                  className={`fd-datetime__hm-btn${clockMode === 'minute' ? ' fd-datetime__hm-btn--active' : ''}`}
                  onClick={() => setClockMode('minute')}
                  aria-label="Select minute"
                  aria-pressed={clockMode === 'minute'}
                >
                  {pad(minute)}
                </button>
                {/* AM/PM */}
                <div className="fd-datetime__ampm" role="group" aria-label="AM or PM">
                  <button
                    type="button"
                    className={`fd-datetime__ampm-btn${ampm === 'AM' ? ' fd-datetime__ampm-btn--selected' : ''}`}
                    onClick={() => setAmpm('AM')}
                    aria-pressed={ampm === 'AM'}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    className={`fd-datetime__ampm-btn${ampm === 'PM' ? ' fd-datetime__ampm-btn--selected' : ''}`}
                    onClick={() => setAmpm('PM')}
                    aria-pressed={ampm === 'PM'}
                  >
                    PM
                  </button>
                </div>
              </div>

              {/* Clock face */}
              <ClockFace
                mode={clockMode}
                hour={hour12}
                minute={minute}
                onHourSelect={handleHourSelect}
                onMinuteSelect={handleMinuteSelect}
              />
            </div>
          </div>

          {/* Footer — Cancel left, OK (emphasized) right per SAP Fiori convention */}
          <div className="fd-datetime__footer">
            <button type="button" className="fd-datetime__footer-btn" onClick={handleCancel}>
              Cancel
            </button>
            <button type="button" className="fd-datetime__footer-btn fd-datetime__footer-btn--emphasized" onClick={handleOk}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

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

export default DateTimePicker;
