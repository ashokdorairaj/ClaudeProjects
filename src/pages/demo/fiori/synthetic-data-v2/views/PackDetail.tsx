// @ts-nocheck
import React, { useState } from 'react';
import {
  DynamicPage, DynamicPageTitle, DynamicPageHeader,
  Title, Text, Button, Breadcrumbs, BreadcrumbsItem,
  TabContainer, Tab, ObjectStatus, Tag, FlexBox, MessageStrip,
  Icon, Table, TableHeaderRow, TableHeaderCell, TableRow, TableCell,
} from '@ui5/webcomponents-react';
import type { SyntheticView } from '../types';
import { SP, COLLECTIONS_PACK, FIDELITY_LEVELS, PACK_EXPERIMENT_PATTERNS, FIELD_ACCESS_MAPPINGS, getDataAccessSummary, getFieldAccess } from '../constants';
import EntityGraph from '../components/EntityGraph';
import KpiTile from '../components/KpiTile';

interface Props {
  nav: (v: SyntheticView) => void;
}

// ─── Schema field definitions per entity ──────────────────────────────────────
const ENTITY_SCHEMA: Record<string, Array<{ field: string; meaning: string; type: string; key: string; required: boolean; customerExt: boolean; source: string }>> = {
  'Business Partner': [
    { field: 'business_partner_id', meaning: 'Unique customer identifier', type: 'String(10)', key: 'PK', required: true, customerExt: false, source: 'BP_MASTER' },
    { field: 'country', meaning: 'Country of domicile', type: 'String(3)', key: '—', required: true, customerExt: false, source: 'BP_MASTER' },
    { field: 'industry', meaning: 'Industry classification', type: 'String(4)', key: '—', required: true, customerExt: false, source: 'BP_MASTER' },
    { field: 'customer_since', meaning: 'Date customer relationship began', type: 'Date', key: '—', required: true, customerExt: false, source: 'BP_MASTER' },
    { field: 'credit_segment', meaning: 'Credit classification (A–D)', type: 'Enum', key: '—', required: true, customerExt: false, source: 'AR_CREDIT' },
    { field: 'risk_segment', meaning: 'Collections risk tier', type: 'Enum', key: '—', required: true, customerExt: false, source: 'AR_CREDIT' },
    { field: 'annual_revenue', meaning: 'Annual revenue (EUR)', type: 'Decimal', key: '—', required: false, customerExt: false, source: 'BP_MASTER' },
    { field: 'historical_late_payments', meaning: 'Count of past late payments', type: 'Integer', key: '—', required: false, customerExt: false, source: 'Derived' },
    { field: 'ZZ_RISK_CATEGORY', meaning: 'Customer risk category (extension)', type: 'String(2)', key: '—', required: false, customerExt: true, source: 'Customer Z-field' },
    { field: 'ZZ_PAYMENT_CHANNEL', meaning: 'Preferred payment channel', type: 'String(3)', key: '—', required: false, customerExt: true, source: 'Customer Z-field' },
  ],
  'Receivable': [
    { field: 'receivable_id', meaning: 'Unique receivable identifier', type: 'String(10)', key: 'PK', required: true, customerExt: false, source: 'FI_DOCUMENT' },
    { field: 'business_partner_id', meaning: 'Customer reference', type: 'String(10)', key: 'FK→BP', required: true, customerExt: false, source: 'FI_DOCUMENT' },
    { field: 'invoice_date', meaning: 'Date invoice was issued', type: 'Date', key: '—', required: true, customerExt: false, source: 'FI_DOCUMENT' },
    { field: 'due_date', meaning: 'Payment due date', type: 'Date', key: '—', required: true, customerExt: false, source: 'FI_DOCUMENT' },
    { field: 'invoice_amount', meaning: 'Total invoice amount', type: 'Decimal', key: '—', required: true, customerExt: false, source: 'FI_DOCUMENT' },
    { field: 'open_amount', meaning: 'Remaining unpaid amount', type: 'Decimal', key: '—', required: true, customerExt: false, source: 'FI_DOCUMENT' },
    { field: 'payment_terms_days', meaning: 'Standard payment terms in days', type: 'Integer', key: '—', required: true, customerExt: false, source: 'AR_CONFIG' },
    { field: 'clearing_status', meaning: 'OPEN / CLEARED / PARTIAL', type: 'Enum', key: '—', required: true, customerExt: false, source: 'FI_DOCUMENT' },
    { field: 'late_payment_flag', meaning: 'Target — was this paid late?', type: 'Boolean', key: 'Target', required: false, customerExt: false, source: 'Derived' },
  ],
  'Payment': [
    { field: 'payment_id', meaning: 'Payment clearing document', type: 'String(10)', key: 'PK', required: true, customerExt: false, source: 'FI_PAYMENT' },
    { field: 'receivable_id', meaning: 'Cleared receivable', type: 'String(10)', key: 'FK→Recv', required: true, customerExt: false, source: 'FI_PAYMENT' },
    { field: 'payment_date', meaning: 'Date payment was received', type: 'Date', key: '—', required: true, customerExt: false, source: 'FI_PAYMENT' },
    { field: 'payment_amount', meaning: 'Amount received', type: 'Decimal', key: '—', required: true, customerExt: false, source: 'FI_PAYMENT' },
    { field: 'payment_method', meaning: 'Payment channel used', type: 'String', key: '—', required: false, customerExt: false, source: 'FI_PAYMENT' },
  ],
  'Dunning': [
    { field: 'dunning_id', meaning: 'Dunning notice ID', type: 'String(10)', key: 'PK', required: true, customerExt: false, source: 'DUNNING_HDR' },
    { field: 'receivable_id', meaning: 'Overdue receivable', type: 'String(10)', key: 'FK→Recv', required: true, customerExt: false, source: 'DUNNING_HDR' },
    { field: 'dunning_date', meaning: 'Date notice sent (≥ due date)', type: 'Date', key: '—', required: true, customerExt: false, source: 'DUNNING_HDR' },
    { field: 'dunning_level', meaning: 'Escalation level 1–3', type: 'Integer', key: '—', required: true, customerExt: false, source: 'DUNNING_HDR' },
    { field: 'dunning_amount', meaning: 'Amount subject to dunning', type: 'Decimal', key: '—', required: true, customerExt: false, source: 'DUNNING_HDR' },
  ],
  'Dispute': [
    { field: 'dispute_id', meaning: 'Dispute case GUID', type: 'String(32)', key: 'PK', required: true, customerExt: false, source: 'DISPUTE_CASE' },
    { field: 'receivable_id', meaning: 'Disputed receivable', type: 'String(10)', key: 'FK→Recv', required: true, customerExt: false, source: 'DISPUTE_CASE' },
    { field: 'dispute_reason', meaning: 'Reason code for dispute', type: 'String', key: '—', required: true, customerExt: false, source: 'DISPUTE_CASE' },
    { field: 'dispute_amount', meaning: 'Amount in dispute (≤ invoice)', type: 'Decimal', key: '—', required: true, customerExt: false, source: 'DISPUTE_CASE' },
    { field: 'dispute_status', meaning: 'OPEN / RESOLVED / WITHDRAWN', type: 'Enum', key: '—', required: true, customerExt: false, source: 'DISPUTE_CASE' },
  ],
  'Collection History': [
    { field: 'collection_history_id', meaning: 'History record ID', type: 'String(10)', key: 'PK', required: true, customerExt: true, source: 'COLL_HISTORY (ext)' },
    { field: 'business_partner_id', meaning: 'Customer (customer-level)', type: 'String(10)', key: 'FK→BP', required: true, customerExt: true, source: 'COLL_HISTORY (ext)' },
    { field: 'contact_date', meaning: 'Date of contact', type: 'Date', key: '—', required: true, customerExt: true, source: 'COLL_HISTORY (ext)' },
    { field: 'contact_type', meaning: 'EMAIL / PHONE / LETTER / VISIT', type: 'Enum', key: '—', required: true, customerExt: true, source: 'COLL_HISTORY (ext)' },
    { field: 'promise_to_pay', meaning: 'Customer promised payment', type: 'Boolean', key: '—', required: false, customerExt: true, source: 'COLL_HISTORY (ext)' },
  ],
};

