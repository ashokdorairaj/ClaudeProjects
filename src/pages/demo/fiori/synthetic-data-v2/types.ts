// ─── View Navigation ──────────────────────────────────────────────────────────
export type SyntheticView =
  | 'dashboard'
  | 'packDetail'
  | 'generate'
  | 'preview'
  | 'quality'
  | 'experiment'
  | 'learnings'
  | 'versioning'
  // V2 additions (previous round)
  | 'experiments'
  | 'experimentCreate'
  | 'experimentWorkspace'
  | 'datasets'
  | 'featureSets'
  | 'approaches'
  // V2 refinement additions
  | 'knowledge'
  | 'datasetDetail'
  | 'runDetail';

// ─── Fidelity Levels ──────────────────────────────────────────────────────────
export type FidelityLevel = 'L1' | 'L2' | 'L3' | 'L4';

// ─── Generation Configuration ─────────────────────────────────────────────────
export interface GenerationConfig {
  bpCount: number;
  recCount: number;
  seed: number;
  latePaymentRate: number;      // 0–1
  disputeRate: number;          // 0–1
  startDate: string;            // ISO date string
  endDate: string;              // ISO date string
  fidelityLevel: FidelityLevel;
  includeDunning: boolean;
  includeDisputes: boolean;
  includeCollectionHistory: boolean; // L2+
  currency: 'EUR' | 'USD' | 'GBP';
  // L3 profile overrides
  meanInvoiceAmount: number;
  countryWeights: Record<string, number>;
  riskWeights: { LOW: number; MEDIUM: number; HIGH: number };
}

// ─── Entity Schemas ───────────────────────────────────────────────────────────
export interface BusinessPartner {
  business_partner_id: string;
  country: string;
  company_code: string;
  industry: string;
  customer_since: string;
  credit_segment: 'A' | 'B' | 'C' | 'D';
  risk_segment: 'LOW' | 'MEDIUM' | 'HIGH';
  annual_revenue: number;
  historical_late_payments: number;
  ZZ_RISK_CATEGORY: string;
  ZZ_PAYMENT_CHANNEL: string;
}

export interface Receivable {
  receivable_id: string;
  business_partner_id: string;
  invoice_date: string;
  due_date: string;
  invoice_amount: number;
  currency: string;
  payment_terms_days: number;
  company_code: string;
  document_type: string;
  open_amount: number;
  clearing_status: 'OPEN' | 'CLEARED' | 'PARTIAL';
  late_payment_flag: boolean;
}

export interface Payment {
  payment_id: string;
  receivable_id: string;
  payment_date: string;
  payment_amount: number;
  payment_method: string;
  clearing_document: string;
}

export interface DunningRecord {
  dunning_id: string;
  receivable_id: string;
  dunning_date: string;
  dunning_level: 1 | 2 | 3;
  dunning_amount: number;
}

export interface Dispute {
  dispute_id: string;
  receivable_id: string;
  dispute_open_date: string;
  dispute_reason: string;
  dispute_amount: number;
  dispute_status: 'OPEN' | 'RESOLVED' | 'WITHDRAWN';
  resolution_date: string | null;
}

export interface CollectionHistoryRecord {
  collection_history_id: string;
  business_partner_id: string;
  contact_date: string;
  contact_type: 'EMAIL' | 'PHONE' | 'LETTER' | 'VISIT';
  promise_to_pay: boolean;
  promise_amount: number | null;
  collector_team: string;
}

// ─── Dataset Stats ─────────────────────────────────────────────────────────────
export interface DatasetStats {
  totalBP: number;
  totalReceivables: number;
  totalPayments: number;
  totalDunning: number;
  totalDisputes: number;
  totalCollectionHistory: number;
  actualLatePaymentRate: number;
  actualDisputeRate: number;
  countryDistribution: Record<string, number>;
  riskDistribution: Record<string, number>;
  avgInvoiceAmount: number;
  medianInvoiceAmount: number;
  totalInvoiceValue: number;
}

// ─── Generated Dataset ────────────────────────────────────────────────────────
export interface GeneratedDataset {
  businessPartners: BusinessPartner[];
  receivables: Receivable[];
  payments: Payment[];
  dunningRecords: DunningRecord[];
  disputes: Dispute[];
  collectionHistory: CollectionHistoryRecord[];
  generatedAt: string;
  config: GenerationConfig;
  stats: DatasetStats;
}

// ─── Quality Checks ───────────────────────────────────────────────────────────
export type QualityCategory = 'referential_integrity' | 'business_rule' | 'distribution';

export interface QualityCheck {
  checkId: string;
  label: string;
  category: QualityCategory;
  passed: boolean;
  failCount: number;
  totalChecked: number;
  score: number;
  detail: string;
}

