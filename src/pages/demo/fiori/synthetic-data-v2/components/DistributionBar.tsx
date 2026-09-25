import React from 'react';
import { ProgressIndicator } from '@ui5/webcomponents-react';
import { SP } from '../constants';

interface DistributionBarProps {
  label: string;
  target: number;   // 0–1
  actual: number;   // 0–1
}

const DistributionBar: React.FC<DistributionBarProps> = ({ label, target, actual }) => {
  const delta = Math.abs(actual - target);
  const state = delta <= 0.03 ? 'Positive' : delta <= 0.07 ? 'Critical' : 'Negative';

  return (
    <div style={{ marginBottom: SP.m }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: SP.xs }}>
        <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>
          Target: {(target * 100).toFixed(1)}% | Actual: {(actual * 100).toFixed(1)}%
        </span>
      </div>
      <div style={{ display: 'flex', gap: SP.s, alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', minWidth: 48 }}>Target</span>
        <ProgressIndicator value={Math.round(target * 100)} displayValue={`${(target * 100).toFixed(1)}%`} state="Information" style={{ flex: 1 }} />
      </div>
      <div style={{ display: 'flex', gap: SP.s, alignItems: 'center', marginTop: SP.xs }}>
        <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', minWidth: 48 }}>Actual</span>
        <ProgressIndicator value={Math.round(actual * 100)} displayValue={`${(actual * 100).toFixed(1)}%`} state={state} style={{ flex: 1 }} />
      </div>
    </div>
  );
};

export default DistributionBar;
