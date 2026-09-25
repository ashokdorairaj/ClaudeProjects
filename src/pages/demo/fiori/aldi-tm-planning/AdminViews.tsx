// @ts-nocheck
// AdminViews.tsx — Matches design PDFs exactly
// Admin tabs: System Setup | Rule Form | Rule Library | Rule Profiles

import React, { useState } from 'react';
import { ObjectStatus, Toast, BusyIndicator, MessageStrip } from '@ui5/webcomponents-react';
import { PageHeader, Dialog, Btn, body, label, mono, card, sp } from './index';
import { INITIAL_RULES, INITIAL_PROFILES } from './data';
import type { RuleCandidate, RuleProfile, RuleStage } from './types';

// ─── Status badge ─────────────────────────────────────────────────────────────
const Stage: React.FC<{ stage: RuleStage }> = ({ stage }) => {
  const map: Record<RuleStage, [string, string]> = {
    'draft':                        ['Draft',                          'None'],
    'submitted':                    ['Submitted',                      'Information'],
    'validating':                   ['Validation In Progress',         'Information'],
    'validation-complete':          ['Validation Complete',            'Positive'],
    'validation-complete-warnings': ['Validation Complete w/ Warnings','Critical'],
    'validation-failed':            ['Validation Failed',              'Negative'],
    'published':                    ['Published',                      'Positive'],
    'retired':                      ['Retired',                        'None'],
  };
  const [text, state] = map[stage] ?? [stage, 'None'];
  return <ObjectStatus state={state}>{text}</ObjectStatus>;
};

