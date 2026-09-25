// @ts-nocheck
import React, { useState } from 'react';
import {
  FlexBox, Title, Text, Button, ObjectStatus, MessageStrip,
} from '@ui5/webcomponents-react';
import type { SyntheticView, ReusableLearning } from '../types';
import type { RunRecord, PackVersion } from '../../synthetic-data-v2/types';
import { SP } from '../../synthetic-data-v2/constants';

const textareaStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '8px 12px', borderRadius: 6,
  border: '1px solid var(--sapField_BorderColor)',
  background: 'var(--sapField_Background)',
  color: 'var(--sapTextColor)',
  fontSize: '0.875rem', fontFamily: 'var(--sapFontFamily)',
  resize: 'vertical', outline: 'none', lineHeight: 1.5,
};

const IMPROVEMENT_TYPES = [
  'New feature / predictor',
  'Business constraint',
  'Experiment pattern',
  'Metric / evaluation guidance',
  'Schema change',
  'Data generation rule',
  'Quality check',
  'Other',
];

const EVIDENCE_SOURCES = [
  'Experiment run',
  'Customer feedback',
  'Discovery notes',
  'Literature / best practice',
  'Other',
];

interface Props {
  packName: string;
  runs: RunRecord[];
  learnings: ReusableLearning[];
  packVersions: PackVersion[];
  onSubmit: (learning: ReusableLearning) => void;
  nav: (v: SyntheticView) => void;
  goBack: () => void;
  showToast: (msg: string) => void;
}

