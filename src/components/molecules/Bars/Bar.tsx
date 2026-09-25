import React from 'react';
import './Bar.css';

/* ── Status icon SVGs ─────────────────────────────────────── */
const ErrorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="7.5" fill="var(--sapNegativeColor,#e90b0b)" />
    <path d="M8 4v5M8 11v.01" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const WarningIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 1.5L15 14H1L8 1.5Z" fill="var(--sapCriticalColor,#dd6100)" stroke="var(--sapCriticalColor,#dd6100)" strokeWidth="0.5" />
    <path d="M8 6v4M8 12v.01" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const SuccessIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="7.5" fill="var(--sapPositiveColor,#30914c)" />
    <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const InformationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="7.5" fill="var(--sapInformativeColor,#0070f2)" />
    <path d="M8 7v5M8 5v.01" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const ConfirmationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="7.5" fill="var(--sapNeutralColor,#556b82)" />
    <path d="M6.5 6c0-1 .7-1.5 1.5-1.5s1.5.5 1.5 1.5c0 .8-.5 1.2-1 1.5C8 8 8 8.5 8 9" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="8" cy="11" r="0.75" fill="#fff" />
  </svg>
);
const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Types ────────────────────────────────────────────────── */
export type BarSemanticType = 'Error' | 'Warning' | 'Success' | 'Information' | 'Confirmation';

/* ── PageHeader ───────────────────────────────────────────── */
export interface PageHeaderProps {
  title: string;
  subheader?: React.ReactNode;
  navigationAction?: React.ReactNode;
  actions?: React.ReactNode;
  formFactor?: 'cozy' | 'compact';
  /** Semantic state adds colored bottom border + status icon */
  semanticType?: BarSemanticType;
  className?: string;
}

const SEMANTIC_ICONS: Record<BarSemanticType, React.FC> = {
  Error: ErrorIcon,
  Warning: WarningIcon,
  Success: SuccessIcon,
  Information: InformationIcon,
  Confirmation: ConfirmationIcon,
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subheader,
  navigationAction,
  actions,
  formFactor = 'cozy',
  semanticType,
  className = '',
}) => {
  const isCompact = formFactor === 'compact';
  const isSemantic = !!semanticType;

  const classes = [
    'fd-page-header',
    isCompact ? 'fd-page-header--compact' : '',
    isSemantic ? `fd-page-header--${semanticType.toLowerCase()}` : '',
    className,
  ].filter(Boolean).join(' ');

  const Icon = semanticType ? SEMANTIC_ICONS[semanticType] : null;

  return (
    <header className={classes} role="banner">
      {/* Semantic row: icon + title inline */}
      {isSemantic ? (
        <>
          {Icon && <span className="fd-page-header__status-icon"><Icon /></span>}
          <span className="fd-page-header__title fd-page-header__title--semantic">{semanticType}</span>
          {actions && <div className="fd-page-header__actions">{actions}</div>}
        </>
      ) : (
        <>
          {/* Back button / nav */}
          {navigationAction && (
            <div className="fd-page-header__nav">{navigationAction}</div>
          )}

          {/* Title + optional subheader */}
          <div className="fd-page-header__title-area">
            <h1 className="fd-page-header__title">{title}</h1>
            {subheader && (
              <div className="fd-page-header__subheader">{subheader}</div>
            )}
          </div>

          {actions && <div className="fd-page-header__actions">{actions}</div>}
        </>
      )}

      {/* Inner bottom border shadow overlay */}
      <div className="fd-page-header__shadow" aria-hidden="true" />
    </header>
  );
};

/* ── PageHeaderBackButton ─────────────────────────────────── */
export interface PageHeaderBackButtonProps {
  onClick?: () => void;
  ariaLabel?: string;
}

export const PageHeaderBackButton: React.FC<PageHeaderBackButtonProps> = ({
  onClick,
  ariaLabel = 'Navigate back',
}) => (
  <button
    className="fd-page-header__back-btn"
    onClick={onClick}
    type="button"
    aria-label={ariaLabel}
  >
    <BackIcon />
  </button>
);

/* ── PageFooter ───────────────────────────────────────────── */
export interface PageFooterProps {
  children?: React.ReactNode;
  formFactor?: 'cozy' | 'compact';
  beginActions?: React.ReactNode;
  endActions?: React.ReactNode;
  /** Floating footer has rounded corners + shadow instead of border-top */
  floating?: boolean;
  className?: string;
}

export const PageFooter: React.FC<PageFooterProps> = ({
  children,
  formFactor = 'cozy',
  beginActions,
  endActions,
  floating = false,
  className = '',
}) => {
  const classes = [
    'fd-page-footer',
    formFactor === 'compact' ? 'fd-page-footer--compact' : '',
    floating ? 'fd-page-footer--floating' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <footer className={classes} role="contentinfo">
      {beginActions && (
        <div className="fd-page-footer__begin">{beginActions}</div>
      )}
      {children && (
        <div className="fd-page-footer__center">{children}</div>
      )}
      {endActions && (
        <div className="fd-page-footer__end">{endActions}</div>
      )}
    </footer>
  );
};
