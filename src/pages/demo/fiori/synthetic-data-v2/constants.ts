import type { GenerationConfig, PackVersion, ReusableLearning, SyntheticView } from './types';

// ─── SAP Spacing Tokens ────────────────────────────────────────────────────────
export const SP = {
  xs: 'var(--sapSpacingXSmallSize, 0.25rem)',
  s:  'var(--sapSpacingSmallSize, 0.5rem)',
  m:  'var(--sapSpacingMediumSize, 1rem)',
  l:  'var(--sapSpacingLargeSize, 1.5rem)',
  xl: '2rem',
  g:  'var(--sapContent_GridGutter, 1rem)',
} as const;

// ─── Demo Company ──────────────────────────────────────────────────────────────
export const NORTHSTAR = {
  name: 'Northstar Manufacturing',
  bpCount: 25000,
  recCount: 500000,
  demoBpCount: 5000,       // actual generation count for demo speed
  demoRecCount: 50000,     // actual generation count for demo speed
  latePaymentRate: 0.17,
  disputeRate: 0.063,
  meanInvoiceAmount: 4218,
  medianInvoiceAmount: 1340,
  p95InvoiceAmount: 18400,
  currency: 'EUR' as const,
  countryWeights: { DE: 0.45, US: 0.35, FR: 0.10, OTHER: 0.10 },
  riskWeights: { LOW: 0.55, MEDIUM: 0.30, HIGH: 0.15 },
  customFields: ['ZZ_RISK_CATEGORY', 'ZZ_PAYMENT_CHANNEL'],
  customTables: ['Z_COLLECTION_HISTORY'],
  seed: 42,
};

// ─── Default Generation Config ────────────────────────────────────────────────
export const DEFAULT_CONFIG: GenerationConfig = {
  bpCount: 2000,
  recCount: 20000,
  seed: 42,
  latePaymentRate: 0.15,
  disputeRate: 0.06,
  startDate: '2022-01-01',
  endDate: '2024-12-31',
  fidelityLevel: 'L1',
  includeDunning: true,
  includeDisputes: true,
  includeCollectionHistory: false,
  currency: 'EUR',
  meanInvoiceAmount: 4200,
  countryWeights: { DE: 0.35, US: 0.30, FR: 0.15, GB: 0.10, OTHER: 0.10 },
  riskWeights: { LOW: 0.55, MEDIUM: 0.30, HIGH: 0.15 },
};

// ─── Sidebar Navigation ───────────────────────────────────────────────────────
export const NAV_ITEMS: Array<{ key: SyntheticView; label: string; icon: string }> = [
  { key: 'dashboard',   label: 'Overview',              icon: 'home' },
  { key: 'packDetail',  label: 'Collections Pack',      icon: 'course-book' },
  { key: 'generate',    label: 'Generate Data',         icon: 'add-document' },
  { key: 'preview',     label: 'Dataset Preview',       icon: 'table-view' },
  { key: 'quality',     label: 'Quality Report',        icon: 'quality-issue' },
  { key: 'experiment',  label: 'Experiment Lab',        icon: 'activities' },
  { key: 'learnings',   label: 'Reusable Learnings',    icon: 'learning-assistant' },
  { key: 'versioning',  label: 'Pack Versioning',       icon: 'version' },
];

export const NAV_LABELS: Record<SyntheticView, string> = {
  dashboard:  'Overview',
  packDetail: 'Collections Pack',
  generate:   'Generate Data',
  preview:    'Dataset Preview',
  quality:    'Quality Report',
  experiment: 'Experiment Lab',
  learnings:  'Reusable Learnings',
  versioning: 'Pack Versioning',
};

// ─── Collections & Disputes Pack Definition ───────────────────────────────────
export const COLLECTIONS_PACK = {
  name: 'Collections & Disputes',
  version: 'v1.0',
  status: 'Validated' as const,
  businessProblem: 'Improve collections prioritization and identify receivables likely to be paid late or disputed.',
  sapProducts: ['FSCM', 'S/4 Accounts Receivable'],
  sapMapping: 'FSCM + S/4 Accounts Receivable',
  schemaSource: ['Finance/FSCM Domain Model', 'CDS / SAP semantic assets'],
  entities: [
    { name: 'BUSINESS_PARTNER', table: 'KNA1', fieldCount: 10, type: 'Master' },
    { name: 'RECEIVABLE',       table: 'BSID/BKPF', fieldCount: 11, type: 'Transaction' },
    { name: 'PAYMENT',          table: 'BKPF',  fieldCount: 6,  type: 'Transaction' },
    { name: 'DUNNING',          table: 'MHND',  fieldCount: 5,  type: 'Activity' },
    { name: 'DISPUTE',          table: 'UDM_DISPUTE', fieldCount: 7, type: 'Activity' },
    { name: 'Z_COLLECTION_HISTORY', table: 'Custom', fieldCount: 7, type: 'Extension' },
  ],
  businessConstraints: [
    'Every Receivable must reference a valid Business Partner',
    'Every Payment must reference a valid Receivable',
    'Every Dunning record must reference a valid Receivable',
    'Every Dispute must reference a valid Receivable',
    'due_date >= invoice_date',
    'payment_date >= invoice_date',
    'dunning_date >= due_date',
    'dispute_open_date >= invoice_date',
    'payment_amount must be positive',
    'invoice_amount must be positive',
    'dispute_amount <= invoice_amount',
    'open_amount cannot be negative',
  ],
  experimentTargets: [
    { name: 'Late Payment Prediction', target: 'late_payment_flag', type: 'binary' },
    { name: 'Dispute Prediction',      target: 'has_dispute',       type: 'binary' },
    { name: 'Propensity to Pay',       target: 'days_to_payment',   type: 'regression' },
    { name: 'Collections Prioritization', target: 'priority_score', type: 'ranking' },
  ],
  generationDefaults: {
    latePaymentRate: 0.15,
    disputeRate: 0.06,
    avgInvoiceDays: 30,
    dunningThresholdDays: 30,
  },
};

