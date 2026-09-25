import React from 'react';
import { SP } from '../constants';

interface KpiTileProps {
  label: string;
  value: string | number;
  sub?: string;
  subColor?: string;
  minWidth?: number;
}

const KpiTile: React.FC<KpiTileProps> = ({ label, value, sub, subColor, minWidth = 140 }) => (
  <div style={{
    background: 'var(--sapTile_Background)',
    borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)',
    boxShadow: 'var(--sapContent_Shadow0)',
    paddingTop: SP.m,
    paddingBottom: SP.m,
    paddingLeft: SP.m,
    paddingRight: SP.m,
    minWidth,
    flex: 1,
  }}>
    <span style={{ display: 'block', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', fontFamily: 'var(--sapFontFamily)', marginBottom: SP.xs }}>
      {label}
    </span>
    <span style={{ display: 'block', fontSize: 'var(--sapFontHeader2Size)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', fontFamily: 'var(--sapFontFamily)', marginBottom: sub ? SP.xs : 0 }}>
      {value}
    </span>
    {sub && (
      <span style={{ display: 'block', fontSize: 'var(--sapFontSmallSize)', color: subColor ?? 'var(--sapPositiveColor)', fontFamily: 'var(--sapFontFamily)' }}>
        {sub}
      </span>
    )}
  </div>
);

export default KpiTile;
