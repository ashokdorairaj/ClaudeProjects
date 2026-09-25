import type { GeneratedDataset, RulesResult } from './types';

export function runRulesBaseline(dataset: GeneratedDataset): RulesResult {
  const t0 = performance.now();

  const bpMap = new Map(dataset.businessPartners.map(bp => [bp.business_partner_id, bp]));

  let tp = 0, fp = 0, fn = 0, tn = 0;

  for (const rec of dataset.receivables) {
    const bp = bpMap.get(rec.business_partner_id);
    if (!bp) continue;

    const predicted =
      bp.risk_segment === 'HIGH' ||
      bp.historical_late_payments >= 3 ||
      (rec.payment_terms_days >= 60 && rec.invoice_amount > 10000);

    const actual = rec.late_payment_flag;

    if (predicted && actual)  tp++;
    else if (predicted && !actual) fp++;
    else if (!predicted && actual) fn++;
    else tn++;
  }

  const total = tp + fp + fn + tn;
  const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
  const recall    = (tp + fn) > 0 ? tp / (tp + fn) : 0;
  const f1        = (precision + recall) > 0 ? 2 * precision * recall / (precision + recall) : 0;
  const accuracy  = total > 0 ? (tp + tn) / total : 0;

  // AUC approximation: binary predictions → trapezoid over two threshold points (0 and 1)
  // TPR at threshold=0: 1.0, FPR at threshold=0: 1.0
  // TPR at threshold=1: recall, FPR at threshold=1: fp/(fp+tn)
  const tpr = recall;
  const fpr = (fp + tn) > 0 ? fp / (fp + tn) : 0;
  const auc = 0.5 * (1 + tpr - fpr); // area of trapezoid under ROC curve

  return {
    truePositives: tp,
    falsePositives: fp,
    falseNegatives: fn,
    trueNegatives: tn,
    accuracy: Math.round(accuracy * 10000) / 10000,
    precision: Math.round(precision * 10000) / 10000,
    recall: Math.round(recall * 10000) / 10000,
    f1: Math.round(f1 * 10000) / 10000,
    auc: Math.round(auc * 10000) / 10000,
    executionMs: Math.round(performance.now() - t0),
    sampleSize: total,
  };
}
