import React, { useState } from 'react';
import {
  Title,
  Text,
  Tag,
  ObjectStatus,
  Table,
  TableHeaderRow,
  TableHeaderCell,
  TableRow,
  TableCell,
} from '@ui5/webcomponents-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type Phase = 'idle' | 'sandbox-data' | 'generating' | 'reviewing' | 'spacing' | 'design-review' | 'done' | 'error';
export type UI5State = 'Positive' | 'Negative' | 'Critical' | 'Information' | 'None';

export interface ReviewCheck {
  id: number;
  name: string;
  score: number;
  max: number;
  notes: string;
  state: UI5State;
}

export interface ReviewResult {
  score: number;
  grade: string;
  checks: ReviewCheck[];
  topIssues: string[];
  patternsConfirmed: string[];
}

export interface SpacingViolation {
  value: string;
  count: number;
  status: 'off-grid' | 'sub-grid' | 'zero-padding';
  fix: string;
}

export interface SpacingCheck {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  finding: string;
}

export interface SpacingResult {
  score: number;
  grade: string;
  violations: SpacingViolation[];
  checks: SpacingCheck[];
}

export interface DesignReviewResult {
  score: number;
  grade: string;
  issues: string[];
  positives: string[];
  floorplan: string;
  primaryAction: string;
}

