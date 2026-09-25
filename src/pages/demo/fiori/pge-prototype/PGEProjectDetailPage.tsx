// @ts-nocheck
import React, { useState } from 'react';
import sapLogo from './sap-logo.png';
import { ProjectHITLCard, getCardForProject, HealthyState } from './HITLLibrary';
import {
  ThemeProvider,
  ShellBar,
  Avatar,
  ResponsivePopover,
  List,
  ListItemStandard,
  ObjectPage,
  ObjectPageTitle,
  ObjectPageHeader,
  ObjectPageSection,
  Button,
  Icon,
  Tag,
  ObjectStatus,
  TabContainer,
  Tab,
  FlexBox,
  Toast,
  MessageStrip,
  Panel,
  Label,
  Text,
  Input,
  TextArea,
  Toolbar,
  ToolbarSpacer,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-react/styles.css';
import '@ui5/webcomponents-icons/dist/AllIcons.js';

import { getProjectStudyHistory, getProjectExceptions, getProjectAgentRun, getProjectActions, getProjectHITLDecisionLog, getProjectTaskLog, type UIProject } from './data';

// ─── Types ──────────────────────────────────────────────────────────────────────

export type { UIProject };

// Keep local alias for brevity
type Project = UIProject;

interface Props {
  project: UIProject;
  onBack: () => void;
}

// ─── Helpers (module scope) ─────────────────────────────────────────────────────

type SlaState = 'Negative' | 'Critical' | 'Positive';

function slaState(status: Project['slaStatus']): SlaState {
  if (status === 'Breached') return 'Negative';
  if (status === 'At Risk') return 'Critical';
  return 'Positive';
}

function slaTagDesign(status: Project['slaStatus']): 'Negative' | 'Critical' | 'Positive' {
  if (status === 'Breached') return 'Negative';
  if (status === 'At Risk') return 'Critical';
  return 'Positive';
}

// ─── Action type → icon map ─────────────────────────────────────────────────

function actionIcon(actionType: string): string {
  switch (actionType) {
    case 'WorkflowOptimization': return 'ai';
    case 'EscalateToManager':    return 'manager';
    case 'AssignReviewer':       return 'employee';
    case 'ApproveCostEstimate':  return 'approvals';
    case 'UpdateWorkflow':       return 'settings';
    case 'ExtendSLA':            return 'calendar';
    default:                     return 'learning-assistant';
  }
}

// ─── CTA label + icon derived from actionData (mirrors PGE controller logic) ──

interface CtaConfig { label: string; icon: string; }

function ctaFromAction(action: { actionType: string; actionData?: string } | undefined): CtaConfig {
  if (!action) return { label: 'Take Action', icon: 'play' };

  let d: Record<string, unknown> = {};
  try { d = action.actionData ? JSON.parse(action.actionData) : {}; } catch { /* invalid JSON */ }

  const blocking = ((d.blockingTaskName as string) || '').toLowerCase();
  const blocked  = ((d.blockedTaskName  as string) || '').toLowerCase();
  const bCode    = ((d.blockingTaskCode as string) || '').toLowerCase();
  const parallel = (d.parallelSuccessRate as number) ?? 0;
  const configTable = (d.configTable as string) || '';

  const isParallelStudy    = configTable === 'ZIEGI_TASK_DEP' || parallel >= 0.99;
  const isGispa            = blocking.includes('gispa') || blocking.includes('signature');
  const isIaSignature      = blocking.includes('negotiations') && blocking.includes('signature');
  const isDeficiency       = blocking.includes('deficiency') || blocking.includes('notice');
  const isNemDeficiency    = blocking.includes('nem') && blocking.includes('deficiency');
  const isInvoiceUnpaid    = blocking.includes('paid') || blocking.includes('invoice');
  const isWithdrawal       = blocked.includes('withdrawal') || blocking.includes('withdrawal');
  const isFasInitial       = blocking.includes('financial security') && blocking.includes('initial');
  const isFas              = blocking.includes('financial security') && !isFasInitial;
  const isDeadline         = blocking.includes('permission to operate') || bCode.includes('7503');

  if (isParallelStudy)  return { label: 'Approve Parallel Execution',   icon: 'accept' };
  if (isWithdrawal)     return { label: 'Log Applicant Call in ECC',     icon: 'phone' };
  if (isNemDeficiency)  return { label: 'Send Final Deficiency Notice',  icon: 'email' };
  if (isDeficiency)     return { label: 'Log Applicant Call in ECC',     icon: 'phone' };
  if (isIaSignature)    return { label: 'Send IA Signature Reminder',    icon: 'email' };
  if (isGispa)          return { label: 'Send DocuSign Reminder',        icon: 'email' };
  if (isInvoiceUnpaid)  return { label: 'Send Payment Demand',           icon: 'payment-approval' };
  if (isDeadline)       return { label: 'Assign Report Workstreams',     icon: 'document-text' };
  if (isFasInitial)     return { label: 'Start FAS Prep in ECC',         icon: 'create-entry-time' };
  if (isFas)            return { label: 'Submit Capital Orders in ECC',  icon: 'create-entry-time' };

  // Fall back to actionType-level defaults
  switch (action.actionType) {
    case 'EscalateToManager':   return { label: 'Escalate to Manager',   icon: 'manager' };
    case 'AssignReviewer':      return { label: 'Assign Reviewer',        icon: 'employee' };
    case 'ApproveCostEstimate': return { label: 'Approve Cost Estimate',  icon: 'approvals' };
    case 'TriggerDetailedStudy':return { label: 'Start the Study',        icon: 'play' };
    case 'UpdateWorkflow':      return { label: 'Update ECC',             icon: 'settings' };
    case 'ExtendSLA':           return { label: 'Extend SLA',             icon: 'calendar' };
    default:                    return { label: 'Update ECC',             icon: 'journey-arrive' };
  }
}

// ─── KPI tile (plain spans — avoids ui5-text inline-display collapse) ──────────

function KpiTile({ value, label, valueEl }: { value?: string; label: string; valueEl?: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: '0.5rem',
      padding: '0.75rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.125rem',
      background: 'var(--sapBaseColor)',
      border: '1px solid var(--sapList_BorderColor)',
    }}>
      {valueEl ?? (
        <span style={{
          fontFamily: 'var(--sapFontFamily,"72",Arial,sans-serif)',
          fontSize: 'var(--sapFontLargeSize)',
          fontWeight: 'var(--sapFontBoldWeight)',
          color: 'var(--sapTextColor)',
        }}>
          {value}
        </span>
      )}
      <span style={{
        fontFamily: 'var(--sapFontFamily,"72",Arial,sans-serif)',
        fontSize: 'var(--sapFontSmallSize)',
        color: 'var(--sapContent_LabelColor)',
      }}>
        {label}
      </span>
    </div>
  );
}

