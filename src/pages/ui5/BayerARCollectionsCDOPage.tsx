'use client';
import React, { useState, useCallback } from 'react';
import {
  Title,
  Text,
  Button,
  Toast,
  MessageStrip,
  BusyIndicator,
  FlexBox,
  ObjectStatus,
  Tag,
  Label,
  TextArea,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-react/styles.css';
import '@ui5/webcomponents-icons/dist/AllIcons.js';

// ─── Spacing ──────────────────────────────────────────────────────────────────
const sp = {
  xs: 'var(--sapSpacingXSmallSize, 0.25rem)',
  s:  'var(--sapSpacingSmallSize, 0.5rem)',
  m:  'var(--sapSpacingMediumSize, 1rem)',
  l:  'var(--sapSpacingLargeSize, 2rem)',
};

// ─── Types ─────────────────────────────────────────────────────────────────────
type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Cleared';
type DisputeStatus = 'None' | 'Open' | 'Escalated';
type DraftTone = 'Final Notice' | 'Escalation' | 'Reminder' | 'None';

// ─── Module-scope constants ────────────────────────────────────────────────────
const RISK_BORDER: Record<RiskLevel, string> = {
  Critical: '3px solid var(--sapNegativeColor)',
  High:     '3px solid var(--sapCriticalColor)',
  Medium:   '3px solid var(--sapInformativeColor)',
  Low:      '3px solid var(--sapNeutralColor)',
  Cleared:  '3px solid var(--sapPositiveColor)',
};

const RISK_STATE: Record<RiskLevel, 'Negative' | 'Critical' | 'Information' | 'None' | 'Positive'> = {
  Critical: 'Negative',
  High:     'Critical',
  Medium:   'Information',
  Low:      'None',
  Cleared:  'Positive',
};

const TONE_STATE: Record<DraftTone, 'Negative' | 'Critical' | 'Information' | 'None'> = {
  'Final Notice': 'Negative',
  Escalation:     'Critical',
  Reminder:       'Information',
  None:           'None',
};

const cardSurface: React.CSSProperties = {
  borderRadius: 'var(--sapTile_BorderCornerRadius, 12px)',
  background:   'var(--sapTile_Background)',
  border:       '1px solid var(--sapTile_BorderColor)',
  overflow:     'hidden',
};

// ─── Data ──────────────────────────────────────────────────────────────────────
interface ARAccount {
  id: string;
  customerName: string;
  country: string;
  countryEmoji: string;
  overdueAmountEUR: number;
  daysOverdue: number;
  riskLevel: RiskLevel;
  disputeStatus: DisputeStatus;
  draftTone: DraftTone;
  aiSummary: string;      // one sentence — shown collapsed
  aiDraft: string;        // full draft — shown expanded
  cleared?: boolean;
}

const ACCOUNTS: ARAccount[] = [
  {
    id: 'acc-001',
    customerName: 'Syngenta AG',
    country: 'Germany',
    countryEmoji: '🇩🇪',
    overdueAmountEUR: 785400,
    daysOverdue: 72,
    riskLevel: 'Critical',
    disputeStatus: 'Escalated',
    draftTone: 'Final Notice',
    aiSummary: 'Final notice — 72 days, open dispute escalated, legal referral threshold reached.',
    aiDraft: `Dear Mr. Hoffmann,

This is a final notice regarding invoice INV-2025-0047 for EUR 785,400.00, now 72 days overdue. Our records show this matter remains unresolved despite prior escalation on 4 March.

We require full payment by 12 May to avoid referral to our legal collections team. Alternatively, please contact me directly to discuss a resolution plan.

Please note that disputed amounts must be formally registered in the SAP Collections portal to suspend further escalation.

Kind regards,
Elena Kovač — AR Collections Specialist, Bayer AG`,
  },
  {
    id: 'acc-002',
    customerName: 'BASF SE',
    country: 'Germany',
    countryEmoji: '🇩🇪',
    overdueAmountEUR: 612200,
    daysOverdue: 65,
    riskLevel: 'Critical',
    disputeStatus: 'Open',
    draftTone: 'Final Notice',
    aiSummary: 'Partial dispute (€421k undisputed) — final notice on undisputed portion, dispute review pending.',
    aiDraft: `Dear Ms. Krause,

Following our communication of 10 March, invoice INV-2025-0061 for EUR 612,200.00 remains outstanding at 65 days past due.

Your registered dispute (DISP-2025-112) is under review; however, the undisputed portion of EUR 421,000.00 is immediately due. We request payment of the undisputed amount by 14 May.

Please provide an updated status on the disputed portion to allow us to proceed accordingly.

Best regards,
Elena Kovač`,
  },
  {
    id: 'acc-003',
    customerName: 'Corteva Agriscience',
    country: 'France',
    countryEmoji: '🇫🇷',
    overdueAmountEUR: 478900,
    daysOverdue: 48,
    riskLevel: 'High',
    disputeStatus: 'None',
    draftTone: 'Escalation',
    aiSummary: 'Second escalation — 48 days, no dispute registered, payment plan offer made.',
    aiDraft: `Dear Mr. Dupont,

We are writing to escalate our collections request for invoice INV-2025-0082, EUR 478,900.00, now 48 days overdue.

This is the second formal notice. We ask you to arrange payment within 7 business days. Continued delay will result in referral to our senior credit management team.

Should you require an instalment arrangement, please respond to this email within 48 hours.

Cordialement,
Elena Kovač`,
  },
  {
    id: 'acc-004',
    customerName: 'Novartis AG',
    country: 'Italy',
    countryEmoji: '🇮🇹',
    overdueAmountEUR: 395700,
    daysOverdue: 41,
    riskLevel: 'High',
    disputeStatus: 'None',
    draftTone: 'Escalation',
    aiSummary: 'Italian-language escalation — 41 days, credit management referral in 5 days if no response.',
    aiDraft: `Gentile Sig. Ferri,

Con riferimento alla fattura INV-2025-0095, EUR 395,700.00, scaduta da 41 giorni, Le reiteriamo la nostra richiesta di pagamento urgente.

In assenza di riscontro entro 5 giorni lavorativi, saremo costretti a trasmettere la pratica al team di gestione del credito.

Cordiali saluti,
Elena Kovač`,
  },
  {
    id: 'acc-005',
    customerName: 'Nufarm Nederland BV',
    country: 'Netherlands',
    countryEmoji: '🇳🇱',
    overdueAmountEUR: 267300,
    daysOverdue: 35,
    riskLevel: 'High',
    disputeStatus: 'None',
    draftTone: 'Escalation',
    aiSummary: 'Second notice — 35 days, payment plan offered, 5 working days to respond.',
    aiDraft: `Dear Mr. van den Berg,

Invoice INV-2025-0103, EUR 267,300.00, is now 35 days overdue. This is our second escalation notice.

Please arrange payment or contact us to agree a payment plan within 5 working days.

Kind regards,
Elena Kovač`,
  },
  {
    id: 'acc-006',
    customerName: 'Grupo Abelló Linde',
    country: 'Spain',
    countryEmoji: '🇪🇸',
    overdueAmountEUR: 188500,
    daysOverdue: 28,
    riskLevel: 'Medium',
    disputeStatus: 'None',
    draftTone: 'Reminder',
    aiSummary: 'First reminder — 28 days, Spanish-language, no prior contact.',
    aiDraft: `Estimada Sra. García,

Le recordamos que la factura INV-2025-0118 por EUR 188,500.00 está pendiente de pago desde hace 28 días.

Por favor, proceda al abono en los próximos 10 días hábiles.

Atentamente,
Elena Kovač`,
  },
  {
    id: 'acc-007',
    customerName: 'CIECH SA',
    country: 'Poland',
    countryEmoji: '🇵🇱',
    overdueAmountEUR: 142800,
    daysOverdue: 22,
    riskLevel: 'Medium',
    disputeStatus: 'None',
    draftTone: 'Reminder',
    aiSummary: 'Payment reminder — 22 days, good payment history, likely oversight.',
    aiDraft: `Dear Mr. Kowalski,

This is a payment reminder for invoice INV-2025-0131, EUR 142,800.00, now 22 days past due.

Please arrange payment at your earliest convenience.

Best regards,
Elena Kovač`,
  },
  {
    id: 'acc-008',
    customerName: 'UCB Pharma SA',
    country: 'Belgium',
    countryEmoji: '🇧🇪',
    overdueAmountEUR: 98600,
    daysOverdue: 18,
    riskLevel: 'Medium',
    disputeStatus: 'None',
    draftTone: 'Reminder',
    aiSummary: 'Friendly reminder — 18 days, strong relationship, tone kept warm.',
    aiDraft: `Dear Ms. Lecomte,

A friendly reminder that invoice INV-2025-0147, EUR 98,600.00, is 18 days overdue.

Please process the payment within the next 10 business days. We appreciate your continued partnership with Bayer.

Kind regards,
Elena Kovač`,
  },
  {
    id: 'acc-009',
    customerName: 'Zentiva Group',
    country: 'Czech Republic',
    countryEmoji: '🇨🇿',
    overdueAmountEUR: 74200,
    daysOverdue: 0,
    riskLevel: 'Cleared',
    disputeStatus: 'None',
    draftTone: 'None',
    aiSummary: 'Cleared — payment received 18 Apr.',
    cleared: true,
    aiDraft: '',
  },
  {
    id: 'acc-010',
    customerName: 'Pharmos NV',
    country: 'Netherlands',
    countryEmoji: '🇳🇱',
    overdueAmountEUR: 52100,
    daysOverdue: 0,
    riskLevel: 'Cleared',
    disputeStatus: 'None',
    draftTone: 'None',
    aiSummary: 'Cleared — payment received 20 Apr.',
    cleared: true,
    aiDraft: '',
  },
];

// ─── AccountRow sub-component ──────────────────────────────────────────────────
interface RowProps {
  account: ARAccount;
  isResolved: boolean;
  onSend: (id: string) => void;
}

const AccountRow: React.FC<RowProps> = ({ account, isResolved, onSend }) => {
  const [expanded, setExpanded] = useState(false);
  const [draftText, setDraftText] = useState(account.aiDraft);
  const [isSending, setIsSending] = useState(false);
  const [justSent, setJustSent] = useState(false);

  const handleSend = useCallback(() => {
    if (isSending || justSent || account.cleared) return;
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setJustSent(true);
      onSend(account.id);
    }, 1000);
  }, [isSending, justSent, account, onSend]);

  const isFrozen = justSent || account.cleared || isResolved;

  const rowBg = isFrozen
    ? 'var(--sapSuccessBackground)'
    : 'var(--sapTile_Background)';

  return (
    <div style={{
      ...cardSurface,
      borderLeft: RISK_BORDER[account.riskLevel],
      background: rowBg,
      transition: 'background 0.4s ease',
      marginBottom: sp.s,
      opacity: isFrozen && !isSending ? 0.75 : 1,
    }}>
      {/* ── Collapsed row ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          alignItems: 'center',
          gap: sp.m,
          padding: `${sp.s} ${sp.m}`,
          cursor: isFrozen ? 'default' : 'pointer',
        }}
        onClick={() => !isFrozen && setExpanded(e => !e)}
      >
        {/* Left: name + AI summary */}
        <div>
          <FlexBox alignItems="Center" style={{ gap: sp.s, marginBottom: sp.xs }}>
            <Text style={{
              fontFamily: 'var(--sapFontFamily)',
              fontSize: 'var(--sapFontSize)',
              fontWeight: 'var(--sapFontBoldWeight)',
              color: 'var(--sapTextColor)',
            }}>
              {account.countryEmoji} {account.customerName}
            </Text>
            <Tag
              design="Set1"
              colorScheme={
                account.riskLevel === 'Critical' ? '2' :
                account.riskLevel === 'High'     ? '3' :
                account.riskLevel === 'Cleared'  ? '5' : '4'
              }
              style={{ fontSize: 'var(--sapFontSmallSize)' }}
            >
              {account.riskLevel}
            </Tag>
            {account.disputeStatus !== 'None' && (
              <Tag design="Set1" colorScheme="2" style={{ fontSize: 'var(--sapFontSmallSize)' }}>
                Dispute: {account.disputeStatus}
              </Tag>
            )}
          </FlexBox>
          <Text style={{
            fontFamily: 'var(--sapFontFamily)',
            fontSize: 'var(--sapFontSmallSize)',
            color: isFrozen ? 'var(--sapContent_LabelColor)' : 'var(--sapTextColor)',
          }}>
            {account.aiSummary}
          </Text>
        </div>

        {/* Center: amount + days */}
        <div style={{ textAlign: 'right', minWidth: '130px' }}>
          {!account.cleared && (
            <>
              <Text style={{
                fontFamily: 'var(--sapFontFamily)',
                fontSize: 'var(--sapFontSize)',
                fontWeight: 'var(--sapFontBoldWeight)',
                color: 'var(--sapTextColor)',
                display: 'block',
              }}>
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(account.overdueAmountEUR)}
              </Text>
              <ObjectStatus state={TONE_STATE[account.draftTone]} style={{ fontSize: 'var(--sapFontSmallSize)' }}>
                {account.draftTone}
              </ObjectStatus>
            </>
          )}
        </div>

        {/* Right: action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: sp.xs }}>
          {isFrozen ? (
            <ObjectStatus state="Positive" style={{ fontSize: 'var(--sapFontSmallSize)' }}>
              {account.cleared ? 'Cleared' : 'Sent'}
            </ObjectStatus>
          ) : (
            <>
              <Button
                design="Emphasized"
                onClick={(e) => { e.stopPropagation(); handleSend(); }}
                disabled={isSending}
                style={{ fontSize: 'var(--sapFontSmallSize)' }}
              >
                Send
              </Button>
              <Button
                design="Transparent"
                onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
                style={{ fontSize: 'var(--sapFontSmallSize)' }}
              >
                Review
              </Button>
            </>
          )}
          {isSending && <BusyIndicator active size="S" />}
        </div>
      </div>

      {/* ── Expanded draft ────────────────────────────────────────────────── */}
      {expanded && !isFrozen && (
        <div style={{
          borderTop: '1px solid var(--sapTile_BorderColor)',
          padding: sp.m,
          background: 'var(--sapField_Background)',
        }}>
          <Label
            for={`draft-${account.id}`}
            style={{
              fontFamily: 'var(--sapFontFamily)',
              fontSize: 'var(--sapFontSmallSize)',
              display: 'block',
              marginBottom: sp.xs,
            }}
          >
            AI-drafted outreach — edit or send as-is
          </Label>
          <TextArea
            id={`draft-${account.id}`}
            value={draftText}
            rows={10}
            style={{ width: '100%', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)' }}
            onInput={(e) => setDraftText((e.target as HTMLTextAreaElement).value)}
          />
          <FlexBox style={{ gap: sp.s, marginTop: sp.m }}>
            <Button design="Emphasized" onClick={handleSend} disabled={isSending}>
              Send Outreach
            </Button>
            <Button design="Transparent" onClick={() => setExpanded(false)}>
              Cancel
            </Button>
          </FlexBox>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const BayerARCollectionsCDOPage: React.FC = () => {
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(
    new Set(ACCOUNTS.filter(a => a.cleared).map(a => a.id))
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastText, setToastText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const activeAccounts = ACCOUNTS.filter(a => !resolvedIds.has(a.id) && !a.cleared);
  const resolvedCount = resolvedIds.size;
  const totalCount = ACCOUNTS.length;
  const totalOutstanding = activeAccounts.reduce((s, a) => s + a.overdueAmountEUR, 0);
  const criticalCount = activeAccounts.filter(a => a.riskLevel === 'Critical').length;
  const allDone = activeAccounts.length === 0;

  const handleSend = useCallback((id: string) => {
    setResolvedIds(prev => new Set([...prev, id]));
    const acc = ACCOUNTS.find(a => a.id === id);
    setToastText(`Outreach sent — ${acc?.customerName ?? 'account'}. SAP AR updated.`);
    setToastOpen(true);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setErrorMsg('');
    setTimeout(() => {
      setIsRefreshing(false);
      setToastText('Agent re-scored all accounts');
      setToastOpen(true);
    }, 1400);
  }, []);

  // Sort: unresolved critical first, then high, medium, low; cleared/resolved last
  const RISK_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3, Cleared: 4 };
  const sorted = [...ACCOUNTS].sort((a, b) => {
    const aRes = resolvedIds.has(a.id);
    const bRes = resolvedIds.has(b.id);
    if (aRes !== bRes) return aRes ? 1 : -1;
    return (RISK_ORDER[a.riskLevel] ?? 5) - (RISK_ORDER[b.riskLevel] ?? 5);
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--sapShell_Background, var(--sapBackgroundColor))' }}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{
        padding: `${sp.m} ${sp.l}`,
        background: 'var(--sapPageHeader_Background)',
        borderBottom: '1px solid var(--sapPageHeader_BorderColor)',
        flexShrink: 0,
      }}>
        <FlexBox alignItems="Center" justifyContent="SpaceBetween">
          <div>
            <Title level="H4" wrappingType="Normal" style={{ marginBottom: sp.xs }}>
              AR Collections Queue
            </Title>
            <Text style={{
              fontFamily: 'var(--sapFontFamily)',
              fontSize: 'var(--sapFontSmallSize)',
              color: 'var(--sapContent_LabelColor)',
            }}>
              {allDone
                ? 'All accounts resolved — queue clear'
                : `${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(totalOutstanding)} outstanding · ${criticalCount > 0 ? `${criticalCount} critical` : 'no critical accounts'}`
              }
            </Text>
          </div>
          <FlexBox alignItems="Center" style={{ gap: sp.s }}>
            {isRefreshing && <BusyIndicator active size="S" />}
            <Button design="Default" icon="synchronize" onClick={handleRefresh} disabled={isRefreshing}>
              Re-score
            </Button>
            <Button design="Emphasized" icon="outbox">
              Send all safe
            </Button>
          </FlexBox>
        </FlexBox>

        {errorMsg && (
          <MessageStrip design="Negative" hideCloseButton style={{ marginTop: sp.s }}>
            {errorMsg}
          </MessageStrip>
        )}

        {/* Progress track */}
        <div style={{ marginTop: sp.m }}>
          <div style={{
            height: '4px',
            background: 'var(--sapField_BorderColor)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: ((resolvedCount / totalCount) * 100) + '%',
              background: allDone ? 'var(--sapPositiveColor)' : 'var(--sapBrandColor)',
              transition: 'width 0.5s ease',
              height: '100%',
            }} />
          </div>
        </div>
      </div>

      {/* ── Account list ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.m} ${sp.l}` }}>
        {sorted.map(acc => (
          <AccountRow
            key={acc.id}
            account={acc}
            isResolved={resolvedIds.has(acc.id)}
            onSend={handleSend}
          />
        ))}
      </div>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      <Toast open={toastOpen} onClose={() => setToastOpen(false)} duration={2800}>
        {toastText}
      </Toast>
    </div>
  );
};

export default BayerARCollectionsCDOPage;