// ─── Feature Vector (for ML) ──────────────────────────────────────────────────
export interface FeatureVector {
  prior_late_count: number;
  days_outstanding: number;
  risk_segment: number;       // 0=LOW, 1=MEDIUM, 2=HIGH
  invoice_amount: number;
  payment_terms: number;
  credit_segment: number;     // 0=A, 1=B, 2=C, 3=D
  country_code: number;       // 0=DE, 1=US, 2=FR, 3=OTHER
  annual_revenue_log: number; // log-normalized
}

// ─── Model Results ────────────────────────────────────────────────────────────
export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface RulesResult {
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  trueNegatives: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  auc: number;
  executionMs: number;
  sampleSize: number;
}

export type MLModelType = 'xgboost' | 'histgradientboosting' | 'js-decision-tree';

export interface MLResult {
  modelType: MLModelType;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  auc: number;
  featureImportances: FeatureImportance[];
  trainingMs: number;
  usedFallback: boolean;
  sampleSize: number;
}

export interface RPTResult {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  auc: number;
  featureImportances: FeatureImportance[];
  executionMs: number;
  isSimulated: true;
  sampleSize: number;
}

// ─── Reusable Learnings ───────────────────────────────────────────────────────
export interface ReusableLearning {
  learningId: string;
  domain: string;
  text: string;
  capturedAt: string;
  source: 'pre-seeded' | 'user-added' | 'experiment-derived';
  proposedForPack: boolean;
}

// ─── Pack Versioning ──────────────────────────────────────────────────────────
export type PackStatus = 'Validated' | 'Draft';

export interface PackChange {
  changeId: string;
  description: string;
  changeType: 'entity_added' | 'field_added' | 'rule_updated' | 'distribution_updated';
  linkedLearningId: string | null;
}

export interface PackVersion {
  version: string;
  status: PackStatus;
  createdAt: string;
  validatedAt: string | null;
  changes: PackChange[];
  entityCount: number;
  learningsIncorporated: number;
}

// ─── API Response Types ───────────────────────────────────────────────────────
export interface HealthResponse {
  ok: boolean;
  pythonAvailable: boolean;
  xgboostAvailable: boolean;
  pythonVersion: string | null;
}

export interface TrainModelResponse {
  ok: boolean;
  modelType?: MLModelType;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1?: number;
  auc?: number;
  featureImportances?: FeatureImportance[];
  trainingMs?: number;
  usedFallback?: boolean;
  error?: string;
}

// ─── V2 Product Object Model ───────────────────────────────────────────────────

export type TaskType =
  | 'Binary Classification'
  | 'Multiclass Classification'
  | 'Regression'
  | 'Ranking'
  | 'Forecasting'
  | 'Rules/Decisioning';

export interface Experiment {
  id: string;
  name: string;
  packId: string;
  packVersion: string;
  customer: string;
  taskType: TaskType;
  target: string;
  question: string;
  businessObjective: string;
  featureSetIds: string[];
  approachIds: string[];
  primaryMetric: string;
  datasetIds: string[];
  runIds: string[];
  status: 'Draft' | 'Running' | 'Evaluating' | 'Validated' | 'Archived';
  createdAt: string;
}

export interface DatasetRecord {
  id: string;
  name: string;
  experimentId: string;
  packVersion: string;
  fidelityLevel: FidelityLevel;
  customer: string;
  config: Partial<GenerationConfig>;
  seed: number;
  recordCounts: { bp: number; receivables: number; payments: number; dunning: number; disputes: number };
  qualityStatus: 'Generated' | 'Needs Calibration' | 'Ready for Prototyping' | 'Ready for Early ML Experimentation';
  createdAt: string;
  lineage: string;
}

export interface FeatureSet {
  id: string;
  name: string;
  version: string;
  description: string;
  fields: string[];
  createdAt: string;
}

export type ApproachLabel = 'REAL' | 'DEMO MODEL' | 'DEMO ADAPTER';

export interface ApproachConfig {
  id: string;
  name: string;
  taskTypes: TaskType[];
  isReal: boolean;
  label: ApproachLabel;
  description: string;
  defaultParams: Record<string, string | number | boolean>;
}

export interface RunRecord {
  id: string;
  experimentId: string;
  datasetId: string;
  featureSetId: string;
  approachId: string;
  parameters: Record<string, string | number | boolean>;
  seed: number;
  metrics: Record<string, number>;
  runtime: string;
  status: 'Queued' | 'Running' | 'Completed' | 'Failed';
  isReal: boolean;
  approachLabel: ApproachLabel;
  createdAt: string;
}

export interface QuestionTemplate {
  id: string;
  question: string;
  businessObjective: string;
  taskTypes: TaskType[];
  candidateTargets: string[];
  candidateFeatures: string[];
  recommendedApproaches: string[];
  recommendedMetrics: string[];
  confidence: 'High' | 'Medium' | 'Low';
  requiredData: string[];
}
