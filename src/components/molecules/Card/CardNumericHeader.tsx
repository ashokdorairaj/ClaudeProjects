import React from 'react';
import './Card.css';

export type IndicatorState = 'neutral' | 'positive' | 'negative' | 'critical';

export interface CardNumericIndicator {
  label: string;
  value: string;
  state?: IndicatorState;
}

export interface CardNumericHeaderProps {
  /** Large KPI value, e.g. "65.5" */
  value: string;
  /** Unit/scale label next to the value, e.g. "MM" or "%" */
  scale?: string;
  /** Descriptive label shown below the KPI */
  label?: string;
  /** Up to 2 side indicators shown to the right of the KPI */
  indicators?: [CardNumericIndicator?, CardNumericIndicator?];
  /** Cozy (default) or Compact density */
  formFactor?: 'cozy' | 'compact';
}

export const CardNumericHeader: React.FC<CardNumericHeaderProps> = ({
  value,
  scale,
  label,
  indicators = [],
}) => {
  const [ind1, ind2] = indicators;

  return (
    <div className="fd-card-numeric-header">
      <div className="fd-card-numeric-header__top">
        {/* KPI value + scale */}
        <div className="fd-card-numeric-header__kpi-area">
          <div className="fd-card-numeric-header__kpi">
            <span className="fd-card-numeric-header__value">{value}</span>
            {scale && <span className="fd-card-numeric-header__scale">{scale}</span>}
          </div>
        </div>

        <div className="fd-card-numeric-header__spacer" />

        {/* Side indicators */}
        {(ind1 || ind2) && (
          <div className="fd-card-numeric-header__indicators">
            {ind1 && (
              <div className="fd-card-numeric-header__indicator">
                <span className="fd-card-numeric-header__indicator-label">{ind1.label}</span>
                <span
                  className={[
                    'fd-card-numeric-header__indicator-value',
                    ind1.state && ind1.state !== 'neutral'
                      ? `fd-card-numeric-header__indicator-value--${ind1.state}`
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {ind1.value}
                </span>
              </div>
            )}
            {ind2 && (
              <div className="fd-card-numeric-header__indicator">
                <span className="fd-card-numeric-header__indicator-label">{ind2.label}</span>
                <span
                  className={[
                    'fd-card-numeric-header__indicator-value',
                    ind2.state && ind2.state !== 'neutral'
                      ? `fd-card-numeric-header__indicator-value--${ind2.state}`
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {ind2.value}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom label */}
      {label && (
        <div className="fd-card-numeric-header__label">{label}</div>
      )}
    </div>
  );
};

export default CardNumericHeader;
