// @ts-nocheck
import React, { useState } from 'react';
import {
  FlexBox, Title, Text, Button, ObjectStatus, MessageStrip,
} from '@ui5/webcomponents-react';
import type { DraftPack, SyntheticView } from '../types';
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

interface ChecklistItem {
  key: keyof DraftPack;
  label: string;
  description: string;
  actionLabel: string;
  expandKey: string;
}

const CHECKLIST: ChecklistItem[] = [
  { key: 'name', label: 'Basic Information', description: 'Pack name, domain, description, and owner', actionLabel: 'Done', expandKey: '' },
  { key: 'hasExperiments', label: 'Business Questions / Experiments', description: 'Define the business questions and experiment targets this pack supports', actionLabel: 'Add', expandKey: 'experiments' },
  { key: 'hasSchema', label: 'Schema Definition', description: 'Define the entities, fields, and relationships for this domain', actionLabel: 'Configure', expandKey: 'schema' },
  { key: 'hasConstraints', label: 'Business Constraints', description: 'Rules the generated data must follow (e.g. due date after invoice date)', actionLabel: 'Add', expandKey: 'constraints' },
  { key: 'hasGenerationDefaults', label: 'Generation Defaults', description: 'Default rates, volumes, and distributions for synthetic data generation', actionLabel: 'Configure', expandKey: 'defaults' },
  { key: 'hasQualityChecks', label: 'Quality Checks', description: 'Define referential integrity and business rule checks for this pack', actionLabel: 'Add', expandKey: 'quality' },
];

interface Props {
  draftPack: DraftPack | null;
  onUpdate: (pack: DraftPack) => void;
  nav: (v: SyntheticView) => void;
  goBack: () => void;
  showToast: (msg: string) => void;
}

