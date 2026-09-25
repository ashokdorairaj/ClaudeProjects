import React, { useId, useState } from 'react';
import type { FormFactor } from '../../../tokens';
// CSS is shared with Slider.css

export interface RangeSliderProps {
  /** Controlled start (lower) value */
  startValue?: number;
  /** Controlled end (upper) value */
  endValue?: number;
  /** Minimum value (default 0) */
  min?: number;
  /** Maximum value (default 100) */
  max?: number;
  /** Step size (default 1) */
  step?: number;
  /** Show tick marks along the track */
  showTickMarks?: boolean;
  /** Show min/max labels at both ends */
  showLabels?: boolean;
  /** Cozy (default) or Compact density */
  formFactor?: FormFactor;
  /** Disabled state */
  disabled?: boolean;
  /** Called with new [start, end] tuple on every change */
  onChange?: (start: number, end: number) => void;
  className?: string;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  startValue: startProp,
  endValue: endProp,
  min = 0,
  max = 100,
  step = 1,
  showTickMarks = false,
  showLabels = false,
  formFactor = 'cozy',
  disabled = false,
  onChange,
  className = '',
}) => {
  const startId = useId();
  const endId = useId();

  const isControlled = startProp !== undefined && endProp !== undefined;

  const [internalStart, setInternalStart] = useState<number>(
    startProp !== undefined ? startProp : min,
  );
  const [internalEnd, setInternalEnd] = useState<number>(
    endProp !== undefined ? endProp : max,
  );

  const start = isControlled ? (startProp as number) : internalStart;
  const end = isControlled ? (endProp as number) : internalEnd;

  const range = max - min;
  const startPct = range === 0 ? 0 : ((start - min) / range) * 100;
  const endPct = range === 0 ? 100 : ((end - min) / range) * 100;

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Math.min(parseFloat(e.target.value), end - step);
    if (!isControlled) setInternalStart(next);
    onChange?.(next, end);
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Math.max(parseFloat(e.target.value), start + step);
    if (!isControlled) setInternalEnd(next);
    onChange?.(start, next);
  };

  const tickCount = Math.round(range / step) + 1;
  const ticks =
    showTickMarks && tickCount <= 101
      ? Array.from({ length: tickCount }, (_, i) => i)
      : [];

  const containerClasses = [
    'fd-range-slider',
    formFactor === 'compact' ? 'fd-range-slider--compact' : '',
    disabled ? 'fd-range-slider--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={['fd-slider-field', className].filter(Boolean).join(' ')}>
      {showLabels && (
        <div className="fd-slider__labels">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      )}
      <div className={containerClasses}>
        {/* Background track */}
        <div className="fd-range-slider__track-bg" aria-hidden="true" />
        {/* Filled portion between thumbs */}
        <div
          className="fd-range-slider__fill"
          style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
          aria-hidden="true"
        />
        {ticks.length > 0 && (
          <div className="fd-slider__tick-marks" aria-hidden="true">
            {ticks.map((t) => (
              <span key={t} className="fd-slider__tick" />
            ))}
          </div>
        )}
        {/* Start thumb */}
        <input
          id={startId}
          type="range"
          className="fd-range-slider__input"
          min={min}
          max={max}
          step={step}
          value={start}
          disabled={disabled}
          onChange={handleStartChange}
          aria-label="Range start"
          aria-valuemin={min}
          aria-valuemax={end}
          aria-valuenow={start}
        />
        {/* End thumb */}
        <input
          id={endId}
          type="range"
          className="fd-range-slider__input"
          min={min}
          max={max}
          step={step}
          value={end}
          disabled={disabled}
          onChange={handleEndChange}
          aria-label="Range end"
          aria-valuemin={start}
          aria-valuemax={max}
          aria-valuenow={end}
        />
      </div>
    </div>
  );
};

export default RangeSlider;
