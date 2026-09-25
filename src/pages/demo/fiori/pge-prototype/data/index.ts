// @ts-nocheck
import projectsRaw from './Projects.json';
import recommendedActionsRaw from './RecommendedActions.json';
import studyHistoryRaw from './StudyHistory.json';
import exceptionsRaw from './Exceptions.json';
import activityLogRaw from './ActivityLog.json';
import communicationsRaw from './Communications.json';
import agentRunsRaw from './AgentRuns.json';
import hitlDecisionLogRaw from './HITLDecisionLog.json';
import taskLogRaw from './TaskLog.json';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Project {
  ID: string;
  projectNumber: string;
  projectName: string;
  applicantContact: string;
  requestedMW: number;
  daysInCurrentPhase: number;
  predictedDelayDays: number;
  currentPhase: string;
  currentSubPhase: string;
  studyPath: string;
  studyPathConfidence: number;
  studyPathRisk: string;
  region: string;
  projectType: string;
  feederID: string;
  feederCapacityPct: number;
  engineerName: string;
  engineerUtilization: number;
  blockingParty: string;
  blockingReason: string;
  slaStatus: { code: string; name: string; criticality: number };
  slaStatus_code: string;
  priority: { code: string; name: string; criticality: number };
  hasWorkflowOptimization: boolean;
  accountSummary: string;
  estimatedCompletionRange: string;
  latestAgentRunStatusText: string;
  assignedQueue: string;
}

export interface RecommendedAction {
  ID: string;
  project_ID: string;
  actionType: string;
  title: string;
  description: string;
  priority?: string;
  dueDate?: string;
  assignedTo?: string;
  confidence: number;
  isActive: boolean | string;
  generatedAt?: string;
  actionData?: string;
}

export interface StudyHistoryEntry {
  ID: string;
  project_ID: string;
  studyType: string;
  studyPhase?: string;
  startDate: string;
  endDate?: string;
  status: string;
  assignedEngineer: string;
  findings?: string;
}

export interface ExceptionEntry {
  ID: string;
  project_ID: string;
  exceptionType: string;
  description: string;
  severity: string;
  raisedDate: string;
  status: string;
}

export interface ActivityLogEntry {
  ID: string;
  project_ID: string;
  activityType: string;
  description: string;
  performedBy: string;
  timestamp: string;
}

export interface Communication {
  ID: string;
  project_ID: string;
  direction: string;
  subject: string;
  body: string;
  sentDate: string;
  from: string;
  to: string;
}

export interface AgentRun {
  ID: string;
  project_ID: string;
  summary: string;
  recommendedPath: string;
  confidenceScore: number;
  durationMs: number;
  status_code: string;
  hitlOptions: string | null;
}

export interface TaskLogEntry {
  ID: string;
  project_ID: string;
  studyPhase: string;
  taskCode: string;
  taskName: string;
  startDate: string | null;
  completedDate: string | null;
  status_code: 'C' | 'A' | 'P'; // C=Completed, A=Active, P=Pending
  performedBy: string | null;
}


export interface HITLDecisionLogEntry {
  ID: string;
  project_ID: string;
  studyPhase: string;
  taskCode: string;
  taskName: string;
  timestamp: string;
  cardType: 'Action' | 'Unblock';
  cardTrigger: string;
  agentRecommendation: string;
  agentConfidence: number;
  verificationChecklist: { item: string; passed: boolean }[];
  decision: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISMISSED';
  decidedBy: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  projectedImpact: string;
  actualImpact: string | null;
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const projects = projectsRaw as Project[];
export const recommendedActions = recommendedActionsRaw as RecommendedAction[];
export const studyHistory = studyHistoryRaw as StudyHistoryEntry[];
export const exceptions = exceptionsRaw as ExceptionEntry[];
export const activityLog = activityLogRaw as ActivityLogEntry[];
export const communications = communicationsRaw as Communication[];
export const agentRuns = agentRunsRaw as AgentRun[];
export const hitlDecisionLog = hitlDecisionLogRaw as HITLDecisionLogEntry[];
export const taskLog = taskLogRaw as TaskLogEntry[];

// ─── UI Project type (used by list + detail pages) ────────────────────────────

export interface UIProject {
  id: string;
  name: string;
  applicant?: string;
  type: string;
  region: string;
  slaStatus: 'Breached' | 'At Risk' | 'On Track';
  daysInQueue: number;
  predictedDelay: number;
  mw: number;
  estCompletion: string;
  studyPhase: string;
  assignedEngineer: string;
  // extra rich fields from JSON
  projectNumber: string;
  currentPhase: string;
  feederID: string;
  feederCapacityPct: number;
  engineerUtilization: number;
  blockingParty: string;
  blockingReason: string;
  accountSummary: string;
  studyPath: string;
  studyPathConfidence: number;
  rawId: string;
  priority: string;
  hasWorkflowOptimization: boolean;
  agentStatusText: string;
}

function mapSlaStatus(code: string): 'Breached' | 'At Risk' | 'On Track' {
  if (code === 'BREACHED') return 'Breached';
  if (code === 'AT_RISK')  return 'At Risk';
  return 'On Track';
}

export const uiProjects: UIProject[] = (projectsRaw as Project[]).map(p => ({
  id: p.projectNumber,
  name: p.projectName,
  applicant: p.applicantContact,
  type: p.projectType,
  region: p.region,
  slaStatus: mapSlaStatus(p.slaStatus_code),
  daysInQueue: p.daysInCurrentPhase,
  predictedDelay: p.predictedDelayDays,
  mw: p.requestedMW,
  estCompletion: p.estimatedCompletionRange,
  studyPhase: p.currentSubPhase,
  assignedEngineer: p.engineerName,
  projectNumber: p.projectNumber,
  currentPhase: p.currentPhase,
  feederID: p.feederID,
  feederCapacityPct: p.feederCapacityPct,
  engineerUtilization: p.engineerUtilization,
  blockingParty: p.blockingParty,
  blockingReason: p.blockingReason,
  accountSummary: p.accountSummary,
  studyPath: p.studyPath,
  studyPathConfidence: p.studyPathConfidence,
  rawId: p.ID,
  priority: p.priority.name,
  hasWorkflowOptimization: p.hasWorkflowOptimization,
  agentStatusText: p.latestAgentRunStatusText ?? '',
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getProject(id: string): Project | undefined {
  return projects.find(p => p.ID === id);
}

export function getProjectActions(projectId: string): RecommendedAction[] {
  return recommendedActions.filter(a => a.project_ID === projectId);
}

export function getProjectStudyHistory(projectId: string): StudyHistoryEntry[] {
  return studyHistory.filter(s => s.project_ID === projectId);
}

export function getProjectExceptions(projectId: string): ExceptionEntry[] {
  return exceptions.filter(e => e.project_ID === projectId);
}

export function getProjectActivityLog(projectId: string): ActivityLogEntry[] {
  return activityLog.filter(a => a.project_ID === projectId);
}

export function getProjectCommunications(projectId: string): Communication[] {
  return communications.filter(c => c.project_ID === projectId);
}

export function getProjectAgentRun(projectId: string): AgentRun | undefined {
  return agentRuns.find(r => r.project_ID === projectId);
}

export function getProjectHITLDecisionLog(projectId: string): HITLDecisionLogEntry[] {
  return hitlDecisionLog.filter(h => h.project_ID === projectId);
}

export function getProjectTaskLog(projectId: string): TaskLogEntry[] {
  return taskLog.filter(t => t.project_ID === projectId);
}
