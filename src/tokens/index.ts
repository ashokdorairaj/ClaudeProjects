// SAP Fiori Design Tokens – TypeScript constants
// Mirrors tokens.css for use in CSS-in-JS or inline styles

export const tokens = {
  // Brand
  brandColor: '#0070f2',
  highlightColor: '#0064d9',
  baseColor: '#ffffff',

  // Text
  textColor: '#131e29',
  titleColor: '#131e29',
  labelColor: '#556b82',
  markerTextColor: '#046c77',
  contrastTextColor: '#ffffff',
  disabledTextColor: 'rgba(19,30,41,0.6)',

  // Spacing
  spacingTiny: '8px',
  spacingSmall: '16px',
  spacingMedium: '32px',
  spacingLarge: '48px',

  // Border Radius
  groupBorderRadius: '12px',
  popoverBorderRadius: '8px',
  elementBorderRadius: '12px',

  // Sizing (Cozy)
  elementLineHeight: '44px',
  elementHeight: '36px',
  // Compact
  elementCompactLineHeight: '32px',
  elementCompactHeight: '26px',

  // Shadows
  shadowSm: '0 1px 3px rgba(0,0,0,0.08)',
  shadowMd: '0 2px 8px rgba(0,0,0,0.1)',
  shadowLg: '0 4px 16px rgba(0,0,0,0.12)',

  // Font
  fontFamily: '"72","72full",Arial,Helvetica,sans-serif',
  fontSizeXs: '0.75rem',
  fontSizeSm: '0.875rem',
  fontSizeMd: '1rem',
  fontSizeLg: '1.125rem',
  fontSizeXl: '1.25rem',
  fontSize2xl: '1.5rem',
  fontSize3xl: '2rem',
  fontWeightNormal: 400,
  fontWeightSemibold: 600,
  fontWeightBold: 700,
} as const;

export type Theme = 'morning' | 'evening' | 'hcw' | 'hcb';
export type FormFactor = 'cozy' | 'compact';
export type ValueState = 'None' | 'Positive' | 'Negative' | 'Critical' | 'Information';
export type ButtonDesign =
  | 'Default'
  | 'Emphasized'
  | 'Positive'
  | 'Negative'
  | 'Attention'
  | 'Transparent'
  | 'Critical'
  | 'Success'
  | 'Neutral'
  | 'Information';
