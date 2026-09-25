import React from 'react';

export interface IconProps {
  /** SAP icon name without the .svg extension, e.g. "search", "add", "delete" */
  name: string;
  /** Size in pixels — defaults to 16 */
  size?: number | string;
  /** Accessible label. If omitted the icon is treated as decorative (aria-hidden) */
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders an SAP Fiori icon from /public/icons/{name}.svg.
 * All icons come from the SAP Icons v6.01 pack.
 * The SVGs use `currentColor` so they inherit the surrounding text color.
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 16,
  ariaLabel,
  className,
  style,
}) => {
  const px = typeof size === 'number' ? `${size}px` : size;

  return (
    <img
      src={`/icons/${name}.svg`}
      alt={ariaLabel ?? ''}
      aria-hidden={ariaLabel ? undefined : true}
      width={px}
      height={px}
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style,
      }}
    />
  );
};

export default Icon;
