// @ts-nocheck
import React, { useState, useCallback } from 'react';
import {
  ThemeProvider,
  ShellBar,
  Avatar,
  ResponsivePopover,
  List,
  ListItemStandard,
  Toast,
  Button,
  MessageStrip,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-react/styles.css';
import '@ui5/webcomponents-icons/dist/AllIcons.js';
import '@ui5/webcomponents-fiori/dist/illustrations/AllIllustrations.js';

import type {
  SyntheticView,
  Engagement,
  DraftPack,
  GeneratedDataset,
  QualityCheck,
  RulesResult,
  MLResult,
  RPTResult,
  ReusableLearning,
  PackVersion,
  PackChange,
  Experiment,
  DatasetRecord,
  RunRecord,
  FeatureSet,
} from './types';
import {
  SP,
  SEED_LEARNINGS,
  INITIAL_PACK_VERSIONS,
  SEED_EXPERIMENTS,
  SEED_DATASETS,
  SEED_RUNS,
  SEED_FEATURE_SETS,
  SEED_ENGAGEMENTS,
} from './constants';

// V3 new views
import HomePage            from './views/HomePage';
import EngagementsList     from './views/EngagementsList';
import EngagementWorkspace from './views/EngagementWorkspace';
import PrototypePackage    from './views/PrototypePackage';
import PackCatalog         from './views/PackCatalog';
import PackCreate          from './views/PackCreate';
import PackDraftDetail     from './views/PackDraftDetail';
import PackPropose         from './views/PackPropose';
import EngagementCreate    from './views/EngagementCreate';

// V2 views (imported, not copied)
import PackDetail          from '../synthetic-data-v2/views/PackDetail';
import GenerateWizard      from '../synthetic-data-v2/views/GenerateWizard';
import DatasetPreview      from '../synthetic-data-v2/views/DatasetPreview';
import QualityReport       from '../synthetic-data-v2/views/QualityReport';
import ExperimentsList     from '../synthetic-data-v2/views/ExperimentsList';
import CreateExperiment    from '../synthetic-data-v2/views/CreateExperiment';
import ExperimentWorkspace from '../synthetic-data-v2/views/ExperimentWorkspace';
import { DatasetsList, FeatureSets } from '../synthetic-data-v2/views/DataManagement';
import KnowledgeLibrary    from '../synthetic-data-v2/views/KnowledgeLibrary';
import DatasetDetail       from '../synthetic-data-v2/views/DatasetDetail';
import ReusableLearnings   from '../synthetic-data-v2/views/ReusableLearnings';
import RunDetail           from '../synthetic-data-v2/views/RunDetail';
import PackVersioning      from '../synthetic-data-v2/views/PackVersioning';

// ─── Navigation ───────────────────────────────────────────────────────────────
const NAV_ITEMS_V3 = [
  { key: 'home',        label: 'Home',             icon: 'home',              group: 'WORK' },
  { key: 'engagements', label: 'Engagements',       icon: 'customer',          group: 'WORK' },
  { key: 'packs',       label: 'Experiment Packs',  icon: 'course-book',       group: 'REUSABLE ASSETS' },
  { key: 'datasets',    label: 'Datasets',          icon: 'add-document',      group: 'REUSABLE ASSETS' },
  { key: 'experiments', label: 'Experiments',       icon: 'lab',               group: 'ADVANCED' },
  { key: 'knowledge',   label: 'Knowledge Library', icon: 'learning-assistant', group: 'ADVANCED' },
];

const NAV_LABELS: Record<string, string> = {
  home: 'Home',
  engagements: 'Engagements',
  engagementDetail: 'Engagement',
  engagementContext: 'Customer Context',
  engagementCreate: 'Create New Engagement',
  prototypePackage: 'Prototype Package',
  packs: 'Experiment Packs',
  packDetail: 'Experiment Pack',
  datasets: 'Datasets',
  datasetDetail: 'Dataset Detail',
  experiments: 'Experiments',
  experimentCreate: 'Create Experiment',
  experimentWorkspace: 'Experiment Workspace',
  runDetail: 'Run Detail',
  knowledge: 'Knowledge Library',
  versioning: 'Pack Versions',
  generate: 'Generate Dataset',
  preview: 'Dataset Preview',
  quality: 'Quality Report',
  learnings: 'Reusable Learnings',
  featureSets: 'Feature Sets',
  dashboard: 'Overview',
};

function getNavKey(view: SyntheticView): string {
  if (['engagements', 'engagementDetail', 'engagementContext', 'prototypePackage', 'engagementCreate'].includes(view)) return 'engagements';
  if (['experiments', 'experimentCreate', 'experimentWorkspace', 'runDetail'].includes(view)) return 'experiments';
  if (['datasets', 'datasetDetail'].includes(view)) return 'datasets';
  if (['packs', 'packDetail', 'packCreate', 'packDraftDetail', 'packPropose'].includes(view)) return 'packs';
  return view;
}

const BACK_LABELS: Partial<Record<string, string>> = {
  engagementDetail: 'Back to Engagement',
  engagements: 'Back to Engagements',
  packs: 'Back to Experiment Packs',
  packDraftDetail: 'Back to Pack',
  datasets: 'Back to Datasets',
  home: 'Back to Home',
  experiments: 'Back to Experiments',
  knowledge: 'Back to Knowledge Library',
};

// ─── Custom Sidebar NavItem (stable component — must be outside render) ───────
interface NavItemDef { key: string; label: string; icon: string; group: string; }
const SideNavItemButton: React.FC<{ item: NavItemDef; active: boolean; onClick: () => void }> = ({ item, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 16px', border: 'none', width: '100%', textAlign: 'left',
      background: active ? 'var(--sapList_SelectionBackgroundColor, #e8f1ff)' : 'transparent',
      color: active ? 'var(--sapSelectedColor, #0070f2)' : 'var(--sapTextColor)',
      borderLeft: `3px solid ${active ? 'var(--sapHighlightColor, #0070f2)' : 'transparent'}`,
      fontWeight: active ? 600 : 400,
      fontSize: '0.875rem',
      fontFamily: 'var(--sapFontFamily, "72", Arial, sans-serif)',
      cursor: 'pointer',
      transition: 'background 0.15s',
    }}
    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--sapList_Hover_Background, #f5f5f5)'; }}
    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
  >
    <span style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', color: 'inherit', flexShrink: 0 }}>
      {/* Inline icon map — avoids UI5 web component rendering issues */}
      {item.icon === 'home'              && '⌂'}
      {item.icon === 'customer'          && '👤'}
      {item.icon === 'course-book'       && '📋'}
      {item.icon === 'add-document'      && '📄'}
      {item.icon === 'lab'               && '🧪'}
      {item.icon === 'learning-assistant' && '📚'}
    </span>
    {item.label}
  </button>
);

const SideNavSectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div style={{
    padding: '16px 16px 4px',
    fontSize: '0.6875rem', fontWeight: 700,
    color: 'var(--sapContent_LabelColor, #6a6d70)',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    userSelect: 'none',
  }}>
    {label}
  </div>
);

// ─── Root Component ───────────────────────────────────────────────────────────
const SyntheticDataV3Page: React.FC = () => {
  // Navigation — track previous view for context-aware back buttons
  const [activeView, setActiveView] = useState<SyntheticView>('home');
  const [prevView, setPrevView] = useState<SyntheticView | null>(null);
  // Use ref (not state) so the flag is always current inside nav() closure without recreating it
  const suppressPreviewNavRef = React.useRef(false);
  const nav = useCallback((v: SyntheticView) => {
    if (suppressPreviewNavRef.current && v === 'preview') {
      suppressPreviewNavRef.current = false;
      return; // swallow GenerateWizard's setTimeout nav('preview') when inside an engagement
    }
    setPrevView(current => current === v ? current : activeView as SyntheticView);
    setActiveView(v);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);
  const goBack = useCallback(() => {
    if (prevView) { setActiveView(prevView); setPrevView(null); }
    else setActiveView('home');
  }, [prevView]);

  // Shell state
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverOpener, setPopoverOpener] = useState<HTMLElement | null>(null);
  const [showTransparency, setShowTransparency] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastOpen, setToastOpen] = useState(false);
  const showToast = useCallback((msg: string) => { setToastMsg(msg); setToastOpen(true); }, []);

  // ── V3 Engagement state ──────────────────────────────────────────────────────
  const [engagements, setEngagements] = useState<Engagement[]>([...SEED_ENGAGEMENTS]);
  const [activeEngagementId, setActiveEngagementId] = useState<string | null>(null);
  const [justGeneratedDatasetId, setJustGeneratedDatasetId] = useState<string | null>(null);
  const activeEngagement = engagements.find(e => e.id === activeEngagementId) ?? null;

  const openEngagement = useCallback((id: string) => {
    setActiveEngagementId(id);
    setActiveView('engagementDetail');
  }, []);

  // Navigate to the create flow (two-option landing page)
  const handleNewEngagement = useCallback(() => {
    setActiveView('engagementCreate');
  }, []);

  // Called by EngagementCreate when user completes creation (either path)
  const handleCreateEngagement = useCallback((partial: Partial<Engagement> & { id: string }) => {
    const newEng: Engagement = {
      name: 'New Engagement',
      customer: 'Test Customer Name',
      useCaseName: '',
      businessProblem: '',
      neoNotes: '',
      packId: 'collections-v1',
      packVersion: 'v1.0',
      currentDatasetId: null,
      stage: 'use-case',
      customerSignal: null,
      customerFeedbackNotes: '',
      demoStatus: 'Not Started',
      demoLink: '',
      demoNotes: '',
      customerContextRaw: '',
      customerContextAnalysis: null,
      recommendationInput: '',
      recommendation: null,
      experimentId: null,
      createdAt: new Date().toISOString(),
      ...partial,
    } as Engagement;
    setEngagements(prev => [...prev, newEng]);
    setActiveEngagementId(newEng.id);
    setActiveView('engagementDetail');
  }, []);

  const handleUpdateEngagement = useCallback((updated: Engagement) => {
    setEngagements(prev => prev.map(e => e.id === updated.id ? updated : e));
  }, []);

  // ── Draft Packs ──────────────────────────────────────────────────────────────
  const [draftPacks, setDraftPacks] = useState<DraftPack[]>([]);
  const [activeDraftPackId, setActiveDraftPackId] = useState<string | null>(null);
  const activeDraftPack = draftPacks.find(p => p.id === activeDraftPackId) ?? null;

  const handleCreateDraftPack = useCallback((pack: DraftPack) => {
    setDraftPacks(prev => [...prev, pack]);
    setActiveDraftPackId(pack.id);
    setActiveView('packDraftDetail');
  }, []);

  const handleUpdateDraftPack = useCallback((updated: DraftPack) => {
    setDraftPacks(prev => prev.map(p => p.id === updated.id ? updated : p));
  }, []);

  // ── V2 legacy data state (for reused V2 views) ───────────────────────────────
  const [dataset, setDatasetState] = useState<GeneratedDataset | null>(null);
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [rulesResult, setRulesResult] = useState<RulesResult | null>(null);
  const [mlResult, setMlResult] = useState<MLResult | null>(null);
  const [rptResult, setRptResult] = useState<RPTResult | null>(null);
  const [learnings, setLearnings] = useState<ReusableLearning[]>([...SEED_LEARNINGS]);
  const [packVersions, setPackVersions] = useState<PackVersion[]>([...INITIAL_PACK_VERSIONS]);
  const [datasetsGenerated, setDatasetsGenerated] = useState(0);
  const [experimentsRun, setExperimentsRun] = useState(0);

  // V2 experiment/dataset/run state
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

  // Track where to return after closing DatasetDetail
  const [datasetDetailReturnView, setDatasetDetailReturnView] = useState<SyntheticView>('datasets');

  const openDataset = useCallback((id: string) => {
    setActiveDatasetId(id);
    // If we're inside an engagement, go back there after closing DatasetDetail
    setDatasetDetailReturnView(activeEngagementId ? 'engagementDetail' : 'datasets');
    setActiveView('datasetDetail');
  }, [activeEngagementId]);

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
    const newRecord: DatasetRecord = {
      id: `ds-v3-${d.config.fidelityLevel.toLowerCase()}-${Date.now()}`,
      name: `Dataset-${d.config.fidelityLevel}-v${datasetsGenerated + 2}`,
      experimentId: activeExperimentId || 'exp-001',
      packVersion: 'v1.0',
      fidelityLevel: d.config.fidelityLevel,
      customer: activeEngagement?.customer || 'Demo',
      config: d.config,
      seed: d.config.seed,
      recordCounts: { bp: d.stats.totalBP, receivables: d.stats.totalReceivables, payments: d.stats.totalPayments, dunning: d.stats.totalDunning, disputes: d.stats.totalDisputes },
      qualityStatus: q.every(c => c.passed) ? (d.config.fidelityLevel === 'L1' || d.config.fidelityLevel === 'L2' ? 'Ready for Prototyping' : 'Ready for Early ML Experimentation') : 'Needs Calibration',
      createdAt: new Date().toISOString(),
      lineage: `Generated from Collections v1.0 + ${d.config.fidelityLevel} config. Seed ${d.config.seed}.`,
    };
    setDatasetRecords(prev => [...prev, newRecord]);
    setJustGeneratedDatasetId(newRecord.id);
    // If there's an active engagement without a dataset, link it
    if (activeEngagement && !activeEngagement.currentDatasetId) {
      handleUpdateEngagement({ ...activeEngagement, currentDatasetId: newRecord.id });
    }
    // Navigate back to engagement if there is one
    if (activeEngagement) {
      suppressPreviewNavRef.current = true; // intercept GenerateWizard's upcoming nav('preview')
      setActiveView('engagementDetail');
    }
  }, [datasetsGenerated, activeExperimentId, activeEngagement, handleUpdateEngagement]);

  const handleAddRun = useCallback((run: RunRecord) => {
    setRuns(prev => [...prev, run]);
    setExperimentsRun(n => n + 1);
    if (activeExperimentId) {
      setExperiments(prev => prev.map(e =>
        e.id === activeExperimentId ? { ...e, runIds: [...e.runIds, run.id], status: 'Evaluating' } : e
      ));
    }
  }, [activeExperimentId]);

  const handleCreateExperiment = useCallback((exp: Experiment) => {
    setExperiments(prev => [...prev, exp]);
    setActiveExperimentId(exp.id);
  }, []);

  const handleProposeLearning = useCallback((learning: ReusableLearning) => {
    setLearnings(prev => [...prev, learning]);
    // Create or update Pack v1.1 Draft
    setPackVersions(prev => {
      const hasDraft = prev.some(v => v.version === 'v1.1' && v.status === 'Draft');
      const change: PackChange = {
        changeId: `C-${learning.learningId}`,
        description: learning.text.slice(0, 80) + (learning.text.length > 80 ? '…' : ''),
        changeType: 'rule_updated',
        linkedLearningId: learning.learningId,
      };
      if (!hasDraft) {
        return [...prev, {
          version: 'v1.1', status: 'Draft',
          createdAt: new Date().toISOString().split('T')[0],
          validatedAt: null, changes: [change], entityCount: 6, learningsIncorporated: 1,
        }];
      }
      return prev.map(v => v.version === 'v1.1'
        ? { ...v, changes: [...v.changes, change], learningsIncorporated: v.learningsIncorporated + 1 }
        : v);
    });
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────────
  const navKey = getNavKey(activeView);

  const renderContent = () => {
    switch (activeView) {
      case 'home':
        return <HomePage nav={nav} onNewEngagement={handleNewEngagement} engagements={engagements} />;

      case 'engagements':
        return (
          <EngagementsList
            nav={nav}
            engagements={engagements}
            onNewEngagement={handleNewEngagement}
            onOpenEngagement={openEngagement}
          />
        );

      case 'engagementCreate':
        return (
          <EngagementCreate
            nav={nav}
            onCreate={handleCreateEngagement}
            showToast={showToast}
          />
        );

      case 'engagementDetail':
      case 'engagementContext':
        return (
          <EngagementWorkspace
            nav={nav}
            engagement={activeEngagement}
            showContextPage={activeView === 'engagementContext'}
            datasets={datasetRecords}
            experiments={experiments}
            runs={runs}
            packVersions={packVersions}
            justGeneratedDatasetId={justGeneratedDatasetId}
            onUpdateEngagement={handleUpdateEngagement}
            onCreateExperiment={handleCreateExperiment}
            onAddRun={handleAddRun}
            showToast={showToast}
            onOpenContext={() => setActiveView('engagementContext')}
            onCloseContext={() => setActiveView('engagementDetail')}
            openDataset={openDataset}
          />
        );

      case 'prototypePackage':
        return (
          <PrototypePackage
            nav={nav}
            engagement={activeEngagement}
            dataset={datasetRecords.find(d => d.id === activeEngagement?.currentDatasetId) ?? null}
            generatedDataset={dataset}
          />
        );

      // ── V2 views (unchanged) ────────────────────────────────────────────────
      case 'packs':
        return (
          <PackCatalog
            nav={nav}
            onDefineNewPack={() => nav('packCreate')}
            onProposeUpdate={() => nav('packPropose')}
          />
        );

      case 'packDetail': {
        const backLabel = prevView ? (BACK_LABELS[prevView] ?? 'Back') : 'Back to Experiment Packs';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--sapGroup_TitleBorderColor)', background: 'var(--sapBaseColor)', display: 'flex', gap: 12, alignItems: 'center' }}>
              <Button design="Default" icon="nav-back" onClick={goBack}>← {backLabel}</Button>
              <Button design="Transparent" icon="add" onClick={() => nav('packPropose')}>Propose Pack Update</Button>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <PackDetail nav={nav} />
            </div>
          </div>
        );
      }

      case 'packCreate':
        return (
          <PackCreate
            nav={nav}
            goBack={goBack}
            onCreate={handleCreateDraftPack}
            showToast={showToast}
          />
        );

      case 'packDraftDetail':
        return (
          <PackDraftDetail
            draftPack={activeDraftPack}
            onUpdate={handleUpdateDraftPack}
            nav={nav}
            goBack={goBack}
            showToast={showToast}
          />
        );

      case 'packPropose':
        return (
          <PackPropose
            packName={prevView === 'packDraftDetail' && activeDraftPack ? activeDraftPack.name : 'Collections & Disputes v1.0'}
            runs={runs}
            learnings={learnings}
            packVersions={packVersions}
            onSubmit={handleProposeLearning}
            nav={nav}
            goBack={goBack}
            showToast={showToast}
          />
        );

      case 'datasets':
        return <DatasetsList nav={nav} datasets={datasetRecords} onOpenDataset={openDataset} />;

      case 'datasetDetail': {
        const dsBackLabel = prevView ? (BACK_LABELS[prevView] ?? 'Back') : 'Back to Datasets';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--sapGroup_TitleBorderColor)', background: 'var(--sapBaseColor)' }}>
              <Button design="Default" icon="nav-back" onClick={goBack}>← {dsBackLabel}</Button>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <DatasetDetail
                nav={nav}
                dataset={activeDatasetRecord}
                generatedDataset={dataset}
                qualityChecks={qualityChecks}
                experiments={experiments}
                runs={runs}
                onClose={goBack}
              />
            </div>
          </div>
        );
      }

      case 'generate':
        return <GenerateWizard nav={nav} onDatasetGenerated={handleDatasetGenerated} showToast={showToast} />;

      case 'preview':
        return <DatasetPreview nav={nav} dataset={dataset} />;

      case 'quality':
        return <QualityReport nav={nav} dataset={dataset} qualityChecks={qualityChecks} />;

      case 'experiments':
        return (
          <ExperimentsList
            nav={nav}
            experiments={experiments}
            onSelectExperiment={id => { setActiveExperimentId(id); nav('experimentWorkspace'); }}
          />
        );

      case 'experimentCreate':
        return <CreateExperiment nav={nav} onCreateExperiment={handleCreateExperiment} />;

      case 'experimentWorkspace':
        return (
          <ExperimentWorkspace
            nav={nav}
            experiment={activeExperiment}
            runs={runs}
            datasets={datasetRecords}
            onAddRun={handleAddRun}
            onOpenDataset={openDataset}
            onOpenRun={openRun}
          />
        );

      case 'runDetail':
        return <RunDetail nav={nav} run={activeRun} />;

      case 'knowledge':
        return (
          <KnowledgeLibrary
            nav={nav}
            learnings={learnings}
            setLearnings={setLearnings}
            packVersions={packVersions}
            setPackVersions={setPackVersions}
            showToast={showToast}
          />
        );

      case 'versioning':
        return (
          <PackVersioning
            nav={nav}
            packVersions={packVersions}
            setPackVersions={setPackVersions}
            learnings={learnings}
          />
        );

      case 'learnings':
        return (
          <ReusableLearnings
            nav={nav}
            learnings={learnings}
            setLearnings={setLearnings}
            packVersions={packVersions}
            setPackVersions={setPackVersions}
            showToast={showToast}
            rulesResult={rulesResult}
            mlResult={mlResult}
          />
        );

      case 'featureSets': {
        const fsBackLabel = prevView ? (BACK_LABELS[prevView] ?? 'Back') : 'Back to Experiment';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--sapGroup_TitleBorderColor)', background: 'var(--sapBaseColor)' }}>
              <Button design="Default" icon="nav-back" onClick={goBack}>← {fsBackLabel}</Button>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <FeatureSets
                nav={nav}
                featureSets={featureSets}
                onAddFeatureSet={fs => setFeatureSets(prev => [...prev, fs])}
              />
            </div>
          </div>
        );
      }

      default:
        return <HomePage nav={nav} onNewEngagement={handleNewEngagement} engagements={engagements} />;
    }
  };

  return (
    <ThemeProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--sapBackgroundColor)' }}>

        {/* ShellBar */}
        <ShellBar
          primaryTitle="SAP Experiment Accelerator"
          secondaryTitle={NAV_LABELS[activeView] ?? activeView}
          logo={<img src="https://www.sap.com/dam/application/shared/logos/sap-logo-svg.svg/sap-logo-svg.svg" alt="SAP" style={{ height: 32 }} />}
          profile={<Avatar slot="profile" initials="PM" colorScheme="Accent6" />}
          onProfileClick={e => { setPopoverOpener(e.detail.targetRef); setPopoverOpen(true); }}
        >
          <Button slot="endContent" icon="question-mark" design="Transparent" onClick={() => setShowTransparency(v => !v)} title="Transparency" />
        </ShellBar>

        {showTransparency && (
          <MessageStrip design="Information" onClose={() => setShowTransparency(false)} style={{ borderRadius: 0 }}>
            <strong>What is real:</strong> Data generation, FK integrity, Rules baseline, Logistic Regression, Gradient Boosting, XGBoost (requires Python), Quality engine.
            &nbsp;<strong>Demo/simulated:</strong> RPT adapter (logistic regression proxy), AI context classification, AI recommendation (keyword matching), LLM evaluation.
          </MessageStrip>
        )}

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Custom Sidebar — static section labels, no collapsible groups */}
          <div style={{
            width: 240, flexShrink: 0,
            background: 'var(--sapList_Background, #fff)',
            borderRight: '1px solid var(--sapGroup_TitleBorderColor, #e5e5e5)',
            overflowY: 'auto',
            display: 'flex', flexDirection: 'column',
            paddingBottom: 16,
          }}>
            {(['WORK', 'REUSABLE ASSETS', 'ADVANCED'] as const).map(group => (
              <div key={group}>
                <SideNavSectionLabel label={group === 'REUSABLE ASSETS' ? 'Reusable Assets' : group.charAt(0) + group.slice(1).toLowerCase()} />
                {NAV_ITEMS_V3.filter(i => i.group === group).map(item => (
                  <SideNavItemButton
                    key={item.key}
                    item={item}
                    active={navKey === item.key}
                    onClick={() => nav(item.key as SyntheticView)}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {renderContent()}
          </div>
        </div>

        {/* Profile Popover */}
        <ResponsivePopover
          open={popoverOpen}
          opener={popoverOpener ?? undefined}
          onClose={() => setPopoverOpen(false)}
          placementType="Bottom"
        >
          <List>
            <ListItemStandard icon="person-placeholder">PM User</ListItemStandard>
            <ListItemStandard icon="log" onClick={() => { setPopoverOpen(false); nav('home'); }}>Home</ListItemStandard>
          </List>
        </ResponsivePopover>

        {/* Toast */}
        <Toast open={toastOpen} onClose={() => setToastOpen(false)}>{toastMsg}</Toast>
      </div>
    </ThemeProvider>
  );
};

export default SyntheticDataV3Page;
