// @ts-nocheck
import React, { useState } from 'react';
import {
  FlexBox, Title, Text, Button, ObjectStatus, MessageStrip, BusyIndicator,
} from '@ui5/webcomponents-react';
import type { SyntheticView, Engagement } from '../types';
import { SP } from '../../synthetic-data-v2/constants';
import { extractEngagementFromDocument } from '../contextEngine';
import type { ExtractedEngagement, ExtractedUseCase } from '../contextEngine';

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '8px 12px', borderRadius: 6,
  border: '1px solid var(--sapField_BorderColor)',
  background: 'var(--sapField_Background)',
  color: 'var(--sapTextColor)',
  fontSize: '0.875rem', fontFamily: 'var(--sapFontFamily)',
  outline: 'none', height: 36,
};
const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: 'vertical', height: 'auto',
};

const AVAILABLE_PACKS = [
  { id: 'collections-v1', name: 'Collections & Disputes', domain: 'Finance', version: 'v1.0', status: 'Validated' },
  { id: 'procurement-v09', name: 'Procurement Assistant', domain: 'Procurement', version: 'v0.9', status: 'Draft' },
  { id: 'tm-v08', name: 'Transportation Management', domain: 'Supply Chain', version: 'v0.8', status: 'Draft' },
  { id: 'none', name: 'No matching Experiment Pack', domain: '', version: '', status: '' },
];

const PACK_MATCH: Record<string, string> = {
  'collections-v1': 'High — same domain, supports collections prioritization, contains AR/receivable schema',
  'procurement-v09': 'High — same domain, supports procurement use cases, contains PO/supplier schema',
  'tm-v08': 'High — same domain, supports transport planning, contains freight/delivery schema',
};

interface Props {
  nav: (v: SyntheticView) => void;
  onCreate: (eng: Partial<Engagement> & { id: string }) => void;
  showToast: (msg: string) => void;
}

type Mode = 'choose' | 'upload' | 'extracting' | 'review' | 'manual';