export interface RubricItem {
  label: string;
  description: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function agentLabel(modelId: string): string {
  if (modelId.includes('opus')) return '🧠 Opus';
  if (modelId.includes('sonnet')) return '⚡ Sonnet';
  if (modelId.includes('haiku')) return '🚀 Haiku';
  return modelId.split('--').pop() ?? modelId;
}

export function gradeColor(grade: string): string {
  switch (grade) {
    case 'S': return 'var(--sapPositiveColor, #256f3a)';
    case 'A': return 'var(--sapPositiveColor, #256f3a)';
    case 'B': return 'var(--sapInformativeColor, #0070f2)';
    case 'C': return 'var(--sapCriticalColor, #b44f00)';
    default:  return 'var(--sapNegativeColor, #aa0808)';
  }
}

export function spacingStatusState(status: string): UI5State {
  switch (status) {
    case 'pass': return 'Positive';
    case 'warn': return 'Critical';
    case 'fail': return 'Negative';
    default:     return 'None';
  }
}

// ── IssueList ─────────────────────────────────────────────────────────────────

interface IssueListProps { title: string; items: string[]; state: UI5State; }

export const IssueList: React.FC<IssueListProps> = ({ title, items, state }) => (
  <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--sapList_BorderColor, #e5e5e5)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
    <Text style={{ fontWeight: 700 as any, marginBottom: '0.25rem', display: 'block', fontSize: '0.75rem' }}>{title}</Text>
    {items.map((item, i) => (
      <div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
        <ObjectStatus state={state} />
        <Text wrapping style={{ flex: 1, fontSize: '0.75rem' }}>{item}</Text>
      </div>
    ))}
  </div>
);

// ── ReviewCard ────────────────────────────────────────────────────────────────

export interface ReviewCardProps {
  title: string;
  agent?: string;
  score?: number;
  grade?: string;
  loading: boolean;
  loadingText: string;
  rubric?: RubricItem[];
  children?: React.ReactNode;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ title, agent, score, grade, loading, loadingText, rubric, children }) => {
  const [rubricOpen, setRubricOpen] = useState(false);
  const color = grade ? gradeColor(grade) : 'var(--sapNeutralBorderColor, #d9d9d9)';
  return (
    <div style={{ border: `2px solid ${color}`, borderRadius: 'var(--sapTile_BorderCornerRadius, 12px)', overflow: 'hidden' }}>
      <div style={{ padding: '0.75rem 1rem', background: color, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Title level="H5" style={{ color: '#fff', flex: 1 }}>{title}</Title>
        {agent && <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', background: 'rgba(0,0,0,0.15)', borderRadius: '4px', padding: '2px 6px' }}>{agent}</span>}
        {score !== undefined && grade && (
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', opacity: 0.95 }}>{score}/100 · {grade}</span>
        )}
      </div>
      {rubric && rubric.length > 0 && (
        <div style={{ borderBottom: '1px solid var(--sapList_BorderColor, #e5e5e5)', background: 'var(--sapBaseColor, #fff)' }}>
          <button
            onClick={() => setRubricOpen(o => !o)}
            style={{
              width: '100%', textAlign: 'left', padding: '0.5rem 1rem',
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              color: 'var(--sapContent_LabelColor)', fontSize: '0.72rem', fontWeight: 600,
            }}
          >
            <span style={{ fontSize: '0.65rem', transition: 'transform 0.15s', transform: rubricOpen ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>▶</span>
            ℹ️ What this audit checks ({rubric.length} checks)
          </button>
          {rubricOpen && (
            <div style={{ padding: '0.25rem 1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', background: 'var(--sapList_Background, #fafafa)' }}>
              {rubric.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--sapContent_LabelColor)', minWidth: '18px', paddingTop: '1px' }}>{i + 1}.</span>
                  <div>
                    <Text style={{ fontSize: '0.72rem', fontWeight: 700, display: 'block' }}>{item.label}</Text>
                    <Text wrapping style={{ fontSize: '0.7rem', color: 'var(--sapContent_LabelColor)' }}>{item.description}</Text>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {loading ? (
        <div style={{ padding: '1.5rem', textAlign: 'center' }}>
          <Text style={{ color: 'var(--sapContent_LabelColor)' }}>{loadingText}</Text>
        </div>
      ) : children}
    </div>
  );
};

// ── ReviewSubTabs ─────────────────────────────────────────────────────────────

type ReviewSubTab = 'expert' | 'spacing' | 'design';

export interface ReviewSubTabsProps {
  review: ReviewResult | null;
  spacing: SpacingResult | null;
  designReview: DesignReviewResult | null;
  phase: Phase;
  reviewAgent: string;
  spacingAgent: string;
  designAgent: string;
}

export const ReviewSubTabs: React.FC<ReviewSubTabsProps> = ({
  review, spacing, designReview, phase, reviewAgent, spacingAgent, designAgent,
}) => {
  const [sub, setSub] = useState<ReviewSubTab>('expert');

  React.useEffect(() => {
    if (phase === 'reviewing') setSub('expert');
    else if (phase === 'spacing') setSub('spacing');
    else if (phase === 'design-review') setSub('design');
  }, [phase]);

  const tabs: { key: ReviewSubTab; label: string; score?: number; grade?: string; active: boolean }[] = [
    { key: 'expert',  label: 'Expert Review',  score: review?.score,       grade: review?.grade,       active: !!review || phase === 'reviewing' },
    { key: 'spacing', label: 'Spacing Audit',  score: spacing?.score,      grade: spacing?.grade,      active: !!spacing || phase === 'spacing' },
    { key: 'design',  label: 'Design Review',  score: designReview?.score, grade: designReview?.grade, active: !!designReview || phase === 'design-review' },
  ];

  const subTabStyle = (key: ReviewSubTab): React.CSSProperties => ({
    padding: '0.45rem 1rem',
    border: 'none',
    borderBottom: sub === key ? '2px solid var(--sapBrandColor, #0064d9)' : '2px solid transparent',
    background: 'transparent',
    cursor: 'pointer',
    color: sub === key ? 'var(--sapBrandColor, #0064d9)' : 'var(--sapTextColor)',
    fontWeight: sub === key ? 700 : 400,
    fontSize: '0.78rem',
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    whiteSpace: 'nowrap',
  });

  const gradePill = (score?: number, grade?: string, isLoading?: boolean) => {
    if (isLoading) return <span style={{ fontSize: '0.6rem', background: 'var(--sapNeutralBorderColor, #d9d9d9)', borderRadius: 4, padding: '1px 5px', color: '#666' }}>…</span>;
    if (score === undefined || !grade) return null;
    return (
      <span style={{ fontSize: '0.6rem', fontWeight: 700, borderRadius: 4, padding: '1px 5px', background: gradeColor(grade), color: '#fff' }}>
        {score} {grade}
      </span>
    );
  };

  const isEmpty = !review && !spacing && !designReview && phase !== 'reviewing' && phase !== 'spacing' && phase !== 'design-review';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Sub-tab bar */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--sapList_BorderColor, #e5e5e5)',
        background: 'var(--sapList_Background, #fff)', flexShrink: 0, paddingLeft: '0.5rem',
      }}>
        {tabs.map(t => (
          <button
            key={t.key}
            style={subTabStyle(t.key)}
            onClick={() => setSub(t.key)}
          >
            {t.label}
            {gradePill(
              t.score,
              t.grade,
              !t.score && (
                (t.key === 'expert' && phase === 'reviewing') ||
                (t.key === 'spacing' && phase === 'spacing') ||
                (t.key === 'design' && phase === 'design-review')
              ),
            )}
          </button>
        ))}
      </div>

      {/* Sub-tab panels */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {isEmpty && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--sapContent_LabelColor)', fontSize: '0.85rem' }}>
            Run a generation to see review results
          </div>
        )}

        {/* Expert panel */}
        {sub === 'expert' && (review || phase === 'reviewing') && (
          <ReviewCard
            title="Expert Review — 14 Fiori Checks"
            agent={reviewAgent || undefined}
            score={review?.score}
            grade={review?.grade}
            loading={!review}
            loadingText="Running 14-point Fiori audit…"
            rubric={[
              { label: 'ThemeProvider wrapper', description: 'Root is wrapped in ThemeProvider exactly once — no nesting.' },
              { label: 'DynamicPage layout', description: 'height:100vh + flex column wrapper; DynamicPage has flex:1 + overflow:hidden to prevent broken internal scroll.' },
              { label: 'DynamicPageTitle slots', description: 'heading, subheading, actionsBar, navigationBar passed via slot= children — NOT JSX props.' },
              { label: 'actionsBar Toolbar wrapper', description: 'actionsBar slot contains a <Toolbar> — not a bare fragment.' },
              { label: 'ONE Emphasized button', description: 'Exactly one design="Emphasized" button per screen — the primary action only.' },
              { label: 'rowKey on every TableRow', description: 'Required for selection and navigation indicators — no spaces in value.' },
              { label: 'TableSelection in features prop', description: 'TableSelectionMulti / TableSelectionSingle live in the features prop, not as children.' },
              { label: 'No ValueState enum', description: 'Uses string literals "Positive", "Negative", "Critical", "Information", "None" — not ValueState.Xxx enum.' },
              { label: 'No deprecated exports', description: 'No Badge (→ Tag), no TableColumn (→ TableHeaderCell), no other v1 renamed exports.' },
              { label: 'All required inputs validated', description: 'Every required Input/Select has valueState + valueStateMessage slot wired up.' },
              { label: 'Label props', description: 'Every Label has required and showColon props where applicable.' },
              { label: 'All four feedback states', description: 'Loading → BusyIndicator/loading prop; Success → Toast; Error → MessageStrip design="Negative"; Empty → IllustratedMessage.' },
              { label: 'No hardcoded hex colors', description: 'All colors via var(--sapXxx) tokens — no #rrggbb or rgb() values.' },
              { label: 'Icon imports', description: 'All icons individually imported from @ui5/webcomponents-icons/dist/<name>.js.' },
            ]}
          >
            {review && (
              <>
                <Table
                  headerRow={<TableHeaderRow><TableHeaderCell width="40px">#</TableHeaderCell><TableHeaderCell width="180px">Check</TableHeaderCell><TableHeaderCell width="90px">Score</TableHeaderCell><TableHeaderCell>Notes</TableHeaderCell></TableHeaderRow>}
                  noDataText="No checks"
                >
                  {review.checks.map(c => (
                    <TableRow key={c.id} rowKey={String(c.id)}>
                      <TableCell><Text>{c.id === 15 ? 'B' : String(c.id)}</Text></TableCell>
                      <TableCell><Text>{c.name}</Text></TableCell>
                      <TableCell><ObjectStatus state={c.state}>{c.score}/{c.max}</ObjectStatus></TableCell>
                      <TableCell><Text wrapping>{c.notes}</Text></TableCell>
                    </TableRow>
                  ))}
                </Table>
                {review.topIssues.length > 0 && <IssueList title="Top Issues" items={review.topIssues} state="Negative" />}
                {review.patternsConfirmed.length > 0 && <IssueList title="Confirmed Patterns" items={review.patternsConfirmed} state="Positive" />}
              </>
            )}
          </ReviewCard>
        )}

        {/* Spacing panel */}
        {sub === 'spacing' && (spacing || phase === 'spacing') && (
          <ReviewCard
            title="Spacing Audit — 8px Grid"
            agent={spacingAgent || undefined}
            score={spacing?.score}
            grade={spacing?.grade}
            loading={!spacing}
            loadingText="Running 8px grid audit…"
            rubric={[
              { label: 'A — Page chrome padding', description: 'Outermost content wrapper has padding ≥ 1rem (16px) on all sides.' },
              { label: 'B — Section breathing gap', description: 'Adjacent Panels/Cards in a flex column have gap ≥ 1.5rem (24px) between them.' },
              { label: 'C — Panel/Card body padding', description: 'Content inside Panel or Card body has padding ≥ 1rem (16px).' },
              { label: 'D — Wasted space patterns', description: 'No padding desert, gap cliff, toolbar double-padding, or table double-wrap anti-patterns.' },
              { label: 'E — Spacing consistency', description: 'File uses 2–3 coherent values from the 8px grid — not a mix of arbitrary pixel values.' },
              { label: 'F — Table column utilization', description: 'Tables fill their container; at least one column has no fixed width to stretch and fill remaining space.' },
              { label: 'G — Form label width', description: 'Form uses multi-column layout on large screens (L2+); label column not oversized (max L4 XL3).' },
              { label: 'CSS off-grid values', description: 'No spacing values that miss the 8px grid (5px, 10px, 15px, 20px, 30px, etc.).' },
            ]}
          >
            {spacing && (
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {spacing.checks.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <ObjectStatus state={spacingStatusState(c.status)} />
                    <div>
                      <Text style={{ fontWeight: 700 as any, fontSize: '0.75rem' }}>{c.id}: {c.label}</Text>
                      <Text wrapping style={{ fontSize: '0.75rem', color: 'var(--sapContent_LabelColor)' }}>{c.finding}</Text>
                    </div>
                  </div>
                ))}
                {spacing.violations.length > 0 && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <Text style={{ fontWeight: 700 as any, fontSize: '0.75rem', marginBottom: '0.25rem' }}>Grid Violations</Text>
                    {spacing.violations.map((v, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <Tag design="Negative" style={{ flexShrink: 0 }}>{v.value}</Tag>
                        <Text wrapping style={{ flex: 1, fontSize: '0.75rem' }}>×{v.count} — {v.status} → {v.fix}</Text>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </ReviewCard>
        )}

        {/* Design panel */}
        {sub === 'design' && (designReview || phase === 'design-review') && (
          <ReviewCard
            title="Design Review — Fiori Patterns"
            agent={designAgent || undefined}
            score={designReview?.score}
            grade={designReview?.grade}
            loading={!designReview}
            loadingText="Auditing Fiori design patterns…"
            rubric={[
              { label: 'Floorplan', description: 'Correct floorplan for the use case: List Report (collection), Object Page (single record), Overview Page (dashboard), Worklist (task queue).' },
              { label: 'Primary action', description: 'Exactly ONE design="Emphasized" button is present — the single most important action for this screen.' },
              { label: 'Navigation anti-pattern', description: 'No Button used for navigation/href behavior — use Link instead.' },
              { label: 'Multiple Emphasized', description: 'No more than one Emphasized button competing on the same view.' },
              { label: 'Toast misuse', description: 'Toast is not used for errors requiring user action — those go to MessageStrip or Dialog.' },
              { label: 'IllustratedMessage placement', description: 'IllustratedMessage is not placed inside a Card or small container — only at page level.' },
              { label: 'ShellBar scope', description: 'ShellBar is not nested inside a Dialog, Panel, or Card — it is page-level chrome only.' },
            ]}
          >
            {designReview && (
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <Text style={{ fontSize: '0.7rem', color: 'var(--sapContent_LabelColor)', display: 'block' }}>Floorplan</Text>
                    <Tag colorScheme="6">{designReview.floorplan}</Tag>
                  </div>
                  <div>
                    <Text style={{ fontSize: '0.7rem', color: 'var(--sapContent_LabelColor)', display: 'block' }}>Primary action</Text>
                    <Tag design={designReview.primaryAction === 'missing' ? 'Negative' : 'Positive'}>{designReview.primaryAction}</Tag>
                  </div>
                </div>
                {designReview.issues.length > 0 && <IssueList title="Issues Found" items={designReview.issues} state="Negative" />}
                {designReview.positives.length > 0 && <IssueList title="Patterns Correct" items={designReview.positives} state="Positive" />}
              </div>
            )}
          </ReviewCard>
        )}

        {/* Placeholder when a sub-tab has no data yet */}
        {sub === 'expert' && !review && phase !== 'reviewing' && !isEmpty && (
          <div style={{ color: 'var(--sapContent_LabelColor)', fontSize: '0.85rem', padding: '1rem' }}>Expert review hasn't run yet for this app.</div>
        )}
        {sub === 'spacing' && !spacing && phase !== 'spacing' && (
          <div style={{ color: 'var(--sapContent_LabelColor)', fontSize: '0.85rem', padding: '1rem' }}>Spacing audit hasn't run yet for this app. Run the Fiori Loop to generate spacing audit results.</div>
        )}
        {sub === 'design' && !designReview && phase !== 'design-review' && (
          <div style={{ color: 'var(--sapContent_LabelColor)', fontSize: '0.85rem', padding: '1rem' }}>Design review hasn't run yet for this app. Run the Fiori Loop to generate design review results.</div>
        )}
      </div>
    </div>
  );
};
