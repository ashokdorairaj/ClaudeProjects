import React from 'react';
import type { FormFactor } from '../../../tokens';
import './Card.css';

/**
 * Content container grouping related information with optional header, media, and footer areas.
 *
 * @see src/pages/docs/card.md
 *
 * @constraints
 * - Use `interactive=true` only when the entire card is a single navigable target. For multiple actions, place `Button` elements in the header or footer instead.
 * - `loading=true` replaces body content with a skeleton — do not render partial data alongside it.
 * - `mediaImage` spans the full card width above the header; use for product/entity imagery only.
 * - Do not nest Cards inside Cards.
 *
 * @example
 * <Card
 *   header="Order #1001"
 *   subheader="Processing"
 *   headerActions={<Button design="Transparent" icon="action-settings" iconOnly />}
 *   footer={<Button design="Transparent">View Details</Button>}
 * >
 *   <Text>Estimated delivery: Apr 15</Text>
 * </Card>
 */
export interface CardProps {
  header?: React.ReactNode;
  subheader?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  /** Interactive – clickable card */
  interactive?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  formFactor?: FormFactor;
  /** Loading skeleton state */
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** Avatar/image in header */
  avatar?: React.ReactNode;
  /** Actions in header right side */
  headerActions?: React.ReactNode;
  /** Media block — image URL shown at the very top of the card */
  mediaImage?: string;
  /** Alt text for media image */
  mediaImageAlt?: string;
  /** Badge(s) shown as overlay at the top edge of the card */
  badges?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  header,
  subheader,
  footer,
  children,
  interactive = false,
  onClick,
  formFactor = 'cozy',
  loading = false,
  className = '',
  style,
  avatar,
  headerActions,
  mediaImage,
  mediaImageAlt = '',
  badges,
}) => {
  const classes = [
    'fd-card',
    interactive ? 'fd-card--interactive' : '',
    loading ? 'fd-card--loading' : '',
    formFactor === 'compact' ? 'fd-card--compact' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      style={style}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {/* Badge overlay sits at the top edge */}
      {badges && <div className="fd-card__badge-overlay">{badges}</div>}

      {/* Optional media block — image spanning full width at top */}
      {mediaImage && (
        <div className="fd-card-media">
          <img className="fd-card-media__image" src={mediaImage} alt={mediaImageAlt} />
        </div>
      )}

      {(header || avatar || headerActions) && (
        <div className="fd-card__header">
          {avatar && <div className="fd-card__avatar">{avatar}</div>}
          <div className="fd-card__header-text">
            {header && <div className="fd-card__title">{header}</div>}
            {subheader && <div className="fd-card__subtitle">{subheader}</div>}
          </div>
          {headerActions && <div className="fd-card__header-actions">{headerActions}</div>}
        </div>
      )}
      {children && (
        <div className="fd-card__content">
          {loading ? (
            <div className="fd-card__skeleton">
              <div className="fd-card__skeleton-line fd-card__skeleton-line--full" />
              <div className="fd-card__skeleton-line fd-card__skeleton-line--wide" />
              <div className="fd-card__skeleton-line fd-card__skeleton-line--medium" />
            </div>
          ) : (
            children
          )}
        </div>
      )}
      {footer && <div className="fd-card__footer">{footer}</div>}
    </div>
  );
};

export default Card;