// ─── Entity Field Schemas ─────────────────────────────────────────────────────
export const ENTITY_SCHEMAS: Record<string, Array<{
  name: string; type: string; constraint: 'PK' | 'FK' | null; nullable: boolean; description: string;
}>> = {
  BUSINESS_PARTNER: [
    { name: 'business_partner_id', type: 'STRING',   constraint: 'PK', nullable: false, description: 'Unique partner ID' },
    { name: 'country',             type: 'CATEGORY', constraint: null, nullable: false, description: 'Country code (DE, US, FR, GB, ...)' },
    { name: 'company_code',        type: 'CATEGORY', constraint: null, nullable: false, description: 'SAP company code' },
    { name: 'industry',            type: 'CATEGORY', constraint: null, nullable: false, description: 'Industry segment' },
    { name: 'customer_since',      type: 'DATE',     constraint: null, nullable: false, description: 'First transaction date' },
    { name: 'credit_segment',      type: 'CATEGORY', constraint: null, nullable: false, description: 'Credit rating (A–D)' },
    { name: 'risk_segment',        type: 'CATEGORY', constraint: null, nullable: false, description: 'Collections risk (LOW/MEDIUM/HIGH)' },
    { name: 'annual_revenue',      type: 'NUMBER',   constraint: null, nullable: false, description: 'Estimated annual revenue' },
    { name: 'ZZ_RISK_CATEGORY',    type: 'CATEGORY', constraint: null, nullable: true,  description: 'Custom: internal risk label' },
    { name: 'ZZ_PAYMENT_CHANNEL',  type: 'CATEGORY', constraint: null, nullable: true,  description: 'Custom: preferred payment channel' },
  ],
  RECEIVABLE: [
    { name: 'receivable_id',        type: 'STRING',   constraint: 'PK', nullable: false, description: 'Unique document ID' },
    { name: 'business_partner_id',  type: 'STRING',   constraint: 'FK', nullable: false, description: '→ BUSINESS_PARTNER' },
    { name: 'invoice_date',         type: 'DATE',     constraint: null, nullable: false, description: 'Document posting date' },
    { name: 'due_date',             type: 'DATE',     constraint: null, nullable: false, description: 'Net payment due date' },
    { name: 'invoice_amount',       type: 'NUMBER',   constraint: null, nullable: false, description: 'Gross invoice amount' },
    { name: 'currency',             type: 'CATEGORY', constraint: null, nullable: false, description: 'Currency key' },
    { name: 'payment_terms_days',   type: 'INTEGER',  constraint: null, nullable: false, description: 'Net payment terms (days)' },
    { name: 'company_code',         type: 'CATEGORY', constraint: null, nullable: false, description: 'SAP company code' },
    { name: 'document_type',        type: 'CATEGORY', constraint: null, nullable: false, description: 'FI document type (RV, R1, DR)' },
    { name: 'open_amount',          type: 'NUMBER',   constraint: null, nullable: false, description: 'Remaining open amount' },
    { name: 'clearing_status',      type: 'CATEGORY', constraint: null, nullable: false, description: 'OPEN / CLEARED / PARTIAL' },
  ],
  PAYMENT: [
    { name: 'payment_id',          type: 'STRING',   constraint: 'PK', nullable: false, description: 'Payment document ID' },
    { name: 'receivable_id',       type: 'STRING',   constraint: 'FK', nullable: false, description: '→ RECEIVABLE' },
    { name: 'payment_date',        type: 'DATE',     constraint: null, nullable: false, description: 'Value date of payment' },
    { name: 'payment_amount',      type: 'NUMBER',   constraint: null, nullable: false, description: 'Payment amount' },
    { name: 'payment_method',      type: 'CATEGORY', constraint: null, nullable: false, description: 'Method (BANK_TRANSFER, CHECK, ...)' },
    { name: 'clearing_document',   type: 'STRING',   constraint: null, nullable: false, description: 'Clearing document reference' },
  ],
  DUNNING: [
    { name: 'dunning_id',     type: 'STRING',  constraint: 'PK', nullable: false, description: 'Dunning notice ID' },
    { name: 'receivable_id',  type: 'STRING',  constraint: 'FK', nullable: false, description: '→ RECEIVABLE' },
    { name: 'dunning_date',   type: 'DATE',    constraint: null, nullable: false, description: 'Date notice was issued' },
    { name: 'dunning_level',  type: 'INTEGER', constraint: null, nullable: false, description: 'Escalation level (1–3)' },
    { name: 'dunning_amount', type: 'NUMBER',  constraint: null, nullable: false, description: 'Amount included in notice' },
  ],
  DISPUTE: [
    { name: 'dispute_id',         type: 'STRING',   constraint: 'PK',  nullable: false, description: 'Dispute case ID' },
    { name: 'receivable_id',      type: 'STRING',   constraint: 'FK',  nullable: false, description: '→ RECEIVABLE' },
    { name: 'dispute_open_date',  type: 'DATE',     constraint: null,  nullable: false, description: 'Date dispute was opened' },
    { name: 'dispute_reason',     type: 'CATEGORY', constraint: null,  nullable: false, description: 'Reason code' },
    { name: 'dispute_amount',     type: 'NUMBER',   constraint: null,  nullable: false, description: 'Amount in dispute' },
    { name: 'dispute_status',     type: 'CATEGORY', constraint: null,  nullable: false, description: 'OPEN / RESOLVED / WITHDRAWN' },
    { name: 'resolution_date',    type: 'DATE',     constraint: null,  nullable: true,  description: 'Date resolved (null if open)' },
  ],
  Z_COLLECTION_HISTORY: [
    { name: 'collection_history_id', type: 'STRING',   constraint: 'PK', nullable: false, description: 'Custom: History record ID' },
    { name: 'business_partner_id',   type: 'STRING',   constraint: 'FK', nullable: false, description: '→ BUSINESS_PARTNER' },
    { name: 'contact_date',          type: 'DATE',     constraint: null, nullable: false, description: 'Date of collector contact' },
    { name: 'contact_type',          type: 'CATEGORY', constraint: null, nullable: false, description: 'EMAIL / PHONE / LETTER / VISIT' },
    { name: 'promise_to_pay',        type: 'BOOLEAN',  constraint: null, nullable: false, description: 'Customer committed to pay' },
    { name: 'promise_amount',        type: 'NUMBER',   constraint: null, nullable: true,  description: 'Promised payment amount (nullable)' },
    { name: 'collector_team',        type: 'CATEGORY', constraint: null, nullable: false, description: 'Collector team assignment' },
  ],
};

