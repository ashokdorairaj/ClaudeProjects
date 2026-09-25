import React from 'react';
import './Label.css';

/**
 * Semantic label for a form control. Accessibility requirement — every
 * Input, Select, CheckBox, Switch, and DatePicker must have a Label.
 *
 * @see src/pages/docs/label.md
 *
 * @constraints
 * - Always provide `htmlFor` pointing to the control's `id`, or use
 *   the control's built-in `label` prop (which wraps Label internally).
 * - Do not use Label as decorative text; use `Text` for that.
 *
 * @example
 * <Label htmlFor="email" required>Email address</Label>
 * <Input id="email" type="email" />
 */
export interface LabelProps {
  /** Associates the label with a form element */
  htmlFor?: string;
  children: React.ReactNode;
  /** Shows a red asterisk to indicate the field is required */
  required?: boolean;
  /** Appends ':' after the label text */
  showColon?: boolean;
  className?: string;
}

export const Label: React.FC<LabelProps> = ({
  htmlFor,
  children,
  required = false,
  showColon = false,
  className = '',
}) => {
  const classes = [
    'fd-label',
    required ? 'fd-label--required' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label htmlFor={htmlFor} className={classes}>
      {children}
      {showColon && ':'}
    </label>
  );
};

export default Label;
