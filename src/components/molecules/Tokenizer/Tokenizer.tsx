import React, { useRef } from 'react';
import { Token } from '../MultiInput';
import './Tokenizer.css';

export interface TokenizerToken {
  key: string;
  text: string;
  selected?: boolean;
}

export interface TokenizerProps {
  /** Array of token objects */
  tokens: TokenizerToken[];
  /** Allow wrapping to multiple lines (default: single-line) */
  multiline?: boolean;
  /** Show an input field after the tokens */
  showInput?: boolean;
  /** Placeholder for the embedded input */
  inputPlaceholder?: string;
  /** Current input value (controlled) */
  inputValue?: string;
  /** Called when the input value changes */
  onInputChange?: (value: string) => void;
  /** Called when Enter pressed or token confirmed */
  onInputConfirm?: (value: string) => void;
  /** Called when a token's × is clicked */
  onTokenRemove?: (key: string) => void;
  /** Max tokens shown before "N more" overflow link; 0 = show all */
  maxVisible?: number;
  /** Whether expanded (controlled) */
  expanded?: boolean;
  /** Called when overflow link clicked */
  onExpandToggle?: () => void;
  /** Cozy (36px) or compact (26px) */
  formFactor?: 'cozy' | 'compact';
  /** Disable interaction */
  disabled?: boolean;
  /** Read-only: tokens shown but not removable */
  readOnly?: boolean;
  className?: string;
}

export const Tokenizer: React.FC<TokenizerProps> = ({
  tokens,
  multiline = false,
  showInput = false,
  inputPlaceholder = '',
  inputValue = '',
  onInputChange,
  onInputConfirm,
  onTokenRemove,
  maxVisible = 0,
  expanded = false,
  onExpandToggle,
  formFactor = 'cozy',
  disabled = false,
  readOnly = false,
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const showAll = maxVisible === 0 || expanded;
  const visibleTokens = showAll ? tokens : tokens.slice(0, maxVisible);
  const hiddenCount = showAll ? 0 : tokens.length - visibleTokens.length;

  const wrapperClasses = [
    'fd-tokenizer',
    showInput ? 'fd-tokenizer--with-input' : '',
    multiline ? 'fd-tokenizer--multiline' : 'fd-tokenizer--singleline',
    formFactor === 'compact' ? 'fd-tokenizer--compact' : '',
    disabled ? 'fd-tokenizer--disabled' : '',
    readOnly ? 'fd-tokenizer--readonly' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      onInputConfirm?.(inputValue.trim());
    }
    if (e.key === 'Backspace' && inputValue === '' && tokens.length > 0 && onTokenRemove) {
      onTokenRemove(tokens[tokens.length - 1].key);
    }
  };

  return (
    <div
      className={wrapperClasses}
      onClick={() => !disabled && showInput && inputRef.current?.focus()}
    >
      <div className="fd-tokenizer__inner">
        {/* Tokens */}
        {visibleTokens.map((token) => (
          <Token
            key={token.key}
            text={token.text}
            selected={token.selected}
            formFactor={formFactor}
            disabled={disabled}
            readOnly={readOnly}
            onRemove={
              onTokenRemove && !readOnly && !disabled
                ? () => onTokenRemove(token.key)
                : undefined
            }
          />
        ))}

        {/* Overflow link: "N more" */}
        {hiddenCount > 0 && (
          <button
            type="button"
            className="fd-tokenizer__overflow"
            onClick={(e) => {
              e.stopPropagation();
              onExpandToggle?.();
            }}
            aria-expanded={false}
          >
            {hiddenCount} more
          </button>
        )}

        {/* Show less link when expanded */}
        {expanded && hiddenCount === 0 && maxVisible > 0 && onExpandToggle && (
          <button
            type="button"
            className="fd-tokenizer__overflow"
            onClick={(e) => {
              e.stopPropagation();
              onExpandToggle();
            }}
            aria-expanded={true}
          >
            Show less
          </button>
        )}

        {/* Embedded input */}
        {showInput && (
          <input
            ref={inputRef}
            type="text"
            className="fd-tokenizer__input"
            value={inputValue}
            placeholder={tokens.length === 0 ? inputPlaceholder : ''}
            disabled={disabled}
            readOnly={readOnly}
            aria-label={inputPlaceholder || 'Add token'}
            onChange={(e) => onInputChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        )}
      </div>
    </div>
  );
};

export default Tokenizer;
