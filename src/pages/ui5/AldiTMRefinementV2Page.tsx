// AldiTMRefinementV2Page.tsx
// Root component: login, shell, nav, routing.
// Admin section: Rule Creation, Validation Queue, Rule Library, Rule Profiles, System Setup.
// Planner section: 5 planner views (imported from V2Planner).

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Title, Text, Tag, Button, Icon, ObjectStatus, MessageStrip, Toast,
  TextArea, Label, FlexBox, BusyIndicator, Select, Option, Input,
  ShellBar, ShellBarItem, Avatar, Panel, Form, FormGroup, FormItem, CheckBox,
  Card, CardHeader, SegmentedButton, SegmentedButtonItem,
  List, ListItemCustom, IllustratedMessage,
} from '@ui5/webcomponents-react';

import { SideNavigation } from '../../components/organisms/SideNavigation';
import type { NavItem } from '../../components/organisms/SideNavigation';

import {
  sp, cardSurface, labelText, bodyText, sectionTitle, PageTitle,
  LoginScreen, MOCK_USERS, SESSION_ID, TM_PROFILE,
  INITIAL_CANDIDATES_V2, INITIAL_PROFILES_V2,
  STAGE_LABEL_V2, stageStatusState, validationStatusState, VALIDATION_STATUS_LABEL,
  RULE_TYPE_LABEL, RULE_TYPE_COLOR, PROFILE_STATUS_LABEL, profileStatusState,
  type AppRole, type AuthState, type SetupStatus,
  type RuleCandidateV2, type RuleProfileV2, type PipelineStageV2,
  type ValidationStatusV2, type RuleTypeV2, type ProfileStatusV2,
} from './AldiTMRefinementV2Shared';

import {
  View1SessionStart, View2Overview, View3RuleEvaluation,
  View3RecommendationReview, View4Changes,
} from './AldiTMRefinementV2Planner';

// ─── Planner nav ──────────────────────────────────────────────────────────────
type PlannerView = 'session-start' | 'overview' | 'rule-evaluation' | 'review' | 'changes';
const PLANNER_STEPS: { key: PlannerView; label: string; icon: string }[] = [
  { key: 'session-start',   label: '1. Session Start',    icon: 'initiative' },
  { key: 'overview',        label: '2. Planning Overview', icon: 'overview-chart' },
  { key: 'rule-evaluation', label: '3. Rule Evaluation',   icon: 'task' },
  { key: 'review',          label: '4. Proposal Review',   icon: 'inspect' },
  { key: 'changes',         label: '5. Change Summary',    icon: 'save' },
];
const STEP_ORDER = PLANNER_STEPS.map(s => s.key);

// ─── Admin section tab keys ───────────────────────────────────────────────────
type AdminTab = 'rule-creation' | 'rule-library' | 'rule-profiles' | 'system-setup';

// ─── Admin left sidebar — Figma design: System Setup / Rule Maintenance / Rule Profiles ───
const RuleMaintenanceSidebar: React.FC<{ active: AdminTab; onSelect: (t: AdminTab) => void; libraryCount: number; role: AppRole }> = ({ active, onSelect }) => {
  const [rmExpanded, setRmExpanded] = useState(true);

  const itemStyle = (key: AdminTab): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: sp.s,
    padding: `${sp.s} ${sp.m}`,
    paddingLeft: '2.5rem',
    cursor: 'pointer',
    background: active === key ? 'var(--sapList_SelectionBackgroundColor,#e8f4ff)' : 'transparent',
    borderLeft: `3px solid ${active === key ? 'var(--sapSelectedColor,#0070f2)' : 'transparent'}`,
    fontFamily: 'var(--sapFontFamily)',
    fontSize: 'var(--sapFontSize)',
    color: active === key ? 'var(--sapSelectedColor,#0070f2)' : 'var(--sapTextColor)',
    fontWeight: active === key ? 600 : 400,
    border: 'none',
    width: '100%',
    textAlign: 'left',
  });

  const groupItemStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: sp.s,
    padding: `${sp.s} ${sp.m}`,
    cursor: 'pointer',
    background: 'transparent',
    fontFamily: 'var(--sapFontFamily)',
    fontSize: 'var(--sapFontSize)',
    color: 'var(--sapTextColor)',
    fontWeight: 600,
    border: 'none',
    width: '100%',
    textAlign: 'left',
  };

  return (
    <div style={{ width: 224, flexShrink: 0, borderRight: '1px solid var(--sapList_BorderColor)', height: '100%', background: 'var(--sapBaseColor,#fff)', display: 'flex', flexDirection: 'column' }}>
      {/* System Setup */}
      <button style={active === 'system-setup' ? { ...groupItemStyle, background: 'var(--sapList_SelectionBackgroundColor,#e8f4ff)', borderLeft: `3px solid var(--sapSelectedColor,#0070f2)`, color: 'var(--sapSelectedColor,#0070f2)' } : groupItemStyle}
        onClick={() => onSelect('system-setup')}>
        <Icon name="action-settings" />
        <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', fontWeight: 600, color: 'inherit' }}>System Setup</Text>
        <Icon name="navigation-right-arrow" style={{ marginLeft: 'auto', fontSize: 10 }} />
      </button>

      {/* Rule Maintenance group */}
      <button style={groupItemStyle} onClick={() => setRmExpanded(v => !v)}>
        <Icon name="official-service" />
        <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', fontWeight: 600 }}>Rule Maintenance</Text>
        <Icon name={rmExpanded ? 'navigation-down-arrow' : 'navigation-right-arrow'} style={{ marginLeft: 'auto', fontSize: 10 }} />
      </button>
      {rmExpanded && (
        <>
          <button style={itemStyle('rule-creation')} onClick={() => onSelect('rule-creation')}>
            <Icon name="edit" />
            <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', color: 'inherit' }}>Rule Form</Text>
          </button>
          <button style={itemStyle('rule-library')} onClick={() => onSelect('rule-library')}>
            <Icon name="table-chart" />
            <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', color: 'inherit' }}>Rule Library</Text>
          </button>
        </>
      )}

      {/* Rule Profiles */}
      <button style={active === 'rule-profiles' ? { ...groupItemStyle, background: 'var(--sapList_SelectionBackgroundColor,#e8f4ff)', borderLeft: `3px solid var(--sapSelectedColor,#0070f2)`, color: 'var(--sapSelectedColor,#0070f2)' } : groupItemStyle}
        onClick={() => onSelect('rule-profiles')}>
        <Icon name="group" />
        <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', fontWeight: 600, color: 'inherit' }}>Rule Profiles</Text>
        <Icon name="navigation-right-arrow" style={{ marginLeft: 'auto', fontSize: 10 }} />
      </button>
    </div>
  );
};

