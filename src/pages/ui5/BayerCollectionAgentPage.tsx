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
  Toolbar,
  ToolbarSpacer,
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

// ─── Module-scope constants ────────────────────────────────────────────────────
const cardSurface: React.CSSProperties = {
  borderRadius: 'var(--sapTile_BorderCornerRadius)',
  boxShadow: 'var(--sapContent_Shadow0)',
  background: 'var(--sapTile_Background)',
  border: '1px solid var(--sapTile_BorderColor)',
  overflow: 'hidden',
};

type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Clear';
type UI5State = 'Negative' | 'Critical' | 'Information' | 'Positive' | 'None';

const RISK_COLOR: Record<RiskLevel, '1' | '2' | '3' | '4' | '5'> = {
  Critical: '2',
  High:     '3',
  Medium:   '5',
  Low:      '4',
  Clear:    '1',
};

const RISK_STATE: Record<RiskLevel, UI5State> = {
  Critical: 'Negative',
  High:     'Critical',
  Medium:   'Information',
  Low:      'Positive',
  Clear:    'Positive',
};

const RISK_BORDER: Record<RiskLevel, string> = {
  Critical: '3px solid var(--sapNegativeColor)',
  High:     '3px solid var(--sapCriticalColor)',
  Medium:   '3px solid var(--sapInformativeColor)',
  Low:      '3px solid transparent',
  Clear:    '3px solid transparent',
};

interface Account {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  riskLevel: RiskLevel;
  riskScore: number;
  riskDriver: string;
  overdueDays: number;
  overdueAmount: number;
  currency: string;
  lastContact: string;
  disputeStatus: 'None' | 'Open' | 'Resolved';
  aiDraft: string;
}

