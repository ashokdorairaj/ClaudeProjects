// @ts-nocheck
import React, { useState, useCallback } from 'react';
import {
  DynamicPage, DynamicPageTitle,
  Title, Text, Button,
  Form, FormGroup, FormItem, Label, Input, Select, Option, Switch,
  MessageStrip, BusyIndicator, Tag, ObjectStatus, Icon, FlexBox,
  Toast,
} from '@ui5/webcomponents-react';
import type { SyntheticView, GenerationConfig, GeneratedDataset, QualityCheck } from '../types';
import { SP, FIDELITY_LEVELS, DEFAULT_CONFIG, NORTHSTAR } from '../constants';
import { generateDataset } from '../dataEngine';
import { runQualityChecks } from '../qualityEngine';

interface Props {
  nav: (v: SyntheticView) => void;
  onDatasetGenerated: (d: GeneratedDataset, q: QualityCheck[]) => void;
  showToast: (msg: string) => void;
}

const GENERATION_MESSAGES = [
  'Seeding PRNG (seed=42)…',
  'Generating business partners with correlated risk segments…',
  'Distributing receivables across business partners…',
  'Applying payment behavior distributions…',
  'Generating payments, dunning records, disputes…',
  'Applying customer extensions (L2+)…',
  'Running referential integrity checks…',
  'Running business rule validation…',
  'Dataset ready.',
];

const NORTHSTAR_DELTA_FIELDS = [
  { entity: 'RECEIVABLE',       fieldName: 'ZZ_PAYMENT_CHANNEL', type: 'CATEGORY', desc: 'Customer-specific payment channel' },
  { entity: 'BUSINESS_PARTNER', fieldName: 'ZZ_RISK_CATEGORY',  type: 'CATEGORY', desc: 'Internal risk classification' },
];

