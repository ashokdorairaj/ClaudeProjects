import React, { useState, useRef, lazy, Suspense } from 'react';
import { FioriProvider, useTheme } from './hooks/useFioriTheme';
import type { Theme } from './tokens';

import { Avatar } from './components/atoms/Avatar';
import { ShellBar } from './components/organisms/ShellBar';
import { SideNavigation } from './components/organisms/SideNavigation';
import type { NavItem } from './components/organisms/SideNavigation';
import { UserMenu } from './components/organisms/UserMenu';
import type { UserMenuItemDef, UserMenuAccount } from './components/organisms/UserMenu';

import './App.css';

// Pages — lazy loaded on demand
const HomePage = lazy(() => import('./pages/HomePage'));

// ALDI
const AldiTMPlanningPage = lazy(() => import('./pages/demo/fiori/aldi-tm-planning'));
const AldiTMRefinementPage = lazy(() => import('./pages/ui5/AldiTMRefinementPage'));
const AldiTMRefinementV2Page = lazy(() => import('./pages/ui5/AldiTMRefinementV2Page'));

// Synthetic Data
const SyntheticDataAcceleratorPage = lazy(() => import('./pages/ui5/SyntheticDataAcceleratorPage'));
const SyntheticDataV2Page = lazy(() => import('./pages/demo/fiori/synthetic-data-v2'));
const SyntheticDataV3Page = lazy(() => import('./pages/demo/fiori/synthetic-data-v3'));

// PGE
const PGEInterconnectionPrototype = lazy(() => import('./pages/demo/fiori/pge-prototype/PGEInterconnectionPage'));

// Bayer
const BayerCollectionsPrototype = lazy(() => import('./pages/demo/fiori/bayer-prototype'));
const BayerARAccountPage = lazy(() => import('./pages/ui5/BayerARAccountPage'));
const BayerARCollectionsPage = lazy(() => import('./pages/ui5/BayerARCollectionsPage'));
const BayerARCollectionsCDOPage = lazy(() => import('./pages/ui5/BayerARCollectionsCDOPage'));
const BayerCollectionAgentPage = lazy(() => import('./pages/ui5/BayerCollectionAgentPage'));

/* ── Page registry ──────────────────────────────────────── */
const PAGE_MAP: Record<string, { title: string; description?: string; component: React.FC }> = {
  'home': { title: 'SAP Demo Gallery', description: 'Claude-built SAP Fiori prototypes', component: HomePage },
  // ALDI
  'demo/fiori/aldi-tm-planning': { title: 'Aldi — TM Planning Refinement', description: 'Real BD27/BD09 rules, horizontal tab navigation, package detail view, fully clickable end-to-end planner + admin flow.', component: AldiTMPlanningPage },
  'demo/fiori/aldi-tm-post-optimization': { title: 'Aldi — TM Post-Optimization (v1)', description: 'BTP companion to TM Cockpit — rules engine surfaces refinement recommendations on PLAN-A; planner accepts to produce PLAN-B.', component: AldiTMRefinementPage },
  'demo/fiori/aldi-tm-post-optimization-v2': { title: 'Aldi — TM Post-Optimization V2', description: 'Two-persona (Planner/Admin), restructured admin nav, simplified validation, correct approval logic.', component: AldiTMRefinementV2Page },
  // Synthetic Data
  'demo/fiori/synthetic-data-accelerator': { title: 'SAP Synthetic Data Accelerator', description: 'Enterprise experiment foundation — reusable data packs, 4-level fidelity ramp, model comparison, engagement flywheel.', component: SyntheticDataAcceleratorPage },
  'demo/fiori/synthetic-data-v2': { title: 'SAP Synthetic Data Accelerator v2', description: 'Live demo — real data generation (10K BP, 100K receivables), FK integrity, XGBoost ML, pack versioning. Northstar Manufacturing.', component: SyntheticDataV2Page },
  'demo/fiori/synthetic-data-v3': { title: 'SAP Synthetic Data Accelerator v3', description: 'PM-first flow — engagement workspace, customer context AI, plain-language technical recommendation, engineering handoff.', component: SyntheticDataV3Page },
  // PGE
  'demo/fiori/pge-interconnection': { title: 'PG&E Interconnection Intelligence', description: 'AI-powered Rule 21 interconnection workflow — worklist + project detail with HITL recommendation cards.', component: PGEInterconnectionPrototype },
  // Bayer
  'demo/fiori/bayer-collections': { title: 'Bayer AR Collections Assistant', description: 'AI-powered AR collections worklist — customer prioritization, account history, agent runs timeline.', component: BayerCollectionsPrototype },
  'demo/fiori/bayer-ar-account': { title: 'Bayer AR Account', description: 'Account-level AR detail view with aging breakdown and collection actions.', component: BayerARAccountPage },
  'demo/fiori/bayer-ar-collections': { title: 'Bayer AR Collections', description: 'Collections worklist with AI prioritization and dispute management.', component: BayerARCollectionsPage },
  'demo/fiori/bayer-ar-collections-cdo': { title: 'Bayer AR Collections CDO', description: 'CDO-focused AR dashboard with executive metrics and trend analysis.', component: BayerARCollectionsCDOPage },
  'demo/fiori/bayer-collection-agent': { title: 'Bayer Collection Agent', description: 'AI agent view — autonomous collection actions, reasoning trace, outcome tracking.', component: BayerCollectionAgentPage },
};

