// @ts-nocheck
// PlannerViews.tsx — Matches design PDFs exactly
// Tabs: Session Start | Planning Overview | Rule Evaluation | Proposal Review | Change Summary

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ObjectStatus, BusyIndicator, MessageStrip, Toast } from '@ui5/webcomponents-react';
import { PageHeader, Dialog, Btn, body, label, mono, card, sp } from './index';
import {
  MOCK_TM_PROFILE_SETS, LOADED_FOS, RESOURCE_SUMMARY, SESSION_KPIS,
  CHANGE_SUMMARY_KPIS, SESSION_ID, INITIAL_PROFILES,
} from './data';
import type { RuleProfile, TmProfileSet, FreightOrder, RuleDescriptor, RecPackage, PackageState, EvalStatus } from './types';

const TODAY = '2026-07-20';

function getEffectiveProfiles(profiles: RuleProfile[]): RuleProfile[] {
  return profiles.filter(p => p.status === 'active' && TODAY >= p.effectiveFrom && (!p.effectiveTo || TODAY <= p.effectiveTo));
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
const Kpi: React.FC<{ value: string; label: string; warn?: boolean }> = ({ value, label: lbl, warn }) => (
  <div style={{ ...card, padding: sp.m, textAlign: 'center', minWidth: 120 }}>
    <div style={{ fontSize: 'var(--sapFontHeader3Size)', fontWeight: 'var(--sapFontBoldWeight)', color: warn ? 'var(--sapCriticalTextColor, #b25500)' : 'var(--sapTextColor)', fontFamily: 'var(--sapFontFamily)', marginBottom: sp.xs }}>{value}</div>
    <div style={{ ...label, color: 'var(--sapContent_LabelColor)' }}>{lbl}</div>
  </div>
);

// ─── Package state badge ──────────────────────────────────────────────────────
const PkgBadge: React.FC<{ state: PackageState }> = ({ state }) => {
  const m: Record<PackageState, [string, string]> = {
    pending: ['Pending', 'None'], ready: ['Ready', 'Information'],
    evaluating: ['Re-evaluating', 'Information'], accepted: ['Accepted', 'Positive'],
    rejected: ['Rejected', 'Negative'], stale: ['Stale', 'Critical'],
    discarded: ['Discarded', 'None'], nosol: ['No Solution', 'Negative'],
  };
  const [txt, st] = m[state] ?? [state, 'None'];
  return <ObjectStatus state={st}>{txt}</ObjectStatus>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION START — matches design PDF exactly
// Two dropdowns side by side, connection status banner, detail panels below each
// ═══════════════════════════════════════════════════════════════════════════════
export const SessionStartView: React.FC<{
  setupActive: boolean;
  profiles: RuleProfile[];
  onLoaded: () => void;
}> = ({ setupActive, profiles, onLoaded }) => {
  const [psId, setPsId] = useState('');
  const [rpId, setRpId] = useState('');
  const [psState, setPsState] = useState<'idle' | 'loading' | 'loaded'>('idle');
  const [loading, setLoading] = useState(false);
  const [lockedDialog, setLockedDialog] = useState<null | 'detected' | 'checking' | 'released' | 'failed'>(null);
  const [showRules, setShowRules] = useState(false);

  const effective = useMemo(() => getEffectiveProfiles(profiles), [profiles]);
  const selPs = MOCK_TM_PROFILE_SETS.find(p => p.id === psId);
  const selRp = effective.find(p => p.id === rpId);
  const canLoad = setupActive && psId && rpId;

  useEffect(() => {
    if (setupActive && psState === 'idle') {
      setPsState('loading');
      setTimeout(() => setPsState('loaded'), 1200);
    }
  }, [setupActive]);

  const handleLoad = () => {
    setLoading(true);
    setTimeout(() => { setLockedDialog('detected'); }, 700);
  };

  const handleRefreshLocks = () => {
    setLockedDialog('checking');
    setTimeout(() => setLockedDialog('released'), 1400);
  };

  const handleLockOk = () => {
    if (lockedDialog === 'released') {
      setLockedDialog(null); setLoading(false);
      setTimeout(onLoaded, 300);
    } else { setLockedDialog(null); setLoading(false); }
  };

  const sel = (val: string, set: (v: string) => void, opts: Array<{ id: string; label: string }>, placeholder: string) => (
    <select value={val} onChange={e => set(e.target.value)} style={{ width: '100%', padding: sp.s, border: '1px solid var(--sapField_BorderColor, #ccc)', borderRadius: '0.25rem', fontSize: 'var(--sapFontSize)', fontFamily: 'var(--sapFontFamily)', background: 'var(--sapField_Background)', color: 'var(--sapTextColor)', cursor: 'pointer' }}>
      <option value="">{placeholder}</option>
      {opts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
    </select>
  );

  return (
    <div>
      {/* Connection status banner */}
      <div style={{ padding: `${sp.s} ${sp.l}`, background: setupActive ? 'var(--sapSuccessBackground, #f5fae5)' : 'var(--sapErrorBackground, #fef5f5)', borderBottom: `1px solid ${setupActive ? 'var(--sapPositiveColor)' : 'var(--sapNegativeColor)'}`, display: 'flex', alignItems: 'center', gap: sp.s }}>
        <span style={{ color: setupActive ? 'var(--sapPositiveColor)' : 'var(--sapNegativeColor)', fontWeight: 'var(--sapFontBoldWeight)', ...body }}>
          {setupActive ? '● SAP Transportation Management Connection is active.' : '● SAP Transportation Management connection is not active. Refresh your session to reconnect.'}
        </span>
      </div>

      <div style={{ maxWidth: 900, padding: sp.l }}>
        <div style={{ marginBottom: sp.m }}>
          <div style={{ fontSize: 'var(--sapFontHeader4Size)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', fontFamily: 'var(--sapFontFamily)', marginBottom: sp.xs }}>Start a Planning Refinement Session</div>
          <div style={{ ...body, color: 'var(--sapContent_LabelColor)' }}>Select an SAP Transportation Management Profile Set and a Rule Profile, then load the planning session.</div>
        </div>

        {/* Two dropdowns side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.l, marginBottom: sp.l }}>
          {/* Profile Set */}
          <div>
            <div style={{ ...label, marginBottom: sp.s }}>SAP Transportation Management Profile Set</div>
            {!setupActive ? (
              <MessageStrip design="Warning" hideCloseButton>SAP TM connection is not active.</MessageStrip>
            ) : psState === 'loading' ? (
              <BusyIndicator active size="S" text="Loading Profile Sets from SAP TM…" />
            ) : (
              <>
                {sel(psId, setPsId, MOCK_TM_PROFILE_SETS.map(ps => ({ id: ps.id, label: ps.name })), 'Select a Profile Set')}
                {selPs && (
                  <div style={{ marginTop: sp.s, padding: sp.s, background: 'var(--sapNeutralBackground, #f5f6f7)', borderRadius: '0.25rem' }}>
                    <div style={{ display: 'flex', gap: sp.l, marginBottom: sp.xs }}>
                      <span style={{ ...label, minWidth: 200 }}>Freight Unit Selection Profile</span>
                      <span style={mono}>{selPs.freightUnitSelectionProfile}</span>
                    </div>
                    <div style={{ display: 'flex', gap: sp.l }}>
                      <span style={{ ...label, minWidth: 200 }}>Freight Order Selection Profile</span>
                      <span style={mono}>{selPs.freightOrderSelectionProfile}</span>
                    </div>
                    <div style={{ marginTop: sp.s, display: 'flex', alignItems: 'center', gap: sp.xs }}>
                      <span style={{ color: 'var(--sapContent_LabelColor)', fontSize: 12 }}>🔒</span>
                      <span style={{ ...label, color: 'var(--sapContent_LabelColor)', fontSize: 11 }}>Maintained in SAP TM, contact your TM administrator to modify Profile Sets</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Rule Profile */}
          <div>
            <div style={{ ...label, marginBottom: sp.s }}>Rule Profile</div>
            {effective.length === 0 ? (
              <MessageStrip design="Warning" hideCloseButton>No active rule profiles are effective today.</MessageStrip>
            ) : (
              <>
                {sel(rpId, setRpId, effective.map(p => ({ id: p.id, label: p.name })), 'Select a Rule Profile')}
                {selRp && (
                  <div style={{ marginTop: sp.s, padding: sp.s, background: 'var(--sapNeutralBackground, #f5f6f7)', borderRadius: '0.25rem' }}>
                    <div style={{ display: 'flex', gap: sp.l, marginBottom: sp.xs }}><span style={{ ...label, minWidth: 140 }}>TM Profile</span><span style={mono}>DC-{selRp.dc} (LGF-{selRp.dc})</span></div>
                    <div style={{ display: 'flex', gap: sp.l, marginBottom: sp.xs }}><span style={{ ...label, minWidth: 140 }}>Effective Period</span><span style={mono}>{selRp.effectiveFrom} / {selRp.effectiveTo ?? '—'}</span></div>
                    <div style={{ display: 'flex', gap: sp.l, marginBottom: sp.s }}><span style={{ ...label, minWidth: 140 }}>Rules Assigned</span><span style={mono}>{selRp.ruleIds.length} rules</span></div>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sapBrandColor)', fontSize: 'var(--sapFontSmallSize)', fontFamily: 'var(--sapFontFamily)', padding: 0 }} onClick={() => setShowRules(v => !v)}>
                      {showRules ? 'Hide Assigned Rules' : 'Show Assigned Rules'}
                    </button>
                    {showRules && (
                      <div style={{ marginTop: sp.s }}>
                        {selRp.ruleIds.slice(0, 5).map((rId, i) => (
                          <div key={rId} style={{ ...body, color: 'var(--sapContent_LabelColor)', paddingBottom: sp.xs }}>
                            {String(i + 1).padStart(2, '0')}. {rId}  <span style={{ color: 'var(--sapBrandColor)', cursor: 'pointer', fontSize: 'var(--sapFontSmallSize)' }}>More</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {loading && !lockedDialog && (
          <MessageStrip design="Information" hideCloseButton style={{ marginBottom: sp.m }}>
            <BusyIndicator active size="XS" style={{ marginRight: sp.s }} />
            Planning session is loading, do not leave the page.
          </MessageStrip>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: sp.s }}>
          <Btn label="Cancel" variant="ghost" />
          <Btn label={loading ? 'Loading session…' : 'Load Planning Session'} variant="primary" disabled={!canLoad || loading} onClick={handleLoad} />
        </div>
      </div>

      {/* Locked Objects Dialog */}
      <Dialog open={lockedDialog !== null} title="Locked TM Objects Detected" onClose={() => { setLockedDialog(null); setLoading(false); }}
        footer={
          lockedDialog === 'detected' ? <><Btn label="Discard Session" variant="ghost" onClick={() => { setLockedDialog(null); setLoading(false); }} /><Btn label="Refresh Lock Status" variant="primary" onClick={handleRefreshLocks} /></> :
          lockedDialog === 'checking' ? null :
          <Btn label="OK" variant="primary" onClick={handleLockOk} />
        }
      >
        {lockedDialog === 'detected' && <p style={body}>Some of the TM objects in this session are currently locked by another user or session. Click "Refresh Lock Status" to check if objects have been released.</p>}
        {lockedDialog === 'checking' && <div style={{ display: 'flex', alignItems: 'center', gap: sp.m }}><BusyIndicator active size="S" /><p style={body}>Checking lock status with SAP TM…</p></div>}
        {lockedDialog === 'released' && <MessageStrip design="Positive" hideCloseButton>All the locked TM objects have been released. You can now retry loading the planning session.</MessageStrip>}
        {lockedDialog === 'failed' && <MessageStrip design="Negative" hideCloseButton>Locked objects cannot be released. Try changing the parameters, then reload the planning session.</MessageStrip>}
      </Dialog>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PLANNING OVERVIEW — 6 KPI cards + expandable FO/Resource tables
// ═══════════════════════════════════════════════════════════════════════════════
export const PlanningOverviewView: React.FC<{ onProceed: () => void }> = ({ onProceed }) => {
  const [foExpanded, setFoExpanded] = useState(true);
  const [resExpanded, setResExpanded] = useState(false);
  const [connErr, setConnErr] = useState(false);
  const k = SESSION_KPIS;

  return (
    <div>
      {connErr && <MessageStrip design="Negative" style={{ margin: sp.m }} onClose={() => setConnErr(false)}>We're having trouble connecting to the server. <Btn label="Retry" variant="ghost" onClick={() => setConnErr(false)} /></MessageStrip>}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: `${sp.m} ${sp.l}`, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
        <div>
          <div style={{ fontSize: 'var(--sapFontHeader4Size)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', fontFamily: 'var(--sapFontFamily)', marginBottom: sp.xs }}>Planning Overview</div>
          <div style={{ ...body, color: 'var(--sapContent_LabelColor)' }}>
            Review your refinement session details. TM planning session transferred successfully. {k.freightOrders * 100} freight orders, {k.deliveryStops} delivery stops, and {k.resources} resources loaded and locked.
            {k.overCapacity > 0 && <span style={{ color: 'var(--sapCriticalTextColor, #b25500)' }}> ⚠ {k.overCapacity} FOs over capacity detected.</span>}
          </div>
        </div>
        <ObjectStatus state="Positive">Session Active</ObjectStatus>
      </div>

      <div style={{ padding: sp.l }}>
        {/* 6 KPI cards, 3 per row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: sp.m, marginBottom: sp.m }}>
          <Kpi value={String(k.freightOrders)} label="Freight Orders" />
          <Kpi value={`${k.totalDistanceKm.toLocaleString()} km`} label="Total Distance" />
          <Kpi value={String(k.deliveryStops)} label="Delivery Stops" />
          <Kpi value={`${k.avgUtilization}%`} label="Avg Utilization" />
          <Kpi value={`${k.totalPallets.toFixed(2)} PAL`} label="Total Pallets" />
          <Kpi value={k.totalCostEur.toLocaleString()} label="Total Cost" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: sp.m, marginBottom: sp.l }}>
          <Kpi value={String(k.resources)} label="Resources" />
          <Kpi value={String(k.overCapacity)} label="Over Capacity" warn={k.overCapacity > 0} />
        </div>

        {/* Freight Orders collapsible */}
        <div style={{ ...card, marginBottom: sp.m, overflow: 'hidden' }}>
          <button onClick={() => setFoExpanded(v => !v)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: `${sp.m} ${sp.m}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: foExpanded ? '1px solid var(--sapList_BorderColor)' : 'none' }}>
            <span style={{ ...label, fontSize: 'var(--sapFontSize)', color: 'var(--sapTextColor)' }}>Freight Orders ({LOADED_FOS.length})</span>
            <span style={{ color: 'var(--sapContent_LabelColor)' }}>{foExpanded ? '▲' : '▼'}</span>
          </button>
          {foExpanded && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)' }}>
                <thead><tr style={{ background: 'var(--sapList_HeaderBackground)' }}>
                  {['Document', 'DC', 'Resource', 'Stops', 'Pallets', 'Distance KM', 'Utilization', 'Amount EUR'].map(h => <th key={h} style={{ ...label, padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', textAlign: 'left' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {LOADED_FOS.map((fo, i) => (
                    <tr key={fo.id} style={{ background: fo.overCapacity ? 'var(--sapCriticalBackground, #fff8e1)' : i % 2 === 1 ? 'var(--sapList_AlternatingBackground)' : 'transparent' }}>
                      <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', ...mono }}>{fo.sapId}</td>
                      <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)' }}>{fo.dc}</td>
                      <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', ...mono, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fo.resource}</td>
                      <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', textAlign: 'center' }}>{fo.stops}</td>
                      <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', textAlign: 'right' }}>{fo.pallets.toFixed(2)}</td>
                      <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', textAlign: 'right' }}>{fo.distanceKm.toFixed(1)}</td>
                      <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', textAlign: 'right', color: fo.overCapacity ? 'var(--sapNegativeColor)' : fo.utilizationPct > 95 ? 'var(--sapCriticalColor)' : 'var(--sapPositiveColor)', fontWeight: fo.overCapacity ? 'var(--sapFontBoldWeight)' : 'normal' }}>{fo.utilizationPct.toFixed(1)}%</td>
                      <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', textAlign: 'right' }}>€{fo.amountEur.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Resources collapsible */}
        <div style={{ ...card, marginBottom: sp.l, overflow: 'hidden' }}>
          <button onClick={() => setResExpanded(v => !v)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: `${sp.m} ${sp.m}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: resExpanded ? '1px solid var(--sapList_BorderColor)' : 'none' }}>
            <span style={{ ...label, fontSize: 'var(--sapFontSize)', color: 'var(--sapTextColor)' }}>Resources ({RESOURCE_SUMMARY.length} loaded)</span>
            <span style={{ color: 'var(--sapContent_LabelColor)' }}>{resExpanded ? '▲' : '▼'}</span>
          </button>
          {resExpanded && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)' }}>
                <thead><tr style={{ background: 'var(--sapList_HeaderBackground)' }}>
                  {['Carrier ID', 'Resource ID', 'DC', 'Tours', 'Total Pallets', 'AVG Utilization'].map(h => <th key={h} style={{ ...label, padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', textAlign: 'left' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {RESOURCE_SUMMARY.map((r, i) => (
                    <tr key={r.resourceId} style={{ background: i % 2 === 1 ? 'var(--sapList_AlternatingBackground)' : 'transparent' }}>
                      <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', ...mono }}>9192001</td>
                      <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', ...mono }}>{r.resourceId}</td>
                      <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)' }}>{r.dc}</td>
                      <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', textAlign: 'center' }}>{r.tours}</td>
                      <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', textAlign: 'right' }}>{r.totalPallets.toFixed(1)}</td>
                      <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', textAlign: 'right', color: r.avgUtilization > 100 ? 'var(--sapNegativeColor)' : r.avgUtilization > 95 ? 'var(--sapCriticalColor)' : 'inherit' }}>{r.avgUtilization.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: sp.s }}>
          <Btn label="Cancel" variant="ghost" />
          <Btn label="Proceed to Rule Evaluation" variant="primary" onClick={onProceed} />
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// RULE EVALUATION — list of rules with full 3-section content, reorder, run
// ═══════════════════════════════════════════════════════════════════════════════
export const RuleEvaluationView: React.FC<{
  descriptors: RuleDescriptor[];
  setDescriptors: (d: RuleDescriptor[]) => void;
  onStartReview: () => void;
}> = ({ descriptors, setDescriptors, onStartReview }) => {
  const [evalStatus, setEvalStatus] = useState<EvalStatus>('not-started');
  const [progress, setProgress] = useState(0);

  const statusText: Record<EvalStatus, string> = {
    'not-started':   "Rule evaluation hasn't started",
    'running':       'Rule evaluation is in progress...',
    'complete':      'Evaluation completed, proposals await your decision in the next step.',
    'manual-review': 'Two rules conflict for the same planning objects.',
    'error':         'The rule could not be evaluated because of a technical failure.',
    'no-action':     'A violation has been detected due to capacity conflict.',
  };

  const moveRule = (i: number, dir: 'up' | 'down') => {
    const next = [...descriptors];
    const t = dir === 'up' ? i - 1 : i + 1;
    if (t < 0 || t >= next.length) return;
    [next[i], next[t]] = [next[t], next[i]];
    setDescriptors(next);
  };

  const handleRun = () => {
    setEvalStatus('running'); setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setEvalStatus('complete');
          setDescriptors(descriptors.map(r => ({ ...r, evalStatus: 'evaluated' })));
          return 100;
        }
        return p + 6;
      });
    }, 120);
  };

  return (
    <div>
      <div style={{ padding: `${sp.m} ${sp.l}`, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
        <div style={{ fontSize: 'var(--sapFontHeader4Size)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', fontFamily: 'var(--sapFontFamily)', marginBottom: sp.xs }}>Rule Evaluation · SAP TM Session Active</div>
        <div style={{ ...body, color: 'var(--sapContent_LabelColor)' }}>Reorder the active rules, then run them against the loaded TM plan. Earlier rules fire first.</div>
      </div>

      <div style={{ padding: sp.l }}>
        {/* Status bar */}
        <div style={{ ...card, padding: sp.m, marginBottom: sp.m, display: 'flex', alignItems: 'center', gap: sp.m, flexWrap: 'wrap' }}>
          <div style={{ ...body, fontWeight: 'var(--sapFontBoldWeight)' }}>
            {evalStatus === 'not-started' && '⬡'}
            {evalStatus === 'running' && '⟳'}
            {evalStatus === 'complete' && '✓'}
            {evalStatus === 'error' && '✗'}
            {' '}{statusText[evalStatus]}
          </div>
          {evalStatus === 'running' && <div style={{ flex: 1, minWidth: 200, height: 6, background: 'var(--sapList_BorderColor)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--sapBrandColor)', width: `${progress}%`, transition: 'width 0.2s' }} />
          </div>}
          {evalStatus === 'running' && <div style={{ ...label, color: 'var(--sapContent_LabelColor)' }}>Rules are being evaluated, do not leave the page. Estimated time left: {Math.ceil((100 - progress) / 20)} min</div>}
        </div>

        {/* Profile header */}
        <div style={{ ...label, marginBottom: sp.m, color: 'var(--sapBrandColor)' }}>Profile: BD27 Standard Daily — {descriptors.length} Active Rules</div>

        {/* Rules */}
        <div style={{ ...card, overflow: 'hidden', marginBottom: sp.l }}>
          {descriptors.map((rule, i) => (
            <div key={rule.id} style={{ borderBottom: i < descriptors.length - 1 ? '1px solid var(--sapList_BorderColor)' : 'none', padding: sp.m, display: 'flex', gap: sp.m }}>
              {/* Order + arrows */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0, minWidth: 40 }}>
                <span style={{ ...label, color: 'var(--sapContent_LabelColor)', marginBottom: sp.xs }}>{String(i + 1).padStart(2, '0')}</span>
                <button disabled={evalStatus === 'running' || i === 0} onClick={() => moveRule(i, 'up')} style={{ background: 'none', border: '1px solid var(--sapList_BorderColor)', borderRadius: '0.25rem', cursor: i === 0 || evalStatus === 'running' ? 'not-allowed' : 'pointer', padding: '2px 6px', color: 'var(--sapContent_LabelColor)', opacity: i === 0 ? 0.3 : 1 }}>▲</button>
                <button disabled={evalStatus === 'running' || i === descriptors.length - 1} onClick={() => moveRule(i, 'down')} style={{ background: 'none', border: '1px solid var(--sapList_BorderColor)', borderRadius: '0.25rem', cursor: i === descriptors.length - 1 || evalStatus === 'running' ? 'not-allowed' : 'pointer', padding: '2px 6px', color: 'var(--sapContent_LabelColor)', opacity: i === descriptors.length - 1 ? 0.3 : 1 }}>▼</button>
              </div>

              {/* Rule content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: sp.m, marginBottom: sp.s }}>
                  <div>
                    <div style={{ ...body, fontWeight: 'var(--sapFontBoldWeight)', marginBottom: sp.xs }}>{rule.name}</div>
                    <div style={{ display: 'flex', gap: sp.s }}>
                      <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: rule.ruleType === 'hard-constraint' ? 'var(--sapNegativeBackground, #fef5f5)' : 'var(--sapInformativeBackground, #e8f4ff)', color: rule.ruleType === 'hard-constraint' ? 'var(--sapNegativeColor)' : 'var(--sapInformativeColor)' }}>
                        {rule.ruleType === 'hard-constraint' ? 'Hard constraint' : 'Preference'}
                      </span>
                      <span style={{ ...label, color: 'var(--sapContent_LabelColor)' }}>{rule.group}</span>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {rule.evalStatus === 'pending' && <span style={{ ...label, color: 'var(--sapContent_LabelColor)' }}>Status: Pending</span>}
                    {rule.evalStatus === 'evaluating' && <BusyIndicator active size="XS" />}
                    {rule.evalStatus === 'evaluated' && <ObjectStatus state="Positive">Evaluated</ObjectStatus>}
                    {rule.evalStatus === 'error' && <ObjectStatus state="Negative">Error</ObjectStatus>}
                    {rule.evalStatus === 'no-action' && <ObjectStatus state="Negative">No Feasible Action</ObjectStatus>}
                  </div>
                </div>

                {/* SOP Description — truncated with "More" */}
                <div style={{ ...body, color: 'var(--sapContent_LabelColor)', marginBottom: sp.xs }}>
                  <span style={{ ...label, color: 'var(--sapTextColor)' }}>SOP Description: </span>
                  {rule.sopDescription.length > 300 ? rule.sopDescription.slice(0, 300) + '…' : rule.sopDescription}
                  {rule.sopDescription.length > 300 && <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sapBrandColor)', fontSize: 'var(--sapFontSmallSize)', padding: '0 4px' }}>More</button>}
                </div>

                {rule.businessContext && (
                  <div style={{ ...body, color: 'var(--sapContent_LabelColor)', marginBottom: sp.xs }}>
                    <span style={{ ...label, color: 'var(--sapTextColor)' }}>Business Context, Reason & Scope: </span>
                    {rule.businessContext.slice(0, 300)}
                  </div>
                )}

                {rule.exampleScenario && (
                  <div style={{ ...body, color: 'var(--sapContent_LabelColor)' }}>
                    <span style={{ ...label, color: 'var(--sapTextColor)' }}>Example Scenario & Expected Behavior: </span>
                    {rule.exampleScenario.slice(0, 300)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: sp.s }}>
          <Btn label="Cancel" variant="ghost" />
          {evalStatus === 'complete'
            ? <Btn label="Start Review" variant="primary" onClick={onStartReview} />
            : <Btn label={evalStatus === 'running' ? 'Evaluating…' : 'Run Rule Evaluation'} variant="primary" disabled={evalStatus === 'running'} onClick={handleRun} />
          }
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROPOSAL REVIEW — counter strip left, queue table main, detail view on click
// ═══════════════════════════════════════════════════════════════════════════════
export const ProposalReviewView: React.FC<{
  packages: RecPackage[];
  updatePkg: (id: string, state: PackageState) => void;
  onProceed: () => void;
}> = ({ packages, updatePkg, onProceed }) => {
  const [selId, setSelId] = useState<string | null>(null);
  const [acceptAllOpen, setAcceptAllOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [reEvalOpen, setReEvalOpen] = useState<string | null>(null);
  const [hint, setHint] = useState('');

  const accepted  = packages.filter(p => p.state === 'accepted').length;
  const rejected  = packages.filter(p => p.state === 'rejected').length;
  const discarded = packages.filter(p => p.state === 'discarded').length;
  const pending   = packages.filter(p => p.state === 'pending' || p.state === 'ready').length;
  const noSol     = packages.filter(p => p.state === 'nosol').length;
  const reviewed  = accepted + rejected + discarded + noSol;
  const total     = packages.length;
  const readyCount = packages.filter(p => p.state === 'ready').length;

  const sel = packages.find(p => p.id === selId);

  const handleReject = (id: string) => {
    updatePkg(id, 'rejected');
    const idx = packages.findIndex(p => p.id === id);
    packages.slice(idx + 1).filter(p => p.state === 'ready' || p.state === 'pending').forEach(p => updatePkg(p.id, 'stale'));
    setSelId(null);
  };

  const handleReEval = (id: string) => {
    updatePkg(id, 'evaluating');
    setReEvalOpen(null); setHint('');
    setTimeout(() => updatePkg(id, 'ready'), 2000);
  };

  const rowBg: Record<PackageState, string> = {
    accepted: 'var(--sapSuccessBackground, #f5fae5)', rejected: 'var(--sapErrorBackground, #fef5f5)',
    discarded: 'var(--sapNeutralBackground, #f5f6f7)', evaluating: 'var(--sapHighlightBackground, #e8f4ff)',
    stale: 'var(--sapCriticalBackground, #fff8e1)', nosol: 'var(--sapErrorBackground, #fef5f5)',
    pending: 'transparent', ready: 'transparent',
  };

  return (
    <div>
      <div style={{ padding: `${sp.m} ${sp.l}`, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
        <div style={{ fontSize: 'var(--sapFontHeader4Size)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', fontFamily: 'var(--sapFontFamily)', marginBottom: sp.xs }}>Proposal Review · {SESSION_ID}</div>
        <div style={{ ...body, color: 'var(--sapContent_LabelColor)' }}>Review each proposed package, accept or reject. Rejecting requires reevaluating the subsequent packages.</div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', padding: sp.l, gap: sp.l }}>
        {/* LEFT: counter strip */}
        <div style={{ width: 160, flexShrink: 0 }}>
          <div style={{ ...card, padding: sp.m }}>
            {[
              { lbl: 'Accepted', val: accepted },
              { lbl: 'Rejected', val: rejected },
              { lbl: 'Discarded', val: discarded },
              { lbl: 'Pending', val: pending },
              { lbl: 'Reviewed', val: `${reviewed}/${total}` },
            ].map(({ lbl, val }) => (
              <div key={lbl} style={{ paddingBottom: sp.s, marginBottom: sp.s, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                <div style={{ ...label, marginBottom: '2px' }}>{lbl}</div>
                <div style={{ fontSize: 'var(--sapFontHeader3Size)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', fontFamily: 'var(--sapFontFamily)' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: detail view or queue */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {sel ? (
            /* ── Package Detail ── */
            <div>
              <button onClick={() => setSelId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sapBrandColor)', ...body, marginBottom: sp.m, display: 'flex', alignItems: 'center', gap: sp.xs }}>
                ← Back to Proposal Queue
              </button>

              <div style={{ ...card, padding: sp.m, marginBottom: sp.m }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: sp.m }}>
                  <div>
                    <div style={{ ...label, marginBottom: sp.xs, color: 'var(--sapBrandColor)' }}>{sel.id.toUpperCase()}</div>
                    <div style={{ fontSize: 'var(--sapFontHeader4Size)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', fontFamily: 'var(--sapFontFamily)', marginBottom: sp.xs }}>{sel.title}</div>
                    <div style={{ ...body, color: 'var(--sapContent_LabelColor)', marginBottom: sp.s }}>Rule: {sel.ruleName}</div>
                    <PkgBadge state={sel.state} />
                  </div>
                  <div style={{ display: 'flex', gap: sp.s, flexShrink: 0 }}>
                    {sel.state === 'ready' && <><Btn label="Reject" variant="danger" onClick={() => handleReject(sel.id)} /><Btn label="Accept" variant="primary" onClick={() => { updatePkg(sel.id, 'accepted'); setSelId(null); }} /></>}
                    {sel.state === 'stale' && <><Btn label="Discard" variant="ghost" onClick={() => { updatePkg(sel.id, 'discarded'); setSelId(null); }} /><Btn label="Re-evaluate" variant="secondary" onClick={() => setReEvalOpen(sel.id)} /></>}
                    {sel.state === 'nosol' && <><Btn label="Re-evaluate" variant="secondary" onClick={() => setReEvalOpen(sel.id)} /><Btn label="Acknowledge" variant="ghost" onClick={() => { updatePkg(sel.id, 'discarded'); setSelId(null); }} /></>}
                  </div>
                </div>
              </div>

              {sel.state === 'stale' && <MessageStrip design="Critical" hideCloseButton style={{ marginBottom: sp.m }}>This package is stale. Caused by a previously rejected package — preconditions may no longer hold.</MessageStrip>}
              {sel.state === 'nosol' && <MessageStrip design="Negative" hideCloseButton style={{ marginBottom: sp.m }}>No admissible solution. {sel.whyText}</MessageStrip>}

              {/* WHY */}
              <div style={{ ...card, padding: sp.m, marginBottom: sp.m, background: 'var(--sapNeutralBackground, #f5f6f7)' }}>
                <div style={{ ...label, marginBottom: sp.s }}>WHY</div>
                <div style={body}>{sel.whyText}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.m, marginBottom: sp.m }}>
                {/* Affected Objects */}
                <div style={{ ...card, padding: sp.m }}>
                  <div style={{ ...label, marginBottom: sp.s }}>AFFECTED OBJECTS ({sel.affectedObjects.length})</div>
                  {sel.affectedObjects.map((obj, i) => (
                    <div key={i} style={{ display: 'flex', gap: sp.s, paddingBottom: sp.xs }}>
                      <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: 'var(--sapInformativeBackground)', color: 'var(--sapInformativeColor)', flexShrink: 0 }}>{obj.kind}</span>
                      <div><div style={{ ...mono }}>{obj.id}</div><div style={{ ...body, color: 'var(--sapContent_LabelColor)', fontSize: 12 }}>{obj.description}</div></div>
                    </div>
                  ))}
                </div>

                {/* Validation */}
                <div style={{ ...card, padding: sp.m }}>
                  <div style={{ ...label, marginBottom: sp.s }}>VALIDATION</div>
                  {sel.validationChecks.map((vc, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: sp.s, paddingBottom: sp.xs }}>
                      <span style={{ color: vc.passed ? 'var(--sapPositiveColor)' : 'var(--sapNegativeColor)' }}>{vc.passed ? '✓' : '✗'}</span>
                      <span style={body}>{vc.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* KPI Comparison */}
              {sel.kpiComparison.length > 0 && (
                <div style={{ ...card, padding: sp.m, marginBottom: sp.m }}>
                  <div style={{ ...label, marginBottom: sp.xs }}>KPI COMPARISON</div>
                  <div style={{ ...body, color: 'var(--sapContent_LabelColor)', fontSize: 12, marginBottom: sp.m }}>Each row pairs the same KPI before and after the package is accepted</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)' }}>
                    <thead><tr><th style={{ ...label, padding: `${sp.xs} ${sp.s}`, textAlign: 'left', borderBottom: '1px solid var(--sapList_BorderColor)' }}>KPI</th><th style={{ ...label, padding: `${sp.xs} ${sp.s}`, textAlign: 'right', borderBottom: '1px solid var(--sapList_BorderColor)' }}>Before</th><th style={{ ...label, padding: `${sp.xs} ${sp.s}`, textAlign: 'right', borderBottom: '1px solid var(--sapList_BorderColor)' }}>After</th></tr></thead>
                    <tbody>{sel.kpiComparison.map((row, i) => (
                      <tr key={i}><td style={{ padding: `${sp.xs} ${sp.s}`, borderBottom: '1px solid var(--sapList_BorderColor)' }}>{row.label}</td><td style={{ ...mono, padding: `${sp.xs} ${sp.s}`, textAlign: 'right', borderBottom: '1px solid var(--sapList_BorderColor)' }}>{row.before}</td><td style={{ ...mono, padding: `${sp.xs} ${sp.s}`, textAlign: 'right', borderBottom: '1px solid var(--sapList_BorderColor)', color: 'var(--sapPositiveColor)' }}>{row.after}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              )}

              {/* TM Actions */}
              {sel.tmActions.length > 0 && (
                <div style={{ ...card, padding: sp.m, marginBottom: sp.m }}>
                  <div style={{ ...label, marginBottom: sp.xs }}>SAP TRANSPORTATION MANAGEMENT ACTIONS, ATOMIC, IN ORDER</div>
                  <div style={{ ...body, color: 'var(--sapContent_LabelColor)', fontSize: 12, marginBottom: sp.m }}>Accept applies all {sel.tmActions.length} actions as a unit. No partial accept.</div>
                  {sel.tmActions.map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: sp.s, paddingBottom: sp.xs }}>
                      <span style={{ ...mono, color: 'var(--sapContent_LabelColor)', minWidth: 20 }}>{i + 1}.</span>
                      <span style={body}>{a.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ── Package Queue Table ── */
            <div>
              <div style={{ ...card, overflow: 'hidden', marginBottom: sp.m }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)' }}>
                  <thead><tr style={{ background: 'var(--sapList_HeaderBackground)' }}>
                    {['Package', 'Proposal', 'Rule', 'Status'].map(h => <th key={h} style={{ ...label, padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', textAlign: 'left' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {packages.map((pkg, i) => (
                      <tr key={pkg.id} onClick={() => setSelId(pkg.id)} style={{ cursor: 'pointer', background: rowBg[pkg.state] ?? 'transparent' }}>
                        <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', ...mono, fontWeight: 'var(--sapFontBoldWeight)' }}>{pkg.id}</td>
                        <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pkg.title}</td>
                        <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--sapContent_LabelColor)' }}>{pkg.ruleName}</td>
                        <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: sp.xs }}>
                            <PkgBadge state={pkg.state} />
                            {pkg.state === 'evaluating' && <BusyIndicator active size="XS" />}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: sp.s }}>
                <div style={{ display: 'flex', gap: sp.s }}>
                  <Btn label="Cancel" variant="ghost" onClick={() => setDiscardOpen(true)} />
                  {readyCount > 0 && <Btn label={`Accept All (${readyCount})`} variant="secondary" onClick={() => setAcceptAllOpen(true)} />}
                </div>
                <Btn label={reviewed < total ? `Proceed (${reviewed}/${total} reviewed)` : 'Proceed to Change Summary'} variant="primary" disabled={reviewed < total} onClick={onProceed} />
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={acceptAllOpen} title={`Accept ${readyCount} Ready Proposals?`} onClose={() => setAcceptAllOpen(false)}
        footer={<><Btn label="Cancel" variant="ghost" onClick={() => setAcceptAllOpen(false)} /><Btn label="Accept All" variant="primary" onClick={() => { packages.filter(p => p.state === 'ready').forEach(p => updatePkg(p.id, 'accepted')); setAcceptAllOpen(false); }} /></>}
      >
        <p style={body}>Accepts every proposal currently marked Ready into the refined plan. On save, {readyCount * 3} TM actions will be applied. Stale and no-solution proposals are unaffected.</p>
      </Dialog>

      <Dialog open={discardOpen} title="Discard Planning Session?" onClose={() => setDiscardOpen(false)}
        footer={<><Btn label="Keep Working" variant="primary" onClick={() => setDiscardOpen(false)} /><Btn label="Discard Session" variant="danger" onClick={() => setDiscardOpen(false)} /></>}
      >
        <p style={body}>You have unsaved decisions in this planning session. If you leave now, your reviewed packages and selections will be discarded and SAP Transportation Management stays unchanged.</p>
      </Dialog>

      <Dialog open={reEvalOpen !== null} title={`Re-evaluate ${reEvalOpen}?`} onClose={() => { setReEvalOpen(null); setHint(''); }}
        footer={<><Btn label="Cancel" variant="ghost" onClick={() => { setReEvalOpen(null); setHint(''); }} /><Btn label="Re-evaluate" variant="primary" onClick={() => reEvalOpen && handleReEval(reEvalOpen)} /></>}
      >
        <p style={{ ...body, marginBottom: sp.m }}>The rule fired but no admissible target was found. Optional: hint what to try differently. Leave blank to retry as-is.</p>
        <div style={{ ...label, marginBottom: sp.xs }}>Optional hint for the rule engine</div>
        <textarea value={hint} onChange={e => setHint(e.target.value)} rows={3} placeholder="Leave blank to retry as-is…" style={{ width: '100%', boxSizing: 'border-box', padding: sp.s, border: '1px solid var(--sapField_BorderColor, #ccc)', borderRadius: '0.25rem', fontSize: 'var(--sapFontSmallSize)', fontFamily: 'var(--sapFontFamily)', resize: 'vertical' }} />
      </Dialog>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CHANGE SUMMARY — KPI comparison table + grouped changes + save
// ═══════════════════════════════════════════════════════════════════════════════
export const ChangeSummaryView: React.FC<{
  packages: RecPackage[];
  saved: boolean; setSaved: (v: boolean) => void;
  onNewSession: () => void;
}> = ({ packages, saved, setSaved, onNewSession }) => {
  const [discardOpen, setDiscardOpen] = useState(false);

  const accepted  = packages.filter(p => p.state === 'accepted');
  const rejected  = packages.filter(p => p.state === 'rejected');
  const discarded = packages.filter(p => p.state === 'discarded' || p.state === 'nosol');
  const totalActions = accepted.reduce((s, p) => s + p.tmActions.length, 0);
  const affectedFOs = new Set(accepted.flatMap(p => p.affectedObjects.filter(o => o.kind === 'FO').map(o => o.id))).size;
  const cancelledFOs = accepted.filter(p => p.title.includes('Cancel')).length;

  const byRule: Record<string, RecPackage[]> = {};
  accepted.forEach(p => { if (!byRule[p.ruleId]) byRule[p.ruleId] = []; byRule[p.ruleId].push(p); });

  if (saved) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, padding: sp.l }}>
        <div style={{ ...card, maxWidth: 480, width: '100%', padding: sp.xl, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: sp.m }}>✓</div>
          <div style={{ fontSize: 'var(--sapFontHeader3Size)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapPositiveColor)', fontFamily: 'var(--sapFontFamily)', marginBottom: sp.m }}>Plan Saved to SAP TM</div>
          <div style={{ ...body, color: 'var(--sapContent_LabelColor)', marginBottom: sp.l }}>Your changes have been successfully committed.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: sp.m, marginBottom: sp.l }}>
            <Kpi value={SESSION_ID} label="Session" />
            <Kpi value="Just now" label="Completed" />
            <Kpi value={String(accepted.length)} label="Changes Committed" />
            <Kpi value={String(totalActions)} label="TM Actions" />
          </div>
          <Btn label="Start a New Session" variant="primary" onClick={onNewSession} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: `${sp.m} ${sp.l}`, borderBottom: '1px solid var(--sapList_BorderColor)', flexWrap: 'wrap', gap: sp.m }}>
        <div>
          <div style={{ fontSize: 'var(--sapFontHeader4Size)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', fontFamily: 'var(--sapFontFamily)', marginBottom: sp.xs }}>Change Summary · SAP - - TM Session 4821 Active</div>
          <div style={{ ...body, color: 'var(--sapContent_LabelColor)' }}>Final review before save. To change a decision, go back to the previous step.</div>
        </div>
        <ObjectStatus state="Information">Active</ObjectStatus>
      </div>

      <div style={{ padding: sp.l }}>
        {/* Summary counters */}
        <div style={{ display: 'flex', gap: sp.l, marginBottom: sp.l, flexWrap: 'wrap' }}>
          <Kpi value={String(accepted.length)} label="Changes" />
          <Kpi value={String(affectedFOs)} label="FOs affected" />
          <Kpi value={String(cancelledFOs)} label="FOs cancelled" />
        </div>

        {/* KPI Comparison */}
        <div style={{ ...card, overflow: 'hidden', marginBottom: sp.l }}>
          <div style={{ padding: `${sp.m} ${sp.m} ${sp.s}`, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
            <div style={{ ...label }}>KPI COMPARISON</div>
            <div style={{ ...body, color: 'var(--sapContent_LabelColor)', fontSize: 12, marginTop: '2px' }}>Each row pairs the same KPI before and after the accepted changes.</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)' }}>
            <thead><tr style={{ background: 'var(--sapList_HeaderBackground)' }}>
              {['KPI', 'Before', 'After'].map(h => <th key={h} style={{ ...label, padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', textAlign: h === 'KPI' ? 'left' : 'right' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {CHANGE_SUMMARY_KPIS.map((kpi, i) => (
                <tr key={i} style={{ background: i % 2 === 1 ? 'var(--sapList_AlternatingBackground)' : 'transparent' }}>
                  <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)' }}>{kpi.label}</td>
                  <td style={{ ...mono, padding: `${sp.s} ${sp.m}`, textAlign: 'right', borderBottom: '1px solid var(--sapList_BorderColor)' }}>{kpi.before}{kpi.unit ? ` ${kpi.unit}` : ''}</td>
                  <td style={{ ...mono, padding: `${sp.s} ${sp.m}`, textAlign: 'right', borderBottom: '1px solid var(--sapList_BorderColor)', color: kpi.improved ? 'var(--sapPositiveColor)' : 'var(--sapTextColor)', fontWeight: kpi.improved ? 'var(--sapFontBoldWeight)' : 'normal' }}>{kpi.after}{kpi.unit ? ` ${kpi.unit}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Accepted Changes grouped by rule */}
        {Object.keys(byRule).length > 0 && (
          <div style={{ marginBottom: sp.l }}>
            <div style={{ ...label, marginBottom: sp.m }}>ACCEPTED CHANGES, GROUPED BY RULE · {Object.keys(byRule).length} rules fired · {totalActions} TM Actions</div>
            {Object.entries(byRule).map(([rId, pkgs]) => (
              <div key={rId} style={{ marginBottom: sp.m }}>
                <div style={{ ...body, fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapBrandColor)', marginBottom: sp.s }}>{pkgs[0].ruleName} <span style={{ ...label, color: 'var(--sapContent_LabelColor)' }}>— {pkgs.length} {pkgs.length === 1 ? 'change' : 'changes'}</span></div>
                {pkgs.map(pkg => (
                  <div key={pkg.id} style={{ ...card, padding: sp.s, marginBottom: sp.s, borderLeft: '3px solid var(--sapPositiveColor)', overflow: 'hidden' }}>
                    <div style={{ ...mono, marginBottom: sp.xs }}>{pkg.id}</div>
                    <div style={body}>{pkg.title}</div>
                    {pkg.kpiComparison.slice(0, 2).map((row, i) => (
                      <div key={i} style={{ ...body, color: 'var(--sapContent_LabelColor)', fontSize: 12 }}>
                        {row.label}: <span style={mono}>{row.before}</span> → <span style={{ ...mono, color: 'var(--sapPositiveColor)' }}>{row.after}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Rejected / Discarded */}
        {(rejected.length > 0 || discarded.length > 0) && (
          <div style={{ marginBottom: sp.l }}>
            <div style={{ ...label, marginBottom: sp.m }}>REJECTED ({rejected.length}) — No TM write · DISCARDED, NO ACTION ({discarded.length})</div>
            {[...rejected, ...discarded].map(pkg => (
              <div key={pkg.id} style={{ ...card, padding: sp.s, marginBottom: sp.s, opacity: 0.7, borderLeft: `3px solid ${pkg.state === 'rejected' ? 'var(--sapNegativeColor)' : 'var(--sapNeutralColor, #ccc)'}`, overflow: 'hidden' }}>
                <span style={mono}>{pkg.id}</span> <span style={{ ...body, color: 'var(--sapContent_LabelColor)' }}>{pkg.title}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: sp.s }}>
          <Btn label="Cancel" variant="ghost" onClick={() => setDiscardOpen(true)} />
          <Btn label="Save to SAP TM" variant="primary" disabled={accepted.length === 0} onClick={() => setSaved(true)} />
        </div>
      </div>

      <Dialog open={discardOpen} title="Discard Planning Session?" onClose={() => setDiscardOpen(false)}
        footer={<><Btn label="Keep Working" variant="primary" onClick={() => setDiscardOpen(false)} /><Btn label="Discard Session" variant="danger" onClick={onNewSession} /></>}
      >
        <p style={body}>All accepted changes will be lost and SAP Transportation Management will remain unchanged.</p>
      </Dialog>
    </div>
  );
};
