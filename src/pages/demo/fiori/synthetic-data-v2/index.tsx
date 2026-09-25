// @ts-nocheck
import React, { useState, useCallback } from 'react';
import {
  ThemeProvider,
  ShellBar,
  Avatar,
  ResponsivePopover,
  List,
  ListItemStandard,
  SideNavigation,
  SideNavigationItem,
  SideNavigationSubItem,
  Toast,
  Button,
  MessageStrip,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-react/styles.css';
import '@ui5/webcomponents-icons/dist/AllIcons.js';
import '@ui5/webcomponents-fiori/dist/illustrations/AllIllustrations.js';

import type {
  SyntheticView,
  GeneratedDataset,
  QualityCheck,
  RulesResult,
  MLResult,
  RPTResult,
  ReusableLearning,
  PackVersion,
  Experiment,
  DatasetRecord,
  RunRecord,
  FeatureSet,
} from './types';
import {
  NAV_ITEMS, NAV_LABELS, SEED_LEARNINGS, INITIAL_PACK_VERSIONS, SP,
  SEED_EXPERIMENTS, SEED_DATASETS, SEED_RUNS, SEED_FEATURE_SETS,
} from './constants';

import OverviewDashboard  from './views/OverviewDashboard';
import PackDetail         from './views/PackDetail';
import GenerateWizard     from './views/GenerateWizard';
import DatasetPreview     from './views/DatasetPreview';
import QualityReport      from './views/QualityReport';
import ExperimentLab      from './views/ExperimentLab';
import ReusableLearnings  from './views/ReusableLearnings';
import PackVersioning     from './views/PackVersioning';

// V2 new views
import CreateExperiment   from './views/CreateExperiment';
import ExperimentsList    from './views/ExperimentsList';
import ExperimentWorkspace from './views/ExperimentWorkspace';
import { DatasetsList, FeatureSets, ApproachCatalog } from './views/DataManagement';
// V2 refinement views
import KnowledgeLibrary   from './views/KnowledgeLibrary';
import DatasetDetail      from './views/DatasetDetail';
import RunDetail          from './views/RunDetail';

// ─── Simplified nav (WORK / ASSETS / GOVERNANCE) ──────────────────────────────
const NAV_ITEMS_V2 = [
  { key: 'dashboard',   label: 'Overview',           icon: 'home',             group: 'WORK' },
  { key: 'experiments', label: 'Experiments',         icon: 'lab',              group: 'WORK' },
  { key: 'datasets',    label: 'Datasets',            icon: 'add-document',     group: 'WORK' },
  { key: 'packDetail',  label: 'Experiment Pack',     icon: 'course-book',      group: 'ASSETS' },
  { key: 'knowledge',   label: 'Knowledge Library',   icon: 'learning-assistant', group: 'ASSETS' },
  { key: 'versioning',  label: 'Pack Versions',       icon: 'version',          group: 'GOVERNANCE' },
];

const ALL_NAV_LABELS: Record<string, string> = {
  dashboard: 'Overview',
  packDetail: 'Collections Pack',
  experiments: 'Experiments',
  experimentCreate: 'Create Experiment',
  experimentWorkspace: 'Experiment Workspace',
  datasets: 'Datasets',
  datasetDetail: 'Dataset Detail',
  featureSets: 'Feature Sets',
  approaches: 'Approach Catalog',
  generate: 'Generate Dataset',
  preview: 'Dataset Preview',
  quality: 'Quality Report',
  experiment: 'Experiment Lab',
  learnings: 'Reusable Learnings',
  knowledge: 'Knowledge Library',
  runDetail: 'Run Detail',
  versioning: 'Pack Versions',
};

// ─── Guided Demo Steps ─────────────────────────────────────────────────────────
const DEMO_STEPS = [
  { view: 'packDetail' as SyntheticView, title: 'Open Collections Pack', tip: 'The team starts with reusable domain knowledge — not from zero.' },
  { view: 'packDetail' as SyntheticView, title: 'Inspect Receivable Schema', tip: 'This is the assistant-specific consumption model, not the full S/4 schema. Click "Receivable" to see field details.' },
  { view: 'experimentCreate' as SyntheticView, title: 'Create Experiment', tip: 'Define the business question: "Can we predict late payment for collections prioritization?"' },
  { view: 'datasets' as SyntheticView, title: 'View Datasets', tip: 'Datasets are versioned and immutable. Northstar-L1-v1 and Northstar-L3-v1 are already available.' },
  { view: 'generate' as SyntheticView, title: 'Generate L3 Dataset', tip: 'Select L3 — Customer Profile & Scenarios. Edit the late payment rate (17%) and add a representative scenario.' },
  { view: 'quality' as SyntheticView, title: 'Data Quality Report', tip: 'All critical checks pass. L3 dataset is "Ready for Early ML Experimentation."' },
  { view: 'featureSets' as SyntheticView, title: 'Feature Sets', tip: 'Baseline and Behavioral feature sets are defined. Behavioral adds historical late-payment count.' },
  { view: 'experimentWorkspace' as SyntheticView, title: 'Run Rules Baseline', tip: 'Rules Baseline is real deterministic logic. F1: 0.70 on L3 Northstar data.' },
  { view: 'experimentWorkspace' as SyntheticView, title: 'Run Logistic Regression', tip: 'Real logistic regression. F1: 0.77 — improvement over rules baseline.' },
  { view: 'experimentWorkspace' as SyntheticView, title: 'Run Gradient Boosting', tip: 'Real gradient boosting. F1: 0.83 on Behavioral features — best so far.' },
  { view: 'experimentWorkspace' as SyntheticView, title: 'Run RPT Demo Adapter', tip: 'RPT is a demo adapter — results are illustrative. Labeled "DEMO ADAPTER" throughout.' },
  { view: 'experimentWorkspace' as SyntheticView, title: 'Compare Runs', tip: 'Switch to Compare tab. Change optimization goal — leading candidate updates.' },
  { view: 'learnings' as SyntheticView, title: 'Capture Reusable Learning', tip: 'Behavioral features improve F1 from 0.70 to 0.83. This is generalized — propose for pack.' },
  { view: 'versioning' as SyntheticView, title: 'Propose Pack v1.1', tip: 'v1.0 stays unchanged. v1.1 Draft proposed. Customer transactional records copied: NO.' },
];

const SyntheticDataV2Page: React.FC = () => {
  // ── Navigation ──────────────────────────────────────────────────────────────
  const [activeView, setActiveView] = useState<SyntheticView>('dashboard');
  const nav = useCallback((v: SyntheticView) => setActiveView(v), []);

  // ── Shell state ─────────────────────────────────────────────────────────────
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverOpener, setPopoverOpener] = useState<HTMLElement | null>(null);
  const [showTransparency, setShowTransparency] = useState(false);

  // ── Toast ────────────────────────────────────────────────────────────────────
  const [toastMsg, setToastMsg] = useState('');
  const [toastOpen, setToastOpen] = useState(false);
  const showToast = useCallback((msg: string) => { setToastMsg(msg); setToastOpen(true); }, []);

  // ── Guided Demo ──────────────────────────────────────────────────────────────
  const [demoActive, setDemoActive] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const startDemo = () => { setDemoActive(true); setDemoStep(0); nav(DEMO_STEPS[0].view); };
  const demoNext = () => { const next = Math.min(demoStep + 1, DEMO_STEPS.length - 1); setDemoStep(next); nav(DEMO_STEPS[next].view); };
  const demoBack = () => { const prev = Math.max(demoStep - 1, 0); setDemoStep(prev); nav(DEMO_STEPS[prev].view); };
  const demoExit = () => { setDemoActive(false); nav('dashboard'); };

  // ── Legacy data state (for existing views) ───────────────────────────────────
  const [dataset, setDatasetState] = useState<GeneratedDataset | null>(null);
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [rulesResult, setRulesResult] = useState<RulesResult | null>(null);
  const [mlResult, setMlResult] = useState<MLResult | null>(null);
  const [rptResult, setRptResult] = useState<RPTResult | null>(null);
  const [learnings, setLearnings] = useState<ReusableLearning[]>([...SEED_LEARNINGS]);
  const [packVersions, setPackVersions] = useState<PackVersion[]>([...INITIAL_PACK_VERSIONS]);
  const [datasetsGenerated, setDatasetsGenerated] = useState(0);
  const [experimentsRun, setExperimentsRun] = useState(0);

  // ── V2 data state ────────────────────────────────────────────────────────────
  const [experiments, setExperiments] = useState<Experiment[]>(SEED_EXPERIMENTS ? [...SEED_EXPERIMENTS] : []);
  const [datasetRecords, setDatasetRecords] = useState<DatasetRecord[]>(SEED_DATASETS ? [...SEED_DATASETS] : []);
  const [runs, setRuns] = useState<RunRecord[]>(SEED_RUNS ? [...SEED_RUNS] : []);
  const [featureSets, setFeatureSets] = useState<FeatureSet[]>(SEED_FEATURE_SETS ? [...SEED_FEATURE_SETS] : []);
  const [activeExperimentId, setActiveExperimentId] = useState<string | null>('exp-001');
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  const activeExperiment = experiments.find(e => e.id === activeExperimentId) || null;
  const activeDatasetRecord = datasetRecords.find(d => d.id === activeDatasetId) || null;
  const activeRun = runs.find(r => r.id === activeRunId) || null;

  const openDataset = useCallback((id: string) => {
    setActiveDatasetId(id);
    setActiveView('datasetDetail');
  }, []);

  const openRun = useCallback((id: string) => {
    setActiveRunId(id);
    setActiveView('runDetail');
  }, []);

  const handleDatasetGenerated = useCallback((d: GeneratedDataset, q: QualityCheck[]) => {
    setDatasetState(d);
    setQualityChecks(q);
    setRulesResult(null);
    setMlResult(null);
    setRptResult(null);
    setDatasetsGenerated(n => n + 1);
    // Also create a DatasetRecord
    const newRecord: DatasetRecord = {
      id: `ds-northstar-${d.config.fidelityLevel.toLowerCase()}-v${datasetsGenerated + 2}`,
      name: `Northstar-${d.config.fidelityLevel}-v${datasetsGenerated + 2}`,
      experimentId: activeExperimentId || 'exp-001',
      packVersion: 'v1.0',
      fidelityLevel: d.config.fidelityLevel,
      customer: 'Northstar Manufacturing',
      config: d.config,
      seed: d.config.seed,
      recordCounts: { bp: d.stats.totalBP, receivables: d.stats.totalReceivables, payments: d.stats.totalPayments, dunning: d.stats.totalDunning, disputes: d.stats.totalDisputes },
      qualityStatus: q.every(c => c.passed) ? (d.config.fidelityLevel === 'L1' || d.config.fidelityLevel === 'L2' ? 'Ready for Prototyping' : 'Ready for Early ML Experimentation') : 'Needs Calibration',
      createdAt: new Date().toISOString(),
      lineage: `Generated from Collections v1.0 + ${d.config.fidelityLevel} config. Seed ${d.config.seed}.`,
    };
    setDatasetRecords(prev => [...prev, newRecord]);
  }, [datasetsGenerated, activeExperimentId]);

  const handleAddRun = useCallback((run: RunRecord) => {
    setRuns(prev => [...prev, run]);
    setExperimentsRun(n => n + 1);
    if (activeExperimentId) {
      setExperiments(prev => prev.map(e => e.id === activeExperimentId ? { ...e, runIds: [...e.runIds, run.id], status: 'Evaluating' } : e));
    }
  }, [activeExperimentId]);

  const handleCreateExperiment = useCallback((exp: Experiment) => {
    setExperiments(prev => [...prev, exp]);
    setActiveExperimentId(exp.id);
  }, []);

  return (
    <ThemeProvider>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--sapBackgroundColor)' }}>

        {/* Shell */}
        <ShellBar
          primaryTitle="SAP Experiment Accelerator"
          secondaryTitle={ALL_NAV_LABELS[activeView] || activeView}
          logo={
            <img src="https://www.sap.com/dam/application/shared/logos/sap-logo-svg.svg/sap-logo-svg.svg" alt="SAP" style={{ height: 28 }} />
          }
          profile={
            <Avatar slot="profile" colorScheme="Accent6" shape="Circle" size="XS" initials="NM" accessibleName="Northstar Manufacturing" />
          }
          onProfileClick={(e) => {
            setPopoverOpener(e.detail.targetRef as HTMLElement);
            setPopoverOpen(true);
          }}
        >
          <Button slot="endContent" design="Transparent" icon="question-mark" onClick={() => setShowTransparency(!showTransparency)} title="Prototype Transparency" />
        </ShellBar>

        <ResponsivePopover open={popoverOpen} opener={popoverOpener ?? undefined} placement="Bottom" onClose={() => setPopoverOpen(false)}>
          <List>
            <ListItemStandard icon="person-placeholder">Demo User — Northstar Manufacturing (Fictional)</ListItemStandard>
            <ListItemStandard icon="action-settings">Settings</ListItemStandard>
            <ListItemStandard icon="log">Sign Out</ListItemStandard>
          </List>
        </ResponsivePopover>

        {/* Transparency panel */}
        {showTransparency && (
          <div style={{ padding: SP.m, background: 'var(--sapObjectHeader_Background)', borderBottom: '1px solid var(--sapList_BorderColor)', flexShrink: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SP.m, maxWidth: 900 }}>
              <div style={{ padding: SP.s, background: 'var(--sapPositiveBackground, #f5fae5)', border: '1px solid var(--sapPositiveColor)', borderRadius: 6 }}>
                <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapPositiveColor)', marginBottom: 4 }}>REAL IN PROTOTYPE</span>
                {['Seeded PRNG data generation (FK-validated, signal-rich)', 'Rules Baseline (heuristic)', 'Gradient Boosting / JS mlFallback.ts (real training)', 'RPT via logistic regression adapter (rptEngine.ts)', 'Quality engine (12 checks, distribution validation)', 'Dataset versioning', 'Run tracking (immutable records)', 'Pack versioning with change traceability'].map(i => (
                  <div key={i} style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)', paddingTop: 2 }}>✓ {i}</div>
                ))}
              </div>
              <div style={{ padding: SP.s, background: 'var(--sapNeutralBackground, #f5f5f5)', border: '1px solid var(--sapNeutralColor, #ccc)', borderRadius: 6 }}>
                <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapContent_LabelColor)', marginBottom: 4 }}>DEMO / ADAPTER</span>
                {['Live SAP Domain Model integration', 'Live FSCM / S/4 connectivity', 'Live SAP-RPT integration', 'Production governance & privacy guarantees', 'Multi-tenancy, authentication', 'Hyperparameter optimization', 'LLM/agent evaluation'].map(i => (
                  <div key={i} style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', paddingTop: 2 }}>— {i}</div>
                ))}
              </div>
            </div>
            <button onClick={() => setShowTransparency(false)} style={{ marginTop: SP.s, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapBrandColor)' }}>Close ✕</button>
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Sidebar */}
          <div style={{ width: 224, flexShrink: 0, borderRight: '1px solid var(--sapList_BorderColor)', overflowY: 'auto' }}>
            <div style={{ padding: SP.s }}>
              <Button design="Emphasized" style={{ width: '100%' }} icon="add" onClick={() => nav('experimentCreate')}>Create Experiment</Button>
            </div>
            {!demoActive && (
              <div style={{ padding: SP.s, paddingTop: 0 }}>
                <Button design="Transparent" style={{ width: '100%' }} icon="journey-arrive" onClick={startDemo}>Run Guided Demo</Button>
              </div>
            )}
            <SideNavigation
              collapsed={false}
              onSelectionChange={(e) => {
                const key = e.detail.item.getAttribute('data-key') as SyntheticView;
                if (key) nav(key);
              }}
            >
              {/* Group headers + nav items */}
              {['WORK', 'ASSETS', 'GOVERNANCE'].map(group => {
                const groupItems = NAV_ITEMS_V2.filter(i => i.group === group);
                return (
                  <React.Fragment key={group}>
                    <div style={{ padding: `${SP.s} ${SP.m} 2px`, fontFamily: 'var(--sapFontFamily)', fontSize: '0.65rem', color: 'var(--sapContent_LabelColor)', fontWeight: 'var(--sapFontBoldWeight)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{group}</div>
                    {groupItems.map(item => (
                      <SideNavigationItem
                        key={item.key}
                        data-key={item.key}
                        text={item.label}
                        icon={item.icon}
                        selected={
                          activeView === item.key ||
                          (item.key === 'experiments' && ['experimentWorkspace', 'experimentCreate', 'runDetail'].includes(activeView)) ||
                          (item.key === 'datasets' && activeView === 'datasetDetail')
                        }
                      />
                    ))}
                  </React.Fragment>
                );
              })}
            </SideNavigation>
          </div>

          {/* Main content */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activeView === 'dashboard' && (
              <OverviewDashboard nav={nav} dataset={dataset} packVersions={packVersions} datasetsGenerated={datasetsGenerated} experimentsRun={experimentsRun} rulesResult={rulesResult} mlResult={mlResult} />
            )}
            {activeView === 'packDetail' && <PackDetail nav={nav} />}
            {activeView === 'experiments' && (
              <ExperimentsList nav={nav} experiments={experiments} onSelectExperiment={(id) => setActiveExperimentId(id)} />
            )}
            {activeView === 'experimentCreate' && (
              <CreateExperiment nav={nav} onCreateExperiment={handleCreateExperiment} />
            )}
            {activeView === 'experimentWorkspace' && (
              <ExperimentWorkspace nav={nav} experiment={activeExperiment} runs={runs} datasets={datasetRecords} onAddRun={handleAddRun} onOpenDataset={openDataset} onOpenRun={openRun} />
            )}
            {activeView === 'datasets' && (
              <DatasetsList nav={nav} datasets={datasetRecords} onOpenDataset={openDataset} />
            )}
            {activeView === 'datasetDetail' && (
              <DatasetDetail nav={nav} dataset={activeDatasetRecord} generatedDataset={dataset} qualityChecks={qualityChecks} experiments={experiments} runs={runs} onClose={() => setActiveView('datasets')} />
            )}
            {activeView === 'runDetail' && (
              <RunDetail nav={nav} run={activeRun} experiment={activeExperiment} dataset={activeDatasetRecord} onClose={() => { setActiveView('experimentWorkspace'); }} />
            )}
            {activeView === 'featureSets' && (
              <FeatureSets nav={nav} featureSets={featureSets} onAddFeatureSet={(fs) => setFeatureSets(prev => [...prev, fs])} />
            )}
            {activeView === 'approaches' && <ApproachCatalog nav={nav} />}
            {activeView === 'generate' && (
              <GenerateWizard nav={nav} onDatasetGenerated={handleDatasetGenerated} showToast={showToast} />
            )}
            {activeView === 'preview' && <DatasetPreview nav={nav} dataset={dataset} />}
            {activeView === 'quality' && (
              <QualityReport nav={nav} dataset={dataset} qualityChecks={qualityChecks} />
            )}
            {activeView === 'knowledge' && (
              <KnowledgeLibrary nav={nav} learnings={learnings} setLearnings={setLearnings} packVersions={packVersions} setPackVersions={setPackVersions} showToast={showToast} />
            )}
            {activeView === 'learnings' && (
              <ReusableLearnings nav={nav} learnings={learnings} setLearnings={setLearnings} packVersions={packVersions} setPackVersions={setPackVersions} showToast={showToast} rulesResult={rulesResult} mlResult={mlResult} />
            )}
            {activeView === 'versioning' && (
              <PackVersioning nav={nav} packVersions={packVersions} setPackVersions={setPackVersions} showToast={showToast} />
            )}
          </div>
        </div>

        {/* Guided Demo floating bar */}
        {demoActive && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, background: 'var(--sapObjectHeader_Background)', borderTop: '2px solid var(--sapBrandColor)', padding: SP.m, display: 'flex', alignItems: 'center', gap: SP.m, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: SP.s, minWidth: 120 }}>
              <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapBrandColor)', fontSize: 'var(--sapFontSmallSize)' }}>Guided Demo</span>
              <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>Step {demoStep + 1} / {DEMO_STEPS.length}</span>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginRight: SP.s }}>{DEMO_STEPS[demoStep].title}</span>
              <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', fontStyle: 'italic' }}>{DEMO_STEPS[demoStep].tip}</span>
            </div>
            <div style={{ display: 'flex', gap: SP.s }}>
              <Button design="Transparent" onClick={demoBack} disabled={demoStep === 0}>← Back</Button>
              <Button design="Emphasized" onClick={demoNext} disabled={demoStep === DEMO_STEPS.length - 1}>Next →</Button>
              <Button design="Transparent" onClick={demoExit}>Exit Demo</Button>
            </div>
          </div>
        )}

        <Toast open={toastOpen} duration={3500} placement="BottomCenter" onClose={() => setToastOpen(false)}>{toastMsg}</Toast>
      </div>
    </ThemeProvider>
  );
};

export default SyntheticDataV2Page;
