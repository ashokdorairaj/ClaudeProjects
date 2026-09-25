import React from 'react';
import type { FormFactor } from '../../../tokens';
import './Form.css';

/* ══════════════════════════════════════════════════════════════
   Form
══════════════════════════════════════════════════════════════ */

/**
 * Structured data-entry layout following the SAP Fiori Form pattern.
 * Canonical nesting: `Form → FormColumn → FormGroup → FormItem → control`.
 *
 * @see src/pages/docs/form.md
 *
 * @constraints
 * - Always wrap each field in `FormItem` — never place controls directly inside `Form` or `FormGroup`.
 * - `columnsL` controls the multi-column layout at large breakpoints (1–3). Default is 2.
 * - `displayMode=true` renders read-only label/value pairs — swap when toggling view/edit.
 * - `vertical=true` stacks labels above fields; use for narrow single-column forms only.
 * - Every `FormItem` with a visible label must pass that label via the `label` prop — do not use a standalone `Label`.
 *
 * @example
 * <Form title="Personal Details" columnsL={2}>
 *   <FormColumn>
 *     <FormGroup title="Basic Info">
 *       <FormItem label="First Name" required><Input /></FormItem>
 *       <FormItem label="Last Name" required><Input /></FormItem>
 *     </FormGroup>
 *   </FormColumn>
 *   <FormColumn>
 *     <FormGroup title="Contact">
 *       <FormItem label="Email"><Input type="email" /></FormItem>
 *     </FormGroup>
 *   </FormColumn>
 * </Form>
 */
export interface FormProps {
  children: React.ReactNode;
  title?: string;
  formFactor?: FormFactor;
  columnsL?: 1 | 2 | 3;
  columnsM?: 1 | 2;
  displayMode?: boolean;
  /** Vertical layout: labels above fields (used for single-column / narrow forms) */
  vertical?: boolean;
  className?: string;
}

export const Form: React.FC<FormProps> = ({
  children,
  title,
  formFactor = 'cozy',
  columnsL = 2,
  columnsM = 1,
  displayMode = false,
  vertical = false,
  className = '',
}) => {
  const classes = [
    'fd-form',
    formFactor === 'compact' ? 'fd-form--compact' : '',
    displayMode ? 'fd-form--display' : '',
    vertical ? 'fd-form--vertical' : '',
    `fd-form--cols-l-${columnsL}`,
    `fd-form--cols-m-${columnsM}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {title && (
        <div className="fd-form__header">
          <h6 className="fd-form__header-title">{title}</h6>
        </div>
      )}
      <div className="fd-form__content">{children}</div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   FormColumn
══════════════════════════════════════════════════════════════ */

export interface FormColumnProps {
  children: React.ReactNode;
  className?: string;
}

export const FormColumn: React.FC<FormColumnProps> = ({ children, className = '' }) => (
  <div className={['fd-form__column', className].filter(Boolean).join(' ')}>
    {children}
  </div>
);

/* ══════════════════════════════════════════════════════════════
   FormGroup
══════════════════════════════════════════════════════════════ */

export interface FormGroupProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormGroup: React.FC<FormGroupProps> = ({ title, children, className = '' }) => (
  <div className={['fd-form-group', className].filter(Boolean).join(' ')}>
    {title && <h4 className="fd-form-group__title">{title}</h4>}
    {children}
  </div>
);

/* ══════════════════════════════════════════════════════════════
   FormItem
══════════════════════════════════════════════════════════════ */

/**
 * Single label + control pair inside a `FormGroup`. The atomic unit of a Form layout.
 *
 * @constraints
 * - One control per `FormItem`. For compound inputs (e.g. date + time), wrap in a horizontal flex container.
 * - `multiline=true` aligns the label to the top — required for `TextArea` and multi-row controls.
 * - `required=true` appends a `*` to the label; the control must also carry `required` for form validation.
 */
export interface FormItemProps {
  label?: string;
  required?: boolean;
  children: React.ReactNode;
  /** Label column width: 4 = 33% (default), 6 = 50% */
  labelSpan?: 4 | 6;
  /** TextArea rows: label aligns top, control grows with content */
  multiline?: boolean;
  className?: string;
}

export const FormItem: React.FC<FormItemProps> = ({
  label,
  required = false,
  children,
  labelSpan = 4,
  multiline = false,
  className = '',
}) => {
  const labelW = `${((labelSpan / 12) * 100).toFixed(3)}%`;

  const itemClass = [
    'fd-form-item',
    required ? 'fd-form-item--required' : '',
    multiline ? 'fd-form-item--multiline' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={itemClass}
      style={{ '--fd-label-w': labelW } as React.CSSProperties}
    >
      <div className="fd-form-item__grid">
        {label && <label className="fd-form-item__label">{label}</label>}
        <div className="fd-form-item__control">{children}</div>
      </div>
    </div>
  );
};

export default Form;