// ─── Rule Creation ────────────────────────────────────────────────────────────
const RuleCreationTab: React.FC<{
  candidates: RuleCandidateV2[];
  initialSelectedId?: string | null;
  onSaveDraft: (draft: RuleCandidateV2) => void;
  onSubmit: (draft: RuleCandidateV2) => void;
}> = ({ candidates, initialSelectedId, onSaveDraft, onSubmit }) => {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null);

  // Form state
  const [name, setName]             = useState('');
  const [group, setGroup]           = useState('Store Rules');
  const [ruleType, setRuleType]     = useState<RuleTypeV2>('hard-constraint');
  const [sopDesc, setSopDesc]       = useState('');
  const [bizContext, setBizContext] = useState('');
  const [example, setExample]       = useState('');
  const [scopeText, setScopeText]   = useState('');
  const [docs, setDocs]             = useState<string[]>([]);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Auto-load rule when initialSelectedId is provided (e.g. from Library Revise/View)
  useEffect(() => {
    if (initialSelectedId) {
      const rule = candidates.find(c => c.id === initialSelectedId);
      if (rule) loadRule(rule);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSelectedId]);

  const canSaveDraft = name.trim().length > 0 && group.length > 0;
  const canSubmit    = canSaveDraft && sopDesc.trim().length > 0 && example.trim().length > 0;

  const loadRule = (c: RuleCandidateV2) => {
    setSelectedId(c.id);
    setName(c.name); setGroup(c.group); setRuleType(c.ruleType);
    setSopDesc(c.sopDescription); setBizContext(c.businessContext);
    setExample(c.exampleScenario); setScopeText(c.scopeText); setDocs(c.attachedDocs);
  };

  const handleNew = () => {
    setSelectedId(null);
    setName(''); setGroup('Store Rules'); setRuleType('hard-constraint');
    setSopDesc(''); setBizContext(''); setExample(''); setScopeText(''); setDocs([]);
    setSubmitAttempted(false);
  };

  const buildRecord = (): RuleCandidateV2 => ({
    id: selectedId ?? `RC-${200 + candidates.length}`,
    name, group, ruleType,
    sopDescription: sopDesc, businessContext: bizContext,
    exampleScenario: example, scopeText, attachedDocs: docs,
    stage: 'draft', validationStatus: 'pending',
    tmDataCheck: 'pending', apiActionCheck: 'pending',
    assignedProfileIds: [], sourceDoc: 'BD27',
  });

  const selected = selectedId ? candidates.find(c => c.id === selectedId) ?? null : null;
  const formEditable = !selected || selected.stage === 'draft';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Form header ────────────────────────────────────────────────── */}
      <div style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', background: 'var(--sapObjectHeader_Background,#fff)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <Title level="H5">
            {selected ? (formEditable ? `Edit Rule — ${selected.id}` : selected.id) : 'New Rule'}
          </Title>
          {selected && <Text style={{ ...labelText, display: 'block', marginTop: '2px' }}>{STAGE_LABEL_V2[selected.stage]}</Text>}
        </div>
        <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
          {selected && <Tag colorScheme={RULE_TYPE_COLOR[selected.ruleType]}>{RULE_TYPE_LABEL[selected.ruleType]}</Tag>}
          {selected && <ObjectStatus state={stageStatusState(selected.stage)}>{STAGE_LABEL_V2[selected.stage]}</ObjectStatus>}
          <Button design="Default" icon="add" onClick={handleNew}>Create Rule</Button>
        </FlexBox>
      </div>

      {/* ── Scrollable form body ────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: sp.m }}>

        {/* Read-only banner */}
        {selected && !formEditable && (
          <MessageStrip design="Information" hideCloseButton style={{ marginBottom: sp.m }}>
            This rule has been submitted and is read-only. Review validation results and publish from the Rule Library.
          </MessageStrip>
        )}

        {/* Basic information */}
        <div style={{ ...cardSurface, padding: sp.m, marginBottom: sp.m, maxWidth: 800 }}>
          <Text style={{ ...sectionTitle, display: 'block', marginBottom: sp.s }}>Basic Information</Text>
          <Form>
            <FormGroup>
              <FormItem labelContent={<Label required>Rule Name</Label>}>
                <Input
                  readonly={!formEditable}
                  value={name}
                  valueState={submitAttempted && !name.trim() ? 'Negative' : 'None'}
                  valueStateMessage={<span>Rule Name is required</span>}
                  onInput={e => formEditable && setName((e.target as HTMLInputElement).value)}
                  placeholder="e.g. One-stop night store rule"
                  style={{ width: '100%' }}
                />
              </FormItem>
              <FormItem labelContent={<Label required>Rule Group / Category</Label>}>
                <Select
                  style={{ width: '100%' }}
                  disabled={!formEditable}
                  onChange={e => { const v = (e.detail as any).selectedOption?.value; if (v && formEditable) setGroup(v); }}
                >
                  {['Store Rules', 'Resource Rules', 'Planning Execution', 'Vehicle Rules', 'Time Rules'].map(o => (
                    <Option key={o} value={o} selected={group === o}>{o}</Option>
                  ))}
                </Select>
              </FormItem>
              <FormItem labelContent={<Label required>Rule Type</Label>}>
                <Select
                  style={{ width: '100%' }}
                  disabled={!formEditable}
                  onChange={e => { const v = (e.detail as any).selectedOption?.value; if ((v === 'hard-constraint' || v === 'preference') && formEditable) setRuleType(v); }}
                >
                  <Option value="hard-constraint" selected={ruleType === 'hard-constraint'}>Hard Constraint</Option>
                  <Option value="preference" selected={ruleType === 'preference'}>Preference</Option>
                </Select>
              </FormItem>
            </FormGroup>
          </Form>
        </div>

        {/* SOP sections */}
        <Panel headerText="1. Rule / SOP Description *" accessibleRole="Region" collapsed={!sopDesc} style={{ marginBottom: sp.s, maxWidth: 800 }}>
          <FlexBox direction="Column" style={{ gap: sp.s, padding: sp.s }}>
            <Label>Paste or type the SOP rule in your own words. Required.</Label>
            <TextArea
              readonly={!formEditable}
              rows={6} maxlength={5000} value={sopDesc}
              valueState={submitAttempted && !sopDesc.trim() ? 'Negative' : 'None'}
              onInput={e => formEditable && setSopDesc((e.target as HTMLTextAreaElement).value)}
              placeholder="e.g. Stores ST-B247 and ST-B263 can only be visited once per night shift..."
              style={{ width: '100%' }}
            />
          </FlexBox>
        </Panel>

        <Panel headerText="2. Business Context, Reason & Scope (optional)" accessibleRole="Region" collapsed={!bizContext} style={{ marginBottom: sp.s, maxWidth: 800 }}>
          <FlexBox direction="Column" style={{ gap: sp.s, padding: sp.s }}>
            <Label>Why does this rule exist, where does it apply, and any exceptions. Include DC, shift type, FO type, or corridor if relevant.</Label>
            <TextArea
              readonly={!formEditable}
              rows={5} maxlength={3000} value={bizContext}
              onInput={e => formEditable && setBizContext((e.target as HTMLTextAreaElement).value)}
              placeholder="e.g. Night-shift dispatch capacity cannot accommodate multiple arrivals at one-stop stores..."
              style={{ width: '100%' }}
            />
          </FlexBox>
        </Panel>

        <Panel headerText="3. Example Scenario & Expected Behavior *" accessibleRole="Region" collapsed={!example} style={{ marginBottom: sp.s, maxWidth: 800 }}>
          <FlexBox direction="Column" style={{ gap: sp.s, padding: sp.s }}>
            <Label>Provide a concrete example. Required before submitting.</Label>
            <TextArea
              readonly={!formEditable}
              rows={5} maxlength={3000} value={example}
              valueState={submitAttempted && !example.trim() ? 'Negative' : 'None'}
              onInput={e => formEditable && setExample((e.target as HTMLTextAreaElement).value)}
              placeholder="e.g. If FO-001 visits ST-B247 and ST-B263 on a non-holiday → flag violation."
              style={{ width: '100%' }}
            />
          </FlexBox>
        </Panel>

        <Panel headerText="4. Supporting Documents (optional)" accessibleRole="Region" collapsed={docs.length === 0} style={{ marginBottom: sp.s, maxWidth: 800 }}>
          <FlexBox direction="Column" style={{ gap: sp.s, padding: sp.s }}>
            {docs.map((d, i) => (
              <FlexBox key={i} alignItems="Center" style={{ gap: sp.xs }}>
                <Icon name="document" />
                <Text style={labelText}>{d}</Text>
              </FlexBox>
            ))}
            {formEditable && docs.length < 5 && (
              <Button design="Transparent" icon="add" onClick={() => setDocs(prev => [...prev, `attachment-${prev.length + 1}.pdf`])}>
                Add document
              </Button>
            )}
            {formEditable && docs.length >= 5 && (
              <Text style={{ ...labelText, fontStyle: 'italic' }}>Maximum 5 files reached.</Text>
            )}
            <Text style={{ ...labelText, marginTop: sp.xs }}>Max 5 files · 25 MB per file</Text>
          </FlexBox>
        </Panel>

      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      {formEditable && (
        <div style={{ borderTop: '1px solid var(--sapList_BorderColor)', padding: `${sp.s} ${sp.m}`, background: 'var(--sapObjectHeader_Background,#fff)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: sp.s, flexWrap: 'wrap', flexShrink: 0 }}>
          <Text style={labelText}>
            {canSubmit
              ? 'Ready to submit for validation'
              : `Required: Rule Name, Group, Type${!sopDesc.trim() ? ', SOP Description' : ''}${!example.trim() ? ', Example Scenario' : ''}`}
          </Text>
          <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
            <Button design="Transparent" icon="reset" onClick={handleNew}>Clear</Button>
            <Button design="Default" icon="save" disabled={!canSaveDraft} onClick={() => onSaveDraft(buildRecord())}>Save Draft</Button>
            <Button design="Emphasized" icon="paper-plane" onClick={() => { setSubmitAttempted(true); if (canSubmit) onSubmit(buildRecord()); }}>Submit for Validation</Button>
          </FlexBox>
        </div>
      )}

    </div>
  );
};

// ─── Rule Library ─────────────────────────────────────────────────────────────
type LibraryFilter = 'all' | 'draft' | 'validating' | 'validation-complete' | 'validation-complete-warnings' | 'validation-failed' | 'approved' | 'retired';

// Row status display — colored text matching Figma
const rowStatusDisplay = (c: RuleCandidateV2, isValidatingNow: boolean): { label: string; color: string } => {
  if (isValidatingNow || c.stage === 'submitted' || c.stage === 'validating')
    return { label: 'Draft — Validation In Progress…', color: 'var(--sapInformativeColor,#0064d9)' };
  if (c.stage === 'draft') return { label: 'Draft', color: 'var(--sapContent_LabelColor)' };
  if (c.stage === 'validation-complete') return { label: 'Validation Complete', color: 'var(--sapInformativeColor,#0064d9)' };
  if (c.stage === 'validation-complete-warnings') return { label: 'Validation Complete with Warnings', color: 'var(--sapCriticalColor,#df6e0c)' };
  if (c.stage === 'validation-failed') return { label: 'Validation Failed', color: 'var(--sapNegativeColor,#bb0000)' };
  if (c.stage === 'approved') return { label: 'Published', color: 'var(--sapPositiveColor,#188918)' };
  if (c.stage === 'retired') return { label: 'Retired', color: 'var(--sapContent_LabelColor)' };
  return { label: c.stage, color: 'var(--sapContent_LabelColor)' };
};

const RuleLibraryTab: React.FC<{
  candidates: RuleCandidateV2[];
  profiles: RuleProfileV2[];
  onPublish: (id: string) => void;
  onRetire: (id: string) => void;
  onDelete: (id: string) => void;
  onAssignProfile: (ruleId: string, profileId: string, assign: boolean) => void;
  onEditRule: (id: string) => void;
  onViewRule: (id: string) => void;
  onRetryValidation: (id: string) => void;
  validatingIds: Set<string>;
  retireBlockedId: string | null;
  onClearRetireBlock: () => void;
  assigningId: string | null;
  onSetAssigningId: (id: string | null) => void;
}> = ({ candidates, profiles, onPublish, onRetire, onDelete, onAssignProfile, onEditRule, onViewRule, onRetryValidation, validatingIds, retireBlockedId, onClearRetireBlock, assigningId, onSetAssigningId }) => {
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (m: string) => { setToastMessage(m); setToastOpen(true); };

  const library = candidates.filter(c => c.stage !== 'discarded');

  const filteredLibrary = filter === 'all' ? library
    : filter === 'validating' ? library.filter(c => c.stage === 'submitted' || c.stage === 'validating')
    : filter === 'validation-complete' ? library.filter(c => c.stage === 'validation-complete')
    : filter === 'validation-complete-warnings' ? library.filter(c => c.stage === 'validation-complete-warnings')
    : filter === 'approved' ? library.filter(c => c.stage === 'approved')
    : library.filter(c => c.stage === filter);

  const counts = {
    all: library.length,
    draft: library.filter(c => c.stage === 'draft').length,
    validating: library.filter(c => c.stage === 'submitted' || c.stage === 'validating').length,
    'validation-complete': library.filter(c => c.stage === 'validation-complete').length,
    'validation-complete-warnings': library.filter(c => c.stage === 'validation-complete-warnings').length,
    'validation-failed': library.filter(c => c.stage === 'validation-failed').length,
    approved: library.filter(c => c.stage === 'approved').length,
    retired: library.filter(c => c.stage === 'retired').length,
  };

  const filterTabs: { key: LibraryFilter; label: string }[] = [
    { key: 'all',                          label: `All (${counts.all})` },
    { key: 'draft',                        label: `Draft (${counts.draft})` },
    { key: 'validating',                   label: `Validation In Progress (${counts.validating})` },
    { key: 'validation-complete',          label: `Validation Complete (${counts['validation-complete']})` },
    { key: 'validation-complete-warnings', label: `Validation Complete with Warnings (${counts['validation-complete-warnings']})` },
    { key: 'validation-failed',            label: `Validation Failed (${counts['validation-failed']})` },
    { key: 'approved',                     label: `Published (${counts.approved})` },
    { key: 'retired',                      label: `Retired (${counts.retired})` },
  ];

  const apiCheckState = (r: 'pass' | 'warning' | 'fail' | 'pending') =>
    r === 'pass' ? 'Positive' : r === 'warning' ? 'Critical' : r === 'fail' ? 'Negative' : 'None';
  const apiCheckLabel = (r: 'pass' | 'warning' | 'fail' | 'pending') =>
    r === 'pass' ? 'Available' : r === 'warning' ? 'Partial' : r === 'fail' ? 'Not Available' : 'Pending';

  const selectedRule = selectedRowId ? library.find(c => c.id === selectedRowId) ?? null : null;

  const handleRowClick = (id: string) => setSelectedRowId(prev => prev === id ? null : id);

  // Detail panel content by stage
  const renderDetail = (c: RuleCandidateV2) => {
    const assignedProfiles = profiles.filter(p => c.assignedProfileIds.includes(p.id));
    const isValidatingNow = validatingIds.has(c.id);

    const infoRow = (label: string, value: React.ReactNode) => (
      <FlexBox alignItems="Center" style={{ gap: sp.m, padding: `${sp.xs} 0`, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
        <Text style={{ ...labelText, minWidth: 120 }}>{label}</Text>
        <div>{value}</div>
      </FlexBox>
    );

    switch (c.stage) {
      case 'draft':
        return (
          <FlexBox direction="Column" style={{ gap: sp.s }}>
            {infoRow('Name', <Text style={{ fontWeight: 600 }}>{c.name}</Text>)}
            {infoRow('Group', <Text style={bodyText}>{c.group}</Text>)}
            {infoRow('Type', <Tag colorScheme={RULE_TYPE_COLOR[c.ruleType]}>{RULE_TYPE_LABEL[c.ruleType]}</Tag>)}
            {c.sopDescription && <div style={{ marginTop: sp.s }}><Text style={{ ...labelText, fontWeight: 700, display: 'block', marginBottom: sp.xs }}>SOP Description</Text><Text style={bodyText}>{c.sopDescription}</Text></div>}
            <FlexBox style={{ gap: sp.xs, marginTop: sp.s }}>
              <Button design="Default" icon="edit" onClick={() => { onEditRule(c.id); showToast(`Opening ${c.id} for editing`); }}>Edit</Button>
              <Button design="Negative" icon="delete" onClick={() => { onDelete(c.id); setSelectedRowId(null); showToast(`Rule ${c.id} deleted`); }}>Delete</Button>
            </FlexBox>
          </FlexBox>
        );

      case 'submitted':
      case 'validating':
        return (
          <FlexBox direction="Column" style={{ gap: sp.m }}>
            {infoRow('Name', <Text style={{ fontWeight: 600 }}>{c.name}</Text>)}
            {infoRow('Group', <Text style={bodyText}>{c.group}</Text>)}
            <FlexBox alignItems="Center" style={{ gap: sp.m, padding: `${sp.s} 0` }}>
              <BusyIndicator active size="S" />
              <FlexBox direction="Column" style={{ gap: 2 }}>
                <Text style={{ fontWeight: 'var(--sapFontSemiBoldWeight,600)' }}>Validation in progress</Text>
                <Text style={labelText}>Checking TM API availability — this usually takes 30–60 seconds.</Text>
              </FlexBox>
            </FlexBox>
          </FlexBox>
        );

      case 'validation-complete':
      case 'validation-complete-warnings':
      case 'validation-failed':
        return (
          <FlexBox direction="Column" style={{ gap: sp.s }}>
            {infoRow('Name', <Text style={{ fontWeight: 600 }}>{c.name}</Text>)}
            {infoRow('Group', <Text style={bodyText}>{c.group}</Text>)}
            {infoRow('Type', <Tag colorScheme={RULE_TYPE_COLOR[c.ruleType]}>{RULE_TYPE_LABEL[c.ruleType]}</Tag>)}
            <div style={{ marginTop: sp.xs, padding: `${sp.s} 0`, borderTop: '1px solid var(--sapList_BorderColor)', borderBottom: '1px solid var(--sapList_BorderColor)' }}>
              <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ marginBottom: sp.s }}>
                <Label>TM Data/API Action Availability</Label>
                <ObjectStatus state={apiCheckState(c.apiActionCheck)}>{apiCheckLabel(c.apiActionCheck)}</ObjectStatus>
              </FlexBox>
              <FlexBox alignItems="Center" justifyContent="SpaceBetween">
                <Label style={{ fontWeight: 'var(--sapFontBoldWeight,700)' }}>Validation Result</Label>
                <ObjectStatus state={validationStatusState(c.validationStatus)} large>{VALIDATION_STATUS_LABEL[c.validationStatus]}</ObjectStatus>
              </FlexBox>
            </div>
            {c.stage === 'validation-complete-warnings' && <MessageStrip design="Warning" hideCloseButton>Warnings found — some API or action availability is partial. Rule can still be published.</MessageStrip>}
            {c.stage === 'validation-failed' && <MessageStrip design="Negative" hideCloseButton>Validation failed — required TM APIs could not be confirmed. Edit the rule and retry.</MessageStrip>}
            {(c.stage === 'validation-complete' || c.stage === 'validation-complete-warnings') && !isValidatingNow && <MessageStrip design="Positive" hideCloseButton>Validation complete — rule is ready to publish.</MessageStrip>}
            <FlexBox style={{ gap: sp.xs, marginTop: sp.xs }}>
              {(c.stage === 'validation-complete' || c.stage === 'validation-complete-warnings') && <Button design="Default" icon="accept" onClick={() => { onPublish(c.id); setSelectedRowId(null); showToast(`Rule ${c.id} published`); }}>Publish</Button>}
              {c.stage === 'validation-failed' && <Button design="Attention" icon="refresh" onClick={() => { onRetryValidation(c.id); showToast(`Validation re-queued for ${c.id}`); }}>Retry Validation</Button>}
              <Button design="Default" icon="edit" onClick={() => { onEditRule(c.id); showToast(`Draft copy created from ${c.id}`); }}>Edit</Button>
            </FlexBox>
          </FlexBox>
        );

      case 'approved':
        return (
          <FlexBox direction="Column" style={{ gap: sp.s }}>
            {infoRow('Name', <Text style={{ fontWeight: 600 }}>{c.name}</Text>)}
            {infoRow('Group', <Text style={bodyText}>{c.group}</Text>)}
            {infoRow('Type', <Tag colorScheme={RULE_TYPE_COLOR[c.ruleType]}>{RULE_TYPE_LABEL[c.ruleType]}</Tag>)}
            {infoRow('Profiles', assignedProfiles.length === 0 ? <Text style={labelText}>None assigned</Text> : <Text style={labelText}>{assignedProfiles.map(p => p.name).join(', ')}</Text>)}
            {c.sopDescription && <div style={{ marginTop: sp.s }}><Text style={{ ...labelText, fontWeight: 700, display: 'block', marginBottom: sp.xs }}>SOP Description</Text><Text style={bodyText}>{c.sopDescription}</Text></div>}
            <FlexBox wrap="Wrap" style={{ gap: sp.xs, marginTop: sp.s }}>
              <Button design="Default" icon="show" onClick={() => onViewRule(c.id)}>View</Button>
              <Button design="Default" icon="edit" onClick={() => { onEditRule(c.id); showToast(`Draft copy created from ${c.id}`); }}>Edit</Button>
              <Button design="Default" icon="group" onClick={() => { onSetAssigningId(assigningId === c.id ? null : c.id); onClearRetireBlock(); }}>Profiles</Button>
              <Button design="Attention" icon="pause" onClick={() => { onSetAssigningId(null); onRetire(c.id); if (c.assignedProfileIds.length === 0) { setSelectedRowId(null); showToast(`Rule ${c.id} retired`); } }}>Retire</Button>
            </FlexBox>
          </FlexBox>
        );

      case 'retired':
        return (
          <FlexBox direction="Column" style={{ gap: sp.s }}>
            {infoRow('Name', <Text style={{ fontWeight: 600 }}>{c.name}</Text>)}
            {infoRow('Group', <Text style={bodyText}>{c.group}</Text>)}
            {infoRow('Type', <Tag colorScheme={RULE_TYPE_COLOR[c.ruleType]}>{RULE_TYPE_LABEL[c.ruleType]}</Tag>)}
            <MessageStrip design="Critical" hideCloseButton style={{ marginTop: sp.xs }}>This rule is retired and no longer active in any profile.</MessageStrip>
            <Button design="Default" icon="show" onClick={() => onViewRule(c.id)} style={{ marginTop: sp.xs }}>View</Button>
          </FlexBox>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Tab filters — Figma style underline tabs ───────────────────── */}
      <div style={{ borderBottom: '1px solid var(--sapList_BorderColor)', background: 'var(--sapObjectHeader_Background,#fff)', padding: `0 ${sp.m}`, flexShrink: 0, overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 0, whiteSpace: 'nowrap' }}>
          {filterTabs.map(tab => {
            const isActive = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => { setFilter(tab.key); setSelectedRowId(null); }}
                style={{
                  padding: `${sp.s} ${sp.m}`,
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--sapSelectedColor,#0070f2)' : '2px solid transparent',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'var(--sapFontFamily)',
                  fontSize: 'var(--sapFontSize)',
                  color: isActive ? 'var(--sapSelectedColor,#0070f2)' : 'var(--sapTextColor)',
                  fontWeight: isActive ? 600 : 400,
                  marginBottom: -1,
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* ── Main table area ───────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>

            {/* Table header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 14% 20% 24% 32px', background: 'var(--sapList_HeaderBackground)', borderBottom: '2px solid var(--sapList_BorderColor)', padding: `0 ${sp.m}`, position: 'sticky', top: 0, zIndex: 1 }}>
              {['Rule Name', 'Group', 'Type', 'Profiles', 'Status', ''].map((col, i) => (
                <div key={i} style={{ padding: '10px 8px', fontWeight: 'var(--sapFontBoldWeight,700)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>
                  {col}
                </div>
              ))}
            </div>

            {/* Table header with "All Rules (N)" + search */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', background: 'var(--sapBaseColor,#fff)' }}>
              <Text style={{ ...bodyText, fontWeight: 700 }}>
                {filter === 'all' ? `All Rules (${counts.all})` : `${filterTabs.find(t => t.key === filter)?.label ?? ''}`}
              </Text>
              <Input placeholder="Search" icon={<Icon name="search" slot="icon" />} style={{ width: 240 }} />
            </div>

            {filteredLibrary.length === 0 && (
              <div style={{ padding: sp.l, display: 'flex', justifyContent: 'center' }}>
                <IllustratedMessage name="NoData" titleText="No rules" subtitleText="No rules match this filter." />
              </div>
            )}

            {filteredLibrary.map((c, idx) => {
              const isValidatingNow = validatingIds.has(c.id);
              const status = rowStatusDisplay(c, isValidatingNow);
              const assignedProfiles = profiles.filter(p => c.assignedProfileIds.includes(p.id));
              const isSelected = selectedRowId === c.id;
              const isRetired = c.stage === 'retired';

              return (
                <div
                  key={c.id}
                  onClick={() => handleRowClick(c.id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 14% 20% 24% 32px',
                    alignItems: 'center',
                    padding: `0 ${sp.m}`,
                    borderBottom: '1px solid var(--sapList_BorderColor)',
                    borderLeft: isSelected ? `3px solid var(--sapSelectedColor,#0070f2)` : '3px solid transparent',
                    background: isSelected ? 'var(--sapList_SelectionBackgroundColor,#e8f4ff)' : isRetired ? 'var(--sapNeutralBackground,#f9f9f9)' : idx % 2 === 0 ? 'var(--sapBaseColor,#fff)' : 'var(--sapList_Background,#fafafa)',
                    cursor: 'pointer',
                    opacity: isRetired ? 0.75 : 1,
                    minHeight: 48,
                  }}
                >
                  <div style={{ padding: '10px 8px' }}>
                    <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', fontWeight: 'var(--sapFontBoldWeight,700)', color: 'var(--sapTextColor)', display: 'block' }}>{c.name}</Text>
                    {isValidatingNow && <FlexBox alignItems="Center" style={{ gap: sp.xs, marginTop: 2 }}><BusyIndicator active size="S" /><Text style={labelText}>Validating…</Text></FlexBox>}
                  </div>
                  <div style={{ padding: '10px 8px' }}><Text style={labelText}>{c.group}</Text></div>
                  <div style={{ padding: '10px 8px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px', borderRadius: 12,
                      background: 'var(--sapInformationBackground,#e8f3ff)',
                      border: '1px solid var(--sapInformativeBorderColor,#b5d4f1)',
                      fontSize: 'var(--sapFontSmallSize)',
                      color: 'var(--sapInformativeColor,#0064d9)',
                      fontFamily: 'var(--sapFontFamily)',
                    }}>
                      <Icon name="information" style={{ fontSize: 12, color: 'var(--sapInformativeColor,#0064d9)' }} />
                      {RULE_TYPE_LABEL[c.ruleType]}
                    </span>
                  </div>
                  <div style={{ padding: '10px 8px' }}>
                    <Text style={labelText}>{assignedProfiles.length > 0 ? assignedProfiles.map(p => p.name).join(', ') : '—'}</Text>
                  </div>
                  <div style={{ padding: '10px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gridColumn: '5 / -1' }}>
                    <Text style={{ ...labelText, color: status.color, fontWeight: 600, flex: 1 }}>{status.label}</Text>
                    <Icon name="navigation-right-arrow" style={{ color: 'var(--sapContent_LabelColor)', fontSize: 14, flexShrink: 0 }} />
                  </div>
                </div>
              );
            })}

            {/* Profile assignment / retire-block inline panels */}
            {filteredLibrary.map(c => {
              const showRetireBlock = retireBlockedId === c.id;
              const showAssigning = assigningId === c.id;
              if (!showRetireBlock && !showAssigning) return null;
              return (
                <div key={`expand-${c.id}`} style={{ margin: `${sp.xs} ${sp.m}`, border: '1px solid var(--sapList_BorderColor)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ padding: `${sp.xs} ${sp.m}`, background: 'var(--sapList_HeaderBackground,#f7f7f7)', borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                    <Text style={{ ...labelText, fontWeight: 700 }}>{c.id} · {c.name}</Text>
                  </div>
                  {showRetireBlock && (
                    <div style={{ padding: sp.m }}>
                      <MessageStrip design="Negative" hideCloseButton>
                        <FlexBox direction="Column" style={{ gap: sp.xs }}>
                          <Text style={{ fontWeight: 700 }}>This rule is assigned to one or more profiles. Remove it from those profiles before retiring.</Text>
                          <FlexBox style={{ gap: sp.xs, marginTop: sp.xs }}>
                            <Button design="Transparent" icon="group" onClick={() => { onSetAssigningId(c.id); onClearRetireBlock(); }}>Manage Profile Assignments</Button>
                            <Button design="Transparent" onClick={() => onClearRetireBlock()}>Cancel</Button>
                          </FlexBox>
                        </FlexBox>
                      </MessageStrip>
                    </div>
                  )}
                  {showAssigning && (
                    <div style={{ padding: sp.m, background: 'var(--sapList_SelectionBackgroundColor,#e8f4ff)' }}>
                      <Text style={{ ...sectionTitle, display: 'block', marginBottom: sp.xs }}>Assign to Rule Profiles</Text>
                      <Text style={{ ...labelText, display: 'block', marginBottom: sp.s }}>Only active and draft profiles shown.</Text>
                      <FlexBox wrap="Wrap" style={{ gap: sp.s }}>
                        {profiles.filter(p => p.status !== 'retired').map(p => {
                          const assigned = c.assignedProfileIds.includes(p.id);
                          return (
                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: sp.xs, padding: `${sp.xs} ${sp.s}`, border: `1px solid ${assigned ? 'var(--sapSelectedColor,#0070f2)' : 'var(--sapField_BorderColor)'}`, borderRadius: 4, background: assigned ? 'var(--sapList_SelectionBackgroundColor,#e8f4ff)' : 'var(--sapBaseColor,#fff)', cursor: 'pointer' }} onClick={() => onAssignProfile(c.id, p.id, !assigned)}>
                              <Icon name={assigned ? 'accept' : 'add'} />
                              <Text style={{ fontSize: 'var(--sapFontSmallSize)' }}>{p.name}</Text>
                              <ObjectStatus state={profileStatusState(p.status)}>{PROFILE_STATUS_LABEL[p.status]}</ObjectStatus>
                            </div>
                          );
                        })}
                      </FlexBox>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right detail panel ────────────────────────────────────────── */}
        {selectedRule && (
          <div style={{ width: 360, flexShrink: 0, borderLeft: '1px solid var(--sapList_BorderColor)', display: 'flex', flexDirection: 'column', background: 'var(--sapBaseColor)', overflow: 'hidden' }}>
            <div style={{ padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', background: 'var(--sapObjectHeader_Background,#fff)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: sp.s }}>
              <div style={{ minWidth: 0 }}>
                <FlexBox alignItems="Center" style={{ gap: sp.xs, marginBottom: sp.xs, flexWrap: 'wrap' }}>
                  <Tag colorScheme="8">{selectedRule.id}</Tag>
                  <ObjectStatus state={stageStatusState(selectedRule.stage)}>{STAGE_LABEL_V2[selectedRule.stage]}</ObjectStatus>
                </FlexBox>
                <Text style={{ ...bodyText, fontWeight: 700, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedRule.name}</Text>
              </div>
              <Button design="Transparent" icon="decline" tooltip="Close" onClick={() => setSelectedRowId(null)} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: sp.m }}>
              {renderDetail(selectedRule)}
            </div>
          </div>
        )}
      </div>

      <Toast open={toastOpen} duration={3000} placement="BottomCenter" onClose={() => setToastOpen(false)}>{toastMessage}</Toast>
    </div>
  );
};

// ─── Rule Profiles ────────────────────────────────────────────────────────────
const RuleProfilesTab: React.FC<{
  profiles: RuleProfileV2[];
  candidates: RuleCandidateV2[];
  onSaveProfile: (p: RuleProfileV2) => void;
  onActivate: (id: string) => void;
  onRetireProfile: (id: string) => void;
  onCopyProfile: (p: RuleProfileV2) => void;
  onAssignRule: (ruleId: string, profileId: string, assign: boolean) => void;
}> = ({ profiles, candidates, onSaveProfile, onActivate, onRetireProfile, onCopyProfile, onAssignRule }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDC, setEditDC] = useState('');
  const [editContext, setEditContext] = useState('');
  const [editFrom, setEditFrom] = useState('');
  const [editTo, setEditTo] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const approvedRules = candidates.filter(c => c.stage === 'approved');
  const showToast = (m: string) => { setToastMessage(m); setToastOpen(true); };

  const loadProfile = (p: RuleProfileV2) => {
    setSelectedId(p.id);
    setEditName(p.name); setEditDC(p.dc); setEditContext(p.planningContext);
    setEditFrom(p.effectiveFrom); setEditTo(p.effectiveTo);
    setIsDirty(false);
  };

  const handleSaveProfileDetails = () => {
    if (!selected) return;
    onSaveProfile({ ...selected, name: editName, dc: editDC, planningContext: editContext, effectiveFrom: editFrom, effectiveTo: editTo });
    setIsDirty(false);
    showToast('Profile details saved');
  };

  const selected = selectedId ? profiles.find(p => p.id === selectedId) ?? null : null;

  const handleNewProfile = () => {
    const newId = `RP-${String(profiles.length + 1).padStart(3, '0')}`;
    const p: RuleProfileV2 = { id: newId, name: 'New Profile', dc: 'DC-BD27', planningContext: 'Daily Planning', effectiveFrom: '2026-07-01', effectiveTo: '2026-12-31', status: 'draft', ruleIds: [], createdDate: '2026-07-06' };
    onSaveProfile(p);
    loadProfile(p);
  };

  const handleAddRule = (ruleId: string) => {
    if (!selected) return;
    onAssignRule(ruleId, selected.id, true);
  };

  const handleRemoveRule = (ruleId: string) => {
    if (!selected) return;
    onAssignRule(ruleId, selected.id, false);
  };

  const [profileFilter, setProfileFilter] = useState<'all' | ProfileStatusV2>('all');

  const activeCount  = profiles.filter(p => p.status === 'active').length;
  const draftCount   = profiles.filter(p => p.status === 'draft').length;
  const retiredCount = profiles.filter(p => p.status === 'retired').length;

  const visibleProfiles = profileFilter === 'all' ? profiles : profiles.filter(p => p.status === profileFilter);

  const filterTabs: { key: 'all' | ProfileStatusV2; label: string; count: number }[] = [
    { key: 'all',     label: 'All',     count: profiles.length },
    { key: 'active',  label: 'Active',  count: activeCount },
    { key: 'draft',   label: 'Draft',   count: draftCount },
    { key: 'retired', label: 'Retired', count: retiredCount },
  ];

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Profile list */}
      <div style={{ width: 320, flexShrink: 0, borderRight: '1px solid var(--sapList_BorderColor)', display: 'flex', flexDirection: 'column', background: 'var(--sapBaseColor)' }}>
        {/* Header */}
        <div style={{ padding: `${sp.m} ${sp.m} 0`, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
          <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ marginBottom: sp.xs }}>
            <div>
              <Title level="H5">Rule Profiles</Title>
              <Text style={{ ...labelText, display: 'block', marginTop: '2px' }}>
                {profiles.length} profiles — {activeCount} active, {draftCount} draft, {retiredCount} retired
              </Text>
            </div>
            <Button design="Default" icon="add" onClick={handleNewProfile}>Create Profile</Button>
          </FlexBox>
          {/* Filter tabs — SegmentedButton */}
          <div style={{ paddingBottom: sp.s }}>
            <SegmentedButton>
              {filterTabs.map(tab => (
                <SegmentedButtonItem
                  key={tab.key}
                  pressed={profileFilter === tab.key}
                  onClick={() => setProfileFilter(tab.key as 'all' | ProfileStatusV2)}
                >
                  {tab.label} ({tab.count})
                </SegmentedButtonItem>
              ))}
            </SegmentedButton>
          </div>
        </div>
        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {visibleProfiles.length === 0 && (
            <div style={{ padding: sp.l, display: 'flex', justifyContent: 'center' }}>
              <IllustratedMessage name="NoData" titleText="No profiles" subtitleText={`No ${profileFilter === 'all' ? '' : profileFilter + ' '}profiles found.`} />
            </div>
          )}
          <List mode="SingleSelectMaster">
            {visibleProfiles.map(p => (
              <ListItemCustom key={p.id} selected={selectedId === p.id}>
                <div onClick={() => loadProfile(p)} style={{ padding: `${sp.xs} 0`, cursor: 'pointer', width: '100%' }}>
                  <FlexBox direction="Column" style={{ gap: 2, width: '100%' }}>
                    <FlexBox alignItems="Center" justifyContent="SpaceBetween">
                      <Text style={{ ...bodyText, fontWeight: 'var(--sapFontBoldWeight, 700)' }}>{p.name}</Text>
                      <ObjectStatus state={profileStatusState(p.status)}>{PROFILE_STATUS_LABEL[p.status]}</ObjectStatus>
                    </FlexBox>
                    <Text style={labelText}>{p.dc} · {p.effectiveFrom} → {p.effectiveTo || 'No end'}</Text>
                    <Text style={labelText}>{p.ruleIds.length} rule{p.ruleIds.length !== 1 ? 's' : ''}</Text>
                  </FlexBox>
                </div>
              </ListItemCustom>
            ))}
          </List>
        </div>
      </div>

      {/* Profile detail */}
      <div style={{ flex: 1, overflowY: 'auto', padding: sp.m }}>
        {!selected ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <IllustratedMessage name="AddColumn" titleText="No profile selected" subtitleText="Select a profile to edit, or create a new one." />
          </div>
        ) : (
          <FlexBox direction="Column" style={{ gap: sp.m }}>
            {selected.status === 'draft' && <MessageStrip design="Warning" hideCloseButton>Draft — not visible to planners. Activate when ready.</MessageStrip>}
            {selected.status === 'active' && <MessageStrip design="Positive" hideCloseButton>Active — visible to planners with matching effective dates. To make changes, create a draft copy.</MessageStrip>}
            {selected.status === 'retired' && <MessageStrip design="Critical" hideCloseButton>Retired — hidden from planner selection.</MessageStrip>}

            <Panel headerText="Profile Details" accessibleRole="Region">
              {selected.status === 'draft' ? (
                <Form style={{ padding: sp.s }}>
                  <FormGroup>
                    <FormItem labelContent={<Label required>Profile Name</Label>}><Input value={editName} onInput={e => { setEditName((e.target as HTMLInputElement).value); setIsDirty(true); }} style={{ width: '100%' }} /></FormItem>
                    <FormItem labelContent={<Label>DC / Region</Label>}><Input value={editDC} onInput={e => { setEditDC((e.target as HTMLInputElement).value); setIsDirty(true); }} placeholder="e.g. DC-BD27" style={{ width: '100%' }} /></FormItem>
                    <FormItem labelContent={<Label>Planning Context</Label>}><Input value={editContext} onInput={e => { setEditContext((e.target as HTMLInputElement).value); setIsDirty(true); }} placeholder="e.g. Daily Planning" style={{ width: '100%' }} /></FormItem>
                    <FormItem labelContent={<Label>Effective From</Label>}><Input type="Date" value={editFrom} onInput={e => { setEditFrom((e.target as HTMLInputElement).value); setIsDirty(true); }} style={{ width: '100%' }} /></FormItem>
                    <FormItem labelContent={<Label>Effective To (optional)</Label>}><Input type="Date" value={editTo} onInput={e => { setEditTo((e.target as HTMLInputElement).value); setIsDirty(true); }} style={{ width: '100%' }} /></FormItem>
                  </FormGroup>
                </Form>
              ) : (
                <div style={{ padding: sp.m, display: 'flex', flexDirection: 'column', gap: sp.s }}>
                  {[
                    { label: 'DC / Planning context', value: selected.dc },
                    { label: 'Owner', value: selected.planningContext },
                    { label: 'Effective period', value: `${selected.effectiveFrom} → ${selected.effectiveTo || 'No end date'}` },
                    { label: 'Created', value: selected.createdDate },
                    ...(selected.activatedDate ? [{ label: 'Activated', value: selected.activatedDate }] : []),
                  ].map(row => (
                    <FlexBox key={row.label} alignItems="Center" style={{ gap: sp.l }}>
                      <Text style={{ ...labelText, minWidth: 160 }}>{row.label}</Text>
                      <Text style={bodyText}>{row.value}</Text>
                    </FlexBox>
                  ))}
                </div>
              )}
            </Panel>

            <Panel headerText={`Assigned Rules (${selected.ruleIds.length})`} accessibleRole="Region">
              <FlexBox direction="Column" style={{ gap: sp.s, padding: sp.s }}>
                {selected.ruleIds.length === 0 && <Text style={labelText}>No rules assigned. Add approved rules below.</Text>}
                {selected.ruleIds.map((rid, idx) => {
                  const rule = candidates.find(c => c.id === rid);
                  const ruleStageState = rule ? stageStatusState(rule.stage) : 'None';
                  const ruleStageLabel = rule ? STAGE_LABEL_V2[rule.stage] : '—';
                  return (
                    <FlexBox key={rid} alignItems="Center" justifyContent="SpaceBetween" style={{ padding: `${sp.s} ${sp.m}`, border: '1px solid var(--sapList_BorderColor)', borderRadius: 4, background: 'var(--sapList_Background,#fff)' }}>
                      <FlexBox alignItems="Center" style={{ gap: sp.s }}>
                        <Text style={{ ...labelText, minWidth: 20 }}>{idx + 1}</Text>
                        <Tag colorScheme="8">{rid}</Tag>
                        <FlexBox direction="Column" style={{ gap: 2 }}>
                          <Text style={{ ...bodyText, fontWeight: 'var(--sapFontSemiBoldWeight, 600)' }}>{rule?.name ?? rid}</Text>
                          {rule && <Text style={labelText}>{RULE_TYPE_LABEL[rule.ruleType]} · P1</Text>}
                        </FlexBox>
                      </FlexBox>
                      <FlexBox alignItems="Center" style={{ gap: sp.s }}>
                        <ObjectStatus state={ruleStageState}>{ruleStageLabel}</ObjectStatus>
                        {selected.status === 'draft' && <Button design="Transparent" icon="decline" onClick={() => handleRemoveRule(rid)}>Remove</Button>}
                      </FlexBox>
                    </FlexBox>
                  );
                })}
                {selected.status === 'draft' && (
                  <div>
                    <Text style={{ ...sectionTitle, display: 'block', marginBottom: sp.xs }}>Add approved rules</Text>
                    <FlexBox wrap="Wrap" style={{ gap: sp.xs }}>
                      {approvedRules.filter(r => !selected.ruleIds.includes(r.id)).map(r => (
                        <Button key={r.id} design="Default" icon="add" onClick={() => handleAddRule(r.id)}>{r.id} · {r.name}</Button>
                      ))}
                      {approvedRules.filter(r => !selected.ruleIds.includes(r.id)).length === 0 && (
                        <Text style={labelText}>All approved rules are already assigned.</Text>
                      )}
                    </FlexBox>
                  </div>
                )}
              </FlexBox>
            </Panel>

            <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
              {selected.status === 'draft' && (
                <>
                  <Button design="Default" icon="save" disabled={!isDirty || !editName.trim()} onClick={handleSaveProfileDetails}>Save</Button>
                  <Button design="Default" icon="accept" disabled={!editName.trim() || isDirty} title={isDirty ? 'Save profile details first' : undefined} onClick={() => { onActivate(selected.id); showToast(`Profile ${selected.id} activated — now visible to planners`); }}>Activate</Button>
                </>
              )}
              {selected.status === 'active' && (
                <>
                  <Button design="Default" icon="copy" onClick={() => { onCopyProfile(selected); showToast(`Draft copy created from ${selected.name}`); }}>Create Draft Copy</Button>
                  <Button design="Attention" icon="pause" onClick={() => { onRetireProfile(selected.id); showToast(`Profile ${selected.id} retired`); }}>Retire</Button>
                </>
              )}
            </FlexBox>
          </FlexBox>
        )}
      </div>
      <Toast open={toastOpen} duration={3000} placement="BottomCenter" onClose={() => setToastOpen(false)}>{toastMessage}</Toast>
    </div>
  );
};

// ─── System Setup ─────────────────────────────────────────────────────────────
const SystemSetupTab: React.FC<{ setupStatus: SetupStatus; onSetupStatusChange: (s: SetupStatus) => void }> = ({ setupStatus, onSetupStatusChange }) => {
  const [step, setStep] = useState(1);

  // Connection Settings
  const [connName, setConnName]       = useState('ALDI-TM-PROD');
  const [connEnv, setConnEnv]         = useState('QA');
  const [proxyType, setProxyType]     = useState('OnPremise');
  const [connDest, setConnDest]       = useState('ALDI_TM_DEST');

  // Authentication
  const [authType, setAuthType]       = useState('CONFIGURED_USER');
  const [tmUser, setTmUser]           = useState('ALDI_TM_SVC');
  const [tmPassword, setTmPassword]   = useState('placeholder-pw');

  // Target System (Cloud Connector)
  const [locationId, setLocationId]   = useState('local-aldi-tm-001');
  const [appServerHost, setAppServerHost] = useState('tm.aldi-sap.de');
  const [systemNumber, setSystemNumber] = useState('00');
  const [tmClient, setTmClient]       = useState('100');
  const [useLoadBalance, setUseLoadBalance] = useState(false);
  const [writeBackEnabled, setWriteBackEnabled] = useState(false);

  const [connStatus, setConnStatus]   = useState<'not-configured' | 'testing' | 'connected' | 'failed'>('not-configured');
  const [activatedAt, setActivatedAt] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (m: string) => { setToastMessage(m); setToastOpen(true); };

  const testConnection = () => {
    setConnStatus('testing');
    setTimeout(() => { setConnStatus('connected'); showToast('Connection successful — TM 2023.Q1 detected'); }, 1500);
  };

  const checks = {
    connection: connStatus === 'connected',
  };

  const allChecksPass = checks.connection;

  const STEPS = [
    { n: 1, label: 'TM Connection', done: checks.connection },
    { n: 2, label: 'Review & Activate', done: setupStatus === 'active' },
  ];

  const stepContent = () => {
    switch (step) {
      case 1: return (
        <FlexBox direction="Column" style={{ gap: sp.m }}>
          <FlexBox alignItems="Center" justifyContent="SpaceBetween">
            <Text style={bodyText}>Configure the SAP TM on-premise connection via SAP Cloud Connector.</Text>
            <ObjectStatus state={connStatus === 'connected' ? 'Positive' : connStatus === 'failed' ? 'Negative' : connStatus === 'testing' ? 'Information' : 'None'}>
              {connStatus === 'connected' ? 'Connected' : connStatus === 'testing' ? 'Testing…' : connStatus === 'failed' ? 'Failed' : 'Not configured'}
            </ObjectStatus>
          </FlexBox>

          {/* Two-column: Connection Settings + Authentication */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.m }}>
            <Panel headerText="Connection Settings" accessibleRole="Region">
              <Form style={{ padding: sp.s }}>
                <FormGroup>
                  <FormItem labelContent={<Label required>Connection Name</Label>}>
                    <Input value={connName} onInput={e => setConnName((e.target as HTMLInputElement).value)} placeholder="e.g. ALDI-TM-PROD" style={{ width: '100%' }} />
                  </FormItem>
                  <FormItem labelContent={<Label required>Proxy Type</Label>}>
                    <Select style={{ width: '100%' }} onChange={e => { const v = (e.detail as any).selectedOption?.value; if (v) setProxyType(v); }}>
                      <Option value="OnPremise" selected={proxyType === 'OnPremise'}>On Premise</Option>
                      <Option value="Cloud" selected={proxyType === 'Cloud'}>Cloud</Option>
                    </Select>
                  </FormItem>
                  <FormItem labelContent={<Label required>BTP Destination Name</Label>}>
                    <Input value={connDest} onInput={e => setConnDest((e.target as HTMLInputElement).value)} placeholder="e.g. ALDI_TM_DEST" style={{ width: '100%' }} />
                  </FormItem>
                  <FormItem labelContent={<Label required>Environment</Label>}>
                    <Select style={{ width: '100%' }} onChange={e => { const v = (e.detail as any).selectedOption?.value; if (v) setConnEnv(v); }}>
                      {['DEV', 'QA', 'PROD'].map(v => <Option key={v} value={v} selected={connEnv === v}>{v}</Option>)}
                    </Select>
                  </FormItem>
                </FormGroup>
              </Form>
            </Panel>

            <Panel headerText="Authentication" accessibleRole="Region">
              <Form style={{ padding: sp.s }}>
                <FormGroup>
                  <FormItem labelContent={<Label required>Authorization Type</Label>}>
                    <Select style={{ width: '100%' }} onChange={e => { const v = (e.detail as any).selectedOption?.value; if (v) setAuthType(v); }}>
                      <Option value="CONFIGURED_USER" selected={authType === 'CONFIGURED_USER'}>CONFIGURED_USER</Option>
                      <Option value="PRINCIPAL_PROPAGATION" selected={authType === 'PRINCIPAL_PROPAGATION'}>PRINCIPAL_PROPAGATION</Option>
                    </Select>
                  </FormItem>
                  <FormItem labelContent={<Label required>User</Label>}>
                    <Input value={tmUser} onInput={e => setTmUser((e.target as HTMLInputElement).value)} placeholder="e.g. ALDI_TM_SVC" style={{ width: '100%' }} />
                  </FormItem>
                  <FormItem labelContent={<Label required>Password</Label>}>
                    <Input
                      type="Password"
                      value={tmPassword}
                      onInput={e => setTmPassword((e.target as HTMLInputElement).value)}
                      placeholder="••••••••"
                      style={{ width: '100%' }}
                    />
                  </FormItem>
                </FormGroup>
              </Form>
            </Panel>
          </div>

          {/* Target System Configuration — full width */}
          <Panel headerText="Target System Configuration" accessibleRole="Region">
            <Form style={{ padding: sp.s }}>
              <FormGroup>
                <FormItem labelContent={<Label>Use Load Balancing Connection</Label>}>
                  <CheckBox checked={useLoadBalance} onChange={e => setUseLoadBalance((e.target as HTMLInputElement).checked)} />
                </FormItem>
                {proxyType === 'OnPremise' && (
                  <>
                    <FormItem labelContent={<Label required>Cloud Connector Location ID</Label>}>
                      <Input value={locationId} onInput={e => setLocationId((e.target as HTMLInputElement).value)} placeholder="e.g. local-aldi-tm-001" style={{ width: '100%' }} />
                    </FormItem>
                    <FormItem labelContent={<Label required>Virtual Application Server Host</Label>}>
                      <Input value={appServerHost} onInput={e => setAppServerHost((e.target as HTMLInputElement).value)} placeholder="e.g. tm.aldi-sap.de" style={{ width: '100%' }} />
                    </FormItem>
                    <FormItem labelContent={<Label required>System Number</Label>}>
                      <Input value={systemNumber} onInput={e => setSystemNumber((e.target as HTMLInputElement).value)} placeholder="e.g. 00" style={{ width: 120 }} />
                    </FormItem>
                    <FormItem labelContent={<Label required>Client</Label>}>
                      <Input value={tmClient} onInput={e => setTmClient((e.target as HTMLInputElement).value)} placeholder="e.g. 100" style={{ width: 120 }} />
                    </FormItem>
                  </>
                )}
              </FormGroup>
            </Form>
          </Panel>

          {connStatus === 'failed' && (
            <MessageStrip design="Negative" hideCloseButton>
              Connection failed. Check your Cloud Connector Location ID, Application Server Host, and credentials.
            </MessageStrip>
          )}
          {connStatus === 'connected' && (
            <MessageStrip design="Positive" hideCloseButton>
              Connection successful — SAP TM system reachable via Cloud Connector.
            </MessageStrip>
          )}
          <FlexBox justifyContent="End" style={{ gap: sp.s }}>
            <Button design={connStatus === 'connected' ? 'Default' : 'Emphasized'} icon="connected" disabled={connStatus === 'testing'} onClick={testConnection}>
              {connStatus === 'testing' ? 'Testing…' : connStatus === 'connected' ? 'Re-test Connection' : 'Test Connection'}
            </Button>
            {checks.connection && <Button design="Emphasized" icon="navigation-right-arrow" iconEnd onClick={() => setStep(2)}>Next: Review & Activate</Button>}
          </FlexBox>
        </FlexBox>
      );
      case 2: return (
        <FlexBox direction="Column" style={{ gap: sp.m }}>
          {setupStatus === 'active' ? (
            <MessageStrip design="Positive" hideCloseButton>Setup is active. Planners can start sessions.</MessageStrip>
          ) : (
            <MessageStrip design="Information" hideCloseButton>Complete all requirements below to activate.</MessageStrip>
          )}
          <Panel headerText="Setup Checklist" accessibleRole="Region">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--sapFontFamily)' }}>
              <thead>
                <tr style={{ background: 'var(--sapList_HeaderBackground)', borderBottom: '2px solid var(--sapList_BorderColor)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 'var(--sapFontBoldWeight, 700)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>Requirement</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 'var(--sapFontBoldWeight, 700)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', width: '120px' }}>Status</th>
                  <th style={{ padding: '8px 12px', width: '150px' }}></th>
                </tr>
              </thead>
              <tbody>
                {[{ label: 'TM connection configured and tested', done: checks.connection, goTo: 1 }].map(r => (
                  <tr key={r.label} style={{ borderTop: '1px solid var(--sapList_BorderColor)' }}>
                    <td style={{ padding: '8px 12px' }}>{r.label}</td>
                    <td style={{ padding: '8px 12px' }}><ObjectStatus state={r.done ? 'Positive' : 'Negative'}>{r.done ? 'Complete' : 'Incomplete'}</ObjectStatus></td>
                    <td style={{ padding: '8px 12px' }}>{!r.done && <Button design="Transparent" onClick={() => setStep(r.goTo)}>Go to Step {r.goTo}</Button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Panel headerText="Write-Back to TM" accessibleRole="Region">
            <FlexBox direction="Column" style={{ gap: sp.s, padding: sp.m }}>
              <Text style={bodyText}>Controls whether planners can save accepted recommendations back to SAP TM. When disabled, recommendations are shown but no changes are written to TM.</Text>
              <FlexBox alignItems="Center" style={{ gap: sp.m }}>
                <CheckBox
                  checked={writeBackEnabled}
                  onChange={e => setWriteBackEnabled((e.target as HTMLInputElement).checked)}
                  text="Enable Write-Back to TM"
                />
                <ObjectStatus state={writeBackEnabled ? 'Positive' : 'None'}>
                  {writeBackEnabled ? 'Enabled' : 'Disabled'}
                </ObjectStatus>
              </FlexBox>
              {writeBackEnabled && (
                <MessageStrip design="Warning" hideCloseButton>
                  Write-back is enabled. Planners can save accepted recommendation packages directly to SAP TM.
                </MessageStrip>
              )}
            </FlexBox>
          </Panel>
          {setupStatus !== 'active' && (
            <FlexBox justifyContent="End">
              <Button design="Emphasized" icon="accept" disabled={!allChecksPass} onClick={() => { const ts = new Date().toLocaleString(); setActivatedAt(ts); onSetupStatusChange('active'); showToast('System Setup activated — planners can now start sessions'); }}>Activate Setup</Button>
            </FlexBox>
          )}
          {setupStatus === 'active' && (
            <MessageStrip design="Positive" hideCloseButton>
              Setup activated{activatedAt ? ` · ${activatedAt}` : ''}. Planners can start sessions.
            </MessageStrip>
          )}
        </FlexBox>
      );
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {setupStatus === 'active' ? (
        /* ── Active dashboard ────────────────────────────────────────────── */
        <div style={{ padding: sp.m, display: 'flex', flexDirection: 'column', gap: sp.m }}>
          {/* Banner */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${sp.s} ${sp.m}`, background: 'var(--sapSuccessBackground,#f0fdf4)', border: '1px solid var(--sapPositiveColor)', borderRadius: 'var(--sapElement_BorderCornerRadius,4px)' }}>
            <FlexBox alignItems="Center" style={{ gap: sp.s }}>
              <Icon name="sys-enter-2" style={{ color: 'var(--sapPositiveColor)' }} />
              <Text style={{ fontWeight: 'var(--sapFontBoldWeight, 700)', color: 'var(--sapPositiveTextColor,#1b6b3a)' }}>System setup is active</Text>
              {activatedAt && <Text style={labelText}>· activated {activatedAt}</Text>}
            </FlexBox>
            <Button design="Transparent" icon="edit" onClick={() => { onSetupStatusChange('draft'); setStep(1); showToast('Setup unlocked for editing'); }}>Edit setup</Button>
          </div>

          {/* Three info cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: sp.m }}>
            {/* Connection */}
            <Card header={<CardHeader titleText="TM Connection" avatar={<Icon name="connected" />} />}>
              <FlexBox direction="Column" style={{ gap: sp.s, padding: sp.m }}>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>Name</Label><Text style={{ fontWeight: 'var(--sapFontSemiBoldWeight, 600)' }}>{connName || '—'}</Text></FlexBox>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>Environment</Label><Text style={{ fontWeight: 'var(--sapFontSemiBoldWeight, 600)' }}>{connEnv}</Text></FlexBox>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>Proxy type</Label><Text>{proxyType}</Text></FlexBox>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>BTP destination</Label><Text style={{ fontSize: 'var(--sapFontSmallSize)' }}>{connDest}</Text></FlexBox>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>App server host</Label><Text style={{ fontSize: 'var(--sapFontSmallSize)', fontFamily: 'var(--sapFontMonospaceFamily,monospace)', wordBreak: 'break-all' }}>{appServerHost || '—'}</Text></FlexBox>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>Client</Label><Text>{tmClient || '—'}</Text></FlexBox>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>User</Label><Text>{tmUser || '—'}</Text></FlexBox>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>Status</Label><ObjectStatus state={connStatus === 'connected' ? 'Positive' : 'None'}>{connStatus === 'connected' ? 'Connected' : 'Not tested'}</ObjectStatus></FlexBox>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>Write-Back to TM</Label><ObjectStatus state={writeBackEnabled ? 'Positive' : 'None'}>{writeBackEnabled ? 'Enabled' : 'Disabled'}</ObjectStatus></FlexBox>
                <FlexBox style={{ gap: sp.xs, marginTop: sp.xs }}>
                  <Button design="Default" icon="connected" onClick={testConnection}>{connStatus === 'testing' ? 'Testing…' : 'Re-test'}</Button>
                  <Button design="Transparent" icon="edit" onClick={() => { onSetupStatusChange('draft'); setStep(1); }}>Edit</Button>
                </FlexBox>
              </FlexBox>
            </Card>
          </div>
        </div>
      ) : (
        /* ── Stepper wizard (incomplete / draft) ────────────────────────── */
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* Stepper sidebar */}
          <div style={{ width: 200, flexShrink: 0, borderRight: '1px solid var(--sapList_BorderColor)', background: 'var(--sapBaseColor)', padding: `${sp.m} 0` }}>
            <Text style={{ ...sectionTitle, display: 'block', padding: `0 ${sp.m} ${sp.s}` }}>System Setup</Text>
            {STEPS.map(s => (
              <button key={s.n} onClick={() => setStep(s.n)} style={{ display: 'flex', alignItems: 'center', gap: sp.s, width: '100%', padding: `${sp.s} ${sp.m}`, border: 'none', background: step === s.n ? 'var(--sapList_SelectionBackgroundColor,#e8f4ff)' : 'transparent', borderLeft: `3px solid ${step === s.n ? 'var(--sapSelectedColor,#0070f2)' : 'transparent'}`, cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: s.done ? 'var(--sapPositiveColor)' : step === s.n ? 'var(--sapSelectedColor,#0070f2)' : 'var(--sapNeutralBackground,#e5e5e5)', color: s.done || step === s.n ? 'var(--sapContent_ContrastTextColor,#fff)' : 'var(--sapTextColor)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'var(--sapFontBoldWeight, 700)', flexShrink: 0 }}>
                  {s.done ? '✓' : s.n}
                </div>
                <Text style={{ fontSize: 'var(--sapFontSmallSize)', fontWeight: step === s.n ? 600 : 400 }}>{s.label}</Text>
              </button>
            ))}
          </div>
          {/* Step content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: sp.m }}>
            <Title level="H5" style={{ marginBottom: sp.m }}>Step {step}: {STEPS[step - 1].label}</Title>
            {stepContent()}
          </div>
        </div>
      )}
      <Toast open={toastOpen} duration={3000} placement="BottomCenter" onClose={() => setToastOpen(false)}>{toastMessage}</Toast>
    </div>
  );
};

// ─── Admin Section ────────────────────────────────────────────────────────────
const AdminSection: React.FC<{
  activeTab: AdminTab;
  onTabChange: (t: AdminTab) => void;
  setupStatus: SetupStatus;
  onSetupStatusChange: (s: SetupStatus) => void;
  onBackToPlanning: () => void;
  role: AppRole;
  profiles: RuleProfileV2[];
  onProfilesChange: (profiles: RuleProfileV2[]) => void;
}> = ({ activeTab, onTabChange: setActiveTab, setupStatus, onSetupStatusChange, onBackToPlanning, role, profiles, onProfilesChange }) => {
  const setProfiles = onProfilesChange;
  const [candidates, setCandidates] = useState<RuleCandidateV2[]>(INITIAL_CANDIDATES_V2);
  const [validatingIds, setValidatingIds] = useState<Set<string>>(new Set());
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [retireBlockedId, setRetireBlockedId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  // Tracks which rule ID to pre-select when Rule Creation tab opens from Library
  const [ruleCreationSelectedId, setRuleCreationSelectedId] = useState<string | null>(null);

  const showToast = useCallback((m: string) => { setToastMessage(m); setToastOpen(true); }, []);

  const updateCandidate = useCallback((id: string, patch: Partial<RuleCandidateV2>) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  }, []);

  useEffect(() => {
    const toValidate = candidates.filter(c => c.stage === 'submitted' && !validatingIds.has(c.id));
    if (toValidate.length === 0) return;
    toValidate.forEach(c => {
      setValidatingIds(prev => new Set([...prev, c.id]));
      setTimeout(() => {
        const hasWarnings = c.ruleType === 'hard-constraint' && c.group === 'Time Rules';
        const hasFailed = c.sopDescription.toLowerCase().includes('complex');
        const resolvedStage: PipelineStageV2 = hasFailed ? 'validation-failed' : hasWarnings ? 'validation-complete-warnings' : 'validation-complete';
        const resolvedStatus: ValidationStatusV2 = hasFailed ? 'failed' : hasWarnings ? 'warnings' : 'pass';
        updateCandidate(c.id, {
          stage: resolvedStage,
          validationStatus: resolvedStatus,
          tmDataCheck: hasFailed ? 'fail' : 'pass',
          apiActionCheck: hasFailed ? 'fail' : hasWarnings ? 'warning' : 'pass',
        });
        setValidatingIds(prev => { const n = new Set(prev); n.delete(c.id); return n; });
      }, 2500);
    });
  }, [candidates, validatingIds, updateCandidate]);

  const libraryCount = candidates.filter(c => c.stage !== 'discarded').length;

  const handleSaveDraft = useCallback((draft: RuleCandidateV2) => {
    setCandidates(prev => {
      const exists = prev.find(c => c.id === draft.id);
      if (exists) return prev.map(c => c.id === draft.id ? { ...c, ...draft, stage: 'draft' } : c);
      return [draft, ...prev];
    });
    showToast(`Draft saved: ${draft.name || draft.id}`);
  }, [showToast]);

  const handleSubmit = useCallback((draft: RuleCandidateV2) => {
    const record: RuleCandidateV2 = { ...draft, stage: 'submitted', submittedDate: '2026-07-06' };
    setCandidates(prev => {
      const exists = prev.find(c => c.id === record.id);
      if (exists) return prev.map(c => c.id === record.id ? record : c);
      return [record, ...prev];
    });
    showToast(`${draft.name || draft.id} submitted for validation`);
    setActiveTab('rule-library');
  }, [showToast]);

  const handlePublish = useCallback((id: string) => {
    updateCandidate(id, { stage: 'approved', approvedBy: 'H. Fischer', approvedDate: '2026-07-27' });
    showToast('Rule published — now available in Rule Library');
  }, [updateCandidate, showToast]);

  const handleDelete = useCallback((id: string) => {
    updateCandidate(id, { stage: 'discarded' });
    showToast('Rule deleted');
  }, [updateCandidate, showToast]);

  const handleRetryValidation = useCallback((id: string) => {
    updateCandidate(id, { stage: 'submitted', validationStatus: 'pending', tmDataCheck: 'pending', apiActionCheck: 'pending' });
    showToast('Validation re-queued — checking TM connection');
  }, [updateCandidate, showToast]);

  const handleRetireRule = useCallback((id: string) => {
    setCandidates(prev => {
      const rule = prev.find(c => c.id === id);
      if (!rule) return prev;
      if (rule.assignedProfileIds.length > 0) {
        setRetireBlockedId(id);
        return prev;
      }
      setRetireBlockedId(null);
      return prev.map(c => c.id === id ? { ...c, stage: 'retired' as PipelineStageV2 } : c);
    });
    setProfiles(prev => prev.map(p => ({ ...p, ruleIds: p.ruleIds.filter(rid => rid !== id) })));
  }, []);

  const handleAssignProfile = useCallback((ruleId: string, profileId: string, assign: boolean) => {
    setCandidates(prev => prev.map(c => c.id === ruleId ? {
      ...c,
      assignedProfileIds: assign
        ? [...c.assignedProfileIds, profileId]
        : c.assignedProfileIds.filter(id => id !== profileId),
    } : c));
    setProfiles(prev => prev.map(p => p.id === profileId ? {
      ...p,
      ruleIds: assign ? [...p.ruleIds, ruleId] : p.ruleIds.filter(id => id !== ruleId),
    } : p));
    showToast(assign ? `Rule assigned to profile` : `Rule removed from profile`);
  }, [showToast]);

  const handleSaveProfile = useCallback((p: RuleProfileV2) => {
    setProfiles(prev => {
      const exists = prev.find(x => x.id === p.id);
      if (exists) return prev.map(x => x.id === p.id ? p : x);
      return [p, ...prev];
    });
  }, []);

  const handleActivateProfile = useCallback((id: string) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, status: 'active' as ProfileStatusV2, activatedDate: '2026-07-06' } : p));
  }, []);

  const handleRetireProfile = useCallback((id: string) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, status: 'retired' as ProfileStatusV2 } : p));
  }, []);

  const handleEditRule = useCallback((id: string) => {
    const original = candidates.find(c => c.id === id);
    if (!original) return;
    const copyId = `RC-${200 + candidates.length}`;
    const copy: RuleCandidateV2 = {
      ...original,
      id: copyId,
      stage: 'draft',
      validationStatus: 'pending',
      tmDataCheck: 'pending',
      apiActionCheck: 'pending',
      approvedBy: undefined,
      approvedDate: undefined,
      assignedProfileIds: [],
      name: `${original.name} (copy)`,
    };
    setCandidates(prev => [copy, ...prev]);
    setRuleCreationSelectedId(copyId);
    setActiveTab('rule-creation');
    showToast(`Draft copy ${copyId} created from ${original.id} — edit in Rule Creation`);
  }, [candidates, showToast]);

  // View an approved/retired rule read-only in Rule Creation (no copy)
  const handleViewRule = useCallback((id: string) => {
    setRuleCreationSelectedId(id);
    setActiveTab('rule-creation');
  }, [showToast]);

  const handleCopyProfile = useCallback((p: RuleProfileV2) => {
    const copyId = `RP-${String(profiles.length + 1).padStart(3, '0')}`;
    const copy: RuleProfileV2 = {
      ...p,
      id: copyId,
      name: `${p.name} (copy)`,
      status: 'draft',
      activatedDate: undefined,
      createdDate: '2026-07-06',
    };
    setProfiles(prev => [copy, ...prev]);
    showToast(`Draft copy ${copyId} created — edit in Rule Profiles`);
  }, [profiles, showToast]);

  const contentMap: Record<AdminTab, React.ReactNode> = {
    'rule-creation': <RuleCreationTab candidates={candidates} initialSelectedId={ruleCreationSelectedId} onSaveDraft={handleSaveDraft} onSubmit={handleSubmit} />,
    'rule-library': <RuleLibraryTab candidates={candidates} profiles={profiles} onPublish={handlePublish} onRetire={handleRetireRule} onDelete={handleDelete} onAssignProfile={handleAssignProfile} onEditRule={handleEditRule} onViewRule={handleViewRule} onRetryValidation={handleRetryValidation} validatingIds={validatingIds} retireBlockedId={retireBlockedId} onClearRetireBlock={() => setRetireBlockedId(null)} assigningId={assigningId} onSetAssigningId={setAssigningId} />,
    'rule-profiles': <RuleProfilesTab profiles={profiles} candidates={candidates} onSaveProfile={handleSaveProfile} onActivate={handleActivateProfile} onRetireProfile={handleRetireProfile} onCopyProfile={handleCopyProfile} onAssignRule={handleAssignProfile} />,
    'system-setup': <SystemSetupTab setupStatus={setupStatus} onSetupStatusChange={onSetupStatusChange} />,
  };

  const isSystemSetup = activeTab === 'system-setup';

  const TAB_TITLES: Record<AdminTab, string> = {
    'rule-creation': 'Rule Creation',
    'rule-library':  'Rule Library',
    'rule-profiles': 'Rule Profiles',
    'system-setup':  'System Setup',
  };

  return (
    <FlexBox direction="Column" style={{ height: '100%', margin: `-${sp.l}` }}>
      <div style={{ background: 'var(--sapObjectHeader_Background,#fff)', borderBottom: '1px solid var(--sapList_BorderColor)', padding: `${sp.m} ${sp.l}` }}>
        <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ gap: sp.m }}>
          <FlexBox alignItems="Center" style={{ gap: sp.s }}>
            <Title level="H2" style={{ fontWeight: 700 }}>{TAB_TITLES[activeTab]}</Title>
            {activeTab === 'rule-library' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 12, background: 'var(--sapNeutralBackground,#f5f6f7)', border: '1px solid var(--sapList_BorderColor)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)', fontFamily: 'var(--sapFontFamily)', fontWeight: 600 }}>
                {SESSION_ID}
              </span>
            )}
          </FlexBox>
          <FlexBox alignItems="Center" style={{ gap: sp.s }}>
            {!isSystemSetup && <Text style={{ ...labelText }}>
              {activeTab === 'rule-library' ? 'Manage your rule library, click any rule to view its details' : 'Rule Maintenance — not visible to planners'}
            </Text>}
            <Button design="Transparent" icon="nav-back" onClick={onBackToPlanning}>Back to planning</Button>
          </FlexBox>
        </FlexBox>
      </div>
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Show rule-maintenance sidebar only when NOT in System Setup */}
        {!isSystemSetup && (
          <RuleMaintenanceSidebar
            active={activeTab}
            onSelect={setActiveTab}
            libraryCount={libraryCount}
            role={role}
          />
        )}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {contentMap[activeTab]}
        </div>
      </div>
      <Toast open={toastOpen} duration={3000} placement="BottomCenter" onClose={() => setToastOpen(false)}>{toastMessage}</Toast>
    </FlexBox>
  );
};

// ─── Root component ───────────────────────────────────────────────────────────
const AldiTMRefinementV2Page: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({ loggedIn: false, name: '', initials: '', colorScheme: 'Accent6', role: 'planner' });
  const [setupStatus, setSetupStatus] = useState<SetupStatus>('incomplete');
  const [active, setActive] = useState<PlannerView>('session-start');
  const [unlockedUpTo, setUnlockedUpTo] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [adminTab, setAdminTab] = useState<AdminTab>('rule-creation');
  const [profiles, setProfiles] = useState<RuleProfileV2[]>(INITIAL_PROFILES_V2);

  const unlock = useCallback((idx: number) => setUnlockedUpTo(prev => Math.max(prev, idx)), []);
  const advanceTo = useCallback((key: PlannerView) => { const idx = STEP_ORDER.indexOf(key); if (idx !== -1) unlock(idx); setActive(key); }, [unlock]);

  const navItems: NavItem[] = useMemo(() => PLANNER_STEPS.map(v => {
    const idx = STEP_ORDER.indexOf(v.key);
    return { kind: 'leaf' as const, key: v.key, label: v.label, disabled: idx > unlockedUpTo || (sessionCompleted && v.key !== 'session-start') };
  }), [unlockedUpTo, sessionCompleted]);

  const navigate = useCallback((key: string) => {
    const plannerKey = key as PlannerView;
    if (sessionCompleted && plannerKey !== 'session-start') return;
    const idx = STEP_ORDER.indexOf(plannerKey);
    if (idx !== -1 && idx <= unlockedUpTo) setActive(plannerKey);
  }, [unlockedUpTo, sessionCompleted]);

  const handleStartNewSession = useCallback(() => { setUnlockedUpTo(0); setSessionCompleted(false); setActive('session-start'); }, []);

  if (!authState.loggedIn) return <LoginScreen onLogin={u => setAuthState(u)} />;

  const currentViewLabel = adminMode ? 'Admin' : (PLANNER_STEPS.find(s => s.key === active)?.label.replace(/^\d+\.\s*/, '') ?? '');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--sapBackgroundColor)', overflow: 'hidden' }}>
      <ShellBar
        primaryTitle="TM Planning Refinement"
        secondaryTitle={currentViewLabel}
        logo={<img src={`${import.meta.env.BASE_URL}sap-logo.svg`} alt="SAP" />}
        profile={<Avatar initials={authState.initials} colorScheme={authState.colorScheme as any} size="XS" />}
      >
        <ShellBarItem icon="sys-help" text="Help" />
        <ShellBarItem icon="log" text={`Sign out (${authState.name})`} onClick={() => { setAuthState({ loggedIn: false, name: '', initials: '', colorScheme: 'Accent6', role: 'planner' }); setActive('session-start'); setAdminMode(false); }} />
      </ShellBar>

      {/* Sub-header */}
      <div style={{ background: 'var(--sapObjectHeader_Background,#fff)', borderBottom: '1px solid var(--sapList_BorderColor)', padding: `${sp.s} ${sp.l}` }}>
        <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ flexWrap: 'wrap', gap: sp.s }}>
          <FlexBox alignItems="Center" style={{ gap: sp.m, flexWrap: 'wrap' }}>
            <div>
              <Title level="H5" style={{ marginBottom: '2px' }}>{TM_PROFILE}</Title>
              <Text style={labelText}>{authState.name} · {SESSION_ID}</Text>
            </div>
            <Tag colorScheme={authState.role === 'admin' ? '2' : '6'} style={{ textTransform: 'capitalize' }}>{authState.role === 'admin' ? 'Rule Creator' : authState.role}</Tag>
          </FlexBox>
          {authState.role === 'admin' && (
            <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
              <Button design={adminMode && adminTab !== 'system-setup' ? 'Emphasized' : 'Transparent'} icon="official-service" onClick={() => { setAdminMode(true); setAdminTab('rule-creation'); }}>Rule Maintenance</Button>
              <Button design={adminMode && adminTab === 'system-setup' ? 'Emphasized' : 'Transparent'} icon="settings" onClick={() => { setAdminMode(true); setAdminTab('system-setup'); }}>System Setup</Button>
              {adminMode && <Button design="Transparent" icon="nav-back" onClick={() => setAdminMode(false)}>Planner View</Button>}
            </FlexBox>
          )}
        </FlexBox>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {!adminMode && (
          <div style={{ width: 256, flexShrink: 0, height: '100%', overflowY: 'auto', borderRight: '1px solid var(--sapList_BorderColor)', background: 'var(--sapBaseColor)' }}>
            <SideNavigation items={navItems} selectedKey={active} onSelect={key => navigate(key)} />
          </div>
        )}
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, minHeight: 0, padding: sp.l }}>
            {adminMode ? (
              <AdminSection
                activeTab={adminTab}
                onTabChange={setAdminTab}
                setupStatus={setupStatus}
                onSetupStatusChange={setSetupStatus}
                onBackToPlanning={() => setAdminMode(false)}
                role={authState.role}
                profiles={profiles}
                onProfilesChange={setProfiles}
              />
            ) : active === 'session-start' ? (
              <View1SessionStart
                onSessionLoaded={() => advanceTo('overview')}
                setupStatus={setupStatus}
                ruleProfiles={profiles}
                onGoToSystemSetup={authState.role === 'admin' ? () => { setAdminMode(true); setAdminTab('system-setup'); } : undefined}
              />
            ) : active === 'overview' ? (
              <View2Overview onProceed={() => advanceTo('rule-evaluation')} />
            ) : active === 'rule-evaluation' ? (
              <View3RuleEvaluation onStartReview={() => advanceTo('review')} />
            ) : active === 'review' ? (
              <View3RecommendationReview onProceedToChanges={() => advanceTo('changes')} />
            ) : active === 'changes' ? (
              <View4Changes onStartNewSession={handleStartNewSession} onSessionSaved={() => setSessionCompleted(true)} />
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AldiTMRefinementV2Page;
