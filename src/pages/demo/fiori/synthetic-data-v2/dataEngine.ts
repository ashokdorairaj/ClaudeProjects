import type { GenerationConfig, GeneratedDataset, BusinessPartner, Receivable, Payment, DunningRecord, Dispute, CollectionHistoryRecord, DatasetStats } from './types';

// ─── Seeded PRNG (mulberry32) ─────────────────────────────────────────────────
function makePRNG(seed: number) {
  let s = seed >>> 0;
  return function rng(): number {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Utility Helpers ──────────────────────────────────────────────────────────
function sampleWeighted<T>(rng: () => number, items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function daysBetween(d1: string, d2: string): number {
  return Math.floor((new Date(d2).getTime() - new Date(d1).getTime()) / 86400000);
}

function randomDate(rng: () => number, startStr: string, endStr: string): string {
  const start = new Date(startStr).getTime();
  const end = new Date(endStr).getTime();
  return new Date(start + rng() * (end - start)).toISOString().split('T')[0];
}

function zeroPad(n: number, len: number): string {
  return String(n).padStart(len, '0');
}

// Log-normal random: params are mean and std of the underlying normal
function logNormal(rng: () => number, mu: number, sigma: number): number {
  // Box-Muller transform
  const u1 = Math.max(1e-10, rng());
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.exp(mu + sigma * z);
}

// Poisson random number
function poisson(rng: () => number, lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do { k++; p *= rng(); } while (p > L);
  return k - 1;
}

// ─── Main Generator ───────────────────────────────────────────────────────────
export function generateDataset(config: GenerationConfig): GeneratedDataset {
  const rng = makePRNG(config.seed);
  const now = new Date().toISOString().split('T')[0];

  // Resolve country distribution
  const countryEntries = Object.entries(config.countryWeights);
  const countries = countryEntries.map(([k]) => k);
  const countryW  = countryEntries.map(([, v]) => v);

  const riskLevels  = ['LOW', 'MEDIUM', 'HIGH'] as const;
  const riskWeightArr = [config.riskWeights.LOW, config.riskWeights.MEDIUM, config.riskWeights.HIGH];

  const industries = ['Manufacturing', 'Chemicals', 'Automotive', 'Pharmaceuticals', 'Retail', 'Logistics', 'Energy', 'Technology', 'Construction', 'Financial Services'];
  const paymentTermOptions = [14, 30, 45, 60, 90];
  const documentTypes = ['RV', 'R1', 'DR'];
  const paymentMethods = ['BANK_TRANSFER', 'CHECK', 'DIRECT_DEBIT', 'CREDIT_CARD', 'EDI'];
  const disputeReasons = ['PRICE_DISCREPANCY', 'QUANTITY_MISMATCH', 'DELIVERY_ISSUE', 'DUPLICATE_INVOICE', 'GOODS_DAMAGED', 'SERVICE_DISPUTE'];
  const contactTypes = ['EMAIL', 'PHONE', 'LETTER', 'VISIT'] as const;
  const collectorTeams = ['TEAM_A', 'TEAM_B', 'TEAM_C', 'TEAM_D'];
  const zzRiskCategories = ['CRITICAL', 'WATCH', 'STANDARD', 'PREFERRED'];
  const zzPaymentChannels = ['EDI', 'PORTAL', 'MANUAL', 'BANK_TRANSFER'];

  // Credit segment weighted by risk
  function creditSegmentForRisk(risk: 'LOW' | 'MEDIUM' | 'HIGH'): 'A' | 'B' | 'C' | 'D' {
    const map = {
      LOW:    [['A','B','C','D'] as const, [0.50, 0.35, 0.12, 0.03]],
      MEDIUM: [['A','B','C','D'] as const, [0.15, 0.40, 0.35, 0.10]],
      HIGH:   [['A','B','C','D'] as const, [0.03, 0.12, 0.45, 0.40]],
    };
    const [segs, ws] = map[risk];
    return sampleWeighted(rng, segs as 'A'[],  ws as number[]) as 'A' | 'B' | 'C' | 'D';
  }

  function companyCode(country: string): string {
    const map: Record<string, string> = { DE: '1000', US: '2000', FR: '3000', GB: '4000' };
    return map[country] ?? '9000';
  }

  // ── Phase 1: Business Partners ────────────────────────────────────────────
  const businessPartners: BusinessPartner[] = [];
  for (let i = 0; i < config.bpCount; i++) {
    const country = sampleWeighted(rng, countries, countryW);
    const risk = sampleWeighted(rng, riskLevels, riskWeightArr);
    const creditSeg = creditSegmentForRisk(risk);

    // Historical late payments: Poisson-distributed by risk
    const lambdaMap = { LOW: 0.5, MEDIUM: 2, HIGH: 5 };
    const histLate = poisson(rng, lambdaMap[risk]);

    // Revenue: log-normal, range approx €500K–€500M
    const revenue = Math.round(logNormal(rng, 13.5, 1.2) * 100) / 100;

    businessPartners.push({
      business_partner_id: zeroPad(i + 1, 10),
      country,
      company_code: companyCode(country),
      industry: industries[Math.floor(rng() * industries.length)],
      customer_since: randomDate(rng, '2005-01-01', '2022-12-31'),
      credit_segment: creditSeg,
      risk_segment: risk,
      annual_revenue: revenue,
      historical_late_payments: histLate,
      ZZ_RISK_CATEGORY: zzRiskCategories[risk === 'HIGH' ? 0 : risk === 'MEDIUM' ? 1 : 2 + Math.floor(rng() * 2)],
      ZZ_PAYMENT_CHANNEL: sampleWeighted(rng, zzPaymentChannels, [0.30, 0.25, 0.20, 0.25]),
    });
  }

  // ── Phase 2: Receivables with correlated late_payment_flag ───────────────
  const receivables: Receivable[] = [];
  const bpMap = new Map(businessPartners.map(bp => [bp.business_partner_id, bp]));

  // Distribute receivables across BPs proportionally, with some variance
  const bpRecCounts = new Array<number>(config.bpCount).fill(0);
  for (let i = 0; i < config.recCount; i++) {
    bpRecCounts[Math.floor(rng() * config.bpCount)]++;
  }

  let recIdx = 0;
  const baseLateRate = config.latePaymentRate;

  // Invoice amount log-normal params to target mean invoice
  // E[logNormal(mu, sigma)] = exp(mu + sigma^2/2)
  // Choose sigma=1.2, then mu = ln(mean) - sigma^2/2
  const invoiceSigma = 1.2;
  const invoiceMu = Math.log(config.meanInvoiceAmount) - (invoiceSigma * invoiceSigma) / 2;

  for (let bpI = 0; bpI < config.bpCount; bpI++) {
    const bp = businessPartners[bpI];
    const count = bpRecCounts[bpI];
    if (count === 0) continue;

    // Risk multiplier for late payment probability
    const riskMult = bp.risk_segment === 'HIGH' ? 2.5 : bp.risk_segment === 'MEDIUM' ? 1.3 : 0.4;
    // History multiplier (capped)
    const histMult = 1 + Math.min(bp.historical_late_payments / 5, 1.5) * 0.5;

    for (let j = 0; j < count; j++) {
      const invoiceDate = randomDate(rng, config.startDate, config.endDate);
      const terms = paymentTermOptions[Math.floor(rng() * paymentTermOptions.length)];
      const dueDate = addDays(invoiceDate, terms);

      // Log-normal invoice amount
      const amount = Math.max(100, Math.round(logNormal(rng, invoiceMu, invoiceSigma) * 100) / 100);

      // Terms and amount multipliers
      const termsMult = terms >= 60 ? 1.4 : 1.0;
      const amountMult = amount > 10000 ? 1.2 : 1.0;

      // Combined late payment probability with noise
      const lateProbRaw = baseLateRate * riskMult * histMult * termsMult * amountMult;
      const noise = (rng() - 0.5) * 0.15;
      const lateProb = Math.max(0, Math.min(1, lateProbRaw + noise));
      const isLate = rng() < lateProb;

      // Determine clearing status
      let clearingStatus: 'OPEN' | 'CLEARED' | 'PARTIAL';
      let openAmount: number;

      if (isLate) {
        // Late payers: more likely to still be open or partial
        const r = rng();
        if (r < 0.50) { clearingStatus = 'OPEN'; openAmount = amount; }
        else if (r < 0.75) { clearingStatus = 'PARTIAL'; openAmount = Math.round(amount * (0.1 + rng() * 0.8) * 100) / 100; }
        else { clearingStatus = 'CLEARED'; openAmount = 0; }
      } else {
        const r = rng();
        if (r < 0.80) { clearingStatus = 'CLEARED'; openAmount = 0; }
        else if (r < 0.92) { clearingStatus = 'PARTIAL'; openAmount = Math.round(amount * (0.05 + rng() * 0.3) * 100) / 100; }
        else { clearingStatus = 'OPEN'; openAmount = amount; }
      }

      receivables.push({
        receivable_id: `REC${zeroPad(recIdx + 1, 10)}`,
        business_partner_id: bp.business_partner_id,
        invoice_date: invoiceDate,
        due_date: dueDate,
        invoice_amount: amount,
        currency: config.currency,
        payment_terms_days: terms,
        company_code: bp.company_code,
        document_type: documentTypes[Math.floor(rng() * documentTypes.length)],
        open_amount: openAmount,
        clearing_status: clearingStatus,
        late_payment_flag: isLate,
      });
      recIdx++;
    }
  }

  // ── Phase 3: Payments ─────────────────────────────────────────────────────
  const payments: Payment[] = [];
  let pmtIdx = 0;
  for (const rec of receivables) {
    if (rec.clearing_status === 'OPEN') continue;

    const payAmount = rec.clearing_status === 'CLEARED'
      ? rec.invoice_amount
      : rec.invoice_amount - rec.open_amount;

    // Payment date: for late payments, often after due date
    const bp = bpMap.get(rec.business_partner_id)!;
    const daysAfterInvoice = rec.late_payment_flag
      ? rec.payment_terms_days + Math.floor(rng() * 60) + 1
      : Math.floor(rng() * rec.payment_terms_days * 0.9) + 5;

    const payDate = addDays(rec.invoice_date, daysAfterInvoice);

    payments.push({
      payment_id: `PMT${zeroPad(pmtIdx + 1, 10)}`,
      receivable_id: rec.receivable_id,
      payment_date: payDate,
      payment_amount: Math.round(payAmount * 100) / 100,
      payment_method: bp.ZZ_PAYMENT_CHANNEL === 'EDI' ? 'BANK_TRANSFER' : sampleWeighted(rng, paymentMethods, [0.50, 0.15, 0.20, 0.10, 0.05]),
      clearing_document: `CLR${zeroPad(pmtIdx + 1, 10)}`,
    });
    pmtIdx++;
  }

  // ── Phase 4: Dunning ──────────────────────────────────────────────────────
  const dunningRecords: DunningRecord[] = [];
  let dunnIdx = 0;
  if (config.includeDunning) {
    for (const rec of receivables) {
      if (rec.clearing_status !== 'OPEN') continue;
      const daysPastDue = daysBetween(rec.due_date, now);
      if (daysPastDue < 30) continue;

      const maxLevel = daysPastDue > 90 ? 3 : daysPastDue > 60 ? 2 : 1;
      for (let lvl = 1; lvl <= maxLevel; lvl++) {
        const dunnDate = addDays(rec.due_date, lvl * 30);
        dunningRecords.push({
          dunning_id: `DUN${zeroPad(dunnIdx + 1, 10)}`,
          receivable_id: rec.receivable_id,
          dunning_date: dunnDate,
          dunning_level: lvl as 1 | 2 | 3,
          dunning_amount: Math.round(rec.invoice_amount * 100) / 100,
        });
        dunnIdx++;
      }
    }
  }

  // ── Phase 5: Disputes ─────────────────────────────────────────────────────
  const disputes: Dispute[] = [];
  let dispIdx = 0;
  if (config.includeDisputes) {
    const eligibleRecs = receivables.filter(r => r.clearing_status !== 'CLEARED');
    const targetDisputeCount = Math.round(config.disputeRate * receivables.length);
    const shuffled = [...eligibleRecs].sort(() => rng() - 0.5);
    const disputeSet = shuffled.slice(0, Math.min(targetDisputeCount, shuffled.length));

    for (const rec of disputeSet) {
      const openDate = addDays(rec.invoice_date, Math.floor(rng() * 30) + 5);
      const isResolved = rng() > 0.4;
      const resDate = isResolved ? addDays(openDate, Math.floor(rng() * 60) + 10) : null;

      disputes.push({
        dispute_id: `DIS${zeroPad(dispIdx + 1, 10)}`,
        receivable_id: rec.receivable_id,
        dispute_open_date: openDate,
        dispute_reason: disputeReasons[Math.floor(rng() * disputeReasons.length)],
        dispute_amount: Math.round(rec.invoice_amount * (0.1 + rng() * 0.9) * 100) / 100,
        dispute_status: isResolved ? (rng() > 0.3 ? 'RESOLVED' : 'WITHDRAWN') : 'OPEN',
        resolution_date: resDate,
      });
      dispIdx++;
    }
  }

  // ── Phase 6: Collection History (L2+) ─────────────────────────────────────
  const collectionHistory: CollectionHistoryRecord[] = [];
  let colIdx = 0;
  if (config.includeCollectionHistory) {
    const highRiskBPs = businessPartners.filter(bp => bp.risk_segment === 'HIGH');
    for (const bp of highRiskBPs) {
      const contactCount = 1 + Math.floor(rng() * 5);
      for (let c = 0; c < contactCount; c++) {
        const contactDate = randomDate(rng, config.startDate, now);
        const promiseToPay = rng() > 0.5;
        collectionHistory.push({
          collection_history_id: `COL${zeroPad(colIdx + 1, 10)}`,
          business_partner_id: bp.business_partner_id,
          contact_date: contactDate,
          contact_type: sampleWeighted(rng, contactTypes, [0.40, 0.35, 0.15, 0.10]),
          promise_to_pay: promiseToPay,
          promise_amount: promiseToPay ? Math.round(100 + rng() * 50000) : null,
          collector_team: collectorTeams[Math.floor(rng() * collectorTeams.length)],
        });
        colIdx++;
      }
    }
  }

  // ── Phase 7: Compute Stats ────────────────────────────────────────────────
  const lateCount  = receivables.filter(r => r.late_payment_flag).length;
  const disputeCount = disputes.length;
  const actualLateRate = receivables.length > 0 ? lateCount / receivables.length : 0;
  const actualDisputeRate = receivables.length > 0 ? disputeCount / receivables.length : 0;

  const countryDist: Record<string, number> = {};
  for (const bp of businessPartners) {
    countryDist[bp.country] = (countryDist[bp.country] ?? 0) + 1;
  }
  const totalBP = businessPartners.length;
  Object.keys(countryDist).forEach(k => { countryDist[k] = countryDist[k] / totalBP; });

  const riskDist: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  for (const bp of businessPartners) riskDist[bp.risk_segment]++;
  Object.keys(riskDist).forEach(k => { riskDist[k] = riskDist[k] / totalBP; });

  const amounts = receivables.map(r => r.invoice_amount).sort((a, b) => a - b);
  const avgAmount = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
  const medianAmount = amounts.length > 0 ? amounts[Math.floor(amounts.length / 2)] : 0;
  const totalValue = amounts.reduce((a, b) => a + b, 0);

  const stats: DatasetStats = {
    totalBP: businessPartners.length,
    totalReceivables: receivables.length,
    totalPayments: payments.length,
    totalDunning: dunningRecords.length,
    totalDisputes: disputes.length,
    totalCollectionHistory: collectionHistory.length,
    actualLatePaymentRate: actualLateRate,
    actualDisputeRate: actualDisputeRate,
    countryDistribution: countryDist,
    riskDistribution: riskDist,
    avgInvoiceAmount: Math.round(avgAmount * 100) / 100,
    medianInvoiceAmount: Math.round(medianAmount * 100) / 100,
    totalInvoiceValue: Math.round(totalValue * 100) / 100,
  };

  return {
    businessPartners,
    receivables,
    payments,
    dunningRecords,
    disputes,
    collectionHistory,
    generatedAt: new Date().toISOString(),
    config,
    stats,
  };
}

// ─── Feature Matrix Builder ───────────────────────────────────────────────────
export function buildFeatureMatrix(dataset: GeneratedDataset): { features: number[][]; labels: number[]; featureNames: string[] } {
  const bpMap = new Map(dataset.businessPartners.map(bp => [bp.business_partner_id, bp]));
  const today = new Date().toISOString().split('T')[0];

  const features: number[][] = [];
  const labels: number[] = [];

  for (const rec of dataset.receivables) {
    const bp = bpMap.get(rec.business_partner_id);
    if (!bp) continue;

    const riskCode = bp.risk_segment === 'HIGH' ? 2 : bp.risk_segment === 'MEDIUM' ? 1 : 0;
    const creditCode = ['A', 'B', 'C', 'D'].indexOf(bp.credit_segment);
    const countryCode = ['DE', 'US', 'FR'].indexOf(bp.country);
    const daysOutstanding = rec.clearing_status === 'OPEN'
      ? Math.max(0, Math.floor((new Date(today).getTime() - new Date(rec.due_date).getTime()) / 86400000))
      : 0;

    features.push([
      bp.historical_late_payments,
      daysOutstanding,
      riskCode,
      rec.invoice_amount,
      rec.payment_terms_days,
      creditCode < 0 ? 1 : creditCode,
      countryCode < 0 ? 3 : countryCode,
      Math.log(Math.max(1, bp.annual_revenue)),
    ]);
    labels.push(rec.late_payment_flag ? 1 : 0);
  }

  return {
    features,
    labels,
    featureNames: [
      'prior_late_count',
      'days_outstanding',
      'risk_segment',
      'invoice_amount',
      'payment_terms',
      'credit_segment',
      'country_code',
      'annual_revenue_log',
    ],
  };
}
