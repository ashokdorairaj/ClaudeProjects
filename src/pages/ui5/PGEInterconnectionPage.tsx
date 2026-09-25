'use client';
import React, { useState, useMemo, useCallback, useRef } from 'react';
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
  AnalyticalTable,
  IllustratedMessage,
  ShellBar,
  ShellBarItem,
  Avatar,
  ResponsivePopover,
  List,
  ListItemStandard,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-react/styles.css';
import '@ui5/webcomponents-icons/dist/AllIcons.js';
import '@ui5/webcomponents-fiori/dist/illustrations/AllIllustrations.js';

// ─── Spacing tokens ────────────────────────────────────────────────────────────
const sp = {
  xs: 'var(--sapSpacingXSmallSize, 0.25rem)',
  s:  'var(--sapSpacingSmallSize, 0.5rem)',
  m:  'var(--sapSpacingMediumSize, 1rem)',
  l:  'var(--sapSpacingLargeSize, 2rem)',
  g:  'var(--sapContent_GridGutter, 1rem)',
};

// ─── Types ─────────────────────────────────────────────────────────────────────
type UI5State = 'Positive' | 'Negative' | 'Critical' | 'Information' | 'None';
type Priority = 'High' | 'Medium' | 'Low';
type SLAStatus = 'Breached' | 'At Risk' | 'On Track';

interface Project {
  id: string;
  name: string;
  priority: Priority;
  slaStatus: SLAStatus;
  requestedMW: number;
  daysInQueue: number;
  currentPhase: string;
  region: string;
  agentStatus: string;
  predictedDelay: number;
  estCompletionMin: number;
  estCompletionMax: number;
  _highlight: string;
}

// ─── Static lookup maps ────────────────────────────────────────────────────────
const PRIORITY_COLOR: Record<Priority, '1' | '2' | '3' | '4' | '5' | '6'> = {
  High:   '2',
  Medium: '3',
  Low:    '4',
};

const SLA_STATE: Record<SLAStatus, UI5State> = {
  Breached:  'Negative',
  'At Risk': 'Critical',
  'On Track': 'Positive',
};

