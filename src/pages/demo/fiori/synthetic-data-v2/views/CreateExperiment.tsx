// @ts-nocheck
import React, { useState, useCallback } from 'react';
import {
  Title, Text, Button, MessageStrip, ObjectStatus, Tag, Icon,
  Input, Label, Select, Option, FlexBox, ProgressIndicator,
} from '@ui5/webcomponents-react';
import { SP } from '../constants';
import { QUESTION_TEMPLATES, APPROACH_CATALOG, SEED_FEATURE_SETS, SEED_DATASETS } from '../constants';
import type { SyntheticView, Experiment, TaskType } from '../types';

interface Props {
  nav: (v: SyntheticView) => void;
  onCreateExperiment: (exp: Experiment) => void;
}

const TASK_TYPES: TaskType[] = ['Binary Classification', 'Multiclass Classification', 'Regression', 'Ranking', 'Forecasting', 'Rules/Decisioning'];
const METRICS_BY_TASK: Record<string, string[]> = {
  'Binary Classification': ['Recall', 'Precision', 'F1', 'ROC AUC', 'PR AUC', 'Accuracy'],
  'Multiclass Classification': ['Macro F1', 'Weighted F1', 'Accuracy'],
  'Regression': ['MAE', 'RMSE', 'R²', 'MAPE'],
  'Ranking': ['NDCG', 'MAP', 'Precision@K'],
  'Forecasting': ['MAE', 'RMSE', 'MAPE'],
  'Rules/Decisioning': ['Precision', 'Recall', 'Coverage'],
};

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)', padding: SP.m, ...style }}>
      {children}
    </div>
  );
}

function SH({ title }: { title: string }) {
  return (
    <div style={{ borderBottom: '1px solid var(--sapList_BorderColor)', paddingBottom: SP.xs, marginBottom: SP.m, marginTop: SP.l }}>
      <Title level="H5" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>{title}</Title>
    </div>
  );
}

