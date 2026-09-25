import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './Calendar.css';

/* ─── Helpers ────────────────────────────────────────── */

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBeforeDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() < b.getFullYear() ||
    (a.getFullYear() === b.getFullYear() && a.getMonth() < b.getMonth()) ||
    (a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() < b.getDate())
  );
}

function isAfterDay(a: Date, b: Date): boolean {
  return isBeforeDay(b, a);
}

function cloneDate(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** ISO 8601 week number (Mon = start of week) */
function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function mondayFirstDayIndex(jsDay: number): number {
  return (jsDay + 6) % 7;
}

/** Returns true if the day is a weekend (Sat or Sun in Mon-first system) */
function isWeekend(day: Date): boolean {
  const jsDay = day.getDay(); // 0=Sun, 6=Sat
  return jsDay === 0 || jsDay === 6;
}

/** Build the 6×7 grid for a given year/month (Mon-first) */
function buildGrid(year: number, month: number): Date[][] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = mondayFirstDayIndex(firstOfMonth.getDay());
  const gridStart = new Date(year, month, 1 - startOffset);

  const rows: Date[][] = [];
  for (let row = 0; row < 6; row++) {
    const cells: Date[] = [];
    for (let col = 0; col < 7; col++) {
      const dayIndex = row * 7 + col;
      cells.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + dayIndex));
    }
    rows.push(cells);
  }
  return rows;
}

/* ─── Icons ──────────────────────────────────────────── */

const SlimArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SlimArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ─── Types ──────────────────────────────────────────── */

export type CalendarPickerView = 'day' | 'month' | 'year';

export interface CalendarProps {
  value?: Date;
  minDate?: Date;
  maxDate?: Date;
  selection?: 'single' | 'range';
  rangeStart?: Date;
  rangeEnd?: Date;
  showWeekNumbers?: boolean;
  formFactor?: 'cozy' | 'compact';
  onChange?: (date: Date) => void;
  onRangeChange?: (start: Date, end: Date) => void;
  className?: string;
  /** @internal Controlled year — used by DateRangePicker's two-month layout */
  _controlledYear?: number;
  /** @internal Controlled month — used by DateRangePicker's two-month layout */
  _controlledMonth?: number;
}

/* ─── Month picker grid ──────────────────────────────── */

const MONTH_ABBREV = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MonthPicker: React.FC<{
  viewYear: number;
  viewMonth: number;
  onSelect: (month: number) => void;
  onYearNav: (delta: number) => void;
}> = ({ viewYear, viewMonth, onSelect, onYearNav }) => (
  <div className="fd-calendar__picker-grid">
    {MONTH_ABBREV.map((m, i) => (
      <button
        key={m}
        type="button"
        className={[
          'fd-calendar__picker-item',
          i === viewMonth ? 'fd-calendar__picker-item--selected' : '',
        ].filter(Boolean).join(' ')}
        onClick={() => onSelect(i)}
        aria-pressed={i === viewMonth}
      >
        {m}
      </button>
    ))}
  </div>
);

/* ─── Year picker grid ───────────────────────────────── */

const YearPicker: React.FC<{
  viewYear: number;
  onSelect: (year: number) => void;
}> = ({ viewYear, onSelect }) => {
  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = viewYear - 8; y <= viewYear + 8; y++) list.push(y);
    return list;
  }, [viewYear]);

  return (
    <div className="fd-calendar__picker-grid">
      {years.map((y) => (
        <button
          key={y}
          type="button"
          className={[
            'fd-calendar__picker-item',
            y === viewYear ? 'fd-calendar__picker-item--selected' : '',
          ].filter(Boolean).join(' ')}
          onClick={() => onSelect(y)}
          aria-pressed={y === viewYear}
        >
          {y}
        </button>
      ))}
    </div>
  );
};

/* ─── Component ──────────────────────────────────────── */

