import type { CustomerContextAnalysis, ContextItem, Engagement } from './types';
import type { FidelityLevel } from '../synthetic-data-v2/types';
import { CONTEXT_ANALYSIS_PATTERNS } from './constants';

export interface AnalysisProgress {
  step: string;
  pct: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

const FIDELITY_ORDER: FidelityLevel[] = ['L1', 'L2', 'L3', 'L4'];

function maxFidelity(levels: FidelityLevel[]): FidelityLevel {
  if (levels.length === 0) return 'L1';
  return levels.reduce((best, l) =>
    FIDELITY_ORDER.indexOf(l) > FIDELITY_ORDER.indexOf(best) ? l : best,
    'L1' as FidelityLevel,
  );
}

export async function analyzeCustomerContext(
  text: string,
  onProgress: (p: AnalysisProgress) => void,
): Promise<CustomerContextAnalysis> {
  const lower = text.toLowerCase();

  onProgress({ step: 'Parsing input…', pct: 10 });
  await sleep(150);

  onProgress({ step: 'Classifying context items…', pct: 50 });
  await sleep(200);

  const items: ContextItem[] = [];
  const seenTypes = new Set<ContextItem['type']>();

  for (const pattern of CONTEXT_ANALYSIS_PATTERNS) {
    const matchedKeyword = pattern.keywords.find(k => lower.includes(k));
    if (matchedKeyword && !seenTypes.has(pattern.type)) {
      seenTypes.add(pattern.type);
      // Find the sentence containing the keyword for context
      const sentences = text.split(/[.\n!?]+/);
      const matchSentence = sentences.find(s => s.toLowerCase().includes(matchedKeyword)) || matchedKeyword;
      items.push({
        type: pattern.type,
        label: pattern.labelFn(matchSentence),
        detail: pattern.detailFn(matchSentence),
        fidelityLevel: pattern.fidelityLevel,
      });
    }
  }

  onProgress({ step: 'Assessing fidelity impact…', pct: 85 });
  await sleep(150);

  const suggestedFidelityUpgrade = maxFidelity(items.map(i => i.fidelityLevel));

  const typeLabels: Record<ContextItem['type'], string> = {
    schema: 'schema extension',
    profile: 'distribution/rate signal',
    constraint: 'business constraint',
    volume: 'volume indicator',
    scenario: 'representative scenario',
    sample: 'customer sample reference',
  };

  const itemDescriptions = items.map(i => typeLabels[i.type]).join(', ');
  const summary = items.length === 0
    ? 'No additional context signals detected. Your current L1 dataset uses SAP/domain defaults.'
    : `Found ${items.length} context signal${items.length > 1 ? 's' : ''}: ${itemDescriptions}. Recommended upgrade: L1 → ${suggestedFidelityUpgrade}.`;

  onProgress({ step: 'Done.', pct: 100 });

  return { items, suggestedFidelityUpgrade, summary };
}

// ─── Engagement extraction from uploaded document ─────────────────────────────

export interface ExtractedUseCase {
  id: string;
  name: string;
  businessProblem: string;
  domain: string;
  relevantPack: string;
}

export interface ExtractedEngagement {
  customerName: string;
  industry: string;
  sapLandscape: string;
  businessProblems: string[];
  useCases: ExtractedUseCase[];
  kpis: string[];
  dataAvailability: string[];
  customFields: string[];
  confidence: 'High' | 'Medium' | 'Low';
}

// Simulated extraction — returns rich structured data based on filename/content patterns
export async function extractEngagementFromDocument(
  filename: string,
  onProgress: (step: string, pct: number) => void,
): Promise<ExtractedEngagement> {
  const name = filename.toLowerCase();

  onProgress('Reading document structure…', 10);
  await sleep(300);
  onProgress('Identifying customer information…', 30);
  await sleep(350);
  onProgress('Extracting business problems…', 50);
  await sleep(300);
  onProgress('Finding use cases and opportunities…', 70);
  await sleep(350);
  onProgress('Analyzing data availability…', 85);
  await sleep(250);
  onProgress('Building engagement summary…', 95);
  await sleep(200);

  // Pattern matching on filename — production would parse actual content
  const isOpportunityInventory = name.includes('opportunit') || name.includes('inventor') || name.includes('use case') || name.includes('usecase');
  const isDiscovery = name.includes('discover') || name.includes('workshop') || name.includes('notes');
  const isRequirements = name.includes('require') || name.includes('spec') || name.includes('brd');
  const isFinance = name.includes('finance') || name.includes('ar') || name.includes('collection') || name.includes('fscm');
  const isProcurement = name.includes('procure') || name.includes('ariba') || name.includes('purchase');
  const isTransport = name.includes('transport') || name.includes('logistics') || name.includes(' tm ') || name.includes('aldi');

  if (isProcurement) {
    return {
      customerName: 'Test Customer Name',
      industry: 'Manufacturing',
      sapLandscape: 'S/4HANA + Ariba',
      businessProblems: [
        'High rate of invoice exceptions and holds delaying payments to suppliers',
        '3-way match failure rate is above 15% for new suppliers',
        'Manual approval process creates bottlenecks in procurement cycle',
      ],
      useCases: [
        { id: 'uc-1', name: 'Invoice Exception Prediction', businessProblem: 'Predict which invoices will require manual intervention before they enter the approval queue.', domain: 'Procurement', relevantPack: 'procurement-v09' },
        { id: 'uc-2', name: 'Supplier Risk Scoring', businessProblem: 'Score new and existing suppliers on delivery reliability, quality, and compliance risk.', domain: 'Procurement', relevantPack: 'procurement-v09' },
        { id: 'uc-3', name: '3-Way Match Automation', businessProblem: 'Predict whether a PO/GR/Invoice combination will match automatically or require exception handling.', domain: 'Procurement', relevantPack: 'procurement-v09' },
      ],
      kpis: ['Invoice processing time', 'Exception rate', 'Supplier on-time delivery', 'Match automation rate'],
      dataAvailability: ['Purchase Orders (historical)', 'Goods Receipts', 'Supplier master data', 'Invoice history'],
      customFields: ['ZZ_SUPPLIER_TIER', 'ZZ_CRITICAL_CATEGORY'],
      confidence: 'Medium',
    };
  }

  if (isTransport) {
    return {
      customerName: 'Test Customer Name',
      industry: 'Retail / Consumer Products',
      sapLandscape: 'SAP TM + S/4HANA',
      businessProblems: [
        'Unplanned freight units are disrupting transport planning and increasing costs',
        'Planners lack visibility into which deliveries will require manual replanning',
        'Freezer-capable resource allocation is inconsistent across distribution centers',
      ],
      useCases: [
        { id: 'uc-1', name: 'Unplanned FU Prediction', businessProblem: 'Predict which freight units will become unplanned and require manual intervention.', domain: 'Supply Chain', relevantPack: 'tm-v08' },
        { id: 'uc-2', name: 'Resource Allocation Optimization', businessProblem: 'Recommend the most appropriate resource type for each delivery based on product type and constraints.', domain: 'Supply Chain', relevantPack: 'tm-v08' },
        { id: 'uc-3', name: 'Delivery Delay Prediction', businessProblem: 'Identify deliveries at risk of missing their time windows before dispatch.', domain: 'Supply Chain', relevantPack: 'tm-v08' },
      ],
      kpis: ['Unplanned FU rate', 'On-time delivery rate', 'Resource utilization', 'Manual replanning time'],
      dataAvailability: ['Freight Orders (historical)', 'Resource master data', 'Delivery history', 'Store lists'],
      customFields: ['ZZ_STORE_TYPE', 'ZZ_FREEZER_CAPABLE'],
      confidence: 'High',
    };
  }

  // Default: Finance / Collections (works for opportunity inventories and general uploads)
  return {
    customerName: 'Test Customer Name',
    industry: isDiscovery ? 'Consumer Products' : 'Manufacturing',
    sapLandscape: 'S/4HANA + FSCM',
    businessProblems: [
      'Collections team manually reviews all open receivables weekly — takes approximately 3 full working days.',
      'Collectors do not have a prioritized view of which accounts to contact first.',
      isRequirements
        ? 'Requirements document identifies need for AI-driven collections prioritization before end of fiscal year.'
        : 'High-value accounts with low risk of non-payment receive the same attention as truly at-risk accounts.',
    ].filter(Boolean) as string[],
    useCases: isOpportunityInventory ? [
      { id: 'uc-1', name: 'Collections Prioritization', businessProblem: 'Rank open receivables so collectors focus on the highest-risk, highest-value accounts first.', domain: 'Finance', relevantPack: 'collections-v1' },
      { id: 'uc-2', name: 'Late Payment Prediction', businessProblem: 'Identify receivables likely to be paid late before the due date so collections can intervene early.', domain: 'Finance', relevantPack: 'collections-v1' },
      { id: 'uc-3', name: 'Dispute Prediction', businessProblem: 'Flag invoices at risk of entering dispute to allow pre-emptive resolution.', domain: 'Finance', relevantPack: 'collections-v1' },
      { id: 'uc-4', name: 'Propensity to Pay', businessProblem: 'Identify which customers are most likely to pay following a collections call.', domain: 'Finance', relevantPack: 'collections-v1' },
      { id: 'uc-5', name: 'Expected Collections Forecast', businessProblem: 'Forecast 30-day cash inflows from accounts receivable for treasury planning.', domain: 'Finance', relevantPack: 'collections-v1' },
    ] : [
      { id: 'uc-1', name: 'Collections Prioritization', businessProblem: 'Rank open receivables so collectors focus on the highest-risk accounts first.', domain: 'Finance', relevantPack: 'collections-v1' },
      { id: 'uc-2', name: 'Late Payment Prediction', businessProblem: 'Identify receivables likely to be paid late before the due date.', domain: 'Finance', relevantPack: 'collections-v1' },
    ],
    kpis: ['Days Sales Outstanding (DSO)', 'Collections effectiveness ratio', 'Bad debt write-off rate', 'Collector productivity (accounts worked per day)'],
    dataAvailability: ['Receivables (BSID)', 'Business Partner master (KNA1)', 'Payment history', 'Dunning records', isDiscovery ? 'Promise-to-pay field (ZZ_PROMISE_TO_PAY)' : 'Collection history'].filter(Boolean) as string[],
    customFields: isDiscovery || isOpportunityInventory ? ['ZZ_PROMISE_TO_PAY', 'ZZ_COLLECTOR_TEAM'] : [],
    confidence: isOpportunityInventory ? 'High' : isDiscovery ? 'High' : 'Medium',
  };
}
