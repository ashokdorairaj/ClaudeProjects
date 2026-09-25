import React from 'react';
import './Card.css';

export type CardBannerType = 'informative' | 'critical' | 'positive' | 'negative';

export interface CardBannerProps {
  title: string;
  text?: string;
  type?: CardBannerType;
}

export const CardBanner: React.FC<CardBannerProps> = ({
  title,
  text,
  type = 'informative',
}) => {
  const bannerClasses = [
    'fd-card-banner',
    `fd-card-banner--${type}`,
  ].join(' ');

  // Map type to a readable role label for assistive tech
  const roleMap: Record<CardBannerType, string> = {
    informative: 'status',
    critical: 'alert',
    positive: 'status',
    negative: 'alert',
  };

  return (
    <div className={bannerClasses} role={roleMap[type]} aria-live={type === 'critical' || type === 'negative' ? 'assertive' : 'polite'}>
      <span className="fd-card-banner__title">{title}</span>
      {text && <span className="fd-card-banner__text">{text}</span>}
    </div>
  );
};

export default CardBanner;