const PackPropose: React.FC<Props> = ({
  packName, runs, onSubmit, nav, goBack, showToast,
}) => {
  const [learningText, setLearningText] = useState('');
  const [improvementType, setImprovementType] = useState(IMPROVEMENT_TYPES[0]);
  const [evidenceSource, setEvidenceSource] = useState(EVIDENCE_SOURCES[0]);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [evidenceDetails, setEvidenceDetails] = useState('');
  const [scope, setScope] = useState<'global' | 'domain' | 'customer'>('global');
  const [submitted, setSubmitted] = useState(false);

  const completedRuns = runs.filter(r => r.status === 'Completed');

  const handleSubmit = () => {
    if (!learningText.trim()) { showToast('Please describe what you learned'); return; }

    const learning: ReusableLearning = {
      learningId: `L-${Date.now()}`,
      domain: 'AR Collections',
      text: learningText.trim(),
      capturedAt: new Date().toISOString().split('T')[0],
      source: 'user-added',
      proposedForPack: scope === 'global',
    };

    onSubmit(learning);
    setSubmitted(true);
    showToast(scope === 'global'
      ? 'Learning submitted — Pack v1.1 Draft updated'
      : 'Learning captured as customer-specific context');
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: SP.l }}>
        <Button design="Default" icon="nav-back" onClick={goBack} style={{ marginBottom: SP.l }}>
          ← Back
        </Button>
        <div style={{ background: 'var(--sapBaseColor)', border: '1px solid var(--sapPositiveBorderColor)', borderRadius: 8, padding: SP.xl, textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: SP.m }}>✓</div>
          <Title level="H3" style={{ marginBottom: SP.s }}>Learning Submitted</Title>
          <Text style={{ display: 'block', color: 'var(--sapContent_LabelColor)', marginBottom: SP.l }}>
            {scope === 'global'
              ? `Your learning has been added to the candidate queue for ${packName}. It will be reviewed before becoming part of a validated pack update.`
              : 'Your learning has been captured as customer-specific context and will not be proposed for the shared pack.'}
          </Text>
          {scope === 'global' && (
            <MessageStrip design="Positive" hideCloseButton style={{ marginBottom: SP.l, textAlign: 'left' }}>
              Pack v1.1 Draft updated with 1 new candidate learning.
            </MessageStrip>
          )}
          <FlexBox gap={SP.m} justifyContent="Center">
            <Button design="Emphasized" onClick={() => nav('knowledge')}>View in Knowledge Library</Button>
            <Button design="Default" onClick={() => { setSubmitted(false); setLearningText(''); setEvidenceDetails(''); }}>
              Submit Another
            </Button>
            <Button design="Transparent" onClick={goBack}>Done</Button>
          </FlexBox>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: SP.l }}>
      {/* Back */}
      <Button design="Default" icon="nav-back" onClick={goBack} style={{ marginBottom: SP.m }}>
        ← Back
      </Button>

      <div style={{ marginBottom: SP.m }}>
        <Title level="H2" style={{ marginBottom: SP.xs }}>Propose Pack Update</Title>
        <ObjectStatus state="Information" style={{ fontSize: '0.875rem' }}>
          {packName}
        </ObjectStatus>
      </div>

      <Text style={{ display: 'block', color: 'var(--sapContent_LabelColor)', marginBottom: SP.l }}>
        Capture what you learned that could improve this pack for future engagements.
      </Text>

      <div style={{ background: 'var(--sapBaseColor)', border: '1px solid var(--sapGroup_TitleBorderColor)', borderRadius: 8, padding: SP.l, display: 'flex', flexDirection: 'column', gap: SP.m }}>

        {/* What did we learn */}
        <div>
          <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>What did we learn? *</Text>
          <textarea
            style={textareaStyle} rows={4}
            value={learningText}
            onChange={e => setLearningText(e.target.value)}
            placeholder="e.g. Historical late-payment count is consistently the strongest predictor across customer engagements. It outweighs invoice amount by a factor of 3."
            onFocus={e => { e.target.style.borderColor = 'var(--sapField_ActiveBorderColor)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--sapField_BorderColor)'; }}
          />
        </div>

        {/* Type */}
        <div>
          <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>Type of improvement</Text>
          <select
            style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', height: 36, borderRadius: 6, border: '1px solid var(--sapField_BorderColor)', background: 'var(--sapField_Background)', color: 'var(--sapTextColor)', fontSize: '0.875rem', fontFamily: 'var(--sapFontFamily)', cursor: 'pointer', outline: 'none' }}
            value={improvementType}
            onChange={e => setImprovementType(e.target.value)}
          >
            {IMPROVEMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Evidence */}
        <div>
          <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>Evidence</Text>
          <div style={{ display: 'grid', gridTemplateColumns: completedRuns.length > 0 && evidenceSource === 'Experiment run' ? '1fr 1fr' : '1fr', gap: SP.m, marginBottom: SP.s }}>
            <div>
              <Text style={{ display: 'block', fontSize: '0.8125rem', marginBottom: SP.xs, color: 'var(--sapContent_LabelColor)' }}>Source</Text>
              <select
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', height: 36, borderRadius: 6, border: '1px solid var(--sapField_BorderColor)', background: 'var(--sapField_Background)', color: 'var(--sapTextColor)', fontSize: '0.875rem', fontFamily: 'var(--sapFontFamily)', cursor: 'pointer', outline: 'none' }}
                value={evidenceSource}
                onChange={e => setEvidenceSource(e.target.value)}
              >
                {EVIDENCE_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {evidenceSource === 'Experiment run' && completedRuns.length > 0 && (
              <div>
                <Text style={{ display: 'block', fontSize: '0.8125rem', marginBottom: SP.xs, color: 'var(--sapContent_LabelColor)' }}>Select Run</Text>
                <select
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', height: 36, borderRadius: 6, border: '1px solid var(--sapField_BorderColor)', background: 'var(--sapField_Background)', color: 'var(--sapTextColor)', fontSize: '0.875rem', fontFamily: 'var(--sapFontFamily)', cursor: 'pointer', outline: 'none' }}
                  value={selectedRunId}
                  onChange={e => setSelectedRunId(e.target.value)}
                >
                  <option value="">— Select run —</option>
                  {completedRuns.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.approachId} — F1: {(r.metrics.f1 ?? 0).toFixed(2)} · {r.id}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <textarea
            style={textareaStyle} rows={3}
            value={evidenceDetails}
            onChange={e => setEvidenceDetails(e.target.value)}
            placeholder="Supporting details, paste customer quote, or describe what you observed…"
            onFocus={e => { e.target.style.borderColor = 'var(--sapField_ActiveBorderColor)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--sapField_BorderColor)'; }}
          />
        </div>

        {/* Scope */}
        <div>
          <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.s }}>Scope</Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: SP.s }}>
            {([
              { key: 'global', label: 'Generally reusable', desc: 'This finding would benefit any engagement using this pack — propose for inclusion.' },
              { key: 'domain', label: 'Domain-specific', desc: 'Relevant to this domain but not necessarily every engagement.' },
              { key: 'customer', label: 'Customer-specific', desc: 'Relevant to this customer only — not proposed for the shared pack.' },
            ] as const).map(opt => (
              <div
                key={opt.key}
                onClick={() => setScope(opt.key)}
                style={{
                  padding: `${SP.s} ${SP.m}`, borderRadius: 6, cursor: 'pointer',
                  border: `1px solid ${scope === opt.key ? 'var(--sapHighlightColor)' : 'var(--sapGroup_TitleBorderColor)'}`,
                  background: scope === opt.key ? 'var(--sapHighlightBackground, #e8f1ff)' : 'transparent',
                  display: 'flex', gap: SP.s, alignItems: 'flex-start',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                  border: `2px solid ${scope === opt.key ? 'var(--sapHighlightColor)' : 'var(--sapField_BorderColor)'}`,
                  background: scope === opt.key ? 'var(--sapHighlightColor)' : 'transparent',
                }} />
                <div>
                  <Text style={{ fontWeight: 600, fontSize: '0.875rem' }}>{opt.label}</Text>
                  <Text style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)' }}>{opt.desc}</Text>
                </div>
              </div>
            ))}
          </div>
        </div>

        <FlexBox gap={SP.m}>
          <Button design="Emphasized" disabled={!learningText.trim()} onClick={handleSubmit}>
            Submit for Review
          </Button>
          <Button design="Transparent" onClick={() => nav('knowledge')}>
            Browse Knowledge Library
          </Button>
        </FlexBox>
      </div>
    </div>
  );
};

export default PackPropose;