const HIGHLIGHT_COLOR: Record<SLAStatus, string> = {
  Breached:  'var(--sapNegativeColor)',
  'At Risk': 'var(--sapCriticalColor)',
  'On Track': 'transparent',
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const PROJECTS: Project[] = [
  { id: 'PGE-2025-001', name: 'Elkhorn Solar Farm Phase II',           priority: 'High',   slaStatus: 'Breached',  requestedMW: 45.00, daysInQueue: 142, currentPhase: 'Study',          region: 'Bay Area',      agentStatus: 'Analysis complete — review AI insights', predictedDelay: 52,  estCompletionMin: 38, estCompletionMax: 71,  _highlight: 'var(--sapNegativeColor)' },
  { id: 'PGE-2025-002', name: 'Fresno Agricultural Solar Cluster',     priority: 'High',   slaStatus: 'Breached',  requestedMW: 38.50, daysInQueue: 178, currentPhase: 'Agreement',      region: 'Central Valley',agentStatus: 'Analysis complete — review AI insights', predictedDelay: 85,  estCompletionMin: 60, estCompletionMax: 95,  _highlight: 'var(--sapNegativeColor)' },
  { id: 'PGE-2025-003', name: 'Marin County Wind Resource',            priority: 'High',   slaStatus: 'Breached',  requestedMW: 4.80,  daysInQueue: 89,  currentPhase: 'Study',          region: 'North Bay',     agentStatus: 'Analysis complete — review AI insights', predictedDelay: 22,  estCompletionMin: 22, estCompletionMax: 45,  _highlight: 'var(--sapNegativeColor)' },
  { id: 'PGE-2025-004', name: 'Tracy Battery Storage Hub',             priority: 'High',   slaStatus: 'Breached',  requestedMW: 25.00, daysInQueue: 156, currentPhase: 'Study',          region: 'Central Valley',agentStatus: 'Analysis complete — review AI insights', predictedDelay: 66,  estCompletionMin: 50, estCompletionMax: 85,  _highlight: 'var(--sapNegativeColor)' },
  { id: 'PGE-2025-005', name: 'Stockton EV Fleet Charging',            priority: 'High',   slaStatus: 'Breached',  requestedMW: 18.20, daysInQueue: 112, currentPhase: 'Agreement',      region: 'Central Valley',agentStatus: 'Paused — awaiting decision on cost estimate appeal', predictedDelay: 37,  estCompletionMin: 28, estCompletionMax: 55,  _highlight: 'var(--sapNegativeColor)' },
  { id: 'PGE-2025-006', name: 'San Jose South Solar Campus',           priority: 'Medium', slaStatus: 'At Risk',   requestedMW: 12.50, daysInQueue: 67,  currentPhase: 'Study',          region: 'South Bay',     agentStatus: 'Analysis complete — review AI insights', predictedDelay: 18,  estCompletionMin: 12, estCompletionMax: 30,  _highlight: 'var(--sapCriticalColor)' },
  { id: 'PGE-2025-007', name: 'Napa Valley Fuel Cell Plant',           priority: 'Medium', slaStatus: 'At Risk',   requestedMW: 3.20,  daysInQueue: 44,  currentPhase: 'Study',          region: 'North Bay',     agentStatus: 'Analysis complete — review AI insights', predictedDelay: 12,  estCompletionMin: 8,  estCompletionMax: 20,  _highlight: 'var(--sapCriticalColor)' },
  { id: 'PGE-2025-008', name: 'Antioch Community Solar',               priority: 'Medium', slaStatus: 'At Risk',   requestedMW: 7.80,  daysInQueue: 55,  currentPhase: 'Study',          region: 'Bay Area',      agentStatus: 'Analysis complete — review AI insights', predictedDelay: 8,   estCompletionMin: 5,  estCompletionMax: 18,  _highlight: 'var(--sapCriticalColor)' },
  { id: 'PGE-2025-009', name: 'Sacramento Data Center Solar',          priority: 'Medium', slaStatus: 'At Risk',   requestedMW: 22.00, daysInQueue: 78,  currentPhase: 'Agreement',      region: 'Sacramento',    agentStatus: 'Analysis complete — review AI insights', predictedDelay: 25,  estCompletionMin: 18, estCompletionMax: 40,  _highlight: 'var(--sapCriticalColor)' },
  { id: 'PGE-2025-010', name: 'Monterey Peninsula Wind+Storage',       priority: 'Medium', slaStatus: 'On Track',  requestedMW: 15.50, daysInQueue: 33,  currentPhase: 'Implementation', region: 'Peninsula',     agentStatus: 'Analysis complete — review AI insights', predictedDelay: 5,   estCompletionMin: 3,  estCompletionMax: 12,  _highlight: 'transparent' },
  { id: 'PGE-2025-011', name: 'Fresno Biogas Generator',               priority: 'Medium', slaStatus: 'At Risk',   requestedMW: 2.10,  daysInQueue: 88,  currentPhase: 'Study',          region: 'Central Valley',agentStatus: 'Analysis complete — review AI insights', predictedDelay: 30,  estCompletionMin: 22, estCompletionMax: 45,  _highlight: 'var(--sapCriticalColor)' },
  { id: 'PGE-2025-012', name: 'Richmond Industrial Solar',             priority: 'Medium', slaStatus: 'On Track',  requestedMW: 9.00,  daysInQueue: 41,  currentPhase: 'Study',          region: 'Bay Area',      agentStatus: 'Analysis complete — review AI insights', predictedDelay: 6,   estCompletionMin: 3,  estCompletionMax: 14,  _highlight: 'transparent' },
  { id: 'PGE-2025-013', name: 'Bakersfield Solar Ranch',               priority: 'Medium', slaStatus: 'On Track',  requestedMW: 50.00, daysInQueue: 22,  currentPhase: 'Study',          region: 'Central Valley',agentStatus: 'Analysis complete — review AI insights', predictedDelay: 0,   estCompletionMin: 0,  estCompletionMax: 0,   _highlight: 'transparent' },
  { id: 'PGE-2025-014', name: 'San Francisco Rooftop Solar Portfolio', priority: 'Low',    slaStatus: 'On Track',  requestedMW: 1.20,  daysInQueue: 15,  currentPhase: 'Study',          region: 'Bay Area',      agentStatus: 'Analysis complete — review AI insights', predictedDelay: 0,   estCompletionMin: 0,  estCompletionMax: 0,   _highlight: 'transparent' },
  { id: 'PGE-2025-015', name: 'Concord EV Charging Station',           priority: 'Low',    slaStatus: 'On Track',  requestedMW: 3.50,  daysInQueue: 10,  currentPhase: 'Study',          region: 'Bay Area',      agentStatus: 'Analysis complete — review AI insights', predictedDelay: 0,   estCompletionMin: 0,  estCompletionMax: 0,   _highlight: 'transparent' },
  { id: 'PGE-2025-016', name: 'Elk Grove Community Solar',             priority: 'Low',    slaStatus: 'On Track',  requestedMW: 5.50,  daysInQueue: 18,  currentPhase: 'Study',          region: 'Sacramento',    agentStatus: 'Analysis complete — review AI insights', predictedDelay: 0,   estCompletionMin: 0,  estCompletionMax: 0,   _highlight: 'transparent' },
  { id: 'PGE-2025-017', name: 'Half Moon Bay Offshore Wind Prep',      priority: 'Low',    slaStatus: 'On Track',  requestedMW: 8.00,  daysInQueue: 125, currentPhase: 'Agreement',      region: 'Peninsula',     agentStatus: 'Paused — awaiting applicant signature on interconnection agreement', predictedDelay: 10,  estCompletionMin: 7,  estCompletionMax: 18,  _highlight: 'transparent' },
  { id: 'PGE-2025-018', name: 'Roseville Battery Storage',             priority: 'Low',    slaStatus: 'On Track',  requestedMW: 6.00,  daysInQueue: 65,  currentPhase: 'Implementation', region: 'Sacramento',    agentStatus: 'Analysis complete — review AI insights', predictedDelay: 5,   estCompletionMin: 3,  estCompletionMax: 10,  _highlight: 'transparent' },
  { id: 'PGE-2025-019', name: 'San Mateo Solar + Storage',             priority: 'Low',    slaStatus: 'On Track',  requestedMW: 4.20,  daysInQueue: 8,   currentPhase: 'Implementation', region: 'Peninsula',     agentStatus: 'Analysis complete — review AI insights', predictedDelay: 0,   estCompletionMin: 0,  estCompletionMax: 0,   _highlight: 'transparent' },
  { id: 'PGE-2025-020', name: 'Livermore Wind Expansion',              priority: 'Low',    slaStatus: 'On Track',  requestedMW: 11.00, daysInQueue: 30,  currentPhase: 'Study',          region: 'Bay Area',      agentStatus: 'Analysis complete — review AI insights', predictedDelay: 0,   estCompletionMin: 0,  estCompletionMax: 0,   _highlight: 'transparent' },
];

// ─── Computed KPIs ─────────────────────────────────────────────────────────────
const KPI_BREACHED_SLA   = PROJECTS.filter(p => p.slaStatus === 'Breached').length;
const KPI_AT_RISK        = PROJECTS.filter(p => p.slaStatus === 'At Risk').length;
const KPI_MW_REQUESTED   = PROJECTS.reduce((s, p) => s + p.requestedMW, 0);
const KPI_APP_BLOCKED    = PROJECTS.filter(p => p.agentStatus.toLowerCase().includes('paused')).length;
const KPI_EMERGING_DELAYS = PROJECTS.filter(p => p.predictedDelay > 20 && p.slaStatus === 'On Track').length;

// ─── Card surface ──────────────────────────────────────────────────────────────
const cardSurface: React.CSSProperties = {
  borderRadius: 'var(--sapTile_BorderCornerRadius)',
  boxShadow: 'var(--sapContent_Shadow0)',
  background: 'var(--sapTile_Background)',
  border: '1px solid var(--sapTile_BorderColor)',
  overflow: 'hidden',
};

// ─── Page ──────────────────────────────────────────────────────────────────────
const PGEInterconnectionPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [error, setError] = useState('');
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(new Set());
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverOpener, setPopoverOpener] = useState<HTMLElement | null>(null);
  const callCountRef = useRef(0);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOpen(true);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setError('');
    callCountRef.current += 1;
    setTimeout(() => {
      setIsLoading(false);
      if (callCountRef.current % 15 === 0) {
        setError('Failed to refresh queue data. Retry or contact the grid operations team.');
      } else {
        showToast('Queue data refreshed');
      }
    }, 800);
  }, [showToast]);

  const handleExport = useCallback(() => {
    showToast('Exporting project queue to Excel…');
  }, [showToast]);

  const handleReviewInsights = useCallback((projectId: string) => {
    showToast('Opening AI insights for ' + projectId);
  }, [showToast]);

  const visibleAlerts = [
    { id: 0, design: 'Negative' as const, text: 'Agreement Review in Central Valley is taking 2× the normal cycle time — 5 projects affected' },
    { id: 1, design: 'Critical' as const, text: 'Study Engineering in Bay Area has 3 projects with predicted delays exceeding 60 days — engineer bandwidth may be exhausted' },
    { id: 2, design: 'Critical' as const, text: '2 Fast Track projects have exceeded their 45-day SLA target — review Fast Track eligibility criteria' },
  ].filter(a => !dismissedAlerts.has(a.id));

  const columns = useMemo(() => [
    {
      Header: 'Project #',
      accessor: 'id',
      width: 110,
      Cell: ({ value }: { value: string }) => (
        <Text maxLines={1} style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', color: 'var(--sapLinkColor, var(--sapBrandColor))', cursor: 'pointer' }}>
          {value}
        </Text>
      ),
    },
    {
      Header: 'Project Name',
      accessor: 'name',
      width: 220,
      Cell: ({ value }: { value: string }) => (
        <Text maxLines={1} style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)' }}>{value}</Text>
      ),
    },
    {
      Header: 'Priority',
      accessor: 'priority',
      width: 80,
      Cell: ({ value }: { value: Priority }) => (
        <Tag design="Set1" colorScheme={PRIORITY_COLOR[value]} style={{ fontSize: 'var(--sapFontSmallSize)' }}>{value}</Tag>
      ),
    },
    {
      Header: 'SLA Status',
      accessor: 'slaStatus',
      width: 100,
      Cell: ({ value }: { value: SLAStatus }) => (
        <ObjectStatus state={SLA_STATE[value]}>{value}</ObjectStatus>
      ),
    },
    {
      Header: 'Req. MW',
      accessor: 'requestedMW',
      width: 80,
      Cell: ({ value }: { value: number }) => (
        <Text maxLines={1} style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)' }}>{value.toFixed(2)}</Text>
      ),
    },
    {
      Header: 'Days in Queue',
      accessor: 'daysInQueue',
      width: 90,
      Cell: ({ value }: { value: number }) => (
        <Text maxLines={1} style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)' }}>{value}</Text>
      ),
    },
    {
      Header: 'Current Phase',
      accessor: 'currentPhase',
      width: 120,
      Cell: ({ value }: { value: string }) => (
        <Text maxLines={1} style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)' }}>{value}</Text>
      ),
    },
    {
      Header: 'Region',
      accessor: 'region',
      width: 120,
      Cell: ({ value }: { value: string }) => (
        <Text maxLines={1} style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)' }}>{value}</Text>
      ),
    },
    {
      Header: 'Agent Status',
      accessor: 'agentStatus',
      Cell: ({ value, row }: { value: string; row: { original: Project } }) => {
        const isActionable = value.includes('review AI insights');
        return isActionable ? (
          <Button
            design="Transparent"
            icon="ai"
            style={{ fontSize: 'var(--sapFontSmallSize)' }}
            onClick={() => handleReviewInsights(row.original.id)}
          >
            Review AI insights
          </Button>
        ) : (
          <Text maxLines={2} style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{value}</Text>
        );
      },
    },
    {
      Header: 'Pred. Delay (d)',
      accessor: 'predictedDelay',
      width: 100,
      Cell: ({ value }: { value: number }) => {
        const state: UI5State = value >= 50 ? 'Negative' : value >= 20 ? 'Critical' : value > 0 ? 'Information' : 'None';
        return value > 0
          ? <ObjectStatus state={state}>{String(value)}</ObjectStatus>
          : <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)' }}>0</Text>;
      },
    },
    {
      Header: 'Est. Completion',
      accessor: 'estCompletionMin',
      width: 120,
      Cell: ({ row }: { row: { original: Project } }) => {
        const { estCompletionMin: mn, estCompletionMax: mx } = row.original;
        if (mn === 0 && mx === 0) return <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)' }}>0 days</Text>;
        return <Text maxLines={1} style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)' }}>{mn + '–' + mx + ' days'}</Text>;
      },
    },
  ], [handleReviewInsights]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--sapBackgroundColor)' }}>
      <ShellBar
        logo={<img src="https://www.sap.com/dam/application/shared/logos/sap-logo-svg.svg/sap-logo-svg.svg" alt="SAP" style={{ height: 24 }} />}
        primaryTitle="PGE Interconnection Intelligence"
        secondaryTitle="Grid Operations"
        profile={
          <Avatar slot="profile" shape="Circle" size="XS" initials="DL" colorScheme="6" accessibleName="D L — profile" />
        }
        onProfileClick={(e) => {
          setPopoverOpener(e.detail.targetRef as HTMLElement);
          setPopoverOpen(true);
        }}
        showNotifications
        notificationsCount="3"
      >
        <ShellBarItem icon="simulate" text="What-If Planning" onClick={() => showToast('What-If Planning')} />
        <ShellBarItem icon="bar-chart" text="Portfolio Intelligence" onClick={() => showToast('Portfolio Intelligence')} />
      </ShellBar>

      <ResponsivePopover
        open={popoverOpen}
        opener={popoverOpener ?? undefined}
        placement="Bottom"
        onClose={() => setPopoverOpen(false)}
      >
        <List>
          <ListItemStandard icon="settings" onClick={() => { setPopoverOpen(false); showToast('Settings'); }}>Settings</ListItemStandard>
          <ListItemStandard icon="log" onClick={() => { setPopoverOpen(false); showToast('Signed out'); }}>Sign Out</ListItemStandard>
        </List>
      </ResponsivePopover>

      <div style={{ flex: 1, overflowY: 'auto', paddingTop: sp.m, paddingBottom: sp.m, paddingLeft: sp.g, paddingRight: sp.g }}>

        {/* ── AI alert banners ── */}
        {error && (
          <MessageStrip design="Negative" onClose={() => setError('')} style={{ marginBottom: sp.s }}>
            {error}
          </MessageStrip>
        )}
        {visibleAlerts.map(alert => (
          <MessageStrip
            key={alert.id}
            design={alert.design}
            onClose={() => setDismissedAlerts(prev => new Set([...prev, alert.id]))}
            style={{ marginBottom: sp.s }}
          >
            {alert.text}
          </MessageStrip>
        ))}

        {/* ── KPI strip ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: sp.m, marginBottom: sp.m }}>
          {[
            { label: 'Breached SLA',       value: KPI_BREACHED_SLA,             state: 'Negative' as UI5State },
            { label: 'At-Risk',            value: KPI_AT_RISK,                  state: 'Critical' as UI5State },
            { label: 'MW Requested',       value: KPI_MW_REQUESTED.toFixed(1),  state: 'None' as UI5State },
            { label: 'Applicant-Blocked',  value: KPI_APP_BLOCKED,              state: 'Critical' as UI5State },
            { label: 'Emerging Delays',    value: KPI_EMERGING_DELAYS,          state: 'Critical' as UI5State },
          ].map(kpi => (
            <div key={kpi.label} style={{ ...cardSurface, padding: sp.m }}>
              <Text style={{
                fontFamily: 'var(--sapFontFamily)',
                fontSize: 'var(--sapFontSmallSize)',
                color: 'var(--sapContent_LabelColor)',
                display: 'block',
                marginBottom: sp.xs,
              }}>
                {kpi.label}
              </Text>
              <ObjectStatus
                state={kpi.state}
                style={{ fontSize: 'var(--sapFontHeader2Size)', fontWeight: 'var(--sapFontBoldWeight)' } as React.CSSProperties}
              >
                {String(kpi.value)}
              </ObjectStatus>
            </div>
          ))}
        </div>

        {/* ── Projects table ── */}
        <div style={cardSurface}>
          <div style={{ paddingTop: sp.s, paddingBottom: sp.s, paddingLeft: sp.m, paddingRight: sp.m, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
            <Toolbar design="Transparent" style={{ paddingInline: 0 }}>
              <div>
                <Title level="H5" wrappingType="Normal">Projects ({PROJECTS.length})</Title>
              </div>
              <ToolbarSpacer />
              <Button design="Transparent" icon="copy" tooltip="Copy table" accessibleName="Copy table" onClick={() => showToast('Table copied to clipboard')} />
              <Button design="Transparent" icon="excel-attachment" tooltip="Export to Excel" accessibleName="Export to Excel" onClick={handleExport} />
              <Button design="Transparent" icon="refresh" tooltip="Refresh" accessibleName="Refresh queue data" onClick={handleRefresh} />
            </Toolbar>
          </div>

          {isLoading ? (
            <div style={{ padding: sp.l, display: 'flex', justifyContent: 'center' }}>
              <BusyIndicator active size="M" />
            </div>
          ) : (
            <div data-ui5-compact-size>
              <AnalyticalTable
                columns={columns}
                data={PROJECTS}
                withRowHighlight
                highlightField="_highlight"
                overflowMode="Popin"
                scaleWidthMode="Smart"
                noDataText="No projects in queue"
                minRows={5}
                style={{ width: '100%' }}
              />
            </div>
          )}
        </div>

      </div>

      <Toast open={toastOpen} duration={3000} placement="BottomCenter" onClose={() => setToastOpen(false)}>
        {toastMsg}
      </Toast>
    </div>
  );
};

export default PGEInterconnectionPage;
