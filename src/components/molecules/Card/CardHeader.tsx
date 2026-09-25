import React from 'react';
import './Card.css';

export interface CardHeaderProps {
  /** Primary title text */
  title: string;
  /** Secondary subtitle text */
  subtitle?: string;
  /** Avatar or icon placed to the left of the title block */
  avatar?: React.ReactNode;
  /** Action elements placed in the right action area (top slot) */
  actions?: React.ReactNode;
  /** Counter shown top-right, e.g. "6 of 12" — sits above actions */
  counter?: string;
  /** Timestamp string shown top-right, e.g. "2hrs ago" */
  timestamp?: string;
  /** Status text shown below the subtitle (e.g. "In Stock", "Overdue") */
  status?: string;
  /** Up to 3 Tag components shown below the subtitle */
  tags?: React.ReactNode[];
  /** Renders the header as a clickable/focusable element */
  interactive?: boolean;
  formFactor?: 'cozy' | 'compact';
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  avatar,
  actions,
  counter,
  timestamp,
  status,
  tags,
  interactive = false,
  formFactor = 'cozy',
  onClick,
}) => {
  const headerClasses = [
    'fd-card__header',
    'fd-card-header',
    interactive ? 'fd-card-header--interactive' : '',
    formFactor === 'compact' ? 'fd-card-header--compact' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const visibleTags = tags ? tags.slice(0, 3) : [];
  const hasActionArea = counter != null || timestamp != null || actions != null;

  return (
    <div
      className={headerClasses}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? title : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
              }
            }
          : undefined
      }
    >
      {avatar && <div className="fd-card__avatar fd-card-header__avatar">{avatar}</div>}

      {/* Text area — grows to fill available space */}
      <div className="fd-card__header-text fd-card-header__text">
        <div className="fd-card-header__title-row">
          <span className="fd-card__title fd-card-header__title">{title}</span>
        </div>

        {subtitle && (
          <div className="fd-card__subtitle fd-card-header__subtitle">{subtitle}</div>
        )}

        {status && (
          <div className="fd-card-header__status">{status}</div>
        )}

        {visibleTags.length > 0 && (
          <div className="fd-card-header__tags" aria-label="Tags">
            {visibleTags.map((tag, idx) => (
              <span key={idx} className="fd-card-header__tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right action area — counter/timestamp on top, then additional actions */}
      {hasActionArea && (
        <div className="fd-card__header-actions fd-card-header__actions">
          {(counter != null || timestamp != null) && (
            <span className="fd-card-header__counter">
              {counter ?? timestamp}
            </span>
          )}
          {actions && <div>{actions}</div>}
        </div>
      )}
    </div>
  );
};

export default CardHeader;
