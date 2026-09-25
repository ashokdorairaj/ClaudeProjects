import React from 'react';
import './Text.css';

export type TextVariant = 'body' | 'caption' | 'label' | 'title' | 'h1' | 'h2' | 'h3' | 'h4';

export interface TextProps {
  children: React.ReactNode;
  /** Visual variant – controls font size, weight and colour */
  variant?: TextVariant;
  /** When false, text is truncated with ellipsis instead of wrapping (default: true) */
  wrapping?: boolean;
  /** When true, text is user-selectable (default: false) */
  selectable?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/** Map variant → semantic HTML element */
const tagMap: Record<TextVariant, keyof React.JSX.IntrinsicElements> = {
  body: 'p',
  caption: 'p',
  label: 'p',
  title: 'p',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
};

export const Text: React.FC<TextProps> = ({
  children,
  variant = 'body',
  wrapping = true,
  selectable = false,
  className = '',
  style,
}) => {
  const Tag = tagMap[variant];

  const classes = [
    'fd-text',
    `fd-text--${variant}`,
    !wrapping ? 'fd-text--nowrap' : '',
    selectable ? 'fd-text--selectable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={classes} style={style}>
      {children}
    </Tag>
  );
};

export default Text;
