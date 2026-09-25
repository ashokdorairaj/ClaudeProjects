import React from 'react';
import type { ButtonDesign, FormFactor } from '../../../tokens';
import './Button.css';

/**
 * Primary interactive element for user actions.
 *
 * @see src/pages/docs/buttons.md
 *
 * @constraints
 * - Use at most **one** `design="Emphasized"` per page/section.
 * - `iconOnly=true` requires `children` to be a string — it becomes the `aria-label`.
 * - Do not use Button for navigation; use `Link` or `SideNavigation` instead.
 * - `design="Positive"` / `"Negative"` are for confirmations only, not toolbars.
 *
 * @example
 * // Primary + cancel pair
 * <Button design="Emphasized" onClick={handleSave}>Save</Button>
 * <Button design="Default" onClick={handleCancel}>Cancel</Button>
 *
 * @example
 * // Icon-only (string children = aria-label)
 * <Button iconOnly icon={<Icon name="delete" />} design="Transparent">Delete item</Button>
 */
export interface ButtonProps {
  /** Visual design variant – matches SAP Figma "Type" prop */
  design?: ButtonDesign;
  /** Cozy (default) or Compact density */
  formFactor?: FormFactor;
  /** Disabled state */
  disabled?: boolean;
  /** Icon element rendered to the left of the label */
  icon?: React.ReactNode;
  /** Icon rendered to the right of the label */
  iconEnd?: React.ReactNode;
  /** Icon-only button (no label) */
  iconOnly?: boolean;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /** HTML button type */
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  style?: React.CSSProperties;
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

export const Button: React.FC<ButtonProps> = ({
  design = 'Default',
  formFactor = 'cozy',
  disabled = false,
  icon,
  iconEnd,
  iconOnly = false,
  children,
  onClick,
  type = 'button',
  className = '',
  style,
}) => {
  const classes = [
    'fd-button',
    designMap[design],
    formFactor === 'compact' ? 'fd-button--compact' : '',
    iconOnly ? 'fd-button--icon-only' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      style={style}
      aria-label={iconOnly && typeof children === 'string' ? children : undefined}
    >
      {icon && <span className="fd-button__icon fd-button__icon--left">{icon}</span>}
      {!iconOnly && children && <span className="fd-button__text">{children}</span>}
      {iconEnd && <span className="fd-button__icon fd-button__icon--right">{iconEnd}</span>}
    </button>
  );
};

export default Button;
