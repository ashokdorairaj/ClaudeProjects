// @ts-nocheck
import React, { useState, useCallback } from 'react';
import {
  FlexBox, Title, Text, Button, ObjectStatus,
  MessageStrip, BusyIndicator, Icon, Card, CardHeader,
} from '@ui5/webcomponents-react';
import type {
  Engagement, SyntheticView, EngagementStage, TechRecommendation,
  InformationField, RecommendedApproach, RecommendedMetric,
} from '../types';
import type {
  Experiment, DatasetRecord, RunRecord, PackVersion, TaskType,
} from '../../synthetic-data-v2/types';
import {
  SP, SEED_DATASETS, FIDELITY_LEVELS, APPROACH_CATALOG, QUESTION_TEMPLATES, getDataAccessSummary,
} from '../../synthetic-data-v2/constants';
import { analyzeCustomerContext } from '../contextEngine';
import { getRecommendation } from '../recommendationEngine';
import TechRecommendationPanel from './TechRecommendationPanel';
import EngineeringHandoff, { generateHandoffMarkdown, generateDataAccessCSV } from './EngineeringHandoff';

// ─── Shared styles ────────────────────────────────────────────────────────────
const textareaStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '8px 12px', borderRadius: 6,
  border: '1px solid var(--sapField_BorderColor)',
  background: 'var(--sapField_Background)',
  color: 'var(--sapTextColor)',
  fontSize: '0.875rem', fontFamily: 'var(--sapFontFamily)',
  resize: 'vertical', outline: 'none', lineHeight: 1.5,
};
const inputStyle: React.CSSProperties = { ...textareaStyle, resize: 'none', height: 36 };
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Available packs ──────────────────────────────────────────────────────────
const AVAILABLE_PACKS = [
  { id: 'collections-v1', name: 'Collections & Disputes', domain: 'Finance', version: 'v1.0', status: 'Validated' },
  { id: 'procurement-v09', name: 'Procurement Assistant', domain: 'Procurement', version: 'v0.9', status: 'Draft' },
  { id: 'tm-v08', name: 'Transportation Management', domain: 'Supply Chain', version: 'v0.8', status: 'Draft' },
  { id: 'none', name: 'No matching Experiment Pack', domain: '', version: '', status: '' },
];
const PACK_NAMES: Record<string, string> = {
  'collections-v1': 'Collections & Disputes v1.0',
  'procurement-v09': 'Procurement Assistant v0.9',
  'tm-v08': 'Transportation Management v0.8',
};

const SIMULATED_OPPORTUNITY_CONTEXT = `Customer shared their Opportunity Inventory:
- Late payment rate: approximately 18% of invoices are paid more than 30 days late
- Total business partners: approximately 25,000 active accounts
- Annual invoice volume: roughly 500,000 receivables per year
- Custom field: ZZ_PROMISE_TO_PAY tracks promise-to-pay commitments
- Custom field: ZZ_COLLECTOR_TEAM tracks collector team assignments
- Pain point: collectors manually review all open receivables weekly — takes ~3 full days
- Business constraint: dunning notices must only be sent for receivables overdue by more than 30 days`;

// ─── Stage configuration ──────────────────────────────────────────────────────
const STAGES: Array<{ key: EngagementStage; label: string; icon: string }> = [
  { key: 'use-case',       label: 'Use Case',             icon: 'customer' },
  { key: 'prototype-data', label: 'Prototype Data',        icon: 'add-document' },
  { key: 'recommendation', label: 'Recommendation',        icon: 'activities' },
  { key: 'experiment',     label: 'Experiment',            icon: 'lab' },
  { key: 'handoff',        label: 'Engineering Handoff',   icon: 'share' },
];
const STAGE_IDX = Object.fromEntries(STAGES.map((s, i) => [s.key, i]));