// ─── RULE FORM ────────────────────────────────────────────────────────────────
export const RuleFormView: React.FC<{ rules: RuleCandidate[]; setRules: (r: RuleCandidate[]) => void }> = ({ rules, setRules }) => {
  const [name, setName] = useState('');
  const [grp, setGrp] = useState('');
  const [type, setType] = useState('');
  const [sop, setSop] = useState('');
  const [ctx, setCtx] = useState('');
  const [example, setExample] = useState('');
  const [clearOpen, setClearOpen] = useState(false);
  const [toast, setToast] = useState('');

  const canDraft  = name && grp && type;
  const canSubmit = canDraft && sop;

  const field = (lbl: string, val: string, set: (v: string) => void, ph: string, required = false) => (
    <div style={{ marginBottom: sp.m }}>
      <div style={{ ...label, marginBottom: sp.xs }}>{lbl}{required && <span style={{ color: 'var(--sapNegativeColor)' }}> *</span>}</div>
      <input value={val} onChange={e => set(e.target.value)} placeholder={ph} style={{ width: '100%', boxSizing: 'border-box', padding: sp.s, border: '1px solid var(--sapField_BorderColor, #ccc)', borderRadius: '0.25rem', fontSize: 'var(--sapFontSize)', fontFamily: 'var(--sapFontFamily)', background: 'var(--sapField_Background)', color: 'var(--sapTextColor)' }} />
    </div>
  );

  const textarea = (lbl: string, val: string, set: (v: string) => void, ph: string, max = 5000, required = false) => (
    <div style={{ marginBottom: sp.m }}>
      <div style={{ ...label, marginBottom: sp.xs }}>{lbl}{required && <span style={{ color: 'var(--sapNegativeColor)' }}> *</span>}</div>
      <textarea value={val} onChange={e => set(e.target.value)} placeholder={ph} maxLength={max} rows={5} style={{ width: '100%', boxSizing: 'border-box', padding: sp.s, border: '1px solid var(--sapField_BorderColor, #ccc)', borderRadius: '0.25rem', fontSize: 'var(--sapFontSize)', fontFamily: 'var(--sapFontFamily)', background: 'var(--sapField_Background)', color: 'var(--sapTextColor)', resize: 'vertical' }} />
      <div style={{ ...label, color: 'var(--sapContent_LabelColor)', textAlign: 'right', marginTop: '2px' }}>{val.length} / {max}</div>
    </div>
  );

  const handleDraft = () => {
    setRules([...rules, { id: `RC-${Date.now()}`, name, group: grp as any, ruleType: type as any, dc: 'BD27', sopDescription: sop, businessContext: ctx, exampleScenario: example, scopeText: '', stage: 'draft', validationChecks: [], assignedProfileIds: [] }]);
    setToast('Draft saved');
  };

  const handleSubmit = () => {
    setRules([...rules, { id: `RC-${Date.now()}`, name, group: grp as any, ruleType: type as any, dc: 'BD27', sopDescription: sop, businessContext: ctx, exampleScenario: example, scopeText: '', stage: 'submitted', validationChecks: [], assignedProfileIds: [] }]);
    setToast('Rule submitted for validation');
  };

  const handleClear = () => { setName(''); setGrp(''); setType(''); setSop(''); setCtx(''); setExample(''); setClearOpen(false); };

  return (
    <div>
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: 'var(--sapInformationBackground)', border: '1px solid var(--sapInformativeColor)', borderRadius: '0.5rem', padding: `${sp.s} ${sp.l}`, ...body, fontWeight: 'var(--sapFontBoldWeight)' }} onClick={() => setToast('')}>{toast} ×</div>}
      <PageHeader title="Rule Form" subtitle="SAP TM-Session-4821 Active" />

      <div style={{ maxWidth: 820, padding: sp.l }}>
        {/* How this works */}
        <div style={{ ...card, padding: sp.m, marginBottom: sp.l, background: 'var(--sapNeutralBackground, #f5f6f7)' }}>
          <div style={{ ...label, marginBottom: sp.s }}>HOW THIS WORKS</div>
          <div style={{ display: 'flex', gap: sp.l }}>
            {['You write the rule', 'System validates it', 'Rule is ready for use'].map((s, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: sp.s }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--sapBrandColor)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                <div style={{ ...body, color: 'var(--sapContent_LabelColor)' }}>{s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Basic Information */}
        <div style={{ ...card, padding: sp.m, marginBottom: sp.m }}>
          <div style={{ ...label, marginBottom: sp.m }}>BASIC INFORMATION</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: sp.m }}>
            {field('Rule name (short)', name, setName, 'e.g. One-stop night store rule', true)}
            {field('Rule group / category', grp, setGrp, 'e.g. Store Rules', true)}
            {field('Rule type', type, setType, 'e.g. Hard Constraint', true)}
          </div>
        </div>

        {/* SOP Description */}
        <div style={{ ...card, padding: sp.m, marginBottom: sp.m }}>
          {textarea('Rule / SOP Description', sop, setSop, 'Paste or type the SOP rule, planning instruction, or business rule in your own words. Include all conditions, exceptions, limits, thresholds, and any other details. e.g. ST-B247 and ST-B263 can be combined during holidays. Do not visit a store more than once in a night shift...', 5000, true)}
        </div>

        {/* Business Context */}
        <div style={{ ...card, padding: sp.m, marginBottom: sp.m }}>
          {textarea('Business Context / Reason & Scope (Optional)', ctx, setCtx, 'Explain the business reason for this rule, when it applies, and any relevant operational context...', 5000)}
        </div>

        {/* Example Scenario */}
        <div style={{ ...card, padding: sp.m, marginBottom: sp.l }}>
          {textarea('Example Scenario & Expected Behavior', example, setExample, 'Describe a concrete example of when this rule fires and what the system should do...', 5000)}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: sp.s }}>
          <Btn label="Clear" variant="ghost" onClick={() => setClearOpen(true)} />
          <Btn label="Save as Draft" variant="secondary" disabled={!canDraft} onClick={handleDraft} />
          <Btn label="Submit for Validation" variant="primary" disabled={!canSubmit} onClick={handleSubmit} />
        </div>
      </div>

      <Dialog open={clearOpen} title="Clear Form?" onClose={() => setClearOpen(false)}
        footer={<><Btn label="Cancel" variant="ghost" onClick={() => setClearOpen(false)} /><Btn label="Clear" variant="danger" onClick={handleClear} /></>}
      >
        <p style={body}>All unsaved content will be removed.</p>
      </Dialog>
    </div>
  );
};

// ─── RULE LIBRARY ─────────────────────────────────────────────────────────────
const LIB_TABS = ['All', 'Draft', 'Validation Errors', 'Validation Complete', 'Validation Complete with Warnings', 'Validation Failed', 'Published', 'Retired'] as const;
type LibTab = typeof LIB_TABS[number];
const LIB_TAB_STAGE: Record<LibTab, RuleStage | null> = {
  'All': null,
  'Draft': 'draft',
  'Validation Errors': 'validation-failed',
  'Validation Complete': 'validation-complete',
  'Validation Complete with Warnings': 'validation-complete-warnings',
  'Validation Failed': 'validation-failed',
  'Published': 'published',
  'Retired': 'retired',
};

