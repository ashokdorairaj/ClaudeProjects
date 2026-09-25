import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '../../atoms/Icon';
import './MultiInput.css';

/* ──────────────────────────────────────────────────────
   Token sub-component
   ────────────────────────────────────────────────────── */
export interface TokenProps {
  text: string;
  onRemove?: () => void;
  disabled?: boolean;
  readOnly?: boolean;
  selected?: boolean;
  formFactor?: 'cozy' | 'compact';
}

export const Token: React.FC<TokenProps> = ({
  text,
  onRemove,
  disabled = false,
  readOnly = false,
  selected = false,
  formFactor = 'cozy',
}) => {
  const classes = [
    'fd-token',
    formFactor === 'compact' ? 'fd-token--compact' : '',
    disabled ? 'fd-token--disabled' : '',
    readOnly ? 'fd-token--readonly' : '',
    selected ? 'fd-token--selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const showRemove = onRemove && !disabled && !readOnly;

  return (
    <span className={classes} role="option" aria-selected={selected}>
      <span className="fd-token__text">{text}</span>
      {showRemove && (
        <button
          type="button"
          className="fd-token__close"
          onClick={(e) => {
            e.stopPropagation();
            onRemove!();
          }}
          aria-label={`Remove ${text}`}
          tabIndex={-1}
        >
          <Icon name="decline" size={12} />
        </button>
      )}
    </span>
  );
};

/* ──────────────────────────────────────────────────────
   MultiInput
   ────────────────────────────────────────────────────── */
export type MultiInputValueState =
  | 'None'
  | 'Positive'
  | 'Negative'
  | 'Critical'
  | 'Information';

export interface MultiInputProps {
  /** Token strings (controlled) */
  tokens?: string[];
  placeholder?: string;
  disabled?: boolean;
  /** Read-only: no input, no remove buttons, display-only mode */
  displayOnly?: boolean;
  formFactor?: 'cozy' | 'compact';
  valueState?: MultiInputValueState;
  /** Max tokens shown before "N more" link; 0 = show all */
  maxVisible?: number;
  /** Show a "Show all (N)" footer in the dropdown */
  showAllFooter?: boolean;
  onShowAll?: () => void;
  onTokenAdd?: (value: string) => void;
  /** Called with the token string to remove */
  onTokenRemove?: (token: string) => void;
  className?: string;
}

export const MultiInput: React.FC<MultiInputProps> = ({
  tokens = [],
  placeholder,
  disabled = false,
  displayOnly = false,
  formFactor = 'cozy',
  valueState = 'None',
  maxVisible = 0,
  showAllFooter = false,
  onShowAll,
  onTokenAdd,
  onTokenRemove,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const [overflowExpanded, setOverflowExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const MAX_V = maxVisible > 0 ? maxVisible : Infinity;
  const visibleTokens =
    overflowExpanded || tokens.length <= MAX_V
      ? tokens
      : tokens.slice(0, maxVisible > 0 ? maxVisible : tokens.length);
  const hiddenCount = maxVisible > 0 ? Math.max(0, tokens.length - maxVisible) : 0;

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
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      onTokenAdd?.(inputValue.trim());
      setInputValue('');
    }
    if (e.key === 'Backspace' && inputValue === '' && tokens.length > 0) {
      onTokenRemove?.(tokens[tokens.length - 1]);
    }
    if (e.key === 'Escape') setOpen(false);
  };

  const stateClass =
    valueState !== 'None' ? `fd-multi-input--${valueState.toLowerCase()}` : '';

  // Display-only mode: inline dot-separated text
  if (displayOnly) {
    const displayVisible = maxVisible > 0 ? tokens.slice(0, maxVisible) : tokens;
    const displayHidden = maxVisible > 0 ? Math.max(0, tokens.length - maxVisible) : 0;

    return (
      <span className={['fd-multi-input--display-only', className].filter(Boolean).join(' ')}>
        {displayVisible.map((t, i) => (
          <React.Fragment key={t}>
            {i > 0 && <span className="fd-multi-input__dot">·</span>}
            <span className="fd-multi-input__display-token">{t}</span>
          </React.Fragment>
        ))}
        {displayHidden > 0 && (
          <>
            <span className="fd-multi-input__dot">·</span>
            <button
              type="button"
              className="fd-multi-input__overflow-link"
              onClick={() => setOverflowExpanded(true)}
            >
              {displayHidden} more
            </button>
          </>
        )}
      </span>
    );
  }

  const containerClasses = [
    'fd-multi-input',
    formFactor === 'compact' ? 'fd-multi-input--compact' : '',
    disabled ? 'fd-multi-input--disabled' : '',
    open ? 'fd-multi-input--open' : '',
    stateClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses} ref={containerRef}>
      {/* ── Field ── */}
      <div
        className="fd-multi-input__field"
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {/* Visible tokens */}
        {visibleTokens.map((t) => (
          <Token
            key={t}
            text={t}
            disabled={disabled}
            formFactor={formFactor}
            onRemove={onTokenRemove ? () => onTokenRemove(t) : undefined}
          />
        ))}

        {/* N more overflow link */}
        {!overflowExpanded && hiddenCount > 0 && (
          <button
            type="button"
            className="fd-multi-input__overflow-link"
            onClick={(e) => { e.stopPropagation(); setOverflowExpanded(true); }}
          >
            {hiddenCount} more
          </button>
        )}

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          className="fd-multi-input__input"
          value={inputValue}
          placeholder={tokens.length === 0 ? placeholder : ''}
          disabled={disabled}
          aria-label={placeholder ?? 'Add token'}
          aria-autocomplete="list"
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setOpen(tokens.length > 0)}
          onKeyDown={handleKeyDown}
        />

        {/* Trailing value-help button */}
        <button
          type="button"
          className="fd-multi-input__value-help"
          tabIndex={-1}
          disabled={disabled}
          aria-label="Value help"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
            inputRef.current?.focus();
          }}
        >
          <Icon name="value-help" size={16} />
        </button>
      </div>

      {/* ── Dropdown: list of current tokens with remove buttons ── */}
      {open && tokens.length > 0 && (
        <div className="fd-multi-input__dropdown" role="listbox">
          <div className="fd-multi-input__dropdown-list">
            {tokens.map((t) => (
              <div
                key={t}
                className="fd-multi-input__dropdown-item"
                role="option"
                aria-selected="true"
              >
                <span className="fd-multi-input__dropdown-text">{t}</span>
                {onTokenRemove && (
                  <button
                    type="button"
                    className="fd-multi-input__dropdown-remove"
                    aria-label={`Remove ${t}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onTokenRemove(t);
                    }}
                  >
                    <Icon name="decline" size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {showAllFooter && (
            <div className="fd-multi-input__footer">
              <button
                type="button"
                className="fd-multi-input__show-all"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onShowAll?.();
                  setOpen(false);
                }}
              >
                Show all ({tokens.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiInput;