// ─── Sandbox data — 10 pharma distributors across UK/DE/FR/CH/NL ──────────────
const ACCOUNTS: Account[] = [
  {
    id: 'BP-DE-0112',
    name: 'PHOENIX Pharma SE',
    country: 'Germany',
    countryCode: '🇩🇪',
    riskLevel: 'Critical',
    riskScore: 94,
    riskDriver: 'Payment pattern shifted 22d late since Jan 2026; 2 prior disputes unresolved.',
    overdueDays: 87,
    overdueAmount: 487_200,
    currency: 'EUR',
    lastContact: '12 Mar 2026',
    disputeStatus: 'Open',
    aiDraft: `Dear Marcus,

I'm following up on invoice cluster INV-2026-0441 through INV-2026-0448 (total €487,200), now 87 days overdue.

Our records show two open disputes from February remain unresolved. Given the payment pattern shift we've observed since January, I wanted to reach out directly before escalating to our credit team.

Could you confirm the current status on both dispute threads by Thursday 7 May? I'm happy to arrange a call if that's easier.

Best regards,
Anna Richter
AR Collections, Bayer AG`,
  },
  {
    id: 'BP-FR-0087',
    name: 'Cerp Bretagne Atlantique',
    country: 'France',
    countryCode: '🇫🇷',
    riskLevel: 'Critical',
    riskScore: 89,
    riskDriver: '3 missed payment commitments in Q1 2026; escalation risk flag raised by FSCM.',
    overdueDays: 74,
    overdueAmount: 334_750,
    currency: 'EUR',
    lastContact: '28 Mar 2026',
    disputeStatus: 'Open',
    aiDraft: `Dear Philippe,

Following up on INV-2026-0612 and INV-2026-0618 (EUR 334,750 combined), now 74 days past due.

Our FSCM system has flagged three missed payment commitments this quarter. Before escalating, I'd like to understand if there is a liquidity issue we can help work around — extended terms or a payment plan may be possible.

Please reply by Wednesday 6 May with your expected remittance date.

Regards,
Anna Richter
Bayer AG Collections`,
  },
  {
    id: 'BP-UK-0203',
    name: 'McKesson UK Ltd',
    country: 'United Kingdom',
    countryCode: '🇬🇧',
    riskLevel: 'High',
    riskScore: 78,
    riskDriver: 'DSO increased 18d vs same period last year; no dispute on record.',
    overdueDays: 52,
    overdueAmount: 218_400,
    currency: 'EUR',
    lastContact: '8 Apr 2026',
    disputeStatus: 'None',
    aiDraft: `Dear Caroline,

A quick note regarding INV-2026-0874 (EUR 218,400), now 52 days overdue against Net-30 terms.

Our records show no dispute and no payment on file. Could you check with your AP team and confirm the expected value date? A remittance copy would also help us reconcile the account.

Thanks,
Anna Richter`,
  },
  {
    id: 'BP-CH-0055',
    name: 'Galexis AG',
    country: 'Switzerland',
    countryCode: '🇨🇭',
    riskLevel: 'High',
    riskScore: 71,
    riskDriver: 'Partial dispute raised in March; EUR 62K still unresolved after credit note issued.',
    overdueDays: 41,
    overdueAmount: 156_800,
    currency: 'EUR',
    lastContact: '15 Apr 2026',
    disputeStatus: 'Open',
    aiDraft: `Dear Thomas,

Following up on the remaining balance of EUR 156,800 on account BP-CH-0055 (INV-2026-1002 and INV-2026-1008).

I understand a credit note was issued in March for EUR 62,000. Our records show the net remaining balance has not yet been settled. Could you confirm the value date for the outstanding amount?

Warm regards,
Anna Richter`,
  },
  {
    id: 'BP-NL-0311',
    name: 'OPG Groothandel BV',
    country: 'Netherlands',
    countryCode: '🇳🇱',
    riskLevel: 'High',
    riskScore: 67,
    riskDriver: 'Seasonal pattern — Q2 payments typically delayed 30–45d; 2025 resolved by week 8.',
    overdueDays: 38,
    overdueAmount: 94_500,
    currency: 'EUR',
    lastContact: '18 Apr 2026',
    disputeStatus: 'None',
    aiDraft: `Dear Hanna,

Quick note on INV-2026-1145 (EUR 94,500), now 38 days overdue.

Based on prior years this is within your typical Q2 settlement window — just confirming payment is in progress and we shouldn't expect any issues?

Thanks,
Anna`,
  },
  {
    id: 'BP-DE-0287',
    name: 'Noweda eG',
    country: 'Germany',
    countryCode: '🇩🇪',
    riskLevel: 'Medium',
    riskScore: 58,
    riskDriver: 'New account (8 months) — limited payment history; first overdue instance.',
    overdueDays: 28,
    overdueAmount: 73_200,
    currency: 'EUR',
    lastContact: '22 Apr 2026',
    disputeStatus: 'None',
    aiDraft: `Dear Stefan,

A friendly reminder that INV-2026-1288 (EUR 73,200) is now 28 days overdue.

As a relatively new account, we want to make sure everything is in order on your side. If payment has already been sent, please disregard — otherwise a quick confirmation of the expected date would be helpful.

Best,
Anna Richter`,
  },
  {
    id: 'BP-FR-0144',
    name: 'Alliance Healthcare France',
    country: 'France',
    countryCode: '🇫🇷',
    riskLevel: 'Medium',
    riskScore: 52,
    riskDriver: 'Moderate DSO increase Q1; no dispute; AP team confirmed backlog processing.',
    overdueDays: 22,
    overdueAmount: 61_900,
    currency: 'EUR',
    lastContact: '25 Apr 2026',
    disputeStatus: 'None',
    aiDraft: `Dear Isabelle,

Just a brief follow-up on INV-2026-1399 (EUR 61,900) — 22 days past due date.

Your AP team confirmed a processing backlog last week. Could you let us know the expected clearance date so we can update our records?

Thanks,
Anna`,
  },
  {
    id: 'BP-UK-0419',
    name: 'Walgreens Boots Alliance UK',
    country: 'United Kingdom',
    countryCode: '🇬🇧',
    riskLevel: 'Medium',
    riskScore: 43,
    riskDriver: 'Invoice disputed in April; credit note pending internal approval.',
    overdueDays: 17,
    overdueAmount: 48_300,
    currency: 'EUR',
    lastContact: '27 Apr 2026',
    disputeStatus: 'Open',
    aiDraft: `Dear Sarah,

Following up on INV-2026-1441 (EUR 48,300) — dispute raised 17 days ago.

Could you confirm the status of the credit note approval on your end? Once that's resolved, we can close the account balance promptly.

Best regards,
Anna Richter`,
  },
  {
    id: 'BP-CH-0092',
    name: 'Voigt & Partner AG',
    country: 'Switzerland',
    countryCode: '🇨🇭',
    riskLevel: 'Clear',
    riskScore: 12,
    riskDriver: 'Payment confirmed received 2 May; account balance cleared.',
    overdueDays: 4,
    overdueAmount: 41_600,
    currency: 'EUR',
    lastContact: '30 Apr 2026',
    disputeStatus: 'Resolved',
    aiDraft: '',
  },
  {
    id: 'BP-NL-0488',
    name: 'Brocacef Groep NV',
    country: 'Netherlands',
    countryCode: '🇳🇱',
    riskLevel: 'Clear',
    riskScore: 8,
    riskDriver: 'Payment in transit per SWIFT confirmation; expected to clear 5 May.',
    overdueDays: 2,
    overdueAmount: 55_000,
    currency: 'EUR',
    lastContact: '29 Apr 2026',
    disputeStatus: 'None',
    aiDraft: '',
  },
];

