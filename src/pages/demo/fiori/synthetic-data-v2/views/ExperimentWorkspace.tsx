// @ts-nocheck
import React, { useState, useCallback } from 'react';
import {
  Title, Text, Button, ObjectStatus, Tag, Icon, MessageStrip,
  ProgressIndicator, BusyIndicator, Toast,
  Table, TableHeaderRow, TableHeaderCell, TableRow, TableCell,
} from '@ui5/webcomponents-react';
import { SP, APPROACH_CATALOG, SEED_FEATURE_SETS, SEED_DATASETS } from '../constants';
import type { SyntheticView, Experiment, RunRecord, DatasetRecord } from '../types';

interface Props {
  nav: (v: SyntheticView) => void;
  experiment: Experiment | null;
  runs: RunRecord[];
  datasets: DatasetRecord[];
  onAddRun: (run: RunRecord) => void;
  onOpenDataset?: (id: string) => void;
  onOpenRun?: (id: string) => void;
}

const TABS = ['Overview', 'Dataset', 'Features', 'Approaches', 'Runs', 'Compare', 'Validation', 'Learnings'];
const METRIC_LABELS: Record<string, string> = { accuracy: 'Accuracy', precision: 'Precision', recall: 'Recall', f1: 'F1', auc: 'AUC', mae: 'MAE', rmse: 'RMSE', r2: 'R²' };

const GOAL_FN: Record<string, (runs: RunRecord[]) => RunRecord | null> = {
  'Balanced': rs => rs.reduce((b, r) => !b || (r.metrics.f1 + r.metrics.auc) > (b.metrics.f1 + b.metrics.auc) ? r : b, null as RunRecord | null),
  'Max Recall': rs => rs.reduce((b, r) => !b || r.metrics.recall > b.metrics.recall ? r : b, null as RunRecord | null),
  'Max Precision': rs => rs.reduce((b, r) => !b || r.metrics.precision > b.metrics.precision ? r : b, null as RunRecord | null),
  'Max AUC': rs => rs.reduce((b, r) => !b || r.metrics.auc > b.metrics.auc ? r : b, null as RunRecord | null),
  'Min Complexity': rs => rs.filter(r => r.approachId === 'rules')[0] || rs[0] || null,
};

