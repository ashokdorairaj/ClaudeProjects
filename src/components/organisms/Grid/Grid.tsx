import React from 'react';
import './Grid.css';

export type GridCols = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/**
 * Responsive 12-column CSS grid layout matching the SAP Fiori Responsive Grid.
 * Pair with `GridCell` to control per-cell column spans at each breakpoint.
 *
 * @see src/pages/docs/grid.md
 *
 * @constraints
 * - Default breakpoint columns: S=4, M=8, L=12, XL=12. Only override when the design explicitly specifies different column counts.
 * - `type="application"` adds larger horizontal margins to accommodate a fixed-width `SideNavigation`; use `"home"` for full-bleed landing pages.
 * - `GridCell` spans default to the full breakpoint column count when omitted — always specify `spanL` / `spanXL` for non-full-width cells.
 * - Do not use `Grid` inside a `Form` — use `Form`'s built-in `columnsL` / `columnsM` props instead.
 *
 * @example
 * <Grid type="application">
 *   <GridCell spanL={8} spanM={8}><Panel title="Details">…</Panel></GridCell>
 *   <GridCell spanL={4} spanM={8}><Card header="Summary">…</Card></GridCell>
 * </Grid>
 */
export interface GridProps {
  /** Number of columns at each breakpoint. Defaults: S=4, M=8, L=12, XL=12 */
  colsS?: GridCols;
  colsM?: GridCols;
  colsL?: GridCols;
  colsXL?: GridCols;
  /**
   * Gutter (gap) between cells. Defaults to 16px.
   * Pass a CSS value like '16px' or '1rem'.
   */
  gap?: string;
  /**
   * Type of page the grid is used in.
   * 'home' adds 16px side margin; 'application' adds 48px side margin (room for side nav).
   * Default: 'home'
   */
  type?: 'home' | 'application';
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export interface GridCellProps {
  /** Column span at each breakpoint (1–12). Default: full width for the breakpoint cols. */
  spanS?: GridCols;
  spanM?: GridCols;
  spanL?: GridCols;
  spanXL?: GridCols;
  /** Column offset (number of columns to skip) at each breakpoint (0–11). */
  offsetS?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
  offsetM?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
  offsetL?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
  offsetXL?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const GridCell: React.FC<GridCellProps> = ({
  spanS,
  spanM,
  spanL,
  spanXL,
  offsetS,
  offsetM,
  offsetL,
  offsetXL,
  children,
  className = '',
  style,
}) => {
  const cssVars: React.CSSProperties = {
    ...(spanS !== undefined ? { '--fd-grid-cell-span-s': spanS } as React.CSSProperties : {}),
    ...(spanM !== undefined ? { '--fd-grid-cell-span-m': spanM } as React.CSSProperties : {}),
    ...(spanL !== undefined ? { '--fd-grid-cell-span-l': spanL } as React.CSSProperties : {}),
    ...(spanXL !== undefined ? { '--fd-grid-cell-span-xl': spanXL } as React.CSSProperties : {}),
    ...style,
  };

  const bpClasses = [
    spanS !== undefined ? `fd-grid__cell--span-s-${spanS}` : '',
    spanM !== undefined ? `fd-grid__cell--span-m-${spanM}` : '',
    spanL !== undefined ? `fd-grid__cell--span-l-${spanL}` : '',
    spanXL !== undefined ? `fd-grid__cell--span-xl-${spanXL}` : '',
    offsetS !== undefined ? `fd-grid__cell--offset-s-${offsetS}` : '',
    offsetM !== undefined ? `fd-grid__cell--offset-m-${offsetM}` : '',
    offsetL !== undefined ? `fd-grid__cell--offset-l-${offsetL}` : '',
    offsetXL !== undefined ? `fd-grid__cell--offset-xl-${offsetXL}` : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={`fd-grid__cell ${bpClasses} ${className}`.trim()}
      style={Object.keys(cssVars).length ? cssVars : style}
    >
      {children}
    </div>
  );
};

export const Grid: React.FC<GridProps> = ({
  colsS,
  colsM,
  colsL,
  colsXL,
  gap,
  type = 'home',
  children,
  className = '',
  style,
}) => {
  const cssVars: React.CSSProperties = {
    ...(colsS !== undefined ? { '--fd-grid-cols-s': colsS } as React.CSSProperties : {}),
    ...(colsM !== undefined ? { '--fd-grid-cols-m': colsM } as React.CSSProperties : {}),
    ...(colsL !== undefined ? { '--fd-grid-cols-l': colsL } as React.CSSProperties : {}),
    ...(colsXL !== undefined ? { '--fd-grid-cols-xl': colsXL } as React.CSSProperties : {}),
    ...(gap !== undefined ? { '--fd-grid-gap': gap } as React.CSSProperties : {}),
    ...style,
  };

  return (
    <div
      className={`fd-grid fd-grid--${type} ${className}`.trim()}
      style={Object.keys(cssVars).length ? cssVars : style}
    >
      {children}
    </div>
  );
};