export const RuleLibraryView: React.FC<{ rules: RuleCandidate[]; setRules: (r: RuleCandidate[]) => void; profiles: RuleProfile[] }> = ({ rules, setRules, profiles }) => {
  const [tab, setTab] = useState<LibTab>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [publishWarnOpen, setPublishWarnOpen] = useState(false);
  const [toast, setToast] = useState('');

  const stage = LIB_TAB_STAGE[tab];
  const filtered = rules
    .filter(r => stage === null || r.stage === stage)
    .filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()));

  const sel = rules.find(r => r.id === selectedId);
  const upd = (id: string, s: RuleStage) => { setRules(rules.map(r => r.id === id ? { ...r, stage: s } : r)); setToast(`Updated: ${s}`); };

  const tabCount = (t: LibTab) => {
    const s = LIB_TAB_STAGE[t];
    return s ? rules.filter(r => r.stage === s).length : rules.length;
  };

  return (
    <div>
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: 'var(--sapInformationBackground)', border: '1px solid var(--sapInformativeColor)', borderRadius: '0.5rem', padding: `${sp.s} ${sp.l}`, ...body, fontWeight: 'var(--sapFontBoldWeight)' }} onClick={() => setToast('')}>{toast} ×</div>}
      <PageHeader title="Rule Library" subtitle="Manage your rule library, click any rule to view its details" />

      {/* Filter tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--sapList_BorderColor)', paddingLeft: sp.l, overflowX: 'auto', background: 'var(--sapObjectHeader_Background)' }}>
        {LIB_TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: `${sp.s} ${sp.m}`, background: 'transparent', border: 'none', cursor: 'pointer',
            borderBottom: tab === t ? '2px solid var(--sapBrandColor)' : '2px solid transparent',
            color: tab === t ? 'var(--sapBrandColor)' : 'var(--sapTextColor)',
            fontSize: 'var(--sapFontSmallSize)', fontFamily: 'var(--sapFontFamily)', fontWeight: tab === t ? 'var(--sapFontBoldWeight)' : 'normal',
            whiteSpace: 'nowrap',
          }}>{t} ({tabCount(t)})</button>
        ))}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', padding: sp.l, gap: sp.m }}>
        {/* Left: table */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Search */}
          <div style={{ marginBottom: sp.m }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rules…" style={{ width: '100%', boxSizing: 'border-box', padding: sp.s, border: '1px solid var(--sapField_BorderColor, #ccc)', borderRadius: '0.25rem', fontSize: 'var(--sapFontSmallSize)', fontFamily: 'var(--sapFontFamily)', background: 'var(--sapField_Background)' }} />
          </div>

          <div style={{ ...card, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)' }}>
              <thead>
                <tr style={{ background: 'var(--sapList_HeaderBackground, var(--sapBackgroundColor))' }}>
                  {['Rule Name', 'Group', 'Type', 'Profiles', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', ...label }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: sp.l, textAlign: 'center', ...body, color: 'var(--sapContent_LabelColor)', fontStyle: 'italic' }}>No rules found</td></tr>
                )}
                {filtered.map((r, i) => (
                  <tr key={r.id} onClick={() => setSelectedId(r.id)} style={{ cursor: 'pointer', background: selectedId === r.id ? 'var(--sapHighlightBackground, rgba(0,112,242,0.06))' : i % 2 === 1 ? 'var(--sapList_AlternatingBackground, var(--sapBackgroundColor))' : 'transparent' }}>
                    <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', fontWeight: selectedId === r.id ? 'var(--sapFontBoldWeight)' : 'normal', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</td>
                    <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)' }}>{r.group}</td>
                    <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                      <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: r.ruleType === 'hard-constraint' ? 'var(--sapNegativeBackground, #fef5f5)' : 'var(--sapInformativeBackground, #e8f4ff)', color: r.ruleType === 'hard-constraint' ? 'var(--sapNegativeColor)' : 'var(--sapInformativeColor)' }}>
                        {r.ruleType === 'hard-constraint' ? 'Hard Constraint' : 'Preference'}
                      </span>
                    </td>
                    <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)' }}>{r.assignedProfileIds.length}</td>
                    <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)' }}><Stage stage={r.stage} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: detail panel */}
        {sel && (
          <div style={{ width: 360, flexShrink: 0, ...card, padding: sp.m, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp.m }}>
              <div style={{ ...body, fontWeight: 'var(--sapFontBoldWeight)', flex: 1, minWidth: 0 }}>{sel.name}</div>
              <button onClick={() => setSelectedId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sapContent_LabelColor)', fontSize: 16 }}>×</button>
            </div>
            <div style={{ marginBottom: sp.m }}><Stage stage={sel.stage} /></div>

            {sel.sopDescription && <div style={{ marginBottom: sp.m }}><div style={{ ...label, marginBottom: sp.xs }}>SOP DESCRIPTION</div><div style={{ ...body, color: 'var(--sapContent_LabelColor)' }}>{sel.sopDescription}</div></div>}
            {sel.businessContext && <div style={{ marginBottom: sp.m }}><div style={{ ...label, marginBottom: sp.xs }}>BUSINESS CONTEXT</div><div style={{ ...body, color: 'var(--sapContent_LabelColor)' }}>{sel.businessContext}</div></div>}
            {sel.exampleScenario && <div style={{ marginBottom: sp.m }}><div style={{ ...label, marginBottom: sp.xs }}>EXAMPLE SCENARIO</div><div style={{ ...body, color: 'var(--sapContent_LabelColor)' }}>{sel.exampleScenario}</div></div>}
            {sel.scopeText && <div style={{ marginBottom: sp.m }}><div style={{ ...label, marginBottom: sp.xs }}>SCOPE</div><div style={mono}>{sel.scopeText}</div></div>}

            {sel.stage === 'validating' && <BusyIndicator active size="S" text="Checking TM API availability…" style={{ marginBottom: sp.m }} />}

            {/* Validation checks */}
            {sel.validationChecks.length > 0 && (
              <div style={{ marginBottom: sp.m }}>
                <div style={{ ...label, marginBottom: sp.s }}>VALIDATION CHECKS</div>
                {sel.validationChecks.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: sp.s, paddingBottom: sp.xs }}>
                    <span style={{ color: c.status === 'pass' ? 'var(--sapPositiveColor)' : c.status === 'warning' ? 'var(--sapCriticalColor)' : 'var(--sapNegativeColor)' }}>
                      {c.status === 'pass' ? '✓' : c.status === 'warning' ? '⚠' : '✗'}
                    </span>
                    <span style={body}>{c.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons per stage */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: sp.s }}>
              {sel.stage === 'draft' && <>
                <Btn label="Submit for Validation" variant="primary" style={{ width: '100%' }} onClick={() => {
                  upd(sel.id, 'validating');
                  setTimeout(() => upd(sel.id, Math.random() > 0.3 ? 'validation-complete' : 'validation-complete-warnings'), 2000);
                }} />
                <Btn label="Edit Rule" variant="secondary" onClick={() => {}} />
                <Btn label="Delete Draft" variant="danger" onClick={() => setDeleteOpen(true)} />
              </>}
              {sel.stage === 'validation-complete' && <>
                <Btn label="Publish" variant="primary" onClick={() => upd(sel.id, 'published')} />
                <Btn label="Edit (creates draft copy)" variant="secondary" onClick={() => upd(sel.id, 'draft')} />
              </>}
              {sel.stage === 'validation-complete-warnings' && <>
                <Btn label="Publish (with warnings)" variant="primary" onClick={() => setPublishWarnOpen(true)} />
                <Btn label="Edit" variant="secondary" onClick={() => upd(sel.id, 'draft')} />
              </>}
              {sel.stage === 'validation-failed' && <>
                <MessageStrip design="Negative" hideCloseButton style={{ marginBottom: sp.s }}>Validation failed. Edit and resubmit.</MessageStrip>
                <Btn label="Edit Rule" variant="secondary" onClick={() => upd(sel.id, 'draft')} />
                <Btn label="Retry Validation" variant="ghost" onClick={() => { upd(sel.id, 'validating'); setTimeout(() => upd(sel.id, 'validation-complete'), 2000); }} />
              </>}
              {sel.stage === 'published' && <>
                <Btn label="Edit (creates draft copy)" variant="secondary" onClick={() => upd(sel.id, 'draft')} />
                <Btn label="Retire" variant="ghost" onClick={() => upd(sel.id, 'retired')} />
              </>}
              {sel.stage === 'retired' && <Btn label="View (read-only)" variant="ghost" onClick={() => {}} />}
            </div>
          </div>
        )}
      </div>

      <Dialog open={deleteOpen} title="Delete Draft?" onClose={() => setDeleteOpen(false)}
        footer={<><Btn label="Cancel" variant="ghost" onClick={() => setDeleteOpen(false)} /><Btn label="Delete" variant="danger" onClick={() => { setRules(rules.filter(r => r.id !== selectedId)); setSelectedId(null); setDeleteOpen(false); setToast('Draft deleted'); }} /></>}
      >
        <p style={body}>This will permanently remove the draft rule.</p>
      </Dialog>

      <Dialog open={publishWarnOpen} title="Publish with Warnings?" onClose={() => setPublishWarnOpen(false)}
        footer={<><Btn label="Cancel" variant="ghost" onClick={() => setPublishWarnOpen(false)} /><Btn label="Publish" variant="primary" onClick={() => { if (selectedId) upd(selectedId, 'published'); setPublishWarnOpen(false); }} /></>}
      >
        <MessageStrip design="Critical" hideCloseButton style={{ marginBottom: sp.m }}>Some validation checks returned warnings.</MessageStrip>
        <p style={body}>Publish this rule with warnings? It will be available for profile assignment.</p>
      </Dialog>
    </div>
  );
};

