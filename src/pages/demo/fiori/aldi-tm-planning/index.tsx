// @ts-nocheck
// ALDI TM Planning Refinement — Root App
// Updated to match design PDFs exactly

import React, { useState } from 'react';
import {
  ThemeProvider, ShellBar, Avatar, ResponsivePopover,
  List, ListItemStandard, Toast,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-react/styles.css';
import '@ui5/webcomponents-icons/dist/AllIcons.js';
import '@ui5/webcomponents-fiori/dist/illustrations/AllIllustrations.js';

import { MOCK_USERS, INITIAL_PROFILES, INITIAL_RULES } from './data';
import type { AuthState, RuleProfile, RuleCandidate } from './types';

// ─── Design tokens ────────────────────────────────────────────────────────────
export const sp = {
  xs: '0.25rem',
  s:  '0.5rem',
  m:  '1rem',
  l:  '1.5rem',
  xl: '2rem',
};

export const card: React.CSSProperties = {
  background: 'var(--sapTile_Background, #fff)',
  borderRadius: '0.75rem',
  border: '1px solid var(--sapList_BorderColor, #e8e8e8)',
  boxShadow: 'var(--sapContent_Shadow0)',
};

export const label: React.CSSProperties = {
  fontSize: 'var(--sapFontSmallSize)',
  color: 'var(--sapContent_LabelColor)',
  fontFamily: 'var(--sapFontFamily)',
  fontWeight: 'var(--sapFontBoldWeight)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
};

export const body: React.CSSProperties = {
  fontSize: 'var(--sapFontSize)',
  color: 'var(--sapTextColor)',
  fontFamily: 'var(--sapFontFamily)',
  lineHeight: 1.5,
};

export const mono: React.CSSProperties = {
  fontFamily: 'var(--sapFontMonospaceFamily, monospace)',
  fontSize: 'var(--sapFontSmallSize)',
  color: 'var(--sapTextColor)',
};

// ─── Login ────────────────────────────────────────────────────────────────────
const Login: React.FC<{ onLogin: (u: AuthState) => void }> = ({ onLogin }) => (
  <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sapBackgroundColor)' }}>
    <div style={{ ...card, maxWidth: 400, width: '100%', padding: sp.xl }}>
      <div style={{ textAlign: 'center', marginBottom: sp.l }}>
        <img src="https://www.sap.com/dam/application/shared/logos/sap-logo-svg.svg/sap-logo-svg.svg" alt="SAP" style={{ height: 28, marginBottom: sp.m }} />
        <div style={{ fontSize: 'var(--sapFontHeader3Size)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', fontFamily: 'var(--sapFontFamily)', marginBottom: sp.xs }}>TM Planning Refinement</div>
        <div style={{ ...body, color: 'var(--sapContent_LabelColor)' }}>Select your profile to continue</div>
      </div>
      {MOCK_USERS.map(u => (
        <button key={u.name} onClick={() => onLogin(u)} style={{
          display: 'flex', alignItems: 'center', gap: sp.m, width: '100%',
          padding: sp.m, background: 'var(--sapBackgroundColor)', border: '1px solid var(--sapList_BorderColor)',
          borderRadius: '0.5rem', cursor: 'pointer', marginBottom: sp.s, textAlign: 'left',
          fontFamily: 'var(--sapFontFamily)',
        }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: u.role === 'planner' ? 'var(--sapAccentColor6, #6a28ca)' : 'var(--sapAccentColor5, #0f828f)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'var(--sapFontBoldWeight)', fontSize: 14, flexShrink: 0 }}>
            {u.initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ ...body, fontWeight: 'var(--sapFontBoldWeight)' }}>{u.name}</div>
            <div style={{ ...label, color: 'var(--sapContent_LabelColor)', textTransform: 'capitalize' }}>{u.role}</div>
          </div>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: u.role === 'planner' ? 'var(--sapInformativeBackground, #e8f4ff)' : 'var(--sapSuccessBackground, #f5fae5)', color: u.role === 'planner' ? 'var(--sapInformativeColor)' : 'var(--sapPositiveColor)', fontWeight: 600, textTransform: 'capitalize', fontFamily: 'var(--sapFontFamily)' }}>
            {u.role}
          </span>
        </button>
      ))}
    </div>
  </div>
);

