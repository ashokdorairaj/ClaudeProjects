// V3 constants — re-exports all V2 constants and adds V3-specific seed data
export * from '../synthetic-data-v2/constants';

import type { Engagement } from './types';
import type { TechRecommendation } from './types';

// ─── Seed Engagements ─────────────────────────────────────────────────────────

const NORTHSTAR_RECOMMENDATION: TechRecommendation = {
  businessQuestion: 'Which customers are most likely to pay late?',
  understoodAs: 'Identify receivables at risk of late payment early enough for collections to intervene.',
  taskType: 'Binary Classification',
  taskTypeExplanation: "We're asking a yes/no question for each receivable: will this invoice be paid late? Each receivable either misses the payment deadline or it doesn't.",
  target: 'late_payment_flag',
  targetStatus: 'Available',
  targetExplanation: 'late_payment_flag is already present in the dataset. It indicates whether a receivable was paid after its due date.',
  informationFields: [
    { name: 'historical_late_payment_count', category: 'historical', description: 'Number of times this customer has paid late in the past', available: true },
    { name: 'risk_segment', category: 'current-state', description: 'Customer risk classification (LOW / MEDIUM / HIGH)', available: true },
    { name: 'payment_terms_days', category: 'current-state', description: 'Number of days allowed for payment', available: true },
    { name: 'invoice_amount', category: 'current-state', description: 'Gross invoice value', available: true },
    { name: 'days_outstanding', category: 'current-state', description: 'How many days since the invoice was issued', available: true },
    { name: 'credit_segment', category: 'current-state', description: 'Credit rating (A–D)', available: true },
    { name: 'historical_dispute_count', category: 'historical', description: 'Number of disputes opened by this customer historically', available: true },
    { name: 'promise_to_pay', category: 'historical', description: 'Whether the customer has made a promise-to-pay commitment', available: false },
  ],
  approaches: [
    { approachId: 'rules', name: 'Rules Baseline', why: 'Establishes the floor. Useful to understand whether a simple "if HIGH risk or 3+ late payments" approach already solves part of the problem — and how much ML actually adds.', label: 'REAL' },
    { approachId: 'logreg', name: 'Logistic Regression', why: 'Simple and interpretable. Good first ML model for a yes/no prediction. Easy to explain to the customer: "these factors increase the probability of late payment."', label: 'REAL' },
    { approachId: 'gbm', name: 'Gradient Boosting', why: 'Strong candidate for structured business data. Handles non-linear relationships (e.g., the combination of long payment terms AND high invoice amount). Currently the best performer on this dataset.', label: 'REAL' },
    { approachId: 'rpt', name: 'SAP-RPT Adapter', why: 'Worth evaluating when relational SAP data and existing RPT capabilities are relevant to the customer. Results here are illustrative — live RPT integration is V1+ scope.', label: 'DEMO ADAPTER' },
  ],
  metrics: [
    { metricKey: 'recall', label: 'Catch Rate', businessExplanation: 'Of all the invoices that actually got paid late, how many did we flag in advance? Missing a late payer is more costly than reviewing an extra one.', recommended: true },
    { metricKey: 'precision', label: 'Accuracy of Flags', businessExplanation: 'Of all the invoices we flagged as at-risk, how many actually were? Low precision means collections wastes time on false alarms.', recommended: false },
    { metricKey: 'f1', label: 'Balanced Score', businessExplanation: 'Balances catch rate and accuracy. Use when you want to optimize both together.', recommended: true },
    { metricKey: 'auc', label: 'Ranking Quality', businessExplanation: 'How well the model ranks at-risk invoices above safe ones. Useful for prioritization — you want the riskiest cases at the top of the list.', recommended: false },
  ],
  engineeringQuestions: [
    'Is there at least 90 days of receivable history available to compute behavioral features?',
    'Does the more complex Gradient Boosting model materially improve recall over Logistic Regression — enough to justify the added complexity?',
    'Should we begin with a rules baseline in production while ML validation is ongoing?',
    'What additional customer data (e.g., promise-to-pay history) would most improve the prediction?',
    'How will the model be integrated into the existing collections workflow — batch scoring or real-time?',
  ],
  confidence: 'High',
  confidenceReasons: [
    'Target (late_payment_flag) is available in the dataset',
    'Dataset size is sufficient for initial experimentation (25K BPs, 500K receivables)',
    'This is a known, validated experiment pattern in the Collections Pack',
    'Pack contains pre-seeded learnings from prior engagements on this exact question',
  ],
};

