import React from 'react';
import { SP } from '../constants';

interface MetricBadgeProps {
  label: string;
  value: number | string;
  highlight?: boolean;
}

const MetricBadge: React.FC<MetricBadgeProps> = ({ label, value, highlight }) => (
  <div style={{
    background: highlight ? 'var(--sapSuccessBackground, #f5fae5)' : 'var(--sapTile_Background)',
    border: `1px solid ${highlight ? 'var(--sapPositiveColor)' : 'var(--sapList_BorderColor)'}`,
    borderRadius: 'var(--sapElement_BorderCornerRadius, 0.5rem)',
    paddingTop: SP.s,
    paddingBottom: SP.s,
    paddingLeft: SP.m,
    paddingRight: SP.m,
    textAlign: 'center',
    minWidth: 80,
  }}>
    <span style={{ display: 'block', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', fontFamily: 'var(--sapFontFamily)', marginBottom: SP.xs }}>
      {label}
    </span>
    <span style={{ display: 'block', fontSize: 'var(--sapFontLargeSize)', fontWeight: 'var(--sapFontBoldWeight)', color: highlight ? 'var(--sapPositiveColor)' : 'var(--sapTextColor)', fontFamily: 'var(--sapFontFamily)' }}>
      {typeof value === 'number' ? (value < 1 ? (value * 100).toFixed(1) + '%' : value.toFixed(4)) : value}
    </span>
  </div>
);

export default MetricBadge;
