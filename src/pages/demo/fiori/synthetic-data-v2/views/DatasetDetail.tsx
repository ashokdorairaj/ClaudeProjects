// @ts-nocheck
import React, { useState } from 'react';
import {
  Title, Text, Button, ObjectStatus, Tag, Icon, MessageStrip,
  ProgressIndicator,
} from '@ui5/webcomponents-react';
import { SP } from '../constants';
import type { SyntheticView, DatasetRecord, GeneratedDataset, QualityCheck, Experiment, RunRecord } from '../types';

interface Props {
  nav: (v: SyntheticView) => void;
  dataset: DatasetRecord | null;
  generatedDataset: GeneratedDataset | null;
  qualityChecks: QualityCheck[];
  experiments: Experiment[];
  runs: RunRecord[];
  onClose: () => void;
}

const TABS = ['Overview', 'Preview', 'Schema', 'Quality', 'Configuration', 'Lineage'];

const QS_STATE: Record<string, 'Positive' | 'Information' | 'Critical' | 'None'> = {
  'Ready for Early ML Experimentation': 'Information',
  'Ready for Prototyping': 'Positive',
  'Needs Calibration': 'Critical',
  Generated: 'None',
};

const ENTITY_SUMMARY = [
  { name: 'Business Partner', key: 'bp', desc: 'Customer master — risk segment, credit class, country' },
  { name: 'Receivable', key: 'receivables', desc: 'Open/cleared invoices — the primary experiment table (contains late_payment_flag)' },
  { name: 'Payment', key: 'payments', desc: 'Incoming payment clearing documents' },
  { name: 'Dunning', key: 'dunning', desc: 'Automated dunning notices for overdue receivables' },
  { name: 'Dispute', key: 'disputes', desc: 'Customer dispute cases linked to receivables' },
  { name: 'Collection History', key: 'ch', desc: 'Customer-level contact history (customer extension)' },
];

const QUALITY_DIMS = [
  { dim: 'Referential Integrity', desc: 'All FK relationships valid (BP→Recv→Payment/Dunning/Dispute)' },
  { dim: 'Business Rules', desc: 'Date constraints, amount limits, dunning-only-on-overdue checks' },
  { dim: 'Distribution Fidelity', desc: 'Late payment and dispute rates within tolerance of configuration' },
  { dim: 'Relationship Fidelity', desc: 'Behavioral correlations match expected direction and strength' },
  { dim: 'Scenario Coverage', desc: 'Representative scenarios are reflected in the generated data' },
];

