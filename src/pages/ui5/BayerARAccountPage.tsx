import React, { useState, useRef } from 'react';
import {
  ThemeProvider,
  Title,
  Text,
  Button,
  Link,
  Tag,
  FlexBox,
  TabContainer,
  Tab,
  Toast,
  MessageStrip,
  BusyIndicator,
  AnalyticalTable,
  ObjectStatus,
  Avatar,
  List,
  ListItemStandard,
  ResponsivePopover,
  ShellBar,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-react/styles.css';
import '@ui5/webcomponents-icons/dist/AllIcons.js';

// ─── Spacing ─────────────────────────────────────────────────────────────────
const sp = {
  xs: 'var(--sapSpacingXSmallSize, 0.25rem)',
  s:  'var(--sapSpacingSmallSize, 0.5rem)',
  m:  'var(--sapSpacingMediumSize, 1rem)',
  g:  'var(--sapContent_GridGutter, 1.5rem)',
  l:  'var(--sapSpacingLargeSize, 2rem)',
};

// ─── Types ─────────────────────────────────────────────────────────────────
interface InvoiceRow {
  id: string;
  dueDate: string;
  daysOverdue: number;
  amountEUR: number;
  status: 'Overdue' | 'Due Soon' | 'Future' | 'Disputed';
  _highlight: string;
}

interface HistoryEntry {
  id: string;
  timestamp: string;
  actor: string;
  description: string;
  emailLink?: boolean;
}

// ─── Static data ──────────────────────────────────────────────────────────
const KPI_TILES = [
  { label: 'Overdue Invoices',                   value: '1',           unit: '',    negative: true  },
  { label: 'Invoices Due in 7 Days',             value: '3',           unit: '',    negative: false },
  { label: 'Future Due Invoices',                value: '9',           unit: '',    negative: false },
  { label: 'Total Account Items',                value: '13',          unit: '',    negative: false },
  { label: 'Total Value of Overdue Invoices',    value: '93,727.92',   unit: 'EUR', negative: true  },
  { label: 'Total Value of Invoices due in 7 days', value: '8,927',   unit: 'EUR', negative: false },
  { label: 'Total Value of Future Due Invoices', value: '23,019',      unit: 'EUR', negative: false },
  { label: 'Total Account Balance Negative',     value: '59,429',      unit: 'EUR', negative: true  },
  { label: 'Disputes',                           value: '3',           unit: '',    negative: false },
];

const OPEN_ITEMS: InvoiceRow[] = [
  { id: '6044865005', dueDate: '2025-08-05', daysOverdue: 113, amountEUR: 9595.60,  status: 'Overdue',  _highlight: 'var(--sapNegativeColor)' },
  { id: '6044871203', dueDate: '2025-10-14', daysOverdue: 43,  amountEUR: 18200.00, status: 'Overdue',  _highlight: 'var(--sapNegativeColor)' },
  { id: '6044879440', dueDate: '2025-11-28', daysOverdue: 0,   amountEUR: 7430.15,  status: 'Due Soon', _highlight: 'var(--sapCriticalColor)'  },
  { id: '6044882101', dueDate: '2025-12-01', daysOverdue: 0,   amountEUR: 12100.00, status: 'Due Soon', _highlight: 'var(--sapCriticalColor)'  },
  { id: '6044884760', dueDate: '2025-12-10', daysOverdue: 0,   amountEUR: 5840.80,  status: 'Due Soon', _highlight: 'var(--sapCriticalColor)'  },
  { id: '6044891050', dueDate: '2026-01-15', daysOverdue: 0,   amountEUR: 8200.00,  status: 'Future',   _highlight: 'transparent'              },
  { id: '6044897320', dueDate: '2026-02-03', daysOverdue: 0,   amountEUR: 22640.49, status: 'Disputed', _highlight: 'var(--sapInformativeColor)'},
];

const HISTORY: HistoryEntry[] = [
  { id: 'h1', timestamp: 'Dec 6, 2025, 12:00:00 AM',  actor: 'Dan Adams',   description: 'Initial payment missed deadline Follow-up sent', emailLink: true },
  { id: 'h2', timestamp: 'Nov 25, 2025, 2:15:00 AM',  actor: 'Jordan Lee',  description: 'Conditional payment arrangement accepted with strict terms' },
  { id: 'h3', timestamp: 'Nov 23, 2025, 7:30:00 AM',  actor: 'Jordan Lee',  description: 'Customer explained financial difficulties, proposed €50K + remainder arrangement' },
  { id: 'h4', timestamp: 'Nov 19, 2025, 11:00:00 PM', actor: 'Dan Adams',   description: 'CRITICAL escalation email sent - 133 days overdue, €93K', emailLink: true },
  { id: 'h5', timestamp: 'Nov 18, 2025, 1:00:00 AM',  actor: 'Dan Adams',   description: 'Order hold placed on account pending payment' },
  { id: 'h6', timestamp: 'Nov 14, 2025, 11:30:00 PM', actor: 'AI Agent',    description: 'AI Agent flagged for legal escalation - extreme aging' },
];

const STATUS_STATE: Record<string, 'Positive' | 'Negative' | 'Critical' | 'Information' | 'None'> = {
  Overdue:  'Negative',
  'Due Soon': 'Critical',
  Future:   'None',
  Disputed: 'Information',
};

// ─── cardSurface ──────────────────────────────────────────────────────────
const cardSurface: React.CSSProperties = {
  borderRadius: 'var(--sapTile_BorderCornerRadius, 12px)',
  boxShadow: 'var(--sapContent_Shadow0)',
  background: 'var(--sapTile_Background)',
  border: '1px solid var(--sapTile_BorderColor)',
  overflow: 'hidden',
};

// ─── Component ─────────────────────────────────────────────────────────────
const BayerARAccountPage: React.FC = () => {
  const [historyFilter, setHistoryFilter] = useState<'all' | 'calls' | 'emails'>('all');
  const [isLoading, setIsLoading]         = useState(false);
  const [error, setError]                 = useState('');
  const [popoverOpen, setPopoverOpen]     = useState(false);
  const [popoverOpener, setPopoverOpener] = useState<HTMLElement | null>(null);
  const toastRef = useRef<{ show: () => void }>(null);

  const filteredHistory = HISTORY.filter(h => {
    if (historyFilter === 'emails') return h.emailLink;
    return true;
  });

  const invoiceColumns = [
    {
      Header: 'Invoice ID',
      accessor: 'id',
      width: 130,
      Cell: ({ value }: { value: string }) => (
        <Link onClick={() => {}} style={{ fontFamily: 'var(--sapFontFamily)' }}>{value}</Link>
      ),
    },
    {
      Header: 'Due Date',
      accessor: 'dueDate',
      width: 110,
      Cell: ({ value }: { value: string }) => (
        <Text maxLines={1} style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', color: 'var(--sapTextColor)' }}>
          {value}
        </Text>
      ),
    },
    {
      Header: 'Days Overdue',
      accessor: 'daysOverdue',
      width: 110,
      Cell: ({ value }: { value: number }) => (
        <Text maxLines={1} style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', color: value > 0 ? 'var(--sapNegativeColor)' : 'var(--sapContent_LabelColor)', fontWeight: value > 0 ? 'var(--sapFontBoldWeight)' : undefined }}>
          {value > 0 ? `${value} days` : '—'}
        </Text>
      ),
    },
    {
      Header: 'Amount (EUR)',
      accessor: 'amountEUR',
      width: 130,
      Cell: ({ value }: { value: number }) => (
        <Text maxLines={1} style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', color: 'var(--sapTextColor)', fontWeight: 'var(--sapFontBoldWeight)' }}>
          {value.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      Header: 'Status',
      accessor: 'status',
      Cell: ({ value }: { value: string }) => (
        <ObjectStatus state={STATUS_STATE[value] ?? 'None'}>
          {value}
        </ObjectStatus>
      ),
    },
  ];

  return (
    <ThemeProvider>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--sapBackgroundColor)' }}>

        <ShellBar
          logo={<img src="https://www.sap.com/dam/application/shared/logos/sap-logo-svg.svg/sap-logo-svg.svg" alt="SAP" style={{ height: 24 }} />}
          primaryTitle="SAP S/4HANA"
          secondaryTitle="Finance"
          profile={
            <Avatar slot="profile" shape="Circle" size="XS" initials="SB" colorScheme="6" accessibleName="SB — profile" />
          }
          onProfileClick={(e) => {
            setPopoverOpener(e.detail.targetRef as HTMLElement);
            setPopoverOpen(true);
          }}
        >
        </ShellBar>
        <ResponsivePopover
          open={popoverOpen}
          opener={popoverOpener ?? undefined}
          placement="Bottom"
          onClose={() => setPopoverOpen(false)}
        >
          <List>
            <ListItemStandard icon="settings">Settings</ListItemStandard>
            <ListItemStandard icon="log">Sign Out</ListItemStandard>
          </List>
        </ResponsivePopover>

        {/* ── Object Header ──────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--sapObjectHeader_Background)',
          borderBottom: '1px solid var(--sapPageHeader_BorderColor)',
          paddingTop: sp.s,
          paddingBottom: sp.s,
          paddingLeft: 'var(--sapContent_GridGutter, 3rem)',
          paddingRight: 'var(--sapContent_GridGutter, 3rem)',
        }}>
          {/* Breadcrumb */}
          <div style={{ marginBottom: sp.xs }}>
            <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>
              Collection Worklist
            </Text>
            <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', marginLeft: sp.xs, marginRight: sp.xs }}>
              /
            </Text>
            <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>
              Institut Bergonié
            </Text>
          </div>

          {/* Title row */}
          <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ marginBottom: sp.xs }}>
            <Title level="H3" wrappingType="Normal">
              Institut Bergonié
            </Title>
            <FlexBox style={{ gap: sp.s }}>
              <Button design="Transparent" icon="nav-back" tooltip="Previous" />
              <Button design="Transparent" icon="navigation-right-arrow" tooltip="Next" />
              <Button design="Default">Close</Button>
            </FlexBox>
          </FlexBox>

          {/* Subtitle strip */}
          <FlexBox alignItems="Center" style={{ gap: sp.m, flexWrap: 'wrap' }}>
            <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', color: 'var(--sapTextColor)' }}>
              Customer Contact:&nbsp;
              <Link onClick={() => {}} style={{ fontFamily: 'var(--sapFontFamily)' }}>Pierre Moreau</Link>
            </Text>
            <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>|</Text>
            <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', color: 'var(--sapTextColor)' }}>
              Amount in EUR:&nbsp;
              <span style={{ fontWeight: 'var(--sapFontBoldWeight)' }}>93,727.92</span>
            </Text>
            <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>|</Text>
            <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
              <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', color: 'var(--sapTextColor)' }}>Priority:</Text>
              <Tag design="Set1" colorScheme="2" style={{ fontSize: 'var(--sapFontSmallSize)' }}>High</Tag>
            </FlexBox>
          </FlexBox>
        </div>

        {/* ── Error strip ────────────────────────────────────────────────── */}
        {error && (
          <div style={{ paddingLeft: sp.g, paddingRight: sp.g, paddingTop: sp.s }}>
            <MessageStrip design="Negative" onClose={() => setError('')}>{error}</MessageStrip>
          </div>
        )}

        {/* ── Two-column body ────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', minHeight: 0 }}>

          {/* LEFT column */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            paddingTop: sp.m,
            paddingBottom: sp.m,
            paddingLeft: 'var(--sapContent_GridGutter, 3rem)',
            paddingRight: sp.m,
            display: 'flex',
            flexDirection: 'column',
            gap: sp.m,
          }}>

            {/* Summary panel */}
            <div style={cardSurface}>
              <div style={{
                borderBottom: '1px solid var(--sapGroup_TitleBorderColor)',
                paddingLeft: sp.m,
                paddingRight: sp.m,
                paddingTop: sp.s,
                paddingBottom: sp.s,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontLargeSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapGroup_TitleTextColor)' }}>
                  Summary
                </Text>
                <Button design="Transparent" icon="overflow" tooltip="More actions" />
              </div>
              <div style={{ paddingLeft: sp.m, paddingRight: sp.m, paddingTop: sp.m, paddingBottom: sp.m, display: 'flex', flexDirection: 'column', gap: sp.m }}>
                <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', color: 'var(--sapField_TextColor)' }}>
                  Invoice 6044865005 (USD 9,595.60) is 113 days overdue (due 2025-08-05) and the account has USD 59,201.24 in total overdue balances across five invoices. This extreme arrears position (part of total outstanding USD 87,988.04) creates immediate service suspension and legal escalation risk if not resolved within 48–72 hours.
                </Text>
                {/* AI confirmation strip */}
                <div style={{
                  background: 'var(--sapInformationBackground)',
                  borderRadius: 'var(--sapButton_BorderCornerRadius, 4px)',
                  paddingTop: sp.m,
                  paddingBottom: sp.m,
                  paddingLeft: sp.m,
                  paddingRight: sp.m,
                  display: 'flex',
                  alignItems: 'center',
                  gap: sp.s,
                }}>
                  <ObjectStatus state="Positive" style={{ flexShrink: 0 }} />
                  <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', color: 'var(--sapField_TextColor)' }}>
                    Collections outreach email drafted and queued for review.
                  </Text>
                </div>
              </div>
            </div>

            {/* Tabbed details panel */}
            <div style={cardSurface}>
              <TabContainer
                collapsed={false}
                onTabSelect={() => {}}
                style={{ width: '100%' }}
              >
                <Tab text="Summary" selected>
                  {/* 3×3 KPI grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: sp.m,
                    paddingTop: sp.m,
                    paddingBottom: sp.m,
                    paddingLeft: sp.m,
                    paddingRight: sp.m,
                  }}>
                    {KPI_TILES.map(tile => (
                      <div key={tile.label} style={{
                        borderRadius: 'var(--sapTile_BorderCornerRadius, 8px)',
                        border: '1px solid var(--sapTile_BorderColor)',
                        background: 'var(--sapTile_Background)',
                        paddingTop: sp.m,
                        paddingBottom: sp.m,
                        paddingLeft: sp.m,
                        paddingRight: sp.m,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: sp.xs, marginBottom: sp.xs }}>
                          <Text style={{
                            fontFamily: 'var(--sapFontFamily)',
                            fontSize: 'var(--sapFontHeader2Size, 1.5rem)',
                            fontWeight: 'var(--sapFontBoldWeight)',
                            color: tile.negative ? 'var(--sapNegativeColor)' : 'var(--sapTextColor)',
                          }}>
                            {tile.value}
                          </Text>
                          {tile.unit && (
                            <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>
                              {tile.unit}
                            </Text>
                          )}
                        </div>
                        <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>
                          {tile.label}
                        </Text>
                      </div>
                    ))}
                  </div>
                </Tab>
                <Tab text="Open Items">
                  {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: sp.l, paddingBottom: sp.l }}>
                      <BusyIndicator active size="M" text="Loading invoices…" />
                    </div>
                  ) : (
                    <div data-ui5-compact-size>
                      <AnalyticalTable
                        columns={invoiceColumns}
                        data={OPEN_ITEMS}
                        withRowHighlight
                        highlightField="_highlight"
                        scaleWidthMode="Smart"
                        overflowMode="Popin"
                        noDataText="No open items"
                        minRows={OPEN_ITEMS.length}
                        style={{ width: '100%' }}
                      />
                    </div>
                  )}
                </Tab>
                <Tab text="Payments / Reimbursements">
                  <div style={{ paddingTop: sp.l, paddingBottom: sp.l, textAlign: 'center' }}>
                    <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', color: 'var(--sapContent_LabelColor)' }}>
                      No payment records found.
                    </Text>
                  </div>
                </Tab>
                <Tab text="Disputes">
                  <div style={{ paddingTop: sp.l, paddingBottom: sp.l, textAlign: 'center' }}>
                    <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', color: 'var(--sapContent_LabelColor)' }}>
                      3 active disputes — detail view coming.
                    </Text>
                  </div>
                </Tab>
              </TabContainer>
            </div>
          </div>

          {/* RIGHT panel — Account History */}
          <div style={{
            width: 450,
            flexShrink: 0,
            background: 'var(--sapTile_Background)',
            borderLeft: '1px solid var(--sapPageHeader_BorderColor)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}>
            {/* Right panel tabs */}
            <div style={{
              borderBottom: '1px solid var(--sapList_BorderColor)',
              display: 'flex',
              gap: sp.m,
              paddingLeft: sp.m,
              paddingRight: sp.m,
            }}>
              {(['Account History', 'Notes'] as const).map(tab => (
                <div
                  key={tab}
                  style={{
                    paddingTop: sp.m,
                    paddingBottom: sp.s,
                    borderBottom: tab === 'Account History' ? '3px solid var(--sapBrandColor)' : '3px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  <Text style={{
                    fontFamily: 'var(--sapFontFamily)',
                    fontSize: 'var(--sapFontSize)',
                    fontWeight: 'var(--sapFontBoldWeight)',
                    color: tab === 'Account History' ? 'var(--sapBrandColor)' : 'var(--sapTextColor)',
                  }}>
                    {tab}
                  </Text>
                </div>
              ))}
            </div>

            {/* Filter chips */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: sp.s,
              paddingTop: sp.s,
              paddingBottom: sp.s,
              paddingLeft: sp.m,
              paddingRight: sp.m,
              borderBottom: '1px solid var(--sapList_BorderColor)',
            }}>
              {(['all', 'calls', 'emails'] as const).map(f => (
                <Button
                  key={f}
                  design={historyFilter === f ? 'Emphasized' : 'Transparent'}
                  onClick={() => setHistoryFilter(f)}
                  style={{ fontSize: 'var(--sapFontSmallSize)' }}
                >
                  {f === 'all' ? 'All' : f === 'calls' ? 'Calls Only' : 'Emails Only'}
                </Button>
              ))}
              <div style={{ flex: 1 }} />
              <Button design="Transparent" icon="search" tooltip="Search history" onClick={() => {}} />
            </div>

            {/* Timeline entries */}
            <div style={{ flex: 1, overflowY: 'auto', paddingTop: sp.s, paddingBottom: sp.s }}>
              {filteredHistory.map((entry, idx) => (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    gap: sp.s,
                    paddingLeft: sp.m,
                    paddingRight: sp.m,
                    paddingTop: sp.s,
                    paddingBottom: sp.s,
                  }}
                >
                  {/* Timeline line + dot */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    {idx > 0 && (
                      <div style={{ width: 1, height: 8, background: 'var(--sapList_BorderColor)', marginBottom: 2 }} />
                    )}
                    <div style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: 'var(--sapNeutralBackground)',
                      border: '1px solid var(--sapList_BorderColor)',
                      flexShrink: 0,
                    }} />
                    {idx < filteredHistory.length - 1 && (
                      <div style={{ width: 1, flex: 1, minHeight: 8, background: 'var(--sapList_BorderColor)', marginTop: 2 }} />
                    )}
                  </div>

                  {/* Entry content */}
                  <div style={{ flex: 1, paddingBottom: sp.s }}>
                    <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginBottom: 2 }}>
                      {entry.timestamp}
                    </Text>
                    <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>
                      {entry.description} by{' '}
                    </Text>
                    <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>
                      {entry.actor}
                    </Text>
                    {entry.emailLink && (
                      <>
                        <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>
                          .{' '}
                        </Text>
                        <Link onClick={() => {}} style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)' }}>
                          View Email
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Toast ref={toastRef}>Action completed successfully</Toast>
      </div>
    </ThemeProvider>
  );
};

export default BayerARAccountPage;