// ─── Fidelity Level Descriptions ─────────────────────────────────────────────
export const FIDELITY_LEVELS = [
  {
    level: 'L1' as const,
    title: 'SAP Baseline',
    desc: 'No customer data required. Generate the first dataset using the validated Collections Experiment Pack and SAP/domain defaults.',
    note: 'Use for demos, application development, and early prototyping.',
    status: 'Positive' as const,
    statusLabel: 'Ready',
    dataNeeded: 'None',
    estimatedTime: '~10 seconds',
  },
  {
    level: 'L2' as const,
    title: 'Customer Schema',
    desc: 'Add what is structurally different about this customer without requiring transactional data.',
    note: 'Schema and relationship metadata only — no actual rows needed.',
    status: 'Positive' as const,
    statusLabel: 'Ready',
    dataNeeded: 'Schema metadata, Z-table definitions',
    estimatedTime: '~15 seconds',
  },
  {
    level: 'L3' as const,
    title: 'Customer Profile',
    desc: 'Calibrate the data using customer statistics without requiring individual transactional rows.',
    note: 'Provides meaningful signal for ML experimentation.',
    status: 'Information' as const,
    statusLabel: 'Profile Needed',
    dataNeeded: 'Statistical summary (counts, rates, distributions)',
    estimatedTime: '~20 seconds',
  },
  {
    level: 'L4' as const,
    title: 'Customer Sample',
    desc: 'Use an approved sample to further calibrate distributions and relationships.',
    note: 'Demo capability. Synthetic generation does not by itself guarantee privacy.',
    status: 'Critical' as const,
    statusLabel: 'Approval Needed',
    dataNeeded: 'Approved sample CSV files',
    estimatedTime: '~30 seconds',
  },
];

// ─── Initial Pack Versions ─────────────────────────────────────────────────────
export const INITIAL_PACK_VERSIONS: PackVersion[] = [
  {
    version: 'v1.0',
    status: 'Validated',
    createdAt: '2023-06-15',
    validatedAt: '2023-09-01',
    changes: [],
    entityCount: 6,
    learningsIncorporated: 0,
  },
];

// ─── Pre-seeded Learnings ─────────────────────────────────────────────────────
export const SEED_LEARNINGS: ReusableLearning[] = [
  { learningId: 'L001', domain: 'AR Collections', text: 'Historical late-payment count is consistently the strongest predictor across customer engagements.', capturedAt: '2024-01-15', source: 'pre-seeded', proposedForPack: false },
  { learningId: 'L002', domain: 'AR Collections', text: 'Risk segment shows meaningful separation: HIGH-risk accounts are 2.5× more likely to pay late than LOW-risk.', capturedAt: '2024-01-15', source: 'pre-seeded', proposedForPack: false },
  { learningId: 'L003', domain: 'AR Collections', text: 'Payment terms ≥ 60 days combined with invoice amount > €10K is a reliable rule trigger for late payment.', capturedAt: '2023-11-20', source: 'pre-seeded', proposedForPack: false },
  { learningId: 'L004', domain: 'AR Collections', text: 'Invoice amount > €50K may require a separate scoring segment — model performance diverges above this threshold.', capturedAt: '2023-09-08', source: 'pre-seeded', proposedForPack: false },
  { learningId: 'L005', domain: 'AR Collections', text: 'Dunning level 2+ accounts have <12% recovery rate without direct escalation in German manufacturing customers.', capturedAt: '2023-07-22', source: 'pre-seeded', proposedForPack: false },
  { learningId: 'L006', domain: 'AR Collections', text: 'Customer payment history from the last 90 days outweighs lifetime history as a predictive feature.', capturedAt: '2023-05-14', source: 'pre-seeded', proposedForPack: false },
  { learningId: 'L007', domain: 'AR Collections', text: 'Prior dispute count is a leading indicator for future disputes with 0.78 precision.', capturedAt: '2023-03-30', source: 'pre-seeded', proposedForPack: false },
  { learningId: 'L008', domain: 'AR Collections', text: 'XGBoost typically outperforms rules baseline by 10–15 F1 points when historical data is available.', capturedAt: '2022-11-05', source: 'pre-seeded', proposedForPack: false },
  { learningId: 'L009', domain: 'O2C',           text: 'Billing block duration is a strong proxy for revenue leakage risk in Order-to-Cash scenarios.', capturedAt: '2023-09-08', source: 'pre-seeded', proposedForPack: false },
  { learningId: 'L010', domain: 'O2C',           text: 'Delivery delay > 5 days predicts dispute opening with 0.78 precision in manufacturing customers.', capturedAt: '2023-03-30', source: 'pre-seeded', proposedForPack: false },
  { learningId: 'L011', domain: 'Procurement',   text: '3-way match failure rate correlates strongly with new supplier onboarding month.', capturedAt: '2023-07-22', source: 'pre-seeded', proposedForPack: false },
  { learningId: 'L012', domain: 'Procurement',   text: 'GR/IR clearing backlog > 30 days signals matching model retraining needed.', capturedAt: '2022-11-05', source: 'pre-seeded', proposedForPack: false },
];

// ─── Flywheel Steps ───────────────────────────────────────────────────────────
export const FLYWHEEL_STEPS = [
  { icon: 'course-book',      label: 'Known Assistant',             desc: 'Proven Experiment Pack available' },
  { icon: 'add-document',     label: 'Add Customer Context',        desc: 'Schema, profile, or sample' },
  { icon: 'process',          label: 'Generate Synthetic Data',     desc: 'FK-validated, signal-rich dataset' },
  { icon: 'activities',       label: 'Test Approaches',             desc: 'Rules, XGBoost, RPT comparison' },
  { icon: 'learning-assistant', label: 'Capture Reusable Learnings', desc: 'Generalized findings → SAP IP' },
  { icon: 'version',          label: 'Improve the Pack',            desc: 'Pack v1.1 Draft proposed' },
  { icon: 'journey-arrive',   label: 'Next Engagement Starts Ahead', desc: 'Each cycle reduces time-to-experiment' },
];

// ─── Procurement Pack (placeholder) ──────────────────────────────────────────
export const PROCUREMENT_PACK = {
  name: 'Procurement Assistant',
  version: 'v0.1',
  status: 'Draft' as const,
  sapMapping: 'Ariba / Procurement',
  entities: ['Supplier', 'Purchase Order', 'PO Item', 'Goods Receipt', 'Invoice'],
  note: 'Pack creation in progress. Validates that the pack pattern works outside Finance.',
};

// ─── V2: Approach Catalog ─────────────────────────────────────────────────────
import type { ApproachConfig, TaskType } from './types';