export default function DatasetDetail({ nav, dataset, generatedDataset, qualityChecks, experiments, runs, onClose }: Props) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [previewTable, setPreviewTable] = useState<'bp' | 'rec' | 'pay' | 'dun' | 'dis' | 'ch'>('rec');

  if (!dataset) {
    return (
      <div style={{ padding: SP.m, textAlign: 'center' }}>
        <Text style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)' }}>No dataset selected.</Text>
        <Button design="Transparent" onClick={onClose} style={{ marginTop: SP.m }}>← Back</Button>
      </div>
    );
  }

  const usedByExps = experiments.filter(e => e.datasetIds.includes(dataset.id));
  const usedByRuns = runs.filter(r => r.datasetId === dataset.id);
  const isL3Plus = dataset.fidelityLevel === 'L3' || dataset.fidelityLevel === 'L4';

  // Quality scoring: use actual quality checks if available, else derive from fidelity
  const qcPassed = qualityChecks.length > 0 ? qualityChecks.filter(c => c.passed).length : (isL3Plus ? 5 : 4);
  const qcTotal = qualityChecks.length > 0 ? qualityChecks.length : 5;
  const overallScore = Math.round((qcPassed / qcTotal) * 100);

  const previewData = generatedDataset ? {
    bp: generatedDataset.businessPartners?.slice(0, 10) || [],
    rec: generatedDataset.receivables?.slice(0, 10) || [],
    pay: generatedDataset.payments?.slice(0, 10) || [],
    dun: generatedDataset.dunningRecords?.slice(0, 10) || [],
    dis: generatedDataset.disputes?.slice(0, 10) || [],
    ch: generatedDataset.collectionHistory?.slice(0, 10) || [],
  } : null;

  const PREVIEW_TABLES = [
    { key: 'rec', label: 'Receivables' },
    { key: 'bp', label: 'Business Partners' },
    { key: 'pay', label: 'Payments' },
    { key: 'dun', label: 'Dunning' },
    { key: 'dis', label: 'Disputes' },
    { key: 'ch', label: 'Collection History' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: `${SP.m} ${SP.m} 0`, borderBottom: '1px solid var(--sapList_BorderColor)', background: 'var(--sapObjectHeader_Background)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: SP.s, marginBottom: SP.xs }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sapBrandColor)', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)' }}>← Datasets</button>
          <span style={{ color: 'var(--sapContent_LabelColor)' }}>/</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SP.s }}>
          <div>
            <Title level="H4" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>{dataset.name}</Title>
            <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginTop: 2 }}>
              {dataset.customer} · Pack {dataset.packVersion} · Fidelity {dataset.fidelityLevel} · {dataset.recordCounts.receivables.toLocaleString()} receivables
            </Text>
          </div>
          <ObjectStatus state={QS_STATE[dataset.qualityStatus] || 'None'}>{dataset.qualityStatus}</ObjectStatus>
        </div>
        {/* Tab bar */}
        <div style={{ display: 'flex', overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ padding: `${SP.s} ${SP.m}`, background: 'none', border: 'none', borderBottom: activeTab === t ? '3px solid var(--sapBrandColor)' : '3px solid transparent', cursor: 'pointer', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: activeTab === t ? 'var(--sapFontBoldWeight)' : 'normal', color: activeTab === t ? 'var(--sapBrandColor)' : 'var(--sapTextColor)', whiteSpace: 'nowrap', marginBottom: -1 }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: SP.m }}>

        {/* OVERVIEW */}
        {activeTab === 'Overview' && (
          <div style={{ maxWidth: 900 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SP.m, marginBottom: SP.m }}>
              <div style={{ padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)' }}>
                <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: SP.s }}>Dataset Metadata</span>
                {[
                  ['Dataset ID', dataset.id],
                  ['Customer', `${dataset.customer} (Fictional)`],
                  ['Pack Version', dataset.packVersion],
                  ['Fidelity Level', dataset.fidelityLevel],
                  ['Seed', String(dataset.seed)],
                  ['Created', dataset.createdAt.slice(0, 10)],
                  ['Quality Status', dataset.qualityStatus],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: SP.s, paddingTop: 4, paddingBottom: 4, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', minWidth: 130 }}>{k}</span>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)' }}>
                <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: SP.s }}>Record Counts</span>
                {[
                  ['Business Partners', dataset.recordCounts.bp.toLocaleString()],
                  ['Receivables', dataset.recordCounts.receivables.toLocaleString()],
                  ['Payments', dataset.recordCounts.payments.toLocaleString()],
                  ['Dunning Records', dataset.recordCounts.dunning.toLocaleString()],
                  ['Dispute Cases', dataset.recordCounts.disputes.toLocaleString()],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4, paddingBottom: 4, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{k}</span>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            {usedByExps.length > 0 && (
              <div style={{ padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)' }}>
                <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: SP.s }}>Used By</span>
                {usedByExps.map(e => (
                  <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: SP.xs, paddingBottom: SP.xs, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapBrandColor)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => nav('experimentWorkspace')}>{e.name}</span>
                    <ObjectStatus state={e.status === 'Evaluating' ? 'Information' : e.status === 'Validated' ? 'Positive' : 'None'}>{e.status}</ObjectStatus>
                  </div>
                ))}
                <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginTop: SP.xs }}>
                  {usedByRuns.length} run{usedByRuns.length !== 1 ? 's' : ''} used this dataset
                </Text>
              </div>
            )}
          </div>
        )}

        {/* PREVIEW */}
        {activeTab === 'Preview' && (
          <div>
            <div style={{ display: 'flex', gap: SP.s, marginBottom: SP.m, flexWrap: 'wrap' }}>
              {PREVIEW_TABLES.map(t => (
                <button key={t.key} onClick={() => setPreviewTable(t.key as any)} style={{ padding: '4px 12px', background: previewTable === t.key ? 'var(--sapBrandColor)' : 'var(--sapTile_Background)', color: previewTable === t.key ? '#fff' : 'var(--sapTextColor)', border: `1px solid ${previewTable === t.key ? 'var(--sapBrandColor)' : 'var(--sapList_BorderColor)'}`, borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)' }}>{t.label}</button>
              ))}
            </div>
            {!previewData ? (
              <MessageStrip design="Warning" hideCloseButton>
                No generated data available. Generate a dataset first to see the preview.
              </MessageStrip>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                {previewTable === 'rec' && previewData.rec.length > 0 && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)' }}>
                    <thead>
                      <tr style={{ background: 'var(--sapList_HeaderBackground)' }}>
                        {['receivable_id', 'business_partner_id', 'invoice_date', 'due_date', 'invoice_amount', 'clearing_status', 'late_payment_flag'].map(h => (
                          <th key={h} style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid var(--sapList_BorderColor)', color: h === 'late_payment_flag' ? 'var(--sapBrandColor)' : 'var(--sapContent_LabelColor)', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.rec.map((r: any, i: number) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--sapList_AlternatingBackground, rgba(0,0,0,0.02))' }}>
                          <td style={{ padding: '4px 8px', borderBottom: '1px solid var(--sapList_BorderColor)', fontWeight: 'bold', color: 'var(--sapBrandColor)' }}>{r.receivable_id}</td>
                          <td style={{ padding: '4px 8px', borderBottom: '1px solid var(--sapList_BorderColor)' }}>{r.business_partner_id}</td>
                          <td style={{ padding: '4px 8px', borderBottom: '1px solid var(--sapList_BorderColor)' }}>{r.invoice_date?.slice(0, 10)}</td>
                          <td style={{ padding: '4px 8px', borderBottom: '1px solid var(--sapList_BorderColor)' }}>{r.due_date?.slice(0, 10)}</td>
                          <td style={{ padding: '4px 8px', borderBottom: '1px solid var(--sapList_BorderColor)', textAlign: 'right' }}>€{r.invoice_amount?.toFixed(2)}</td>
                          <td style={{ padding: '4px 8px', borderBottom: '1px solid var(--sapList_BorderColor)', color: r.clearing_status === 'CLEARED' ? 'var(--sapPositiveColor)' : r.clearing_status === 'OPEN' ? 'var(--sapInformationColor)' : 'var(--sapCriticalColor)' }}>{r.clearing_status}</td>
                          <td style={{ padding: '4px 8px', borderBottom: '1px solid var(--sapList_BorderColor)', color: r.late_payment_flag ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)', fontWeight: 'bold' }}>{r.late_payment_flag ? 'TRUE' : 'false'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {previewTable === 'bp' && previewData.bp.length > 0 && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)' }}>
                    <thead>
                      <tr style={{ background: 'var(--sapList_HeaderBackground)' }}>
                        {['business_partner_id', 'country', 'industry', 'credit_segment', 'risk_segment', 'historical_late_payments'].map(h => (
                          <th key={h} style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid var(--sapList_BorderColor)', color: 'var(--sapContent_LabelColor)', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.bp.map((r: any, i: number) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--sapList_AlternatingBackground, rgba(0,0,0,0.02))' }}>
                          <td style={{ padding: '4px 8px', borderBottom: '1px solid var(--sapList_BorderColor)', fontWeight: 'bold', color: 'var(--sapBrandColor)' }}>{r.business_partner_id}</td>
                          <td style={{ padding: '4px 8px', borderBottom: '1px solid var(--sapList_BorderColor)' }}>{r.country}</td>
                          <td style={{ padding: '4px 8px', borderBottom: '1px solid var(--sapList_BorderColor)' }}>{r.industry}</td>
                          <td style={{ padding: '4px 8px', borderBottom: '1px solid var(--sapList_BorderColor)' }}>{r.credit_segment}</td>
                          <td style={{ padding: '4px 8px', borderBottom: '1px solid var(--sapList_BorderColor)', color: r.risk_segment === 'HIGH' ? 'var(--sapNegativeColor)' : r.risk_segment === 'LOW' ? 'var(--sapPositiveColor)' : 'var(--sapCriticalColor)' }}>{r.risk_segment}</td>
                          <td style={{ padding: '4px 8px', borderBottom: '1px solid var(--sapList_BorderColor)', textAlign: 'right' }}>{r.historical_late_payments}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {(previewTable === 'pay' || previewTable === 'dun' || previewTable === 'dis' || previewTable === 'ch') && (
                  <div style={{ padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8 }}>
                    {(() => {
                      const tbl = previewTable === 'pay' ? previewData.pay : previewTable === 'dun' ? previewData.dun : previewTable === 'dis' ? previewData.dis : previewData.ch;
                      if (!tbl || tbl.length === 0) return <Text style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)' }}>No records available for this table in the current dataset.</Text>;
                      const keys = Object.keys(tbl[0]);
                      return (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)' }}>
                          <thead>
                            <tr style={{ background: 'var(--sapList_HeaderBackground)' }}>
                              {keys.map(k => <th key={k} style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid var(--sapList_BorderColor)', color: 'var(--sapContent_LabelColor)', whiteSpace: 'nowrap' }}>{k}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {tbl.map((r: any, i: number) => (
                              <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--sapList_AlternatingBackground, rgba(0,0,0,0.02))' }}>
                                {keys.map(k => <td key={k} style={{ padding: '4px 8px', borderBottom: '1px solid var(--sapList_BorderColor)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(r[k] ?? '—')}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SCHEMA */}
        {activeTab === 'Schema' && (
          <div style={{ maxWidth: 700 }}>
            <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginBottom: SP.m }}>
              Assistant-specific consumption schema for this dataset. For full field details, open the Experiment Pack.
            </Text>
            {ENTITY_SUMMARY.map((e, i) => (
              <div key={e.name} style={{ display: 'flex', gap: SP.m, padding: SP.s, background: 'var(--sapTile_Background)', borderRadius: 6, marginBottom: SP.xs, border: '1px solid var(--sapList_BorderColor)', alignItems: 'center' }}>
                <div style={{ minWidth: 160 }}>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>{e.name}</span>
                  <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapBrandColor)', fontWeight: 'var(--sapFontBoldWeight)' }}>{dataset.recordCounts[e.key as keyof typeof dataset.recordCounts]?.toLocaleString() || '—'} records</span>
                </div>
                <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', flex: 1 }}>{e.desc}</Text>
              </div>
            ))}
            <Button design="Transparent" icon="course-book" onClick={() => nav('packDetail')} style={{ marginTop: SP.m }}>View Full Schema in Pack →</Button>
          </div>
        )}

        {/* QUALITY */}
        {activeTab === 'Quality' && (
          <div style={{ maxWidth: 700 }}>
            <div style={{ padding: SP.m, background: dataset.qualityStatus === 'Needs Calibration' ? 'var(--sapNegativeBackground)' : dataset.qualityStatus.includes('ML') ? 'var(--sapInformationBackground, #e8f4fd)' : 'var(--sapPositiveBackground, #f5fae5)', border: `1px solid ${dataset.qualityStatus === 'Needs Calibration' ? 'var(--sapNegativeColor)' : dataset.qualityStatus.includes('ML') ? 'var(--sapInformationColor)' : 'var(--sapPositiveColor)'}`, borderRadius: 8, marginBottom: SP.m }}>
              <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: dataset.qualityStatus === 'Needs Calibration' ? 'var(--sapNegativeColor)' : dataset.qualityStatus.includes('ML') ? 'var(--sapInformationColor)' : 'var(--sapPositiveColor)', display: 'block', marginBottom: SP.xs }}>
                {dataset.qualityStatus.toUpperCase()}
              </span>
              <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>
                Overall score: {overallScore}% · {qcPassed}/{qcTotal} checks passed
              </Text>
            </div>
            {QUALITY_DIMS.map((d, i) => {
              const passed = i < qcPassed;
              return (
                <div key={d.dim} style={{ padding: SP.s, background: 'var(--sapTile_Background)', borderRadius: 6, marginBottom: SP.xs, border: '1px solid var(--sapList_BorderColor)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: SP.s, marginBottom: SP.xs }}>
                    <Icon name={passed ? 'accept' : 'alert'} style={{ width: '0.875rem', height: '0.875rem', color: passed ? 'var(--sapPositiveColor)' : 'var(--sapNegativeColor)', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', flex: 1 }}>{d.dim}</span>
                    <ObjectStatus state={passed ? 'Positive' : 'Negative'}>{passed ? 'Pass' : 'Fail'}</ObjectStatus>
                  </div>
                  <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{d.desc}</Text>
                </div>
              );
            })}
          </div>
        )}

        {/* CONFIGURATION */}
        {activeTab === 'Configuration' && (
          <div style={{ maxWidth: 600 }}>
            <div style={{ padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)' }}>
              <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: SP.s }}>Generation Configuration</span>
              {Object.entries({
                'Fidelity Level': dataset.fidelityLevel,
                'Pack Version': dataset.packVersion,
                'Customer': `${dataset.customer} (Fictional)`,
                'Seed': String(dataset.seed),
                ...Object.fromEntries(
                  Object.entries(dataset.config || {}).map(([k, v]) => [k, String(v)])
                ),
              }).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4, paddingBottom: 4, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{k}</span>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LINEAGE */}
        {activeTab === 'Lineage' && (
          <div style={{ maxWidth: 700 }}>
            <div style={{ padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)', marginBottom: SP.m }}>
              <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: SP.s }}>Generation Lineage</span>
              {[
                { label: 'Experiment Pack', value: `Collections & Disputes ${dataset.packVersion}`, link: () => nav('packDetail') },
                { label: 'Customer Context', value: `${dataset.customer} (Fictional) · ${dataset.fidelityLevel} Profile`, link: null },
                { label: 'This Dataset', value: dataset.name, link: null },
                { label: 'Lineage Note', value: dataset.lineage, link: null },
              ].map((item, i) => (
                <div key={item.label} style={{ display: 'flex', gap: SP.s, paddingTop: SP.s, paddingBottom: SP.s, borderBottom: i < 3 ? '1px solid var(--sapList_BorderColor)' : 'none', alignItems: 'flex-start' }}>
                  <div style={{ width: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sapBrandColor)' }} />
                    {i < 3 && <div style={{ width: 1, height: 20, background: 'var(--sapList_BorderColor)', marginTop: 2 }} />}
                  </div>
                  <div>
                    <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{item.label}</span>
                    {item.link ? (
                      <span style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapBrandColor)', cursor: 'pointer', textDecoration: 'underline' }} onClick={item.link}>{item.value}</span>
                    ) : (
                      <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{item.value}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {usedByRuns.length > 0 && (
              <div style={{ padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)' }}>
                <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: SP.s }}>Used in {usedByRuns.length} Runs</span>
                {usedByRuns.slice(0, 6).map(r => (
                  <div key={r.id} style={{ display: 'flex', gap: SP.m, paddingTop: 4, paddingBottom: 4, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapBrandColor)', minWidth: 80 }}>{r.id.slice(-6).toUpperCase()}</span>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{r.approachId}</span>
                    <ObjectStatus state={r.isReal ? 'Positive' : 'Information'}>{r.approachLabel}</ObjectStatus>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
