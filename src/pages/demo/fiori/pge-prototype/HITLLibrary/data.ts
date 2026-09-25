// ── HITL Card Data — Merged Top 5 from UX vs. Engineering Debate ─────────────
// Source: CategoryComparisonVsEngPage.tsx FINAL_VERDICT
// 5 scenarios × 3 cards each = 15 cards total

export interface HITLCardData {
  id: string;
  phase: string;
  phaseCode: string;
  scenario: string;
  scenarioDetail: string;
  title: string;
  trigger: string;
  taskCode: string;
  threshold: string;
  description: string;
  recommendedAction: string;
  owner: string;
  actionType: 'email' | 'escalate' | 'nudge' | 'system' | 'acknowledge';
  impact: 'high' | 'medium' | 'low';
  measurability: 'immediate' | 'short-term' | 'long-term';
  prioritized: boolean;
  confidence: 'provable' | 'pending-question';
}

export const PHASES_META: { code: string; name: string; shortName: string; prioritized: boolean; scope: 'fde-1' | 'future' }[] = [
  { code: 'EGI03000', name: 'Engineering, Initiation & Tracking (EIT)', shortName: 'EIT', prioritized: true, scope: 'fde-1' },
  { code: 'EGI02200', name: 'Supplemental Review (SR)', shortName: 'SR', prioritized: true, scope: 'fde-1' },
  { code: 'EGI02000', name: 'Initial Review (IR)', shortName: 'IR', prioritized: true, scope: 'fde-1' },
  { code: 'EGI03600', name: 'Facilities Study (FAS)', shortName: 'FAS', prioritized: true, scope: 'fde-1' },
];