export default function CreateExperiment({ nav, onCreateExperiment }: Props) {
  const [step, setStep] = useState<'entry' | 'recommend' | 'wizard'>('entry');
  const [entryMode, setEntryMode] = useState<'common' | 'freetext'>('common');
  const [selectedTemplate, setSelectedTemplate] = useState(QUESTION_TEMPLATES[0]);
  const [freeQuestion, setFreeQuestion] = useState('');
  const [wizardStep, setWizardStep] = useState(1);

  // Wizard state
  const [expName, setExpName] = useState('Northstar Late Payment Prediction');
  const [taskType, setTaskType] = useState<TaskType>('Binary Classification');
  const [target, setTarget] = useState('late_payment_flag');
  const [question, setQuestion] = useState('');
  const [selectedDatasetId, setSelectedDatasetId] = useState('ds-northstar-l3-v1');
  const [selectedFeatureSets, setSelectedFeatureSets] = useState<string[]>(['fs-baseline-v1', 'fs-behavioral-v1']);
  const [selectedApproaches, setSelectedApproaches] = useState<string[]>(['rules', 'logreg', 'gbm', 'rpt']);
  const [primaryMetric, setPrimaryMetric] = useState('f1');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['Recall', 'Precision', 'F1', 'ROC AUC']);

  const compatibleApproaches = APPROACH_CATALOG.filter(a => a.taskTypes.includes(taskType));
  const metrics = METRICS_BY_TASK[taskType] || [];

  const handleSelectTemplate = (t: typeof QUESTION_TEMPLATES[0]) => {
    setSelectedTemplate(t);
    setQuestion(t.question);
    setTarget(t.candidateTargets[0]);
    if (t.taskTypes.length > 0) setTaskType(t.taskTypes[0]);
    setSelectedApproaches(t.recommendedApproaches);
    setSelectedMetrics(t.recommendedMetrics.map(m => m.charAt(0).toUpperCase() + m.slice(1)));
  };

  const handleGetRecommendation = () => {
    const tpl = entryMode === 'common' ? selectedTemplate : {
      ...QUESTION_TEMPLATES[0],
      question: freeQuestion || QUESTION_TEMPLATES[0].question,
    };
    handleSelectTemplate(tpl);
    setStep('recommend');
  };

  const toggleApproach = useCallback((id: string) => {
    setSelectedApproaches(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  }, []);
  const toggleMetric = useCallback((m: string) => {
    setSelectedMetrics(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  }, []);

  const handleCreate = useCallback(() => {
    const exp: Experiment = {
      id: `exp-${Date.now()}`,
      name: expName,
      packId: 'collections-v1',
      packVersion: 'v1.0',
      customer: 'Northstar Manufacturing',
      taskType,
      target,
      question: question || selectedTemplate.question,
      businessObjective: selectedTemplate.businessObjective,
      featureSetIds: selectedFeatureSets,
      approachIds: selectedApproaches,
      primaryMetric: primaryMetric.toLowerCase(),
      datasetIds: [selectedDatasetId],
      runIds: [],
      status: 'Draft',
      createdAt: new Date().toISOString(),
    };
    onCreateExperiment(exp);
    nav('experimentWorkspace');
  }, [expName, taskType, target, question, selectedTemplate, selectedFeatureSets, selectedApproaches, primaryMetric, selectedDatasetId, onCreateExperiment, nav]);

  const STEPS = ['Define', 'Dataset', 'Features', 'Approaches', 'Metrics'];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: SP.m }}>
      <div style={{ marginBottom: SP.m }}>
        <Title level="H3" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>Create Experiment</Title>
        <Text style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)', display: 'block', marginTop: SP.xs }}>
          Collections & Disputes v1.0 · Northstar Manufacturing (Fictional Customer)
        </Text>
      </div>

      {/* ENTRY STEP */}
      {step === 'entry' && (
        <div>
          <SH title="What do you want to learn?" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SP.m, marginBottom: SP.m }}>
            <Card style={{ cursor: 'pointer', border: entryMode === 'common' ? '2px solid var(--sapBrandColor)' : '1px solid var(--sapList_BorderColor)' }} onClick={() => setEntryMode('common')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: SP.s, marginBottom: SP.s }}>
                <Icon name="list" style={{ width: '1.25rem', height: '1.25rem', color: 'var(--sapBrandColor)' }} />
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>Choose a Common Question</span>
              </div>
              <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>
                Select from validated experiment templates defined in the Collections pack.
              </Text>
            </Card>
            <Card style={{ cursor: 'pointer', border: entryMode === 'freetext' ? '2px solid var(--sapBrandColor)' : '1px solid var(--sapList_BorderColor)' }} onClick={() => setEntryMode('freetext')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: SP.s, marginBottom: SP.s }}>
                <Icon name="write-new" style={{ width: '1.25rem', height: '1.25rem', color: 'var(--sapBrandColor)' }} />
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>Ask Your Own Question</span>
              </div>
              <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>
                Describe your business question in plain language. We'll recommend an experiment configuration.
              </Text>
            </Card>
          </div>

          {entryMode === 'common' && (
            <div style={{ marginBottom: SP.m }}>
              <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: SP.s }}>Collections Pack — Common Questions</span>
              {QUESTION_TEMPLATES.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  style={{
                    padding: SP.m,
                    marginBottom: SP.s,
                    border: selectedTemplate.id === t.id ? '2px solid var(--sapBrandColor)' : '1px solid var(--sapList_BorderColor)',
                    borderRadius: 8,
                    background: selectedTemplate.id === t.id ? 'var(--sapHighlightBackground, #e8f4fd)' : 'var(--sapTile_Background)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: SP.m }}>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', color: 'var(--sapTextColor)', flex: 1 }}>{t.question}</span>
                    <div style={{ display: 'flex', gap: SP.xs, flexShrink: 0 }}>
                      <Tag design="Set2" colorScheme="5">{t.taskTypes[0]}</Tag>
                      <ObjectStatus state={t.confidence === 'High' ? 'Positive' : t.confidence === 'Medium' ? 'Critical' : 'None'}>{t.confidence}</ObjectStatus>
                    </div>
                  </div>
                  <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginTop: SP.xs }}>
                    Objective: {t.businessObjective}
                  </Text>
                </div>
              ))}
            </div>
          )}

          {entryMode === 'freetext' && (
            <div style={{ marginBottom: SP.m }}>
              <Label showColon>Your business question</Label>
              <Input
                value={freeQuestion}
                onInput={(e) => setFreeQuestion(e.target.value)}
                placeholder="e.g. Can we identify receivables likely to be paid late?"
                style={{ display: 'block', marginTop: SP.xs, width: '100%' }}
              />
            </div>
          )}

          <Button design="Emphasized" icon="hint" onClick={handleGetRecommendation}>Get Recommendation →</Button>
        </div>
      )}

      {/* RECOMMENDATION STEP */}
      {step === 'recommend' && (
        <div>
          <SH title="Experiment Recommendation" />
          <Card style={{ marginBottom: SP.m, borderLeft: '4px solid var(--sapBrandColor)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SP.m }}>
              <div>
                <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', marginBottom: 4 }}>Business Objective</span>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', fontSize: 'var(--sapFontLargeSize)' }}>{selectedTemplate.businessObjective}</span>
              </div>
              <ObjectStatus state={selectedTemplate.confidence === 'High' ? 'Positive' : 'Critical'}>
                {selectedTemplate.confidence} Confidence
              </ObjectStatus>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: SP.m }}>
              {[
                ['Task Type', selectedTemplate.taskTypes[0]],
                ['Suggested Target', selectedTemplate.candidateTargets[0]],
                ['Target Availability', 'Available'],
              ].map(([k, v]) => (
                <div key={k}>
                  <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{k}</span>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapTextColor)' }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SP.m, marginBottom: SP.m }}>
            <Card>
              <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: SP.s }}>Suggested Features</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: SP.xs }}>
                {selectedTemplate.candidateFeatures.map(f => <Tag key={f} design="Set2" colorScheme="5">{f}</Tag>)}
              </div>
            </Card>
            <Card>
              <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: SP.s }}>Recommended Approaches</span>
              {selectedTemplate.recommendedApproaches.map(id => {
                const a = APPROACH_CATALOG.find(x => x.id === id);
                return a ? (
                  <div key={id} style={{ display: 'flex', justifyContent: 'space-between', paddingTop: SP.xs, paddingBottom: SP.xs, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{a.name}</span>
                    <ObjectStatus state={a.isReal ? 'Positive' : 'Information'}>{a.label}</ObjectStatus>
                  </div>
                ) : null;
              })}
            </Card>
          </div>

          <Card style={{ marginBottom: SP.m, background: 'var(--sapInformationBackground, #e8f4fd)', border: '1px solid var(--sapInformationColor)' }}>
            <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: SP.xs }}>Why these metrics?</span>
            <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>
              For collections prioritization, missing a high-risk late payer is more costly than reviewing an extra receivable — so Recall and F1 are prioritized over Precision.
            </Text>
          </Card>

          <div style={{ display: 'flex', gap: SP.s }}>
            <Button design="Emphasized" icon="accept" onClick={() => setStep('wizard')}>Accept Recommendation →</Button>
            <Button design="Transparent" onClick={() => setStep('entry')}>← Back</Button>
          </div>
        </div>
      )}

      {/* WIZARD */}
      {step === 'wizard' && (
        <div>
          {/* Step progress bar */}
          <div style={{ display: 'flex', gap: SP.s, marginBottom: SP.l, alignItems: 'center' }}>
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div style={{ display: 'flex', alignItems: 'center', gap: SP.xs }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: i + 1 <= wizardStep ? 'var(--sapBrandColor)' : 'var(--sapTile_Background)', border: '2px solid var(--sapBrandColor)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: i + 1 <= wizardStep ? '#fff' : 'var(--sapBrandColor)', fontWeight: 'bold' }}>{i + 1}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: i + 1 === wizardStep ? 'var(--sapBrandColor)' : 'var(--sapContent_LabelColor)', fontWeight: i + 1 === wizardStep ? 'var(--sapFontBoldWeight)' : 'normal' }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: 'var(--sapList_BorderColor)' }} />}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1: Define */}
          {wizardStep === 1 && (
            <Card>
              <SH title="Step 1 — Define Experiment" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SP.m }}>
                <div><Label showColon required>Experiment Name</Label><Input value={expName} onInput={e => setExpName(e.target.value)} style={{ display: 'block', marginTop: SP.xs, width: '100%' }} /></div>
                <div>
                  <Label showColon>Task Type</Label>
                  <Select style={{ display: 'block', marginTop: SP.xs }} onChange={e => setTaskType(e.detail.selectedOption.textContent as TaskType)}>
                    {TASK_TYPES.map(t => <Option key={t} selected={t === taskType}>{t}</Option>)}
                  </Select>
                </div>
                <div><Label showColon>Target Variable</Label><Input value={target} onInput={e => setTarget(e.target.value)} style={{ display: 'block', marginTop: SP.xs }} /></div>
                <div>
                  <Label showColon>Customer</Label>
                  <Input value="Northstar Manufacturing (Fictional)" readonly style={{ display: 'block', marginTop: SP.xs }} />
                </div>
              </div>
              <div style={{ marginTop: SP.m }}>
                <Label showColon>Experiment Question</Label>
                <Input value={question || selectedTemplate.question} onInput={e => setQuestion(e.target.value)} style={{ display: 'block', marginTop: SP.xs, width: '100%' }} />
              </div>
            </Card>
          )}

          {/* Step 2: Dataset */}
          {wizardStep === 2 && (
            <Card>
              <SH title="Step 2 — Select Dataset" />
              <MessageStrip design="Information" hideCloseButton style={{ marginBottom: SP.m }}>
                Select an existing dataset or create a new one in the Datasets section.
              </MessageStrip>
              {SEED_DATASETS.map(ds => (
                <div key={ds.id} onClick={() => setSelectedDatasetId(ds.id)} style={{ padding: SP.m, marginBottom: SP.s, border: selectedDatasetId === ds.id ? '2px solid var(--sapBrandColor)' : '1px solid var(--sapList_BorderColor)', borderRadius: 8, background: selectedDatasetId === ds.id ? 'var(--sapHighlightBackground, #e8f4fd)' : 'var(--sapTile_Background)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: SP.xs }}>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>{ds.name}</span>
                    <ObjectStatus state={ds.qualityStatus.includes('ML') ? 'Information' : ds.qualityStatus.includes('Proto') ? 'Positive' : 'None'}>{ds.qualityStatus}</ObjectStatus>
                  </div>
                  <div style={{ display: 'flex', gap: SP.m }}>
                    {[['Fidelity', ds.fidelityLevel], ['BPs', ds.recordCounts.bp.toLocaleString()], ['Receivables', ds.recordCounts.receivables.toLocaleString()], ['Created', ds.createdAt.slice(0,10)]].map(([k,v]) => (
                      <div key={k}><span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{k}: </span><span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{v}</span></div>
                    ))}
                  </div>
                </div>
              ))}
              <Button design="Transparent" icon="add" onClick={() => nav('datasets')}>Create New Dataset</Button>
            </Card>
          )}

          {/* Step 3: Feature Sets */}
          {wizardStep === 3 && (
            <Card>
              <SH title="Step 3 — Select Feature Sets" />
              {SEED_FEATURE_SETS.map(fs => (
                <div key={fs.id} onClick={() => setSelectedFeatureSets(prev => prev.includes(fs.id) ? prev.filter(x => x !== fs.id) : [...prev, fs.id])} style={{ padding: SP.m, marginBottom: SP.s, border: selectedFeatureSets.includes(fs.id) ? '2px solid var(--sapBrandColor)' : '1px solid var(--sapList_BorderColor)', borderRadius: 8, background: selectedFeatureSets.includes(fs.id) ? 'var(--sapHighlightBackground, #e8f4fd)' : 'var(--sapTile_Background)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: SP.xs }}>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>{fs.name} {fs.version}</span>
                    {selectedFeatureSets.includes(fs.id) && <Icon name="accept" style={{ width: '1rem', height: '1rem', color: 'var(--sapBrandColor)' }} />}
                  </div>
                  <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginBottom: SP.xs }}>{fs.description}</Text>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: SP.xs }}>
                    {fs.fields.map(f => <Tag key={f} design="Set2" colorScheme="5">{f}</Tag>)}
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* Step 4: Approaches */}
          {wizardStep === 4 && (
            <Card>
              <SH title="Step 4 — Select Approaches" />
              <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginBottom: SP.m }}>
                Compatible with {taskType}. Select approaches to compare in this experiment.
              </Text>
              {compatibleApproaches.map(a => (
                <div key={a.id} onClick={() => toggleApproach(a.id)} style={{ padding: SP.m, marginBottom: SP.s, border: selectedApproaches.includes(a.id) ? '2px solid var(--sapBrandColor)' : '1px solid var(--sapList_BorderColor)', borderRadius: 8, background: selectedApproaches.includes(a.id) ? 'var(--sapHighlightBackground, #e8f4fd)' : 'var(--sapTile_Background)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: SP.xs }}>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>{a.name}</span>
                    <div style={{ display: 'flex', gap: SP.xs }}>
                      <ObjectStatus state={a.isReal ? 'Positive' : 'Information'}>{a.label}</ObjectStatus>
                      {selectedApproaches.includes(a.id) && <Icon name="accept" style={{ width: '1rem', height: '1rem', color: 'var(--sapBrandColor)' }} />}
                    </div>
                  </div>
                  <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{a.description}</Text>
                </div>
              ))}
            </Card>
          )}

          {/* Step 5: Metrics */}
          {wizardStep === 5 && (
            <Card>
              <SH title="Step 5 — Evaluation Metrics" />
              <div style={{ marginBottom: SP.m }}>
                <Label showColon>Primary Metric</Label>
                <Select style={{ display: 'block', marginTop: SP.xs }} onChange={e => setPrimaryMetric(e.detail.selectedOption.textContent?.toLowerCase() || 'f1')}>
                  {metrics.map(m => <Option key={m} selected={m.toLowerCase() === primaryMetric.toLowerCase()}>{m}</Option>)}
                </Select>
              </div>
              <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: SP.s }}>Additional Metrics</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: SP.s }}>
                {metrics.map(m => (
                  <div key={m} onClick={() => toggleMetric(m)} style={{ padding: `${SP.xs} ${SP.m}`, border: selectedMetrics.includes(m) ? '2px solid var(--sapBrandColor)' : '1px solid var(--sapList_BorderColor)', borderRadius: 6, background: selectedMetrics.includes(m) ? 'var(--sapHighlightBackground, #e8f4fd)' : 'var(--sapTile_Background)', cursor: 'pointer', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: selectedMetrics.includes(m) ? 'var(--sapBrandColor)' : 'var(--sapTextColor)', fontWeight: selectedMetrics.includes(m) ? 'var(--sapFontBoldWeight)' : 'normal' }}>
                    {m}
                  </div>
                ))}
              </div>
              <MessageStrip design="Information" hideCloseButton style={{ marginTop: SP.m }}>
                For collections prioritization, Recall is prioritized — missing a high-risk late payer is more costly than reviewing an extra receivable.
              </MessageStrip>
            </Card>
          )}

          {/* Nav buttons */}
          <div style={{ display: 'flex', gap: SP.s, marginTop: SP.m }}>
            {wizardStep > 1 && <Button design="Transparent" onClick={() => setWizardStep(s => s - 1)}>← Back</Button>}
            {wizardStep < 5 && <Button design="Emphasized" onClick={() => setWizardStep(s => s + 1)}>Next →</Button>}
            {wizardStep === 5 && <Button design="Emphasized" icon="accept" onClick={handleCreate}>Create Experiment</Button>}
            <Button design="Transparent" onClick={() => nav('experiments')}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