// ─── RULE PROFILES ────────────────────────────────────────────────────────────
export const RuleProfilesView: React.FC<{ profiles: RuleProfile[]; setProfiles: (p: RuleProfile[]) => void; rules: RuleCandidate[] }> = ({ profiles, setProfiles, rules }) => {
  const [filter, setFilter] = useState<'All' | 'Draft' | 'Active' | 'Retired'>('All');
  const [selId, setSelId] = useState<string | null>(null);
  const [activateOpen, setActivateOpen] = useState(false);
  const [retireOpen, setRetireOpen] = useState(false);
  const [toast, setToast] = useState('');

  const filtered = profiles.filter(p => filter === 'All' || p.status === filter.toLowerCase());
  const sel = profiles.find(p => p.id === selId);
  const upd = (id: string, changes: Partial<RuleProfile>) => setProfiles(profiles.map(p => p.id === id ? { ...p, ...changes } : p));

  return (
    <div>
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: 'var(--sapInformationBackground)', border: '1px solid var(--sapInformativeColor)', borderRadius: '0.5rem', padding: `${sp.s} ${sp.l}`, ...body, fontWeight: 'var(--sapFontBoldWeight)' }} onClick={() => setToast('')}>{toast} ×</div>}
      <PageHeader
        title="Rule Profiles"
        subtitle="Create and manage reusable rule collections"
        right={<Btn label="Create Rule Profile" variant="primary" onClick={() => {
          const np: RuleProfile = { id: `RP-${Date.now()}`, name: 'New Profile', dc: 'BD27', planningContext: '', effectiveFrom: '2026-07-20', status: 'draft', ruleIds: [], createdAt: '2026-07-20' };
          setProfiles([...profiles, np]); setSelId(np.id); setToast('Draft profile created');
        }} />}
      />

      {/* Filter tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--sapList_BorderColor)', paddingLeft: sp.l, background: 'var(--sapObjectHeader_Background)' }}>
        {(['All', 'Draft', 'Active', 'Retired'] as const).map(f => {
          const count = f === 'All' ? profiles.length : profiles.filter(p => p.status === f.toLowerCase()).length;
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: `${sp.s} ${sp.m}`, background: 'transparent', border: 'none', cursor: 'pointer',
              borderBottom: filter === f ? '2px solid var(--sapBrandColor)' : '2px solid transparent',
              color: filter === f ? 'var(--sapBrandColor)' : 'var(--sapTextColor)',
              fontSize: 'var(--sapFontSmallSize)', fontFamily: 'var(--sapFontFamily)', fontWeight: filter === f ? 'var(--sapFontBoldWeight)' : 'normal',
            }}>{f} ({count})</button>
          );
        })}
      </div>

      <div style={{ padding: sp.l }}>
        <div style={{ ...card, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)' }}>
            <thead>
              <tr style={{ background: 'var(--sapList_HeaderBackground, var(--sapBackgroundColor))' }}>
                {['Profile Name', 'TM Profile', 'Effective Dates', 'Assigned Rules', 'Status', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', ...label }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={{ background: i % 2 === 1 ? 'var(--sapList_AlternatingBackground, var(--sapBackgroundColor))' : 'transparent' }}>
                  <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', fontWeight: 'var(--sapFontBoldWeight)' }}>{p.name}</td>
                  <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', ...mono }}>TM-{p.dc} (LGF-{p.dc})</td>
                  <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', ...mono }}>{p.effectiveFrom} / {p.effectiveTo ?? '—'}</td>
                  <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)' }}>{p.ruleIds.length}</td>
                  <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                    <ObjectStatus state={p.status === 'active' ? 'Positive' : p.status === 'draft' ? 'Information' : 'None'}>{p.status.charAt(0).toUpperCase() + p.status.slice(1)}</ObjectStatus>
                  </td>
                  <td style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                    <div style={{ display: 'flex', gap: sp.s }}>
                      {p.status === 'draft' && <><Btn label="Activate" variant="primary" onClick={() => { setSelId(p.id); setActivateOpen(true); }} /><Btn label="Edit" variant="secondary" onClick={() => setSelId(p.id)} /></>}
                      {p.status === 'active' && <><Btn label="View" variant="secondary" onClick={() => setSelId(p.id)} /><Btn label="Retire" variant="ghost" onClick={() => { setSelId(p.id); setRetireOpen(true); }} /></>}
                      {p.status === 'retired' && <Btn label="View" variant="ghost" onClick={() => setSelId(p.id)} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail side panel when profile selected */}
        {sel && (
          <div style={{ ...card, padding: sp.m, marginTop: sp.m }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp.m }}>
              <div style={{ ...body, fontWeight: 'var(--sapFontBoldWeight)' }}>{sel.name}</div>
              <button onClick={() => setSelId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sapContent_LabelColor)', fontSize: 16 }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: sp.m, marginBottom: sp.m }}>
              <div><div style={{ ...label, marginBottom: sp.xs }}>DC</div><div style={body}>{sel.dc}</div></div>
              <div><div style={{ ...label, marginBottom: sp.xs }}>EFFECTIVE PERIOD</div><div style={mono}>{sel.effectiveFrom} — {sel.effectiveTo ?? 'open'}</div></div>
              <div><div style={{ ...label, marginBottom: sp.xs }}>RULES ASSIGNED</div><div style={body}>{sel.ruleIds.length}</div></div>
            </div>
            <div>
              <div style={{ ...label, marginBottom: sp.s }}>ASSIGNED RULES</div>
              {sel.ruleIds.length === 0 ? <div style={{ ...body, color: 'var(--sapContent_LabelColor)', fontStyle: 'italic' }}>No rules assigned</div> : sel.ruleIds.map((rId, i) => {
                const r = rules.find(ru => ru.id === rId);
                return <div key={rId} style={{ display: 'flex', alignItems: 'center', gap: sp.s, padding: `${sp.xs} 0`, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                  <span style={{ ...mono, color: 'var(--sapContent_LabelColor)', minWidth: 24 }}>{String(i + 1).padStart(2, '0')}.</span>
                  <span style={body}>{r?.name ?? rId}</span>
                  {sel.status === 'draft' && <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sapNegativeColor)' }} onClick={() => upd(sel.id, { ruleIds: sel.ruleIds.filter(id => id !== rId) })}>×</button>}
                </div>;
              })}
            </div>
          </div>
        )}
      </div>

      <Dialog open={activateOpen} title="Activate Profile?" onClose={() => setActivateOpen(false)}
        footer={<><Btn label="Cancel" variant="ghost" onClick={() => setActivateOpen(false)} /><Btn label="Activate" variant="primary" onClick={() => { if (selId) { upd(selId, { status: 'active', activatedAt: '2026-07-20' }); setToast('Profile activated'); } setActivateOpen(false); }} /></>}
      >
        <p style={body}>Activate "{sel?.name}"? It will become available for planners immediately.</p>
      </Dialog>

      <Dialog open={retireOpen} title="Retire Profile?" onClose={() => setRetireOpen(false)}
        footer={<><Btn label="Cancel" variant="ghost" onClick={() => setRetireOpen(false)} /><Btn label="Retire" variant="danger" onClick={() => { if (selId) { upd(selId, { status: 'retired', retiredAt: '2026-07-20' }); setToast('Profile retired'); } setRetireOpen(false); }} /></>}
      >
        <p style={body}>Retire "{sel?.name}"? It will be removed from planner selection.</p>
      </Dialog>
    </div>
  );
};

