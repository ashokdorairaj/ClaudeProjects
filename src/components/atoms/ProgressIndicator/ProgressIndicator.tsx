import React from 'react';
import './ProgressIndicator.css';

export type ProgressDisplayValue = 'none' | 'percentage' | 'value';

export interface ProgressIndicatorProps {
  value?: number;
  maxValue?: number;
  /** What text to show beside the bar: 'percentage' (default), 'value' (e.g. 3/5), or 'none' */
  displayValue?: ProgressDisplayValue;
  valueState?: 'None' | 'Positive' | 'Negative' | 'Critical' | 'Information';
  /** Disables interaction and applies 40 % opacity (matches Figma Disabled state) */
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const STATE_CLASS: Record<string, string> = {
  None: '',
  Positive: 'fd-progress--positive',
  Negative: 'fd-progress--negative',
  Critical: 'fd-progress--critical',
  Information: 'fd-progress--information',
};

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value = 0,
  maxValue = 100,
  displayValue = 'percentage',
  valueState = 'None',
  disabled = false,
  className = '',
  style,
}) => {
  const percent = Math.min(100, Math.max(0, (value / maxValue) * 100));

  const label =
    displayValue === 'percentage'
      ? `${Math.round(percent)}%`
      : displayValue === 'value'
      ? `${value}/${maxValue}`
      : '';

  const rootClasses = [
    'fd-progress',
    STATE_CLASS[valueState],
    disabled ? 'fd-progress--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClasses} style={style}>
      {/*
        Figma structure:
          outer wrapper  16 px tall  (.fd-progress__track)
            track rail   6 px tall   (.fd-progress__rail)
            fill bar     10 px tall  (.fd-progress__fill)
      */}
      <div
        className="fd-progress__track"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={maxValue}
        aria-label={label ? `Progress: ${label}` : 'Progress'}
        aria-disabled={disabled || undefined}
      >
        <div className="fd-progress__rail" aria-hidden="true" />
        <div className="fd-progress__fill" style={{ width: `${percent}%` }} aria-hidden="true" />
      </div>
      {displayValue !== 'none' && (
        <span className="fd-progress__value" aria-hidden="true">{label}</span>
      )}
    </div>
  );
};

export default ProgressIndicator;
