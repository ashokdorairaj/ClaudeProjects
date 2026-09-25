import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Token } from './MultiInput';
import { Icon } from '../../atoms/Icon';
import type { MultiInputValueState } from './MultiInput';
import './MultiInput.css';
import './MultiCombobox.css';

export interface MultiComboboxOption {
  key: string;
  label: string;
  selected?: boolean;
}

export interface MultiComboboxProps {
  options: MultiComboboxOption[];
  placeholder?: string;
  disabled?: boolean;
  formFactor?: 'cozy' | 'compact';
  valueState?: MultiInputValueState;
  /** Max selected tokens shown before "N more" link; 0 = show all */
  maxVisible?: number;
  /** Show a "Show all (N)" footer link in the dropdown */
  showAllFooter?: boolean;
  onShowAll?: () => void;
  onSelectionChange?: (selectedKeys: string[]) => void;
  className?: string;
}

export const MultiCombobox: React.FC<MultiComboboxProps> = ({
  options,
  placeholder,
  disabled = false,
  formFactor = 'cozy',
  valueState = 'None',
  maxVisible = 0,
  showAllFooter = false,
  onShowAll,
  onSelectionChange,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const [overflowExpanded, setOverflowExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedKeys = options.filter((o) => o.selected).map((o) => o.key);

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  const toggleOption = (key: string) => {
    const next = selectedKeys.includes(key)
      ? selectedKeys.filter((k) => k !== key)
      : [...selectedKeys, key];
    onSelectionChange?.(next);
  };

  const removeByKey = (key: string) => {
    onSelectionChange?.(selectedKeys.filter((k) => k !== key));
  };

  const MAX_V = maxVisible > 0 ? maxVisible : Infinity;
  const visibleSelected =
    overflowExpanded || selectedKeys.length <= MAX_V
      ? selectedKeys
      : selectedKeys.slice(0, MAX_V);
  const hiddenCount = Math.max(0, selectedKeys.length - (maxVisible > 0 ? maxVisible : selectedKeys.length));

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const stateClass = valueState !== 'None' ? `fd-multi-combobox--${valueState.toLowerCase()}` : '';

  const containerClasses = [
    'fd-multi-combobox',
    formFactor === 'compact' ? 'fd-multi-combobox--compact' : '',
    disabled ? 'fd-multi-combobox--disabled' : '',
    open ? 'fd-multi-combobox--open' : '',
    stateClass,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} ref={containerRef}>
      {/* ── Field ── */}
      <div
        className="fd-multi-combobox__field"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {/* Tokens */}
        {visibleSelected.map((key) => {
          const opt = options.find((o) => o.key === key);
          return opt ? (
            <Token
              key={key}
              text={opt.label}
              formFactor={formFactor}
              disabled={disabled}
              onRemove={() => removeByKey(key)}
            />
          ) : null;
        })}

        {/* N more overflow link */}
        {!overflowExpanded && hiddenCount > 0 && (
          <button
            type="button"
            className="fd-multi-combobox__overflow"
            onClick={(e) => { e.stopPropagation(); setOverflowExpanded(true); }}
          >
            {hiddenCount} more
          </button>
        )}

        {/* Text filter input */}
        <input
          ref={inputRef}
          type="text"
          className="fd-multi-combobox__input"
          value={inputValue}
          placeholder={selectedKeys.length === 0 ? placeholder : ''}
          disabled={disabled}
          aria-label={placeholder ?? 'Select options'}
          aria-autocomplete="list"
          aria-expanded={open}
          onChange={(e) => { setInputValue(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
            if (e.key === 'Backspace' && inputValue === '' && selectedKeys.length > 0)
              removeByKey(selectedKeys[selectedKeys.length - 1]);
          }}
        />

        {/* Trailing slim-arrow-down button */}
        <button
          type="button"
          className="fd-multi-combobox__arrow"
          tabIndex={-1}
          disabled={disabled}
          aria-label="Show options"
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); inputRef.current?.focus(); }}
        >
          <Icon name="slim-arrow-down" size={16} />
        </button>
      </div>

      {/* ── Dropdown ── */}
      {open && (
        <div className="fd-multi-combobox__dropdown" role="listbox" aria-multiselectable="true">
          <div className="fd-multi-combobox__list">
            {filteredOptions.length === 0 ? (
              <div className="fd-multi-combobox__no-data">No options</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedKeys.includes(opt.key);
                return (
                  <div
                    key={opt.key}
                    className={[
                      'fd-multi-combobox__item',
                      isSelected ? 'fd-multi-combobox__item--selected' : '',
                      formFactor === 'compact' ? 'fd-multi-combobox__item--compact' : '',
                    ].filter(Boolean).join(' ')}
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(e) => { e.preventDefault(); toggleOption(opt.key); }}
                  >
                    {/* Checkbox */}
                    <div className="fd-multi-combobox__checkbox-wrap">
                      <div
                        className={[
                          'fd-multi-combobox__checkbox',
                          isSelected ? 'fd-multi-combobox__checkbox--checked' : '',
                        ].filter(Boolean).join(' ')}
                        aria-hidden="true"
                      >
                        {isSelected && (
                          <svg viewBox="0 0 16 16" width="10" height="10" fill="none">
                            <path d="M3 8.5l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="fd-multi-combobox__item-text">{opt.label}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Show all footer */}
          {showAllFooter && (
            <div className="fd-multi-combobox__footer">
              <button
                type="button"
                className="fd-multi-combobox__show-all"
                onMouseDown={(e) => { e.preventDefault(); onShowAll?.(); setOpen(false); }}
              >
                Show all ({options.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiCombobox;
