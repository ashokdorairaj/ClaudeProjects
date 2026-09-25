// AldiTMRefinementV2Planner.tsx
// Planner views: Session Start, Planning Overview, Rule Evaluation, Proposal Review, Change Summary.
// Session Start filters Rule Profiles to active + effective (today >= effectiveFrom, today <= effectiveTo).
// All other planner views are unchanged from V1.

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Title, Text, Tag, Button, Icon, ObjectStatus, MessageStrip, Toast,
  TextArea, Label, FlexBox, IllustratedMessage, BusyIndicator, Select, Option, Input,
} from '@ui5/webcomponents-react';

import {
  sp, cardSurface, labelText, bodyText, sectionTitle, PageTitle,
  RULE_LABELS, INITIAL_PACKAGES, TM_PROFILE, SESSION_ID,
  StatusBadge, ObjectKindIcon, LOADED_FOS, RESOURCE_SUMMARY, RULE_DESCRIPTORS,
  TOTAL_FOS, TOTAL_STOPS, TOTAL_PALLETS_EXACT, TOTAL_RESOURCES,
  TOTAL_DISTANCE_KM, TOTAL_COST_EUR, AVG_UTILIZATION, OVER_CAPACITY_COUNT,
  MOCK_TM_PROFILE_SETS,
  type RecPackage, type PackageState, type RuleId, type SetupStatus, type RuleProfileV2,
  type TmProfileSet,
} from './AldiTMRefinementV2Shared';

