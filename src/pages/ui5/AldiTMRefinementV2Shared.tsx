// AldiTMRefinementV2Shared.tsx
// Shared types, tokens, mock data, and primitive components for the V2 demo.
// Imported by AldiTMRefinementV2Planner.tsx and AldiTMRefinementV2Page.tsx.

import React from 'react';
import {
  Text, Title, Tag, Button, Icon, ObjectStatus, FlexBox, Avatar,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-react/styles.css';
import '@ui5/webcomponents-icons/dist/AllIcons.js';
import '@ui5/webcomponents-fiori/dist/illustrations/AllIllustrations.js';

// ─── Design tokens ────────────────────────────────────────────────────────────
export const sp = {
  xs: 'var(--sapSpacingXSmallSize, 0.25rem)',
  s:  'var(--sapSpacingSmallSize, 0.5rem)',
  m:  'var(--sapSpacingMediumSize, 1rem)',
  l:  'var(--sapSpacingLargeSize, 2rem)',
  g:  'var(--sapContent_GridGutter, 1rem)',
};

export const cardSurface: React.CSSProperties = {
  borderRadius: 'var(--sapTile_BorderCornerRadius, 12px)',
  boxShadow: 'var(--sapContent_Shadow0)',
  background: 'var(--sapTile_Background)',
  border: '1px solid var(--sapTile_BorderColor)',
};

export const labelText: React.CSSProperties = {
  fontFamily: 'var(--sapFontFamily)',
  fontSize: 'var(--sapFontSmallSize)',
  color: 'var(--sapContent_LabelColor)',
};

export const bodyText: React.CSSProperties = {
  fontFamily: 'var(--sapFontFamily)',
  fontSize: 'var(--sapFontSize)',
  color: 'var(--sapTextColor)',
};

export const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--sapFontFamily)',
  fontSize: 'var(--sapFontSmallSize)',
  fontWeight: 'var(--sapFontBoldWeight, 700)',
  color: 'var(--sapContent_LabelColor)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

// ─── PageTitle atom ───────────────────────────────────────────────────────────
interface PageTitleProps { title: string; subtitle?: string; trailing?: React.ReactNode; }
export const PageTitle: React.FC<PageTitleProps> = ({ title, subtitle, trailing }) => (
  <div style={{ background: 'var(--sapObjectHeader_Background,#fff)', borderBottom: '1px solid var(--sapList_BorderColor)', padding: `${sp.m} ${sp.l}` }}>
    <FlexBox alignItems="Start" justifyContent="SpaceBetween" style={{ gap: sp.m, flexWrap: 'wrap' }}>
      <div>
        <Title level="H2" style={{ fontWeight: 700 }}>{title}</Title>
        {subtitle && <Text style={{ ...labelText, display: 'block', marginTop: sp.xs }}>{subtitle}</Text>}
      </div>
      {trailing && <FlexBox alignItems="Center" style={{ gap: sp.s, flexWrap: 'wrap' }}>{trailing}</FlexBox>}
    </FlexBox>
  </div>
);

// ─── Auth types ───────────────────────────────────────────────────────────────
export type AppRole = 'planner' | 'admin';
export type SetupStatus = 'incomplete' | 'draft' | 'active';

export interface AuthState {
  loggedIn: boolean;
  name: string;
  initials: string;
  colorScheme: string;
  role: AppRole;
}

export const MOCK_USERS: Array<AuthState & { loggedIn: true }> = [
  { loggedIn: true, name: 'M. Schmidt', initials: 'MS', colorScheme: 'Accent6', role: 'planner' },
  { loggedIn: true, name: 'H. Fischer', initials: 'HF', colorScheme: 'Accent2', role: 'admin' },
];