const ENTITY_RELATIONSHIPS: Record<string, string[]> = {
  'Business Partner': ['Business Partner 1:N Receivable', 'Business Partner 1:N Collection History'],
  'Receivable': ['Receivable N:1 Business Partner', 'Receivable 1:N Payment', 'Receivable 1:N Dunning', 'Receivable 1:N Dispute'],
  'Payment': ['Payment N:1 Receivable'],
  'Dunning': ['Dunning N:1 Receivable'],
  'Dispute': ['Dispute N:1 Receivable'],
  'Collection History': ['Collection History N:1 Business Partner'],
};

const ENTITY_QUALITY_RULES: Record<string, string[]> = {
  'Business Partner': ['Business Partner must have at least one Receivable (1:N enforced)', 'credit_segment must be A, B, C, or D'],
  'Receivable': ['invoice_date ≤ due_date (enforced)', 'open_amount ≤ invoice_amount (enforced)', 'late_payment_flag derived from payment_date vs due_date'],
  'Payment': ['payment_amount ≤ invoice_amount of linked receivable', 'payment_date must be a valid date', 'Clears only OPEN or PARTIAL receivables'],
  'Dunning': ['dunning_date must be ≥ due_date of linked receivable (enforced)', 'Only overdue open items generate dunning'],
  'Dispute': ['dispute_amount ≤ invoice_amount of linked receivable (enforced)', 'Dispute must reference a valid Receivable'],
  'Collection History': ['collection_history_id linked to Business Partner, not Receivable', 'contact_date must be a valid date'],
};