const GenerateWizard: React.FC<Props> = ({ nav, onDatasetGenerated, showToast }) => {
  const [config, setConfig] = useState<GenerationConfig>({ ...DEFAULT_CONFIG });
  const [selectedLevel, setSelectedLevel] = useState<'L1' | 'L2' | 'L3' | 'L4'>('L1');
  const [northstarLoaded, setNorthstarLoaded] = useState(false);
  const [customFields, setCustomFields] = useState<typeof NORTHSTAR_DELTA_FIELDS>([]);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [toastOpen, setToastOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const upd = useCallback((key: keyof GenerationConfig, val: unknown) => {
    setConfig(prev => ({ ...prev, [key]: val }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (config.bpCount < 100 || config.bpCount > 50000) errs.bpCount = 'Must be 100–50,000';
    if (config.recCount < 1000 || config.recCount > 500000) errs.recCount = 'Must be 1,000–500,000';
    if (config.latePaymentRate < 0 || config.latePaymentRate > 1) errs.latePaymentRate = 'Must be 0–100%';
    if (config.disputeRate < 0 || config.disputeRate > 1) errs.disputeRate = 'Must be 0–100%';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleGenerate = useCallback(async () => {
    if (!validate()) return;
    setGenerating(true);
    setProgress([]);

    const finalConfig: GenerationConfig = {
      ...config,
      fidelityLevel: selectedLevel,
      includeCollectionHistory: selectedLevel !== 'L1' && northstarLoaded,
    };

    const msgs = finalConfig.includeCollectionHistory
      ? GENERATION_MESSAGES
      : GENERATION_MESSAGES.filter(m => !m.includes('extension'));

    for (let i = 0; i < msgs.length - 1; i++) {
      await new Promise(r => setTimeout(r, 180 + Math.random() * 120));
      setProgress(p => [...p, msgs[i]]);
    }

    const dataset = generateDataset(finalConfig);
    const checks  = runQualityChecks(dataset);
    onDatasetGenerated(dataset, checks);

    setProgress(p => [...p, msgs[msgs.length - 1]]);
    setGenerating(false);
    setGenerated(true);
    setToastOpen(true);
    // nav('preview') deliberately removed — user picks destination via buttons below
  }, [config, selectedLevel, northstarLoaded, validate, onDatasetGenerated]);

  const loadNorthstar = () => {
    setConfig({
      ...DEFAULT_CONFIG,
      bpCount: NORTHSTAR.demoBpCount,
      recCount: NORTHSTAR.demoRecCount,
      latePaymentRate: NORTHSTAR.latePaymentRate,
      disputeRate: NORTHSTAR.disputeRate,
      meanInvoiceAmount: NORTHSTAR.meanInvoiceAmount,
      countryWeights: NORTHSTAR.countryWeights,
      riskWeights: NORTHSTAR.riskWeights,
      fidelityLevel: selectedLevel,
    });
    setCustomFields(NORTHSTAR_DELTA_FIELDS);
    setNorthstarLoaded(true);
  };

  const showL2 = selectedLevel === 'L2';
  const showL3 = selectedLevel === 'L3';
  const showL4 = selectedLevel === 'L4';

  return (
    <DynamicPage
      style={{ flex: 1, overflow: 'hidden', '--ui5_dynamic_page_background': 'var(--sapObjectHeader_Background)' } as React.CSSProperties}
      headerTitle={
        <DynamicPageTitle style={{ paddingLeft: SP.m }}>
          <Title slot="heading" level="H3" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>
            Generate Synthetic Experiment Data
          </Title>
          <Text slot="subheading" style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)' }}>
            Collections &amp; Disputes · Select a fidelity level to begin
          </Text>
        </DynamicPageTitle>
      }
    >
      <div style={{ paddingTop: SP.m, paddingBottom: SP.l, paddingLeft: SP.g, paddingRight: SP.g, maxWidth: 860 }}>
        <Toast open={toastOpen} duration={3000} placement="BottomCenter" onClose={() => setToastOpen(false)}>
          Dataset generated — {config.recCount.toLocaleString()} receivables ready
        </Toast>

        {/* ── STEP 1: Level selector (always at top) ─────────────────────── */}
        <div style={{ marginBottom: SP.l }}>
          <Title level="H4" wrappingType="Normal" style={{ color: 'var(--sapTextColor)', marginBottom: SP.s }}>
            1. Select Fidelity Level
          </Title>
          <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginBottom: SP.m }}>
            Choose how much customer-specific detail to include. You can configure the relevant options below after selecting a level.
          </Text>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: SP.s }}>
            {FIDELITY_LEVELS.map(fl => (
              <div
                key={fl.level}
                role="button"
                tabIndex={0}
                aria-label={`Select ${fl.level}`}
                aria-pressed={selectedLevel === fl.level}
                onClick={() => setSelectedLevel(fl.level)}
                onKeyDown={e => e.key === 'Enter' && setSelectedLevel(fl.level)}
                style={{
                  padding: SP.m, borderRadius: 8, cursor: 'pointer', transition: 'border-color 0.15s',
                  border: selectedLevel === fl.level ? '2px solid var(--sapBrandColor)' : '2px solid var(--sapList_BorderColor)',
                  background: selectedLevel === fl.level ? 'var(--sapField_Focus_Background, var(--sapTile_Background))' : 'var(--sapTile_Background)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP.xs }}>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapBrandColor)', fontSize: '1rem' }}>{fl.level}</span>
                  {selectedLevel === fl.level && <Icon name="accept" style={{ color: 'var(--sapBrandColor)', fontSize: '1rem' }} />}
                </div>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', display: 'block', fontSize: 'var(--sapFontSmallSize)', marginBottom: 2 }}>{fl.title}</span>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', lineHeight: 1.4 }}>{fl.dataNeeded}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── STEP 2: Config (conditional on selected level) ──────────────── */}
        <div style={{ marginBottom: SP.l }}>
          <Title level="H4" wrappingType="Normal" style={{ color: 'var(--sapTextColor)', marginBottom: SP.s }}>
            2. Configure
          </Title>

          {/* L1 config — only shown when L1 is selected */}
          {selectedLevel === 'L1' && (
          <div style={{ marginBottom: SP.m }}>
            <Text style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', display: 'block', marginBottom: SP.s }}>
              L1 — SAP Baseline
            </Text>
            <MessageStrip design="Information" hideCloseButton style={{ marginBottom: SP.m }}>
              No customer data required. Uses SAP/domain defaults from the Collections Experiment Pack.
            </MessageStrip>
            <Form layout="S1 M2 L2 XL2" labelSpan="S12 M4 L4 XL4" style={{ maxWidth: 720 }}>
              <FormGroup headerText="Data Volume">
                <FormItem labelContent={<Label required showColon>Business Partners</Label>}>
                  <Input value={String(config.bpCount)} valueState={errors.bpCount ? 'Negative' : 'None'}
                    onInput={e => upd('bpCount', Math.max(1, parseInt(e.target.value) || 0))}>
                    {errors.bpCount && <span slot="valueStateMessage">{errors.bpCount}</span>}
                  </Input>
                </FormItem>
                <FormItem labelContent={<Label required showColon>Receivables</Label>}>
                  <Input value={String(config.recCount)} valueState={errors.recCount ? 'Negative' : 'None'}
                    onInput={e => upd('recCount', Math.max(1, parseInt(e.target.value) || 0))}>
                    {errors.recCount && <span slot="valueStateMessage">{errors.recCount}</span>}
                  </Input>
                </FormItem>
                <FormItem labelContent={<Label showColon>Start Date</Label>}>
                  <Input value={config.startDate} onInput={e => upd('startDate', e.target.value)} />
                </FormItem>
                <FormItem labelContent={<Label showColon>End Date</Label>}>
                  <Input value={config.endDate} onInput={e => upd('endDate', e.target.value)} />
                </FormItem>
              </FormGroup>
              <FormGroup headerText="Behavior Distributions">
                <FormItem labelContent={<Label required showColon>Late Payment Rate %</Label>}>
                  <Input value={String(Math.round(config.latePaymentRate * 100))} valueState={errors.latePaymentRate ? 'Negative' : 'None'}
                    onInput={e => upd('latePaymentRate', Math.min(1, Math.max(0, (parseFloat(e.target.value) || 0) / 100)))}>
                    {errors.latePaymentRate && <span slot="valueStateMessage">{errors.latePaymentRate}</span>}
                  </Input>
                </FormItem>
                <FormItem labelContent={<Label required showColon>Dispute Rate %</Label>}>
                  <Input value={String(Math.round(config.disputeRate * 100))} valueState={errors.disputeRate ? 'Negative' : 'None'}
                    onInput={e => upd('disputeRate', Math.min(1, Math.max(0, (parseFloat(e.target.value) || 0) / 100)))}>
                    {errors.disputeRate && <span slot="valueStateMessage">{errors.disputeRate}</span>}
                  </Input>
                </FormItem>
                <FormItem labelContent={<Label showColon>Currency</Label>}>
                  <Select onChange={e => upd('currency', e.detail.selectedOption.textContent?.trim())}>
                    <Option selected={config.currency === 'EUR'}>EUR</Option>
                    <Option selected={config.currency === 'USD'}>USD</Option>
                    <Option selected={config.currency === 'GBP'}>GBP</Option>
                  </Select>
                </FormItem>
                <FormItem labelContent={<Label showColon>Random Seed</Label>}>
                  <Input value={String(config.seed)} onInput={e => upd('seed', parseInt(e.target.value) || 42)} />
                </FormItem>
              </FormGroup>
              <FormGroup headerText="Features">
                <FormItem labelContent={<Label showColon>Include Dunning</Label>}>
                  <Switch checked={config.includeDunning} onChange={e => upd('includeDunning', e.target.checked)} />
                </FormItem>
                <FormItem labelContent={<Label showColon>Include Disputes</Label>}>
                  <Switch checked={config.includeDisputes} onChange={e => upd('includeDisputes', e.target.checked)} />
                </FormItem>
              </FormGroup>
            </Form>
          </div>
          )}

          {/* L2 config — shown only when L2 is selected */}
          {showL2 && (
            <div style={{ marginBottom: SP.m, paddingTop: SP.m, borderTop: '1px solid var(--sapList_BorderColor)' }}>
              <Text style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', display: 'block', marginBottom: SP.s }}>
                L2 — Customer Schema
              </Text>
              <MessageStrip design="Information" hideCloseButton style={{ marginBottom: SP.m }}>
                Add customer-specific entities and fields. No transactional rows required.
              </MessageStrip>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SP.m, marginBottom: SP.m }}>
                <div>
                  <Title level="H5" wrappingType="Normal" style={{ color: 'var(--sapTextColor)', marginBottom: SP.s }}>Standard Schema</Title>
                  <div style={{ background: 'var(--sapTile_Background)', borderRadius: 8, padding: SP.m }}>
                    {['BUSINESS_PARTNER (KNA1)', 'RECEIVABLE (BSID)', 'PAYMENT (BKPF)', 'DUNNING (MHND)', 'DISPUTE (UDM_DISPUTE)'].map(e => (
                      <div key={e} style={{ display: 'flex', alignItems: 'center', gap: SP.s, paddingTop: SP.xs, paddingBottom: SP.xs }}>
                        <Icon name="accept" style={{ width: '1rem', height: '1rem', color: 'var(--sapPositiveColor)' }} />
                        <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{e}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP.s }}>
                    <Title level="H5" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>Customer Delta</Title>
                    {!northstarLoaded && (
                      <Button design="Transparent" icon="download" onClick={loadNorthstar}>Load Northstar Delta</Button>
                    )}
                  </div>
                  <div style={{ background: 'var(--sapTile_Background)', borderRadius: 8, padding: SP.m }}>
                    {customFields.length === 0 ? (
                      <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', fontStyle: 'italic' }}>
                        No custom fields yet. Click "Load Northstar Delta" to add.
                      </span>
                    ) : (
                      customFields.map(f => (
                        <div key={f.fieldName} style={{ display: 'flex', alignItems: 'center', gap: SP.s, paddingTop: SP.xs, paddingBottom: SP.xs }}>
                          <Tag design="Critical">Customer Extension</Tag>
                          <div>
                            <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>
                              {f.fieldName} ({f.type})
                            </span>
                            <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>
                              on {f.entity} — {f.desc}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                    {northstarLoaded && (
                      <div style={{ marginTop: SP.s, paddingTop: SP.s, borderTop: '1px solid var(--sapList_BorderColor)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: SP.s }}>
                          <Tag design="Critical">Custom Table</Tag>
                          <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>Z_COLLECTION_HISTORY</span>
                        </div>
                        <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>
                          7 fields · FK: business_partner_id → BUSINESS_PARTNER
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {northstarLoaded && (
                <MessageStrip design="Success" hideCloseButton>
                  Northstar Manufacturing schema delta loaded. Z_COLLECTION_HISTORY and custom ZZ fields will be included.
                </MessageStrip>
              )}
            </div>
          )}

          {/* L3 config — shown only when L3 is selected */}
          {showL3 && (
            <div style={{ marginBottom: SP.m, paddingTop: SP.m, borderTop: '1px solid var(--sapList_BorderColor)' }}>
              <Text style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', display: 'block', marginBottom: SP.s }}>
                L3 — Customer Profile &amp; Scenarios
              </Text>
              <MessageStrip design="Information" hideCloseButton style={{ marginBottom: SP.m }}>
                Calibrate data using customer statistics — no individual rows needed. Enables meaningful ML experimentation.
              </MessageStrip>
              {!northstarLoaded && (
                <div style={{ marginBottom: SP.m }}>
                  <Button design="Transparent" icon="download" onClick={loadNorthstar}>Load Northstar Manufacturing Profile</Button>
                </div>
              )}
              <Form layout="S1 M2 L2 XL2" labelSpan="S12 M4 L4 XL4" style={{ maxWidth: 720 }}>
                <FormGroup headerText="Volume &amp; Rates">
                  <FormItem labelContent={<Label showColon>Business Partners</Label>}>
                    <Input value={String(config.bpCount)} onInput={e => upd('bpCount', parseInt(e.target.value) || 2000)} />
                  </FormItem>
                  <FormItem labelContent={<Label showColon>Receivables</Label>}>
                    <Input value={String(config.recCount)} onInput={e => upd('recCount', parseInt(e.target.value) || 20000)} />
                  </FormItem>
                  <FormItem labelContent={<Label showColon>Late Payment Rate %</Label>}>
                    <Input value={String(Math.round(config.latePaymentRate * 100))} onInput={e => upd('latePaymentRate', (parseFloat(e.target.value) || 0) / 100)} />
                  </FormItem>
                  <FormItem labelContent={<Label showColon>Dispute Rate %</Label>}>
                    <Input value={String(Math.round(config.disputeRate * 100))} onInput={e => upd('disputeRate', (parseFloat(e.target.value) || 0) / 100)} />
                  </FormItem>
                </FormGroup>
                <FormGroup headerText="Invoice Distribution">
                  <FormItem labelContent={<Label showColon>Mean Invoice Amount</Label>}>
                    <Input value={String(config.meanInvoiceAmount)} onInput={e => upd('meanInvoiceAmount', parseFloat(e.target.value) || 4200)} />
                  </FormItem>
                </FormGroup>
              </Form>
              <div style={{ marginTop: SP.m }}>
                <Title level="H5" wrappingType="Normal" style={{ color: 'var(--sapTextColor)', marginBottom: SP.s }}>Predictive Relationships</Title>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginBottom: SP.m }}>
                  These correlations are embedded in the generated data.
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SP.s }}>
                  {[
                    { feature: 'Prior late payments', target: 'late_payment_flag', strength: 'Strong positive', state: 'Positive' as const },
                    { feature: 'HIGH risk segment',   target: 'late_payment_flag', strength: 'Strong positive', state: 'Positive' as const },
                    { feature: 'Invoice amount',       target: 'dispute',           strength: 'Medium positive', state: 'Information' as const },
                    { feature: 'Customer tenure',      target: 'late_payment_flag', strength: 'Weak negative',   state: 'None' as const },
                  ].map(r => (
                    <div key={r.feature} style={{ background: 'var(--sapTile_Background)', borderRadius: 8, padding: SP.s }}>
                      <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', display: 'block' }}>{r.feature}</span>
                      <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block' }}>→ {r.target}</span>
                      <ObjectStatus state={r.state}>{r.strength}</ObjectStatus>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* L4 config — shown only for L4 */}
          {showL4 && (
            <div style={{ paddingTop: SP.m, borderTop: '1px solid var(--sapList_BorderColor)' }}>
              <Text style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', display: 'block', marginBottom: SP.s }}>
                L4 — Approved Customer Sample
              </Text>
              <MessageStrip design="Critical" hideCloseButton style={{ marginBottom: SP.m }}>
                Requires an approved customer data sample. Ensure data handling approval is in place before proceeding.
              </MessageStrip>
              <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block' }}>
                Upload an approved CSV sample to calibrate distributions (demo — no real upload processing).
              </Text>
              <Button design="Default" icon="upload" style={{ marginTop: SP.s }}>Upload Sample CSV (Demo)</Button>
            </div>
          )}
        </div>

        {/* ── STEP 3: Summary + Generate ──────────────────────────────────── */}
        {!generating && !generated && (
          <div style={{ marginBottom: SP.l, paddingTop: SP.m, borderTop: '1px solid var(--sapList_BorderColor)' }}>
            <Title level="H4" wrappingType="Normal" style={{ color: 'var(--sapTextColor)', marginBottom: SP.s }}>
              3. Summary &amp; Generate
            </Title>
            <div style={{ maxWidth: 500, marginBottom: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8, padding: SP.m }}>
              <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: SP.s }}>
                Configuration Summary
              </span>
              {[
                ['Pack',             'Collections & Disputes v1.0'],
                ['Level',            `${selectedLevel} — ${FIDELITY_LEVELS.find(f => f.level === selectedLevel)?.title}`],
                ['Business Partners', config.bpCount.toLocaleString()],
                ['Receivables',      config.recCount.toLocaleString()],
                ['Date Range',       `${config.startDate} to ${config.endDate}`],
                ['Late Payment %',   `${Math.round(config.latePaymentRate * 100)}%`],
                ['Dispute %',        `${Math.round(config.disputeRate * 100)}%`],
                ['Currency',         config.currency],
                ['Seed',             String(config.seed)],
                ['Customer Delta',   northstarLoaded ? 'Northstar Manufacturing' : 'None (SAP defaults)'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', paddingTop: SP.xs, paddingBottom: SP.xs, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{k}</span>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{v}</span>
                </div>
              ))}
            </div>
            <Button design="Emphasized" icon="process" onClick={handleGenerate}>Generate Dataset</Button>
          </div>
        )}

        {/* Generation progress */}
        {generating && (
          <div style={{ paddingTop: SP.m }}>
            <BusyIndicator active size="M" text="Generating synthetic data…" style={{ marginBottom: SP.m }} />
            {progress.map((msg, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: SP.s, paddingTop: SP.xs, paddingBottom: SP.xs }}>
                <Icon name="accept" style={{ width: '1rem', height: '1rem', color: 'var(--sapPositiveColor)' }} />
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', color: 'var(--sapTextColor)' }}>{msg}</span>
              </div>
            ))}
          </div>
        )}

        {/* Post-generation: success + navigation buttons */}
        {!generating && generated && (
          <div style={{ paddingTop: SP.m, borderTop: '1px solid var(--sapList_BorderColor)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: SP.s, marginBottom: SP.m }}>
              <Icon name="accept" style={{ width: '1.5rem', height: '1.5rem', color: 'var(--sapPositiveColor)' }} />
              <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontLargeSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapPositiveColor)' }}>
                Dataset Ready
              </span>
            </div>
            {progress.map((msg, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: SP.s, paddingTop: SP.xs }}>
                <Icon name="accept" style={{ width: '1rem', height: '1rem', color: 'var(--sapPositiveColor)' }} />
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{msg}</span>
              </div>
            ))}
            <FlexBox gap={SP.m} style={{ marginTop: SP.l, flexWrap: 'wrap' }}>
              <Button design="Emphasized" icon="table-view" onClick={() => nav('preview')}>
                Preview Dataset
              </Button>
              <Button design="Default" icon="add-document" onClick={() => nav('datasets')}>
                Go to All Datasets
              </Button>
              <Button design="Transparent" icon="nav-back" onClick={() => nav('engagementDetail')}>
                Back to Engagement
              </Button>
            </FlexBox>
          </div>
        )}
      </div>
    </DynamicPage>
  );
};

export default GenerateWizard;
