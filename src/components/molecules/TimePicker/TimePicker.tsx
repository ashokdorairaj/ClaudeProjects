import React, {
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import type { FormFactor, ValueState } from '../../../tokens';
import './TimePicker.css';

export interface TimePickerProps {
  /** Controlled value as "HH:MM" or "HH:MM:SS" */
  value?: string;
  /** 24-hour or 12-hour clock format (default '24h') */
  format?: '24h' | '12h';
  /** Include seconds column (default false) */
  showSeconds?: boolean;
  /** Cozy (default) or Compact density */
  formFactor?: FormFactor;
  /** Disabled state */
  disabled?: boolean;
  /** Border / background value-state feedback */
  valueState?: ValueState;
  /** Assistive message below the input */
  valueStateMessage?: string;
  /** Called with the formatted time string when confirmed */
  onChange?: (value: string) => void;
  className?: string;
}

// ─── helpers ──────────────────────────────────────────────

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function parseTime(
  raw: string | undefined,
  format: '24h' | '12h',
): { h: number; m: number; s: number; ampm: 'AM' | 'PM' } {
  if (!raw) return { h: 0, m: 0, s: 0, ampm: 'AM' };
  const parts = raw.split(':').map(Number);
  let h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const s = parts[2] ?? 0;
  let ampm: 'AM' | 'PM' = 'AM';
  if (format === '12h') {
    ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
  }
  return { h, m, s, ampm };
}

function formatTime(
  h: number,
  m: number,
  s: number,
  ampm: 'AM' | 'PM',
  format: '24h' | '12h',
  showSeconds: boolean,
): string {
  let hour = h;
  if (format === '12h') {
    if (ampm === 'AM') {
      hour = h === 12 ? 0 : h;
    } else {
      hour = h === 12 ? 12 : h + 12;
    }
  }
  return showSeconds
    ? `${pad2(hour)}:${pad2(m)}:${pad2(s)}`
    : `${pad2(hour)}:${pad2(m)}`;
}

const valueStateClass: Record<ValueState, string> = {
  None: '',
  Positive: 'fd-time-picker--success',
  Negative: 'fd-time-picker--error',
  Critical: 'fd-time-picker--warning',
  Information: 'fd-time-picker--information',
};

// ─── ScrollColumn ──────────────────────────────────────────

interface ScrollColumnProps {
  label: string;
  items: string[];
  selected: number;
  onSelect: (index: number) => void;
}

const ScrollColumn: React.FC<ScrollColumnProps> = ({ label, items, selected, onSelect }) => {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll the selected item into centre view
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const selectedBtn = el.querySelectorAll<HTMLButtonElement>('.fd-time-picker__item')[selected];
    if (selectedBtn) {
      selectedBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selected]);

  return (
    <div className="fd-time-picker__column">
      <div className="fd-time-picker__column-label">{label}</div>
      <div className="fd-time-picker__column-list" ref={listRef} role="listbox" aria-label={label}>
        {items.map((item, idx) => (
          <button
            key={idx}
            type="button"
            role="option"
            aria-selected={idx === selected}
            className={[
              'fd-time-picker__item',
              idx === selected ? 'fd-time-picker__item--selected' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onSelect(idx)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── TimePicker ────────────────────────────────────────────

export const TimePicker: React.FC<TimePickerProps> = ({
  value: valueProp,
  format = '24h',
  showSeconds = false,
  formFactor = 'cozy',
  disabled = false,
  valueState = 'None',
  valueStateMessage,
  onChange,
  className = '',
}) => {
  const inputId = useId();
  const messageId = `${inputId}-msg`;
  const popoverRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);

  // Internal working copies (draft until OK is pressed)
  const parsed = parseTime(valueProp, format);
  const [draftH, setDraftH] = useState(parsed.h);
  const [draftM, setDraftM] = useState(parsed.m);
  const [draftS, setDraftS] = useState(parsed.s);
  const [draftAmpm, setDraftAmpm] = useState<'AM' | 'PM'>(parsed.ampm);

  // Sync draft when controlled value changes
  useEffect(() => {
    const p = parseTime(valueProp, format);
    setDraftH(p.h);
    setDraftM(p.m);
    setDraftS(p.s);
    setDraftAmpm(p.ampm);
  }, [valueProp, format]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  // Build column data
  const hourItems: string[] =
    format === '12h'
      ? Array.from({ length: 12 }, (_, i) => pad2(i + 1))
      : Array.from({ length: 24 }, (_, i) => pad2(i));
  const minuteItems: string[] = Array.from({ length: 60 }, (_, i) => pad2(i));
  const secondItems: string[] = Array.from({ length: 60 }, (_, i) => pad2(i));

  // Selected indices
  const hourIndex = format === '12h' ? draftH - 1 : draftH;
  const minuteIndex = draftM;
  const secondIndex = draftS;

  const handleHourSelect = (idx: number) => {
    setDraftH(format === '12h' ? idx + 1 : idx);
  };

  const handleConfirm = () => {
    const result = formatTime(draftH, draftM, draftS, draftAmpm, format, showSeconds);
    onChange?.(result);
    setOpen(false);
  };

  // Displayed value in the input
  const displayText = valueProp
    ? valueProp
    : formatTime(draftH, draftM, draftS, draftAmpm, format, showSeconds);

  const rootClasses = [
    'fd-time-picker',
    formFactor === 'compact' ? 'fd-time-picker--compact' : '',
    disabled ? 'fd-time-picker--disabled' : '',
    valueStateClass[valueState],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClasses} ref={popoverRef}>
      <div className="fd-time-picker__input-row">
        <input
          id={inputId}
          className="fd-time-picker__display"
          type="text"
          readOnly
          value={displayText}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-describedby={valueStateMessage ? messageId : undefined}
          aria-invalid={valueState === 'Negative' ? 'true' : undefined}
          onClick={() => !disabled && setOpen((o) => !o)}
        />
        <button
          type="button"
          className="fd-time-picker__icon-btn"
          aria-label={open ? 'Close time picker' : 'Open time picker'}
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          tabIndex={disabled ? -1 : 0}
        >
          <ClockIcon />
        </button>
      </div>

      {open && (
        <div
          className="fd-time-picker__popover"
          role="dialog"
          aria-modal="true"
          aria-label="Time picker"
        >
          <div className="fd-time-picker__columns">
            <ScrollColumn
              label="HH"
              items={hourItems}
              selected={hourIndex}
              onSelect={handleHourSelect}
            />
            <ScrollColumn
              label="MM"
              items={minuteItems}
              selected={minuteIndex}
              onSelect={(idx) => setDraftM(idx)}
            />
            {showSeconds && (
              <ScrollColumn
                label="SS"
                items={secondItems}
                selected={secondIndex}
                onSelect={(idx) => setDraftS(idx)}
              />
            )}
            {format === '12h' && (
              <div className="fd-time-picker__ampm">
                <button
                  type="button"
                  className={[
                    'fd-time-picker__ampm-btn',
                    draftAmpm === 'AM' ? 'fd-time-picker__ampm-btn--active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setDraftAmpm('AM')}
                  aria-pressed={draftAmpm === 'AM'}
                >
                  AM
                </button>
                <button
                  type="button"
                  className={[
                    'fd-time-picker__ampm-btn',
                    draftAmpm === 'PM' ? 'fd-time-picker__ampm-btn--active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setDraftAmpm('PM')}
                  aria-pressed={draftAmpm === 'PM'}
                >
                  PM
                </button>
              </div>
            )}
          </div>
          <div className="fd-time-picker__footer">
            <button
              type="button"
              className="fd-time-picker__ok-btn"
              onClick={handleConfirm}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {valueStateMessage && (
        <p
          id={messageId}
          className={`fd-time-picker__message fd-time-picker__message--${valueState.toLowerCase()}`}
          role="alert"
        >
          {valueStateMessage}
        </p>
      )}
    </div>
  );
};

export default TimePicker;

// ─── Clock SVG icon ────────────────────────────────────────

const ClockIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.25" />
    <path d="M8 4.5V8l2.5 2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
