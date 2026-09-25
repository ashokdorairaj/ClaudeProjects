import React, { useId, useState } from 'react';
import type { FormFactor } from '../../../tokens';
import './RatingIndicator.css';

export interface RatingIndicatorProps {
  /** Current rating value (0 – maxValue, supports 0.5 increments) */
  value?: number;
  /** Maximum number of stars (default 5) */
  maxValue?: number;
  /**
   * Read-only display mode — stars are not interactive and rendered at 18 px
   * (matches Figma "Read Only" interaction state).
   */
  displayOnly?: boolean;
  /**
   * Disabled mode — stars are not interactive and the whole component is
   * rendered at 40 % opacity (matches Figma "Disabled" interaction state).
   */
  disabled?: boolean;
  /** Label text shown to the left of the stars */
  label?: string;
  /** Cozy (default 24 px stars) or Compact (16 px stars) density */
  formFactor?: FormFactor;
  /** Called with the new value when a star is clicked */
  onChange?: (value: number) => void;
  className?: string;
}

/** Round a raw float to the nearest 0.5 step */
function roundHalf(v: number): number {
  return Math.round(v * 2) / 2;
}

/** Determine if a star at position `index` (1-based) is full, half, or empty */
function starFill(value: number, index: number): 'full' | 'half' | 'empty' {
  if (value >= index) return 'full';
  if (value >= index - 0.5) return 'half';
  return 'empty';
}

export const RatingIndicator: React.FC<RatingIndicatorProps> = ({
  value = 0,
  maxValue = 5,
  displayOnly = false,
  disabled = false,
  label,
  formFactor = 'cozy',
  onChange,
  className = '',
}) => {
  const labelId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Clamp and round value
  const safeValue = Math.min(maxValue, Math.max(0, roundHalf(value)));

  // When hovering, use hover index as the visual value
  const displayValue = hoverIndex !== null ? hoverIndex : safeValue;

  // A disabled rating behaves like read-only visually but also gets opacity treatment
  const isInert = displayOnly || disabled;

  const rootClasses = [
    'fd-rating',
    displayOnly ? 'fd-rating--display-only' : '',
    disabled ? 'fd-rating--disabled' : '',
    formFactor === 'compact' ? 'fd-rating--compact' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = (index: number) => {
    if (isInert) return;
    onChange?.(index);
  };

  const handleMouseEnter = (index: number) => {
    if (isInert) return;
    setHoverIndex(index);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (isInert) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange?.(index);
    }
  };

  const stars = Array.from({ length: maxValue }, (_, i) => {
    const index = i + 1;
    const fill = starFill(displayValue, index);
    const isHovered = hoverIndex !== null && index <= hoverIndex;

    const starClasses = [
      'fd-rating__star',
      fill === 'full' ? 'fd-rating__star--filled' : '',
      fill === 'half' ? 'fd-rating__star--half' : '',
      fill === 'empty' ? 'fd-rating__star--empty' : '',
      isHovered ? 'fd-rating__star--hover' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const ariaLabel = `${index} of ${maxValue} stars`;

    const starContent =
      fill === 'half' ? (
        <>
          {'☆'}
          <span className="fd-rating__star-half-fill" aria-hidden="true">★</span>
        </>
      ) : fill === 'full' ? (
        '★'
      ) : (
        '☆'
      );

    if (isInert) {
      return (
        <span
          key={index}
          className={starClasses}
          aria-hidden="true"
        >
          {starContent}
        </span>
      );
    }

    return (
      <button
        key={index}
        type="button"
        className={starClasses}
        aria-label={ariaLabel}
        aria-pressed={safeValue >= index}
        onClick={() => handleClick(index)}
        onMouseEnter={() => handleMouseEnter(index)}
        onMouseLeave={handleMouseLeave}
        onKeyDown={(e) => handleKeyDown(e, index)}
        tabIndex={0}
      >
        {starContent}
      </button>
    );
  });

  return (
    <div
      className={rootClasses}
      role={isInert ? 'img' : undefined}
      aria-label={isInert ? `Rating: ${safeValue} out of ${maxValue}` : undefined}
    >
      {label && (
        <span id={labelId} className="fd-rating__label">
          {label}
        </span>
      )}
      <div
        className="fd-rating__stars"
        role={isInert ? undefined : 'group'}
        aria-labelledby={label ? labelId : undefined}
      >
        {stars}
      </div>
    </div>
  );
};

export default RatingIndicator;
