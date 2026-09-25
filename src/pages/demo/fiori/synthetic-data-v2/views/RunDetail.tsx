// @ts-nocheck
import React from 'react';
import { Title, Text, Button, ObjectStatus, Tag, Icon, MessageStrip } from '@ui5/webcomponents-react';
import { SP, APPROACH_CATALOG, SEED_FEATURE_SETS } from '../constants';
import type { SyntheticView, RunRecord, Experiment, DatasetRecord } from '../types';

interface Props {
  nav: (v: SyntheticView) => void;
  run: RunRecord | null;
  experiment: Experiment | null;
  dataset: DatasetRecord | null;
  onClose: () => void;
}

const METRIC_LABELS: Record<string, string> = {
  accuracy: 'Accuracy', precision: 'Precision', recall: 'Recall',
  f1: 'F1 Score', auc: 'ROC AUC', mae: 'MAE', rmse: 'RMSE', r2: 'R²',
};

export default function RunDetail({ nav, run, experiment, dataset, onClose }: Props) {
  if (!run) {
    return (
      <div style={{ padding: SP.m, textAlign: 'center' }}>
        <Text style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)' }}>No run selected.</Text>
        <Button design="Transparent" onClick={onClose} style={{ marginTop: SP.m }}>← Back</Button>
      </div>
    );
  }

  const approach = APPROACH_CATALOG?.find(a => a.id === run.approachId);
  const featureSet = SEED_FEATURE_SETS?.find(f => f.id === run.featureSetId);

  const lineageItems = [
    { label: 'Experiment Pack', value: experiment ? `Collections & Disputes ${experiment.packVersion}` : 'Collections & Disputes v1.0', action: () => nav('packDetail') },
    { label: 'Dataset', value: dataset?.name || run.datasetId, action: () => nav('datasetDetail') },
    { label: 'Experiment', value: experiment?.name || run.experimentId, action: () => nav('experimentWorkspace') },
    { label: 'Feature Set', value: featureSet ? `${featureSet.name} ${featureSet.version}` : run.featureSetId, action: null },
    { label: 'Approach', value: approach?.name || run.approachId, action: null },
    { label: 'This Run', value: run.id.slice(-6).toUpperCase(), action: null },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: `${SP.m} ${SP.m} ${SP.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', background: 'var(--sapObjectHeader_Background)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: SP.s, marginBottom: SP.xs }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sapBrandColor)', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)' }}>← Runs</button>
          <span style={{ color: 'var(--sapContent_LabelColor)' }}>/</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: SP.s, marginBottom: 4 }}>
              <Title level="H4" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>Run {run.id.slice(-6).toUpperCase()}</Title>
              <ObjectStatus state={run.status === 'Completed' ? 'Positive' : run.status === 'Failed' ? 'Negative' : 'Information'}>{run.status}</ObjectStatus>
              <ObjectStatus state={run.isReal ? 'Positive' : 'Information'}>{run.approachLabel}</ObjectStatus>
            </div>
            <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block' }}>
              {approach?.name || run.approachId} · {featureSet?.name || run.featureSetId} · {dataset?.name || run.datasetId} · {run.createdAt.slice(0, 16).replace('T', ' ')}
            </Text>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: SP.m }}>
        <div style={{ maxWidth: 900, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SP.m }}>

          {/* Metrics */}
          <div style={{ padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)' }}>
            <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: SP.s }}>Performance Metrics</span>
            {Object.entries(run.metrics).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4, paddingBottom: 4, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{METRIC_LABELS[k] || k}</span>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: k === 'f1' || k === 'auc' ? 'var(--sapPositiveColor)' : 'var(--sapTextColor)' }}>{(v as number).toFixed(3)}</span>
              </div>
            ))}
          </div>

          {/* Configuration */}
          <div style={{ padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)' }}>
            <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: SP.s }}>Run Configuration</span>
            {[
              ['Experiment', experiment?.name || run.experimentId],
              ['Dataset', dataset?.name || run.datasetId],
              ['Feature Set', featureSet ? `${featureSet.name} ${featureSet.version}` : run.featureSetId],
              ['Approach', approach?.name || run.approachId],
              ['Type', run.approachLabel],
              ['Runtime', run.runtime],
              ['Seed', String(run.seed)],
              ['Created', run.createdAt.slice(0, 16).replace('T', ' ')],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: SP.s, paddingTop: 4, paddingBottom: 4, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', minWidth: 100 }}>{k}</span>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Parameters */}
          {Object.keys(run.parameters).length > 0 && (
            <div style={{ padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)' }}>
              <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: SP.s }}>Model Parameters</span>
              {Object.entries(run.parameters).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4, paddingBottom: 4, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{k}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{String(v)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Feature Set detail */}
          {featureSet && (
            <div style={{ padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)' }}>
              <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: SP.s }}>Feature Set: {featureSet.name} {featureSet.version}</span>
              <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginBottom: SP.s }}>{featureSet.description}</Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: SP.xs }}>
                {featureSet.fields.map(f => <Tag key={f} design="Set2" colorScheme="5">{f}</Tag>)}
              </div>
            </div>
          )}
        </div>

        {/* Lineage */}
        <div style={{ marginTop: SP.m, maxWidth: 900, padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)' }}>
          <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: SP.m }}>Full Lineage</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: SP.xs, flexWrap: 'wrap' }}>
            {lineageItems.map((item, i) => (
              <React.Fragment key={item.label}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: '0.7rem', color: 'var(--sapContent_LabelColor)', marginBottom: 2 }}>{item.label}</span>
                  {item.action ? (
                    <span onClick={item.action} style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapBrandColor)', cursor: 'pointer', textDecoration: 'underline' }}>{item.value}</span>
                  ) : (
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: i === lineageItems.length - 1 ? 'var(--sapFontBoldWeight)' : 'normal', color: 'var(--sapTextColor)' }}>{item.value}</span>
                  )}
                </div>
                {i < lineageItems.length - 1 && <Icon name="navigation-right-arrow" style={{ width: '0.875rem', height: '0.875rem', color: 'var(--sapBrandColor)', flexShrink: 0 }} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {!run.isReal && (
          <MessageStrip design="Warning" hideCloseButton style={{ marginTop: SP.m, maxWidth: 900 }}>
            {run.approachLabel === 'DEMO ADAPTER' ? 'RPT Demo Adapter — results are simulated. Live SAP-RPT integration not connected.' : 'Demo model — metrics are illustrative, not from live training.'}
          </MessageStrip>
        )}
      </div>
    </div>
  );
}