// ─── Pre-written email drafts keyed by `${rawId}:${actionType}` ────────────────

const EMAIL_DRAFTS: Record<string, { subject: string; body: string }> = {
  'pge-013:WorkflowOptimization': {
    subject: 'Payment Demand — PGE-2025-013 Bakersfield Solar Ranch — EA Invoices Overdue',
    body:
      `Dear Mr. Hassan,\n\n` +
      `This is a formal payment demand regarding three outstanding Engineering Assessment (EA) invoices tendered under your Interconnection Agreement for Bakersfield Solar Ranch (PGE-2025-013, 50 MW).\n\n` +
      `The following invoices were tendered on Business Day 5 following execution of the IA Negotiations / Customer Signature (Task 6215) and remain unpaid at day 18:\n\n` +
      `  • Task 6310 — IT Infrastructure EA Invoice\n` +
      `  • Task 6320 — SP&D EA Invoice\n` +
      `  • Task 6330 — Substation EA Invoice\n\n` +
      `Under Rule 21 Section 9.3, payment is due within 15 business days of invoice tender. All three invoices are now overdue. Until full payment is confirmed, PG&E is unable to initiate Task 4831 (Request: Capital Orders), which will directly delay your energization timeline by an estimated 15 business days.\n\n` +
      `Please arrange payment within 5 business days of this notice. Failure to do so may result in escalation to CPUC billing review and potential suspension of study activities.\n\n` +
      `If you have already initiated payment or require revised invoice documentation, please reply to this email or contact your assigned Interconnection Manager immediately.\n\n` +
      `Sincerely,\nPG&E Interconnection Services`,
  },
  'pge-001:WorkflowOptimization': {
    subject: 'SLA Breach Notice — PGE-2025-001 Elkhorn Solar Farm Phase II',
    body:
      `Dear Maria Chen,\n\n` +
      `We are writing to inform you that the System Impact Study for your project PGE-2025-001 (Elkhorn Solar Farm Phase II, 45 MW) has exceeded the applicable Rule 21 study timeline.\n\n` +
      `Your application entered the System Impact Study phase on 15 January 2025. The standard SLA is 90 days; the study is currently at day 142.\n\n` +
      `The delay is primarily due to thermal limit constraints identified on Feeder FDR-2201 (currently at 83% hosting capacity) requiring reconductoring analysis, compounded by resource constraints on our engineering team.\n\n` +
      `We are actively working to resolve these constraints. Co-engineer James Thornton has been assigned to support the voltage analysis. We expect to provide an updated completion timeline within 5 business days.\n\n` +
      `We sincerely apologize for the delay and appreciate your continued patience.\n\n` +
      `Sincerely,\nPG&E Interconnection Services`,
  },
  'pge-002:WorkflowOptimization': {
    subject: 'Cost Dispute Resolution Update — PGE-2025-002 Fresno Agricultural Solar Cluster',
    body:
      `Dear Robert Valdez,\n\n` +
      `We are writing regarding the ongoing cost estimate dispute (DISP-2025-0047) for project PGE-2025-002 (Fresno Agricultural Solar Cluster, 38.5 MW).\n\n` +
      `The dispute was filed on 5 August 2025 and has now been open for 85 days. As a result, the Agreement Review process remains on hold per Rule 21 Section 7.4, and we recognise that the ITC window of 31 December 2025 has been impacted.\n\n` +
      `We understand the $2.1M transformer T-CV07-B upgrade cost is a significant concern. Our engineering team has completed a detailed cost breakdown and would welcome a technical working session to review the scope and explore potential cost-sharing options.\n\n` +
      `We propose scheduling a call within the next 5 business days. Please reply to this email or contact your assigned Interconnection Manager directly.\n\n` +
      `We remain committed to resolving this dispute and advancing your project as quickly as possible.\n\n` +
      `Sincerely,\nPG&E Interconnection Services`,
  },
};