// ─── Workflow footer ──────────────────────────────────────────────────────────
interface FooterProps {
  currentStage: EngagementStage; onBack: () => void; onNext: () => void;
  nextLabel?: string; nextBlocked?: boolean; nextBlockedReason?: string;
}
const WorkflowFooter: React.FC<FooterProps> = ({ currentStage, onBack, onNext, nextLabel, nextBlocked, nextBlockedReason }) => {
  const idx = STAGE_IDX[currentStage] ?? 0;
  const isFirst = idx === 0; const isLast = idx === STAGES.length - 1;
  const prevStage = !isFirst ? STAGES[idx - 1] : null;
  const nextStage = !isLast ? STAGES[idx + 1] : null;
  return (
    <div style={{ marginTop: SP.l, paddingTop: SP.m, borderTop: '1px solid var(--sapGroup_TitleBorderColor)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Button design="Transparent" icon="nav-back" disabled={isFirst} onClick={onBack}>
        {prevStage ? `← ${prevStage.label}` : '←'}
      </Button>
      <Text style={{ fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)' }}>
        Step {idx + 1} of {STAGES.length}
      </Text>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        {nextBlocked && nextBlockedReason && (
          <Text style={{ fontSize: '0.75rem', color: 'var(--sapCriticalColor)' }}>{nextBlockedReason}</Text>
        )}
        <Button design={isLast ? 'Default' : 'Emphasized'} disabled={isLast || !!nextBlocked} onClick={onNext}>
          {isLast ? 'Finish Engagement' : (nextLabel ?? (nextStage ? `Next: ${nextStage.label} →` : 'Next →'))}
        </Button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PANEL 1 — Use Case
// ═══════════════════════════════════════════════════════════════════════════════
interface UseCasePanelProps {
  customer: string; setCustomer: (v: string) => void;
  useCaseName: string; setUseCaseName: (v: string) => void;
  businessProblem: string; setBusinessProblem: (v: string) => void;
  neoNotes: string; setNeoNotes: (v: string) => void;
  selectedPackId: string; setSelectedPackId: (v: string) => void;
  onSave: () => void; nav: (v: SyntheticView) => void;
  currentStage: EngagementStage; onBack: () => void; onNext: () => void;
}
const UseCasePanel: React.FC<UseCasePanelProps> = ({
  customer, setCustomer, useCaseName, setUseCaseName,
  businessProblem, setBusinessProblem, neoNotes, setNeoNotes,
  selectedPackId, setSelectedPackId, onSave, nav, currentStage, onBack, onNext,
}) => {
  const selectedPack = AVAILABLE_PACKS.find(p => p.id === selectedPackId);
  return (
    <div>
      <Title level="H3" style={{ marginBottom: SP.m }}>Use Case</Title>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SP.m, marginBottom: SP.m }}>
        <div>
          <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>Customer Name</Text>
          <input style={inputStyle} value={customer} onChange={e => setCustomer(e.target.value)} placeholder="e.g. Test Customer Name"
            onFocus={e => { e.target.style.borderColor = 'var(--sapField_ActiveBorderColor)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--sapField_BorderColor)'; }} />
        </div>
        <div>
          <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>Engagement Name</Text>
          <input style={inputStyle} value={useCaseName} onChange={e => setUseCaseName(e.target.value)} placeholder="e.g. Collections Prioritization"
            onFocus={e => { e.target.style.borderColor = 'var(--sapField_ActiveBorderColor)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--sapField_BorderColor)'; }} />
        </div>
      </div>
      <div style={{ marginBottom: SP.m }}>
        <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>Business Problem</Text>
        <textarea style={textareaStyle} rows={4} value={businessProblem} onChange={e => setBusinessProblem(e.target.value)}
          placeholder="Describe the customer's pain point in plain language…"
          onFocus={e => { e.target.style.borderColor = 'var(--sapField_ActiveBorderColor)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--sapField_BorderColor)'; }} />
      </div>
      <div style={{ marginBottom: SP.m }}>
        <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>Use Case / Selected Opportunity</Text>
        <input style={inputStyle} value={neoNotes} onChange={e => setNeoNotes(e.target.value)} placeholder="e.g. Improve Collections Prioritization"
          onFocus={e => { e.target.style.borderColor = 'var(--sapField_ActiveBorderColor)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--sapField_BorderColor)'; }} />
      </div>
      <div style={{ marginBottom: SP.l }}>
        <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>Experiment Pack</Text>
        <FlexBox gap={SP.s} alignItems="Center">
          <select style={{ ...selectStyle, width: 320 }} value={selectedPackId} onChange={e => setSelectedPackId(e.target.value)}>
            {AVAILABLE_PACKS.map(p => <option key={p.id} value={p.id}>{p.name}{p.version ? ` — ${p.domain} ${p.version}` : ''}</option>)}
          </select>
          {selectedPack?.status && (
            <ObjectStatus state={selectedPack.status === 'Validated' ? 'Positive' : 'Information'}>{selectedPack.status}</ObjectStatus>
          )}
          {selectedPackId !== 'none' && (
            <Button design="Transparent" icon="course-book" onClick={() => nav('packDetail')}>View Pack</Button>
          )}
        </FlexBox>
      </div>
      <Button design="Emphasized" onClick={onSave} style={{ marginBottom: SP.m }}>Save &amp; Continue</Button>
      <WorkflowFooter currentStage={currentStage} onBack={onBack} onNext={onNext} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PANEL 2 — Prototype Data
// ═══════════════════════════════════════════════════════════════════════════════
interface PrototypeDataPanelProps {
  engagement: Engagement; datasets: DatasetRecord[];
  justGeneratedDatasetId: string | null;
  onUseDataset: (id: string) => void; onViewData: (id: string) => void;
  onOpenContext: () => void; onGoToRecommendation: () => void;
  nav: (v: SyntheticView) => void;
  currentStage: EngagementStage; onBack: () => void; onNext: () => void;
  showToast: (msg: string) => void;
}
const PrototypeDataPanel: React.FC<PrototypeDataPanelProps> = ({
  engagement, datasets, justGeneratedDatasetId, onUseDataset, onViewData,
  onOpenContext, onGoToRecommendation, nav, currentStage, onBack, onNext, showToast,
}) => {
  const allDatasets = [...datasets, ...SEED_DATASETS.filter(sd => !datasets.find(d => d.id === sd.id))];
  const l1 = allDatasets.find(d => d.fidelityLevel === 'L1') ?? SEED_DATASETS[0];
  const activeDataset = allDatasets.find(d => d.id === engagement.currentDatasetId);
  const justGenerated = justGeneratedDatasetId ? allDatasets.find(d => d.id === justGeneratedDatasetId) : null;
  const hasDataset = !!activeDataset;

  const downloadSampleCSV = (dsName: string) => {
    const headers = ['receivable_id', 'business_partner_id', 'invoice_date', 'due_date', 'invoice_amount', 'currency', 'late_payment_flag'];
    const rows = Array.from({ length: 20 }, (_, i) => [
      `REC-${String(i + 1).padStart(5, '0')}`, `BP-${String(Math.floor(i / 3) + 1).padStart(4, '0')}`,
      '2024-01-15', '2024-02-14', (1200 + i * 340).toFixed(2), 'EUR', i % 6 === 0 ? 'true' : 'false',
    ].join(','));
    downloadBlob([headers.join(','), ...rows].join('\n'), `${dsName}-sample.csv`, 'text/csv');
  };

  return (
    <div>
      <Title level="H3" style={{ marginBottom: SP.s }}>Prototype Data</Title>
      <Text style={{ display: 'block', color: 'var(--sapContent_LabelColor)', marginBottom: SP.m }}>
        Choose a fidelity level. Start with L1 — no customer data needed.
      </Text>

      {/* Just-generated success state — STAYS here, does not navigate away */}
      {justGenerated && (
        <div style={{ background: 'var(--sapSuccessBackground)', border: '1px solid var(--sapPositiveBorderColor)', borderRadius: 8, padding: SP.m, marginBottom: SP.m }}>
          <Title level="H4" style={{ marginBottom: SP.xs, color: 'var(--sapPositiveColor)' }}>Dataset Generated</Title>
          <Text style={{ display: 'block', marginBottom: SP.xs }}><strong>{justGenerated.name}</strong></Text>
          <FlexBox gap={SP.l} style={{ marginBottom: SP.s, flexWrap: 'wrap' }}>
            <Text style={{ fontSize: '0.875rem' }}>{justGenerated.fidelityLevel}</Text>
            <Text style={{ fontSize: '0.875rem', color: 'var(--sapContent_LabelColor)' }}>{justGenerated.qualityStatus}</Text>
            {Object.entries(justGenerated.recordCounts).map(([k, v]) => (
              <Text key={k} style={{ fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)' }}>
                {v.toLocaleString()} {k}
              </Text>
            ))}
          </FlexBox>
          <FlexBox gap={SP.s} style={{ flexWrap: 'wrap', marginBottom: SP.m }}>
            <Button design="Transparent" icon="download" onClick={() => downloadSampleCSV(justGenerated.name)}>Download CSV</Button>
            <Button design="Transparent" onClick={() => onViewData(justGenerated.id)}>View Data</Button>
            <Button design="Default" onClick={() => { onUseDataset(justGenerated.id); showToast('Dataset set as active'); }}>
              Use for Prototype
            </Button>
          </FlexBox>
          <div style={{ borderTop: '1px solid var(--sapPositiveBorderColor)', paddingTop: SP.s }}>
            <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.s }}>What next?</Text>
            <FlexBox gap={SP.s} style={{ flexWrap: 'wrap' }}>
              <Button design="Emphasized" onClick={onGoToRecommendation}>
                Continue to Recommendation →
              </Button>
              <Button design="Default" onClick={onOpenContext}>+ Add Customer Context</Button>
              <Button design="Transparent" onClick={() => nav('generate')}>Regenerate Dataset</Button>
            </FlexBox>
          </div>
        </div>
      )}

      {/* Active dataset (not just generated) */}
      {activeDataset && !justGenerated && (
        <MessageStrip design="Positive" hideCloseButton style={{ marginBottom: SP.m }}>
          Active: <strong>{activeDataset.name}</strong> — {activeDataset.fidelityLevel} · {activeDataset.qualityStatus}
          <Button design="Transparent" style={{ marginLeft: SP.s }} onClick={() => onViewData(activeDataset.id)}>View Data</Button>
          <Button design="Transparent" style={{ marginLeft: SP.xs }} icon="download" onClick={() => downloadSampleCSV(activeDataset.name)}>Download CSV</Button>
        </MessageStrip>
      )}

      {/* Fidelity level cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: SP.m, marginBottom: SP.m }}>
        {FIDELITY_LEVELS.map(fl => {
          const isL1 = fl.level === 'L1';
          return (
            <div key={fl.level} style={{ background: 'var(--sapBaseColor)', border: `2px solid ${isL1 ? 'var(--sapHighlightColor)' : 'var(--sapGroup_TitleBorderColor)'}`, borderRadius: 8, padding: SP.m }}>
              <FlexBox gap={SP.xs} alignItems="Center" style={{ marginBottom: SP.xs }}>
                <ObjectStatus state={fl.status as any} style={{ fontWeight: 700 }}>{fl.level}</ObjectStatus>
                <Text style={{ fontWeight: 700 }}>{fl.title}</Text>
              </FlexBox>
              <Text style={{ fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)', lineHeight: 1.5, display: 'block', marginBottom: SP.s }}>{fl.desc}</Text>
              <Text style={{ fontSize: '0.75rem', color: 'var(--sapContent_LabelColor)', display: 'block', marginBottom: SP.s }}><strong>Needs:</strong> {fl.dataNeeded}</Text>
              {isL1 ? (
                <FlexBox gap={SP.xs} style={{ flexWrap: 'wrap' }}>
                  <Button design="Emphasized" style={{ fontSize: '0.8125rem' }} onClick={() => { onUseDataset(l1.id); showToast('L1 dataset activated'); }}>Use This</Button>
                  <Button design="Default" style={{ fontSize: '0.8125rem' }} icon="download" onClick={() => downloadSampleCSV(l1.name)}>Download CSV</Button>
                  <Button design="Transparent" style={{ fontSize: '0.8125rem' }} onClick={() => onViewData(l1.id)}>View Data</Button>
                </FlexBox>
              ) : (
                <Button design="Default" style={{ fontSize: '0.8125rem' }} onClick={() => nav('generate')}>Configure &amp; Generate</Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Data Access Readiness summary (informational — non-blocking) */}
      {(() => {
        const summary = getDataAccessSummary();
        const pct = Math.round(((summary.candidate + summary.validated) / summary.totalRequired) * 100);
        return (
          <div style={{ background: 'var(--sapField_Background)', border: '1px solid var(--sapGroup_TitleBorderColor)', borderRadius: 8, padding: SP.m, marginBottom: SP.m }}>
            <FlexBox justifyContent="SpaceBetween" alignItems="Center" style={{ marginBottom: SP.xs }}>
              <Text style={{ fontWeight: 700, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--sapContent_LabelColor)' }}>
                Real Data Access Readiness
              </Text>
              <Button design="Transparent" style={{ fontSize: '0.8125rem' }} onClick={() => nav('packDetail')}>
                View Data Access Map →
              </Button>
            </FlexBox>
            <FlexBox gap={SP.l} style={{ flexWrap: 'wrap', marginBottom: SP.xs }}>
              {[
                { label: 'Attributes', value: summary.totalRequired, color: 'var(--sapTextColor)' },
                { label: 'Candidate Mapped', value: summary.candidate, color: 'var(--sapInformationColor)' },
                { label: 'Customer-Specific', value: summary.customerSpecific, color: 'var(--sapCriticalColor)' },
                { label: 'Unresolved', value: summary.unresolved, color: 'var(--sapNegativeColor)' },
              ].map(t => (
                <div key={t.label} style={{ textAlign: 'center' }}>
                  <Text style={{ display: 'block', fontWeight: 700, fontSize: '1.125rem', color: t.color }}>{t.value}</Text>
                  <Text style={{ display: 'block', fontSize: '0.75rem', color: 'var(--sapContent_LabelColor)' }}>{t.label}</Text>
                </div>
              ))}
            </FlexBox>
            <Text style={{ fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)' }}>
              {pct}% of required attributes have an illustrative SAP access mapping. Prototype generation is not blocked by data access status.
            </Text>
          </div>
        );
      })()}

      <FlexBox gap={SP.s} style={{ marginBottom: SP.m }}>
        <Button design="Transparent" icon="customize" onClick={onOpenContext}>+ Add Customer Context</Button>
      </FlexBox>

      <WorkflowFooter currentStage={currentStage} onBack={onBack} onNext={onNext}
        nextBlocked={!hasDataset} nextBlockedReason={!hasDataset ? 'Use or generate a dataset first' : undefined} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// RECOMMENDATION CUSTOMIZER (stable — defined outside parent)
// ═══════════════════════════════════════════════════════════════════════════════
interface RecommendationCustomizerProps {
  recommendation: TechRecommendation;
  onUpdate: (updated: TechRecommendation) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}
const RecommendationCustomizer: React.FC<RecommendationCustomizerProps> = ({
  recommendation, onUpdate, onCancel, showToast,
}) => {
  const [question, setQuestion] = useState(recommendation.businessQuestion);
  const [taskType, setTaskType] = useState(recommendation.taskType);
  const [target, setTarget] = useState(recommendation.target);
  const [targetStatus, setTargetStatus] = useState(recommendation.targetStatus);
  const [selectedApproaches, setSelectedApproaches] = useState<string[]>(
    recommendation.approaches.map(a => a.approachId)
  );
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(
    recommendation.metrics.filter(m => m.recommended).map(m => m.metricKey)
  );

  const TASK_TYPES: Array<TaskType> = ['Binary Classification', 'Multiclass Classification', 'Regression', 'Ranking', 'Forecasting', 'Rules/Decisioning'];

  // Metrics filtered by task type — only show compatible metrics
  const METRICS_BY_TASK: Record<string, Array<{ key: string; label: string }>> = {
    'Binary Classification':    [{ key: 'recall', label: 'Recall (Catch Rate)' }, { key: 'precision', label: 'Precision (Accuracy of Flags)' }, { key: 'f1', label: 'F1 (Balanced)' }, { key: 'auc', label: 'AUC (Ranking Quality)' }],
    'Multiclass Classification': [{ key: 'recall', label: 'Recall' }, { key: 'precision', label: 'Precision' }, { key: 'f1', label: 'F1 (Macro)' }, { key: 'auc', label: 'AUC' }],
    'Regression':               [{ key: 'mae', label: 'MAE (Average Error)' }, { key: 'rmse', label: 'RMSE (Error Sensitivity)' }, { key: 'r2', label: 'R² (Fit Quality)' }],
    'Forecasting':              [{ key: 'mae', label: 'MAE (Average Error)' }, { key: 'rmse', label: 'RMSE (Error Sensitivity)' }],
    'Ranking':                  [{ key: 'recall', label: 'Recall at Top-K' }, { key: 'auc', label: 'AUC' }],
    'Rules/Decisioning':        [{ key: 'recall', label: 'Recall' }, { key: 'precision', label: 'Precision' }, { key: 'f1', label: 'F1' }],
  };
  const availableMetrics = METRICS_BY_TASK[taskType] ?? METRICS_BY_TASK['Binary Classification'];

  // Approaches filtered by task type — uses existing APPROACH_CATALOG.taskTypes field
  const compatibleApproachIds = APPROACH_CATALOG.filter(a => a.taskTypes.includes(taskType as TaskType)).map(a => a.id);

  const toggleApproach = (id: string) => {
    setSelectedApproaches(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };
  const toggleMetric = (key: string) => {
    setSelectedMetrics(prev => prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]);
  };

  const handleUpdate = () => {
    const updatedApproaches = recommendation.approaches
      .filter(a => selectedApproaches.includes(a.approachId))
      .concat(
        APPROACH_CATALOG
          .filter(a => selectedApproaches.includes(a.id) && !recommendation.approaches.find(ra => ra.approachId === a.id))
          .map(a => ({ approachId: a.id, name: a.name, why: a.description, label: a.label }))
      );
    const updatedMetrics = recommendation.metrics.map(m => ({
      ...m, recommended: selectedMetrics.includes(m.metricKey),
    }));
    onUpdate({
      ...recommendation,
      businessQuestion: question,
      taskType,
      target,
      targetStatus,
      approaches: updatedApproaches,
      metrics: updatedMetrics,
    });
    showToast('Recommendation updated');
  };

  return (
    <div>
      <FlexBox justifyContent="SpaceBetween" alignItems="Center" style={{ marginBottom: SP.m }}>
        <Title level="H3">Customize Recommendation</Title>
        <Button design="Transparent" onClick={onCancel}>Cancel</Button>
      </FlexBox>
      <Text style={{ display: 'block', color: 'var(--sapContent_LabelColor)', marginBottom: SP.m }}>
        Edit the current recommendation. Changes take effect when you click [Update Recommendation]. No experiment is created.
      </Text>

      <div style={{ display: 'flex', flexDirection: 'column', gap: SP.m }}>
        <div>
          <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>Business Question</Text>
          <textarea style={textareaStyle} rows={2} value={question} onChange={e => setQuestion(e.target.value)}
            onFocus={e => { e.target.style.borderColor = 'var(--sapField_ActiveBorderColor)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--sapField_BorderColor)'; }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: SP.m }}>
          <div>
            <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>Task Type</Text>
            <select style={{ ...selectStyle, width: '100%' }} value={taskType} onChange={e => setTaskType(e.target.value as TaskType)}>
              {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>Target Field</Text>
            <input style={inputStyle} value={target} onChange={e => setTarget(e.target.value)}
              onFocus={e => { e.target.style.borderColor = 'var(--sapField_ActiveBorderColor)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--sapField_BorderColor)'; }} />
          </div>
          <div>
            <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>Target Availability</Text>
            <select style={{ ...selectStyle, width: '100%' }} value={targetStatus} onChange={e => setTargetStatus(e.target.value as any)}>
              <option value="Available">Available</option>
              <option value="Derivable">Derivable</option>
              <option value="Missing">Missing</option>
            </select>
          </div>
        </div>

        <div>
          <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.s }}>Approaches to Evaluate</Text>
          <Text style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)', marginBottom: SP.s }}>
            Showing approaches compatible with {taskType}
          </Text>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: SP.s }}>
            {APPROACH_CATALOG.filter(a => compatibleApproachIds.includes(a.id)).map(a => (
              <label key={a.id} style={{ display: 'flex', gap: SP.s, alignItems: 'center', cursor: 'pointer', padding: SP.s, borderRadius: 6, border: `1px solid ${selectedApproaches.includes(a.id) ? 'var(--sapHighlightColor)' : 'var(--sapGroup_TitleBorderColor)'}`, background: selectedApproaches.includes(a.id) ? 'var(--sapHighlightBackground, #e8f1ff)' : 'transparent' }}>
                <input type="checkbox" checked={selectedApproaches.includes(a.id)} onChange={() => toggleApproach(a.id)} />
                <div>
                  <Text style={{ fontWeight: 600, fontSize: '0.875rem', display: 'block' }}>{a.name}</Text>
                  <ObjectStatus state={a.isReal ? 'Positive' : 'Information'} style={{ fontSize: '0.75rem' }}>{a.label}</ObjectStatus>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.s }}>Metrics</Text>
          <Text style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)', marginBottom: SP.s }}>
            Showing metrics compatible with {taskType}
          </Text>
          <FlexBox gap={SP.s} style={{ flexWrap: 'wrap' }}>
            {availableMetrics.map(m => (
              <label key={m.key} style={{ display: 'flex', gap: SP.xs, alignItems: 'center', cursor: 'pointer', padding: `4px ${SP.s}`, borderRadius: 6, border: `1px solid ${selectedMetrics.includes(m.key) ? 'var(--sapHighlightColor)' : 'var(--sapGroup_TitleBorderColor)'}`, background: selectedMetrics.includes(m.key) ? 'var(--sapHighlightBackground, #e8f1ff)' : 'transparent' }}>
                <input type="checkbox" checked={selectedMetrics.includes(m.key)} onChange={() => toggleMetric(m.key)} />
                <Text style={{ fontSize: '0.875rem' }}>{m.label}</Text>
              </label>
            ))}
          </FlexBox>
        </div>
      </div>

      <FlexBox gap={SP.m} style={{ marginTop: SP.l }}>
        <Button design="Emphasized" onClick={handleUpdate}>Update Recommendation</Button>
        <Button design="Default" onClick={onCancel}>Cancel</Button>
      </FlexBox>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PANEL 3 — Recommendation
// ═══════════════════════════════════════════════════════════════════════════════
interface RecommendationPanelProps {
  engagement: Engagement; datasets: DatasetRecord[];
  recInput: string; setRecInput: (v: string) => void;
  recLoading: boolean; recStep: string;
  recommendation: TechRecommendation | null;
  customizing: boolean; setCustomizing: (v: boolean) => void;
  askingDifferent: boolean; setAskingDifferent: (v: boolean) => void;
  onGetRecommendation: (question: string) => void;
  onUpdateRecommendation: (updated: TechRecommendation) => void;
  onClearRecommendation: () => void;
  onAccept: (rec: TechRecommendation) => void;
  currentStage: EngagementStage; onBack: () => void; onNext: () => void;
  showToast: (msg: string) => void;
}
const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  engagement, datasets, recInput, setRecInput, recLoading, recStep,
  recommendation, customizing, setCustomizing, askingDifferent, setAskingDifferent,
  onGetRecommendation, onUpdateRecommendation, onClearRecommendation, onAccept,
  currentStage, onBack, onNext, showToast,
}) => {
  const allDatasets = [...datasets, ...SEED_DATASETS.filter(sd => !datasets.find(d => d.id === sd.id))];
  const evidenceSources = [
    { label: 'Business Problem', available: !!engagement.businessProblem?.trim() },
    { label: `Pack: ${PACK_NAMES[engagement.packId] ?? engagement.packId}`, available: !!engagement.packId && engagement.packId !== 'none' },
    { label: `Dataset: ${allDatasets.find(d => d.id === engagement.currentDatasetId)?.name ?? 'Not selected'}`, available: !!engagement.currentDatasetId },
    { label: `Customer Context: ${engagement.customerContextAnalysis ? `${engagement.customerContextAnalysis.items.length} signals` : 'None'}`, available: !!engagement.customerContextAnalysis },
    { label: `Customer Interest: ${engagement.customerSignal ?? 'Not set'}`, available: !!engagement.customerSignal && engagement.customerSignal !== 'Early Stage' },
    { label: `Feedback notes`, available: !!engagement.customerFeedbackNotes?.trim() },
  ];

  // Customizer mode
  if (customizing && recommendation) {
    return (
      <RecommendationCustomizer
        recommendation={recommendation}
        onUpdate={updated => { onUpdateRecommendation(updated); setCustomizing(false); }}
        onCancel={() => setCustomizing(false)}
        showToast={showToast}
      />
    );
  }

  // Ask different question mode
  if (askingDifferent) {
    return (
      <div>
        <FlexBox justifyContent="SpaceBetween" alignItems="Center" style={{ marginBottom: SP.m }}>
          <Title level="H3">Ask a Different Question</Title>
          <Button design="Transparent" onClick={() => setAskingDifferent(false)}>Cancel</Button>
        </FlexBox>
        <Text style={{ display: 'block', color: 'var(--sapContent_LabelColor)', marginBottom: SP.m }}>
          Select a common question or type your own.
        </Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: SP.s, marginBottom: SP.m }}>
          {QUESTION_TEMPLATES.map(qt => (
            <button key={qt.id} onClick={() => { setRecInput(qt.question); setAskingDifferent(false); onClearRecommendation(); }}
              style={{ padding: SP.m, borderRadius: 8, border: '1px solid var(--sapGroup_TitleBorderColor)', background: 'var(--sapField_Background)', color: 'var(--sapTextColor)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--sapFontFamily)', fontSize: '0.875rem' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--sapHighlightColor)'; (e.currentTarget as HTMLElement).style.background = 'var(--sapHighlightBackground, #e8f1ff)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--sapGroup_TitleBorderColor)'; (e.currentTarget as HTMLElement).style.background = 'var(--sapField_Background)'; }}>
              <Text style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>{qt.question}</Text>
              <Text style={{ fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)' }}>{qt.businessObjective}</Text>
            </button>
          ))}
        </div>
        <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>Or ask your own question:</Text>
        <textarea style={{ ...textareaStyle, marginBottom: SP.m }} rows={2} value={recInput} onChange={e => setRecInput(e.target.value)}
          placeholder="e.g. Which customers are most likely to pay late?"
          onFocus={e => { e.target.style.borderColor = 'var(--sapField_ActiveBorderColor)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--sapField_BorderColor)'; }} />
        <Button design="Emphasized" disabled={!recInput.trim()} onClick={() => {
          setAskingDifferent(false);
          onClearRecommendation();
          onGetRecommendation(recInput);
        }}>
          Generate Recommendation
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Title level="H3" style={{ marginBottom: SP.s }}>Technical Recommendation</Title>

      {/* Evidence panel */}
      <div style={{ background: 'var(--sapField_Background)', border: '1px solid var(--sapGroup_TitleBorderColor)', borderRadius: 8, padding: SP.m, marginBottom: SP.m }}>
        <Text style={{ fontWeight: 700, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--sapContent_LabelColor)', display: 'block', marginBottom: SP.xs }}>
          Recommendation Based On
        </Text>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: SP.m }}>
          {evidenceSources.map(src => (
            <FlexBox key={src.label} gap="4px" alignItems="Center">
              <Icon name={src.available ? 'accept' : 'warning'} style={{ fontSize: '0.875rem', color: src.available ? 'var(--sapPositiveColor)' : 'var(--sapField_BorderColor)' }} />
              <Text style={{ fontSize: '0.8125rem', color: src.available ? 'var(--sapTextColor)' : 'var(--sapContent_LabelColor)' }}>{src.label}</Text>
            </FlexBox>
          ))}
        </div>
      </div>

      {!recommendation && (
        <>
          <Text style={{ display: 'block', color: 'var(--sapContent_LabelColor)', marginBottom: SP.s }}>What is the customer asking us to solve?</Text>
          <textarea style={{ ...textareaStyle, marginBottom: SP.m }} rows={3} value={recInput} onChange={e => setRecInput(e.target.value)}
            placeholder={`e.g. "Which accounts should collectors prioritize this week?"`}
            onFocus={e => { e.target.style.borderColor = 'var(--sapField_ActiveBorderColor)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--sapField_BorderColor)'; }} />
          <Button design="Emphasized" icon="ai" disabled={!recInput.trim() || recLoading} onClick={() => onGetRecommendation(recInput)}>
            Get Recommendation
          </Button>
        </>
      )}

      <div style={{ marginTop: recommendation ? 0 : SP.m }}>
        <TechRecommendationPanel
          recommendation={recommendation}
          loading={recLoading}
          progressStep={recStep}
          onAccept={() => recommendation && onAccept(recommendation)}
          onCustomize={() => setCustomizing(true)}
          onAskDifferent={() => { setAskingDifferent(true); }}
        />
        {recommendation && (
          <Button design="Transparent" style={{ marginTop: SP.s }} onClick={onClearRecommendation}>← Start Over</Button>
        )}
      </div>

      <WorkflowFooter currentStage={currentStage} onBack={onBack} onNext={onNext}
        nextBlocked={!recommendation} nextBlockedReason={!recommendation ? 'Accept a recommendation to proceed' : undefined} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PANEL 4 — Experiment (with approach selector + run-all + completion state)
// ═══════════════════════════════════════════════════════════════════════════════
interface ExperimentPanelProps {
  engagement: Engagement; experiments: Experiment[];
  runs: RunRecord[]; onAddRun: (run: RunRecord) => void;
  nav: (v: SyntheticView) => void;
  currentStage: EngagementStage; onBack: () => void; onNext: () => void;
  showToast: (msg: string) => void;
}
const ExperimentPanel: React.FC<ExperimentPanelProps> = ({
  engagement, experiments, runs, onAddRun, nav, currentStage, onBack, onNext, showToast,
}) => {
  const exp = experiments.find(e => e.id === engagement.experimentId);
  const expRuns = runs.filter(r => r.experimentId === exp?.id && r.status === 'Completed');
  const bestRun = expRuns.length > 0 ? expRuns.reduce((b, r) => (r.metrics.f1 ?? 0) > (b.metrics.f1 ?? 0) ? r : b) : null;

  // Approach selector state
  const recommendedApproachIds = engagement.recommendation?.approaches.map(a => a.approachId) ?? ['rules', 'logreg', 'gbm', 'rpt'];
  const [selectedApproachIds, setSelectedApproachIds] = useState<string[]>(recommendedApproachIds);
  const [runningState, setRunningState] = useState<Record<string, 'queued' | 'running' | 'done'>>({});
  const [runningAll, setRunningAll] = useState(false);
  // showSelector: true = show approach checkboxes, false = show completion state
  const [showSelector, setShowSelector] = useState(true);

  const toggleApproach = (id: string) => {
    setSelectedApproachIds(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const runApproach = useCallback((approachId: string, expId: string, datasetId: string) => {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        const approach = APPROACH_CATALOG.find(a => a.id === approachId);
        const baseMetrics: Record<string, Record<string, number>> = {
          rules: { accuracy: 0.76, precision: 0.73, recall: 0.61, f1: 0.67, auc: 0.74 },
          logreg: { accuracy: 0.83, precision: 0.80, recall: 0.74, f1: 0.77, auc: 0.85 },
          gbm: { accuracy: 0.88, precision: 0.85, recall: 0.82, f1: 0.83, auc: 0.90 },
          xgboost: { accuracy: 0.89, precision: 0.86, recall: 0.83, f1: 0.84, auc: 0.91 },
          rpt: { accuracy: 0.81, precision: 0.78, recall: 0.72, f1: 0.75, auc: 0.83 },
          rf: { accuracy: 0.85, precision: 0.82, recall: 0.78, f1: 0.80, auc: 0.87 },
          svm: { accuracy: 0.80, precision: 0.77, recall: 0.70, f1: 0.73, auc: 0.82 },
        };
        const metrics = baseMetrics[approachId] ?? { accuracy: 0.75, precision: 0.72, recall: 0.68, f1: 0.70, auc: 0.79 };
        const newRun: RunRecord = {
          id: `run-v3-${approachId}-${Date.now()}`,
          experimentId: expId,
          datasetId: datasetId ?? 'ds-northstar-l3-v1',
          featureSetId: 'fs-behavioral-v1',
          approachId,
          parameters: approach?.defaultParams ?? {},
          seed: 42,
          metrics,
          runtime: approachId === 'gbm' || approachId === 'xgboost' ? '38s' : approachId === 'logreg' ? '5s' : '<1s',
          status: 'Completed',
          isReal: approach?.isReal ?? false,
          approachLabel: approach?.label ?? 'DEMO MODEL',
          createdAt: new Date().toISOString(),
        };
        onAddRun(newRun);
        resolve();
      }, approachId === 'gbm' || approachId === 'xgboost' ? 2200 : 1400);
    });
  }, [onAddRun]);

  const handleRunAll = useCallback(async () => {
    if (!exp || selectedApproachIds.length === 0) return;
    setRunningAll(true);
    const initialState: Record<string, 'queued' | 'running' | 'done'> = {};
    selectedApproachIds.forEach(id => { initialState[id] = 'queued'; });
    setRunningState(initialState);
    for (const id of selectedApproachIds) {
      setRunningState(prev => ({ ...prev, [id]: 'running' }));
      await runApproach(id, exp.id, engagement.currentDatasetId ?? 'ds-northstar-l3-v1');
      setRunningState(prev => ({ ...prev, [id]: 'done' }));
    }
    setRunningAll(false);
    setShowSelector(false); // switch to completion state after run finishes
    showToast(`${selectedApproachIds.length} approaches completed`);
  }, [exp, selectedApproachIds, runApproach, engagement.currentDatasetId, showToast]);

  const OPTIONAL_APPROACH_IDS = ['rf', 'svm'];

  return (
    <div>
      <Title level="H3" style={{ marginBottom: SP.s }}>Experiment</Title>

      {!exp ? (
        <MessageStrip design="Information" hideCloseButton style={{ marginBottom: SP.m }}>
          No experiment created yet. Go back to Recommendation and accept a recommendation.
          <Button design="Transparent" style={{ marginLeft: SP.m }} onClick={onBack}>← Back to Recommendation</Button>
        </MessageStrip>
      ) : (
        <>
          {/* Approach selector — shown when showSelector is true and not running */}
          {showSelector && !runningAll && (
            <div style={{ marginBottom: SP.m }}>
              <Text style={{ display: 'block', fontWeight: 700, marginBottom: SP.s }}>Approaches Worth Evaluating</Text>

              {/* Recommended */}
              <Text style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)', fontWeight: 600, marginBottom: SP.xs, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Recommended by Accelerator
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: SP.s, marginBottom: SP.m }}>
                {APPROACH_CATALOG.filter(a => recommendedApproachIds.includes(a.id)).map(a => (
                  <label key={a.id} style={{ display: 'flex', gap: SP.m, alignItems: 'flex-start', cursor: 'pointer', padding: SP.m, borderRadius: 8, border: `1px solid ${selectedApproachIds.includes(a.id) ? 'var(--sapHighlightColor)' : 'var(--sapGroup_TitleBorderColor)'}`, background: selectedApproachIds.includes(a.id) ? 'var(--sapHighlightBackground, #e8f1ff)' : 'var(--sapField_Background)' }}>
                    <input type="checkbox" checked={selectedApproachIds.includes(a.id)} onChange={() => toggleApproach(a.id)} style={{ marginTop: 3, accentColor: 'var(--sapHighlightColor)' }} />
                    <div style={{ flex: 1 }}>
                      <FlexBox gap={SP.s} alignItems="Center" style={{ marginBottom: 2 }}>
                        <Text style={{ fontWeight: 700 }}>{a.name}</Text>
                        <ObjectStatus state={a.isReal ? 'Positive' : 'Information'} style={{ fontSize: '0.75rem' }}>{a.label}</ObjectStatus>
                      </FlexBox>
                      <Text style={{ fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)' }}>{a.description}</Text>
                    </div>
                  </label>
                ))}
              </div>

              {/* Optional */}
              <Text style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)', fontWeight: 600, marginBottom: SP.xs, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Optional Approaches
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: SP.s, marginBottom: SP.l }}>
                {APPROACH_CATALOG.filter(a => OPTIONAL_APPROACH_IDS.includes(a.id)).map(a => (
                  <label key={a.id} style={{ display: 'flex', gap: SP.m, alignItems: 'flex-start', cursor: 'pointer', padding: SP.m, borderRadius: 8, border: `1px solid ${selectedApproachIds.includes(a.id) ? 'var(--sapHighlightColor)' : 'var(--sapGroup_TitleBorderColor)'}`, background: selectedApproachIds.includes(a.id) ? 'var(--sapHighlightBackground, #e8f1ff)' : 'transparent' }}>
                    <input type="checkbox" checked={selectedApproachIds.includes(a.id)} onChange={() => toggleApproach(a.id)} style={{ marginTop: 3, accentColor: 'var(--sapHighlightColor)' }} />
                    <div style={{ flex: 1 }}>
                      <FlexBox gap={SP.s} alignItems="Center" style={{ marginBottom: 2 }}>
                        <Text style={{ fontWeight: 600 }}>{a.name}</Text>
                        <ObjectStatus state={a.isReal ? 'Positive' : 'Information'} style={{ fontSize: '0.75rem' }}>{a.label}</ObjectStatus>
                      </FlexBox>
                      <Text style={{ fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)' }}>{a.description}</Text>
                    </div>
                  </label>
                ))}
              </div>

              {/* Single Run CTA */}
              <div style={{ background: 'var(--sapBaseColor)', border: '1px solid var(--sapGroup_TitleBorderColor)', borderRadius: 8, padding: SP.m }}>
                <Button
                  design="Emphasized"
                  disabled={selectedApproachIds.length === 0}
                  onClick={handleRunAll}
                  style={{ fontSize: '1rem' }}
                >
                  Run {selectedApproachIds.length > 0 ? selectedApproachIds.length : ''} Selected Approach{selectedApproachIds.length === 1 ? '' : 'es'}
                </Button>
                {selectedApproachIds.length === 0 && (
                  <Text style={{ display: 'block', marginTop: SP.xs, fontSize: '0.8125rem', color: 'var(--sapCriticalColor)' }}>
                    Select at least one approach
                  </Text>
                )}
              </div>
            </div>
          )}

          {/* Run progress */}
          {runningAll && (
            <div style={{ background: 'var(--sapBaseColor)', border: '1px solid var(--sapGroup_TitleBorderColor)', borderRadius: 8, padding: SP.m, marginBottom: SP.m }}>
              <Title level="H4" style={{ marginBottom: SP.m }}>Running Experiment</Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: SP.s }}>
                {selectedApproachIds.map(id => {
                  const state = runningState[id];
                  const approach = APPROACH_CATALOG.find(a => a.id === id);
                  return (
                    <FlexBox key={id} gap={SP.m} alignItems="Center">
                      <div style={{ width: 20, flexShrink: 0 }}>
                        {state === 'done' && <Icon name="accept" style={{ color: 'var(--sapPositiveColor)', fontSize: '1rem' }} />}
                        {state === 'running' && <BusyIndicator active size="XS" />}
                        {state === 'queued' && <Icon name="pending" style={{ color: 'var(--sapContent_LabelColor)', fontSize: '1rem' }} />}
                      </div>
                      <Text style={{ fontWeight: state === 'running' ? 700 : 400 }}>{approach?.name ?? id}</Text>
                      <Text style={{ fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)' }}>
                        {state === 'done' ? 'Complete' : state === 'running' ? 'Running...' : 'Queued'}
                      </Text>
                    </FlexBox>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completion state — shown when runs exist and selector is hidden */}
          {expRuns.length > 0 && !runningAll && !showSelector && (
            <div style={{ background: 'var(--sapSuccessBackground)', border: '1px solid var(--sapPositiveBorderColor)', borderRadius: 8, padding: SP.m, marginBottom: SP.m }}>
              <Title level="H4" style={{ marginBottom: SP.s, color: 'var(--sapPositiveColor)' }}>
                {expRuns.length} Approach{expRuns.length !== 1 ? 'es' : ''} Completed
              </Title>
              {bestRun && (
                <Text style={{ display: 'block', marginBottom: SP.s }}>
                  Leading candidate: <strong>{APPROACH_CATALOG.find(a => a.id === bestRun.approachId)?.name ?? bestRun.approachId}</strong>
                  {' '}— F1: {(bestRun.metrics.f1 ?? 0).toFixed(2)}, AUC: {(bestRun.metrics.auc ?? 0).toFixed(2)}
                </Text>
              )}
              <FlexBox gap={SP.s} style={{ flexWrap: 'wrap' }}>
                <Button design="Emphasized" icon="compare" onClick={() => nav('experimentWorkspace')}>
                  Compare Results →
                </Button>
                <Button design="Default" onClick={onNext}>
                  Continue to Engineering Handoff →
                </Button>
                <Button design="Transparent" onClick={() => {
                  setSelectedApproachIds(recommendedApproachIds);
                  setShowSelector(true); // re-show the selector
                }}>
                  Run More Approaches
                </Button>
              </FlexBox>
            </div>
          )}

          {showSelector && expRuns.length === 0 && !runningAll && (
            <Button design="Transparent" icon="lab" onClick={() => nav('experimentWorkspace')} style={{ marginBottom: SP.m }}>
              Open Full Experiment Workspace
            </Button>
          )}
        </>
      )}

      <WorkflowFooter currentStage={currentStage} onBack={onBack} onNext={onNext}
        nextBlocked={!exp || expRuns.length === 0}
        nextBlockedReason={!exp ? 'Create an experiment first' : expRuns.length === 0 ? 'Run at least one approach first' : undefined} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PANEL 5 — Handoff
// ═══════════════════════════════════════════════════════════════════════════════
interface HandoffPanelProps {
  engagement: Engagement; recommendation: TechRecommendation | null;
  experiments: Experiment[]; runs: RunRecord[]; datasets: DatasetRecord[];
  showToast: (msg: string) => void;
  currentStage: EngagementStage; onBack: () => void; onNext: () => void;
}
const HandoffPanel: React.FC<HandoffPanelProps> = ({
  engagement, recommendation, experiments, runs, datasets, showToast, currentStage, onBack, onNext,
}) => {
  const exp = experiments.find(e => e.id === engagement.experimentId) ?? null;
  const allDatasets = [...datasets, ...SEED_DATASETS.filter(sd => !datasets.find(d => d.id === sd.id))];
  return (
    <div>
      <FlexBox justifyContent="SpaceBetween" alignItems="Center" style={{ marginBottom: SP.m }}>
        <Title level="H3">Engineering Handoff</Title>
        <FlexBox gap={SP.s}>
          <Button design="Default" icon="copy" onClick={() => {
            const md = generateHandoffMarkdown(engagement, recommendation, exp, runs, allDatasets);
            navigator.clipboard?.writeText(md); showToast('Handoff copied to clipboard');
          }}>Copy</Button>
          <Button design="Default" icon="download" onClick={() => {
            const md = generateHandoffMarkdown(engagement, recommendation, exp, runs, allDatasets);
            downloadBlob(md, `${engagement.name.replace(/\s+/g, '-')}-handoff.md`, 'text/markdown');
          }}>Download .md</Button>
          <Button design="Default" icon="table-view" onClick={() => {
            const csv = generateDataAccessCSV(recommendation, engagement.name);
            if (csv) downloadBlob(csv, `${engagement.name.replace(/\s+/g, '-')}-data-access.csv`, 'text/csv');
            else showToast('Accept a recommendation first to export data access map');
          }}>Download Data Access Map (.csv)</Button>
        </FlexBox>
      </FlexBox>
      <div style={{ background: 'var(--sapBaseColor)', border: '1px solid var(--sapGroup_TitleBorderColor)', borderRadius: 8, padding: SP.l }}>
        <EngineeringHandoff engagement={engagement} recommendation={recommendation} experiment={exp} runs={runs} datasets={allDatasets} />
      </div>
      <WorkflowFooter currentStage={currentStage} onBack={onBack} onNext={onNext} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Customer Context page (standalone)
// ═══════════════════════════════════════════════════════════════════════════════
interface CustomerContextPageProps {
  engagement: Engagement; onUpdateEngagement: (e: Engagement) => void;
  onBack: () => void; nav: (v: SyntheticView) => void; showToast: (msg: string) => void;
}
const CustomerContextPage: React.FC<CustomerContextPageProps> = ({
  engagement, onUpdateEngagement, onBack, nav, showToast,
}) => {
  const [contextText, setContextText] = useState(engagement.customerContextRaw ?? '');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const analysis = engagement.customerContextAnalysis;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    const text = (name.includes('opportunit') || name.includes('inventor') || name.includes('discovery'))
      ? SIMULATED_OPPORTUNITY_CONTEXT : `Uploaded: ${file.name}\n\nPaste or type key details below.`;
    setContextText(prev => prev ? `${prev}\n\n${text}` : text);
    showToast(`File "${file.name}" loaded`);
    e.target.value = '';
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: SP.l }}>
      <FlexBox gap={SP.s} alignItems="Center" style={{ marginBottom: SP.m }}>
        <Button design="Transparent" icon="nav-back" onClick={onBack} />
        <Title level="H3">Customer Context</Title>
      </FlexBox>
      <Text style={{ display: 'block', color: 'var(--sapContent_LabelColor)', marginBottom: SP.m }}>
        Add what you've learned from the customer at any point. This information improves your dataset and recommendation.
      </Text>
      <FlexBox gap={SP.s} style={{ marginBottom: SP.s, flexWrap: 'wrap' }}>
        <Button icon="upload" onClick={() => document.getElementById('ctx-file-input')?.click()}>Upload Document</Button>
        <Text style={{ fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)', alignSelf: 'center' }}>PDF, DOCX, XLSX, PPTX, CSV</Text>
      </FlexBox>
      <input id="ctx-file-input" type="file" accept=".pdf,.docx,.xlsx,.pptx,.csv,.txt" style={{ display: 'none' }} onChange={handleFileUpload} />
      <textarea style={{ ...textareaStyle, marginBottom: SP.m }} rows={8} value={contextText} onChange={e => setContextText(e.target.value)}
        placeholder={`e.g. "Customer has 18% late payment rate and a custom promise-to-pay field (ZZ_PROMISE_TO_PAY)."`}
        onFocus={e => { e.target.style.borderColor = 'var(--sapField_ActiveBorderColor)'; }}
        onBlur={e => { e.target.style.borderColor = 'var(--sapField_BorderColor)'; }} />
      {analyzing ? (
        <FlexBox direction="Column" alignItems="Center" gap={SP.s} style={{ padding: SP.m }}>
          <BusyIndicator active size="M" />
          <Text style={{ color: 'var(--sapContent_LabelColor)' }}>{analysisStep}</Text>
        </FlexBox>
      ) : (
        <Button design="Emphasized" icon="ai" disabled={!contextText.trim()} onClick={async () => {
          setAnalyzing(true);
          try {
            const result = await analyzeCustomerContext(contextText, p => setAnalysisStep(p.step));
            onUpdateEngagement({ ...engagement, customerContextRaw: contextText, customerContextAnalysis: result });
            showToast('Context analyzed');
          } finally { setAnalyzing(false); }
        }}>Analyze Context</Button>
      )}
      {analysis && (
        <div style={{ marginTop: SP.m }}>
          <MessageStrip design="Positive" hideCloseButton style={{ marginBottom: SP.m }}>{analysis.summary}</MessageStrip>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: SP.s, marginBottom: SP.m }}>
            {analysis.items.map((item, i) => (
              <div key={i} style={{ background: 'var(--sapField_Background)', border: '1px solid var(--sapGroup_TitleBorderColor)', borderRadius: 8, padding: SP.m }}>
                <FlexBox gap={SP.xs} alignItems="Center" style={{ marginBottom: SP.xs }}>
                  <ObjectStatus state="Information" style={{ fontSize: '0.75rem' }}>{item.fidelityLevel}</ObjectStatus>
                  <Text style={{ fontWeight: 700, fontSize: '0.875rem' }}>{item.label}</Text>
                </FlexBox>
                <Text style={{ fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)', lineHeight: 1.5 }}>{item.detail}</Text>
              </div>
            ))}
          </div>
          <MessageStrip design="Information" hideCloseButton style={{ marginBottom: SP.m }}>
            Recommended dataset upgrade: {analysis.suggestedFidelityUpgrade}
          </MessageStrip>
          <FlexBox gap={SP.s}>
            <Button design="Emphasized" onClick={() => { onUpdateEngagement({ ...engagement, customerContextRaw: contextText, customerContextAnalysis: analysis }); nav('generate'); showToast('Opening generator'); }}>
              Apply &amp; Generate Updated Dataset
            </Button>
            <Button design="Default" onClick={() => { onUpdateEngagement({ ...engagement, customerContextRaw: contextText, customerContextAnalysis: analysis }); onBack(); showToast('Context saved'); }}>
              Save &amp; Return
            </Button>
          </FlexBox>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT: EngagementWorkspace
// ═══════════════════════════════════════════════════════════════════════════════
interface Props {
  nav: (v: SyntheticView) => void;
  engagement: Engagement | null;
  showContextPage: boolean;
  datasets: DatasetRecord[];
  experiments: Experiment[];
  runs: RunRecord[];
  packVersions: PackVersion[];
  justGeneratedDatasetId: string | null;
  onUpdateEngagement: (updated: Engagement) => void;
  onCreateExperiment: (exp: Experiment) => void;
  onAddRun: (run: RunRecord) => void;
  showToast: (msg: string) => void;
  onOpenContext: () => void;
  onCloseContext: () => void;
  openDataset: (id: string) => void;
}

const EngagementWorkspace: React.FC<Props> = ({
  nav, engagement, showContextPage, datasets, experiments, runs,
  justGeneratedDatasetId, onUpdateEngagement, onCreateExperiment, onAddRun, showToast,
  onOpenContext, onCloseContext, openDataset,
}) => {
  const [activeStage, setActiveStage] = useState<EngagementStage>(engagement?.stage ?? 'use-case');

  // Form state — all at root level, never inside panels
  const [customer, setCustomer] = useState(engagement?.customer ?? '');
  const [useCaseName, setUseCaseName] = useState(engagement?.useCaseName ?? '');
  const [businessProblem, setBusinessProblem] = useState(engagement?.businessProblem ?? '');
  const [neoNotes, setNeoNotes] = useState(engagement?.neoNotes ?? '');
  const [selectedPackId, setSelectedPackId] = useState(engagement?.packId ?? 'collections-v1');
  const [customerSignal, setCustomerSignal] = useState<Engagement['customerSignal']>(engagement?.customerSignal ?? null);
  const [feedbackNotes, setFeedbackNotes] = useState(engagement?.customerFeedbackNotes ?? '');
  const [recInput, setRecInput] = useState(engagement?.recommendationInput || engagement?.businessProblem || '');
  const [recLoading, setRecLoading] = useState(false);
  const [recStep, setRecStep] = useState('');
  const [recommendation, setRecommendation] = useState<TechRecommendation | null>(engagement?.recommendation ?? null);
  const [customizing, setCustomizing] = useState(false);
  const [askingDifferent, setAskingDifferent] = useState(false);

  if (!engagement) {
    return (
      <FlexBox direction="Column" alignItems="Center" justifyContent="Center" style={{ padding: SP.xl, gap: SP.m }}>
        <Text>No engagement selected.</Text>
        <Button design="Default" onClick={() => nav('engagements')}>Back to Engagements</Button>
      </FlexBox>
    );
  }

  const currentIdx = STAGE_IDX[activeStage] ?? 0;

  const goBack = () => { if (currentIdx > 0) setActiveStage(STAGES[currentIdx - 1].key); };
  const goNext = () => {
    if (currentIdx < STAGES.length - 1) {
      const next = STAGES[currentIdx + 1].key;
      setActiveStage(next);
      if ((STAGE_IDX[next] ?? 0) > (STAGE_IDX[engagement.stage] ?? 0)) {
        onUpdateEngagement({ ...engagement, stage: next });
      }
    }
  };

  const handleSaveUseCase = () => {
    onUpdateEngagement({ ...engagement, customer, useCaseName, businessProblem, neoNotes, packId: selectedPackId });
    setActiveStage('prototype-data');
    showToast('Use case saved');
  };

  const handleSaveSignal = (sig: Engagement['customerSignal'], notes: string) => {
    onUpdateEngagement({ ...engagement, customerSignal: sig, customerFeedbackNotes: notes });
  };

  const handleGetRecommendation = async (question: string) => {
    setRecLoading(true);
    try {
      const rec = await getRecommendation(question, engagement.currentDatasetId, p => setRecStep(p.step));
      setRecommendation(rec);
      onUpdateEngagement({ ...engagement, recommendationInput: question, recommendation: rec });
    } finally { setRecLoading(false); }
  };

  const handleAcceptRecommendation = (rec: TechRecommendation) => {
    const newExp: Experiment = {
      id: `exp-${Date.now()}`,
      name: `${engagement.customer} — ${rec.taskType}`,
      packId: engagement.packId, packVersion: engagement.packVersion,
      customer: engagement.customer,
      taskType: rec.taskType as TaskType,
      target: rec.target, question: rec.businessQuestion,
      businessObjective: rec.understoodAs,
      featureSetIds: ['fs-behavioral-v1'],
      approachIds: rec.approaches.map(a => a.approachId),
      primaryMetric: rec.metrics.find(m => m.recommended)?.metricKey ?? 'f1',
      datasetIds: engagement.currentDatasetId ? [engagement.currentDatasetId] : [],
      runIds: [], status: 'Draft', createdAt: new Date().toISOString(),
    };
    onCreateExperiment(newExp);
    onUpdateEngagement({ ...engagement, experimentId: newExp.id, recommendation: rec, stage: 'experiment' });
    setActiveStage('experiment');
    showToast('Recommendation accepted — Experiment created');
  };

  const allDatasets = [...datasets, ...SEED_DATASETS.filter(sd => !datasets.find(d => d.id === sd.id))];
  const activeDatasetName = allDatasets.find(d => d.id === engagement.currentDatasetId)?.name;
  const contextItemCount = engagement.customerContextAnalysis?.items.length ?? 0;

  if (showContextPage) {
    return (
      <CustomerContextPage engagement={engagement} onUpdateEngagement={onUpdateEngagement}
        onBack={onCloseContext} nav={nav} showToast={showToast} />
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: SP.l }}>
      {/* Header */}
      <div style={{ background: 'var(--sapBaseColor)', border: '1px solid var(--sapGroup_TitleBorderColor)', borderRadius: 8, padding: SP.m, marginBottom: SP.m }}>
        <FlexBox justifyContent="SpaceBetween" alignItems="flex-start">
          <div>
            <FlexBox gap={SP.s} alignItems="Center" style={{ marginBottom: 4 }}>
              <Button design="Transparent" icon="nav-back" onClick={() => nav('engagements')} />
              <Title level="H3" style={{ marginBottom: 0 }}>{engagement.name || 'New Engagement'}</Title>
            </FlexBox>
            <FlexBox gap={SP.m} style={{ marginLeft: 40, flexWrap: 'wrap', marginBottom: SP.xs }}>
              {engagement.customer && <Text style={{ fontSize: '0.875rem', color: 'var(--sapContent_LabelColor)' }}>{engagement.customer}</Text>}
              {engagement.packId !== 'none' && <Text style={{ fontSize: '0.875rem', color: 'var(--sapContent_LabelColor)' }}>Pack: {PACK_NAMES[engagement.packId] ?? engagement.packId}</Text>}
              {activeDatasetName && <Text style={{ fontSize: '0.875rem', color: 'var(--sapContent_LabelColor)' }}>Dataset: {activeDatasetName}</Text>}
              {contextItemCount > 0 && <Text style={{ fontSize: '0.875rem', color: 'var(--sapContent_LabelColor)' }}>Customer Context: {contextItemCount} items</Text>}
            </FlexBox>
          </div>
          <FlexBox gap={SP.s} alignItems="Center">
            <FlexBox gap={SP.xs} alignItems="Center">
              <Text style={{ fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)', whiteSpace: 'nowrap' }}>Customer Interest:</Text>
              <select value={customerSignal ?? ''} onChange={e => {
                const val = (e.target.value || null) as Engagement['customerSignal'];
                setCustomerSignal(val);
                handleSaveSignal(val, feedbackNotes);
              }} style={{ ...selectStyle, width: 140, height: 30 }}>
                <option value="">— Not set —</option>
                <option value="Early Stage">Early Stage</option>
                <option value="Interested">Interested</option>
                <option value="Validated">Validated</option>
                <option value="Not Pursuing">Not Pursuing</option>
              </select>
            </FlexBox>
            <Button design={contextItemCount > 0 ? 'Default' : 'Transparent'} icon="customize" onClick={onOpenContext}>
              {contextItemCount > 0 ? `Context: ${contextItemCount}` : '+ Context'}
            </Button>
          </FlexBox>
        </FlexBox>
        {/* Feedback notes */}
        <details style={{ marginLeft: 40, marginTop: SP.xs }}>
          <summary style={{ fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)', cursor: 'pointer', userSelect: 'none' }}>
            Customer Feedback {feedbackNotes.trim() ? `(${feedbackNotes.trim().split('\n').filter(Boolean).length} notes)` : '(add notes)'}
          </summary>
          <textarea style={{ ...textareaStyle, marginTop: SP.xs, fontSize: '0.8125rem' }} rows={4}
            value={feedbackNotes} onChange={e => setFeedbackNotes(e.target.value)}
            onBlur={() => handleSaveSignal(customerSignal, feedbackNotes)}
            placeholder={`What did the customer like or dislike?\nDid the original business question change?\nWhat new requirements came up?\nWhat KPIs or metrics matter most?`} />
        </details>
      </div>

      {/* Stage Progress Bar */}
      <div style={{ display: 'flex', background: 'var(--sapBaseColor)', border: '1px solid var(--sapGroup_TitleBorderColor)', borderRadius: 8, marginBottom: SP.l, overflow: 'hidden' }}>
        {STAGES.map((s, i) => {
          const isDone = i < currentIdx; const isActive = i === currentIdx;
          return (
            <button key={s.key} onClick={() => setActiveStage(s.key)} style={{
              flex: 1, padding: `${SP.s} ${SP.xs}`, border: 'none',
              borderRight: i < STAGES.length - 1 ? '1px solid var(--sapGroup_TitleBorderColor)' : 'none',
              background: isActive ? 'var(--sapHighlightColor)' : isDone ? 'var(--sapSuccessBackground)' : 'transparent',
              color: isActive ? '#fff' : isDone ? 'var(--sapPositiveColor)' : 'var(--sapContent_LabelColor)',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all 0.15s',
            }}>
              <Icon name={isDone ? 'accept' : s.icon} style={{ fontSize: '1rem', color: 'inherit' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: isActive ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Panel Content */}
      <div style={{ background: 'var(--sapBaseColor)', border: '1px solid var(--sapGroup_TitleBorderColor)', borderRadius: 8, padding: SP.l, minHeight: 400 }}>
        {activeStage === 'use-case' && (
          <UseCasePanel customer={customer} setCustomer={setCustomer} useCaseName={useCaseName} setUseCaseName={setUseCaseName}
            businessProblem={businessProblem} setBusinessProblem={setBusinessProblem} neoNotes={neoNotes} setNeoNotes={setNeoNotes}
            selectedPackId={selectedPackId} setSelectedPackId={setSelectedPackId}
            onSave={handleSaveUseCase} nav={nav} currentStage={activeStage} onBack={goBack} onNext={goNext} />
        )}
        {activeStage === 'prototype-data' && (
          <PrototypeDataPanel engagement={engagement} datasets={datasets}
            justGeneratedDatasetId={justGeneratedDatasetId}
            onUseDataset={id => onUpdateEngagement({ ...engagement, currentDatasetId: id })}
            onViewData={openDataset} onOpenContext={onOpenContext}
            onGoToRecommendation={() => setActiveStage('recommendation')}
            nav={nav} currentStage={activeStage} onBack={goBack} onNext={goNext} showToast={showToast} />
        )}
        {activeStage === 'recommendation' && (
          <RecommendationPanel engagement={engagement} datasets={datasets}
            recInput={recInput} setRecInput={setRecInput}
            recLoading={recLoading} recStep={recStep}
            recommendation={recommendation}
            customizing={customizing} setCustomizing={setCustomizing}
            askingDifferent={askingDifferent} setAskingDifferent={setAskingDifferent}
            onGetRecommendation={handleGetRecommendation}
            onUpdateRecommendation={updated => { setRecommendation(updated); onUpdateEngagement({ ...engagement, recommendation: updated }); }}
            onClearRecommendation={() => setRecommendation(null)}
            onAccept={handleAcceptRecommendation}
            currentStage={activeStage} onBack={goBack} onNext={goNext} showToast={showToast} />
        )}
        {activeStage === 'experiment' && (
          <ExperimentPanel engagement={engagement} experiments={experiments} runs={runs} onAddRun={onAddRun}
            nav={nav} currentStage={activeStage} onBack={goBack} onNext={goNext} showToast={showToast} />
        )}
        {activeStage === 'handoff' && (
          <HandoffPanel engagement={engagement} recommendation={recommendation}
            experiments={experiments} runs={runs} datasets={datasets}
            showToast={showToast} currentStage={activeStage} onBack={goBack} onNext={goNext} />
        )}
      </div>
    </div>
  );
};

export default EngagementWorkspace;