// ─── Admin top tabs ───────────────────────────────────────────────────────────
type AdminTab = 'system-setup' | 'rule-form' | 'rule-library' | 'rule-profiles';
const ADMIN_TABS: Array<{ key: AdminTab; label: string }> = [
  { key: 'system-setup',  label: 'System Setup' },
  { key: 'rule-form',     label: 'Rule Form' },
  { key: 'rule-library',  label: 'Rule Library' },
  { key: 'rule-profiles', label: 'Rule Profiles' },
];

// ─── Planner top tabs ─────────────────────────────────────────────────────────
type PlannerTab = 'session-start' | 'planning-overview' | 'rule-evaluation' | 'proposal-review' | 'change-summary';
const PLANNER_TABS: Array<{ key: PlannerTab; label: string }> = [
  { key: 'session-start',    label: 'Session Start' },
  { key: 'planning-overview', label: 'Planning Overview' },
  { key: 'rule-evaluation',  label: 'Rule Evaluation' },
  { key: 'proposal-review',  label: 'Proposal Review' },
  { key: 'change-summary',   label: 'Change Summary' },
];

// ─── Shared horizontal tab bar ────────────────────────────────────────────────
export function TabBar<T extends string>({ tabs, active, onSelect, unlocked }: {
  tabs: Array<{ key: T; label: string }>;
  active: T;
  onSelect: (k: T) => void;
  unlocked: T[];
}) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--sapList_BorderColor)', background: 'var(--sapObjectHeader_Background)', paddingLeft: sp.l }}>
      {tabs.map(t => {
        const isActive = t.key === active;
        const isEnabled = unlocked.includes(t.key);
        return (
          <button key={t.key} disabled={!isEnabled} onClick={() => isEnabled && onSelect(t.key)} style={{
            padding: `${sp.m} ${sp.l}`,
            background: 'transparent', border: 'none', cursor: isEnabled ? 'pointer' : 'not-allowed',
            borderBottom: isActive ? '2px solid var(--sapBrandColor)' : '2px solid transparent',
            color: !isEnabled ? 'var(--sapContent_DisabledTextColor, #ccc)' : isActive ? 'var(--sapBrandColor)' : 'var(--sapTextColor)',
            fontSize: 'var(--sapFontSize)', fontWeight: isActive ? 'var(--sapFontBoldWeight)' : 'normal',
            fontFamily: 'var(--sapFontFamily)', whiteSpace: 'nowrap',
          }}>{t.label}</button>
        );
      })}
    </div>
  );
}

// ─── Page header ──────────────────────────────────────────────────────────────
export const PageHeader: React.FC<{ title: string; subtitle?: string; right?: React.ReactNode }> = ({ title, subtitle, right }) => (
  <div style={{ paddingTop: sp.m, paddingBottom: sp.m, paddingLeft: sp.l, paddingRight: sp.l, borderBottom: '1px solid var(--sapList_BorderColor)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: sp.m }}>
    <div>
      <div style={{ fontSize: 'var(--sapFontHeader4Size)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', fontFamily: 'var(--sapFontFamily)', marginBottom: subtitle ? sp.xs : 0 }}>{title}</div>
      {subtitle && <div style={{ ...body, color: 'var(--sapContent_LabelColor)' }}>{subtitle}</div>}
    </div>
    {right && <div style={{ flexShrink: 0 }}>{right}</div>}
  </div>
);

// ─── Simple dialog overlay ────────────────────────────────────────────────────
export const Dialog: React.FC<{ open: boolean; title: string; onClose: () => void; footer?: React.ReactNode; children: React.ReactNode; width?: number }> = ({ open, title, onClose, footer, children, width = 440 }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: sp.m }} onClick={onClose}>
      <div style={{ ...card, width, maxWidth: '100%', background: 'var(--sapBaseColor, #fff)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: `${sp.m} ${sp.l}`, borderBottom: '1px solid var(--sapList_BorderColor)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ ...body, fontWeight: 'var(--sapFontBoldWeight)' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--sapContent_LabelColor)' }}>×</button>
        </div>
        <div style={{ padding: `${sp.m} ${sp.l}` }}>{children}</div>
        {footer && <div style={{ padding: `${sp.s} ${sp.l} ${sp.m}`, borderTop: '1px solid var(--sapList_BorderColor)', display: 'flex', justifyContent: 'flex-end', gap: sp.s }}>{footer}</div>}
      </div>
    </div>
  );
};

