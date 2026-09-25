import React from 'react';
import './Card.css';

export type CardBadgeColor = 'positive' | 'critical' | 'negative' | 'informative' | 'neutral';

export interface CardBadgeProps {
  text: string;
  color?: CardBadgeColor;
  icon?: React.ReactNode;
}

export const CardBadge: React.FC<CardBadgeProps> = ({
  text,
  color = 'neutral',
  icon,
}) => {
  const badgeClasses = [
    'fd-card-badge',
    `fd-card-badge--${color}`,
  ].join(' ');

  return (
    <span className={badgeClasses} aria-label={text}>
      {icon && (
        <span className="fd-card-badge__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="fd-card-badge__text">{text}</span>
    </span>
  );
};

export default CardBadge;