const TOTAL_OVERDUE = ACCOUNTS.reduce((s, a) => s + a.overdueAmount, 0);
const CRITICAL_HIGH = ACCOUNTS.filter(a => a.riskLevel === 'Critical' || a.riskLevel === 'High').length;

// ─── Account Row ──────────────────────────────────────────────────────────────
interface RowProps {
  account: Account;
  sent: boolean;
  onSend: (id: string) => void;
}

const AccountRow: React.FC<RowProps> = ({ account, sent, onSend }) => {
  const [expanded, setExpanded] = useState(false);
  const [draftText, setDraftText] = useState(account.aiDraft);
  const [isSending, setIsSending] = useState(false);
  const [justSent, setJustSent] = useState(false);

  const handleSend = useCallback(() => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setJustSent(true);
      setExpanded(false);
      setTimeout(() => onSend(account.id), 500);
    }, 800);
  }, [account.id, onSend]);

  const isResolved = account.riskLevel === 'Clear' || sent || justSent;

  const rowBg = justSent || sent
    ? 'var(--sapSuccessBackground, rgba(16,126,62,0.05))'
    : 'transparent';

  return (
    <div style={{
      borderLeft: isResolved ? '3px solid transparent' : RISK_BORDER[account.riskLevel],
      background: rowBg,
      transition: 'background 0.4s ease',
      borderBottom: '1px solid var(--sapList_BorderColor)',
    }}>
      {/* ── Row summary ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          alignItems: 'center',
          gap: sp.m,
          padding: `${sp.s} ${sp.m}`,
          cursor: isResolved ? 'default' : 'pointer',
        }}
        onClick={() => { if (!isResolved && account.aiDraft) setExpanded(e => !e); }}
      >
        {/* Name + AI reason */}
        <div>
          <FlexBox alignItems="Center" style={{ gap: sp.s, marginBottom: sp.xs }}>
            <Text style={{
              fontFamily: 'var(--sapFontFamily)',
              fontSize: 'var(--sapFontSize)',
              fontWeight: 'var(--sapFontBoldWeight)',
              color: isResolved ? 'var(--sapContent_LabelColor)' : 'var(--sapTextColor)',
            }}>
              {account.countryCode} {account.name}
            </Text>
            {!isResolved && (
              <Tag design="Set1" colorScheme={RISK_COLOR[account.riskLevel]} style={{ fontSize: 'var(--sapFontSmallSize)' }}>
                {account.riskLevel}
              </Tag>
            )}
            {account.disputeStatus === 'Open' && (
              <Tag design="Set1" colorScheme="3" style={{ fontSize: 'var(--sapFontSmallSize)' }}>Dispute open</Tag>
            )}
            {account.disputeStatus === 'Resolved' && (
              <Tag design="Set1" colorScheme="4" style={{ fontSize: 'var(--sapFontSmallSize)' }}>Dispute resolved</Tag>
            )}
          </FlexBox>
          <Text style={{
            fontFamily: 'var(--sapFontFamily)',
            fontSize: 'var(--sapFontSmallSize)',
            color: 'var(--sapContent_LabelColor)',
            display: 'block',
          }}>
            {isResolved
              ? account.riskDriver
              : `Joule: "${account.riskDriver}"`
            }
          </Text>
        </div>

        {/* Amount + days */}
        <div style={{ textAlign: 'right' }}>
          <Text style={{
            fontFamily: 'var(--sapFontFamily)',
            fontSize: 'var(--sapFontSize)',
            fontWeight: 'var(--sapFontBoldWeight)',
            color: account.riskLevel === 'Critical' ? 'var(--sapNegativeColor)' : 'var(--sapTextColor)',
            display: 'block',
          }}>
            {`EUR ${account.overdueAmount.toLocaleString('de-DE')}`}
          </Text>
          <ObjectStatus state={RISK_STATE[account.riskLevel]}>
            {`${account.overdueDays}d overdue`}
          </ObjectStatus>
        </div>

        {/* Action */}
        {sent || justSent ? (
          <ObjectStatus state="Positive">Sent</ObjectStatus>
        ) : account.riskLevel === 'Clear' ? (
          <ObjectStatus state="Positive">Cleared</ObjectStatus>
        ) : (
          <FlexBox alignItems="Center" style={{ gap: sp.xs }} onClick={e => e.stopPropagation()}>
            <Button
              design="Emphasized"
              icon="email"
              disabled={isSending}
              onClick={e => { e.stopPropagation(); handleSend(); }}
            >
              {isSending ? 'Sending…' : 'Send'}
            </Button>
            <Button
              design="Transparent"
              icon={expanded ? 'decline' : 'edit'}
              tooltip={expanded ? 'Close draft' : 'Edit draft'}
              accessibleName={expanded ? 'Close draft' : 'Edit draft'}
              onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
            />
          </FlexBox>
        )}
      </div>

      {/* ── Inline draft editor ── */}
      {expanded && !isResolved && (
        <div style={{
          padding: `0 ${sp.m} ${sp.m} calc(${sp.m} + 3px)`,
          borderTop: '1px solid var(--sapList_BorderColor)',
        }}>
          <FlexBox alignItems="Center" style={{ gap: sp.xs, padding: `${sp.s} 0`, marginBottom: sp.xs }}>
            <Text style={{
              fontSize: 'var(--sapFontSmallSize)',
              fontWeight: 'var(--sapFontBoldWeight)',
              color: 'var(--sapContent_LabelColor)',
              fontFamily: 'var(--sapFontFamily)',
            }}>
              Joule-drafted in your voice — edit or send as-is
            </Text>
            <Tag design="Set1" colorScheme="6" style={{ fontSize: 'var(--sapFontSmallSize)' }}>AI</Tag>
          </FlexBox>
          {isSending && <BusyIndicator active size="S" style={{ marginBottom: sp.s }} />}
          <TextArea
            value={draftText}
            onInput={(e: any) => setDraftText(e.target.value)}
            rows={11}
            accessibleName="Draft outreach email"
            style={{ width: '100%', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)' }}
          />
          <FlexBox style={{ gap: sp.s, marginTop: sp.s, justifyContent: 'flex-end' }}>
            <Button design="Transparent" onClick={() => setExpanded(false)}>Cancel</Button>
            <Button design="Emphasized" icon="email" disabled={isSending} onClick={handleSend}>
              {isSending ? 'Sending…' : 'Approve & Send'}
            </Button>
          </FlexBox>
        </div>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const BayerCollectionAgentPage: React.FC = () => {
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const handleSend = useCallback((id: string) => {
    setSentIds(prev => new Set([...prev, id]));
    setToastMsg('Outreach sent · SAP record updated');
    setToastOpen(true);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setError('');
    setTimeout(() => {
      setIsLoading(false);
      setToastMsg('Agent rescored all accounts');
      setToastOpen(true);
    }, 900);
  }, []);

  const actionableCount = ACCOUNTS.filter(a => a.riskLevel !== 'Clear').length;
  const sentCount = sentIds.size;
  const allDone = sentCount >= actionableCount;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--sapBackgroundColor)' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: sp.l }}>

        {error && (
          <MessageStrip design="Negative" onClose={() => setError('')} style={{ marginBottom: sp.m }}>
            {error}
          </MessageStrip>
        )}

        {/* ── Progress card ── */}
        <div style={{ ...cardSurface, padding: sp.m, marginBottom: sp.m }}>
          <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ marginBottom: sp.s }}>
            <div>
              <Title level="H5" wrappingType="Normal" style={{ marginBottom: sp.xs }}>
                Today's outreach
              </Title>
              <Text style={{
                fontSize: 'var(--sapFontSmallSize)',
                color: 'var(--sapContent_LabelColor)',
                fontFamily: 'var(--sapFontFamily)',
              }}>
                {sentCount + ' of ' + actionableCount + ' sent · EUR ' + (TOTAL_OVERDUE / 1000).toFixed(0) + 'K total exposure · ' + CRITICAL_HIGH + ' need action today'}
              </Text>
            </div>
            <Text style={{
              fontSize: 'var(--sapFontLargeSize)',
              fontWeight: 'var(--sapFontBoldWeight)',
              color: allDone ? 'var(--sapPositiveColor)' : 'var(--sapTextColor)',
              fontFamily: 'var(--sapFontFamily)',
            }}>
              {allDone ? 'All clear ✓' : `${actionableCount - sentCount} remaining`}
            </Text>
          </FlexBox>
          {/* Progress track */}
          <div style={{
            height: '4px',
            background: 'var(--sapField_BorderColor)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: ((sentCount / actionableCount) * 100) + '%',
              background: allDone ? 'var(--sapPositiveColor)' : 'var(--sapBrandColor)',
              transition: 'width 0.5s ease',
              borderRadius: '2px',
            }} />
          </div>
        </div>

        {/* ── AI-prioritised worklist ── */}
        <div style={{ ...cardSurface }}>
          <div style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
            <Toolbar design="Transparent" style={{ paddingInline: 0 }}>
              <div>
                <Title level="H5" wrappingType="Normal">AI-Prioritised Worklist</Title>
                <Text style={{
                  fontSize: 'var(--sapFontSmallSize)',
                  color: 'var(--sapContent_LabelColor)',
                  fontFamily: 'var(--sapFontFamily)',
                }}>
                  {`Joule drafts armed · ${ACCOUNTS.length} accounts · ranked by predicted payment risk`}
                </Text>
              </div>
              <ToolbarSpacer />
              <Button
                icon="refresh"
                design="Transparent"
                tooltip="Refresh risk scores"
                accessibleName="Refresh risk scores"
                onClick={handleRefresh}
              />
            </Toolbar>
          </div>

          {isLoading ? (
            <div style={{ padding: sp.l, display: 'flex', justifyContent: 'center' }}>
              <BusyIndicator active size="M" />
            </div>
          ) : ACCOUNTS.length === 0 ? (
            <div style={{ padding: sp.l, textAlign: 'center' }}>
              <Text style={{
                color: 'var(--sapPositiveColor)',
                fontFamily: 'var(--sapFontFamily)',
                fontSize: 'var(--sapFontLargeSize)',
                fontWeight: 'var(--sapFontBoldWeight)',
              }}>
                All accounts cleared — outstanding work today.
              </Text>
            </div>
          ) : (
            <div>
              {ACCOUNTS.map(account => (
                <AccountRow
                  key={account.id}
                  account={account}
                  sent={sentIds.has(account.id)}
                  onSend={handleSend}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      <Toast
        open={toastOpen}
        duration={3000}
        placement="BottomCenter"
        onClose={() => setToastOpen(false)}
      >
        {toastMsg}
      </Toast>
    </div>
  );
};

export default BayerCollectionAgentPage;
