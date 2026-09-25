// @ts-nocheck
import React, { useState, useMemo } from 'react';
import {
  DynamicPage, DynamicPageTitle, DynamicPageHeader,
  Title, Text, Button, TabContainer, Tab, AnalyticalTable,
  MessageStrip, FlexBox, Tag, ObjectStatus, Icon, Toast,
} from '@ui5/webcomponents-react';
import type { SyntheticView, GeneratedDataset } from '../types';
import { SP, FIDELITY_LEVELS } from '../constants';
import KpiTile from '../components/KpiTile';
import { downloadCSV, downloadZip } from '../api';

interface Props {
  nav: (v: SyntheticView) => void;
  dataset: GeneratedDataset | null;
}

const fmt = (n: number) => n.toLocaleString();
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
const fmtAmt = (n: number, currency = 'EUR') => new Intl.NumberFormat('en-DE', { style: 'currency', currency }).format(n);

const DatasetPreview: React.FC<Props> = ({ nav, dataset }) => {
  const [toastMsg, setToastMsg] = useState('');
  const [toastOpen, setToastOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const showToast = (msg: string) => { setToastMsg(msg); setToastOpen(true); };

  const bpCols = useMemo(() => [
    { Header: 'BP ID',         accessor: 'business_partner_id', width: 110 },
    { Header: 'Country',       accessor: 'country',             width: 70 },
    { Header: 'Industry',      accessor: 'industry',            width: 140 },
    { Header: 'Risk Segment',  accessor: 'risk_segment',        width: 110, Cell: ({ value }) => <ObjectStatus state={value === 'HIGH' ? 'Negative' : value === 'MEDIUM' ? 'Critical' : 'Positive'}>{value}</ObjectStatus> },
    { Header: 'Credit',        accessor: 'credit_segment',      width: 70 },
    { Header: 'Late History',  accessor: 'historical_late_payments', width: 100 },
    { Header: 'Payment Ch.',   accessor: 'ZZ_PAYMENT_CHANNEL', width: 120 },
  ], []);

  const recCols = useMemo(() => [
    { Header: 'Receivable ID', accessor: 'receivable_id',     width: 120 },
    { Header: 'BP ID',         accessor: 'business_partner_id', width: 110 },
    { Header: 'Invoice Date',  accessor: 'invoice_date',      width: 110 },
    { Header: 'Due Date',      accessor: 'due_date',          width: 110 },
    { Header: `Amount (${dataset?.config.currency})`, accessor: 'invoice_amount', width: 130, Cell: ({ value }) => fmt(Math.round(value)) },
    { Header: 'Terms (days)',  accessor: 'payment_terms_days', width: 100 },
    { Header: 'Status',        accessor: 'clearing_status',   width: 100, Cell: ({ value }) => <ObjectStatus state={value === 'CLEARED' ? 'Positive' : value === 'OPEN' ? 'Information' : 'Critical'}>{value}</ObjectStatus> },
    { Header: 'Late Flag',     accessor: 'late_payment_flag', width: 90,  Cell: ({ value }) => <ObjectStatus state={value ? 'Negative' : 'Positive'}>{value ? 'Late' : 'On Time'}</ObjectStatus> },
  ], [dataset]);

  const pmtCols = useMemo(() => [
    { Header: 'Payment ID',  accessor: 'payment_id',      width: 120 },
    { Header: 'Receivable',  accessor: 'receivable_id',   width: 120 },
    { Header: 'Date',        accessor: 'payment_date',    width: 110 },
    { Header: 'Amount',      accessor: 'payment_amount',  width: 120, Cell: ({ value }) => fmt(Math.round(value)) },
    { Header: 'Method',      accessor: 'payment_method',  width: 140 },
  ], []);

  const dunnCols = useMemo(() => [
    { Header: 'Dunning ID',  accessor: 'dunning_id',     width: 120 },
    { Header: 'Receivable',  accessor: 'receivable_id',  width: 120 },
    { Header: 'Date',        accessor: 'dunning_date',   width: 110 },
    { Header: 'Level',       accessor: 'dunning_level',  width: 80, Cell: ({ value }) => <Tag design={value === 3 ? 'Negative' : value === 2 ? 'Critical' : 'Information'}>L{value}</Tag> },
    { Header: 'Amount',      accessor: 'dunning_amount', width: 120, Cell: ({ value }) => fmt(Math.round(value)) },
  ], []);

  const dispCols = useMemo(() => [
    { Header: 'Dispute ID',  accessor: 'dispute_id',         width: 120 },
    { Header: 'Receivable',  accessor: 'receivable_id',      width: 120 },
    { Header: 'Open Date',   accessor: 'dispute_open_date',  width: 110 },
    { Header: 'Reason',      accessor: 'dispute_reason',     width: 160 },
    { Header: 'Amount',      accessor: 'dispute_amount',     width: 110, Cell: ({ value }) => fmt(Math.round(value)) },
    { Header: 'Status',      accessor: 'dispute_status',     width: 110, Cell: ({ value }) => <ObjectStatus state={value === 'RESOLVED' ? 'Positive' : value === 'OPEN' ? 'Critical' : 'None'}>{value}</ObjectStatus> },
  ], []);

  const colCols = useMemo(() => [
    { Header: 'Record ID',   accessor: 'collection_history_id', width: 120 },
    { Header: 'BP ID',       accessor: 'business_partner_id',   width: 110 },
    { Header: 'Date',        accessor: 'contact_date',          width: 110 },
    { Header: 'Type',        accessor: 'contact_type',          width: 100 },
    { Header: 'Promise',     accessor: 'promise_to_pay',        width: 90, Cell: ({ value }) => <ObjectStatus state={value ? 'Positive' : 'None'}>{value ? 'Yes' : 'No'}</ObjectStatus> },
    { Header: 'Amount',      accessor: 'promise_amount',        width: 100, Cell: ({ value }) => value ? fmt(Math.round(value)) : '—' },
  ], []);

  if (!dataset) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: SP.l }}>
        <MessageStrip design="Warning" hideCloseButton>
          No dataset generated yet. Go to Generate Data to create your first synthetic dataset.
        </MessageStrip>
      </div>
    );
  }

  const { stats, config } = dataset;
  const levelInfo = FIDELITY_LEVELS.find(f => f.level === config.fidelityLevel);

  const isStatic = !window.location.hostname.includes('localhost') &&
                   !window.location.hostname.includes('127.0.0.1');

  const handleZipDownload = async () => {
    setDownloading(true);
    try {
      await downloadZip(dataset);
      showToast('ZIP downloaded — 6 CSVs + metadata.json');
    } catch (e) {
      showToast('ZIP download failed — try individual CSV downloads');
    }
    setDownloading(false);
  };

  return (
    <DynamicPage
      style={{ flex: 1, overflow: 'hidden', '--ui5_dynamic_page_background': 'var(--sapObjectHeader_Background)' } as React.CSSProperties}
      headerTitle={
        <DynamicPageTitle style={{ paddingLeft: SP.m }}>
          <Title slot="heading" level="H3" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>
            Dataset Preview
          </Title>
          <div slot="subheading" style={{ display: 'flex', alignItems: 'center', gap: SP.s }}>
            <Tag design="Set1" colorScheme="3">{config.fidelityLevel} — {levelInfo?.title}</Tag>
            <Text style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)' }}>
              Collections &amp; Disputes · Northstar Manufacturing · Seed {config.seed}
            </Text>
          </div>
          <div slot="actionsBar" style={{ display: 'flex', gap: SP.s, flexShrink: 0 }}>
            <Button design="Emphasized" icon="quality-issue" onClick={() => nav('quality')}>
              Run Quality Check
            </Button>
            <Button design="Transparent" icon="download" onClick={handleZipDownload} disabled={downloading || isStatic} title={isStatic ? 'ZIP download requires local dev server' : undefined}>
              {isStatic ? 'ZIP (local only)' : downloading ? 'Preparing…' : 'Download ZIP'}
            </Button>
          </div>
        </DynamicPageTitle>
      }
      headerContent={
        <DynamicPageHeader>
          <div style={{ paddingTop: SP.m, paddingBottom: SP.m, paddingLeft: SP.g, paddingRight: SP.g }}>
            <FlexBox wrap="Wrap" style={{ gap: SP.m }}>
              <KpiTile label="Business Partners" value={fmt(stats.totalBP)} />
              <KpiTile label="Receivables" value={fmt(stats.totalReceivables)} />
              <KpiTile label="Late Payment Rate" value={fmtPct(stats.actualLatePaymentRate)} sub={`Target: ${fmtPct(config.latePaymentRate)}`} subColor={Math.abs(stats.actualLatePaymentRate - config.latePaymentRate) <= 0.03 ? 'var(--sapPositiveColor)' : 'var(--sapCriticalColor)'} />
              <KpiTile label="Dispute Rate" value={fmtPct(stats.actualDisputeRate)} sub={`Target: ${fmtPct(config.disputeRate)}`} subColor={Math.abs(stats.actualDisputeRate - config.disputeRate) <= 0.03 ? 'var(--sapPositiveColor)' : 'var(--sapCriticalColor)'} />
            </FlexBox>
          </div>
        </DynamicPageHeader>
      }
    >
      <div style={{ paddingTop: SP.m, paddingBottom: SP.l, paddingLeft: SP.g, paddingRight: SP.g }}>
        <Toast open={toastOpen} duration={3000} placement="BottomCenter" onClose={() => setToastOpen(false)}>{toastMsg}</Toast>

        <MessageStrip design="Information" hideCloseButton style={{ marginBottom: SP.m }}>
          Generated {new Date(dataset.generatedAt).toLocaleString()} · {fmt(stats.totalReceivables)} receivables · Avg invoice {fmtAmt(stats.avgInvoiceAmount, config.currency)} · Median {fmtAmt(stats.medianInvoiceAmount, config.currency)}
        </MessageStrip>

        <TabContainer>
          <Tab text={`Business Partners (${fmt(stats.totalBP)})`}>
            <div style={{ marginTop: SP.m }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: SP.s }}>
                <Button design="Transparent" icon="download" onClick={() => { downloadCSV(dataset.businessPartners as unknown as Record<string, unknown>[], 'business_partners'); showToast('business_partners.csv downloaded'); }}>Download CSV</Button>
              </div>
              <div className="ui5-content-density-compact">
                <AnalyticalTable data={dataset.businessPartners.slice(0, 100)} columns={bpCols} visibleRows={10} scaleWidthMode="Smart" minRows={5} noDataText="No data" />
              </div>
            </div>
          </Tab>

          <Tab text={`Receivables (${fmt(stats.totalReceivables)})`}>
            <div style={{ marginTop: SP.m }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: SP.s }}>
                <Button design="Transparent" icon="download" onClick={() => { downloadCSV(dataset.receivables.slice(0, 1000) as unknown as Record<string, unknown>[], 'receivables'); showToast('receivables.csv downloaded (first 1,000 rows)'); }}>Download CSV</Button>
              </div>
              <div className="ui5-content-density-compact">
                <AnalyticalTable data={dataset.receivables.slice(0, 100)} columns={recCols} visibleRows={10} scaleWidthMode="Smart" minRows={5} noDataText="No data" />
              </div>
            </div>
          </Tab>

          <Tab text={`Payments (${fmt(stats.totalPayments)})`}>
            <div style={{ marginTop: SP.m }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: SP.s }}>
                <Button design="Transparent" icon="download" onClick={() => { downloadCSV(dataset.payments as unknown as Record<string, unknown>[], 'payments'); showToast('payments.csv downloaded'); }}>Download CSV</Button>
              </div>
              <div className="ui5-content-density-compact">
                <AnalyticalTable data={dataset.payments.slice(0, 100)} columns={pmtCols} visibleRows={10} scaleWidthMode="Smart" minRows={5} noDataText="No data" />
              </div>
            </div>
          </Tab>

          <Tab text={`Dunning (${fmt(stats.totalDunning)})`}>
            <div style={{ marginTop: SP.m }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: SP.s }}>
                <Button design="Transparent" icon="download" onClick={() => { downloadCSV(dataset.dunningRecords as unknown as Record<string, unknown>[], 'dunning'); showToast('dunning.csv downloaded'); }}>Download CSV</Button>
              </div>
              <div className="ui5-content-density-compact">
                <AnalyticalTable data={dataset.dunningRecords.slice(0, 100)} columns={dunnCols} visibleRows={10} scaleWidthMode="Smart" minRows={5} noDataText="No dunning records" />
              </div>
            </div>
          </Tab>

          <Tab text={`Disputes (${fmt(stats.totalDisputes)})`}>
            <div style={{ marginTop: SP.m }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: SP.s }}>
                <Button design="Transparent" icon="download" onClick={() => { downloadCSV(dataset.disputes as unknown as Record<string, unknown>[], 'disputes'); showToast('disputes.csv downloaded'); }}>Download CSV</Button>
              </div>
              <div className="ui5-content-density-compact">
                <AnalyticalTable data={dataset.disputes.slice(0, 100)} columns={dispCols} visibleRows={10} scaleWidthMode="Smart" minRows={5} noDataText="No disputes" />
              </div>
            </div>
          </Tab>

          {dataset.collectionHistory.length > 0 && (
            <Tab text={`Collection History (${fmt(stats.totalCollectionHistory)})`}>
              <div style={{ marginTop: SP.m }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: SP.s }}>
                  <Button design="Transparent" icon="download" onClick={() => { downloadCSV(dataset.collectionHistory as unknown as Record<string, unknown>[], 'collection_history'); showToast('collection_history.csv downloaded'); }}>Download CSV</Button>
                </div>
                <div style={{ marginBottom: SP.s }}>
                  <Tag design="Critical">Customer Extension</Tag>
                  <span style={{ marginLeft: SP.s, fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>Z_COLLECTION_HISTORY · L2+ only</span>
                </div>
                <div className="ui5-content-density-compact">
                  <AnalyticalTable data={dataset.collectionHistory.slice(0, 100)} columns={colCols} visibleRows={10} scaleWidthMode="Smart" minRows={5} noDataText="No collection history" />
                </div>
              </div>
            </Tab>
          )}
        </TabContainer>
      </div>
    </DynamicPage>
  );
};

export default DatasetPreview;