/* ── Nav items ───────────────────────────────────────────── */
const navItems: NavItem[] = [
  { key: 'home', label: 'Demo Gallery' },
  {
    kind: 'parent', key: 'aldi', label: 'ALDI', items: [
      { key: 'demo/fiori/aldi-tm-planning', label: 'TM Planning Refinement' },
      { key: 'demo/fiori/aldi-tm-post-optimization', label: 'TM Post-Optimization v1' },
      { key: 'demo/fiori/aldi-tm-post-optimization-v2', label: 'TM Post-Optimization V2' },
    ],
  },
  {
    kind: 'parent', key: 'synthetic', label: 'Synthetic Data', items: [
      { key: 'demo/fiori/synthetic-data-accelerator', label: 'Accelerator (Overview)' },
      { key: 'demo/fiori/synthetic-data-v2', label: 'Accelerator v2' },
      { key: 'demo/fiori/synthetic-data-v3', label: 'Accelerator v3' },
    ],
  },
  {
    kind: 'parent', key: 'pge', label: "PG&E", items: [
      { key: 'demo/fiori/pge-interconnection', label: 'Interconnection Intelligence' },
    ],
  },
  {
    kind: 'parent', key: 'bayer', label: 'Bayer', items: [
      { key: 'demo/fiori/bayer-collections', label: 'AR Collections Assistant' },
      { key: 'demo/fiori/bayer-ar-account', label: 'AR Account' },
      { key: 'demo/fiori/bayer-ar-collections', label: 'AR Collections' },
      { key: 'demo/fiori/bayer-ar-collections-cdo', label: 'AR Collections CDO' },
      { key: 'demo/fiori/bayer-collection-agent', label: 'Collection Agent' },
    ],
  },
];

/* ── User menu ───────────────────────────────────────────── */
const userMenuItems: UserMenuItemDef[] = [
  { key: 'settings', label: 'Settings', icon: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="1.1"/><path d="M13.3 8c0-.2 0-.4-.1-.6l1.4-1.1-1.5-2.6-1.7.7A5 5 0 0 0 10.2 4L10 2H6l-.2 2c-.4.2-.8.4-1.2.7l-1.7-.7L1.4 6.7l1.4 1.1C2.7 8 2.7 8.2 2.7 8c0 .2 0 .4.1.6L1.4 9.7l1.5 2.6 1.7-.7c.4.3.8.5 1.2.7L6 14h4l.2-1.7c.4-.2.8-.4 1.2-.7l1.7.7 1.5-2.6-1.4-1.1c.1-.2.1-.4.1-.6Z" stroke="currentColor" strokeWidth="1.1"/></svg>
  )},
  { key: 'about', label: 'About', icon: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.1"/><path d="M8 7v5M8 5v.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
  )},
];