const PackDraftDetail: React.FC<Props> = ({ draftPack, onUpdate, nav, goBack, showToast }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [experimentsText, setExperimentsText] = useState(draftPack?.experiments?.join('\n') ?? '');
  const [constraintsText, setConstraintsText] = useState(draftPack?.constraints ?? '');
  const [generationNotes, setGenerationNotes] = useState(draftPack?.generationNotes ?? '');

  if (!draftPack) {
    return (
      <FlexBox direction="Column" alignItems="Center" justifyContent="Center" style={{ padding: SP.xl, gap: SP.m }}>
        <Text>No draft pack selected.</Text>
        <Button onClick={goBack}>← Back</Button>
      </FlexBox>
    );
  }

  const completedCount = CHECKLIST.filter(item => {
    if (item.key === 'name') return true;
    return !!draftPack[item.key];
  }).length;
  const totalCount = CHECKLIST.length;
  const pct = Math.round((completedCount / totalCount) * 100);

  const handleSaveSection = (section: string) => {
    if (section === 'experiments') {
      const exps = experimentsText.split('\n').map(s => s.trim()).filter(Boolean);
      onUpdate({ ...draftPack, experiments: exps, hasExperiments: exps.length > 0 });
      showToast('Experiments saved');
    } else if (section === 'constraints') {
      onUpdate({ ...draftPack, constraints: constraintsText, hasConstraints: !!constraintsText.trim() });
      showToast('Constraints saved');
    } else if (section === 'defaults') {
      onUpdate({ ...draftPack, generationNotes, hasGenerationDefaults: !!generationNotes.trim() });
      showToast('Generation defaults saved');
    } else if (section === 'schema') {
      onUpdate({ ...draftPack, hasSchema: true });
      showToast('Schema marked as configured');
    } else if (section === 'quality') {
      onUpdate({ ...draftPack, hasQualityChecks: true });
      showToast('Quality checks added');
    }
    setExpandedSection(null);
  };

  const handleValidate = () => {
    onUpdate({ ...draftPack, status: 'Ready for Review' });
    showToast('Pack marked as Ready for Review');
  };

  const isComplete = (item: ChecklistItem) => {
    if (item.key === 'name') return true;
    return !!draftPack[item.key];
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: SP.l }}>
      {/* Back */}
      <Button design="Default" icon="nav-back" onClick={goBack} style={{ marginBottom: SP.m }}>
        ← Back to Experiment Packs
      </Button>

      {/* Header */}
      <div style={{ background: 'var(--sapBaseColor)', border: '1px solid var(--sapGroup_TitleBorderColor)', borderRadius: 8, padding: SP.l, marginBottom: SP.l }}>
        <FlexBox justifyContent="SpaceBetween" alignItems="flex-start">
          <div>
            <FlexBox gap={SP.s} alignItems="Center" style={{ marginBottom: SP.xs }}>
              <Title level="H2">{draftPack.name}</Title>
              <ObjectStatus state={draftPack.status === 'Ready for Review' ? 'Information' : 'None'}>
                {draftPack.version} — {draftPack.status}
              </ObjectStatus>
            </FlexBox>
            <FlexBox gap={SP.m}>
              <Text style={{ fontSize: '0.875rem', color: 'var(--sapContent_LabelColor)' }}>Domain: {draftPack.domain}</Text>
              <Text style={{ fontSize: '0.875rem', color: 'var(--sapContent_LabelColor)' }}>Owner: {draftPack.owner}</Text>
              {draftPack.startedFrom && (
                <Text style={{ fontSize: '0.875rem', color: 'var(--sapContent_LabelColor)' }}>
                  Copied from: Collections &amp; Disputes v1.0
                </Text>
              )}
            </FlexBox>
            {draftPack.businessProblem && (
              <Text style={{ display: 'block', marginTop: SP.s, fontSize: '0.875rem' }}>{draftPack.businessProblem}</Text>
            )}
          </div>
          <FlexBox gap={SP.s}>
            <Button design="Transparent" icon="add" onClick={() => nav('packPropose')}>Propose Update</Button>
          </FlexBox>
        </FlexBox>
      </div>

      {/* Progress */}
      <div style={{ background: 'var(--sapBaseColor)', border: '1px solid var(--sapGroup_TitleBorderColor)', borderRadius: 8, padding: SP.m, marginBottom: SP.l }}>
        <FlexBox justifyContent="SpaceBetween" alignItems="Center" style={{ marginBottom: SP.s }}>
          <Text style={{ fontWeight: 700 }}>Completion: {completedCount}/{totalCount} sections</Text>
          <Text style={{ fontSize: '0.875rem', color: 'var(--sapContent_LabelColor)' }}>{pct}%</Text>
        </FlexBox>
        <div style={{ height: 8, background: 'var(--sapField_BorderColor)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--sapPositiveColor)' : 'var(--sapHighlightColor)', borderRadius: 4, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: SP.s }}>
        {CHECKLIST.map(item => {
          const done = isComplete(item);
          const isExpanded = expandedSection === item.expandKey && item.expandKey;
          return (
            <div key={item.key} style={{
              background: 'var(--sapBaseColor)',
              border: `1px solid ${done ? 'var(--sapPositiveBorderColor)' : 'var(--sapGroup_TitleBorderColor)'}`,
              borderRadius: 8, overflow: 'hidden',
            }}>
              <FlexBox justifyContent="SpaceBetween" alignItems="Center" style={{ padding: SP.m }}>
                <FlexBox gap={SP.m} alignItems="Center">
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    background: done ? 'var(--sapPositiveColor)' : 'var(--sapField_Background)',
                    border: `2px solid ${done ? 'var(--sapPositiveColor)' : 'var(--sapField_BorderColor)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '0.75rem',
                  }}>
                    {done ? '✓' : ''}
                  </div>
                  <div>
                    <Text style={{ fontWeight: 600 }}>{item.label}</Text>
                    <Text style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)' }}>{item.description}</Text>
                  </div>
                </FlexBox>
                {item.expandKey && (
                  <Button
                    design={done ? 'Transparent' : 'Default'}
                    onClick={() => setExpandedSection(isExpanded ? null : item.expandKey)}
                  >
                    {done ? 'Edit' : item.actionLabel}
                  </Button>
                )}
                {item.key === 'name' && (
                  <ObjectStatus state="Positive" style={{ fontSize: '0.8125rem' }}>Complete</ObjectStatus>
                )}
              </FlexBox>

              {/* Expanded inline form */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid var(--sapGroup_TitleBorderColor)', padding: SP.m, background: 'var(--sapField_Background)' }}>
                  {item.expandKey === 'experiments' && (
                    <>
                      <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>
                        Business questions / experiment targets (one per line)
                      </Text>
                      <textarea style={textareaStyle} rows={5} value={experimentsText}
                        onChange={e => setExperimentsText(e.target.value)}
                        placeholder={'e.g.\nWhich receivables are likely to be paid late?\nWhich accounts should collectors prioritize?'}
                        onFocus={e => { e.target.style.borderColor = 'var(--sapField_ActiveBorderColor)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--sapField_BorderColor)'; }} />
                    </>
                  )}
                  {item.expandKey === 'constraints' && (
                    <>
                      <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>
                        Business constraints (one per line)
                      </Text>
                      <textarea style={textareaStyle} rows={5} value={constraintsText}
                        onChange={e => setConstraintsText(e.target.value)}
                        placeholder={'e.g.\nEvery Receivable must reference a valid Business Partner\nDue date must be after invoice date\nDunning only on overdue receivables'}
                        onFocus={e => { e.target.style.borderColor = 'var(--sapField_ActiveBorderColor)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--sapField_BorderColor)'; }} />
                    </>
                  )}
                  {item.expandKey === 'defaults' && (
                    <>
                      <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>
                        Generation defaults and notes
                      </Text>
                      <textarea style={textareaStyle} rows={4} value={generationNotes}
                        onChange={e => setGenerationNotes(e.target.value)}
                        placeholder={'e.g.\nDefault late payment rate: 15%\nDefault dispute rate: 6%\nAverage invoice amount: €4,200'}
                        onFocus={e => { e.target.style.borderColor = 'var(--sapField_ActiveBorderColor)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--sapField_BorderColor)'; }} />
                    </>
                  )}
                  {(item.expandKey === 'schema' || item.expandKey === 'quality') && (
                    <MessageStrip design="Information" hideCloseButton>
                      {item.expandKey === 'schema'
                        ? 'Full schema editor coming in a future version. Click "Mark as Configured" to proceed.'
                        : 'Quality check editor coming in a future version. Click "Mark as Added" to proceed.'}
                    </MessageStrip>
                  )}
                  <FlexBox gap={SP.s} style={{ marginTop: SP.m }}>
                    <Button design="Emphasized" onClick={() => handleSaveSection(item.expandKey)}>
                      {item.expandKey === 'schema' ? 'Mark as Configured' : item.expandKey === 'quality' ? 'Mark as Added' : 'Save'}
                    </Button>
                    <Button design="Transparent" onClick={() => setExpandedSection(null)}>Cancel</Button>
                  </FlexBox>
                </div>
              )}
            </div>
          );
        })}

        {/* Validate */}
        <div style={{
          background: 'var(--sapBaseColor)',
          border: `1px solid ${draftPack.status === 'Ready for Review' ? 'var(--sapPositiveBorderColor)' : 'var(--sapGroup_TitleBorderColor)'}`,
          borderRadius: 8, padding: SP.m,
        }}>
          <FlexBox justifyContent="SpaceBetween" alignItems="Center">
            <div>
              <Text style={{ fontWeight: 600 }}>Review &amp; Validate</Text>
              <Text style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)' }}>
                Mark as ready for review when all sections are complete.
              </Text>
            </div>
            {draftPack.status === 'Ready for Review' ? (
              <ObjectStatus state="Positive">Ready for Review</ObjectStatus>
            ) : (
              <Button design="Default" disabled={pct < 80} onClick={handleValidate}>
                Mark as Ready for Review
              </Button>
            )}
          </FlexBox>
          {pct < 80 && draftPack.status !== 'Ready for Review' && (
            <Text style={{ fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)', marginTop: SP.xs }}>
              Complete at least 80% of sections to validate.
            </Text>
          )}
        </div>
      </div>
    </div>
  );
};

export default PackDraftDetail;
