// ─── Core domain types for the ALDI TM Planning Refinement demo ──────────────

export type AppRole = 'planner' | 'admin';

export interface AuthState {
  loggedIn: boolean;
  name: string;
  initials: string;
  colorScheme: string;
  role: AppRole;
}

export type SetupStatus = 'incomplete' | 'draft' | 'active';
export type TmConnectionStatus = 'not-configured' | 'testing' | 'connected' | 'activated';

// ─── Admin — Rule types ───────────────────────────────────────────────────────
export type RuleGroup =
  | 'Store Rules'
  | 'Resource Rules'
  | 'Planning Execution'
  | 'Vehicle Rules'
  | 'Time Rules'
  | 'Volume Rules';

export type RuleType = 'hard-constraint' | 'preference';

export type RuleStage =
  | 'draft'
  | 'submitted'
  | 'validating'
  | 'validation-complete'
  | 'validation-complete-warnings'
  | 'validation-failed'
  | 'published'
  | 'retired';

export interface ValidationCheck {
  id: string;
  label: string;
  status: 'pass' | 'warning' | 'fail' | 'pending';
  detail: string;
}

export interface RuleCandidate {
  id: string;
  name: string;
  group: RuleGroup;
  ruleType: RuleType;
  sopDescription: string;
  businessContext: string;
  exampleScenario: string;
  scopeText: string;
  stage: RuleStage;
  validationChecks: ValidationCheck[];
  assignedProfileIds: string[];
  submittedAt?: string;
  publishedAt?: string;
  retiredAt?: string;
  dc: 'BD27' | 'BD09' | 'Both';
}

export type ProfileStatus = 'draft' | 'active' | 'retired' | 'expired';

export interface RuleProfile {
  id: string;
  name: string;
  dc: string;
  planningContext: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: ProfileStatus;
  ruleIds: string[];
  createdAt: string;
  activatedAt?: string;
  retiredAt?: string;
}

// ─── Admin — System Setup ─────────────────────────────────────────────────────
export type AdminTab = 'rule-creation' | 'rule-library' | 'rule-profiles' | 'system-setup';

// ─── Planner — Freight Order types ───────────────────────────────────────────
export interface FreightOrder {
  id: string;           // display doc ID like "80000000000"
  sapId: string;        // same
  dc: string;           // BD20 / BD42
  resource: string;
  stops: number;
  pallets: number;
  distanceKm: number;
  utilizationPct: number;
  amountEur: number;
  overCapacity: boolean;
  stopList: string;     // raw stop list string from CSV
}

export interface ResourceSummary {
  resourceId: string;
  dc: string;
  tours: number;
  totalPallets: number;
  avgUtilization: number;
}

// ─── Planner — Rule Evaluation ────────────────────────────────────────────────
export type EvalStatus = 'not-started' | 'running' | 'complete' | 'manual-review' | 'error' | 'no-action';

export interface RuleDescriptor {
  id: string;         // R-001 etc
  name: string;
  group: RuleGroup;
  ruleType: RuleType;
  sopDescription: string;
  businessContext: string;
  exampleScenario: string;
  scopeText: string;
  matchedCount: number;
  evalStatus: 'pending' | 'evaluating' | 'evaluated' | 'error' | 'no-action';
}

// ─── Planner — Packages ───────────────────────────────────────────────────────
export type PackageState =
  | 'pending'
  | 'ready'
  | 'evaluating'
  | 'accepted'
  | 'rejected'
  | 'stale'
  | 'discarded'
  | 'nosol';

export interface AffectedObject {
  kind: 'FO' | 'FU' | 'Stop' | 'Resource';
  id: string;
  description: string;
}

export interface ValidationCheck2 {
  passed: boolean;
  label: string;
}

export interface TmAction {
  description: string;
}

export interface KpiRow {
  label: string;
  before: string;
  after: string;
}

export interface RecPackage {
  id: string;           // PKG-001 etc
  title: string;
  ruleId: string;
  ruleName: string;
  state: PackageState;
  whyText: string;
  affectedObjects: AffectedObject[];
  validationChecks: ValidationCheck2[];
  tmActions: TmAction[];
  kpiComparison: KpiRow[];
  staleCausedBy?: string;
}

// ─── Planner — Change Summary ─────────────────────────────────────────────────
export interface ChangeSummaryKpi {
  label: string;
  before: string;
  after: string;
  unit?: string;
  improved?: boolean;
}

// ─── TM Profile Sets (from SAP TM API) ───────────────────────────────────────
export interface TmProfileSet {
  id: string;
  name: string;
  freightUnitSelectionProfile: string;
  freightOrderSelectionProfile: string;
}

// ─── Navigation ──────────────────────────────────────────────────────────────
export type PlannerStep =
  | 'session-start'
  | 'overview'
  | 'rule-evaluation'
  | 'proposal-review'
  | 'change-summary';

export type LockedObjectsDialogState = null | 'detected' | 'checking' | 'released' | 'failed';
export type ConnectionDialogState = null | 'error' | 'refreshing' | 'success';
