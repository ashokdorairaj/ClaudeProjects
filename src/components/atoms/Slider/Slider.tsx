import React, { useId, useRef, useState } from 'react';
import type { FormFactor } from '../../../tokens';
import './Slider.css';

export interface SliderProps {
  /** Controlled value */
  value?: number;
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
  /** Show a floating tooltip above the thumb with the current value */
  showTooltip?: boolean;
  /** Cozy (default) or Compact density */
  formFactor?: FormFactor;
  /** Disabled state */
  disabled?: boolean;
  /** Called with the new value on every change */
  onChange?: (value: number) => void;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value: valueProp,
  min = 0,
  max = 100,
  step = 1,
  showTickMarks = false,
  showLabels = false,
  showTooltip = false,
  formFactor = 'cozy',
  disabled = false,
  onChange,
  className = '',
}) => {
  const inputId = useId();
  const isControlled = valueProp !== undefined;
  const [internalValue, setInternalValue] = useState<number>(
    valueProp !== undefined ? valueProp : min,
  );
  const [dragging, setDragging] = useState(false);
  const rangeRef = useRef<HTMLInputElement>(null);

  const currentValue = isControlled ? (valueProp as number) : internalValue;

  const pct = max === min ? 0 : ((currentValue - min) / (max - min)) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = parseFloat(e.target.value);
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
  };

  // Tooltip position
  const tooltipLeft = `${pct}%`;

  // Tick marks
  const tickCount = Math.round((max - min) / step) + 1;
  const ticks =
    showTickMarks && tickCount <= 101
      ? Array.from({ length: tickCount }, (_, i) => i)
      : [];

  const sliderClasses = [
    'fd-slider',
    formFactor === 'compact' ? 'fd-slider--compact' : '',
    disabled ? 'fd-slider--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={['fd-slider-field', className].filter(Boolean).join(' ')}>
      <div className={sliderClasses}>
        {ticks.length > 0 && (
          <div className="fd-slider__tick-marks" aria-hidden="true">
            {ticks.map((t) => (
              <span key={t} className="fd-slider__tick" />
            ))}
          </div>
        )}
        <input
          ref={rangeRef}
          id={inputId}
          type="range"
          className="fd-slider__track"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          disabled={disabled}
          onChange={handleChange}
          onMouseDown={() => setDragging(true)}
          onMouseUp={() => setDragging(false)}
          onTouchStart={() => setDragging(true)}
          onTouchEnd={() => setDragging(false)}
          style={{ '--slider-pct': `${pct}%` } as React.CSSProperties}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={currentValue}
        />
        {showTooltip && (
          <div
            className={['fd-slider__tooltip', dragging ? 'fd-slider__tooltip--active' : ''].filter(Boolean).join(' ')}
            style={{ left: tooltipLeft }}
            aria-hidden="true"
          >
            {currentValue}
          </div>
        )}
      </div>
      {showLabels && (
        <div className="fd-slider__labels">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
};

export default Slider;
