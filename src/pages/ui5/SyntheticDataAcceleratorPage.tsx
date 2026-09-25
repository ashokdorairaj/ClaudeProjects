// @ts-nocheck
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ThemeProvider,
  ShellBar,
  Avatar,
  ResponsivePopover,
  List,
  ListItemStandard,
  DynamicPage,
  DynamicPageTitle,
  DynamicPageHeader,
  Toolbar,
  Button,
  Title,
  Text,
  FlexBox,
  ObjectStatus,
  Tag,
  ProgressIndicator,
  MessageStrip,
  Toast,
  FilterBar,
  FilterGroupItem,
  Select,
  Option,
  AnalyticalTable,
  Icon,
  Breadcrumbs,
  BreadcrumbsItem,
  SideNavigation,
  SideNavigationItem,
  Wizard,
  WizardStep,
  Form,
  FormGroup,
  FormItem,
  Label,
  Input,
  Switch,
  BusyIndicator,
  Table,
  TableHeaderRow,
  TableHeaderCell,
  TableRow,
  TableCell,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-react/styles.css';
import '@ui5/webcomponents-icons/dist/AllIcons.js';
import '@ui5/webcomponents-fiori/dist/illustrations/AllIllustrations.js';

// ─── Types ─────────────────────────────────────────────────────────────────────
type View = 'overview' | 'packs' | 'packDetail' | 'dataReadiness' | 'experiments' | 'evaluation' | 'validation' | 'learnings' | 'packVersions';

// ─── Module-scope constants ────────────────────────────────────────────────────
const NAV_LABELS: Record<string, string> = {
  overview: 'Overview',
  packs: 'Experiment Packs',
  packDetail: 'Collections Pack',
  dataReadiness: 'Data Readiness',
  experiments: 'Experiments',
  evaluation: 'Evaluation',
  validation: 'Validation',
  learnings: 'Reusable Learnings',
  packVersions: 'Pack Versions',
};

const PACKS = [
  { id: 1, name: 'Collections & Disputes', domain: 'Accounts Receivable / Collections', sapMapping: 'FSCM + S/4 AR', objects: 'Business Partner → Receivable → Payment / Dunning / Dispute', objectCount: 6, levels: 'L1–L4', version: 'v1.0', status: 'Validated', engagements: 1 },
  { id: 2, name: 'Procurement Experiment Pack', domain: 'Procurement', sapMapping: 'Ariba / Procurement', objects: 'Supplier → PO → GR → Invoice → Payment', objectCount: 8, levels: 'L1–L2', version: 'v0.3', status: 'Draft', engagements: 0 },
];

const CONSUMPTION_SCHEMA = [
  { name: 'Business Partner', fieldName: 'business_partner', type: 'String(10)', pk: true, fk: false, required: true, source: 'BP_MASTER', canExtend: false, description: 'Customer identifier for receivables management' },
  { name: 'Receivable', fieldName: 'receivable_id', type: 'String(10)', pk: true, fk: false, required: true, source: 'FI_DOCUMENT', canExtend: true, description: 'Open receivable (invoice) document' },
  { name: 'Payment', fieldName: 'payment_id', type: 'String(10)', pk: true, fk: true, required: false, source: 'FI_PAYMENT', canExtend: false, description: 'Incoming payment clearing document' },
  { name: 'Dunning Notice', fieldName: 'dunning_id', type: 'String(10)', pk: true, fk: true, required: false, source: 'DUNNING_HDR', canExtend: false, description: 'Automated dunning notice sent to customer' },
  { name: 'Dispute Case', fieldName: 'dispute_id', type: 'String(32)', pk: true, fk: true, required: false, source: 'DISPUTE_CASE', canExtend: true, description: 'Customer dispute case for invoice disagreement' },
  { name: 'Collection History', fieldName: 'collection_hist_id', type: 'String(10)', pk: true, fk: true, required: false, source: 'COLL_HISTORY', canExtend: true, description: 'Customer-level collection activity history' },
];

const FIDELITY_LEVELS = [
  { level: 'L1', title: 'SAP Baseline', desc: 'No customer input. Experiment Pack + SAP/domain defaults generate representative baseline data.', statusLabel: 'No Customer Data Required', color: 'var(--sapPositiveColor)' },
  { level: 'L2', title: 'Customer Schema', desc: 'Add Z-tables, custom fields, and customer-specific relationships. No transactional rows required.', statusLabel: 'Schema Metadata Only', color: 'var(--sapInformationColor)' },
  { level: 'L3', title: 'Customer Profile & Scenarios', desc: 'Add volumes, distributions, null rates, correlations, target rates, and customer-approved representative scenarios.', statusLabel: 'Profile + Scenarios', color: 'var(--sapBrandColor)' },
  { level: 'L4', title: 'Approved Customer Sample', desc: 'Approved real customer sample data used for statistical calibration. Requires data governance approval.', statusLabel: 'Approved Sample Required', color: 'var(--sapCriticalColor)' },
];

const REPRESENTATIVE_SCENARIOS = [
  { id: 1, title: 'Scenario A — High-Risk Late Payer', desc: 'High-risk customer, 3 prior late payments, €25K invoice, 60-day terms', expected: 'Likely late', risk: 'High' },
  { id: 2, title: 'Scenario B — Low-Risk On-Time', desc: 'Low-risk long-tenure customer, no prior late payments, €2K invoice, 30-day terms', expected: 'On time', risk: 'Low' },
  { id: 3, title: 'Scenario C — Large Invoice with Prior Dispute', desc: 'Large invoice (€85K), prior dispute history, medium-risk segment', expected: 'Elevated dispute risk', risk: 'Medium' },
];

const QUALITY_CHECKS_BASIC = [
  { check: 'Business Partner to Receivable cardinality (1:N)', state: 'Enforced', pass: true },
  { check: 'Receivable date ≤ Due date', state: 'Enforced', pass: true },
  { check: 'Payment amount ≤ Receivable amount', state: 'Enforced', pass: true },
  { check: 'Dunning only on overdue open items', state: 'Enforced', pass: true },
  { check: 'Dunning date after due date', state: 'Enforced', pass: true },
  { check: 'Dispute case references valid Receivable', state: 'Enforced', pass: true },
  { check: 'Collection History linked to Business Partner', state: 'Enforced', pass: true },
  { check: 'Customer Z-field referential integrity', state: 'Warning only', pass: false },
];

const QUALITY_DIMENSIONS_L1 = [
  { dim: 'Schema Validity', status: 'pass', score: 100, detail: 'All required fields present and typed correctly', critical: false },
  { dim: 'Referential Integrity', status: 'pass', score: 100, detail: 'All FK relationships valid', critical: false },
  { dim: 'Business Rule Validity', status: 'pass', score: 98, detail: '7 of 7 enforced business rules pass. 1 warning: Z-field referential integrity (non-critical)', critical: false },
  { dim: 'Distribution Fidelity', status: 'pass', score: 89, detail: 'SAP/domain default distributions applied — no customer target specified for L1', critical: false },
  { dim: 'Target Fidelity', status: 'pass', score: 91, detail: 'SAP baseline late payment rate within expected domain range (12–22%)', critical: false },
  { dim: 'Relationship Fidelity', status: 'pass', score: 87, detail: 'SAP baseline correlations match domain expectations', critical: false },
];

const QUALITY_DIMENSIONS_L3 = [
  { dim: 'Schema Validity', status: 'pass', score: 100, detail: 'All required fields present including 3 customer extensions', critical: false },
  { dim: 'Referential Integrity', status: 'pass', score: 100, detail: 'All FK relationships valid including Z-table extensions', critical: false },
  { dim: 'Business Rule Validity', status: 'pass', score: 100, detail: 'All 7 enforced business rules pass', critical: false },
  { dim: 'Distribution Fidelity', status: 'pass', score: 94, detail: 'Late payment rate 17.2% — within configured ±5% tolerance of 17%', critical: false },
  { dim: 'Target Fidelity', status: 'pass', score: 96, detail: 'late_payment_flag 17.2% vs requested 17% — within tolerance', critical: false },
  { dim: 'Relationship Fidelity', status: 'pass', score: 91, detail: 'All 4 relationship correlations match expected direction and strength', critical: false },
];

const RELATIONSHIP_FIDELITY = [
  { predictor: 'Prior Late Payments', target: 'Late Payment', expected: 'Strong Positive', observed: 'Strong Positive', status: 'pass' },
  { predictor: 'High Risk Segment', target: 'Late Payment', expected: 'Strong Positive', observed: 'Medium Positive', status: 'review' },
  { predictor: 'Invoice Amount', target: 'Dispute', expected: 'Medium Positive', observed: 'Medium Positive', status: 'pass' },
  { predictor: 'Customer Tenure', target: 'Late Payment', expected: 'Weak Negative', observed: 'Weak Negative', status: 'pass' },
];

const EXPERIMENT_RESULTS = [
  { approach: 'Rules Baseline', type: 'Real', accuracy: '0.74', precision: '0.71', recall: '0.58', f1: '0.64', auc: '0.72', explainability: 'High', complexity: 'Low', time: '<1s' },
  { approach: 'Gradient Boosting (Demo)', type: 'Demo', accuracy: '0.87', precision: '0.84', recall: '0.81', f1: '0.82', auc: '0.89', explainability: 'Medium', complexity: 'Medium', time: '47s' },
  { approach: 'RPT Demo Adapter', type: 'Demo-Adapter', accuracy: '0.82', precision: '0.78', recall: '0.74', f1: '0.76', auc: '0.81', explainability: 'Low', complexity: 'High', time: '12s' },
];

const EXPERIMENT_RUNS = [
  { run: 'Run 001', dataset: 'L1 Baseline', approach: 'Rules Baseline', f1: '0.64', auc: '0.72', status: 'Complete' },
  { run: 'Run 002', dataset: 'L3 Northstar', approach: 'Rules Baseline', f1: '0.68', auc: '0.74', status: 'Complete' },
  { run: 'Run 003', dataset: 'L3 Northstar', approach: 'Gradient Boosting (Demo)', f1: '0.82', auc: '0.89', status: 'Complete' },
  { run: 'Run 004', dataset: 'L3 Northstar', approach: 'RPT Demo Adapter', f1: '0.76', auc: '0.81', status: 'Complete' },
];

const FEATURES = [
  { name: 'Prior late payment count', pct: 34 },
  { name: 'Days outstanding (current)', pct: 28 },
  { name: 'Customer risk segment', pct: 18 },
  { name: 'Invoice amount', pct: 12 },
  { name: 'Payment terms (days)', pct: 8 },
];

const REUSABLE_LEARNINGS_DATA = [
  { id: 1, category: 'Feature', learning: 'Historical late-payment count is consistently predictive of future late payment', evidence: 'Northstar L3 experiment (Run 003)', scope: 'Collections', customerSpecific: false, confidence: 'High', action: 'propose', proposed: false },
  { id: 2, category: 'Model', learning: 'Gradient boosting consistently outperforms rules baseline on L3 experiment data for collections', evidence: 'Northstar L3 experiment (Runs 002–003)', scope: 'Collections', customerSpecific: false, confidence: 'Medium', action: 'propose', proposed: false },
  { id: 3, category: 'Data', learning: 'Collections assistant requires minimum 90-day receivable history for reliable predictions', evidence: 'Northstar L3 experiment', scope: 'Collections', customerSpecific: false, confidence: 'Medium', action: 'propose', proposed: false },
  { id: 4, category: 'Data', learning: 'Northstar payment-channel distribution (60% bank transfer, 30% check, 10% direct debit)', evidence: 'Northstar L3 customer profile', scope: 'Collections', customerSpecific: true, confidence: 'High', action: 'reject', proposed: false },
  { id: 5, category: 'Evaluation', learning: 'Recall matters more than precision for collections prioritization — missing a late payer is more costly than a false positive', evidence: 'Northstar business review', scope: 'Collections', customerSpecific: false, confidence: 'High', action: 'propose', proposed: false },
  { id: 6, category: 'Business Constraint', learning: 'Dunning date must always be after invoice due date — hard constraint for all collections experiments', evidence: 'Collections domain expert review', scope: 'Collections', customerSpecific: false, confidence: 'High', action: 'propose', proposed: false },
];

const GENERATION_STEPS_L1 = [
  'Loading Experiment Pack: Collections & Disputes v1.0',
  'Applying SAP/domain defaults (FSCM + S/4 AR baseline)',
  'Generating 500 Business Partners...',
  'Generating 10,000 Receivables...',
  'Applying payment behavior distributions (SAP defaults)',
  'Running quality checks...',
  '✓ L1 Baseline Dataset ready — 10,000 records generated',
];

const GENERATION_STEPS_L3 = [
  'Loading Experiment Pack: Collections & Disputes v1.0',
  'Applying SAP/domain defaults',
  'Applying Northstar customer schema (3 extensions: ZZ_RISK_CATEGORY, ZZ_PAYMENT_CHANNEL, Z_COLLECTION_HISTORY)',
  'Applying Northstar customer profile (25,000 BPs, 500,000 receivables)',
  'Applying representative scenarios (3 customer-approved scenarios)',
  'Generating Business Partners...',
  'Generating Receivables...',
  'Applying late payment distribution: 17%',
  'Applying dispute distribution: 6.3%',
  'Running quality checks...',
  'Validating relationship fidelity...',
  '✓ L3 Customer Dataset ready — 500,000 records generated',
];

