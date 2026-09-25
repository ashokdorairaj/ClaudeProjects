// V3 types — re-exports all V2 types (except SyntheticView which is extended)
export type {
  FidelityLevel,
  GenerationConfig,
  BusinessPartner,
  Receivable,
  Payment,
  DunningRecord,
  Dispute,
  CollectionHistoryRecord,
  DatasetStats,
  GeneratedDataset,
  QualityCheck,
  QualityCategory,
  FeatureVector,
  FeatureImportance,
  RulesResult,
  MLModelType,
  MLResult,
  RPTResult,
  ReusableLearning,
  PackStatus,
  PackChange,
  PackVersion,
  HealthResponse,
  TrainModelResponse,
  TaskType,
  Experiment,
  DatasetRecord,
  FeatureSet,
  ApproachLabel,
  ApproachConfig,
  RunRecord,
  QuestionTemplate,
} from '../synthetic-data-v2/types';

// Extended SyntheticView — adds V3 navigation targets
export type SyntheticView =
  // V2 views (retained for ADVANCED nav)
  | 'dashboard'
  | 'packDetail'
  | 'generate'
  | 'preview'
  | 'quality'
  | 'experiment'
  | 'learnings'
  | 'versioning'
  | 'experiments'
  | 'experimentCreate'
  | 'experimentWorkspace'
  | 'datasets'
  | 'featureSets'
  | 'approaches'
  | 'knowledge'
  | 'datasetDetail'
  | 'runDetail'
  // V3 new views
  | 'home'
  | 'engagements'
  | 'engagementDetail'
  | 'engagementContext'
  | 'engagementRecommendation'
  | 'engagementHandoff'
  | 'prototypePackage'
  | 'packs'
  | 'packCreate'
  | 'packDraftDetail'
  | 'packPropose'
  | 'engagementCreate';

// ─── Engagement Stage ─────────────────────────────────────────────────────────
export type EngagementStage =
  | 'use-case'
  | 'prototype-data'
  | 'recommendation'
  | 'experiment'
  | 'handoff';

// ─── Customer Context Analysis ────────────────────────────────────────────────
export interface ContextItem {
  type: 'schema' | 'profile' | 'constraint' | 'volume' | 'scenario' | 'sample';
  label: string;
  detail: string;
  fidelityLevel: import('../synthetic-data-v2/types').FidelityLevel;
}

export interface CustomerContextAnalysis {
  items: ContextItem[];
  suggestedFidelityUpgrade: import('../synthetic-data-v2/types').FidelityLevel;
  summary: string;
}

// ─── Data Access Mapping ─────────────────────────────────────────────────────
export type DataAccessStatus = 'Validated' | 'Candidate' | 'Customer-Specific' | 'Unresolved' | 'Illustrative';

export interface FieldAccessMapping {
  fieldName: string;
  businessMeaning: string;
  entity: string;
  sapProduct: string;
  sourceObject: string;
  accessMethod: string;
  apiService: string;
  operation: string;
  requiredFilters: string[];
  status: DataAccessStatus;
  notes: string;
  customerSpecific: boolean;
}

export interface PackDataAccessSummary {
  totalRequired: number;
  validated: number;
  candidate: number;
  customerSpecific: number;
  unresolved: number;
}

// ─── Technical Recommendation ─────────────────────────────────────────────────
export interface InformationField {
  name: string;
  category: 'current-state' | 'historical';
  description: string;
  available: boolean;
  // Data access enrichment (optional)
  sapProduct?: string;
  accessStatus?: DataAccessStatus;
  accessNote?: string;
}

export interface RecommendedApproach {
  approachId: string;
  name: string;
  why: string;
  label: import('../synthetic-data-v2/types').ApproachLabel;
}

export interface RecommendedMetric {
  metricKey: string;
  label: string;
  businessExplanation: string;
  recommended: boolean;
}

export interface TechRecommendation {
  businessQuestion: string;
  understoodAs: string;
  taskType: import('../synthetic-data-v2/types').TaskType;
  taskTypeExplanation: string;
  target: string;
  targetStatus: 'Available' | 'Derivable' | 'Missing';
  targetExplanation: string;
  informationFields: InformationField[];
  approaches: RecommendedApproach[];
  metrics: RecommendedMetric[];
  engineeringQuestions: string[];
  confidence: 'High' | 'Medium' | 'Low';
  confidenceReasons: string[];
}

// ─── Engagement ────────────────────────────────────────────────────────────────
export interface Engagement {
  id: string;
  name: string;
  customer: string;
  useCaseName: string;
  businessProblem: string;
  neoNotes: string;
  packId: string;
  packVersion: string;
  currentDatasetId: string | null;
  stage: EngagementStage;
  customerSignal: 'Early Stage' | 'Interested' | 'Validated' | 'Not Pursuing' | null;
  customerFeedbackNotes: string;
  // kept for seed data backwards compat — no longer a stage gate
  demoStatus: string;
  demoLink: string;
  demoNotes: string;
  customerContextRaw: string;
  customerContextAnalysis: CustomerContextAnalysis | null;
  recommendationInput: string;
  recommendation: TechRecommendation | null;
  experimentId: string | null;
  createdAt: string;
}

// ─── Draft Pack (user-created pack in progress) ───────────────────────────────
export interface DraftPack {
  id: string;
  name: string;
  domain: string;
  businessProblem: string;
  sapProducts: string[];
  description: string;
  owner: string;
  version: string;
  status: 'Draft' | 'Ready for Review';
  startedFrom: string | null;
  createdAt: string;
  hasExperiments: boolean;
  hasSchema: boolean;
  hasConstraints: boolean;
  hasGenerationDefaults: boolean;
  hasQualityChecks: boolean;
  experiments: string[];
  constraints: string;
  generationNotes: string;
}
