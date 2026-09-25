import React from 'react';
import type { FormFactor } from '../../../tokens';
import './SegmentedButton.css';

export interface SegmentedButtonItem {
  key: string;
  label?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedButtonProps {
  items: SegmentedButtonItem[];
  selectedKey?: string;
  formFactor?: FormFactor;
  onChange?: (key: string) => void;
  className?: string;
}

export const SegmentedButton: React.FC<SegmentedButtonProps> = ({
  items,
  selectedKey,
  formFactor = 'cozy',
  onChange,
  className = '',
}) => {
  const wrapperClasses = [
    'fd-segmented-button',
    formFactor === 'compact' ? 'fd-segmented-button--compact' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={wrapperClasses}
      role="group"
      aria-label="Segmented button group"
    >
      {items.map((item, idx) => {
        const isSelected = item.key === selectedKey;
        const isFirst = idx === 0;
        const isLast = idx === items.length - 1;

        const itemClasses = [
          'fd-segmented-button__item',
          isSelected ? 'fd-segmented-button__item--selected' : '',
          item.disabled ? 'fd-segmented-button__item--disabled' : '',
          isFirst ? 'fd-segmented-button__item--first' : '',
          isLast ? 'fd-segmented-button__item--last' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={item.key}
            type="button"
            className={itemClasses}
            disabled={item.disabled}
            aria-pressed={isSelected}
            aria-label={!item.label && item.icon ? item.key : undefined}
            onClick={() => {
              if (!item.disabled) {
                onChange?.(item.key);
              }
            }}
          >
            {item.icon && (
              <span className="fd-segmented-button__icon">{item.icon}</span>
            )}
            {item.label && (
              <span className="fd-segmented-button__text">{item.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedButton;