export const SEED_ENGAGEMENTS: Engagement[] = [
  {
    id: 'eng-001',
    name: 'Northstar — Collections Prioritization',
    customer: 'Northstar Manufacturing',
    useCaseName: 'Collections Prioritization',
    businessProblem: 'Collections team spends too much time manually reviewing all open receivables. We need to prioritize which customers to contact first.',
    neoNotes: 'NEO identified this as a high-confidence use case. Customer has 25K business partners and 500K+ receivables. Historical late payment rate ~17%. Strong willingness to adopt AI-driven prioritization.',
    packId: 'collections-v1',
    packVersion: 'v1.0',
    currentDatasetId: 'ds-northstar-l3-v1',
    stage: 'recommendation',
    customerSignal: 'Validated',
    customerFeedbackNotes: 'Customer liked the prioritization concept and wants AI explanation per case.\nOriginal question unchanged — still focused on late payment prediction.\nNew requirement: need confidence score visible to collector, not just a binary flag.\nKPIs: days-to-collect reduction, collector productivity (accounts worked per day).',
    demoStatus: 'Customer Interested',
    demoLink: 'https://northstar-demo.example.com',
    demoNotes: '',
    customerContextRaw: "Customer confirmed late payment rate is approximately 17% of invoices. They have a custom promise-to-pay field (ZZ_PROMISE_TO_PAY) that records whether the customer committed to a payment date during a collections call. They also track collector team assignments. Roughly 500K receivables per year across 25,000 business partners. Main markets: Germany (45%), US (35%), France (10%).",
    customerContextAnalysis: {
      items: [
        { type: 'profile', label: 'Late Payment Rate', detail: '~17% of invoices paid late — higher than SAP default (15%). Calibrated into L3 dataset.', fidelityLevel: 'L3' },
        { type: 'schema', label: 'Custom Field: ZZ_PROMISE_TO_PAY', detail: 'Promise-to-pay indicator from collections calls. Added to Business Partner schema.', fidelityLevel: 'L2' },
        { type: 'volume', label: 'Volume: 500K receivables / year', detail: '25,000 business partners, 500,000 receivables annually.', fidelityLevel: 'L3' },
      ],
      suggestedFidelityUpgrade: 'L3',
      summary: 'Found 3 context signals: 1 profile (late payment rate 17%), 1 schema extension (ZZ_PROMISE_TO_PAY), 1 volume indicator. Recommended upgrade: L1 → L3.',
    },
    recommendationInput: 'Which customers are most likely to pay late?',
    recommendation: NORTHSTAR_RECOMMENDATION,
    experimentId: 'exp-001',
    createdAt: '2025-09-01T09:00:00Z',
  },
  {
    id: 'eng-002',
    name: 'Test Customer Name — Study Delay Risk',
    customer: 'Test Customer Name',
    useCaseName: 'Study Delay Risk Prediction',
    businessProblem: 'Interconnection study completion is taking too long. Engineers spend too much time manually identifying applications at risk of missing the Study SLA.',
    neoNotes: 'Customer discovery identified study delays as the #1 pain point. Average study takes 14 months; SLA is 12 months. ~30% miss the deadline. PM flagged this as a potential AI use case in the Q3 pipeline review.',
    packId: 'collections-v1',
    packVersion: 'v1.0',
    currentDatasetId: 'ds-northstar-l1-v1',
    stage: 'prototype-data',
    customerSignal: 'Interested',
    customerFeedbackNotes: '',
    demoStatus: 'Not Started',
    demoLink: '',
    demoNotes: '',
    customerContextRaw: "Test Customer shared that roughly 30% of interconnection studies miss the 12-month SLA. They track lifecycle stage (SMOC, DGST, application review) and each stage has a start/end date. They also track the number of document resubmissions and whether an application has been put on hold. Queue position at intake correlates with delay risk. They're particularly interested in identifying at-risk studies within the first 60 days.",
    customerContextAnalysis: null,
    recommendationInput: '',
    recommendation: null,
    experimentId: null,
    createdAt: '2025-09-10T14:30:00Z',
  },
];