const SAMPLE_DATA: Record<string, Array<Record<string, string>>> = {
  'Business Partner': [
    { business_partner_id: '0000001001', country: 'DE', industry: 'CHEM', customer_since: '2018-03-15', credit_segment: 'B', risk_segment: 'MEDIUM', annual_revenue: '2,400,000', ZZ_RISK_CATEGORY: 'M2', ZZ_PAYMENT_CHANNEL: 'TRF' },
    { business_partner_id: '0000001002', country: 'US', industry: 'MFGR', customer_since: '2020-07-01', credit_segment: 'A', risk_segment: 'LOW', annual_revenue: '8,900,000', ZZ_RISK_CATEGORY: 'L1', ZZ_PAYMENT_CHANNEL: 'CHK' },
  ],
  'Receivable': [
    { receivable_id: '5100000001', business_partner_id: '0000001001', invoice_date: '2025-06-01', due_date: '2025-07-01', invoice_amount: '12,450.00', open_amount: '12,450.00', payment_terms_days: '30', clearing_status: 'OPEN', late_payment_flag: 'false' },
    { receivable_id: '5100000002', business_partner_id: '0000001001', invoice_date: '2025-05-15', due_date: '2025-06-14', invoice_amount: '8,920.00', open_amount: '0.00', payment_terms_days: '30', clearing_status: 'CLEARED', late_payment_flag: 'true' },
  ],
};