const otherAccounts: UserMenuAccount[] = [
  { name: 'Alain Chevallier', subline1: 'User Experience Designer', subline2: 'Delivery Manager', initials: 'AC', active: true },
  { name: 'Sara Davis', subline1: 'Product Manager', subline2: 'Platform Team', initials: 'SD' },
];

/* ── Main app ─────────────────────────────────────────────── */
const Showcase: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const [selectedKey, setSelectedKey] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    return (page && PAGE_MAP[page]) ? page : 'home';
  });

  const isEmbed = new URLSearchParams(window.location.search).get('embed') === '1';
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuAnchorRef = useRef<HTMLButtonElement>(null);

  const themes: { label: string; value: Theme }[] = [
    { label: 'Morning', value: 'morning' },
    { label: 'Evening', value: 'evening' },
    { label: 'HC White', value: 'hcw' },
    { label: 'HC Black', value: 'hcb' },
  ];

  const current = PAGE_MAP[selectedKey];
  const PageComponent = current?.component ?? HomePage;
  const isHomePage = selectedKey === 'home';
  const isDemoPage = selectedKey.startsWith('demo/');

  const handleNavSelect = (key: string) => {
    setSelectedKey(key);
    const url = new URL(window.location.href);
    url.searchParams.set('page', key);
    window.history.pushState(null, '', url.toString());
  };

  React.useEffect(() => {
    const handler = (e: Event) => {
      const key = (e as CustomEvent<string>).detail;
      if (key && PAGE_MAP[key]) handleNavSelect(key);
    };
    window.addEventListener('fiori:navigate', handler);
    return () => window.removeEventListener('fiori:navigate', handler);
  }, []);

  if (isEmbed) {
    return <Suspense fallback={null}><PageComponent /></Suspense>;
  }

  if (isHomePage) {
    return (
      <div style={{ height: '100vh', overflow: 'auto' }}>
        <Suspense fallback={null}><PageComponent /></Suspense>
      </div>
    );
  }

  if (isDemoPage) {
    return <Suspense fallback={null}><PageComponent /></Suspense>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', background: 'var(--sap-page-bg, #f5f6f7)', fontFamily: 'var(--sap-font-family)' }}>
      <ShellBar
        productName="SAP Demo Gallery"
        secondaryTitle="Claude-built Prototypes"
        actions={
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {themes.map(t => (
              <button key={t.value} onClick={() => setTheme(t.value)}
                style={{
                  padding: '2px 8px', fontSize: '0.7rem', borderRadius: 4, cursor: 'pointer',
                  border: theme === t.value ? '2px solid #fff' : '1px solid rgba(255,255,255,0.4)',
                  background: theme === t.value ? 'rgba(255,255,255,0.2)' : 'transparent', color: '#fff',
                }}>
                {t.label}
              </button>
            ))}
          </div>
        }
        profile={
          <>
            <button ref={userMenuAnchorRef} onClick={() => setUserMenuOpen(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <Avatar initials="AC" color="2" size="sm" />
            </button>
            <UserMenu
              open={userMenuOpen}
              anchorElement={userMenuAnchorRef.current}
              onClose={() => setUserMenuOpen(false)}
              userName="Alain Chevallier"
              subline1="User Experience Designer"
              subline2="Delivery Manager"
              avatar={<Avatar initials="AC" color="2" size="lg" />}
              onManageAccounts={() => {}}
              otherAccounts={otherAccounts}
              menuItems={userMenuItems}
              onSignOut={() => setUserMenuOpen(false)}
            />
          </>
        }
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <SideNavigation
          items={navItems}
          selectedKey={selectedKey}
          onSelect={handleNavSelect}
        />
        <main style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '24px 32px' }}>
          <Suspense fallback={null}><PageComponent /></Suspense>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <FioriProvider theme="morning">
    <Showcase />
  </FioriProvider>
);

export default App;