// ─── Btn helper ───────────────────────────────────────────────────────────────
export const Btn: React.FC<{ label: string; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; onClick?: () => void; disabled?: boolean; icon?: string }> = ({ label, variant = 'ghost', onClick, disabled, icon }) => {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--sapButton_Emphasized_Background, #0070f2)', color: '#fff', border: '1px solid var(--sapButton_Emphasized_BorderColor, #0070f2)' },
    secondary: { background: 'var(--sapButton_Background, #fff)', color: 'var(--sapButton_TextColor)', border: '1px solid var(--sapButton_BorderColor, #ccc)' },
    ghost: { background: 'transparent', color: 'var(--sapButton_TextColor)', border: '1px solid transparent' },
    danger: { background: 'var(--sapButton_Negative_Background, #bb0000)', color: '#fff', border: '1px solid var(--sapButton_Negative_BorderColor, #bb0000)' },
  };
  return (
    <button disabled={disabled} onClick={onClick} style={{
      padding: `${sp.s} ${sp.m}`, borderRadius: '0.25rem', cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: 'var(--sapFontSize)', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)',
      opacity: disabled ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', gap: sp.xs,
      ...styles[variant],
    }}>
      {icon && <span>{icon}</span>}{label}
    </button>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
const AldiTMPlanningPage: React.FC = () => {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [popOpen, setPopOpen] = useState(false);
  const [popOpener, setPopOpener] = useState<HTMLElement | null>(null);
  const [setupActive, setSetupActive] = useState(true);
  const [rules, setRules] = useState<RuleCandidate[]>(INITIAL_RULES.map(r => ({ ...r })));
  const [profiles, setProfiles] = useState<RuleProfile[]>(INITIAL_PROFILES.map(p => ({ ...p })));

  if (!auth) return <ThemeProvider><Login onLogin={setAuth} /></ThemeProvider>;

  return (
    <ThemeProvider>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--sapBackgroundColor)' }}>
        <ShellBar
          primaryTitle="TM Planning Refinement"
          secondaryTitle={auth.role === 'planner' ? 'Planner' : 'Administration'}
          logo={<img src="https://www.sap.com/dam/application/shared/logos/sap-logo-svg.svg/sap-logo-svg.svg" alt="SAP" style={{ height: 28 }} />}
          profile={<Avatar slot="profile" colorScheme={auth.colorScheme as any} shape="Circle" size="XS" initials={auth.initials} accessibleName={auth.name} />}
          onProfileClick={e => { setPopOpener(e.detail.targetRef as HTMLElement); setPopOpen(true); }}
        />
        <ResponsivePopover open={popOpen} opener={popOpener ?? undefined} placement="Bottom" onClose={() => setPopOpen(false)}>
          <List>
            <ListItemStandard icon="person-placeholder">{auth.name}</ListItemStandard>
            <ListItemStandard icon="refresh" onClick={() => { setPopOpen(false); setAuth(null); }}>Switch User</ListItemStandard>
            <ListItemStandard icon="log" onClick={() => { setPopOpen(false); setAuth(null); }}>Sign Out</ListItemStandard>
          </List>
        </ResponsivePopover>

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {auth.role === 'admin'
            ? <AdminSection setupActive={setupActive} setSetupActive={setSetupActive} rules={rules} setRules={setRules} profiles={profiles} setProfiles={setProfiles} />
            : <PlannerSection setupActive={setupActive} profiles={profiles} />}
        </div>
      </div>
    </ThemeProvider>
  );
};