const SYNTHETIC_INVOICES = [
  { id: '5100000001', bp: '0000001001', bpName: 'Northstar Alpha LLC', invDate: '2025-03-15', dueDate: '2025-04-14', amount: '12,450.00', status: 'Open', daysOverdue: 0, dunning: 0 },
  { id: '5100000002', bp: '0000001002', bpName: 'Cascade Partners Inc', invDate: '2025-03-18', dueDate: '2025-04-17', amount: '8,920.50', status: 'Overdue', daysOverdue: 45, dunning: 1 },
  { id: '5100000003', bp: '0000001003', bpName: 'Summit Ridge Co', invDate: '2025-03-20', dueDate: '2025-04-19', amount: '34,100.00', status: 'Paid', daysOverdue: 0, dunning: 0 },
  { id: '5100000004', bp: '0000001004', bpName: 'Valley Industrial Ltd', invDate: '2025-03-22', dueDate: '2025-04-21', amount: '5,780.00', status: 'Overdue', daysOverdue: 78, dunning: 2 },
  { id: '5100000005', bp: '0000001005', bpName: 'Ridge Manufacturing LLC', invDate: '2025-03-25', dueDate: '2025-04-24', amount: '91,200.00', status: 'Open', daysOverdue: 0, dunning: 0 },
  { id: '5100000006', bp: '0000001006', bpName: 'Apex Supply Corp', invDate: '2025-03-28', dueDate: '2025-04-27', amount: '18,600.00', status: 'Dispute', daysOverdue: 32, dunning: 1 },
  { id: '5100000007', bp: '0000001007', bpName: 'Meridian Group Inc', invDate: '2025-04-01', dueDate: '2025-04-30', amount: '3,250.00', status: 'Paid', daysOverdue: 0, dunning: 0 },
  { id: '5100000008', bp: '0000001008', bpName: 'Pinnacle Services Ltd', invDate: '2025-04-03', dueDate: '2025-05-02', amount: '67,400.00', status: 'Overdue', daysOverdue: 18, dunning: 1 },
  { id: '5100000009', bp: '0000001009', bpName: 'Clearwater Trading Co', invDate: '2025-04-05', dueDate: '2025-05-05', amount: '11,930.00', status: 'Open', daysOverdue: 0, dunning: 0 },
  { id: '5100000010', bp: '0000001010', bpName: 'Northstar Beta Corp', invDate: '2025-04-08', dueDate: '2025-05-07', amount: '24,800.00', status: 'Dispute', daysOverdue: 60, dunning: 2 },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
const sp = {
  xs: 'var(--sapSpacingXSmallSize, 0.25rem)',
  s: 'var(--sapSpacingSmallSize, 0.5rem)',
  m: 'var(--sapSpacingMediumSize, 1rem)',
  l: 'var(--sapSpacingLargeSize, 1.5rem)',
  xl: '2rem',
  g: 'var(--sapContent_GridGutter, 1rem)',
};

function statusState(s: string): 'Positive' | 'Negative' | 'Critical' | 'Information' | 'None' {
  switch (s) {
    case 'Active': case 'Complete': case 'Paid': case 'Positive': case 'Validated': return 'Positive';
    case 'Negative': case 'Error': case 'Failed': return 'Negative';
    case 'Beta': case 'Overdue': case 'Dispute': case 'Critical': case 'Domain Review': return 'Critical';
    case 'Draft': case 'In Progress': case 'Information': case 'review': return 'Information';
    default: return 'None';
  }
}

function packStatusState(s: string): 'Positive' | 'Negative' | 'Critical' | 'Information' | 'None' {
  switch (s) {
    case 'Validated': case 'Active': return 'Positive';
    case 'Beta': return 'Information';
    case 'Draft': return 'None';
    default: return 'None';
  }
}

function invoiceState(s: string): 'Positive' | 'Negative' | 'Critical' | 'Information' | 'None' {
  switch (s) {
    case 'Paid': return 'Positive';
    case 'Overdue': return 'Negative';
    case 'Dispute': return 'Critical';
    case 'Open': return 'Information';
    default: return 'None';
  }
}

function learningCategoryColor(cat: string): string {
  switch (cat) {
    case 'Feature': return '5';
    case 'Model': return '3';
    case 'Data': return '8';
    case 'Business Constraint': return '2';
    case 'Evaluation': return '6';
    case 'Process': return '7';
    default: return '1';
  }
}

// ─── KPI Tile ──────────────────────────────────────────────────────────────────
function KpiTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: 'var(--sapTile_Background)',
      borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)',
      boxShadow: 'var(--sapContent_Shadow0)',
      padding: sp.m,
      minWidth: 160,
      flex: 1,
    }}>
      <span style={{ display: 'block', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', fontFamily: 'var(--sapFontFamily)', marginBottom: sp.xs }}>
        {label}
      </span>
      <span style={{ display: 'block', fontSize: 'var(--sapFontHeader2Size)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', fontFamily: 'var(--sapFontFamily)', marginBottom: sp.xs }}>
        {value}
      </span>
      {sub && (
        <span style={{ display: 'block', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapPositiveColor)', fontFamily: 'var(--sapFontFamily)' }}>
          {sub}
        </span>
      )}
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────
function SectionHead({ title }: { title: string }) {
  return (
    <div style={{ paddingTop: sp.l, paddingBottom: sp.s, paddingLeft: 0, paddingRight: 0, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
      <Title level="H4" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>{title}</Title>
    </div>
  );
}

// ─── View: Overview ───────────────────────────────────────────────────────────
function OverviewView({ nav, navToPackTab }: { nav: (v: View) => void; navToPackTab: (tab: string) => void }) {
  const lifecycleSteps = [
    { n: 1, title: 'Define Experiment', sub: 'Business problem + assistant schema', icon: 'target-group', active: false, onClick: () => navToPackTab('definition') },
    { n: 2, title: 'Prepare Data', sub: 'L1–L4 fidelity + scenarios', icon: 'add-document', active: false, onClick: () => navToPackTab('dataReadiness') },
    { n: 3, title: 'Run Approaches', sub: 'Rules / Gradient Boosting / RPT', icon: 'activities', active: true, onClick: () => navToPackTab('experiments') },
    { n: 4, title: 'Compare Results', sub: 'Optimization goal + suggestion', icon: 'chart-bar-basic', active: true, onClick: () => nav('evaluation') },
    { n: 5, title: 'Validate', sub: 'Customer / process validation', icon: 'approvals', active: false, onClick: () => nav('validation') },
    { n: 6, title: 'Capture Learnings', sub: 'Reusable IP for next customer', icon: 'learning-assistant', active: false, onClick: () => nav('learnings') },
  ];
  const flywheelSteps = [
    { n: 1, label: 'Known Assistant' },
    { n: 2, label: 'Experiment Pack' },
    { n: 3, label: 'Add Customer Context', sub: 'Schema → Profile → Scenarios' },
    { n: 4, label: 'Generate Experiment Data' },
    { n: 5, label: 'Test Approaches' },
    { n: 6, label: 'Compare & Evaluate' },
    { n: 7, label: 'Validate with Customer' },
    { n: 8, label: 'Capture Learnings' },
    { n: 9, label: 'Improve Pack' },
  ];

  return (
    <DynamicPage
      style={{ flex: 1, overflow: 'hidden', '--ui5_dynamic_page_background': 'var(--sapObjectHeader_Background)' } as React.CSSProperties}
      headerTitle={
        <DynamicPageTitle style={{ paddingLeft: sp.m }}>
          <Title slot="heading" level="H3" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>
            SAP Enterprise Experiment Accelerator
          </Title>
          <Text slot="subheading" style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)' }}>
            Start an Autonomous Assistant experiment before customer data is ready.
          </Text>
          <Toolbar slot="actionsBar" design="Transparent">
            <Button design="Emphasized" icon="journey-arrive" onClick={() => nav('packs')}>Browse Packs</Button>
            <Button design="Transparent" icon="add-document" onClick={() => navToPackTab('dataReadiness')}>Prepare Data</Button>
          </Toolbar>
        </DynamicPageTitle>
      }
      headerContent={
        <DynamicPageHeader>
          <div style={{ paddingTop: sp.m, paddingBottom: sp.m, paddingLeft: sp.g, paddingRight: sp.g }}>
            <FlexBox wrap="Wrap" style={{ gap: sp.m }}>
              <KpiTile label="Experiment Packs" value="2 Active" />
              <KpiTile label="Current Experiment" value="Late Payment Prediction" />
              <KpiTile label="Data Readiness" value="L3 — Customer Profile" />
              <KpiTile label="Demo Customer" value="Northstar Manufacturing" sub="Fictional Demo Customer" />
            </FlexBox>
          </div>
        </DynamicPageHeader>
      }
    >
      <div style={{ paddingTop: sp.m, paddingBottom: sp.l, paddingLeft: sp.g, paddingRight: sp.g }}>

        {/* Lifecycle */}
        <SectionHead title="Experiment Lifecycle — click any step to navigate" />
        <div style={{ marginTop: sp.m, marginBottom: sp.l }}>
          <FlexBox wrap="Wrap" style={{ gap: sp.s }}>
            {lifecycleSteps.map((s, i) => (
              <React.Fragment key={s.n}>
                <div
                  onClick={s.onClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && s.onClick()}
                  style={{
                    padding: sp.m,
                    background: s.active ? 'var(--sapHighlightBackground, #e8f4fd)' : 'var(--sapTile_Background)',
                    border: s.active ? '2px solid var(--sapBrandColor)' : '1px solid var(--sapList_BorderColor)',
                    borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)',
                    minWidth: 140,
                    flex: 1,
                    cursor: 'pointer',
                    transition: 'box-shadow 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--sapContent_Shadow1, 0 2px 8px rgba(0,0,0,0.15))'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: sp.s, marginBottom: sp.xs }}>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', fontWeight: 'var(--sapFontBoldWeight)' }}>{s.n}</span>
                    <Icon name={s.icon} style={{ width: '1rem', height: '1rem', color: s.active ? 'var(--sapBrandColor)' : 'var(--sapContent_IconColor)' }} />
                  </div>
                  <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: sp.xs }}>{s.title}</span>
                  <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{s.sub}</span>
                </div>
                {i < lifecycleSteps.length - 1 && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Icon name="navigation-right-arrow" style={{ width: '1rem', height: '1rem', color: 'var(--sapContent_IconColor)' }} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </FlexBox>
          <div style={{ marginTop: sp.s, padding: `${sp.s} ${sp.m}`, background: 'var(--sapTile_Background)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', border: '1px solid var(--sapList_BorderColor)' }}>
            <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>
              Current: Collections & Disputes v1.0 · Northstar Manufacturing (Fictional) · L3 Data Ready · 4 Experiment Runs Complete
            </span>
          </div>
        </div>

        {/* Pack Cards */}
        <SectionHead title="Experiment Packs" />
        <div style={{ marginTop: sp.m, marginBottom: sp.l, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.m }}>
          {/* Collections Pack */}
          <div style={{ padding: sp.m, background: 'var(--sapTile_Background)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', boxShadow: 'var(--sapContent_Shadow0)', borderTop: '3px solid var(--sapPositiveColor)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp.s }}>
              <Title level="H5" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>Collections & Disputes</Title>
              <ObjectStatus state="Positive">Validated v1.0</ObjectStatus>
            </div>
            <div style={{ marginBottom: sp.s }}>
              {[['Domain', 'Accounts Receivable / Collections'], ['SAP Mapping', 'FSCM + S/4 AR'], ['Schema Entities', '6'], ['Experiments Run', '4']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: sp.s, paddingTop: sp.xs, paddingBottom: sp.xs, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', minWidth: 110 }}>{k}</span>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{v}</span>
                </div>
              ))}
            </div>
            <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginBottom: sp.m }}>
              Autonomous assistant for collections prioritization and late payment prediction.
            </Text>
            <Button design="Emphasized" onClick={() => navToPackTab('definition')}>Open Pack</Button>
          </div>
          {/* Procurement Pack */}
          <div style={{ padding: sp.m, background: 'var(--sapTile_Background)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', boxShadow: 'var(--sapContent_Shadow0)', borderTop: '3px solid var(--sapNeutralColor, #aaa)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp.s }}>
              <Title level="H5" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>Procurement Experiment Pack</Title>
              <div style={{ display: 'flex', gap: sp.xs, flexDirection: 'column', alignItems: 'flex-end' }}>
                <ObjectStatus state="None">Draft v0.3</ObjectStatus>
                <Tag design="Set2" colorScheme="6">Second domain validation</Tag>
              </div>
            </div>
            <div style={{ marginBottom: sp.s }}>
              {[['Domain', 'Procurement'], ['SAP Mapping', 'Ariba / Procurement'], ['Schema Entities', '8'], ['Experiments Run', '0']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: sp.s, paddingTop: sp.xs, paddingBottom: sp.xs, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', minWidth: 110 }}>{k}</span>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{v}</span>
                </div>
              ))}
            </div>
            <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginBottom: sp.m }}>
              Second domain validation — procurement assistant experiment framework.
            </Text>
            <Button design="Transparent" disabled>In Development</Button>
          </div>
        </div>

        {/* Flywheel */}
        <SectionHead title="Enterprise Flywheel" />
        <div style={{ marginTop: sp.m, padding: sp.m, background: 'var(--sapTile_Background)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', boxShadow: 'var(--sapContent_Shadow0)' }}>
          <div style={{ overflowX: 'auto' }}>
            <FlexBox alignItems="Center" style={{ gap: sp.xs, flexWrap: 'nowrap', minWidth: 'max-content', paddingBottom: sp.s }}>
              {flywheelSteps.map((s, i) => (
                <React.Fragment key={s.n}>
                  <div style={{ textAlign: 'center', minWidth: 90, padding: sp.s, background: 'var(--sapBackgroundColor)', border: '1px solid var(--sapList_BorderColor)', borderRadius: '0.5rem' }}>
                    <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapBrandColor)', fontWeight: 'var(--sapFontBoldWeight)', marginBottom: 2 }}>{s.n}</span>
                    <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)', fontWeight: 'var(--sapFontBoldWeight)' }}>{s.label}</span>
                    {s.sub && <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: '0.7rem', color: 'var(--sapContent_LabelColor)', marginTop: 2 }}>{s.sub}</span>}
                  </div>
                  {i < flywheelSteps.length - 1 && (
                    <Icon name="navigation-right-arrow" style={{ width: '0.875rem', height: '0.875rem', color: 'var(--sapBrandColor)', flexShrink: 0 }} />
                  )}
                </React.Fragment>
              ))}
            </FlexBox>
          </div>
          <div style={{ marginTop: sp.m, paddingTop: sp.m, borderTop: '1px solid var(--sapList_BorderColor)', textAlign: 'center' }}>
            <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapBrandColor)' }}>
              Every experiment makes the next one smarter and faster.
            </span>
            <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', marginTop: sp.xs }}>
              Next customer starts with Collections & Disputes v1.1 — further ahead.
            </span>
          </div>
        </div>

      </div>
    </DynamicPage>
  );
}

// ─── View: Experiment Packs Library ───────────────────────────────────────────
function PacksView({ nav }: { nav: (v: View) => void }) {
  const [domain, setDomain] = useState('All');
  const [status, setStatus] = useState('All');
  const [localPacks, setLocalPacks] = useState(PACKS.map(p => ({ ...p })));
  const [showCopyForm, setShowCopyForm] = useState(false);
  const [copyName, setCopyName] = useState('');
  const [copyFromId, setCopyFromId] = useState(1);

  const filtered = useMemo(() => {
    let rows = [...localPacks];
    if (domain !== 'All') rows = rows.filter(p => p.domain === domain);
    if (status !== 'All') rows = rows.filter(p => p.status === status);
    return rows;
  }, [domain, status, localPacks]);

  const handleCopyPack = useCallback(() => {
    const source = localPacks.find(p => p.id === copyFromId);
    if (!source || !copyName.trim()) return;
    const newPack = { ...source, id: Date.now(), name: copyName.trim(), version: 'v0.1', status: 'Draft', engagements: 0 };
    setLocalPacks(prev => [...prev, newPack]);
    setShowCopyForm(false);
    setCopyName('');
  }, [localPacks, copyFromId, copyName]);

  const columns = useMemo(() => [
    { Header: 'Pack Name', accessor: 'name', width: 220 },
    { Header: 'Domain', accessor: 'domain', width: 180 },
    { Header: 'SAP Mapping', accessor: 'sapMapping', width: 150 },
    { Header: 'Entities', accessor: 'objectCount', width: 80 },
    { Header: 'Levels', accessor: 'levels', width: 80 },
    { Header: 'Version', accessor: 'version', width: 70 },
    {
      Header: 'Status',
      accessor: 'status',
      width: 110,
      Cell: ({ value }) => <ObjectStatus state={packStatusState(value)}>{value}</ObjectStatus>,
    },
    {
      Header: 'Action',
      accessor: 'id',
      width: 130,
      Cell: ({ row }) => {
        const isValidated = row.original.status === 'Validated';
        return isValidated ? (
          <Button design="Emphasized" onClick={() => nav('packDetail')}>Open Pack</Button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: sp.xs }}>
            <Icon name="locked" style={{ width: '0.875rem', height: '0.875rem', color: 'var(--sapContent_LabelColor)' }} />
            <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>Draft</span>
          </div>
        );
      },
    },
  ], [nav]);

  return (
    <DynamicPage
      style={{ flex: 1, overflow: 'hidden', '--ui5_dynamic_page_background': 'var(--sapObjectHeader_Background)' } as React.CSSProperties}
      headerTitle={
        <DynamicPageTitle style={{ paddingLeft: sp.m }}>
          <Title slot="heading" level="H3" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>Experiment Packs</Title>
          <Text slot="subheading" style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)' }}>
            Each pack defines the business problem, consumption schema, experiment targets, and generation rules for a known Autonomous Assistant.
          </Text>
          <Toolbar slot="actionsBar" design="Transparent">
            <Button design="Transparent" icon="copy" onClick={() => { setCopyName('Collections & Disputes — Copy'); setCopyFromId(1); setShowCopyForm(!showCopyForm); }}>Copy Pack</Button>
          </Toolbar>
        </DynamicPageTitle>
      }
      headerContent={
        <DynamicPageHeader>
          <div style={{ paddingTop: sp.m, paddingBottom: sp.m, paddingLeft: sp.g, paddingRight: sp.g }}>
            <FilterBar hideToolbar>
              <FilterGroupItem label="Domain" filterKey="domain">
                <Select onChange={(e) => setDomain(e.detail.selectedOption.textContent || 'All')}>
                  <Option>All</Option>
                  <Option>Accounts Receivable / Collections</Option>
                  <Option>Procurement</Option>
                </Select>
              </FilterGroupItem>
              <FilterGroupItem label="Status" filterKey="status">
                <Select onChange={(e) => setStatus(e.detail.selectedOption.textContent || 'All')}>
                  <Option>All</Option>
                  <Option>Validated</Option>
                  <Option>Draft</Option>
                </Select>
              </FilterGroupItem>
            </FilterBar>
          </div>
        </DynamicPageHeader>
      }
    >
      <div style={{ paddingTop: sp.m, paddingBottom: sp.l, paddingLeft: sp.g, paddingRight: sp.g }}>
        {showCopyForm && (
          <div style={{ marginBottom: sp.m, padding: sp.m, background: 'var(--sapTile_Background)', border: '1px solid var(--sapBrandColor)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)' }}>
            <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: sp.s }}>Copy Pack — Create New Variant</span>
            <div style={{ display: 'flex', gap: sp.m, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <Label showColon>New Pack Name</Label>
                <Input value={copyName} onInput={(e) => setCopyName(e.target.value)} style={{ display: 'block', marginTop: sp.xs, minWidth: 300 }} />
              </div>
              <div>
                <Label showColon>Copy From</Label>
                <Select style={{ display: 'block', marginTop: sp.xs }} onChange={(e) => setCopyFromId(Number(e.detail.selectedOption.getAttribute('data-id')))}>
                  {localPacks.filter(p => p.status === 'Validated').map(p => (
                    <Option key={p.id} data-id={String(p.id)} selected={p.id === copyFromId}>{p.name} {p.version}</Option>
                  ))}
                </Select>
              </div>
              <Button design="Emphasized" onClick={handleCopyPack}>Create Copy</Button>
              <Button design="Transparent" onClick={() => setShowCopyForm(false)}>Cancel</Button>
            </div>
            <MessageStrip design="Information" hideCloseButton style={{ marginTop: sp.s }}>
              Copied packs start as Draft. Open them from the list once validated.
            </MessageStrip>
          </div>
        )}
        <div className="ui5-content-density-compact">
          <AnalyticalTable
            data={filtered}
            columns={columns}
            visibleRows={8}
            scaleWidthMode="Smart"
            minRows={2}
            noDataText="No packs match the selected filters"
          />
        </div>
      </div>
    </DynamicPage>
  );
}

