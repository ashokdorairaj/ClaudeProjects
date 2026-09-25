import type { TechRecommendation } from './types';
import type { TaskType } from '../synthetic-data-v2/types';
import { RECOMMENDATION_TEMPLATES, QUESTION_TEMPLATES } from './constants';
import { APPROACH_CATALOG } from '../synthetic-data-v2/constants';

export interface RecommendationProgress {
  step: string;
  pct: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

const STEPS: Array<{ step: string; pct: number }> = [
  { step: 'Reading business question…', pct: 15 },
  { step: 'Identifying experiment type…', pct: 35 },
  { step: 'Matching available data…', pct: 55 },
  { step: 'Selecting approaches…', pct: 75 },
  { step: 'Building recommendation…', pct: 95 },
];

// Metrics compatible with each task type
const METRICS_FOR_TASK: Record<string, string[]> = {
  'Binary Classification':    ['recall', 'precision', 'f1', 'auc'],
  'Multiclass Classification': ['recall', 'precision', 'f1', 'auc'],
  'Regression':               ['mae', 'rmse'],
  'Forecasting':              ['mae', 'rmse'],
  'Ranking':                  ['recall', 'auc'],
  'Rules/Decisioning':        ['recall', 'precision', 'f1'],
};

function matchTemplate(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('late') || q.includes('overdue') || q.includes('past due') || (q.includes('pay') && !q.includes('forecast') && !q.includes('how much'))) {
    return 'qt-late-payment';
  }
  if (q.includes('dispute') || q.includes('claim') || q.includes('disagree') || q.includes('challenge')) {
    return 'qt-dispute-risk';
  }
  if (q.includes('priorit') || q.includes('queue') || q.includes('focus') || q.includes('this week') || (q.includes('who') && q.includes('contact'))) {
    return 'qt-collections-priority';
  }
  if (q.includes('forecast') || q.includes('how much') || q.includes('cash') || q.includes('30 day') || q.includes('expect')) {
    return 'qt-payment-amount';
  }
  for (const qt of QUESTION_TEMPLATES) {
    if (qt.candidateTargets.some(t => q.includes(t.replace(/_/g, ' '))) ||
        q.includes(qt.businessObjective.toLowerCase().slice(0, 10))) {
      return qt.id;
    }
  }
  return 'qt-late-payment';
}

export async function getRecommendation(
  question: string,
  _datasetId: string | null,
  onProgress: (p: RecommendationProgress) => void,
): Promise<TechRecommendation> {
  for (const s of STEPS) {
    onProgress(s);
    await sleep(160);
  }

  const templateKey = matchTemplate(question);
  const template = RECOMMENDATION_TEMPLATES[templateKey] ?? RECOMMENDATION_TEMPLATES['qt-late-payment'];
  const taskType = template.taskType as TaskType;

  // Filter approaches to only those compatible with the task type
  const compatibleApproachIds = new Set(
    APPROACH_CATALOG.filter(a => a.taskTypes.includes(taskType)).map(a => a.id)
  );
  const filteredApproaches = template.approaches.filter(a => compatibleApproachIds.has(a.approachId));

  // Filter metrics to only those compatible with the task type
  const compatibleMetricKeys = new Set(METRICS_FOR_TASK[taskType] ?? METRICS_FOR_TASK['Binary Classification']);
  const filteredMetrics = template.metrics.filter(m => compatibleMetricKeys.has(m.metricKey));

  return {
    businessQuestion: question,
    ...template,
    approaches: filteredApproaches,
    metrics: filteredMetrics,
  };
}
