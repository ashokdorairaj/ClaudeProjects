import type { GeneratedDataset, QualityCheck, QualityCategory } from './types';

function check(
  checkId: string,
  label: string,
  category: QualityCategory,
  failCount: number,
  total: number,
  detail: string
): QualityCheck {
  const passed = failCount === 0;
  const score = total === 0 ? 100 : Math.round(((total - failCount) / total) * 100);
  return { checkId, label, category, passed, failCount, totalChecked: total, score, detail };
}

export function runQualityChecks(dataset: GeneratedDataset): QualityCheck[] {
  const results: QualityCheck[] = [];
  const {
    businessPartners, receivables, payments, dunningRecords, disputes, collectionHistory, config,
  } = dataset;

  const bpIds   = new Set(businessPartners.map(bp => bp.business_partner_id));
  const recIds  = new Set(receivables.map(r => r.receivable_id));

  // ── Check 1: Receivable → Business Partner ─────────────────────────────────
  const orphanRecs = receivables.filter(r => !bpIds.has(r.business_partner_id)).length;
  results.push(check('FK-1', 'Receivable → Business Partner', 'referential_integrity', orphanRecs, receivables.length,
    orphanRecs === 0 ? 'All receivables reference a valid Business Partner.' : `${orphanRecs} orphan receivable(s) found.`));

  // ── Check 2: Payment → Receivable ──────────────────────────────────────────
  const orphanPmts = payments.filter(p => !recIds.has(p.receivable_id)).length;
  results.push(check('FK-2', 'Payment → Receivable', 'referential_integrity', orphanPmts, payments.length,
    orphanPmts === 0 ? 'All payments reference a valid Receivable.' : `${orphanPmts} orphan payment(s) found.`));

  // ── Check 3: Dunning → Receivable ──────────────────────────────────────────
  const orphanDunn = dunningRecords.filter(d => !recIds.has(d.receivable_id)).length;
  results.push(check('FK-3', 'Dunning → Receivable', 'referential_integrity', orphanDunn, dunningRecords.length,
    orphanDunn === 0 ? 'All dunning records reference a valid Receivable.' : `${orphanDunn} orphan dunning record(s) found.`));

  // ── Check 4: Dispute → Receivable ──────────────────────────────────────────
  const orphanDisp = disputes.filter(d => !recIds.has(d.receivable_id)).length;
  results.push(check('FK-4', 'Dispute → Receivable', 'referential_integrity', orphanDisp, disputes.length,
    orphanDisp === 0 ? 'All disputes reference a valid Receivable.' : `${orphanDisp} orphan dispute(s) found.`));

  // ── Check 5: Collection History → Business Partner ─────────────────────────
  if (collectionHistory.length > 0) {
    const orphanCol = collectionHistory.filter(c => !bpIds.has(c.business_partner_id)).length;
    results.push(check('FK-5', 'Collection History → Business Partner', 'referential_integrity', orphanCol, collectionHistory.length,
      orphanCol === 0 ? 'All collection history records reference a valid Business Partner.' : `${orphanCol} orphan record(s) found.`));
  }

  // ── Check 6: due_date >= invoice_date ──────────────────────────────────────
  const dueDateViolations = receivables.filter(r => r.due_date < r.invoice_date).length;
  results.push(check('BR-1', 'due_date ≥ invoice_date', 'business_rule', dueDateViolations, receivables.length,
    dueDateViolations === 0 ? 'All due dates are on or after invoice dates.' : `${dueDateViolations} due date violation(s).`));

  // ── Check 7: payment_date >= invoice_date ──────────────────────────────────
  const recMap = new Map(receivables.map(r => [r.receivable_id, r]));
  const pmtDateViolations = payments.filter(p => {
    const r = recMap.get(p.receivable_id);
    return r && p.payment_date < r.invoice_date;
  }).length;
  results.push(check('BR-2', 'payment_date ≥ invoice_date', 'business_rule', pmtDateViolations, payments.length,
    pmtDateViolations === 0 ? 'All payment dates are on or after invoice dates.' : `${pmtDateViolations} payment date violation(s).`));

  // ── Check 8: Dunning only on overdue open items ────────────────────────────
  const dunnViolations = dunningRecords.filter(d => {
    const r = recMap.get(d.receivable_id);
    return r && (r.clearing_status !== 'OPEN' || d.dunning_date < r.due_date);
  }).length;
  results.push(check('BR-3', 'Dunning only on overdue open items', 'business_rule', dunnViolations, dunningRecords.length,
    dunnViolations === 0 ? 'All dunning records are for overdue open receivables.' : `${dunnViolations} invalid dunning record(s).`));

  // ── Check 9: open_amount >= 0 ──────────────────────────────────────────────
  const negOpenAmount = receivables.filter(r => r.open_amount < 0).length;
  results.push(check('BR-4', 'open_amount ≥ 0', 'business_rule', negOpenAmount, receivables.length,
    negOpenAmount === 0 ? 'No negative open amounts.' : `${negOpenAmount} record(s) with negative open amount.`));

  // ── Check 10: dispute_amount <= invoice_amount ─────────────────────────────
  const dispAmountViolations = disputes.filter(d => {
    const r = recMap.get(d.receivable_id);
    return r && d.dispute_amount > r.invoice_amount;
  }).length;
  results.push(check('BR-5', 'dispute_amount ≤ invoice_amount', 'business_rule', dispAmountViolations, disputes.length,
    dispAmountViolations === 0 ? 'All dispute amounts are ≤ invoice amounts.' : `${dispAmountViolations} over-disputed record(s).`));

  // ── Check 11: Late payment rate within ±3% of target ──────────────────────
  const actualLateRate = dataset.stats.actualLatePaymentRate;
  const targetLateRate = config.latePaymentRate;
  const lateDelta = Math.abs(actualLateRate - targetLateRate);
  const lateFail = lateDelta > 0.05 ? 1 : 0;
  results.push(check('DIST-1', 'Late payment rate matches target (±5%)', 'distribution', lateFail, 1,
    `Target: ${(targetLateRate * 100).toFixed(1)}% | Generated: ${(actualLateRate * 100).toFixed(1)}% | Delta: ${(lateDelta * 100).toFixed(1)}%`));

  // ── Check 12: Dispute rate within ±3% of target ────────────────────────────
  const actualDisputeRate = dataset.stats.actualDisputeRate;
  const targetDisputeRate = config.disputeRate;
  const dispDelta = Math.abs(actualDisputeRate - targetDisputeRate);
  const dispFail = dispDelta > 0.05 ? 1 : 0;
  results.push(check('DIST-2', 'Dispute rate matches target (±5%)', 'distribution', dispFail, 1,
    `Target: ${(targetDisputeRate * 100).toFixed(1)}% | Generated: ${(actualDisputeRate * 100).toFixed(1)}% | Delta: ${(dispDelta * 100).toFixed(1)}%`));

  return results;
}

export function overallScore(checks: QualityCheck[]): number {
  if (checks.length === 0) return 0;
  return Math.round(checks.reduce((s, c) => s + c.score, 0) / checks.length);
}

export function readinessLabel(checks: QualityCheck[], fidelityLevel: string): string {
  const score = overallScore(checks);
  if (fidelityLevel === 'L1' || fidelityLevel === 'L2') return 'Ready for Prototyping';
  if (score >= 90) return 'Ready for Early ML Experimentation';
  return 'Ready for Prototyping';
}