const CLS: TaskType[] = ['Binary Classification', 'Multiclass Classification'];
const REG: TaskType[] = ['Regression'];
const ALL_SV: TaskType[] = [...CLS, ...REG, 'Ranking', 'Forecasting', 'Rules/Decisioning'];

export const APPROACH_CATALOG: ApproachConfig[] = [
  { id: 'rules', name: 'Rules Baseline', taskTypes: ALL_SV, isReal: true, label: 'REAL', description: 'Deterministic heuristic baseline. Interpretable, zero training time. Establishes the floor every ML approach must beat.', defaultParams: { threshold: 0.5 } },
  { id: 'logreg', name: 'Logistic Regression', taskTypes: CLS, isReal: true, label: 'REAL', description: 'Interpretable linear classification. Strong baseline; fast to train; works well when features are near-linear in log-odds space.', defaultParams: { max_iter: 100, C: 1.0 } },
  { id: 'rf', name: 'Random Forest', taskTypes: [...CLS, ...REG], isReal: true, label: 'REAL', description: 'Ensemble of decision trees. Robust to outliers, handles mixed feature types. Good mid-complexity option.', defaultParams: { n_estimators: 100, max_depth: 8, seed: 42 } },
  { id: 'gbm', name: 'Gradient Boosting', taskTypes: [...CLS, ...REG], isReal: true, label: 'REAL', description: 'Boosted tree ensemble. Strong performance on structured tabular data. The JS fallback (mlFallback.ts) runs in-browser when Python is unavailable.', defaultParams: { n_estimators: 150, max_depth: 5, learning_rate: 0.1, seed: 42 } },
  { id: 'xgboost', name: 'XGBoost', taskTypes: [...CLS, ...REG], isReal: true, label: 'REAL', description: 'Optimized gradient boosting. State-of-the-art for structured data. Runs via Python API endpoint when available; JS fallback otherwise.', defaultParams: { n_estimators: 200, max_depth: 6, learning_rate: 0.08, subsample: 0.9, seed: 42 } },
  { id: 'svm', name: 'SVM', taskTypes: CLS, isReal: false, label: 'DEMO MODEL', description: 'Support Vector Machine. Effective in high-dimensional spaces. Demo model with illustrative metrics.', defaultParams: { C: 1.0, kernel: 'rbf', gamma: 'scale' } },
  { id: 'rpt', name: 'SAP-RPT Adapter', taskTypes: [...CLS, ...REG], isReal: false, label: 'DEMO ADAPTER', description: 'Logistic regression trained in the browser as a proxy for SAP-RPT. Live SAP-RPT integration is not connected. Results are illustrative.', defaultParams: { iterations: 50, learning_rate: 0.01 } },
];

// ─── V2: Feature Sets ─────────────────────────────────────────────────────────
import type { FeatureSet } from './types';

export const SEED_FEATURE_SETS: FeatureSet[] = [
  {
    id: 'fs-baseline-v1',
    name: 'Baseline',
    version: 'v1',
    description: 'Core invoice and customer attributes. No behavioral history required.',
    fields: ['invoice_amount', 'payment_terms_days', 'risk_segment', 'customer_tenure_days'],
    createdAt: '2025-08-01T09:00:00Z',
  },
  {
    id: 'fs-behavioral-v1',
    name: 'Behavioral',
    version: 'v1',
    description: 'Baseline + historical behavioral signals. Requires minimum 90-day history.',
    fields: ['invoice_amount', 'payment_terms_days', 'risk_segment', 'customer_tenure_days', 'historical_late_payment_count', 'historical_dispute_count', 'days_outstanding'],
    createdAt: '2025-08-01T09:05:00Z',
  },
];

// ─── V2: Question Templates ───────────────────────────────────────────────────
import type { QuestionTemplate } from './types';

export const QUESTION_TEMPLATES: QuestionTemplate[] = [
  {
    id: 'qt-late-payment',
    question: 'Can we identify receivables likely to be paid late so collections work can be prioritized?',
    businessObjective: 'Collections Prioritization',
    taskTypes: ['Binary Classification'],
    candidateTargets: ['late_payment_flag'],
    candidateFeatures: ['historical_late_payment_count', 'risk_segment', 'payment_terms_days', 'invoice_amount', 'customer_tenure_days', 'historical_dispute_count', 'days_outstanding'],
    recommendedApproaches: ['rules', 'logreg', 'gbm', 'xgboost', 'rpt'],
    recommendedMetrics: ['recall', 'f1', 'auc', 'precision'],
    confidence: 'High',
    requiredData: ['Receivable', 'Business Partner', 'Payment history'],
  },
  {
    id: 'qt-dispute-risk',
    question: 'Which receivables are likely to become disputes?',
    businessObjective: 'Dispute Risk Identification',
    taskTypes: ['Binary Classification'],
    candidateTargets: ['dispute_flag'],
    candidateFeatures: ['invoice_amount', 'risk_segment', 'payment_terms_days', 'historical_dispute_count'],
    recommendedApproaches: ['rules', 'logreg', 'gbm', 'xgboost'],
    recommendedMetrics: ['precision', 'recall', 'f1'],
    confidence: 'Medium',
    requiredData: ['Receivable', 'Business Partner', 'Dispute history'],
  },
  {
    id: 'qt-collections-priority',
    question: 'Which accounts should collectors prioritize this week?',
    businessObjective: 'Collections Queue Prioritization',
    taskTypes: ['Ranking', 'Binary Classification'],
    candidateTargets: ['late_payment_flag', 'collections_priority_score'],
    candidateFeatures: ['historical_late_payment_count', 'risk_segment', 'days_outstanding', 'invoice_amount', 'dunning_level'],
    recommendedApproaches: ['rules', 'gbm', 'xgboost'],
    recommendedMetrics: ['recall', 'precision', 'f1', 'auc'],
    confidence: 'High',
    requiredData: ['Receivable', 'Business Partner', 'Dunning', 'Payment history'],
  },
  {
    id: 'qt-payment-amount',
    question: 'How much is a customer likely to pay in the next 30 days?',
    businessObjective: 'Cash Flow Forecasting',
    taskTypes: ['Regression', 'Forecasting'],
    candidateTargets: ['expected_payment_30d'],
    candidateFeatures: ['invoice_amount', 'payment_terms_days', 'risk_segment', 'historical_late_payment_count'],
    recommendedApproaches: ['rules', 'rf', 'gbm', 'xgboost'],
    recommendedMetrics: ['mae', 'rmse', 'r2'],
    confidence: 'Medium',
    requiredData: ['Receivable', 'Business Partner', 'Payment history'],
  },
];