// ─── Login screen ─────────────────────────────────────────────────────────────
export const LoginScreen: React.FC<{ onLogin: (u: AuthState) => void }> = ({ onLogin }) => {
  const [sel, setSel] = React.useState(0);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--sapBackgroundColor)' }}>
      <div style={{ width: 420, padding: '40px 48px', background: 'var(--sapTile_Background,#fff)', border: '1px solid var(--sapTile_BorderColor)', borderRadius: 'var(--sapTile_BorderCornerRadius,12px)', boxShadow: 'var(--sapContent_Shadow1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: sp.m }}>
        <img src={`${import.meta.env.BASE_URL}sap-logo.svg`} alt="SAP" style={{ height: 32, marginBottom: sp.xs }} />
        <div style={{ textAlign: 'center' }}>
          <Title level="H3" style={{ marginBottom: sp.xs }}>TM Planning Refinement</Title>
          <Text style={{ ...labelText, display: 'block' }}>ALDI Süd · Phase 0 Demo</Text>
        </div>
        <div style={{ width: '100%', borderTop: '1px solid var(--sapList_BorderColor)', paddingTop: sp.m }}>
          <Text style={{ ...labelText, display: 'block', marginBottom: sp.s }}>Sign in as</Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.s }}>
            {MOCK_USERS.map((u, i) => (
              <div key={i} onClick={() => setSel(i)} style={{ display: 'flex', alignItems: 'center', gap: sp.m, padding: `${sp.s} ${sp.m}`, border: `2px solid ${sel === i ? 'var(--sapSelectedColor,#0070f2)' : 'var(--sapField_BorderColor)'}`, borderRadius: 'var(--sapElement_BorderCornerRadius,4px)', background: sel === i ? 'var(--sapList_SelectionBackgroundColor,#e8f4ff)' : 'transparent', cursor: 'pointer' }}>
                <Avatar initials={u.initials} colorScheme={u.colorScheme as any} size="S" />
                <div>
                  <Text style={{ fontWeight: 600, display: 'block' }}>{u.name}</Text>
                  <Text style={labelText}>{u.role === 'admin' ? 'Rule Creator — Rule Maintenance + System Setup' : 'Planner — Planning sessions only'}</Text>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Button design="Emphasized" style={{ width: '100%', marginTop: sp.xs }} onClick={() => onLogin(MOCK_USERS[sel])}>Sign in</Button>
        <Text style={{ ...labelText, fontSize: 'var(--sapFontSmallSize)', textAlign: 'center', opacity: 0.7 }}>Demo mode — no real authentication.</Text>
      </div>
    </div>
  );
};

// ─── Planner domain types ─────────────────────────────────────────────────────
export type PackageState = 'pending' | 'ready' | 'evaluating' | 'nosol' | 'stale' | 'accepted' | 'rejected' | 'discarded';
export type RuleId = 'R-001' | 'R-002' | 'R-003' | 'R-004' | 'R-007';
export type ObjectKind = 'FO' | 'FU' | 'Stop' | 'Resource';

export interface AffectedObject { kind: ObjectKind; id: string; change: string; }

export interface RecPackage {
  id: string; title: string; ruleIds: RuleId[]; ruleLabel: string;
  state: PackageState; staleCause?: { byPackageId: string; reason: string };
  nosolReason?: string; whyText: string; affected: AffectedObject[];
  before: string[]; after: string[]; actions: string[];
  validation: { check: string; passed: boolean }[];
  dependsOnObjects?: string[];
}

export const RULE_LABELS: Record<RuleId, string> = {
  'R-001': 'One-Stop Night Stores (BD27)',
  'R-002': 'Capacity tolerance ±5% — redistribute excess',
  'R-003': 'Sunday / holiday delivery ban (BD09)',
  'R-004': 'MilkRun only if CHL non-PTZ > 300 PAL',
  'R-007': 'No routing ST-B202 → ST-B218 or ST-B218 → ST-B233',
};

export const INITIAL_PACKAGES: RecPackage[] = [
  { id: 'PKG-001', title: 'Redistribute excess: FO-014 to FO-018 (BD20)', ruleIds: ['R-002'], ruleLabel: RULE_LABELS['R-002'], state: 'accepted', whyText: 'FO-014 (80000000013) at 103.4% utilization on EBE_ALDI_01_DAY_37P. FO-018 (80000000017) serves DC-BD20 at 73.0%. Redistributing 1.1 PAL resolves over-capacity. Distance saving: 10.3 km.', affected: [{ kind: 'FO', id: '80000000013', change: '31.71 to 30.61 PAL, 103.4% to 99.8%' }, { kind: 'FO', id: '80000000017', change: '15.95 to 17.05 PAL, 73.0% to 76.5%' }], before: ['FO-014 (80000000013) 31.71 PAL 103.4% util, stops: ST-BN37 ST-BN22 ST-BN23', 'FO-018 (80000000017) 15.95 PAL 73.0% util, stops: ST-BN23 ST-BN40'], after: ['FO-014 30.61 PAL 99.8% util', 'FO-018 17.05 PAL 76.5% util'], actions: ['Reassign 1.1 PAL from 80000000013 to 80000000017', 'Update load plan for both FOs', 'Recompute utilization and route cost'], validation: [{ check: 'Target FO capacity within +/-5% after transfer', passed: true }, { check: 'Same DC (BD20)', passed: true }] },
  { id: 'PKG-002', title: 'Redistribute excess: FO-016 to FO-015 (BD42)', ruleIds: ['R-002'], ruleLabel: RULE_LABELS['R-002'], state: 'accepted', whyText: 'FO-016 (80000000015) at 104.3% utilization on EBE_ALDI_31_DUMMY_33P_FRZ. FO-015 (80000000014) serves DC-BD42 at 78.3%. Redistributing 0.9 PAL resolves over-capacity. Distance saving: 6.2 km.', affected: [{ kind: 'FO', id: '80000000015', change: '20.95 to 20.05 PAL, 104.3% to 100.8%' }, { kind: 'FO', id: '80000000014', change: '15.08 to 15.98 PAL, 78.3% to 82.8%' }], before: ['FO-016 (80000000015) 20.95 PAL 104.3% util, stops: ST-BN43 ST-BN04 ST-BN45', 'FO-015 (80000000014) 15.08 PAL 78.3% util, stop: ST-BN54'], after: ['FO-016 20.05 PAL 100.8% util', 'FO-015 15.98 PAL 82.8% util'], actions: ['Reassign 0.9 PAL from 80000000015 to 80000000014', 'Update load plan for both FOs', 'Recompute utilization'], validation: [{ check: 'Target FO capacity within +/-5% after transfer', passed: true }, { check: 'Same DC (BD42)', passed: true }] },
  { id: 'PKG-003', title: 'One-Stop Night violation: FO-020 duplicates ST-BN06 with FO-003', ruleIds: ['R-001'], ruleLabel: RULE_LABELS['R-001'], state: 'ready', whyText: 'FO-003 (80000000002) is the designated night FO for ST-BN06 (ST-B206, one-stop night store). FO-020 (80000000019) also includes ST-BN06 as a second stop on the same night shift, violating the one-stop night rule. Duplicate stop must be removed from FO-020.', affected: [{ kind: 'FO', id: '80000000019', change: 'Remove stop ST-BN06, 2 stops to 1 stop' }, { kind: 'Stop', id: 'ST-BN06', change: 'Retained on FO-003 only' }], before: ['FO-003 (80000000002) 1 stop ST-BN06 night 34.35 PAL', 'FO-020 (80000000019) 2 stops ST-BN26 ST-BN06 26.17 PAL'], after: ['FO-003 1 stop ST-BN06 night 34.35 PAL', 'FO-020 1 stop ST-BN26 only'], actions: ['Remove stop ST-BN06 from FO-020 (80000000019)', 'Reassign ST-BN06 freight units to FO-003 (80000000002)', 'Recompute route and cost for FO-020'], validation: [{ check: 'ST-BN06 served by exactly one night FO', passed: true }, { check: 'FO-003 capacity sufficient', passed: true }], dependsOnObjects: ['80000000002', '80000000019'] },
  { id: 'PKG-004', title: 'Routing restriction: ST-BN23 handover violates ST-B202/B218 rule', ruleIds: ['R-007'], ruleLabel: RULE_LABELS['R-007'], state: 'ready', whyText: 'FO-018 (80000000017) routes ST-BN23 to ST-BN40. ST-BN23 maps to ST-B218. BD27 SOP prohibits ST-B202 to ST-B218 routing. FO-014 (80000000013) ends at ST-BN22 to ST-BN23 creating the prohibited handover sequence. FO-018 must be re-sequenced to start at ST-BN40 directly.', affected: [{ kind: 'FO', id: '80000000017', change: 'Remove ST-BN23, start at ST-BN40' }, { kind: 'Stop', id: 'ST-BN23', change: 'Merged into FO-014' }], before: ['FO-018 (80000000017) 2 stops ST-BN23 ST-BN40 72.98% util', 'FO-014 (80000000013) 3 stops ends at ST-BN23'], after: ['FO-018 1 stop ST-BN40 only 65.2% util', 'FO-014 3 stops unchanged'], actions: ['Remove ST-BN23 from FO-018 stop sequence', 'Reassign ST-BN23 freight units to FO-014', 'Recompute route distance for FO-018'], validation: [{ check: 'Prohibited routing sequence removed', passed: true }, { check: 'FO-014 capacity check for extra freight units', passed: false }] },
  { id: 'PKG-005', title: 'MilkRun: CHL non-PTZ volume 284 PAL below 300 PAL threshold', ruleIds: ['R-004'], ruleLabel: RULE_LABELS['R-004'], state: 'ready', whyText: 'Session CHL non-PTZ volume for DC-BD27 is 284 PAL, below the 300 PAL threshold. FO-006 and FO-013 are currently routed as MilkRun tours. Per BD27 SOP, MilkRun is not permitted below 300 PAL. Both FOs must be converted to point-to-point routing.', affected: [{ kind: 'FO', id: '80000000005', change: 'MilkRun to point-to-point' }, { kind: 'FO', id: '80000000012', change: 'MilkRun to point-to-point' }], before: ['FO-006 (80000000005) MilkRun ST-BN27 ST-BN35 90.08%', 'FO-013 (80000000012) MilkRun ST-BN32 73.90%'], after: ['FO-006 Point-to-point ST-BN27 ST-BN35 90.08%', 'FO-013 Point-to-point ST-BN32 73.90%'], actions: ['Set routing type Point-to-point on FO-006', 'Set routing type Point-to-point on FO-013', 'Recompute route cost for both FOs'], validation: [{ check: 'CHL non-PTZ volume below 300 PAL confirmed', passed: true }, { check: 'Routing type update API available', passed: true }] },
  { id: 'PKG-006', title: 'No solution: FO-009 over-capacity, no admissible target in BD20', ruleIds: ['R-002'], ruleLabel: RULE_LABELS['R-002'], state: 'nosol', nosolReason: 'FO-009 (80000000008) at 97.99% utilization. After PKG-001 and PKG-002, all same-DC same-day FOs in BD20 are at or above 95%. No admissible redistribution target.', whyText: 'Rule R-002 evaluated FO-009 post-PKG-001/PKG-002. All potential targets in DC-BD20 exhausted. Manual review required.', affected: [{ kind: 'FO', id: '80000000008', change: 'No admissible target, remains at 97.99%' }], before: [], after: [], actions: [], validation: [] },
];

// ─── Session constants ────────────────────────────────────────────────────────
export const TM_PROFILE   = 'ALDI-DE-South-Daily';
export const SESSION_ID   = 'TM-Session-4821';
export const PLANNER_NAME = 'M. Schmidt';

// ─── StatusBadge + ObjectKindIcon ─────────────────────────────────────────────
import { Icon as FioriIcon } from '../../components/atoms/Icon';

export const StatusBadge: React.FC<{ state: PackageState }> = ({ state }) => {
  switch (state) {
    case 'accepted':   return <ObjectStatus state="Positive" icon={<Icon name="accept" />}>Accepted</ObjectStatus>;
    case 'rejected':   return <ObjectStatus state="Critical" icon={<Icon name="decline" />}>Rejected</ObjectStatus>;
    case 'discarded':  return <ObjectStatus state="None" icon={<Icon name="sys-cancel" />}>Discarded</ObjectStatus>;
    case 'stale':      return <ObjectStatus state="Critical" icon={<Icon name="alert" />}>Stale</ObjectStatus>;
    case 'nosol':      return <ObjectStatus state="Negative" icon={<Icon name="border" />}>No solution</ObjectStatus>;
    case 'evaluating': return <ObjectStatus state="Information" icon={<Icon name="synchronize" />}>Evaluating…</ObjectStatus>;
    case 'pending':    return <ObjectStatus state="None">Pending</ObjectStatus>;
    default:           return <ObjectStatus state="Information">Ready</ObjectStatus>;
  }
};

export const ObjectKindIcon: React.FC<{ kind: ObjectKind }> = ({ kind }) => {
  const map: Record<ObjectKind, string> = { FO: 'shipping-status', FU: 'product', Stop: 'map-2', Resource: 'employee' };
  return <FioriIcon name={map[kind]} size={14} ariaLabel={kind} />;
};

// ─── FO / Resource mock data ──────────────────────────────────────────────────
export interface LoadedFO {
  id: string; sapId: string; resource: string; resourceLabel: string;
  dc: string; stops: number; pallets: number; distanceKm: number;
  amount: number; utilization: number; corridor: string; lockedBy?: string;
}

export const LOADED_FOS: LoadedFO[] = [
  { id: 'FO-001', sapId: '80000000000', resource: 'EBE_ALDI_31_DUMMY_33P_FRZ', resourceLabel: '31/DUMMY_33P_FRZ', dc: 'BD20', stops: 2, pallets: 20.92, distanceKm: 235.928, amount: 685.07, utilization: 84.06, corridor: 'ST-BN42 → ST-BN05' },
  { id: 'FO-002', sapId: '80000000001', resource: 'EBE_ALDI_02_DAY_37P',         resourceLabel: '02/DAY_37P',         dc: 'BD42', stops: 3, pallets: 24.00, distanceKm: 125.474, amount: 551.04, utilization: 90.68, corridor: 'ST-BN04 → ST-BN14 → ST-BN06' },
  { id: 'FO-003', sapId: '80000000002', resource: 'EBE_ALDI_03_NIGHT_37P',       resourceLabel: '03/NIGHT_37P',       dc: 'BD20', stops: 1, pallets: 34.35, distanceKm: 230.774, amount: 930.19, utilization: 72.68, corridor: 'ST-BN06' },
  { id: 'FO-004', sapId: '80000000003', resource: 'EBE_ALDI_03_NIGHT_37P',       resourceLabel: '03/NIGHT_37P',       dc: 'BD20', stops: 3, pallets: 15.20, distanceKm: 178.767, amount: 695.04, utilization: 86.39, corridor: 'ST-BN08 → ST-BN41 → ST-BN38' },
  { id: 'FO-005', sapId: '80000000004', resource: 'EBE_ALDI_31_DUMMY_33P_FRZ',   resourceLabel: '31/DUMMY_33P_FRZ',   dc: 'BD42', stops: 1, pallets: 20.78, distanceKm: 113.089, amount: 533.25, utilization: 95.04, corridor: 'ST-BN15' },
  { id: 'FO-006', sapId: '80000000005', resource: 'EBE_ALDI_30_DUMMY_33P_FRZ',   resourceLabel: '30/DUMMY_33P_FRZ',   dc: 'BD20', stops: 2, pallets: 20.47, distanceKm: 139.932, amount: 622.50, utilization: 90.08, corridor: 'ST-BN27 → ST-BN35' },
  { id: 'FO-007', sapId: '80000000006', resource: 'EBE_ALDI_32_DUMMY_33P_FRZ',   resourceLabel: '32/DUMMY_33P_FRZ',   dc: 'BD42', stops: 3, pallets: 20.38, distanceKm: 172.360, amount: 553.60, utilization: 83.62, corridor: 'ST-BN53 → ST-BN12 → ST-BN38' },
  { id: 'FO-008', sapId: '80000000007', resource: 'EBE_ALDI_32_DUMMY_33P_FRZ',   resourceLabel: '32/DUMMY_33P_FRZ',   dc: 'BD20', stops: 2, pallets: 24.58, distanceKm: 181.339, amount: 720.64, utilization: 91.14, corridor: 'ST-BN07 → ST-BN46' },
  { id: 'FO-009', sapId: '80000000008', resource: 'EBE_ALDI_31_DUMMY_33P_FRZ',   resourceLabel: '31/DUMMY_33P_FRZ',   dc: 'BD20', stops: 3, pallets: 35.16, distanceKm: 142.380, amount: 711.84, utilization: 97.99, corridor: 'ST-BN14 → ST-BN44 → ST-BN28' },
  { id: 'FO-010', sapId: '80000000009', resource: 'EBE_ALDI_04_NIGHT_37P',       resourceLabel: '04/NIGHT_37P',       dc: 'BD42', stops: 2, pallets: 23.66, distanceKm: 115.019, amount: 534.39, utilization: 75.76, corridor: 'ST-BN20 → ST-BN51' },
  { id: 'FO-011', sapId: '80000000010', resource: 'EBE_ALDI_04_DAY_37P',         resourceLabel: '04/DAY_37P',         dc: 'BD20', stops: 3, pallets: 30.60, distanceKm: 140.217, amount: 678.13, utilization: 93.90, corridor: 'ST-BN20 → ST-BN32 → ST-BN47' },
  { id: 'FO-012', sapId: '80000000011', resource: 'EBE_ALDI_01_NIGHT_37P',       resourceLabel: '01/NIGHT_37P',       dc: 'BD20', stops: 1, pallets: 12.98, distanceKm: 143.016, amount: 599.72, utilization: 96.08, corridor: 'ST-BN33' },
  { id: 'FO-013', sapId: '80000000012', resource: 'EBE_ALDI_30_DUMMY_33P_FRZ',   resourceLabel: '30/DUMMY_33P_FRZ',   dc: 'BD42', stops: 1, pallets: 19.22, distanceKm: 205.373, amount: 606.01, utilization: 73.90, corridor: 'ST-BN32' },
  { id: 'FO-014', sapId: '80000000013', resource: 'EBE_ALDI_01_DAY_37P',         resourceLabel: '01/DAY_37P',         dc: 'BD20', stops: 3, pallets: 31.71, distanceKm: 140.680, amount: 634.47, utilization: 103.36, corridor: 'ST-BN37 → ST-BN22 → ST-BN23', lockedBy: 'Over capacity — 103.4%' },
  { id: 'FO-015', sapId: '80000000014', resource: 'EBE_ALDI_04_NIGHT_37P',       resourceLabel: '04/NIGHT_37P',       dc: 'BD42', stops: 1, pallets: 15.08, distanceKm: 79.508,  amount: 379.61, utilization: 78.34, corridor: 'ST-BN54' },
  { id: 'FO-016', sapId: '80000000015', resource: 'EBE_ALDI_31_DUMMY_33P_FRZ',   resourceLabel: '31/DUMMY_33P_FRZ',   dc: 'BD42', stops: 3, pallets: 20.95, distanceKm: 202.436, amount: 648.83, utilization: 104.26, corridor: 'ST-BN43 → ST-BN04 → ST-BN45', lockedBy: 'Over capacity — 104.3%' },
  { id: 'FO-017', sapId: '80000000016', resource: 'EBE_ALDI_32_DUMMY_33P_FRZ',   resourceLabel: '32/DUMMY_33P_FRZ',   dc: 'BD42', stops: 2, pallets: 16.74, distanceKm: 211.389, amount: 779.65, utilization: 84.14, corridor: 'ST-BN46 → ST-BN57' },
  { id: 'FO-018', sapId: '80000000017', resource: 'EBE_ALDI_02_NIGHT_37P',       resourceLabel: '02/NIGHT_37P',       dc: 'BD20', stops: 2, pallets: 15.95, distanceKm: 204.456, amount: 746.25, utilization: 72.98, corridor: 'ST-BN23 → ST-BN40' },
  { id: 'FO-019', sapId: '80000000018', resource: 'EBE_ALDI_31_DUMMY_33P_FRZ',   resourceLabel: '31/DUMMY_33P_FRZ',   dc: 'BD20', stops: 1, pallets: 12.09, distanceKm: 183.889, amount: 520.21, utilization: 72.64, corridor: 'ST-BN50' },
  { id: 'FO-020', sapId: '80000000019', resource: 'EBE_ALDI_03_DAY_37P',         resourceLabel: '03/DAY_37P',         dc: 'BD20', stops: 2, pallets: 26.17, distanceKm: 99.697,  amount: 480.68, utilization: 97.87, corridor: 'ST-BN26 → ST-BN06' },
];

export const TOTAL_FOS   = LOADED_FOS.length;
export const TOTAL_STOPS = LOADED_FOS.reduce((s, fo) => s + fo.stops, 0);
const TOTAL_PALLETS_EXACT_INNER = LOADED_FOS.reduce((s, fo) => s + fo.pallets, 0);
export const TOTAL_PALLETS = Math.round(TOTAL_PALLETS_EXACT_INNER);
export const TOTAL_PALLETS_EXACT = TOTAL_PALLETS_EXACT_INNER;
export const TOTAL_DISTANCE_KM = LOADED_FOS.reduce((s, fo) => s + fo.distanceKm, 0);
export const TOTAL_COST_EUR = LOADED_FOS.reduce((s, fo) => s + fo.amount, 0);
export const AVG_UTILIZATION = LOADED_FOS.reduce((s, fo) => s + fo.utilization, 0) / LOADED_FOS.length;
export const OVER_CAPACITY_COUNT = LOADED_FOS.filter(f => f.utilization > 100).length;

export interface ResourceSummary { id: string; dc: string; tours: number; totalPallets: number; avgUtilization: number; }
export const RESOURCE_SUMMARY: ResourceSummary[] = (() => {
  const map = new Map<string, { dc: string; tours: number; totalPallets: number; utilSum: number }>();
  for (const fo of LOADED_FOS) {
    const e = map.get(fo.resource);
    if (e) { e.tours++; e.totalPallets += fo.pallets; e.utilSum += fo.utilization; }
    else map.set(fo.resource, { dc: fo.dc, tours: 1, totalPallets: fo.pallets, utilSum: fo.utilization });
  }
  return Array.from(map.entries()).map(([id, v]) => ({ id, dc: v.dc, tours: v.tours, totalPallets: Math.round(v.totalPallets * 100) / 100, avgUtilization: v.utilSum / v.tours })).sort((a, b) => a.id.localeCompare(b.id));
})();
export const TOTAL_RESOURCES = RESOURCE_SUMMARY.length;

export interface RuleDescriptor { id: RuleId; scope: string; description: string; threshold: string; matched: number; }
export const RULE_DESCRIPTORS: RuleDescriptor[] = [
  { id: 'R-001', scope: 'Night-shift FOs in DC-BD27', description: 'Stores ST-B203, ST-B206, ST-B222, ST-B226, ST-B245, ST-B247, ST-B251, ST-B263, ST-B264 are one-stop night stores. Each FO may visit at most one of these stores per night shift. Exception: ST-B247 + ST-B263 may be combined during holidays only.', threshold: 'max_night_stops_per_FO = 1 (holiday exception: B247+B263)', matched: 3 },
  { id: 'R-002', scope: 'All FOs where utilization > 100%', description: 'Redistribute excess pallets from over-capacity FOs to admissible target FOs within ±5% capacity tolerance. Prevents staging/provisioning errors at destination DC.', threshold: 'utilization ≤ 105% after redistribution', matched: 2 },
  { id: 'R-003', scope: 'BD09 Sunday and public holiday deliveries', description: 'Stores 103, 106, 114, 125, 131, 133, 142, 145, 151, 155, 170, 175 must not be delivered on Sundays or public holidays. On Fridays, 9–11 vehicles are required for these stores running Sunday 22:00 or Monday morning.', threshold: 'delivery_day ∉ {Sunday, PublicHoliday}', matched: 1 },
  { id: 'R-004', scope: 'Ambient cockpit — DC-BD27 BD27 daily run', description: 'MilkRun routing is only permitted when CHL non-PTZ volume exceeds 300 pallets. Below this threshold the optimizer must not create MilkRun tours — regular point-to-point routing applies.', threshold: 'CHL_non_PTZ_volume > 300 PAL', matched: 1 },
  { id: 'R-007', scope: 'All FOs in DC-BD27', description: 'Routing from ST-B202 to ST-B218 is not permitted. Routing from ST-B218 to ST-B233 is not permitted. Optimizer must re-sequence affected stops to avoid these corridors.', threshold: 'route ∉ {B202→B218, B218→B233}', matched: 2 },
];

// ─── TM Profile Set — read-only, sourced from SAP TM API ─────────────────────
// The application NEVER creates, edits or deletes Profile Sets.
// TM returns only the sets the logged-in user is authorised to use.
export interface TmProfileSet {
  id: string;
  description: string;
  freightUnitSelectionProfile: string;
  freightOrderSelectionProfile: string;
  // Phase 0 shows only the three fields above.
  // Future (not shown): trailerUnitSelectionProfile,
  // consignmentOrderSelectionProfile, planningProfile, etc.
}

export const MOCK_TM_PROFILE_SETS: TmProfileSet[] = [
  {
    id: 'PS001',
    description: 'Standard Outbound Planning',
    freightUnitSelectionProfile: 'Standard FU Selection',
    freightOrderSelectionProfile: 'Standard FO Selection',
  },
  {
    id: 'PS002',
    description: 'Night Shift Planning',
    freightUnitSelectionProfile: 'Night FU Selection',
    freightOrderSelectionProfile: 'Night FO Selection',
  },
  {
    id: 'PS003',
    description: 'ALDI Road Freight',
    freightUnitSelectionProfile: 'AG01_FO_ROAD',
    freightOrderSelectionProfile: 'AG01_FB_OCEAN',
  },
];

// ─── Admin domain types ───────────────────────────────────────────────────────
export type PipelineStageV2 = 'draft' | 'submitted' | 'validating' | 'validation-complete' | 'validation-complete-warnings' | 'validation-failed' | 'approved' | 'discarded' | 'retired';
export type ValidationStatusV2 = 'pass' | 'warnings' | 'failed' | 'pending';
export type RuleTypeV2 = 'hard-constraint' | 'preference';
export type CheckResult = 'pass' | 'warning' | 'fail' | 'pending';

export const STAGE_LABEL_V2: Record<PipelineStageV2, string> = {
  'draft': 'Draft',
  'submitted': 'Submitted / Validating',
  'validating': 'Submitted / Validating',
  'validation-complete': 'Validation Complete',
  'validation-complete-warnings': 'Validation Complete — Warnings',
  'validation-failed': 'Validation Failed',
  'approved': 'Published',
  'discarded': 'Discarded',
  'retired': 'Retired',
};

export const stageStatusState = (s: PipelineStageV2): 'Positive' | 'Critical' | 'Negative' | 'Information' | 'None' => {
  if (s === 'approved') return 'Positive';
  if (s === 'retired') return 'Critical';
  if (s === 'validation-complete-warnings') return 'Critical';
  if (s === 'discarded' || s === 'validation-failed') return 'Negative';
  if (s === 'validation-complete' || s === 'validating' || s === 'submitted') return 'Information';
  return 'None';
};

export const validationStatusState = (v: ValidationStatusV2): 'Positive' | 'Critical' | 'Negative' | 'None' =>
  v === 'pass' ? 'Positive' : v === 'warnings' ? 'Critical' : v === 'failed' ? 'Negative' : 'None';

export const VALIDATION_STATUS_LABEL: Record<ValidationStatusV2, string> = {
  'pass': 'Validation Complete', 'warnings': 'Validation Complete — Warnings Found', 'failed': 'Validation Failed', 'pending': 'Pending',
};

export const RULE_TYPE_LABEL: Record<RuleTypeV2, string> = { 'hard-constraint': 'Hard Constraint', 'preference': 'Preference' };
export const RULE_TYPE_COLOR: Record<RuleTypeV2, '2' | '6'> = { 'hard-constraint': '2', 'preference': '6' };

export interface RuleCandidateV2 {
  id: string;
  name: string;
  group: string;
  ruleType: RuleTypeV2;
  sopDescription: string;
  businessContext: string;
  exampleScenario: string;
  scopeText: string;
  attachedDocs: string[];
  stage: PipelineStageV2;
  validationStatus: ValidationStatusV2;
  tmDataCheck: CheckResult;
  apiActionCheck: CheckResult;
  submittedDate?: string;
  approvedDate?: string;
  approvedBy?: string;
  assignedProfileIds: string[];
  sourceDoc: string;
}

export type ProfileStatusV2 = 'draft' | 'active' | 'retired';

export interface RuleProfileV2 {
  id: string;
  name: string;
  dc: string;
  planningContext: string;
  effectiveFrom: string;
  effectiveTo: string;
  status: ProfileStatusV2;
  ruleIds: string[];
  createdDate: string;
  activatedDate?: string;
}

export const PROFILE_STATUS_LABEL: Record<ProfileStatusV2, string> = { draft: 'Draft', active: 'Active', retired: 'Retired' };
export const profileStatusState = (s: ProfileStatusV2): 'Positive' | 'Critical' | 'None' =>
  s === 'active' ? 'Positive' : s === 'retired' ? 'Critical' : 'None';

// ─── Initial mock data ────────────────────────────────────────────────────────
export const INITIAL_CANDIDATES_V2: RuleCandidateV2[] = [
  // ── BD09 Rules ────────────────────────────────────────────────────────────────
  {
    id: 'RC-101',
    name: 'One-Stop Night Stores',
    group: 'Store Rules',
    ruleType: 'hard-constraint',
    sopDescription: 'Stores ST-B203, ST-B206, ST-B222, ST-B226, ST-B245, ST-B247, ST-B251, ST-B263, ST-B264 are "one-stop" stores at night. Each freight order may visit at most one of these stores per night shift. Exception: ST-B247 and ST-B263 may be combined during holidays.',
    businessContext: 'Night-shift dispatch capacity at these stores cannot accommodate multiple FO arrivals. The holiday exception reflects reduced volume on those days.',
    exampleScenario: 'FO-003 visits ST-B203 (Night) + ST-B222 (Night) → violation. Split into two separate FOs.\nFO-012 visits ST-B247 + ST-B263 on a public holiday → allowed by exception.',
    scopeText: 'All night-shift freight orders in DC-BD27 (LGF-BD27). Stores: ST-B203, ST-B206, ST-B222, ST-B226, ST-B245, ST-B247, ST-B251, ST-B263, ST-B264.',
    attachedDocs: ['BD27_Rules_SAP_v2.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-04-15',
    assignedProfileIds: ['RP-001'], sourceDoc: 'BD27',
  },
  {
    id: 'RC-102',
    name: 'Sunday / Holiday Delivery Ban — BD09',
    group: 'Store Rules',
    ruleType: 'hard-constraint',
    sopDescription: 'The following 12 stores must not be delivered on Sundays or public holidays: ST-B103, ST-B106, ST-B114, ST-B125, ST-B131, ST-B133, ST-B142, ST-B145, ST-B151, ST-B155, ST-B170, ST-B175. On Fridays, 9–11 vehicles are required for these stores — they run Sunday 22:00 or Monday morning.',
    businessContext: 'Local trade regulations and operational constraints prevent Sunday/holiday deliveries at these stores. Friday planning must account for the weekend volume.',
    exampleScenario: 'FO delivering to ST-B145 on Sunday 22.12.2026 → violation. Reschedule to Monday 23.12 or plan via Friday pre-run (Sunday 22:00 departure).\nIf resources insufficient on Fridays, combine stores 155 & 170 or 133 with 125.',
    scopeText: 'All freight orders in DC-BD09 with delivery date on Sunday or public holiday.',
    attachedDocs: ['BD09-Rules_v3.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-03-25',
    assignedProfileIds: ['RP-002'], sourceDoc: 'BD09',
  },
  {
    id: 'RC-103',
    name: 'PTZ Start Window — BD09',
    group: 'Time Rules',
    ruleType: 'hard-constraint',
    sopDescription: 'PTZ (Pick-to-Zero) shipments — freight units of type ZF16 or ZF18 — cannot start before 18:00. Exception: store ST-B145 can start at 17:00.',
    businessContext: 'PTZ inventory consolidation finishes at 18:00 across the BD09 network. ST-B145 has an earlier consolidation cutoff of 17:00. Planning before this window causes staging conflicts at the DC.',
    exampleScenario: 'Tour with ZF16 freight unit starting at 17:30 → violation (not ST-B145). Move start to 18:00.\nTour with ZF18 at ST-B145 starting at 17:00 → allowed by exception.',
    scopeText: 'All Pick-to-Zero freight units (ZF16, ZF18) in DC-BD09.',
    attachedDocs: ['BD09-Rules_v3.docx'],
    stage: 'validation-complete-warnings', validationStatus: 'warnings', tmDataCheck: 'pass', apiActionCheck: 'warning',
    assignedProfileIds: [], sourceDoc: 'BD09',
  },
  {
    id: 'RC-104',
    name: 'MilkRun Only if CHL Non-PTZ > 300 PAL',
    group: 'Planning Execution',
    ruleType: 'hard-constraint',
    sopDescription: 'MilkRun routing is only permitted when CHL non-PTZ volume exceeds 300 pallets. Below this threshold the optimizer must not create MilkRun tours — regular point-to-point routing applies.',
    businessContext: 'MilkRun tours below 300 PAL CHL volume are operationally inefficient and increase per-pallet transport cost.',
    exampleScenario: 'Daily CHL non-PTZ volume = 280 PAL → MilkRun not permitted. Optimizer must use point-to-point routing.\nDaily CHL non-PTZ volume = 340 PAL → MilkRun permitted.',
    scopeText: 'Ambient cockpit planning run — DC-BD27 (1RUN cockpit). Applies to all CHL freight units.',
    attachedDocs: ['BD27_Rules_SAP_v2.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-06-10',
    assignedProfileIds: ['RP-001'], sourceDoc: 'BD27',
  },
  {
    id: 'RC-105',
    name: 'Routing Restriction — ST-B202 / ST-B218 / ST-B233',
    group: 'Store Rules',
    ruleType: 'hard-constraint',
    sopDescription: 'The following routing sequences are not permitted: ST-B202 → ST-B218, and ST-B218 → ST-B233. If the optimizer produces FOs with these sequences the stops must be re-sequenced to an admissible route before the plan is finalised.',
    businessContext: 'These routing sequences cause unacceptable driver duty time or physical road access issues at those store locations.',
    exampleScenario: 'FO stop sequence ST-B202 → ST-B218 detected → violation. Re-sequence to avoid this corridor.\nST-B218 → ST-B233 sequence on same FO → also forbidden, must be split or reordered.',
    scopeText: 'All freight orders in DC-BD27 passing through stores ST-B202, ST-B218, or ST-B233.',
    attachedDocs: ['BD27_Rules_SAP_v2.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-05-20',
    assignedProfileIds: ['RP-001'], sourceDoc: 'BD27',
  },
  {
    id: 'RC-106',
    name: 'Paulet Carrier — 3 FOs Daily (BD09)',
    group: 'Resource Rules',
    ruleType: 'preference',
    sopDescription: 'All Paulet resources should always get 3 freight orders per planning day in DC-BD09. Warn the planner if the current plan has fewer or more than 3 Paulet FOs. Must not override critical planning constraints.',
    businessContext: 'Paulet is a strategic 3PL partner. Keeping their daily volume consistent at 3 FOs preserves the commercial relationship and ensures availability.',
    exampleScenario: 'BD09 plan has 2 Paulet FOs → recommend adjusting Paulet resource assignment to reach 3.\n4 Paulet FOs → warn that Paulet is overloaded, redistribute to Lenz or Wille.',
    scopeText: 'DC-BD09 daily planning. Carrier: Paulet. Applies to all Paulet-designated resources.',
    attachedDocs: ['BD09-Rules_v3.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-06-12',
    assignedProfileIds: ['RP-002'], sourceDoc: 'BD09',
  },
  {
    id: 'RC-107',
    name: 'Over-Capacity Redistribution ±5% (BD27)',
    group: 'Planning Execution',
    ruleType: 'hard-constraint',
    sopDescription: 'Freight orders exceeding 100% utilization must have excess freight units redistributed to admissible target FOs. Maximum overplanning allowed is +1 pallet per resource. Target FOs must be on the same planning day, same shipper DC, and have sufficient headroom within ±5% of their capacity.',
    businessContext: 'Over-capacity FOs cause staging and provisioning errors at the DC. Maximum overplanning +1 pallet is a hard capacity constraint from BD27 resource rules.',
    exampleScenario: 'FO-014: 31.71 PAL, 103.36% → redistributes 1.1 PAL to FO-018 (72.98%, same DC-BD20). New utilization: 99.8% / 77.1%.\nResource overplanning of 2 pallets → reject or adjust to stay within +1 pallet maximum.',
    scopeText: 'All freight orders in DC-BD27 where utilization > 100% or resource overplanning > +1 pallet.',
    attachedDocs: ['BD27_Rules_SAP_v2.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-07-01',
    assignedProfileIds: ['RP-001'], sourceDoc: 'BD27',
  },
  {
    id: 'RC-108',
    name: 'Unplanned Freight Units Check — BD09',
    group: 'Planning Execution',
    ruleType: 'hard-constraint',
    sopDescription: 'No unplanned freight units are allowed in the final transportation plan. If unplanned FUs exist, classify them by FU type. If FU type is ZF16 or ZF18 (PTZ), apply the PTZ combination workflow. Otherwise, apply specific distribution rules for this cockpit and trigger the scheduling engine.',
    businessContext: 'Primary entry point for manual review; prevents acceptance of incomplete transportation plans.',
    exampleScenario: 'Planning run completes with 3 unplanned FUs → classify by type. 2 are ZF16 → apply PTZ combination workflow. 1 is standard → apply distribution rules and re-trigger scheduling engine.',
    scopeText: 'DC-BD09. All freight units after each planning run. Evaluated before plan acceptance.',
    attachedDocs: ['BD09-Rules_v3.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-06-01',
    assignedProfileIds: ['RP-002'], sourceDoc: 'BD09',
  },
  {
    id: 'RC-109',
    name: 'ST-B103 City Store — Own Fleet 06:00 (BD09)',
    group: 'Store Rules',
    ruleType: 'hard-constraint',
    sopDescription: 'Store ST-B103 is a city store with a special forklift requirement. All freight units destined for ST-B103 must be assigned to ALDI own fleet resources and planned for delivery from the 06:00 morning shift.',
    businessContext: 'City store with narrow access requiring ALDI own fleet and specific shift. Third-party carriers cannot handle the forklift requirements at this location.',
    exampleScenario: 'FO assigned to carrier Lenz with stop at ST-B103 → violation. Reassign to ALDI own fleet resource and set departure to 06:00 shift.\nALDI own fleet FO at 08:00 visiting ST-B103 → adjust start time to 06:00.',
    scopeText: 'DC-BD09. All freight orders with destination store ST-B103.',
    attachedDocs: ['BD09-Rules_v3.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-06-01',
    assignedProfileIds: ['RP-002'], sourceDoc: 'BD09',
  },
  {
    id: 'RC-110',
    name: 'ST-B175 Own Fleet + Overflow Resource (BD09)',
    group: 'Store Rules',
    ruleType: 'hard-constraint',
    sopDescription: 'Assign ST-B175 FUs to ALDI own fleet resources and plan the first delivery from the 06:00 shift. If remaining ST-B175 FUs exist after own fleet allocation, assign them to resource MG_ALDI_10_DAY_20P_TL_FRZ.',
    businessContext: 'ST-B175 has a primary own fleet constraint with a defined overflow resource for excess volume.',
    exampleScenario: 'ST-B175 has 25 FUs. ALDI own fleet fits 20 → assign first 20 to own fleet at 06:00. Remaining 5 → assign to MG_ALDI_10_DAY_20P_TL_FRZ.',
    scopeText: 'DC-BD09. All freight orders with destination store ST-B175.',
    attachedDocs: ['BD09-Rules_v3.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-06-01',
    assignedProfileIds: ['RP-002'], sourceDoc: 'BD09',
  },
  {
    id: 'RC-111',
    name: 'ST-B148 Nighttime Delivery Only (BD09)',
    group: 'Store Rules',
    ruleType: 'hard-constraint',
    sopDescription: 'No delivery is possible during store opening times at ST-B148 due to parking restrictions. Plan ST-B148 at nighttime only. Carrier may be selected according to carrier priority and distribution rules.',
    businessContext: 'Store-specific hard time-window constraint. Parking restrictions make daytime delivery physically impossible. Delivery timing outranks carrier optimization.',
    exampleScenario: 'FO planned for 10:00 delivery to ST-B148 → violation. Move delivery to nighttime window.\nNight FO with ST-B148 stop at 23:00 → compliant.',
    scopeText: 'DC-BD09. All freight orders with destination store ST-B148.',
    attachedDocs: ['BD09-Rules_v3.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-06-01',
    assignedProfileIds: ['RP-002'], sourceDoc: 'BD09',
  },
  {
    id: 'RC-112',
    name: 'Freezer Cockpit Store List — Resource MG_ALDI_10_DAY_20P_TL_FRZ (BD09)',
    group: 'Resource Rules',
    ruleType: 'hard-constraint',
    sopDescription: 'Stores ST-B112, ST-B103, ST-B148, and ST-B175 must be planned on the ALDI freezer-capable resource MG_ALDI_10_DAY_20P_TL_FRZ.',
    businessContext: 'These stores require freezer-capable transport. Only MG_ALDI_10_DAY_20P_TL_FRZ has the required refrigeration equipment.',
    exampleScenario: 'FO carrying goods to ST-B112 assigned to standard dry resource → violation. Reassign to MG_ALDI_10_DAY_20P_TL_FRZ.\nST-B175 FO on ambient resource → move to freezer resource.',
    scopeText: 'DC-BD09. All freight orders with destination in: ST-B112, ST-B103, ST-B148, ST-B175.',
    attachedDocs: ['BD09-Rules_v3.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-06-01',
    assignedProfileIds: ['RP-002'], sourceDoc: 'BD09',
  },
  {
    id: 'RC-113',
    name: 'ALDI Own Fleet Priority (BD09)',
    group: 'Resource Rules',
    ruleType: 'preference',
    sopDescription: 'ALDI own fleet resources have the highest priority across BD09 planning. Recommend using ALDI own fleet before 3PL carriers, while respecting hard constraints and carrier distribution rules.',
    businessContext: 'Own fleet preference rule used across BD09 planning unless overridden by critical constraints. Reduces 3PL cost and maintains operational control.',
    exampleScenario: 'Available capacity exists on both ALDI own fleet and carrier Lenz → assign to ALDI own fleet first.\nOwn fleet already at capacity → fall through to carrier priority order.',
    scopeText: 'DC-BD09. All freight orders where ALDI own fleet capacity is available.',
    attachedDocs: ['BD09-Rules_v3.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-06-01',
    assignedProfileIds: ['RP-002'], sourceDoc: 'BD09',
  },
  {
    id: 'RC-114',
    name: 'Volume-Based Carrier Distribution (BD09)',
    group: 'Resource Rules',
    ruleType: 'hard-constraint',
    sopDescription: 'Low volume (1,000–2,500 FUs): assign 1 FO to ALDI resources and at least 2 FOs to carriers based on fair share — each carrier receiving the same number of FOs where feasible. High volume (>2,500 FUs): prioritize resources in order — ALDI resources, Paulet, Lenz, Wille, Scholz.',
    businessContext: 'Volume-based carrier distribution rule prevents over-concentration on a single carrier and maintains fair commercial allocation.',
    exampleScenario: 'Session volume = 1,800 FUs (low) → 1 FO to ALDI, ≥2 FOs split equally across Paulet/Lenz/Wille.\nSession volume = 3,200 FUs (high) → fill ALDI first, then Paulet, then Lenz, then Wille, then Scholz.',
    scopeText: 'DC-BD09. Applied per planning session based on total FU volume.',
    attachedDocs: ['BD09-Rules_v3.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-06-01',
    assignedProfileIds: ['RP-002'], sourceDoc: 'BD09',
  },
  {
    id: 'RC-115',
    name: 'After-14:00 Delivery Stores (BD09)',
    group: 'Time Rules',
    ruleType: 'hard-constraint',
    sopDescription: 'The following stores must be planned after 14:00: ST-B105, ST-B108, ST-B117, ST-B121, ST-B123, ST-B135, ST-B136, ST-B144, ST-B145.',
    businessContext: 'Store-specific time-window rule. These stores have receiving staff or dock availability only from 14:00 onwards.',
    exampleScenario: 'FO scheduled for 12:00 delivery to ST-B117 → violation. Move delivery start to 14:00 or later.\nST-B145 at 15:30 → compliant.',
    scopeText: 'DC-BD09. All freight orders with destination in: ST-B105, ST-B108, ST-B117, ST-B121, ST-B123, ST-B135, ST-B136, ST-B144, ST-B145.',
    attachedDocs: ['BD09-Rules_v3.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-06-01',
    assignedProfileIds: ['RP-002'], sourceDoc: 'BD09',
  },
  {
    id: 'RC-116',
    name: 'Pre-Tour Resource MG_ALDI_10_DAY_20P_TL_FRZ — Utilization & Exclusions (BD09)',
    group: 'Resource Rules',
    ruleType: 'hard-constraint',
    sopDescription: 'Pre-tour logic applies only to resource MG_ALDI_10_DAY_20P_TL_FRZ. If pre-tour utilization > 14 pallets: remove FUs belonging to ST-B105 or ST-B145 from the pre-tour FO and reassign to other FOs respecting corresponding rules. If utilization ≤ 14 pallets: recommend reworking the pre-tour FO.',
    businessContext: 'Pre-tour gate rule. Additional pre-tour checks apply only to the defined ALDI freezer-capable resource. ST-B105 and ST-B145 have specific constraints that conflict with the pre-tour route.',
    exampleScenario: 'Pre-tour FO on MG_ALDI_10_DAY_20P_TL_FRZ has 16 PAL utilization and includes ST-B145 → remove ST-B145 FUs, reassign to another FO.\nPre-tour FO has 12 PAL → flag for planner rework.',
    scopeText: 'DC-BD09. Pre-tour freight orders on resource MG_ALDI_10_DAY_20P_TL_FRZ.',
    attachedDocs: ['BD09-Rules_v3.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-06-01',
    assignedProfileIds: ['RP-002'], sourceDoc: 'BD09',
  },
  {
    id: 'RC-117',
    name: 'Unplanned PTZ FU Combinations (BD09)',
    group: 'Planning Execution',
    ruleType: 'hard-constraint',
    sopDescription: 'If unplanned PTZ FUs remain after scheduling: first try combining ST-B155 + ST-B170 into one compatible FO. If not available, try combining ST-B151 + ST-B114. If neither combination is possible, flag remaining PTZ FUs for manual planner review. Do not create unsupported store combinations.',
    businessContext: 'PTZ exception-handling entry rule. Only these two documented combinations should be evaluated — no other pairings are approved.',
    exampleScenario: 'After scheduling, ST-B155 and ST-B170 both have unplanned PTZ FUs and compatible time windows → combine into one FO.\nST-B155 unavailable → try ST-B151 + ST-B114.\nNeither option available → flag for manual review.',
    scopeText: 'DC-BD09. Applied when unplanned PTZ freight units remain after the scheduling engine run.',
    attachedDocs: ['BD09-Rules_v3.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-06-01',
    assignedProfileIds: ['RP-002'], sourceDoc: 'BD09',
  },
  {
    id: 'RC-118',
    name: 'Final FU Check + FO Utilization Optimization (BD09)',
    group: 'Planning Execution',
    ruleType: 'hard-constraint',
    sopDescription: 'Final acceptance gate after all decision-tree branches are evaluated. Unplanned FUs must equal 0. If compliant, check FO utilization: if any FO is below "close to 100%", recommend combining compatible low-utilization FOs to increase utilization close to 100% without violating any other rule. If unplanned FUs > 0, flag plan for manual review.',
    businessContext: 'Final validation ensures no freight is left unplanned and maximizes vehicle utilization before plan submission.',
    exampleScenario: 'All FUs planned, FO-007 at 61% → recommend combining with FO-012 (64%) if stores, time windows, and carrier rules allow.\nUnplanned FUs remain after all rules → flag plan for manual review, do not accept.',
    scopeText: 'DC-BD09. Applied as the final step in every planning run.',
    attachedDocs: ['BD09-Rules_v3.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-06-01',
    assignedProfileIds: ['RP-002'], sourceDoc: 'BD09',
  },

  // ── BD27 Rules ────────────────────────────────────────────────────────────────
  {
    id: 'RC-119',
    name: 'Low Volume Fair-Share Carrier Allocation (BD27)',
    group: 'Resource Rules',
    ruleType: 'hard-constraint',
    sopDescription: 'For planning runs with FU volume below 2,500: carriers must receive at least 2 FOs based on fair share, with each carrier getting the same number of FOs.',
    businessContext: 'Prevents over-concentration of volume on ALDI own fleet in low-volume scenarios and maintains carrier commercial commitments.',
    exampleScenario: 'Session volume = 2,100 FUs → carriers each get ≥2 FOs split equally.\nSession volume = 2,600 FUs → this rule does not apply; use high-volume priority order instead.',
    scopeText: 'DC-BD27. Applied when total FU volume < 2,500.',
    attachedDocs: ['BD27_Rules_SAP_v2.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-07-01',
    assignedProfileIds: ['RP-001'], sourceDoc: 'BD27',
  },
  {
    id: 'RC-120',
    name: 'High Volume Carrier Priority Order (BD27)',
    group: 'Resource Rules',
    ruleType: 'hard-constraint',
    sopDescription: 'For planning runs with FU volume greater than 2,500: prioritize resources in order — ALDI resources, Paulet, Lenz, Wille, Scholz.',
    businessContext: 'High volume is explicitly defined as >2,500 FUs. Priority order reflects commercial agreements and capacity commitments.',
    exampleScenario: 'Session volume = 3,100 FUs → assign ALDI resources first, then Paulet, then Lenz, then Wille, then Scholz.\nSession volume = 2,400 FUs → use low-volume fair-share rule instead.',
    scopeText: 'DC-BD27. Applied when total FU volume > 2,500.',
    attachedDocs: ['BD27_Rules_SAP_v2.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-07-01',
    assignedProfileIds: ['RP-001'], sourceDoc: 'BD27',
  },
  {
    id: 'RC-121',
    name: 'Solo Resource Definition — Capacity < 33P (BD27)',
    group: 'Resource Rules',
    ruleType: 'hard-constraint',
    sopDescription: 'Resources with capacity less than 33 pallets are classified as "Solo Resources". Resource ID pattern is further specified in separate store assignment rules.',
    businessContext: 'Definition rule only. Solo resource classification drives downstream store assignment rules (RC-123, RC-124). Must be evaluated before store-specific solo assignments.',
    exampleScenario: 'Resource LGF_ALDI_01_MORNING_21P (capacity 21P) → classified as Solo Resource.\nResource LGF_ALDI_08_MORNING_33P (capacity 33P) → not a Solo Resource.',
    scopeText: 'DC-BD27. All resources. Evaluated before solo store assignment rules.',
    attachedDocs: ['BD27_Rules_SAP_v2.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-07-01',
    assignedProfileIds: ['RP-001'], sourceDoc: 'BD27',
  },
  {
    id: 'RC-122',
    name: 'CHL + Freezer Combined Transport Allowlist (BD27)',
    group: 'Resource Rules',
    ruleType: 'hard-constraint',
    sopDescription: 'CHL and Freezer freight unit types may only be combined on the following resources: LGF_ALDI_04_MORNING_24P_TL, LGF_ALDI_05_MORNING_27P_TL, LGF_ALDI_08_MORNING_33P_TL, LGF_ALDI_09_MORNING_33P, LGF_ALEX_01_MORNING_33P, LGF_ALEX_04_MORNING_33P, LGF_LIND_01_MORNING_27P_TL, LGF_ALDI_08_DAY_33P, LGF_ALEX_01_DAY_33P, LGF_ALEX_04_DAY_33P, LGF_LIND_01_DAY_27P_TL, LGF_LIND_05_DAY_18P_TL, LGF_ALEX_01_NIGHT_33P.',
    businessContext: 'Only specific multi-temp resources can transport CHL and Freezer together. All other resources lack the required dual-compartment refrigeration.',
    exampleScenario: 'FO combining CHL and Freezer FUs on LGF_ALDI_08_MORNING_33P_TL → allowed.\nCHL + Freezer combination on LGF_ALDI_02_MORNING_27P → violation. Split into separate FOs or reassign to allowed resource.',
    scopeText: 'DC-BD27. All freight orders containing both CHL and Freezer freight unit types.',
    attachedDocs: ['BD27_Rules_SAP_v2.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-07-01',
    assignedProfileIds: ['RP-001'], sourceDoc: 'BD27',
  },
  {
    id: 'RC-123',
    name: 'Solo 21P Store Assignment (BD27)',
    group: 'Store Rules',
    ruleType: 'hard-constraint',
    sopDescription: 'Stores ST-B206, ST-B210, and ST-B245 must be assigned to Solo 21P resources — resources matching the pattern LGF_ALDI_XX_XXXXX_21P.',
    businessContext: 'These stores have physical access or dock constraints that limit vehicle size to 21-pallet solo trucks.',
    exampleScenario: 'FO with destination ST-B210 assigned to 33P resource → violation. Reassign to LGF_ALDI_XX_XXXXX_21P pattern resource.\nST-B245 on LGF_ALDI_03_MORNING_21P → compliant.',
    scopeText: 'DC-BD27. All freight orders with destination: ST-B206, ST-B210, ST-B245.',
    attachedDocs: ['BD27_Rules_SAP_v2.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-07-01',
    assignedProfileIds: ['RP-001'], sourceDoc: 'BD27',
  },
  {
    id: 'RC-124',
    name: 'Solo 27P Store Assignment (BD27)',
    group: 'Store Rules',
    ruleType: 'hard-constraint',
    sopDescription: 'Stores ST-B203, ST-B239, ST-B261, ST-B264, ST-B266, ST-B267, and ST-B276 must be assigned to Solo 27P resources — pattern LGF_ALDI_XX_XXXXX_27P.',
    businessContext: 'These stores are sized for 27-pallet solo vehicles. Larger trucks cannot manoeuvre safely at these locations.',
    exampleScenario: 'FO to ST-B239 assigned to 33P resource → violation. Reassign to LGF_ALDI_XX_XXXXX_27P.\nST-B264 on LGF_LIND_01_MORNING_27P_TL → compliant.',
    scopeText: 'DC-BD27. All freight orders with destination: ST-B203, ST-B239, ST-B261, ST-B264, ST-B266, ST-B267, ST-B276.',
    attachedDocs: ['BD27_Rules_SAP_v2.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-07-01',
    assignedProfileIds: ['RP-001'], sourceDoc: 'BD27',
  },
  {
    id: 'RC-125',
    name: 'Fixed 06:00 Delivery Time Store List (BD27)',
    group: 'Time Rules',
    ruleType: 'hard-constraint',
    sopDescription: 'The following stores must have a truck arrival time of 06:00: ST-B210, ST-B215, ST-B216, ST-B217, ST-B229, ST-B239, ST-B252, ST-B253, ST-B261, ST-B267, ST-B272, ST-B275, ST-B276.',
    businessContext: 'These stores have receiving staff or operations beginning exactly at 06:00. Early or late arrival causes operational delays.',
    exampleScenario: 'FO to ST-B229 planned at 07:00 arrival → violation. Adjust to 06:00.\nST-B272 at 06:00 → compliant.',
    scopeText: 'DC-BD27. All freight orders with destination in the fixed 06:00 store list.',
    attachedDocs: ['BD27_Rules_SAP_v2.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-07-01',
    assignedProfileIds: ['RP-001'], sourceDoc: 'BD27',
  },
  {
    id: 'RC-126',
    name: 'ST-B276 Temporary Closure Block (BD27)',
    group: 'Store Rules',
    ruleType: 'hard-constraint',
    sopDescription: 'Store ST-B276 is temporarily closed for approximately 3 months. Do not plan deliveries to ST-B276 while the closure is in effect.',
    businessContext: 'Temporary closure due to renovation/construction. Any planned delivery during closure will fail on execution.',
    exampleScenario: 'Optimizer includes ST-B276 as a stop → remove from plan.\nFO with ST-B276 as sole destination → discard the FO for the closure period.',
    scopeText: 'DC-BD27. All freight orders. Time-bounded — applies during the closure period.',
    attachedDocs: ['BD27_Rules_SAP_v2.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-07-20',
    assignedProfileIds: ['RP-001'], sourceDoc: 'BD27',
  },
  {
    id: 'RC-127',
    name: 'Sunday / Holiday Evening Delivery Ban (BD27)',
    group: 'Store Rules',
    ruleType: 'hard-constraint',
    sopDescription: 'Stores ST-B247, ST-B249, ST-B256, and ST-B263 must not be planned on Sunday or holiday evenings.',
    businessContext: 'Local restrictions and operational agreements prohibit evening deliveries to these stores on Sundays and public holidays.',
    exampleScenario: 'Sunday evening FO with stop at ST-B249 → violation. Remove or reschedule to a permitted window.\nHoliday evening FO at ST-B263 → violation unless it is the approved holiday exception (ST-B247 + ST-B263 night combination).',
    scopeText: 'DC-BD27. Freight orders on Sunday or public holiday with evening time window. Stores: ST-B247, ST-B249, ST-B256, ST-B263.',
    attachedDocs: ['BD27_Rules_SAP_v2.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-07-01',
    assignedProfileIds: ['RP-001'], sourceDoc: 'BD27',
  },
  {
    id: 'RC-128',
    name: 'Friday / Holiday Store Pairing — ST-B249 + ST-B256 (BD27)',
    group: 'Store Rules',
    ruleType: 'hard-constraint',
    sopDescription: 'On Friday or holiday planning runs, pair stores ST-B249 and ST-B256 together in a pre-plan.',
    businessContext: 'Special pre-plan store pairing for Friday or holiday planning reduces truck count and improves route efficiency on reduced-volume days.',
    exampleScenario: 'Friday planning run → force ST-B249 and ST-B256 onto the same FO where feasible.\nStandard weekday run → this pairing rule does not apply.',
    scopeText: 'DC-BD27. Friday and holiday planning runs only. Stores: ST-B249, ST-B256.',
    attachedDocs: ['BD27_Rules_SAP_v2.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-07-01',
    assignedProfileIds: ['RP-001'], sourceDoc: 'BD27',
  },
  {
    id: 'RC-129',
    name: 'Friday / Holiday Store Pairing — ST-B215 + ST-B216 (BD27)',
    group: 'Store Rules',
    ruleType: 'hard-constraint',
    sopDescription: 'On Friday or holiday planning runs, pair stores ST-B215 and ST-B216 together in a pre-plan.',
    businessContext: 'Special pre-plan store pairing for Friday or holiday planning. These stores are geographically close and share delivery windows on reduced-volume days.',
    exampleScenario: 'Holiday planning run → force ST-B215 and ST-B216 onto the same FO.\nStandard weekday run → rule does not apply.',
    scopeText: 'DC-BD27. Friday and holiday planning runs only. Stores: ST-B215, ST-B216.',
    attachedDocs: ['BD27_Rules_SAP_v2.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-07-01',
    assignedProfileIds: ['RP-001'], sourceDoc: 'BD27',
  },
  {
    id: 'RC-130',
    name: 'Friday / Holiday Store Pairing — ST-B247 + ST-B217 (BD27)',
    group: 'Store Rules',
    ruleType: 'hard-constraint',
    sopDescription: 'On Friday or holiday planning runs, pair stores ST-B247 and ST-B217 together in a pre-plan.',
    businessContext: 'Special pre-plan pairing for Friday / holiday planning. Reduces dispatch complexity on lower-volume days.',
    exampleScenario: 'Friday run → pair ST-B247 and ST-B217 on the same FO where feasible.\nStandard run → rule does not apply.',
    scopeText: 'DC-BD27. Friday and holiday planning runs only. Stores: ST-B247, ST-B217.',
    attachedDocs: ['BD27_Rules_SAP_v2.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-07-01',
    assignedProfileIds: ['RP-001'], sourceDoc: 'BD27',
  },
  {
    id: 'RC-131',
    name: 'Friday / Holiday Additional Pre-Plan — ST-B247 + ST-B263 (BD27)',
    group: 'Store Rules',
    ruleType: 'hard-constraint',
    sopDescription: 'On Friday or holiday planning runs, additionally pair stores ST-B247 and ST-B263 together in a pre-plan.',
    businessContext: 'This is an additional pairing rule for the Friday/holiday scenario, separate from the holiday exception in the one-stop night rule. Both apply independently.',
    exampleScenario: 'Friday run → ST-B247 and ST-B263 paired together as a pre-plan FO.\nNote: ST-B247 may also appear in the ST-B247 + ST-B217 pairing — evaluate both and plan feasibility.',
    scopeText: 'DC-BD27. Friday and holiday planning runs only. Stores: ST-B247, ST-B263.',
    attachedDocs: ['BD27_Rules_SAP_v2.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-07-01',
    assignedProfileIds: ['RP-001'], sourceDoc: 'BD27',
  },
  {
    id: 'RC-132',
    name: 'One-Stop Night Holiday Exception — ST-B247 + ST-B263 (BD27)',
    group: 'Store Rules',
    ruleType: 'hard-constraint',
    sopDescription: 'Exception to the one-stop night rule: during holidays only, stores ST-B247 and ST-B263 may be combined on the same night-shift FO. On non-holiday nights, the standard one-stop rule applies.',
    businessContext: 'Holiday exception allows the pairing to reduce the number of trucks required when volume permits combining these two stores.',
    exampleScenario: 'Holiday night → FO with ST-B247 + ST-B263 → allowed.\nStandard night → FO with ST-B247 + ST-B263 → violation of one-stop night rule (RC-101).',
    scopeText: 'DC-BD27. Night-shift FOs. Holiday days only. Stores: ST-B247, ST-B263.',
    attachedDocs: ['BD27_Rules_SAP_v2.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-07-01',
    assignedProfileIds: ['RP-001'], sourceDoc: 'BD27',
  },
  {
    id: 'RC-133',
    name: 'No Unplanned Freight Units (BD27)',
    group: 'Planning Execution',
    ruleType: 'hard-constraint',
    sopDescription: 'Final validation rule: no unplanned freight units are allowed in the DC-BD27 plan. If unplanned FUs remain, stop and resolve before accepting.',
    businessContext: 'Ensures 100% coverage of freight before plan submission. Any unplanned FU represents a customer not served.',
    exampleScenario: 'Planning run completes with 0 unplanned FUs → final plan valid for this check.\n2 unplanned FUs remain → stop, investigate, and resolve before proceeding.',
    scopeText: 'DC-BD27. Final validation step of every planning run.',
    attachedDocs: ['BD27_Rules_SAP_v2.docx'],
    stage: 'approved', validationStatus: 'pass', tmDataCheck: 'pass', apiActionCheck: 'pass',
    approvedBy: 'H. Fischer', approvedDate: '2026-07-01',
    assignedProfileIds: ['RP-001'], sourceDoc: 'BD27',
  },
];

export const INITIAL_PROFILES_V2: RuleProfileV2[] = [
  {
    id: 'RP-001',
    name: 'BD27 Standard Daily',
    dc: 'DC-BD27 (LGF-BD27)',
    planningContext: 'Daily Outbound Planning',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    status: 'active',
    ruleIds: ['RC-101', 'RC-104', 'RC-105', 'RC-107', 'RC-119', 'RC-120', 'RC-121', 'RC-122', 'RC-123', 'RC-124', 'RC-125', 'RC-126', 'RC-127', 'RC-128', 'RC-129', 'RC-130', 'RC-131', 'RC-132', 'RC-133'],
    createdDate: '2026-03-01',
    activatedDate: '2026-03-15',
  },
  {
    id: 'RP-002',
    name: 'BD09 Standard Daily',
    dc: 'DC-BD09',
    planningContext: 'Daily Outbound Planning',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    status: 'active',
    ruleIds: ['RC-102', 'RC-103', 'RC-106', 'RC-108', 'RC-109', 'RC-110', 'RC-111', 'RC-112', 'RC-113', 'RC-114', 'RC-115', 'RC-116', 'RC-117', 'RC-118'],
    createdDate: '2026-02-15',
    activatedDate: '2026-02-28',
  },
  {
    id: 'RP-003',
    name: 'BD27 Q3 2026 Review',
    dc: 'DC-BD27 (LGF-BD27)',
    planningContext: 'Daily Outbound Planning',
    effectiveFrom: '2026-07-01',
    effectiveTo: '2026-12-31',
    status: 'draft',
    ruleIds: ['RC-101', 'RC-104', 'RC-105', 'RC-107', 'RC-119', 'RC-120', 'RC-121', 'RC-122', 'RC-123', 'RC-124', 'RC-125', 'RC-126', 'RC-127', 'RC-128', 'RC-129', 'RC-130', 'RC-131', 'RC-132', 'RC-133'],
    createdDate: '2026-06-10',
  },
];

// ─── Table style helpers ──────────────────────────────────────────────────────
export const thStyle: React.CSSProperties = { padding: '8px 12px', fontWeight: 'var(--sapFontBoldWeight,700)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' };
export const tdStyle: React.CSSProperties = { padding: '8px 12px' };