export default AldiTMPlanningPage;

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN SECTION
// ─────────────────────────────────────────────────────────────────────────────
import { RuleFormView } from './AdminViews';
import { RuleLibraryView } from './AdminViews';
import { RuleProfilesView } from './AdminViews';
import { SystemSetupView } from './AdminViews';

const AdminSection: React.FC<{
  setupActive: boolean; setSetupActive: (v: boolean) => void;
  rules: RuleCandidate[]; setRules: (r: RuleCandidate[]) => void;
  profiles: RuleProfile[]; setProfiles: (p: RuleProfile[]) => void;
}> = ({ setupActive, setSetupActive, rules, setRules, profiles, setProfiles }) => {
  const [tab, setTab] = useState<AdminTab>('rule-library');
  const ALL: AdminTab[] = ['system-setup', 'rule-form', 'rule-library', 'rule-profiles'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <TabBar tabs={ADMIN_TABS} active={tab} onSelect={setTab} unlocked={ALL} />
      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'system-setup'  && <SystemSetupView active={setupActive} setActive={setSetupActive} />}
        {tab === 'rule-form'     && <RuleFormView rules={rules} setRules={setRules} />}
        {tab === 'rule-library'  && <RuleLibraryView rules={rules} setRules={setRules} profiles={profiles} />}
        {tab === 'rule-profiles' && <RuleProfilesView profiles={profiles} setProfiles={setProfiles} rules={rules} />}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PLANNER SECTION
// ─────────────────────────────────────────────────────────────────────────────
import { SessionStartView } from './PlannerViews';
import { PlanningOverviewView } from './PlannerViews';
import { RuleEvaluationView } from './PlannerViews';
import { ProposalReviewView } from './PlannerViews';
import { ChangeSummaryView } from './PlannerViews';
import { INITIAL_PACKAGES, EVAL_RULE_DESCRIPTORS } from './data';
import type { RecPackage, PackageState } from './types';

const PlannerSection: React.FC<{ setupActive: boolean; profiles: RuleProfile[] }> = ({ setupActive, profiles }) => {
  const [tab, setTab] = useState<PlannerTab>('session-start');
  const [unlocked, setUnlocked] = useState<PlannerTab[]>(['session-start']);
  const [packages, setPackages] = useState<RecPackage[]>(INITIAL_PACKAGES.map(p => ({ ...p })));
  const [evalDescriptors, setEvalDescriptors] = useState(EVAL_RULE_DESCRIPTORS.map(r => ({ ...r })));
  const [saved, setSaved] = useState(false);

  const unlock = (t: PlannerTab) => {
    setUnlocked(prev => prev.includes(t) ? prev : [...prev, t]);
    setTab(t);
  };

  const updatePkg = (id: string, state: PackageState) =>
    setPackages(prev => prev.map(p => p.id === id ? { ...p, state } : p));

  const handleNewSession = () => {
    setTab('session-start');
    setUnlocked(['session-start']);
    setPackages(INITIAL_PACKAGES.map(p => ({ ...p })));
    setEvalDescriptors(EVAL_RULE_DESCRIPTORS.map(r => ({ ...r })));
    setSaved(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <TabBar tabs={PLANNER_TABS} active={tab} onSelect={setTab} unlocked={unlocked} />
      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'session-start'    && <SessionStartView setupActive={setupActive} profiles={profiles} onLoaded={() => unlock('planning-overview')} />}
        {tab === 'planning-overview' && <PlanningOverviewView onProceed={() => unlock('rule-evaluation')} />}
        {tab === 'rule-evaluation'  && <RuleEvaluationView descriptors={evalDescriptors} setDescriptors={setEvalDescriptors} onStartReview={() => unlock('proposal-review')} />}
        {tab === 'proposal-review'  && <ProposalReviewView packages={packages} updatePkg={updatePkg} onProceed={() => unlock('change-summary')} />}
        {tab === 'change-summary'   && <ChangeSummaryView packages={packages} saved={saved} setSaved={setSaved} onNewSession={handleNewSession} />}
      </div>
    </div>
  );
};