// ─── V2: Seed Experiments ─────────────────────────────────────────────────────
import type { Experiment } from './types';

export const SEED_EXPERIMENTS: Experiment[] = [
  {
    id: 'exp-001',
    name: 'Northstar Late Payment Prediction',
    packId: 'collections-v1',
    packVersion: 'v1.0',
    customer: 'Northstar Manufacturing',
    taskType: 'Binary Classification',
    target: 'late_payment_flag',
    question: 'Can we identify receivables likely to be paid late so collections work can be prioritized?',
    businessObjective: 'Collections Prioritization',
    featureSetIds: ['fs-baseline-v1', 'fs-behavioral-v1'],
    approachIds: ['rules', 'logreg', 'gbm', 'rpt'],
    primaryMetric: 'f1',
    datasetIds: ['ds-northstar-l1-v1', 'ds-northstar-l3-v1'],
    runIds: ['run-001', 'run-002', 'run-003', 'run-004', 'run-005', 'run-006', 'run-007'],
    status: 'Evaluating',
    createdAt: '2025-09-01T10:00:00Z',
  },
];

// ─── V2: Seed Datasets ────────────────────────────────────────────────────────
import type { DatasetRecord } from './types';

export const SEED_DATASETS: DatasetRecord[] = [
  {
    id: 'ds-northstar-l1-v1',
    name: 'Northstar-L1-v1',
    experimentId: 'exp-001',
    packVersion: 'v1.0',
    fidelityLevel: 'L1',
    customer: 'Northstar Manufacturing',
    config: { bpCount: 500, recCount: 10000, latePaymentRate: 0.15, disputeRate: 0.06, seed: 42 },
    seed: 42,
    recordCounts: { bp: 500, receivables: 10000, payments: 6200, dunning: 890, disputes: 580 },
    qualityStatus: 'Ready for Prototyping',
    createdAt: '2025-09-01T10:30:00Z',
    lineage: 'Generated from Collections v1.0 SAP defaults. Seed 42.',
  },
  {
    id: 'ds-northstar-l3-v1',
    name: 'Northstar-L3-v1',
    experimentId: 'exp-001',
    packVersion: 'v1.0',
    fidelityLevel: 'L3',
    customer: 'Northstar Manufacturing',
    config: { bpCount: 25000, recCount: 500000, latePaymentRate: 0.17, disputeRate: 0.063, seed: 42 },
    seed: 42,
    recordCounts: { bp: 25000, receivables: 500000, payments: 318000, dunning: 44200, disputes: 30800 },
    qualityStatus: 'Ready for Early ML Experimentation',
    createdAt: '2025-09-03T14:15:00Z',
    lineage: 'Generated from Collections v1.0 + Northstar L3 profile (17% late, 6.3% dispute, 3 scenarios). Seed 42.',
  },
];

// ─── V2: Seed Runs ────────────────────────────────────────────────────────────
import type { RunRecord } from './types';

export const SEED_RUNS: RunRecord[] = [
  { id: 'run-001', experimentId: 'exp-001', datasetId: 'ds-northstar-l1-v1', featureSetId: 'fs-baseline-v1', approachId: 'rules', parameters: { threshold: 0.5 }, seed: 42, metrics: { accuracy: 0.74, precision: 0.71, recall: 0.58, f1: 0.64, auc: 0.72 }, runtime: '<1s', status: 'Completed', isReal: true, approachLabel: 'REAL', createdAt: '2025-09-01T11:00:00Z' },
  { id: 'run-002', experimentId: 'exp-001', datasetId: 'ds-northstar-l3-v1', featureSetId: 'fs-baseline-v1', approachId: 'rules', parameters: { threshold: 0.5 }, seed: 42, metrics: { accuracy: 0.76, precision: 0.73, recall: 0.61, f1: 0.67, auc: 0.74 }, runtime: '2s', status: 'Completed', isReal: true, approachLabel: 'REAL', createdAt: '2025-09-03T15:00:00Z' },
  { id: 'run-003', experimentId: 'exp-001', datasetId: 'ds-northstar-l3-v1', featureSetId: 'fs-behavioral-v1', approachId: 'rules', parameters: { threshold: 0.5 }, seed: 42, metrics: { accuracy: 0.79, precision: 0.76, recall: 0.65, f1: 0.70, auc: 0.77 }, runtime: '2s', status: 'Completed', isReal: true, approachLabel: 'REAL', createdAt: '2025-09-03T15:10:00Z' },
  { id: 'run-004', experimentId: 'exp-001', datasetId: 'ds-northstar-l3-v1', featureSetId: 'fs-baseline-v1', approachId: 'logreg', parameters: { max_iter: 100, C: 1.0 }, seed: 42, metrics: { accuracy: 0.81, precision: 0.78, recall: 0.72, f1: 0.75, auc: 0.83 }, runtime: '4s', status: 'Completed', isReal: true, approachLabel: 'REAL', createdAt: '2025-09-04T09:00:00Z' },
  { id: 'run-005', experimentId: 'exp-001', datasetId: 'ds-northstar-l3-v1', featureSetId: 'fs-behavioral-v1', approachId: 'logreg', parameters: { max_iter: 100, C: 1.0 }, seed: 42, metrics: { accuracy: 0.83, precision: 0.80, recall: 0.74, f1: 0.77, auc: 0.85 }, runtime: '5s', status: 'Completed', isReal: true, approachLabel: 'REAL', createdAt: '2025-09-04T09:15:00Z' },
  { id: 'run-006', experimentId: 'exp-001', datasetId: 'ds-northstar-l3-v1', featureSetId: 'fs-baseline-v1', approachId: 'gbm', parameters: { n_estimators: 150, max_depth: 5, learning_rate: 0.1, seed: 42 }, seed: 42, metrics: { accuracy: 0.86, precision: 0.83, recall: 0.79, f1: 0.81, auc: 0.88 }, runtime: '38s', status: 'Completed', isReal: true, approachLabel: 'REAL', createdAt: '2025-09-04T10:00:00Z' },
  { id: 'run-007', experimentId: 'exp-001', datasetId: 'ds-northstar-l3-v1', featureSetId: 'fs-behavioral-v1', approachId: 'gbm', parameters: { n_estimators: 150, max_depth: 5, learning_rate: 0.1, seed: 42 }, seed: 42, metrics: { accuracy: 0.88, precision: 0.85, recall: 0.82, f1: 0.83, auc: 0.90 }, runtime: '47s', status: 'Completed', isReal: true, approachLabel: 'REAL', createdAt: '2025-09-04T10:20:00Z' },
];