export const CARDS: HITLCardData[] = [
  // ═══════════════════════════════════════════════════════════════════════════════
  // Scenario #1 — Customer Change Process (3 cards)
  // EIT (EGI03000) → Detailed Study handoff. 30% of critical path.
  // ═══════════════════════════════════════════════════════════════════════════════

  {
    id: 'EGI03000-010',
    phase: 'EIT', phaseCode: 'EGI03000',
    scenario: 'Customer Change Process', scenarioDetail: 'Customer Change initiated',
    title: 'Customer Change initiated',
    trigger: 'Task EGI03000-3050 opened OR scope modification request received',
    taskCode: '3050', threshold: 'On open',
    description: 'A customer-initiated scope change has entered the Detailed Study coordination loop. Without intervention, this becomes the 40 BD bottleneck that consumes 30% of project critical path.',
    recommendedAction: 'Confirm DGSP template applies; if yes, one-click apply pre-approved template and notify customer.',
    owner: 'Interconnection Manager',
    actionType: 'acknowledge',
    impact: 'high', measurability: 'immediate', prioritized: true, confidence: 'provable',
  },
  {
    id: 'EGI03000-020',
    phase: 'EIT', phaseCode: 'EGI03000',
    scenario: 'Customer Change Process', scenarioDetail: 'DGSP coordination cycle stalled',
    title: 'DGSP coordination cycle stalled',
    trigger: 'Task 3050 open >15 BD with no team-state change in 5 BD',
    taskCode: '3050', threshold: '15 BD',
    description: 'The DGSP review chain is bouncing between Distribution Engineering, Substation Engineering, and the customer\u2019s contractor. No team has progressed in 5 days. Today the IM finds out only when the customer escalates.',
    recommendedAction: 'Surface the lagging team; offer escalation to single-point-of-contact resolution path.',
    owner: 'Interconnection Manager + DGSP Liaison',
    actionType: 'escalate',
    impact: 'high', measurability: 'short-term', prioritized: true, confidence: 'provable',
  },
  {
    id: 'EGI03000-030',
    phase: 'EIT', phaseCode: 'EGI03000',
    scenario: 'Customer Change Process', scenarioDetail: 'Approaching 40 BD threshold',
    title: 'Customer Change approaching 40 BD threshold',
    trigger: 'Task 3050 open >30 BD',
    taskCode: '3050', threshold: '30 BD',
    description: 'Critical: the project is at risk of cascading SIS deadline failure. The 60 BD SIS clock cannot legally start on time if EIT closes after day 40.',
    recommendedAction: 'Critical alert — escalate to Engineering Director; project at risk of cascading SIS deadline failure.',
    owner: 'Interconnection Manager',
    actionType: 'escalate',
    impact: 'high', measurability: 'immediate', prioritized: true, confidence: 'provable',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // Scenario #2 — SR Agreement & Deposit (3 cards)
  // SR (EGI02200) → SR execution start. Two regulatory clocks.
  // ═══════════════════════════════════════════════════════════════════════════════

  {
    id: 'EGI02200-010',
    phase: 'SR', phaseCode: 'EGI02200',
    scenario: 'SR Agreement & Deposit', scenarioDetail: 'SR Agreement signature warning',
    title: 'SR Agreement signature window — warning',
    trigger: 'Task 2210 (SR Agreement signed) open >7 BD after tender',
    taskCode: '2210', threshold: '7 BD',
    description: 'The SR Agreement has been tendered but not signed. Three business days remain before the regulatory clock takes a hit. Common cause: signing authority is on leave or the agreement is sitting in the wrong inbox.',
    recommendedAction: 'Draft one-click DocuSign reminder; flag remaining 3 BD before regulatory clock impact.',
    owner: 'Interconnection Manager',
    actionType: 'email',
    impact: 'high', measurability: 'immediate', prioritized: true, confidence: 'provable',
  },
  {
    id: 'EGI02200-020',
    phase: 'SR', phaseCode: 'EGI02200',
    scenario: 'SR Agreement & Deposit', scenarioDetail: 'Fault Current Deposit not received',
    title: 'Fault Current Deposit not received',
    trigger: 'Task 2213 open >7 BD after SR Agreement tendered',
    taskCode: '2213', threshold: '7 BD',
    description: 'The Fault Current Study Deposit has not landed. The 15 BD F.2.c.i SR execution clock cannot begin until both agreement and deposit are received.',
    recommendedAction: 'Chase deposit so the 15 BD F.2.c.i SR execution clock can begin; surface payment link.',
    owner: 'Interconnection Manager + Customer Account Owner',
    actionType: 'email',
    impact: 'high', measurability: 'immediate', prioritized: true, confidence: 'provable',
  },
  {
    id: 'EGI02200-030',
    phase: 'SR', phaseCode: 'EGI02200',
    scenario: 'SR Agreement & Deposit', scenarioDetail: 'GIA 90 CD auto-withdrawal warning',
    title: 'GIA signing — auto-withdrawal warning',
    trigger: 'GIA tendered, no signature received at 75 CD; 90 CD = legal death',
    taskCode: 'GIA', threshold: '75 CD / 90 CD',
    description: 'Rule 21 F.2.e: at 90 calendar days post-GIA tender with no signature, the project is automatically deemed withdrawn. This is the regulatory cliff with the longest fuse and the highest cost of failure.',
    recommendedAction: 'Issue Rule 21 F.2.e auto-withdrawal warning to applicant; offer extension if customer responsive.',
    owner: 'Interconnection Manager (escalate to Director at 85 CD)',
    actionType: 'escalate',
    impact: 'high', measurability: 'long-term', prioritized: true, confidence: 'provable',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // Scenario #3 — Re-Study Cycles (3 cards)
  // IR + SR (EGI02000-2091, EGI02200-2291). 14–24 BD silently consumed.
  // ═══════════════════════════════════════════════════════════════════════════════

  {
    id: 'EGI02000-090',
    phase: 'IR', phaseCode: 'EGI02000',
    scenario: 'Re-Study Cycles', scenarioDetail: 'Re-study cycle 2 initiated',
    title: 'Re-study cycle initiated (cycle 2)',
    trigger: 'Task 2091 OR 2291 opened after first cycle complete',
    taskCode: '2091, 2291', threshold: 'On open',
    description: 'A second study cycle has begun, typically because system data went stale or queue position changed. Today this is invisible until the 60 BD whole-study deadline starts looking impossible.',
    recommendedAction: 'Surface the data-staleness reason; offer escalate-or-accept decision with downstream timeline impact.',
    owner: 'Interconnection Manager + Planning Engineer',
    actionType: 'acknowledge',
    impact: 'high', measurability: 'short-term', prioritized: true, confidence: 'provable',
  },
  {
    id: 'EGI02000-091',
    phase: 'IR', phaseCode: 'EGI02000',
    scenario: 'Re-Study Cycles', scenarioDetail: 'Queue position change trigger',
    title: 'Re-study triggered by queue position change',
    trigger: 'Re-study task opened AND queue position changed in last 30 BD',
    taskCode: '2091, 2291', threshold: '30 BD',
    description: 'Re-study was triggered because projects ahead in queue moved positions, invalidating the original analysis. This is a candidate for queue stability protocol intervention.',
    recommendedAction: 'Flag for queue stability protocol review; surface affected projects.',
    owner: 'Interconnection Manager',
    actionType: 'system',
    impact: 'medium', measurability: 'short-term', prioritized: true, confidence: 'provable',
  },
  {
    id: 'EGI03400-040',
    phase: 'SR', phaseCode: 'EGI02200',
    scenario: 'Re-Study Cycles', scenarioDetail: 'SIS 60 BD envelope at risk',
    title: 'SIS 60 BD envelope at risk from re-studies',
    trigger: 'BD 40 of 60 with re-study active',
    taskCode: 'SIS', threshold: '40/60 BD',
    description: 'Re-study activity inside the SIS window is consuming runway. At BD 40 of 60 with a re-study still active, the Rule 21 F.3.b.ii regulatory deadline is at material risk.',
    recommendedAction: 'Escalate to Engineering Director — Rule 21 F.3.b.ii regulatory deadline at material risk.',
    owner: 'Interconnection Manager + Engineering Director',
    actionType: 'escalate',
    impact: 'high', measurability: 'short-term', prioritized: true, confidence: 'provable',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // Scenario #4 — Deemed-Withdrawal Cards (3 cards)
  // IR (EGI02000) + SR (EGI02200). Binary regulatory cliffs.
  // ═══════════════════════════════════════════════════════════════════════════════

  {
    id: 'EGI02000-020',
    phase: 'IR', phaseCode: 'EGI02000',
    scenario: 'Deemed-Withdrawal', scenarioDetail: 'IR Options Decision overdue',
    title: 'IR Options Decision overdue',
    trigger: 'Task 2020 open >5 BD after IR results; 8 BD = imminent withdrawal warning',
    taskCode: '2020', threshold: '5 BD / 8 BD / 10 BD',
    description: 'Rule 21 F.2.a: the applicant has 10 business days to elect a path (Meeting / SR / IA) after IR results. Failure to elect = automatic deemed withdrawal. The config table has zero alerts on this response-side task today.',
    recommendedAction: 'Confirm path election (Meeting / SR / IA) before 10 BD F.2.a auto-withdrawal.',
    owner: 'Interconnection Manager + Applicant',
    actionType: 'email',
    impact: 'high', measurability: 'immediate', prioritized: true, confidence: 'provable',
  },
  {
    id: 'EGI02200-040',
    phase: 'SR', phaseCode: 'EGI02200',
    scenario: 'Deemed-Withdrawal', scenarioDetail: 'SR Path Decision overdue',
    title: 'SR Path Decision overdue',
    trigger: 'Task 2225 open >10 BD after SR results; 15 BD = F.2.c withdrawal',
    taskCode: '2225', threshold: '10 BD / 15 BD',
    description: 'Rule 21 F.2.c: applicant must elect SR path within 15 BD. Highest fan-in (12) of any blind-spot task in the entire FDE 1 scope. Mirror of the IR cliff, one phase later.',
    recommendedAction: 'Confirm path with applicant; offer one extension of 15 BD if needed.',
    owner: 'Interconnection Manager',
    actionType: 'email',
    impact: 'high', measurability: 'immediate', prioritized: true, confidence: 'provable',
  },
  {
    id: 'EGI02200-050',
    phase: 'SR', phaseCode: 'EGI02200',
    scenario: 'Deemed-Withdrawal', scenarioDetail: 'IA Request not initiated',
    title: 'IA Request not initiated post-decision',
    trigger: 'Task 2240 not started 15 BD after SR Results Meeting; 20 BD = withdrawal',
    taskCode: '2240', threshold: '15 BD / 20 BD',
    description: 'Rule 21 F.2.d: the applicant has 20 BD to initiate the IA request after the SR Results Meeting. Pure handoff failure pattern: study complete, decision made, button never pressed.',
    recommendedAction: 'Warn customer of impending F.2.d auto-withdrawal at day 20.',
    owner: 'Interconnection Manager',
    actionType: 'email',
    impact: 'high', measurability: 'immediate', prioritized: true, confidence: 'provable',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // Scenario #5 — Study Waivers (3 cards)
  // FAS (EGI03600). Rule 21 F.3.b.vi. 60 BD recovery × 20–30% of projects.
  // ═══════════════════════════════════════════════════════════════════════════════

  {
    id: 'EGI03600-010',
    phase: 'FAS', phaseCode: 'EGI03600',
    scenario: 'Study Waivers', scenarioDetail: 'Facilities Study Waiver eligible',
    title: 'Facilities Study Waiver eligible',
    trigger: 'System Impact Study complete AND zero Distribution Upgrades identified',
    taskCode: 'SIS-result', threshold: 'On SIS completion',
    description: 'Rule 21 F.3.b.vi grants a Facilities Study waiver path: if SIS identifies no Distribution Upgrades, both parties can mutually agree to skip the 60 BD Facilities Study. Industry data: 20–30% of projects eligible. Today the option is invisible.',
    recommendedAction: 'One-click waiver offer to applicant; surfaces 60 BD recovery opportunity.',
    owner: 'Interconnection Manager + Applicant',
    actionType: 'acknowledge',
    impact: 'high', measurability: 'long-term', prioritized: true, confidence: 'provable',
  },
  {
    id: 'EGI03600-020',
    phase: 'FAS', phaseCode: 'EGI03600',
    scenario: 'Study Waivers', scenarioDetail: 'Waiver window closing',
    title: 'Waiver window closing',
    trigger: 'Eligible project at BD 4 of 5 BD window (or BD 20 of 25)',
    taskCode: 'Waiver', threshold: '4/5 BD or 20/25 BD',
    description: 'Last-call alert. Window closes in 1 BD; without customer response the project enters Facilities Study by default and the 60 BD recovery is lost.',
    recommendedAction: 'Last-call alert; chase customer response or accept default Facilities Study path.',
    owner: 'Interconnection Manager',
    actionType: 'email',
    impact: 'high', measurability: 'immediate', prioritized: true, confidence: 'provable',
  },
  {
    id: 'EGI03600-030',
    phase: 'FAS', phaseCode: 'EGI03600',
    scenario: 'Study Waivers', scenarioDetail: 'Waiver accepted — workflow handoff',
    title: 'Waiver accepted — workflow handoff',
    trigger: 'Customer signs waiver agreement',
    taskCode: 'Waiver', threshold: 'On signature',
    description: 'The customer has accepted the waiver. The workflow can now skip the 60 BD Facilities Study and proceed directly to GIA tender. Commercial operation date estimate updates by 3 months.',
    recommendedAction: 'Skip to GIA tender; update commercial operation date estimate.',
    owner: 'Agreement Manager + Engineering',
    actionType: 'system',
    impact: 'high', measurability: 'immediate', prioritized: true, confidence: 'provable',
  },
];

// ── Derived counts ───────────────────────────────────────────────────────────
export const TOTAL_CARDS = CARDS.length;
export const PRIORITIZED_CARDS = CARDS.filter(c => c.prioritized).length;
export const UNIQUE_SCENARIOS = [...new Set(CARDS.map(c => c.scenario))].length;
export const UNIQUE_PHASES = [...new Set(CARDS.map(c => c.phaseCode))].length;