const PackDetail: React.FC<Props> = ({ nav }) => {
  const [activeTab, setActiveTab] = useState('experiments');
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState('fields');
  const [expandedAccessRow, setExpandedAccessRow] = useState<string | null>(null);

  const drawerTabs = ['Fields', 'Relationships', 'Sample Data', 'Quality Rules', 'Source & Access'];
  const entityFields = selectedEntity ? (ENTITY_SCHEMA[selectedEntity] || []) : [];
  const accessSummary = getDataAccessSummary();

  return (
    <DynamicPage
      style={{ flex: 1, overflow: 'hidden', '--ui5_dynamic_page_background': 'var(--sapObjectHeader_Background)' } as React.CSSProperties}
      headerTitle={
        <DynamicPageTitle style={{ paddingLeft: SP.m }}>
          <div slot="breadcrumbs">
            <Breadcrumbs>
              <BreadcrumbsItem onClick={() => nav('dashboard')}>Overview</BreadcrumbsItem>
              <BreadcrumbsItem>Collections &amp; Disputes</BreadcrumbsItem>
            </Breadcrumbs>
          </div>
          <Title slot="heading" level="H3" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>
            Collections &amp; Disputes
          </Title>
          <div slot="subheading" style={{ display: 'flex', alignItems: 'center', gap: SP.s }}>
            <ObjectStatus state="Positive">Validated v1.0</ObjectStatus>
            <Text style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)' }}>
              FSCM + S/4 AR · 6 entities · L1–L4 · Northstar Manufacturing experiment active
            </Text>
          </div>
          <div slot="actionsBar" style={{ display: 'flex', gap: SP.s, flexShrink: 0 }}>
            <Button design="Emphasized" icon="experiment" onClick={() => nav('experimentCreate')}>Create Experiment</Button>
            <Button design="Transparent" icon="add-document" onClick={() => nav('generate')}>Generate Dataset</Button>
          </div>
        </DynamicPageTitle>
      }
      headerContent={
        <DynamicPageHeader>
          <div style={{ paddingTop: SP.m, paddingBottom: SP.m, paddingLeft: SP.g, paddingRight: SP.g }}>
            <FlexBox wrap="Wrap" style={{ gap: SP.m }}>
              <KpiTile label="Entities" value="6" />
              <KpiTile label="Fidelity Levels" value="L1–L4" />
              <KpiTile label="Business Constraints" value="12" />
              <KpiTile label="Experiment Targets" value="4" />
            </FlexBox>
          </div>
        </DynamicPageHeader>
      }
    >
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        {/* Main content */}
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: SP.m, paddingBottom: SP.l, paddingLeft: SP.g, paddingRight: SP.g }}>
          <TabContainer onTabSelect={(e) => setActiveTab(e.detail.tab.getAttribute('data-key'))}>

            {/* ── Tab 0: Supported Experiments ───────────────────────────── */}
            <Tab text="Supported Experiments" icon="activities" data-key="experiments" selected={activeTab === 'experiments'}>
              <div style={{ paddingTop: SP.m }}>
                <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginBottom: SP.l }}>
                  Business questions and experiment patterns this Pack is designed to support. Select a pattern when starting your Technical Recommendation.
                </Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: SP.m }}>
                  {PACK_EXPERIMENT_PATTERNS.map(pat => (
                    <div key={pat.id} style={{ background: 'var(--sapTile_Background)', borderRadius: 8, padding: SP.m, boxShadow: 'var(--sapContent_Shadow0)', borderLeft: `4px solid ${pat.validationStatus === 'Validated' ? 'var(--sapPositiveColor)' : 'var(--sapInformationColor)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SP.s }}>
                        <Title level="H5" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>{pat.name}</Title>
                        <ObjectStatus state={pat.validationStatus === 'Validated' ? 'Positive' : 'Information'}>{pat.validationStatus}</ObjectStatus>
                      </div>
                      <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontStyle: 'italic', color: 'var(--sapContent_LabelColor)', display: 'block', marginBottom: SP.s }}>
                        "{pat.businessQuestion}"
                      </Text>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: SP.s, marginBottom: SP.s }}>
                        <div>
                          <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapContent_LabelColor)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Task Type</Text>
                          <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{pat.taskType}</Text>
                        </div>
                        <div>
                          <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapContent_LabelColor)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Target</Text>
                          <code style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--sapTextColor)' }}>{pat.target}</code>
                          <ObjectStatus state={pat.targetStatus === 'Available' ? 'Positive' : 'Information'} style={{ fontSize: '0.75rem', marginLeft: 4 }}>{pat.targetStatus}</ObjectStatus>
                        </div>
                        <div>
                          <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapContent_LabelColor)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recommended Metrics</Text>
                          <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{pat.recommendedMetrics.join(' · ')}</Text>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SP.s }}>
                        <div>
                          <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapContent_LabelColor)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Required Data</Text>
                          {pat.requiredData.map(d => (
                            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 4, paddingBottom: 2 }}>
                              <Icon name="accept" style={{ color: 'var(--sapPositiveColor)', fontSize: '0.8rem' }} />
                              <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{d}</Text>
                            </div>
                          ))}
                        </div>
                        <div>
                          <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapContent_LabelColor)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Candidate Approaches</Text>
                          {pat.candidateApproaches.map(a => (
                            <Text key={a} style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)', display: 'block' }}>{a}</Text>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Tab>

            {/* ── Tab 1: Data Access ─────────────────────────────────────────── */}
            <Tab text="Data Access" icon="connected" data-key="dataaccess" selected={activeTab === 'dataaccess'}>
              <div style={{ paddingTop: SP.m }}>
                <MessageStrip design="Information" hideCloseButton style={{ marginBottom: SP.m }}>
                  <strong>Illustrative mappings only.</strong> All access paths marked "Candidate" require confirmation with the SAP product team or domain expert before production use. No specific API endpoints are specified.
                </MessageStrip>

                {/* Summary tiles */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: SP.m, marginBottom: SP.l }}>
                  {[
                    { label: 'Total Attributes', value: accessSummary.totalRequired, color: 'var(--sapTextColor)' },
                    { label: 'Candidate Mapped', value: accessSummary.candidate, color: 'var(--sapInformationColor)' },
                    { label: 'Customer-Specific', value: accessSummary.customerSpecific, color: 'var(--sapCriticalColor)' },
                    { label: 'Unresolved', value: accessSummary.unresolved, color: 'var(--sapNegativeColor)' },
                  ].map(t => (
                    <div key={t.label} style={{ background: 'var(--sapTile_Background)', borderRadius: 8, padding: SP.m, textAlign: 'center', boxShadow: 'var(--sapContent_Shadow0)' }}>
                      <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: '1.5rem', fontWeight: 'var(--sapFontBoldWeight)', color: t.color, display: 'block' }}>{t.value}</Text>
                      <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{t.label}</Text>
                    </div>
                  ))}
                </div>

                {/* Mapping table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)' }}>
                    <thead>
                      <tr style={{ background: 'var(--sapList_HeaderBackground)', borderBottom: '2px solid var(--sapList_BorderColor)' }}>
                        {['Entity', 'Field', 'Business Meaning', 'SAP Product', 'Access Method', 'Status', ''].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapContent_LabelColor)', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.75rem' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {FIELD_ACCESS_MAPPINGS.map((m, i) => {
                        const isExpanded = expandedAccessRow === m.fieldName;
                        const statusColors: Record<string, string> = {
                          'Validated': 'var(--sapPositiveColor)',
                          'Candidate': 'var(--sapInformationColor)',
                          'Customer-Specific': 'var(--sapCriticalColor)',
                          'Unresolved': 'var(--sapNegativeColor)',
                          'Illustrative': 'var(--sapContent_LabelColor)',
                        };
                        return (
                          <>
                            <tr key={m.fieldName} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--sapList_AlternatingBackground, rgba(0,0,0,0.02))', borderBottom: '1px solid var(--sapList_BorderColor)', cursor: 'pointer' }}
                              onClick={() => setExpandedAccessRow(isExpanded ? null : m.fieldName)}>
                              <td style={{ padding: '7px 12px', color: 'var(--sapContent_LabelColor)' }}>{m.entity}</td>
                              <td style={{ padding: '7px 12px' }}><code style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{m.fieldName}</code></td>
                              <td style={{ padding: '7px 12px', color: 'var(--sapTextColor)' }}>{m.businessMeaning}</td>
                              <td style={{ padding: '7px 12px', color: 'var(--sapContent_LabelColor)' }}>{m.sapProduct}</td>
                              <td style={{ padding: '7px 12px', color: 'var(--sapContent_LabelColor)' }}>{m.accessMethod}</td>
                              <td style={{ padding: '7px 12px' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 'var(--sapFontBoldWeight)', background: `${statusColors[m.status]}22`, color: statusColors[m.status] }}>
                                  {m.status}
                                </span>
                              </td>
                              <td style={{ padding: '7px 12px', color: 'var(--sapHighlightColor)', fontSize: '0.75rem' }}>{isExpanded ? '▲' : '▼'}</td>
                            </tr>
                            {isExpanded && (
                              <tr key={`${m.fieldName}-detail`} style={{ background: 'var(--sapField_Focus_Background, #f0f4ff)', borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                                <td colSpan={7} style={{ padding: '12px 24px' }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: SP.m }}>
                                    {[
                                      ['Source Object', m.sourceObject],
                                      ['API / Service', m.apiService || '—'],
                                      ['Operation', m.operation],
                                      ['Required Filters', m.requiredFilters.length > 0 ? m.requiredFilters.join(', ') : '—'],
                                      ['Customer-Specific', m.customerSpecific ? 'Yes' : 'No'],
                                      ['Notes', m.notes],
                                    ].map(([label, value]) => (
                                      <div key={label}>
                                        <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: '0.75rem', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapContent_LabelColor)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 2 }}>{label}</Text>
                                        <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{value}</Text>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </Tab>

            {/* ── Tab 2: Schema ──────────────────────────────────────────────── */}
            <Tab text="Schema" data-key="graph" selected={activeTab === 'graph'}>
              <div style={{ paddingTop: SP.m }}>
                <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginBottom: SP.m }}>
                  Assistant-specific consumption schema — the curated subset of SAP business data required by the Collections assistant. Click any entity to inspect its fields.
                </Text>
                <EntityGraph onEntityClick={(name: string) => {
                  // Map from EntityGraph key to display name
                  const keyToName: Record<string, string> = {
                    BUSINESS_PARTNER: 'Business Partner', RECEIVABLE: 'Receivable',
                    PAYMENT: 'Payment', DUNNING: 'Dunning', DISPUTE: 'Dispute',
                    Z_COLLECTION_HISTORY: 'Collection History',
                  };
                  const displayName = keyToName[name] || name;
                  setSelectedEntity(displayName); setDrawerTab('fields');
                }} />
                {!selectedEntity && (
                  <MessageStrip design="Information" hideCloseButton style={{ marginTop: SP.m }}>
                    Click any entity in the graph above to open the Schema Inspector with full field details, relationships, sample data, quality rules, and source mapping.
                  </MessageStrip>
                )}
              </div>
            </Tab>

            {/* ── Tab 2: Pack Definition ──────────────────────────────────────── */}
            <Tab text="Pack Definition" data-key="def" selected={activeTab === 'def'}>
              <div style={{ paddingTop: SP.m }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SP.m, marginBottom: SP.l }}>
                  <div style={{ background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)', padding: SP.m }}>
                    <Title level="H5" wrappingType="Normal" style={{ color: 'var(--sapTextColor)', marginBottom: SP.s }}>Business Problem</Title>
                    <Text style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapTextColor)' }}>{COLLECTIONS_PACK.businessProblem}</Text>
                  </div>
                  <div style={{ background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)', padding: SP.m }}>
                    <Title level="H5" wrappingType="Normal" style={{ color: 'var(--sapTextColor)', marginBottom: SP.s }}>SAP Product Mapping</Title>
                    <div style={{ display: 'flex', gap: SP.s, flexWrap: 'wrap', marginBottom: SP.s }}>
                      {COLLECTIONS_PACK.sapProducts.map(p => <Tag key={p} design="Set1" colorScheme="3">{p}</Tag>)}
                    </div>
                    <Text style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)' }}>Schema source: {COLLECTIONS_PACK.schemaSource.join(' · ')}</Text>
                  </div>
                </div>
                <Title level="H5" wrappingType="Normal" style={{ color: 'var(--sapTextColor)', marginBottom: SP.m }}>Fidelity Levels</Title>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SP.m, marginBottom: SP.l }}>
                  {FIDELITY_LEVELS.map(fl => (
                    <div key={fl.level} style={{ borderLeft: `4px solid var(--sap${fl.status}Color)`, borderRadius: 8, overflow: 'hidden', background: 'var(--sapTile_Background)', boxShadow: 'var(--sapContent_Shadow0)', padding: SP.m }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: SP.xs }}>
                        <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>{fl.level} — {fl.title}</span>
                        <ObjectStatus state={fl.status}>{fl.statusLabel}</ObjectStatus>
                      </div>
                      <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginBottom: SP.xs }}>{fl.desc}</Text>
                      <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapBrandColor)' }}>Needs: {fl.dataNeeded} · {fl.estimatedTime}</span>
                    </div>
                  ))}
                </div>
                <Title level="H5" wrappingType="Normal" style={{ color: 'var(--sapTextColor)', marginBottom: SP.m }}>Business Constraints</Title>
                <div style={{ background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)', padding: SP.m, marginBottom: SP.l }}>
                  {COLLECTIONS_PACK.businessConstraints.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: SP.s, paddingTop: SP.xs, paddingBottom: SP.xs, borderBottom: i < COLLECTIONS_PACK.businessConstraints.length - 1 ? '1px solid var(--sapList_BorderColor)' : 'none' }}>
                      <Icon name="accept" style={{ width: '0.875rem', height: '0.875rem', color: 'var(--sapPositiveColor)', flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{c}</span>
                    </div>
                  ))}
                </div>
                <Title level="H5" wrappingType="Normal" style={{ color: 'var(--sapTextColor)', marginBottom: SP.m }}>Experiment Targets</Title>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: SP.m }}>
                  {COLLECTIONS_PACK.experimentTargets.map(t => (
                    <div key={t.name} style={{ background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)', padding: SP.m }}>
                      <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: SP.xs }}>{t.name}</span>
                      <div style={{ display: 'flex', gap: SP.xs }}>
                        <Tag design="Set1" colorScheme="8">target: {t.target}</Tag>
                        <Tag design="Information">{t.type}</Tag>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Tab>

          </TabContainer>
        </div>

        {/* Schema Drawer */}
        {selectedEntity && (
          <div style={{ width: 440, flexShrink: 0, borderLeft: '1px solid var(--sapList_BorderColor)', display: 'flex', flexDirection: 'column', overflowY: 'auto', background: 'var(--sapBackgroundColor)' }}>
            {/* Drawer header */}
            <div style={{ padding: SP.m, borderBottom: '1px solid var(--sapList_BorderColor)', background: 'var(--sapObjectHeader_Background)', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Title level="H5" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>{selectedEntity}</Title>
                  <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginTop: 2 }}>
                    {selectedEntity === 'Business Partner' ? 'Customer master data for the Collections assistant.' :
                     selectedEntity === 'Receivable' ? 'Open or historical customer receivable. Contains the target variable (late_payment_flag).' :
                     selectedEntity === 'Payment' ? 'Incoming payment that clears a receivable.' :
                     selectedEntity === 'Dunning' ? 'Automated dunning notice sent to overdue customers.' :
                     selectedEntity === 'Dispute' ? 'Customer dispute case linked to a receivable.' :
                     'Customer-level collection activity history (customer extension).'}
                  </Text>
                </div>
                <button onClick={() => setSelectedEntity(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sapContent_LabelColor)', fontSize: '1.2rem', lineHeight: 1 }}>✕</button>
              </div>
            </div>
            {/* Drawer tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--sapList_BorderColor)', background: 'var(--sapObjectHeader_Background)', flexShrink: 0, overflowX: 'auto' }}>
              {drawerTabs.map(t => (
                <button key={t} onClick={() => setDrawerTab(t.toLowerCase().replace(/[\s&]+/g, ''))} style={{ padding: `${SP.s} ${SP.m}`, background: 'none', border: 'none', borderBottom: drawerTab === t.toLowerCase().replace(/[\s&]+/g, '') ? '3px solid var(--sapBrandColor)' : '3px solid transparent', cursor: 'pointer', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: drawerTab === t.toLowerCase().replace(/[\s&]+/g, '') ? 'var(--sapFontBoldWeight)' : 'normal', color: drawerTab === t.toLowerCase().replace(/[\s&]+/g, '') ? 'var(--sapBrandColor)' : 'var(--sapTextColor)', whiteSpace: 'nowrap', marginBottom: -1 }}>
                  {t}
                </button>
              ))}
            </div>
            {/* Drawer content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: SP.m }}>

              {drawerTab === 'fields' && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)' }}>
                    <thead>
                      <tr style={{ background: 'var(--sapList_HeaderBackground)' }}>
                        {['Field', 'Business Meaning', 'Type', 'Key', 'Req.', 'Ext.', 'Source'].map(h => (
                          <th key={h} style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid var(--sapList_BorderColor)', color: 'var(--sapContent_LabelColor)', fontWeight: 'var(--sapFontBoldWeight)', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {entityFields.map((f, i) => (
                        <tr key={f.field} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--sapList_AlternatingBackground, rgba(0,0,0,0.02))' }}>
                          <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--sapList_BorderColor)', fontWeight: 'var(--sapFontBoldWeight)', color: f.key === 'Target' ? 'var(--sapBrandColor)' : 'var(--sapTextColor)', whiteSpace: 'nowrap' }}>{f.field}</td>
                          <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--sapList_BorderColor)', color: 'var(--sapTextColor)' }}>{f.meaning}</td>
                          <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--sapList_BorderColor)', color: 'var(--sapContent_LabelColor)', whiteSpace: 'nowrap' }}>{f.type}</td>
                          <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--sapList_BorderColor)', color: f.key !== '—' ? 'var(--sapBrandColor)' : 'var(--sapContent_LabelColor)' }}>{f.key}</td>
                          <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--sapList_BorderColor)', color: f.required ? 'var(--sapPositiveColor)' : 'var(--sapContent_LabelColor)' }}>{f.required ? 'Yes' : 'No'}</td>
                          <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--sapList_BorderColor)', color: f.customerExt ? 'var(--sapCriticalColor)' : 'var(--sapContent_LabelColor)' }}>{f.customerExt ? 'Yes' : 'No'}</td>
                          <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--sapList_BorderColor)', color: 'var(--sapContent_LabelColor)', whiteSpace: 'nowrap' }}>{f.source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {drawerTab === 'relationships' && (
                <div>
                  {(ENTITY_RELATIONSHIPS[selectedEntity] || []).map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: SP.s, padding: SP.s, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                      <Icon name="chain-link" style={{ width: '0.875rem', height: '0.875rem', color: 'var(--sapBrandColor)', flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{r}</span>
                    </div>
                  ))}
                </div>
              )}

              {drawerTab === 'sampledata' && (
                <div>
                  {(SAMPLE_DATA[selectedEntity] || []).length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      {(SAMPLE_DATA[selectedEntity] || []).map((row, i) => (
                        <div key={i} style={{ marginBottom: SP.s, padding: SP.s, background: 'var(--sapTile_Background)', borderRadius: 6, border: '1px solid var(--sapList_BorderColor)' }}>
                          {Object.entries(row).map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', gap: SP.s, paddingTop: 2, paddingBottom: 2 }}>
                              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--sapContent_LabelColor)', minWidth: 140 }}>{k}</span>
                              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--sapTextColor)' }}>{v}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>
                      Generate a dataset to see sample records for this entity.
                    </Text>
                  )}
                </div>
              )}

              {drawerTab === 'qualityrules' && (
                <div>
                  {(ENTITY_QUALITY_RULES[selectedEntity] || []).map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: SP.s, padding: SP.s, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                      <Icon name="accept" style={{ width: '0.875rem', height: '0.875rem', color: 'var(--sapPositiveColor)', flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{r}</span>
                    </div>
                  ))}
                </div>
              )}

              {(drawerTab === 'sourcemapping' || drawerTab === 'sourceaccess') && (
                <div>
                  <MessageStrip design="Information" hideCloseButton style={{ marginBottom: SP.m }}>
                    <strong>Illustrative only.</strong> Access mappings are Candidate status — confirm with SAP product team before production use.
                  </MessageStrip>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)' }}>
                    <thead>
                      <tr style={{ background: 'var(--sapList_HeaderBackground)', borderBottom: '2px solid var(--sapList_BorderColor)' }}>
                        {['Field', 'SAP Source', 'Access Method', 'Status'].map(h => (
                          <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapContent_LabelColor)', fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {entityFields.map((f, i) => {
                        const access = getFieldAccess(f.field);
                        const statusColors: Record<string, string> = { 'Candidate': 'var(--sapInformationColor)', 'Customer-Specific': 'var(--sapCriticalColor)', 'Unresolved': 'var(--sapNegativeColor)', 'Validated': 'var(--sapPositiveColor)' };
                        return (
                          <tr key={f.field} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                            <td style={{ padding: '6px 10px' }}><code style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{f.field}</code></td>
                            <td style={{ padding: '6px 10px', color: 'var(--sapContent_LabelColor)' }}>{access?.sapProduct ?? f.source ?? '—'}</td>
                            <td style={{ padding: '6px 10px', color: 'var(--sapContent_LabelColor)' }}>{access?.accessMethod ?? '—'}</td>
                            <td style={{ padding: '6px 10px' }}>
                              {access ? (
                                <span style={{ display: 'inline-block', padding: '1px 7px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700, background: `${statusColors[access.status] ?? 'var(--sapContent_LabelColor)'}22`, color: statusColors[access.status] ?? 'var(--sapContent_LabelColor)' }}>
                                  {access.status}
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--sapContent_LabelColor)' }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </DynamicPage>
  );
};

export default PackDetail;
