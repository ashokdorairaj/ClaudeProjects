import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormFactor, ValueState } from '../../../tokens';
import { Calendar } from '../Calendar';
import './DatePicker.css';

/* ── Helpers ─────────────────────────────────────────────── */

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Advance a month by delta, returning { year, month } */
function advanceMonth(year: number, month: number, delta: number): { year: number; month: number } {
  let m = month + delta;
  let y = year;
  while (m > 11) { m -= 12; y += 1; }
  while (m < 0)  { m += 12; y -= 1; }
  return { year: y, month: m };
}

/* ── Types ─────────────────────────────────────────────────── */

export interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  placeholder?: string;
  label?: string;
  minDate?: Date;
  maxDate?: Date;
  formFactor?: FormFactor;
  disabled?: boolean;
  valueState?: ValueState;
  valueStateMessage?: string;
  onChange?: (start: Date, end: Date | null) => void;
  className?: string;
}

/* ── Two-month range Calendar wrapper ───────────────────── */

interface TwoMonthCalendarProps {
  rangeStart?: Date;
  rangeEnd?: Date;
  minDate?: Date;
  maxDate?: Date;
  formFactor?: FormFactor;
  onRangeChange: (start: Date, end: Date) => void;
}

const TwoMonthCalendar: React.FC<TwoMonthCalendarProps> = ({
  rangeStart,
  rangeEnd,
  minDate,
  maxDate,
  formFactor = 'cozy',
  onRangeChange,
}) => {
  const today = useMemo(() => new Date(), []);
  const initYear = rangeStart ? rangeStart.getFullYear() : today.getFullYear();
  const initMonth = rangeStart ? rangeStart.getMonth() : today.getMonth();

  const [leftYear, setLeftYear] = useState(initYear);
  const [leftMonth, setLeftMonth] = useState(initMonth);

  // Right calendar is always one month ahead of left
  const right = useMemo(
    () => advanceMonth(leftYear, leftMonth, 1),
    [leftYear, leftMonth],
  );

  // Internal pending state while user selects the second date
  const [pendingStart, setPendingStart] = useState<Date | undefined>(rangeStart);
  const [pendingEnd, setPendingEnd] = useState<Date | undefined>(rangeEnd);

  useEffect(() => { setPendingStart(rangeStart); }, [rangeStart]);
  useEffect(() => { setPendingEnd(rangeEnd); }, [rangeEnd]);

  const navigateLeft = useCallback((delta: number) => {
    const next = advanceMonth(leftYear, leftMonth, delta);
    setLeftYear(next.year);
    setLeftMonth(next.month);
  }, [leftYear, leftMonth]);

  // Both calendars share range state — clicking on either triggers onRangeChange
  const handleRangeChange = useCallback((start: Date, end: Date) => {
    setPendingStart(start);
    setPendingEnd(end);
    onRangeChange(start, end);
  }, [onRangeChange]);

  return (
    <div className="fd-daterangepicker__two-month" role="group" aria-label="Select date range">
      {/* Left nav: prev month */}
      <div className="fd-daterangepicker__month-col">
        <div className="fd-daterangepicker__nav">
          <button
            type="button"
            className="fd-calendar__nav-btn"
            aria-label="Previous month"
            onClick={() => navigateLeft(-1)}
          >
            <ChevronLeft />
          </button>
        </div>
        <Calendar
          selection="range"
          rangeStart={pendingStart}
          rangeEnd={pendingEnd}
          minDate={minDate}
          maxDate={maxDate}
          formFactor={formFactor}
          onRangeChange={handleRangeChange}
          className="fd-daterangepicker__calendar fd-daterangepicker__calendar--left"
          _controlledYear={leftYear}
          _controlledMonth={leftMonth}
        />
      </div>

      {/* Divider */}
      <div className="fd-daterangepicker__divider" aria-hidden="true" />

      {/* Right: next month */}
      <div className="fd-daterangepicker__month-col">
        <div className="fd-daterangepicker__nav fd-daterangepicker__nav--right">
          <button
            type="button"
            className="fd-calendar__nav-btn"
            aria-label="Next month"
            onClick={() => navigateLeft(1)}
          >
            <ChevronRight />
          </button>
        </div>
        <Calendar
          selection="range"
          rangeStart={pendingStart}
          rangeEnd={pendingEnd}
          minDate={minDate}
          maxDate={maxDate}
          formFactor={formFactor}
          onRangeChange={handleRangeChange}
          className="fd-daterangepicker__calendar fd-daterangepicker__calendar--right"
          _controlledYear={right.year}
          _controlledMonth={right.month}
        />
      </div>
    </div>
  );
};

/* ── Icons ───────────────────────────────────────────────── */

const ChevronLeft: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronRight: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Component ──────────────────────────────────────────────── */

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
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
  const [internalStart, setInternalStart] = useState<Date | undefined>(startDate);
  const [internalEnd, setInternalEnd] = useState<Date | undefined>(endDate);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setInternalStart(startDate); }, [startDate]);
  useEffect(() => { setInternalEnd(endDate); }, [endDate]);

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

  const handleRangeChange = (start: Date, end: Date) => {
    setInternalStart(start);
    setInternalEnd(end);
    onChange?.(start, end);
    setOpen(false);
  };

  const stateClass = valueState !== 'None' ? `fd-datepicker--${valueState.toLowerCase()}` : '';

  const rootClasses = ['fd-datepicker-container', className].filter(Boolean).join(' ');

  const inputClasses = [
    'fd-datepicker',
    'fd-datepicker--range',
    stateClass,
    formFactor === 'compact' ? 'fd-datepicker--compact' : '',
    disabled ? 'fd-datepicker--disabled' : '',
    open ? 'fd-datepicker--open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const openPopover = () => !disabled && setOpen((o) => !o);

  return (
    <div className={rootClasses} ref={rootRef}>
      {label && <label className="fd-datepicker__label">{label}</label>}
      <div
        className={inputClasses}
        onClick={openPopover}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPopover(); }
          if (e.key === 'Escape') setOpen(false);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="fd-datepicker__range-value">
          {internalStart ? formatDate(internalStart) : <span className="fd-datepicker__placeholder">{placeholder}</span>}
        </span>
        <span className="fd-datepicker__range-sep" aria-hidden="true">–</span>
        <span className="fd-datepicker__range-value">
          {internalEnd ? formatDate(internalEnd) : <span className="fd-datepicker__placeholder">{placeholder}</span>}
        </span>
        <span className="fd-datepicker__icon-btn" aria-hidden="true"><CalendarIcon /></span>
      </div>

      {valueState !== 'None' && valueStateMessage && (
        <div className={`fd-datepicker__state-msg fd-datepicker__state-msg--${valueState.toLowerCase()}`}>
          {valueStateMessage}
        </div>
      )}

      {open && (
        <div
          className="fd-datepicker__popover fd-datepicker__popover--range"
          role="dialog"
          aria-modal="true"
          aria-label="Choose date range"
        >
          <TwoMonthCalendar
            rangeStart={internalStart}
            rangeEnd={internalEnd}
            minDate={minDate}
            maxDate={maxDate}
            formFactor={formFactor}
            onRangeChange={handleRangeChange}
          />
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

export default DateRangePicker;