// ─── SYSTEM SETUP ─────────────────────────────────────────────────────────────
export const SystemSetupView: React.FC<{ active: boolean; setActive: (v: boolean) => void }> = ({ active, setActive }) => {
  const [endpoint, setEndpoint] = useState('https://tm/aldi-de.sap.corp/api/v2');
  const [auth, setAuth] = useState('OAuth 2.0');
  const [lbl, setLbl] = useState('aldi-tm-refinement-app');
  const [connStatus, setConnStatus] = useState<'not-configured' | 'testing' | 'connected'>(active ? 'connected' : 'not-configured');
  const [toast, setToast] = useState('');

  const handleTest = () => {
    setConnStatus('testing');
    setTimeout(() => { setConnStatus('connected'); setToast('Connection verified'); }, 1800);
  };

  return (
    <div>
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: 'var(--sapSuccessBackground)', border: '1px solid var(--sapPositiveColor)', borderRadius: '0.5rem', padding: `${sp.s} ${sp.l}`, ...body, fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapPositiveColor)' }} onClick={() => setToast('')}>{toast} ×</div>}
      <PageHeader title="System Setup" subtitle="Configure TM connection and activate system setup" />

      <div style={{ maxWidth: 680, padding: sp.l }}>
        {active && <MessageStrip design="Positive" hideCloseButton style={{ marginBottom: sp.l }}>System setup is active. Planners can create refinement sessions.</MessageStrip>}

        <div style={{ ...card, padding: sp.m, marginBottom: sp.m }}>
          <div style={{ ...label, marginBottom: sp.m }}>ENDPOINT & AUTHENTICATION</div>
          <div style={{ ...body, color: 'var(--sapContent_LabelColor)', marginBottom: sp.m }}>Configure the SAP TM on-premise connection via SAP Cloud Connector.</div>

          {[
            { lbl: 'TM Endpoint', val: endpoint, set: setEndpoint },
            { lbl: 'Auth Method', val: auth, set: setAuth },
            { lbl: 'Label', val: lbl, set: setLbl },
          ].map(f => (
            <div key={f.lbl} style={{ marginBottom: sp.m }}>
              <div style={{ ...label, marginBottom: sp.xs }}>{f.lbl}</div>
              <input value={f.val} onChange={e => f.set(e.target.value)} readOnly={active} style={{ width: '100%', boxSizing: 'border-box', padding: sp.s, border: '1px solid var(--sapField_BorderColor, #ccc)', borderRadius: '0.25rem', fontSize: 'var(--sapFontSmallSize)', fontFamily: 'var(--sapFontFamily)', background: active ? 'var(--sapField_ReadOnly_Background, #f5f5f5)' : 'var(--sapField_Background)', color: 'var(--sapTextColor)' }} />
            </div>
          ))}

          <div style={{ display: 'flex', alignItems: 'center', gap: sp.m }}>
            <div style={{ ...label }}>CONNECTION STATUS:</div>
            <ObjectStatus state={connStatus === 'connected' ? 'Positive' : connStatus === 'testing' ? 'Information' : 'None'}>
              {connStatus === 'not-configured' ? 'Not configured' : connStatus === 'testing' ? 'Testing…' : 'Connected'}
            </ObjectStatus>
            {connStatus === 'testing' && <BusyIndicator active size="XS" />}
          </div>
        </div>

        <div style={{ display: 'flex', gap: sp.s }}>
          {!active && <Btn label="Test Connection" variant="secondary" disabled={connStatus === 'testing'} onClick={handleTest} />}
          {connStatus === 'connected' && !active && <Btn label="Activate Setup" variant="primary" onClick={() => { setActive(true); setToast('System setup activated'); }} />}
          {active && <><Btn label="Re-test Connection" variant="secondary" onClick={handleTest} /><Btn label="Edit" variant="ghost" onClick={() => setActive(false)} /></>}
        </div>
      </div>
    </div>
  );
};