const EngagementCreate: React.FC<Props> = ({ nav, onCreate, showToast }) => {
  const [mode, setMode] = useState<Mode>('choose');
  const [filename, setFilename] = useState('');
  const [extractStep, setExtractStep] = useState('');
  const [extracted, setExtracted] = useState<ExtractedEngagement | null>(null);
  const [selectedUseCase, setSelectedUseCase] = useState<ExtractedUseCase | null>(null);
  const [editedCustomer, setEditedCustomer] = useState('');
  const [editedProblem, setEditedProblem] = useState('');
  const [selectedPackId, setSelectedPackId] = useState('');

  // Manual form state
  const [manCustomer, setManCustomer] = useState('Test Customer Name');
  const [manName, setManName] = useState('');
  const [manProblem, setManProblem] = useState('');
  const [manUseCase, setManUseCase] = useState('');
  const [manNotes, setManNotes] = useState('');
  const [manPackId, setManPackId] = useState('collections-v1');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    setMode('extracting');
    try {
      const result = await extractEngagementFromDocument(file.name, (step, pct) => setExtractStep(step));
      setExtracted(result);
      setEditedCustomer(result.customerName);
      if (result.useCases.length > 0) {
        setSelectedUseCase(result.useCases[0]);
        setEditedProblem(result.useCases[0].businessProblem);
        setSelectedPackId(result.useCases[0].relevantPack);
      }
      setMode('review');
    } catch {
      setMode('upload');
      showToast('Extraction failed — try a different file or enter manually');
    }
    e.target.value = '';
  };

  const handleCreate = () => {
    if (!selectedUseCase) return;
    const pack = AVAILABLE_PACKS.find(p => p.id === selectedPackId);
    const eng: Partial<Engagement> & { id: string } = {
      id: `eng-${Date.now()}`,
      name: selectedUseCase.name,
      customer: editedCustomer || extracted?.customerName || 'Test Customer Name',
      useCaseName: selectedUseCase.name,
      businessProblem: editedProblem || selectedUseCase.businessProblem,
      neoNotes: extracted ? `Extracted from: ${filename}\n\nIndustry: ${extracted.industry}\nSAP Landscape: ${extracted.sapLandscape}\n\nKPIs: ${extracted.kpis.join(', ')}\n\nData Available: ${extracted.dataAvailability.join(', ')}${extracted.customFields.length > 0 ? `\n\nCustom Fields: ${extracted.customFields.join(', ')}` : ''}` : '',
      packId: selectedPackId || 'collections-v1',
      packVersion: pack?.version ?? 'v1.0',
      currentDatasetId: null,
      stage: 'use-case',
      customerSignal: null,
      customerFeedbackNotes: '',
      demoStatus: 'Not Started',
      demoLink: '', demoNotes: '',
      customerContextRaw: extracted ? `Extracted from ${filename}: ${extracted.businessProblems.join('. ')}` : '',
      customerContextAnalysis: null,
      recommendationInput: '',
      recommendation: null,
      experimentId: null,
      createdAt: new Date().toISOString(),
    };
    onCreate(eng);
    showToast(`Engagement "${eng.name}" created`);
  };

  const handleManualCreate = () => {
    if (!manCustomer.trim() || !manProblem.trim()) {
      showToast('Customer name and business problem are required');
      return;
    }
    const pack = AVAILABLE_PACKS.find(p => p.id === manPackId);
    const eng: Partial<Engagement> & { id: string } = {
      id: `eng-${Date.now()}`,
      name: manName.trim() || manUseCase.trim() || 'New Engagement',
      customer: manCustomer.trim(),
      useCaseName: manUseCase.trim(),
      businessProblem: manProblem.trim(),
      neoNotes: manNotes.trim(),
      packId: manPackId,
      packVersion: pack?.version ?? 'v1.0',
      currentDatasetId: null,
      stage: 'use-case',
      customerSignal: null,
      customerFeedbackNotes: '',
      demoStatus: 'Not Started',
      demoLink: '', demoNotes: '',
      customerContextRaw: '',
      customerContextAnalysis: null,
      recommendationInput: '',
      recommendation: null,
      experimentId: null,
      createdAt: new Date().toISOString(),
    };
    onCreate(eng);
    showToast(`Engagement "${eng.name}" created`);
  };

  // ── Choose mode ────────────────────────────────────────────────────────────
  if (mode === 'choose') {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: SP.l }}>
        <FlexBox gap={SP.s} alignItems="Center" style={{ marginBottom: SP.m }}>
          <Button design="Transparent" icon="nav-back" onClick={() => nav('engagements')} />
          <Title level="H2">Create New Engagement</Title>
        </FlexBox>
        <Text style={{ display: 'block', color: 'var(--sapContent_LabelColor)', marginBottom: SP.l }}>
          How would you like to start?
        </Text>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SP.l }}>
          {/* Option A */}
          <div
            onClick={() => setMode('upload')}
            style={{ background: 'var(--sapBaseColor)', border: '2px solid var(--sapHighlightColor)', borderRadius: 12, padding: SP.l, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
          >
            <div style={{ fontSize: '2rem', marginBottom: SP.s }}>📄</div>
            <Title level="H3" style={{ marginBottom: SP.s }}>Start from Customer Material</Title>
            <Text style={{ display: 'block', color: 'var(--sapContent_LabelColor)', lineHeight: 1.6, marginBottom: SP.m }}>
              Upload an opportunity inventory, customer deck, requirements document, or workshop notes. The system will extract engagement details automatically.
            </Text>
            <Text style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)' }}>
              Supports: PPTX · DOCX · PDF · XLSX · CSV
            </Text>
          </div>
          {/* Option B */}
          <div
            onClick={() => setMode('manual')}
            style={{ background: 'var(--sapBaseColor)', border: '2px solid var(--sapGroup_TitleBorderColor)', borderRadius: 12, padding: SP.l, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--sapHighlightColor)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--sapGroup_TitleBorderColor)'; }}
          >
            <div style={{ fontSize: '2rem', marginBottom: SP.s }}>✏️</div>
            <Title level="H3" style={{ marginBottom: SP.s }}>Enter Manually</Title>
            <Text style={{ display: 'block', color: 'var(--sapContent_LabelColor)', lineHeight: 1.6, marginBottom: SP.m }}>
              Enter the engagement details yourself — customer name, business problem, use case, and experiment pack.
            </Text>
            <Text style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)' }}>
              Use when you already know the details or don't have a document handy.
            </Text>
          </div>
        </div>
      </div>
    );
  }

  // ── Upload mode ────────────────────────────────────────────────────────────
  if (mode === 'upload') {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: SP.l }}>
        <FlexBox gap={SP.s} alignItems="Center" style={{ marginBottom: SP.m }}>
          <Button design="Transparent" icon="nav-back" onClick={() => setMode('choose')} />
          <Title level="H2">Start from Customer Material</Title>
        </FlexBox>
        <Text style={{ display: 'block', color: 'var(--sapContent_LabelColor)', marginBottom: SP.l }}>
          Upload your customer opportunity inventory, discovery notes, requirements, or other customer material. The system will extract the engagement details for you to review.
        </Text>
        <div
          onClick={() => document.getElementById('eng-file-input')?.click()}
          style={{
            border: '2px dashed var(--sapHighlightColor)', borderRadius: 12,
            padding: `${SP.xl} ${SP.l}`, textAlign: 'center', cursor: 'pointer',
            background: 'var(--sapHighlightBackground, #e8f1ff)', marginBottom: SP.l,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#d0e4ff'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--sapHighlightBackground, #e8f1ff)'; }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: SP.s }}>📎</div>
          <Text style={{ display: 'block', fontWeight: 700, fontSize: '1rem', marginBottom: SP.xs }}>Drop files here or click to browse</Text>
          <Text style={{ display: 'block', color: 'var(--sapContent_LabelColor)', fontSize: '0.875rem' }}>
            PPTX · DOCX · PDF · XLSX · CSV
          </Text>
        </div>
        <input id="eng-file-input" type="file" accept=".pptx,.docx,.pdf,.xlsx,.csv,.txt" style={{ display: 'none' }} onChange={handleFileUpload} />
        <FlexBox gap={SP.m}>
          <Button design="Emphasized" icon="upload" onClick={() => document.getElementById('eng-file-input')?.click()}>
            Browse Files
          </Button>
          <Button design="Transparent" onClick={() => setMode('manual')}>Enter Manually Instead</Button>
        </FlexBox>
      </div>
    );
  }

  // ── Extracting ─────────────────────────────────────────────────────────────
  if (mode === 'extracting') {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: SP.xl, textAlign: 'center' }}>
        <BusyIndicator active size="L" style={{ marginBottom: SP.l }} />
        <Title level="H3" style={{ marginBottom: SP.s }}>Analyzing Customer Material</Title>
        <Text style={{ display: 'block', color: 'var(--sapContent_LabelColor)', marginBottom: SP.s }}>{filename}</Text>
        <Text style={{ display: 'block', color: 'var(--sapContent_LabelColor)', fontSize: '0.875rem' }}>{extractStep}</Text>
      </div>
    );
  }

  // ── Review extracted ───────────────────────────────────────────────────────
  if (mode === 'review' && extracted) {
    const recommendedPack = AVAILABLE_PACKS.find(p => p.id === selectedPackId);
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: SP.l }}>
        <FlexBox gap={SP.s} alignItems="Center" style={{ marginBottom: SP.m }}>
          <Button design="Transparent" icon="nav-back" onClick={() => setMode('upload')} />
          <Title level="H2">Review Extracted Engagement</Title>
          <ObjectStatus state={extracted.confidence === 'High' ? 'Positive' : 'Information'}>
            {extracted.confidence} confidence
          </ObjectStatus>
        </FlexBox>
        <MessageStrip design="Positive" hideCloseButton style={{ marginBottom: SP.l }}>
          Extracted from: <strong>{filename}</strong> — Review and edit before creating the engagement.
        </MessageStrip>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SP.m, marginBottom: SP.l }}>
          {/* Customer info */}
          <div style={{ background: 'var(--sapBaseColor)', border: '1px solid var(--sapGroup_TitleBorderColor)', borderRadius: 8, padding: SP.m }}>
            <Title level="H4" style={{ marginBottom: SP.m }}>Customer Information</Title>
            <div style={{ marginBottom: SP.s }}>
              <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs, fontSize: '0.8125rem' }}>Customer Name</Text>
              <input style={inputStyle} value={editedCustomer} onChange={e => setEditedCustomer(e.target.value)}
                onFocus={e => { e.target.style.borderColor = 'var(--sapField_ActiveBorderColor)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--sapField_BorderColor)'; }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SP.s }}>
              <div>
                <Text style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)', fontWeight: 600 }}>Industry</Text>
                <Text style={{ fontSize: '0.875rem' }}>{extracted.industry}</Text>
              </div>
              <div>
                <Text style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)', fontWeight: 600 }}>SAP Landscape</Text>
                <Text style={{ fontSize: '0.875rem' }}>{extracted.sapLandscape}</Text>
              </div>
            </div>
          </div>

          {/* KPIs & Data */}
          <div style={{ background: 'var(--sapBaseColor)', border: '1px solid var(--sapGroup_TitleBorderColor)', borderRadius: 8, padding: SP.m }}>
            <Title level="H4" style={{ marginBottom: SP.m }}>Context Found</Title>
            {extracted.kpis.length > 0 && (
              <div style={{ marginBottom: SP.s }}>
                <Text style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)', fontWeight: 600, marginBottom: 2 }}>KPIs</Text>
                {extracted.kpis.map(k => <Text key={k} style={{ display: 'block', fontSize: '0.875rem' }}>{k}</Text>)}
              </div>
            )}
            {extracted.customFields.length > 0 && (
              <div>
                <Text style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)', fontWeight: 600, marginBottom: 2 }}>Custom Fields</Text>
                {extracted.customFields.map(f => (
                  <code key={f} style={{ display: 'block', fontFamily: 'monospace', fontSize: '0.8125rem' }}>{f}</code>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Use Cases */}
        <div style={{ marginBottom: SP.l }}>
          <Title level="H4" style={{ marginBottom: SP.s }}>
            {extracted.useCases.length > 1
              ? `Found ${extracted.useCases.length} Candidate Use Cases — Select One`
              : 'Selected Use Case'}
          </Title>
          <div style={{ display: 'flex', flexDirection: 'column', gap: SP.s }}>
            {extracted.useCases.map(uc => (
              <div
                key={uc.id}
                onClick={() => { setSelectedUseCase(uc); setEditedProblem(uc.businessProblem); setSelectedPackId(uc.relevantPack); }}
                style={{
                  padding: SP.m, borderRadius: 8, cursor: 'pointer',
                  border: `2px solid ${selectedUseCase?.id === uc.id ? 'var(--sapHighlightColor)' : 'var(--sapGroup_TitleBorderColor)'}`,
                  background: selectedUseCase?.id === uc.id ? 'var(--sapHighlightBackground, #e8f1ff)' : 'var(--sapBaseColor)',
                  transition: 'border-color 0.15s',
                }}
              >
                <FlexBox justifyContent="SpaceBetween" alignItems="Center">
                  <Text style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{uc.name}</Text>
                  {selectedUseCase?.id === uc.id && <ObjectStatus state="Positive">Selected</ObjectStatus>}
                </FlexBox>
                <Text style={{ display: 'block', fontSize: '0.875rem', color: 'var(--sapContent_LabelColor)', marginTop: 4 }}>{uc.businessProblem}</Text>
              </div>
            ))}
          </div>
        </div>

        {/* Business problem edit */}
        {selectedUseCase && (
          <div style={{ marginBottom: SP.l }}>
            <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>Business Problem (editable)</Text>
            <textarea style={{ ...textareaStyle, minHeight: 80 }} rows={3} value={editedProblem} onChange={e => setEditedProblem(e.target.value)}
              onFocus={e => { e.target.style.borderColor = 'var(--sapField_ActiveBorderColor)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--sapField_BorderColor)'; }} />
          </div>
        )}

        {/* Pack recommendation */}
        {selectedUseCase && (
          <div style={{ background: 'var(--sapSuccessBackground)', border: '1px solid var(--sapPositiveBorderColor)', borderRadius: 8, padding: SP.m, marginBottom: SP.l }}>
            <Title level="H4" style={{ marginBottom: SP.s }}>Recommended Experiment Pack</Title>
            <FlexBox gap={SP.m} alignItems="Center" style={{ marginBottom: SP.xs }}>
              <Text style={{ fontWeight: 700, fontSize: '1rem' }}>
                {AVAILABLE_PACKS.find(p => p.id === selectedPackId)?.name ?? selectedPackId}
              </Text>
              <ObjectStatus state="Positive">High Match</ObjectStatus>
            </FlexBox>
            <Text style={{ display: 'block', fontSize: '0.875rem', color: 'var(--sapContent_LabelColor)', marginBottom: SP.s }}>
              {PACK_MATCH[selectedPackId] ?? 'Matched based on domain and business problem.'}
            </Text>
            <FlexBox gap={SP.s}>
              <select
                value={selectedPackId}
                onChange={e => setSelectedPackId(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--sapField_BorderColor)', background: 'var(--sapField_Background)', color: 'var(--sapTextColor)', fontSize: '0.875rem', fontFamily: 'var(--sapFontFamily)', cursor: 'pointer' }}
              >
                {AVAILABLE_PACKS.map(p => <option key={p.id} value={p.id}>{p.name}{p.version ? ` — ${p.domain} ${p.version}` : ''}</option>)}
              </select>
              <Button design="Transparent" icon="course-book" onClick={() => nav('packDetail')}>View Pack</Button>
            </FlexBox>
          </div>
        )}

        <FlexBox gap={SP.m}>
          <Button design="Emphasized" disabled={!selectedUseCase} onClick={handleCreate}>
            Create Engagement
          </Button>
          <Button design="Default" onClick={() => setMode('upload')}>Upload Different File</Button>
          <Button design="Transparent" onClick={() => setMode('manual')}>Enter Manually Instead</Button>
        </FlexBox>
      </div>
    );
  }

  // ── Manual entry ───────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: SP.l }}>
      <FlexBox gap={SP.s} alignItems="Center" style={{ marginBottom: SP.m }}>
        <Button design="Transparent" icon="nav-back" onClick={() => setMode('choose')} />
        <Title level="H2">Enter Manually</Title>
      </FlexBox>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SP.m, marginBottom: SP.m }}>
        <div>
          <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>Customer Name *</Text>
          <input style={inputStyle} value={manCustomer} onChange={e => setManCustomer(e.target.value)}
            placeholder="e.g. Test Customer Name"
            onFocus={e => { e.target.style.borderColor = 'var(--sapField_ActiveBorderColor)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--sapField_BorderColor)'; }} />
        </div>
        <div>
          <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>Engagement Name</Text>
          <input style={inputStyle} value={manName} onChange={e => setManName(e.target.value)}
            placeholder="e.g. Collections Prioritization"
            onFocus={e => { e.target.style.borderColor = 'var(--sapField_ActiveBorderColor)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--sapField_BorderColor)'; }} />
        </div>
      </div>
      <div style={{ marginBottom: SP.m }}>
        <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>Business Problem *</Text>
        <textarea style={{ ...textareaStyle, minHeight: 80 }} rows={3} value={manProblem} onChange={e => setManProblem(e.target.value)}
          placeholder="Describe the customer's pain point in plain language…"
          onFocus={e => { e.target.style.borderColor = 'var(--sapField_ActiveBorderColor)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--sapField_BorderColor)'; }} />
      </div>
      <div style={{ marginBottom: SP.m }}>
        <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>Use Case / Selected Opportunity</Text>
        <input style={inputStyle} value={manUseCase} onChange={e => setManUseCase(e.target.value)}
          placeholder="e.g. Improve Collections Prioritization"
          onFocus={e => { e.target.style.borderColor = 'var(--sapField_ActiveBorderColor)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--sapField_BorderColor)'; }} />
      </div>
      <div style={{ marginBottom: SP.m }}>
        <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>NEO / Discovery Context</Text>
        <textarea style={{ ...textareaStyle, minHeight: 60 }} rows={2} value={manNotes} onChange={e => setManNotes(e.target.value)}
          placeholder="Paste NEO output, discovery notes, or customer emails…"
          onFocus={e => { e.target.style.borderColor = 'var(--sapField_ActiveBorderColor)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--sapField_BorderColor)'; }} />
      </div>
      <div style={{ marginBottom: SP.l }}>
        <Text style={{ display: 'block', fontWeight: 600, marginBottom: SP.xs }}>Experiment Pack</Text>
        <select
          value={manPackId} onChange={e => setManPackId(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--sapField_BorderColor)', background: 'var(--sapField_Background)', color: 'var(--sapTextColor)', fontSize: '0.875rem', fontFamily: 'var(--sapFontFamily)', cursor: 'pointer', width: 320 }}
        >
          {AVAILABLE_PACKS.map(p => <option key={p.id} value={p.id}>{p.name}{p.version ? ` — ${p.domain} ${p.version}` : ''}</option>)}
        </select>
      </div>
      <FlexBox gap={SP.m}>
        <Button design="Emphasized" onClick={handleManualCreate}>Create Engagement</Button>
        <Button design="Transparent" onClick={() => setMode('upload')}>Upload Document Instead</Button>
      </FlexBox>
    </div>
  );
};

export default EngagementCreate;