// ─── Recommendation Templates (pre-built for each question pattern) ───────────
// Used by recommendationEngine.ts as the base for each match
export const RECOMMENDATION_TEMPLATES: Record<string, Omit<TechRecommendation, 'businessQuestion'>> = {
  'qt-late-payment': {
    understoodAs: 'Identify receivables at risk of late payment early enough for collections to intervene.',
    taskType: 'Binary Classification',
    taskTypeExplanation: "We're asking a yes/no question for each receivable: will this invoice be paid late?",
    target: 'late_payment_flag',
    targetStatus: 'Available',
    targetExplanation: 'late_payment_flag is present in the dataset. It records whether a receivable was paid after its due date.',
    informationFields: [
      { name: 'historical_late_payment_count', category: 'historical', description: 'Number of times this customer has paid late in the past', available: true, sapProduct: 'S/4 AR', accessStatus: 'Candidate', accessNote: 'Derived via aggregation over payment history' },
      { name: 'risk_segment', category: 'current-state', description: 'Customer risk classification (LOW / MEDIUM / HIGH)', available: true, sapProduct: 'FSCM Collections', accessStatus: 'Candidate', accessNote: 'Illustrative mapping' },
      { name: 'payment_terms_days', category: 'current-state', description: 'Number of days allowed for payment', available: true, sapProduct: 'S/4 AR', accessStatus: 'Candidate', accessNote: 'Illustrative mapping' },
      { name: 'invoice_amount', category: 'current-state', description: 'Gross invoice value', available: true, sapProduct: 'S/4 AR', accessStatus: 'Candidate', accessNote: 'Illustrative mapping' },
      { name: 'days_outstanding', category: 'current-state', description: 'Days since invoice was issued', available: true, sapProduct: 'S/4 AR', accessStatus: 'Candidate', accessNote: 'Derived from invoice_date' },
      { name: 'credit_segment', category: 'current-state', description: 'Credit rating (A–D)', available: true, sapProduct: 'S/4 Credit Management', accessStatus: 'Candidate', accessNote: 'Illustrative mapping' },
      { name: 'historical_dispute_count', category: 'historical', description: 'Number of disputes opened historically', available: true, sapProduct: 'FSCM Dispute Management', accessStatus: 'Candidate', accessNote: 'Requires FSCM Dispute activation' },
    ],
    approaches: [
      { approachId: 'rules', name: 'Rules Baseline', why: 'Establishes the floor — useful to understand how much ML actually adds over a simple heuristic.', label: 'REAL' },
      { approachId: 'logreg', name: 'Logistic Regression', why: 'Simple, interpretable first ML model. Easy to explain to the customer.', label: 'REAL' },
      { approachId: 'gbm', name: 'Gradient Boosting', why: 'Strong candidate for structured business data. Handles non-linear feature combinations.', label: 'REAL' },
      { approachId: 'rpt', name: 'SAP-RPT Adapter', why: 'Worth evaluating when live RPT capabilities are relevant. Results here are illustrative.', label: 'DEMO ADAPTER' },
    ],
    metrics: [
      { metricKey: 'recall', label: 'Catch Rate', businessExplanation: 'Of all invoices that actually got paid late, how many did we flag in advance?', recommended: true },
      { metricKey: 'precision', label: 'Accuracy of Flags', businessExplanation: 'Of all invoices we flagged, how many actually were late?', recommended: false },
      { metricKey: 'f1', label: 'Balanced Score', businessExplanation: 'Balances catch rate and flag accuracy together.', recommended: true },
      { metricKey: 'auc', label: 'Ranking Quality', businessExplanation: 'How well the model ranks at-risk invoices above safe ones.', recommended: false },
    ],
    engineeringQuestions: [
      'Is at least 90 days of receivable history available to compute behavioral features?',
      'Does Gradient Boosting materially improve recall over Logistic Regression — enough to justify the complexity?',
      'Should we begin with a rules baseline in production while ML validation runs?',
      'What additional customer data would most improve the prediction?',
    ],
    confidence: 'High',
    confidenceReasons: [
      'Target (late_payment_flag) is available in the dataset',
      'Dataset size is sufficient for experimentation',
      'Known validated experiment pattern exists in the Collections Pack',
      'Pack contains pre-seeded learnings from prior engagements',
    ],
  },
  'qt-dispute-risk': {
    understoodAs: 'Identify receivables likely to become disputes before they are formally opened.',
    taskType: 'Binary Classification',
    taskTypeExplanation: "We're predicting whether a receivable will result in a dispute — a yes/no question for each open invoice.",
    target: 'dispute_flag',
    targetStatus: 'Derivable',
    targetExplanation: 'dispute_flag can be derived from the Dispute entity: any receivable linked to a dispute record with status OPEN or RESOLVED.',
    informationFields: [
      { name: 'invoice_amount', category: 'current-state', description: 'High-value invoices have higher dispute probability', available: true },
      { name: 'risk_segment', category: 'current-state', description: 'Customer risk classification', available: true },
      { name: 'payment_terms_days', category: 'current-state', description: 'Payment terms length', available: true },
      { name: 'historical_dispute_count', category: 'historical', description: 'Prior disputes opened by this customer', available: true },
      { name: 'historical_late_payment_count', category: 'historical', description: 'Prior late payments (correlated with disputes)', available: true },
    ],
    approaches: [
      { approachId: 'rules', name: 'Rules Baseline', why: 'Simple heuristic baseline — e.g., flag if prior dispute count > 1.', label: 'REAL' },
      { approachId: 'logreg', name: 'Logistic Regression', why: 'Interpretable baseline for dispute risk — good for explaining to customer.', label: 'REAL' },
      { approachId: 'gbm', name: 'Gradient Boosting', why: 'Handles interaction between invoice size and customer history.', label: 'REAL' },
    ],
    metrics: [
      { metricKey: 'precision', label: 'Accuracy of Flags', businessExplanation: 'Of all invoices we flagged as dispute-risk, how many actually became disputes?', recommended: true },
      { metricKey: 'recall', label: 'Catch Rate', businessExplanation: 'Of all invoices that became disputes, how many did we catch early?', recommended: false },
      { metricKey: 'f1', label: 'Balanced Score', businessExplanation: 'Balances precision and recall.', recommended: true },
    ],
    engineeringQuestions: [
      'How is dispute_flag defined — any dispute opened, or only unresolved disputes?',
      'Is dispute history available at the receivable level or only at the business partner level?',
      'What is the natural base rate of disputes in this customer dataset?',
    ],
    confidence: 'Medium',
    confidenceReasons: [
      'Target (dispute_flag) is derivable but not pre-computed',
      'Pack contains dispute history data',
      'Base rate may be low (<10%) which affects model training',
    ],
  },
  'qt-collections-priority': {
    understoodAs: 'Rank open receivables so collections teams can focus on the highest-risk accounts first.',
    taskType: 'Ranking',
    taskTypeExplanation: "We're not just predicting yes/no — we're ranking accounts from highest to lowest risk so collections can work the list in order.",
    target: 'collections_priority_score',
    targetStatus: 'Derivable',
    targetExplanation: 'Collections priority score is derived from combining late payment risk, open amount, and days outstanding into a ranked score.',
    informationFields: [
      { name: 'historical_late_payment_count', category: 'historical', description: 'Prior late payments — strongest predictor', available: true },
      { name: 'risk_segment', category: 'current-state', description: 'Customer risk tier', available: true },
      { name: 'days_outstanding', category: 'current-state', description: 'How long the invoice has been open', available: true },
      { name: 'invoice_amount', category: 'current-state', description: 'Gross invoice value — larger amounts often prioritized', available: true },
      { name: 'dunning_level', category: 'current-state', description: 'Current dunning escalation level', available: true },
    ],
    approaches: [
      { approachId: 'rules', name: 'Rules Baseline', why: 'Simple scoring rule (e.g., weight risk segment + days outstanding) — easy to implement and explain.', label: 'REAL' },
      { approachId: 'gbm', name: 'Gradient Boosting', why: 'Can learn optimal ranking weights from historical data.', label: 'REAL' },
      { approachId: 'xgboost', name: 'XGBoost', why: 'Strong option for learning rankings from structured business data.', label: 'REAL' },
    ],
    metrics: [
      { metricKey: 'recall', label: 'Catch Rate at Top 20%', businessExplanation: 'Of all accounts that will pay late, how many appear in the top 20% of the ranked list?', recommended: true },
      { metricKey: 'auc', label: 'Ranking Quality', businessExplanation: 'How well the model separates late payers from on-time payers in the ranked output.', recommended: true },
    ],
    engineeringQuestions: [
      'How many accounts does the collections team review per day — this determines where to cut the ranked list?',
      'Should the ranking account for invoice amount (prioritize high-value) or pure late-payment risk?',
      'Is there a dunning-level threshold above which accounts are auto-escalated regardless of score?',
    ],
    confidence: 'High',
    confidenceReasons: [
      'Ranking approach is well-suited to collections workflows',
      'All required features are available in the dataset',
      'Known pattern from prior Collections Pack engagements',
    ],
  },
  'qt-payment-amount': {
    understoodAs: 'Forecast how much cash is expected from customers in the next 30 days.',
    taskType: 'Forecasting',
    taskTypeExplanation: "We're predicting a dollar amount (not yes/no) — specifically, the expected payment from each customer over the next 30 days.",
    target: 'expected_payment_30d',
    targetStatus: 'Derivable',
    targetExplanation: 'expected_payment_30d can be derived from historical payment records: sum of payments from each business partner in rolling 30-day windows.',
    informationFields: [
      { name: 'invoice_amount', category: 'current-state', description: 'Open invoice value', available: true },
      { name: 'payment_terms_days', category: 'current-state', description: 'Payment terms — determines when payment is expected', available: true },
      { name: 'risk_segment', category: 'current-state', description: 'Risk tier affects payment likelihood', available: true },
      { name: 'historical_late_payment_count', category: 'historical', description: 'Prior late payments affect timing forecast', available: true },
    ],
    approaches: [
      { approachId: 'rules', name: 'Rules Baseline', why: 'Simple forecast: sum of invoices due in 30 days, discounted by historical late payment rate.', label: 'REAL' },
      { approachId: 'rf', name: 'Random Forest', why: 'Handles the non-linear relationship between customer history and expected payment timing.', label: 'REAL' },
      { approachId: 'gbm', name: 'Gradient Boosting', why: 'Strong regression model for structured business data with mixed feature types.', label: 'REAL' },
    ],
    metrics: [
      { metricKey: 'mae', label: 'Average Error', businessExplanation: 'On average, how many dollars off is our 30-day cash forecast?', recommended: true },
      { metricKey: 'rmse', label: 'Error Sensitivity', businessExplanation: 'Same as average error but penalizes large misses more heavily.', recommended: false },
    ],
    engineeringQuestions: [
      'What is the current manual cash forecast process — are we replacing or augmenting it?',
      'How far back does payment history go? 90 days minimum is needed for reliable behavioral features.',
      'Should the forecast be at the business partner level or the individual invoice level?',
    ],
    confidence: 'Medium',
    confidenceReasons: [
      'Target requires derivation from payment history',
      'Forecasting accuracy depends on history depth — L3 dataset helps but real data validation is critical',
    ],
  },
};

