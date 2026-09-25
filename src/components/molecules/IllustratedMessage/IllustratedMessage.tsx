import React from 'react';
import type { FormFactor } from '../../../tokens';
import './IllustratedMessage.css';

/* ── Types ─────────────────────────────────────────────────── */

/**
 * SAP Fiori IllustratedMessage size variants.
 *
 * | Size    | Illustration | Usage                                          |
 * |---------|-------------|------------------------------------------------|
 * | Auto    | Responsive  | Adapts to container — use by default           |
 * | Scene   | ~400 px     | Full-page empty states (List, Table page level) |
 * | Dialog  | ~256 px     | Inside a Dialog or Panel                       |
 * | Spot    | ~128 px     | Compact areas, card bodies                     |
 * | Base    | ~80 px      | Minimal — icon + very short text only          |
 */
export type IllustrationSize = 'Auto' | 'Scene' | 'Dialog' | 'Spot' | 'Base';

/**
 * Named illustrations from the SAP Fiori illustration library.
 * Import the matching SVG asset and pass it via the `illustration` prop,
 * or reference the name via the `name` prop for documentation purposes.
 */
export type IllustrationType =
  | 'NoData'
  | 'NoSearchResults'
  | 'NoActivities'
  | 'NoNotifications'
  | 'NoMail'
  | 'NoEntries'
  | 'NoTasks'
  | 'NoSavedItems'
  | 'ErrorScreen'
  | 'PageNotFound'
  | 'UnableToLoad'
  | 'ConnectionLost'
  | 'SuccessScreen'
  | 'AddColumn'
  | 'AddPeople'
  | 'BalloonSky'
  | 'BeforeSearch'
  | 'EmptyCalendar'
  | 'EmptyList'
  | 'EmptyPlanningCalendar'
  | 'Reload'
  | 'SearchEarth'
  | 'SearchFolder'
  | 'SimpleBalloon'
  | 'SimpleBell'
  | 'SimpleCalendar'
  | 'SimpleCheckMark'
  | 'SimpleConnection'
  | 'SimpleEmptyDoc'
  | 'SimpleEmptyList'
  | 'SimpleError'
  | 'SimpleMagnifier'
  | 'SimpleNotFoundMagnifier'
  | 'SimpleTask'
  | 'SuccessHighFive'
  | 'Survey'
  | 'Tent'
  | 'TntChartArea'
  | 'TntChartBar'
  | 'TntDashboard'
  | 'TntNoApplications'
  | 'TntServices'
  | 'TntTools'
  | 'TntUnableToLoad'
  | string; // allow custom illustration names

export interface IllustratedMessageProps {
  /** Named illustration — used for documentation/tooling; pass `illustration` for the actual SVG */
  name?: IllustrationType;
  /** Heading text */
  title?: string;
  /** Supporting description text (also accepted as `subtitle` for SAP Fiori alignment) */
  subtitle?: string;
  /** @deprecated Use `subtitle` instead */
  description?: string;
  /** Illustration size variant */
  size?: IllustrationSize;
  /** Custom illustration SVG or image node */
  illustration?: React.ReactNode;
  /** CTA button(s) — hidden in Base size */
  actions?: React.ReactNode;
  /** Cozy (default) or Compact density */
  formFactor?: FormFactor;
  className?: string;
}

/* ── Illustration pixel sizes ───────────────────────────────── */

const sizeMap: Record<IllustrationSize, number> = {
  Auto:   256, // same as Dialog by default; real responsive behaviour needs container query
  Scene:  400,
  Dialog: 256,
  Spot:   128,
  Base:    80,
};

/* ── Default placeholder SVG ────────────────────────────────── */

const PlaceholderIllustration: React.FC<{ size: number }> = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    aria-hidden="true"
    role="img"
  >
    <circle cx="50" cy="50" r="46" fill="var(--sapIllus_Layering1, var(--sap-active-color, #dee3e8))" />
    <text
      x="50"
      y="50"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="40"
      fontFamily="var(--sapFontFamily, var(--sap-font-family))"
      fill="var(--sapIllus_ObjectFillColor, var(--sap-content-label-color, #556b82))"
      fontWeight="700"
    >
      ?
    </text>
  </svg>
);

/* ── Component ──────────────────────────────────────────────── */

export const IllustratedMessage: React.FC<IllustratedMessageProps> = ({
  title,
  subtitle,
  description,
  size = 'Auto',
  illustration,
  actions,
  formFactor = 'cozy',
  className = '',
}) => {
  // Support legacy `description` prop — `subtitle` takes precedence
  const subtitleText = subtitle ?? description;

  const px = sizeMap[size];
  const isBase = size === 'Base';

  const classes = [
    'fd-illustrated-message',
    `fd-illustrated-message--${size.toLowerCase()}`,
    formFactor === 'compact' ? 'fd-illustrated-message--compact' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role="status">
      {/* Illustration */}
      <div
        className="fd-illustrated-message__illustration"
        style={{ width: px, height: px }}
        aria-hidden="true"
      >
        {illustration ?? <PlaceholderIllustration size={px} />}
      </div>

      {/* Title — always shown (SAP Fiori shows title even at Base size) */}
      {title && (
        <h3 className="fd-illustrated-message__title">{title}</h3>
      )}

      {/* Subtitle — hidden at Base size */}
      {!isBase && subtitleText && (
        <p className="fd-illustrated-message__subtitle">{subtitleText}</p>
      )}

      {/* Actions — hidden at Base size */}
      {!isBase && actions && (
        <div className="fd-illustrated-message__actions">
          {actions}
        </div>
      )}
    </div>
  );
};

export default IllustratedMessage;