// ─── Pack Experiment Patterns (Collections & Disputes) ───────────────────────
export interface PackExperimentPattern {
  id: string;
  name: string;
  businessQuestion: string;
  businessObjective: string;
  taskType: string;
  target: string;
  targetStatus: 'Available' | 'Derivable';
  requiredData: string[];
  candidateApproaches: string[];
  recommendedMetrics: string[];
  validationStatus: 'Validated' | 'Draft';
}

export const PACK_EXPERIMENT_PATTERNS: PackExperimentPattern[] = [
  {
    id: 'pat-001',
    name: 'Late Payment Prediction',
    businessQuestion: 'Which receivables are likely to be paid late?',
    businessObjective: 'Identify at-risk receivables early so collections can prioritize intervention.',
    taskType: 'Binary Classification',
    target: 'late_payment_flag',
    targetStatus: 'Available',
    requiredData: ['Receivable', 'Business Partner', 'Payment history'],
    candidateApproaches: ['Rules Baseline', 'Logistic Regression', 'Gradient Boosting', 'XGBoost', 'RPT Adapter'],
    recommendedMetrics: ['Recall', 'F1', 'AUC'],
    validationStatus: 'Validated',
  },
  {
    id: 'pat-002',
    name: 'Collections Prioritization',
    businessQuestion: 'Which accounts should collectors work first?',
    businessObjective: 'Rank open receivables so collections teams focus on the highest-value, highest-risk accounts.',
    taskType: 'Ranking / Binary Classification',
    target: 'collections_priority_score',
    targetStatus: 'Derivable',
    requiredData: ['Receivable', 'Business Partner', 'Dunning records', 'Payment history'],
    candidateApproaches: ['Rules Baseline', 'Gradient Boosting', 'XGBoost'],
    recommendedMetrics: ['Recall at Top-20%', 'AUC'],
    validationStatus: 'Validated',
  },
  {
    id: 'pat-003',
    name: 'Dispute Prediction',
    businessQuestion: 'Which receivables are likely to enter dispute?',
    businessObjective: 'Flag invoices at risk of dispute before they are formally opened to reduce dispute volume.',
    taskType: 'Binary Classification',
    target: 'dispute_flag',
    targetStatus: 'Derivable',
    requiredData: ['Receivable', 'Business Partner', 'Dispute history'],
    candidateApproaches: ['Rules Baseline', 'Logistic Regression', 'Gradient Boosting'],
    recommendedMetrics: ['Precision', 'F1'],
    validationStatus: 'Validated',
  },
  {
    id: 'pat-004',
    name: 'Propensity to Pay',
    businessQuestion: 'Which customers are likely to pay after collections outreach?',
    businessObjective: 'Identify customers most responsive to collections contact to maximize recovery rate.',
    taskType: 'Binary Classification',
    target: 'payment_after_contact',
    targetStatus: 'Derivable',
    requiredData: ['Business Partner', 'Collection history', 'Payment history'],
    candidateApproaches: ['Rules Baseline', 'Logistic Regression', 'XGBoost'],
    recommendedMetrics: ['Precision', 'Recall', 'F1'],
    validationStatus: 'Draft',
  },
  {
    id: 'pat-005',
    name: 'Expected Collections Amount',
    businessQuestion: 'How much are we likely to collect in the next 30 days?',
    businessObjective: 'Forecast cash inflows from accounts receivable to support treasury planning.',
    taskType: 'Regression / Forecasting',
    target: 'expected_payment_30d',
    targetStatus: 'Derivable',
    requiredData: ['Receivable', 'Business Partner', 'Payment history'],
    candidateApproaches: ['Rules Baseline', 'Random Forest', 'Gradient Boosting', 'XGBoost'],
    recommendedMetrics: ['MAE', 'RMSE'],
    validationStatus: 'Draft',
  },
];

// ─── Field Access Mappings ────────────────────────────────────────────────────
// Maps Pack schema fields to SAP data sources and retrieval methods.
// IMPORTANT: All mappings are Candidate (illustrative). Confirm with SAP product
// team before production use. No specific service endpoints are named.

import type { FieldAccessMapping, PackDataAccessSummary } from '../../../demo/fiori/synthetic-data-v3/types';