// ─── Context Analysis Keyword Patterns ───────────────────────────────────────
export const CONTEXT_ANALYSIS_PATTERNS: Array<{
  keywords: string[];
  type: import('./types').ContextItem['type'];
  labelFn: (match: string) => string;
  detailFn: (match: string) => string;
  fidelityLevel: import('../synthetic-data-v2/types').FidelityLevel;
}> = [
  {
    keywords: ['field', 'column', 'custom field', 'z-table', 'extension', 'zz_', 'custom table', 'z_'],
    type: 'schema',
    labelFn: () => 'Custom Schema Extension',
    detailFn: (m) => `Schema addition detected: "${m.trim()}". Will add to entity schema (L2 upgrade).`,
    fidelityLevel: 'L2',
  },
  {
    keywords: ['% of', 'percent', 'rate is', 'rate of', '% late', '% dispute', '% overdue'],
    type: 'profile',
    labelFn: () => 'Distribution / Rate Signal',
    detailFn: (m) => `Business distribution data detected: "${m.trim()}". Will calibrate dataset rates (L3 upgrade).`,
    fidelityLevel: 'L3',
  },
  {
    keywords: ['always', 'must be', 'never', 'constraint', 'business rule', 'requirement'],
    type: 'constraint',
    labelFn: () => 'Business Constraint',
    detailFn: (m) => `Business constraint detected: "${m.trim()}". Will add to pack quality rules.`,
    fidelityLevel: 'L2',
  },
  {
    keywords: ['million', 'thousand', 'k records', 'k business partners', 'k customers', 'k invoices', 'volume'],
    type: 'volume',
    labelFn: () => 'Volume Indicator',
    detailFn: (m) => `Volume signal detected: "${m.trim()}". Will calibrate dataset scale (L3 upgrade).`,
    fidelityLevel: 'L3',
  },
  {
    keywords: ['scenario', 'use case', 'edge case', 'situation', 'case where'],
    type: 'scenario',
    labelFn: () => 'Representative Scenario',
    detailFn: (m) => `Business scenario detected: "${m.trim()}". Will add as representative scenario.`,
    fidelityLevel: 'L3',
  },
  {
    keywords: ['sample', 'csv', 'upload', 'export', 'rows of data', 'anonymized'],
    type: 'sample',
    labelFn: () => 'Customer Sample Data',
    detailFn: (m) => `Data sample reference detected: "${m.trim()}". Requires approval for L4 use.`,
    fidelityLevel: 'L4',
  },
];
