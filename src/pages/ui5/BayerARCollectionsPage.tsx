import '@ui5/webcomponents-icons/dist/AllIcons.js';
import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';
import '@ui5/webcomponents-fiori/dist/illustrations/UnableToLoad.js';
import '@ui5/webcomponents-fiori/dist/illustrations/SuccessScreen.js';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  AnalyticalTable,
  Avatar,
  BusyIndicator,
  Button,
  Dialog,
  FilterBar,
  FilterGroupItem,
  FlexBox,
  Icon,
  IllustratedMessage,
  Label,
  MessageStrip,
  ObjectStatus,
  Option,
  Select,
  Tag,
  Text,
  TextArea,
  Title,
  Toast,
  Toolbar,
  ToolbarSpacer,
} from '@ui5/webcomponents-react';

// ---------------------------------------------------------------------------
// Spacing tokens — module-level, with rem fallbacks for inline styles
// ---------------------------------------------------------------------------
const sp = {
  xs: 'var(--sapSpacingXSmallSize, 0.25rem)',
  s:  'var(--sapSpacingSmallSize, 0.5rem)',
  m:  'var(--sapSpacingMediumSize, 1rem)',
  l:  'var(--sapSpacingLargeSize, 2rem)',
  g:  'var(--sapContent_GridGutter, 1rem)',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type UI5State = 'Positive' | 'Negative' | 'Critical' | 'Information' | 'None';
type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Cleared';
type DisputeStatus = 'None' | 'Open' | 'Escalated';
type DraftTone = 'Reminder' | 'Escalation' | 'Final Notice' | 'None';
type HighlightState = 'Error' | 'Warning' | 'Information' | 'Success' | 'None';

interface ARAccount {
  id: string;
  customerName: string;
  country: string;
  countryCode: string;
  overdueAmountEUR: number;
  daysOverdue: number;
  riskLevel: RiskLevel;
  disputeStatus: DisputeStatus;
  draftTone: DraftTone;
  lastContactDate: string;
  _highlight: HighlightState;
  cleared: boolean;
  aiDraftBody: string;
}

// ---------------------------------------------------------------------------
// Module-level static maps
// ---------------------------------------------------------------------------
const RISK_STATE: Record<RiskLevel, UI5State> = {
  Critical: 'Negative',
  High:     'Critical',
  Medium:   'Information',
  Low:      'Positive',
  Cleared:  'Positive',
};

const RISK_HIGHLIGHT: Record<RiskLevel, HighlightState> = {
  Critical: 'Error',
  High:     'Warning',
  Medium:   'Information',
  Low:      'None',
  Cleared:  'Success',
};

const DISPUTE_STATE: Record<DisputeStatus, UI5State> = {
  None:      'None',
  Open:      'Critical',
  Escalated: 'Negative',
};

const TONE_STATE: Record<DraftTone, UI5State> = {
  Reminder:      'Information',
  Escalation:    'Critical',
  'Final Notice': 'Negative',
  None:          'None',
};

// ---------------------------------------------------------------------------
// Sandbox data — 10 Bayer pharma/ag EU customers
// ---------------------------------------------------------------------------
const INITIAL_ACCOUNTS: ARAccount[] = [
  {
    id: 'ACC-001',
    customerName: 'Syngenta AG',
    country: 'Germany',
    countryCode: 'DE',
    overdueAmountEUR: 785_400,
    daysOverdue: 72,
    riskLevel: 'Critical',
    disputeStatus: 'Escalated',
    draftTone: 'Final Notice',
    lastContactDate: '2025-03-04',
    _highlight: 'Error',
    cleared: false,
    aiDraftBody: `Dear Mr. Hoffmann,

This is a final notice regarding invoice INV-2025-0047 for EUR 785,400.00, now 72 days overdue. Our records show this matter remains unresolved despite prior escalation on 4 March.

We require full payment by 12 May 2025 to avoid referral to our legal collections team. Alternatively, please contact me directly to discuss a resolution plan.

Please note that disputed amounts must be formally registered in the SAP Collections portal to suspend further escalation.

Kind regards,
Elena Kovač
AR Collections Specialist — Bayer AG`,
  },
  {
    id: 'ACC-002',
    customerName: 'BASF SE',
    country: 'Germany',
    countryCode: 'DE',
    overdueAmountEUR: 612_200,
    daysOverdue: 65,
    riskLevel: 'Critical',
    disputeStatus: 'Open',
    draftTone: 'Final Notice',
    lastContactDate: '2025-03-10',
    _highlight: 'Error',
    cleared: false,
    aiDraftBody: `Dear Ms. Krause,

Following our communication of 10 March, invoice INV-2025-0061 for EUR 612,200.00 remains outstanding at 65 days past due.

Your registered dispute (DISP-2025-112) is under review; however, the undisputed portion of EUR 421,000.00 is immediately due. We request payment of the undisputed amount by 14 May 2025.

Please provide an updated status on the disputed portion to allow us to proceed accordingly.

Best regards,
Elena Kovač`,
  },
  {
    id: 'ACC-003',
    customerName: 'Corteva Agriscience',
    country: 'France',
    countryCode: 'FR',
    overdueAmountEUR: 478_900,
    daysOverdue: 48,
    riskLevel: 'High',
    disputeStatus: 'None',
    draftTone: 'Escalation',
    lastContactDate: '2025-03-20',
    _highlight: 'Warning',
    cleared: false,
    aiDraftBody: `Dear Mr. Dupont,

We are writing to escalate our collections request for invoice INV-2025-0082, EUR 478,900.00, now 48 days overdue.

This is the second formal notice. We ask you to arrange payment within 7 business days. Continued delay will result in referral to our senior credit management team.

Should you require an instalment arrangement, please respond to this email within 48 hours.

Cordialement,
Elena Kovač`,
  },
  {
    id: 'ACC-004',
    customerName: 'Novartis AG',
    country: 'Italy',
    countryCode: 'IT',
    overdueAmountEUR: 395_700,
    daysOverdue: 41,
    riskLevel: 'High',
    disputeStatus: 'None',
    draftTone: 'Escalation',
    lastContactDate: '2025-03-25',
    _highlight: 'Warning',
    cleared: false,
    aiDraftBody: `Gentile Sig. Ferri,

Con riferimento alla fattura INV-2025-0095, EUR 395,700.00, scaduta da 41 giorni, Le reiteriamo la nostra richiesta di pagamento urgente.

In assenza di riscontro entro 5 giorni lavorativi, saremo costretti a trasmettere la pratica al team di gestione del credito.

Cordiali saluti,
Elena Kovač`,
  },
  {
    id: 'ACC-005',
    customerName: 'Nufarm Nederland BV',
    country: 'Netherlands',
    countryCode: 'NL',
    overdueAmountEUR: 267_300,
    daysOverdue: 35,
    riskLevel: 'High',
    disputeStatus: 'None',
    draftTone: 'Escalation',
    lastContactDate: '2025-04-01',
    _highlight: 'Warning',
    cleared: false,
    aiDraftBody: `Dear Mr. van den Berg,

Invoice INV-2025-0103, EUR 267,300.00, is now 35 days overdue. This is our second escalation notice.

Please arrange payment or contact us to agree a payment plan within 5 working days. We would like to resolve this without further escalation.

Kind regards,
Elena Kovač`,
  },
  {
    id: 'ACC-006',
    customerName: 'Grupo Abelló Linde',
    country: 'Spain',
    countryCode: 'ES',
    overdueAmountEUR: 188_500,
    daysOverdue: 28,
    riskLevel: 'Medium',
    disputeStatus: 'None',
    draftTone: 'Reminder',
    lastContactDate: '2025-04-07',
    _highlight: 'Information',
    cleared: false,
    aiDraftBody: `Estimada Sra. García,

Le recordamos que la factura INV-2025-0118 por EUR 188,500.00 está pendiente de pago desde hace 28 días.

Por favor, proceda al abono en los próximos 10 días hábiles. Si ya ha realizado el pago, ignore este mensaje.

Atentamente,
Elena Kovač`,
  },
  {
    id: 'ACC-007',
    customerName: 'CIECH SA',
    country: 'Poland',
    countryCode: 'PL',
    overdueAmountEUR: 142_800,
    daysOverdue: 22,
    riskLevel: 'Medium',
    disputeStatus: 'None',
    draftTone: 'Reminder',
    lastContactDate: '2025-04-10',
    _highlight: 'Information',
    cleared: false,
    aiDraftBody: `Dear Mr. Kowalski,

This is a payment reminder for invoice INV-2025-0131, EUR 142,800.00, now 22 days past due.

Please arrange payment at your earliest convenience. If you have already processed this payment, kindly disregard this reminder.

Best regards,
Elena Kovač`,
  },
  {
    id: 'ACC-008',
    customerName: 'UCB Pharma SA',
    country: 'Belgium',
    countryCode: 'BE',
    overdueAmountEUR: 98_600,
    daysOverdue: 18,
    riskLevel: 'Medium',
    disputeStatus: 'None',
    draftTone: 'Reminder',
    lastContactDate: '2025-04-14',
    _highlight: 'Information',
    cleared: false,
    aiDraftBody: `Dear Ms. Lecomte,

A friendly reminder that invoice INV-2025-0147, EUR 98,600.00, is 18 days overdue.

Please process the payment within the next 10 business days. We appreciate your continued partnership with Bayer.

Kind regards,
Elena Kovač`,
  },
  {
    id: 'ACC-009',
    customerName: 'Zentiva Group',
    country: 'Czech Republic',
    countryCode: 'CZ',
    overdueAmountEUR: 74_200,
    daysOverdue: 0,
    riskLevel: 'Cleared',
    disputeStatus: 'None',
    draftTone: 'None',
    lastContactDate: '2025-04-18',
    _highlight: 'Success',
    cleared: true,
    aiDraftBody: '',
  },
  {
    id: 'ACC-010',
    customerName: 'Pharmos NV',
    country: 'Netherlands',
    countryCode: 'NL',
    overdueAmountEUR: 52_100,
    daysOverdue: 0,
    riskLevel: 'Cleared',
    disputeStatus: 'None',
    draftTone: 'None',
    lastContactDate: '2025-04-20',
    _highlight: 'Success',
    cleared: true,
    aiDraftBody: '',
  },
];

// ---------------------------------------------------------------------------
// KPI computation helper (pure function, module-level)
// ---------------------------------------------------------------------------
function computeKpis(accounts: ARAccount[]) {
  const active = accounts.filter((a) => !a.cleared);
  const totalOverdue = active.reduce((s, a) => s + a.overdueAmountEUR, 0);
  const critical = active.filter((a) => a.riskLevel === 'Critical').length;
  const openDisputes = active.filter((a) => a.disputeStatus !== 'None').length;
  const pendingActions = active.length;
  return { totalOverdue, critical, openDisputes, pendingActions };
}

// ---------------------------------------------------------------------------
// Card surface — single div, no nested Card component (prevents double-shadow)
// ---------------------------------------------------------------------------
const cardSurface: React.CSSProperties = {
  borderRadius: 'var(--sapTile_BorderCornerRadius)',
  boxShadow: 'var(--sapContent_Shadow0)',
  background: 'var(--sapTile_Background)',
  border: '1px solid var(--sapTile_BorderColor)',
  overflow: 'hidden',
};

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------
function fmtEUR(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function BayerARCollectionsPage() {
  const [accounts, setAccounts] = useState<ARAccount[]>(INITIAL_ACCOUNTS);
  const [filterRisk, setFilterRisk] = useState<string>('All');
  const [filterDispute, setFilterDispute] = useState<string>('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastOpen, setToastOpen] = useState(false);

  // Outreach dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<ARAccount | null>(null);
  const [draftBody, setDraftBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Deterministic error simulation
  const sendCallCountRef = useRef(0);
  const refreshCallCountRef = useRef(0);

  // ---------------------------------------------------------------------------
  // Toast helper
  // ---------------------------------------------------------------------------
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastOpen(true);
  }, []);

  // ---------------------------------------------------------------------------
  // Filtered data
  // ---------------------------------------------------------------------------
  const filteredAccounts = useMemo(() => {
    return accounts.filter((a) => {
      if (filterRisk !== 'All' && a.riskLevel !== filterRisk) return false;
      if (filterDispute !== 'All' && a.disputeStatus !== filterDispute) return false;
      return true;
    });
  }, [accounts, filterRisk, filterDispute]);

  // ---------------------------------------------------------------------------
  // KPIs
  // ---------------------------------------------------------------------------
  const kpis = useMemo(() => computeKpis(accounts), [accounts]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleRefresh = useCallback(async () => {
    refreshCallCountRef.current += 1;
    setIsRefreshing(true);
    setErrorMessage(null);
    await new Promise((r) => setTimeout(r, 1600));
    if (refreshCallCountRef.current % 12 === 0) {
      setErrorMessage('AI agent unavailable. Unable to re-score accounts. Using last known scores.');
    } else {
      showToast('AI agent re-scored all accounts successfully.');
    }
    setIsRefreshing(false);
  }, [showToast]);

  const handleOpenOutreach = useCallback((account: ARAccount) => {
    setSelectedAccount(account);
    setDraftBody(account.aiDraftBody);
    setDialogOpen(true);
  }, []);

  const handleSendOutreach = useCallback(async () => {
    if (!selectedAccount) return;
    sendCallCountRef.current += 1;
    setIsSending(true);
    await new Promise((r) => setTimeout(r, 1800));

    if (sendCallCountRef.current % 15 === 0) {
      setIsSending(false);
      setDialogOpen(false);
      setErrorMessage(`Failed to send outreach for ${selectedAccount.customerName}. SAP AR update did not complete. Please try again.`);
      return;
    }

    // Mark as sent — update last contact date
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === selectedAccount.id
          ? { ...a, lastContactDate: new Date().toISOString().split('T')[0] }
          : a,
      ),
    );
    setIsSending(false);
    setDialogOpen(false);
    showToast(`Outreach sent to ${selectedAccount.customerName}. SAP AR updated.`);
  }, [selectedAccount, showToast]);

  const handleClearDispute = useCallback(
    async (accountId: string) => {
      await new Promise((r) => setTimeout(r, 600));
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === accountId ? { ...a, disputeStatus: 'None' } : a,
        ),
      );
      showToast('Dispute status cleared in SAP Collections Management.');
    },
    [showToast],
  );

  // ---------------------------------------------------------------------------
  // Column definitions
  // ---------------------------------------------------------------------------
  const columns = useMemo(
    () => [
      {
        Header: 'Customer',
        accessor: 'customerName',
        width: 220,
        Cell: ({ row }: { row: { original: ARAccount } }) => {
          const acc = row.original;
          return (
            <FlexBox alignItems="Center" style={{ gap: sp.s }}>
              <Avatar
                initials={acc.customerName.substring(0, 2).toUpperCase()}
                colorScheme={
                  acc.riskLevel === 'Critical' ? '6' :
                  acc.riskLevel === 'High'     ? '5' :
                  acc.riskLevel === 'Medium'   ? '3' : '1'
                }
                size="XS"
                shape="Circle"
                accessibleName={acc.customerName}
              />
              <div>
                <Text style={{ display: 'block', fontWeight: 'var(--sapFontBoldWeight)' } as React.CSSProperties}>
                  {acc.customerName}
                </Text>
                <Text style={{ display: 'block', color: 'var(--sapContent_LabelColor)', fontSize: 'var(--sapFontSmallSize)' }}>
                  {acc.country} ({acc.countryCode})
                </Text>
              </div>
            </FlexBox>
          );
        },
      },
      {
        Header: 'Overdue (EUR)',
        accessor: 'overdueAmountEUR',
        width: 160,
        Cell: ({ value, row }: { value: number; row: { original: ARAccount } }) => (
          <Text
            style={{
              fontWeight: 'var(--sapFontBoldWeight)',
              color: row.original.cleared ? 'var(--sapPositiveColor)' : 'inherit',
            } as React.CSSProperties}
          >
            {row.original.cleared ? '—' : fmtEUR(value)}
          </Text>
        ),
      },
      {
        Header: 'Days Overdue',
        accessor: 'daysOverdue',
        width: 130,
        Cell: ({ value, row }: { value: number; row: { original: ARAccount } }) =>
          row.original.cleared ? (
            <Tag design="Positive" hideStateIcon>Cleared</Tag>
          ) : (
            <Text style={{ color: value >= 60 ? 'var(--sapNegativeColor)' : value >= 30 ? 'var(--sapCriticalColor)' : 'inherit' }}>
              {value}d
            </Text>
          ),
      },
      {
        Header: 'AI Risk Score',
        accessor: 'riskLevel',
        width: 140,
        Cell: ({ value }: { value: RiskLevel }) => (
          <ObjectStatus state={RISK_STATE[value]} showDefaultIcon>
            {value}
          </ObjectStatus>
        ),
      },
      {
        Header: 'Dispute',
        accessor: 'disputeStatus',
        width: 130,
        Cell: ({ value, row }: { value: DisputeStatus; row: { original: ARAccount } }) =>
          value === 'None' ? (
            <Text style={{ color: 'var(--sapContent_LabelColor)' }}>—</Text>
          ) : (
            <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
              <ObjectStatus state={DISPUTE_STATE[value]} showDefaultIcon>
                {value}
              </ObjectStatus>
              <Button
                design="Transparent"
                icon="clear-all"
                tooltip={`Clear ${value} dispute`}
                accessibleName={`Clear dispute for ${row.original.customerName}`}
                onClick={() => handleClearDispute(row.original.id)}
                style={{ padding: `0 ${sp.xs}` }}
              />
            </FlexBox>
          ),
      },
      {
        Header: 'AI Draft Tone',
        accessor: 'draftTone',
        width: 140,
        Cell: ({ value }: { value: DraftTone }) =>
          value === 'None' ? (
            <Text style={{ color: 'var(--sapContent_LabelColor)' }}>—</Text>
          ) : (
            <ObjectStatus state={TONE_STATE[value]} showDefaultIcon>
              {value}
            </ObjectStatus>
          ),
      },
      {
        Header: 'Last Contact',
        accessor: 'lastContactDate',
        width: 130,
        Cell: ({ value }: { value: string }) => <Text>{value}</Text>,
      },
      {
        Header: 'Action',
        accessor: 'id',
        width: 200,
        disableResizing: true,
        Cell: ({ row }: { row: { original: ARAccount } }) => {
          const acc = row.original;
          if (acc.cleared) {
            return (
              <ObjectStatus state="Positive" icon={<Icon name="complete" />}>
                Sent & Cleared
              </ObjectStatus>
            );
          }
          return (
            <Button
              design="Emphasized"
              icon="outbox"
              onClick={() => handleOpenOutreach(acc)}
              accessibleName={`Send AI outreach to ${acc.customerName}`}
              tooltip="Review and send AI-drafted outreach"
            >
              Send Outreach
            </Button>
          );
        },
      },
    ],
    [handleOpenOutreach, handleClearDispute],
  );

  // ---------------------------------------------------------------------------
  // Empty / error states
  // ---------------------------------------------------------------------------
  const hasNoData = filteredAccounts.length === 0;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div
      style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--sapBackgroundColor)' }}
      data-ui5-compact-size
    >
      {/* ------------------------------------------------------------------ */}
      {/* Page header banner                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          background: 'var(--sapShellColor)',
          paddingTop: sp.m,
          paddingBottom: sp.m,
          paddingLeft: sp.g,
          paddingRight: sp.g,
          borderBottom: '1px solid var(--sapPageHeader_BorderColor)',
        }}
      >
        <FlexBox alignItems="Center" justifyContent="SpaceBetween">
          <div>
            <Title level="H3" style={{ color: 'var(--sapShell_TextColor)' }}>
              AR Collections Agent
            </Title>
            <Text style={{ color: 'var(--sapShell_SubtitleTextColor)', fontSize: 'var(--sapFontSmallSize)', display: 'block' }}>
              AI-prioritized overdue account queue · Bayer AG · FI-AR / Collections Management
            </Text>
          </div>
          <FlexBox alignItems="Center" style={{ gap: sp.s }}>
            <Tag design="Information" icon={<Icon name="ai" />}>
              AI Agent: Active
            </Tag>
            <Button
              design="Default"
              icon="refresh"
              onClick={handleRefresh}
              tooltip="Re-score all accounts with AI agent"
              accessibleName="Refresh AI scoring"
            >
              Refresh Scores
            </Button>
          </FlexBox>
        </FlexBox>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Error strip                                                          */}
      {/* ------------------------------------------------------------------ */}
      {errorMessage && (
        <div style={{ paddingTop: sp.s, paddingLeft: sp.g, paddingRight: sp.g }}>
          <MessageStrip
            design="Negative"
            onClose={() => setErrorMessage(null)}
            hideCloseButton={false}
          >
            {errorMessage}
          </MessageStrip>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* KPI strip                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: sp.m,
          paddingTop: sp.m,
          paddingLeft: sp.g,
          paddingRight: sp.g,
        }}
      >
        {[
          {
            label: 'Total Overdue',
            value: fmtEUR(kpis.totalOverdue),
            state: 'Negative' as UI5State,
            icon: 'money-bills',
          },
          {
            label: 'Critical Accounts',
            value: String(kpis.critical),
            state: 'Negative' as UI5State,
            icon: 'alert',
          },
          {
            label: 'Open Disputes',
            value: String(kpis.openDisputes),
            state: kpis.openDisputes > 0 ? ('Critical' as UI5State) : ('Positive' as UI5State),
            icon: 'flag',
          },
          {
            label: 'Pending Actions',
            value: String(kpis.pendingActions),
            state: 'Information' as UI5State,
            icon: 'collections-management',
          },
        ].map((kpi) => (
          <div key={kpi.label} style={cardSurface}>
            <div
              style={{
                paddingTop: sp.m,
                paddingBottom: sp.m,
                paddingLeft: sp.m,
                paddingRight: sp.m,
              }}
            >
              <FlexBox alignItems="Center" style={{ gap: sp.s, marginBottom: sp.xs }}>
                <Icon name={kpi.icon} style={{ color: 'var(--sapContent_IconColor)' }} />
                <Label>{kpi.label}</Label>
              </FlexBox>
              <ObjectStatus state={kpi.state} style={{ fontSize: 'var(--sapFontHeader3Size)' }}>
                {kpi.value}
              </ObjectStatus>
            </div>
          </div>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Filter bar                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div style={{ paddingTop: sp.m, paddingLeft: sp.g, paddingRight: sp.g }}>
        <FilterBar
          showGoOnFB
          onGo={() => {/* filters already applied reactively */}}
          style={{ background: 'var(--sapList_Background)' }}
        >
          <FilterGroupItem label="Risk Level" active={filterRisk !== 'All'}>
            <Select
              accessibleName="Filter by risk level"
              onChange={(e) => {
                const val = e.detail.selectedOption?.textContent?.trim() ?? 'All';
                setFilterRisk(val === 'All Levels' ? 'All' : val);
              }}
            >
              <Option>All Levels</Option>
              <Option>Critical</Option>
              <Option>High</Option>
              <Option>Medium</Option>
              <Option>Low</Option>
              <Option>Cleared</Option>
            </Select>
          </FilterGroupItem>
          <FilterGroupItem label="Dispute Status" active={filterDispute !== 'All'}>
            <Select
              accessibleName="Filter by dispute status"
              onChange={(e) => {
                const val = e.detail.selectedOption?.textContent?.trim() ?? 'All';
                setFilterDispute(val === 'All Disputes' ? 'All' : val);
              }}
            >
              <Option>All Disputes</Option>
              <Option>None</Option>
              <Option>Open</Option>
              <Option>Escalated</Option>
            </Select>
          </FilterGroupItem>
        </FilterBar>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Table area                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingTop: sp.m,
          paddingLeft: sp.g,
          paddingRight: sp.g,
          paddingBottom: sp.l,
        }}
      >
        <div style={{ ...cardSurface, overflow: 'visible' }}>
          {/* Table toolbar */}
          <Toolbar design="Transparent">
            <Icon name="collections-management" style={{ color: 'var(--sapContent_IconColor)', marginRight: sp.s }} />
            <Text style={{ fontWeight: 'var(--sapFontBoldWeight)' } as React.CSSProperties}>
              Overdue Accounts
            </Text>
            <Tag design={filteredAccounts.filter((a) => !a.cleared).length > 0 ? 'Critical' : 'Positive'}>
              {filteredAccounts.filter((a) => !a.cleared).length} Active
            </Tag>
            <ToolbarSpacer />
            <Button
              design="Transparent"
              icon="download"
              tooltip="Export to Excel"
              accessibleName="Export worklist to Excel"
            />
            <Button
              design="Transparent"
              icon="table-view"
              tooltip="Column settings"
              accessibleName="Configure table columns"
            />
          </Toolbar>

          {/* Busy overlay for refresh */}
          {isRefreshing ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '18rem',
                background: 'var(--sapOverlay_Background)',
              }}
            >
              <BusyIndicator active size="L" />
            </div>
          ) : hasNoData ? (
            <div style={{ padding: sp.l, textAlign: 'center' }}>
              <IllustratedMessage
                name="NoData"
                titleText="No overdue accounts"
                subtitleText="All AR accounts are current. No collection actions required."
              />
            </div>
          ) : (
            <div data-ui5-compact-size>
              <AnalyticalTable
                data={filteredAccounts}
                columns={columns}
                withRowHighlight
                highlightField="_highlight"
                selectionMode="None"
                scaleWidthMode="Smart"
                overflowMode="Popin"
                noDataText="No accounts match the active filters."
                minRows={5}
                style={{ '--_ui5_analytical_table_header_bg': 'var(--sapList_HeaderBackground)' } as React.CSSProperties}
              />
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Outreach dialog                                                      */}
      {/* ------------------------------------------------------------------ */}
      <Dialog
        open={dialogOpen}
        headerText={selectedAccount ? `Send Outreach — ${selectedAccount.customerName}` : 'Send Outreach'}
        onClose={() => {
          if (!isSending) setDialogOpen(false);
        }}
        style={{ width: '56rem', maxWidth: '95vw' }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: sp.s, padding: sp.s }}>
            <Button
              design="Default"
              onClick={() => setDialogOpen(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              design="Emphasized"
              icon="outbox"
              onClick={handleSendOutreach}
              disabled={isSending}
              accessibleName="Send outreach email and update SAP AR"
            >
              {isSending ? 'Sending…' : 'Send Outreach'}
            </Button>
          </div>
        }
      >
        {selectedAccount && (
          <div style={{ paddingTop: sp.m, paddingLeft: sp.m, paddingRight: sp.m, paddingBottom: sp.m }}>
            {/* Account summary row */}
            <div
              style={{
                background: 'var(--sapInfobar_Background)',
                borderRadius: 'var(--sapGroup_BorderCornerRadius)',
                paddingTop: sp.s,
                paddingBottom: sp.s,
                paddingLeft: sp.m,
                paddingRight: sp.m,
                marginBottom: sp.m,
              }}
            >
              <FlexBox alignItems="Center" style={{ gap: sp.l }}>
                <div>
                  <Label>Customer</Label>
                  <Text style={{ display: 'block', fontWeight: 'var(--sapFontBoldWeight)' } as React.CSSProperties}>
                    {selectedAccount.customerName}
                  </Text>
                </div>
                <div>
                  <Label>Overdue Amount</Label>
                  <Text style={{ display: 'block', fontWeight: 'var(--sapFontBoldWeight)' } as React.CSSProperties}>
                    {fmtEUR(selectedAccount.overdueAmountEUR)}
                  </Text>
                </div>
                <div>
                  <Label>Days Overdue</Label>
                  <Text style={{ display: 'block' }}>{selectedAccount.daysOverdue}d</Text>
                </div>
                <div>
                  <Label>Risk Level</Label>
                  <ObjectStatus state={RISK_STATE[selectedAccount.riskLevel]} showDefaultIcon>
                    {selectedAccount.riskLevel}
                  </ObjectStatus>
                </div>
                <div>
                  <Label>AI Draft Tone</Label>
                  <ObjectStatus state={TONE_STATE[selectedAccount.draftTone]} showDefaultIcon>
                    {selectedAccount.draftTone}
                  </ObjectStatus>
                </div>
              </FlexBox>
            </div>

            {/* AI draft editor */}
            <FlexBox alignItems="Center" style={{ gap: sp.s, marginBottom: sp.xs }}>
              <Icon name="ai" style={{ color: 'var(--sapBrandColor)' }} />
              <Label for="outreach-draft-textarea" showColon>
                AI-Drafted Outreach Email
              </Label>
            </FlexBox>
            <TextArea
              id="outreach-draft-textarea"
              value={draftBody}
              rows={14}
              growing
              style={{ width: '100%' }}
              accessibleName="AI-drafted outreach email body — edit before sending"
              onInput={(e) => setDraftBody((e.target as HTMLTextAreaElement).value)}
            />
            <Text
              style={{
                display: 'block',
                color: 'var(--sapContent_LabelColor)',
                fontSize: 'var(--sapFontSmallSize)',
                marginTop: sp.xs,
              }}
            >
              AI draft generated based on account history, payment pattern, and dispute data. Review and edit before sending. Sending will update the SAP AR Collections Management log.
            </Text>

            {isSending && (
              <div style={{ display: 'flex', alignItems: 'center', gap: sp.s, marginTop: sp.m }}>
                <BusyIndicator active size="S" />
                <Text style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Sending outreach and updating SAP AR…
                </Text>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* Toast                                                                */}
      {/* ------------------------------------------------------------------ */}
      <Toast
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        placement="BottomCenter"
        duration={3500}
      >
        {toastMessage}
      </Toast>
    </div>
  );
}
