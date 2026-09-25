// @ts-nocheck
import React, { useState } from 'react';
import {
  FlexBox, Title, Text, Button, ObjectStatus, MessageStrip,
} from '@ui5/webcomponents-react';
import type { DraftPack, SyntheticView } from '../types';
import { SP } from '../../synthetic-data-v2/constants';

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '8px 12px', borderRadius: 6,
  border: '1px solid var(--sapField_BorderColor)',
  background: 'var(--sapField_Background)',
  color: 'var(--sapTextColor)',
  fontSize: '0.875rem', fontFamily: 'var(--sapFontFamily)',
  outline: 'none',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: 'vertical', lineHeight: 1.5,
};

const DOMAINS = ['Finance', 'Procurement', 'Supply Chain', 'HR & Talent', 'Sales & Distribution', 'Custom'];

const COPY_FROM_PACKS = [
  { id: 'collections-v1', name: 'Collections & Disputes v1.0', domain: 'Finance' },
];

interface Props {
  nav: (v: SyntheticView) => void;
  goBack: () => void;
  onCreate: (pack: DraftPack) => void;
  showToast: (msg: string) => void;
}

const PackCreate: React.FC<Props> = ({ nav, goBack, onCreate, showToast }) => {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 fields
  const [packName, setPackName] = useState('');
  const [domain, setDomain] = useState('Finance');
  const [businessProblem, setBusinessProblem] = useState('');
  const [sapProducts, setSapProducts] = useState('');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('You');

  // Step 2
  const [startFrom, setStartFrom] = useState<'blank' | 'existing'>('blank');
  const [copyFromId, setCopyFromId] = useState('collections-v1');

  const handleCreate = () => {
    if (!packName.trim()) { showToast('Pack name is required'); return; }
    const isCopied = startFrom === 'existing';
    const copiedPack = isCopied ? COPY_FROM_PACKS.find(p => p.id === copyFromId) : null;

    const draft: DraftPack = {
      id: `pack-${Date.now()}`,
      name: packName.trim(),
      domain: domain,
      businessProblem: businessProblem.trim(),
      sapProducts: sapProducts.split(',').map(s => s.trim()).filter(Boolean),
      description: description.trim(),
      owner: owner.trim() || 'You',
      version: 'v0.1',
      status: 'Draft',
      startedFrom: isCopied ? copyFromId : null,
      createdAt: new Date().toISOString().split('T')[0],
      hasExperiments: isCopied,
      hasSchema: isCopied,
      hasConstraints: isCopied,
      hasGenerationDefaults: isCopied,
      hasQualityChecks: false,
      experiments: isCopied ? ['Late Payment Prediction', 'Collections Prioritization', 'Dispute Prediction'] : [],
      constraints: isCopied ? 'Every Receivable must reference a valid Business Partner\nDue date must be after invoice date\nDunning only on overdue receivables' : '',
      generationNotes: '',
    };
    onCreate(draft);
    showToast(`Pack "${draft.name} v0.1" created as Draft`);
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: SP.l }}>
      {/* Back */}
      <FlexBox gap={SP.s} alignItems="Center" style={{ marginBottom: SP.m }}>
        <Button design="Default" icon="nav-back" onClick={goBack}>← Back to Experiment Packs</Button>
      </FlexBox>

      <Title level="H2" style={{ marginBottom: SP.xs }}>Define New Experiment Pack</Title>
      <Text style={{ display: 'block', color: 'var(--sapContent_LabelColor)', marginBottom: SP.l }}>
        Create a reusable experiment pack for a new SAP domain or business process.
      </Text>

      {/* Step indicator */}
      <FlexBox gap={SP.m} style={{ marginBottom: SP.l }}>
        {[{ n: 1, label: 'Basic Information' }, { n: 2, label: 'Starting Point' }].map(s => (
          <FlexBox key={s.n} gap={SP.xs} alignItems="Center">
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: step >= s.n ? 'var(--sapHighlightColor)' : 'var(--sapField_BorderColor)',
              color: step >= s.n ? '#fff' : 'var(--sapContent_LabelColor)',
              fontSize: '0.8125rem', fontWeight: 700, flexShrink: 0,
            }}>{s.n}</div>
            <Text style={{ fontWeight: step === s.n ? 700 : 400, color: step === s.n ? 'var(--sapTextColor)' : 'var(--sapContent_LabelColor)' }}>
              {s.label}
            </Text>
            {s.n < 2 && <Text style={{ color: 'var(--sapContent_LabelColor)' }}>→</Text>}
          </FlexBox>
        ))}
      </FlexBox>

      <div style={{ background: 'var(--sapBaseColor)', border: '1px solid var(--sapGroup_TitleBorderColor)', borderRadius: 8, padding: SP.l }}>
        {step === 1 && (
          <>
            <Title level="H3" style={{ marginBottom: SP.m }}>Basic Information</Title>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SP.m, marginBottom: SP.m }}>
              <div>
                <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>Pack Name *</Text>
                <input style={{ ...inputStyle, height: 36 }} value={packName} onChange={e => setPackName(e.target.value)}
                  placeholder="e.g. Interconnection Study Processing"
                  onFocus={e => { e.target.style.borderColor = 'var(--sapField_ActiveBorderColor)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--sapField_BorderColor)'; }} />
              </div>
              <div>
                <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>Domain / Business Area *</Text>
                <select style={{ ...inputStyle, height: 36, cursor: 'pointer' }} value={domain} onChange={e => setDomain(e.target.value)}>
                  {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: SP.m }}>
              <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>Business Problem</Text>
              <textarea style={textareaStyle} rows={3} value={businessProblem} onChange={e => setBusinessProblem(e.target.value)}
                placeholder="What business problem does this pack help solve?"
                onFocus={e => { e.target.style.borderColor = 'var(--sapField_ActiveBorderColor)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--sapField_BorderColor)'; }} />
            </div>
            <div style={{ marginBottom: SP.m }}>
              <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>SAP Products / Domain Model</Text>
              <input style={{ ...inputStyle, height: 36 }} value={sapProducts} onChange={e => setSapProducts(e.target.value)}
                placeholder="e.g. FSCM, S/4 Accounts Receivable (comma-separated)"
                onFocus={e => { e.target.style.borderColor = 'var(--sapField_ActiveBorderColor)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--sapField_BorderColor)'; }} />
            </div>
            <div style={{ marginBottom: SP.m }}>
              <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>Short Description</Text>
              <textarea style={textareaStyle} rows={2} value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Brief description for the pack catalog"
                onFocus={e => { e.target.style.borderColor = 'var(--sapField_ActiveBorderColor)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--sapField_BorderColor)'; }} />
            </div>
            <div style={{ marginBottom: SP.l }}>
              <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>Owner</Text>
              <input style={{ ...inputStyle, height: 36, width: 240 }} value={owner} onChange={e => setOwner(e.target.value)} />
            </div>
            <Button design="Emphasized" disabled={!packName.trim()} onClick={() => setStep(2)}>
              Continue →
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <Title level="H3" style={{ marginBottom: SP.m }}>Starting Point</Title>
            <Text style={{ display: 'block', color: 'var(--sapContent_LabelColor)', marginBottom: SP.m }}>
              Start from scratch or copy structure from an existing pack to save time.
            </Text>

            <div style={{ display: 'flex', flexDirection: 'column', gap: SP.m, marginBottom: SP.l }}>
              {/* Start blank */}
              <div
                onClick={() => setStartFrom('blank')}
                style={{
                  padding: SP.m, borderRadius: 8, cursor: 'pointer',
                  border: `2px solid ${startFrom === 'blank' ? 'var(--sapHighlightColor)' : 'var(--sapGroup_TitleBorderColor)'}`,
                  background: startFrom === 'blank' ? 'var(--sapHighlightBackground, #e8f1ff)' : 'var(--sapField_Background)',
                }}
              >
                <FlexBox gap={SP.s} alignItems="Center" style={{ marginBottom: SP.xs }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', border: `2px solid ${startFrom === 'blank' ? 'var(--sapHighlightColor)' : 'var(--sapField_BorderColor)'}`,
                    background: startFrom === 'blank' ? 'var(--sapHighlightColor)' : 'transparent',
                    flexShrink: 0,
                  }} />
                  <Text style={{ fontWeight: 700 }}>Start blank</Text>
                </FlexBox>
                <Text style={{ fontSize: '0.875rem', color: 'var(--sapContent_LabelColor)' }}>
                  Create a new pack from scratch. You'll be guided through each section.
                </Text>
              </div>

              {/* Start from existing */}
              <div
                onClick={() => setStartFrom('existing')}
                style={{
                  padding: SP.m, borderRadius: 8, cursor: 'pointer',
                  border: `2px solid ${startFrom === 'existing' ? 'var(--sapHighlightColor)' : 'var(--sapGroup_TitleBorderColor)'}`,
                  background: startFrom === 'existing' ? 'var(--sapHighlightBackground, #e8f1ff)' : 'var(--sapField_Background)',
                }}
              >
                <FlexBox gap={SP.s} alignItems="Center" style={{ marginBottom: SP.xs }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', border: `2px solid ${startFrom === 'existing' ? 'var(--sapHighlightColor)' : 'var(--sapField_BorderColor)'}`,
                    background: startFrom === 'existing' ? 'var(--sapHighlightColor)' : 'transparent',
                    flexShrink: 0,
                  }} />
                  <Text style={{ fontWeight: 700 }}>Start from existing pack</Text>
                </FlexBox>
                <Text style={{ fontSize: '0.875rem', color: 'var(--sapContent_LabelColor)', marginBottom: startFrom === 'existing' ? SP.s : 0 }}>
                  Copy schema, constraints, and experiment patterns from an existing pack.
                </Text>
                {startFrom === 'existing' && (
                  <select
                    style={{ ...inputStyle, height: 36, width: 320, marginTop: SP.s, cursor: 'pointer' }}
                    value={copyFromId}
                    onChange={e => setCopyFromId(e.target.value)}
                    onClick={e => e.stopPropagation()}
                  >
                    {COPY_FROM_PACKS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}
              </div>
            </div>

            {startFrom === 'existing' && (
              <MessageStrip design="Information" hideCloseButton style={{ marginBottom: SP.m }}>
                Schema, business constraints, and experiment patterns will be copied from {COPY_FROM_PACKS.find(p => p.id === copyFromId)?.name}. You can modify everything after creation.
              </MessageStrip>
            )}

            <FlexBox gap={SP.m}>
              <Button design="Transparent" onClick={() => setStep(1)}>← Back</Button>
              <Button design="Emphasized" onClick={handleCreate}>
                Create Draft Pack →
              </Button>
            </FlexBox>
          </>
        )}
      </div>
    </div>
  );
};

export default PackCreate;
