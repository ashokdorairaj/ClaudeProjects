import React from 'react';
import type { ButtonDesign, FormFactor } from '../../../tokens';
import './Button.css';

export interface IconButtonProps {
  /** Icon element to render inside the button */
  icon: React.ReactNode;
  /** Visual design variant */
  design?: ButtonDesign;
  /** Cozy (default) or Compact density */
  formFactor?: FormFactor;
  /** Disabled state */
  disabled?: boolean;
  /** Toggled / pressed state */
  toggled?: boolean;
  /** Accessible label (required – replaces visible text) */
  ariaLabel: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

const designMap: Record<ButtonDesign, string> = {
  Default: 'fd-button--standard',
  Emphasized: 'fd-button--emphasized',
  Positive: 'fd-button--positive',
  Negative: 'fd-button--negative',
  Attention: 'fd-button--attention',
  Transparent: 'fd-button--transparent',
  Critical: 'fd-button--critical',
  Success: 'fd-button--success',
  Neutral: 'fd-button--neutral',
  Information: 'fd-button--information',
};

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  design = 'Default',
  formFactor = 'cozy',
  disabled = false,
  toggled = false,
  ariaLabel,
  onClick,
  className = '',
}) => {
  const classes = [
    'fd-button',
    'fd-button--icon-only',
    designMap[design],
    formFactor === 'compact' ? 'fd-button--compact' : '',
    toggled ? 'fd-button--toggled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={toggled}
    >
      <span className="fd-button__icon">{icon}</span>
    </button>
  );
};

export default IconButton;