export const Calendar: React.FC<CalendarProps> = ({
  value,
  minDate,
  maxDate,
  selection = 'single',
  rangeStart,
  rangeEnd,
  showWeekNumbers = false,
  formFactor = 'cozy',
  onChange,
  onRangeChange,
  className = '',
  _controlledYear,
  _controlledMonth,
}) => {
  const today = useMemo(() => cloneDate(new Date()), []);

  const [viewYear, setViewYear] = useState<number>(() => _controlledYear ?? (value ?? today).getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => _controlledMonth ?? (value ?? today).getMonth());
  const [pickerView, setPickerView] = useState<CalendarPickerView>('day');

  const [pendingRangeStart, setPendingRangeStart] = useState<Date | null>(null);

  // Sync when controlled year/month change (e.g. DateRangePicker navigation)
  useEffect(() => {
    if (_controlledYear !== undefined) setViewYear(_controlledYear);
  }, [_controlledYear]);

  useEffect(() => {
    if (_controlledMonth !== undefined) setViewMonth(_controlledMonth);
  }, [_controlledMonth]);

  const grid = useMemo(() => buildGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const navigateMonth = useCallback((delta: number) => {
    setViewMonth((prev) => {
      let m = prev + delta;
      let y = viewYear;
      if (m < 0) { m = 11; y -= 1; }
      if (m > 11) { m = 0; y += 1; }
      setViewYear(y);
      return m;
    });
    setPickerView('day');
  }, [viewYear]);

  const navigateYear = useCallback((delta: number) => {
    setViewYear((y) => y + delta);
  }, []);

  const handleDayClick = useCallback((day: Date) => {
    if (minDate && isBeforeDay(day, minDate)) return;
    if (maxDate && isAfterDay(day, maxDate)) return;

    if (selection === 'single') {
      onChange?.(cloneDate(day));
    } else {
      if (!pendingRangeStart) {
        setPendingRangeStart(cloneDate(day));
      } else {
        const start = isBeforeDay(day, pendingRangeStart) ? cloneDate(day) : cloneDate(pendingRangeStart);
        const end = isBeforeDay(day, pendingRangeStart) ? cloneDate(pendingRangeStart) : cloneDate(day);
        setPendingRangeStart(null);
        onRangeChange?.(start, end);
      }
    }
  }, [selection, minDate, maxDate, onChange, onRangeChange, pendingRangeStart]);

  const effectiveRangeStart = pendingRangeStart ?? rangeStart ?? null;
  const effectiveRangeEnd = pendingRangeStart ? null : (rangeEnd ?? null);

  const wrapperClasses = [
    'fd-calendar',
    formFactor === 'compact' ? 'fd-calendar--compact' : '',
    className,
  ].filter(Boolean).join(' ');

  /* ── Nav header label ── */
  const headerLeft = (
    <button
      type="button"
      className="fd-calendar__nav-btn"
      aria-label={pickerView === 'day' ? 'Previous month' : 'Previous year'}
      onClick={() => pickerView === 'day' ? navigateMonth(-1) : navigateYear(-1)}
    >
      <SlimArrowLeft />
    </button>
  );

  const headerRight = (
    <button
      type="button"
      className="fd-calendar__nav-btn"
      aria-label={pickerView === 'day' ? 'Next month' : 'Next year'}
      onClick={() => pickerView === 'day' ? navigateMonth(1) : navigateYear(1)}
    >
      <SlimArrowRight />
    </button>
  );

  return (
    <div className={wrapperClasses} role="application" aria-label="Date picker">
      {/* ── Header ── */}
      <div className="fd-calendar__header">
        {headerLeft}

        {/* Month button */}
        <button
          type="button"
          className={[
            'fd-calendar__header-btn',
            pickerView === 'month' ? 'fd-calendar__header-btn--active' : '',
          ].filter(Boolean).join(' ')}
          aria-label={`${MONTH_NAMES[viewMonth]}. Click to pick a month.`}
          aria-expanded={pickerView === 'month'}
          onClick={() => setPickerView((v) => v === 'month' ? 'day' : 'month')}
        >
          {MONTH_NAMES[viewMonth]}
        </button>

        {/* Year button */}
        <button
          type="button"
          className={[
            'fd-calendar__header-btn',
            pickerView === 'year' ? 'fd-calendar__header-btn--active' : '',
          ].filter(Boolean).join(' ')}
          aria-label={`${viewYear}. Click to pick a year.`}
          aria-expanded={pickerView === 'year'}
          onClick={() => setPickerView((v) => v === 'year' ? 'day' : 'year')}
        >
          {viewYear}
        </button>

        {headerRight}
      </div>

      {/* ── Month picker ── */}
      {pickerView === 'month' && (
        <MonthPicker
          viewYear={viewYear}
          viewMonth={viewMonth}
          onSelect={(m) => { setViewMonth(m); setPickerView('day'); }}
          onYearNav={navigateYear}
        />
      )}

      {/* ── Year picker ── */}
      {pickerView === 'year' && (
        <YearPicker
          viewYear={viewYear}
          onSelect={(y) => { setViewYear(y); setPickerView('day'); }}
        />
      )}

      {/* ── Day grid ── */}
      {pickerView === 'day' && (
        <div className="fd-calendar__body">
          {/* Weekday headers row */}
          <div className="fd-calendar__row">
            {showWeekNumbers && (
              <div className="fd-calendar__cell fd-calendar__cell--label" aria-label="Week number" />
            )}
            {WEEKDAY_LABELS.map((wd) => (
              <div key={wd} className="fd-calendar__cell fd-calendar__cell--weekday" aria-label={wd}>
                {wd}
              </div>
            ))}
          </div>

          {/* Week rows */}
          {grid.map((row, rowIdx) => (
            <div key={rowIdx} className="fd-calendar__row">
              {showWeekNumbers && (
                <div className="fd-calendar__cell fd-calendar__cell--week-num" aria-label={`Week ${isoWeekNumber(row[0])}`}>
                  {isoWeekNumber(row[0])}
                </div>
              )}
              {row.map((day) => {
                const isOtherMonth = day.getMonth() !== viewMonth;
                const isToday = isSameDay(day, today);
                const weekend = isWeekend(day);
                const isDisabled =
                  (minDate != null && isBeforeDay(day, minDate)) ||
                  (maxDate != null && isAfterDay(day, maxDate));

                const isSelected =
                  selection === 'single' && value != null && isSameDay(day, value);

                const isRangeStart =
                  selection === 'range' &&
                  effectiveRangeStart != null &&
                  isSameDay(day, effectiveRangeStart);

                const isRangeEnd =
                  selection === 'range' &&
                  effectiveRangeEnd != null &&
                  isSameDay(day, effectiveRangeEnd);

                const isInRange =
                  selection === 'range' &&
                  effectiveRangeStart != null &&
                  effectiveRangeEnd != null &&
                  isAfterDay(day, effectiveRangeStart) &&
                  isBeforeDay(day, effectiveRangeEnd);

                const isRangeBandStart =
                  selection === 'range' &&
                  effectiveRangeStart != null &&
                  effectiveRangeEnd != null &&
                  isSameDay(day, effectiveRangeStart);

                const isRangeBandEnd =
                  selection === 'range' &&
                  effectiveRangeStart != null &&
                  effectiveRangeEnd != null &&
                  isSameDay(day, effectiveRangeEnd);

                const isRangeBandMid =
                  selection === 'range' &&
                  effectiveRangeStart != null &&
                  effectiveRangeEnd != null &&
                  isAfterDay(day, effectiveRangeStart) &&
                  isBeforeDay(day, effectiveRangeEnd);

                const cellClasses = [
                  'fd-calendar__cell',
                  'fd-calendar__cell--day',
                  weekend && !isOtherMonth ? 'fd-calendar__cell--non-working' : '',
                  !weekend && !isOtherMonth ? 'fd-calendar__cell--working' : '',
                  isRangeBandStart ? 'fd-calendar__cell--range-band-start' : '',
                  isRangeBandEnd ? 'fd-calendar__cell--range-band-end' : '',
                  isRangeBandMid ? 'fd-calendar__cell--range-band-mid' : '',
                ].filter(Boolean).join(' ');

                const dayClasses = [
                  'fd-calendar__day',
                  isToday ? 'fd-calendar__day--today' : '',
                  isSelected ? 'fd-calendar__day--selected' : '',
                  isRangeStart ? 'fd-calendar__day--range-start' : '',
                  isRangeEnd ? 'fd-calendar__day--range-end' : '',
                  isInRange ? 'fd-calendar__day--in-range' : '',
                  isOtherMonth ? 'fd-calendar__day--other-month' : '',
                  isDisabled ? 'fd-calendar__day--disabled' : '',
                ].filter(Boolean).join(' ');

                const ariaLabel = `${day.getDate()} ${MONTH_NAMES[day.getMonth()]} ${day.getFullYear()}${isToday ? ', today' : ''}${isDisabled ? ', unavailable' : ''}`;

                return (
                  <div key={day.toISOString()} className={cellClasses}>
                    <button
                      type="button"
                      className={dayClasses}
                      disabled={isDisabled}
                      aria-label={ariaLabel}
                      aria-pressed={isSelected || isRangeStart || isRangeEnd}
                      aria-current={isToday ? 'date' : undefined}
                      onClick={() => handleDayClick(day)}
                      tabIndex={isDisabled ? -1 : 0}
                    >
                      {day.getDate()}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Calendar;
