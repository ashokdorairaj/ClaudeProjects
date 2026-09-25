import React, { useState, useRef, useCallback } from 'react';
import './Carousel.css';

export type CarouselIndicatorPosition = 'bottom' | 'top' | 'none';
export type CarouselButtonsPosition = 'on-bar' | 'on-image';
export type CarouselIndicatorType = 'dots' | 'numbers' | 'hidden';

export interface CarouselProps {
  children: React.ReactNode[];
  itemsVisible?: number;
  indicatorPosition?: CarouselIndicatorPosition;
  buttonsPosition?: CarouselButtonsPosition;
  indicatorType?: CarouselIndicatorType;
  loop?: boolean;
  onPageChange?: (page: number) => void;
  className?: string;
}

const SlimArrowLeft: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SlimArrowRight: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Carousel: React.FC<CarouselProps> = ({
  children,
  itemsVisible = 1,
  indicatorPosition = 'bottom',
  buttonsPosition = 'on-bar',
  indicatorType = 'dots',
  loop = true,
  onPageChange,
  className = '',
}) => {
  const clamped = Math.min(5, Math.max(1, itemsVisible));
  const totalSlides = children.length;
  const pageCount = Math.ceil(totalSlides / clamped);
  const [page, setPage] = useState(0);

  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const goTo = useCallback(
    (nextPage: number) => {
      let p = nextPage;
      if (loop) {
        p = ((p % pageCount) + pageCount) % pageCount;
      } else {
        p = Math.max(0, Math.min(pageCount - 1, p));
      }
      setPage(p);
      onPageChange?.(p);
    },
    [loop, pageCount, onPageChange],
  );

  const prev = () => goTo(page - 1);
  const next = () => goTo(page + 1);

  const canPrev = loop || page > 0;
  const canNext = loop || page < pageCount - 1;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const delta = touchStartX.current - touchEndX.current;
    if (Math.abs(delta) > 50) {
      delta > 0 ? next() : prev();
    }
  };

  const navPrev = (
    <button
      className="fd-carousel__btn fd-carousel__btn--prev"
      onClick={prev}
      disabled={!canPrev}
      aria-label="Previous"
      type="button"
    >
      <SlimArrowLeft />
    </button>
  );

  const navNext = (
    <button
      className="fd-carousel__btn fd-carousel__btn--next"
      onClick={next}
      disabled={!canNext}
      aria-label="Next"
      type="button"
    >
      <SlimArrowRight />
    </button>
  );

  /* ── Indicator content ── */
  const indicatorContent = indicatorType === 'dots' ? (
    <div className="fd-carousel__dots">
      {Array.from({ length: pageCount }).map((_, i) => (
        <button
          key={i}
          className="fd-carousel__dot-wrap"
          onClick={() => goTo(i)}
          aria-label={`Go to page ${i + 1}`}
          aria-current={i === page ? 'true' : undefined}
          type="button"
        >
          <span className={`fd-carousel__dot${i === page ? ' fd-carousel__dot--active' : ''}`} />
        </button>
      ))}
    </div>
  ) : indicatorType === 'numbers' ? (
    <span className="fd-carousel__page-indicator">{page + 1} of {pageCount}</span>
  ) : null;

  /* ── Indicator bar ── */
  const indicatorBar = indicatorPosition !== 'none' && (
    <div className={`fd-carousel__bar${indicatorPosition === 'top' ? ' fd-carousel__bar--top' : ''}`}>
      {buttonsPosition === 'on-bar' && navPrev}
      {indicatorContent}
      {buttonsPosition === 'on-bar' && navNext}
    </div>
  );

  const rootClasses = [
    'fd-carousel',
    buttonsPosition === 'on-image' ? 'fd-carousel--on-image' : '',
    className,
  ].filter(Boolean).join(' ');

  const translatePct = -(page * 100);

  return (
    <div className={rootClasses}>
      {indicatorPosition === 'top' && indicatorBar}
      <div
        className="fd-carousel__viewport"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="fd-carousel__track"
          style={{ transform: `translateX(${translatePct}%)` }}
        >
          {Array.from({ length: pageCount }).map((_, pageIdx) => (
            <div
              key={pageIdx}
              className="fd-carousel__page"
              style={{ minWidth: '100%' }}
            >
              {children.slice(pageIdx * clamped, pageIdx * clamped + clamped).map((child, ci) => (
                <div
                  key={ci}
                  className="fd-carousel__slide"
                  style={{ flex: `0 0 ${100 / clamped}%`, maxWidth: `${100 / clamped}%` }}
                >
                  {child}
                </div>
              ))}
            </div>
          ))}
        </div>
        {buttonsPosition === 'on-image' && navPrev}
        {buttonsPosition === 'on-image' && navNext}
      </div>
      {indicatorPosition !== 'top' && indicatorBar}
    </div>
  );
};

export default Carousel;