// ─── View: Pack Detail (Tabbed) ────────────────────────────────────────────────
function PackDetailView({ nav, initialTab = 'definition' }: { nav: (v: View) => void; initialTab?: string }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

  // Sync when initialTab prop changes (deep-link navigation)
  useEffect(() => { setActiveTab(initialTab); }, [initialTab]);

  const entityDetail = CONSUMPTION_SCHEMA.find(e => e.name === selectedEntity);

  const TABS = [
    { key: 'definition', label: 'Definition', icon: 'document-text' },
    { key: 'schema', label: 'Schema', icon: 'hierarchy' },
    { key: 'dataReadiness', label: 'Data Readiness', icon: 'add-document' },
    { key: 'experiments', label: 'Experiments', icon: 'activities' },
    { key: 'results', label: 'Results', icon: 'chart-bar-basic' },
  ];

  return (
    <DynamicPage
      style={{ flex: 1, overflow: 'hidden', '--ui5_dynamic_page_background': 'var(--sapObjectHeader_Background)' } as React.CSSProperties}
      headerTitle={
        <DynamicPageTitle style={{ paddingLeft: sp.m }}>
          <div slot="breadcrumbs">
            <Breadcrumbs>
              <BreadcrumbsItem onClick={() => nav('packs')}>Experiment Packs</BreadcrumbsItem>
              <BreadcrumbsItem>Collections & Disputes</BreadcrumbsItem>
            </Breadcrumbs>
          </div>
          <Title slot="heading" level="H3" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>Collections & Disputes</Title>
          <div slot="subheading" style={{ display: 'flex', alignItems: 'center', gap: sp.s }}>
            <ObjectStatus state="Positive">Validated</ObjectStatus>
            <Text style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)' }}>
              Accounts Receivable / Collections · v1.0 · FSCM + S/4 AR
            </Text>
          </div>
          <Toolbar slot="actionsBar" design="Transparent">
            <Button design="Transparent" icon="copy" onClick={() => nav('packs')}>Copy Pack</Button>
            <Button design="Transparent" icon="download">Export</Button>
          </Toolbar>
        </DynamicPageTitle>
      }
      headerContent={
        <DynamicPageHeader>
          <div style={{ paddingTop: sp.m, paddingBottom: sp.m, paddingLeft: sp.g, paddingRight: sp.g }}>
            <FlexBox wrap="Wrap" style={{ gap: sp.m }}>
              <KpiTile label="Schema Entities" value="6" />
              <KpiTile label="Fidelity Levels" value="L1–L4" />
              <KpiTile label="Quality Checks" value="8" />
              <KpiTile label="SAP Mapping" value="FSCM + S/4 AR" />
            </FlexBox>
          </div>
        </DynamicPageHeader>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '2px solid var(--sapList_BorderColor)', background: 'var(--sapObjectHeader_Background)', paddingLeft: sp.g, gap: 0, flexShrink: 0 }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: `${sp.s} ${sp.m}`,
                background: 'none',
                border: 'none',
                borderBottom: activeTab === t.key ? `3px solid var(--sapBrandColor)` : '3px solid transparent',
                cursor: 'pointer',
                fontFamily: 'var(--sapFontFamily)',
                fontSize: 'var(--sapFontSize)',
                fontWeight: activeTab === t.key ? 'var(--sapFontBoldWeight)' : 'normal',
                color: activeTab === t.key ? 'var(--sapBrandColor)' : 'var(--sapTextColor)',
                whiteSpace: 'nowrap',
                marginBottom: -2,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.m} ${sp.g} ${sp.l}` }}>

          {/* ── TAB: DEFINITION ── */}
          {activeTab === 'definition' && (
            <div>
              <SectionHead title="Business Problem & Experiment Specification" />
              <div style={{ marginTop: sp.m, marginBottom: sp.l, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.m }}>
                <div style={{ padding: sp.m, background: 'var(--sapTile_Background)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', boxShadow: 'var(--sapContent_Shadow0)' }}>
                  <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: sp.s }}>Experiment Definition</span>
                  {[
                    ['Assistant', 'Collections Prioritization & Late Payment Prediction'],
                    ['Problem Type', 'Binary Classification'],
                    ['Target Variable', 'late_payment_flag'],
                    ['Primary Metrics', 'Recall, F1, AUC-ROC'],
                    ['Business Metric', 'Collections prioritization effectiveness'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: sp.s, paddingTop: sp.xs, paddingBottom: sp.xs, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                      <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', minWidth: 130 }}>{k}</span>
                      <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: sp.m, background: 'var(--sapTile_Background)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', boxShadow: 'var(--sapContent_Shadow0)' }}>
                  <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: sp.s }}>Candidate Features & Approaches</span>
                  <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', marginBottom: sp.xs }}>Candidate Features</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: sp.xs, marginBottom: sp.m }}>
                    {['invoice_amount','payment_terms','risk_segment','customer_tenure','historical_late_payment_count','historical_dispute_count'].map(f => (
                      <Tag key={f} design="Set2" colorScheme="5">{f}</Tag>
                    ))}
                  </div>
                  <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', marginBottom: sp.xs }}>Approaches to Test</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: sp.xs }}>
                    {['Rules Baseline', 'Gradient Boosting', 'RPT Demo Adapter'].map(a => (
                      <Tag key={a} design="Set2" colorScheme="3">{a}</Tag>
                    ))}
                  </div>
                </div>
              </div>

              <SectionHead title="Schema Lineage" />
              <div style={{ marginTop: sp.m, marginBottom: sp.m }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: sp.s, padding: sp.m, background: 'var(--sapTile_Background)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', boxShadow: 'var(--sapContent_Shadow0)', overflowX: 'auto', flexWrap: 'nowrap' }}>
                  {['FSCM + S/4 AR', 'SAP Domain Model / Semantic Assets', 'Collections Consumption Schema', 'Customer Delta (Z-fields)'].map((label, i, arr) => (
                    <React.Fragment key={label}>
                      <div style={{ padding: `${sp.s} ${sp.m}`, background: 'var(--sapBackgroundColor)', border: '1px solid var(--sapList_BorderColor)', borderRadius: '0.5rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)', fontWeight: i === 2 ? 'var(--sapFontBoldWeight)' : 'normal' }}>{label}</span>
                      </div>
                      {i < arr.length - 1 && <Icon name="navigation-right-arrow" style={{ width: '1rem', height: '1rem', color: 'var(--sapBrandColor)', flexShrink: 0 }} />}
                    </React.Fragment>
                  ))}
                </div>
                <div style={{ marginTop: sp.s }}>
                  <MessageStrip design="Information" hideCloseButton>
                    The consumption schema contains only the data required by this assistant — not the full S/4/FSCM schema. Customer-specific schema (Z-fields) is added separately at L2.
                  </MessageStrip>
                </div>
              </div>

              <SectionHead title="Fidelity Levels" />
              <div style={{ marginTop: sp.m, marginBottom: sp.s, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.m }}>
                {FIDELITY_LEVELS.map(fl => (
                  <div key={fl.level} style={{ borderLeft: `4px solid ${fl.color}`, borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', overflow: 'hidden', background: 'var(--sapTile_Background)', boxShadow: 'var(--sapContent_Shadow0)', padding: sp.m }}>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontLargeSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', display: 'block', marginBottom: sp.xs }}>{fl.level} — {fl.title}</span>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginBottom: sp.xs }}>{fl.desc}</span>
                    <Tag design="Set2" colorScheme="1">{fl.statusLabel}</Tag>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: sp.l }}>
                <MessageStrip design="Information" hideCloseButton>Levels 1–4 describe data fidelity. Customer / Process Validation is a separate stage after L4 — not a level.</MessageStrip>
              </div>

              <SectionHead title="Quality Checks" />
              <div style={{ marginTop: sp.m, marginBottom: sp.l, padding: sp.m, background: 'var(--sapTile_Background)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', boxShadow: 'var(--sapContent_Shadow0)' }}>
                {QUALITY_CHECKS_BASIC.map((qc, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: sp.m, paddingTop: sp.s, paddingBottom: sp.s, borderBottom: i < QUALITY_CHECKS_BASIC.length - 1 ? '1px solid var(--sapList_BorderColor)' : 'none' }}>
                    <Icon name={qc.pass ? 'accept' : 'alert'} style={{ width: '1rem', height: '1rem', color: qc.pass ? 'var(--sapPositiveColor)' : 'var(--sapCriticalColor)', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', color: 'var(--sapTextColor)' }}>{qc.check}</span>
                    <Tag design={qc.pass ? 'Positive' : 'Critical'}>{qc.state}</Tag>
                  </div>
                ))}
              </div>

              <SectionHead title="Pack Validation Status" />
              <div style={{ marginTop: sp.m, marginBottom: sp.l, padding: sp.m, background: 'var(--sapTile_Background)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', boxShadow: 'var(--sapContent_Shadow0)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp.m }}>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>Overall Status</span>
                  <ObjectStatus state="Critical">Validation In Progress</ObjectStatus>
                </div>
                {[
                  { label: 'Schema validated', detail: 'Validated by SAP domain expert', pass: true },
                  { label: 'Constraints validated', detail: 'All 7 constraints validated', pass: true },
                  { label: 'Generation defaults validated', detail: 'Validated', pass: true },
                  { label: 'Customer / process validation', detail: 'Pending — Northstar Manufacturing', pass: false },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: sp.m, paddingTop: sp.s, paddingBottom: sp.s, borderBottom: i < 3 ? '1px solid var(--sapList_BorderColor)' : 'none' }}>
                    <Icon name={item.pass ? 'accept' : 'pending'} style={{ width: '1rem', height: '1rem', color: item.pass ? 'var(--sapPositiveColor)' : 'var(--sapCriticalColor)', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', color: 'var(--sapTextColor)', flex: 1 }}>{item.label}</span>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{item.detail}</span>
                  </div>
                ))}
              </div>

              <SectionHead title="Pack Metadata" />
              <div style={{ marginTop: sp.m, marginBottom: sp.l, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.m }}>
                {[['Pack Owner','Autonomous Assistant Product Manager'],['Domain Review','Collections Domain Expert'],['Version','v1.0'],['Status','Validated'],['Last Validated','Q3 2025 (demo)'],['SAP Mapping','FSCM + S/4 Accounts Receivable']].map(([k, v]) => (
                  <div key={k} style={{ padding: sp.s, background: 'var(--sapTile_Background)', borderRadius: '0.5rem', boxShadow: 'var(--sapContent_Shadow0)' }}>
                    <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{k}</span>
                    <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', color: 'var(--sapTextColor)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB: SCHEMA ── */}
          {activeTab === 'schema' && (
            <div>
              <SectionHead title="Assistant-Specific Consumption Schema" />
              <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginTop: sp.s, marginBottom: sp.m }}>
                This is the curated subset of SAP business data required by the Collections assistant — not the full S/4/FSCM schema. Click any entity to inspect its fields.
              </Text>
              <div style={{ padding: sp.m, background: 'var(--sapTile_Background)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', boxShadow: 'var(--sapContent_Shadow0)', marginBottom: sp.s }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: sp.s }}>
                  {['Business Partner', 'Receivable'].map((eName, idx) => (
                    <React.Fragment key={eName}>
                      <div onClick={() => setSelectedEntity(selectedEntity === eName ? null : eName)} style={{ padding: `${sp.s} ${sp.m}`, background: selectedEntity === eName ? 'var(--sapHighlightBackground, #e8f4fd)' : 'var(--sapBackgroundColor)', border: `2px solid ${selectedEntity === eName ? 'var(--sapBrandColor)' : 'var(--sapList_BorderColor)'}`, borderRadius: '0.5rem', cursor: 'pointer', textAlign: 'center', minWidth: 200 }}>
                        <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>{eName}</span>
                        <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: '0.7rem', color: 'var(--sapContent_LabelColor)' }}>{idx === 0 ? 'BP_MASTER (illustrative)' : 'FI_DOCUMENT (illustrative)'}</span>
                      </div>
                      <Icon name="navigation-down-arrow" style={{ width: '1rem', height: '1rem', color: 'var(--sapContent_IconColor)' }} />
                    </React.Fragment>
                  ))}
                  <div style={{ display: 'flex', gap: sp.l, alignItems: 'flex-start' }}>
                    {['Payment', 'Dunning Notice', 'Dispute Case'].map(eName => (
                      <div key={eName} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: sp.xs }}>
                        <div onClick={() => setSelectedEntity(selectedEntity === eName ? null : eName)} style={{ padding: `${sp.s} ${sp.m}`, background: selectedEntity === eName ? 'var(--sapHighlightBackground, #e8f4fd)' : 'var(--sapBackgroundColor)', border: `2px solid ${selectedEntity === eName ? 'var(--sapBrandColor)' : 'var(--sapList_BorderColor)'}`, borderRadius: '0.5rem', cursor: 'pointer', textAlign: 'center', minWidth: 130 }}>
                          <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>{eName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: sp.xs }}>
                    <div onClick={() => setSelectedEntity(selectedEntity === 'Collection History' ? null : 'Collection History')} style={{ padding: `${sp.s} ${sp.m}`, background: selectedEntity === 'Collection History' ? 'var(--sapHighlightBackground, #e8f4fd)' : 'var(--sapBackgroundColor)', border: `2px dashed ${selectedEntity === 'Collection History' ? 'var(--sapBrandColor)' : 'var(--sapList_BorderColor)'}`, borderRadius: '0.5rem', cursor: 'pointer', textAlign: 'center' }}>
                      <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>Collection History</span>
                      <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: '0.7rem', color: 'var(--sapContent_LabelColor)' }}>Customer-level (dashed = FK to BP)</span>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: sp.s, textAlign: 'center' }}>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: '0.7rem', color: 'var(--sapContent_LabelColor)', fontStyle: 'italic' }}>Illustrative source mapping — to be validated with SAP domain team</span>
                </div>
              </div>

              {/* Schema Inspector */}
              {entityDetail && (
                <div style={{ padding: sp.m, background: 'var(--sapInformationBackground, #e8f4fd)', border: '1px solid var(--sapInformationBorderColor, #0070f2)', borderRadius: '0.5rem', marginBottom: sp.m }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp.s }}>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>{entityDetail.name} — Schema Inspector</span>
                    <button onClick={() => setSelectedEntity(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sapContent_LabelColor)', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)' }}>✕ Close</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: sp.s }}>
                    {[['Field Name', entityDetail.fieldName],['Type', entityDetail.type],['PK', entityDetail.pk ? 'Primary Key' : '—'],['FK', entityDetail.fk ? 'Foreign Key' : '—'],['Required', entityDetail.required ? 'Required' : 'Optional'],['Source Semantic Object', entityDetail.source],['Customer Extension', entityDetail.canExtend ? 'Yes — extensible' : 'No'],['Description', entityDetail.description]].map(([k, v]) => (
                      <div key={k}>
                        <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{k}</span>
                        <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!selectedEntity && (
                <MessageStrip design="Information" hideCloseButton style={{ marginTop: sp.s }}>
                  Click any entity above to inspect its fields, source mapping, and extension points.
                </MessageStrip>
              )}
            </div>
          )}

          {/* ── TAB: DATA READINESS ── */}
          {activeTab === 'dataReadiness' && (
            <PackDataReadinessTab nav={nav} />
          )}

          {/* ── TAB: EXPERIMENTS ── */}
          {activeTab === 'experiments' && (
            <PackExperimentsTab nav={nav} onViewResults={() => setActiveTab('results')} />
          )}

          {/* ── TAB: RESULTS ── */}
          {activeTab === 'results' && (
            <PackResultsTab nav={nav} />
          )}

        </div>
      </div>
    </DynamicPage>
  );
}

// ─── Pack Tab: Data Readiness ─────────────────────────────────────────────────
function PackDataReadinessTab({ nav }: { nav: (v: View) => void }) {
  const [selectedLevel, setSelectedLevel] = useState('L1');
  const [lateRate, setLateRate] = useState('17');
  const [disputeRate, setDisputeRate] = useState('6.3');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [showEval, setShowEval] = useState(false);

  const steps = selectedLevel === 'L1' ? GENERATION_STEPS_L1 : GENERATION_STEPS_L3;

  const handleGenerate = useCallback(() => {
    setGenerating(true); setProgress([]); setDone(false); setShowEval(false);
    let i = 0;
    const tick = () => {
      if (i < steps.length) { setProgress(p => [...p, steps[i]]); i++; setTimeout(tick, 400); }
      else { setGenerating(false); setDone(true); setToastOpen(true); }
    };
    tick();
  }, [selectedLevel, steps]);

  const previewCols = useMemo(() => [
    { Header: 'Receivable ID', accessor: 'id', width: 120 },
    { Header: 'Customer Name', accessor: 'bpName', width: 180 },
    { Header: 'Due Date', accessor: 'dueDate', width: 110 },
    { Header: 'Amount (EUR)', accessor: 'amount', width: 120 },
    { Header: 'Status', accessor: 'status', width: 100, Cell: ({ value }) => <ObjectStatus state={invoiceState(value)}>{value}</ObjectStatus> },
    { Header: 'Days Overdue', accessor: 'daysOverdue', width: 110 },
    { Header: 'Dunning', accessor: 'dunning', width: 80 },
  ], []);

  const evalDims = selectedLevel === 'L3' || selectedLevel === 'L4' ? QUALITY_DIMENSIONS_L3 : QUALITY_DIMENSIONS_L1;
  const hasCriticalFail = evalDims.some(d => d.status === 'needs_calibration' && d.critical);
  const evalStatus = hasCriticalFail ? 'fail' : (selectedLevel === 'L3' || selectedLevel === 'L4') ? 'ml_ready' : 'proto_ready';

  return (
    <div>
      <Toast open={toastOpen} duration={3000} placement="BottomCenter" onClose={() => setToastOpen(false)}>
        {selectedLevel} dataset generated — {selectedLevel === 'L1' ? '10,000' : '500,000'} records ready
      </Toast>

      <div style={{ marginBottom: sp.m }}>
        <MessageStrip design="Information" hideCloseButton>
          Synthetic data makes experiment data available before customer data is ready. Select a fidelity level, configure inputs, and generate.
        </MessageStrip>
      </div>

      {FIDELITY_LEVELS.map(fl => {
        const isActive = selectedLevel === fl.level;
        return (
          <div key={fl.level} style={{ marginBottom: sp.m, border: isActive ? '2px solid var(--sapBrandColor)' : '1px solid var(--sapList_BorderColor)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', background: 'var(--sapTile_Background)', overflow: 'hidden' }}>
            <div style={{ padding: sp.m, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isActive ? '1px solid var(--sapList_BorderColor)' : 'none' }}>
              <div>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: isActive ? 'var(--sapBrandColor)' : 'var(--sapTextColor)', fontSize: 'var(--sapFontLargeSize)' }}>{fl.level} — {fl.title}</span>
                <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', marginTop: sp.xs }}>{fl.desc}</span>
              </div>
              <Button design={isActive ? 'Emphasized' : 'Transparent'} onClick={() => { setSelectedLevel(fl.level); setDone(false); setProgress([]); setShowEval(false); }}>
                {isActive ? `${fl.level} Selected` : `Select ${fl.level}`}
              </Button>
            </div>
            {isActive && fl.level === 'L2' && (
              <div style={{ padding: sp.m }}>
                <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', marginBottom: sp.s }}>Northstar Manufacturing — Customer Z-field Extensions</span>
                <div style={{ display: 'flex', gap: sp.s, flexWrap: 'wrap' }}>
                  {[['ZZ_RISK_CATEGORY','String(2)'],['ZZ_PAYMENT_CHANNEL','String(3)'],['Z_COLLECTION_HISTORY','FK → COLL_HDR']].map(([f, t]) => (
                    <div key={f} style={{ padding: `${sp.xs} ${sp.s}`, background: 'var(--sapBackgroundColor)', border: '1px solid var(--sapList_BorderColor)', borderRadius: '0.375rem' }}>
                      <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>{f}</span>
                      <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}> — {t}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {isActive && fl.level === 'L3' && (
              <div style={{ padding: sp.m }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.s, marginBottom: sp.m }}>
                  <div><Label showColon>Business Partners</Label><Input value="25,000" style={{ display: 'block', marginTop: sp.xs }} /></div>
                  <div><Label showColon>Receivables</Label><Input value="500,000" style={{ display: 'block', marginTop: sp.xs }} /></div>
                  <div><Label showColon>Late Payment Rate %</Label><Input value={lateRate} onInput={(e) => setLateRate(e.target.value)} style={{ display: 'block', marginTop: sp.xs }} /></div>
                  <div><Label showColon>Dispute Rate %</Label><Input value={disputeRate} onInput={(e) => setDisputeRate(e.target.value)} style={{ display: 'block', marginTop: sp.xs }} /></div>
                </div>
                <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: sp.xs }}>Representative Scenarios</span>
                <MessageStrip design="Information" hideCloseButton style={{ marginBottom: sp.s }}>Customer-described or customer-approved examples — not production records.</MessageStrip>
                {REPRESENTATIVE_SCENARIOS.map(sc => (
                  <div key={sc.id} style={{ padding: sp.s, background: 'var(--sapBackgroundColor)', border: '1px solid var(--sapList_BorderColor)', borderRadius: '0.5rem', marginBottom: sp.s }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: sp.xs }}>
                      <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{sc.title}</span>
                      <Tag design={sc.risk === 'High' ? 'Negative' : sc.risk === 'Medium' ? 'Critical' : 'Positive'}>{sc.risk} Risk</Tag>
                    </div>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{sc.desc}</span>
                    <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)', marginTop: sp.xs }}>Expected: <strong>{sc.expected}</strong></span>
                  </div>
                ))}
              </div>
            )}
            {isActive && fl.level === 'L4' && (
              <div style={{ padding: sp.m }}>
                <MessageStrip design="Warning" hideCloseButton>Approved customer sample required. Contact data governance team before proceeding.</MessageStrip>
              </div>
            )}
          </div>
        );
      })}

      {/* Level indicator + config summary */}
      <div style={{ display: 'flex', gap: sp.s, marginBottom: sp.m, alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>Selected:</span>
        {['L1','L2','L3','L4'].map(lv => (
          <div key={lv} onClick={() => { setSelectedLevel(lv); setDone(false); setProgress([]); setShowEval(false); }} style={{ padding: `${sp.xs} ${sp.m}`, background: lv === selectedLevel ? 'var(--sapBrandColor)' : 'var(--sapTile_Background)', color: lv === selectedLevel ? '#fff' : 'var(--sapTextColor)', border: `1px solid ${lv === selectedLevel ? 'var(--sapBrandColor)' : 'var(--sapList_BorderColor)'}`, borderRadius: '0.5rem', cursor: 'pointer', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: lv === selectedLevel ? 'var(--sapFontBoldWeight)' : 'normal' }}>
            {lv}
          </div>
        ))}
      </div>

      {!generating && !done && (
        <div style={{ marginBottom: sp.m, padding: sp.m, background: 'var(--sapTile_Background)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', boxShadow: 'var(--sapContent_Shadow0)', maxWidth: 480 }}>
          <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: sp.s }}>Configuration Summary</span>
          {[
            ['Pack', 'Collections & Disputes v1.0'],
            ['Customer', 'Northstar Manufacturing (Fictional)'],
            ['Fidelity', selectedLevel + ' — ' + (FIDELITY_LEVELS.find(f => f.level === selectedLevel)?.title || '')],
            ...(parseInt(selectedLevel[1]) >= 2 ? [['Schema Delta', '3 Z-field extensions']] : []),
            ...(parseInt(selectedLevel[1]) >= 3 ? [['Business Partners','25,000'],['Receivables','500,000'],['Late Payment', lateRate + '%'],['Dispute', disputeRate + '%'],['Scenarios','3']] : [['Business Partners','500'],['Receivables','10,000']]),
            ['Seed', '42'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', paddingTop: sp.xs, paddingBottom: sp.xs, borderBottom: '1px solid var(--sapList_BorderColor)', gap: sp.s }}>
              <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{k}</span>
              <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)', textAlign: 'right' }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {!generating && !done && <Button design="Emphasized" icon="process" onClick={handleGenerate}>Generate Dataset</Button>}

      {generating && (
        <div style={{ padding: sp.m }}>
          <BusyIndicator active size="M" text="Generating experiment data..." style={{ marginBottom: sp.m }} />
          {progress.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: sp.s, paddingTop: sp.xs }}>
              <Icon name="accept" style={{ width: '0.875rem', height: '0.875rem', color: 'var(--sapPositiveColor)' }} />
              <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{p}</span>
            </div>
          ))}
        </div>
      )}

      {done && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: sp.s, marginBottom: sp.m, padding: sp.m, background: 'var(--sapPositiveBackground, #f5fae5)', border: '1px solid var(--sapPositiveColor)', borderRadius: '0.5rem' }}>
            <Icon name="accept" style={{ width: '1.5rem', height: '1.5rem', color: 'var(--sapPositiveColor)' }} />
            <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontLargeSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapPositiveColor)' }}>
              {selectedLevel} Dataset Ready — {selectedLevel === 'L1' ? '10,000' : '500,000'} records
            </span>
          </div>
          {progress.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: sp.s, paddingTop: sp.xs }}>
              <Icon name="accept" style={{ width: '0.875rem', height: '0.875rem', color: 'var(--sapPositiveColor)' }} />
              <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{p}</span>
            </div>
          ))}
          <div style={{ marginTop: sp.l }}>
            <Title level="H5" wrappingType="Normal" style={{ color: 'var(--sapTextColor)', marginBottom: sp.m }}>Preview — Synthetic Receivables (10 of {selectedLevel === 'L1' ? '10,000' : '500,000'})</Title>
            <AnalyticalTable data={SYNTHETIC_INVOICES} columns={previewCols} visibleRows={5} scaleWidthMode="Smart" minRows={5} />
          </div>
          <div style={{ marginTop: sp.m, display: 'flex', gap: sp.s, flexWrap: 'wrap' }}>
            <Button design="Transparent" icon="quality-issue" onClick={() => setShowEval(!showEval)}>{showEval ? 'Hide' : 'View'} Data Readiness Evaluation</Button>
            <Button design="Transparent" onClick={() => { setDone(false); setProgress([]); setShowEval(false); }}>Generate Again</Button>
          </div>
          {showEval && (
            <div style={{ marginTop: sp.l }}>
              <SectionHead title="Data Readiness Evaluation" />
              <div style={{ marginTop: sp.m, marginBottom: sp.m, padding: sp.m, background: evalStatus === 'fail' ? 'var(--sapNegativeBackground)' : evalStatus === 'ml_ready' ? 'var(--sapInformationBackground, #e8f4fd)' : 'var(--sapPositiveBackground, #f5fae5)', border: `1px solid ${evalStatus === 'fail' ? 'var(--sapNegativeColor)' : evalStatus === 'ml_ready' ? 'var(--sapInformationColor)' : 'var(--sapPositiveColor)'}`, borderRadius: '0.5rem' }}>
                <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', fontSize: 'var(--sapFontLargeSize)', color: evalStatus === 'fail' ? 'var(--sapNegativeColor)' : evalStatus === 'ml_ready' ? 'var(--sapInformationColor)' : 'var(--sapPositiveColor)', marginBottom: sp.xs }}>
                  {evalStatus === 'fail' ? 'NEEDS CALIBRATION' : evalStatus === 'ml_ready' ? 'READY FOR EARLY ML EXPERIMENTATION' : 'READY FOR PROTOTYPING'}
                </span>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>
                  {evalStatus === 'fail' ? 'One or more critical checks failed. Adjust generation parameters and regenerate.' : evalStatus === 'ml_ready' ? 'All quality dimensions pass. Dataset is suitable for early ML experimentation.' : 'All quality dimensions pass. Dataset is suitable for prototyping.'}
                </span>
              </div>
              {evalDims.map((d, i) => (
                <div key={i} style={{ padding: sp.s, background: 'var(--sapTile_Background)', borderRadius: '0.5rem', marginBottom: sp.s, border: '1px solid var(--sapList_BorderColor)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: sp.s, marginBottom: sp.xs }}>
                    <Icon name={d.status === 'pass' ? 'accept' : 'alert'} style={{ width: '1rem', height: '1rem', color: d.status === 'pass' ? 'var(--sapPositiveColor)' : 'var(--sapNegativeColor)', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', flex: 1 }}>{d.dim}</span>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: d.score >= 90 ? 'var(--sapPositiveColor)' : 'var(--sapCriticalColor)' }}>{d.score}%</span>
                  </div>
                  <ProgressIndicator value={d.score} displayValue={`${d.score}%`} state={d.status === 'pass' ? 'Positive' : 'Negative'} style={{ width: '100%', marginBottom: sp.xs }} />
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{d.detail}</span>
                </div>
              ))}
              <SectionHead title="Relationship Fidelity" />
              <div style={{ marginTop: sp.m, padding: sp.m, background: 'var(--sapTile_Background)', borderRadius: '0.5rem', boxShadow: 'var(--sapContent_Shadow0)' }}>
                <Table headerRow={<TableHeaderRow><TableHeaderCell>Predictor</TableHeaderCell><TableHeaderCell>Target</TableHeaderCell><TableHeaderCell>Expected</TableHeaderCell><TableHeaderCell>Observed</TableHeaderCell><TableHeaderCell>Status</TableHeaderCell></TableHeaderRow>}>
                  {RELATIONSHIP_FIDELITY.map((r, i) => (
                    <TableRow key={i} rowKey={String(i)}>
                      <TableCell><Text>{r.predictor}</Text></TableCell>
                      <TableCell><Text>{r.target}</Text></TableCell>
                      <TableCell><Text>{r.expected}</Text></TableCell>
                      <TableCell><Text>{r.observed}</Text></TableCell>
                      <TableCell><ObjectStatus state={r.status === 'pass' ? 'Positive' : 'Critical'}>{r.status === 'pass' ? 'Pass' : 'Review'}</ObjectStatus></TableCell>
                    </TableRow>
                  ))}
                </Table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Pack Tab: Experiments ────────────────────────────────────────────────────
function PackExperimentsTab({ nav, onViewResults }: { nav: (v: View) => void; onViewResults: () => void }) {
  const [selectedApproaches, setSelectedApproaches] = useState<string[]>(['Rules Baseline', 'Gradient Boosting (Demo)', 'RPT Demo Adapter']);
  const [ran, setRan] = useState(false);
  const [running, setRunning] = useState(false);

  const toggleApproach = useCallback((name: string) => {
    setSelectedApproaches(prev => prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]);
  }, []);

  const handleRun = useCallback(() => {
    setRunning(true);
    setTimeout(() => { setRunning(false); setRan(true); }, 1800);
  }, []);

  const runCols = useMemo(() => [
    { Header: 'Run', accessor: 'run', width: 80 },
    { Header: 'Dataset', accessor: 'dataset', width: 130 },
    { Header: 'Approach', accessor: 'approach', width: 200 },
    { Header: 'F1', accessor: 'f1', width: 70 },
    { Header: 'AUC', accessor: 'auc', width: 70 },
    { Header: 'Status', accessor: 'status', width: 100, Cell: ({ value }) => <ObjectStatus state={statusState(value)}>{value}</ObjectStatus> },
  ], []);

  return (
    <div>
      <MessageStrip design="Information" hideCloseButton style={{ marginBottom: sp.m }}>
        Rules Baseline: real deterministic logic. Gradient Boosting (Demo): demo model with illustrative metrics. RPT Demo Adapter: simulated results — live SAP-RPT not connected.
      </MessageStrip>

      {!ran && (
        <div>
          <SectionHead title="Select Approaches to Compare" />
          <div style={{ marginTop: sp.m, marginBottom: sp.m }}>
            <div style={{ padding: sp.m, background: 'var(--sapTile_Background)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', boxShadow: 'var(--sapContent_Shadow0)', marginBottom: sp.m, maxWidth: 400 }}>
              {[['Rules Baseline','Real'],['Gradient Boosting (Demo)','Demo'],['RPT Demo Adapter','Demo Adapter']].map(([name, type]) => (
                <div key={name} onClick={() => toggleApproach(name)} style={{ display: 'flex', alignItems: 'center', gap: sp.m, paddingTop: sp.s, paddingBottom: sp.s, borderBottom: '1px solid var(--sapList_BorderColor)', cursor: 'pointer' }}>
                  <Icon name={selectedApproaches.includes(name) ? 'accept' : 'add'} style={{ width: '1rem', height: '1rem', color: selectedApproaches.includes(name) ? 'var(--sapBrandColor)' : 'var(--sapContent_LabelColor)', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', color: 'var(--sapTextColor)' }}>{name}</span>
                  <ObjectStatus state={type === 'Real' ? 'Positive' : 'Information'}>{type}</ObjectStatus>
                </div>
              ))}
            </div>
            <div style={{ padding: sp.s, background: 'var(--sapTile_Background)', borderRadius: '0.5rem', marginBottom: sp.m, maxWidth: 400 }}>
              {[['Dataset','Northstar L3 — 500,000 records'],['Target','late_payment_flag'],['Fidelity','L3 — Customer Profile & Scenarios']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', paddingTop: sp.xs, paddingBottom: sp.xs, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{k}</span>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{v}</span>
                </div>
              ))}
            </div>
            {running && <BusyIndicator active size="M" text="Running experiments..." style={{ marginBottom: sp.m }} />}
            {!running && <Button design="Emphasized" icon="activities" onClick={handleRun} disabled={selectedApproaches.length === 0}>Run {selectedApproaches.length} Approach{selectedApproaches.length !== 1 ? 'es' : ''}</Button>}
          </div>
        </div>
      )}

      {ran && (
        <div>
          <SectionHead title="Experiment Results" />
          <div style={{ marginTop: sp.m, marginBottom: sp.m, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: sp.m }}>
            {EXPERIMENT_RESULTS.filter(r => selectedApproaches.includes(r.approach)).map((r, i) => (
              <div key={i} style={{ padding: sp.m, background: 'var(--sapTile_Background)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', boxShadow: 'var(--sapContent_Shadow0)', borderTop: `3px solid ${r.type === 'Real' ? 'var(--sapPositiveColor)' : r.type === 'Demo' ? 'var(--sapInformationColor)' : 'var(--sapCriticalColor)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: sp.s }}>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', fontSize: 'var(--sapFontSize)' }}>{r.approach}</span>
                  <ObjectStatus state={r.type === 'Real' ? 'Positive' : r.type === 'Demo' ? 'Information' : 'None'}>{r.type}</ObjectStatus>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.xs }}>
                  {[['Precision',r.precision],['Recall',r.recall],['F1',r.f1],['AUC',r.auc],['Runtime',r.time]].map(([k,v]) => (
                    <div key={k}>
                      <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: '0.7rem', color: 'var(--sapContent_LabelColor)' }}>{k}</span>
                      <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: k==='F1'||k==='AUC' ? 'var(--sapFontBoldWeight)' : 'normal', color: 'var(--sapTextColor)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <SectionHead title="Experiment Run History" />
          <div style={{ marginTop: sp.m, marginBottom: sp.m }}>
            <div className="ui5-content-density-compact">
              <AnalyticalTable data={EXPERIMENT_RUNS} columns={runCols} visibleRows={4} scaleWidthMode="Smart" minRows={4} />
            </div>
          </div>
          <div style={{ marginTop: sp.m, display: 'flex', gap: sp.s }}>
            <Button design="Emphasized" icon="chart-bar-basic" onClick={onViewResults}>View Full Evaluation →</Button>
            <Button design="Transparent" onClick={() => { setRan(false); }}>Run Again</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pack Tab: Results ────────────────────────────────────────────────────────
function PackResultsTab({ nav }: { nav: (v: View) => void }) {
  const [goal, setGoal] = useState('Balanced');
  const suggested = goal === 'Min Complexity' ? 'Rules Baseline' : 'Gradient Boosting (Demo)';
  const reason = goal === 'Min Complexity' ? 'Lowest complexity. Suitable for rules-based deployment.'
    : goal === 'Max Recall' ? 'Highest recall (0.81) under Max Recall goal.'
    : goal === 'Max Precision' ? 'Highest precision (0.84) under Max Precision goal.'
    : goal === 'Max AUC' ? 'Highest AUC (0.89) under Max AUC goal.'
    : 'Highest F1 (0.82) and AUC (0.89) under Balanced evaluation.';

  return (
    <div>
      <MessageStrip design="Warning" hideCloseButton style={{ marginBottom: sp.m }}>This is an experiment recommendation, not a production model decision.</MessageStrip>

      <SectionHead title="Optimization Goal" />
      <div style={{ marginTop: sp.m, marginBottom: sp.m, display: 'flex', gap: sp.s, flexWrap: 'wrap' }}>
        {['Balanced','Max Recall','Max Precision','Max AUC','Min Complexity'].map(g => (
          <button key={g} onClick={() => setGoal(g)} style={{ padding: `${sp.xs} ${sp.m}`, background: goal === g ? 'var(--sapBrandColor)' : 'var(--sapTile_Background)', color: goal === g ? '#fff' : 'var(--sapTextColor)', border: `1px solid ${goal === g ? 'var(--sapBrandColor)' : 'var(--sapList_BorderColor)'}`, borderRadius: '0.5rem', cursor: 'pointer', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: goal === g ? 'var(--sapFontBoldWeight)' : 'normal' }}>{g}</button>
        ))}
      </div>

      <div style={{ overflowX: 'auto', marginBottom: sp.m }}>
        <Table headerRow={<TableHeaderRow><TableHeaderCell>Approach</TableHeaderCell><TableHeaderCell>Type</TableHeaderCell><TableHeaderCell>Precision</TableHeaderCell><TableHeaderCell>Recall</TableHeaderCell><TableHeaderCell>F1</TableHeaderCell><TableHeaderCell>AUC</TableHeaderCell><TableHeaderCell>Explainability</TableHeaderCell><TableHeaderCell>Complexity</TableHeaderCell><TableHeaderCell>Runtime</TableHeaderCell></TableHeaderRow>}>
          {EXPERIMENT_RESULTS.map((r, i) => (
            <TableRow key={i} rowKey={String(i)} style={r.approach === suggested ? { background: 'var(--sapHighlightBackground, #e8f4fd)' } : {}}>
              <TableCell><span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: r.approach === suggested ? 'var(--sapFontBoldWeight)' : 'normal', color: 'var(--sapTextColor)' }}>{r.approach}{r.approach === suggested ? ' ★' : ''}</span></TableCell>
              <TableCell><ObjectStatus state={r.type === 'Real' ? 'Positive' : r.type === 'Demo' ? 'Information' : 'None'}>{r.type}</ObjectStatus></TableCell>
              <TableCell><Text>{r.precision}</Text></TableCell>
              <TableCell><Text>{r.recall}</Text></TableCell>
              <TableCell><Text style={{ fontWeight: r.approach === suggested ? 'bold' : 'normal' }}>{r.f1}</Text></TableCell>
              <TableCell><Text>{r.auc}</Text></TableCell>
              <TableCell><Text>{r.explainability}</Text></TableCell>
              <TableCell><Text>{r.complexity}</Text></TableCell>
              <TableCell><Text>{r.time}</Text></TableCell>
            </TableRow>
          ))}
        </Table>
      </div>

      <div style={{ padding: sp.m, background: 'var(--sapHighlightBackground, #e8f4fd)', border: '1px solid var(--sapBrandColor)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', marginBottom: sp.m }}>
        <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', marginBottom: sp.xs }}>Suggested Starting Approach</span>
        <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontLargeSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapBrandColor)', marginBottom: sp.xs }}>{suggested}</span>
        <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)', marginBottom: sp.s }}>{reason}</span>
        <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', fontStyle: 'italic' }}>This is an experiment recommendation, not a production model decision.</span>
      </div>

      <div style={{ marginTop: sp.m }}>
        <Button design="Transparent" onClick={() => nav('evaluation')}>View full Evaluation screen →</Button>
      </div>
    </div>
  );
}