// ─── Helpers ──────────────────────────────────────────────────────────────────
interface StepCardProps { num: number; title: string; subtitle?: string; done?: boolean; children: React.ReactNode; }
const StepCard: React.FC<StepCardProps> = ({ num, title, subtitle, done, children }) => (
  <div style={{ ...cardSurface, padding: sp.m }}>
    <FlexBox alignItems="Center" style={{ gap: sp.s, marginBottom: sp.s }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? 'var(--sapPositiveColor)' : 'var(--sapBrandColor,#0a6ed1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'var(--sapFontBoldWeight,700)', fontSize: 'var(--sapFontSmallSize)', flexShrink: 0 }}>
        {done ? '✓' : num}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Title level="H5">{title}</Title>
        {subtitle && <Text style={{ ...labelText, display: 'block', marginTop: '2px' }}>{subtitle}</Text>}
      </div>
    </FlexBox>
    <div style={{ paddingLeft: 36 }}>{children}</div>
  </div>
);

interface KpiBlockProps { label: string; value: string; tone?: 'default' | 'warning'; }
const KpiBlock: React.FC<KpiBlockProps> = ({ label, value, tone = 'default' }) => (
  <div>
    <Text style={labelText}>{label}</Text>
    <Title level="H3" style={{ marginTop: '2px', color: tone === 'warning' ? 'var(--sapCriticalTextColor,#b25500)' : undefined }}>{value}</Title>
  </div>
);

// ─── TODAY constant (demo: 2026-07-06) ───────────────────────────────────────
const TODAY = '2026-07-06';

// Filter profiles to planner-visible: active, today >= effectiveFrom, today <= effectiveTo (if set)
function getEffectiveProfiles(profiles: RuleProfileV2[]): RuleProfileV2[] {
  return profiles.filter(p => {
    if (p.status !== 'active') return false;
    if (TODAY < p.effectiveFrom) return false;
    if (p.effectiveTo && TODAY > p.effectiveTo) return false;
    return true;
  });
}

// ============================================================================
// VIEW 1 — Session Start
// ============================================================================

// Read-only detail row — label + monospace value
const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <FlexBox alignItems="Baseline" style={{ gap: sp.l }}>
    <Text style={{ ...labelText, minWidth: 220, flexShrink: 0 }}>{label}</Text>
    <Text style={{ fontFamily: 'var(--sapFontMonospaceFamily,monospace)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{value}</Text>
  </FlexBox>
);

export const View1SessionStart: React.FC<{
  onSessionLoaded: () => void;
  setupStatus: SetupStatus;
  ruleProfiles: RuleProfileV2[];
  onGoToSystemSetup?: () => void;
}> = ({ onSessionLoaded, setupStatus, ruleProfiles, onGoToSystemSetup }) => {
  const [selectedProfileSetId, setSelectedProfileSetId] = useState<string | null>(null);
  const [ruleProfileId, setRuleProfileId]               = useState<string | null>(null);
  const [showRuleList, setShowRuleList]                 = useState(false);
  const [toastOpen, setToastOpen]                       = useState(false);
  const [toastMessage, setToastMessage]                 = useState('');

  // Simulate TM API fetch for profile sets — only fires when setup is active
  const [psLoadState, setPsLoadState] = useState<'idle' | 'loading' | 'loaded'>('idle');

  useEffect(() => {
    if (setupStatus === 'active' && psLoadState === 'idle') {
      setPsLoadState('loading');
      const t = setTimeout(() => setPsLoadState('loaded'), 1400);
      return () => clearTimeout(t);
    }
    if (setupStatus !== 'active') {
      setPsLoadState('idle');
      setSelectedProfileSetId(null);
    }
  }, [setupStatus]);

  const effectiveProfiles = useMemo(() => getEffectiveProfiles(ruleProfiles), [ruleProfiles]);

  useEffect(() => {
    if (effectiveProfiles.length === 1 && !ruleProfileId) {
      setRuleProfileId(effectiveProfiles[0].id);
    }
  }, [effectiveProfiles]);

  const showToast        = (m: string) => { setToastMessage(m); setToastOpen(true); };
  const selectedPS       = MOCK_TM_PROFILE_SETS.find(p => p.id === selectedProfileSetId) ?? null;
  const selectedRP       = effectiveProfiles.find(p => p.id === ruleProfileId) ?? null;
  const canLoad          = setupStatus === 'active' && psLoadState === 'loaded' && !!selectedPS && !!selectedRP;

  // Shared field-set container style
  const detailBox: React.CSSProperties = {
    marginTop: sp.s,
    padding: `${sp.s} ${sp.m}`,
    background: 'var(--sapGroup_ContentBackground,#f7f7f7)',
    border: '1px solid var(--sapField_BorderColor)',
    borderRadius: 'var(--sapElement_BorderCornerRadius,4px)',
    display: 'flex',
    flexDirection: 'column',
    gap: sp.xs,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: `-${sp.l}` }}>
      <PageTitle
        title="Start a Planning Refinement Session"
        subtitle="Select a TM Profile Set and a Rule Profile, then load the planning session."
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: sp.l }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: sp.l }}>


          {/* ── System status banner ─────────────────────────────────────── */}
          {setupStatus === 'active' && (
            <div style={{ padding: `${sp.s} ${sp.m}`, background: 'var(--sapSuccessBackground,#f0fdf4)', border: '1px solid var(--sapPositiveColor)', borderRadius: 'var(--sapElement_BorderCornerRadius,4px)', marginBottom: sp.m }}>
              <FlexBox alignItems="Center" style={{ gap: sp.s }}>
                <Icon name="sys-enter-2" style={{ color: 'var(--sapPositiveColor)', flexShrink: 0 }} />
                <FlexBox direction="Column" style={{ gap: 2 }}>
                  <Text style={{ fontWeight: 700, color: 'var(--sapPositiveTextColor,#1b6b3a)' }}>SAP TM connection is active</Text>
                  <Text style={labelText}>Profile Sets and Rule Profiles are available. Select both below to start a session.</Text>
                </FlexBox>
              </FlexBox>
            </div>
          )}

          {/* ── Step 1: TM Profile Set ────────────────────────────────────── */}
          <StepCard num={1} title="TM Profile Set" done={!!selectedPS}>

            {/* State A: setup not active — different message for admin vs planner */}
            {setupStatus !== 'active' && (
              <FlexBox direction="Column" style={{ gap: sp.m }}>
                <MessageStrip design="Warning" hideCloseButton>
                  {onGoToSystemSetup
                    ? 'System setup is not complete. Configure the SAP TM connection in System Setup before planners can start sessions.'
                    : 'System setup is not complete. TM Profile Sets cannot be loaded. Contact your administrator to configure the SAP TM connection.'}
                </MessageStrip>
                {onGoToSystemSetup && (
                  <FlexBox>
                    <Button design="Emphasized" icon="action-settings" onClick={onGoToSystemSetup}>
                      Go to System Setup
                    </Button>
                  </FlexBox>
                )}
              </FlexBox>
            )}

            {/* State B: loading */}
            {setupStatus === 'active' && psLoadState === 'loading' && (
              <FlexBox alignItems="Center" style={{ gap: sp.m, padding: sp.m }}>
                <BusyIndicator active size="S" />
                <Text style={labelText}>Loading Profile Sets from SAP TM…</Text>
              </FlexBox>
            )}

            {/* State C: loaded */}
            {setupStatus === 'active' && psLoadState === 'loaded' && (
              <>
                <FlexBox alignItems="Center" style={{ gap: sp.xs, marginBottom: sp.m }}>
                  <Icon name="connected" />
                  <Text style={labelText}>
                    Loaded from SAP TM · {MOCK_TM_PROFILE_SETS.length} profile sets authorised for your user
                  </Text>
                  <Tag colorScheme="8" style={{ marginLeft: sp.xs }}>Read-only</Tag>
                </FlexBox>

                <Label required style={{ display: 'block', marginBottom: sp.xs }}>Profile Set</Label>
                <Select
                  style={{ width: 480, maxWidth: '100%' }}
                  onChange={(e) => {
                    const v = e.detail?.selectedOption?.getAttribute('data-ps-id');
                    setSelectedProfileSetId(v ?? null);
                  }}
                >
                  <Option data-ps-id="" selected={!selectedProfileSetId}>Select a Profile Set…</Option>
                  {MOCK_TM_PROFILE_SETS.map(ps => (
                    <Option key={ps.id} data-ps-id={ps.id} selected={selectedProfileSetId === ps.id}>
                      {ps.description}
                    </Option>
                  ))}
                </Select>

                {selectedPS && (
                  <div style={detailBox}>
                    <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ marginBottom: sp.xs }}>
                      <Text style={sectionTitle}>Selected Profile Set</Text>
                      <Tag colorScheme="8">{selectedPS.id}</Tag>
                    </FlexBox>
                    <DetailRow label="Freight Unit Selection Profile"  value={selectedPS.freightUnitSelectionProfile} />
                    <DetailRow label="Freight Order Selection Profile" value={selectedPS.freightOrderSelectionProfile} />
                    <FlexBox alignItems="Center" style={{ gap: sp.xs, marginTop: sp.xs }}>
                      <Icon name="locked" />
                      <Text style={{ ...labelText, fontStyle: 'italic' }}>
                        Maintained in SAP TM · contact your TM administrator to modify Profile Sets
                      </Text>
                    </FlexBox>
                  </div>
                )}
              </>
            )}

          </StepCard>

          {/* ── Step 2: Rule Profile ──────────────────────────────────────── */}
          <StepCard num={2} title="Rule Profile" done={!!selectedRP}>
            {effectiveProfiles.length === 0 ? (
              <MessageStrip design="Warning" hideCloseButton>
                No active rule profiles available for today's date. Ask an admin to activate a profile.
              </MessageStrip>
            ) : (
              <>
                <Label required style={{ display: 'block', marginBottom: sp.xs }}>Rule Profile</Label>
                <Select
                  style={{ width: 480, maxWidth: '100%' }}
                  onChange={(e: any) => {
                    const v = e.detail?.selectedOption?.getAttribute('data-rp-id');
                    setRuleProfileId(v ?? null);
                  }}
                >
                  <Option data-rp-id="" selected={!ruleProfileId}>Select a Rule Profile…</Option>
                  {effectiveProfiles.map(p => (
                    <Option key={p.id} data-rp-id={p.id} selected={ruleProfileId === p.id}>
                      {p.name}
                    </Option>
                  ))}
                </Select>

                {/* Detail strip */}
                {selectedRP && (
                  <div style={detailBox}>
                    <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ marginBottom: sp.xs }}>
                      <Text style={sectionTitle}>Selected Rule Profile</Text>
                      <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
                        <Tag colorScheme="8">{selectedRP.id}</Tag>
                        <ObjectStatus state="Positive">Active</ObjectStatus>
                      </FlexBox>
                    </FlexBox>
                    <DetailRow label="DC / Region"       value={selectedRP.dc} />
                    <DetailRow label="Effective period"  value={`${selectedRP.effectiveFrom} → ${selectedRP.effectiveTo || 'No end date'}`} />
                    <DetailRow label="Rules assigned"    value={`${selectedRP.ruleIds.length} rule${selectedRP.ruleIds.length !== 1 ? 's' : ''}`} />
                    <FlexBox alignItems="Center" style={{ marginTop: sp.xs }}>
                      <Button
                        design="Transparent"
                        icon={showRuleList ? 'navigation-down-arrow' : 'navigation-right-arrow'}
                        onClick={() => setShowRuleList(v => !v)}
                      >
                        {showRuleList ? 'Hide rules' : `Show assigned rules`}
                      </Button>
                    </FlexBox>
                    {showRuleList && (
                      <div style={{ paddingLeft: sp.m, borderLeft: `3px solid var(--sapSelectedColor,#0070f2)`, display: 'flex', flexDirection: 'column', gap: sp.xs }}>
                        {(Object.keys(RULE_LABELS) as RuleId[]).map(rid => (
                          <FlexBox key={rid} alignItems="Center" style={{ gap: sp.xs }}>
                            <Icon name="accept" />
                            <Tag design="Set2" colorScheme="6">{rid}</Tag>
                            <Text style={bodyText}>{RULE_LABELS[rid]}</Text>
                          </FlexBox>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </>
            )}
          </StepCard>

        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div style={{ padding: `${sp.s} ${sp.l}`, borderTop: '1px solid var(--sapList_BorderColor)', background: 'var(--sapObjectHeader_Background,#fff)' }}>
        {setupStatus !== 'active' && (
          <MessageStrip design="Warning" hideCloseButton style={{ marginBottom: sp.s }}>
            System setup is not complete. An admin must activate System Setup before planning sessions can start.
          </MessageStrip>
        )}
        <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ gap: sp.s, flexWrap: 'wrap' }}>
          <Text style={labelText}>
            {setupStatus !== 'active' && 'Complete System Setup before starting a planning session.'}
            {setupStatus === 'active' && psLoadState === 'loading' && 'Loading TM Profile Sets…'}
            {setupStatus === 'active' && psLoadState === 'loaded' && !selectedPS && 'Select a TM Profile Set to continue.'}
            {setupStatus === 'active' && psLoadState === 'loaded' && selectedPS && !selectedRP && 'Select a Rule Profile to continue.'}
            {canLoad && `Ready · ${selectedPS.description} · ${selectedRP?.name} · ${SESSION_ID}`}
          </Text>
          <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
            <Button design="Transparent">Cancel</Button>
            <Button
              design="Emphasized"
              icon="play"
              iconEnd
              disabled={!canLoad}
              onClick={() => {
                showToast(`Session loaded — ${selectedPS?.description} · ${selectedRP?.name}`);
                onSessionLoaded();
              }}
            >
              Load planning session
            </Button>
          </FlexBox>
        </FlexBox>
      </div>

      <Toast open={toastOpen} duration={3000} placement="BottomCenter" onClose={() => setToastOpen(false)}>
        {toastMessage}
      </Toast>
    </div>
  );
};


// ============================================================================
// VIEW 2 — Planning Session Overview (Figma: Session & Plan Overview)
// ============================================================================
export const View2Overview: React.FC<{ onProceed: () => void }> = ({ onProceed }) => {
  const [connError, setConnError]     = useState(false);
  const [connDialog, setConnDialog]   = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [sessionActive, setSessionActive] = useState(true);
  const [foSearch, setFoSearch]       = useState('');
  const [resSearch, setResSearch]     = useState('');
  const [foOpen, setFoOpen]           = useState(true);
  const [resOpen, setResOpen]         = useState(true);

  const overCapBg   = 'var(--sapWarningBackground,#fef7e0)';
  const overCapText = 'var(--sapNegativeTextColor,#bb0000)';

  const filteredFOs = useMemo(() =>
    LOADED_FOS.filter(fo =>
      !foSearch || fo.sapId.includes(foSearch) || fo.dc.toLowerCase().includes(foSearch.toLowerCase()) || fo.resource.toLowerCase().includes(foSearch.toLowerCase())
    ), [foSearch]);

  const filteredRes = useMemo(() =>
    RESOURCE_SUMMARY.filter(r =>
      !resSearch || r.id.toLowerCase().includes(resSearch.toLowerCase()) || r.dc.toLowerCase().includes(resSearch.toLowerCase())
    ), [resSearch]);

  const handleReconnect = () => {
    setConnDialog(false);
    setReconnecting(true);
    setTimeout(() => {
      setReconnecting(false);
      setConnError(false);
      setSessionActive(true);
    }, 2000);
  };

  const KpiCard: React.FC<{ value: React.ReactNode; label: string; warn?: boolean }> = ({ value, label, warn }) => (
    <div style={{ ...cardSurface, padding: `${sp.m} ${sp.m}`, display: 'flex', flexDirection: 'column', gap: sp.xs, flex: 1, minWidth: 0 }}>
      <Text style={{ fontSize: '1.75rem', fontWeight: 'var(--sapFontBoldWeight,700)', lineHeight: 1.1, color: warn ? overCapText : 'var(--sapTextColor)', fontFamily: 'var(--sapFontFamily)' }}>
        {value}
      </Text>
      <Text style={labelText}>{label}</Text>
    </div>
  );

  const sectionHeader = (title: string, count: number | string, isOpen: boolean, onToggle: () => void, search: string, onSearch: (v: string) => void) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${sp.s} ${sp.m}`, borderBottom: isOpen ? '1px solid var(--sapList_BorderColor)' : 'none', background: 'var(--sapBaseColor,#fff)' }}>
      <Text style={{ ...bodyText, fontWeight: 700 }}>{title} ({count})</Text>
      <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
        <Input
          placeholder="Search"
          value={search}
          onInput={e => onSearch((e.target as HTMLInputElement).value)}
          style={{ width: 200 }}
        />
        <Button design="Transparent" icon="action-settings" tooltip="Settings" />
        <Button design="Transparent" icon={isOpen ? 'navigation-up-arrow' : 'navigation-down-arrow'} onClick={onToggle} />
      </FlexBox>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: `-${sp.l}` }}>
      {/* Page header */}
      <div style={{ background: 'var(--sapObjectHeader_Background,#fff)', borderBottom: '1px solid var(--sapList_BorderColor)', padding: `${sp.m} ${sp.l}` }}>
        <FlexBox alignItems="Center" justifyContent="SpaceBetween">
          <div>
            <FlexBox alignItems="Center" style={{ gap: sp.s, marginBottom: sp.xs }}>
              <Title level="H2" style={{ fontWeight: 700 }}>Session &amp; Plan Overview</Title>
              {reconnecting
                ? <ObjectStatus state="Information" icon={<Icon name="synchronize" />}>Connecting…</ObjectStatus>
                : connError
                  ? <ObjectStatus state="Negative" icon={<Icon name="alert" />}>Connection Error</ObjectStatus>
                  : sessionActive
                    ? <ObjectStatus state="Positive" icon={<Icon name="connected" />}>Session Active</ObjectStatus>
                    : null
              }
            </FlexBox>
            <Text style={labelText}>Review your refinement session details.</Text>
          </div>
        </FlexBox>
      </div>

      {/* Connection error banner */}
      {connError && !reconnecting && (
        <MessageStrip design="Negative" onClose={() => setConnError(false)} style={{ margin: `${sp.s} ${sp.l} 0` }}>
          We're having trouble connecting to the server to keep your planning session active.{' '}
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sapLinkColor)', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', padding: 0, textDecoration: 'underline' }} onClick={() => setConnDialog(true)}>Learn More</button>
        </MessageStrip>
      )}

      {/* Reconnecting banner */}
      {reconnecting && (
        <MessageStrip design="Information" hideCloseButton style={{ margin: `${sp.s} ${sp.l} 0` }}>
          <FlexBox alignItems="Center" style={{ gap: sp.s }}><BusyIndicator active size="S" /><span>Connecting to the server. The Planning Session is currently loading…</span></FlexBox>
        </MessageStrip>
      )}

      {/* Session Active banner */}
      {sessionActive && !connError && !reconnecting && (
        <MessageStrip design="Positive" onClose={() => {}} style={{ margin: `${sp.s} ${sp.l} 0` }}>
          TM planning session connected with {TOTAL_FOS} freight orders, {TOTAL_STOPS} delivery stops, and {TOTAL_RESOURCES} resources and {OVER_CAPACITY_COUNT > 0 ? `${OVER_CAPACITY_COUNT} FOs over capacity` : '0 over capacity'} detected.
        </MessageStrip>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.m} ${sp.l}` }}>
        {/* KPI cards — 2 rows of 4 */}
        <div style={{ display: 'flex', gap: sp.m, marginBottom: sp.m }}>
          <KpiCard value={TOTAL_FOS} label="Freight Orders" />
          <KpiCard value={TOTAL_STOPS} label="Delivery Stops" />
          <KpiCard value={`${TOTAL_PALLETS_EXACT.toFixed(2)} PAL`} label="Total Pallets" />
          <KpiCard value={TOTAL_RESOURCES} label="Resources" />
        </div>
        <div style={{ display: 'flex', gap: sp.m, marginBottom: sp.l }}>
          <KpiCard value={`${TOTAL_DISTANCE_KM.toFixed(1)} km`} label="Total Distance" />
          <KpiCard value={`${AVG_UTILIZATION.toFixed(1)}%`} label="Avg Utilization" />
          <KpiCard value={`€${TOTAL_COST_EUR.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} label="Total Cost" />
          <KpiCard value={OVER_CAPACITY_COUNT} label="Over Capacity" warn={OVER_CAPACITY_COUNT > 0} />
        </div>

        {/* Freight Orders table */}
        <div style={{ ...cardSurface, marginBottom: sp.l, overflow: 'hidden' }}>
          {sectionHeader('Freight Orders', '2000', foOpen, () => setFoOpen(v => !v), foSearch, setFoSearch)}
          {foOpen && (
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)' }}>
                <thead>
                  <tr style={{ background: 'var(--sapList_HeaderBackground)', position: 'sticky', top: 0, zIndex: 1 }}>
                    {['Document', 'DC', 'Resource', 'Stops', 'Pallets', 'Distance KM', 'Utilization', 'Amount EUR'].map((h, i) => (
                      <th key={h} style={{ padding: '8px 12px', fontWeight: 'var(--sapFontBoldWeight,700)', color: 'var(--sapContent_LabelColor)', textAlign: i >= 3 ? 'right' : 'left', borderBottom: '2px solid var(--sapList_BorderColor)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredFOs.map(fo => {
                    const overCap = fo.utilization > 100;
                    return (
                      <tr key={fo.id} style={{ background: overCap ? overCapBg : undefined, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                        <td style={{ padding: '6px 12px', fontFamily: 'var(--sapFontMonospaceFamily,monospace)' }}>{fo.sapId}</td>
                        <td style={{ padding: '6px 12px' }}><Tag design="Set2" colorScheme={fo.dc === 'BD20' ? '6' : '8'}>{fo.dc}</Tag></td>
                        <td style={{ padding: '6px 12px', fontFamily: 'var(--sapFontMonospaceFamily,monospace)', fontSize: 'var(--sapFontSmallSize)' }}>{fo.resource}</td>
                        <td style={{ padding: '6px 12px', textAlign: 'right' }}>{fo.stops}</td>
                        <td style={{ padding: '6px 12px', textAlign: 'right' }}>{fo.pallets.toFixed(2)}</td>
                        <td style={{ padding: '6px 12px', textAlign: 'right' }}>{fo.distanceKm.toFixed(1)}</td>
                        <td style={{ padding: '6px 12px', textAlign: 'right', color: overCap ? overCapText : undefined, fontWeight: overCap ? 700 : 400 }}>{fo.utilization.toFixed(1)}%</td>
                        <td style={{ padding: '6px 12px', textAlign: 'right' }}>{fo.amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Resources table */}
        <div style={{ ...cardSurface, overflow: 'hidden' }}>
          {sectionHeader('Resources', `${RESOURCE_SUMMARY.length} loaded`, resOpen, () => setResOpen(v => !v), resSearch, setResSearch)}
          {resOpen && (
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)' }}>
                <thead>
                  <tr style={{ background: 'var(--sapList_HeaderBackground)', position: 'sticky', top: 0, zIndex: 1 }}>
                    {['Resource ID', 'DC', 'Tours', 'Total Pallets', 'AVG Utilization'].map((h, i) => (
                      <th key={h} style={{ padding: '8px 12px', fontWeight: 'var(--sapFontBoldWeight,700)', color: 'var(--sapContent_LabelColor)', textAlign: i >= 2 ? 'right' : 'left', borderBottom: '2px solid var(--sapList_BorderColor)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRes.map(r => {
                    const overCap = r.avgUtilization > 100;
                    return (
                      <tr key={r.id} style={{ background: overCap ? overCapBg : undefined, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                        <td style={{ padding: '6px 12px', fontFamily: 'var(--sapFontMonospaceFamily,monospace)', fontSize: 'var(--sapFontSmallSize)' }}>{r.id}</td>
                        <td style={{ padding: '6px 12px' }}><Tag design="Set2" colorScheme={r.dc === 'BD20' ? '6' : '8'}>{r.dc}</Tag></td>
                        <td style={{ padding: '6px 12px', textAlign: 'right' }}>{r.tours}</td>
                        <td style={{ padding: '6px 12px', textAlign: 'right' }}>{r.totalPallets.toFixed(2)} PAL</td>
                        <td style={{ padding: '6px 12px', textAlign: 'right', color: overCap ? overCapText : undefined, fontWeight: overCap ? 700 : 400 }}>{r.avgUtilization.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: `${sp.s} ${sp.l}`, borderTop: '1px solid var(--sapList_BorderColor)', background: 'var(--sapObjectHeader_Background,#fff)', display: 'flex', justifyContent: 'flex-end', gap: sp.s }}>
        <Button design="Transparent" onClick={() => setConnError(true)}>Cancel</Button>
        <Button design="Emphasized" icon="task" iconEnd onClick={onProceed}>Proceed to Rule Evaluation</Button>
      </div>

      {/* Connection error dialog */}
      {connDialog && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setConnDialog(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--sapBaseColor,#fff)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', width: 'min(460px,calc(100vw - 32px))', padding: `${sp.m} ${sp.l}` }}>
            <Title level="H5" style={{ marginBottom: sp.s }}>Unable to refresh planning session</Title>
            <Text style={{ ...bodyText, display: 'block', marginBottom: sp.s }}>
              We're having trouble connecting to the server or to keep your planning session active. Your session may still be valid. Retry to re-establish the connection. If the problem persists, you may need to discard the session and start a new planning session.
            </Text>
            <FlexBox alignItems="Center" justifyContent="End" style={{ gap: sp.xs, marginTop: sp.m }}>
              <Button design="Transparent" onClick={() => setConnDialog(false)}>Close</Button>
              <Button design="Emphasized" icon="synchronize" onClick={handleReconnect}>Retry</Button>
            </FlexBox>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// VIEW 3 — Rule Evaluation (Figma design)
// ============================================================================
export const View3RuleEvaluation: React.FC<{ onStartReview: () => void }> = ({ onStartReview }) => {
  const [ruleOrder, setRuleOrder] = useState<RuleId[]>(() => RULE_DESCRIPTORS.map(r => r.id));
  const [evalState, setEvalState] = useState<'idle' | 'running' | 'done' | 'failed'>('idle');
  const [progress, setProgress]   = useState(0);
  const [lastEvaluatedOrder, setLastEvaluatedOrder] = useState<RuleId[] | null>(null);
  const evalTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (evalTimer.current) clearInterval(evalTimer.current); }, []);

  const isDirty = useMemo(() => {
    if (evalState !== 'done' || !lastEvaluatedOrder) return false;
    if (lastEvaluatedOrder.length !== ruleOrder.length) return true;
    return ruleOrder.some((id, i) => id !== lastEvaluatedOrder[i]);
  }, [evalState, lastEvaluatedOrder, ruleOrder]);

  const handleRunEvaluation = useCallback(() => {
    if (evalTimer.current) clearInterval(evalTimer.current);
    const orderAtRun = [...ruleOrder];
    setEvalState('running'); setProgress(0);
    evalTimer.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(evalTimer.current!); evalTimer.current = null;
          setEvalState('done'); setLastEvaluatedOrder(orderAtRun);
          return 100;
        }
        return p + 8;
      });
    }, 400);
  }, [ruleOrder]);

  const moveUp   = useCallback((idx: number) => { if (idx === 0) return; setRuleOrder(prev => { const n = [...prev]; [n[idx-1], n[idx]] = [n[idx], n[idx-1]]; return n; }); }, []);
  const moveDown = useCallback((idx: number) => { setRuleOrder(prev => { if (idx >= prev.length-1) return prev; const n = [...prev]; [n[idx], n[idx+1]] = [n[idx+1], n[idx]]; return n; }); }, []);

  const evalRunning = evalState === 'running';
  const evalDone    = evalState === 'done';

  const ruleTypeLabel = (id: RuleId) => id === 'R-001' || id === 'R-002' || id === 'R-004' ? 'Hard Constraint' : 'Base rule';
  const ruleCategory  = (id: RuleId): string => {
    const map: Record<RuleId, string> = { 'R-001': 'Store Rules', 'R-002': 'Planning Execution', 'R-003': 'Store Rules', 'R-004': 'Planning Execution', 'R-007': 'Store Rules' };
    return map[id] ?? 'Resource Rules';
  };

  const rowStatus = (idx: number): React.ReactNode => {
    if (evalState === 'idle' || (evalDone && isDirty))
      return <ObjectStatus state="None">Pending</ObjectStatus>;
    if (evalRunning) {
      const pct = progress / 100;
      const ruleProgress = pct * ruleOrder.length;
      if (idx < ruleProgress - 1)
        return <ObjectStatus state="Positive" icon={<Icon name="accept" />}>Evaluated</ObjectStatus>;
      if (idx < ruleProgress)
        return <FlexBox alignItems="Center" style={{ gap: sp.xs }}><BusyIndicator active size="S" /><Text style={{ ...labelText, color: 'var(--sapInformativeColor,#0064d9)' }}>Evaluating</Text></FlexBox>;
      return <ObjectStatus state="None">Pending</ObjectStatus>;
    }
    if (evalDone && !isDirty)
      return <ObjectStatus state="Positive" icon={<Icon name="accept" />}>Evaluated</ObjectStatus>;
    return <ObjectStatus state="None">Pending</ObjectStatus>;
  };

  const headerStatus = () => {
    if (evalState === 'idle') return <ObjectStatus state="None" icon={<Icon name="pending" />}>Eval not started</ObjectStatus>;
    if (evalRunning) return <ObjectStatus state="Information" icon={<Icon name="hourglass" />}>Evaluating · {Math.min(progress, 100)}%</ObjectStatus>;
    if (evalDone && isDirty) return <ObjectStatus state="Critical" icon={<Icon name="alert" />}>Re-run required</ObjectStatus>;
    if (evalDone) return <ObjectStatus state="Positive" icon={<Icon name="accept" />}>Evaluation complete</ObjectStatus>;
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: `-${sp.l}` }}>
      {/* Header */}
      <div style={{ background: 'var(--sapObjectHeader_Background,#fff)', borderBottom: '1px solid var(--sapList_BorderColor)', padding: `${sp.m} ${sp.l}` }}>
        <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ flexWrap: 'wrap', gap: sp.s }}>
          <div>
            <FlexBox alignItems="Center" style={{ gap: sp.s, marginBottom: sp.xs }}>
              <Title level="H2" style={{ fontWeight: 700 }}>Rule Evaluation</Title>
              {headerStatus()}
            </FlexBox>
            <Text style={labelText}>Review the rules against the loaded plan. Select <strong>Run Rule Evaluation</strong> to fire them.</Text>
          </div>
          <Button
            design="Emphasized"
            icon={lastEvaluatedOrder ? 'refresh' : 'play'}
            disabled={evalRunning}
            onClick={handleRunEvaluation}
          >
            {evalRunning ? `Evaluating · ${Math.min(progress, 100)}%` : lastEvaluatedOrder ? 'Re-Run Evaluation' : 'Run Rule Evaluation'}
          </Button>
        </FlexBox>
      </div>

      {/* Profile strip */}
      <div style={{ background: 'var(--sapObjectHeader_Background,#fff)', borderBottom: '1px solid var(--sapList_BorderColor)', padding: `${sp.xs} ${sp.l}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={labelText}>Profile: <strong>DB South Standard – {ruleOrder.length} Active Rules</strong></Text>
        {evalRunning && (
          <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
            <BusyIndicator active size="S" />
            <Text style={{ ...labelText, color: 'var(--sapInformativeColor,#0064d9)' }}>Evaluating…</Text>
          </FlexBox>
        )}
      </div>

      {/* Progress bar when running */}
      {evalRunning && (
        <div style={{ height: 4, background: 'var(--sapNeutralBackground,#e9eef5)' }}>
          <div style={{ width: `${Math.min(progress, 100)}%`, height: '100%', background: 'var(--sapInformativeColor,#0064d9)', transition: 'width 0.3s ease' }} />
        </div>
      )}

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 160px 160px 180px', background: 'var(--sapList_HeaderBackground)', borderBottom: '2px solid var(--sapList_BorderColor)', position: 'sticky', top: 0, zIndex: 1 }}>
          {['Rule Order', 'Rule', 'Rule Type', 'Rule Category', 'Status'].map(h => (
            <div key={h} style={{ padding: '8px 12px', fontWeight: 'var(--sapFontBoldWeight,700)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{h}</div>
          ))}
        </div>

        {ruleOrder.map((rid, idx) => {
          const rule = RULE_DESCRIPTORS.find(r => r.id === rid)!;
          return (
            <div key={rid} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 160px 160px 180px', borderBottom: '1px solid var(--sapList_BorderColor)', alignItems: 'start', background: idx % 2 === 0 ? 'var(--sapBaseColor,#fff)' : 'var(--sapList_Background,#fafafa)' }}>
              {/* Order + reorder controls */}
              <div style={{ padding: '12px 8px', display: 'flex', alignItems: 'center', gap: sp.xs }}>
                <Text style={{ fontWeight: 700, minWidth: 20, textAlign: 'right', fontFamily: 'var(--sapFontFamily)' }}>{idx + 1}</Text>
                <FlexBox direction="Column">
                  <Button design="Transparent" icon="navigation-up-arrow" disabled={idx === 0 || evalRunning} onClick={() => moveUp(idx)} style={{ minWidth: 24, height: 20, padding: 0 }} />
                  <Button design="Transparent" icon="navigation-down-arrow" disabled={idx === ruleOrder.length - 1 || evalRunning} onClick={() => moveDown(idx)} style={{ minWidth: 24, height: 20, padding: 0 }} />
                </FlexBox>
              </div>

              {/* Rule detail */}
              <div style={{ padding: '12px 12px' }}>
                <Text style={{ fontWeight: 700, display: 'block', marginBottom: sp.xs, fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)' }}>{RULE_LABELS[rid]}</Text>
                <Text style={{ ...labelText, display: 'block', fontStyle: 'italic', marginBottom: sp.xs }}>SOP Description</Text>
                <Text style={{ ...bodyText, display: 'block', fontSize: 'var(--sapFontSmallSize)', marginBottom: sp.xs }}>{rule.description}</Text>
                <Text style={{ ...labelText, display: 'block', fontStyle: 'italic', marginBottom: sp.xs }}>Business Context, Reason &amp; Scope</Text>
                <Text style={{ ...bodyText, display: 'block', fontSize: 'var(--sapFontSmallSize)', marginBottom: sp.xs }}>{rule.scope}</Text>
                <FlexBox alignItems="Center" style={{ gap: sp.xs, marginTop: sp.xs }}>
                  <Text style={{ ...labelText, fontStyle: 'italic' }}>Threshold:</Text>
                  <Text style={{ ...labelText, fontFamily: 'var(--sapFontMonospaceFamily,monospace)' }}>{rule.threshold}</Text>
                </FlexBox>
              </div>

              {/* Rule Type */}
              <div style={{ padding: '12px 12px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '2px 8px', borderRadius: 12,
                  background: 'var(--sapInformationBackground,#e8f3ff)',
                  border: '1px solid var(--sapInformativeBorderColor,#b5d4f1)',
                  fontSize: 'var(--sapFontSmallSize)',
                  color: 'var(--sapInformativeColor,#0064d9)',
                  fontFamily: 'var(--sapFontFamily)',
                }}>
                  <Icon name="information" style={{ fontSize: 12 }} />
                  {ruleTypeLabel(rid)}
                </span>
              </div>

              {/* Rule Category */}
              <div style={{ padding: '12px 12px' }}>
                <Text style={labelText}>{ruleCategory(rid)}</Text>
              </div>

              {/* Status */}
              <div style={{ padding: '12px 12px' }}>
                {rowStatus(idx)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: `${sp.s} ${sp.l}`, borderTop: '1px solid var(--sapList_BorderColor)', background: 'var(--sapObjectHeader_Background,#fff)' }}>
        <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ gap: sp.m }}>
          <Text style={labelText}>
            {evalState === 'idle' && 'Run the rule evaluation to generate proposals'}
            {evalRunning && 'Proposals populate as rules complete'}
            {evalDone && !isDirty && `${INITIAL_PACKAGES.filter(p => p.state === 'ready' || p.state === 'accepted').length} proposals ready`}
            {evalDone && isDirty && 'Re-run to refresh proposals'}
          </Text>
          <Button design="Emphasized" icon="inspect" iconEnd disabled={!evalDone || isDirty} onClick={onStartReview}>Start review</Button>
        </FlexBox>
      </div>
    </div>
  );
};

// ============================================================================
// VIEW 4 — Proposal Review (Figma: full-width table layout)
// ============================================================================
const ProposalStatusPill: React.FC<{ state: PackageState }> = ({ state }) => {
  const cfg: Record<PackageState, { label: string; bg: string; color: string; border: string }> = {
    accepted:   { label: 'Accepted',     bg: 'var(--sapSuccessBackground,#f0fdf4)',      color: 'var(--sapPositiveColor,#188918)',    border: 'var(--sapPositiveColor,#188918)' },
    rejected:   { label: 'Rejected',     bg: 'var(--sapErrorBackground,#fff0f0)',        color: 'var(--sapNegativeColor,#bb0000)',    border: 'var(--sapNegativeColor,#bb0000)' },
    nosol:      { label: 'No solution',  bg: 'var(--sapWarningBackground,#fef7e0)',      color: 'var(--sapCriticalColor,#df6e0c)',    border: 'var(--sapCriticalColor,#df6e0c)' },
    evaluating: { label: 'Re-evaluating',bg: 'var(--sapInfoBackground,#e8f3ff)',         color: 'var(--sapInformativeColor,#0064d9)', border: 'var(--sapInformativeColor,#0064d9)' },
    stale:      { label: 'Stale',        bg: 'var(--sapWarningBackground,#fef7e0)',      color: 'var(--sapCriticalColor,#df6e0c)',    border: 'var(--sapCriticalColor,#df6e0c)' },
    discarded:  { label: 'Discarded',    bg: 'var(--sapNeutralBackground,#f5f6f7)',      color: 'var(--sapContent_LabelColor)',       border: 'var(--sapList_BorderColor)' },
    pending:    { label: 'Pending',      bg: 'var(--sapNeutralBackground,#f5f6f7)',      color: 'var(--sapContent_LabelColor)',       border: 'var(--sapList_BorderColor)' },
    ready:      { label: 'Pending',      bg: 'var(--sapNeutralBackground,#f5f6f7)',      color: 'var(--sapContent_LabelColor)',       border: 'var(--sapList_BorderColor)' },
  };
  const c = cfg[state] ?? cfg.pending;
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 10, background: c.bg, border: `1px solid ${c.border}`, color: c.color, fontSize: 'var(--sapFontSmallSize)', fontFamily: 'var(--sapFontFamily)', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {c.label}
    </span>
  );
};

export const View3RecommendationReview: React.FC<{ onProceedToChanges: () => void }> = ({ onProceedToChanges }) => {
  const [packages, setPackages] = useState<RecPackage[]>(INITIAL_PACKAGES);
  const [toastOpen, setToastOpen]     = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [reevalModal, setReevalModal] = useState<{ open: boolean; pkgId: string; title: string; sub: string; onConfirm: (t: string | null) => void } | null>(null);
  const [acceptAllOpen, setAcceptAllOpen] = useState(false);
  const [discardSessionOpen, setDiscardSessionOpen] = useState(false);
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const evalTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  useEffect(() => () => { evalTimers.current.forEach(t => clearTimeout(t)); }, []);

  const isTerminal = (s: PackageState) => s === 'accepted' || s === 'rejected' || s === 'discarded';
  const headIndex  = useMemo(() => packages.findIndex(p => !isTerminal(p.state)), [packages]);
  const headPkg    = headIndex >= 0 ? packages[headIndex] : null;

  const counts = useMemo(() => {
    const accepted  = packages.filter(p => p.state === 'accepted').length;
    const rejected  = packages.filter(p => p.state === 'rejected').length;
    const discarded = packages.filter(p => p.state === 'discarded').length;
    const nosol     = packages.filter(p => p.state === 'nosol').length;
    const ready     = packages.filter(p => p.state === 'ready').length;
    const reviewed  = accepted + rejected + discarded;
    return { accepted, rejected, discarded, reviewed, nosol, ready, total: packages.length, pending: packages.length - reviewed };
  }, [packages]);

  const showToast = useCallback((m: string) => { setToastMessage(m); setToastOpen(true); }, []);
  const EVAL_DELAY = 1800;

  const applyVerdict = useCallback((pkgId: string, wasNoSol: boolean, promptText: string | null) => {
    setPackages(prev => prev.map(p => p.id === pkgId ? { ...p, state: 'evaluating' as PackageState } : p));
    const t = setTimeout(() => {
      setPackages(prev => prev.map(p => {
        if (p.id !== pkgId || p.state !== 'evaluating') return p;
        if (wasNoSol && !promptText) return { ...p, state: 'nosol' as PackageState, nosolReason: 'Retry yielded same result — no admissible target.' };
        return { ...p, state: 'ready' as PackageState, nosolReason: undefined };
      }));
      evalTimers.current.delete(pkgId);
    }, EVAL_DELAY);
    evalTimers.current.set(pkgId, t);
  }, []);

  const handleAccept = useCallback((pkg: RecPackage) => {
    if (pkg.state !== 'ready') return;
    setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, state: 'accepted' as PackageState } : p));
    showToast(`${pkg.id} accepted`);
  }, [showToast]);

  const handleReject = useCallback((pkg: RecPackage, idx: number) => {
    if (pkg.state !== 'ready') return;
    const id = pkg.id;
    setPackages(prev => prev.map((p, i) => {
      if (p.id === id) return { ...p, state: 'rejected' as PackageState };
      if (i > idx && !isTerminal(p.state)) return { ...p, state: 'stale' as PackageState, staleCause: { byPackageId: id, reason: `${id} rejected.` } };
      return p;
    }));
    showToast(`${id} rejected`);
  }, [showToast]);

  const handleAcceptAll = useCallback(() => {
    const ids = new Set(packages.filter(p => p.state === 'ready').map(p => p.id));
    setPackages(prev => prev.map(p => ids.has(p.id) ? { ...p, state: 'accepted' as PackageState } : p));
    showToast(`${ids.size} packages accepted`);
  }, [packages, showToast]);

  const allDone = counts.pending === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: `-${sp.l}` }}>
      <style>{`@keyframes pkgPulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      {/* Header */}
      <div style={{ background: 'var(--sapObjectHeader_Background,#fff)', borderBottom: '1px solid var(--sapList_BorderColor)', padding: `${sp.m} ${sp.l}` }}>
        <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ flexWrap: 'wrap', gap: sp.s }}>
          <div>
            <Title level="H2" style={{ fontWeight: 700, marginBottom: sp.xs }}>Proposal Review</Title>
            <Text style={labelText}>Review each proposal — accept, reject, or re-evaluate. {counts.reviewed}/{counts.total} reviewed.</Text>
          </div>
          <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
            {counts.ready > 0 && <Button design="Default" icon="accept" onClick={() => setAcceptAllOpen(true)}>Accept All Ready ({counts.ready})</Button>}
            <Button design="Transparent" icon="decline" onClick={() => setDiscardSessionOpen(true)}>Discard Session</Button>
            {allDone && <Button design="Emphasized" icon="future" iconEnd onClick={onProceedToChanges}>Proceed to Change Summary</Button>}
          </FlexBox>
        </FlexBox>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--sapNeutralBackground,#e9eef5)' }}>
        <div style={{ width: `${(counts.reviewed / counts.total) * 100}%`, height: '100%', background: 'var(--sapPositiveColor,#16a34a)', transition: 'width 0.5s ease' }} />
      </div>

      {/* Status legend */}
      <div style={{ padding: `${sp.xs} ${sp.l}`, borderBottom: '1px solid var(--sapList_BorderColor)', background: 'var(--sapBaseColor,#fff)', display: 'flex', gap: sp.m, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { label: 'Accepted', bg: 'var(--sapSuccessBackground,#f0fdf4)', color: 'var(--sapPositiveColor,#188918)', border: 'var(--sapPositiveColor,#188918)' },
          { label: 'No solution', bg: 'var(--sapWarningBackground,#fef7e0)', color: 'var(--sapCriticalColor,#df6e0c)', border: 'var(--sapCriticalColor,#df6e0c)' },
          { label: 'Rejected', bg: 'var(--sapErrorBackground,#fff0f0)', color: 'var(--sapNegativeColor,#bb0000)', border: 'var(--sapNegativeColor,#bb0000)' },
          { label: 'Pending', bg: 'var(--sapNeutralBackground,#f5f6f7)', color: 'var(--sapContent_LabelColor)', border: 'var(--sapList_BorderColor)' },
          { label: 'Re-evaluating', bg: 'var(--sapInfoBackground,#e8f3ff)', color: 'var(--sapInformativeColor,#0064d9)', border: 'var(--sapInformativeColor,#0064d9)' },
        ].map(s => (
          <span key={s.label} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 10, background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontSize: 'var(--sapFontSmallSize)', fontFamily: 'var(--sapFontFamily)', fontWeight: 600 }}>{s.label}</span>
        ))}
      </div>

      {/* Full-width table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 160px 140px', background: 'var(--sapList_HeaderBackground)', borderBottom: '2px solid var(--sapList_BorderColor)', position: 'sticky', top: 0, zIndex: 1 }}>
          {['Package', 'Proposal', 'Rule', 'Status'].map(h => (
            <div key={h} style={{ padding: '8px 12px', fontWeight: 'var(--sapFontBoldWeight,700)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{h}</div>
          ))}
        </div>

        {packages.map((pkg, idx) => {
          const isHead     = idx === headIndex;
          const isExpanded = expandedId === pkg.id;
          const rowBg      = pkg.state === 'accepted' ? 'var(--sapSuccessBackground,#f9fdf9)'
            : pkg.state === 'rejected' || pkg.state === 'nosol' ? 'var(--sapErrorBackground,#fef9f9)'
            : pkg.state === 'discarded' ? 'var(--sapNeutralBackground,#f9f9f9)'
            : pkg.state === 'evaluating' ? 'var(--sapInfoBackground,#f5f9ff)'
            : isHead ? 'var(--sapList_SelectionBackgroundColor,#eef5ff)'
            : idx % 2 === 0 ? 'var(--sapBaseColor,#fff)' : 'var(--sapList_Background,#fafafa)';

          return (
            <React.Fragment key={pkg.id}>
              {/* Main row */}
              <div
                onClick={() => setExpandedId(v => v === pkg.id ? null : pkg.id)}
                style={{
                  display: 'grid', gridTemplateColumns: '100px 1fr 160px 140px',
                  borderBottom: isExpanded ? 'none' : '1px solid var(--sapList_BorderColor)',
                  borderLeft: isHead ? '3px solid var(--sapSelectedColor,#0070f2)' : '3px solid transparent',
                  background: rowBg,
                  cursor: 'pointer',
                  opacity: pkg.state === 'discarded' ? 0.65 : 1,
                  alignItems: 'center',
                }}
              >
                <div style={{ padding: '10px 12px' }}>
                  <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: 700, textDecoration: pkg.state === 'discarded' ? 'line-through' : undefined }}>{pkg.id}</Text>
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', display: 'block', textDecoration: pkg.state === 'discarded' ? 'line-through' : undefined }}>{pkg.title}</Text>
                  <Text style={labelText}>{pkg.ruleLabel}</Text>
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <Tag design="Set2" colorScheme="6">{pkg.ruleIds[0]}</Tag>
                </div>
                <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: sp.xs }}>
                  {pkg.state === 'evaluating'
                    ? <FlexBox alignItems="Center" style={{ gap: sp.xs }}><BusyIndicator active size="S" /><ProposalStatusPill state={pkg.state} /></FlexBox>
                    : <ProposalStatusPill state={pkg.state} />
                  }
                  <Icon name={isExpanded ? 'navigation-up-arrow' : 'navigation-down-arrow'} style={{ marginLeft: 'auto', color: 'var(--sapContent_LabelColor)', fontSize: 12 }} />
                </div>
              </div>

              {/* Expanded detail + actions */}
              {isExpanded && (
                <div style={{ background: rowBg, borderBottom: '1px solid var(--sapList_BorderColor)', padding: `${sp.s} ${sp.l} ${sp.m}`, borderLeft: isHead ? '3px solid var(--sapSelectedColor,#0070f2)' : '3px solid transparent' }}>
                  {/* Action buttons for head */}
                  {isHead && (
                    <FlexBox alignItems="Center" style={{ gap: sp.xs, marginBottom: sp.s }}>
                      {pkg.state === 'ready' && (
                        <><Button design="Positive" icon="accept" onClick={e => { e.stopPropagation(); handleAccept(pkg); }}>Accept</Button>
                        <Button design="Negative" icon="decline" onClick={e => { e.stopPropagation(); handleReject(pkg, idx); }}>Reject</Button></>
                      )}
                      {(pkg.state === 'ready' || pkg.state === 'stale' || pkg.state === 'nosol') && (
                        <Button design="Attention" icon="synchronize" onClick={e => { e.stopPropagation(); setReevalModal({ open: true, pkgId: pkg.id, title: `Re-evaluate ${pkg.id}`, sub: pkg.state === 'nosol' ? 'No solution found. Add an optional hint to guide the engine.' : 'Add an optional hint for the rule engine, or retry as-is.', onConfirm: txt => applyVerdict(pkg.id, pkg.state === 'nosol', txt) }); }}>Re-evaluate</Button>
                      )}
                      {pkg.state === 'nosol' && <Button design="Transparent" onClick={e => { e.stopPropagation(); setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, state: 'discarded' as PackageState } : p)); showToast(`${pkg.id} acknowledged`); }}>Acknowledge &amp; Skip</Button>}
                      {pkg.state === 'stale' && <Button design="Transparent" onClick={e => { e.stopPropagation(); setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, state: 'discarded' as PackageState } : p)); showToast(`${pkg.id} discarded`); }}>Discard</Button>}
                    </FlexBox>
                  )}

                  {/* Why text */}
                  <div style={{ ...cardSurface, padding: sp.m, marginBottom: sp.s }}>
                    <Text style={{ ...sectionTitle, display: 'block', marginBottom: sp.xs }}>Why</Text>
                    <Text style={bodyText}>{pkg.whyText}</Text>
                  </div>

                  {/* Affected + validation side by side */}
                  {pkg.state !== 'nosol' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.s, marginBottom: sp.s }}>
                      {pkg.affected.length > 0 && (
                        <div style={{ ...cardSurface, padding: sp.m }}>
                          <Text style={{ ...sectionTitle, display: 'block', marginBottom: sp.xs }}>Affected Objects</Text>
                          {pkg.affected.map((o, i) => (
                            <FlexBox key={i} alignItems="Center" style={{ gap: sp.xs, marginTop: sp.xs }}>
                              <ObjectKindIcon kind={o.kind} />
                              <Text style={{ fontWeight: 700 }}>{o.id}</Text>
                              <Text style={labelText}>· {o.change}</Text>
                            </FlexBox>
                          ))}
                        </div>
                      )}
                      {pkg.validation.length > 0 && (
                        <div style={{ ...cardSurface, padding: sp.m }}>
                          <Text style={{ ...sectionTitle, display: 'block', marginBottom: sp.xs }}>Validation</Text>
                          {pkg.validation.map((v, i) => (
                            <FlexBox key={i} alignItems="Center" style={{ gap: sp.xs, marginTop: sp.xs }}>
                              <Icon name={v.passed ? 'accept' : 'decline'} style={{ color: v.passed ? 'var(--sapPositiveColor)' : 'var(--sapNegativeColor)' }} />
                              <Text style={bodyText}>{v.check}</Text>
                            </FlexBox>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Before / After */}
                  {pkg.state !== 'nosol' && pkg.before.length > 0 && (
                    <div style={{ ...cardSurface, padding: sp.m }}>
                      <Text style={{ ...sectionTitle, display: 'block', marginBottom: sp.s }}>Before / After</Text>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid var(--sapList_BorderColor)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ padding: sp.s, background: 'var(--sapList_HeaderBackground)', borderBottom: '1px solid var(--sapList_BorderColor)', borderRight: '1px solid var(--sapList_BorderColor)' }}><Text style={{ ...labelText, fontWeight: 700 }}>Before</Text></div>
                        <div style={{ padding: sp.s, background: 'var(--sapList_HeaderBackground)', borderBottom: '1px solid var(--sapList_BorderColor)' }}><Text style={{ ...labelText, fontWeight: 700 }}>After</Text></div>
                        {Array.from({ length: Math.max(pkg.before.length, pkg.after.length) }).map((_, i) => (
                          <React.Fragment key={i}>
                            <div style={{ padding: sp.s, borderTop: i > 0 ? '1px solid var(--sapList_BorderColor)' : 'none', borderRight: '1px solid var(--sapList_BorderColor)' }}><Text style={{ fontSize: 'var(--sapFontSmallSize)' }}>{pkg.before[i] ?? '—'}</Text></div>
                            <div style={{ padding: sp.s, borderTop: i > 0 ? '1px solid var(--sapList_BorderColor)' : 'none', background: 'var(--sapSuccessBackground,#f5faf5)' }}><Text style={{ fontSize: 'var(--sapFontSmallSize)' }}>{pkg.after[i] ?? '—'}</Text></div>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <Toast open={toastOpen} duration={3000} placement="BottomCenter" onClose={() => setToastOpen(false)}>{toastMessage}</Toast>

      {/* Re-evaluate modal */}
      {reevalModal && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setReevalModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--sapBaseColor,#fff)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', width: 'min(480px,calc(100vw - 32px))', padding: `${sp.m} ${sp.l}` }}>
            <Title level="H5" style={{ marginBottom: sp.xs }}>{reevalModal.title}</Title>
            <Text style={{ ...labelText, display: 'block', marginBottom: sp.s }}>{reevalModal.sub}</Text>
            <TextArea rows={3} placeholder="Optional hint for the rule engine" style={{ width: '100%', display: 'block' }}
              onInput={e => { (reevalModal as any)._val = (e.target as HTMLTextAreaElement).value; }} />
            <FlexBox alignItems="Center" justifyContent="End" style={{ gap: sp.xs, marginTop: sp.m }}>
              <Button design="Transparent" onClick={() => setReevalModal(null)}>Cancel</Button>
              <Button design="Emphasized" icon="synchronize" onClick={() => { const cb = reevalModal.onConfirm; const val = (reevalModal as any)._val ?? null; setReevalModal(null); cb(val?.trim() || null); }}>Re-evaluate</Button>
            </FlexBox>
          </div>
        </div>
      )}

      {/* Accept All modal */}
      {acceptAllOpen && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setAcceptAllOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--sapBaseColor,#fff)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', width: 'min(480px,calc(100vw - 32px))', padding: `${sp.m} ${sp.l}` }}>
            <Title level="H5" style={{ marginBottom: sp.xs }}>Accept {counts.ready} Ready Proposals?</Title>
            <Text style={{ ...labelText, display: 'block', marginBottom: sp.s }}>
              Accepts every Ready proposal immediately. On save, {counts.ready} TM actions will be applied. Stale and no-solution proposals are unaffected; you can still resolve those individually.
            </Text>
            <FlexBox alignItems="Center" justifyContent="End" style={{ gap: sp.xs, marginTop: sp.m }}>
              <Button design="Transparent" onClick={() => setAcceptAllOpen(false)}>Cancel</Button>
              <Button design="Emphasized" icon="accept" onClick={() => { setAcceptAllOpen(false); handleAcceptAll(); }}>Accept All</Button>
            </FlexBox>
          </div>
        </div>
      )}

      {/* Discard Session modal */}
      {discardSessionOpen && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setDiscardSessionOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--sapBaseColor,#fff)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', width: 'min(480px,calc(100vw - 32px))', padding: `${sp.m} ${sp.l}` }}>
            <FlexBox alignItems="Center" style={{ gap: sp.s, marginBottom: sp.s }}>
              <Icon name="alert" style={{ color: 'var(--sapCriticalColor,#df6e0c)', fontSize: 20 }} />
              <Title level="H5">Discard Planning Session?</Title>
            </FlexBox>
            <Text style={{ ...bodyText, display: 'block', marginBottom: sp.m }}>
              You have unresolved decisions in this planning session. If you leave now, your reviewed packages and selections will be discarded and the plan in SAP Transportation Management stays unchanged.
            </Text>
            <FlexBox alignItems="Center" justifyContent="End" style={{ gap: sp.xs }}>
              <Button design="Emphasized" onClick={() => setDiscardSessionOpen(false)}>Keep Working</Button>
              <Button design="Transparent" onClick={() => { setDiscardSessionOpen(false); showToast('Session discarded — no changes written to TM'); }}>Discard Session</Button>
            </FlexBox>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// VIEW 5 — Change Summary
// ============================================================================
export const View4Changes: React.FC<{ onStartNewSession: () => void; onSessionSaved: () => void }> = ({ onStartNewSession, onSessionSaved }) => {
  const [saved, setSaved] = useState(false);
  const [rejectedExpanded, setRejectedExpanded] = useState(false);
  const [discardedExpanded, setDiscardedExpanded] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const mockChanges = useMemo(() => [
    { id: 'PKG-01', title: 'Remove stop S-14 from FO-001', ruleId: 'R-001' as RuleId, decision: 'accepted' as const, beforeSummary: 'FO-001 · 8 stops · 24 pl', afterSummary: 'FO-001 · 7 stops · 21 pl', affected: [{ kind: 'FO' as const, id: 'FO-001', change: '-1 stop' }], tmActions: ['Remove Stop S-14 from FO-001', 'Append Stop S-14 to FO-006'], whyText: '', rejectReason: undefined, discardReason: undefined },
    { id: 'PKG-02', title: 'Reassign FU-2107 to FO-014', ruleId: 'R-002' as RuleId, decision: 'accepted' as const, beforeSummary: 'FO-014 · 27 pl · 90% cap', afterSummary: 'FO-014 · 28 pl · 93% cap', affected: [{ kind: 'FU' as const, id: 'FU-2107', change: 'moved' }], tmActions: ['Reassign FU-2107 from FO-016 to FO-014'], whyText: '', rejectReason: undefined, discardReason: undefined },
    { id: 'PKG-07', title: 'Reassign FU-2418', ruleId: 'R-002' as RuleId, decision: 'discarded' as const, beforeSummary: '—', afterSummary: '—', affected: [], tmActions: [], whyText: '', rejectReason: undefined, discardReason: 'No admissible target' },
  ], []);

  const accepted = mockChanges.filter(r => r.decision === 'accepted');
  const rejected = mockChanges.filter(r => r.decision === 'rejected');
  const discarded = mockChanges.filter(r => r.decision === 'discarded');
  const totalActions = accepted.reduce((s, r) => s + r.tmActions.length, 0);
  const fosAffected = new Set(accepted.flatMap(r => r.affected.filter(a => a.kind === 'FO').map(a => a.id))).size;

  const showToast = (m: string) => { setToastMessage(m); setToastOpen(true); };

  const acceptedByRule = useMemo(() => {
    const map = new Map<RuleId, typeof accepted>();
    accepted.forEach(r => { const arr = map.get(r.ruleId) ?? []; arr.push(r); map.set(r.ruleId, arr); });
    return map;
  }, [accepted]);

  const beforeKPIs = [{ label: 'Number of FOs', value: '12' }, { label: 'Unplanned FUs', value: '0' }, { label: 'Utilization', value: '83.4%' }, { label: 'Tour plan cost', value: '€23,997' }];
  const afterKPIs = [{ label: 'Number of FOs', value: '11' }, { label: 'Unplanned FUs', value: '0' }, { label: 'Utilization', value: '86.1%' }, { label: 'Tour plan cost', value: '€22,718' }];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: `-${sp.l}` }}>
      <PageTitle title="Change Summary" subtitle={saved ? undefined : 'Final review before save.'} trailing={
        <>{accepted.length > 0 && <ObjectStatus state="Positive" icon={<Icon name="accept" />}>{accepted.length} accepted</ObjectStatus>}{rejected.length > 0 && <ObjectStatus state="Critical" icon={<Icon name="decline" />}>{rejected.length} rejected</ObjectStatus>}<Text style={labelText}>· session-local until save</Text></>
      } />
      <div style={{ flex: 1, overflowY: 'auto', padding: sp.l }}>
        {saved ? (
          <div style={{ ...cardSurface, padding: sp.l, maxWidth: 640, margin: `${sp.l} auto`, textAlign: 'center' }}>
            <IllustratedMessage name="SuccessScreen" titleText="Plan saved to TM" subtitleText={`${accepted.length} changes committed · ${totalActions} TM actions · ${fosAffected} FOs affected · session ${SESSION_ID}`} />
            <FlexBox justifyContent="Center" style={{ marginTop: sp.l }}>
              <Button design="Emphasized" icon="add" onClick={onStartNewSession}>Start a new session</Button>
            </FlexBox>
          </div>
        ) : (
          <>
            <div style={{ ...cardSurface, padding: sp.m, marginBottom: sp.m }}>
              <div style={sectionTitle}>Session Impact</div>
              <div style={{ marginTop: sp.s, display: 'grid', gridTemplateColumns: 'repeat(4,minmax(120px,1fr))', gap: sp.m }}>
                <KpiBlock label="Changes" value={`${accepted.length}`} />
                <KpiBlock label="FOs affected" value={`${fosAffected}`} />
                <KpiBlock label="TM actions" value={`${totalActions}`} />
                <KpiBlock label="Skipped" value={`${discarded.length}`} />
              </div>
            </div>
            <div style={{ ...cardSurface, padding: sp.m, marginBottom: sp.m }}>
              <div style={sectionTitle}>KPI Comparison — Before vs After</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', marginTop: sp.s, border: '1px solid var(--sapList_BorderColor)', borderRadius: 4, overflow: 'hidden' }}>
                {['KPI', 'Before', 'After'].map((h, i) => <div key={h} style={{ padding: sp.s, background: 'var(--sapList_HeaderBackground,#f7f7f7)', borderBottom: '1px solid var(--sapList_BorderColor)', borderRight: i < 2 ? '1px solid var(--sapList_BorderColor)' : 'none' }}><Text style={{ ...labelText, fontWeight: 700 }}>{h}</Text></div>)}
                {beforeKPIs.map((b, i) => {
                  const a = afterKPIs[i];
                  return (
                    <React.Fragment key={b.label}>
                      <div style={{ padding: sp.s, borderTop: '1px solid var(--sapList_BorderColor)', borderRight: '1px solid var(--sapList_BorderColor)', background: 'var(--sapList_Background,#fff)' }}><Text style={{ ...bodyText, fontSize: 'var(--sapFontSmallSize)' }}>{b.label}</Text></div>
                      <div style={{ padding: sp.s, borderTop: '1px solid var(--sapList_BorderColor)', borderRight: '1px solid var(--sapList_BorderColor)', background: 'var(--sapList_Background,#fff)' }}><Text style={{ ...bodyText, fontSize: 'var(--sapFontSmallSize)' }}>{b.value}</Text></div>
                      <div style={{ padding: sp.s, borderTop: '1px solid var(--sapList_BorderColor)', background: 'var(--sapSuccessBackground,#f5faf5)' }}><Text style={{ ...bodyText, fontSize: 'var(--sapFontSmallSize)', fontWeight: 700 }}>{a.value}</Text></div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
            {accepted.length === 0 && <div style={{ ...cardSurface, padding: sp.l, textAlign: 'center' }}><IllustratedMessage name="NoData" titleText="No decisions to save" subtitleText="Go back to review proposals." /></div>}
            {Array.from(acceptedByRule.entries()).map(([rid, items]) => (
              <div key={rid} style={{ ...cardSurface, padding: sp.m, marginBottom: sp.m }}>
                <FlexBox alignItems="Center" style={{ gap: sp.s, marginBottom: sp.s }}><Tag design="Set2" colorScheme="6">{rid}</Tag><Text style={{ ...bodyText, fontWeight: 700 }}>{RULE_LABELS[rid]}</Text><Text style={labelText}>· {items.length} change{items.length !== 1 ? 's' : ''}</Text></FlexBox>
                <div style={{ display: 'flex', flexDirection: 'column', gap: sp.xs }}>
                  {items.map(row => (
                    <FlexBox key={row.id} alignItems="Center" justifyContent="SpaceBetween" style={{ padding: `${sp.s} ${sp.m}`, border: '1px solid var(--sapList_BorderColor)', borderRadius: 4, background: 'var(--sapList_Background,#fff)', gap: sp.s, flexWrap: 'wrap' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Text style={{ ...bodyText, fontWeight: 700 }}>{row.id} · {row.title}</Text>
                        <Text style={{ ...labelText, display: 'block', marginTop: '2px' }}>{row.beforeSummary} → {row.afterSummary}</Text>
                      </div>
                    </FlexBox>
                  ))}
                </div>
              </div>
            ))}
            {discarded.length > 0 && (
              <div style={{ ...cardSurface, padding: sp.m, marginTop: sp.m }}>
                <button type="button" onClick={() => setDiscardedExpanded(e => !e)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: sp.xs, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--sapFontFamily)', textAlign: 'left' }}>
                  <Icon name={discardedExpanded ? 'navigation-down-arrow' : 'navigation-right-arrow'} />
                  <Text style={{ ...bodyText, fontWeight: 700 }}>Skipped — no action ({discarded.length})</Text>
                </button>
                {discardedExpanded && <div style={{ marginTop: sp.s, display: 'flex', flexDirection: 'column', gap: sp.xs }}>{discarded.map(row => <div key={row.id} style={{ padding: `${sp.s} ${sp.m}`, border: '1px solid var(--sapList_BorderColor)', borderRadius: 4 }}><Text style={{ ...bodyText, fontWeight: 700 }}>{row.id} · {row.title}</Text><Text style={{ ...labelText, display: 'block' }}>Reason: {row.discardReason ?? 'planner skipped'}</Text></div>)}</div>}
              </div>
            )}
          </>
        )}
      </div>
      {!saved && (
        <div style={{ padding: `${sp.s} ${sp.l}`, borderTop: '1px solid var(--sapList_BorderColor)', background: 'var(--sapObjectHeader_Background,#fff)' }}>
          <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ gap: sp.s, flexWrap: 'wrap' }}>
            <Text style={labelText}>{accepted.length === 0 ? 'No accepted changes to save.' : `Save commits ${totalActions} TM actions across ${fosAffected} freight orders.`}</Text>
            <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
              <Button design="Transparent" icon="decline" onClick={() => showToast('Session discarded — no changes written to TM')}>Discard</Button>
              <Button design="Emphasized" icon="save" disabled={accepted.length === 0} onClick={() => { setSaved(true); onSessionSaved(); showToast(`${accepted.length} changes committed to TM`); }}>Save to TM</Button>
            </FlexBox>
          </FlexBox>
        </div>
      )}
      <Toast open={toastOpen} duration={3000} placement="BottomCenter" onClose={() => setToastOpen(false)}>{toastMessage}</Toast>
    </div>
  );
};