export const FIELD_ACCESS_MAPPINGS: FieldAccessMapping[] = [
  // ── Business Partner ────────────────────────────────────────────────────────
  { fieldName: 'business_partner_id', entity: 'Business Partner', businessMeaning: 'Unique customer identifier', sapProduct: 'S/4HANA', sourceObject: 'Business Partner master', accessMethod: 'Standard API', apiService: 'Business Partner API', operation: 'Read', requiredFilters: ['Company Code'], status: 'Candidate', notes: 'Illustrative mapping — confirm with SAP product team', customerSpecific: false },
  { fieldName: 'country', entity: 'Business Partner', businessMeaning: 'Country of domicile', sapProduct: 'S/4HANA', sourceObject: 'Business Partner master', accessMethod: 'Standard API', apiService: 'Business Partner API', operation: 'Read', requiredFilters: ['Business Partner ID'], status: 'Candidate', notes: 'Illustrative mapping', customerSpecific: false },
  { fieldName: 'industry', entity: 'Business Partner', businessMeaning: 'Industry classification', sapProduct: 'S/4HANA', sourceObject: 'Business Partner master', accessMethod: 'Standard API', apiService: 'Business Partner API', operation: 'Read', requiredFilters: ['Business Partner ID'], status: 'Candidate', notes: 'Illustrative mapping', customerSpecific: false },
  { fieldName: 'credit_segment', entity: 'Business Partner', businessMeaning: 'Credit rating (A–D)', sapProduct: 'S/4HANA Credit Management', sourceObject: 'Credit account / FI-AR', accessMethod: 'Standard API', apiService: 'Accounts Receivable API', operation: 'Read', requiredFilters: ['Company Code', 'Business Partner ID'], status: 'Candidate', notes: 'Illustrative mapping', customerSpecific: false },
  { fieldName: 'risk_segment', entity: 'Business Partner', businessMeaning: 'Collections risk tier (LOW/MEDIUM/HIGH)', sapProduct: 'FSCM / Collections Management', sourceObject: 'Collections segment / BP', accessMethod: 'Standard API', apiService: 'Collections Management API', operation: 'Read', requiredFilters: ['Company Code', 'Business Partner ID'], status: 'Candidate', notes: 'Illustrative mapping — may require Collections Management activation', customerSpecific: false },
  { fieldName: 'annual_revenue', entity: 'Business Partner', businessMeaning: 'Estimated annual revenue', sapProduct: 'S/4HANA', sourceObject: 'Business Partner master', accessMethod: 'Standard API', apiService: 'Business Partner API', operation: 'Read', requiredFilters: ['Business Partner ID'], status: 'Candidate', notes: 'Illustrative mapping', customerSpecific: false },
  { fieldName: 'historical_late_payments', entity: 'Business Partner', businessMeaning: 'Count of prior late payments', sapProduct: 'S/4 Accounts Receivable', sourceObject: 'Payment history / cleared items', accessMethod: 'Derived / Aggregation', apiService: 'Accounts Receivable API', operation: 'Read + Aggregate', requiredFilters: ['Company Code', 'Business Partner ID', 'Date Range'], status: 'Candidate', notes: 'Requires aggregation query over payment history — not a direct attribute', customerSpecific: false },
  { fieldName: 'ZZ_RISK_CATEGORY', entity: 'Business Partner', businessMeaning: 'Customer-specific internal risk label', sapProduct: 'Customer Extension', sourceObject: 'Z-field on Business Partner', accessMethod: 'Customer-Specific', apiService: '', operation: '—', requiredFilters: [], status: 'Customer-Specific', notes: 'Customer-defined field — mapping requires customer implementation details', customerSpecific: true },
  { fieldName: 'ZZ_PAYMENT_CHANNEL', entity: 'Business Partner', businessMeaning: 'Preferred payment channel', sapProduct: 'Customer Extension', sourceObject: 'Z-field on Business Partner', accessMethod: 'Customer-Specific', apiService: '', operation: '—', requiredFilters: [], status: 'Customer-Specific', notes: 'Customer-defined field', customerSpecific: true },

  // ── Receivable ───────────────────────────────────────────────────────────────
  { fieldName: 'receivable_id', entity: 'Receivable', businessMeaning: 'Unique document identifier', sapProduct: 'S/4 Accounts Receivable', sourceObject: 'Open Item / FI document', accessMethod: 'Standard API', apiService: 'Accounts Receivable API', operation: 'Read', requiredFilters: ['Company Code', 'Document Number'], status: 'Candidate', notes: 'Illustrative mapping', customerSpecific: false },
  { fieldName: 'invoice_date', entity: 'Receivable', businessMeaning: 'Document posting date', sapProduct: 'S/4 Accounts Receivable', sourceObject: 'FI document / Open Item', accessMethod: 'Standard API', apiService: 'Accounts Receivable API', operation: 'Read', requiredFilters: ['Company Code', 'Business Partner ID'], status: 'Candidate', notes: 'Illustrative mapping', customerSpecific: false },
  { fieldName: 'due_date', entity: 'Receivable', businessMeaning: 'Net payment due date', sapProduct: 'S/4 Accounts Receivable', sourceObject: 'Open Item / Receivable', accessMethod: 'Standard API', apiService: 'Accounts Receivable API', operation: 'Read', requiredFilters: ['Company Code', 'Business Partner ID', 'Date Range'], status: 'Candidate', notes: 'Illustrative mapping', customerSpecific: false },
  { fieldName: 'invoice_amount', entity: 'Receivable', businessMeaning: 'Gross invoice amount', sapProduct: 'S/4 Accounts Receivable', sourceObject: 'FI document', accessMethod: 'Standard API', apiService: 'Accounts Receivable API', operation: 'Read', requiredFilters: ['Company Code', 'Document Number'], status: 'Candidate', notes: 'Illustrative mapping', customerSpecific: false },
  { fieldName: 'payment_terms_days', entity: 'Receivable', businessMeaning: 'Net payment terms (days)', sapProduct: 'S/4 Accounts Receivable', sourceObject: 'Payment terms / FI document', accessMethod: 'Standard API', apiService: 'Accounts Receivable API', operation: 'Read', requiredFilters: ['Company Code', 'Business Partner ID'], status: 'Candidate', notes: 'Illustrative mapping', customerSpecific: false },
  { fieldName: 'open_amount', entity: 'Receivable', businessMeaning: 'Remaining open amount', sapProduct: 'S/4 Accounts Receivable', sourceObject: 'Open Item', accessMethod: 'Standard API', apiService: 'Accounts Receivable API', operation: 'Read', requiredFilters: ['Company Code', 'Business Partner ID'], status: 'Candidate', notes: 'Illustrative mapping', customerSpecific: false },
  { fieldName: 'clearing_status', entity: 'Receivable', businessMeaning: 'OPEN / CLEARED / PARTIAL', sapProduct: 'S/4 Accounts Receivable', sourceObject: 'FI clearing status', accessMethod: 'Standard API', apiService: 'Accounts Receivable API', operation: 'Read', requiredFilters: ['Company Code', 'Document Number'], status: 'Candidate', notes: 'Illustrative mapping', customerSpecific: false },

  // ── Payment ──────────────────────────────────────────────────────────────────
  { fieldName: 'payment_date', entity: 'Payment', businessMeaning: 'Date payment was made', sapProduct: 'S/4 Accounts Receivable', sourceObject: 'Cleared item / Payment document', accessMethod: 'Standard API', apiService: 'Accounts Receivable API', operation: 'Read', requiredFilters: ['Company Code', 'Business Partner ID', 'Date Range'], status: 'Candidate', notes: 'Illustrative mapping', customerSpecific: false },
  { fieldName: 'payment_amount', entity: 'Payment', businessMeaning: 'Payment amount', sapProduct: 'S/4 Accounts Receivable', sourceObject: 'Payment document', accessMethod: 'Standard API', apiService: 'Accounts Receivable API', operation: 'Read', requiredFilters: ['Company Code', 'Document Number'], status: 'Candidate', notes: 'Illustrative mapping', customerSpecific: false },
  { fieldName: 'payment_method', entity: 'Payment', businessMeaning: 'Payment method (bank transfer, check…)', sapProduct: 'S/4 Accounts Receivable', sourceObject: 'Payment document', accessMethod: 'Standard API', apiService: 'Accounts Receivable API', operation: 'Read', requiredFilters: ['Company Code', 'Document Number'], status: 'Candidate', notes: 'Illustrative mapping', customerSpecific: false },

  // ── Dunning ──────────────────────────────────────────────────────────────────
  { fieldName: 'dunning_level', entity: 'Dunning', businessMeaning: 'Dunning escalation level (1–3)', sapProduct: 'S/4 FSCM / AR', sourceObject: 'Dunning notice / MHND', accessMethod: 'Standard API', apiService: 'Accounts Receivable API', operation: 'Read', requiredFilters: ['Company Code', 'Business Partner ID'], status: 'Candidate', notes: 'Illustrative mapping — dunning history may require specific API scope', customerSpecific: false },
  { fieldName: 'dunning_date', entity: 'Dunning', businessMeaning: 'Date dunning notice was issued', sapProduct: 'S/4 FSCM / AR', sourceObject: 'Dunning notice', accessMethod: 'Standard API', apiService: 'Accounts Receivable API', operation: 'Read', requiredFilters: ['Company Code', 'Business Partner ID', 'Date Range'], status: 'Candidate', notes: 'Illustrative mapping', customerSpecific: false },
  { fieldName: 'dunning_amount', entity: 'Dunning', businessMeaning: 'Amount included in dunning notice', sapProduct: 'S/4 FSCM / AR', sourceObject: 'Dunning notice', accessMethod: 'Standard API', apiService: 'Accounts Receivable API', operation: 'Read', requiredFilters: ['Company Code', 'Business Partner ID'], status: 'Candidate', notes: 'Illustrative mapping', customerSpecific: false },

  // ── Dispute ──────────────────────────────────────────────────────────────────
  { fieldName: 'dispute_open_date', entity: 'Dispute', businessMeaning: 'Date dispute was opened', sapProduct: 'S/4 FSCM / Dispute Management', sourceObject: 'Dispute case / UDM_DISPUTE', accessMethod: 'Standard API', apiService: 'Dispute Management API', operation: 'Read', requiredFilters: ['Company Code', 'Business Partner ID'], status: 'Candidate', notes: 'Illustrative mapping — requires FSCM Dispute Management activation', customerSpecific: false },
  { fieldName: 'dispute_reason', entity: 'Dispute', businessMeaning: 'Reason code for dispute', sapProduct: 'S/4 FSCM / Dispute Management', sourceObject: 'Dispute case', accessMethod: 'Standard API', apiService: 'Dispute Management API', operation: 'Read', requiredFilters: ['Company Code', 'Case ID'], status: 'Candidate', notes: 'Illustrative mapping', customerSpecific: false },
  { fieldName: 'dispute_amount', entity: 'Dispute', businessMeaning: 'Amount in dispute', sapProduct: 'S/4 FSCM / Dispute Management', sourceObject: 'Dispute case', accessMethod: 'Standard API', apiService: 'Dispute Management API', operation: 'Read', requiredFilters: ['Company Code', 'Case ID'], status: 'Candidate', notes: 'Illustrative mapping', customerSpecific: false },
  { fieldName: 'dispute_status', entity: 'Dispute', businessMeaning: 'OPEN / RESOLVED / WITHDRAWN', sapProduct: 'S/4 FSCM / Dispute Management', sourceObject: 'Dispute case', accessMethod: 'Standard API', apiService: 'Dispute Management API', operation: 'Read', requiredFilters: ['Company Code', 'Case ID'], status: 'Candidate', notes: 'Illustrative mapping', customerSpecific: false },

  // ── Collection History (custom) ──────────────────────────────────────────────
  { fieldName: 'contact_date', entity: 'Collection History', businessMeaning: 'Date collector contacted the customer', sapProduct: 'FSCM Collections Management or Custom', sourceObject: 'Collections activity / custom table', accessMethod: 'Customer-Specific or Standard', apiService: 'Collections Management API', operation: 'Read', requiredFilters: ['Company Code', 'Business Partner ID'], status: 'Candidate', notes: 'Standard if using FSCM Collections Management; custom table otherwise', customerSpecific: false },
  { fieldName: 'contact_type', entity: 'Collection History', businessMeaning: 'EMAIL / PHONE / LETTER / VISIT', sapProduct: 'FSCM Collections Management or Custom', sourceObject: 'Collections activity', accessMethod: 'Customer-Specific or Standard', apiService: 'Collections Management API', operation: 'Read', requiredFilters: ['Company Code', 'Business Partner ID'], status: 'Candidate', notes: 'Illustrative mapping', customerSpecific: false },
  { fieldName: 'promise_to_pay', entity: 'Collection History', businessMeaning: 'Customer committed to a payment date', sapProduct: 'Customer Extension', sourceObject: 'Custom collections table or Z-field', accessMethod: 'Customer-Specific', apiService: '', operation: '—', requiredFilters: [], status: 'Customer-Specific', notes: 'No standard SAP field — requires customer-specific implementation (e.g. ZCOLL_HIST)', customerSpecific: true },
  { fieldName: 'promise_amount', entity: 'Collection History', businessMeaning: 'Promised payment amount', sapProduct: 'Customer Extension', sourceObject: 'Custom collections table', accessMethod: 'Customer-Specific', apiService: '', operation: '—', requiredFilters: [], status: 'Customer-Specific', notes: 'Customer-specific field', customerSpecific: true },
  { fieldName: 'collector_team', entity: 'Collection History', businessMeaning: 'Collector team assignment', sapProduct: 'FSCM Collections Management or Custom', sourceObject: 'Collections segment or custom', accessMethod: 'Customer-Specific or Standard', apiService: '', operation: 'Read', requiredFilters: ['Company Code', 'Business Partner ID'], status: 'Unresolved', notes: 'Mapping unconfirmed — may be standard FSCM or customer-specific', customerSpecific: false },
];

export function getFieldAccess(fieldName: string): FieldAccessMapping | undefined {
  return FIELD_ACCESS_MAPPINGS.find(m => m.fieldName === fieldName);
}

export function getDataAccessSummary(fields?: FieldAccessMapping[]): PackDataAccessSummary {
  const mappings = fields ?? FIELD_ACCESS_MAPPINGS;
  return {
    totalRequired: mappings.length,
    validated: mappings.filter(m => m.status === 'Validated').length,
    candidate: mappings.filter(m => m.status === 'Candidate').length,
    customerSpecific: mappings.filter(m => m.status === 'Customer-Specific').length,
    unresolved: mappings.filter(m => m.status === 'Unresolved').length,
  };
}