// ─── View: Data Readiness ─────────────────────────────────────────────────────
function DataReadinessView({ nav }: { nav: (v: View) => void }) {
  const [selectedLevel, setSelectedLevel] = useState('L1');
  const [lateRate, setLateRate] = useState('17');
  const [disputeRate, setDisputeRate] = useState('6.3');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [showEval, setShowEval] = useState(false);
  const [generatedLevel, setGeneratedLevel] = useState<string | null>(null);

  const steps = selectedLevel === 'L1' ? GENERATION_STEPS_L1 : GENERATION_STEPS_L3;

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    setProgress([]);
    setDone(false);
    setShowEval(false);
    let i = 0;
    const tick = () => {
      if (i < steps.length) {
        setProgress(p => [...p, steps[i]]);
        i++;
        setTimeout(tick, 500);
      } else {
        setGenerating(false);
        setDone(true);
        setGeneratedLevel(selectedLevel);
        setToastOpen(true);
      }
    };
    tick();
  }, [selectedLevel, steps]);

  const previewCols = useMemo(() => [
    { Header: 'Receivable ID', accessor: 'id', width: 120 },
    { Header: 'BP ID', accessor: 'bp', width: 100 },
    { Header: 'Customer Name', accessor: 'bpName', width: 180 },
    { Header: 'Invoice Date', accessor: 'invDate', width: 110 },
    { Header: 'Due Date', accessor: 'dueDate', width: 110 },
    { Header: 'Amount (EUR)', accessor: 'amount', width: 120 },
    { Header: 'Status', accessor: 'status', width: 100, Cell: ({ value }) => <ObjectStatus state={invoiceState(value)}>{value}</ObjectStatus> },
    { Header: 'Days Overdue', accessor: 'daysOverdue', width: 110 },
    { Header: 'Dunning Level', accessor: 'dunning', width: 110 },
  ], []);

  // Inline quality evaluation dimensions
  const evalDims = generatedLevel === 'L3' || generatedLevel === 'L4' ? QUALITY_DIMENSIONS_L3 : QUALITY_DIMENSIONS_L1;
  const hasCriticalFail = evalDims.some(d => d.status === 'needs_calibration' && d.critical);
  const evalStatus = hasCriticalFail ? 'needs_calibration'
    : (generatedLevel === 'L3' || generatedLevel === 'L4') ? 'ml_ready'
    : 'proto_ready';

  const levelColor = (lv: string) => {
    if (lv === selectedLevel) return 'var(--sapBrandColor)';
    return 'var(--sapNeutralColor, #ccc)';
  };

  return (
    <DynamicPage
      style={{ flex: 1, overflow: 'hidden', '--ui5_dynamic_page_background': 'var(--sapObjectHeader_Background)' } as React.CSSProperties}
      headerTitle={
        <DynamicPageTitle style={{ paddingLeft: sp.m }}>
          <Title slot="heading" level="H3" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>Data Readiness — Prepare Experiment Data</Title>
          <Text slot="subheading" style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)' }}>
            Collections & Disputes v1.0 · Northstar Manufacturing · <strong>Fictional Demo Customer</strong>
          </Text>
        </DynamicPageTitle>
      }
    >
      <div style={{ paddingTop: sp.m, paddingBottom: sp.l, paddingLeft: sp.g, paddingRight: sp.g }}>
        <Toast open={toastOpen} duration={4000} placement="BottomCenter" onClose={() => setToastOpen(false)}>
          {selectedLevel} dataset generated — {selectedLevel === 'L1' ? '10,000 records' : '500,000 records'} ready
        </Toast>

        <MessageStrip design="Information" hideCloseButton style={{ marginBottom: sp.m }}>
          Synthetic data is one way to make experiment data available before customer data is ready. Select a fidelity level, configure inputs, and generate.
        </MessageStrip>

        {/* Level sections */}
        {FIDELITY_LEVELS.map(fl => {
          const isActive = selectedLevel === fl.level;
          const levelNum = parseInt(fl.level.substring(1));
          const selectedNum = parseInt(selectedLevel.substring(1));
          const isRelevant = levelNum <= selectedNum;
          return (
            <div key={fl.level} style={{ marginBottom: sp.m, border: isActive ? `2px solid var(--sapBrandColor)` : '1px solid var(--sapList_BorderColor)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', background: 'var(--sapTile_Background)', overflow: 'hidden' }}>
              <div style={{ padding: sp.m, borderBottom: isActive ? `1px solid var(--sapList_BorderColor)` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: isActive ? 'var(--sapBrandColor)' : 'var(--sapTextColor)', fontSize: 'var(--sapFontLargeSize)' }}>{fl.level} — {fl.title}</span>
                  <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', marginTop: sp.xs }}>{fl.desc}</span>
                </div>
                <Button design={isActive ? 'Emphasized' : 'Transparent'} onClick={() => { setSelectedLevel(fl.level); setDone(false); setProgress([]); setShowEval(false); }}>
                  {isActive ? `${fl.level} Selected` : `Select ${fl.level}`}
                </Button>
              </div>
              {isActive && (
                <div style={{ padding: sp.m }}>
                  {fl.level === 'L1' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.s }}>
                      {[['Pack', 'Collections & Disputes v1.0'], ['SAP Defaults', 'FSCM + S/4 AR baseline'], ['Business Partners', '500'], ['Receivables', '10,000'], ['Currency', 'EUR'], ['Seed', '42']].map(([k, v]) => (
                        <div key={k} style={{ paddingTop: sp.xs, paddingBottom: sp.xs }}>
                          <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{k}</span>
                          <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {fl.level === 'L2' && (
                    <div>
                      <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', marginBottom: sp.s }}>Northstar Manufacturing — Customer Schema Extensions</span>
                      <div style={{ display: 'flex', gap: sp.s, flexWrap: 'wrap' }}>
                        {[['ZZ_RISK_CATEGORY', 'String(2)'], ['ZZ_PAYMENT_CHANNEL', 'String(3)'], ['Z_COLLECTION_HISTORY', 'FK → COLL_HDR']].map(([f, t]) => (
                          <div key={f} style={{ padding: `${sp.xs} ${sp.s}`, background: 'var(--sapBackgroundColor)', border: '1px solid var(--sapList_BorderColor)', borderRadius: '0.375rem' }}>
                            <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>{f}</span>
                            <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}> — {t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {fl.level === 'L3' && (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.s, marginBottom: sp.m }}>
                        <div>
                          <Label showColon>Business Partners</Label>
                          <Input value="25000" style={{ display: 'block', marginTop: sp.xs }} />
                        </div>
                        <div>
                          <Label showColon>Receivables</Label>
                          <Input value="500000" style={{ display: 'block', marginTop: sp.xs }} />
                        </div>
                        <div>
                          <Label showColon>Late Payment Rate %</Label>
                          <Input value={lateRate} onInput={(e) => setLateRate(e.target.value)} style={{ display: 'block', marginTop: sp.xs }} />
                        </div>
                        <div>
                          <Label showColon>Dispute Rate %</Label>
                          <Input value={disputeRate} onInput={(e) => setDisputeRate(e.target.value)} style={{ display: 'block', marginTop: sp.xs }} />
                        </div>
                      </div>
                      <div style={{ marginTop: sp.m }}>
                        <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: sp.xs }}>Representative Scenarios</span>
                        <MessageStrip design="Information" hideCloseButton style={{ marginBottom: sp.s }}>
                          Customer-described or customer-approved examples — not production records.
                        </MessageStrip>
                        {REPRESENTATIVE_SCENARIOS.map(sc => (
                          <div key={sc.id} style={{ padding: sp.s, background: 'var(--sapBackgroundColor)', border: '1px solid var(--sapList_BorderColor)', borderRadius: '0.5rem', marginBottom: sp.s }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp.xs }}>
                              <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>{sc.title}</span>
                              <Tag design={sc.risk === 'High' ? 'Negative' : sc.risk === 'Medium' ? 'Critical' : 'Positive'}>{sc.risk} Risk</Tag>
                            </div>
                            <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{sc.desc}</span>
                            <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)', marginTop: sp.xs }}>Expected: <strong>{sc.expected}</strong></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {fl.level === 'L4' && (
                    <div>
                      <MessageStrip design="Warning" hideCloseButton>
                        Approved customer sample required. Contact data governance team before proceeding.
                      </MessageStrip>
                      <Button design="Transparent" disabled style={{ marginTop: sp.m }}>Load Approved Sample (Requires Approval)</Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Fidelity level indicator */}
        <div style={{ display: 'flex', gap: sp.s, marginBottom: sp.m, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>Selected Fidelity Level:</span>
          {['L1', 'L2', 'L3', 'L4'].map(lv => (
            <div key={lv} onClick={() => { setSelectedLevel(lv); setDone(false); setProgress([]); setShowEval(false); }} style={{ padding: `${sp.xs} ${sp.m}`, background: lv === selectedLevel ? 'var(--sapBrandColor)' : 'var(--sapTile_Background)', color: lv === selectedLevel ? '#fff' : 'var(--sapTextColor)', border: `1px solid ${levelColor(lv)}`, borderRadius: '0.5rem', cursor: 'pointer', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: lv === selectedLevel ? 'var(--sapFontBoldWeight)' : 'normal' }}>
              {lv}
            </div>
          ))}
        </div>

        {/* Configuration Summary */}
        {!generating && !done && (
          <div style={{ padding: sp.m, background: 'var(--sapTile_Background)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', boxShadow: 'var(--sapContent_Shadow0)', marginBottom: sp.m, maxWidth: 500 }}>
            <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: sp.s }}>Configuration Summary</span>
            {[
              ['Pack', 'Collections & Disputes v1.0'],
              ['Customer', 'Northstar Manufacturing (Fictional Demo Customer)'],
              ['Fidelity', selectedLevel + ' — ' + (FIDELITY_LEVELS.find(f => f.level === selectedLevel)?.title || '')],
              ...(parseInt(selectedLevel.substring(1)) >= 2 ? [['Schema Delta', '3 customer extensions (ZZ_RISK_CATEGORY, ZZ_PAYMENT_CHANNEL, Z_COLLECTION_HISTORY)']] : []),
              ...(parseInt(selectedLevel.substring(1)) >= 3 ? [['Business Partners', '25,000'], ['Receivables', '500,000'], ['Late Payment', lateRate + '%'], ['Dispute', disputeRate + '%'], ['Representative Scenarios', '3']] : [selectedLevel === 'L1' ? ['Business Partners', '500'] : ['Business Partners', '500'], selectedLevel === 'L1' ? ['Receivables', '10,000'] : ['Receivables', '10,000']]),
              ['Seed', '42'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', paddingTop: sp.xs, paddingBottom: sp.xs, borderBottom: '1px solid var(--sapList_BorderColor)', gap: sp.s }}>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{k}</span>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)', textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {!generating && !done && (
          <Button design="Emphasized" icon="process" onClick={handleGenerate}>Generate Dataset</Button>
        )}

        {generating && (
          <div style={{ padding: sp.m }}>
            <BusyIndicator active size="M" text="Generating experiment data..." style={{ marginBottom: sp.m }} />
            {progress.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: sp.s, paddingTop: sp.xs }}>
                <Icon name="accept" style={{ width: '1rem', height: '1rem', color: 'var(--sapPositiveColor)' }} />
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{p}</span>
              </div>
            ))}
          </div>
        )}

        {done && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: sp.s, marginBottom: sp.m, padding: sp.m, background: 'var(--sapPositiveBackground, #f5fae5)', border: '1px solid var(--sapPositiveColor)', borderRadius: '0.5rem' }}>
              <Icon name="accept" style={{ width: '1.5rem', height: '1.5rem', color: 'var(--sapPositiveColor)' }} />
              <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontLargeSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapPositiveColor)' }}>
                {selectedLevel} Dataset Ready — {selectedLevel === 'L1' ? '10,000' : '500,000'} records generated
              </span>
            </div>
            {progress.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: sp.s, paddingTop: sp.xs }}>
                <Icon name="accept" style={{ width: '0.875rem', height: '0.875rem', color: 'var(--sapPositiveColor)' }} />
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{p}</span>
              </div>
            ))}

            <div style={{ marginTop: sp.l }}>
              <Title level="H5" wrappingType="Normal" style={{ color: 'var(--sapTextColor)', marginBottom: sp.m }}>Preview — Synthetic Receivables Data (10 of {selectedLevel === 'L1' ? '10,000' : '500,000'})</Title>
              <AnalyticalTable data={SYNTHETIC_INVOICES} columns={previewCols} visibleRows={10} scaleWidthMode="Smart" minRows={5} />
            </div>

            <div style={{ marginTop: sp.m, display: 'flex', gap: sp.s, flexWrap: 'wrap' }}>
              <Button design="Emphasized" icon="activities" onClick={() => nav('experiments')}>Run Experiments →</Button>
              <Button design="Transparent" icon="quality-issue" onClick={() => setShowEval(!showEval)}>
                {showEval ? 'Hide' : 'View'} Data Readiness Evaluation
              </Button>
              <Button design="Transparent" onClick={() => { setDone(false); setProgress([]); setShowEval(false); }}>Generate Again</Button>
            </div>

            {/* Inline quality evaluation */}
            {showEval && (
              <div style={{ marginTop: sp.l }}>
                <SectionHead title="Data Readiness Evaluation" />

                {/* Status banner */}
                <div style={{ marginTop: sp.m, marginBottom: sp.m, padding: sp.m, background: hasCriticalFail ? 'var(--sapNegativeBackground, #fdf3f3)' : evalStatus === 'ml_ready' ? 'var(--sapInformationBackground, #e8f4fd)' : 'var(--sapPositiveBackground, #f5fae5)', border: `1px solid ${hasCriticalFail ? 'var(--sapNegativeColor)' : evalStatus === 'ml_ready' ? 'var(--sapInformationColor)' : 'var(--sapPositiveColor)'}`, borderRadius: '0.5rem' }}>
                  <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', fontSize: 'var(--sapFontLargeSize)', color: hasCriticalFail ? 'var(--sapNegativeColor)' : evalStatus === 'ml_ready' ? 'var(--sapInformationColor)' : 'var(--sapPositiveColor)', marginBottom: sp.xs }}>
                    {hasCriticalFail ? 'NEEDS CALIBRATION' : evalStatus === 'ml_ready' ? 'READY FOR EARLY ML EXPERIMENTATION' : 'READY FOR PROTOTYPING'}
                  </span>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>
                    {hasCriticalFail ? 'One or more critical checks failed. Adjust generation parameters and regenerate.' : evalStatus === 'ml_ready' ? 'All quality dimensions pass. Dataset is suitable for early ML experimentation.' : 'All quality dimensions pass. Dataset is suitable for prototyping and early evaluation.'}
                  </span>
                </div>

                {/* Quality dimensions */}
                <div style={{ marginBottom: sp.m }}>
                  {evalDims.map((d, i) => (
                    <div key={i} style={{ padding: sp.s, background: 'var(--sapTile_Background)', borderRadius: '0.5rem', marginBottom: sp.s, border: d.critical && d.status !== 'pass' ? '1px solid var(--sapNegativeColor)' : '1px solid var(--sapList_BorderColor)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: sp.s, marginBottom: sp.xs }}>
                        <Icon name={d.status === 'pass' ? 'accept' : d.status === 'review' ? 'question-mark' : 'alert'} style={{ width: '1rem', height: '1rem', color: d.status === 'pass' ? 'var(--sapPositiveColor)' : d.status === 'review' ? 'var(--sapCriticalColor)' : 'var(--sapNegativeColor)', flexShrink: 0 }} />
                        <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>{d.dim}</span>
                        <span style={{ marginLeft: 'auto', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: d.score >= 90 ? 'var(--sapPositiveColor)' : d.score >= 70 ? 'var(--sapCriticalColor)' : 'var(--sapNegativeColor)' }}>{d.score}%</span>
                      </div>
                      <ProgressIndicator value={d.score} displayValue={`${d.score}%`} state={d.status === 'pass' ? 'Positive' : d.status === 'review' ? 'Critical' : 'Negative'} style={{ width: '100%', marginBottom: sp.xs }} />
                      <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{d.detail}</span>
                    </div>
                  ))}
                </div>

                {/* Relationship Fidelity */}
                <SectionHead title="Relationship Fidelity" />
                <div style={{ marginTop: sp.m, padding: sp.m, background: 'var(--sapTile_Background)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', boxShadow: 'var(--sapContent_Shadow0)' }}>
                  <Table headerRow={
                    <TableHeaderRow>
                      <TableHeaderCell>Predictor</TableHeaderCell>
                      <TableHeaderCell>Target</TableHeaderCell>
                      <TableHeaderCell>Expected</TableHeaderCell>
                      <TableHeaderCell>Observed</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                    </TableHeaderRow>
                  }>
                    {RELATIONSHIP_FIDELITY.map((r, i) => (
                      <TableRow key={i} rowKey={String(i)}>
                        <TableCell><Text>{r.predictor}</Text></TableCell>
                        <TableCell><Text>{r.target}</Text></TableCell>
                        <TableCell><Text>{r.expected}</Text></TableCell>
                        <TableCell><Text>{r.observed}</Text></TableCell>
                        <TableCell>
                          <ObjectStatus state={r.status === 'pass' ? 'Positive' : 'Critical'}>{r.status === 'pass' ? 'Pass' : 'Review'}</ObjectStatus>
                        </TableCell>
                      </TableRow>
                    ))}
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DynamicPage>
  );
}

// ─── View: Experiments ────────────────────────────────────────────────────────
function ExperimentsView({ nav }: { nav: (v: View) => void }) {
  const runCols = useMemo(() => [
    { Header: 'Run', accessor: 'run', width: 80 },
    { Header: 'Dataset', accessor: 'dataset', width: 130 },
    { Header: 'Approach', accessor: 'approach', width: 200 },
    { Header: 'F1', accessor: 'f1', width: 70 },
    { Header: 'AUC', accessor: 'auc', width: 70 },
    { Header: 'Status', accessor: 'status', width: 100, Cell: ({ value }) => <ObjectStatus state={statusState(value)}>{value}</ObjectStatus> },
  ], []);

  return (
    <DynamicPage
      style={{ flex: 1, overflow: 'hidden', '--ui5_dynamic_page_background': 'var(--sapObjectHeader_Background)' } as React.CSSProperties}
      headerTitle={
        <DynamicPageTitle style={{ paddingLeft: sp.m }}>
          <Title slot="heading" level="H3" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>Run Experiments</Title>
          <Text slot="subheading" style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)' }}>
            Experiment: Late Payment Prediction · Dataset: Northstar L3 · Target: late_payment_flag
          </Text>
          <Toolbar slot="actionsBar" design="Transparent">
            <Button design="Emphasized" icon="chart-bar-basic" onClick={() => nav('evaluation')}>View Evaluation →</Button>
            <Button design="Transparent" icon="download">Export</Button>
          </Toolbar>
        </DynamicPageTitle>
      }
      headerContent={
        <DynamicPageHeader>
          <div style={{ paddingTop: sp.m, paddingBottom: sp.m, paddingLeft: sp.g, paddingRight: sp.g }}>
            <FlexBox wrap="Wrap" style={{ gap: sp.m }}>
              <KpiTile label="Dataset" value="Northstar L3" />
              <KpiTile label="Records" value="500,000" />
              <KpiTile label="Target" value="late_payment_flag" />
              <KpiTile label="Fidelity" value="L3 — Customer Profile" />
            </FlexBox>
          </div>
        </DynamicPageHeader>
      }
    >
      <div style={{ paddingTop: sp.m, paddingBottom: sp.l, paddingLeft: sp.g, paddingRight: sp.g }}>

        <MessageStrip design="Information" hideCloseButton style={{ marginBottom: sp.m }}>
          What is real vs. demo in this prototype? Rules Baseline: real deterministic logic. Gradient Boosting (Demo): demo model with illustrative metrics — not a live trained model. RPT Demo Adapter: simulated results — live SAP-RPT integration not connected.
        </MessageStrip>

        <SectionHead title="Experiment Approaches" />
        <div style={{ marginTop: sp.m, marginBottom: sp.l, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: sp.m }}>
          {EXPERIMENT_RESULTS.map((r, i) => (
            <div key={i} style={{ padding: sp.m, background: 'var(--sapTile_Background)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', boxShadow: 'var(--sapContent_Shadow0)', borderTop: `3px solid ${r.type === 'Real' ? 'var(--sapPositiveColor)' : r.type === 'Demo' ? 'var(--sapInformationColor)' : 'var(--sapCriticalColor)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp.s }}>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', fontSize: 'var(--sapFontSize)' }}>{r.approach}</span>
                <ObjectStatus state={r.type === 'Real' ? 'Positive' : r.type === 'Demo' ? 'Information' : 'None'}>
                  {r.type === 'Real' ? 'Real' : r.type === 'Demo' ? 'Demo Model' : 'Demo Adapter'}
                </ObjectStatus>
              </div>
              {r.type === 'Demo-Adapter' && (
                <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: '0.7rem', color: 'var(--sapCriticalColor)', marginBottom: sp.xs }}>Simulated results — live SAP-RPT not connected.</span>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.xs }}>
                {[['Precision', r.precision], ['Recall', r.recall], ['F1', r.f1], ['AUC', r.auc], ['Runtime', r.time], ['Explainability', r.explainability]].map(([k, v]) => (
                  <div key={k}>
                    <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: '0.7rem', color: 'var(--sapContent_LabelColor)' }}>{k}</span>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: (k === 'F1' || k === 'AUC') ? 'var(--sapFontBoldWeight)' : 'normal', color: 'var(--sapTextColor)' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: sp.s }}>
                <ObjectStatus state="Positive">Complete</ObjectStatus>
              </div>
            </div>
          ))}
        </div>

        <SectionHead title="Experiment Run History" />
        <div style={{ marginTop: sp.m, marginBottom: sp.l }}>
          <div className="ui5-content-density-compact">
            <AnalyticalTable data={EXPERIMENT_RUNS} columns={runCols} visibleRows={4} scaleWidthMode="Smart" minRows={4} />
          </div>
          <div style={{ marginTop: sp.m }}>
            <Button design="Emphasized" onClick={() => nav('evaluation')}>Compare in Evaluation →</Button>
          </div>
        </div>

        <SectionHead title="Top Features — Gradient Boosting (Demo)" />
        <div style={{ marginTop: sp.m, padding: sp.m, background: 'var(--sapTile_Background)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', boxShadow: 'var(--sapContent_Shadow0)', maxWidth: 600 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ marginBottom: sp.m }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: sp.xs }}>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', color: 'var(--sapTextColor)' }}>{i + 1}. {f.name}</span>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapBrandColor)' }}>{f.pct}%</span>
              </div>
              <ProgressIndicator value={f.pct} displayValue={`${f.pct}%`} state="Information" style={{ width: '100%' }} />
            </div>
          ))}
        </div>
      </div>
    </DynamicPage>
  );
}

// ─── View: Evaluation ─────────────────────────────────────────────────────────
function EvaluationView({ nav }: { nav: (v: View) => void }) {
  const [goal, setGoal] = useState('Balanced');

  const suggested = goal === 'Min Complexity' ? 'Rules Baseline' : 'Gradient Boosting (Demo)';
  const reason = goal === 'Min Complexity'
    ? 'Lowest complexity and highest explainability under Min Complexity goal. Suitable for rules-based deployment.'
    : goal === 'Max Recall'
    ? 'Highest recall (0.81) under Max Recall goal. Minimizes missed late payers.'
    : goal === 'Max Precision'
    ? 'Highest precision (0.84) under Max Precision goal.'
    : goal === 'Max AUC'
    ? 'Highest AUC (0.89) under Max AUC goal.'
    : 'Highest F1 (0.82) and AUC (0.89) under Balanced evaluation.';

  return (
    <DynamicPage
      style={{ flex: 1, overflow: 'hidden', '--ui5_dynamic_page_background': 'var(--sapObjectHeader_Background)' } as React.CSSProperties}
      headerTitle={
        <DynamicPageTitle style={{ paddingLeft: sp.m }}>
          <Title slot="heading" level="H3" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>Evaluation — Compare Experiment Approaches</Title>
          <Text slot="subheading" style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)' }}>
            Select an optimization goal to identify the suggested starting approach.
          </Text>
        </DynamicPageTitle>
      }
    >
      <div style={{ paddingTop: sp.m, paddingBottom: sp.l, paddingLeft: sp.g, paddingRight: sp.g }}>
        <MessageStrip design="Warning" hideCloseButton style={{ marginBottom: sp.m }}>
          This is an experiment recommendation, not a production model decision.
        </MessageStrip>

        <SectionHead title="Optimization Goal" />
        <div style={{ marginTop: sp.m, marginBottom: sp.m, display: 'flex', gap: sp.s, flexWrap: 'wrap' }}>
          {['Balanced', 'Max Recall', 'Max Precision', 'Max AUC', 'Min Complexity'].map(g => (
            <button key={g} onClick={() => setGoal(g)} style={{ padding: `${sp.xs} ${sp.m}`, background: goal === g ? 'var(--sapBrandColor)' : 'var(--sapTile_Background)', color: goal === g ? '#fff' : 'var(--sapTextColor)', border: `1px solid ${goal === g ? 'var(--sapBrandColor)' : 'var(--sapList_BorderColor)'}`, borderRadius: '0.5rem', cursor: 'pointer', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: goal === g ? 'var(--sapFontBoldWeight)' : 'normal' }}>
              {g}
            </button>
          ))}
        </div>

        <SectionHead title="Comparison Table" />
        <div style={{ marginTop: sp.m, marginBottom: sp.m, overflowX: 'auto' }}>
          <Table headerRow={
            <TableHeaderRow>
              <TableHeaderCell>Approach</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Accuracy</TableHeaderCell>
              <TableHeaderCell>Precision</TableHeaderCell>
              <TableHeaderCell>Recall</TableHeaderCell>
              <TableHeaderCell>F1</TableHeaderCell>
              <TableHeaderCell>AUC</TableHeaderCell>
              <TableHeaderCell>Explainability</TableHeaderCell>
              <TableHeaderCell>Complexity</TableHeaderCell>
              <TableHeaderCell>Runtime</TableHeaderCell>
            </TableHeaderRow>
          }>
            {EXPERIMENT_RESULTS.map((r, i) => (
              <TableRow key={i} rowKey={String(i)} style={r.approach === suggested ? { background: 'var(--sapHighlightBackground, #e8f4fd)' } : {}}>
                <TableCell>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: r.approach === suggested ? 'var(--sapFontBoldWeight)' : 'normal', color: 'var(--sapTextColor)' }}>
                    {r.approach}{r.approach === suggested ? ' ★' : ''}
                  </span>
                </TableCell>
                <TableCell><ObjectStatus state={r.type === 'Real' ? 'Positive' : r.type === 'Demo' ? 'Information' : 'None'}>{r.type}</ObjectStatus></TableCell>
                <TableCell><Text>{r.accuracy}</Text></TableCell>
                <TableCell><Text>{r.precision}</Text></TableCell>
                <TableCell><Text>{r.recall}</Text></TableCell>
                <TableCell><Text style={{ fontWeight: r.approach === suggested ? 'bold' : 'normal' }}>{r.f1}</Text></TableCell>
                <TableCell><Text>{r.auc}</Text></TableCell>
                <TableCell><Text>{r.explainability}</Text></TableCell>
                <TableCell><Text>{r.complexity}</Text></TableCell>
                <TableCell><Text>{r.time}</Text></TableCell>
              </TableRow>
            ))}
          </Table>
        </div>

        {/* Suggested approach */}
        <div style={{ padding: sp.m, background: 'var(--sapHighlightBackground, #e8f4fd)', border: '1px solid var(--sapBrandColor)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', marginBottom: sp.l }}>
          <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', marginBottom: sp.xs }}>Suggested Starting Approach</span>
          <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontLargeSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapBrandColor)', marginBottom: sp.xs }}>{suggested}</span>
          <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)', marginBottom: sp.s }}>{reason}</span>
          <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', fontStyle: 'italic' }}>This is an experiment recommendation, not a production model decision.</span>
        </div>

        {/* Real vs Demo */}
        <SectionHead title="What is Real vs. Demo in This Prototype" />
        <div style={{ marginTop: sp.m, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.m }}>
          <div style={{ padding: sp.m, background: 'var(--sapPositiveBackground, #f5fae5)', border: '1px solid var(--sapPositiveColor)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)' }}>
            <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapPositiveColor)', marginBottom: sp.s }}>REAL IN PROTOTYPE</span>
            {['Relational synthetic data generation (deterministic)', 'Foreign-key integrity enforcement', 'Business-rule validation', 'Distribution validation', 'Downloadable data preview', 'Rules Baseline model (deterministic logic)', 'Pack versioning logic'].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: sp.s, paddingTop: sp.xs }}>
                <Icon name="accept" style={{ width: '0.875rem', height: '0.875rem', color: 'var(--sapPositiveColor)', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: sp.m, background: 'var(--sapNeutralBackground, #f5f5f5)', border: '1px solid var(--sapNeutralColor, #ccc)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)' }}>
            <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapContent_LabelColor)', marginBottom: sp.s }}>DEMO / ADAPTER</span>
            {['Gradient Boosting metrics (illustrative, not live trained)', 'RPT Demo Adapter (simulated results, no SAP-RPT connection)', 'Live SAP Domain Model integration', 'Live FSCM / S/4 connectivity', 'SAP-RPT integration', 'Production governance', 'Privacy guarantees'].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: sp.s, paddingTop: sp.xs }}>
                <Icon name="information" style={{ width: '0.875rem', height: '0.875rem', color: 'var(--sapContent_LabelColor)', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </DynamicPage>
  );
}

// ─── View: Validation ─────────────────────────────────────────────────────────
function ValidationView({ nav }: { nav: (v: View) => void }) {
  const lifecycleSteps = [
    { label: 'Draft Pack', detail: 'Initial pack definition', status: 'pass' },
    { label: 'L1–L4 Calibration', detail: 'Data fidelity validated across all levels', status: 'pass' },
    { label: 'Customer / Process Validation', detail: 'Northstar Manufacturing review in progress', status: 'in_progress' },
    { label: 'Validated Pack', detail: 'Pack confirmed reusable for this domain', status: 'pending' },
    { label: 'Reuse in Next Engagement', detail: 'Next customer starts with v1.1', status: 'pending' },
  ];
  const checks = [
    { label: 'Schema Validation', detail: 'Validated by SAP domain expert', pass: true },
    { label: 'Business Constraint Validation', detail: 'All 7 constraints validated', pass: true },
    { label: 'Representative Scenario Validation', detail: '3/3 scenarios accepted by Northstar', pass: true },
    { label: 'Customer Process Validation', detail: 'Awaiting Northstar process review', pass: false },
    { label: 'Experiment Validation', detail: 'Pending customer review of experiment results', pass: false },
  ];

  return (
    <DynamicPage
      style={{ flex: 1, overflow: 'hidden', '--ui5_dynamic_page_background': 'var(--sapObjectHeader_Background)' } as React.CSSProperties}
      headerTitle={
        <DynamicPageTitle style={{ paddingLeft: sp.m }}>
          <Title slot="heading" level="H3" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>Validation — Customer & Process Validation</Title>
          <Text slot="subheading" style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)' }}>
            Separate from data fidelity (L1–L4). Confirms the experiment pack and results are reusable in practice.
          </Text>
        </DynamicPageTitle>
      }
    >
      <div style={{ paddingTop: sp.m, paddingBottom: sp.l, paddingLeft: sp.g, paddingRight: sp.g }}>

        <MessageStrip design="Information" hideCloseButton style={{ marginBottom: sp.m }}>
          L1–L4 describe data fidelity levels. Customer/Process Validation confirms that the experiment pack and results are meaningful for the customer's real business process.
        </MessageStrip>

        <SectionHead title="Pack Lifecycle" />
        <div style={{ marginTop: sp.m, marginBottom: sp.l, padding: sp.m, background: 'var(--sapTile_Background)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', boxShadow: 'var(--sapContent_Shadow0)' }}>
          {lifecycleSteps.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: sp.m, paddingTop: sp.s, paddingBottom: sp.s, borderBottom: i < lifecycleSteps.length - 1 ? '1px solid var(--sapList_BorderColor)' : 'none' }}>
              <Icon name={s.status === 'pass' ? 'accept' : s.status === 'in_progress' ? 'pending' : 'circle-task'} style={{ width: '1.25rem', height: '1.25rem', color: s.status === 'pass' ? 'var(--sapPositiveColor)' : s.status === 'in_progress' ? 'var(--sapCriticalColor)' : 'var(--sapContent_LabelColor)', flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>{s.label}</span>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{s.detail}</span>
              </div>
              <ObjectStatus state={s.status === 'pass' ? 'Positive' : s.status === 'in_progress' ? 'Critical' : 'None'}>
                {s.status === 'pass' ? 'Validated' : s.status === 'in_progress' ? 'In Progress' : 'Pending'}
              </ObjectStatus>
            </div>
          ))}
        </div>

        <SectionHead title="Validation Checklist" />
        <div style={{ marginTop: sp.m, marginBottom: sp.m, padding: sp.m, background: 'var(--sapTile_Background)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', boxShadow: 'var(--sapContent_Shadow0)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp.m }}>
            <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>Overall Status</span>
            <ObjectStatus state="Critical">Validation In Progress</ObjectStatus>
          </div>
          {checks.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: sp.m, paddingTop: sp.s, paddingBottom: sp.s, borderBottom: i < checks.length - 1 ? '1px solid var(--sapList_BorderColor)' : 'none' }}>
              <Icon name={c.pass ? 'accept' : 'pending'} style={{ width: '1rem', height: '1rem', color: c.pass ? 'var(--sapPositiveColor)' : 'var(--sapCriticalColor)', flexShrink: 0 }} />
              <span style={{ flex: 1, fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', color: 'var(--sapTextColor)' }}>{c.label}</span>
              <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{c.detail}</span>
            </div>
          ))}
        </div>
        <MessageStrip design="Information" hideCloseButton>
          Once all validations pass, this pack will be marked "Validated for Reuse" and promoted to v1.1.
        </MessageStrip>
      </div>
    </DynamicPage>
  );
}

// ─── View: Reusable Learnings ─────────────────────────────────────────────────
function ReusableLearningsView({ nav }: { nav: (v: View) => void }) {
  const [learnings, setLearnings] = useState(REUSABLE_LEARNINGS_DATA.map(l => ({ ...l })));
  const [toastMsg, setToastMsg] = useState('');
  const [toastOpen, setToastOpen] = useState(false);
  const proposedCount = learnings.filter(l => l.proposed && l.action === 'propose').length;
  const rejectedCount = learnings.filter(l => l.proposed && l.action === 'reject').length;
  const anyProposed = learnings.some(l => l.proposed && l.action === 'propose');

  const handleAction = useCallback((id: number, action: string) => {
    setLearnings(prev => prev.map(l => l.id === id ? { ...l, proposed: true } : l));
    if (action === 'propose') {
      setToastMsg('Learning proposed for Collections & Disputes v1.1');
    } else {
      setToastMsg('Marked customer-specific — will not be reused');
    }
    setToastOpen(true);
  }, []);

  return (
    <DynamicPage
      style={{ flex: 1, overflow: 'hidden', '--ui5_dynamic_page_background': 'var(--sapObjectHeader_Background)' } as React.CSSProperties}
      headerTitle={
        <DynamicPageTitle style={{ paddingLeft: sp.m }}>
          <Title slot="heading" level="H3" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>Reusable Learnings</Title>
          <Text slot="subheading" style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)' }}>
            Capture what works and what is customer-specific. Reusable learnings improve the Experiment Pack for the next customer.
          </Text>
        </DynamicPageTitle>
      }
      headerContent={
        <DynamicPageHeader>
          <div style={{ paddingTop: sp.m, paddingBottom: sp.m, paddingLeft: sp.g, paddingRight: sp.g }}>
            <FlexBox wrap="Wrap" style={{ gap: sp.m }}>
              <KpiTile label="Learnings Captured" value={String(learnings.length)} />
              <KpiTile label="Proposed for Pack" value={String(proposedCount)} />
              <KpiTile label="Customer-Specific" value={String(rejectedCount)} />
              <KpiTile label="Pack Updates Pending" value={anyProposed ? '1' : '0'} />
            </FlexBox>
          </div>
        </DynamicPageHeader>
      }
    >
      <div style={{ paddingTop: sp.m, paddingBottom: sp.l, paddingLeft: sp.g, paddingRight: sp.g }}>
        <Toast open={toastOpen} duration={3000} placement="BottomCenter" onClose={() => setToastOpen(false)}>{toastMsg}</Toast>

        <MessageStrip design="Information" hideCloseButton style={{ marginBottom: sp.m }}>
          Illustrative Demo Learnings — These examples are for demonstration purposes. In production, learnings are captured from real experiment outcomes and customer reviews.
        </MessageStrip>

        {anyProposed && (
          <MessageStrip design="Positive" hideCloseButton style={{ marginBottom: sp.m }}>
            {proposedCount} learning{proposedCount > 1 ? 's' : ''} proposed → Creates Collections & Disputes v1.1 Draft.
            <Button design="Transparent" onClick={() => nav('packVersions')} style={{ marginLeft: sp.s }}>View Pack Versions →</Button>
          </MessageStrip>
        )}

        <SectionHead title="Learning Candidates" />
        <div style={{ marginTop: sp.m }}>
          {learnings.map((l, i) => (
            <div key={l.id} style={{ padding: sp.m, background: 'var(--sapTile_Background)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', boxShadow: 'var(--sapContent_Shadow0)', marginBottom: sp.s, border: l.proposed ? `1px solid ${l.action === 'propose' ? 'var(--sapPositiveColor)' : 'var(--sapNeutralColor, #ccc)'}` : '1px solid var(--sapList_BorderColor)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: sp.s, marginBottom: sp.s, flexWrap: 'wrap' }}>
                <Tag design="Set1" colorScheme={learningCategoryColor(l.category)}>{l.category}</Tag>
                <Tag design="Set2" colorScheme="5">{l.scope}</Tag>
                {l.customerSpecific && <Tag design="Set2" colorScheme="8">Customer-Specific</Tag>}
                <Tag design={l.confidence === 'High' ? 'Positive' : 'Set2'} colorScheme={l.confidence === 'High' ? undefined : '1'}>{l.confidence} Confidence</Tag>
                {l.proposed && (
                  <ObjectStatus state={l.action === 'propose' ? 'Positive' : 'None'}>
                    {l.action === 'propose' ? '✓ Proposed for Pack' : '✓ Marked Customer-Specific'}
                  </ObjectStatus>
                )}
              </div>
              <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: sp.xs }}>{l.learning}</span>
              <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', marginBottom: sp.m }}>Evidence: {l.evidence}</span>
              {!l.proposed && (
                <div style={{ display: 'flex', gap: sp.s }}>
                  {l.action === 'propose' ? (
                    <Button design="Emphasized" onClick={() => handleAction(l.id, 'propose')}>Propose for Pack</Button>
                  ) : (
                    <Button design="Transparent" onClick={() => handleAction(l.id, 'reject')}>Mark Customer-Specific — Do Not Reuse</Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DynamicPage>
  );
}

// ─── View: Pack Versions ──────────────────────────────────────────────────────
function PackVersionsView({ nav }: { nav: (v: View) => void }) {
  const [v11Status, setV11Status] = useState<'Draft' | 'Domain Review' | 'Validated' | 'Published'>('Draft');
  const [toastMsg, setToastMsg] = useState('');
  const [toastOpen, setToastOpen] = useState(false);

  const advance = () => {
    if (v11Status === 'Draft') { setV11Status('Domain Review'); setToastMsg('Submitted for domain review'); }
    else if (v11Status === 'Domain Review') { setV11Status('Validated'); setToastMsg('Pack v1.1 validated'); }
    else if (v11Status === 'Validated') { setV11Status('Published'); setToastMsg('Pack v1.1 published — next customer starts further ahead'); }
    setToastOpen(true);
  };

  const v11StateColor = v11Status === 'Published' || v11Status === 'Validated' ? 'Positive' : v11Status === 'Domain Review' ? 'Critical' : 'None';

  return (
    <DynamicPage
      style={{ flex: 1, overflow: 'hidden', '--ui5_dynamic_page_background': 'var(--sapObjectHeader_Background)' } as React.CSSProperties}
      headerTitle={
        <DynamicPageTitle style={{ paddingLeft: sp.m }}>
          <Title slot="heading" level="H3" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>Pack Versions — Collections & Disputes</Title>
          <Text slot="subheading" style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)' }}>
            Version history and proposed updates. Reusable learnings improve the pack for the next customer.
          </Text>
        </DynamicPageTitle>
      }
    >
      <div style={{ paddingTop: sp.m, paddingBottom: sp.l, paddingLeft: sp.g, paddingRight: sp.g }}>
        <Toast open={toastOpen} duration={3000} placement="BottomCenter" onClose={() => setToastOpen(false)}>{toastMsg}</Toast>

        <SectionHead title="Active Versions" />
        <div style={{ marginTop: sp.m, marginBottom: sp.l, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.m }}>
          {/* v1.0 */}
          <div style={{ padding: sp.m, background: 'var(--sapTile_Background)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', boxShadow: 'var(--sapContent_Shadow0)', borderTop: '3px solid var(--sapPositiveColor)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp.s }}>
              <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: '2rem', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>v1.0</span>
              <ObjectStatus state="Positive">Validated</ObjectStatus>
            </div>
            <div style={{ marginBottom: sp.m }}>
              {[['Domain', 'AR / Collections'], ['Schema Entities', '6'], ['Quality Checks', '8'], ['Experiment Runs', '4'], ['Last Validated', 'Q3 2025 (demo)']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', paddingTop: sp.xs, paddingBottom: sp.xs, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{k}</span>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{v}</span>
                </div>
              ))}
            </div>
            <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapPositiveColor)', marginBottom: sp.m }}>This is the current reusable version. New customers start here.</span>
            <Button design="Transparent" onClick={() => nav('packDetail')}>Open v1.0</Button>
          </div>
          {/* v1.1 */}
          <div style={{ padding: sp.m, background: 'var(--sapTile_Background)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', boxShadow: 'var(--sapContent_Shadow0)', borderTop: `3px solid ${v11Status === 'Validated' || v11Status === 'Published' ? 'var(--sapPositiveColor)' : v11Status === 'Domain Review' ? 'var(--sapCriticalColor)' : 'var(--sapNeutralColor, #aaa)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp.s }}>
              <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: '2rem', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>v1.1</span>
              <ObjectStatus state={v11StateColor}>{v11Status}</ObjectStatus>
            </div>
            <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: sp.xs }}>Proposed Changes:</span>
            <div style={{ marginBottom: sp.m }}>
              {['+ Add historical late-payment count as candidate feature', '+ Add relationship quality check (Prior Late Payments → Late Payment)', '+ Update evaluation guidance: Recall over Precision for collections'].map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: sp.s, paddingTop: sp.xs }}>
                  <Icon name="add" style={{ width: '0.875rem', height: '0.875rem', color: 'var(--sapPositiveColor)', flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{c}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: `${sp.xs} ${sp.s}`, background: 'var(--sapPositiveBackground, #f5fae5)', border: '1px solid var(--sapPositiveColor)', borderRadius: '0.375rem', marginBottom: sp.m }}>
              <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapPositiveColor)' }}>Customer transactional records copied: NO</span>
            </div>
            <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', marginBottom: sp.m }}>Source: Northstar Manufacturing experiment (Run 003)</span>
            {v11Status !== 'Published' && (
              <Button design="Emphasized" onClick={advance}>
                {v11Status === 'Draft' ? 'Submit for Domain Review' : v11Status === 'Domain Review' ? 'Validate' : 'Publish'}
              </Button>
            )}
            {v11Status === 'Published' && <ObjectStatus state="Positive">Published — Available for Next Customer</ObjectStatus>}
          </div>
        </div>

        {/* Version Comparison */}
        <SectionHead title="Version Comparison" />
        <div style={{ marginTop: sp.m, marginBottom: sp.l, overflowX: 'auto' }}>
          <Table headerRow={<TableHeaderRow><TableHeaderCell>Feature</TableHeaderCell><TableHeaderCell>v1.0</TableHeaderCell><TableHeaderCell>v1.1</TableHeaderCell></TableHeaderRow>}>
            {[
              ['Schema Entities', '6', '6'],
              ['Candidate Features', '5', '6 (+1)'],
              ['Quality Checks', '8', '9 (+1)'],
              ['Experiment Baselines', '4', '5 (+1)'],
              ['Validation Status', 'Validated', v11Status],
              ['Customer Data Included', 'No', 'No'],
            ].map(([feat, v10, v11], i) => (
              <TableRow key={i} rowKey={String(i)}>
                <TableCell><Text>{feat}</Text></TableCell>
                <TableCell><Text>{v10}</Text></TableCell>
                <TableCell><span style={{ fontFamily: 'var(--sapFontFamily)', color: v11.includes('+') ? 'var(--sapPositiveColor)' : 'var(--sapTextColor)', fontWeight: v11.includes('+') ? 'var(--sapFontBoldWeight)' : 'normal' }}>{v11}</span></TableCell>
              </TableRow>
            ))}
          </Table>
        </div>

        {/* Flywheel proof */}
        <SectionHead title="Flywheel — Why This Matters" />
        <div style={{ marginTop: sp.m, display: 'flex', gap: sp.m, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, padding: sp.m, background: 'var(--sapTile_Background)', border: '1px solid var(--sapList_BorderColor)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)' }}>
            <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: sp.s }}>First Customer (Northstar)</span>
            {['Collections Pack v1.0', 'L3 Experiment Data generated', '4 Experiment Runs', '1 Validated Learning proposed'].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: sp.xs, paddingTop: sp.xs }}>
                <Icon name="accept" style={{ width: '0.875rem', height: '0.875rem', color: 'var(--sapPositiveColor)', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: sp.xs }}>
            <Icon name="navigation-right-arrow" style={{ width: '2rem', height: '2rem', color: 'var(--sapBrandColor)' }} />
            <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapBrandColor)', fontWeight: 'var(--sapFontBoldWeight)' }}>Flywheel</span>
          </div>
          <div style={{ flex: 1, minWidth: 200, padding: sp.m, background: 'var(--sapHighlightBackground, #e8f4fd)', border: '1px solid var(--sapBrandColor)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)' }}>
            <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapBrandColor)', marginBottom: sp.s }}>Next Customer</span>
            {['Collections Pack v1.1 — starts further ahead', 'Historical late-payment count already a candidate feature', '1 extra quality check included', 'Better evaluation guidance (Recall over Precision)'].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: sp.xs, paddingTop: sp.xs }}>
                <Icon name="accept" style={{ width: '0.875rem', height: '0.875rem', color: 'var(--sapBrandColor)', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: sp.m, textAlign: 'center', padding: sp.m }}>
          <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontLargeSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapBrandColor)' }}>Every engagement makes the next one faster.</span>
        </div>
      </div>
    </DynamicPage>
  );
}
const SyntheticDataAcceleratorPage: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('overview');
  const [packInitialTab, setPackInitialTab] = useState<string>('definition');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverOpener, setPopoverOpener] = useState<HTMLElement | null>(null);

  const nav = useCallback((v: View) => setActiveView(v), []);

  // Navigate to packDetail and open a specific tab
  const navToPackTab = useCallback((tab: string) => {
    setPackInitialTab(tab);
    setActiveView('packDetail');
  }, []);

  // Sidebar nav handler — Data Readiness and Experiments deep-link into pack tabs
  const handleSideNav = useCallback((key: string) => {
    if (key === 'dataReadiness') { navToPackTab('dataReadiness'); return; }
    if (key === 'experiments') { navToPackTab('experiments'); return; }
    nav(key as View);
  }, [nav, navToPackTab]);

  return (
    <ThemeProvider>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--sapBackgroundColor)' }}>

        {/* Shell */}
        <ShellBar
          primaryTitle="SAP Enterprise Experiment Accelerator"
          secondaryTitle={NAV_LABELS[activeView] || ''}
          logo={
            <img
              src="https://www.sap.com/dam/application/shared/logos/sap-logo-svg.svg/sap-logo-svg.svg"
              alt="SAP"
              style={{ height: 28 }}
            />
          }
          profile={
            <Avatar slot="profile" colorScheme="Accent6" shape="Circle" size="XS" initials="AK" accessibleName="Alex Kumar — profile" />
          }
          onProfileClick={(e) => {
            setPopoverOpener(e.detail.targetRef as HTMLElement);
            setPopoverOpen(true);
          }}
        />
        <ResponsivePopover
          open={popoverOpen}
          opener={popoverOpener ?? undefined}
          placement="Bottom"
          onClose={() => setPopoverOpen(false)}
        >
          <List>
            <ListItemStandard icon="person-placeholder">Alex Kumar</ListItemStandard>
            <ListItemStandard icon="action-settings">Settings</ListItemStandard>
            <ListItemStandard icon="log">Sign Out</ListItemStandard>
          </List>
        </ResponsivePopover>

        {/* Body: sidebar + content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Sidebar */}
          <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid var(--sapList_BorderColor)', overflowY: 'auto' }}>
            <SideNavigation
              collapsed={false}
              onSelectionChange={(e) => {
                const key = e.detail.item.getAttribute('data-key') as string;
                if (key) handleSideNav(key);
              }}
            >
              <SideNavigationItem data-key="overview" text="Overview" icon="home" selected={activeView === 'overview'} />
              <SideNavigationItem data-key="packs" text="Experiment Packs" icon="course-book" selected={activeView === 'packs' || activeView === 'packDetail'} />
              <SideNavigationItem data-key="dataReadiness" text="Data Readiness" icon="add-document" selected={activeView === 'dataReadiness'} />
              <SideNavigationItem data-key="experiments" text="Experiments" icon="activities" selected={activeView === 'experiments'} />
              <SideNavigationItem data-key="evaluation" text="Evaluation" icon="chart-bar-basic" selected={activeView === 'evaluation'} />
              <SideNavigationItem data-key="validation" text="Validation" icon="approvals" selected={activeView === 'validation'} />
              <SideNavigationItem data-key="learnings" text="Reusable Learnings" icon="learning-assistant" selected={activeView === 'learnings'} />
              <SideNavigationItem data-key="packVersions" text="Pack Versions" icon="versions" selected={activeView === 'packVersions'} />
            </SideNavigation>
          </div>

          {/* Main content */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activeView === 'overview' && <OverviewView nav={nav} navToPackTab={navToPackTab} />}
            {activeView === 'packs' && <PacksView nav={nav} />}
            {activeView === 'packDetail' && <PackDetailView nav={nav} initialTab={packInitialTab} />}
            {activeView === 'dataReadiness' && <DataReadinessView nav={nav} />}
            {activeView === 'experiments' && <ExperimentsView nav={nav} />}
            {activeView === 'evaluation' && <EvaluationView nav={nav} />}
            {activeView === 'validation' && <ValidationView nav={nav} />}
            {activeView === 'learnings' && <ReusableLearningsView nav={nav} />}
            {activeView === 'packVersions' && <PackVersionsView nav={nav} />}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default SyntheticDataAcceleratorPage;