// ─── Component ──────────────────────────────────────────────────────────────────



const PGEProjectDetailPage: React.FC<Props> = ({ project, onBack }) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverOpener, setPopoverOpener] = useState<HTMLElement | null>(null);
  const [aiDismissed, setAiDismissed] = useState(false);
  const [cardDone, setCardDone] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailGenerating, setEmailGenerating] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<string[]>([]);

  const agentRun = getProjectAgentRun(project.rawId);
  const actions = getProjectActions(project.rawId).filter(a => String(a.isActive) === 'true');
  const hitlOptions: { id: string; label: string; description: string }[] =
    agentRun?.hitlOptions ? JSON.parse(agentRun.hitlOptions as string) : [];
  const isHitl = hitlOptions.length > 0;
  const showAiCard = project.hasWorkflowOptimization && (agentRun || actions.length > 0) && !aiDismissed;

  // CTA: HITL uses fixed label; standard uses scenario-detected label from primary action
  const primaryAction = actions.find(a => a.actionType === 'WorkflowOptimization') ?? actions[0];
  const cta = isHitl
    ? { label: 'Make Decision', icon: 'decision' }
    : ctaFromAction(primaryAction);

  const isEmailCta = ['email', 'payment-approval'].includes(cta.icon);

  const applyEmailDraft = (action: typeof primaryAction) => {
    if (!action) return;
    const key = `${project.rawId}:${action.actionType}`;
    const draft = EMAIL_DRAFTS[key];
    if (draft) {
      setEmailSubject(draft.subject);
      setEmailBody(draft.body);
    } else {
      setEmailSubject(`${action.title} — ${project.id}`);
      setEmailBody(
        `Dear ${project.applicant ?? 'Applicant'},\n\n` +
        `This is a notice regarding your interconnection application ${project.id} — ${project.name}.\n\n` +
        `${agentRun?.summary ?? action.description}\n\n` +
        `Please respond or take the required action at your earliest convenience.\n\n` +
        `Best regards,\nPG&E Interconnection Team`
      );
    }
  };

  const handleCtaClick = () => {
    if (isEmailCta && primaryAction) {
      setEmailTo(project.applicant ?? '');
      setEmailBody('');
      setEmailOpen(true);
      setEmailGenerating(true);
      setTimeout(() => {
        applyEmailDraft(primaryAction);
        setEmailGenerating(false);
      }, 900);
    } else {
      setToastMsg(`${cta.label} initiated for ${project.id}.`);
      setToastOpen(true);
      setAiDismissed(true);
    }
  };

  const handleGenerateEmail = () => {
    if (!primaryAction) return;
    setEmailGenerating(true);
    setTimeout(() => {
      applyEmailDraft(primaryAction);
      setEmailGenerating(false);
    }, 900);
  };

  const rawHistory = getProjectStudyHistory(project.rawId);
  const hitlLog = getProjectHITLDecisionLog(project.rawId);
  const phaseTasks = getProjectTaskLog(project.rawId);

  // Full Rule 21 Detailed study path — all phases in order
  const FULL_PHASE_SEQUENCE = [
    'Application',
    'Initial Review (IR)',
    'Supplemental Review (SR)',
    'System Impact Study (SIS)',
    'Facilities Study (FAS)',
    'E&P Agreement',
    'Interconnection Agreement (IA)',
    'Implementation',
    'Project Execution & Closeout',
  ];

  const historyByPhase = rawHistory.reduce<Record<string, typeof rawHistory[0]>>((acc, h) => {
    acc[h.studyPhase] = h;
    return acc;
  }, {});

  // Find the index of the last phase that has a history record (the furthest the project has reached)
  const lastReachedIdx = FULL_PHASE_SEQUENCE.reduce((maxIdx, phase, idx) => {
    return historyByPhase[phase] ? idx : maxIdx;
  }, -1);

  const studyRows: { phase: string; start: string; end: string; days: number | null; status: string; future: boolean }[] = rawHistory.length > 0
    ? FULL_PHASE_SEQUENCE.flatMap((phase, idx) => {
        const h = historyByPhase[phase];
        if (h) {
          return [{
            phase,
            start: h.startDate,
            end: (h as { completedDate?: string }).completedDate ?? '—',
            days: (h as { daysToComplete?: number }).daysToComplete ?? project.daysInQueue,
            status: h.status === 'Completed' || h.status === 'C' ? 'Completed' : 'In Progress',
            future: false,
          }];
        }
        // Only show as a future phase if it comes after the last reached phase
        // Phases before the current point with no record were skipped — hide them
        if (idx > lastReachedIdx) {
          return [{ phase, start: '—', end: '—', days: null, status: 'Pending', future: true }];
        }
        return []; // skipped phase — omit from history
      })
    : [{ phase: project.studyPhase, start: '—', end: '—', days: project.daysInQueue, status: 'In Progress', future: false }];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _rawExceptions = getProjectExceptions(project.rawId);

  return (
    <ThemeProvider>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--sapTile_Background)' }}>

        {/* ── ShellBar ── */}
        <ShellBar
          logo={<img src={sapLogo} alt="SAP" style={{ height: 28 }} />}
          primaryTitle="PGE Interconnection Intelligence"
          profile={
            <Avatar slot="profile" colorScheme="Accent6" shape="Circle" size="XS" initials="DU" accessibleName="DU — profile" />
          }
          onProfileClick={(e) => {
            setPopoverOpener(e.detail.targetRef as HTMLElement);
            setPopoverOpen(true);
          }}
          startButton={
            <Button icon="nav-back" design="Transparent" onClick={onBack} tooltip="Back to Projects" />
          }
        />

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

        {/* ── ObjectPage ── */}
        <ObjectPage
          style={{ flex: 1, overflow: 'hidden' }}
          titleArea={
            <ObjectPageTitle
              actionsBar={
                <Toolbar design="Transparent">
                  <ToolbarSpacer />
                  <Button icon="action" design="Transparent" tooltip="Share" />
                  <Button icon="slim-arrow-down" design="Transparent" tooltip="More" />
                </Toolbar>
              }
            >
              <span slot="heading" style={{
                fontFamily: '"72Black", "72Blackfull", "72", "72full", Arial, Helvetica, sans-serif',
                fontSize: 'var(--sapFontHeader2Size)',
                fontWeight: 'var(--sapFontBoldWeight)',
                color: 'var(--sapTextColor)',
              }}>
                {project.name}
              </span>
              <span slot="subheading" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Tag design={slaTagDesign(project.slaStatus)}>{project.slaStatus}</Tag>
                {project.priority && (
                  <Tag design={project.priority === 'High' ? 'Negative' : project.priority === 'Medium' ? 'Critical' : 'Positive'}>
                    {project.priority}
                  </Tag>
                )}
              </span>
            </ObjectPageTitle>
          }
          headerArea={
            <ObjectPageHeader>
              <FlexBox alignItems="Center" wrap="Wrap" style={{ gap: '0.5rem' }}>
                <Label>Project ID:</Label>
                <Text>{project.id}</Text>
                <Text style={{ color: 'var(--sapContent_ForegroundBorderColor)', padding: '0 0.25rem' }}>|</Text>
                <Label>Type:</Label>
                <Text>{project.type} · {project.region}</Text>
                <Text style={{ color: 'var(--sapContent_ForegroundBorderColor)', padding: '0 0.25rem' }}>|</Text>
                <Label>Engineer:</Label>
                <Text style={{ fontWeight: 'var(--sapFontBoldWeight)' }}>{project.assignedEngineer || '—'}</Text>
                <Text style={{ color: 'var(--sapContent_ForegroundBorderColor)', padding: '0 0.25rem' }}>|</Text>
                <Label>Contact:</Label>
                <Text style={{ fontWeight: 'var(--sapFontBoldWeight)' }}>{project.applicant || '—'}</Text>
                <Text style={{ color: 'var(--sapContent_ForegroundBorderColor)', padding: '0 0.25rem' }}>|</Text>
                <Label>Days in phase:</Label>
                <Text style={{
                  fontWeight: 'var(--sapFontBoldWeight)',
                  color: project.slaStatus === 'Breached' ? 'var(--sapNegativeTextColor)' : project.slaStatus === 'At Risk' ? 'var(--sapCriticalTextColor)' : 'var(--sapTextColor)',
                }}>{project.daysInQueue}</Text>
              </FlexBox>
            </ObjectPageHeader>
          }
        >
          <ObjectPageSection id="content" titleText="Content" hideTitleText>
          <div style={{ display: 'flex', flexDirection: 'row', gap: '1.5rem', alignItems: 'flex-start' }}>

            {/* Left column — AI cards */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* AI Decision Card — sourced exclusively from the HITL Library */}
            {getCardForProject(project.rawId) ? (
              <ProjectHITLCard projectId={project.rawId} />
            ) : (
              <HealthyState />
            )}

            {/* Show success illustration below the card once action is complete */}
            {cardDone && <HealthyState />}

            </div>{/* end left column */}

            {/* Right column — sticky context panel */}
            <div style={{ width: 450, flexShrink: 0, position: 'sticky', top: 0, height: '100vh', borderLeft: '1px solid var(--sapList_BorderColor)' }}>
              <TabContainer
                style={{ width: '100%', height: '100%' }}
                contentBackgroundDesign="Transparent"
                onTabSelect={() => {}}
              >

                {/* ── WHY ── The gap: cause · current state · cost of inaction */}
                <Tab text="Summary" data-key="summary">
                  <div style={{ padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* 1 — Cause: one sentence, dominant */}
                    {project.blockingReason && (
                      <div style={{
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        background: 'var(--sapBackgroundColor)',
                        border: '1px solid var(--sapList_BorderColor)',
                      }}>
                        <span style={{
                          fontFamily: 'var(--sapFontFamily,"72",Arial,sans-serif)',
                          fontSize: 'var(--sapFontSize)',
                          fontWeight: 'var(--sapFontBoldWeight)',
                          color: 'var(--sapTextColor)',
                          display: 'block',
                        }}>
                          {project.blockingReason}
                        </span>
                      </div>
                    )}

                    {/* 2 — Current state: SLA + days */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.25rem',
                      borderRadius: '0.5rem',
                      background: 'var(--sapBackgroundColor)',
                      border: '1px solid var(--sapList_BorderColor)',
                    }}>
                      <span style={{ fontFamily: 'var(--sapFontFamily,"72",Arial,sans-serif)', fontSize: 'var(--sapFontSize)', color: 'var(--sapContent_LabelColor)' }}>SLA</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <span style={{
                          fontFamily: 'var(--sapFontFamily,"72",Arial,sans-serif)',
                          fontSize: 'var(--sapFontLargeSize)',
                          fontWeight: 'var(--sapFontBoldWeight)',
                          color: 'var(--sapTextColor)',
                        }}>{project.daysInQueue}d</span>
                        <span style={{ fontFamily: 'var(--sapFontFamily,"72",Arial,sans-serif)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{project.slaStatus}</span>
                      </div>
                    </div>

                    {/* 3 — Cost of inaction */}
                    {project.predictedDelay > 0 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem 1.25rem',
                        borderRadius: '0.5rem',
                        background: 'var(--sapBackgroundColor)',
                        border: '1px solid var(--sapList_BorderColor)',
                      }}>
                        <span style={{ fontFamily: 'var(--sapFontFamily,"72",Arial,sans-serif)', fontSize: 'var(--sapFontSize)', color: 'var(--sapContent_LabelColor)' }}>Inaction costs</span>
                        <span style={{
                          fontFamily: 'var(--sapFontFamily,"72",Arial,sans-serif)',
                          fontSize: 'var(--sapFontLargeSize)',
                          fontWeight: 'var(--sapFontBoldWeight)',
                          color: 'var(--sapTextColor)',
                        }}>+{project.predictedDelay}d</span>
                      </div>
                    )}

                  </div>
                </Tab>

                {/* ── HISTORY ── Prior decisions on this project */}
                <Tab text="History" data-key="history">
                  <div style={{ display: 'flex', flexDirection: 'column' }}>

                    {/* Phase timeline — compact, read-only */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5rem 1fr 4.5rem 4.5rem 3rem', padding: '0.5rem 1rem 0.375rem', borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                      <span />
                      {['Phase', 'Start', 'End', 'Days'].map(h => (
                        <span key={h} style={{ fontFamily: 'var(--sapFontFamily,"72",Arial,sans-serif)', fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapContent_LabelColor)' }}>{h}</span>
                      ))}
                    </div>
                    {studyRows.map((row) => {
                      const isActive = row.status === 'In Progress';
                      const isFuture = row.future;
                      const rowTasks = phaseTasks.filter(t => t.studyPhase === row.phase);
                      const phaseHITL = hitlLog.filter(h => h.studyPhase === row.phase);
                      const hasDetail = rowTasks.length > 0 || phaseHITL.length > 0;
                      const isExpanded = expandedPhases.includes(row.phase);

                      return (
                        <div key={row.phase}>
                          {/* Phase row */}
                          <button
                            onClick={() => hasDetail && setExpandedPhases(prev =>
                              prev.includes(row.phase) ? prev.filter(p => p !== row.phase) : [...prev, row.phase]
                            )}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1.5rem 1fr 4.5rem 4.5rem 3rem',
                              width: '100%',
                              padding: '0.5rem 1rem',
                              borderBottom: '1px solid var(--sapList_BorderColor)',
                              borderLeft: isActive ? '2px solid var(--sapTextColor)' : '2px solid transparent',
                              borderTop: 'none',
                              borderRight: 'none',
                              opacity: isFuture ? 0.35 : 1,
                              alignItems: 'center',
                              background: 'transparent',
                              cursor: hasDetail ? 'pointer' : 'default',
                              textAlign: 'left',
                            }}
                          >
                            {/* Chevron */}
                            {hasDetail ? (
                              <svg width="10" height="10" viewBox="0 0 10 10" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0, color: 'var(--sapContent_LabelColor)' }}>
                                <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : (
                              <span />
                            )}
                            <span style={{
                              fontFamily: 'var(--sapFontFamily,"72",Arial,sans-serif)',
                              fontSize: 'var(--sapFontSmallSize)',
                              fontWeight: isActive ? 'var(--sapFontBoldWeight)' : undefined,
                              color: 'var(--sapTextColor)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>{row.phase}</span>
                            <span style={{ fontFamily: 'var(--sapFontFamily,"72",Arial,sans-serif)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>
                              {row.start !== '—' ? row.start.slice(0, 7) : '—'}
                            </span>
                            <span style={{ fontFamily: 'var(--sapFontFamily,"72",Arial,sans-serif)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>
                              {row.end !== '—' ? row.end.slice(0, 7) : '—'}
                            </span>
                            <span style={{ fontFamily: 'var(--sapFontFamily,"72",Arial,sans-serif)', fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', textAlign: 'right' }}>
                              {row.days != null ? `${row.days}d` : '—'}
                            </span>
                          </button>

                          {/* Expanded: tasks + HITL log */}
                          {isExpanded && hasDetail && (
                            <div style={{
                              borderLeft: '2px solid var(--sapList_BorderColor)',
                              marginLeft: '1.5rem',
                              borderBottom: '1px solid var(--sapList_BorderColor)',
                            }}>
                              {/* Task rows */}
                              {rowTasks.map(task => {
                                const isDone = task.status_code === 'C';
                                const isRunning = task.status_code === 'A';
                                return (
                                  <div key={task.ID} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1rem 2.5rem 1fr 4.5rem 4.5rem',
                                    padding: '0.3rem 1rem',
                                    gap: '0 0.5rem',
                                    alignItems: 'center',
                                    borderBottom: '1px solid var(--sapList_BorderColor)',
                                    opacity: task.status_code === 'P' ? 0.45 : 1,
                                  }}>
                                    {/* Status dot */}
                                    <span style={{
                                      width: 6, height: 6,
                                      borderRadius: '50%',
                                      background: isDone ? 'var(--sapPositiveColor)' : isRunning ? 'var(--sapCriticalColor)' : 'var(--sapContent_LabelColor)',
                                      display: 'inline-block',
                                      flexShrink: 0,
                                    }} />
                                    <span style={{ fontFamily: 'var(--sapFontFamily,"72",Arial,sans-serif)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{task.taskCode}</span>
                                    <span style={{ fontFamily: 'var(--sapFontFamily,"72",Arial,sans-serif)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.taskName}</span>
                                    <span style={{ fontFamily: 'var(--sapFontFamily,"72",Arial,sans-serif)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>
                                      {task.startDate ? task.startDate.slice(5) : '—'}
                                    </span>
                                    <span style={{ fontFamily: 'var(--sapFontFamily,"72",Arial,sans-serif)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>
                                      {task.completedDate ? task.completedDate.slice(5) : isRunning ? 'active' : '—'}
                                    </span>
                                  </div>
                                );
                              })}
                              {/* HITL log entries — separator if tasks also shown */}
                              {phaseHITL.map(entry => (
                                <div key={entry.ID} style={{
                                  display: 'flex',
                                  gap: '0.375rem',
                                  padding: '0.3rem 1rem',
                                  alignItems: 'center',
                                  flexWrap: 'wrap',
                                }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--sapInformativeColor)', display: 'inline-block', flexShrink: 0 }} />
                                  <span style={{ fontFamily: 'var(--sapFontFamily,"72",Arial,sans-serif)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{entry.timestamp.slice(0, 10)}</span>
                                  <span style={{ fontFamily: 'var(--sapFontFamily,"72",Arial,sans-serif)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>·</span>
                                  <span style={{ fontFamily: 'var(--sapFontFamily,"72",Arial,sans-serif)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{entry.taskCode} · AI {entry.cardType}</span>
                                  <span style={{ fontFamily: 'var(--sapFontFamily,"72",Arial,sans-serif)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>·</span>
                                  <span style={{ fontFamily: 'var(--sapFontFamily,"72",Arial,sans-serif)', fontSize: 'var(--sapFontSmallSize)', color: entry.decision === 'PENDING' ? 'var(--sapCriticalColor)' : entry.decision === 'APPROVED' ? 'var(--sapPositiveColor)' : 'var(--sapContent_LabelColor)' }}>
                                    {entry.decision === 'PENDING' ? 'Awaiting decision' : entry.decision}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                  </div>
                </Tab>

              </TabContainer>
            </div>{/* end right column */}

          </div>
          </ObjectPageSection>
        </ObjectPage>

        {/* Toast */}
        <Toast open={toastOpen} duration={3000} placement="BottomCenter" onClose={() => setToastOpen(false)}>
          {toastMsg || 'Action initiated successfully.'}
        </Toast>

      </div>
    </ThemeProvider>
  );
};

export default PGEProjectDetailPage;
