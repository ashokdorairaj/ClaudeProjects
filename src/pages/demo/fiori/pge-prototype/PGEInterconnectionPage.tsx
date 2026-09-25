// @ts-nocheck
import React, { useState, useMemo } from 'react';
import sapLogo from './sap-logo.png';
import PGEProjectDetailPage from './PGEProjectDetailPage';
import type { UIProject } from './data';
import { uiProjects } from './data';
import {
  ThemeProvider,
  ShellBar,
  Avatar,
  ResponsivePopover,
  List,
  ListItemStandard,
  Bar,
  DynamicPage,
  DynamicPageTitle,
  Toolbar,
  ToolbarSpacer,
  Button,
  Input,
  Select,
  Option,
  Table,
  TableHeaderRow,
  TableHeaderCell,
  TableRow,
  TableCell,
  ObjectStatus,
  FlexBox,
  Icon,
  Text,
  Title,
  ShellBarItem,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-react/styles.css';
import '@ui5/webcomponents-icons/dist/AllIcons.js';

// ─── Data ──────────────────────────────────────────────────────────────────────

const PROJECTS = uiProjects;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function agentAction(project: { rawId: string; agentStatusText: string; hasWorkflowOptimization: boolean }): { label: string; needsAction: boolean } {
  // 22 projects mapped to the 15 HITL cards from the merged Top 5 scenarios.
  // Customer Change Process (EIT)
  if (project.rawId === 'pge-001') return { label: 'Apply DGSP Template', needsAction: true };
  if (project.rawId === 'pge-002') return { label: 'Surface Lagging Team', needsAction: true };
  if (project.rawId === 'pge-003') return { label: 'Escalate — 40 BD Threshold', needsAction: true };
  // SR Agreement & Deposit
  if (project.rawId === 'pge-004') return { label: 'Send DocuSign Reminder', needsAction: true };
  if (project.rawId === 'pge-005') return { label: 'Chase Fault Current Deposit', needsAction: true };
  if (project.rawId === 'pge-006') return { label: 'Issue F.2.e Withdrawal Warning', needsAction: true };
  // Re-Study Cycles
  if (project.rawId === 'pge-007') return { label: 'Surface Re-study Cause', needsAction: true };
  if (project.rawId === 'pge-008') return { label: 'Flag Queue Stability', needsAction: true };
  if (project.rawId === 'pge-009') return { label: 'Escalate — SIS Envelope at Risk', needsAction: true };
  // Deemed-Withdrawal
  if (project.rawId === 'pge-010') return { label: 'Confirm IR Path', needsAction: true };
  if (project.rawId === 'pge-011') return { label: 'Confirm SR Path', needsAction: true };
  if (project.rawId === 'pge-012') return { label: 'Warn Applicant — F.2.d', needsAction: true };
  // Study Waivers
  if (project.rawId === 'pge-013') return { label: 'Offer Facilities Waiver', needsAction: true };
  if (project.rawId === 'pge-014') return { label: 'Last-Call — Waiver Window', needsAction: true };
  if (project.rawId === 'pge-015') return { label: 'Skip to GIA Tender', needsAction: true };
  // Reuses across pge-016 → pge-022
  if (project.rawId === 'pge-016') return { label: 'Apply DGSP Template', needsAction: true };
  if (project.rawId === 'pge-017') return { label: 'Send DocuSign Reminder', needsAction: true };
  if (project.rawId === 'pge-018') return { label: 'Issue F.2.e Withdrawal Warning', needsAction: true };
  if (project.rawId === 'pge-019') return { label: 'Confirm IR Path', needsAction: true };
  if (project.rawId === 'pge-020') return { label: 'Offer Facilities Waiver', needsAction: true };
  if (project.rawId === 'pge-021') return { label: 'Surface Re-study Cause', needsAction: true };
  if (project.rawId === 'pge-022') return { label: 'Surface Lagging Team', needsAction: true };
  // Fallbacks
  if (project.agentStatusText.includes('review AI insights')) return { label: 'Review AI Insights', needsAction: false };
  if (project.agentStatusText.includes('Paused')) return { label: 'Awaiting Decision', needsAction: false };
  if (project.hasWorkflowOptimization) return { label: 'Review & Act', needsAction: true };
  return { label: 'Analysis Complete', needsAction: false };
}

function slaTagDesign(status: string): 'Negative' | 'Critical' | 'Positive' {
  if (status === 'Breached') return 'Negative';
  if (status === 'At Risk') return 'Critical';
  return 'Positive';
}

function priorityDesign(priority: string): 'Negative' | 'Critical' | 'Positive' {
  if (priority === 'High') return 'Negative';
  if (priority === 'Medium') return 'Critical';
  return 'Positive';
}

// ─── Component ─────────────────────────────────────────────────────────────────

const PGEInterconnectionPage: React.FC<{ onHitlLibrary?: () => void }> = ({ onHitlLibrary }) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverOpener, setPopoverOpener] = useState<HTMLElement | null>(null);
  const [variantOpen, setVariantOpen] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<UIProject | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PROJECTS.filter(p => {
      const matchesSearch = !q ||
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.region.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q);
      const matchesFilter = filterStatus === 'All' || (filterStatus === 'Optimized' ? p.hasWorkflowOptimization : p.slaStatus === filterStatus);
      return matchesSearch && matchesFilter;
    });
  }, [search, filterStatus]);

  if (selectedProject) {
    return <PGEProjectDetailPage project={selectedProject} onBack={() => setSelectedProject(null)} />;
  }

  return (
    <ThemeProvider>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--sapBackgroundColor)' }}>

        {/* ── ShellBar ── */}
        <ShellBar
          logo={<img src={sapLogo} alt="SAP" style={{ height: 28 }} />}
          primaryTitle="PGE Interconnection Intelligence"
          showNotifications
          notificationsCount="3"
          profile={
            <Avatar slot="profile" colorScheme="6" shape="Circle" size="XS" initials="DU" accessibleName="DU — profile" />
          }
          onProfileClick={(e) => {
            setPopoverOpener(e.detail.targetRef as HTMLElement);
            setPopoverOpen(true);
          }}
        >
          <ShellBarItem icon="action-settings" text="Settings" />
          {onHitlLibrary && <ShellBarItem icon="developer-settings" text="HITL Library" onClick={onHitlLibrary} />}
        </ShellBar>

        <ResponsivePopover
          open={popoverOpen}
          opener={popoverOpener ?? undefined}
          placement="Bottom"
          onClose={() => setPopoverOpen(false)}
        >
          <List>
            <ListItemStandard icon="person-placeholder">My Profile</ListItemStandard>
            <ListItemStandard icon="action-settings">Settings</ListItemStandard>
            <ListItemStandard icon="log">Sign Out</ListItemStandard>
          </List>
        </ResponsivePopover>

        {/* ── Dynamic Page ── */}
        <DynamicPage
          style={{ flex: 1, overflow: 'hidden' }}
          showHideHeaderButton={false}
          headerContentPinnable={false}
          titleArea={
            <DynamicPageTitle
              style={{ paddingLeft: '48px', paddingRight: '48px' }}
              heading={
                <div
                  id="variantOpenerPGE"
                  onClick={() => setVariantOpen(!variantOpen)}
                  style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                >
                  <h2 style={{
                    fontFamily: '"72Black", "72Blackfull", "72", "72full", Arial, Helvetica, sans-serif',
                    fontSize: '24px',
                    fontWeight: 400,
                    color: 'var(--sapButton_TextColor, #0064d9)',
                    margin: 0,
                  }}>Standard</h2>
                  <svg width="12" height="12" viewBox="0 0 16 16" style={{ marginLeft: '6px', fill: 'var(--sapButton_TextColor, #0064d9)' }}>
                    <path d="M12.83 6.273a.75.75 0 0 1-.104 1.056l-4.247 3.5a.75.75 0 0 1-.954 0l-4.252-3.5a.75.75 0 0 1 .954-1.158l3.775 3.107 3.771-3.107a.75.75 0 0 1 1.056.102Z" />
                  </svg>
                </div>
              }
              actionsBar={
                <Toolbar>
                  <ToolbarSpacer />
                  <div id="shareMenuOpenerPGE" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShareMenuOpen(!shareMenuOpen)}>
                    <Icon name="action" style={{ color: 'var(--sapButton_TextColor)', fontSize: '1rem' }} />
                    <svg width="10" height="10" viewBox="0 0 16 16" style={{ marginLeft: '4px', fill: 'var(--sapButton_TextColor)' }}>
                      <path d="M12.83 6.273a.75.75 0 0 1-.104 1.056l-4.247 3.5a.75.75 0 0 1-.954 0l-4.252-3.5a.75.75 0 0 1 .954-1.158l3.775 3.107 3.771-3.107a.75.75 0 0 1 1.056.102Z" />
                    </svg>
                  </div>
                </Toolbar>
              }
            />
          }
        >

          {/* ── Table toolbar ── */}
          <Toolbar style={{ background: 'var(--sapList_HeaderBackground)', borderBottom: '1px solid var(--sapList_BorderColor)', height: '2.75rem' }}>
            <Title level="H5" wrappingType="Normal">Projects ({filtered.length})</Title>
            <ToolbarSpacer />
            <Input
              placeholder="Search..."
              value={search}
              onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
              style={{ width: 200 }}
            />
            <Select
              onChange={(e) => setFilterStatus(e.detail.selectedOption.value ?? 'All')}
              style={{ width: 160 }}
            >
              <Option value="All">All Statuses</Option>
              <Option value="Breached">Breached</Option>
              <Option value="At Risk">At Risk</Option>
              <Option value="On Track">On Track</Option>
              <Option value="Optimized">AI Optimized</Option>
            </Select>
            <Button icon="action-settings" design="Transparent" tooltip="Settings" />
          </Toolbar>

          {/* ── Table ── */}
          <Table
            noDataText="No projects match this filter"
            headerRow={
              <TableHeaderRow sticky>
                <TableHeaderCell width="120px"><span>Project #</span></TableHeaderCell>
                <TableHeaderCell><span>Project Name</span></TableHeaderCell>
                <TableHeaderCell width="90px"><span>Priority</span></TableHeaderCell>
                <TableHeaderCell width="110px"><span>SLA Status</span></TableHeaderCell>
                <TableHeaderCell width="110px"><span>Predicted Delay</span></TableHeaderCell>
                <TableHeaderCell width="90px"><span>Days in Phase</span></TableHeaderCell>
                <TableHeaderCell width="200px"><span>AI Recommended Action</span></TableHeaderCell>
                <TableHeaderCell width="32px" />
              </TableHeaderRow>
            }
          >
            {filtered.map(project => {
              const { label, needsAction } = agentAction(project);
              return (
                <TableRow
                  key={project.id}
                  rowKey={project.id}
                  interactive
                  onClick={() => setSelectedProject(project)}
                >
                  <TableCell><Text>{project.id}</Text></TableCell>

                  <TableCell>
                    <FlexBox direction="Column" style={{ gap: '0.125rem' }}>
                      <Text style={{ color: 'var(--sapLinkColor)', fontWeight: 'var(--sapFontBoldWeight)' }}>
                        {project.name}
                      </Text>
                      <Text style={{ fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>
                        {project.region} · {project.type}
                      </Text>
                    </FlexBox>
                  </TableCell>

                  <TableCell>
                    <ObjectStatus
                      state={priorityDesign(project.priority)}
                      inverted
                      showDefaultIcon
                    >
                      {project.priority}
                    </ObjectStatus>
                  </TableCell>

                  <TableCell>
                    <ObjectStatus
                      state={slaTagDesign(project.slaStatus)}
                      inverted
                      showDefaultIcon
                    >
                      {project.slaStatus}
                    </ObjectStatus>
                  </TableCell>

                  <TableCell>
                    <Text style={{
                      color: project.predictedDelay >= 30 ? 'var(--sapNegativeTextColor)' : project.predictedDelay > 0 ? 'var(--sapCriticalTextColor)' : 'var(--sapPositiveTextColor)',
                      fontWeight: 'var(--sapFontBoldWeight)',
                    }}>
                      {project.predictedDelay > 0 ? `+${project.predictedDelay}d` : '—'}
                    </Text>
                  </TableCell>

                  <TableCell>
                    <Text style={{
                      color: project.slaStatus === 'Breached' ? 'var(--sapNegativeTextColor)' : project.slaStatus === 'At Risk' ? 'var(--sapCriticalTextColor)' : undefined,
                    }}>
                      {project.daysInQueue}d
                    </Text>
                  </TableCell>

                  <TableCell>
                    {needsAction ? (
                      <FlexBox alignItems="Center" style={{ gap: '0.375rem' }}>
                        <Icon name="ai" style={{ color: 'var(--sapInformativeColor)', width: '1rem', height: '1rem' }} />
                        <Text style={{ color: 'var(--sapInformativeColor)', fontWeight: 'var(--sapFontBoldWeight)' }}>
                          {label}
                        </Text>
                      </FlexBox>
                    ) : (
                      <Text style={{ color: 'var(--sapContent_LabelColor)' }}>{label}</Text>
                    )}
                  </TableCell>

                  <TableCell>
                    <Icon name="slim-arrow-right" style={{ color: 'var(--sapContent_LabelColor)' }} />
                  </TableCell>
                </TableRow>
              );
            })}
          </Table>

        </DynamicPage>

        {/* ── Variant popover ── */}
        <ResponsivePopover
          open={variantOpen}
          opener="variantOpenerPGE"
          placement="Bottom"
          onClose={() => setVariantOpen(false)}
          headerText="My Views"
          style={{ minWidth: '20rem' }}
        >
          <List selectionMode="Single">
            <ListItemStandard selected>Standard</ListItemStandard>
          </List>
          <Bar
            slot="footer"
            endContent={
              <FlexBox style={{ gap: '0.5rem' }}>
                <Button design="Emphasized">Save As</Button>
                <Button design="Transparent">Manage</Button>
              </FlexBox>
            }
          />
        </ResponsivePopover>

        {/* ── Share popover ── */}
        <ResponsivePopover
          open={shareMenuOpen}
          opener="shareMenuOpenerPGE"
          placement="Bottom"
          onClose={() => setShareMenuOpen(false)}
        >
          <List>
            <ListItemStandard icon="email">Send E-Mail</ListItemStandard>
            <ListItemStandard icon="add-favorite">Save as Tile</ListItemStandard>
          </List>
        </ResponsivePopover>

      </div>
    </ThemeProvider>
  );
};

export default PGEInterconnectionPage;
