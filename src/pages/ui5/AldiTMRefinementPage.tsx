'use client';
// SAP TM Planning Refinement Assistant — Aldi Süd
// Redesign per v2.2 brief. Six views; promotion in progress to hi-fi.

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Title,
  Text,
  Tag,
  Button,
  Icon,
  ObjectStatus,
  MessageStrip,
  Toast,
  TextArea,
  Label,
  FlexBox,
  IllustratedMessage,
  BusyIndicator,
  Select,
  Option,
  CheckBox,
  // V6 Fiori-compliance additions
  DynamicPage,
  DynamicPageTitle,
  DynamicPageHeader,
  Bar,
  SegmentedButton,
  SegmentedButtonItem,
  TabContainer,
  Tab,
  Form,
  FormGroup,
  FormItem,
  List,
  ListItemStandard,
  ListItemCustom,
  Table,
  TableHeaderRow,
  TableHeaderCell,
  TableRow,
  TableCell,
  Panel,
  Card,
  CardHeader,
  FilterBar,
  FilterGroupItem,
  Avatar,
  ShellBar,
  ShellBarItem,
  Input,
  Toolbar,
  ToolbarSpacer,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-react/styles.css';
import '@ui5/webcomponents-icons/dist/AllIcons.js';
import '@ui5/webcomponents-fiori/dist/illustrations/AllIllustrations.js';

import { SideNavigation } from '../../components/organisms/SideNavigation';
import type { NavItem } from '../../components/organisms/SideNavigation';
import { Icon as FioriIcon } from '../../components/atoms/Icon';

// ─── SAP logo — official Fiori-compliant asset ────────────────────────────────
const SapLogo: React.FC = () => (
  <img src="/sap-logo.svg" alt="SAP" style={{ height: 24, width: 'auto', display: 'block' }} />
);

// ─── ShellBar action button — canonical .fd-shellbar__btn ─────────────────────
interface ShellActionButtonProps {
  iconName: string;
  ariaLabel: string;
  onClick?: () => void;
}
const ShellActionButton: React.FC<ShellActionButtonProps> = ({ iconName, ariaLabel, onClick }) => (
  <button type="button" className="fd-shellbar__btn" aria-label={ariaLabel} title={ariaLabel} onClick={onClick}>
    <FioriIcon name={iconName} size={18} ariaLabel={ariaLabel} />
  </button>
);

// ─── Tokens ───────────────────────────────────────────────────────────────────
const sp = {
  xs: 'var(--sapSpacingXSmallSize, 0.25rem)',
  s: 'var(--sapSpacingSmallSize, 0.5rem)',
  m: 'var(--sapSpacingMediumSize, 1rem)',
  l: 'var(--sapSpacingLargeSize, 2rem)',
  g: 'var(--sapContent_GridGutter, 1rem)',
};

const cardSurface: React.CSSProperties = {
  borderRadius: 'var(--sapTile_BorderCornerRadius, 12px)',
  boxShadow: 'var(--sapContent_Shadow0)',
  background: 'var(--sapTile_Background)',
  border: '1px solid var(--sapTile_BorderColor)',
};

const labelText: React.CSSProperties = {
  fontFamily: 'var(--sapFontFamily)',
  fontSize: 'var(--sapFontSmallSize)',
  color: 'var(--sapContent_LabelColor)',
};

const bodyText: React.CSSProperties = {
  fontFamily: 'var(--sapFontFamily)',
  fontSize: 'var(--sapFontSize)',
  color: 'var(--sapTextColor)',
};

const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--sapFontFamily)',
  fontSize: 'var(--sapFontSmallSize)',
  fontWeight: 'var(--sapFontBoldWeight, 700)',
  color: 'var(--sapContent_LabelColor)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

// ─── Shared PageTitle atom — canonical Fiori page-header pattern ──────────────
// Used by all 6 views for visual consistency.
interface PageTitleProps {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}
const PageTitle: React.FC<PageTitleProps> = ({ title, subtitle, trailing }) => (
  <div
    style={{
      background: 'var(--sapObjectHeader_Background, #fff)',
      borderBottom: '1px solid var(--sapList_BorderColor)',
      padding: `${sp.m} ${sp.l}`,
    }}
  >
    <FlexBox alignItems="Start" justifyContent="SpaceBetween" style={{ gap: sp.m, flexWrap: 'wrap' }}>
      <div>
        <Title level="H2" style={{ fontWeight: 700 }}>{title}</Title>
        {subtitle && (
          <Text style={{ ...labelText, display: 'block', marginTop: sp.xs }}>
            {subtitle}
          </Text>
        )}
      </div>
      {trailing && (
        <FlexBox alignItems="Center" style={{ gap: sp.s, flexWrap: 'wrap' }}>
          {trailing}
        </FlexBox>
      )}
    </FlexBox>
  </div>
);

// ─── View routing ─────────────────────────────────────────────────────────────
type ViewKey = 'session-start' | 'overview' | 'rule-evaluation' | 'review' | 'changes' | 'rules';

const VIEWS: { key: ViewKey; label: string; sub: string; icon: string; status: 'lo-fi' | 'hi-fi' | 'pending' }[] = [
  { key: 'session-start', label: '1. Session Start', sub: 'Profile + Rule selection', icon: 'initiative', status: 'hi-fi' },
  { key: 'overview', label: '2. Planning Overview', sub: 'TM objects', icon: 'overview-chart', status: 'hi-fi' },
  { key: 'rule-evaluation', label: '3. Rule Evaluation', sub: 'Order + run active rules', icon: 'task', status: 'hi-fi' },
  { key: 'review', label: '4. Proposal Review', sub: 'Accept or reject packages', icon: 'inspect', status: 'hi-fi' },
  { key: 'changes', label: '5. Change Summary', sub: 'Save / discard', icon: 'save', status: 'hi-fi' },
  // 6. Audit & Traceability is parked for Phase 0 / MVP 1. Spec preserved at
  //    design-docs/audit-traceability-spec.md. To re-enable: re-add 'audit' to ViewKey,
  //    VIEWS, STEP_ORDER, and the route switch in AldiTMRefinementPage.
];

// Rule Maintenance is a separate admin workflow — reached via the top-right
// "Rule maintenance" entry point in the sub-header, NOT a planner workflow step.
const RULES_VIEW_META = { key: 'rules' as const, label: 'Rule Maintenance', sub: 'Validation pipeline + planner POV' };

// ─── Auth / Role ──────────────────────────────────────────────────────────────

type AppRole = 'planner' | 'admin';

interface AuthState {
  loggedIn: boolean;
  name: string;
  initials: string;
  colorScheme: string;
  role: AppRole;
}

const MOCK_USERS: Array<AuthState & { loggedIn: true }> = [
  { loggedIn: true, name: 'M. Schmidt',  initials: 'MS', colorScheme: 'Accent6', role: 'planner' },
  { loggedIn: true, name: 'H. Fischer',  initials: 'HF', colorScheme: 'Accent2', role: 'admin'   },
];

// ─── Login screen ─────────────────────────────────────────────────────────────

const LoginScreen: React.FC<{ onLogin: (user: AuthState) => void }> = ({ onLogin }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--sapBackgroundColor)',
    }}>
      <div style={{
        width: 420, padding: '40px 48px',
        background: 'var(--sapTile_Background, #fff)',
        border: '1px solid var(--sapTile_BorderColor)',
        borderRadius: 'var(--sapTile_BorderCornerRadius, 12px)',
        boxShadow: 'var(--sapContent_Shadow1)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: sp.m,
      }}>
        {/* Logo */}
        <img src={`${import.meta.env.BASE_URL}sap-logo.svg`} alt="SAP" style={{ height: 32, marginBottom: sp.xs }} />

        <div style={{ textAlign: 'center' }}>
          <Title level="H3" style={{ marginBottom: sp.xs }}>TM Planning Refinement</Title>
          <Text style={{ ...labelText, display: 'block' }}>ALDI Süd · Phase 0 Demo</Text>
        </div>

        <div style={{ width: '100%', borderTop: '1px solid var(--sapList_BorderColor)', paddingTop: sp.m }}>
          <Label style={{ display: 'block', marginBottom: sp.s }}>Sign in as</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.s }}>
            {MOCK_USERS.map((u, i) => (
              <div
                key={i}
                onClick={() => setSelectedIdx(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: sp.m,
                  padding: `${sp.s} ${sp.m}`,
                  border: `2px solid ${selectedIdx === i ? 'var(--sapSelectedColor, #0070f2)' : 'var(--sapField_BorderColor)'}`,
                  borderRadius: 'var(--sapElement_BorderCornerRadius, 4px)',
                  background: selectedIdx === i ? 'var(--sapList_SelectionBackgroundColor, #e8f4ff)' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <Avatar initials={u.initials} colorScheme={u.colorScheme as any} size="S" />
                <div>
                  <Text style={{ fontWeight: 600, display: 'block' }}>{u.name}</Text>
                  <Label>{u.role === 'admin' ? 'Admin — Rule Maintenance + System Setup' : 'Planner — Planning sessions only'}</Label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button design="Emphasized" style={{ width: '100%', marginTop: sp.xs }}
          onClick={() => onLogin(MOCK_USERS[selectedIdx])}>
          Sign in
        </Button>

        <Text style={{ ...labelText, fontSize: 'var(--sapFontSmallSize)', textAlign: 'center', opacity: 0.7 }}>
          Demo mode — no real authentication. Select a role to continue.
        </Text>
      </div>
    </div>
  );
};

// ─── Domain types — Recommendation Packages ───────────────────────────────────
// Single-head queue model: packages are reviewed in order, only the head is editable.
// State machine:
//   pending → engine hasn't computed a verdict yet (rare; mostly start states)
//   ready → engine produced a verdict; editable at the head, locked elsewhere
//   evaluating → engine is recomputing (planner-triggered re-eval)
//   nosol → rule fired but engine couldn't find an admissible target; blocks the head
//   stale → invalidated by an upstream rejection
//   accepted | rejected | discarded → terminal
type PackageState =
  | 'pending'          // queued, no verdict yet
  | 'ready'            // verdict computed, editable only at head
  | 'evaluating'       // engine recomputing (after planner re-eval)
  | 'nosol'            // no admissible solution; blocks head
  | 'stale'            // upstream rejection invalidated this card
  | 'accepted'         // terminal — applied to the refined plan
  | 'rejected'         // terminal — explicitly refused
  | 'discarded';       // terminal — planner skipped (acknowledged nosol or discarded stale)

type RuleId = 'R-001' | 'R-002' | 'R-003' | 'R-004' | 'R-007';

type ObjectKind = 'FO' | 'FU' | 'Stop' | 'Resource';

interface AffectedObject {
  kind: ObjectKind;
  id: string;
  change: string;
}

interface RecPackage {
  id: string;
  title: string;
  ruleIds: RuleId[];
  ruleLabel: string;             // human label of the primary rule
  state: PackageState;
  staleCause?: { byPackageId: string; reason: string };
  nosolReason?: string;
  whyText: string;
  affected: AffectedObject[];
  before: string[];
  after: string[];
  actions: string[];             // ordered TM action descriptions
  validation: { check: string; passed: boolean }[];
  // dependencies — which packages, when accepted, will turn this one stale
  dependsOnObjects?: string[];
}

const RULE_LABELS: Record<RuleId, string> = {
  'R-001': 'Min pallets per stop ≥ 5',
  'R-002': 'Capacity tolerance ±5%',
  'R-003': 'FO consolidation (same stage)',
  'R-004': 'Cancel single-stop FO under 5 pallets',
  'R-007': 'Time-window violation guard',
};

// ─── Mock data: 8 packages, diverse states ────────────────────────────────────
const INITIAL_PACKAGES: RecPackage[] = [
  {
    id: 'PKG-01',
    title: 'Remove stop S-14 from FO-001',
    ruleIds: ['R-001'],
    ruleLabel: RULE_LABELS['R-001'],
    state: 'accepted',
    whyText: 'Stop S-14 carries only 3 pallets, below the 5-pallet minimum. The stop fits the next-day route SA-12 with 18 pallets total — moving it preserves service window and removes a low-utilization stop.',
    affected: [
      { kind: 'FO', id: 'FO-001', change: '-1 stop, -3 pallets' },
      { kind: 'Stop', id: 'S-14', change: 'reassigned to FO-006 (next day)' },
    ],
    before: ['FO-001 · 8 stops · 24 pallets', 'FO-006 · 5 stops · 18 pallets'],
    after: ['FO-001 · 7 stops · 21 pallets', 'FO-006 · 6 stops · 22 pallets'],
    actions: [
      'Remove Stop S-14 from FO-001',
      'Append Stop S-14 to FO-006',
      'Recompute route distance for both FOs',
    ],
    validation: [
      { check: 'Admissible target exists (FO-006)', passed: true },
      { check: 'Service window preserved', passed: true },
      { check: 'Resource working time within bounds', passed: true },
    ],
  },
  {
    id: 'PKG-02',
    title: 'Reassign FU-2107 to FO-014 (capacity tolerance ±5%)',
    ruleIds: ['R-002'],
    ruleLabel: RULE_LABELS['R-002'],
    state: 'accepted',
    whyText: 'FO-014 has 3 pallets of headroom against the 30-pallet cap. Reassigning FU-2107 (1 pallet) brings it to 28/30 — within tolerance and avoids spawning a new FO.',
    affected: [
      { kind: 'FU', id: 'FU-2107', change: 'moved FO-016 → FO-014' },
      { kind: 'FO', id: 'FO-014', change: '+1 FU, +1 pallet' },
    ],
    before: ['FO-014 · 27 pallets · 90% cap', 'FO-016 · 14 pallets · 47% cap'],
    after: ['FO-014 · 28 pallets · 93% cap', 'FO-016 · 13 pallets · 43% cap'],
    actions: ['Reassign FU-2107 from FO-016 to FO-014', 'Update load plan for FO-014'],
    validation: [
      { check: 'Capacity within ±5% tolerance', passed: true },
      { check: 'Stage compatibility', passed: true },
    ],
  },
  {
    id: 'PKG-03',
    title: 'Consolidate FO-002 into FO-001 (same stage)',
    ruleIds: ['R-003'],
    ruleLabel: RULE_LABELS['R-003'],
    state: 'ready',
    whyText: 'FO-001 and FO-002 share stage S-08 → S-12. Combined load (28 pallets) is within the 30-pallet FO capacity. Consolidating eliminates one freight order.',
    affected: [
      { kind: 'FO', id: 'FO-001', change: '+3 stops, +51 pallets' },
      { kind: 'FO', id: 'FO-002', change: 'cancelled' },
      { kind: 'FU', id: 'FU-2241..2253', change: 'reassigned to FO-001' },
    ],
    before: ['FO-001 · 8 stops · 24 pallets', 'FO-002 · 3 stops · 11 pallets'],
    after: ['FO-001 · 11 stops · 28 pallets', 'FO-002 · cancelled'],
    actions: [
      'Reassign FU-2241..2253 from FO-002 to FO-001',
      'Append stops S-08..S-12 to FO-001',
      'Cancel FO-002',
    ],
    validation: [
      { check: 'Combined load within FO-001 capacity', passed: true },
      { check: 'Stage match', passed: true },
      { check: 'Service window preserved', passed: true },
      { check: 'Resource working time within bounds', passed: true },
    ],
    dependsOnObjects: ['FO-001', 'FO-002'],
  },
  {
    id: 'PKG-04',
    title: 'Cancel FO-005 (single-stop, 4 pallets)',
    ruleIds: ['R-004'],
    ruleLabel: RULE_LABELS['R-004'],
    state: 'ready',
    whyText: 'FO-005 is a single-stop freight order with 4 pallets — under the 5-pallet threshold. The 4 pallets fit FO-009 which already serves the same stage on the same day.',
    affected: [
      { kind: 'FO', id: 'FO-005', change: 'cancelled' },
      { kind: 'FU', id: 'FU-2301..2304', change: 'reassigned to FO-009' },
    ],
    before: ['FO-009 · 6 stops · 22 pallets', 'FO-005 · 1 stop · 4 pallets'],
    after: ['FO-009 · 7 stops · 26 pallets', 'FO-005 · cancelled'],
    actions: [
      'Reassign FU-2301..2304 from FO-005 to FO-009',
      'Append Stop S-21 to FO-009',
      'Cancel FO-005',
    ],
    validation: [
      { check: 'FO-009 capacity sufficient', passed: true },
      { check: 'Service window preserved', passed: true },
    ],
    dependsOnObjects: ['FO-009', 'FO-005'],
  },
  {
    id: 'PKG-05',
    title: 'Re-sequence stops on FO-013 (time-window guard)',
    ruleIds: ['R-007'],
    ruleLabel: RULE_LABELS['R-007'],
    state: 'ready',
    whyText: 'Optimizer placed Stop S-31 at position 4. Time-window for S-31 is 10:00–12:00; current ETA is 12:18 (18 min late). Re-sequencing to position 2 puts ETA at 11:24, within window.',
    affected: [
      { kind: 'FO', id: 'FO-013', change: 'stop sequence changed' },
      { kind: 'Stop', id: 'S-31', change: 'position 4 → position 2' },
    ],
    before: ['FO-013 sequence: S-29, S-30, S-32, S-31, S-33', 'S-31 ETA: 12:18 (late)'],
    after: ['FO-013 sequence: S-29, S-31, S-30, S-32, S-33', 'S-31 ETA: 11:24 (in window)'],
    actions: ['Re-sequence stops on FO-013: S-31 → position 2', 'Recompute ETAs'],
    validation: [
      { check: 'All stop time-windows respected', passed: true },
      { check: 'Total route distance within +2%', passed: true },
    ],
  },
  {
    id: 'PKG-06',
    title: 'Remove stop S-19 from FO-002',
    ruleIds: ['R-001'],
    ruleLabel: RULE_LABELS['R-001'],
    state: 'ready',
    whyText: 'Stop S-19 carries 4 pallets, below the 5-pallet minimum. Best alternative target is FO-002, same day, same stage.',
    affected: [
      { kind: 'FO', id: 'FO-002', change: '+1 stop, +4 pallets' },
      { kind: 'Stop', id: 'S-19', change: 'reassigned' },
    ],
    before: ['Source FO · 5 stops · 18 pallets', 'FO-002 · 3 stops · 11 pallets'],
    after: ['Source FO · 4 stops · 14 pallets', 'FO-002 · 4 stops · 16 pallets'],
    actions: ['Remove Stop S-19 from source FO', 'Append Stop S-19 to FO-002'],
    validation: [{ check: 'Admissible target exists', passed: true }],
    dependsOnObjects: ['FO-002'],
  },
  {
    id: 'PKG-07',
    title: 'Reassign FU-2418 (capacity tolerance ±5%)',
    ruleIds: ['R-002'],
    ruleLabel: RULE_LABELS['R-002'],
    state: 'nosol',
    nosolReason: 'No admissible target FO has both stage-compatibility and capacity headroom for FU-2418 (820 kg). All same-stage FOs are at or above 100% capacity.',
    whyText: 'Rule R-002 fired because FU-2418 sits in an over-capacity FO, but no destination FO satisfies both stage and capacity constraints.',
    affected: [{ kind: 'FU', id: 'FU-2418', change: 'no admissible target' }],
    before: [],
    after: [],
    actions: [],
    validation: [],
  },
  {
    id: 'PKG-08',
    title: 'Remove stop S-22 from FO-018',
    ruleIds: ['R-001'],
    ruleLabel: RULE_LABELS['R-001'],
    state: 'ready',
    whyText: 'Stop S-22 carries 2 pallets. Same-day route FO-020 has compatible stage and 4 pallets of headroom.',
    affected: [
      { kind: 'FO', id: 'FO-018', change: '-1 stop, -2 pallets' },
      { kind: 'Stop', id: 'S-22', change: 'reassigned to FO-020' },
    ],
    before: ['FO-018 · 6 stops · 20 pallets', 'FO-020 · 4 stops · 18 pallets'],
    after: ['FO-018 · 5 stops · 18 pallets', 'FO-020 · 5 stops · 20 pallets'],
    actions: ['Remove Stop S-22 from FO-018', 'Append Stop S-22 to FO-020'],
    validation: [
      { check: 'Admissible target exists (FO-020)', passed: true },
      { check: 'Service window preserved', passed: true },
    ],
  },
];

// ─── Header constants ─────────────────────────────────────────────────────────
const TM_PROFILE = 'ALDI-DE-South-Daily';
const RULE_PROFILE = 'DE-South Standard (v3.4)';
const PLANNER = 'M. Schmidt';
const SESSION_ID = 'TM-Session-4821';

// ─── Shared helpers ───────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ state: PackageState }> = ({ state }) => {
  switch (state) {
    case 'accepted':
      return <ObjectStatus state="Positive" icon={<Icon name="accept" />}>Accepted</ObjectStatus>;
    case 'rejected':
      return <ObjectStatus state="Critical" icon={<Icon name="decline" />}>Rejected</ObjectStatus>;
    case 'discarded':
      return <ObjectStatus state="None" icon={<Icon name="sys-cancel" />}>Discarded</ObjectStatus>;
    case 'stale':
      return <ObjectStatus state="Critical" icon={<Icon name="alert" />}>Stale</ObjectStatus>;
    case 'nosol':
      return <ObjectStatus state="Negative" icon={<Icon name="border" />}>No solution</ObjectStatus>;
    case 'evaluating':
      return <ObjectStatus state="Information" icon={<Icon name="synchronize" />}>Evaluating…</ObjectStatus>;
    case 'pending':
      return <ObjectStatus state="None">Pending</ObjectStatus>;
    case 'ready':
    default:
      return <ObjectStatus state="Information">Ready</ObjectStatus>;
  }
};

const ObjectKindIcon: React.FC<{ kind: ObjectKind }> = ({ kind }) => {
  const map: Record<ObjectKind, string> = {
    FO: 'shipping-status',
    FU: 'product',
    Stop: 'map-2',
    Resource: 'employee',
  };
  return <FioriIcon name={map[kind]} size={14} ariaLabel={kind} />;
};

// ============================================================================
// VIEW 1 — Session Start (HI-FI)
// Three-step wizard scaffold (Selection profile → Rule profile → Pre-load).
// Lock conflicts surface as structured rows with avatar, since-timestamp,
// stage corridor, pallet count, and an explicit skip vs. blocking state.
// ============================================================================

interface LockConflict {
  foId: string;
  planner: string;
  initials: string;
  since: string;          // HH:mm
  stage: string;          // e.g. "S-08 → S-12"
  stops: number;
  pallets: number;
}

const LOCK_CONFLICTS: LockConflict[] = [
  { foId: 'FO-014', planner: 'P. Klein',  initials: 'PK', since: '08:42', stage: 'S-08 → S-12', stops: 3, pallets: 51 },
  { foId: 'FO-016', planner: 'S. Wagner', initials: 'SW', since: '07:15', stage: 'S-21 → S-26', stops: 5, pallets: 64 },
];

interface StepCardProps {
  num: number;
  title: string;
  subtitle?: string;
  done?: boolean;
  children: React.ReactNode;
}
const StepCard: React.FC<StepCardProps> = ({ num, title, subtitle, done, children }) => (
  <div style={{ ...cardSurface, padding: sp.m }}>
    <FlexBox alignItems="Center" style={{ gap: sp.s, marginBottom: sp.s }}>
      <div
        style={{
          width: 28, height: 28, borderRadius: '50%',
          background: done ? 'var(--sapPositiveColor)' : 'var(--sapBrandColor, #0a6ed1)',
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 'var(--sapFontBoldWeight, 700)',
          fontSize: 'var(--sapFontSmallSize)',
          flexShrink: 0,
        }}
        aria-hidden
      >
        {done ? '✓' : num}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Title level="H5">{title}</Title>
        {subtitle && (
          <Text style={{ ...labelText, display: 'block', marginTop: '2px' }}>{subtitle}</Text>
        )}
      </div>
    </FlexBox>
    <div style={{ paddingLeft: 36 }}>{children}</div>
  </div>
);

interface KpiBlockProps { label: string; value: string; tone?: 'default' | 'warning' }
const KpiBlock: React.FC<KpiBlockProps> = ({ label, value, tone = 'default' }) => (
  <div>
    <Text style={labelText}>{label}</Text>
    <Title
      level="H3"
      style={{
        marginTop: '2px',
        color: tone === 'warning' ? 'var(--sapCriticalTextColor, #b25500)' : undefined,
      }}
    >
      {value}
    </Title>
  </div>
);

const View1SessionStart: React.FC<{ onSessionLoaded: () => void; setupStatus: SetupStatus }> = ({ onSessionLoaded, setupStatus }) => {
  const [tmProfile, setTmProfile] = useState('ALDI-DE-South-Daily');
  const [ruleProfile, setRuleProfile] = useState('DE-South Standard (v3.4)');
  const [showRuleList, setShowRuleList] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (m: string) => {
    setToastMessage(m);
    setToastOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: `-${sp.l}` }}>
      {/* Header band — parallel to V3 detail-pane header */}
      <PageTitle
        title="Start a Planning Refinement Session"
        subtitle="Configure the data slice and rule profile, then load the planning session."
      />

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: sp.l }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: sp.m }}>
          {/* Step 1 */}
          <StepCard
            num={1}
            title="Profile Set"
            done
          >
            <Label style={{ display: 'block', marginBottom: sp.xs }}>TM Profile + Layout Set</Label>
            <Select
              style={{ width: 480, maxWidth: '100%' }}
              onChange={(e) => {
                const txt = (e.detail.selectedOption as HTMLElement | null)?.textContent;
                if (txt) setTmProfile(txt.trim());
              }}
            >
              <Option selected={tmProfile === 'ALDI-DE-South-Daily'}>ALDI-DE-South-Daily</Option>
              <Option selected={tmProfile === 'ALDI-DE-North-Daily'}>ALDI-DE-North-Daily</Option>
              <Option selected={tmProfile === 'ALDI-DE-South-Weekend'}>ALDI-DE-South-Weekend</Option>
            </Select>
            <FlexBox alignItems="Center" style={{ gap: sp.l, marginTop: sp.s, flexWrap: 'wrap' }}>
              <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
                <Icon name="history" />
                <Text style={labelText}>Last used by you · 2026-05-18 14:02</Text>
              </FlexBox>
              <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
                <Icon name="appointment-2" />
                <Text style={labelText}>Planning Horizon: 2026-05-19 06:00 → 2026-05-20 06:00 · 24h</Text>
              </FlexBox>
            </FlexBox>
          </StepCard>

          {/* Step 2 */}
          <StepCard
            num={2}
            title="Rule Profile"
            done
          >
            <Label style={{ display: 'block', marginBottom: sp.xs }}>Profile</Label>
            <Select
              style={{ width: 480, maxWidth: '100%' }}
              onChange={(e) => {
                const txt = (e.detail.selectedOption as HTMLElement | null)?.textContent;
                if (txt) setRuleProfile(txt.trim());
              }}
            >
              <Option selected={ruleProfile === 'DE-South Standard (v3.4)'}>DE-South Standard (v3.4)</Option>
              <Option selected={ruleProfile === 'DE-South Strict (v1.2)'}>DE-South Strict (v1.2)</Option>
              <Option selected={ruleProfile === 'DE-North Standard (v2.1)'}>DE-North Standard (v2.1)</Option>
            </Select>
            <FlexBox alignItems="Center" style={{ gap: sp.l, marginTop: sp.s, flexWrap: 'wrap' }}>
              <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
                <Icon name="user-edit" />
                <Text style={labelText}>Approved by A. Müller · 2026-04-30</Text>
              </FlexBox>
              <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
                <Icon name="action-settings" />
                <Text style={labelText}>12 active rules</Text>
              </FlexBox>
              <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
                <Icon name="group" />
                <Text style={labelText}>Used by 8 planners</Text>
              </FlexBox>
            </FlexBox>
            <Button
              design="Transparent"
              icon={showRuleList ? 'navigation-down-arrow' : 'navigation-right-arrow'}
              onClick={() => setShowRuleList((v) => !v)}
              style={{ marginTop: sp.s }}
              aria-expanded={showRuleList}
            >
              {showRuleList ? 'Hide rule list' : 'Show rule list'}
            </Button>
            {showRuleList && (
              <div
                style={{
                  marginTop: sp.s,
                  paddingLeft: sp.m,
                  borderLeft: '2px solid var(--sapList_BorderColor)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: sp.xs,
                }}
              >
                {(Object.keys(RULE_LABELS) as RuleId[]).map((rid) => (
                  <FlexBox key={rid} alignItems="Center" style={{ gap: sp.xs }}>
                    <Icon name="accept" />
                    <Tag design="Set2" colorScheme="6">{rid}</Tag>
                    <Text style={bodyText}>{RULE_LABELS[rid]}</Text>
                  </FlexBox>
                ))}
                <Text style={{ ...labelText, marginTop: sp.xs }}>
                  + 7 more · view all in Rule Maintenance
                </Text>
              </div>
            )}
          </StepCard>
        </div>
      </div>

      {/* Sticky footer — parallel to V3 detail footer */}
      <div
        style={{
          padding: `${sp.s} ${sp.l}`,
          borderTop: '1px solid var(--sapList_BorderColor)',
          background: 'var(--sapObjectHeader_Background, #fff)',
        }}
      >
        <FlexBox
          alignItems="Center"
          justifyContent="SpaceBetween"
          style={{ gap: sp.s, flexWrap: 'wrap' }}
        >
          <Text style={labelText}>
            Loads the data slice into {SESSION_ID} so you can inspect it on the next step. Rule evaluation is planner-triggered later in step 3.
          </Text>
          {setupStatus !== 'active' && (
            <MessageStrip design="Warning" hideCloseButton style={{ width: '100%' }}>
              System setup is not complete. An admin must activate System Setup before planning sessions can start.
            </MessageStrip>
          )}
          <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
            <Button design="Transparent">Cancel</Button>
            <Button
              design="Emphasized"
              icon="play"
              iconEnd
              disabled={setupStatus !== 'active'}
              onClick={() => {
                showToast('Planning session loaded — proceed to Planning Overview.');
                onSessionLoaded();
              }}
            >
              Load planning session
            </Button>
          </FlexBox>
        </FlexBox>
      </div>

      <Toast
        open={toastOpen}
        duration={3000}
        placement="BottomCenter"
        onClose={() => setToastOpen(false)}
      >
        {toastMessage}
      </Toast>
    </div>
  );
};

// ============================================================================
// VIEW 2 — Planning Session Overview (HI-FI)
// ============================================================================

// Loaded TM objects — synthesized from synthetic20_tm_before.csv (20 real TM transportation orders).
// Short IDs (FO-001..FO-020) for table readability; sapId preserves the 11-digit SAP TM document ID
// for the hover tooltip. Stops/corridor parsed from the original Stop List string. utilization > 100
// means the FO breaches the capacity tolerance rule and shows as Locked.
interface LoadedFO {
  id: string;
  sapId: string;
  resource: string;
  resourceLabel: string;
  dc: string;
  stops: number;
  pallets: number;
  distanceKm: number;
  amount: number;
  utilization: number;
  corridor: string;
  lockedBy?: string;
}

const LOADED_FOS: LoadedFO[] = [
  { id: 'FO-001', sapId: '80000000000', resource: 'EBE_ALDI_31_DUMMY_33P_FRZ', resourceLabel: '31/DUMMY_33P_FRZ', dc: 'BD20', stops: 2, pallets: 20.92, distanceKm: 235.928, amount: 685.07, utilization: 84.06, corridor: 'S-42 → S-05' },
  { id: 'FO-002', sapId: '80000000001', resource: 'EBE_ALDI_02_DAY_37P', resourceLabel: '02/DAY_37P', dc: 'BD42', stops: 3, pallets: 23.09, distanceKm: 125.474, amount: 551.04, utilization: 90.68, corridor: 'S-04 → S-06' },
  { id: 'FO-003', sapId: '80000000002', resource: 'EBE_ALDI_03_NIGHT_37P', resourceLabel: '03/NIGHT_37P', dc: 'BD20', stops: 1, pallets: 34.35, distanceKm: 230.774, amount: 930.19, utilization: 72.68, corridor: 'S-06' },
  { id: 'FO-004', sapId: '80000000003', resource: 'EBE_ALDI_03_NIGHT_37P', resourceLabel: '03/NIGHT_37P', dc: 'BD20', stops: 3, pallets: 15.2, distanceKm: 178.767, amount: 695.04, utilization: 86.39, corridor: 'S-08 → S-38' },
  { id: 'FO-005', sapId: '80000000004', resource: 'EBE_ALDI_31_DUMMY_33P_FRZ', resourceLabel: '31/DUMMY_33P_FRZ', dc: 'BD42', stops: 1, pallets: 20.78, distanceKm: 113.089, amount: 533.25, utilization: 95.04, corridor: 'S-15' },
  { id: 'FO-006', sapId: '80000000005', resource: 'EBE_ALDI_30_DUMMY_33P_FRZ', resourceLabel: '30/DUMMY_33P_FRZ', dc: 'BD20', stops: 2, pallets: 20.47, distanceKm: 139.932, amount: 622.5, utilization: 90.08, corridor: 'S-27 → S-35' },
  { id: 'FO-007', sapId: '80000000006', resource: 'EBE_ALDI_32_DUMMY_33P_FRZ', resourceLabel: '32/DUMMY_33P_FRZ', dc: 'BD42', stops: 3, pallets: 20.38, distanceKm: 172.36, amount: 553.6, utilization: 83.62, corridor: 'S-53 → S-38' },
  { id: 'FO-008', sapId: '80000000007', resource: 'EBE_ALDI_32_DUMMY_33P_FRZ', resourceLabel: '32/DUMMY_33P_FRZ', dc: 'BD20', stops: 2, pallets: 24.58, distanceKm: 181.339, amount: 720.64, utilization: 91.14, corridor: 'S-07 → S-46' },
  { id: 'FO-009', sapId: '80000000008', resource: 'EBE_ALDI_31_DUMMY_33P_FRZ', resourceLabel: '31/DUMMY_33P_FRZ', dc: 'BD20', stops: 3, pallets: 35.16, distanceKm: 142.38, amount: 711.84, utilization: 97.99, corridor: 'S-14 → S-28' },
  { id: 'FO-010', sapId: '80000000009', resource: 'EBE_ALDI_04_NIGHT_37P', resourceLabel: '04/NIGHT_37P', dc: 'BD42', stops: 2, pallets: 23.66, distanceKm: 115.019, amount: 534.39, utilization: 75.76, corridor: 'S-20 → S-51' },
  { id: 'FO-011', sapId: '80000000010', resource: 'EBE_ALDI_04_DAY_37P', resourceLabel: '04/DAY_37P', dc: 'BD20', stops: 3, pallets: 30.6, distanceKm: 140.217, amount: 678.13, utilization: 93.9, corridor: 'S-20 → S-47' },
  { id: 'FO-012', sapId: '80000000011', resource: 'EBE_ALDI_01_NIGHT_37P', resourceLabel: '01/NIGHT_37P', dc: 'BD20', stops: 1, pallets: 12.98, distanceKm: 143.016, amount: 599.72, utilization: 96.08, corridor: 'S-33' },
  { id: 'FO-013', sapId: '80000000012', resource: 'EBE_ALDI_30_DUMMY_33P_FRZ', resourceLabel: '30/DUMMY_33P_FRZ', dc: 'BD42', stops: 1, pallets: 19.22, distanceKm: 205.373, amount: 606.01, utilization: 73.9, corridor: 'S-32' },
  { id: 'FO-014', sapId: '80000000013', resource: 'EBE_ALDI_01_DAY_37P', resourceLabel: '01/DAY_37P', dc: 'BD20', stops: 3, pallets: 31.71, distanceKm: 140.68, amount: 634.47, utilization: 103.36, corridor: 'S-37 → S-23', lockedBy: 'Capacity violation' },
  { id: 'FO-015', sapId: '80000000014', resource: 'EBE_ALDI_04_NIGHT_37P', resourceLabel: '04/NIGHT_37P', dc: 'BD42', stops: 1, pallets: 15.08, distanceKm: 79.508, amount: 379.61, utilization: 78.34, corridor: 'S-54' },
  { id: 'FO-016', sapId: '80000000015', resource: 'EBE_ALDI_31_DUMMY_33P_FRZ', resourceLabel: '31/DUMMY_33P_FRZ', dc: 'BD42', stops: 3, pallets: 20.95, distanceKm: 202.436, amount: 648.83, utilization: 104.26, corridor: 'S-43 → S-45', lockedBy: 'Capacity violation' },
  { id: 'FO-017', sapId: '80000000016', resource: 'EBE_ALDI_32_DUMMY_33P_FRZ', resourceLabel: '32/DUMMY_33P_FRZ', dc: 'BD42', stops: 2, pallets: 16.74, distanceKm: 211.389, amount: 779.65, utilization: 84.14, corridor: 'S-46 → S-57' },
  { id: 'FO-018', sapId: '80000000017', resource: 'EBE_ALDI_02_NIGHT_37P', resourceLabel: '02/NIGHT_37P', dc: 'BD20', stops: 2, pallets: 15.95, distanceKm: 204.456, amount: 746.25, utilization: 72.98, corridor: 'S-23 → S-40' },
  { id: 'FO-019', sapId: '80000000018', resource: 'EBE_ALDI_31_DUMMY_33P_FRZ', resourceLabel: '31/DUMMY_33P_FRZ', dc: 'BD20', stops: 1, pallets: 12.09, distanceKm: 183.889, amount: 520.21, utilization: 72.64, corridor: 'S-50' },
  { id: 'FO-020', sapId: '80000000019', resource: 'EBE_ALDI_03_DAY_37P', resourceLabel: '03/DAY_37P', dc: 'BD20', stops: 2, pallets: 26.17, distanceKm: 99.697, amount: 480.68, utilization: 97.87, corridor: 'S-26 → S-06' },
];

// Carriers derived from synthetic1000_tm_before.csv — the 4 distinct carrier codes in the data.
// Tours-count and avg-utilization are representative for V2's Resources tab.
interface CarrierResource {
  id: string;
  name: string;
  tours: number;
  utilization: string;
  state: 'Positive' | 'Information' | 'Critical';
}
const CARRIER_RESOURCES: CarrierResource[] = [
  { id: '9192001', name: 'Aldi Own Fleet', tours: 8, utilization: '87%', state: 'Positive' },
  { id: '1030353', name: 'Paulet Logistics', tours: 4, utilization: '74%', state: 'Information' },
  { id: '1041502', name: 'Lenz Transport', tours: 5, utilization: '79%', state: 'Information' },
  { id: '1041505', name: 'Wille Spedition', tours: 3, utilization: '91%', state: 'Critical' },
];

const TOTAL_FOS = LOADED_FOS.length;
const TOTAL_STOPS = LOADED_FOS.reduce((s, fo) => s + fo.stops, 0);
const TOTAL_PALLETS_EXACT = LOADED_FOS.reduce((s, fo) => s + fo.pallets, 0);
const TOTAL_PALLETS = Math.round(TOTAL_PALLETS_EXACT);
const TOTAL_FUS = TOTAL_STOPS; // Each stop in the synthetic data ≈ one freight unit drop
const TOTAL_DISTANCE_KM = LOADED_FOS.reduce((s, fo) => s + fo.distanceKm, 0);
const TOTAL_COST_EUR = LOADED_FOS.reduce((s, fo) => s + fo.amount, 0);
const AVG_UTILIZATION = LOADED_FOS.reduce((s, fo) => s + fo.utilization, 0) / LOADED_FOS.length;
const OVER_CAPACITY_COUNT = LOADED_FOS.filter((f) => f.utilization > 100).length;
const LOCKED_FO_COUNT = LOADED_FOS.filter((f) => f.lockedBy).length;

// Resources summary — derived from grouping FOs by their resource (vehicle profile).
// Each unique resource becomes one row in the Resources table on V2.
interface ResourceSummary {
  id: string;          // EBE_ALDI_31_DUMMY_33P_FRZ etc.
  dc: string;          // DC the resource is primarily assigned to
  tours: number;       // count of FOs using this resource
  totalPallets: number;
  avgUtilization: number;
}
const RESOURCE_SUMMARY: ResourceSummary[] = (() => {
  const map = new Map<string, { dc: string; tours: number; totalPallets: number; utilSum: number }>();
  for (const fo of LOADED_FOS) {
    const existing = map.get(fo.resource);
    if (existing) {
      existing.tours += 1;
      existing.totalPallets += fo.pallets;
      existing.utilSum += fo.utilization;
    } else {
      map.set(fo.resource, { dc: fo.dc, tours: 1, totalPallets: fo.pallets, utilSum: fo.utilization });
    }
  }
  return Array.from(map.entries())
    .map(([id, v]) => ({
      id,
      dc: v.dc,
      tours: v.tours,
      totalPallets: Math.round(v.totalPallets * 100) / 100,
      avgUtilization: v.utilSum / v.tours,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
})();
const TOTAL_RESOURCES = RESOURCE_SUMMARY.length;

interface RuleDescriptor {
  id: RuleId;
  scope: string;
  description: string;
  threshold: string;
  matched: number;
}

const RULE_DESCRIPTORS: RuleDescriptor[] = [
  {
    id: 'R-001',
    scope: 'All FOs in DC München-Süd',
    description: 'Stops carrying fewer than 5 pallets are reassigned to the nearest admissible FO on the same stage or cancelled if no target exists.',
    threshold: 'min_pallets_per_stop ≥ 5',
    matched: 3,
  },
  {
    id: 'R-002',
    scope: 'Resources with utilization > 95%',
    description: 'Reassign FUs from over-utilized resources to capacity-tolerant alternatives within ±5% load deviation.',
    threshold: 'capacity_tolerance ±5%',
    matched: 1,
  },
  {
    id: 'R-003',
    scope: 'Same-stage FOs in adjacent corridors',
    description: 'Consolidate two FOs into one when both serve adjacent stops on the same stage and combined load fits a single resource.',
    threshold: 'corridor_overlap ≥ 80%',
    matched: 1,
  },
  {
    id: 'R-004',
    scope: 'Single-stop FOs',
    description: 'Cancel single-stop freight orders carrying fewer than 5 pallets — they are operationally inefficient and likely candidates for next-day rollover.',
    threshold: 'pallets < 5 AND stops = 1',
    matched: 1,
  },
  {
    id: 'R-007',
    scope: 'All FOs with time-windowed stops',
    description: 'Flag FOs whose computed arrival times violate customer-defined delivery windows. Surface as no-feasible if no admissible reschedule exists.',
    threshold: 'arrival ≤ window_close',
    matched: 2,
  },
];

const View2Overview: React.FC<{ onProceed: () => void }> = ({ onProceed }) => {
  // V2 mocks an SAP TM "Session & Plan Overview" look:
  //   - Header band: title + subtitle (DC breakdown · date · rule profile) + success banner
  //   - Stats card: 2×4 grid of KPIs (Freight Orders, Delivery Stops, Total Pallets, Resources, Total Distance, Avg Utilization, Total Cost, Over Capacity)
  //   - Active Rules panel (read-only — full list lives on step 3 Rule Evaluation)
  //   - Freight Orders table (full-width, 8 columns) with over-capacity rows highlighted
  //   - Resources table (full-width, derived from FO grouping) with over-capacity rows highlighted

  const [bannerOpen, setBannerOpen] = useState(true);
  // Three collapsible lists — Rules / Freight Orders / Resources. All expanded by default so
  // the planner sees everything on first load; can collapse any panel to shorten scroll.
  const [rulesOpen, setRulesOpen] = useState(true);
  const [foOpen, setFoOpen] = useState(true);
  const [resourcesOpen, setResourcesOpen] = useState(true);

  // Reusable header for a collapsible card. Clicking anywhere on the header toggles the panel.
  const collapsibleHeader = (
    title: React.ReactNode,
    isOpen: boolean,
    onToggle: () => void,
    subtitle?: React.ReactNode,
  ) => (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      style={{
        display: 'flex',
        width: '100%',
        alignItems: 'center',
        gap: sp.s,
        padding: `${sp.s} ${sp.m}`,
        borderBottom: isOpen ? '1px solid var(--sapList_BorderColor)' : 'none',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'var(--sapFontFamily)',
        fontSize: 'var(--sapFontSize)',
        color: 'var(--sapTextColor)',
      }}
    >
      <Icon name={isOpen ? 'navigation-down-arrow' : 'navigation-right-arrow'} />
      <FlexBox direction="Column" style={{ gap: 2, flex: 1, minWidth: 0 }}>
        <Text style={sectionTitle}>{title}</Text>
        {subtitle && <Text style={labelText}>{subtitle}</Text>}
      </FlexBox>
    </button>
  );

  // Per-rule classification — Hard Constraints generate TM actions; Preferences are soft.
  const ruleType: Record<RuleId, { label: string; color: string }> = {
    'R-001': { label: 'Hard Constraint', color: 'var(--sapNegativeTextColor, #b00)' },
    'R-002': { label: 'Hard Constraint', color: 'var(--sapNegativeTextColor, #b00)' },
    'R-003': { label: 'Preference', color: 'var(--sapCriticalTextColor, #b45309)' },
    'R-004': { label: 'Hard Constraint', color: 'var(--sapNegativeTextColor, #b00)' },
    'R-007': { label: 'Preference', color: 'var(--sapCriticalTextColor, #b45309)' },
  };

  // DC breakdown for the subtitle line
  const dcCounts = LOADED_FOS.reduce<Record<string, number>>((acc, fo) => {
    acc[fo.dc] = (acc[fo.dc] ?? 0) + 1;
    return acc;
  }, {});
  const dcSubtitle = Object.entries(dcCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dc, n]) => `${dc} (${n} FOs)`)
    .join(' + ');

  const overCapBg = '#fef5f5';
  const overCapText = 'var(--sapNegativeTextColor, #b00)';

  // KPI tile renderer — value + label, optional emphasis color
  const kpi = (value: React.ReactNode, label: string, valueColor?: string) => (
    <FlexBox direction="Column" alignItems="Center" style={{ gap: 2, padding: `${sp.s} ${sp.m}`, flex: 1, minWidth: 0 }}>
      <Text style={{ fontSize: '1.4rem', fontWeight: 700, color: valueColor }}>{value}</Text>
      <Text style={labelText}>{label}</Text>
    </FlexBox>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: `-${sp.l}` }}>
      <PageTitle
        title="Session & Plan Overview"
        subtitle={`${TM_PROFILE} · DC: ${dcSubtitle} · 18.12.2025 · Rule profile: ${RULE_PROFILE}`}
        trailing={
          <ObjectStatus state="Positive" icon={<Icon name="connected" />}>
            Session active · last activity 2 min ago
          </ObjectStatus>
        }
      />

      {/* Body — single scrollable surface */}
      <div style={{ flex: 1, overflowY: 'auto', padding: sp.l }}>

        {/* Success banner — TM-style confirmation that the session loaded */}
        {bannerOpen && (
          <MessageStrip
            design="Positive"
            onClose={() => setBannerOpen(false)}
            style={{ marginBottom: sp.l }}
          >
            TM planning session created successfully. {TOTAL_FOS} freight orders, {TOTAL_STOPS} delivery stops, and {TOTAL_RESOURCES} resources loaded and locked.
            {OVER_CAPACITY_COUNT > 0 && <> · <strong>{OVER_CAPACITY_COUNT} FOs over capacity detected.</strong></>}
          </MessageStrip>
        )}

        {/* Stats card — 2×4 KPI grid in a single bordered card */}
        <div style={{ ...cardSurface, padding: 0, overflow: 'hidden', marginBottom: sp.l }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 0 }}>
            {/* Row 1 */}
            <div style={{ borderRight: '1px solid var(--sapList_BorderColor)', borderBottom: '1px solid var(--sapList_BorderColor)' }}>
              {kpi(TOTAL_FOS, 'Freight Orders')}
            </div>
            <div style={{ borderRight: '1px solid var(--sapList_BorderColor)', borderBottom: '1px solid var(--sapList_BorderColor)' }}>
              {kpi(TOTAL_STOPS, 'Delivery Stops')}
            </div>
            <div style={{ borderRight: '1px solid var(--sapList_BorderColor)', borderBottom: '1px solid var(--sapList_BorderColor)' }}>
              {kpi(`${TOTAL_PALLETS_EXACT.toFixed(2)} PAL`, 'Total Pallets')}
            </div>
            <div style={{ borderBottom: '1px solid var(--sapList_BorderColor)' }}>
              {kpi(TOTAL_RESOURCES, 'Resources')}
            </div>
            {/* Row 2 */}
            <div style={{ borderRight: '1px solid var(--sapList_BorderColor)' }}>
              {kpi(`${TOTAL_DISTANCE_KM.toFixed(1)} km`, 'Total Distance')}
            </div>
            <div style={{ borderRight: '1px solid var(--sapList_BorderColor)' }}>
              {kpi(`${AVG_UTILIZATION.toFixed(1)}%`, 'Avg Utilization')}
            </div>
            <div style={{ borderRight: '1px solid var(--sapList_BorderColor)' }}>
              {kpi(`€${TOTAL_COST_EUR.toFixed(2)}`, 'Total Cost')}
            </div>
            <div>
              {kpi(OVER_CAPACITY_COUNT, 'Over Capacity', OVER_CAPACITY_COUNT > 0 ? overCapText : undefined)}
            </div>
          </div>
        </div>

        {/* Active Rules — read-only summary. Ordering + run actions live on step 3. */}
        <div style={{ ...cardSurface, padding: 0, overflow: 'hidden', marginBottom: sp.l }}>
          {collapsibleHeader(
            'Rules that will be evaluated',
            rulesOpen,
            () => setRulesOpen((v) => !v),
            `Rule profile: ${RULE_PROFILE} · ${RULE_DESCRIPTORS.length} active rules`,
          )}
          {rulesOpen && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {RULE_DESCRIPTORS.map((rule, idx) => {
                  const t = ruleType[rule.id];
                  return (
                    <FlexBox
                      key={rule.id}
                      alignItems="Center"
                      justifyContent="SpaceBetween"
                      style={{
                        padding: `${sp.s} ${sp.m}`,
                        borderTop: idx > 0 ? '1px solid var(--sapList_BorderColor)' : 'none',
                        gap: sp.m,
                        flexWrap: 'wrap',
                      }}
                    >
                      <FlexBox alignItems="Center" style={{ gap: sp.s, minWidth: 0, flex: 1 }}>
                        <Tag design="Set2" colorScheme="6">{rule.id}</Tag>
                        <Text>{RULE_LABELS[rule.id]}</Text>
                      </FlexBox>
                      <Text style={{ fontWeight: 700, color: t.color, whiteSpace: 'nowrap' }}>
                        {t.label}
                      </Text>
                    </FlexBox>
                  );
                })}
              </div>
              <div style={{ padding: `${sp.s} ${sp.m}`, borderTop: '1px solid var(--sapList_BorderColor)', background: 'var(--sapInfobar_Background, #f5f9ff)' }}>
                <Text style={labelText}>
                  Hard Constraint rules generate proposal packages where TM actions are available. Preferences are soft and may be overridden by the planner.
                </Text>
              </div>
            </>
          )}
        </div>

        {/* Freight Orders — TM-style 8-column table */}
        <div style={{ ...cardSurface, padding: 0, overflow: 'hidden', marginBottom: sp.l }}>
          {collapsibleHeader(
            `Freight Orders (${LOADED_FOS.length})`,
            foOpen,
            () => setFoOpen((v) => !v),
            'Hover the document ID for the full SAP TM number',
          )}
          {foOpen && (
            <div style={{ maxHeight: 480, overflowY: 'auto' }}>
              <Table
                headerRow={
                  <TableHeaderRow sticky>
                    <TableHeaderCell width="14%"><Label>Document</Label></TableHeaderCell>
                    <TableHeaderCell width="8%"><Label>DC</Label></TableHeaderCell>
                    <TableHeaderCell width="26%"><Label>Resource</Label></TableHeaderCell>
                    <TableHeaderCell width="7%" horizontalAlign="End"><Label>Stops</Label></TableHeaderCell>
                    <TableHeaderCell width="9%" horizontalAlign="End"><Label>Pallets</Label></TableHeaderCell>
                    <TableHeaderCell width="11%" horizontalAlign="End"><Label>Distance km</Label></TableHeaderCell>
                    <TableHeaderCell width="11%" horizontalAlign="End"><Label>Utilization</Label></TableHeaderCell>
                    <TableHeaderCell width="14%" horizontalAlign="End"><Label>Amount EUR</Label></TableHeaderCell>
                  </TableHeaderRow>
                }
              >
                {LOADED_FOS.map((fo) => {
                  const overCap = fo.utilization > 100;
                  return (
                    <TableRow
                      key={fo.id}
                      rowKey={fo.id}
                      style={overCap ? { background: overCapBg } : undefined}
                    >
                      <TableCell>
                        <span title={`SAP TM Document: ${fo.sapId}`}>
                          <Text style={{ fontFamily: 'var(--sapFontMonospaceFamily, monospace)' }}>{fo.sapId}</Text>
                        </span>
                      </TableCell>
                      <TableCell>
                        <Tag design="Set2" colorScheme={fo.dc === 'BD20' ? '6' : '8'}>{fo.dc}</Tag>
                      </TableCell>
                      <TableCell>
                        <Text style={{ fontFamily: 'var(--sapFontMonospaceFamily, monospace)', fontSize: 'var(--sapFontSmallSize)' }}>
                          {fo.resource}
                        </Text>
                      </TableCell>
                      <TableCell>
                        <FlexBox justifyContent="End" style={{ width: '100%' }}>
                          <Text>{fo.stops}</Text>
                        </FlexBox>
                      </TableCell>
                      <TableCell>
                        <FlexBox justifyContent="End" style={{ width: '100%' }}>
                          <Text>{fo.pallets.toFixed(2)}</Text>
                        </FlexBox>
                      </TableCell>
                      <TableCell>
                        <FlexBox justifyContent="End" style={{ width: '100%' }}>
                          <Text>{fo.distanceKm.toFixed(1)}</Text>
                        </FlexBox>
                      </TableCell>
                      <TableCell>
                        <FlexBox justifyContent="End" style={{ width: '100%' }}>
                          <Text style={{ color: overCap ? overCapText : undefined, fontWeight: overCap ? 700 : 400 }}>
                            {fo.utilization.toFixed(1)}%
                          </Text>
                        </FlexBox>
                      </TableCell>
                      <TableCell>
                        <FlexBox justifyContent="End" style={{ width: '100%' }}>
                          <Text>€{fo.amount.toFixed(2)}</Text>
                        </FlexBox>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </Table>
            </div>
          )}
        </div>

        {/* Resources — derived from grouping FOs by resource. Over-capacity rows highlighted. */}
        <div style={{ ...cardSurface, padding: 0, overflow: 'hidden' }}>
          {collapsibleHeader(
            `Resources (${RESOURCE_SUMMARY.length} loaded)`,
            resourcesOpen,
            () => setResourcesOpen((v) => !v),
          )}
          {resourcesOpen && (
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              <Table
                headerRow={
                  <TableHeaderRow sticky>
                    <TableHeaderCell width="40%"><Label>Resource ID</Label></TableHeaderCell>
                    <TableHeaderCell width="12%"><Label>DC</Label></TableHeaderCell>
                    <TableHeaderCell width="12%" horizontalAlign="End"><Label>Tours</Label></TableHeaderCell>
                    <TableHeaderCell width="18%" horizontalAlign="End"><Label>Total Pallets</Label></TableHeaderCell>
                    <TableHeaderCell width="18%" horizontalAlign="End"><Label>Avg Utilization</Label></TableHeaderCell>
                  </TableHeaderRow>
                }
              >
                {RESOURCE_SUMMARY.map((r) => {
                  const overCap = r.avgUtilization > 100;
                  return (
                    <TableRow
                      key={r.id}
                      rowKey={r.id}
                      style={overCap ? { background: overCapBg } : undefined}
                    >
                      <TableCell>
                        <Text style={{ fontFamily: 'var(--sapFontMonospaceFamily, monospace)', fontSize: 'var(--sapFontSmallSize)' }}>{r.id}</Text>
                      </TableCell>
                      <TableCell>
                        <Tag design="Set2" colorScheme={r.dc === 'BD20' ? '6' : '8'}>{r.dc}</Tag>
                      </TableCell>
                      <TableCell>
                        <FlexBox justifyContent="End" style={{ width: '100%' }}>
                          <Text>{r.tours}</Text>
                        </FlexBox>
                      </TableCell>
                      <TableCell>
                        <FlexBox justifyContent="End" style={{ width: '100%' }}>
                          <Text>{r.totalPallets.toFixed(2)} PAL</Text>
                        </FlexBox>
                      </TableCell>
                      <TableCell>
                        <FlexBox justifyContent="End" style={{ width: '100%' }}>
                          <Text style={{ color: overCap ? overCapText : undefined, fontWeight: overCap ? 700 : 400 }}>
                            {r.avgUtilization.toFixed(1)}%
                          </Text>
                        </FlexBox>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </Table>
            </div>
          )}
        </div>
        {/* Forward CTA */}
        <div style={{ borderTop: '1px solid var(--sapList_BorderColor)', padding: `${sp.s} ${sp.l}`, background: 'var(--sapObjectHeader_Background, #fff)', display: 'flex', justifyContent: 'flex-end' }}>
          <Button design="Emphasized" icon="task" iconEnd onClick={onProceed}>
            Proceed to Rule Evaluation →
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// VIEW 3 — Rule Evaluation (HI-FI)
// Planner reorders the active rules (the evaluation order matters — earlier rules
// produce packages that later rules read against), then kicks off the rule engine.
// Once evaluation completes, Start Review unlocks and the planner advances to V4.
// Re-run is always available after the first run.
// ============================================================================

const View3RuleEvaluation: React.FC<{ onStartReview: () => void }> = ({ onStartReview }) => {
  // Local rule order — initial value mirrors RULE_DESCRIPTORS, then planner can reorder.
  const [ruleOrder, setRuleOrder] = useState<RuleId[]>(() => RULE_DESCRIPTORS.map((r) => r.id));
  const [evalState, setEvalState] = useState<'idle' | 'running' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  // Snapshot of rule order at the moment the last evaluation finished. null until the first
  // successful run. Used to detect when the planner has reordered since the last run —
  // when the current order differs from this snapshot, the evaluation is "dirty" and the
  // proposals are stale until re-run.
  const [lastEvaluatedOrder, setLastEvaluatedOrder] = useState<RuleId[] | null>(null);
  const evalTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (evalTimer.current) clearInterval(evalTimer.current);
  }, []);

  // Derived dirty flag: true when the planner has reordered since the last successful run.
  // Only meaningful in evalState='done'; idle and running are never "dirty".
  const isDirty = useMemo(() => {
    if (evalState !== 'done' || !lastEvaluatedOrder) return false;
    if (lastEvaluatedOrder.length !== ruleOrder.length) return true;
    return ruleOrder.some((id, i) => id !== lastEvaluatedOrder[i]);
  }, [evalState, lastEvaluatedOrder, ruleOrder]);

  const handleRunEvaluation = useCallback(() => {
    if (evalTimer.current) clearInterval(evalTimer.current);
    // Capture the order that the engine is about to evaluate against. We use this snapshot
    // when the run completes — see setInterval below.
    const orderAtRunStart = ruleOrder;
    setEvalState('running');
    setProgress(0);
    evalTimer.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (evalTimer.current) clearInterval(evalTimer.current);
          evalTimer.current = null;
          setEvalState('done');
          setLastEvaluatedOrder(orderAtRunStart);
          return 100;
        }
        return p + 8;
      });
    }, 400);
  }, [ruleOrder]);

  const moveUp = useCallback((idx: number) => {
    if (idx === 0) return;
    setRuleOrder((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }, []);

  const moveDown = useCallback((idx: number) => {
    setRuleOrder((prev) => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }, []);

  const evalRunning = evalState === 'running';
  const evalDone = evalState === 'done';

  // Recommendation counts (used by the Start Review footer text only).
  const recCounts = useMemo(() => ({
    total: INITIAL_PACKAGES.length,
    pending: INITIAL_PACKAGES.filter((p) => p.state === 'ready' || p.state === 'evaluating').length,
    nosol: INITIAL_PACKAGES.filter((p) => p.state === 'nosol').length,
  }), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: `-${sp.l}` }}>
      <PageTitle
        title="Rule Evaluation"
        subtitle="Reorder the active rules, then run them against the loaded TM plan. Earlier rules fire first."
        trailing={
          <>
            {evalState === 'idle' && (
              <ObjectStatus state="None" icon={<Icon name="pending" />}>
                Evaluation not started
              </ObjectStatus>
            )}
            {evalRunning && (
              <ObjectStatus state="Information" icon={<Icon name="hourglass" />}>
                Rules evaluating · {Math.min(progress, 100)}%
              </ObjectStatus>
            )}
            {evalDone && !isDirty && (
              <ObjectStatus state="Positive" icon={<Icon name="accept" />}>
                Evaluation complete · {recCounts.pending} ready · {recCounts.nosol} no-solution
              </ObjectStatus>
            )}
            {evalDone && isDirty && (
              <ObjectStatus state="Critical" icon={<Icon name="alert" />}>
                Re-run required — rule order changed
              </ObjectStatus>
            )}
          </>
        }
      />

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: sp.l }}>
        {/* Action bar — state-driven explanation + Run/Re-run button */}
        <div
          style={{
            background: 'var(--sapInfobar_Background, #f5f9ff)',
            border: '1px solid var(--sapInformativeBorderColor, #b5d4f1)',
            borderRadius: 'var(--sapElement_BorderCornerRadius, 8px)',
            padding: sp.m,
            marginBottom: sp.m,
          }}
        >
          <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ gap: sp.m, flexWrap: 'wrap' }}>
            <FlexBox direction="Column" style={{ gap: sp.xs, flex: 1, minWidth: 0 }}>
              <Text style={{ fontWeight: 700 }}>
                {evalState === 'idle' && 'Ready to evaluate'}
                {evalState === 'running' && `Evaluating rules · ${Math.min(progress, 100)}%`}
                {evalState === 'done' && !isDirty && 'Evaluation complete'}
                {evalState === 'done' && isDirty && 'Re-run required'}
              </Text>
              <Text style={labelText}>
                {evalState === 'idle' && `${ruleOrder.length} active rules from ${RULE_PROFILE} will fire in the order shown below. Each rule reads the planning state produced by the previous rules.`}
                {evalState === 'running' && 'Each rule is firing against the current planning state. Proposal packages appear in the next step as the engine works through them.'}
                {evalState === 'done' && !isDirty && `${recCounts.pending} packages await your decision in the next step · ${recCounts.nosol} no-solution. Re-run if you reorder or after the planning data changes.`}
                {evalState === 'done' && isDirty && 'Rule order changed since the last evaluation. The current proposals are stale. Re-run to refresh.'}
              </Text>
              {evalRunning && (
                <div style={{ marginTop: sp.xs, height: 4, borderRadius: 2, background: '#e9eef5', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(progress, 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #2563eb, #60a5fa)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              )}
            </FlexBox>
            <Button
              design="Emphasized"
              icon={lastEvaluatedOrder ? 'refresh' : 'play'}
              disabled={evalRunning}
              onClick={handleRunEvaluation}
            >
              {evalRunning ? 'Evaluating…' : lastEvaluatedOrder ? 'Re-Run Evaluation' : 'Run Rule Evaluation'}
            </Button>
          </FlexBox>
        </div>

        <Text style={{ ...labelText, display: 'block', marginBottom: sp.s }}>
          Profile: {RULE_PROFILE} · {ruleOrder.length} active rules
        </Text>
        <Table
          headerRow={
            <TableHeaderRow>
              <TableHeaderCell width="8%"><Label>Order</Label></TableHeaderCell>
              <TableHeaderCell width="10%"><Label>ID</Label></TableHeaderCell>
              <TableHeaderCell width="58%"><Label>Rule</Label></TableHeaderCell>
              <TableHeaderCell width="24%"><Label>Status</Label></TableHeaderCell>
            </TableHeaderRow>
          }
        >
          {ruleOrder.map((rid, idx) => {
            const rule = RULE_DESCRIPTORS.find((r) => r.id === rid)!;
            const isFirst = idx === 0;
            const isLast = idx === ruleOrder.length - 1;
            return (
              <TableRow key={rule.id} rowKey={rule.id}>
                <TableCell>
                  <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
                    <Text style={{ fontWeight: 700, minWidth: 20, textAlign: 'right' }}>{idx + 1}</Text>
                    <FlexBox direction="Column" style={{ gap: 0 }}>
                      <Button
                        design="Transparent"
                        icon="navigation-up-arrow"
                        disabled={isFirst || evalRunning}
                        onClick={() => moveUp(idx)}
                        tooltip="Move up"
                        style={{ minWidth: 24, height: 20 }}
                      />
                      <Button
                        design="Transparent"
                        icon="navigation-down-arrow"
                        disabled={isLast || evalRunning}
                        onClick={() => moveDown(idx)}
                        tooltip="Move down"
                        style={{ minWidth: 24, height: 20 }}
                      />
                    </FlexBox>
                  </FlexBox>
                </TableCell>
                <TableCell>
                  <Tag design="Set2" colorScheme="6">{rule.id}</Tag>
                </TableCell>
                <TableCell>
                  <FlexBox direction="Column" style={{ gap: sp.xs, paddingTop: sp.xs, paddingBottom: sp.xs, width: '100%' }}>
                    <Text style={{ fontWeight: 700 }}>{RULE_LABELS[rule.id]}</Text>
                    <Text style={bodyText}>{rule.description}</Text>
                    <FlexBox alignItems="Center" style={{ gap: sp.l, flexWrap: 'wrap', marginTop: sp.xs }}>
                      <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
                        <Label>Scope:</Label>
                        <Text style={labelText}>{rule.scope}</Text>
                      </FlexBox>
                      <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
                        <Label>Threshold:</Label>
                        <Text style={{ ...labelText, fontFamily: 'var(--sapFontMonospaceFamily, monospace)' }}>
                          {rule.threshold}
                        </Text>
                      </FlexBox>
                    </FlexBox>
                  </FlexBox>
                </TableCell>
                <TableCell>
                  {/* When dirty (planner reordered after a run), the row reverts to Pending —
                      the previous Evaluated status no longer reflects the current rule order. */}
                  {(evalState === 'idle' || (evalState === 'done' && isDirty)) && (
                    <ObjectStatus state="None">Pending</ObjectStatus>
                  )}
                  {evalState === 'running' && (
                    <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
                      <BusyIndicator active size="S" />
                      <Text style={{ ...labelText, color: 'var(--sapBrandColor, #2563eb)' }}>Evaluating…</Text>
                    </FlexBox>
                  )}
                  {evalState === 'done' && !isDirty && (
                    <ObjectStatus state="Positive" icon={<Icon name="accept" />}>Evaluated</ObjectStatus>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </Table>
      </div>

      {/* Sticky footer */}
      <div
        style={{
          padding: `${sp.s} ${sp.l}`,
          borderTop: '1px solid var(--sapList_BorderColor)',
          background: 'var(--sapObjectHeader_Background, #fff)',
        }}
      >
        <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ gap: sp.m, flexWrap: 'wrap' }}>
          <Text style={labelText}>
            {evalState === 'idle' && 'Run the rule evaluation above to generate proposals before you can start the review'}
            {evalState === 'running' && 'Proposals populate as rules complete — Start review unlocks when the run finishes'}
            {evalState === 'done' && !isDirty && `${recCounts.pending} proposal package${recCounts.pending === 1 ? '' : 's'} ready to review · ${recCounts.nosol} no-solution`}
            {evalState === 'done' && isDirty && 'Rule order changed — re-run the evaluation to refresh proposals before starting review'}
          </Text>
          <Button
            design="Emphasized"
            icon="inspect"
            iconEnd
            disabled={!evalDone || isDirty || recCounts.pending === 0}
            onClick={onStartReview}
          >
            Start review
          </Button>
        </FlexBox>
      </div>
    </div>
  );
};

// ============================================================================
// VIEW 3 — Recommendation Review (HI-FI)
// ============================================================================

interface SessionBannerProps {
  accepted: number;
  rejected: number;
  stale: number;
  pending: number;
  total: number;
  onSave: () => void;
  onDiscard: () => void;
  onOpenChanges: () => void;
}

const SessionBanner: React.FC<SessionBannerProps> = ({
  accepted, rejected, stale, pending, total, onSave, onDiscard, onOpenChanges,
}) => {
  const reviewed = accepted + rejected;
  const hasUnsaved = accepted > 0 || rejected > 0;

  return (
    <div
      style={{
        background: hasUnsaved ? 'var(--sapInformationBackground, #f0f7fb)' : 'var(--sapObjectHeader_Background, #fff)',
        borderBottom: '1px solid var(--sapList_BorderColor)',
        padding: `${sp.s} ${sp.l}`,
      }}
    >
      <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ gap: sp.m, flexWrap: 'wrap' }}>
        <FlexBox alignItems="Center" style={{ gap: sp.m, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onOpenChanges}
            disabled={!hasUnsaved}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              cursor: hasUnsaved ? 'pointer' : 'default',
              fontFamily: 'var(--sapFontFamily)',
              fontSize: 'var(--sapFontSize)',
              color: hasUnsaved ? 'var(--sapLinkColor, #0064d9)' : 'var(--sapContent_LabelColor)',
              textDecoration: hasUnsaved ? 'underline' : 'none',
            }}
            aria-label="Open change summary"
          >
            {accepted} accepted · {rejected} rejected · {reviewed}/{total} reviewed
          </button>
          {stale > 0 && (
            <ObjectStatus state="Critical" icon={<Icon name="alert" />}>
              {stale} stale
            </ObjectStatus>
          )}
          <Text style={labelText}>· session-local until save</Text>
        </FlexBox>
        {pending === 0 && (
          <Button design="Emphasized" icon="future" iconEnd onClick={onOpenChanges}>
            Proceed to Change Summary →
          </Button>
        )}
      </FlexBox>
    </div>
  );
};

interface PackageRailProps {
  packages: RecPackage[];
  headIndex: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  counts: {
    reviewed: number;
    stale: number;
    pending: number;
    evaluating: number;
    nosol: number;
    ready: number;
    total: number;
  };
  // Head-only action handlers — only fire on whichever card is the current head.
  onAccept: () => void;
  onReject: () => void;
  onDiscardStale: () => void;
  onReevalStale: () => void;
  onReevalStaleAndSubsequent: () => void;
  onAcknowledgeNoSol: () => void;
  onReevalNoSol: () => void;
  // Queue-wide bulk action — accept every ready package at once.
  onAcceptAll: () => void;
}

// ─── Status-driven card visuals ──────────────────────────────────────────────
// Returns the rail strip color, background tint, and opacity for a card given
// its (state, isHead) combination. Mirrors the demo's visual spec exactly.
const cardVisuals = (state: PackageState, isHead: boolean): {
  railColor: string;
  bg: string;
  opacity: number;
  pulse: boolean;
  strikethrough: boolean;
} => {
  if (isHead && state === 'nosol') {
    return { railColor: 'var(--sapNegativeColor, #dc2626)', bg: '#fef5f5', opacity: 1, pulse: false, strikethrough: false };
  }
  if (isHead) {
    return { railColor: 'var(--sapBrandColor, #2563eb)', bg: '#eef4ff', opacity: 1, pulse: state === 'evaluating', strikethrough: false };
  }
  switch (state) {
    case 'stale':
      return { railColor: 'var(--sapCriticalColor, #b45309)', bg: '#fff7ed', opacity: 1, pulse: false, strikethrough: false };
    case 'evaluating':
      return { railColor: 'var(--sapBrandColor, #2563eb)', bg: 'transparent', opacity: 0.85, pulse: true, strikethrough: false };
    case 'accepted':
      return { railColor: 'transparent', bg: '#fbfdfc', opacity: 1, pulse: false, strikethrough: false };
    case 'rejected':
      return { railColor: 'transparent', bg: '#fffafa', opacity: 1, pulse: false, strikethrough: false };
    case 'discarded':
      return { railColor: 'transparent', bg: '#fbfbfc', opacity: 1, pulse: false, strikethrough: true };
    default:
      // pending / ready-but-not-head / nosol-but-not-head → faded locked
      return { railColor: 'transparent', bg: 'transparent', opacity: 0.55, pulse: false, strikethrough: false };
  }
};

const PackageRail: React.FC<PackageRailProps> = ({
  packages, headIndex, collapsed, onToggleCollapse, counts,
  onAccept, onReject, onDiscardStale, onReevalStale, onReevalStaleAndSubsequent,
  onAcknowledgeNoSol, onReevalNoSol, onAcceptAll,
}) => {
  if (collapsed) {
    return (
      <div
        style={{
          width: 56,
          flexShrink: 0,
          borderRight: '1px solid var(--sapList_BorderColor)',
          background: 'var(--sapBaseColor, #fff)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: sp.s,
        }}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Expand proposal queue"
          title="Expand queue"
          style={{
            width: 32, height: 32, border: 'none', borderRadius: 4, cursor: 'pointer',
            background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon name="navigation-right-arrow" />
        </button>
        <Text style={{ ...labelText, marginTop: sp.s, textAlign: 'center' }}>
          {counts.reviewed}/{counts.total}
        </Text>
      </div>
    );
  }

  return (
    <div
      style={{
        width: 380,
        flexShrink: 0,
        borderRight: '1px solid var(--sapList_BorderColor)',
        background: 'var(--sapBaseColor, #fff)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Rail header — counter + status pills */}
      <div style={{ padding: sp.s, paddingLeft: sp.m, borderBottom: '1px solid var(--sapList_BorderColor)', background: '#fafbfc' }}>
        <FlexBox alignItems="Center" justifyContent="SpaceBetween">
          <Text style={sectionTitle}>Queue</Text>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Collapse queue"
            title="Collapse queue"
            style={{
              width: 28, height: 28, border: 'none', borderRadius: 4, cursor: 'pointer',
              background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="navigation-left-arrow" />
          </button>
        </FlexBox>
        <Text style={{ ...bodyText, fontWeight: 'var(--sapFontBoldWeight, 700)', display: 'block', marginTop: '2px' }}>
          {counts.reviewed} of {counts.total} reviewed
        </Text>
        <FlexBox alignItems="Center" wrap="Wrap" style={{ gap: sp.s, marginTop: '2px' }}>
          <Text style={labelText}>{counts.pending} pending</Text>
          {counts.evaluating > 0 && (
            <>
              <Text style={labelText}>·</Text>
              <Text style={{ ...labelText, color: 'var(--sapBrandColor, #2563eb)', fontWeight: 600 }}>
                {counts.evaluating} evaluating
              </Text>
            </>
          )}
          {counts.stale > 0 && (
            <>
              <Text style={labelText}>·</Text>
              <Text style={{ ...labelText, color: 'var(--sapCriticalTextColor, #b45309)', fontWeight: 600 }}>
                {counts.stale} stale
              </Text>
            </>
          )}
          {counts.nosol > 0 && (
            <>
              <Text style={labelText}>·</Text>
              <Text style={{ ...labelText, color: 'var(--sapNegativeTextColor, #dc2626)', fontWeight: 600 }}>
                {counts.nosol} no-solution
              </Text>
            </>
          )}
        </FlexBox>
        <div style={{ marginTop: sp.s, height: 4, borderRadius: 2, background: '#e9eef5', overflow: 'hidden' }}>
          <div
            style={{
              width: `${(counts.reviewed / counts.total) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #16a34a, #22c55e)',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
        {/* Queue-wide bulk action — sits with the queue, acts on every ready package at once. */}
        <div style={{ marginTop: sp.s }}>
          <Button
            design="Transparent"
            icon="multi-select"
            disabled={counts.ready === 0}
            onClick={onAcceptAll}
            style={{ width: '100%' }}
          >
            Accept all ready ({counts.ready})
          </Button>
        </div>
      </div>

      {/* Rail list — single-head queue */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {packages.map((p, idx) => {
          const isHead = idx === headIndex;
          const v = cardVisuals(p.state, isHead);
          const ruleId = p.ruleIds[0];
          const mutedColor = v.opacity < 1 ? 'var(--sapContent_LabelColor)' : 'var(--sapTextColor)';
          return (
            <div
              key={p.id}
              style={{
                position: 'relative',
                padding: `${sp.s} ${sp.m}`,
                paddingLeft: 'calc(' + sp.m + ' + 4px)',
                borderBottom: '1px solid var(--sapList_BorderColor)',
                background: v.bg,
                opacity: v.opacity,
              }}
              aria-current={isHead ? 'true' : undefined}
            >
              {/* Left rail strip */}
              {v.railColor !== 'transparent' && (
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                    background: v.railColor,
                    animation: v.pulse ? 'pkgPulse 1.1s ease-in-out infinite' : undefined,
                  }}
                />
              )}

              <FlexBox alignItems="Baseline" justifyContent="SpaceBetween" style={{ gap: sp.xs }}>
                <Text
                  style={{
                    ...bodyText,
                    fontWeight: 'var(--sapFontBoldWeight, 700)',
                    color: mutedColor,
                    textDecoration: v.strikethrough ? 'line-through' : undefined,
                    textDecorationColor: '#cbd2d9',
                  }}
                >
                  {p.id}
                </Text>
                <StatusBadge state={p.state} />
              </FlexBox>

              <Text
                style={{
                  fontSize: 'var(--sapFontSize)',
                  fontFamily: 'var(--sapFontFamily)',
                  color: mutedColor,
                  display: 'block',
                  marginTop: '2px',
                  textDecoration: v.strikethrough ? 'line-through' : undefined,
                  textDecorationColor: '#cbd2d9',
                }}
              >
                {p.title}
              </Text>
              <Text
                style={{
                  ...labelText,
                  display: 'block',
                  marginTop: '2px',
                  color: v.opacity < 1 ? 'var(--sapContent_LabelColor)' : undefined,
                  textDecoration: v.strikethrough ? 'line-through' : undefined,
                  textDecorationColor: '#cbd2d9',
                }}
              >
                {ruleId} · {p.ruleLabel}
              </Text>

              {/* nosol reason — only on the head's nosol card */}
              {isHead && p.state === 'nosol' && p.nosolReason && (
                <Text style={{ ...labelText, display: 'block', marginTop: '4px', color: 'var(--sapNegativeTextColor, #dc2626)' }}>
                  {p.nosolReason}
                </Text>
              )}

              {/* Inline actions — only on the head card */}
              {isHead && (
                <FlexBox alignItems="Center" wrap="Wrap" style={{ gap: sp.xs, marginTop: sp.s }}>
                  {p.state === 'ready' && (
                    <>
                      <Button design="Positive" icon="accept" onClick={onAccept}>Accept</Button>
                      <Button design="Negative" icon="decline" onClick={onReject}>Reject</Button>
                    </>
                  )}
                  {p.state === 'stale' && (
                    <>
                      <Button design="Attention" icon="synchronize" onClick={onReevalStale}>Re-evaluate</Button>
                      {packages.slice(idx + 1).some((q) => q.state === 'stale') && (
                        <Button design="Attention" icon="synchronize" onClick={onReevalStaleAndSubsequent}>
                          Re-evaluate this & subsequent
                        </Button>
                      )}
                      <Button design="Transparent" onClick={onDiscardStale}>Discard</Button>
                    </>
                  )}
                  {p.state === 'nosol' && (
                    <>
                      <Button design="Transparent" onClick={onAcknowledgeNoSol}>Acknowledge</Button>
                      <Button design="Attention" icon="synchronize" onClick={onReevalNoSol}>Re-evaluate</Button>
                    </>
                  )}
                  {p.state === 'evaluating' && (
                    <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
                      <BusyIndicator active size="S" />
                      <Text style={{ ...labelText, color: 'var(--sapBrandColor, #2563eb)', fontStyle: 'italic' }}>
                        Rule engine recomputing…
                      </Text>
                    </FlexBox>
                  )}
                </FlexBox>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface PackageDetailProps {
  pkg: RecPackage;
}

// Read-only context pane — auto-follows whichever package is the queue head.
// All decision actions live inline on the head card in the PackageRail.
const PackageDetail: React.FC<PackageDetailProps> = ({ pkg }) => {
  const isStale = pkg.state === 'stale';
  const isNoSol = pkg.state === 'nosol';
  const isEvaluating = pkg.state === 'evaluating';
  const isDiscarded = pkg.state === 'discarded';
  const bodyDimmed = isStale || isNoSol || isEvaluating || isDiscarded;

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--sapBackgroundColor)' }}>
      {/* Header */}
      <div style={{ padding: `${sp.m} ${sp.l}`, borderBottom: '1px solid var(--sapList_BorderColor)', background: 'var(--sapObjectHeader_Background, #fff)' }}>
        <FlexBox alignItems="Center" style={{ gap: sp.s, marginBottom: sp.xs }}>
          <Text style={{ ...labelText, fontWeight: 'var(--sapFontBoldWeight, 700)' }}>{pkg.id}</Text>
          <Tag design="Set2" colorScheme="6">{pkg.ruleIds[0]}</Tag>
          <Text style={labelText}>{pkg.ruleLabel}</Text>
          <div style={{ marginLeft: 'auto' }}>
            <StatusBadge state={pkg.state} />
          </div>
        </FlexBox>
        <Title level="H4">{pkg.title}</Title>
      </div>

      {/* Scrollable detail body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: sp.l }}>
        {/* Stale banner */}
        {isStale && pkg.staleCause && (
          <MessageStrip design="Warning" hideCloseButton style={{ marginBottom: sp.m }}>
            <strong>This package is stale.</strong>{' '}
            Caused by {pkg.staleCause.byPackageId} — {pkg.staleCause.reason}
          </MessageStrip>
        )}

        {/* No-solution banner */}
        {isNoSol && (
          <MessageStrip design="Negative" hideCloseButton style={{ marginBottom: sp.m }}>
            <strong>No admissible solution.</strong>{' '}
            {pkg.nosolReason}
          </MessageStrip>
        )}

        {/* Terminal banners */}
        {pkg.state === 'accepted' && (
          <MessageStrip design="Positive" hideCloseButton style={{ marginBottom: sp.m }}>
            Accepted into the refined plan. Will be written to TM on save.
          </MessageStrip>
        )}
        {pkg.state === 'rejected' && (
          <MessageStrip design="Information" hideCloseButton style={{ marginBottom: sp.m }}>
            Rejected. Current plan unchanged for this package.
          </MessageStrip>
        )}
        {isDiscarded && (
          <MessageStrip design="Information" hideCloseButton style={{ marginBottom: sp.m }}>
            Discarded. Logged in audit but no TM write.
          </MessageStrip>
        )}

        {isEvaluating && (
          <MessageStrip design="Information" hideCloseButton style={{ marginBottom: sp.m }}>
            <FlexBox alignItems="Center" style={{ gap: sp.s }}>
              <BusyIndicator active size="S" />
              <span>Rule engine recomputing this package…</span>
            </FlexBox>
          </MessageStrip>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.m, opacity: bodyDimmed ? 0.55 : 1, transition: 'opacity 0.3s ease' }}>
          {/* Why */}
          <div style={{ ...cardSurface, padding: sp.m, gridColumn: '1 / -1' }}>
            <div style={sectionTitle}>Why</div>
            <Text style={{ ...bodyText, display: 'block', marginTop: sp.xs }}>
              {pkg.whyText}
            </Text>
          </div>

          {/* Affected objects */}
          {!isNoSol && (
            <div style={{ ...cardSurface, padding: sp.m }}>
              <div style={sectionTitle}>Affected Objects ({pkg.affected.length})</div>
              <div style={{ marginTop: sp.s, display: 'flex', flexDirection: 'column', gap: sp.xs }}>
                {pkg.affected.map((o, i) => (
                  <FlexBox key={i} alignItems="Center" style={{ gap: sp.xs }}>
                    <ObjectKindIcon kind={o.kind} />
                    <Text style={{ ...bodyText, fontWeight: 'var(--sapFontBoldWeight, 700)' }}>{o.id}</Text>
                    <Text style={labelText}>· {o.change}</Text>
                  </FlexBox>
                ))}
              </div>
            </div>
          )}

          {/* Validation */}
          {!isNoSol && pkg.validation.length > 0 && (
            <div style={{ ...cardSurface, padding: sp.m }}>
              <div style={sectionTitle}>Validation</div>
              <div style={{ marginTop: sp.s, display: 'flex', flexDirection: 'column', gap: sp.xs }}>
                {pkg.validation.map((v, i) => (
                  <FlexBox key={i} alignItems="Center" style={{ gap: sp.xs }}>
                    <Icon name={v.passed ? 'accept' : 'decline'} />
                    <Text style={bodyText}>{v.check}</Text>
                  </FlexBox>
                ))}
              </div>
            </div>
          )}

          {/* Before / after — deterministic KPI comparison */}
          {!isNoSol && (
            <div style={{ ...cardSurface, padding: sp.m, gridColumn: '1 / -1' }}>
              <div style={sectionTitle}>Before / After — KPI Comparison</div>
              <Text style={{ ...labelText, display: 'block', marginTop: '2px' }}>
                Each row pairs the same KPI before and after the package is accepted.
              </Text>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                marginTop: sp.s,
                border: '1px solid var(--sapList_BorderColor)',
                borderRadius: 4,
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: sp.s,
                  background: 'var(--sapList_HeaderBackground, #f7f7f7)',
                  borderBottom: '1px solid var(--sapList_BorderColor)',
                  borderRight: '1px solid var(--sapList_BorderColor)',
                }}>
                  <Text style={{ ...labelText, fontWeight: 700 }}>Before</Text>
                </div>
                <div style={{
                  padding: sp.s,
                  background: 'var(--sapList_HeaderBackground, #f7f7f7)',
                  borderBottom: '1px solid var(--sapList_BorderColor)',
                }}>
                  <Text style={{ ...labelText, fontWeight: 700 }}>After</Text>
                </div>
                {Array.from({ length: Math.max(pkg.before.length, pkg.after.length) }).map((_, i) => (
                  <React.Fragment key={i}>
                    <div style={{
                      padding: sp.s,
                      borderTop: i > 0 ? '1px solid var(--sapList_BorderColor)' : 'none',
                      borderRight: '1px solid var(--sapList_BorderColor)',
                      background: 'var(--sapList_Background, #fff)',
                    }}>
                      <Text style={{ ...bodyText, fontSize: 'var(--sapFontSmallSize)' }}>
                        {pkg.before[i] ?? '—'}
                      </Text>
                    </div>
                    <div style={{
                      padding: sp.s,
                      borderTop: i > 0 ? '1px solid var(--sapList_BorderColor)' : 'none',
                      background: 'var(--sapSuccessBackground, #f5faf5)',
                    }}>
                      <Text style={{ ...bodyText, fontSize: 'var(--sapFontSmallSize)' }}>
                        {pkg.after[i] ?? '—'}
                      </Text>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* TM actions — atomic, ordered */}
          {!isNoSol && pkg.actions.length > 0 && (
            <div style={{ ...cardSurface, padding: sp.m, gridColumn: '1 / -1' }}>
              <div style={sectionTitle}>TM Actions · Atomic, In Order</div>
              <Text style={{ ...labelText, display: 'block', marginTop: '2px' }}>
                Accept applies all {pkg.actions.length} actions as a unit. No partial accept.
              </Text>
              <ol style={{ marginTop: sp.s, paddingLeft: sp.l, display: 'flex', flexDirection: 'column', gap: sp.xs }}>
                {pkg.actions.map((a, i) => (
                  <li key={i}>
                    <Text style={bodyText}>{a}</Text>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

// ─── Re-evaluation prompt modal ──────────────────────────────────────────────
// Shared between stale-reeval, stale-cascade-reeval, and nosol-reeval.
// Optional textarea — leave blank to retry as-is.
interface ReevalPromptModalProps {
  open: boolean;
  title: string;
  sub: string;
  onCancel: () => void;
  onConfirm: (promptText: string | null) => void;
}
const ReevalPromptModal: React.FC<ReevalPromptModalProps> = ({ open, title, sub, onCancel, onConfirm }) => {
  const [val, setVal] = useState('');
  useEffect(() => {
    if (open) setVal('');
  }, [open]);
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--sapBaseColor, #fff)',
          borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          width: 'min(480px, calc(100vw - 32px))',
          padding: `${sp.m} ${sp.l} ${sp.m}`,
        }}
      >
        <Title level="H5" style={{ marginBottom: sp.xs }}>{title}</Title>
        <Text style={{ ...labelText, display: 'block', marginBottom: sp.s }}>{sub}</Text>
        <TextArea
          rows={3}
          placeholder="e.g., relax capacity tolerance to ±10%, or prefer FO-001 as consolidation target"
          value={val}
          onInput={(e) => setVal((e.target as HTMLTextAreaElement).value)}
          style={{ width: '100%', display: 'block' }}
        />
        <FlexBox alignItems="Center" justifyContent="End" style={{ gap: sp.xs, marginTop: sp.m }}>
          <Button design="Transparent" onClick={onCancel}>Cancel</Button>
          <Button design="Emphasized" icon="synchronize" onClick={() => onConfirm(val.trim() || null)}>
            Re-evaluate
          </Button>
        </FlexBox>
      </div>
    </div>
  );
};

const View3RecommendationReview: React.FC<{ onProceedToChanges: () => void }> = ({ onProceedToChanges }) => {
  const [packages, setPackages] = useState<RecPackage[]>(INITIAL_PACKAGES);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Re-eval prompt modal state
  const [reevalModal, setReevalModal] = useState<{
    open: boolean;
    title: string;
    sub: string;
    onConfirm: (promptText: string | null) => void;
  } | null>(null);

  // Evaluating timers — one per package id, so we can clear cleanly on unmount/reset
  const evalTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  useEffect(() => () => {
    evalTimers.current.forEach((t) => clearTimeout(t));
  }, []);

  const isTerminal = useCallback(
    (s: PackageState) => s === 'accepted' || s === 'rejected' || s === 'discarded',
    [],
  );

  // The workflow head — first non-terminal package. Derived, not stored.
  const headIndex = useMemo(
    () => packages.findIndex((p) => !isTerminal(p.state)),
    [packages, isTerminal],
  );
  const headPkg = headIndex >= 0 ? packages[headIndex] : null;

  // Right pane auto-follows the head (no clicking, no separate focus state).
  const focused = headPkg ?? packages[0];

  const counts = useMemo(() => {
    const accepted = packages.filter((p) => p.state === 'accepted').length;
    const rejected = packages.filter((p) => p.state === 'rejected').length;
    const discarded = packages.filter((p) => p.state === 'discarded').length;
    const stale = packages.filter((p) => p.state === 'stale').length;
    const evaluating = packages.filter((p) => p.state === 'evaluating').length;
    const nosol = packages.filter((p) => p.state === 'nosol').length;
    const ready = packages.filter((p) => p.state === 'ready').length;
    const reviewed = accepted + rejected + discarded;
    const pending = packages.length - reviewed;
    return { accepted, rejected, discarded, reviewed, stale, pending, evaluating, nosol, ready, total: packages.length };
  }, [packages]);

  const showToast = useCallback((m: string) => {
    setToastMessage(m);
    setToastOpen(true);
  }, []);

  // Simulated rule-engine latency for planner-triggered re-evaluations
  const EVAL_DELAY_MS = 1800;

  // Run an evaluating verdict on a single package by id.
  // Verdict rules (per demo spec):
  //   - re-evaluating a nosol card WITHOUT a prompt → fails again (nosol)
  //   - everything else → ready
  const applyVerdict = useCallback((pkgId: string, opts: { wasNoSol: boolean; promptText: string | null }) => {
    setPackages((prev) =>
      prev.map((p) => (p.id === pkgId ? { ...p, state: 'evaluating' as PackageState, staleCause: undefined } : p)),
    );
    const t = setTimeout(() => {
      setPackages((prev) =>
        prev.map((p) => {
          if (p.id !== pkgId) return p;
          if (p.state !== 'evaluating') return p; // guard: reset wiped it
          const failsAgain = opts.wasNoSol && !opts.promptText;
          if (failsAgain) {
            return {
              ...p,
              state: 'nosol' as PackageState,
              nosolReason: 'No admissible target — retry as-is yielded same result.',
            };
          }
          return { ...p, state: 'ready' as PackageState, nosolReason: undefined };
        }),
      );
      evalTimers.current.delete(pkgId);
    }, EVAL_DELAY_MS);
    evalTimers.current.set(pkgId, t);
  }, []);

  // ─── Head-only transitions ───────────────────────────────────────────────
  const handleAccept = useCallback(() => {
    if (!headPkg || headPkg.state !== 'ready') return;
    const id = headPkg.id;
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, state: 'accepted' as PackageState } : p)));
    showToast(`${id} accepted into the refined plan`);
  }, [headPkg, showToast]);

  // Bulk action — accept every `ready` package in the queue at once.
  // Stale, nosol, evaluating, and terminal cards are left untouched so the planner can
  // still resolve them individually. After the bulk apply, the queue head naturally
  // moves to the next non-ready card (or beyond the end if everything was ready).
  const [acceptAllConfirmOpen, setAcceptAllConfirmOpen] = useState(false);
  const handleAcceptAll = useCallback(() => {
    const readyIds = new Set(packages.filter((p) => p.state === 'ready').map((p) => p.id));
    if (readyIds.size === 0) return;
    setPackages((prev) =>
      prev.map((p) => (readyIds.has(p.id) ? { ...p, state: 'accepted' as PackageState } : p)),
    );
    showToast(`${readyIds.size} package${readyIds.size === 1 ? '' : 's'} accepted into the refined plan`);
  }, [packages, showToast]);

  const handleReject = useCallback(() => {
    if (!headPkg || headPkg.state !== 'ready') return;
    const headId = headPkg.id;
    const headIdx = headIndex;
    setPackages((prev) =>
      prev.map((p, idx) => {
        if (p.id === headId) return { ...p, state: 'rejected' as PackageState };
        // Cascade: every non-terminal after the head becomes stale
        if (idx > headIdx && !isTerminal(p.state)) {
          return {
            ...p,
            state: 'stale' as PackageState,
            staleCause: { byPackageId: headId, reason: `${headId} was rejected — this card's preconditions may no longer hold.` },
          };
        }
        return p;
      }),
    );
    showToast(`${headId} rejected · subsequent packages re-staled`);
  }, [headPkg, headIndex, isTerminal, showToast]);

  // Auto-discard earlier stales when the planner acts on a stale head
  const autoDiscardEarlierStales = useCallback((upToIdx: number) => {
    setPackages((prev) =>
      prev.map((p, idx) => (idx < upToIdx && p.state === 'stale' ? { ...p, state: 'discarded' as PackageState } : p)),
    );
  }, []);

  const handleDiscardStale = useCallback(() => {
    if (!headPkg || headPkg.state !== 'stale') return;
    const headId = headPkg.id;
    const headIdx = headIndex;
    autoDiscardEarlierStales(headIdx);
    setPackages((prev) => prev.map((p) => (p.id === headId ? { ...p, state: 'discarded' as PackageState } : p)));
    showToast(`${headId} discarded`);
  }, [headPkg, headIndex, autoDiscardEarlierStales, showToast]);

  const handleReevalStale = useCallback((promptText: string | null) => {
    if (!headPkg || headPkg.state !== 'stale') return;
    const headIdx = headIndex;
    autoDiscardEarlierStales(headIdx);
    applyVerdict(headPkg.id, { wasNoSol: false, promptText });
    showToast(promptText ? `Re-evaluating ${headPkg.id} with hint` : `Re-evaluating ${headPkg.id}`);
  }, [headPkg, headIndex, autoDiscardEarlierStales, applyVerdict, showToast]);

  const handleReevalStaleAndSubsequent = useCallback((promptText: string | null) => {
    if (!headPkg || headPkg.state !== 'stale') return;
    const headIdx = headIndex;
    autoDiscardEarlierStales(headIdx);
    // Re-evaluate head + every later stale, each independently
    const subsequentStaleIds = packages.slice(headIdx + 1).filter((p) => p.state === 'stale').map((p) => p.id);
    applyVerdict(headPkg.id, { wasNoSol: false, promptText });
    subsequentStaleIds.forEach((id) => applyVerdict(id, { wasNoSol: false, promptText }));
    showToast(`Re-evaluating ${1 + subsequentStaleIds.length} packages`);
  }, [headPkg, headIndex, packages, autoDiscardEarlierStales, applyVerdict, showToast]);

  const handleAcknowledgeNoSol = useCallback(() => {
    if (!headPkg || headPkg.state !== 'nosol') return;
    const headId = headPkg.id;
    setPackages((prev) => prev.map((p) => (p.id === headId ? { ...p, state: 'discarded' as PackageState } : p)));
    showToast(`${headId} acknowledged · no admissible target, moved on`);
  }, [headPkg, showToast]);

  const handleReevalNoSol = useCallback((promptText: string | null) => {
    if (!headPkg || headPkg.state !== 'nosol') return;
    applyVerdict(headPkg.id, { wasNoSol: true, promptText });
    showToast(promptText ? `Re-evaluating ${headPkg.id} with hint` : `Re-evaluating ${headPkg.id} as-is`);
  }, [headPkg, applyVerdict, showToast]);

  // ─── Prompt modal openers — bridge to head-only handlers ─────────────────
  const openReevalStalePrompt = useCallback(() => {
    if (!headPkg) return;
    setReevalModal({
      open: true,
      title: `Re-evaluate ${headPkg.id}`,
      sub: 'Optional: tell the rule engine what to try differently. Leave blank to retry as-is.',
      onConfirm: (txt) => handleReevalStale(txt),
    });
  }, [headPkg, handleReevalStale]);

  const openReevalStaleAndSubsequentPrompt = useCallback(() => {
    if (!headPkg) return;
    setReevalModal({
      open: true,
      title: `Re-evaluate ${headPkg.id} and subsequent stale packages`,
      sub: 'Optional: tell the rule engine what to try differently. The hint applies to all re-evaluated packages.',
      onConfirm: (txt) => handleReevalStaleAndSubsequent(txt),
    });
  }, [headPkg, handleReevalStaleAndSubsequent]);

  const openReevalNoSolPrompt = useCallback(() => {
    if (!headPkg) return;
    setReevalModal({
      open: true,
      title: `Re-evaluate ${headPkg.id}`,
      sub: 'The rule fired but no admissible target was found. Optional: hint what to try differently. Leave blank to retry as-is.',
      onConfirm: (txt) => handleReevalNoSol(txt),
    });
  }, [headPkg, handleReevalNoSol]);

  const handleSave = useCallback(() => {
    showToast(`Saved ${counts.accepted} accepted, ${counts.rejected} rejected, ${counts.discarded} discarded to TM`);
  }, [counts, showToast]);

  const handleDiscard = useCallback(() => {
    setPackages(INITIAL_PACKAGES);
    evalTimers.current.forEach((t) => clearTimeout(t));
    evalTimers.current.clear();
    showToast('All decisions discarded — current plan restored');
  }, [showToast]);

  const handleOpenChanges = useCallback(() => {
    onProceedToChanges();
  }, [onProceedToChanges]);

  if (!focused) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: `-${sp.l}` }}>
      {/* Pulsing rail animation for evaluating cards */}
      <style>{`@keyframes pkgPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }`}</style>
      <PageTitle
        title="Proposal Review"
        subtitle="Review each proposal package · accept, reject, or re-evaluate"
      />
      <SessionBanner
        accepted={counts.accepted}
        rejected={counts.rejected}
        stale={counts.stale}
        pending={counts.pending}
        total={counts.total}
        onSave={handleSave}
        onDiscard={handleDiscard}
        onOpenChanges={handleOpenChanges}
      />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <PackageRail
          packages={packages}
          headIndex={headIndex}
          collapsed={railCollapsed}
          onToggleCollapse={() => setRailCollapsed((c) => !c)}
          counts={counts}
          onAccept={handleAccept}
          onReject={handleReject}
          onDiscardStale={handleDiscardStale}
          onReevalStale={openReevalStalePrompt}
          onReevalStaleAndSubsequent={openReevalStaleAndSubsequentPrompt}
          onAcknowledgeNoSol={handleAcknowledgeNoSol}
          onReevalNoSol={openReevalNoSolPrompt}
          onAcceptAll={() => setAcceptAllConfirmOpen(true)}
        />
        <PackageDetail pkg={focused} />
      </div>
      <Toast open={toastOpen} duration={3000} placement="BottomCenter" onClose={() => setToastOpen(false)}>
        {toastMessage}
      </Toast>

      {/* Re-evaluation prompt modal */}
      {reevalModal && (
        <ReevalPromptModal
          open={reevalModal.open}
          title={reevalModal.title}
          sub={reevalModal.sub}
          onCancel={() => setReevalModal(null)}
          onConfirm={(txt) => {
            const cb = reevalModal.onConfirm;
            setReevalModal(null);
            cb(txt);
          }}
        />
      )}

      {/* Accept-all confirm modal — Fiori-standard batch confirmation */}
      {acceptAllConfirmOpen && (() => {
        const readyCount = counts.ready;
        const tmActionCount = packages
          .filter((p) => p.state === 'ready')
          .reduce((sum, p) => sum + p.actions.length, 0);
        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Accept all ready packages"
            style={{
              position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            }}
            onClick={() => setAcceptAllConfirmOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--sapBaseColor, #fff)',
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                width: 'min(480px, calc(100vw - 32px))',
                padding: `${sp.m} ${sp.l}`,
              }}
            >
              <Title level="H5" style={{ marginBottom: sp.xs }}>
                Accept {readyCount} ready proposal{readyCount === 1 ? '' : 's'}?
              </Title>
              <Text style={{ ...labelText, display: 'block', marginBottom: sp.m }}>
                Accepts every proposal currently marked Ready into the refined plan.
                On save, {tmActionCount} TM action{tmActionCount === 1 ? '' : 's'} will be applied.
                Stale and no-solution proposals are unaffected — you can still resolve those individually.
              </Text>
              <FlexBox alignItems="Center" justifyContent="End" style={{ gap: sp.xs }}>
                <Button design="Transparent" onClick={() => setAcceptAllConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button
                  design="Emphasized"
                  icon="accept"
                  onClick={() => {
                    setAcceptAllConfirmOpen(false);
                    handleAcceptAll();
                  }}
                >
                  Accept all
                </Button>
              </FlexBox>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

// ============================================================================
// VIEW 4 — Change Summary (HI-FI)
// "What's about to commit?" Roll-up + per-rule grouping + per-row inline detail
// expand + per-row Undo + per-rule Undo-all. Sticky save/discard footer.
// Toggle below demonstrates the OQ-A toast vs partial-save inline panel.
// ============================================================================

interface ChangeRow {
  id: string;
  title: string;
  ruleId: RuleId;
  beforeSummary: string;
  afterSummary: string;
  // 'accepted' → committed to refined plan
  // 'rejected' → planner explicitly refused
  // 'discarded' → planner skipped (acknowledged no-sol, or discarded stale). Logged in audit, no TM write.
  decision: 'accepted' | 'rejected' | 'discarded';
  rejectReason?: string;
  discardReason?: string;
  whyText: string;
  affected: AffectedObject[];
  tmActions: string[];
}

const MOCK_CHANGES: ChangeRow[] = [
  {
    id: 'PKG-01', title: 'Remove stop S-14 from FO-001', ruleId: 'R-001',
    beforeSummary: 'FO-001 · 8 stops · 24 pl', afterSummary: 'FO-001 · 7 stops · 21 pl',
    decision: 'accepted',
    whyText: 'Stop S-14 carries only 3 pallets, below the 5-pallet minimum. Fits FO-006 with 18 pallets total.',
    affected: [
      { kind: 'FO', id: 'FO-001', change: '-1 stop, -3 pallets' },
      { kind: 'Stop', id: 'S-14', change: 'reassigned to FO-006' },
    ],
    tmActions: ['Remove Stop S-14 from FO-001', 'Append Stop S-14 to FO-006', 'Recompute route distance for both FOs'],
  },
  {
    id: 'PKG-08', title: 'Remove stop S-22 from FO-018', ruleId: 'R-001',
    beforeSummary: 'FO-018 · 6 stops · 20 pl', afterSummary: 'FO-018 · 5 stops · 18 pl',
    decision: 'accepted',
    whyText: 'Stop S-22 carries 2 pallets. Same-day route FO-020 has compatible stage and 4 pallets of headroom.',
    affected: [
      { kind: 'FO', id: 'FO-018', change: '-1 stop, -2 pallets' },
      { kind: 'Stop', id: 'S-22', change: 'reassigned to FO-020' },
    ],
    tmActions: ['Remove Stop S-22 from FO-018', 'Append Stop S-22 to FO-020'],
  },
  {
    id: 'PKG-02', title: 'Reassign FU-2107 to FO-014', ruleId: 'R-002',
    beforeSummary: 'FO-014 · 27 pallets · 90% cap', afterSummary: 'FO-014 · 28 pallets · 93% cap',
    decision: 'accepted',
    whyText: 'FO-014 has 3 pallets of headroom against the 30-pallet cap. Reassigning FU-2107 (1 pallet) brings it to 28/30 — within tolerance.',
    affected: [
      { kind: 'FU', id: 'FU-2107', change: 'moved FO-016 → FO-014' },
      { kind: 'FO', id: 'FO-014', change: '+1 FU, +1 pallet' },
    ],
    tmActions: ['Reassign FU-2107 from FO-016 to FO-014', 'Update load plan for FO-014'],
  },
  {
    id: 'PKG-03', title: 'Consolidate FO-002 → FO-001', ruleId: 'R-003',
    beforeSummary: '2 FOs · 14 stops · 193 pl', afterSummary: '1 FO · 11 stops · 28 pl',
    decision: 'accepted',
    whyText: 'FO-001 and FO-002 share stage S-08 → S-12. Combined load (28 pallets) within 30-pallet FO capacity.',
    affected: [
      { kind: 'FO', id: 'FO-001', change: '+3 stops, +51 pallets' },
      { kind: 'FO', id: 'FO-002', change: 'cancelled' },
      { kind: 'FU', id: 'FU-2241..2253', change: 'reassigned to FO-001' },
    ],
    tmActions: ['Reassign FU-2241..2253 from FO-002 to FO-001', 'Append stops S-08..S-12 to FO-001', 'Cancel FO-002'],
  },
  {
    id: 'PKG-04', title: 'Cancel FO-005 (single-stop, 4 pl)', ruleId: 'R-004',
    beforeSummary: 'FO-005 · 1 stop · 4 pl', afterSummary: 'cancelled · FUs to FO-009',
    decision: 'accepted',
    whyText: 'FO-005 is single-stop with 4 pallets — under threshold. Fits FO-009 same-stage same-day.',
    affected: [
      { kind: 'FO', id: 'FO-005', change: 'cancelled' },
      { kind: 'FU', id: 'FU-2301..2304', change: 'reassigned to FO-009' },
    ],
    tmActions: ['Reassign FU-2301..2304 from FO-005 to FO-009', 'Append Stop S-21 to FO-009', 'Cancel FO-005'],
  },
  {
    id: 'PKG-05', title: 'Re-sequence stops on FO-013', ruleId: 'R-007',
    beforeSummary: 'S-31 ETA 12:18 (late)', afterSummary: 'S-31 ETA 11:24 (in window)',
    decision: 'accepted',
    whyText: 'Optimizer placed S-31 at position 4. Time-window 10:00–12:00; current ETA 12:18 (18 min late). Re-sequencing fixes it.',
    affected: [
      { kind: 'FO', id: 'FO-013', change: 'stop sequence changed' },
      { kind: 'Stop', id: 'S-31', change: 'position 4 → position 2' },
    ],
    tmActions: ['Re-sequence stops on FO-013: S-31 → position 2', 'Recompute ETAs'],
  },
  {
    id: 'PKG-12', title: 'Reassign FU-2155 (capacity ±5%)', ruleId: 'R-002',
    beforeSummary: 'FO-016 · 95% cap', afterSummary: '—',
    decision: 'rejected', rejectReason: 'Customer-specific routing constraint — keep on original FO',
    whyText: 'Rejected.',
    affected: [],
    tmActions: [],
  },
  {
    id: 'PKG-07', title: 'Reassign FU-2418 (capacity tolerance ±5%)', ruleId: 'R-002',
    beforeSummary: 'No admissible target', afterSummary: '—',
    decision: 'discarded', discardReason: 'Acknowledged no-solution — engine could not find an admissible FO',
    whyText: 'Discarded.',
    affected: [],
    tmActions: [],
  },
];

interface SaveResult {
  pkgId: string;
  status: 'succeeded' | 'failed';
  reason?: string;
}

const View4Changes: React.FC<{ onStartNewSession: () => void; onSessionSaved: () => void }> = ({ onStartNewSession, onSessionSaved }) => {
  const [rows] = useState<ChangeRow[]>(MOCK_CHANGES);
  const [rejectedExpanded, setRejectedExpanded] = useState(false);
  const [discardedExpanded, setDiscardedExpanded] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  // After Save to TM fires, the body switches to a completion state — the planner sees
  // a summary of what was committed and a CTA to start a new session. Everything else
  // (KPI comparison, accepted/rejected/skipped groups) is hidden.
  const [saved, setSaved] = useState(false);

  const accepted = rows.filter((r) => r.decision === 'accepted');
  const rejected = rows.filter((r) => r.decision === 'rejected');
  const discarded = rows.filter((r) => r.decision === 'discarded');

  const fosAffected = useMemo(() => {
    const set = new Set<string>();
    accepted.forEach((r) => r.affected.forEach((a) => { if (a.kind === 'FO') set.add(a.id); }));
    return set.size;
  }, [accepted]);

  const fosCancelled = accepted.filter((r) =>
    r.affected.some((a) => a.kind === 'FO' && a.change === 'cancelled'),
  ).length;

  const totalActions = accepted.reduce((sum, r) => sum + r.tmActions.length, 0);

  const showToast = (m: string) => {
    setToastMessage(m);
    setToastOpen(true);
  };

  const handleSave = useCallback(() => {
    setSaved(true);
    onSessionSaved();
    showToast(`${accepted.length} changes committed to TM · ${totalActions} actions`);
  }, [accepted, totalActions, onSessionSaved]);

  const handleDiscard = useCallback(() => {
    showToast('All decisions discarded — no changes written to TM');
  }, []);

  const acceptedByRule = useMemo(() => {
    const map = new Map<RuleId, ChangeRow[]>();
    accepted.forEach((r) => {
      const arr = map.get(r.ruleId) ?? [];
      arr.push(r);
      map.set(r.ruleId, arr);
    });
    return map;
  }, [accepted]);

  // Deterministic KPI comparison — same numbers Before vs After, derived from accepted changes
  const beforeKPIs = [
    { label: 'Pallets total', value: '1,944' },
    { label: 'Number of FOs', value: '12' },
    { label: 'Number of stops', value: '28' },
    { label: 'Unplanned FUs', value: '0' },
    { label: 'Utilization', value: '83.4%' },
    { label: 'Total distance / day', value: '9,406 km' },
    { label: 'Pallets per FO (avg)', value: '162' },
    { label: 'Distance per FO (avg)', value: '157 km' },
    { label: 'Tour plan cost', value: '€23,997' },
  ];
  // After numbers: small deltas based on accepted changes
  const afterKPIs = [
    { label: 'Pallets total', value: '1,944' },
    { label: 'Number of FOs', value: `${12 - fosCancelled}` },
    { label: 'Number of stops', value: `${28 - (accepted.length > 0 ? 2 : 0)}` },
    { label: 'Unplanned FUs', value: '0' },
    { label: 'Utilization', value: '86.1%' },
    { label: 'Total distance / day', value: '9,128 km' },
    { label: 'Pallets per FO (avg)', value: '177' },
    { label: 'Distance per FO (avg)', value: '152 km' },
    { label: 'Tour plan cost', value: '€22,718' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: `-${sp.l}` }}>
      <PageTitle
        title="Change Summary"
        subtitle={saved ? undefined : "Final review before save. To change a decision, go back to the previous step."}
        trailing={
          <>
            {accepted.length > 0 && (
              <ObjectStatus state="Positive" icon={<Icon name="accept" />}>
                {accepted.length} accepted
              </ObjectStatus>
            )}
            {rejected.length > 0 && (
              <ObjectStatus state="Critical" icon={<Icon name="decline" />}>
                {rejected.length} rejected
              </ObjectStatus>
            )}
            {discarded.length > 0 && (
              <ObjectStatus state="None" icon={<Icon name="sys-cancel" />}>
                {discarded.length} skipped
              </ObjectStatus>
            )}
            <Text style={labelText}>· session-local until save</Text>
          </>
        }
      />

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: sp.l }}>

        {saved ? (
          /* Completion state — shown after Save to TM fires. Replaces the entire summary
             body with a focused success message + a CTA back to step 1. */
          <div
            style={{
              ...cardSurface,
              padding: `${sp.l} ${sp.l} ${sp.xl ?? sp.l}`,
              maxWidth: 640,
              margin: `${sp.xl ?? sp.l} auto`,
              textAlign: 'center',
            }}
          >
            <IllustratedMessage
              name="SuccessScreen"
              titleText="Plan saved to TM"
              subtitleText={`${accepted.length} change${accepted.length === 1 ? '' : 's'} committed · ${totalActions} TM action${totalActions === 1 ? '' : 's'} · ${fosAffected} freight order${fosAffected === 1 ? '' : 's'} affected · session ${SESSION_ID}`}
            />
            <FlexBox justifyContent="Center" style={{ marginTop: sp.l }}>
              <Button
                design="Emphasized"
                icon="add"
                onClick={onStartNewSession}
              >
                Start a new session
              </Button>
            </FlexBox>
          </div>
        ) : (
          <>

        {/* Roll-up tiles */}
        <div style={{ ...cardSurface, padding: sp.m, marginBottom: sp.m }}>
          <div style={sectionTitle}>Session Impact</div>
          <div
            style={{
              marginTop: sp.s,
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))',
              gap: sp.m,
            }}
          >
            <KpiBlock label="Changes" value={`${accepted.length}`} />
            <KpiBlock label="FOs affected" value={`${fosAffected}`} />
            <KpiBlock label="FOs cancelled" value={`${fosCancelled}`} />
            <KpiBlock label="TM actions" value={`${totalActions}`} />
          </div>
        </div>

        {/* KPI comparison — before vs after */}
        <div style={{ ...cardSurface, padding: sp.m, marginBottom: sp.m }}>
          <div style={sectionTitle}>KPI Comparison — Before vs After</div>
          <Text style={{ ...labelText, display: 'block', marginTop: '2px' }}>
            Each row pairs the same KPI before and after the accepted changes are committed.
          </Text>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr 1fr',
            marginTop: sp.s,
            border: '1px solid var(--sapList_BorderColor)',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            {/* Header row */}
            <div style={{
              padding: sp.s,
              background: 'var(--sapList_HeaderBackground, #f7f7f7)',
              borderBottom: '1px solid var(--sapList_BorderColor)',
              borderRight: '1px solid var(--sapList_BorderColor)',
            }}>
              <Text style={{ ...labelText, fontWeight: 700 }}>KPI</Text>
            </div>
            <div style={{
              padding: sp.s,
              background: 'var(--sapList_HeaderBackground, #f7f7f7)',
              borderBottom: '1px solid var(--sapList_BorderColor)',
              borderRight: '1px solid var(--sapList_BorderColor)',
            }}>
              <Text style={{ ...labelText, fontWeight: 700 }}>Before</Text>
            </div>
            <div style={{
              padding: sp.s,
              background: 'var(--sapList_HeaderBackground, #f7f7f7)',
              borderBottom: '1px solid var(--sapList_BorderColor)',
            }}>
              <Text style={{ ...labelText, fontWeight: 700 }}>After</Text>
            </div>
            {/* Body — paired rows */}
            {beforeKPIs.map((b, i) => {
              const a = afterKPIs[i];
              return (
                <React.Fragment key={b.label}>
                  <div style={{
                    padding: sp.s,
                    borderTop: i > 0 ? '1px solid var(--sapList_BorderColor)' : 'none',
                    borderRight: '1px solid var(--sapList_BorderColor)',
                    background: 'var(--sapList_Background, #fff)',
                  }}>
                    <Text style={{ ...bodyText, fontSize: 'var(--sapFontSmallSize)' }}>{b.label}</Text>
                  </div>
                  <div style={{
                    padding: sp.s,
                    borderTop: i > 0 ? '1px solid var(--sapList_BorderColor)' : 'none',
                    borderRight: '1px solid var(--sapList_BorderColor)',
                    background: 'var(--sapList_Background, #fff)',
                  }}>
                    <Text style={{ ...bodyText, fontSize: 'var(--sapFontSmallSize)' }}>{b.value}</Text>
                  </div>
                  <div style={{
                    padding: sp.s,
                    borderTop: i > 0 ? '1px solid var(--sapList_BorderColor)' : 'none',
                    background: 'var(--sapSuccessBackground, #f5faf5)',
                  }}>
                    <Text style={{ ...bodyText, fontSize: 'var(--sapFontSmallSize)', fontWeight: 700 }}>{a.value}</Text>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Empty state */}
        {accepted.length === 0 && rejected.length === 0 && discarded.length === 0 && (
          <div style={{ ...cardSurface, padding: sp.l, textAlign: 'center' }}>
            <IllustratedMessage
              name="NoData"
              titleText="No decisions to save"
              subtitleText="Go back to Planning & review to accept or reject proposals."
            />
          </div>
        )}

        {/* Accepted changes — grouped by rule, read-only */}
        {accepted.length > 0 && (
          <FlexBox alignItems="Center" style={{ gap: sp.s, marginBottom: sp.s }}>
            <Text style={sectionTitle}>Accepted Changes · Grouped by Rule · {acceptedByRule.size} rule{acceptedByRule.size === 1 ? '' : 's'} fired</Text>
          </FlexBox>
        )}

        {Array.from(acceptedByRule.entries()).map(([rid, items]) => (
          <div key={rid} style={{ ...cardSurface, padding: sp.m, marginBottom: sp.m }}>
            <FlexBox alignItems="Center" style={{ gap: sp.s, marginBottom: sp.s, flexWrap: 'wrap' }}>
              <Tag design="Set2" colorScheme="6">{rid}</Tag>
              <Text style={{ ...bodyText, fontWeight: 700 }}>
                {RULE_LABELS[rid]}
              </Text>
              <Text style={labelText}>· {items.length} change{items.length === 1 ? '' : 's'}</Text>
            </FlexBox>
            <div style={{ display: 'flex', flexDirection: 'column', gap: sp.xs }}>
              {items.map((row) => (
                <FlexBox
                  key={row.id}
                  alignItems="Center"
                  justifyContent="SpaceBetween"
                  style={{
                    padding: sp.s, paddingLeft: sp.m, paddingRight: sp.m,
                    border: '1px solid var(--sapList_BorderColor)',
                    borderRadius: 4,
                    background: 'var(--sapList_Background, #fff)',
                    gap: sp.s, flexWrap: 'wrap',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Text style={{ ...bodyText, fontWeight: 700 }}>
                      {row.id} · {row.title}
                    </Text>
                    <Text style={{ ...labelText, display: 'block', marginTop: '2px' }}>
                      {row.beforeSummary} <span style={{ margin: '0 6px' }}>→</span> {row.afterSummary}
                    </Text>
                  </div>
                </FlexBox>
              ))}
            </div>
          </div>
        ))}

        {/* Rejected — collapsible read-only summary */}
        {rejected.length > 0 && (
          <div style={{ ...cardSurface, padding: sp.m, marginTop: sp.m }}>
            <button
              type="button"
              onClick={() => setRejectedExpanded((e) => !e)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: sp.xs,
                background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)',
                color: 'var(--sapTextColor)', textAlign: 'left',
              }}
              aria-expanded={rejectedExpanded}
            >
              <Icon name={rejectedExpanded ? 'navigation-down-arrow' : 'navigation-right-arrow'} />
              <Text style={{ ...bodyText, fontWeight: 700 }}>
                Rejected ({rejected.length})
              </Text>
              <Text style={{ ...labelText, marginLeft: sp.xs }}>
                Recorded in audit log — no TM write-back
              </Text>
            </button>
            {rejectedExpanded && (
              <div style={{ marginTop: sp.s, display: 'flex', flexDirection: 'column', gap: sp.xs }}>
                {rejected.map((row) => (
                  <FlexBox
                    key={row.id}
                    alignItems="Start"
                    style={{
                      padding: sp.s, paddingLeft: sp.m, paddingRight: sp.m,
                      border: '1px solid var(--sapList_BorderColor)', borderRadius: 4, gap: sp.s, flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <FlexBox alignItems="Center" style={{ gap: sp.xs, flexWrap: 'wrap' }}>
                        <Tag design="Set2" colorScheme="6">{row.ruleId}</Tag>
                        <Text style={{ ...bodyText, fontWeight: 700 }}>
                          {row.id} · {row.title}
                        </Text>
                      </FlexBox>
                      <Text style={{ ...labelText, display: 'block', marginTop: '2px' }}>
                        Reason: {row.rejectReason ?? 'no note'}
                      </Text>
                    </div>
                  </FlexBox>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Skipped (no action) — discarded packages: acknowledged no-sol, or stale-discard.
            Logged in audit but no TM write. Distinct from rejected, which is an explicit refusal. */}
        {discarded.length > 0 && (
          <div style={{ ...cardSurface, padding: sp.m, marginTop: sp.m }}>
            <button
              type="button"
              onClick={() => setDiscardedExpanded((e) => !e)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: sp.xs,
                background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)',
                color: 'var(--sapTextColor)', textAlign: 'left',
              }}
              aria-expanded={discardedExpanded}
            >
              <Icon name={discardedExpanded ? 'navigation-down-arrow' : 'navigation-right-arrow'} />
              <Text style={{ ...bodyText, fontWeight: 700 }}>
                Skipped — no action ({discarded.length})
              </Text>
              <Text style={{ ...labelText, marginLeft: sp.xs }}>
                Acknowledged no-solution or discarded stale · no TM write-back
              </Text>
            </button>
            {discardedExpanded && (
              <div style={{ marginTop: sp.s, display: 'flex', flexDirection: 'column', gap: sp.xs }}>
                {discarded.map((row) => (
                  <FlexBox
                    key={row.id}
                    alignItems="Start"
                    style={{
                      padding: sp.s, paddingLeft: sp.m, paddingRight: sp.m,
                      border: '1px solid var(--sapList_BorderColor)', borderRadius: 4, gap: sp.s, flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <FlexBox alignItems="Center" style={{ gap: sp.xs, flexWrap: 'wrap' }}>
                        <Tag design="Set2" colorScheme="6">{row.ruleId}</Tag>
                        <Text style={{ ...bodyText, fontWeight: 700 }}>
                          {row.id} · {row.title}
                        </Text>
                      </FlexBox>
                      <Text style={{ ...labelText, display: 'block', marginTop: '2px' }}>
                        Reason: {row.discardReason ?? 'planner skipped'}
                      </Text>
                    </div>
                  </FlexBox>
                ))}
              </div>
            )}
          </div>
        )}

          </>
        )}
      </div>

      {/* Sticky footer — hidden after save; the completion state has its own CTA. */}
      {!saved && (
        <div
          style={{
            padding: `${sp.s} ${sp.l}`,
            borderTop: '1px solid var(--sapList_BorderColor)',
            background: 'var(--sapObjectHeader_Background, #fff)',
          }}
        >
          <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ gap: sp.s, flexWrap: 'wrap' }}>
            <Text style={labelText}>
              {accepted.length === 0
                ? 'No accepted changes to save. Go back to step 4 to review proposals, or discard to clear this session.'
                : `Save commits ${totalActions} TM action${totalActions === 1 ? '' : 's'} across ${fosAffected} freight order${fosAffected === 1 ? '' : 's'}. Discard clears the session without writing to TM.`}
            </Text>
            <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
              <Button design="Transparent" icon="decline" disabled={accepted.length + rejected.length + discarded.length === 0} onClick={handleDiscard}>
                Discard
              </Button>
              <Button
                design="Emphasized"
                icon="save"
                disabled={accepted.length === 0}
                onClick={handleSave}
              >
                Save to TM
              </Button>
            </FlexBox>
          </FlexBox>
        </div>
      )}

      <Toast open={toastOpen} duration={3500} placement="BottomCenter" onClose={() => setToastOpen(false)}>
        {toastMessage}
      </Toast>
    </div>
  );
};

// ============================================================================
// VIEW 5 — Audit & Traceability (HI-FI)
// Defaults: current planner, current rule profile, last 30 days. Click any row
// to open a read-only master-detail drawer with the V3 detail anatomy.
// ============================================================================

interface AuditEntry {
  ts: string;                  // 'YYYY-MM-DD HH:mm'
  planner: string;
  sessionId: string;
  ruleProfile: string;
  pkgId: string;
  packageTitle: string;
  ruleId: RuleId;
  decision: 'accepted' | 'rejected' | 'stale' | 'no-feasible';
  note?: string;
  whyText?: string;
  affected?: AffectedObject[];
  before?: string[];
  after?: string[];
  tmActions?: string[];
}

const TODAY_DATE = '2026-05-27';
const DATE_7D    = '2026-05-20';
const DATE_30D   = '2026-04-27';
const DATE_90D   = '2026-02-26';

const CURRENT_PROFILE = 'DE-South Standard (v3.4)';

const MOCK_AUDIT: AuditEntry[] = [
  // Today — current session #4821
  {
    ts: '2026-05-27 09:14', planner: 'M. Schmidt', sessionId: '#4821',
    ruleProfile: CURRENT_PROFILE, pkgId: 'PKG-01', packageTitle: 'Remove stop S-14 from FO-001',
    ruleId: 'R-001', decision: 'accepted',
    whyText: 'Stop S-14 carries only 3 pallets, below the 5-pallet minimum. Fits FO-006 next-day route.',
    affected: [
      { kind: 'FO', id: 'FO-001', change: '-1 stop, -3 pallets' },
      { kind: 'Stop', id: 'S-14', change: 'reassigned to FO-006' },
    ],
    before: ['FO-001 · 8 stops · 24 pl'],
    after: ['FO-001 · 7 stops · 21 pl'],
    tmActions: ['Remove Stop S-14 from FO-001', 'Append Stop S-14 to FO-006'],
  },
  {
    ts: '2026-05-27 09:13', planner: 'M. Schmidt', sessionId: '#4821',
    ruleProfile: CURRENT_PROFILE, pkgId: 'PKG-02', packageTitle: 'Reassign FU-2107 to FO-014',
    ruleId: 'R-002', decision: 'accepted',
    whyText: 'FO-014 has 3 pallets of headroom against the 30-pallet cap. Reassigning FU-2107 (1 pallet) brings it to 28/30 — within tolerance.',
    affected: [
      { kind: 'FU', id: 'FU-2107', change: 'moved FO-016 → FO-014' },
      { kind: 'FO', id: 'FO-014', change: '+1 FU, +1 pallet' },
    ],
    before: ['FO-014 · 27 pallets · 90% cap'],
    after: ['FO-014 · 28 pallets · 93% cap'],
    tmActions: ['Reassign FU-2107 from FO-016 to FO-014'],
  },
  {
    ts: '2026-05-27 09:11', planner: 'M. Schmidt', sessionId: '#4821',
    ruleProfile: CURRENT_PROFILE, pkgId: 'PKG-03', packageTitle: 'Consolidate FO-002 into FO-001',
    ruleId: 'R-003', decision: 'accepted', note: 'Confirmed with dispatch',
    whyText: 'FO-001 and FO-002 share stage S-08 → S-12. Combined load (28 pallets) within 30-pallet FO capacity.',
    affected: [
      { kind: 'FO', id: 'FO-001', change: '+3 stops, +51 pallets' },
      { kind: 'FO', id: 'FO-002', change: 'cancelled' },
    ],
    before: ['FO-001 · 8 stops · 24 pl', 'FO-002 · 3 stops · 11 pl'],
    after: ['FO-001 · 11 stops · 28 pl', 'FO-002 · cancelled'],
    tmActions: ['Reassign FU-2241..2253 from FO-002 to FO-001', 'Cancel FO-002'],
  },
  {
    ts: '2026-05-27 09:08', planner: 'M. Schmidt', sessionId: '#4821',
    ruleProfile: CURRENT_PROFILE, pkgId: 'PKG-12', packageTitle: 'Reassign FU-2155 (capacity ±5%)',
    ruleId: 'R-002', decision: 'rejected', note: 'Customer-specific routing constraint — keep on original FO',
    whyText: 'Rule R-002 fired but planner override.',
    affected: [{ kind: 'FU', id: 'FU-2155', change: 'no change (rejected)' }],
    before: ['FO-016 · 95% cap'],
    after: ['no change'],
    tmActions: [],
  },
  {
    ts: '2026-05-27 09:02', planner: 'M. Schmidt', sessionId: '#4821',
    ruleProfile: CURRENT_PROFILE, pkgId: 'PKG-06', packageTitle: 'Remove stop S-19 from FO-002',
    ruleId: 'R-001', decision: 'stale', note: 'FO-002 cancelled by PKG-03',
    whyText: 'Originally proposed to reassign Stop S-19 to FO-002. After PKG-03 cancelled FO-002, no admissible target.',
    affected: [{ kind: 'FO', id: 'FO-002', change: 'cancelled by PKG-03' }],
    before: ['Source FO · 5 stops · 18 pl'],
    after: ['—'],
    tmActions: [],
  },
  {
    ts: '2026-05-27 08:50', planner: 'M. Schmidt', sessionId: '#4821',
    ruleProfile: CURRENT_PROFILE, pkgId: 'PKG-07', packageTitle: 'Reassign FU-2418 (capacity ±5%)',
    ruleId: 'R-002', decision: 'no-feasible',
    whyText: 'No admissible target FO has both stage-compatibility and capacity headroom for FU-2418 (820 kg).',
    affected: [{ kind: 'FU', id: 'FU-2418', change: 'no admissible target' }],
    before: [], after: [], tmActions: [],
  },
  // Yesterday
  {
    ts: '2026-05-26 14:30', planner: 'M. Schmidt', sessionId: '#4820',
    ruleProfile: CURRENT_PROFILE, pkgId: 'PKG-44', packageTitle: 'Re-sequence stops on FO-003',
    ruleId: 'R-007', decision: 'accepted',
    whyText: 'Time-window violation on S-19 (10:00–12:00, ETA 12:22). Re-sequence to position 2 fixes it.',
    affected: [{ kind: 'FO', id: 'FO-003', change: 'stop sequence changed' }],
    before: ['S-19 ETA 12:22 (late)'], after: ['S-19 ETA 11:18 (in window)'],
    tmActions: ['Re-sequence stops on FO-003'],
  },
  {
    ts: '2026-05-26 14:28', planner: 'M. Schmidt', sessionId: '#4820',
    ruleProfile: CURRENT_PROFILE, pkgId: 'PKG-45', packageTitle: 'Cancel FO-004 (single-stop, 3 pl)',
    ruleId: 'R-004', decision: 'accepted',
  },
  {
    ts: '2026-05-25 09:00', planner: 'P. Klein', sessionId: '#4815',
    ruleProfile: CURRENT_PROFILE, pkgId: 'PKG-58', packageTitle: 'Consolidate FO-010 into FO-007',
    ruleId: 'R-003', decision: 'rejected', note: 'Driver knowledge — keep separate',
  },
  // Last week
  {
    ts: '2026-05-22 11:00', planner: 'M. Schmidt', sessionId: '#4810',
    ruleProfile: CURRENT_PROFILE, pkgId: 'PKG-71', packageTitle: 'Reassign FU-1980 to FO-012',
    ruleId: 'R-002', decision: 'accepted',
  },
  {
    ts: '2026-05-18 15:30', planner: 'P. Klein', sessionId: '#4807',
    ruleProfile: CURRENT_PROFILE, pkgId: 'PKG-22', packageTitle: 'Remove stop S-08 from FO-017',
    ruleId: 'R-001', decision: 'accepted',
  },
  {
    ts: '2026-05-18 15:28', planner: 'P. Klein', sessionId: '#4807',
    ruleProfile: CURRENT_PROFILE, pkgId: 'PKG-23', packageTitle: 'Cancel FO-015',
    ruleId: 'R-004', decision: 'accepted',
  },
  {
    ts: '2026-05-18 14:51', planner: 'S. Wagner', sessionId: '#4805',
    ruleProfile: 'DE-South Strict (v1.2)', pkgId: 'PKG-19', packageTitle: 'Consolidate FO-001 into FO-019',
    ruleId: 'R-003', decision: 'rejected', note: 'Stage mismatch',
  },
  {
    ts: '2026-05-17 11:02', planner: 'M. Schmidt', sessionId: '#4790',
    ruleProfile: CURRENT_PROFILE, pkgId: 'PKG-31', packageTitle: 'Cancel FO-002 (single-stop, 4 pl)',
    ruleId: 'R-004', decision: 'accepted',
  },
  // Mid-month
  {
    ts: '2026-05-12 10:30', planner: 'M. Schmidt', sessionId: '#4780',
    ruleProfile: CURRENT_PROFILE, pkgId: 'PKG-77', packageTitle: 'Re-sequence stops on FO-003',
    ruleId: 'R-007', decision: 'accepted',
  },
  {
    ts: '2026-05-08 09:15', planner: 'M. Schmidt', sessionId: '#4770',
    ruleProfile: 'DE-South Standard (v3.3)', pkgId: 'PKG-92', packageTitle: 'Reassign FU-1654 (capacity ±7%)',
    ruleId: 'R-002', decision: 'accepted', note: 'Pre-v3.4 tolerance window',
  },
  // Edge of 30-day window
  {
    ts: '2026-04-30 14:00', planner: 'M. Schmidt', sessionId: '#4720',
    ruleProfile: 'DE-South Standard (v3.3)', pkgId: 'PKG-115', packageTitle: 'Remove stop S-14 from FO-004',
    ruleId: 'R-001', decision: 'accepted',
  },
  // Beyond 30 days
  {
    ts: '2026-04-22 10:00', planner: 'M. Schmidt', sessionId: '#4690',
    ruleProfile: 'DE-South Standard (v3.3)', pkgId: 'PKG-128', packageTitle: 'Consolidate FO-006 into FO-005',
    ruleId: 'R-003', decision: 'accepted',
  },
  {
    ts: '2026-04-15 09:30', planner: 'P. Klein', sessionId: '#4670',
    ruleProfile: 'DE-South Standard (v3.3)', pkgId: 'PKG-141', packageTitle: 'Cancel FO-007',
    ruleId: 'R-004', decision: 'rejected', note: 'Customer commitment',
  },
  // Beyond 90 days
  {
    ts: '2026-02-25 08:00', planner: 'A. Müller', sessionId: '#4500',
    ruleProfile: 'DE-South Standard (v3.2)', pkgId: 'PKG-202', packageTitle: 'Reassign FU-1240 (capacity ±5%)',
    ruleId: 'R-002', decision: 'accepted', note: 'Profile v3.2 era',
  },
];

type DateRange = '7d' | '30d' | '90d' | 'all';

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  '7d':  'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  'all': 'All time',
};

const DATE_RANGE_CUTOFFS: Record<DateRange, string | null> = {
  '7d':  DATE_7D,
  '30d': DATE_30D,
  '90d': DATE_90D,
  'all': null,
};

const decisionGlyph = (d: AuditEntry['decision']) => {
  switch (d) {
    case 'accepted':    return <ObjectStatus state="Positive" icon={<Icon name="accept" />}>Accepted</ObjectStatus>;
    case 'rejected':    return <ObjectStatus state="Critical" icon={<Icon name="decline" />}>Rejected</ObjectStatus>;
    case 'stale':       return <ObjectStatus state="Critical" icon={<Icon name="alert" />}>Stale</ObjectStatus>;
    case 'no-feasible': return <ObjectStatus state="Negative" icon={<Icon name="border" />}>No solution</ObjectStatus>;
  }
};

interface AuditDrawerProps {
  entry: AuditEntry;
  onClose: () => void;
}
const AuditDrawer: React.FC<AuditDrawerProps> = ({ entry, onClose }) => (
  <aside
    style={{
      width: 460, flexShrink: 0,
      border: '1px solid var(--sapList_BorderColor)',
      borderRadius: 'var(--sapElement_BorderCornerRadius, 8px)',
      background: 'var(--sapBaseColor, #fff)',
      display: 'flex', flexDirection: 'column', minHeight: 0,
      overflow: 'hidden',
    }}
  >
    {/* Drawer header */}
    <div
      style={{
        padding: `${sp.s} ${sp.m}`,
        borderBottom: '1px solid var(--sapList_BorderColor)',
        background: 'var(--sapObjectHeader_Background, #fff)',
      }}
    >
      <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ gap: sp.s }}>
        <FlexBox alignItems="Center" style={{ gap: sp.xs, flexWrap: 'wrap' }}>
          <Text style={{ ...labelText, fontWeight: 'var(--sapFontBoldWeight, 700)' }}>{entry.pkgId}</Text>
          <Tag design="Set2" colorScheme="6">{entry.ruleId}</Tag>
          {decisionGlyph(entry.decision)}
        </FlexBox>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close detail"
          title="Close"
          style={{
            width: 28, height: 28, border: 'none', borderRadius: 4, cursor: 'pointer',
            background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon name="decline" />
        </button>
      </FlexBox>
      <Title level="H5" style={{ marginTop: sp.xs }}>{entry.packageTitle}</Title>
      <Text style={{ ...labelText, display: 'block', marginTop: '2px' }}>
        {entry.ts} · {entry.planner} · session {entry.sessionId} · {entry.ruleProfile}
      </Text>
    </div>

    {/* Drawer scroll body */}
    <div style={{ flex: 1, overflowY: 'auto', padding: sp.m }}>
      <MessageStrip design="Information" hideCloseButton style={{ marginBottom: sp.m }}>
        Read-only · this is the recorded decision. The package detail mirrors V3 with all actions disabled.
      </MessageStrip>

      {entry.whyText && (
        <div style={{ ...cardSurface, padding: sp.m, marginBottom: sp.m }}>
          <div style={sectionTitle}>Why</div>
          <Text style={{ ...bodyText, display: 'block', marginTop: sp.xs }}>{entry.whyText}</Text>
        </div>
      )}

      {entry.affected && entry.affected.length > 0 && (
        <div style={{ ...cardSurface, padding: sp.m, marginBottom: sp.m }}>
          <div style={sectionTitle}>Affected ({entry.affected.length})</div>
          <div style={{ marginTop: sp.s, display: 'flex', flexDirection: 'column', gap: sp.xs }}>
            {entry.affected.map((o, i) => (
              <FlexBox key={i} alignItems="Center" style={{ gap: sp.xs }}>
                <ObjectKindIcon kind={o.kind} />
                <Text style={{ ...bodyText, fontWeight: 'var(--sapFontBoldWeight, 700)' }}>{o.id}</Text>
                <Text style={labelText}>· {o.change}</Text>
              </FlexBox>
            ))}
          </div>
        </div>
      )}

      {entry.before && entry.before.length > 0 && entry.after && entry.after.length > 0 && (
        <div style={{ ...cardSurface, padding: sp.m, marginBottom: sp.m }}>
          <div style={sectionTitle}>Before / After</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 24px 1fr', gap: sp.s, marginTop: sp.s, alignItems: 'center' }}>
            <div>
              <Text style={labelText}>Before (current)</Text>
              <div style={{ marginTop: sp.xs, padding: sp.s, background: 'var(--sapField_Background)', border: '1px solid var(--sapField_BorderColor)', borderRadius: 4 }}>
                {entry.before.map((line, i) => (
                  <Text key={i} style={{ display: 'block', fontFamily: 'var(--sapFontMonospaceFamily, ui-monospace, monospace)', fontSize: 'var(--sapFontSmallSize)' }}>
                    {line}
                  </Text>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'center', color: 'var(--sapContent_LabelColor)' }}>
              <Icon name="arrow-right" />
            </div>
            <div>
              <Text style={labelText}>After (refined)</Text>
              <div
                style={{
                  marginTop: sp.xs, padding: sp.s, borderRadius: 4,
                  background: entry.decision === 'accepted'
                    ? 'var(--sapSuccessBackground, #f5faf5)'
                    : 'var(--sapField_Background)',
                  border: entry.decision === 'accepted'
                    ? '1px solid var(--sapSuccessBorderColor, #b5e3b8)'
                    : '1px solid var(--sapField_BorderColor)',
                }}
              >
                {entry.after.map((line, i) => (
                  <Text key={i} style={{ display: 'block', fontFamily: 'var(--sapFontMonospaceFamily, ui-monospace, monospace)', fontSize: 'var(--sapFontSmallSize)' }}>
                    {line}
                  </Text>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {entry.tmActions && entry.tmActions.length > 0 && (
        <div style={{ ...cardSurface, padding: sp.m, marginBottom: sp.m }}>
          <div style={sectionTitle}>TM Actions ({entry.tmActions.length})</div>
          <ol style={{ marginTop: sp.s, paddingLeft: sp.l, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {entry.tmActions.map((a, i) => (
              <li key={i}>
                <Text style={{ ...bodyText, fontSize: 'var(--sapFontSmallSize)' }}>{a}</Text>
              </li>
            ))}
          </ol>
        </div>
      )}

      {entry.note && (
        <div style={{ ...cardSurface, padding: sp.m }}>
          <div style={sectionTitle}>Planner Note</div>
          <Text style={{ ...bodyText, display: 'block', marginTop: sp.xs, fontStyle: 'italic' }}>
            "{entry.note}"
          </Text>
        </div>
      )}

      {/* Disabled action footer to make the read-only contract visible */}
      <div style={{ marginTop: sp.m, padding: sp.s, background: 'var(--sapField_ReadOnly_Background, #f5f5f5)', border: '1px solid var(--sapField_BorderColor)', borderRadius: 4 }}>
        <FlexBox alignItems="Center" justifyContent="End" style={{ gap: sp.xs }}>
          <Button design="Transparent" icon="decline" disabled>Reject</Button>
          <Button design="Emphasized" icon="accept" disabled>Accept</Button>
        </FlexBox>
      </div>
    </div>
  </aside>
);

const View5Audit: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [scope, setScope] = useState<'session' | 'all'>('all');
  const [planner, setPlanner] = useState<'me' | 'all'>('me');
  const [profile, setProfile] = useState<'current' | 'all'>('current');
  const [rule, setRule] = useState<'all' | RuleId>('all');
  const [decision, setDecision] = useState<'all' | AuditEntry['decision']>('all');
  const [selected, setSelected] = useState<AuditEntry | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (m: string) => {
    setToastMessage(m);
    setToastOpen(true);
  };

  const filtered = useMemo(() => {
    let data = MOCK_AUDIT;
    const cutoff = DATE_RANGE_CUTOFFS[dateRange];
    if (cutoff) data = data.filter((e) => e.ts.slice(0, 10) >= cutoff);
    if (scope === 'session') data = data.filter((e) => e.sessionId === '#4821');
    if (planner === 'me') data = data.filter((e) => e.planner === 'M. Schmidt');
    if (profile === 'current') data = data.filter((e) => e.ruleProfile === CURRENT_PROFILE);
    if (rule !== 'all') data = data.filter((e) => e.ruleId === rule);
    if (decision !== 'all') data = data.filter((e) => e.decision === decision);
    return data;
  }, [dateRange, scope, planner, profile, rule, decision]);

  const isDefaultFilter =
    dateRange === '30d' && scope === 'all' && planner === 'me' &&
    profile === 'current' && rule === 'all' && decision === 'all';

  const handleResetDefaults = () => {
    setDateRange('30d');
    setScope('all');
    setPlanner('me');
    setProfile('current');
    setRule('all');
    setDecision('all');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: `-${sp.l}` }}>
      <PageTitle
        title="Audit & Traceability"
        subtitle="Decision log across sessions. Defaults: your decisions on the current rule profile, last 30 days. Click any row to see the recorded detail."
        trailing={
          <Button design="Transparent" icon="excel-attachment" onClick={() => showToast(`Exporting ${filtered.length} entries as CSV…`)}>
            Export CSV
          </Button>
        }
      />

      {/* Body — filter bar full-width on top, then a flex row of table (left) + drawer (right). */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Filter bar — full width, doesn't shrink when the drawer opens */}
        <div style={{ padding: `${sp.l} ${sp.l} ${sp.m}` }}>
          <div style={{ ...cardSurface, padding: sp.m }}>
            <FlexBox alignItems="Center" style={{ gap: sp.l, flexWrap: 'wrap' }}>
              <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
                <Label>Date range</Label>
                <Select
                  onChange={(e) => {
                    const v = (e.detail.selectedOption as HTMLElement | null)?.getAttribute('data-value');
                    if (v) setDateRange(v as DateRange);
                  }}
                  style={{ width: 180 }}
                >
                  {(['7d', '30d', '90d', 'all'] as DateRange[]).map((d) => (
                    <Option key={d} data-value={d} selected={dateRange === d}>
                      {DATE_RANGE_LABELS[d]}
                    </Option>
                  ))}
                </Select>
              </FlexBox>

              <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
                <Label>Scope</Label>
                <Select
                  onChange={(e) => {
                    const v = (e.detail.selectedOption as HTMLElement | null)?.getAttribute('data-value');
                    if (v) setScope(v as 'session' | 'all');
                  }}
                  style={{ width: 200 }}
                >
                  <Option data-value="session" selected={scope === 'session'}>Current session ({SESSION_ID})</Option>
                  <Option data-value="all" selected={scope === 'all'}>All sessions</Option>
                </Select>
              </FlexBox>

              <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
                <Label>Planner</Label>
                <Select
                  onChange={(e) => {
                    const v = (e.detail.selectedOption as HTMLElement | null)?.getAttribute('data-value');
                    if (v) setPlanner(v as 'me' | 'all');
                  }}
                  style={{ width: 180 }}
                >
                  <Option data-value="me" selected={planner === 'me'}>{PLANNER} (you)</Option>
                  <Option data-value="all" selected={planner === 'all'}>All planners</Option>
                </Select>
              </FlexBox>

              <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
                <Label>Rule profile</Label>
                <Select
                  onChange={(e) => {
                    const v = (e.detail.selectedOption as HTMLElement | null)?.getAttribute('data-value');
                    if (v) setProfile(v as 'current' | 'all');
                  }}
                  style={{ width: 240 }}
                >
                  <Option data-value="current" selected={profile === 'current'}>Current ({CURRENT_PROFILE})</Option>
                  <Option data-value="all" selected={profile === 'all'}>All profiles</Option>
                </Select>
              </FlexBox>

              <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
                <Label>Rule</Label>
                <Select
                  onChange={(e) => {
                    const v = (e.detail.selectedOption as HTMLElement | null)?.getAttribute('data-value');
                    if (v) setRule(v as 'all' | RuleId);
                  }}
                  style={{ width: 200 }}
                >
                  <Option data-value="all" selected={rule === 'all'}>All rules</Option>
                  {(Object.keys(RULE_LABELS) as RuleId[]).map((r) => (
                    <Option key={r} data-value={r} selected={rule === r}>
                      {r}
                    </Option>
                  ))}
                </Select>
              </FlexBox>

              <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
                <Label>Decision</Label>
                <Select
                  onChange={(e) => {
                    const v = (e.detail.selectedOption as HTMLElement | null)?.getAttribute('data-value');
                    if (v) setDecision(v as typeof decision);
                  }}
                  style={{ width: 160 }}
                >
                  <Option data-value="all" selected={decision === 'all'}>All</Option>
                  <Option data-value="accepted" selected={decision === 'accepted'}>Accepted</Option>
                  <Option data-value="rejected" selected={decision === 'rejected'}>Rejected</Option>
                  <Option data-value="stale" selected={decision === 'stale'}>Stale</Option>
                  <Option data-value="no-feasible" selected={decision === 'no-feasible'}>No solution</Option>
                </Select>
              </FlexBox>
            </FlexBox>
          </div>
        </div>

        {/* Row split — table (left, shrinks when drawer opens) + drawer (right) */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0, padding: `0 ${sp.l} ${sp.l}`, gap: sp.m }}>
          {/* Left col — table card. minWidth:0 lets it shrink when the drawer opens. */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ ...cardSurface, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              {/* Table card header — entries count + filter chip, replaces the row that used to sit above the card */}
              <FlexBox
                alignItems="Center"
                style={{ gap: sp.s, padding: `${sp.s} ${sp.m}`, borderBottom: '1px solid var(--sapList_BorderColor)', flexWrap: 'wrap' }}
              >
                <Text style={labelText}>
                  <strong>{filtered.length}</strong> of {MOCK_AUDIT.length} entries
                </Text>
                {!isDefaultFilter && (
                  <>
                    <Text style={labelText}>·</Text>
                    <Button design="Transparent" icon="reset" onClick={handleResetDefaults}>
                      Reset to defaults
                    </Button>
                  </>
                )}
                {isDefaultFilter && (
                  <>
                    <Text style={labelText}>·</Text>
                    <Tag design="Set2" colorScheme="8">Default filter</Tag>
                  </>
                )}
              </FlexBox>

              {/* Scroll body — table scrolls inside the card, so the scrollbar stays within the card border */}
              <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: sp.l, textAlign: 'center' }}>
                <IllustratedMessage
                  name="NoFilterResults"
                  titleText="No decisions match"
                  subtitleText="Adjust the filters above or reset to defaults."
                />
              </div>
            ) : (
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontFamily: 'var(--sapFontFamily)',
                  fontSize: 'var(--sapFontSize)',
                }}
              >
                <thead>
                  <tr style={{ background: 'var(--sapList_HeaderBackground, #f7f7f7)', textAlign: 'left' }}>
                    <th style={thStyle}>Time</th>
                    <th style={thStyle}>Planner</th>
                    <th style={thStyle}>Session</th>
                    <th style={thStyle}>Profile</th>
                    <th style={thStyle}>Rule</th>
                    <th style={thStyle}>Package</th>
                    <th style={thStyle}>Decision</th>
                    <th style={thStyle}>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e, i) => {
                    const isSelected = selected?.pkgId === e.pkgId && selected?.ts === e.ts;
                    return (
                      <tr
                        key={`${e.ts}-${e.pkgId}-${i}`}
                        onClick={() => setSelected(e)}
                        style={{
                          borderTop: '1px solid var(--sapList_BorderColor)',
                          cursor: 'pointer',
                          background: isSelected ? 'var(--sapList_SelectionBackgroundColor, #e8f2ff)' : undefined,
                        }}
                      >
                        <td style={{ ...tdStyle, fontFamily: 'var(--sapFontMonospaceFamily, ui-monospace, monospace)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>
                          {e.ts}
                        </td>
                        <td style={tdStyle}>{e.planner}</td>
                        <td style={{ ...tdStyle, color: 'var(--sapContent_LabelColor)' }}>{e.sessionId}</td>
                        <td style={{ ...tdStyle, fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>
                          {e.ruleProfile}
                        </td>
                        <td style={tdStyle}>
                          <Tag design="Set2" colorScheme="6">{e.ruleId}</Tag>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 'var(--sapFontBoldWeight, 700)' }}>{e.pkgId}</td>
                        <td style={tdStyle}>{decisionGlyph(e.decision)}</td>
                        <td style={{ ...tdStyle, fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {e.note ?? '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
              </div>
            </div>
          </div>

        {/* Drawer */}
        {selected && <AuditDrawer entry={selected} onClose={() => setSelected(null)} />}
        </div>
      </div>

      <Toast open={toastOpen} duration={3000} placement="BottomCenter" onClose={() => setToastOpen(false)}>
        {toastMessage}
      </Toast>
    </div>
  );
};

const thStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontWeight: 'var(--sapFontBoldWeight, 700)',
  fontSize: 'var(--sapFontSmallSize)',
  color: 'var(--sapContent_LabelColor)',
};
const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
};

// ============================================================================
// VIEW 6 — Rule Maintenance (lo-fi)
// ============================================================================

interface RuleSetting {
  id: RuleId;
  active: boolean;
  paramLabel: string;
  paramValue: string;
  recentFires: number;
}

interface RuleProfile {
  id: string;
  name: string;
  version: string;
  status: 'published' | 'archived' | 'draft';
  approver?: string;
  approvedDate?: string;
  plannersUsing?: number;
  rules: RuleSetting[];
  history: { from: string; to: string; note: string }[];
}

const MOCK_PROFILES: RuleProfile[] = [
  {
    id: 'p1', name: 'DE-South Standard', version: '3.4', status: 'published',
    approver: 'A. Müller', approvedDate: '2026-04-30', plannersUsing: 8,
    rules: [
      { id: 'R-001', active: true, paramLabel: 'Threshold (pallets)', paramValue: '5', recentFires: 47 },
      { id: 'R-002', active: true, paramLabel: 'Tolerance', paramValue: '±5%', recentFires: 23 },
      { id: 'R-003', active: true, paramLabel: 'Stage match', paramValue: 'strict', recentFires: 12 },
      { id: 'R-004', active: true, paramLabel: 'Min pallets', paramValue: '5', recentFires: 8 },
      { id: 'R-007', active: true, paramLabel: 'Window grace (min)', paramValue: '0', recentFires: 5 },
    ],
    history: [
      { from: 'v3.3', to: 'v3.4', note: 'Lowered min-pallets threshold 4 → 5 (per ALDI Ops, 04-28)' },
      { from: 'v3.2', to: 'v3.3', note: 'Added R-007 time-window guard' },
      { from: 'v3.1', to: 'v3.2', note: 'Tightened capacity tolerance ±7% → ±5%' },
    ],
  },
  {
    id: 'p2', name: 'DE-South Strict', version: '1.2', status: 'published',
    approver: 'A. Müller', approvedDate: '2026-03-15', plannersUsing: 2,
    rules: [
      { id: 'R-001', active: true, paramLabel: 'Threshold (pallets)', paramValue: '8', recentFires: 12 },
      { id: 'R-002', active: true, paramLabel: 'Tolerance', paramValue: '±2%', recentFires: 6 },
      { id: 'R-003', active: false, paramLabel: 'Stage match', paramValue: 'strict', recentFires: 0 },
    ],
    history: [
      { from: 'v1.1', to: 'v1.2', note: 'Disabled R-003 consolidation' },
    ],
  },
  {
    id: 'p3', name: 'DE-North Standard', version: '2.1', status: 'published',
    approver: 'K. Becker', approvedDate: '2026-02-20', plannersUsing: 5,
    rules: [
      { id: 'R-001', active: true, paramLabel: 'Threshold (pallets)', paramValue: '4', recentFires: 31 },
      { id: 'R-002', active: true, paramLabel: 'Tolerance', paramValue: '±5%', recentFires: 18 },
    ],
    history: [],
  },
];

// ─── V6 — Rule Maintenance (simplified, 2 tabs, admin-only) ──────────────────
// Per direction (2026-06-16 final):
//   - No Planner POV / role toggle. Page lands directly on Rule Maintenance.
//   - Sandbox is out of scope. No sandbox stage, no sandbox tests, no sandbox checks.
//   - Two tabs:
//       Tab 1 — Rule Creation (default landing; the form, no list)
//       Tab 2 — Validation & Approval (two-pane: list left, detail right)
//   - Tab 2 detail: explainability core (in plain words / source / 7 backend checks)
//                   + approval section when stage permits
//   - Stages: draft → submitted → validation → approval → published | on-hold | rejected

type PipelineStage =
  | 'draft'
  | 'submitted'
  | 'validation'
  | 'approval'
  | 'published'
  | 'retired'
  | 'rejected';

// ValidationStatus: technical outcome from the backend gate
type ValidationStatus = 'supported' | 'detect-only' | 'not-supported' | 'pending';

type RuleType = 'hard-constraint' | 'preference';
type Priority = 'P1' | 'P2' | 'P3';

interface ProfileHeader {
  id: string;
  name: string;
  description: string;
  dc: string;
  country: string;
  owner: string;
  effectiveStart: string;
  effectiveEnd: string;
  status: 'active' | 'draft';
}

interface RuleRecord {
  id: string;
  name: string;
  type: RuleType;
  group: string;
  scope: string;
  conditions: string;
  actions: string;
  parameters: { key: string; value: string }[];
  exceptions: string;
  priority: Priority;
}

interface RuleDependencies {
  dependsOn: string[];
  mayConflictWith: string[];
  overrideBehavior: string;
  sequenceRestrictions: string[];
}

interface MappingProposal {
  tmEntities: string[];
  apiEndpoints: string[];
  fields: string[];
  actions: string[];
  llmConfidence: 'high' | 'medium' | 'low';
  llmNotes: string;
}

interface ValidationCheck {
  id: 'completeness' | 'context-availability' | 'tm-data-availability' | 'api-action-availability' | 'dependency-check' | 'missing-parameters';
  label: string;
  status: 'pass' | 'warning' | 'fail' | 'pending';
  detail: string;
}

interface RuleCandidate {
  id: string;
  profile: ProfileHeader;
  rule: RuleRecord;
  dependencies: RuleDependencies;
  mapping: MappingProposal;
  validationChecks: ValidationCheck[];
  validationStatus: ValidationStatus;   // gate outcome: supported | detect-only | not-supported | pending
  stage: PipelineStage;
  plannerInput: {
    description: string;
    businessReason: string;
    exampleScenario: string;
    attachedDocs: string[];
    tags: string[];
  };
  sourceDoc: 'BD27' | 'BD09';
  sourceCitation: string;
  sourceClause: string;
  submittedBy: string;
  submittedDate: string;
  daysInStage: number;
  approvedBy?: string;
  approvedDate?: string;
  firedLast7d?: number;
  retiredReason?: string;
  rejectedReason?: string;
}

const STAGE_LABEL: Record<PipelineStage, string> = {
  'draft':      'Draft',
  'submitted':  'Queued for Validation',
  'validation': 'Validation Complete',
  'approval':   'Approval Pending',
  'published':  'Published',
  'retired':    'Retired',
  'rejected':   'Rejected',
};

const STAGE_ICON: Record<PipelineStage, string> = {
  'draft':      'edit',
  'submitted':  'paper-plane',
  'validation': 'inspect',
  'approval':   'official-service',
  'published':  'sys-enter-2',
  'retired':    'pause',
  'rejected':   'decline',
};

const STAGE_SORT_INDEX: Record<PipelineStage, number> = {
  'approval':   0,
  'validation': 1,
  'submitted':  2,
  'draft':      3,
  'published':  4,
  'retired':    5,
  'rejected':   6,
};

const VALIDATION_STATUS_LABEL: Record<ValidationStatus, string> = {
  'supported':     'Supported',
  'detect-only':   'Detect-only',
  'not-supported': 'Not Supported',
  'pending':       'Pending',
};

const validationStatusState = (v: ValidationStatus): 'Positive' | 'Critical' | 'Negative' | 'None' =>
  v === 'supported' ? 'Positive' : v === 'detect-only' ? 'Critical' : v === 'not-supported' ? 'Negative' : 'None';

const RULE_TYPE_LABEL: Record<RuleType, string> = {
  'hard-constraint': 'Hard constraint',
  'preference': 'Preference',
};

const RULE_TYPE_COLOR: Record<RuleType, '2' | '6'> = {
  'hard-constraint': '2',
  'preference': '6',
};

const PRIORITY_COLOR: Record<Priority, '2' | '6' | '8'> = {
  'P1': '2',
  'P2': '6',
  'P3': '8',
};

const VALIDATION_CHECK_LABELS: Record<ValidationCheck['id'], string> = {
  'completeness':            'Rule Completeness',
  'context-availability':    'Required Context Availability',
  'tm-data-availability':    'TM Data Availability',
  'api-action-availability': 'API / Action Availability',
  'dependency-check':        'Internal Rule Dependencies',
  'missing-parameters':      'Missing Parameters',
};

const stageStatusState = (s: PipelineStage): 'Positive' | 'Critical' | 'Negative' | 'Information' | 'None' => {
  if (s === 'published') return 'Positive';
  if (s === 'retired')   return 'Critical';
  if (s === 'rejected')  return 'Negative';
  if (s === 'approval')  return 'Information';
  return 'None';
};

const checkStatusState = (s: ValidationCheck['status']): 'Positive' | 'Critical' | 'Negative' | 'None' =>
  s === 'pass' ? 'Positive' : s === 'warning' ? 'Critical' : s === 'fail' ? 'Negative' : 'None';

const checkStatusLabel = (s: ValidationCheck['status']): string =>
  s === 'pass' ? 'Passed' : s === 'warning' ? 'Warning' : s === 'fail' ? 'Failed' : 'Pending';

const computeValidationSummary = (checks: ValidationCheck[]) => ({
  passed: checks.filter((c) => c.status === 'pass').length,
  warnings: checks.filter((c) => c.status === 'warning').length,
  failed: checks.filter((c) => c.status === 'fail').length,
  pending: checks.filter((c) => c.status === 'pending').length,
});

type OverallValidation = 'all-pass' | 'partial' | 'failed' | 'pending';

const computeOverallValidation = (checks: ValidationCheck[]): OverallValidation => {
  if (checks.length === 0) return 'pending';
  const summary = computeValidationSummary(checks);
  if (summary.failed > 0) return 'failed';
  if (summary.warnings > 0 || summary.pending > 0) return 'partial';
  return 'all-pass';
};

const overallValidationState = (o: OverallValidation): 'Positive' | 'Critical' | 'Negative' | 'None' => {
  if (o === 'all-pass') return 'Positive';
  if (o === 'partial') return 'Critical';
  if (o === 'failed') return 'Negative';
  return 'None';
};

const overallValidationLabel = (o: OverallValidation): string => {
  if (o === 'all-pass') return 'All passed';
  if (o === 'partial') return 'Partial — has warnings';
  if (o === 'failed') return 'Failed';
  return 'Pending';
};

interface PlannerInputFormFields {
  description: string;
  businessReason: string;
  exampleScenario: string;
  attachedDocs: string[];
  ruleName: string;
  ruleGroup: string;
  priority: Priority;
  ruleType: RuleType;
  shortDescription: string;
  dc: string;
  resourceType: string;
  transportGroup: string;
  storeLocation: string;
  appliesTo: string;
  effectiveStart: string;
  effectiveEnd: string;
  tags: string[];
}
// ─── Mock data — Profiles ────────────────────────────────────────────────────
const PROFILE_DESOUTH: ProfileHeader = {
  id: 'PRF-DE-S-001',
  name: 'DE-South Standard',
  description: 'Standard rule profile for DC-BD27 daily planning sessions (DE-South region).',
  dc: 'DC-BD27',
  country: 'DE',
  owner: 'A. Müller',
  effectiveStart: '2026-01-01',
  effectiveEnd: '2026-12-31',
  status: 'active',
};

const PROFILE_BD09: ProfileHeader = {
  id: 'PRF-BD09-001',
  name: 'BD09 Standard',
  description: 'Standard rule profile for DC-BD09 daily planning sessions.',
  dc: 'DC-BD09',
  country: 'DE',
  owner: 'K. Becker',
  effectiveStart: '2026-01-01',
  effectiveEnd: '2026-12-31',
  status: 'active',
};

const fullPassChecks: ValidationCheck[] = (Object.keys(VALIDATION_CHECK_LABELS) as ValidationCheck['id'][]).map((id) => ({
  id, label: VALIDATION_CHECK_LABELS[id], status: 'pass' as const, detail: 'OK.',
}));

const partialPassChecks: ValidationCheck[] = [
  { id: 'completeness',            label: VALIDATION_CHECK_LABELS['completeness'],            status: 'pass',    detail: 'All mandatory rule components present.' },
  { id: 'context-availability',    label: VALIDATION_CHECK_LABELS['context-availability'],    status: 'pass',    detail: 'All required context terms available (Holiday, Night Shift, PTZ).' },
  { id: 'tm-data-availability',    label: VALIDATION_CHECK_LABELS['tm-data-availability'],    status: 'pass',    detail: 'All required fields available.' },
  { id: 'api-action-availability', label: VALIDATION_CHECK_LABELS['api-action-availability'], status: 'warning', detail: '1 API not available for write/re-sequence action. Read APIs available.' },
  { id: 'dependency-check',        label: VALIDATION_CHECK_LABELS['dependency-check'],        status: 'warning', detail: 'Potential overlap with rule R-ALDI-2025-000045.' },
  { id: 'missing-parameters',      label: VALIDATION_CHECK_LABELS['missing-parameters'],      status: 'pass',    detail: 'No missing parameters detected.' },
];

const allPendingChecks: ValidationCheck[] = (Object.keys(VALIDATION_CHECK_LABELS) as ValidationCheck['id'][]).map((id) => ({
  id, label: VALIDATION_CHECK_LABELS[id], status: 'pending' as const, detail: '',
}));

const validationProgressChecks: ValidationCheck[] = [
  { id: 'completeness',            label: VALIDATION_CHECK_LABELS['completeness'],            status: 'pass',    detail: 'All mandatory components present.' },
  { id: 'context-availability',    label: VALIDATION_CHECK_LABELS['context-availability'],    status: 'pass',    detail: 'Context terms available.' },
  { id: 'tm-data-availability',    label: VALIDATION_CHECK_LABELS['tm-data-availability'],    status: 'pass',    detail: 'CHL transport-group data available.' },
  { id: 'api-action-availability', label: VALIDATION_CHECK_LABELS['api-action-availability'], status: 'warning', detail: 'Aggregation roll-up endpoint not yet exposed.' },
  { id: 'dependency-check',        label: VALIDATION_CHECK_LABELS['dependency-check'],        status: 'pass',    detail: 'No dependency issues found.' },
  { id: 'missing-parameters',      label: VALIDATION_CHECK_LABELS['missing-parameters'],      status: 'pending', detail: 'Awaiting aggregation endpoint confirmation.' },
];

const onHoldFailingChecks: ValidationCheck[] = [
  { id: 'completeness',            label: VALIDATION_CHECK_LABELS['completeness'],            status: 'pass',  detail: 'OK.' },
  { id: 'context-availability',    label: VALIDATION_CHECK_LABELS['context-availability'],    status: 'pass',  detail: 'OK.' },
  { id: 'tm-data-availability',    label: VALIDATION_CHECK_LABELS['tm-data-availability'],    status: 'pass',  detail: 'OK.' },
  { id: 'api-action-availability', label: VALIDATION_CHECK_LABELS['api-action-availability'], status: 'pass',  detail: 'Stop reorder API supported.' },
  { id: 'dependency-check',        label: VALIDATION_CHECK_LABELS['dependency-check'],        status: 'pass',  detail: 'OK.' },
  { id: 'missing-parameters',      label: VALIDATION_CHECK_LABELS['missing-parameters'],      status: 'fail',  detail: 'Sequence-pair predicate not supported in TM 2022.' },
];

const INITIAL_CANDIDATES: RuleCandidate[] = [
  {
    id: 'RC-101',
    validationStatus: 'supported' as ValidationStatus,
    profile: PROFILE_DESOUTH,
    rule: {
      id: 'R-NIGHT-1STOP',
      name: 'One-Stop Night Stores',
      type: 'hard-constraint',
      group: 'store-rules',
      scope: 'FO with night-shift stops',
      conditions: 'IF stop.store_id ∈ {ST-B203, ST-B206, ST-B222, ST-B226, ST-B245, ST-B247, ST-B251, ST-B263, ST-B264} AND shift = NIGHT',
      actions: 'Forbid more than one stop in this set per FO. Allow ST-B247 + ST-B263 combination during Holidays.',
      parameters: [{ key: 'max_stops_per_FO', value: '1' }, { key: 'holiday_exception_pair', value: 'ST-B247,ST-B263' }],
      exceptions: 'ST-B247 + ST-B263 may be combined during Holidays only.',
      priority: 'P1',
    },
    dependencies: { dependsOn: [], mayConflictWith: ['R-NIGHT-2STOP-EXCEPT'], overrideBehavior: 'Holiday-exception predicate overrides the base rule on calendar match.', sequenceRestrictions: [] },
    mapping: { tmEntities: ['FreightOrder', 'Stop', 'Calendar'], apiEndpoints: ['/tm/v2/fo/{id}/stops'], fields: ['fo.stops[].store_id', 'fo.stops[].shift'], actions: ['split_fo'], llmConfidence: 'high', llmNotes: '' },
    validationChecks: fullPassChecks,
    stage: 'published',
    plannerInput: {
      description: 'Stores ST-B203, ST-B206, ST-B222, ST-B226, ST-B245, ST-B247, ST-B251, ST-B263, ST-B264 are "one-stop" stores at night. Each FO can only visit one of them per night shift. ST-B247 and ST-B263 may be combined during holidays.',
      businessReason: 'Night-shift dispatch capacity at these stores cannot accommodate multiple FO arrivals; exception during holidays reflects reduced volume.',
      exampleScenario: 'If ST-B247 and ST-B263 are in the same plan on a holiday → allow combination.\nIf on a non-holiday → do not allow combination and flag violation.',
      attachedDocs: ['BD27_SOP_V2.pdf'],
      tags: ['night', 'one-stop', 'holiday-exception'],
    },
    sourceDoc: 'BD27',
    sourceCitation: '§6 Store Rules',
    sourceClause: 'One-Stop Night Stores: this refers to stores that can only be visited once in the night shift: ST-B203, ST-B206, ST-B222, ST-B226, ST-B245, ST-B247, ST-B251, ST-B263, ST-B264. Exception: ST-B247 and ST-B263 can be combined during Holidays.',
    submittedBy: 'H. Fischer (FDE)',
    submittedDate: '2026-04-10',
    daysInStage: 65,
    approvedBy: 'A. Müller',
    approvedDate: '2026-04-15',
    firedLast7d: 14,
  },
  {
    id: 'RC-102',
    validationStatus: 'supported' as ValidationStatus,
    profile: PROFILE_BD09,
    rule: {
      id: 'R-SUN-BAN',
      name: 'Sunday delivery ban — 12 stores',
      type: 'hard-constraint',
      group: 'store-rules',
      scope: 'All FOs delivering on Sundays / public holidays',
      conditions: 'IF stop.store_id ∈ {103, 106, 114, 125, 131, 133, 142, 145, 151, 155, 170, 175} AND delivery_date IN (Sunday ∪ public-holiday)',
      actions: 'Forbid the FO from being delivered on the matching date.',
      parameters: [{ key: 'banned_stores', value: '103,106,114,125,131,133,142,145,151,155,170,175' }],
      exceptions: 'None.',
      priority: 'P1',
    },
    dependencies: { dependsOn: ['CAL-DE-HOLIDAYS'], mayConflictWith: [], overrideBehavior: '', sequenceRestrictions: [] },
    mapping: { tmEntities: ['FreightOrder', 'Calendar'], apiEndpoints: ['/tm/v2/calendar/holidays'], fields: ['stop.store_id', 'fo.delivery_date'], actions: ['forbid_fo'], llmConfidence: 'high', llmNotes: '' },
    validationChecks: fullPassChecks,
    stage: 'published',
    plannerInput: {
      description: 'Stores 103, 106, 114, 125, 131, 133, 142, 145, 151, 155, 170, 175 must not be delivered on Sundays or public holidays.',
      businessReason: 'Local trade laws and operational constraints prevent Sunday/holiday deliveries at these stores.',
      exampleScenario: 'On Sunday 27.12.2026, store 145 is in an FO → violation. Suggest delivery on Saturday 26.12 or Monday 28.12 instead.',
      attachedDocs: ['BD09-Rules.pdf'],
      tags: ['sunday-ban', 'holiday'],
    },
    sourceDoc: 'BD09',
    sourceCitation: '§5.1 Sunday / public holiday delivery restrictions',
    sourceClause: 'The following 12 stores must not be delivered on Sundays and public holidays: 103 / 106 / 114 / 125 / 131 / 133 / 142 / 145 / 151 / 155 / 170 / 175.',
    submittedBy: 'H. Fischer (FDE)',
    submittedDate: '2026-03-20',
    daysInStage: 86,
    approvedBy: 'K. Becker',
    approvedDate: '2026-03-25',
    firedLast7d: 0,
  },
  {
    id: 'RC-103',
    validationStatus: 'detect-only' as ValidationStatus,
    profile: PROFILE_BD09,
    rule: {
      id: 'R-PTZ-START',
      name: 'PTZ start window — 18:00 (exception 145 at 17:00)',
      type: 'hard-constraint',
      group: 'time-rules',
      scope: 'All Pick-to-Zero (PTZ) freight units (ZF16, ZF18)',
      conditions: 'IF FU.type ∈ {ZF16, ZF18}',
      actions: 'Set earliest tour start = 18:00. Override to 17:00 if stop.store_id = 145.',
      parameters: [{ key: 'ptz_start', value: '18:00' }, { key: 'store_145_override', value: '17:00' }],
      exceptions: 'Store 145 starts at 17:00 instead of 18:00.',
      priority: 'P1',
    },
    dependencies: { dependsOn: [], mayConflictWith: [], overrideBehavior: 'Per-store override on store_id 145.', sequenceRestrictions: [] },
    mapping: { tmEntities: ['FreightUnit', 'Tour'], apiEndpoints: ['/tm/v2/fu/{id}'], fields: ['fu.type', 'tour.start_time'], actions: ['set_earliest_start'], llmConfidence: 'high', llmNotes: '' },
    validationChecks: partialPassChecks,
    stage: 'validation',
    plannerInput: {
      description: 'PTZ (Pick-to-Zero) shipments cannot start before 18:00. Store 145 is an exception — they can start at 17:00.',
      businessReason: 'PTZ inventory consolidation finishes at 18:00 across the network. Store 145 has an earlier consolidation cutoff (17:00).',
      exampleScenario: 'Tour with FU-2201 (ZF16) starting at 17:30 → violation. Suggest reschedule to 18:00.\nTour with FU-2207 (ZF18) at store 145 starting at 17:00 → allowed.',
      attachedDocs: [],
      tags: ['PTZ', 'time-window', 'store-override'],
    },
    sourceDoc: 'BD09',
    sourceCitation: '§4.1 Time and PTZ rules',
    sourceClause: 'PTZ start is considered from 18:00 (exception: 145 at 17:00).',
    submittedBy: 'H. Fischer (FDE)',
    submittedDate: '2026-06-02',
    daysInStage: 12,
  },
  {
    id: 'RC-104',
    validationStatus: 'supported' as ValidationStatus,
    profile: PROFILE_BD09,
    rule: {
      id: 'R-PAULET-3',
      name: 'Paulet always assigned to 3 tours',
      type: 'preference',
      group: 'resource-rules',
      scope: 'Daily carrier distribution',
      conditions: 'IF carrier = Paulet',
      actions: 'Prefer count(FO) = 3 per planning day. Warn if differs.',
      parameters: [{ key: 'target_count', value: '3' }],
      exceptions: 'None.',
      priority: 'P2',
    },
    dependencies: { dependsOn: [], mayConflictWith: ['R-CARRIER-FAIRSHARE'], overrideBehavior: 'Soft preference — fair-share rule wins on conflict.', sequenceRestrictions: [] },
    mapping: { tmEntities: ['FreightOrder', 'Carrier'], apiEndpoints: ['/tm/v2/fo/{id}/carrier'], fields: ['fo.carrier_id'], actions: ['reassign_carrier'], llmConfidence: 'high', llmNotes: '' },
    validationChecks: fullPassChecks,
    stage: 'approval',
    plannerInput: {
      description: 'Always plan 3 FOs for carrier Paulet per day, because Paulet provides reliable backup capacity.',
      businessReason: 'Paulet is a strategic 3PL partner who frequently helps with urgent capacity needs. Keeping their daily volume consistent at 3 tours preserves the relationship.',
      exampleScenario: 'Session has 2 Paulet tours → warn the planner and suggest adding one more.\nSession has 3 Paulet tours → no warning.\nSession has 4+ Paulet tours → warn that Paulet is overloaded.',
      attachedDocs: [],
      tags: ['carrier', 'preference', 'paulet'],
    },
    sourceDoc: 'BD09',
    sourceCitation: '§4.2 Resource assignment rule',
    sourceClause: 'Always assign Paulet (Carrier) to 3 tours, because he often provides help in urgent situations.',
    submittedBy: 'H. Fischer (FDE)',
    submittedDate: '2026-06-05',
    daysInStage: 9,
  },
  {
    id: 'RC-105',
    validationStatus: 'detect-only' as ValidationStatus,
    profile: PROFILE_DESOUTH,
    rule: {
      id: 'R-MILKRUN-CHL',
      name: 'MilkRun threshold — CHL non-PTZ > 300 pallets',
      type: 'hard-constraint',
      group: 'planning-execution',
      scope: 'Daily CHL planning',
      conditions: 'IF aggregate(CHL volume) − aggregate(PTZ CHL volume) ≤ 300',
      actions: 'Forbid milkrun. Convert to direct shipments.',
      parameters: [{ key: 'threshold_pallets', value: '300' }],
      exceptions: 'None.',
      priority: 'P1',
    },
    dependencies: { dependsOn: [], mayConflictWith: [], overrideBehavior: '', sequenceRestrictions: [] },
    mapping: { tmEntities: ['FreightUnit', 'FreightOrder'], apiEndpoints: ['/tm/v2/fu?transport_group=0003'], fields: ['fu.transport_group', 'fu.pallets'], actions: ['forbid_milkrun'], llmConfidence: 'medium', llmNotes: 'Cross-FU aggregation predicate.' },
    validationChecks: validationProgressChecks,
    stage: 'validation',
    plannerInput: {
      description: 'Only use MilkRun planning if CHL non-PTZ volume is greater than 300 pallets. Below that threshold, use direct shipments.',
      businessReason: 'MilkRun setup overhead is only worth it above ~300 pallets of CHL volume. Below that, direct shipments are more efficient.',
      exampleScenario: 'Session has 260 pallets CHL minus 40 PTZ = 220 non-PTZ → forbid MilkRun, convert to direct.\nSession has 350 pallets non-PTZ CHL → MilkRun allowed.',
      attachedDocs: ['BD27_SOP_V2.pdf'],
      tags: ['milkrun', 'chl', 'threshold'],
    },
    sourceDoc: 'BD27',
    sourceCitation: '§4 Planning Execution Rules',
    sourceClause: 'MilkRun only if CHL non-PTZ volume > 300 pallets.',
    submittedBy: 'H. Fischer (FDE)',
    submittedDate: '2026-06-08',
    daysInStage: 6,
  },
  {
    id: 'RC-106',
    validationStatus: 'not-supported' as ValidationStatus,
    profile: PROFILE_DESOUTH,
    rule: {
      id: 'R-SEQ-RESTRICT',
      name: 'Routing sequence restriction',
      type: 'hard-constraint',
      group: 'store-rules',
      scope: 'FO stop sequence',
      conditions: 'IF FO has adjacent-stop pair (A, B)',
      actions: 'Forbid sequence (B202, B218) and (B218, B233). Suggest reorder.',
      parameters: [{ key: 'forbidden_pairs', value: '(B202,B218),(B218,B233)' }],
      exceptions: 'None.',
      priority: 'P1',
    },
    dependencies: { dependsOn: [], mayConflictWith: [], overrideBehavior: '', sequenceRestrictions: ['ST-B202 → ST-B218', 'ST-B218 → ST-B233'] },
    mapping: { tmEntities: ['FreightOrder', 'Stop'], apiEndpoints: ['/tm/v2/fo/{id}/stops'], fields: ['fo.stops[].sequence'], actions: ['forbid_sequence'], llmConfidence: 'high', llmNotes: 'TM 2022 feasibility engine lacks sequence-pair check.' },
    validationChecks: onHoldFailingChecks,
    stage: 'retired',
    plannerInput: {
      description: 'Stop sequence ST-B202 → ST-B218 is not allowed. Sequence ST-B218 → ST-B233 is also not allowed.',
      businessReason: 'Loading dock conflicts at ST-B218 if reached directly from ST-B202; same for ST-B233 if reached directly from ST-B218.',
      exampleScenario: 'FO has stops in order [ST-B202, ST-B218, ST-B250] → violation. Suggest reorder to [ST-B250, ST-B202, ST-B218] (or any non-violating sequence).',
      attachedDocs: ['BD27_SOP_V2.pdf'],
      tags: ['routing', 'sequence', 'forbidden-pair'],
    },
    sourceDoc: 'BD27',
    sourceCitation: '§6 Store Rules — Routing sequence restrictions',
    sourceClause: 'Routing sequence restrictions: ST-B202 → ST-B218 not allowed; ST-B218 → ST-B233 not allowed.',
    submittedBy: 'H. Fischer (FDE)',
    submittedDate: '2026-05-15',
    daysInStage: 30,
    retiredReason: 'TM 2022 does not support sequence-pair predicates. Retired pending TM upgrade (target Q4-2026).',
  },
  {
    id: 'RC-107',
    validationStatus: 'pending' as ValidationStatus,
    profile: PROFILE_BD09,
    rule: {
      id: 'R-CW14-TEMP',
      name: 'CW14 temporary — ST-B145 on Aldi 3 Day',
      type: 'hard-constraint',
      group: 'time-rules',
      scope: 'CW14 only · ST-B145 specifically',
      conditions: 'IF iso_week(date) = 14 AND stop.store_id = ST-B145',
      actions: 'Assign resource = "Aldi 3 Day".',
      parameters: [{ key: 'iso_week', value: '14' }, { key: 'store', value: 'ST-B145' }],
      exceptions: 'After CW14 ends, do nothing further.',
      priority: 'P2',
    },
    dependencies: { dependsOn: [], mayConflictWith: [], overrideBehavior: '', sequenceRestrictions: [] },
    mapping: { tmEntities: ['FreightOrder', 'Resource', 'Calendar'], apiEndpoints: ['/tm/v2/fo/{id}/resource'], fields: ['stop.store_id'], actions: ['reassign_resource'], llmConfidence: 'medium', llmNotes: '' },
    validationChecks: allPendingChecks,
    stage: 'submitted',
    plannerInput: {
      description: 'Calendar Week 14 only: store ST-B145 should be assigned to "Aldi 3 Day" resource. After CW14 ends, no special handling.',
      businessReason: 'Temporary capacity reallocation for CW14 due to a known volume surge at ST-B145 that week.',
      exampleScenario: 'CW14 plan with ST-B145 in an FO → resource must be "Aldi 3 Day".\nCW15 plan with ST-B145 → no rule applies.',
      attachedDocs: [],
      tags: ['temporary', 'calendar-week', 'cw14'],
    },
    sourceDoc: 'BD09',
    sourceCitation: '§2.1 Temporary rule (Calendar Week 14)',
    sourceClause: 'CW 14: ST-B145 on "aldi 3 Day"; after that, do nothing further.',
    submittedBy: 'H. Fischer (FDE)',
    submittedDate: '2026-06-10',
    daysInStage: 4,
  },
  {
    id: 'RC-108',
    validationStatus: 'pending' as ValidationStatus,
    profile: PROFILE_BD09,
    rule: {
      id: 'R-AFTER-14',
      name: 'Stop timing preference — plan after 14:00',
      type: 'preference',
      group: 'time-rules',
      scope: '1Run cockpit · listed stores',
      conditions: 'IF stop.store_id ∈ {105,108,117,121,123,135,136,144,145}',
      actions: 'Prefer stop.start_time ≥ 14:00. Surface warning if alternatives exist.',
      parameters: [{ key: 'preferred_start', value: '14:00' }],
      exceptions: 'None.',
      priority: 'P3',
    },
    dependencies: { dependsOn: [], mayConflictWith: [], overrideBehavior: 'Soft preference; never blocks the plan.', sequenceRestrictions: [] },
    mapping: { tmEntities: ['FreightOrder', 'Stop'], apiEndpoints: ['/tm/v2/fo/{id}/stops'], fields: ['stop.start_time'], actions: ['flag_warning'], llmConfidence: 'medium', llmNotes: '' },
    validationChecks: allPendingChecks,
    stage: 'submitted',
    plannerInput: {
      description: 'If possible, plan stops at stores 105, 108, 117, 121, 123, 135, 136, 144, 145 after 14:00 (in 1Run cockpit).',
      businessReason: 'These stores have afternoon receiving windows; planning them earlier creates dock congestion.',
      exampleScenario: 'Stop at store 121 scheduled at 11:00 with alternatives → suggest moving to 14:00+.\nStop at store 121 at 11:00 with no later alternatives → keep, no warning.',
      attachedDocs: [],
      tags: ['preference', 'timing', '1run'],
    },
    sourceDoc: 'BD09',
    sourceCitation: '§4.3 Store timing preference',
    sourceClause: 'If possible, plan the following stores after 14:00 (stored in 1Run): 105, 108, 117, 121, 123, 135, 136, 144, 145.',
    submittedBy: 'H. Fischer (FDE)',
    submittedDate: '2026-06-12',
    daysInStage: 2,
  },
  {
    id: 'RC-109',
    validationStatus: 'pending' as ValidationStatus,
    profile: PROFILE_DESOUTH,
    rule: {
      id: 'R-CHL-FRZ-VEHICLE',
      name: 'CHL + Freezer combined — predefined vehicle list',
      type: 'hard-constraint',
      group: 'vehicle-rules',
      scope: 'FOs combining CHL + Freezer goods',
      conditions: 'IF fo.transport_groups ⊇ {0002, 0003}',
      actions: 'Allow vehicle assignment only from predefined vehicle list (13 IDs).',
      parameters: [{ key: 'vehicle_list', value: 'LGF_ALDI_04_..., LGF_ALDI_05_..., ...' }],
      exceptions: 'None.',
      priority: 'P1',
    },
    dependencies: { dependsOn: [], mayConflictWith: [], overrideBehavior: '', sequenceRestrictions: [] },
    mapping: { tmEntities: [], apiEndpoints: [], fields: [], actions: [], llmConfidence: 'low', llmNotes: 'Awaiting Aldi to finalize vehicle list.' },
    validationChecks: allPendingChecks,
    stage: 'draft',
    plannerInput: {
      description: 'When an FO combines Chiller (0003) and Freezer (0002) transport groups, only specific vehicles are allowed (13 vehicle IDs to be confirmed).',
      businessReason: 'Multi-temperature compartment vehicles are required for combined CHL+Freezer transport. Only 13 vehicles in the fleet meet this spec.',
      exampleScenario: 'TBD — awaiting final vehicle list from operations team.',
      attachedDocs: [],
      tags: ['vehicle', 'chl', 'freezer', 'draft'],
    },
    sourceDoc: 'BD27',
    sourceCitation: '§8 Vehicle Rules',
    sourceClause: 'Only predefined vehicles can transport CHL + Freezer together. (List of 13 specific vehicle IDs)',
    submittedBy: 'H. Fischer (FDE)',
    submittedDate: '2026-06-13',
    daysInStage: 1,
  },
  {
    id: 'RC-110',
    validationStatus: 'supported' as ValidationStatus,
    profile: PROFILE_DESOUTH,
    rule: {
      id: 'R-MIN-PALLETS',
      name: 'Min-pallets per stop >= 5  (revision)',
      type: 'preference',
      group: 'planning-execution',
      scope: 'All stops',
      conditions: 'IF stop.pallet_count < 6',
      actions: 'Prefer consolidation. Surface "Consolidate stops below threshold".',
      parameters: [{ key: 'min_pallets', value: '6' }, { key: 'previous_min_pallets', value: '5' }],
      exceptions: 'None.',
      priority: 'P2',
    },
    dependencies: { dependsOn: [], mayConflictWith: ['R-FO-CONSOLIDATE'], overrideBehavior: 'Soft preference.', sequenceRestrictions: [] },
    mapping: { tmEntities: ['Stop', 'FreightOrder'], apiEndpoints: ['/tm/v2/stop/{id}'], fields: ['stop.pallet_count'], actions: ['flag_warning'], llmConfidence: 'high', llmNotes: '' },
    validationChecks: fullPassChecks,
    stage: 'approval',
    plannerInput: {
      description: 'Increase the minimum pallets-per-stop preference threshold from 5 to 6 (proposed amendment to existing rule R-001-LIVE).',
      businessReason: 'Sub-utilized stops below 6 pallets are creating extra dock-time overhead. Raising the threshold to 6 gives the planner a stronger signal.',
      exampleScenario: 'Stop with 4 pallets → warn (below 6).\nStop with 6 pallets → no warning.',
      attachedDocs: [],
      tags: ['min-pallets', 'consolidation', 'revision'],
    },
    sourceDoc: 'BD27',
    sourceCitation: '§2 Resource Rules (proposed amendment)',
    sourceClause: '(Proposed) Increase min-pallets per stop from 5 to 6 to reduce sub-utilised stops.',
    submittedBy: 'H. Fischer (FDE)',
    submittedDate: '2026-06-09',
    daysInStage: 5,
  },
];
// ─── Rule Profile types ───────────────────────────────────────────────────────

type ProfileStatus = 'draft' | 'active' | 'retired';

interface RuleProfileEntry {
  id: string;
  name: string;
  description: string;
  dc: string;
  owner: string;
  effectiveStart: string;
  effectiveEnd: string;
  status: ProfileStatus;
  version: string;
  ruleIds: string[];          // RC-xxx ids of approved rules assigned to this profile
  createdDate: string;
  publishedDate?: string;
}

// ─── Global context types ─────────────────────────────────────────────────────

type ContextType = 'transport-group' | 'resource-naming' | 'store-naming' | 'shift' | 'fleet-type' | 'carrier' | 'other';

interface GlobalContextEntry {
  id: string;
  term: string;
  definition: string;
  tmMapping: string;
  scope: string;
  contextType: ContextType;
  status: 'active' | 'inactive';
}

// ─── Mock data — Rule Profiles ────────────────────────────────────────────────

const CONTEXT_TYPE_LABEL: Record<ContextType, string> = {
  'transport-group': 'Transport Group',
  'resource-naming': 'Resource Naming',
  'store-naming': 'Store Naming',
  'shift': 'Shift',
  'fleet-type': 'Fleet Type',
  'carrier': 'Carrier',
  'other': 'Other',
};

const PROFILE_STATUS_LABEL: Record<ProfileStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  retired: 'Retired',
};

const profileStatusState = (s: ProfileStatus): 'Positive' | 'Critical' | 'None' =>
  s === 'active' ? 'Positive' : s === 'retired' ? 'Critical' : 'None';

const INITIAL_RULE_PROFILES: RuleProfileEntry[] = [
  {
    id: 'RP-001',
    name: 'DE-South Standard (v3.4)',
    description: 'Standard daily planning profile for BD27 DC. Covers one-stop night stores, MilkRun threshold, and routing restrictions.',
    dc: 'DC-BD27',
    owner: 'A. Müller',
    effectiveStart: '2026-01-01',
    effectiveEnd: '2026-12-31',
    status: 'active',
    version: 'v3.4',
    ruleIds: ['RC-101', 'RC-105'],
    createdDate: '2026-03-01',
    publishedDate: '2026-03-15',
  },
  {
    id: 'RP-002',
    name: 'BD09 Standard (v2.1)',
    description: 'Standard profile for BD09 DC. Includes Sunday ban, PTZ start window, Paulet carrier allocation.',
    dc: 'DC-BD09',
    owner: 'K. Becker',
    effectiveStart: '2026-01-01',
    effectiveEnd: '2026-12-31',
    status: 'active',
    version: 'v2.1',
    ruleIds: ['RC-102', 'RC-103', 'RC-104'],
    createdDate: '2026-02-15',
    publishedDate: '2026-02-28',
  },
  {
    id: 'RP-003',
    name: 'DE-South Q3 Review (v3.5-draft)',
    description: 'Draft revision of DE-South Standard — adds min-pallets revision (RC-110) pending approval.',
    dc: 'DC-BD27',
    owner: 'A. Müller',
    effectiveStart: '2026-07-01',
    effectiveEnd: '2026-12-31',
    status: 'draft',
    version: 'v3.5-draft',
    ruleIds: ['RC-101', 'RC-105'],
    createdDate: '2026-06-10',
  },
  {
    id: 'RP-004',
    name: 'BD09 Holiday Supplement (v1.0)',
    description: 'Supplement profile for BD09 holiday periods — extends Sunday ban with PTZ overrides.',
    dc: 'DC-BD09',
    owner: 'K. Becker',
    effectiveStart: '2026-12-20',
    effectiveEnd: '2027-01-05',
    status: 'retired',
    version: 'v1.0',
    ruleIds: ['RC-102'],
    createdDate: '2025-11-01',
    publishedDate: '2025-11-20',
  },
];

// ─── Mock data — Global Context ───────────────────────────────────────────────

const INITIAL_GLOBAL_CONTEXT: GlobalContextEntry[] = [
  { id: 'GC-001', term: 'Ambient', definition: 'Ambient temperature transport group', tmMapping: '0001', scope: 'All DCs', contextType: 'transport-group', status: 'active' },
  { id: 'GC-002', term: 'Freezer', definition: 'Frozen goods transport group', tmMapping: '0002', scope: 'All DCs', contextType: 'transport-group', status: 'active' },
  { id: 'GC-003', term: 'Chiller', definition: 'Chilled goods transport group', tmMapping: '0003', scope: 'All DCs', contextType: 'transport-group', status: 'active' },
  { id: 'GC-004', term: 'Own Fleet', definition: 'ALDI-operated vehicles', tmMapping: 'Resources starting with "N.G. ALDI"', scope: 'All DCs', contextType: 'resource-naming', status: 'active' },
  { id: 'GC-005', term: 'PTZ', definition: 'Pick-to-Zero — daily replenishment FUs', tmMapping: 'FU type ZF16, ZF18', scope: 'All DCs', contextType: 'other', status: 'active' },
  { id: 'GC-006', term: 'Morning Shift', definition: 'Morning delivery window starting 06:00', tmMapping: 'shift = MORNING', scope: 'All DCs', contextType: 'shift', status: 'active' },
  { id: 'GC-007', term: 'Night Shift', definition: 'Night delivery window starting 22:00+', tmMapping: 'shift = NIGHT', scope: 'All DCs', contextType: 'shift', status: 'active' },
  { id: 'GC-008', term: '33P', definition: 'Morning 33-pallet truck', tmMapping: 'Resource type = 33P', scope: 'BD27', contextType: 'fleet-type', status: 'active' },
  { id: 'GC-009', term: '21P', definition: 'Solo vehicle with tail lift (small)', tmMapping: 'Resource type = 21P', scope: 'BD27', contextType: 'fleet-type', status: 'active' },
  { id: 'GC-010', term: '27P', definition: 'Solo vehicle with tail lift (medium)', tmMapping: 'Resource type = 27P', scope: 'BD27', contextType: 'fleet-type', status: 'active' },
  { id: 'GC-011', term: 'Paulet', definition: 'Carrier — strategic 3PL partner, daily 3-tour allocation', tmMapping: 'carrier_id = PAULET', scope: 'BD09', contextType: 'carrier', status: 'active' },
  { id: 'GC-012', term: 'GHL', definition: 'Carrier — general haulage', tmMapping: 'carrier_id = GHL', scope: 'All DCs', contextType: 'carrier', status: 'active' },
  { id: 'GC-013', term: 'Ekren', definition: 'Carrier — regional haulage', tmMapping: 'carrier_id = EKREN', scope: 'All DCs', contextType: 'carrier', status: 'active' },
  { id: 'GC-014', term: 'MilkRun', definition: 'Multi-stop consolidation run pattern', tmMapping: 'cockpit = MILKRUN', scope: 'BD27', contextType: 'other', status: 'active' },
  { id: 'GC-015', term: 'ZVAT', definition: 'Carrier — maximum count maintained per DC', tmMapping: 'carrier_id = ZVAT', scope: 'BD27', contextType: 'carrier', status: 'inactive' },
];

// ─── Rule Profiles tab component ─────────────────────────────────────────────

const V6RuleProfiles: React.FC<{
  profiles: RuleProfileEntry[];
  candidates: RuleCandidate[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onPublish: (id: string) => void;
  onRetire: (id: string) => void;
  onDelete: (id: string) => void;
  onSaveProfile: (profile: RuleProfileEntry) => void;
}> = ({ profiles, candidates, onPublish, onRetire, onDelete, onSaveProfile }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scopeFilter, setScopeFilter] = useState<'all' | 'active' | 'draft' | 'retired'>('all');
  const [editingProfile, setEditingProfile] = useState<RuleProfileEntry | null>(null); // null = view, set = edit/create

  // Auto-select first visible profile when filter changes
  const visible = profiles.filter(p => scopeFilter === 'all' || p.status === scopeFilter);

  useEffect(() => {
    if (visible.length > 0 && !editingProfile) {
      const keep = visible.find(p => p.id === selectedId);
      if (!keep) setSelectedId(visible[0].id);
    }
  }, [scopeFilter, profiles]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = selectedId ? profiles.find(p => p.id === selectedId) ?? null : null;
  const publishedRules = candidates.filter(c => c.stage === 'published');

  const counts = {
    active: profiles.filter(p => p.status === 'active').length,
    draft: profiles.filter(p => p.status === 'draft').length,
    retired: profiles.filter(p => p.status === 'retired').length,
  };

  // ─── Profile edit form ────────────────────────────────────────────────────────

  const ProfileEditPane: React.FC<{ profile: RuleProfileEntry; isNew: boolean }> = ({ profile, isNew }) => {
    const [name, setName] = useState(profile.name === 'New Profile (draft)' ? '' : profile.name);
    const [description, setDescription] = useState(profile.description);
    const [dc, setDc] = useState(profile.dc);
    const [owner, setOwner] = useState(profile.owner);
    const [effectiveStart, setEffectiveStart] = useState(profile.effectiveStart);
    const [effectiveEnd, setEffectiveEnd] = useState(profile.effectiveEnd);
    const [version, setVersion] = useState(profile.version === 'v1.0-draft' ? '' : profile.version);
    const [assignedIds, setAssignedIds] = useState<string[]>(profile.ruleIds);
    const [dragOverAssigned, setDragOverAssigned] = useState<number | null>(null);
    const [dragOverAvailable, setDragOverAvailable] = useState(false);
    const dragRule = useRef<{ id: string; from: 'available' | 'assigned'; assignedIdx?: number } | null>(null);

    const available = publishedRules.filter(r => !assignedIds.includes(r.id));
    const assigned = assignedIds.map(id => publishedRules.find(r => r.id === id)).filter(Boolean) as RuleCandidate[];
    const canSave = name.trim().length > 0 && dc.length > 0;

    const handleSave = () => {
      onSaveProfile({
        ...profile,
        name: name.trim() || profile.name,
        description, dc, owner,
        effectiveStart, effectiveEnd,
        version: version.trim() || 'v1.0-draft',
        ruleIds: assignedIds,
      });
      setEditingProfile(null);
    };

    // Drag-and-drop: available → assigned
    const onAvailableDragStart = (id: string) => { dragRule.current = { id, from: 'available' }; };
    const onAssignedDragStart = (id: string, idx: number) => { dragRule.current = { id, from: 'assigned', assignedIdx: idx }; };

    const onDropToAssigned = (insertIdx: number) => {
      const drag = dragRule.current;
      if (!drag) return;
      if (drag.from === 'available') {
        const next = [...assignedIds];
        next.splice(insertIdx, 0, drag.id);
        setAssignedIds(next);
      } else if (drag.from === 'assigned' && drag.assignedIdx !== undefined) {
        const next = [...assignedIds];
        const [moved] = next.splice(drag.assignedIdx, 1);
        next.splice(insertIdx > drag.assignedIdx ? insertIdx - 1 : insertIdx, 0, moved);
        setAssignedIds(next);
      }
      setDragOverAssigned(null);
      dragRule.current = null;
    };

    const onDropToAvailable = () => {
      const drag = dragRule.current;
      if (!drag || drag.from !== 'assigned') return;
      setAssignedIds(prev => prev.filter(id => id !== drag.id));
      setDragOverAvailable(false);
      dragRule.current = null;
    };

    const removeFromAssigned = (id: string) => setAssignedIds(prev => prev.filter(x => x !== id));
    const addToAssigned = (id: string) => setAssignedIds(prev => [...prev, id]);

    return (
      <DynamicPage style={{ height: '100%', borderLeft: '1px solid var(--sapList_BorderColor)' }}
        showFooter
        footerArea={
          <Bar design="Footer">
            <Text slot="startContent">{isNew ? 'New profile — save as draft to continue editing.' : 'Changes are saved as a new draft version.'}</Text>
            <Button slot="endContent" design="Default" icon="decline" onClick={() => setEditingProfile(null)}>Cancel</Button>
            <Button slot="endContent" design="Emphasized" icon="save" disabled={!canSave} onClick={handleSave}>
              {isNew ? 'Create Draft' : 'Save Changes'}
            </Button>
          </Bar>
        }
        titleArea={
          <DynamicPageTitle
            heading={<Title>{isNew ? 'New Rule Profile' : `Edit: ${profile.name}`}</Title>}
            subheading={<Text>Fill in profile details and assign published rules. Save as draft, then publish to make visible to planners.</Text>}
            actionsBar={
              <Toolbar slot="actionsBar" design="Transparent">
                <Button design="Transparent" icon="decline" onClick={() => setEditingProfile(null)}>Cancel</Button>
              </Toolbar>
            }
          />
        }>
        <FlexBox direction="Column" style={{ gap: sp.m, padding: sp.m }}>

          {/* Profile metadata */}
          <Panel headerText="Profile Details" accessibleRole="Region">
            <Form style={{ padding: sp.s }}>
              <FormGroup>
                <FormItem labelContent={<Label required>Profile name</Label>}>
                  <Input value={name} onInput={(e) => setName((e.target as HTMLInputElement).value)}
                    placeholder="e.g. DE-South Standard" style={{ width: '100%' }} />
                </FormItem>
                <FormItem labelContent={<Label>Description</Label>}>
                  <TextArea value={description} onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
                    placeholder="Describe when and where this profile applies" rows={2} style={{ width: '100%' }} />
                </FormItem>
                <FormItem labelContent={<Label required>DC / Planning context</Label>}>
                  <Select style={{ width: '100%' }} onChange={(e) => {
                    const v = (e.detail as { selectedOption?: { value?: string } }).selectedOption?.value;
                    if (v) setDc(v);
                  }}>
                    {['DC-BD27', 'DC-BD09', 'DC-BD20', 'DC-BD42'].map(d => (
                      <Option key={d} value={d} selected={dc === d}>{d}</Option>
                    ))}
                  </Select>
                </FormItem>
                <FormItem labelContent={<Label>Owner</Label>}>
                  <Input value={owner} onInput={(e) => setOwner((e.target as HTMLInputElement).value)}
                    placeholder="e.g. A. Müller" style={{ width: '100%' }} />
                </FormItem>
                <FormItem labelContent={<Label>Version</Label>}>
                  <Input value={version} onInput={(e) => setVersion((e.target as HTMLInputElement).value)}
                    placeholder="e.g. v1.0" style={{ width: '100%' }} />
                </FormItem>
                <FormItem labelContent={<Label>Effective from</Label>}>
                  <Input value={effectiveStart} onInput={(e) => setEffectiveStart((e.target as HTMLInputElement).value)}
                    placeholder="YYYY-MM-DD" style={{ width: '100%' }} />
                </FormItem>
                <FormItem labelContent={<Label>Effective to</Label>}>
                  <Input value={effectiveEnd} onInput={(e) => setEffectiveEnd((e.target as HTMLInputElement).value)}
                    placeholder="YYYY-MM-DD" style={{ width: '100%' }} />
                </FormItem>
              </FormGroup>
            </Form>
          </Panel>

          {/* Rule assignment — two-column drag-and-drop */}
          <Panel headerText={`Assign Rules — ${assigned.length} assigned, ${available.length} available`} accessibleRole="Region">
            <FlexBox direction="Column" style={{ gap: sp.xs, padding: sp.s }}>
              <MessageStrip design="Information" hideCloseButton>
                Drag rules from <strong>Available</strong> to <strong>Assigned</strong> to add them. Drag within Assigned to reorder evaluation priority. Drag back to Available to remove.
              </MessageStrip>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.m, marginTop: sp.s }}>

                {/* Available rules */}
                <div>
                  <Text style={{ ...sectionTitle, display: 'block', marginBottom: sp.s }}>
                    Available ({available.length} published rules)
                  </Text>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOverAvailable(true); }}
                    onDragLeave={() => setDragOverAvailable(false)}
                    onDrop={onDropToAvailable}
                    style={{
                      minHeight: 120, border: `2px dashed ${dragOverAvailable ? 'var(--sapSelectedColor, #0070f2)' : 'var(--sapField_BorderColor)'}`,
                      borderRadius: 'var(--sapElement_BorderCornerRadius, 4px)',
                      background: dragOverAvailable ? 'var(--sapList_SelectionBackgroundColor, #e8f4ff)' : 'var(--sapBackgroundColor)',
                      padding: sp.xs, transition: 'all 0.15s',
                    }}>
                    {available.length === 0 ? (
                      <FlexBox justifyContent="Center" alignItems="Center" style={{ height: 80, color: 'var(--sapContent_LabelColor)', fontSize: 'var(--sapFontSmallSize)' }}>
                        All published rules assigned
                      </FlexBox>
                    ) : available.map(r => (
                      <div key={r.id} draggable
                        onDragStart={() => onAvailableDragStart(r.id)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: sp.s, padding: `${sp.xs} ${sp.s}`, marginBottom: sp.xs, background: 'var(--sapList_Background, #fff)', border: '1px solid var(--sapList_BorderColor)', borderRadius: 'var(--sapElement_BorderCornerRadius, 4px)', cursor: 'grab' }}>
                        <FlexBox alignItems="Center" style={{ gap: sp.s, flex: 1 }}>
                          <span style={{ color: 'var(--sapContent_LabelColor)', fontSize: 14, userSelect: 'none' }}>⠿</span>
                          <FlexBox direction="Column" style={{ gap: 2 }}>
                            <Text style={{ fontSize: 'var(--sapFontSmallSize)', fontWeight: 600 }}>{r.rule.name}</Text>
                            <Label>{r.id} · {RULE_TYPE_LABEL[r.rule.type]}</Label>
                          </FlexBox>
                        </FlexBox>
                        <Button design="Transparent" icon="add" onClick={() => addToAssigned(r.id)} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assigned rules */}
                <div>
                  <Text style={{ ...sectionTitle, display: 'block', marginBottom: sp.s }}>
                    Assigned — evaluation order
                  </Text>
                  <div style={{ minHeight: 120 }}>
                    {/* Drop zone at the top */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOverAssigned(0); }}
                      onDragLeave={() => setDragOverAssigned(null)}
                      onDrop={() => onDropToAssigned(0)}
                      style={{ height: dragOverAssigned === 0 ? 32 : 4, background: dragOverAssigned === 0 ? 'var(--sapSelectedColor, #0070f2)' : 'transparent', borderRadius: 2, transition: 'all 0.1s', marginBottom: dragOverAssigned === 0 ? sp.xs : 0 }}
                    />
                    {assigned.length === 0 ? (
                      <div style={{ border: '2px dashed var(--sapField_BorderColor)', borderRadius: 'var(--sapElement_BorderCornerRadius, 4px)', padding: sp.m, textAlign: 'center', color: 'var(--sapContent_LabelColor)', fontSize: 'var(--sapFontSmallSize)' }}>
                        Drop rules here to assign them
                      </div>
                    ) : assigned.map((r, idx) => (
                      <div key={r.id}>
                        <div draggable
                          onDragStart={() => onAssignedDragStart(r.id, idx)}
                          style={{ display: 'flex', alignItems: 'center', gap: sp.s, padding: `${sp.xs} ${sp.s}`, marginBottom: sp.xs, background: 'var(--sapList_SelectionBackgroundColor, #e8f4ff)', border: '1px solid var(--sapSelectedColor, #0070f2)', borderRadius: 'var(--sapElement_BorderCornerRadius, 4px)', cursor: 'grab' }}>
                          <span style={{ color: 'var(--sapContent_LabelColor)', fontSize: 14, userSelect: 'none', flexShrink: 0 }}>⠿</span>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--sapSelectedColor, #0070f2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{idx + 1}</div>
                          <FlexBox direction="Column" style={{ gap: 2, flex: 1 }}>
                            <Text style={{ fontSize: 'var(--sapFontSmallSize)', fontWeight: 600 }}>{r.rule.name}</Text>
                            <Label>{r.id} · {RULE_TYPE_LABEL[r.rule.type]}</Label>
                          </FlexBox>
                          <Button design="Transparent" icon="decline" onClick={() => removeFromAssigned(r.id)} />
                        </div>
                        <div
                          onDragOver={(e) => { e.preventDefault(); setDragOverAssigned(idx + 1); }}
                          onDragLeave={() => setDragOverAssigned(null)}
                          onDrop={() => onDropToAssigned(idx + 1)}
                          style={{ height: dragOverAssigned === idx + 1 ? 32 : 4, background: dragOverAssigned === idx + 1 ? 'var(--sapSelectedColor, #0070f2)' : 'transparent', borderRadius: 2, transition: 'all 0.1s', marginBottom: dragOverAssigned === idx + 1 ? sp.xs : 0 }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FlexBox>
          </Panel>
        </FlexBox>
      </DynamicPage>
    );
  };

  // ─── Main render ──────────────────────────────────────────────────────────────

  const rightPanel = editingProfile
    ? <ProfileEditPane profile={editingProfile} isNew={!profiles.find(p => p.id === editingProfile.id)} />
    : selected
      ? (
        <DynamicPage style={{ height: '100%', borderLeft: '1px solid var(--sapList_BorderColor)' }}
          showFooter
          footerArea={
            <Bar design="Footer">
              <Text slot="startContent">
                {selected.status === 'draft' ? 'Draft — publish to make visible to planners.' :
                 selected.status === 'active' ? 'Active — planners can select this profile at session start.' :
                 'Retired — hidden from planner selection.'}
              </Text>
              {selected.status === 'draft' && (
                <>
                  <Button slot="endContent" design="Negative" icon="delete" onClick={() => { onDelete(selected.id); setSelectedId(null); }}>Delete</Button>
                  <Button slot="endContent" design="Default" icon="edit" onClick={() => setEditingProfile(selected)}>Edit</Button>
                  <Button slot="endContent" design="Emphasized" icon="accept" onClick={() => onPublish(selected.id)}>Publish</Button>
                </>
              )}
              {selected.status === 'active' && (
                <>
                  <Button slot="endContent" design="Default" icon="edit" onClick={() => setEditingProfile(selected)}>Edit (new version)</Button>
                  <Button slot="endContent" design="Attention" icon="pause" onClick={() => onRetire(selected.id)}>Retire</Button>
                </>
              )}
              {selected.status === 'retired' && (
                <Button slot="endContent" design="Default" icon="edit" onClick={() => setEditingProfile(selected)}>Create new version</Button>
              )}
            </Bar>
          }
          titleArea={
            <DynamicPageTitle
              heading={<Title>{selected.name}</Title>}
              subheading={<Text>{selected.description}</Text>}
              actionsBar={
                <Toolbar slot="actionsBar" design="Transparent">
                  <Tag colorScheme="8">{selected.id}</Tag>
                  <Tag colorScheme="8">{selected.version}</Tag>
                  <ObjectStatus state={profileStatusState(selected.status)}>{PROFILE_STATUS_LABEL[selected.status]}</ObjectStatus>
                  <Button design="Transparent" icon="decline" onClick={() => setSelectedId(null)}>Close</Button>
                </Toolbar>
              }
            />
          }>
          <FlexBox direction="Column" style={{ gap: sp.m, padding: sp.m }}>
            <Panel headerText="Profile Details" accessibleRole="Region">
              <Form>
                <FormGroup>
                  <FormItem labelContent={<Label>DC / Planning context</Label>}><Text>{selected.dc}</Text></FormItem>
                  <FormItem labelContent={<Label>Owner</Label>}><Text>{selected.owner}</Text></FormItem>
                  <FormItem labelContent={<Label>Effective period</Label>}><Text>{selected.effectiveStart} → {selected.effectiveEnd}</Text></FormItem>
                  <FormItem labelContent={<Label>Created</Label>}><Text>{selected.createdDate}</Text></FormItem>
                  {selected.publishedDate && <FormItem labelContent={<Label>Published</Label>}><Text>{selected.publishedDate}</Text></FormItem>}
                </FormGroup>
              </Form>
            </Panel>

            <Panel headerText={`Assigned Rules (${selected.ruleIds.length})`} accessibleRole="Region">
              {selected.ruleIds.length === 0 ? (
                <FlexBox justifyContent="Center" style={{ padding: sp.m }}>
                  <Text>No rules assigned yet. Click Edit to assign published rules.</Text>
                </FlexBox>
              ) : (
                <List>
                  {selected.ruleIds.map((rid, idx) => {
                    const rule = candidates.find(c => c.id === rid);
                    if (!rule) return null;
                    return (
                      <ListItemCustom key={rid} type="Inactive">
                        <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ gap: sp.s, padding: `${sp.xs} ${sp.s}`, width: '100%' }}>
                          <FlexBox alignItems="Center" style={{ gap: sp.s }}>
                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--sapNeutralBackground, #e5e5e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{idx + 1}</div>
                            <Tag colorScheme="8">{rid}</Tag>
                            <FlexBox direction="Column" style={{ gap: 2 }}>
                              <Text style={{ fontWeight: 700 }}>{rule.rule.name}</Text>
                              <Label>{RULE_TYPE_LABEL[rule.rule.type]} · {rule.rule.priority}</Label>
                            </FlexBox>
                          </FlexBox>
                          <ObjectStatus state={stageStatusState(rule.stage)}>{STAGE_LABEL[rule.stage]}</ObjectStatus>
                        </FlexBox>
                      </ListItemCustom>
                    );
                  })}
                </List>
              )}
            </Panel>

            <Panel collapsed headerText="Planner Visibility" accessibleRole="Region">
              <FlexBox direction="Column" style={{ gap: sp.s, padding: sp.s }}>
                <MessageStrip design="Information" hideCloseButton>
                  This profile is scoped to <strong>{selected.dc}</strong>. Planners whose TM Profile matches this DC will see it at session start.
                  {selected.status !== 'active' && ' Profile must be published (Active) before it appears for planners.'}
                </MessageStrip>
                <Form>
                  <FormGroup>
                    <FormItem labelContent={<Label>Visible to planners</Label>}>
                      <ObjectStatus state={selected.status === 'active' ? 'Positive' : 'None'}>
                        {selected.status === 'active' ? 'Yes — shown at session start' : 'No — not yet published or retired'}
                      </ObjectStatus>
                    </FormItem>
                    <FormItem labelContent={<Label>Scoped DC</Label>}><Text>{selected.dc}</Text></FormItem>
                  </FormGroup>
                </Form>
              </FlexBox>
            </Panel>
          </FlexBox>
        </DynamicPage>
      )
      : null;

  const showRight = editingProfile !== null || selected !== null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: showRight ? 'minmax(360px, 40%) 1fr' : '1fr', height: '100%', minHeight: 0 }}>
      {/* List */}
      <DynamicPage style={{ height: '100%' }}
        titleArea={
          <DynamicPageTitle
            heading={<Title>Rule Profiles</Title>}
            subheading={<Text>{profiles.length} profiles — {counts.active} active, {counts.draft} draft, {counts.retired} retired</Text>}
            actionsBar={
              <Toolbar slot="actionsBar" design="Transparent">
                <Button design="Emphasized" icon="add" onClick={() => {
                  const newId = `RP-${String(profiles.length + 1).padStart(3, '0')}`;
                  const blank: RuleProfileEntry = {
                    id: newId, name: 'New Profile (draft)', description: '', dc: 'DC-BD27',
                    owner: '', effectiveStart: '2026-07-01', effectiveEnd: '2026-12-31',
                    status: 'draft', version: 'v1.0', ruleIds: [], createdDate: '2026-07-02',
                  };
                  setEditingProfile(blank);
                  setSelectedId(null);
                }}>New Profile</Button>
              </Toolbar>
            }
          />
        }
        headerArea={
          <DynamicPageHeader>
            <div style={{ paddingTop: sp.s, paddingBottom: sp.s }}>
              <SegmentedButton onSelectionChange={(e) => {
                const v = (e.detail as { selectedItems?: ReadonlyArray<{ getAttribute?: (n: string) => string | null }> }).selectedItems?.[0]?.getAttribute?.('data-scope') ?? null;
                if (v === 'all' || v === 'active' || v === 'draft' || v === 'retired') {
                  setScopeFilter(v);
                  setEditingProfile(null);
                  // auto-select first in new scope
                  const first = profiles.find(p => v === 'all' || p.status === v);
                  setSelectedId(first?.id ?? null);
                }
              }}>
                <SegmentedButtonItem data-scope="all" selected={scopeFilter === 'all'}>All ({profiles.length})</SegmentedButtonItem>
                <SegmentedButtonItem data-scope="active" selected={scopeFilter === 'active'}>Active ({counts.active})</SegmentedButtonItem>
                <SegmentedButtonItem data-scope="draft" selected={scopeFilter === 'draft'}>Draft ({counts.draft})</SegmentedButtonItem>
                <SegmentedButtonItem data-scope="retired" selected={scopeFilter === 'retired'}>Retired ({counts.retired})</SegmentedButtonItem>
              </SegmentedButton>
            </div>
          </DynamicPageHeader>
        }>
        <Table
          headerRow={
            <TableHeaderRow sticky>
              <TableHeaderCell width="35%"><Label>Profile</Label></TableHeaderCell>
              <TableHeaderCell width="15%"><Label>DC</Label></TableHeaderCell>
              <TableHeaderCell width="10%"><Label>Version</Label></TableHeaderCell>
              <TableHeaderCell width="15%"><Label>Rules</Label></TableHeaderCell>
              <TableHeaderCell width="15%" horizontalAlign="End"><Label>Status</Label></TableHeaderCell>
              <TableHeaderCell width="10%"><Label></Label></TableHeaderCell>
            </TableHeaderRow>
          }>
          {visible.map(p => {
            const assigned = p.ruleIds.filter(id => candidates.find(c => c.id === id && c.stage === 'published'));
            return (
              <TableRow key={p.id} rowKey={p.id} interactive
                navigated={!editingProfile && selectedId === p.id}
                onClick={() => { setSelectedId(p.id); setEditingProfile(null); }}>
                <TableCell>
                  <FlexBox direction="Column" style={{ gap: sp.xs, paddingTop: sp.xs, paddingBottom: sp.xs }}>
                    <Text style={{ fontWeight: 700 }}>{p.name}</Text>
                    <Label>{p.id} · {p.owner}</Label>
                  </FlexBox>
                </TableCell>
                <TableCell><Text>{p.dc}</Text></TableCell>
                <TableCell><Tag colorScheme="8">{p.version}</Tag></TableCell>
                <TableCell>
                  <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
                    <Text>{assigned.length} rules</Text>
                    {p.ruleIds.length > assigned.length && p.ruleIds.length > 0 && (
                      <ObjectStatus state="Critical">{p.ruleIds.length - assigned.length} pending</ObjectStatus>
                    )}
                  </FlexBox>
                </TableCell>
                <TableCell>
                  <FlexBox alignItems="Center" justifyContent="End" style={{ paddingRight: sp.s }}>
                    <ObjectStatus state={profileStatusState(p.status)}>{PROFILE_STATUS_LABEL[p.status]}</ObjectStatus>
                  </FlexBox>
                </TableCell>
                <TableCell>
                  <FlexBox alignItems="Center" justifyContent="End">
                    <Icon name="navigation-right-arrow" style={{ color: 'var(--sapContent_LabelColor)' }} />
                  </FlexBox>
                </TableCell>
              </TableRow>
            );
          })}
        </Table>
      </DynamicPage>

      {showRight && rightPanel}
    </div>
  );
};

// ─── Global Context tab component ─────────────────────────────────────────────

const V6GlobalContext: React.FC<{
  entries: GlobalContextEntry[];
  candidates: RuleCandidate[];
  onAdd: () => void;
  onToggleStatus: (id: string) => void;
  onSaveEntry: (entry: GlobalContextEntry) => void;
}> = ({ entries, candidates, onToggleStatus, onSaveEntry }) => {
  const [typeFilter, setTypeFilter] = useState<ContextType | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<GlobalContextEntry | null>(null);

  const visible = entries.filter(e => typeFilter === 'all' || e.contextType === typeFilter);
  const selected = selectedId ? entries.find(e => e.id === selectedId) ?? null : null;
  const types: (ContextType | 'all')[] = ['all', 'transport-group', 'resource-naming', 'store-naming', 'shift', 'fleet-type', 'carrier', 'other'];

  // Count how many rules reference each term (case-insensitive match in plannerInput text)
  const refCount = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach(e => {
      counts[e.id] = candidates.filter(c =>
        [c.plannerInput.description, c.plannerInput.businessReason, c.plannerInput.exampleScenario]
          .some(text => text.toLowerCase().includes(e.term.toLowerCase()))
      ).length;
    });
    return counts;
  }, [entries, candidates]);

  // ─── Entry edit/create form ───────────────────────────────────────────────────
  const EntryForm: React.FC<{ entry: GlobalContextEntry; isNew: boolean }> = ({ entry, isNew }) => {
    const [term, setTerm] = useState(isNew ? '' : entry.term);
    const [definition, setDefinition] = useState(isNew ? '' : entry.definition);
    const [tmMapping, setTmMapping] = useState(isNew ? '' : entry.tmMapping);
    const [scope, setScope] = useState(isNew ? 'All DCs' : entry.scope);
    const [contextType, setContextType] = useState<ContextType>(entry.contextType);
    const [source, setSource] = useState('');
    const canSave = term.trim().length > 0 && definition.trim().length > 0;

    return (
      <DynamicPage style={{ height: '100%', borderLeft: '1px solid var(--sapList_BorderColor)' }}
        showFooter
        footerArea={
          <Bar design="Footer">
            <Text slot="startContent">{isNew ? 'New context entry — active immediately on save.' : `Editing ${entry.id} — changes apply to all rules that reference "${entry.term}".`}</Text>
            <Button slot="endContent" design="Default" icon="decline" onClick={() => setEditingEntry(null)}>Cancel</Button>
            <Button slot="endContent" design="Emphasized" icon="save" disabled={!canSave} onClick={() => {
              onSaveEntry({ ...entry, term: term.trim(), definition: definition.trim(), tmMapping: tmMapping.trim(), scope: scope.trim(), contextType, status: 'active' });
              setEditingEntry(null);
              setSelectedId(entry.id);
            }}>Save</Button>
          </Bar>
        }
        titleArea={
          <DynamicPageTitle
            heading={<Title>{isNew ? 'New Context Entry' : `Edit: ${entry.term}`}</Title>}
            subheading={<Text>Define a reusable business term that can be referenced across rules and profiles.</Text>}
            actionsBar={<Toolbar slot="actionsBar" design="Transparent"><Button design="Transparent" icon="decline" onClick={() => setEditingEntry(null)}>Cancel</Button></Toolbar>}
          />
        }>
        <FlexBox direction="Column" style={{ gap: sp.m, padding: sp.m }}>
          <Panel headerText="Term Details" accessibleRole="Region">
            <Form style={{ padding: sp.s }}>
              <FormGroup>
                <FormItem labelContent={<Label required>Term</Label>}>
                  <Input value={term} onInput={(e) => setTerm((e.target as HTMLInputElement).value)}
                    placeholder="e.g., PTZ, Chiller, Own Fleet" style={{ width: '100%' }} />
                </FormItem>
                <FormItem labelContent={<Label required>Definition</Label>}>
                  <TextArea value={definition} rows={2}
                    onInput={(e) => setDefinition((e.target as HTMLTextAreaElement).value)}
                    placeholder="Plain-language definition of what this term means" style={{ width: '100%' }} />
                </FormItem>
                <FormItem labelContent={<Label>TM Mapping</Label>}>
                  <Input value={tmMapping} onInput={(e) => setTmMapping((e.target as HTMLInputElement).value)}
                    placeholder="e.g., transport_group=0003, carrier_id=GHL" style={{ width: '100%' }} />
                </FormItem>
                <FormItem labelContent={<Label>Type</Label>}>
                  <Select style={{ width: '100%' }} onChange={(e) => {
                    const v = (e.detail as { selectedOption?: { value?: string } }).selectedOption?.value as ContextType;
                    if (v) setContextType(v);
                  }}>
                    {(['transport-group', 'resource-naming', 'store-naming', 'shift', 'fleet-type', 'carrier', 'other'] as ContextType[]).map(t => (
                      <Option key={t} value={t} selected={contextType === t}>{CONTEXT_TYPE_LABEL[t]}</Option>
                    ))}
                  </Select>
                </FormItem>
                <FormItem labelContent={<Label>Scope</Label>}>
                  <Input value={scope} onInput={(e) => setScope((e.target as HTMLInputElement).value)}
                    placeholder="e.g., All DCs, BD27, BD09" style={{ width: '100%' }} />
                </FormItem>
                <FormItem labelContent={<Label>Source (Optional)</Label>}>
                  <Input value={source} onInput={(e) => setSource((e.target as HTMLInputElement).value)}
                    placeholder="e.g., ALDI SOP §3.2, BD27 Operations Manual" style={{ width: '100%' }} />
                </FormItem>
              </FormGroup>
            </Form>
          </Panel>
          <Panel headerText="How It Will Be Used" accessibleRole="Region">
            <FlexBox direction="Column" style={{ gap: sp.s, padding: sp.s }}>
              <MessageStrip design="Information" hideCloseButton>
                Once saved, this term will be matched against rule descriptions as admins type. Matched terms appear as context hints in Rule Creation, helping ensure rules use consistent vocabulary before submission.
              </MessageStrip>
              <MessageStrip design="Information" hideCloseButton>
                The TM Mapping value is used by the backend extraction to resolve this term to a specific TM field or API parameter — e.g. "Chiller" → <strong>transport_group = 0003</strong>.
              </MessageStrip>
            </FlexBox>
          </Panel>
        </FlexBox>
      </DynamicPage>
    );
  };

  const showRight = editingEntry !== null || selected !== null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: showRight ? 'minmax(360px, 50%) 1fr' : '1fr', height: '100%', minHeight: 0 }}>
      <DynamicPage style={{ height: '100%' }}
        titleArea={
          <DynamicPageTitle
            heading={<Title>Global Context</Title>}
            subheading={<Text>Reusable term definitions shared across all rules — transport groups, resources, stores, shifts, carriers.</Text>}
            actionsBar={
              <Toolbar slot="actionsBar" design="Transparent">
                <Button design="Emphasized" icon="add" onClick={() => {
                  const newId = `GC-${String(entries.length + 1).padStart(3, '0')}`;
                  setEditingEntry({ id: newId, term: '', definition: '', tmMapping: '', scope: 'All DCs', contextType: 'other', status: 'active' });
                  setSelectedId(null);
                }}>New Entry</Button>
              </Toolbar>
            }
          />
        }
        headerArea={
          <DynamicPageHeader>
            <div style={{ paddingTop: sp.s, paddingBottom: sp.s }}>
              <FlexBox wrap="Wrap" style={{ gap: sp.xs }}>
                {types.map(t => (
                  <Button key={t} design={typeFilter === t ? 'Emphasized' : 'Default'}
                    onClick={() => setTypeFilter(t)}>
                    {t === 'all' ? `All (${entries.length})` : `${CONTEXT_TYPE_LABEL[t as ContextType]} (${entries.filter(e => e.contextType === t).length})`}
                  </Button>
                ))}
              </FlexBox>
            </div>
          </DynamicPageHeader>
        }>
        <Table
          headerRow={
            <TableHeaderRow sticky>
              <TableHeaderCell width="18%"><Label>Term</Label></TableHeaderCell>
              <TableHeaderCell width="28%"><Label>Definition</Label></TableHeaderCell>
              <TableHeaderCell width="22%"><Label>TM Mapping</Label></TableHeaderCell>
              <TableHeaderCell width="14%"><Label>Type</Label></TableHeaderCell>
              <TableHeaderCell width="10%" horizontalAlign="End"><Label>Used in</Label></TableHeaderCell>
              <TableHeaderCell width="8%" horizontalAlign="End"><Label>Status</Label></TableHeaderCell>
            </TableHeaderRow>
          }>
          {visible.map(e => (
            <TableRow key={e.id} rowKey={e.id} interactive navigated={!editingEntry && selectedId === e.id}
              onClick={() => { setSelectedId(e.id); setEditingEntry(null); }}>
              <TableCell><Text style={{ fontWeight: 700, opacity: e.status === 'inactive' ? 0.5 : 1 }}>{e.term}</Text></TableCell>
              <TableCell><Text style={{ opacity: e.status === 'inactive' ? 0.5 : 1 }}>{e.definition}</Text></TableCell>
              <TableCell><Label>{e.tmMapping}</Label></TableCell>
              <TableCell><Tag colorScheme="8">{CONTEXT_TYPE_LABEL[e.contextType]}</Tag></TableCell>
              <TableCell>
                <FlexBox alignItems="Center" justifyContent="End" style={{ paddingRight: sp.s }}>
                  {refCount[e.id] > 0
                    ? <ObjectStatus state="Positive">{refCount[e.id]} rule{refCount[e.id] !== 1 ? 's' : ''}</ObjectStatus>
                    : <Label>—</Label>}
                </FlexBox>
              </TableCell>
              <TableCell>
                <FlexBox alignItems="Center" justifyContent="End" style={{ paddingRight: sp.s }}>
                  <ObjectStatus state={e.status === 'active' ? 'Positive' : 'None'}>{e.status === 'active' ? 'Active' : 'Inactive'}</ObjectStatus>
                </FlexBox>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </DynamicPage>

      {editingEntry && <EntryForm entry={editingEntry} isNew={!entries.find(e => e.id === editingEntry.id)} />}

      {!editingEntry && selected && (
        <DynamicPage style={{ height: '100%', borderLeft: '1px solid var(--sapList_BorderColor)' }}
          showFooter
          footerArea={
            <Bar design="Footer">
              <Text slot="startContent">
                {selected.status === 'active' ? 'Active — referenced by rules using this term.' : 'Inactive — not available for new rules.'}
                {refCount[selected.id] > 0 && ` Referenced in ${refCount[selected.id]} rule${refCount[selected.id] !== 1 ? 's' : ''}.`}
              </Text>
              <Button slot="endContent" design="Default" icon="edit" onClick={() => setEditingEntry(selected)}>Edit</Button>
              <Button slot="endContent" design={selected.status === 'active' ? 'Attention' : 'Default'}
                icon={selected.status === 'active' ? 'pause' : 'play'}
                onClick={() => onToggleStatus(selected.id)}>
                {selected.status === 'active' ? 'Deactivate' : 'Reactivate'}
              </Button>
            </Bar>
          }
          titleArea={
            <DynamicPageTitle
              heading={<Title>{selected.term}</Title>}
              subheading={<Text>{selected.definition}</Text>}
              actionsBar={
                <Toolbar slot="actionsBar" design="Transparent">
                  <Tag colorScheme="8">{selected.id}</Tag>
                  <Tag colorScheme="8">{CONTEXT_TYPE_LABEL[selected.contextType]}</Tag>
                  <ObjectStatus state={selected.status === 'active' ? 'Positive' : 'None'}>{selected.status === 'active' ? 'Active' : 'Inactive'}</ObjectStatus>
                  <Button design="Transparent" icon="decline" onClick={() => setSelectedId(null)}>Close</Button>
                </Toolbar>
              }
            />
          }>
          <FlexBox direction="Column" style={{ gap: sp.m, padding: sp.m }}>
            <Panel headerText="Entry Details" accessibleRole="Region">
              <Form>
                <FormGroup>
                  <FormItem labelContent={<Label>Term</Label>}><Text style={{ fontWeight: 700 }}>{selected.term}</Text></FormItem>
                  <FormItem labelContent={<Label>Definition</Label>}><Text>{selected.definition}</Text></FormItem>
                  <FormItem labelContent={<Label>TM Mapping</Label>}><Text>{selected.tmMapping || '—'}</Text></FormItem>
                  <FormItem labelContent={<Label>Scope</Label>}><Text>{selected.scope}</Text></FormItem>
                  <FormItem labelContent={<Label>Type</Label>}><Tag colorScheme="8">{CONTEXT_TYPE_LABEL[selected.contextType]}</Tag></FormItem>
                  <FormItem labelContent={<Label>Used in rules</Label>}>
                    <ObjectStatus state={refCount[selected.id] > 0 ? 'Positive' : 'None'}>
                      {refCount[selected.id] > 0 ? `${refCount[selected.id]} rule${refCount[selected.id] !== 1 ? 's' : ''}` : 'Not yet referenced'}
                    </ObjectStatus>
                  </FormItem>
                </FormGroup>
              </Form>
            </Panel>
            {refCount[selected.id] > 0 && (
              <Panel headerText="Rules Referencing This Term" accessibleRole="Region">
                <List>
                  {candidates.filter(c =>
                    [c.plannerInput.description, c.plannerInput.businessReason, c.plannerInput.exampleScenario]
                      .some(text => text.toLowerCase().includes(selected.term.toLowerCase()))
                  ).map(c => (
                    <ListItemStandard key={c.id} icon="document"
                      description={`${c.id} · ${STAGE_LABEL[c.stage]}`}
                      additionalText={RULE_TYPE_LABEL[c.rule.type]}>
                      {c.rule.name}
                    </ListItemStandard>
                  ))}
                </List>
              </Panel>
            )}
            <Panel headerText="Usage Note" accessibleRole="Region">
              <FlexBox style={{ padding: sp.s }}>
                <MessageStrip design="Information" hideCloseButton>
                  As admins write rules, any text matching <strong>{selected.term}</strong> is highlighted as a recognised context term. The TM Mapping <strong>{selected.tmMapping || '(not set)'}</strong> is used by the backend to resolve this term to a specific TM field or API parameter.
                </MessageStrip>
              </FlexBox>
            </Panel>
          </FlexBox>
        </DynamicPage>
      )}
    </div>
  );
};

// ─── Tab 1 — Rule Creation (the form, no list, default landing) ──────────────
const V6RuleCreation: React.FC<{
  drafts: RuleCandidate[];
  allCandidates: RuleCandidate[];
  globalContext: GlobalContextEntry[];
  editingId: string | null;
  onPickDraft: (id: string) => void;
  onClearForm: () => void;
  onSaveDraft: (id: string | null, fields: PlannerInputFormFields) => void;
  onSubmitForValidation: (id: string | null, fields: PlannerInputFormFields) => void;
}> = ({ drafts, allCandidates, globalContext, editingId, onPickDraft, onClearForm, onSaveDraft, onSubmitForValidation }) => {
  // With key={editingId} on the parent, this component remounts whenever editingId changes.
  // useState initializers run fresh each mount — use allCandidates so the lookup works
  // even before the drafts memo has filtered the newly-drafted rule in.
  const c = editingId ? allCandidates.find((x) => x.id === editingId) ?? null : null;
  const candidate = c; // alias used in JSX below

  const [description, setDescription] = useState(c?.plannerInput.description ?? '');
  const [businessReason, setBusinessReason] = useState(c?.plannerInput.businessReason ?? '');
  const [exampleScenario, setExampleScenario] = useState(c?.plannerInput.exampleScenario ?? '');
  const [attachedDocs, setAttachedDocs] = useState<string[]>(c?.plannerInput.attachedDocs ?? []);
  const [ruleName, setRuleName] = useState(c?.rule.name ?? '');
  const [ruleGroup, setRuleGroup] = useState(c?.rule.group ?? 'store-rules');
  const [priority, setPriority] = useState<Priority>(c?.rule.priority ?? 'P2');
  const [ruleType, setRuleType] = useState<RuleType>(c?.rule.type ?? 'hard-constraint');
  const [shortDescription, setShortDescription] = useState('');
  const [dc, setDc] = useState(c?.profile.dc ?? 'DC-BD27');
  const [resourceType, setResourceType] = useState('');
  const [transportGroup, setTransportGroup] = useState('');
  const [storeLocation, setStoreLocation] = useState('');
  const [appliesTo, setAppliesTo] = useState('planning');
  const [effectiveStart, setEffectiveStart] = useState('2026-07-01');
  const [effectiveEnd, setEffectiveEnd] = useState('2026-12-31');
  const [tagsInput, setTagsInput] = useState((c?.plannerInput.tags ?? []).join(', '));

  const charCount = (s: string, max: number) => `${s.length} / ${max}`;
  const required = description.trim().length > 0 && exampleScenario.trim().length > 0
    && ruleName.trim().length > 0 && ruleGroup.length > 0 && dc.length > 0;

  const buildFields = (): PlannerInputFormFields => ({
    description, businessReason, exampleScenario, attachedDocs,
    ruleName, ruleGroup, priority, ruleType, shortDescription,
    dc, resourceType, transportGroup, storeLocation, appliesTo,
    effectiveStart, effectiveEnd,
    tags: tagsInput.split(',').map((t) => t.trim()).filter((t) => t.length > 0),
  });

  const handleClear = () => {
    setDescription(''); setBusinessReason(''); setExampleScenario(''); setAttachedDocs([]);
    setRuleName(''); setShortDescription(''); setStoreLocation(''); setTagsInput('');
    onClearForm();
  };

  const handleAddMockDoc = () => {
    setAttachedDocs((prev) => [...prev, `attachment-${prev.length + 1}.pdf`]);
  };

  return (
    <DynamicPage style={{ height: '100%' }} showFooter
      footerArea={
        <Bar design="Footer">
          <Text slot="startContent">
            {candidate
              ? `Editing ${candidate.id} · Draft`
              : required
                ? 'Ready to submit · Validation pipeline will pick it up'
                : 'Fill the required description and example scenario fields to enable submission'}
          </Text>
          <Button slot="endContent" design="Transparent" icon="reset" onClick={handleClear}>Clear</Button>
          <Button slot="endContent" design="Default" icon="save" onClick={() => onSaveDraft(candidate?.id ?? null, buildFields())}>
            Save as Draft
          </Button>
          <Button slot="endContent" design="Emphasized" icon="paper-plane" disabled={!required}
            onClick={() => onSubmitForValidation(candidate?.id ?? null, buildFields())}>
            Submit for Validation
          </Button>
        </Bar>
      }
      titleArea={
        <DynamicPageTitle
          heading={<Title>{candidate ? `Edit Rule (Draft)` : `Create Rule`}</Title>}
          subheading={<Text>Provide the rule in your own words. The system will extract and structure the details. Backend validation runs after submit.</Text>}
          actionsBar={
            <Toolbar slot="actionsBar" design="Transparent">
              {candidate && <Tag colorScheme="8">{candidate.id}</Tag>}
              {candidate && <Tag colorScheme="8">{STAGE_LABEL[candidate.stage]}</Tag>}
            </Toolbar>
          }
        />
      }>
      <div style={{ padding: sp.m }}>

        {/* How this works — explainer panel at the top */}
        <Panel collapsed headerText="How This Works" accessibleRole="Region" style={{ marginBottom: sp.m }}>
          <FlexBox direction="Column" style={{ gap: sp.s, padding: sp.s }}>
            <Text>
              Describe your rule in plain language. After you submit, the system extracts structured details from your input, then runs automated validation against TM data, APIs, dependencies, and conflicts. An admin then reviews the validation result and approves or sends the rule back.
            </Text>
            <FlexBox wrap="Wrap" style={{ gap: sp.l, marginTop: sp.xs }}>
              <FlexBox alignItems="Start" style={{ gap: sp.s, minWidth: 220, maxWidth: 320 }}>
                <Icon name="edit" />
                <FlexBox direction="Column" style={{ gap: sp.xs }}>
                  <Text style={{ fontWeight: 700 }}>1. You write the rule</Text>
                  <Label>Describe it in your own words and submit for system validation.</Label>
                </FlexBox>
              </FlexBox>
              <FlexBox alignItems="Start" style={{ gap: sp.s, minWidth: 220, maxWidth: 320 }}>
                <Icon name="inspect" />
                <FlexBox direction="Column" style={{ gap: sp.xs }}>
                  <Text style={{ fontWeight: 700 }}>2. System validates</Text>
                  <Label>Backend checks data, APIs, dependencies, conflicts, and coverage.</Label>
                </FlexBox>
              </FlexBox>
              <FlexBox alignItems="Start" style={{ gap: sp.s, minWidth: 220, maxWidth: 320 }}>
                <Icon name="official-service" />
                <FlexBox direction="Column" style={{ gap: sp.xs }}>
                  <Text style={{ fontWeight: 700 }}>3. Admin approves</Text>
                  <Label>The admin reviews findings and approves, sends back, or rejects.</Label>
                </FlexBox>
              </FlexBox>
            </FlexBox>
          </FlexBox>
        </Panel>

        {/* Basic Information — full-width row */}
        <Panel headerText="Basic Information" accessibleRole="Region" style={{ marginBottom: sp.m }}>
          <Form>
            <FormGroup>
              <FormItem labelContent={<Label required>Rule name (short)</Label>}>
                <Input value={ruleName}
                  onInput={(e) => setRuleName((e.target as HTMLInputElement).value)}
                  placeholder="e.g., One-stop night store rule" style={{ width: '100%' }} />
              </FormItem>
              <FormItem labelContent={<Label required>Rule group / category</Label>}>
                <Select onChange={(e) => {
                  const v = (e.detail as { selectedOption?: { value?: string } }).selectedOption?.value;
                  if (v) setRuleGroup(v);
                }}>
                  <Option value="store-rules" selected={ruleGroup === 'store-rules'}>Store Rules</Option>
                  <Option value="resource-rules" selected={ruleGroup === 'resource-rules'}>Resource Rules</Option>
                  <Option value="planning-execution" selected={ruleGroup === 'planning-execution'}>Planning Execution</Option>
                  <Option value="vehicle-rules" selected={ruleGroup === 'vehicle-rules'}>Vehicle Rules</Option>
                  <Option value="time-rules" selected={ruleGroup === 'time-rules'}>Time Rules</Option>
                </Select>
              </FormItem>
              <FormItem labelContent={<Label>Rule type</Label>}>
                <Select onChange={(e) => {
                  const v = (e.detail as { selectedOption?: { value?: string } }).selectedOption?.value;
                  if (v === 'hard-constraint' || v === 'preference') setRuleType(v);
                }}>
                  <Option value="hard-constraint" selected={ruleType === 'hard-constraint'}>Hard constraint</Option>
                  <Option value="preference" selected={ruleType === 'preference'}>Preference</Option>
                </Select>
              </FormItem>
              <FormItem labelContent={<Label>Description (Optional)</Label>}>
                <TextArea rows={2} maxlength={500} value={shortDescription}
                  onInput={(e) => setShortDescription((e.target as HTMLTextAreaElement).value)}
                  placeholder="Short description of the rule..." style={{ width: '100%' }} />
              </FormItem>
            </FormGroup>
          </Form>
        </Panel>

        {/* Numbered intake panels — 2x2 grid (left: 1, 2 · right: 3, 4) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: sp.m }}>

          {/* LEFT — panels 1 and 2 */}
          <FlexBox direction="Column" style={{ gap: sp.m }}>

            <Panel headerText="1. Rule / SOP Description" accessibleRole="Region">
              <FlexBox direction="Column" style={{ gap: sp.s, padding: sp.s }}>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ gap: sp.s, flexWrap: 'wrap' }}>
                  <Label>Paste or type the SOP rule, planning instruction, or business rule in your own words.</Label>
                  <Button design="Transparent" icon="hint">Examples</Button>
                </FlexBox>
                <TextArea rows={6} maxlength={5000} value={description}
                  onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
                  placeholder="e.g., ST-B247 and ST-B263 can be combined during holidays. Do not visit a store more than once in a night shift..."
                  style={{ width: '100%' }} />
                <FlexBox alignItems="Center" justifyContent="SpaceBetween">
                  <Label>{charCount(description, 5000)}</Label>
                  <Label>Include all conditions, exceptions, limits, thresholds, and any other details.</Label>
                </FlexBox>

                {/* Context Used — live match against Global Context terms */}
                {(() => {
                  const allText = `${description} ${businessReason} ${exampleScenario}`.toLowerCase();
                  const matched = globalContext.filter(e =>
                    e.status === 'active' && e.term.length > 2 && allText.includes(e.term.toLowerCase())
                  );
                  if (matched.length === 0) return null;
                  return (
                    <div style={{ marginTop: sp.xs, padding: sp.s, background: 'var(--sapInfoBackground, #e8f4ff)', borderRadius: 'var(--sapElement_BorderCornerRadius, 4px)', border: '1px solid var(--sapInformativeColor, #0070f2)' }}>
                      <Text style={{ fontSize: 'var(--sapFontSmallSize)', fontWeight: 700, color: 'var(--sapInformativeColor, #0070f2)', display: 'block', marginBottom: sp.xs }}>
                        {matched.length} Global Context term{matched.length !== 1 ? 's' : ''} recognised
                      </Text>
                      <FlexBox wrap="Wrap" style={{ gap: sp.xs }}>
                        {matched.map(e => (
                          <div key={e.id} title={`${e.definition}${e.tmMapping ? ` · TM: ${e.tmMapping}` : ''}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 10, background: '#fff', border: '1px solid var(--sapInformativeColor, #0070f2)', fontSize: 'var(--sapFontSmallSize)', cursor: 'help' }}>
                            <span style={{ fontWeight: 700, color: 'var(--sapInformativeColor, #0070f2)' }}>{e.term}</span>
                            {e.tmMapping && <span style={{ color: 'var(--sapContent_LabelColor)' }}>→ {e.tmMapping}</span>}
                          </div>
                        ))}
                      </FlexBox>
                      <Label style={{ display: 'block', marginTop: sp.xs }}>These terms are resolved via Global Context — hover a chip to see the definition and TM mapping.</Label>
                    </div>
                  );
                })()}
              </FlexBox>
            </Panel>

            <Panel headerText="2. Business Context / Reason (Optional)" accessibleRole="Region">
              <FlexBox direction="Column" style={{ gap: sp.s, padding: sp.s }}>
                <Label>Explain why this rule exists, the business objective, or any important background.</Label>
                <TextArea rows={4} maxlength={2000} value={businessReason}
                  onInput={(e) => setBusinessReason((e.target as HTMLTextAreaElement).value)}
                  placeholder="e.g., To reduce extra routes on holidays and improve vehicle utilization..."
                  style={{ width: '100%' }} />
                <Label>{charCount(businessReason, 2000)}</Label>
              </FlexBox>
            </Panel>

          </FlexBox>

          {/* RIGHT — panels 3 and 4 */}
          <FlexBox direction="Column" style={{ gap: sp.m }}>

            <Panel headerText="3. Example Scenario & Expected Behavior" accessibleRole="Region">
              <FlexBox direction="Column" style={{ gap: sp.s, padding: sp.s }}>
                <Label>Provide example scenario(s) and what should happen.</Label>
                <TextArea rows={5} maxlength={3000} value={exampleScenario}
                  onInput={(e) => setExampleScenario((e.target as HTMLTextAreaElement).value)}
                  placeholder="e.g., If ST-B247 and ST-B263 are in the same plan on a holiday → allow combination..."
                  style={{ width: '100%' }} />
                <Label>{charCount(exampleScenario, 3000)}</Label>
              </FlexBox>
            </Panel>

            <Panel headerText="4. Attach Supporting Document (Optional)" accessibleRole="Region">
              <FlexBox direction="Column" style={{ gap: sp.s, padding: sp.s }}>
                <Label>Upload SOP document, policy, or reference file (PDF, Word, Excel, Images)</Label>
                <FlexBox direction="Column" alignItems="Center" justifyContent="Center"
                  style={{
                    gap: sp.s, padding: sp.l,
                    border: '1px dashed var(--sapField_BorderColor, #89919a)',
                    borderRadius: 'var(--sapElement_BorderCornerRadius, 4px)',
                    background: 'var(--sapBackgroundColor, #f7f7f7)',
                  }}>
                  <Icon name="upload" />
                  <Text>Drag and drop files here or</Text>
                  <Button design="Transparent" icon="add-document" onClick={handleAddMockDoc}>Click to browse</Button>
                  <Label>Max file size 20MB</Label>
                </FlexBox>
                {attachedDocs.length > 0 && (
                  <List>
                    {attachedDocs.map((d, i) => (
                      <ListItemStandard key={`${d}-${i}`} icon="document" type="Detail">{d}</ListItemStandard>
                    ))}
                  </List>
                )}
              </FlexBox>
            </Panel>

          </FlexBox>

        </div>

        {/* Drafts strip */}
        <Panel collapsed={drafts.length === 0 && !editingId} headerText={`Resume a Draft (${drafts.length})`} accessibleRole="Region" style={{ marginTop: sp.m }}>
          {drafts.length === 0 ? (
            <FlexBox justifyContent="Center" style={{ padding: sp.m }}>
              <Text>No drafts saved. Use Save as Draft above to save your progress.</Text>
            </FlexBox>
          ) : (
            <List selectionMode="Single">
              {drafts.map((d) => (
                <ListItemStandard
                  key={d.id}
                  selected={editingId === d.id}
                  type="Active"
                  onClick={() => onPickDraft(d.id)}
                  description={d.plannerInput.description
                    ? d.plannerInput.description.slice(0, 120) + (d.plannerInput.description.length > 120 ? '…' : '')
                    : '(No SOP description entered yet)'}
                  additionalText={d.daysInStage > 0 ? `${d.daysInStage}d in draft` : 'New draft'}
                  icon="edit"
                >
                  <FlexBox alignItems="Center" style={{ gap: sp.s }}>
                    <Text style={{ fontWeight: 600 }}>{d.rule.name || '(Rule name not set)'}</Text>
                    <Tag colorScheme="8">{d.id}</Tag>
                    <Tag colorScheme={RULE_TYPE_COLOR[d.rule.type]}>{RULE_TYPE_LABEL[d.rule.type]}</Tag>
                  </FlexBox>
                </ListItemStandard>
              ))}
            </List>
          )}
        </Panel>

      </div>
    </DynamicPage>
  );
};
// ─── Tab 2 — Validation & Approval (two-pane: list left, detail right) ──────
const VALIDATION_STAGES: PipelineStage[] = ['submitted', 'validation'];
const APPROVAL_STAGES: PipelineStage[] = ['approval'];
const LIBRARY_STAGES: PipelineStage[] = ['published', 'retired', 'rejected'];

type ReviewScope = 'validation' | 'approval' | 'library';

interface V6ReviewListProps {
  candidates: RuleCandidate[];
  selectedId: string | null;
  scope: ReviewScope;
  validatingIds: Set<string>;
  validationProgress: Record<string, number>;
  onScopeChange: (s: ReviewScope) => void;
  onSelect: (id: string) => void;
}

const V6ReviewList: React.FC<V6ReviewListProps> = ({ candidates, selectedId, scope, validatingIds, validationProgress, onScopeChange, onSelect }) => {
  const stageSet = scope === 'validation' ? VALIDATION_STAGES : scope === 'approval' ? APPROVAL_STAGES : LIBRARY_STAGES;

  const visible = useMemo(() =>
    candidates
      .filter((c) => stageSet.includes(c.stage))
      .sort((a, b) => {
        const sa = STAGE_SORT_INDEX[a.stage] ?? 99;
        const sb = STAGE_SORT_INDEX[b.stage] ?? 99;
        if (sa !== sb) return sa - sb;
        return b.daysInStage - a.daysInStage;
      }),
    [candidates, scope] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const counts = {
    validation: candidates.filter((c) => VALIDATION_STAGES.includes(c.stage)).length,
    approval:   candidates.filter((c) => APPROVAL_STAGES.includes(c.stage)).length,
    library:    candidates.filter((c) => LIBRARY_STAGES.includes(c.stage)).length,
  };

  const titleMap: Record<ReviewScope, string> = {
    validation: 'Validation Queue',
    approval:   'Approval Queue',
    library:    'Rule Library',
  };
  const subtitleMap: Record<ReviewScope, string> = {
    validation: 'Rules awaiting or undergoing backend validation checks',
    approval:   'Validation complete — rules awaiting admin approval decision',
    library:    'Published, retired, and rejected rules',
  };

  return (
    <DynamicPage style={{ height: '100%' }}
      titleArea={
        <DynamicPageTitle
          heading={<Title>{titleMap[scope]}</Title>}
          subheading={<Text>{subtitleMap[scope]} · {visible.length} rule{visible.length !== 1 ? 's' : ''}</Text>}
        />
      }
      headerArea={
        <DynamicPageHeader>
          <div style={{ paddingTop: sp.s, paddingBottom: sp.s }}>
            <SegmentedButton
              onSelectionChange={(e) => {
                const sel = (e.detail as { selectedItems?: ReadonlyArray<{ getAttribute?: (n: string) => string | null }> }).selectedItems?.[0];
                const v = sel?.getAttribute?.('data-scope') ?? null;
                if (v === 'validation' || v === 'approval' || v === 'library') onScopeChange(v);
              }}
            >
              <SegmentedButtonItem icon="inspect" data-scope="validation" selected={scope === 'validation'}>
                Validation Queue ({counts.validation})
              </SegmentedButtonItem>
              <SegmentedButtonItem icon="official-service" data-scope="approval" selected={scope === 'approval'}>
                Approval Queue ({counts.approval})
              </SegmentedButtonItem>
              <SegmentedButtonItem icon="sys-enter-2" data-scope="library" selected={scope === 'library'}>
                Rule Library ({counts.library})
              </SegmentedButtonItem>
            </SegmentedButton>
          </div>
        </DynamicPageHeader>
      }>
      <div style={{ padding: 0 }}>
        {visible.length === 0 ? (
          <div style={{ padding: sp.l }}>
            <IllustratedMessage
              name="NoEntries"
              titleText={`No rules in ${titleMap[scope]}`}
              subtitleText={scope === 'validation' ? 'Submit a rule from Rule Creation to see it here.' : scope === 'approval' ? 'Move a validated rule to Approval from the Validation Queue.' : 'Approved and retired rules appear here.'}
            />
          </div>
        ) : (
          <Table
            headerRow={
              <TableHeaderRow sticky>
                <TableHeaderCell width="55%"><Label>Rule</Label></TableHeaderCell>
                <TableHeaderCell width="25%"><Label>Validation Gate</Label></TableHeaderCell>
                <TableHeaderCell width="15%" horizontalAlign="End"><Label>Status</Label></TableHeaderCell>
                <TableHeaderCell width="5%" horizontalAlign="End"><Label></Label></TableHeaderCell>
              </TableHeaderRow>
            }
          >
            {visible.map((c) => (
              <TableRow key={c.id} rowKey={c.id} interactive navigated={selectedId === c.id} onClick={() => onSelect(c.id)}>
                <TableCell>
                  <FlexBox direction="Column" style={{ gap: sp.xs, paddingTop: sp.xs, paddingBottom: sp.xs }}>
                    <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
                      <Text style={{ fontWeight: 700 }}>{c.rule.name}</Text>
                      <Tag colorScheme={RULE_TYPE_COLOR[c.rule.type]}>{RULE_TYPE_LABEL[c.rule.type]}</Tag>
                    </FlexBox>
                    <Label>{c.id} · {c.sourceDoc} · {c.sourceCitation}</Label>
                  </FlexBox>
                </TableCell>
                <TableCell>
                  {validatingIds.has(c.id) ? (
                    <FlexBox direction="Column" style={{ gap: 4, minWidth: 100 }}>
                      <FlexBox alignItems="Center" justifyContent="SpaceBetween">
                        <Label style={{ color: 'var(--sapInformativeColor, #0070f2)' }}>Validating…</Label>
                        <Label>{validationProgress[c.id] ?? 0}%</Label>
                      </FlexBox>
                      <div style={{ height: 4, background: 'var(--sapNeutralBackground)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${validationProgress[c.id] ?? 0}%`, background: 'var(--sapInformativeColor, #0070f2)', transition: 'width 0.25s', borderRadius: 2 }} />
                      </div>
                    </FlexBox>
                  ) : c.validationStatus !== 'pending' ? (
                    <ObjectStatus state={validationStatusState(c.validationStatus)}>
                      {VALIDATION_STATUS_LABEL[c.validationStatus]}
                    </ObjectStatus>
                  ) : (
                    <ObjectStatus state="None">
                      {c.stage === 'submitted' ? 'Queued' : overallValidationLabel(computeOverallValidation(c.validationChecks))}
                    </ObjectStatus>
                  )}
                </TableCell>
                <TableCell>
                  <FlexBox alignItems="Center" justifyContent="End" style={{ paddingRight: sp.s }}>
                    <ObjectStatus state={stageStatusState(c.stage)}>{STAGE_LABEL[c.stage]}</ObjectStatus>
                  </FlexBox>
                </TableCell>
                <TableCell>
                  <FlexBox alignItems="Center" justifyContent="End">
                    <Icon name="navigation-right-arrow" style={{ color: 'var(--sapContent_LabelColor)' }} />
                  </FlexBox>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </div>
    </DynamicPage>
  );
};

// ─── Detail Pane — explainability core + actions per stage ──────────────────
interface V6ReviewDetailProps {
  candidate: RuleCandidate | null;
  validatingIds: Set<string>;
  validationProgress: Record<string, number>;
  onCloseDetail: () => void;
  onMarkReadyForApproval: (id: string) => void;
  onSendBackToCreation: (id: string) => void;
  onReevaluate: (id: string) => void;
  onApprove: (id: string, note: string) => void;
  onSendBackFromApproval: (id: string, note: string) => void;
  onReject: (id: string, note: string) => void;
  onRetire: (id: string, reason: string) => void;
}

const V6ReviewDetail: React.FC<V6ReviewDetailProps> = ({
  candidate, validatingIds, validationProgress, onCloseDetail, onMarkReadyForApproval,
  onSendBackToCreation, onReevaluate, onApprove, onSendBackFromApproval, onReject, onRetire,
}) => {
  const [decisionNote, setDecisionNote] = useState('');

  useEffect(() => { setDecisionNote(''); }, [candidate?.id]);

  const isValidating = !!(candidate && validatingIds.has(candidate.id));
  const progress = candidate ? (validationProgress[candidate.id] ?? 0) : 0;

  if (!candidate) {
    return (
      <DynamicPage style={{ height: '100%' }}
        titleArea={<DynamicPageTitle heading={<Title>Select a Rule</Title>} subheading={<Text>Pick a rule from the list to view details and take action.</Text>} />}>
        <FlexBox justifyContent="Center" alignItems="Center" style={{ height: '100%', padding: sp.l }}>
          <IllustratedMessage name="NoData" titleText="No rule selected" subtitleText="Click a rule on the left to view it." />
        </FlexBox>
      </DynamicPage>
    );
  }

  const summary  = computeValidationSummary(candidate.validationChecks);
  const overall  = computeOverallValidation(candidate.validationChecks);
  const isPublished       = candidate.stage === 'published';
  const isRetiredOrRejected = candidate.stage === 'retired' || candidate.stage === 'rejected';
  const isApprovalStage   = candidate.stage === 'approval';
  const isValidationStage = candidate.stage === 'validation' || candidate.stage === 'submitted';
  const eligibleForApproval = overall === 'all-pass' || overall === 'partial';

  // Validation gate matrix — determines what approval actions are available
  // Hard Constraint + detect-only → Reject or Send Back (cannot publish as executable)
  // Preference + detect-only → Allow as informational only (can publish)
  // anything + not-supported → Reject only
  const gateAllowsApproval =
    candidate.validationStatus === 'supported' ||
    (candidate.validationStatus === 'detect-only' && candidate.rule.type === 'preference');
  const gateRequiresSendBack =
    candidate.validationStatus === 'detect-only' && candidate.rule.type === 'hard-constraint';
  const gateBlocked = candidate.validationStatus === 'not-supported';

  // Approval label changes for preference + detect-only
  const approveLabel = (candidate.validationStatus === 'detect-only' && candidate.rule.type === 'preference')
    ? 'Publish as Informational'
    : 'Approve & Publish';

  const gateMatrixNote =
    gateBlocked         ? 'Validation gate: Not Supported — this rule cannot be published. See section 3 for details. Reject or send back for revision.'
    : gateRequiresSendBack ? 'Validation gate: Detect-only + Hard Constraint — cannot publish as executable. See section 3 for details. Send back for revision or reject.'
    : (candidate.validationStatus === 'detect-only') ? 'Validation gate: Detect-only + Preference — can publish as informational only. Planner will see flags; no automated correction will run.'
    : '';

  // Validation gate outcome label & guidance
  const gateGuidance: Record<ValidationStatus, string> = {
    'supported':     'All required TM data and APIs are available — rule can be published as executable.',
    'detect-only':   'Some actions unavailable — rule can be published as detect-only (flags violations, no TM action executed at runtime).',
    'not-supported': 'Required TM data or APIs are unavailable — rule cannot be published. Send back for revision or reject.',
    'pending':       'Backend validation has not yet completed.',
  };

  return (
    <DynamicPage style={{ height: '100%' }} showFooter
      footerArea={
        <Bar design="Footer">
          <Text slot="startContent">
            {isApprovalStage
              ? (gateMatrixNote || 'Approve & Publish makes the rule live in the Rule Library. Send Back returns it to Draft. Reject closes permanently.')
              : isValidating
                ? 'Backend validation is running — please wait.'
              : isValidationStage
                ? (candidate.validationStatus === 'detect-only' && candidate.rule.type === 'hard-constraint')
                  ? 'Detect-only + Hard Constraint — this rule cannot move to Approval. Send back for revision or reject.'
                  : (overall === 'all-pass' ? 'Validation passed — move to Approval Queue when ready.'
                  : overall === 'partial' ? 'Warnings found — admin can still move to Approval or send back for revision.'
                  : overall === 'failed' ? 'Validation failed — send back for revision.'
                  : 'Validation in progress…')
              : isPublished
                ? 'Published — active in Rule Library. Can be assigned to Rule Profiles. Editing creates a new draft version.'
                : `${STAGE_LABEL[candidate.stage]}.`}
          </Text>
          {isValidationStage && !isValidating && (
            <>
              {(candidate.validationStatus === 'detect-only' && candidate.rule.type === 'hard-constraint') && (
                <Button slot="endContent" design="Negative" icon="decline" onClick={() => onReject(candidate.id, decisionNote)}>Reject</Button>
              )}
              <Button slot="endContent" design="Default" icon="undo" onClick={() => onSendBackToCreation(candidate.id)}>Send Back to Draft</Button>
              {!(candidate.validationStatus === 'detect-only' && candidate.rule.type === 'hard-constraint') && (
                <Button slot="endContent" design="Emphasized" icon="forward" disabled={!eligibleForApproval} onClick={() => onMarkReadyForApproval(candidate.id)}>
                  Move to Approval →
                </Button>
              )}
            </>
          )}
          {isApprovalStage && (
            <>
              <Button slot="endContent" design="Negative" icon="decline" onClick={() => onReject(candidate.id, decisionNote)}>Reject</Button>
              <Button slot="endContent" design="Default" icon="undo" onClick={() => onSendBackFromApproval(candidate.id, decisionNote)}>Send Back to Draft</Button>
              {!gateBlocked && !gateRequiresSendBack && (
                <Button slot="endContent" design="Emphasized" icon="accept" onClick={() => onApprove(candidate.id, decisionNote)}>
                  {approveLabel}
                </Button>
              )}
            </>
          )}
          {isPublished && (
            <Button slot="endContent" design="Attention" icon="pause" onClick={() => onRetire(candidate.id, decisionNote)}>Retire Rule</Button>
          )}
          {candidate.stage === 'retired' && (
            <Button slot="endContent" design="Default" icon="synchronize" onClick={() => onReevaluate(candidate.id)}>Re-open as Draft</Button>
          )}
        </Bar>
      }
      titleArea={
        <DynamicPageTitle
          heading={<Title>{candidate.rule.name}</Title>}
          subheading={<Text>Submitted by {candidate.submittedBy} on {candidate.submittedDate} · {candidate.daysInStage}d in stage</Text>}
          actionsBar={
            <Toolbar slot="actionsBar" design="Transparent">
              <Tag colorScheme="8">{candidate.id}</Tag>
              <Tag colorScheme={RULE_TYPE_COLOR[candidate.rule.type]}>{RULE_TYPE_LABEL[candidate.rule.type]}</Tag>
              <ObjectStatus state={stageStatusState(candidate.stage)} icon={<Icon name={STAGE_ICON[candidate.stage]} />}>
                {STAGE_LABEL[candidate.stage]}
              </ObjectStatus>
              {candidate.validationStatus !== 'pending' && (
                <ObjectStatus state={validationStatusState(candidate.validationStatus)}>
                  {VALIDATION_STATUS_LABEL[candidate.validationStatus]}
                </ObjectStatus>
              )}
              <Button design="Transparent" icon="decline" onClick={onCloseDetail}>Close</Button>
            </Toolbar>
          }
        />
      }>
      <FlexBox direction="Column" style={{ gap: sp.m, padding: sp.m, paddingBottom: sp.l }}>

        {/* Status banners */}
        {candidate.stage === 'retired' && candidate.retiredReason && (
          <MessageStrip design="Warning" hideCloseButton>
            <strong>Retired</strong> — {candidate.retiredReason}
          </MessageStrip>
        )}
        {candidate.stage === 'rejected' && candidate.rejectedReason && (
          <MessageStrip design="Negative" hideCloseButton>
            <strong>Rejected</strong> — {candidate.rejectedReason}
          </MessageStrip>
        )}
        {isPublished && (
          <MessageStrip design="Positive" hideCloseButton>
            Published and active in the Rule Library. To modify, use <strong>Retire Rule</strong> and create a new draft version.
          </MessageStrip>
        )}

        {/* 1. Original SOP text */}
        <Panel headerText="1. Source SOP Clause" accessibleRole="Region">
          <FlexBox direction="Column" style={{ gap: sp.xs, padding: sp.s }}>
            <FlexBox alignItems="Center" style={{ gap: sp.xs, marginBottom: sp.xs }}>
              <Icon name="document" />
              <Label>{candidate.sourceDoc} · {candidate.sourceCitation}</Label>
            </FlexBox>
            <Text style={{ fontStyle: 'italic' }}>"{candidate.sourceClause}"</Text>
          </FlexBox>
        </Panel>

        {/* 2. Extracted structured rule */}
        <Panel headerText="2. Extracted Structured Rule" accessibleRole="Region">
          <FlexBox direction="Column" style={{ gap: sp.m, padding: sp.s }}>
            <MessageStrip design="Information" hideCloseButton>
              Extracted by the backend from the submitted free-text rule. Review for accuracy before approving.
            </MessageStrip>

            {/* Classification row */}
            <FlexBox wrap="Wrap" style={{ gap: sp.s }}>
              <FlexBox direction="Column" style={{ gap: sp.xs, minWidth: 140 }}>
                <Label>Rule type</Label>
                <Tag colorScheme={RULE_TYPE_COLOR[candidate.rule.type]} style={{ width: 'fit-content' }}>
                  {RULE_TYPE_LABEL[candidate.rule.type]}
                </Tag>
              </FlexBox>
              <FlexBox direction="Column" style={{ gap: sp.xs, minWidth: 80 }}>
                <Label>Priority</Label>
                <Tag colorScheme={PRIORITY_COLOR[candidate.rule.priority]} style={{ width: 'fit-content' }}>
                  {candidate.rule.priority}
                </Tag>
              </FlexBox>
              {candidate.rule.scope && (
                <FlexBox direction="Column" style={{ gap: sp.xs, flex: 1, minWidth: 200 }}>
                  <Label>Scope</Label>
                  <Text>{candidate.rule.scope}</Text>
                </FlexBox>
              )}
            </FlexBox>

            {/* Conditions */}
            {candidate.rule.conditions && (
              <FlexBox direction="Column" style={{ gap: sp.xs }}>
                <Label style={{ fontWeight: 'bold' }}>Conditions</Label>
                <div style={{
                  background: 'var(--sapNeutralBackground, #f5f6f7)',
                  border: '1px solid var(--sapField_BorderColor)',
                  borderRadius: 'var(--sapElement_BorderCornerRadius, 4px)',
                  padding: `${sp.s} ${sp.m}`,
                  fontFamily: 'var(--sapFontFamily)',
                  fontSize: 'var(--sapFontSmallSize)',
                  color: 'var(--sapTextColor)',
                  lineHeight: 1.6,
                }}>
                  {candidate.rule.conditions}
                </div>
              </FlexBox>
            )}

            {/* Actions */}
            {candidate.rule.actions && (
              <FlexBox direction="Column" style={{ gap: sp.xs }}>
                <Label style={{ fontWeight: 'bold' }}>Actions</Label>
                <div style={{
                  background: 'var(--sapNeutralBackground, #f5f6f7)',
                  border: '1px solid var(--sapField_BorderColor)',
                  borderRadius: 'var(--sapElement_BorderCornerRadius, 4px)',
                  padding: `${sp.s} ${sp.m}`,
                  fontFamily: 'var(--sapFontFamily)',
                  fontSize: 'var(--sapFontSmallSize)',
                  color: 'var(--sapTextColor)',
                  lineHeight: 1.6,
                }}>
                  {candidate.rule.actions}
                </div>
              </FlexBox>
            )}

            {/* Exceptions */}
            {candidate.rule.exceptions && (
              <FlexBox direction="Column" style={{ gap: sp.xs }}>
                <Label style={{ fontWeight: 'bold' }}>Exceptions</Label>
                <Text>{candidate.rule.exceptions}</Text>
              </FlexBox>
            )}

            {/* Parameters */}
            {candidate.rule.parameters.length > 0 && (
              <FlexBox direction="Column" style={{ gap: sp.xs }}>
                <Label style={{ fontWeight: 'bold' }}>Parameters</Label>
                <Table
                  headerRow={
                    <TableHeaderRow>
                      <TableHeaderCell width="40%"><Label>Parameter</Label></TableHeaderCell>
                      <TableHeaderCell width="60%"><Label>Value</Label></TableHeaderCell>
                    </TableHeaderRow>
                  }>
                  {candidate.rule.parameters.map(p => (
                    <TableRow key={p.key} rowKey={p.key}>
                      <TableCell><Text style={{ fontWeight: 600 }}>{p.key}</Text></TableCell>
                      <TableCell><Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)' }}>{p.value}</Text></TableCell>
                    </TableRow>
                  ))}
                </Table>
              </FlexBox>
            )}

            {/* Example scenario */}
            {candidate.plannerInput.exampleScenario && (
              <FlexBox direction="Column" style={{ gap: sp.xs }}>
                <Label style={{ fontWeight: 'bold' }}>Example scenario</Label>
                <div style={{
                  background: 'var(--sapInfoBackground, #e8f4ff)',
                  border: '1px solid var(--sapInformativeColor, #0070f2)',
                  borderLeft: `3px solid var(--sapInformativeColor, #0070f2)`,
                  borderRadius: 'var(--sapElement_BorderCornerRadius, 4px)',
                  padding: `${sp.s} ${sp.m}`,
                  fontFamily: 'var(--sapFontFamily)',
                  fontSize: 'var(--sapFontSmallSize)',
                  color: 'var(--sapTextColor)',
                  whiteSpace: 'pre-line',
                  lineHeight: 1.6,
                }}>
                  {candidate.plannerInput.exampleScenario}
                </div>
              </FlexBox>
            )}

            {/* Business reason */}
            {candidate.plannerInput.businessReason && (
              <FlexBox direction="Column" style={{ gap: sp.xs }}>
                <Label style={{ fontWeight: 'bold' }}>Business reason</Label>
                <Text>{candidate.plannerInput.businessReason}</Text>
              </FlexBox>
            )}
          </FlexBox>
        </Panel>

        {/* 3. Validation result */}
        <Panel headerText="3. Validation Result" accessibleRole="Region">
          <FlexBox direction="Column" style={{ gap: sp.s, padding: sp.s }}>

            {/* Running indicator */}
            {isValidating && (
              <FlexBox direction="Column" style={{ gap: sp.s }}>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween">
                  <Text style={{ fontWeight: 600 }}>Backend validation is running…</Text>
                  <Text style={{ fontWeight: 700, color: 'var(--sapInformativeColor, #0070f2)' }}>{progress}%</Text>
                </FlexBox>
                <div style={{ height: 6, background: 'var(--sapNeutralBackground, #e5e5e5)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: 'var(--sapInformativeColor, #0070f2)', transition: 'width 0.25s ease', borderRadius: 3 }} />
                </div>
                <Label>Checking rule completeness, context, TM data, APIs, and dependencies…</Label>
              </FlexBox>
            )}

            {!isValidating && (
              <>{/* Gate outcome */}
            <FlexBox alignItems="Center" justifyContent="SpaceBetween" wrap="Wrap" style={{ gap: sp.m, padding: `${sp.s} 0`, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
              <FlexBox direction="Column" style={{ gap: sp.xs }}>
                <Label>Validation Gate Outcome</Label>
                <ObjectStatus state={validationStatusState(candidate.validationStatus)} large>
                  {VALIDATION_STATUS_LABEL[candidate.validationStatus]}
                </ObjectStatus>
              </FlexBox>
              <FlexBox wrap="Wrap" style={{ gap: sp.m }}>
                {(['passed', 'warnings', 'failed', 'pending'] as const).map(key => (
                  <FlexBox key={key} direction="Column" style={{ gap: sp.xs, minWidth: 60 }}>
                    <Label>{key.charAt(0).toUpperCase() + key.slice(1)}</Label>
                    <ObjectStatus state={key === 'passed' ? 'Positive' : key === 'warnings' ? 'Critical' : key === 'failed' ? 'Negative' : 'None'}>
                      {summary[key as keyof typeof summary]}
                    </ObjectStatus>
                  </FlexBox>
                ))}
              </FlexBox>
            </FlexBox>

            {/* Gate guidance — contextual definition card */}
            {candidate.validationStatus !== 'pending' && (() => {
              const isHard = candidate.rule.type === 'hard-constraint';
              const vs = candidate.validationStatus;

              const heading: Record<typeof vs, string> = {
                'supported':     '✓ Supported — rule can be published as executable',
                'detect-only':   '⚠ Detect-only — violations flagged, no automated correction',
                'not-supported': '✗ Not Supported — rule cannot be published',
                'pending':       '',
              };

              const what: Record<typeof vs, string> = {
                'supported':
                  'All required TM data fields and write APIs are confirmed available. At runtime, the system can detect violations of this rule AND generate executable recommendation packages the planner can accept to apply corrections.',
                'detect-only':
                  'TM data is available to detect violations of this rule, but no confirmed write API exists to correct them automatically. At runtime the system will flag the violation to the planner — but it cannot propose an executable fix. The planner must resolve violations manually in TM Cockpit.',
                'not-supported':
                  'Neither detection nor correction is possible with the current TM data and APIs. The system cannot evaluate this rule at runtime in any form.',
                'pending': '',
              };

              const implication: Record<typeof vs, string> =
                vs === 'supported' ? {
                  'supported': `This is a ${isHard ? 'Hard Constraint' : 'Preference'}. The system will generate recommendation packages to enforce it.`,
                } as any
                : vs === 'detect-only' && isHard ? {
                  'detect-only': 'This rule is a Hard Constraint — it is expected to be enforceable, not just advisory. Publishing it as detect-only would show planners a violation without offering a correction, which conflicts with the intent of the rule. Recommended action: Send Back for revision (confirm the write API, simplify the condition, or split into a supported sub-rule), or Reject.',
                } as any
                : vs === 'detect-only' && !isHard ? {
                  'detect-only': 'This rule is a Preference — informational flags are consistent with its intent. It can be published as detect-only. The system will surface the condition to the planner at runtime; no automated correction will be applied.',
                } as any
                : vs === 'not-supported' ? {
                  'not-supported': 'This rule cannot be published in any form — neither as executable nor detect-only. Options: Send Back to revise (simplify the condition, remove unsupported parameters, or wait for TM API availability), or Reject.',
                } as any
                : {} as any;

              const stripDesign =
                vs === 'supported' ? 'Positive' :
                vs === 'detect-only' ? 'Warning' : 'Negative';

              return (
                <div style={{
                  border: `1px solid var(--sap${vs === 'supported' ? 'Positive' : vs === 'detect-only' ? 'Critical' : 'Negative'}Color)`,
                  borderRadius: 'var(--sapElement_BorderCornerRadius, 4px)',
                  overflow: 'hidden',
                }}>
                  {/* Header bar */}
                  <div style={{
                    background: vs === 'supported' ? 'var(--sapSuccessBackground, #f0fdf4)'
                      : vs === 'detect-only' ? 'var(--sapWarningBackground, #fff8e1)'
                      : 'var(--sapErrorBackground, #fff0f0)',
                    padding: `${sp.s} ${sp.m}`,
                    borderBottom: `1px solid var(--sap${vs === 'supported' ? 'Positive' : vs === 'detect-only' ? 'Critical' : 'Negative'}Color)`,
                  }}>
                    <Text style={{
                      fontWeight: 700,
                      color: vs === 'supported' ? 'var(--sapPositiveColor)' : vs === 'detect-only' ? 'var(--sapCriticalColor)' : 'var(--sapNegativeColor)',
                    }}>
                      {heading[vs]}
                    </Text>
                  </div>

                  {/* Body */}
                  <FlexBox direction="Column" style={{ gap: sp.s, padding: sp.m }}>
                    {/* What it means */}
                    <FlexBox direction="Column" style={{ gap: sp.xs }}>
                      <Label style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 'var(--sapFontSmallSize)' }}>
                        What this means
                      </Label>
                      <Text style={{ fontSize: 'var(--sapFontSmallSize)', lineHeight: 1.6 }}>
                        {what[vs]}
                      </Text>
                    </FlexBox>

                    {/* Rule-type-specific implication */}
                    <FlexBox direction="Column" style={{ gap: sp.xs, paddingTop: sp.xs, borderTop: '1px solid var(--sapList_BorderColor)' }}>
                      <FlexBox alignItems="Center" style={{ gap: sp.xs }}>
                        <Tag colorScheme={RULE_TYPE_COLOR[candidate.rule.type]}>{RULE_TYPE_LABEL[candidate.rule.type]}</Tag>
                        <Label style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 'var(--sapFontSmallSize)' }}>
                          For this rule
                        </Label>
                      </FlexBox>
                      <Text style={{ fontSize: 'var(--sapFontSmallSize)', lineHeight: 1.6 }}>
                        {implication[vs]}
                      </Text>
                    </FlexBox>
                  </FlexBox>
                </div>
              );
            })()}

            {/* 6 check results */}
            <Table
              headerRow={
                <TableHeaderRow>
                  <TableHeaderCell width="38%"><Label>Check</Label></TableHeaderCell>
                  <TableHeaderCell width="14%"><Label>Result</Label></TableHeaderCell>
                  <TableHeaderCell width="48%"><Label>Detail</Label></TableHeaderCell>
                </TableHeaderRow>
              }>
              {candidate.validationChecks.map((check) => (
                <TableRow key={check.id} rowKey={check.id}>
                  <TableCell>
                    <FlexBox alignItems="Center" style={{ gap: sp.s }}>
                      <Icon name={check.status === 'pass' ? 'sys-enter-2' : check.status === 'warning' ? 'alert' : check.status === 'fail' ? 'decline' : 'pending'} />
                      <Text style={{ fontWeight: 700 }}>{check.label}</Text>
                    </FlexBox>
                  </TableCell>
                  <TableCell>
                    <ObjectStatus state={checkStatusState(check.status)}>{checkStatusLabel(check.status)}</ObjectStatus>
                  </TableCell>
                  <TableCell><Text>{check.detail || '—'}</Text></TableCell>
                </TableRow>
              ))}
            </Table>

            {/* Required TM data + APIs */}
            {(candidate.mapping.tmEntities.length > 0 || candidate.mapping.apiEndpoints.length > 0) && (
              <FlexBox direction="Column" style={{ gap: sp.xs, marginTop: sp.xs }}>
                <Label>Required TM Data &amp; APIs</Label>
                <FlexBox wrap="Wrap" style={{ gap: sp.xs }}>
                  {candidate.mapping.tmEntities.map(e => <Tag key={e} colorScheme="2">{e}</Tag>)}
                  {candidate.mapping.apiEndpoints.map(a => <Tag key={a} colorScheme="6">{a}</Tag>)}
                  {candidate.mapping.fields.map(f => <Tag key={f} colorScheme="8">{f}</Tag>)}
                </FlexBox>
                <Label>LLM confidence: <strong>{candidate.mapping.llmConfidence}</strong>
                  {candidate.mapping.llmNotes ? ` — ${candidate.mapping.llmNotes}` : ''}
                </Label>
              </FlexBox>
            )}
            </>
            )}
          </FlexBox>
        </Panel>

        {/* 4. Admin decision (approval stage or published/retired notes) */}
        {(isApprovalStage || isPublished) && (
          <Panel headerText={isApprovalStage ? '4. Admin Decision' : '4. Approval Record'} accessibleRole="Region">
            {isApprovalStage ? (
              <Form style={{ padding: sp.s }}>
                <FormGroup>
                  <FormItem labelContent={<Label>Decision notes (optional)</Label>}>
                    <TextArea rows={3} value={decisionNote}
                      onInput={(e) => setDecisionNote((e.target as HTMLTextAreaElement).value)}
                      placeholder="Enter rationale for your approval, rejection, or send-back decision…"
                      style={{ width: '100%' }} />
                  </FormItem>
                </FormGroup>
              </Form>
            ) : (
              <Form style={{ padding: sp.s }}>
                <FormGroup>
                  <FormItem labelContent={<Label>Approved by</Label>}><Text>{candidate.approvedBy ?? '—'}</Text></FormItem>
                  <FormItem labelContent={<Label>Approved on</Label>}><Text>{candidate.approvedDate ?? '—'}</Text></FormItem>
                  <FormItem labelContent={<Label>Fired (last 7 days)</Label>}><Text>{candidate.firedLast7d ?? 0}×</Text></FormItem>
                </FormGroup>
              </Form>
            )}
          </Panel>
        )}

        {/* Retire note field (for published rules) */}
        {isPublished && (
          <Panel headerText="Retire" accessibleRole="Region">
            <FlexBox direction="Column" style={{ gap: sp.s, padding: sp.s }}>
              <MessageStrip design="Information" hideCloseButton>
                Retiring removes this rule from planner selection. Historical sessions tied to a Rule Profile version that included this rule are not affected.
              </MessageStrip>
              <TextArea rows={2} value={decisionNote}
                onInput={(e) => setDecisionNote((e.target as HTMLTextAreaElement).value)}
                placeholder="Reason for retiring this rule (optional)…"
                style={{ width: '100%' }} />
            </FlexBox>
          </Panel>
        )}

        {/* Terminal states: rejected */}
        {isRetiredOrRejected && (
          <Panel headerText="History" accessibleRole="Region">
            <FlexBox direction="Column" style={{ gap: sp.s, padding: sp.s }}>
              {candidate.stage === 'published' && (
                <FlexBox alignItems="Center" style={{ gap: sp.s }}>
                  <Label>Approved by</Label><Text>{candidate.approvedBy ?? '—'} on {candidate.approvedDate ?? '—'}</Text>
                </FlexBox>
              )}
            </FlexBox>
          </Panel>
        )}

      </FlexBox>
    </DynamicPage>
  );
};

// ─── System Setup types ───────────────────────────────────────────────────────

type ConnStatus = 'not-configured' | 'testing' | 'connected' | 'failed';
type DiscoveryStatus = 'idle' | 'discovering' | 'done' | 'failed';
type SetupStatus = 'incomplete' | 'draft' | 'active';
type HealthStatus = 'healthy' | 'warning' | 'error';
type MetaObjStatus = 'discovered' | 'partial' | 'failed' | 'not-available';

interface TMConnection {
  name: string; environment: 'DEV' | 'QA' | 'PROD';
  systemUrl: string; destinationName: string;
  authType: 'OAuth2SAMLBearer' | 'OAuth2ClientCredentials' | 'PrincipalPropagation' | 'BasicAuthentication';
  tenantId: string; description: string;
  status: ConnStatus; lastTestedAt: string | null;
  tmVersion: string | null; technicalUser: string | null;
}
interface MetaObject { objectType: string; count: number; status: MetaObjStatus; }
interface MetadataDiscovery {
  objects: MetaObject[];
  status: DiscoveryStatus; lastRefreshedAt: string | null;
}
interface RuleProfileDefault {
  id: string; planningProfile: string; dc: string; region: string;
  planningScenario: string; defaultRuleProfileId: string;
  effectiveDate: string; status: 'active' | 'inactive';
}
interface PlanningDefaults {
  planningHorizonDays: number; maxEvaluationRuntimeSeconds: number;
  sessionIdleTimeoutMinutes: number; defaultRuleProfile: string;
  allowRuleReordering: boolean; allowSaveToTM: boolean;
  maxRecommendationPackages: number; maxReevaluationsPerSession: number;
  metadataRefreshFrequencyHours: number;
  defaultProposalRanking: 'cost' | 'utilization' | 'distance' | 'rule-priority';
}
interface ServiceHealth { name: string; status: HealthStatus; detail: string; }

const INITIAL_RP_DEFAULTS: RuleProfileDefault[] = [
  { id: 'RPD-001', planningProfile: 'ALDI-DE-South-Daily', dc: 'DC-BD27', region: 'DE South', planningScenario: 'Daily', defaultRuleProfileId: 'RP-001', effectiveDate: '2026-01-01', status: 'active' },
  { id: 'RPD-002', planningProfile: 'ALDI-BD09-Holiday',   dc: 'DC-BD09', region: 'DE South', planningScenario: 'Holiday', defaultRuleProfileId: 'RP-004', effectiveDate: '2026-12-20', status: 'active' },
];

const META_OBJECTS_SEED: MetaObject[] = [
  { objectType: 'Distribution Centres',     count: 0, status: 'not-available' },
  { objectType: 'Stores',                   count: 0, status: 'not-available' },
  { objectType: 'Resources',                count: 0, status: 'not-available' },
  { objectType: 'Carriers',                 count: 0, status: 'not-available' },
  { objectType: 'Fleet Types',              count: 0, status: 'not-available' },
  { objectType: 'Transport Groups',         count: 0, status: 'not-available' },
  { objectType: 'Shifts',                   count: 0, status: 'not-available' },
  { objectType: 'Planning Profiles',        count: 0, status: 'not-available' },
  { objectType: 'Optimizer Profiles',       count: 0, status: 'not-available' },
  { objectType: 'Freight Order Types',      count: 0, status: 'not-available' },
  { objectType: 'Freight Unit Types',       count: 0, status: 'not-available' },
  { objectType: 'Business Partners',        count: 0, status: 'not-available' },
  { objectType: 'Delivery Calendars',       count: 0, status: 'not-available' },
  { objectType: 'Read APIs',                count: 0, status: 'not-available' },
  { objectType: 'Write / Action APIs',      count: 0, status: 'not-available' },
];

const META_OBJECTS_DISCOVERED: MetaObject[] = [
  { objectType: 'Distribution Centres',     count: 2,  status: 'discovered' },
  { objectType: 'Stores',                   count: 47, status: 'discovered' },
  { objectType: 'Resources',                count: 11, status: 'discovered' },
  { objectType: 'Carriers',                 count: 5,  status: 'discovered' },
  { objectType: 'Fleet Types',              count: 4,  status: 'discovered' },
  { objectType: 'Transport Groups',         count: 3,  status: 'discovered' },
  { objectType: 'Shifts',                   count: 2,  status: 'discovered' },
  { objectType: 'Planning Profiles',        count: 4,  status: 'discovered' },
  { objectType: 'Optimizer Profiles',       count: 2,  status: 'discovered' },
  { objectType: 'Freight Order Types',      count: 3,  status: 'discovered' },
  { objectType: 'Freight Unit Types',       count: 5,  status: 'discovered' },
  { objectType: 'Business Partners',        count: 12, status: 'discovered' },
  { objectType: 'Delivery Calendars',       count: 4,  status: 'discovered' },
  { objectType: 'Read APIs',                count: 18, status: 'discovered' },
  { objectType: 'Write / Action APIs',      count: 7,  status: 'partial' },
];

const HEALTH_SERVICES_MOCK: ServiceHealth[] = [
  { name: 'Rule Validation Service',    status: 'healthy', detail: 'All checks passing' },
  { name: 'Planning Evaluation',        status: 'healthy', detail: 'Running normally' },
  { name: 'TM Read APIs',               status: 'healthy', detail: '18 endpoints available' },
  { name: 'TM Write / Action APIs',     status: 'warning', detail: '7 of 9 confirmed — 2 pending TM upgrade' },
  { name: 'Audit Logging',              status: 'healthy', detail: 'Writing to audit store' },
  { name: 'Application Logs',           status: 'healthy', detail: 'Log pipeline active' },
  { name: 'Metadata Sync',              status: 'healthy', detail: 'Last sync successful' },
  { name: 'Rule Profile Service',       status: 'healthy', detail: 'Profiles loaded' },
];

const HEALTH_COLOR: Record<HealthStatus, string> = {
  healthy: 'var(--sapPositiveColor)',
  warning: 'var(--sapCriticalColor)',
  error:   'var(--sapNegativeColor)',
};
const HEALTH_STATE: Record<HealthStatus, 'Positive' | 'Critical' | 'Negative'> = {
  healthy: 'Positive', warning: 'Critical', error: 'Negative',
};
const META_STATE: Record<MetaObjStatus, 'Positive' | 'Critical' | 'Negative' | 'None'> = {
  discovered: 'Positive', partial: 'Critical', failed: 'Negative', 'not-available': 'None',
};
const META_LABEL: Record<MetaObjStatus, string> = {
  discovered: 'Discovered', partial: 'Partial', failed: 'Failed', 'not-available': 'Not discovered',
};

// ─── V6SystemSetup component ──────────────────────────────────────────────────

const V6SystemSetup: React.FC<{
  globalContext: GlobalContextEntry[];
  ruleProfiles: RuleProfileEntry[];
  candidates: RuleCandidate[];
  onNavigateTo: (tab: string) => void;
  onSetupStatusChange: (s: SetupStatus) => void;
}> = ({ globalContext, ruleProfiles, candidates, onNavigateTo, onSetupStatusChange }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [setupStatus, setSetupStatus] = useState<SetupStatus>('incomplete');
  const [activatedAt, setActivatedAt] = useState<string | null>(null);

  const [conn, setConn] = useState<TMConnection>({
    name: '', environment: 'QA', systemUrl: '', destinationName: '',
    authType: 'OAuth2SAMLBearer', tenantId: '', description: '',
    status: 'not-configured', lastTestedAt: null, tmVersion: null, technicalUser: null,
  });
  const [discovery, setDiscovery] = useState<MetadataDiscovery>({
    objects: META_OBJECTS_SEED, status: 'idle', lastRefreshedAt: null,
  });
  const [rpDefaults, setRpDefaults] = useState<RuleProfileDefault[]>(INITIAL_RP_DEFAULTS);
  const [showRpdForm, setShowRpdForm] = useState(false);
  const [defaults, setDefaults] = useState<PlanningDefaults>({
    planningHorizonDays: 7, maxEvaluationRuntimeSeconds: 120, sessionIdleTimeoutMinutes: 30,
    defaultRuleProfile: '', allowRuleReordering: true, allowSaveToTM: true,
    maxRecommendationPackages: 20, maxReevaluationsPerSession: 5,
    metadataRefreshFrequencyHours: 24, defaultProposalRanking: 'cost',
  });
  const [defaultsSaved, setDefaultsSaved] = useState(false);

  const activeContextCount = globalContext.filter(e => e.status === 'active').length;
  const activeProfileCount = ruleProfiles.filter(p => p.status === 'active').length;
  const activeRpdCount = rpDefaults.filter(r => r.status === 'active').length;
  const publishedRuleCount = candidates.filter(c => c.stage === 'published').length;
  const draftRuleCount = candidates.filter(c => c.stage === 'draft').length;
  const retiredRuleCount = candidates.filter(c => c.stage === 'retired').length;

  const checks = {
    connection: conn.status === 'connected',
    connectionTested: conn.lastTestedAt !== null && conn.status === 'connected',
    metadata: discovery.status === 'done',
    context: activeContextCount >= 1,
    profiles: activeProfileCount >= 1,
    rpDefaults: activeRpdCount >= 1,
    defaults: defaultsSaved,
  };
  const allChecksPass = Object.values(checks).every(Boolean);

  const CONN_STATE: Record<ConnStatus, { label: string; state: 'Positive' | 'Negative' | 'Critical' | 'None' }> = {
    'not-configured': { label: 'Not configured', state: 'None' },
    'testing':        { label: 'Testing...', state: 'None' },
    'connected':      { label: 'Connected', state: 'Positive' },
    'failed':         { label: 'Connection failed', state: 'Negative' },
  };

  function testConnection() {
    setConn(c => ({ ...c, status: 'testing' }));
    setTimeout(() => {
      const ok = conn.systemUrl.trim().length > 0 && conn.destinationName.trim().length > 0;
      setConn(c => ({
        ...c, status: ok ? 'connected' : 'failed',
        lastTestedAt: new Date().toLocaleTimeString(),
        tmVersion: ok ? 'S/4HANA 2025 FPS1' : null,
        technicalUser: ok ? 'SVC_ALDI_TM_APP' : null,
      }));
    }, 2000);
  }

  function runDiscovery() {
    setDiscovery(d => ({ ...d, status: 'discovering' }));
    let idx = 0;
    const ticker = setInterval(() => {
      if (idx < META_OBJECTS_DISCOVERED.length) {
        const obj = META_OBJECTS_DISCOVERED[idx];
        setDiscovery(d => ({ ...d, objects: d.objects.map((o, i) => i === idx ? obj : o) }));
        idx++;
      } else {
        clearInterval(ticker);
        setDiscovery(d => ({ ...d, status: 'done', lastRefreshedAt: new Date().toLocaleTimeString() }));
      }
    }, 160);
  }

  function activate() {
    const ts = new Date().toLocaleString();
    setActivatedAt(ts);
    setSetupStatus('active');
    onSetupStatusChange('active');
    setCurrentStep(7);
  }

  const STEPS = [
    { n: 1, label: 'Connect to SAP TM',       done: checks.connection },
    { n: 2, label: 'Discover TM Metadata',     done: checks.metadata },
    { n: 3, label: 'Global Context Mapping',   done: checks.context },
    { n: 4, label: 'Rule Profile Defaults',    done: checks.rpDefaults },
    { n: 5, label: 'Planning Defaults',        done: checks.defaults },
    { n: 6, label: 'Review & Activate',        done: setupStatus === 'active' },
    { n: 7, label: 'System Dashboard',         done: setupStatus === 'active' },
  ];

  const stepContent = () => {
    switch (currentStep) {

      case 1: return (
        <FlexBox direction="Column" style={{ gap: sp.m }}>
          <FlexBox alignItems="Center" justifyContent="SpaceBetween" wrap="Wrap" style={{ gap: sp.s }}>
            <Text style={{ ...bodyText, fontWeight: 600 }}>Configure the SAP TM connection this app will use to read planning objects and execute TM actions.</Text>
            <ObjectStatus state={CONN_STATE[conn.status].state}>{CONN_STATE[conn.status].label}</ObjectStatus>
          </FlexBox>
          <Panel headerText="Connection Details" accessibleRole="Region">
            <Form style={{ padding: sp.s }}>
              <FormGroup>
                <FormItem labelContent={<Label required>Connection name</Label>}>
                  <Input value={conn.name} onInput={(e) => setConn(c => ({ ...c, name: (e.target as HTMLInputElement).value }))} placeholder="e.g. ALDI-TM-QA" style={{ width: '100%' }} />
                </FormItem>
                <FormItem labelContent={<Label required>Environment</Label>}>
                  <Select style={{ width: '100%' }} onChange={(e) => { const v = (e.detail as any).selectedOption?.value; if (v) setConn(c => ({ ...c, environment: v })); }}>
                    {(['DEV','QA','PROD'] as const).map(env => <Option key={env} value={env} selected={conn.environment === env}>{env}</Option>)}
                  </Select>
                </FormItem>
                <FormItem labelContent={<Label required>SAP TM system URL</Label>}>
                  <Input value={conn.systemUrl} onInput={(e) => setConn(c => ({ ...c, systemUrl: (e.target as HTMLInputElement).value }))} placeholder="https://tm.aldi-sap.de" style={{ width: '100%' }} />
                </FormItem>
                <FormItem labelContent={<Label required>BTP destination name</Label>}>
                  <Input value={conn.destinationName} onInput={(e) => setConn(c => ({ ...c, destinationName: (e.target as HTMLInputElement).value }))} placeholder="ALDI_TM_DEST" style={{ width: '100%' }} />
                </FormItem>
                <FormItem labelContent={<Label>Authentication method</Label>}>
                  <Select style={{ width: '100%' }} onChange={(e) => { const v = (e.detail as any).selectedOption?.value; if (v) setConn(c => ({ ...c, authType: v })); }}>
                    {(['OAuth2SAMLBearer','OAuth2ClientCredentials','PrincipalPropagation','BasicAuthentication'] as const).map(a => <Option key={a} value={a} selected={conn.authType === a}>{a}</Option>)}
                  </Select>
                </FormItem>
                <FormItem labelContent={<Label>Tenant / System ID</Label>}>
                  <Input value={conn.tenantId} onInput={(e) => setConn(c => ({ ...c, tenantId: (e.target as HTMLInputElement).value }))} placeholder="e.g. ALDI-S4-QA" style={{ width: '100%' }} />
                </FormItem>
                <FormItem labelContent={<Label>Description (Optional)</Label>}>
                  <Input value={conn.description} onInput={(e) => setConn(c => ({ ...c, description: (e.target as HTMLInputElement).value }))} placeholder="Optional notes" style={{ width: '100%' }} />
                </FormItem>
              </FormGroup>
            </Form>
          </Panel>
          {conn.status === 'connected' && conn.tmVersion && (
            <Panel headerText="Connection Status" accessibleRole="Region">
              <Form style={{ padding: sp.s }}>
                <FormGroup>
                  <FormItem labelContent={<Label>Status</Label>}><ObjectStatus state="Positive">Connected</ObjectStatus></FormItem>
                  <FormItem labelContent={<Label>Last tested</Label>}><Text>{conn.lastTestedAt}</Text></FormItem>
                  <FormItem labelContent={<Label>TM version</Label>}><Text style={{ fontWeight: 600 }}>{conn.tmVersion}</Text></FormItem>
                  <FormItem labelContent={<Label>Technical user</Label>}><Text>{conn.technicalUser}</Text></FormItem>
                  <FormItem labelContent={<Label>Read APIs</Label>}><ObjectStatus state="Positive">Available</ObjectStatus></FormItem>
                  <FormItem labelContent={<Label>Write / Action APIs</Label>}><ObjectStatus state="Critical">Partial</ObjectStatus></FormItem>
                </FormGroup>
              </Form>
            </Panel>
          )}
          {conn.status === 'failed' && <MessageStrip design="Negative" hideCloseButton>Connection failed. Check the system URL and BTP destination name, then retry.</MessageStrip>}
          <FlexBox justifyContent="End" style={{ gap: sp.s }}>
            <Button design="Default" icon="reset" onClick={() => setConn(c => ({ ...c, name:'', systemUrl:'', destinationName:'', tenantId:'', description:'', status:'not-configured', lastTestedAt:null, tmVersion:null, technicalUser:null }))}>Reset</Button>
            <Button design={conn.status === 'connected' ? 'Default' : 'Emphasized'} icon="connected" disabled={conn.status === 'testing'} onClick={testConnection}>
              {conn.status === 'testing' ? 'Testing...' : conn.status === 'connected' ? 'Re-test Connection' : 'Test Connection'}
            </Button>
          </FlexBox>
        </FlexBox>
      );

      case 2: return (
        <FlexBox direction="Column" style={{ gap: sp.m }}>
          <Text style={bodyText}>Discover available TM metadata objects. The app uses these to validate rules and resolve planning context at runtime.</Text>
          {!checks.connection && <MessageStrip design="Warning" hideCloseButton>Complete Step 1 (TM Connection) before running metadata discovery.</MessageStrip>}
          {discovery.status === 'discovering' && <MessageStrip design="Information" hideCloseButton>Discovery in progress — retrieving metadata from SAP TM...</MessageStrip>}
          {discovery.status === 'done' && <MessageStrip design="Positive" hideCloseButton>Metadata discovery complete. Last refreshed at {discovery.lastRefreshedAt}.</MessageStrip>}
          <Panel headerText={`TM Metadata Objects (${discovery.objects.filter(o => o.status === 'discovered' || o.status === 'partial').length} of ${discovery.objects.length} available)`} accessibleRole="Region">
            <Table headerRow={
              <TableHeaderRow>
                <TableHeaderCell width="42%"><Label>Object type</Label></TableHeaderCell>
                <TableHeaderCell width="18%" horizontalAlign="End"><Label>Count</Label></TableHeaderCell>
                <TableHeaderCell width="28%" horizontalAlign="End"><Label>Status</Label></TableHeaderCell>
                <TableHeaderCell width="12%" horizontalAlign="End"><Label></Label></TableHeaderCell>
              </TableHeaderRow>
            }>
              {discovery.objects.map(o => (
                <TableRow key={o.objectType} rowKey={o.objectType}>
                  <TableCell><Text>{o.objectType}</Text></TableCell>
                  <TableCell><FlexBox justifyContent="End"><Text style={{ fontWeight: o.count > 0 ? 700 : 400, color: o.count === 0 ? 'var(--sapContent_LabelColor)' : undefined }}>{o.count > 0 ? o.count : '—'}</Text></FlexBox></TableCell>
                  <TableCell><FlexBox justifyContent="End"><ObjectStatus state={META_STATE[o.status]}>{META_LABEL[o.status]}</ObjectStatus></FlexBox></TableCell>
                  <TableCell><FlexBox justifyContent="End">{o.status === 'failed' && <Button design="Transparent" icon="refresh" onClick={runDiscovery} />}</FlexBox></TableCell>
                </TableRow>
              ))}
            </Table>
          </Panel>
          {discovery.objects.some(o => o.status === 'partial') && (
            <MessageStrip design="Warning" hideCloseButton>
              Write / Action APIs show partial coverage. Rules requiring unsupported write APIs will be published as Detect-only at validation time.
            </MessageStrip>
          )}
          <FlexBox justifyContent="End" style={{ gap: sp.s }}>
            {discovery.status === 'done' && <Button design="Default" icon="refresh" onClick={runDiscovery}>Refresh Metadata</Button>}
            <Button design={checks.connection ? 'Emphasized' : 'Default'} icon="sys-find" disabled={!checks.connection || discovery.status === 'discovering'} onClick={runDiscovery}>
              {discovery.status === 'discovering' ? 'Discovering...' : discovery.status === 'done' ? 'Re-run Discovery' : 'Run Metadata Discovery'}
            </Button>
          </FlexBox>
        </FlexBox>
      );

      case 3: return (
        <FlexBox direction="Column" style={{ gap: sp.m }}>
          <FlexBox alignItems="Center" justifyContent="SpaceBetween" wrap="Wrap" style={{ gap: sp.s }}>
            <Text style={bodyText}>Map ALDI business terms to SAP TM technical values. These mappings are shared across all rules and used by backend extraction.</Text>
            <Button design="Transparent" icon="action" onClick={() => onNavigateTo('context')}>Manage in Global Context</Button>
          </FlexBox>
          <MessageStrip design={activeContextCount > 0 ? 'Positive' : 'Warning'} hideCloseButton>
            {activeContextCount > 0 ? `${activeContextCount} active mapping${activeContextCount !== 1 ? 's' : ''} across ${new Set(globalContext.filter(e => e.status === 'active').map(e => e.contextType)).size} types.` : 'No active mappings. Open Global Context to add at least one.'}
          </MessageStrip>
          <Panel headerText={`Context Mappings — ${activeContextCount} active, ${globalContext.length - activeContextCount} inactive`} accessibleRole="Region">
            <Table headerRow={
              <TableHeaderRow>
                <TableHeaderCell width="16%"><Label>Term</Label></TableHeaderCell>
                <TableHeaderCell width="28%"><Label>Definition</Label></TableHeaderCell>
                <TableHeaderCell width="25%"><Label>TM Mapping</Label></TableHeaderCell>
                <TableHeaderCell width="17%"><Label>Type</Label></TableHeaderCell>
                <TableHeaderCell width="14%" horizontalAlign="End"><Label>Status</Label></TableHeaderCell>
              </TableHeaderRow>
            }>
              {globalContext.map(e => (
                <TableRow key={e.id} rowKey={e.id}>
                  <TableCell><Text style={{ fontWeight: 600, opacity: e.status === 'inactive' ? 0.5 : 1 }}>{e.term}</Text></TableCell>
                  <TableCell><Text style={{ fontSize: 'var(--sapFontSmallSize)', opacity: e.status === 'inactive' ? 0.5 : 1 }}>{e.definition}</Text></TableCell>
                  <TableCell><Label>{e.tmMapping || '—'}</Label></TableCell>
                  <TableCell><Tag colorScheme="8">{CONTEXT_TYPE_LABEL[e.contextType]}</Tag></TableCell>
                  <TableCell><FlexBox justifyContent="End"><ObjectStatus state={e.status === 'active' ? 'Positive' : 'None'}>{e.status === 'active' ? 'Active' : 'Inactive'}</ObjectStatus></FlexBox></TableCell>
                </TableRow>
              ))}
            </Table>
          </Panel>
          <FlexBox justifyContent="End"><Button design="Default" icon="add" onClick={() => onNavigateTo('context')}>Add Mapping</Button></FlexBox>
        </FlexBox>
      );

      case 4: return (
        <FlexBox direction="Column" style={{ gap: sp.m }}>
          <FlexBox alignItems="Center" justifyContent="SpaceBetween" wrap="Wrap" style={{ gap: sp.s }}>
            <Text style={bodyText}>Map planning contexts to default Rule Profiles. Planners see only active profiles that match their TM Profile and DC.</Text>
            <Button design="Transparent" icon="action" onClick={() => onNavigateTo('profiles')}>Manage Rule Profiles</Button>
          </FlexBox>
          <Panel headerText={`Planning Context to Rule Profile Mappings (${activeRpdCount} active)`} accessibleRole="Region">
            <Table headerRow={
              <TableHeaderRow>
                <TableHeaderCell width="22%"><Label>Planning Profile</Label></TableHeaderCell>
                <TableHeaderCell width="11%"><Label>DC</Label></TableHeaderCell>
                <TableHeaderCell width="11%"><Label>Region</Label></TableHeaderCell>
                <TableHeaderCell width="11%"><Label>Scenario</Label></TableHeaderCell>
                <TableHeaderCell width="25%"><Label>Default Rule Profile</Label></TableHeaderCell>
                <TableHeaderCell width="11%"><Label>Effective</Label></TableHeaderCell>
                <TableHeaderCell width="9%" horizontalAlign="End"><Label>Status</Label></TableHeaderCell>
              </TableHeaderRow>
            }>
              {rpDefaults.map(r => {
                const rp = ruleProfiles.find(p => p.id === r.defaultRuleProfileId);
                return (
                  <TableRow key={r.id} rowKey={r.id}>
                    <TableCell><Text style={{ fontWeight: 600, fontSize: 'var(--sapFontSmallSize)' }}>{r.planningProfile}</Text></TableCell>
                    <TableCell><Text style={{ fontSize: 'var(--sapFontSmallSize)' }}>{r.dc}</Text></TableCell>
                    <TableCell><Text style={{ fontSize: 'var(--sapFontSmallSize)' }}>{r.region}</Text></TableCell>
                    <TableCell><Tag colorScheme="8">{r.planningScenario}</Tag></TableCell>
                    <TableCell>
                      <FlexBox direction="Column" style={{ gap: 2 }}>
                        <Text style={{ fontWeight: 600, fontSize: 'var(--sapFontSmallSize)' }}>{rp?.name ?? r.defaultRuleProfileId}</Text>
                        {rp && <Label>{rp.version}</Label>}
                      </FlexBox>
                    </TableCell>
                    <TableCell><Text style={{ fontSize: 'var(--sapFontSmallSize)' }}>{r.effectiveDate}</Text></TableCell>
                    <TableCell><FlexBox justifyContent="End"><ObjectStatus state={r.status === 'active' ? 'Positive' : 'None'}>{r.status === 'active' ? 'Active' : 'Inactive'}</ObjectStatus></FlexBox></TableCell>
                  </TableRow>
                );
              })}
            </Table>
            {showRpdForm && (
              <div style={{ padding: sp.m, borderTop: '1px solid var(--sapList_BorderColor)', background: 'var(--sapList_SelectionBackgroundColor, #e8f4ff)' }}>
                <Text style={{ fontWeight: 600, display: 'block', marginBottom: sp.s }}>New Mapping</Text>
                <FlexBox wrap="Wrap" style={{ gap: sp.s }}>
                  <Input placeholder="Planning Profile" style={{ flex: 1, minWidth: 160 }} />
                  <Input placeholder="DC" style={{ width: 100 }} />
                  <Input placeholder="Region" style={{ width: 100 }} />
                  <Select style={{ width: 110 }}>{['Daily','Holiday','Weekend'].map(s => <Option key={s} value={s}>{s}</Option>)}</Select>
                  <Select style={{ flex: 1, minWidth: 160 }}>
                    <Option value="">(Select Profile)</Option>
                    {ruleProfiles.filter(p => p.status === 'active').map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                  </Select>
                  <Button design="Emphasized" icon="save" onClick={() => {
                    setRpDefaults(prev => [...prev, { id: `RPD-${prev.length + 1}`, planningProfile: 'New Profile', dc: 'DC-BD27', region: 'DE South', planningScenario: 'Daily', defaultRuleProfileId: ruleProfiles.find(p => p.status === 'active')?.id ?? '', effectiveDate: '2026-07-01', status: 'active' }]);
                    setShowRpdForm(false);
                  }}>Save</Button>
                  <Button design="Default" onClick={() => setShowRpdForm(false)}>Cancel</Button>
                </FlexBox>
              </div>
            )}
          </Panel>
          {activeProfileCount === 0 && <MessageStrip design="Warning" hideCloseButton>No active Rule Profiles. Publish at least one profile before configuring defaults.</MessageStrip>}
          <FlexBox justifyContent="End">
            <Button design="Default" icon="add" disabled={activeProfileCount === 0} onClick={() => setShowRpdForm(true)}>Add Mapping</Button>
          </FlexBox>
          <Panel collapsed headerText={`Published Rule Profiles for Reference (${activeProfileCount} active)`} accessibleRole="Region">
            <Table headerRow={<TableHeaderRow>
              <TableHeaderCell width="40%"><Label>Profile</Label></TableHeaderCell>
              <TableHeaderCell width="20%"><Label>DC</Label></TableHeaderCell>
              <TableHeaderCell width="15%"><Label>Version</Label></TableHeaderCell>
              <TableHeaderCell width="15%"><Label>Rules</Label></TableHeaderCell>
              <TableHeaderCell width="10%" horizontalAlign="End"><Label>Status</Label></TableHeaderCell>
            </TableHeaderRow>}>
              {ruleProfiles.map(p => (
                <TableRow key={p.id} rowKey={p.id}>
                  <TableCell><Text style={{ fontWeight: 600 }}>{p.name}</Text></TableCell>
                  <TableCell><Text>{p.dc}</Text></TableCell>
                  <TableCell><Tag colorScheme="8">{p.version}</Tag></TableCell>
                  <TableCell><Text>{p.ruleIds.length} rules</Text></TableCell>
                  <TableCell><FlexBox justifyContent="End"><ObjectStatus state={profileStatusState(p.status)}>{PROFILE_STATUS_LABEL[p.status]}</ObjectStatus></FlexBox></TableCell>
                </TableRow>
              ))}
            </Table>
          </Panel>
        </FlexBox>
      );

      case 5: return (
        <FlexBox direction="Column" style={{ gap: sp.m }}>
          <Text style={bodyText}>Configure default runtime settings for planning sessions.</Text>
          <Panel headerText="Session and Evaluation Settings" accessibleRole="Region">
            <Form style={{ padding: sp.s }}>
              <FormGroup>
                <FormItem labelContent={<Label>Planning horizon (days)</Label>}>
                  <Input type="Number" value={String(defaults.planningHorizonDays)} onInput={(e) => setDefaults(d => ({ ...d, planningHorizonDays: Math.max(1, parseInt((e.target as HTMLInputElement).value) || 7) }))} style={{ width: '100%' }} />
                </FormItem>
                <FormItem labelContent={<Label>Max evaluation runtime (seconds)</Label>}>
                  <Input type="Number" value={String(defaults.maxEvaluationRuntimeSeconds)} onInput={(e) => setDefaults(d => ({ ...d, maxEvaluationRuntimeSeconds: Math.max(1, parseInt((e.target as HTMLInputElement).value) || 120) }))} style={{ width: '100%' }} />
                </FormItem>
                <FormItem labelContent={<Label>Session idle timeout (minutes)</Label>}>
                  <Input type="Number" value={String(defaults.sessionIdleTimeoutMinutes)} onInput={(e) => setDefaults(d => ({ ...d, sessionIdleTimeoutMinutes: Math.max(1, parseInt((e.target as HTMLInputElement).value) || 30) }))} style={{ width: '100%' }} />
                </FormItem>
                <FormItem labelContent={<Label>Max recommendation packages</Label>}>
                  <Input type="Number" value={String(defaults.maxRecommendationPackages)} onInput={(e) => setDefaults(d => ({ ...d, maxRecommendationPackages: Math.max(1, parseInt((e.target as HTMLInputElement).value) || 20) }))} style={{ width: '100%' }} />
                </FormItem>
                <FormItem labelContent={<Label>Max re-evaluations per session</Label>}>
                  <Input type="Number" value={String(defaults.maxReevaluationsPerSession)} onInput={(e) => setDefaults(d => ({ ...d, maxReevaluationsPerSession: Math.max(1, parseInt((e.target as HTMLInputElement).value) || 5) }))} style={{ width: '100%' }} />
                </FormItem>
                <FormItem labelContent={<Label>Metadata auto-refresh frequency</Label>}>
                  <Select style={{ width: '100%' }} onChange={(e) => { const v = parseInt((e.detail as any).selectedOption?.value); if (!isNaN(v)) setDefaults(d => ({ ...d, metadataRefreshFrequencyHours: v })); }}>
                    {[{v:1,l:'Every 1 hour'},{v:6,l:'Every 6 hours'},{v:24,l:'Every 24 hours'},{v:0,l:'Manual only'}].map(o => <Option key={o.v} value={String(o.v)} selected={defaults.metadataRefreshFrequencyHours === o.v}>{o.l}</Option>)}
                  </Select>
                </FormItem>
                <FormItem labelContent={<Label>Default proposal ranking</Label>}>
                  <Select style={{ width: '100%' }} onChange={(e) => { const v = (e.detail as any).selectedOption?.value; if (v) setDefaults(d => ({ ...d, defaultProposalRanking: v })); }}>
                    {[{v:'cost',l:'Cost (lowest first)'},{v:'utilization',l:'Utilization (highest first)'},{v:'distance',l:'Distance (shortest first)'},{v:'rule-priority',l:'Rule priority order'}].map(o => <Option key={o.v} value={o.v} selected={defaults.defaultProposalRanking === o.v}>{o.l}</Option>)}
                  </Select>
                </FormItem>
                <FormItem labelContent={<Label>Default Rule Profile</Label>}>
                  <Select style={{ width: '100%' }} onChange={(e) => { const v = (e.detail as any).selectedOption?.value; if (v !== undefined) setDefaults(d => ({ ...d, defaultRuleProfile: v })); }}>
                    <Option value="" selected={!defaults.defaultRuleProfile}>(None — planner selects at session start)</Option>
                    {ruleProfiles.filter(p => p.status === 'active').map(p => <Option key={p.id} value={p.id} selected={defaults.defaultRuleProfile === p.id}>{p.name}</Option>)}
                  </Select>
                </FormItem>
                <FormItem labelContent={<Label>Allow planners to reorder rules</Label>}>
                  <CheckBox checked={defaults.allowRuleReordering} onChange={(e) => setDefaults(d => ({ ...d, allowRuleReordering: (e.target as any).checked }))} text="Enabled" />
                </FormItem>
                <FormItem labelContent={<Label>Allow save to TM</Label>}>
                  <CheckBox checked={defaults.allowSaveToTM} onChange={(e) => setDefaults(d => ({ ...d, allowSaveToTM: (e.target as any).checked }))} text="Enabled" />
                </FormItem>
              </FormGroup>
            </Form>
          </Panel>
          <FlexBox justifyContent="End" style={{ gap: sp.s }}>
            <Button design="Default" onClick={() => { setDefaults({ planningHorizonDays:7, maxEvaluationRuntimeSeconds:120, sessionIdleTimeoutMinutes:30, defaultRuleProfile:'', allowRuleReordering:true, allowSaveToTM:true, maxRecommendationPackages:20, maxReevaluationsPerSession:5, metadataRefreshFrequencyHours:24, defaultProposalRanking:'cost' }); setDefaultsSaved(false); }}>Reset to Recommended</Button>
            <Button design="Emphasized" icon="save" onClick={() => setDefaultsSaved(true)}>Save Defaults</Button>
          </FlexBox>
          {defaultsSaved && <MessageStrip design="Positive" hideCloseButton>Planning defaults saved.</MessageStrip>}
        </FlexBox>
      );

      case 6: return (
        <FlexBox direction="Column" style={{ gap: sp.m }}>
          {setupStatus === 'active' ? (
            <MessageStrip design="Positive" hideCloseButton>Setup is Active — activated by H. Fischer (Admin) at {activatedAt}. Planners can now sign in and start planning sessions.</MessageStrip>
          ) : (
            <MessageStrip design="Information" hideCloseButton>Complete all required steps below to activate the environment. Planners cannot start sessions until setup is active.</MessageStrip>
          )}
          <Panel headerText="Setup Checklist" accessibleRole="Region">
            <Table headerRow={<TableHeaderRow>
              <TableHeaderCell width="55%"><Label>Requirement</Label></TableHeaderCell>
              <TableHeaderCell width="25%"><Label>Status</Label></TableHeaderCell>
              <TableHeaderCell width="20%" horizontalAlign="End"><Label>Action</Label></TableHeaderCell>
            </TableHeaderRow>}>
              {([
                { label: 'TM connection configured',              done: checks.connection,       step: 1, tab: null },
                { label: 'TM connection tested successfully',     done: checks.connectionTested, step: 1, tab: null },
                { label: 'TM metadata discovered',               done: checks.metadata,         step: 2, tab: null },
                { label: 'Global context mappings (>= 1 active)',done: checks.context,          step: 3, tab: 'context' },
                { label: 'Active Rule Profile exists',           done: checks.profiles,         step: 4, tab: 'profiles' },
                { label: 'Rule Profile defaults configured',     done: checks.rpDefaults,       step: 4, tab: null },
                { label: 'Planning defaults saved',              done: checks.defaults,         step: 5, tab: null },
              ]).map(({ label, done, step, tab }) => (
                <TableRow key={label} rowKey={label}>
                  <TableCell><Text>{label}</Text></TableCell>
                  <TableCell><ObjectStatus state={done ? 'Positive' : 'Negative'}>{done ? 'Complete' : 'Incomplete'}</ObjectStatus></TableCell>
                  <TableCell><FlexBox justifyContent="End">{!done && <Button design="Transparent" onClick={() => tab ? onNavigateTo(tab) : setCurrentStep(step)}>{tab ? 'Open' : `Go to Step ${step}`}</Button>}</FlexBox></TableCell>
                </TableRow>
              ))}
            </Table>
          </Panel>
          <FlexBox justifyContent="End" style={{ gap: sp.s }}>
            <Button design="Default" onClick={() => { setSetupStatus('draft'); onSetupStatusChange('draft'); }}>Save as Draft</Button>
            {setupStatus === 'active' ? (
              <Button design="Emphasized" icon="action" onClick={() => setCurrentStep(7)}>Go to System Dashboard</Button>
            ) : (
              <Button design="Emphasized" icon="accept" disabled={!allChecksPass} onClick={activate}>Activate Setup</Button>
            )}
          </FlexBox>
        </FlexBox>
      );

      case 7: return (
        <FlexBox direction="Column" style={{ gap: sp.m }}>
          {setupStatus !== 'active' && <MessageStrip design="Warning" hideCloseButton>Setup is not yet active. Complete Step 6 and activate to enable planner access.</MessageStrip>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: sp.m }}>
            <Card header={<CardHeader titleText="Environment Status" avatar={<Icon name="world" />} />}>
              <FlexBox direction="Column" style={{ gap: sp.s, padding: sp.m }}>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>Setup status</Label><ObjectStatus state={setupStatus === 'active' ? 'Positive' : 'None'}>{setupStatus === 'active' ? 'Active' : setupStatus === 'draft' ? 'Draft' : 'Incomplete'}</ObjectStatus></FlexBox>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>Environment</Label><Text style={{ fontWeight: 600 }}>{conn.environment}</Text></FlexBox>
                {activatedAt && <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>Activated</Label><Text>{activatedAt}</Text></FlexBox>}
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>Updated by</Label><Text>H. Fischer (Admin)</Text></FlexBox>
              </FlexBox>
            </Card>
            <Card header={<CardHeader titleText="Connection Health" avatar={<Icon name="connected" />} />}>
              <FlexBox direction="Column" style={{ gap: sp.s, padding: sp.m }}>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>TM status</Label><ObjectStatus state={CONN_STATE[conn.status].state}>{CONN_STATE[conn.status].label}</ObjectStatus></FlexBox>
                {conn.lastTestedAt && <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>Last tested</Label><Text>{conn.lastTestedAt}</Text></FlexBox>}
                {conn.tmVersion && <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>TM version</Label><Text style={{ fontWeight: 600 }}>{conn.tmVersion}</Text></FlexBox>}
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>BTP destination</Label><Text>{conn.destinationName || '—'}</Text></FlexBox>
                <FlexBox style={{ gap: sp.s, marginTop: sp.xs }}>
                  <Button design="Default" icon="connected" onClick={testConnection}>Test</Button>
                  <Button design="Default" icon="edit" onClick={() => setCurrentStep(1)}>Edit</Button>
                </FlexBox>
              </FlexBox>
            </Card>
            <Card header={<CardHeader titleText="Metadata Sync" avatar={<Icon name="synchronize" />} />}>
              <FlexBox direction="Column" style={{ gap: sp.s, padding: sp.m }}>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>Last refresh</Label><Text>{discovery.lastRefreshedAt ?? '—'}</Text></FlexBox>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>Objects available</Label><Text style={{ fontWeight: 600 }}>{discovery.objects.filter(o => o.status === 'discovered' || o.status === 'partial').length} of {discovery.objects.length}</Text></FlexBox>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>Partial / failed</Label><ObjectStatus state={discovery.objects.some(o => o.status === 'partial') ? 'Critical' : 'Positive'}>{discovery.objects.filter(o => o.status === 'partial' || o.status === 'failed').length} item{discovery.objects.filter(o => o.status === 'partial' || o.status === 'failed').length !== 1 ? 's' : ''}</ObjectStatus></FlexBox>
                <FlexBox style={{ gap: sp.s, marginTop: sp.xs }}>
                  <Button design="Default" icon="refresh" onClick={runDiscovery}>Refresh</Button>
                  <Button design="Default" icon="detail-view" onClick={() => setCurrentStep(2)}>Details</Button>
                </FlexBox>
              </FlexBox>
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.m }}>
            <Card header={<CardHeader titleText="Rule and Profile Summary" avatar={<Icon name="official-service" />} />}>
              <FlexBox direction="Column" style={{ gap: sp.s, padding: sp.m }}>
                <Text style={{ ...sectionTitle, marginBottom: sp.xs }}>Rules</Text>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>Published</Label><ObjectStatus state="Positive">{publishedRuleCount}</ObjectStatus></FlexBox>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>Draft</Label><ObjectStatus state="None">{draftRuleCount}</ObjectStatus></FlexBox>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>Retired</Label><ObjectStatus state="None">{retiredRuleCount}</ObjectStatus></FlexBox>
                <Text style={{ ...sectionTitle, marginTop: sp.s, marginBottom: sp.xs }}>Rule Profiles</Text>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>Active</Label><ObjectStatus state="Positive">{ruleProfiles.filter(p => p.status === 'active').length}</ObjectStatus></FlexBox>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>Draft</Label><ObjectStatus state="None">{ruleProfiles.filter(p => p.status === 'draft').length}</ObjectStatus></FlexBox>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>Retired</Label><ObjectStatus state="None">{ruleProfiles.filter(p => p.status === 'retired').length}</ObjectStatus></FlexBox>
              </FlexBox>
            </Card>
            <Card header={<CardHeader titleText="Planning Runtime Settings" avatar={<Icon name="settings" />} />}>
              <FlexBox direction="Column" style={{ gap: sp.s, padding: sp.m }}>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>Planning horizon</Label><Text style={{ fontWeight: 600 }}>{defaults.planningHorizonDays} days</Text></FlexBox>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>Max eval runtime</Label><Text>{defaults.maxEvaluationRuntimeSeconds}s</Text></FlexBox>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>Idle timeout</Label><Text>{defaults.sessionIdleTimeoutMinutes} min</Text></FlexBox>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>Max packages</Label><Text>{defaults.maxRecommendationPackages}</Text></FlexBox>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>Save to TM</Label><ObjectStatus state={defaults.allowSaveToTM ? 'Positive' : 'None'}>{defaults.allowSaveToTM ? 'Enabled' : 'Disabled'}</ObjectStatus></FlexBox>
                <FlexBox alignItems="Center" justifyContent="SpaceBetween"><Label>Rule reorder</Label><ObjectStatus state={defaults.allowRuleReordering ? 'Positive' : 'None'}>{defaults.allowRuleReordering ? 'Enabled' : 'Disabled'}</ObjectStatus></FlexBox>
                <FlexBox style={{ marginTop: sp.xs }}><Button design="Default" icon="edit" onClick={() => setCurrentStep(5)}>Edit Defaults</Button></FlexBox>
              </FlexBox>
            </Card>
          </div>

          <Card header={<CardHeader titleText="Operational Health" avatar={<Icon name="stethoscope" />} />}>
            <Table headerRow={<TableHeaderRow>
              <TableHeaderCell width="35%"><Label>Service</Label></TableHeaderCell>
              <TableHeaderCell width="20%"><Label>Status</Label></TableHeaderCell>
              <TableHeaderCell width="45%"><Label>Detail</Label></TableHeaderCell>
            </TableHeaderRow>}>
              {HEALTH_SERVICES_MOCK.map(s => (
                <TableRow key={s.name} rowKey={s.name}>
                  <TableCell><Text style={{ fontWeight: 600 }}>{s.name}</Text></TableCell>
                  <TableCell><ObjectStatus state={HEALTH_STATE[s.status]}>{s.status.charAt(0).toUpperCase() + s.status.slice(1)}</ObjectStatus></TableCell>
                  <TableCell><Text style={{ fontSize: 'var(--sapFontSmallSize)' }}>{s.detail}</Text></TableCell>
                </TableRow>
              ))}
            </Table>
          </Card>

          <Panel headerText="Logs and Audit" accessibleRole="Region">
            <FlexBox wrap="Wrap" style={{ gap: sp.m, padding: sp.m }}>
              {['View application logs', 'View audit logs', 'View setup history'].map(link => (
                <Button key={link} design="Transparent" icon="document">{link}</Button>
              ))}
            </FlexBox>
          </Panel>
        </FlexBox>
      );

      default: return null;
    }
  };

  const currentStepMeta = STEPS[currentStep - 1];

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      <div style={{ width: 224, flexShrink: 0, borderRight: '1px solid var(--sapList_BorderColor)', background: 'var(--sapBaseColor)', overflowY: 'auto', padding: `${sp.m} 0` }}>
        <Text style={{ ...sectionTitle, display: 'block', padding: `0 ${sp.m} ${sp.s}` }}>System Setup</Text>
        {STEPS.map(s => {
          const isDash = s.n === 7;
          if (isDash && setupStatus !== 'active') return null;
          return (
            <button key={s.n} onClick={() => setCurrentStep(s.n)} style={{
              display: 'flex', alignItems: 'center', gap: sp.s,
              width: '100%', padding: `${sp.s} ${sp.m}`,
              border: 'none', background: currentStep === s.n ? 'var(--sapList_SelectionBackgroundColor, #e8f4ff)' : 'transparent',
              borderLeft: `3px solid ${currentStep === s.n ? 'var(--sapSelectedColor, #0070f2)' : 'transparent'}`,
              borderTop: isDash ? `1px solid var(--sapList_BorderColor)` : 'none',
              marginTop: isDash ? sp.s : 0,
              cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                background: isDash ? 'var(--sapSelectedColor, #0070f2)' : s.done ? 'var(--sapPositiveColor)' : currentStep === s.n ? 'var(--sapSelectedColor, #0070f2)' : 'var(--sapNeutralBackground, #e5e5e5)',
                color: isDash || s.done || currentStep === s.n ? '#fff' : 'var(--sapTextColor)',
              }}>
                {isDash ? 'D' : s.done ? 'v' : s.n}
              </div>
              <Text style={{ fontSize: 'var(--sapFontSmallSize)', fontWeight: currentStep === s.n ? 600 : 400, color: currentStep === s.n ? 'var(--sapSelectedColor, #0070f2)' : 'var(--sapTextColor)' }}>
                {s.label}
              </Text>
            </button>
          );
        })}
        {setupStatus === 'active' && (
          <div style={{ margin: sp.m, padding: sp.s, background: 'var(--sapSuccessBackground, #f0fdf4)', borderRadius: 4, borderLeft: `3px solid var(--sapPositiveColor)` }}>
            <Text style={{ fontSize: 'var(--sapFontSmallSize)', fontWeight: 700, color: 'var(--sapPositiveColor)' }}>Setup Active</Text>
            {activatedAt && <Text style={{ fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block' }}>{activatedAt}</Text>}
          </div>
        )}
      </div>

      <DynamicPage style={{ flex: 1, height: '100%' }}
        showFooter
        footerArea={
          <Bar design="Footer">
            <Text slot="startContent">
              {currentStep <= 6 ? `Step ${currentStep} of 6 — ${currentStepMeta.label}` : 'System Dashboard'}
            </Text>
            {currentStep > 1 && currentStep <= 6 && <Button slot="endContent" design="Default" icon="navigation-left-arrow" onClick={() => setCurrentStep(s => s - 1)}>Back</Button>}
            {currentStep < 6 && <Button slot="endContent" design="Emphasized" icon="navigation-right-arrow" iconEnd onClick={() => setCurrentStep(s => s + 1)}>Next</Button>}
          </Bar>
        }
        titleArea={
          <DynamicPageTitle
            heading={<Title>{currentStep === 7 ? 'System Dashboard' : currentStepMeta.label}</Title>}
            subheading={<Text>{currentStep <= 6 ? `Step ${currentStep} of 6` : setupStatus === 'active' ? 'Setup active — operational overview' : 'Activate setup to enable planner access'}</Text>}
            actionsBar={
              <Toolbar slot="actionsBar" design="Transparent">
                {currentStep <= 6 && <ObjectStatus state={currentStepMeta.done ? 'Positive' : 'None'}>{currentStepMeta.done ? 'Complete' : 'Incomplete'}</ObjectStatus>}
                {setupStatus === 'active' && currentStep === 7 && <ObjectStatus state="Positive">Active</ObjectStatus>}
              </Toolbar>
            }
          />
        }>
        <div style={{ padding: sp.m }}>
          {stepContent()}
        </div>
      </DynamicPage>
    </div>
  );
};

const View6Rules: React.FC<{ onBackToPlanning: () => void; role: AppRole; onSetupStatusChange: (s: SetupStatus) => void }> = ({ onBackToPlanning, role, onSetupStatusChange }) => {
  const [activeTab, setActiveTab] = useState<'creation' | 'review' | 'profiles' | 'context' | 'setup'>('creation');
  const [candidates, setCandidates] = useState<RuleCandidate[]>(INITIAL_CANDIDATES);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [reviewSelectedId, setReviewSelectedId] = useState<string | null>(null);
  const [reviewScope, setReviewScope] = useState<ReviewScope>('validation');
  const [ruleProfiles, setRuleProfiles] = useState<RuleProfileEntry[]>(INITIAL_RULE_PROFILES);
  const [globalContext, setGlobalContext] = useState<GlobalContextEntry[]>(INITIAL_GLOBAL_CONTEXT);
  const [validatingIds, setValidatingIds] = useState<Set<string>>(new Set());
  const [validationProgress, setValidationProgress] = useState<Record<string, number>>({});
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback((m: string) => { setToastMessage(m); setToastOpen(true); }, []);

  const updateCandidate = useCallback((id: string, patch: Record<string, unknown>) => {
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch, daysInStage: 0 } : c)));
  }, []);

  // Simulate backend validation running for submitted rules
  useEffect(() => {
    const submitted = candidates.filter(c => c.stage === 'submitted' && !validatingIds.has(c.id));
    if (submitted.length === 0) return;

    submitted.forEach(c => {
      setValidatingIds(prev => new Set([...prev, c.id]));
      setValidationProgress(prev => ({ ...prev, [c.id]: 0 }));

      // Animate progress 0→100 over ~2.5s
      let pct = 0;
      const ticker = setInterval(() => {
        pct = Math.min(100, pct + Math.random() * 15 + 8);
        setValidationProgress(prev => ({ ...prev, [c.id]: Math.floor(pct) }));
        if (pct >= 100) clearInterval(ticker);
      }, 250);

      // After 2.5s resolve with real results
      setTimeout(() => {
        clearInterval(ticker);
        // Determine outcome based on rule type — prefer supported for full-pass, detect-only for warnings
        const hasComplexMapping = c.mapping.tmEntities.length === 0;
        const resolvedStatus: ValidationStatus = hasComplexMapping
          ? (c.rule.type === 'hard-constraint' ? 'detect-only' : 'detect-only')
          : 'supported';
        const resolvedChecks: ValidationCheck[] = [
          { id: 'completeness',            label: VALIDATION_CHECK_LABELS['completeness'],            status: 'pass',    detail: 'All mandatory rule components present.' },
          { id: 'context-availability',    label: VALIDATION_CHECK_LABELS['context-availability'],    status: 'pass',    detail: 'Required context terms found in Global Context.' },
          { id: 'tm-data-availability',    label: VALIDATION_CHECK_LABELS['tm-data-availability'],    status: hasComplexMapping ? 'warning' : 'pass', detail: hasComplexMapping ? 'Some TM fields could not be mapped — manual confirmation needed.' : 'All required TM fields available.' },
          { id: 'api-action-availability', label: VALIDATION_CHECK_LABELS['api-action-availability'], status: hasComplexMapping ? 'warning' : 'pass', detail: hasComplexMapping ? 'Write API not confirmed — rule may be detect-only at runtime.' : 'Read and write APIs confirmed.' },
          { id: 'dependency-check',        label: VALIDATION_CHECK_LABELS['dependency-check'],        status: 'pass',    detail: 'No unresolved dependencies detected.' },
          { id: 'missing-parameters',      label: VALIDATION_CHECK_LABELS['missing-parameters'],      status: 'pass',    detail: 'All parameters extracted or defaulted.' },
        ];
        updateCandidate(c.id, {
          stage: 'validation',
          validationStatus: resolvedStatus,
          validationChecks: resolvedChecks,
        });
        setValidatingIds(prev => { const n = new Set(prev); n.delete(c.id); return n; });
        setValidationProgress(prev => { const n = { ...prev }; delete n[c.id]; return n; });
      }, 2500);
    });
  }, [candidates]); // eslint-disable-line react-hooks/exhaustive-deps

  const drafts = useMemo(() => candidates.filter((c) => c.stage === 'draft'), [candidates]);

  // Rule Creation handlers
  const handlePickDraft = useCallback((id: string) => setEditingDraftId(id), []);
  const handleClearForm = useCallback(() => setEditingDraftId(null), []);

  const handleSaveDraft = useCallback((id: string | null, fields: PlannerInputFormFields) => {
    if (id) {
      const existing = candidates.find((c) => c.id === id);
      if (existing) {
        updateCandidate(id, {
          stage: 'draft',
          plannerInput: { description: fields.description, businessReason: fields.businessReason, exampleScenario: fields.exampleScenario, attachedDocs: fields.attachedDocs, tags: fields.tags },
          rule: { ...existing.rule, name: fields.ruleName || existing.rule.name, type: fields.ruleType, group: fields.ruleGroup, priority: fields.priority },
          profile: { ...existing.profile, dc: fields.dc },
        });
      }
    } else {
      const newId = `RC-${100 + candidates.length + 1}`;
      const newProfile: ProfileHeader = { ...PROFILE_DESOUTH, id: `PRF-NEW-${newId}`, name: 'DE-South Standard (draft)', dc: fields.dc, status: 'draft' };
      const newCandidate: RuleCandidate = {
        id: newId, profile: newProfile,
        rule: { id: `R-NEW-${newId}`, name: fields.ruleName, type: fields.ruleType, group: fields.ruleGroup, scope: '', conditions: '', actions: '', parameters: [], exceptions: '', priority: fields.priority },
        dependencies: { dependsOn: [], mayConflictWith: [], overrideBehavior: '', sequenceRestrictions: [] },
        mapping: { tmEntities: [], apiEndpoints: [], fields: [], actions: [], llmConfidence: 'low', llmNotes: '' },
        validationChecks: allPendingChecks, validationStatus: 'pending', stage: 'draft',
        plannerInput: { description: fields.description, businessReason: fields.businessReason, exampleScenario: fields.exampleScenario, attachedDocs: fields.attachedDocs, tags: fields.tags },
        sourceDoc: 'BD27', sourceCitation: 'Intake form', sourceClause: '(Provided via Rule Creation form)',
        submittedBy: 'H. Fischer (FDE)', submittedDate: '2026-07-02', daysInStage: 0,
      };
      setCandidates((prev) => [newCandidate, ...prev]);
      setEditingDraftId(newId);
    }
    showToast('Draft saved');
  }, [candidates, updateCandidate, showToast]);

  const handleSubmitForValidation = useCallback((id: string | null, fields: PlannerInputFormFields) => {
    let submittedId: string;
    if (id) {
      const existing = candidates.find((c) => c.id === id);
      if (existing) {
        updateCandidate(id, {
          stage: 'submitted', validationStatus: 'pending',
          plannerInput: { description: fields.description, businessReason: fields.businessReason, exampleScenario: fields.exampleScenario, attachedDocs: fields.attachedDocs, tags: fields.tags },
          rule: { ...existing.rule, name: fields.ruleName || existing.rule.name, type: fields.ruleType, group: fields.ruleGroup, priority: fields.priority },
          profile: { ...existing.profile, dc: fields.dc },
        });
      }
      submittedId = id;
    } else {
      const newId = `RC-${100 + candidates.length + 1}`;
      const newProfile: ProfileHeader = { ...PROFILE_DESOUTH, id: `PRF-NEW-${newId}`, name: 'DE-South Standard (new)', dc: fields.dc, status: 'draft' };
      const newCandidate: RuleCandidate = {
        id: newId, profile: newProfile,
        rule: { id: `R-NEW-${newId}`, name: fields.ruleName, type: fields.ruleType, group: fields.ruleGroup, scope: '', conditions: '', actions: '', parameters: [], exceptions: '', priority: fields.priority },
        dependencies: { dependsOn: [], mayConflictWith: [], overrideBehavior: '', sequenceRestrictions: [] },
        mapping: { tmEntities: [], apiEndpoints: [], fields: [], actions: [], llmConfidence: 'low', llmNotes: 'Awaiting backend validation.' },
        validationChecks: allPendingChecks, validationStatus: 'pending', stage: 'submitted',
        plannerInput: { description: fields.description, businessReason: fields.businessReason, exampleScenario: fields.exampleScenario, attachedDocs: fields.attachedDocs, tags: fields.tags },
        sourceDoc: 'BD27', sourceCitation: 'Intake form', sourceClause: '(Provided via Rule Creation form)',
        submittedBy: 'H. Fischer (FDE)', submittedDate: '2026-07-02', daysInStage: 0,
      };
      setCandidates((prev) => [newCandidate, ...prev]);
      submittedId = newId;
    }
    showToast(`${fields.ruleName || 'Rule'} submitted for validation — check Validation Queue.`);
    setEditingDraftId(null);
    setReviewSelectedId(submittedId);
    setReviewScope('validation');
    setActiveTab('review');
  }, [candidates, updateCandidate, showToast]);

  // Validation / Approval handlers
  const handleReviewSelect = useCallback((id: string) => setReviewSelectedId(id), []);
  const handleCloseReviewDetail = useCallback(() => setReviewSelectedId(null), []);

  const handleMarkReadyForApproval = useCallback((id: string) => {
    const cand = candidates.find(c => c.id === id);
    if (cand && cand.validationStatus === 'detect-only' && cand.rule.type === 'hard-constraint') {
      showToast('Detect-only + Hard Constraint cannot move to Approval — send back for revision or reject.');
      return;
    }
    updateCandidate(id, { stage: 'approval' });
    showToast('Moved to Approval Queue');
    setReviewScope('approval');
  }, [candidates, updateCandidate, showToast]);

  const handleSendBackToCreation = useCallback((id: string) => {
    updateCandidate(id, { stage: 'draft', validationStatus: 'pending' });
    showToast('Sent back to Rule Creation as draft — edit and resubmit when ready.');
    setReviewSelectedId(null);
    setEditingDraftId(id);
    setActiveTab('creation');
  }, [updateCandidate, showToast]);

  const handleReevaluate = useCallback((id: string) => {
    const cand = candidates.find((c) => c.id === id);
    updateCandidate(id, {
      stage: 'draft', validationStatus: 'pending',
      retiredReason: undefined,
      validationChecks: cand?.validationChecks.map((t) => ({ ...t, status: 'pending' as ValidationCheck['status'] })) ?? [],
    });
    showToast('Re-opened as draft — edit and resubmit for validation');
    setEditingDraftId(id);
    setActiveTab('creation');
  }, [candidates, updateCandidate, showToast]);

  const handleApprove = useCallback((id: string, note: string) => {
    updateCandidate(id, {
      stage: 'published',
      approvedBy: 'H. Fischer (FDE)',
      approvedDate: '2026-07-02',
    });
    showToast(`Rule approved and published to Rule Library.${note ? ' Note saved.' : ''}`);
    setReviewScope('library');
  }, [updateCandidate, showToast]);

  const handleSendBackFromApproval = useCallback((id: string, note: string) => {
    updateCandidate(id, { stage: 'draft', validationStatus: 'pending' });
    showToast(`Sent back to draft.${note ? ' Note saved.' : ''}`);
    setReviewSelectedId(null);
    setEditingDraftId(id);
    setActiveTab('creation');
  }, [updateCandidate, showToast]);

  const handleReject = useCallback((id: string, note: string) => {
    updateCandidate(id, { stage: 'rejected', rejectedReason: note || 'Rejected by admin' });
    showToast('Rule rejected');
    setReviewScope('library');
  }, [updateCandidate, showToast]);

  const handleRetire = useCallback((id: string, reason: string) => {
    updateCandidate(id, { stage: 'retired', retiredReason: reason || 'Retired by admin' });
    showToast('Rule retired — removed from planner selection. Historical sessions unaffected.');
    setReviewScope('library');
  }, [updateCandidate, showToast]);

  // Rule Profile handlers
  const handleProfileAdd = useCallback(() => {
    const newId = `RP-${String(ruleProfiles.length + 1).padStart(3, '0')}`;
    const newProfile: RuleProfileEntry = {
      id: newId, name: 'New Profile (draft)', description: '', dc: 'DC-BD27',
      owner: 'H. Fischer (FDE)', effectiveStart: '2026-07-01', effectiveEnd: '2026-12-31',
      status: 'draft', version: 'v1.0-draft', ruleIds: [], createdDate: '2026-07-02',
    };
    setRuleProfiles(prev => [newProfile, ...prev]);
    showToast(`${newId} created as draft`);
  }, [ruleProfiles, showToast]);

  const handleProfileEdit = useCallback((id: string) => {
    showToast(`Editing ${id} — in a full implementation this opens an edit form`);
  }, [showToast]);

  const handleProfilePublish = useCallback((id: string) => {
    setRuleProfiles(prev => prev.map(p => p.id === id ? { ...p, status: 'active' as ProfileStatus, publishedDate: '2026-07-02' } : p));
    showToast(`Profile ${id} published — now visible to planners`);
  }, [showToast]);

  const handleProfileRetire = useCallback((id: string) => {
    setRuleProfiles(prev => prev.map(p => p.id === id ? { ...p, status: 'retired' as ProfileStatus } : p));
    showToast(`Profile ${id} retired — hidden from planner selection. Historical sessions unaffected.`);
  }, [showToast]);

  const handleProfileDelete = useCallback((id: string) => {
    setRuleProfiles(prev => prev.filter(p => p.id !== id));
    showToast(`Draft profile ${id} deleted`);
  }, [showToast]);

  // Global context handlers
  const handleContextAdd = useCallback(() => {
    const newId = `GC-${String(globalContext.length + 1).padStart(3, '0')}`;
    const newEntry: GlobalContextEntry = {
      id: newId, term: 'New term', definition: 'Enter definition', tmMapping: '',
      scope: 'All DCs', contextType: 'other', status: 'active',
    };
    setGlobalContext(prev => [newEntry, ...prev]);
    showToast(`${newId} created`);
  }, [globalContext, showToast]);

  const handleContextToggle = useCallback((id: string) => {
    setGlobalContext(prev => prev.map(e => e.id === id
      ? { ...e, status: e.status === 'active' ? 'inactive' as const : 'active' as const }
      : e
    ));
    const entry = globalContext.find(e => e.id === id);
    showToast(entry?.status === 'active' ? `${entry.term} deactivated` : `${entry?.term} reactivated`);
  }, [globalContext, showToast]);

  const reviewSelected = reviewSelectedId ? candidates.find((c) => c.id === reviewSelectedId) ?? null : null;
  const hasReviewDetail = reviewSelected !== null;
  const approvalCount = candidates.filter((c) => c.stage === 'approval').length;
  const validationCount = candidates.filter((c) => c.stage === 'submitted' || c.stage === 'validation').length;

  return (
    <FlexBox direction="Column" style={{ height: '100%', margin: `-${sp.l}` }}>
      <PageTitle
        title="Rule Maintenance"
        subtitle="Admin — create, validate, approve rules and manage Rule Profiles. Planners cannot access this area."
        trailing={
          <Button design="Transparent" icon="nav-back" onClick={onBackToPlanning}>
            Back to planning
          </Button>
        }
      />

      <TabContainer
        collapsed={false}
        onTabSelect={(e) => {
          const sel = (e.detail as { tab?: { getAttribute?: (n: string) => string | null } }).tab?.getAttribute?.('data-key');
          if (sel === 'creation' || sel === 'review' || sel === 'profiles' || sel === 'context' || sel === 'setup') {
            setActiveTab(sel);
          }
        }}
      >
        <Tab text="Rule Creation" data-key="creation" selected={activeTab === 'creation'} />
        <Tab
          text={`Validation & Approval${validationCount + approvalCount > 0 ? ` (${validationCount + approvalCount})` : ''}`}
          data-key="review"
          selected={activeTab === 'review'}
        />
        <Tab text="Rule Profiles" data-key="profiles" selected={activeTab === 'profiles'} />
        <Tab text="Global Context" data-key="context" selected={activeTab === 'context'} />
        {role === 'admin' && <Tab text="System Setup" data-key="setup" selected={activeTab === 'setup'} />}
      </TabContainer>

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', background: 'var(--sapBackgroundColor)' }}>
        {activeTab === 'creation' ? (
          <V6RuleCreation
            key={editingDraftId ?? '__new__'}
            drafts={drafts}
            allCandidates={candidates}
            globalContext={globalContext}
            editingId={editingDraftId}
            onPickDraft={handlePickDraft}
            onClearForm={handleClearForm}
            onSaveDraft={handleSaveDraft}
            onSubmitForValidation={handleSubmitForValidation}
          />
        ) : activeTab === 'profiles' ? (
          <V6RuleProfiles
            profiles={ruleProfiles}
            candidates={candidates}
            onAdd={() => {}}
            onEdit={() => {}}
            onPublish={handleProfilePublish}
            onRetire={handleProfileRetire}
            onDelete={handleProfileDelete}
            onSaveProfile={(updated) => {
              setRuleProfiles(prev => {
                const exists = prev.find(p => p.id === updated.id);
                if (exists) return prev.map(p => p.id === updated.id ? updated : p);
                return [updated, ...prev];
              });
              showToast(`Profile "${updated.name}" saved as draft.`);
            }}
          />
        ) : activeTab === 'context' ? (
          <V6GlobalContext
            entries={globalContext}
            candidates={candidates}
            onAdd={() => {}}
            onToggleStatus={handleContextToggle}
            onSaveEntry={(entry) => {
              setGlobalContext(prev => {
                const exists = prev.find(e => e.id === entry.id);
                if (exists) return prev.map(e => e.id === entry.id ? entry : e);
                return [entry, ...prev];
              });
              showToast(`"${entry.term}" saved to Global Context.`);
            }}
          />
        ) : activeTab === 'setup' ? (
          <V6SystemSetup
            globalContext={globalContext}
            ruleProfiles={ruleProfiles}
            candidates={candidates}
            onNavigateTo={(tab) => setActiveTab(tab as typeof activeTab)}
            onSetupStatusChange={onSetupStatusChange}
          />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: hasReviewDetail ? 'minmax(380px, 35%) 1fr' : '1fr',
            height: '100%',
            minHeight: 0,
          }}>
            <div style={{
              minHeight: 0,
              overflow: 'hidden',
              borderRight: hasReviewDetail ? '1px solid var(--sapList_BorderColor, #e5e5e5)' : 'none',
            }}>
              <V6ReviewList
                candidates={candidates}
                selectedId={reviewSelectedId}
                scope={reviewScope}
                validatingIds={validatingIds}
                validationProgress={validationProgress}
                onScopeChange={setReviewScope}
                onSelect={handleReviewSelect}
              />
            </div>
            {hasReviewDetail && (
              <div style={{ minHeight: 0, overflow: 'hidden' }}>
                <V6ReviewDetail
                  candidate={reviewSelected}
                  validatingIds={validatingIds}
                  validationProgress={validationProgress}
                  onCloseDetail={handleCloseReviewDetail}
                  onMarkReadyForApproval={handleMarkReadyForApproval}
                  onSendBackToCreation={handleSendBackToCreation}
                  onReevaluate={handleReevaluate}
                  onApprove={handleApprove}
                  onSendBackFromApproval={handleSendBackFromApproval}
                  onReject={handleReject}
                  onRetire={handleRetire}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <Toast open={toastOpen} duration={3000} placement="BottomCenter" onClose={() => setToastOpen(false)}>
        {toastMessage}
      </Toast>
    </FlexBox>
  );
};
// ============================================================================
// Planner-flow step order — used to compute which sidebar steps are unlocked.
// A step is enabled if it has been visited, or if it is the immediate next step
// after the furthest visited one. Rule Maintenance lives outside this linear flow.
const STEP_ORDER: ViewKey[] = ['session-start', 'overview', 'rule-evaluation', 'review', 'changes'];

const AldiTMRefinementPage: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({ loggedIn: false, name: '', initials: '', colorScheme: 'Accent6', role: 'planner' });
  const [setupStatus, setSetupStatus] = useState<SetupStatus>('incomplete');
  const [active, setActive] = useState<ViewKey>('session-start');
  // Strict linear unlock: only the primary CTA on each step advances to the next.
  // 0 = only Session Start accessible; 1 = Planning Overview unlocked; etc.
  const [unlockedUpTo, setUnlockedUpTo] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const unlock = useCallback((stepIdx: number) => {
    setUnlockedUpTo(prev => Math.max(prev, stepIdx));
  }, []);

  const advanceTo = useCallback((key: ViewKey) => {
    const idx = STEP_ORDER.indexOf(key);
    if (idx !== -1) unlock(idx);
    setActive(key);
  }, [unlock]);

  const furthestIdx = unlockedUpTo;

  const navItems: NavItem[] = useMemo(
    () => VIEWS.map((v) => {
      const stepIdx = STEP_ORDER.indexOf(v.key);
      // A step is accessible if its index is ≤ unlockedUpTo (explicitly completed predecessor)
      const isUnlocked = stepIdx <= unlockedUpTo;
      const disabledByCompletion = sessionCompleted && v.key !== 'session-start';
      return {
        kind: 'leaf' as const,
        key: v.key,
        label: v.label,
        disabled: !isUnlocked || disabledByCompletion,
      };
    }),
    [unlockedUpTo, sessionCompleted],
  );

  // Guarded navigation — only unlocked steps are reachable.
  const navigate = useCallback(
    (key: ViewKey) => {
      if (key === 'rules') {
        if (authState.role === 'admin') setActive('rules');
        return;
      }
      if (sessionCompleted && key !== 'session-start') return;
      const stepIdx = STEP_ORDER.indexOf(key);
      if (stepIdx === -1) return;
      if (stepIdx <= unlockedUpTo) {
        setActive(key);
      }
    },
    [unlockedUpTo, sessionCompleted],
  );

  // After a successful Save to TM, reset unlock state so all steps except Session Start
  // lock again. The View4Changes component unmounts when active changes — fresh session.
  // fresh session in every sense.
  const handleStartNewSession = useCallback(() => {
    setUnlockedUpTo(0);
    setSessionCompleted(false);
    setActive('session-start');
  }, []);

  if (!authState.loggedIn) {
    return <LoginScreen onLogin={(user) => setAuthState(user)} />;
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--sapBackgroundColor)',
        overflow: 'hidden',
      }}
    >
      <ShellBar
        primaryTitle="TM Planning Refinement"
        secondaryTitle={(() => {
          if (active === 'rules') return RULES_VIEW_META.label;
          const view = VIEWS.find((v) => v.key === active);
          return view ? view.label.replace(/^\d+\.\s*/, '') : '';
        })()}
        logo={<img src={`${import.meta.env.BASE_URL}sap-logo.svg`} alt="SAP" />}
        profile={<Avatar initials={authState.initials} colorScheme={authState.colorScheme as any} size="XS" />}
      >
        <ShellBarItem icon="sys-help" text="Help" />
        <ShellBarItem icon="log" text={`Sign out (${authState.name})`}
          onClick={() => { setAuthState({ loggedIn: false, name: '', initials: '', colorScheme: 'Accent6', role: 'planner' }); setActive('session-start'); }} />
      </ShellBar>

      {/* Sub-header: planning context + admin entry point */}
      <div
        style={{
          background: 'var(--sapObjectHeader_Background, #fff)',
          borderBottom: '1px solid var(--sapList_BorderColor)',
          padding: `${sp.s} ${sp.l}`,
        }}
      >
        <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ flexWrap: 'wrap', gap: sp.s }}>
          <FlexBox alignItems="Center" style={{ gap: sp.m, flexWrap: 'wrap' }}>
            <div>
              <Title level="H5" style={{ marginBottom: '2px' }}>
                {TM_PROFILE}
              </Title>
              <Text style={labelText}>
                {authState.name} · {SESSION_ID} · Rule Profile: <strong>{RULE_PROFILE}</strong>
              </Text>
            </div>
            <Tag colorScheme={authState.role === 'admin' ? '2' : '6'} style={{ textTransform: 'capitalize' }}>
              {authState.role}
            </Tag>
          </FlexBox>
          {authState.role === 'admin' && (
            <Button
              design={active === 'rules' ? 'Emphasized' : 'Transparent'}
              icon="settings"
              onClick={() => setActive('rules')}
            >
              Rule maintenance
            </Button>
          )}
        </FlexBox>
      </div>

      {/* Body: SideNav + Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {active !== 'rules' && (
          <div
            style={{
              width: 256,
              flexShrink: 0,
              height: '100%',
              overflowY: 'auto',
              borderRight: '1px solid var(--sapList_BorderColor)',
              background: 'var(--sapBaseColor)',
            }}
          >
            <SideNavigation
              items={navItems}
              selectedKey={active}
              onSelect={(key) => navigate(key as ViewKey)}
            />
          </div>
        )}

        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {active === 'session-start' || active === 'changes' || active === 'overview' || active === 'rule-evaluation' || active === 'review' || active === 'rules' ? (
            // Full-bleed views: header band + sticky footer; manage own scroll
            <div style={{ flex: 1, minHeight: 0, padding: sp.l }}>
              {active === 'session-start' && <View1SessionStart onSessionLoaded={() => advanceTo('overview')} setupStatus={setupStatus} />}
              {active === 'overview' && <View2Overview onProceed={() => advanceTo('rule-evaluation')} />}
              {active === 'rule-evaluation' && <View3RuleEvaluation onStartReview={() => advanceTo('review')} />}
              {active === 'review' && <View3RecommendationReview onProceedToChanges={() => advanceTo('changes')} />}
              {active === 'changes' && <View4Changes onStartNewSession={handleStartNewSession} onSessionSaved={() => setSessionCompleted(true)} />}
              {/* View5Audit parked for Phase 0 / MVP 1 — spec at design-docs/audit-traceability-spec.md */}
              {active === 'rules' && <View6Rules onBackToPlanning={() => setActive('session-start')} role={authState.role} onSetupStatusChange={setSetupStatus} />}
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', padding: sp.l }}>
              {/* All views are now full-bleed */}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// DIAGNOSTIC: ErrorBoundary wrapper
class DebugBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null; info: React.ErrorInfo | null }
> {
  state = { error: null as Error | null, info: null as React.ErrorInfo | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[AldiTM] render error:', error, info);
    this.setState({ error, info });
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'ui-monospace, Menlo, monospace', background: '#fff', minHeight: '100vh' }}>
          <h2 style={{ color: '#cc0000' }}>AldiTM render error</h2>
          <pre style={{ background: '#fff5f5', border: '1px solid #fcc', padding: 12, whiteSpace: 'pre-wrap', fontSize: 13 }}>
            {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
          </pre>
          {this.state.info && (
            <pre style={{ background: '#f7f7f7', border: '1px solid #ddd', padding: 12, whiteSpace: 'pre-wrap', fontSize: 12, marginTop: 12 }}>
              {this.state.info.componentStack}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

const AldiTMRefinementPageWithBoundary: React.FC = () => (
  <DebugBoundary>
    <AldiTMRefinementPage />
  </DebugBoundary>
);

export default AldiTMRefinementPageWithBoundary;