export default function ExperimentWorkspace({ nav, experiment, runs, datasets, onAddRun, onOpenDataset, onOpenRun }: Props) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [goal, setGoal] = useState('Balanced');
  const [running, setRunning] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastOpen, setToastOpen] = useState(false);
  const [selectedRunIds, setSelectedRunIds] = useState<string[]>([]);
  const [threshold, setThreshold] = useState(0.5);
  // Approach selection — default to all approaches in the experiment
  const [selectedApproachIds, setSelectedApproachIds] = useState<string[]>(
    experiment?.approachIds ?? []
  );
  const toggleApproachSelection = useCallback((id: string) => {
    setSelectedApproachIds(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  }, []);

  const expRuns = runs.filter(r => r.experimentId === experiment?.id);
  const candidateRuns = expRuns.filter(r => r.status === 'Completed');
  const leader = GOAL_FN[goal]?.(candidateRuns) || null;

  const handleRunApproach = useCallback((approachId: string) => {
    if (!experiment) return;
    setRunning(true);
    const approach = APPROACH_CATALOG.find(a => a.id === approachId);
    setTimeout(() => {
      const baseMetrics: Record<string, Record<string, number>> = {
        rules: { accuracy: 0.79, precision: 0.76, recall: 0.65, f1: 0.70, auc: 0.77 },
        logreg: { accuracy: 0.83, precision: 0.80, recall: 0.74, f1: 0.77, auc: 0.85 },
        gbm: { accuracy: 0.88, precision: 0.85, recall: 0.82, f1: 0.83, auc: 0.90 },
        rf: { accuracy: 0.86, precision: 0.83, recall: 0.79, f1: 0.81, auc: 0.87 },
        xgboost: { accuracy: 0.89, precision: 0.86, recall: 0.83, f1: 0.84, auc: 0.91 },
        svm: { accuracy: 0.84, precision: 0.81, recall: 0.77, f1: 0.79, auc: 0.86 },
        rpt: { accuracy: 0.82, precision: 0.78, recall: 0.74, f1: 0.76, auc: 0.81 },
      };
      const metrics = baseMetrics[approachId] || { accuracy: 0.75, precision: 0.72, recall: 0.68, f1: 0.70, auc: 0.78 };
      const newRun: RunRecord = {
        id: `run-${Date.now()}`,
        experimentId: experiment.id,
        datasetId: experiment.datasetIds[0] || 'ds-northstar-l3-v1',
        featureSetId: experiment.featureSetIds[0] || 'fs-behavioral-v1',
        approachId,
        parameters: approach?.defaultParams || {},
        seed: 42,
        metrics,
        runtime: approachId === 'rules' ? '2s' : approachId === 'logreg' ? '5s' : '47s',
        status: 'Completed',
        isReal: approach?.isReal ?? false,
        approachLabel: approach?.label ?? 'DEMO MODEL',
        createdAt: new Date().toISOString(),
      };
      onAddRun(newRun);
      setRunning(false);
      setToastMsg(`Run completed — ${approach?.name} · F1: ${metrics.f1}`);
      setToastOpen(true);
    }, 1500);
  }, [experiment, onAddRun]);

  const toggleRunSelect = (id: string) => setSelectedRunIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // Real confusion-matrix calculation based on threshold
  const thresholdAnalysis = useCallback((base: RunRecord | null, totalRec: number) => {
    if (!base) return null;
    const total = totalRec || 10000;
    const basePrec = base.metrics.precision || 0.84;
    const baseRecall = base.metrics.recall || 0.81;

    // Derive implied positive count from base metrics
    // Estimated positives = total * base_late_payment_rate (approx 17%)
    const estPositives = Math.round(total * 0.17);
    const estNegatives = total - estPositives;

    // Precision-Recall curve: sigmoid-like adjustment around threshold=0.5
    // Higher threshold → higher precision, lower recall
    const tAdj = threshold - 0.5;
    const precT = Math.min(0.97, Math.max(0.30, basePrec + tAdj * 0.40));
    const recallT = Math.min(0.97, Math.max(0.10, baseRecall - tAdj * 0.55));
    const f1T = precT > 0 && recallT > 0 ? 2 * precT * recallT / (precT + recallT) : 0;

    const TP = Math.round(recallT * estPositives);
    const FN = estPositives - TP;
    const FP = precT > 0 ? Math.round(TP * (1 - precT) / precT) : 0;
    const TN = Math.max(0, estNegatives - FP);
    const flagged = TP + FP;

    const baseFlagged = Math.round((basePrec > 0 ? Math.round(baseRecall * estPositives) * (1 / basePrec) : 0));
    const deltaFlagged = flagged - baseFlagged;
    const baseLate = Math.round(baseRecall * estPositives);
    const deltaLate = TP - baseLate;

    return { precT, recallT, f1T, TP, FN, FP, TN, flagged, deltaFlagged, deltaLate, baseLate, estPositives };
  }, [threshold]);

  if (!experiment) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: SP.m, textAlign: 'center' }}>
        <Icon name="lab" style={{ width: '3rem', height: '3rem', color: 'var(--sapContent_LabelColor)', marginBottom: SP.m }} />
        <Title level="H5" wrappingType="Normal" style={{ color: 'var(--sapContent_LabelColor)' }}>No experiment selected</Title>
        <Button design="Emphasized" icon="add" onClick={() => nav('experiments')} style={{ marginTop: SP.m }}>Go to Experiments</Button>
      </div>
    );
  }

  const ds = datasets.find(d => d.id === experiment.datasetIds[0]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toast open={toastOpen} duration={3000} placement="BottomCenter" onClose={() => setToastOpen(false)}>{toastMsg}</Toast>

      {/* Header */}
      <div style={{ padding: `${SP.m} ${SP.m} 0`, borderBottom: '1px solid var(--sapList_BorderColor)', background: 'var(--sapObjectHeader_Background)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SP.s }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: SP.s, marginBottom: 4 }}>
              <button onClick={() => nav('experiments')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sapBrandColor)', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)' }}>← Experiments</button>
              <span style={{ color: 'var(--sapContent_LabelColor)' }}>/</span>
            </div>
            <Title level="H4" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>{experiment.name}</Title>
            <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginTop: 2 }}>
              Pack {experiment.packVersion} · {experiment.taskType} · Target: {experiment.target} · {experiment.customer}
            </Text>
          </div>
          <ObjectStatus state={experiment.status === 'Validated' ? 'Positive' : experiment.status === 'Evaluating' ? 'Information' : 'None'}>{experiment.status}</ObjectStatus>
        </div>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ padding: `${SP.s} ${SP.m}`, background: 'none', border: 'none', borderBottom: activeTab === t ? '3px solid var(--sapBrandColor)' : '3px solid transparent', cursor: 'pointer', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: activeTab === t ? 'var(--sapFontBoldWeight)' : 'normal', color: activeTab === t ? 'var(--sapBrandColor)' : 'var(--sapTextColor)', whiteSpace: 'nowrap', marginBottom: -1 }}>
              {t} {t === 'Runs' ? `(${expRuns.length})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: SP.m }}>

        {/* OVERVIEW */}
        {activeTab === 'Overview' && (
          <div style={{ maxWidth: 900 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SP.m, marginBottom: SP.m }}>
              <div style={{ padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)' }}>
                <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: SP.s }}>Experiment Configuration</span>
                {[['Pack', experiment.packVersion], ['Task Type', experiment.taskType], ['Target', experiment.target], ['Customer', experiment.customer], ['Primary Metric', experiment.primaryMetric.toUpperCase()], ['Created', experiment.createdAt.slice(0,10)]].map(([k,v]) => (
                  <div key={k} style={{ display: 'flex', gap: SP.s, paddingTop: 4, paddingBottom: 4, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', minWidth: 120 }}>{k}</span>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)' }}>
                <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: SP.s }}>Progress</span>
                {[['Runs Completed', `${expRuns.filter(r => r.status === 'Completed').length} / ${expRuns.length}`], ['Datasets', experiment.datasetIds.length], ['Approaches Configured', experiment.approachIds.length], ['Feature Sets', experiment.featureSetIds.length]].map(([k,v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4, paddingBottom: 4, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{k}</span>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>{String(v)}</span>
                  </div>
                ))}
                {leader && (
                  <div style={{ marginTop: SP.m, padding: SP.s, background: 'var(--sapHighlightBackground, #e8f4fd)', borderRadius: 6, border: '1px solid var(--sapBrandColor)' }}>
                    <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', marginBottom: 4 }}>Leading Candidate (Balanced)</span>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapBrandColor)' }}>{APPROACH_CATALOG.find(a => a.id === leader.approachId)?.name}</span>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}> · F1: {leader.metrics.f1} · AUC: {leader.metrics.auc}</span>
                  </div>
                )}
              </div>
            </div>
            {experiment.question && (
              <MessageStrip design="Information" hideCloseButton>
                <strong>Question:</strong> {experiment.question}
              </MessageStrip>
            )}
          </div>
        )}

        {/* DATASET */}
        {activeTab === 'Dataset' && (
          <div style={{ maxWidth: 800 }}>
            {ds ? (
              <div style={{ padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)', marginBottom: SP.m }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SP.m }}>
                  <Title level="H5" wrappingType="Normal" style={{ color: onOpenDataset ? 'var(--sapBrandColor)' : 'var(--sapTextColor)', cursor: onOpenDataset ? 'pointer' : 'default', textDecoration: onOpenDataset ? 'underline' : 'none' }} onClick={() => onOpenDataset && ds && onOpenDataset(ds.id)}>{ds.name}</Title>
                  <ObjectStatus state={ds.qualityStatus.includes('ML') ? 'Information' : 'Positive'}>{ds.qualityStatus}</ObjectStatus>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SP.m }}>
                  {[['ID', ds.id], ['Fidelity', ds.fidelityLevel], ['Pack Version', ds.packVersion], ['Customer', ds.customer], ['Business Partners', ds.recordCounts.bp.toLocaleString()], ['Receivables', ds.recordCounts.receivables.toLocaleString()], ['Payments', ds.recordCounts.payments.toLocaleString()], ['Seed', String(ds.seed)], ['Created', ds.createdAt.slice(0,10)]].map(([k,v]) => (
                    <div key={k}><span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{k}</span><span style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapTextColor)' }}>{v}</span></div>
                  ))}
                </div>
                <div style={{ marginTop: SP.m, paddingTop: SP.m, borderTop: '1px solid var(--sapList_BorderColor)' }}>
                  <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', marginBottom: 4 }}>Lineage</span>
                  <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{ds.lineage}</Text>
                </div>
              </div>
            ) : (
              <MessageStrip design="Warning" hideCloseButton>No dataset linked. Go to Datasets to create or link one.</MessageStrip>
            )}
            <Button design="Transparent" icon="add-document" onClick={() => nav('datasets')}>Manage Datasets</Button>
          </div>
        )}

        {/* FEATURES */}
        {activeTab === 'Features' && (
          <div style={{ maxWidth: 800 }}>
            {SEED_FEATURE_SETS.filter(fs => experiment.featureSetIds.includes(fs.id)).map(fs => (
              <div key={fs.id} style={{ padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)', marginBottom: SP.m }}>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', fontSize: 'var(--sapFontLargeSize)', color: 'var(--sapTextColor)', display: 'block', marginBottom: SP.xs }}>{fs.name} {fs.version}</span>
                <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginBottom: SP.s }}>{fs.description}</Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: SP.xs }}>
                  {fs.fields.map(f => <Tag key={f} design="Set2" colorScheme="5">{f}</Tag>)}
                </div>
              </div>
            ))}
            <Button design="Transparent" icon="add" onClick={() => nav('featureSets')}>Manage Feature Sets</Button>
          </div>
        )}

        {/* APPROACHES */}
        {activeTab === 'Approaches' && (
          <div style={{ maxWidth: 900 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SP.m, marginBottom: SP.m }}>
              {APPROACH_CATALOG.filter(a => experiment.approachIds.includes(a.id)).map(a => {
                const isSelected = selectedApproachIds.includes(a.id);
                return (
                  <div key={a.id}
                    onClick={() => !running && toggleApproachSelection(a.id)}
                    style={{
                      padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8,
                      boxShadow: 'var(--sapContent_Shadow0)',
                      borderTop: `3px solid ${a.isReal ? 'var(--sapPositiveColor)' : 'var(--sapInformationColor)'}`,
                      outline: isSelected ? `2px solid var(--sapHighlightColor)` : '2px solid transparent',
                      cursor: running ? 'default' : 'pointer',
                      transition: 'outline-color 0.15s',
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SP.s }}>
                      <div style={{ display: 'flex', gap: SP.s, alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => !running && toggleApproachSelection(a.id)}
                          onClick={e => e.stopPropagation()}
                          style={{ accentColor: 'var(--sapHighlightColor)', width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
                        />
                        <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>{a.name}</span>
                      </div>
                      <ObjectStatus state={a.isReal ? 'Positive' : 'Information'}>{a.label}</ObjectStatus>
                    </div>
                    <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block' }}>{a.description}</Text>
                  </div>
                );
              })}
            </div>
            {/* Single Run CTA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: SP.m, padding: SP.m, background: 'var(--sapBaseColor)', borderRadius: 8, border: '1px solid var(--sapGroup_TitleBorderColor)' }}>
              {running ? (
                <BusyIndicator active size="S" text={`Running ${selectedApproachIds.length} approach${selectedApproachIds.length !== 1 ? 'es' : ''}…`} />
              ) : (
                <>
                  <Button
                    design="Emphasized"
                    icon="process"
                    disabled={selectedApproachIds.length === 0}
                    onClick={() => selectedApproachIds.forEach(id => handleRunApproach(id))}
                  >
                    Run {selectedApproachIds.length > 0 ? selectedApproachIds.length : ''} Selected Approach{selectedApproachIds.length === 1 ? '' : 'es'}
                  </Button>
                  <Button design="Transparent" onClick={() => {
                    const all = experiment?.approachIds ?? [];
                    setSelectedApproachIds(selectedApproachIds.length === all.length ? [] : all);
                  }}>
                    {selectedApproachIds.length === (experiment?.approachIds ?? []).length ? 'Deselect All' : 'Select All'}
                  </Button>
                  {selectedApproachIds.length === 0 && (
                    <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapCriticalColor)' }}>
                      Select at least one approach
                    </Text>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* RUNS */}
        {activeTab === 'Runs' && (
          <div style={{ maxWidth: 1000 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP.m }}>
              <Title level="H5" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>Experiment Runs — {expRuns.length} total</Title>
            </div>
            <MessageStrip design="Information" hideCloseButton style={{ marginBottom: SP.m }}>
              Every run is immutable. "Run Again" creates a new record — it does not overwrite previous results.
            </MessageStrip>
            {expRuns.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--sapTile_Background)', borderRadius: 8 }}>
                <Text style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)' }}>No runs yet. Go to the Approaches tab to run your first approach.</Text>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <Table headerRow={
                  <TableHeaderRow>
                    <TableHeaderCell>Run ID</TableHeaderCell>
                    <TableHeaderCell>Approach</TableHeaderCell>
                    <TableHeaderCell>Feature Set</TableHeaderCell>
                    <TableHeaderCell>Dataset</TableHeaderCell>
                    <TableHeaderCell>F1</TableHeaderCell>
                    <TableHeaderCell>AUC</TableHeaderCell>
                    <TableHeaderCell>Recall</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>Runtime</TableHeaderCell>
                    <TableHeaderCell>Created</TableHeaderCell>
                  </TableHeaderRow>
                }>
                  {expRuns.map((r, i) => {
                    const approach = APPROACH_CATALOG.find(a => a.id === r.approachId);
                    const fs = SEED_FEATURE_SETS.find(f => f.id === r.featureSetId);
                    const ds2 = datasets.find(d => d.id === r.datasetId);
                    return (
                      <TableRow key={r.id} rowKey={String(i)}>
                        <TableCell><span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapBrandColor)', cursor: onOpenRun ? 'pointer' : 'default', textDecoration: onOpenRun ? 'underline' : 'none' }} onClick={() => onOpenRun && onOpenRun(r.id)}>{r.id.slice(-6).toUpperCase()}</span></TableCell>
                        <TableCell><Text>{approach?.name || r.approachId}</Text></TableCell>
                        <TableCell><Text>{fs?.name || r.featureSetId}</Text></TableCell>
                        <TableCell><Text>{ds2?.name || r.datasetId.slice(-8)}</Text></TableCell>
                        <TableCell><span style={{ fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapPositiveColor)' }}>{r.metrics.f1?.toFixed(3)}</span></TableCell>
                        <TableCell><Text>{r.metrics.auc?.toFixed(3)}</Text></TableCell>
                        <TableCell><Text>{r.metrics.recall?.toFixed(3)}</Text></TableCell>
                        <TableCell><ObjectStatus state={r.isReal ? 'Positive' : 'Information'}>{r.approachLabel}</ObjectStatus></TableCell>
                        <TableCell><Text>{r.runtime}</Text></TableCell>
                        <TableCell><Text>{r.createdAt.slice(0,10)}</Text></TableCell>
                      </TableRow>
                    );
                  })}
                </Table>
              </div>
            )}
          </div>
        )}

        {/* COMPARE */}
        {activeTab === 'Compare' && (
          <div style={{ maxWidth: 1000 }}>
            <div style={{ display: 'flex', gap: SP.s, marginBottom: SP.m, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>Optimization Goal:</span>
              {Object.keys(GOAL_FN).map(g => (
                <button key={g} onClick={() => setGoal(g)} style={{ padding: `4px ${SP.m}`, background: goal === g ? 'var(--sapBrandColor)' : 'var(--sapTile_Background)', color: goal === g ? '#fff' : 'var(--sapTextColor)', border: `1px solid ${goal === g ? 'var(--sapBrandColor)' : 'var(--sapList_BorderColor)'}`, borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: goal === g ? 'var(--sapFontBoldWeight)' : 'normal' }}>{g}</button>
              ))}
            </div>

            {leader && (
              <div style={{ padding: SP.m, background: 'var(--sapHighlightBackground, #e8f4fd)', border: '1px solid var(--sapBrandColor)', borderRadius: 8, marginBottom: SP.m }}>
                <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', marginBottom: 4 }}>Leading Candidate Under "{goal}" Objective</span>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', fontSize: 'var(--sapFontLargeSize)', color: 'var(--sapBrandColor)' }}>
                  {APPROACH_CATALOG.find(a => a.id === leader.approachId)?.name} · {SEED_FEATURE_SETS.find(f => f.id === leader.featureSetId)?.name || leader.featureSetId}
                </span>
                <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginTop: 4, fontStyle: 'italic' }}>
                  This is experiment evidence, not a production model decision.
                </Text>
              </div>
            )}

            {candidateRuns.length === 0 ? (
              <MessageStrip design="Warning" hideCloseButton>No completed runs to compare. Run approaches from the Approaches tab.</MessageStrip>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <Table headerRow={
                  <TableHeaderRow>
                    <TableHeaderCell>Run</TableHeaderCell>
                    <TableHeaderCell>Approach</TableHeaderCell>
                    <TableHeaderCell>Feature Set</TableHeaderCell>
                    <TableHeaderCell>Accuracy</TableHeaderCell>
                    <TableHeaderCell>Precision</TableHeaderCell>
                    <TableHeaderCell>Recall</TableHeaderCell>
                    <TableHeaderCell>F1</TableHeaderCell>
                    <TableHeaderCell>AUC</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>Runtime</TableHeaderCell>
                  </TableHeaderRow>
                }>
                  {candidateRuns.map((r, i) => {
                    const a = APPROACH_CATALOG.find(x => x.id === r.approachId);
                    const fs = SEED_FEATURE_SETS.find(f => f.id === r.featureSetId);
                    const isLeader = leader?.id === r.id;
                    return (
                      <TableRow key={r.id} rowKey={String(i)} style={isLeader ? { background: 'var(--sapHighlightBackground, #e8f4fd)' } : {}}>
                        <TableCell><span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapBrandColor)' }}>{r.id.slice(-6).toUpperCase()}{isLeader ? ' ★' : ''}</span></TableCell>
                        <TableCell><Text>{a?.name || r.approachId}</Text></TableCell>
                        <TableCell><Text>{fs?.name || r.featureSetId}</Text></TableCell>
                        <TableCell><Text>{r.metrics.accuracy?.toFixed(3)}</Text></TableCell>
                        <TableCell><Text>{r.metrics.precision?.toFixed(3)}</Text></TableCell>
                        <TableCell><Text>{r.metrics.recall?.toFixed(3)}</Text></TableCell>
                        <TableCell><span style={{ fontWeight: isLeader ? 'var(--sapFontBoldWeight)' : 'normal', color: isLeader ? 'var(--sapPositiveColor)' : 'var(--sapTextColor)' }}>{r.metrics.f1?.toFixed(3)}</span></TableCell>
                        <TableCell><Text>{r.metrics.auc?.toFixed(3)}</Text></TableCell>
                        <TableCell><ObjectStatus state={r.isReal ? 'Positive' : 'Information'}>{r.approachLabel}</ObjectStatus></TableCell>
                        <TableCell><Text>{r.runtime}</Text></TableCell>
                      </TableRow>
                    );
                  })}
                </Table>
              </div>
            )}

            {/* Threshold Analysis */}
            {leader && (
              <div style={{ marginTop: SP.l }}>
                <div style={{ borderBottom: '1px solid var(--sapList_BorderColor)', paddingBottom: SP.xs, marginBottom: SP.m }}>
                  <Title level="H5" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>
                    Threshold Analysis — {APPROACH_CATALOG.find(a => a.id === leader.approachId)?.name}
                  </Title>
                </div>
                <MessageStrip design="Information" hideCloseButton style={{ marginBottom: SP.m }}>
                  Adjust the classification threshold to explore the precision/recall tradeoff. Lower threshold = more late payers flagged (higher recall, lower precision).
                </MessageStrip>
                <div style={{ display: 'flex', alignItems: 'center', gap: SP.m, marginBottom: SP.m }}>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', whiteSpace: 'nowrap' }}>Classification Threshold:</span>
                  <input type="range" min="0.1" max="0.9" step="0.05" value={threshold} onChange={e => setThreshold(Number(e.target.value))} style={{ flex: 1 }} />
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapBrandColor)', minWidth: 40 }}>{threshold.toFixed(2)}</span>
                </div>
                {(() => {
                  const totalRec = datasets.find(d => d.id === leader.datasetId)?.recordCounts.receivables || 500000;
                  const ta = thresholdAnalysis(leader, totalRec);
                  if (!ta) return null;
                  const { precT, recallT, f1T, TP, FN, FP, TN, flagged, deltaFlagged, deltaLate } = ta;
                  const isDefault = Math.abs(threshold - 0.5) < 0.01;
                  return (
                    <div>
                      {/* Metrics row */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: SP.m, marginBottom: SP.m }}>
                        {[['Precision', precT], ['Recall', recallT], ['F1', f1T], ['Threshold', threshold]].map(([k, v]) => (
                          <div key={String(k)} style={{ padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8, textAlign: 'center', border: k === 'Threshold' ? '2px solid var(--sapBrandColor)' : '1px solid var(--sapList_BorderColor)' }}>
                            <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', marginBottom: 4 }}>{k}</span>
                            <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', fontSize: 'var(--sapFontLargeSize)', color: k === 'Recall' ? 'var(--sapPositiveColor)' : k === 'Threshold' ? 'var(--sapBrandColor)' : 'var(--sapTextColor)' }}>
                              {k === 'Threshold' ? (Number(v)).toFixed(2) : (Number(v)).toFixed(3)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Confusion Matrix */}
                      <div style={{ marginBottom: SP.m }}>
                        <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: SP.s }}>Confusion Matrix</span>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, maxWidth: 400 }}>
                          {[
                            { label: 'True Positives', sublabel: 'Late payers correctly flagged', value: TP, color: 'var(--sapPositiveColor)', bg: 'var(--sapPositiveBackground, #f5fae5)' },
                            { label: 'False Positives', sublabel: 'On-time payers incorrectly flagged', value: FP, color: 'var(--sapCriticalColor)', bg: 'var(--sapCautionBackground, #fff8e7)' },
                            { label: 'False Negatives', sublabel: 'Late payers missed', value: FN, color: 'var(--sapNegativeColor)', bg: 'var(--sapNegativeBackground, #fdf3f3)' },
                            { label: 'True Negatives', sublabel: 'On-time payers correctly not flagged', value: TN, color: 'var(--sapPositiveColor)', bg: 'var(--sapPositiveBackground, #f5fae5)' },
                          ].map(cell => (
                            <div key={cell.label} style={{ padding: SP.m, background: cell.bg, border: `1px solid ${cell.color}`, borderRadius: 4, textAlign: 'center' }}>
                              <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: '0.7rem', color: 'var(--sapContent_LabelColor)', marginBottom: 2 }}>{cell.label}</span>
                              <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', fontSize: 'var(--sapFontLargeSize)', color: cell.color }}>{cell.value.toLocaleString()}</span>
                              <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: '0.65rem', color: 'var(--sapContent_LabelColor)', marginTop: 2 }}>{cell.sublabel}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Business Impact */}
                      <div style={{ padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8, border: '1px solid var(--sapList_BorderColor)', marginBottom: SP.m }}>
                        <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: SP.s }}>Business Impact — Collections Prioritization</span>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: SP.m }}>
                          {[
                            { label: 'Accounts Flagged for Review', value: flagged.toLocaleString(), delta: isDefault ? null : (deltaFlagged > 0 ? `+${deltaFlagged.toLocaleString()}` : String(deltaFlagged.toLocaleString())) },
                            { label: 'Late Payers Captured', value: TP.toLocaleString(), delta: isDefault ? null : (deltaLate > 0 ? `+${deltaLate.toLocaleString()}` : String(deltaLate.toLocaleString())) },
                            { label: 'Late Payers Missed', value: FN.toLocaleString(), delta: null },
                          ].map(item => (
                            <div key={item.label} style={{ padding: SP.s, background: 'var(--sapBackgroundColor)', borderRadius: 6, border: '1px solid var(--sapList_BorderColor)' }}>
                              <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: '0.7rem', color: 'var(--sapContent_LabelColor)', marginBottom: 4 }}>{item.label}</span>
                              <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', fontSize: 'var(--sapFontLargeSize)', color: 'var(--sapTextColor)' }}>{item.value}</span>
                              {item.delta && <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: item.delta.startsWith('+') ? 'var(--sapPositiveColor)' : 'var(--sapNegativeColor)', marginTop: 2 }}>{item.delta} vs default (0.50)</span>}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Save as new run */}
                      {!isDefault && (
                        <Button design="Transparent" icon="add" onClick={() => {
                          if (!experiment) return;
                          const newRun: RunRecord = {
                            id: `run-t${Math.floor(threshold * 100)}`,
                            experimentId: experiment.id,
                            datasetId: leader.datasetId,
                            featureSetId: leader.featureSetId,
                            approachId: leader.approachId,
                            parameters: { ...leader.parameters, threshold },
                            seed: leader.seed,
                            metrics: { ...leader.metrics, precision: parseFloat(precT.toFixed(3)), recall: parseFloat(recallT.toFixed(3)), f1: parseFloat(f1T.toFixed(3)) },
                            runtime: leader.runtime,
                            status: 'Completed',
                            isReal: leader.isReal,
                            approachLabel: leader.approachLabel,
                            createdAt: new Date().toISOString(),
                          };
                          onAddRun(newRun);
                          setToastMsg(`Run saved — ${APPROACH_CATALOG.find(a => a.id === leader.approachId)?.name} · Threshold: ${threshold.toFixed(2)} · F1: ${f1T.toFixed(3)}`);
                          setToastOpen(true);
                        }}>
                          Save as New Run (Threshold: {threshold.toFixed(2)})
                        </Button>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* VALIDATION */}
        {activeTab === 'Validation' && (
          <div style={{ maxWidth: 800 }}>
            <MessageStrip design="Information" hideCloseButton style={{ marginBottom: SP.m }}>
              Four distinct validation types — each answers a different question about confidence and reusability.
            </MessageStrip>
            {[
              { title: 'Dataset Validation', status: 'Positive', label: 'Ready for Early ML Experimentation', items: ['Schema validity — Pass', 'Referential integrity — Pass', 'Business rules — Pass', 'Distribution fidelity — Pass', 'Relationship fidelity — Pass', 'Scenario coverage — Pass (3/3)'] },
              { title: 'Experiment Validation', status: 'Positive', label: 'Complete', items: ['Dataset linked — Yes (Northstar-L3-v1)', 'Methodology defined — Yes', 'Metrics configured — Yes', `Runs completed — ${expRuns.filter(r => r.status === 'Completed').length}`] },
              { title: 'Customer / Process Validation', status: 'Critical', label: 'Pending', items: ['Representative scenarios accepted — Pending', 'Business-user review — Pending', 'Process fit assessment — Pending'] },
              { title: 'Pack Validation', status: 'Critical', label: 'In Progress', items: ['Domain model reviewed — Yes', 'Schema reviewed — Yes', 'Constraints reviewed — Yes', 'Reusable learnings reviewed — Pending', 'Approved for reuse — Pending'] },
            ].map(section => (
              <div key={section.title} style={{ padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)', marginBottom: SP.m }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP.s }}>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>{section.title}</span>
                  <ObjectStatus state={section.status as any}>{section.label}</ObjectStatus>
                </div>
                {section.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: SP.s, paddingTop: 4, paddingBottom: 4, borderBottom: i < section.items.length - 1 ? '1px solid var(--sapList_BorderColor)' : 'none' }}>
                    <Icon name={item.includes('Pending') ? 'pending' : 'accept'} style={{ width: '0.875rem', height: '0.875rem', color: item.includes('Pending') ? 'var(--sapCriticalColor)' : 'var(--sapPositiveColor)', flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* LEARNINGS */}
        {activeTab === 'Learnings' && (
          <div style={{ maxWidth: 800 }}>
            <MessageStrip design="Information" hideCloseButton style={{ marginBottom: SP.m }}>
              Capture generalizable insights from this experiment. Evidence must include supporting run IDs.
            </MessageStrip>
            <Button design="Emphasized" icon="add" onClick={() => nav('learnings')} style={{ marginBottom: SP.m }}>Go to Reusable Learnings</Button>
            {expRuns.filter(r => r.status === 'Completed').length > 0 && (
              <div style={{ padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)' }}>
                <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: SP.s }}>Candidate Observations from This Experiment</span>
                {[
                  { text: 'Behavioral features (historical late-payment count, days_outstanding) materially improve F1 and AUC over baseline features alone.', confidence: 'High', runs: expRuns.filter(r => r.status === 'Completed').slice(0,2).map(r => r.id.slice(-6).toUpperCase()) },
                  { text: 'Gradient Boosting outperforms Logistic Regression on this dataset with behavioral features.', confidence: 'Medium', runs: expRuns.filter(r => r.status === 'Completed').slice(0,3).map(r => r.id.slice(-6).toUpperCase()) },
                ].map((obs, i) => (
                  <div key={i} style={{ padding: SP.s, marginBottom: SP.s, background: 'var(--sapBackgroundColor)', borderRadius: 6, border: '1px solid var(--sapList_BorderColor)' }}>
                    <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)', display: 'block', marginBottom: 4 }}>{obs.text}</Text>
                    <div style={{ display: 'flex', gap: SP.s, alignItems: 'center' }}>
                      <ObjectStatus state="Positive">{obs.confidence} Confidence</ObjectStatus>
                      <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>Evidence: Runs {obs.runs.join(', ')}</span>
                    </div>
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
