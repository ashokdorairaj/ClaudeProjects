// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { ThemeProvider, ShellBar, ShellBarItem, ObjectStatus } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-react/styles.css';
import '@ui5/webcomponents-icons/dist/AllIcons.js';

import { CARDS, PHASES_META, TOTAL_CARDS } from './data';
import type { HITLCardData } from './data';
import HITLCard from './HITLCard';

const ff = 'var(--sapFontFamily,"72",Arial,sans-serif)';

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — "What is HITL?" page
// ═══════════════════════════════════════════════════════════════════════════════

const principles = [
  { number: '01', title: 'Agents act, humans decide', body: 'Agents perform validations, apply rules, and draft recommendations. Humans review, approve, or override. The agent never bypasses the human for high-stakes decisions.' },
  { number: '02', title: 'Decision instrument, not context container', body: 'A HITL card carries the minimum signal needed to orient the human — confidence score, key data point, escalation reason — plus a clear set of choices. Full context lives in the linked project record.' },
  { number: '03', title: 'Confidence is always visible', body: 'Every recommendation shows its confidence score and the reason behind it. Below 75%, the agent escalates to human with packaged options. Users are never asked to decide blind.' },
  { number: '04', title: 'Every decision is auditable', body: 'Every HITL action is logged with timestamp, rationale, confidence score, and actor identity. Required for regulatory defense — no decision disappears.' },
  { number: '05', title: 'Cards vanish when resolved', body: 'A card exists only while it needs a decision. Once resolved, dismissed, or expired it leaves the queue. Zero-state means nothing needs attention — not a zero-count card.' },
];

function WhatIsHITLPage() {
  return (
    <div style={{ maxWidth: '780px' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapContent_LabelColor)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
          Design Standard
        </div>
        <div style={{ fontFamily: ff, fontSize: 'var(--sapFontHeader1Size, 2rem)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: '1rem', lineHeight: 1.2 }}>
          Human-in-the-Loop Cards
        </div>
        <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', color: 'var(--sapContent_LabelColor)', lineHeight: 1.7, maxWidth: '620px' }}>
          A live pattern library for every HITL decision surface in the ICAP agent system. Each card is a decision instrument — built for a specific escalation type, with defined anatomy, states, and audit trail requirements.
        </div>
      </div>

      <div style={{
        marginBottom: '2.5rem', padding: '1.25rem 1.5rem',
        borderRadius: '0.75rem', border: '1px solid var(--sapInformationBorderColor)',
        background: 'var(--sapInformationBackground)',
      }}>
        <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: '0.5rem' }}>
          What is a HITL card?
        </div>
        <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', color: 'var(--sapTextColor)', lineHeight: 1.7 }}>
          When an AI agent reaches a decision point it cannot or should not resolve autonomously — low confidence, high financial stakes, regulatory exposure, or explicit policy — it pauses and surfaces a HITL card. The card presents the human with the minimum context needed, a defined set of options, and a reasoning field. The human decides. The agent resumes.
        </div>
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapContent_LabelColor)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
          Principles
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {principles.map(p => (
            <div key={p.number} style={{
              display: 'flex', gap: '1.25rem', padding: '1rem 1.25rem',
              borderRadius: '0.5rem', border: '1px solid var(--sapList_BorderColor)',
              background: 'var(--sapList_Background)',
            }}>
              <span style={{ fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapContent_LabelColor)', minWidth: '1.5rem', paddingTop: '0.125rem' }}>{p.number}</span>
              <div>
                <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: '0.25rem' }}>{p.title}</div>
                <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', color: 'var(--sapContent_LabelColor)', lineHeight: 1.6 }}>{p.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapContent_LabelColor)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
          Card States
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
          {[
            { state: 'Pending',    sapState: 'Critical',     desc: 'Awaiting human decision' },
            { state: 'Resolved',   sapState: 'Positive',     desc: 'Decision made and logged' },
            { state: 'Dismissed',  sapState: 'None',         desc: 'Human declined to act — behavior depends on dismiss category (see Anatomy)' },
            { state: 'Overridden', sapState: 'Negative',     desc: 'Later reversed by another actor' },
          ].map(s => (
            <div key={s.state} style={{
              padding: '1rem 1.25rem', borderRadius: '0.5rem',
              border: '1px solid var(--sapList_BorderColor)', background: 'var(--sapList_Background)',
            }}>
              <ObjectStatus state={s.sapState} style={{ marginBottom: '0.5rem' }}>{s.state}</ObjectStatus>
              <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', color: 'var(--sapContent_LabelColor)' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — Anatomy page
// ═══════════════════════════════════════════════════════════════════════════════

const calloutBadge = (n: number) => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '1.375rem', height: '1.375rem', borderRadius: '50%',
  background: '#1a56db', color: '#fff',
  fontFamily: ff, fontSize: '0.6875rem', fontWeight: 'var(--sapFontBoldWeight)',
  flexShrink: 0, lineHeight: 1,
} as React.CSSProperties);

// Anatomy demo card — pick a card from the new merged Top 5
const ANATOMY_DEMO_CARD: HITLCardData = CARDS.find(c => c.id === 'EGI02200-010') || CARDS[0];

function AnatomyCardDemo({ card }: { card: HITLCardData }) {
  return (
    <div style={{ border: '1px solid var(--sapList_BorderColor)', borderRadius: '0.5rem', overflow: 'visible', background: 'var(--sapList_Background)', position: 'relative' }}>
      <div style={{ padding: '0.75rem 1rem' }}>

        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem',
          borderBottom: '1px solid var(--sapList_BorderColor)', position: 'relative',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={calloutBadge(1)}>1</span>
              <span style={{ fontFamily: ff, fontSize: 'var(--sapFontHeader3Size,1.125rem)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>{card.title}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.125rem' }}>
              <span style={calloutBadge(2)}>2</span>
              <span style={{ fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{card.scenarioDetail} · {card.trigger}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <span style={calloutBadge(3)}>3</span>
            <div style={{ display: 'flex', gap: '0.5rem', opacity: 0.6, pointerEvents: 'none' }}>
              <button style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', color: 'var(--sapButton_TextColor)', background: 'none', border: '1px solid var(--sapButton_BorderColor)', borderRadius: '0.25rem', padding: '0.375rem 0.75rem', cursor: 'default' }}>Dismiss</button>
              <button style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', color: '#fff', background: 'var(--sapButton_Emphasized_Background)', border: '1px solid var(--sapButton_Emphasized_BorderColor)', borderRadius: '0.25rem', padding: '0.375rem 0.75rem', cursor: 'default', fontWeight: 'var(--sapFontBoldWeight)' }}>Send Email</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span style={{ ...calloutBadge(4), marginTop: '0.125rem' }}>4</span>
          <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', color: 'var(--sapTextColor)', lineHeight: 1.6 }}>{card.description}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <span style={{ ...calloutBadge(5), marginTop: '0.125rem' }}>5</span>
          <div style={{
            flex: 1, padding: '0.625rem 0.75rem',
            background: 'var(--sapInformationBackground)',
            borderRadius: '0.375rem',
          }}>
            <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapContent_LabelColor)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
              Recommended action
            </div>
            <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>{card.recommendedAction}</div>
          </div>
        </div>

      </div>
    </div>
  );
}

const calloutLegend = [
  { n: 1, slot: 'Title',            desc: 'The exact decision being asked — one unambiguous sentence' },
  { n: 2, slot: 'Trigger context',  desc: 'Scenario + threshold that created this card (e.g. Task 2210 > 7 BD)' },
  { n: 3, slot: 'CTA',              desc: 'Primary action (Emphasized) + Dismiss (Transparent) — always right-aligned' },
  { n: 4, slot: 'Minimum signal',   desc: '1–3 sentences. Enough to decide without navigating away' },
  { n: 5, slot: 'Recommended action', desc: 'Agent\'s suggestion — highlighted but never forced. Human chooses.' },
];

// ─── Dismiss categories ────────────────────────────────────────────────────────
// Each card declares its dismiss semantics in data.ts; the Anatomy section
// below shows real UI specimens for each of the three categories.

function HITLAnatomyPage() {
  return (
    <div style={{ maxWidth: '1100px' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapContent_LabelColor)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
          Design Standard
        </div>
        <div style={{ fontFamily: ff, fontSize: 'var(--sapFontHeader1Size, 2rem)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: '0.75rem', lineHeight: 1.2 }}>
          Anatomy of a HITL Card
        </div>
        <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', color: 'var(--sapContent_LabelColor)', lineHeight: 1.7, maxWidth: '620px' }}>
          Every HITL card follows a consistent, universal structure. Whether it is a workflow escalation, a study approval, or a dependency override — the anatomy is always the same. This consistency lets users build muscle memory across any AI agent.
        </div>
      </div>

      {/* 2:1 — left: card specimens · right: explanations */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start', marginBottom: '3rem' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <div>
            <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapContent_LabelColor)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem' }}>
              A · Annotated example
            </div>
            <AnatomyCardDemo card={ANATOMY_DEMO_CARD} />
          </div>

          <div>
            <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapContent_LabelColor)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem' }}>
              B · Confirm CTA
            </div>
            <div style={{ pointerEvents: 'none', userSelect: 'none' }}>
              <HITLCard card={ANATOMY_DEMO_CARD} initialPhase="idle" initialConfirming={true} />
            </div>
          </div>

          <div>
            <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapContent_LabelColor)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem' }}>
              C · Loading
            </div>
            <div style={{ border: '1px solid var(--sapList_BorderColor)', borderRadius: '0.5rem', background: 'var(--sapList_Background)', padding: '0.75rem 1rem', position: 'relative', userSelect: 'none', minHeight: '6rem' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '0.5rem', background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '1.25rem', height: '1.25rem', borderRadius: '50%', border: '2.5px solid var(--sapNeutralBorderColor)', borderTopColor: 'var(--sapInformativeColor)', animation: 'hitl-spin 0.7s linear infinite' }} />
                  <span style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', color: 'var(--sapContent_LabelColor)' }}>Processing…</span>
                </div>
              </div>
              <div style={{ opacity: 0.3 }}>
                <div style={{ fontFamily: ff, fontSize: 'var(--sapFontHeader3Size,1.125rem)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: '0.5rem' }}>{ANATOMY_DEMO_CARD.title}</div>
                <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', color: 'var(--sapTextColor)' }}>{ANATOMY_DEMO_CARD.description}</div>
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapContent_LabelColor)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem' }}>
              D · Resolved
            </div>
            <div style={{ pointerEvents: 'none', userSelect: 'none' }}>
              <HITLCard card={ANATOMY_DEMO_CARD} initialPhase="resolved" />
            </div>
          </div>

          <div>
            <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapContent_LabelColor)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem' }}>
              E · Dismissed
            </div>
            <div style={{ pointerEvents: 'none', userSelect: 'none' }}>
              <HITLCard card={ANATOMY_DEMO_CARD} initialPhase="dismissed" />
            </div>
          </div>

        </div>

        <div style={{ position: 'sticky', top: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <div>
            <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapContent_LabelColor)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem' }}>
              Slot reference
            </div>
            <div style={{ border: '1px solid var(--sapList_BorderColor)', borderRadius: '0.5rem', overflow: 'hidden' }}>
              {calloutLegend.map((item, i) => (
                <div key={item.n} style={{
                  display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.75rem 1rem',
                  borderBottom: i < calloutLegend.length - 1 ? '1px solid var(--sapList_BorderColor)' : 'none',
                  background: 'var(--sapList_Background)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <span style={{ ...calloutBadge(item.n), flexShrink: 0 }}>{item.n}</span>
                    <span style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>{item.slot}</span>
                  </div>
                  <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', color: 'var(--sapContent_LabelColor)', lineHeight: 1.5, paddingLeft: '2rem' }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapContent_LabelColor)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem' }}>
              State reference
            </div>
            <div style={{ border: '1px solid var(--sapList_BorderColor)', borderRadius: '0.5rem', overflow: 'hidden' }}>
              {[
                { key: 'A', label: 'Idle (annotated)',  desc: 'Default state. Human sees full card — title, signal, recommended action, CTAs.' },
                { key: 'B', label: 'Confirm CTA',       desc: 'After clicking the primary button. Cancel / Confirm replaces the original CTAs — prevents accidental commits.' },
                { key: 'C', label: 'Loading',           desc: 'Frosted scrim while the agent processes the decision. Card is blocked until complete.' },
                { key: 'D', label: 'Resolved',          desc: 'Decision logged. Card collapses to a green confirmation strip. Cannot be undone.' },
                { key: 'E', label: 'Dismissed',         desc: 'Human declined to act. Behavior depends on dismiss category — see Dismiss section below.' },
              ].map((s, i, arr) => (
                <div key={s.key} style={{
                  display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.75rem 1rem',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--sapList_BorderColor)' : 'none',
                  background: 'var(--sapList_Background)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <span style={{ fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapContent_LabelColor)', background: 'var(--sapNeutralBackground)', border: '1px solid var(--sapList_BorderColor)', borderRadius: '0.25rem', padding: '0.1rem 0.4rem', flexShrink: 0 }}>{s.key}</span>
                    <span style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>{s.label}</span>
                  </div>
                  <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', color: 'var(--sapContent_LabelColor)', lineHeight: 1.5, paddingLeft: '2rem' }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* ── Action types ────────────────────────────────────────────────────── */}
      <div>
        <div style={{ fontFamily: ff, fontSize: 'var(--sapFontHeader2Size,1.5rem)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: '0.5rem' }}>
          Action types
        </div>
        <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', color: 'var(--sapContent_LabelColor)', lineHeight: 1.7, maxWidth: '620px', marginBottom: '2rem' }}>
          Every HITL card has one action type. The type determines what the primary CTA does and what the confirmation step looks like.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {([
            { actionType: 'escalate',    ctaLabel: 'Escalate',    desc: 'Routes the decision up to a manager or senior authority. Used when the issue exceeds normal decision scope or requires a higher sign-off.' },
            { actionType: 'email',       ctaLabel: 'Send Email',  desc: 'Opens an inline compose pane pre-populated with context. The human reviews, edits if needed, and sends. Used for customer-facing communication.' },
            { actionType: 'system',      ctaLabel: 'Retry',       desc: 'Triggers or retries a system action (SMOC, CCB, SAP) that failed silently. The agent re-fires the automation and monitors for completion.' },
            { actionType: 'acknowledge', ctaLabel: 'Acknowledge', desc: 'Confirms the human has seen and accepted the situation. Logs the decision with timestamp and actor. No further action is taken.' },
          ] as const).map(({ actionType, ctaLabel, desc }) => {
            const card = CARDS.find(c => c.actionType === actionType);
            if (!card) return null;
            return (
              <div key={actionType} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
                <div>
                  <HITLCard card={card} />
                </div>
                <div style={{ paddingTop: '1.75rem' }}>
                  <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: '0.5rem' }}>{ctaLabel}</div>
                  <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', color: 'var(--sapContent_LabelColor)', lineHeight: 1.65 }}>{desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Email compose section ───────────────────────────────────────────── */}
      <div style={{ marginTop: '3rem' }}>
        <div style={{ fontFamily: ff, fontSize: 'var(--sapFontHeader2Size,1.5rem)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: '0.5rem' }}>
          Email
        </div>
        <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', color: 'var(--sapContent_LabelColor)', lineHeight: 1.7, maxWidth: '620px', marginBottom: '2rem' }}>
          When the action type is <code style={{ fontFamily: 'monospace', fontSize: '0.875em', background: 'var(--sapNeutralBackground)', padding: '0.1rem 0.35rem', borderRadius: '0.25rem' }}>email</code> or <code style={{ fontFamily: 'monospace', fontSize: '0.875em', background: 'var(--sapNeutralBackground)', padding: '0.1rem 0.35rem', borderRadius: '0.25rem' }}>escalate</code>, clicking the primary CTA reveals an inline compose pane directly inside the card. The agent pre-populates recipient, subject, and body from the card context — the human reviews and edits before sending. No modal, no navigation away.
        </div>

        {(() => {
          const emailCard = CARDS.find(c => c.actionType === 'email');
          if (!emailCard) return null;
          return (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
              <HITLCard card={emailCard} initialShowEmail={true} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { label: 'To', desc: 'Pre-filled from card context. Editable — the human can redirect before sending.' },
                  { label: 'Subject', desc: 'Generated from the card title. Editable.' },
                  { label: 'Body', desc: 'Agent drafts a complete message including description, recommended action, and a call to action. Human reviews and edits.' },
                  { label: 'Send', desc: 'Triggers the send, shows the loading scrim, then transitions the card to Resolved.' },
                ].map(item => (
                  <div key={item.label} style={{ borderLeft: '2px solid var(--sapList_BorderColor)', paddingLeft: '0.875rem' }}>
                    <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: '0.25rem' }}>{item.label}</div>
                    <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', color: 'var(--sapContent_LabelColor)', lineHeight: 1.6 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Dismiss section ─────────────────────────────────────────────────── */}
      <div style={{ marginTop: '3rem' }}>
        <div style={{ fontFamily: ff, fontSize: 'var(--sapFontHeader2Size,1.5rem)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: '0.5rem' }}>
          Dismiss
        </div>
        <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', color: 'var(--sapContent_LabelColor)', lineHeight: 1.7, maxWidth: '720px', marginBottom: '2rem' }}>
          Dismissing a HITL card is not a single behavior. What happens depends on what the card represents in the workflow. Each card declares its <strong style={{ color: 'var(--sapTextColor)' }}>dismiss category</strong> in the data layer — the dismissed-state UI is data-driven, never guessed at runtime.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

          {/* Snooze */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
            <div style={{
              padding: '0.625rem 1rem', background: 'var(--sapBackgroundColor)',
              borderRadius: '0.5rem', border: '1px solid var(--sapList_BorderColor)',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <span style={{
                fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)',
                color: 'var(--sapNeutralTextColor)', background: 'var(--sapNeutralBackground)',
                border: '1px solid var(--sapNeutralBorderColor)', borderRadius: '0.25rem',
                padding: '0.1rem 0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0,
              }}>Dismissed</span>
              <span style={{ fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Customer Change initiated
              </span>
              <span style={{
                fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapLinkColor)',
                textDecoration: 'underline', flexShrink: 0, cursor: 'default', pointerEvents: 'none',
              }}>Re-open</span>
            </div>
            <div style={{ paddingTop: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>Snooze</span>
                <span style={{ fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapPositiveTextColor)', fontWeight: 'var(--sapFontBoldWeight)' }}>↺ Re-open available</span>
              </div>
              <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', color: 'var(--sapContent_LabelColor)', lineHeight: 1.6, marginBottom: '0.625rem' }}>
                Reversible. The trigger persists; the card may re-fire on its own. Dismissing just mutes the surface.
              </div>
              <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--sapTextColor)' }}>Cards:</strong> Customer Change initiated · DGSP coordination stalled · Re-study cycle 2 · Queue position re-study
              </div>
            </div>
          </div>

          {/* Cost visible */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
            <div style={{
              padding: '0.625rem 1rem', background: 'var(--sapBackgroundColor)',
              borderRadius: '0.5rem', border: '1px solid var(--sapWarningBorderColor)',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <span style={{
                fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)',
                color: 'var(--sapCriticalTextColor)', background: 'var(--sapWarningBackground)',
                border: '1px solid var(--sapCriticalBorderColor)', borderRadius: '0.25rem',
                padding: '0.1rem 0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0,
              }}>Dismissed · Cost visible</span>
              <span style={{ fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                SR Agreement signature window
              </span>
              <span style={{
                fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)',
                color: 'var(--sapCriticalTextColor)', flexShrink: 0,
              }}>F.2.c.i clock: 3 BD remaining</span>
              <span style={{
                fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapLinkColor)',
                textDecoration: 'underline', flexShrink: 0, cursor: 'default', pointerEvents: 'none',
              }}>Re-open</span>
            </div>
            <div style={{ paddingTop: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>Cost visible</span>
                <span style={{ fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapPositiveTextColor)', fontWeight: 'var(--sapFontBoldWeight)' }}>↺ Re-open available</span>
              </div>
              <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', color: 'var(--sapContent_LabelColor)', lineHeight: 1.6, marginBottom: '0.625rem' }}>
                Soft consequence. A regulatory clock is burning. Re-open is allowed but the cost has accrued — and the countdown stays visible while dismissed.
              </div>
              <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--sapTextColor)' }}>Cards:</strong> SR Agreement signature · Fault Current Deposit · Customer Change at 40 BD · SIS envelope at risk · IR/SR Decision overdue · Waiver eligible · Waiver closing
              </div>
            </div>
          </div>

          {/* Terminal */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
            <div style={{
              padding: '0.625rem 1rem', background: 'var(--sapBackgroundColor)',
              borderRadius: '0.5rem', border: '1px solid var(--sapErrorBorderColor)',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <span style={{
                fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)',
                color: 'var(--sapNegativeTextColor)', background: 'var(--sapErrorBackground)',
                border: '1px solid var(--sapErrorBorderColor)', borderRadius: '0.25rem',
                padding: '0.1rem 0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0,
              }}>Closed</span>
              <span style={{ fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                GIA — F.2.e auto-withdrawal at 90 CD
              </span>
              <span style={{
                fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)',
                color: 'var(--sapNegativeTextColor)', flexShrink: 0,
              }}>Project deemed withdrawn</span>
              <span style={{
                fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapLinkColor)',
                textDecoration: 'underline', flexShrink: 0, cursor: 'default', pointerEvents: 'none',
              }}>Why this is closed</span>
            </div>
            <div style={{ paddingTop: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>Terminal</span>
                <span style={{ fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapNegativeTextColor)', fontWeight: 'var(--sapFontBoldWeight)' }}>✕ No re-open</span>
              </div>
              <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', color: 'var(--sapContent_LabelColor)', lineHeight: 1.6, marginBottom: '0.625rem' }}>
                Irreversible. Acting on the card is the only path to the desirable outcome — dismissing IS choosing the default. The "Why this is closed" link explains what was committed to.
              </div>
              <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--sapTextColor)' }}>Cards:</strong> GIA F.2.e past day 90 · Waiver accepted handoff · Any Cost-visible card past its hard deadline
              </div>
            </div>
          </div>

        </div>

        <div style={{
          marginTop: '2rem', padding: '1rem 1.25rem',
          borderRadius: '0.5rem', border: '1px solid var(--sapInformationBorderColor)',
          background: 'var(--sapInformationBackground)',
          fontFamily: ff, fontSize: 'var(--sapFontSize)', color: 'var(--sapTextColor)', lineHeight: 1.65,
        }}>
          <strong>Transition rule.</strong> Several cards start as <em>Cost visible</em> and become <em>Terminal</em> when their hard deadline passes — for example, an IR Decision card sits in Cost-visible from BD 5 to BD 10, then flips to Terminal at the F.2.a auto-withdrawal cliff. The card knows its own deadline; the dismissed-state UI flips automatically.
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — Main Library page (15 cards × 5 scenarios)
// ═══════════════════════════════════════════════════════════════════════════════

function LibraryPage({ expandedCard, setExpandedCard }: { expandedCard: string | null; setExpandedCard: (id: string | null) => void }) {
  const grouped = useMemo(() => {
    const map = new Map<string, { phase: typeof PHASES_META[0] | undefined; cards: HITLCardData[] }>();
    for (const card of CARDS) {
      if (!map.has(card.scenario)) {
        const phaseMeta = PHASES_META.find(p => p.code === card.phaseCode);
        map.set(card.scenario, { phase: phaseMeta, cards: [] });
      }
      map.get(card.scenario)!.cards.push(card);
    }
    return map;
  }, []);

  return (
    <>
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ fontFamily: ff, fontSize: 'var(--sapFontHeader2Size, 1.5rem)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: '0.625rem' }}>
          {TOTAL_CARDS} HITL cards across 5 scenarios
        </div>
        <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSize)', color: 'var(--sapContent_LabelColor)', lineHeight: 1.6, maxWidth: '700px' }}>
          Each card detects one specific blind-spot stall in PG&E's Rule 21 EXPNEM workflow. Triggers, recipients, and actions are derived directly from the ZIEGI config table analysis — no transaction data assumed.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {[...grouped.entries()].map(([scenarioName, { phase, cards }], scenarioIdx) => (
          <div key={scenarioName}>
            <div style={{
              marginBottom: '1.25rem', paddingBottom: '0.75rem',
              borderBottom: '2px solid var(--sapTextColor)',
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.375rem' }}>
                <span style={{ fontFamily: ff, fontSize: 'var(--sapFontHeader3Size, 1.125rem)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapInformativeColor)' }}>
                  #{scenarioIdx + 1}
                </span>
                <span style={{ fontFamily: ff, fontSize: 'var(--sapFontHeader2Size, 1.5rem)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>
                  {scenarioName}
                </span>
              </div>
              <div style={{ fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>
                {phase?.name ?? ''} · {phase?.code ?? ''} · {cards.length} {cards.length === 1 ? 'card' : 'cards'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {cards.map(card => (
                <div key={card.id}>
                  <button
                    onClick={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
                    style={{
                      width: '100%', textAlign: 'left', cursor: 'pointer',
                      display: 'grid', gridTemplateColumns: 'auto 1fr auto auto auto',
                      gap: '1rem', alignItems: 'center',
                      padding: '0.625rem 0.875rem',
                      background: expandedCard === card.id ? 'var(--sapList_SelectionBackgroundColor)' : 'var(--sapList_Background)',
                      border: `1px solid ${expandedCard === card.id ? 'var(--sapList_SelectionBorderColor)' : 'var(--sapList_BorderColor)'}`,
                      borderRadius: '0.375rem',
                      fontFamily: ff,
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 'var(--sapFontSmallSize)', fontFamily: 'monospace', color: 'var(--sapContent_LabelColor)', minWidth: '7rem' }}>
                      {card.id}
                    </span>
                    <span style={{ fontSize: 'var(--sapFontSize)', color: 'var(--sapTextColor)', fontWeight: expandedCard === card.id ? 'var(--sapFontBoldWeight)' : 'normal' }}>
                      {card.title}
                    </span>
                    <span style={{
                      fontSize: 'var(--sapFontSmallSize)', fontFamily: 'monospace',
                      color: 'var(--sapContent_LabelColor)',
                      padding: '0.125rem 0.375rem', borderRadius: '0.25rem',
                      background: 'var(--sapNeutralBackground)',
                    }}>
                      {card.trigger}
                    </span>
                    <span style={{
                      fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)',
                      color: card.impact === 'high' ? 'var(--sapNegativeTextColor)' : card.impact === 'medium' ? 'var(--sapCriticalTextColor)' : 'var(--sapNeutralTextColor)',
                    }}>
                      {card.impact}
                    </span>
                    <span style={{ fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>
                      {expandedCard === card.id ? '▲' : '▼'}
                    </span>
                  </button>

                  {expandedCard === card.id && (
                    <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                      <HITLCard card={card} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN — tabbed shell
// ═══════════════════════════════════════════════════════════════════════════════

type PageView = 'library' | 'what-is-hitl' | 'anatomy';

export default function HITLLibraryPage() {
  const [view, setView] = useState<PageView>('library');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  return (
    <ThemeProvider>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--sapBackgroundColor)' }}>
        <ShellBar primaryTitle="HITL Decision Library" secondaryTitle={`${TOTAL_CARDS} cards · 5 scenarios · FDE 1`} />

        {/* Sub-nav tabs */}
        <div style={{
          display: 'flex', gap: '0', borderBottom: '1px solid var(--sapList_BorderColor)',
          background: 'var(--sapBaseColor, #fff)', paddingLeft: '2rem',
        }}>
          {([
            { key: 'what-is-hitl', label: 'What is HITL?' },
            { key: 'anatomy',      label: 'Anatomy' },
            { key: 'library',      label: 'Library' },
          ] as { key: PageView; label: string }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              style={{
                fontFamily: ff,
                fontSize: 'var(--sapFontSize)',
                fontWeight: view === tab.key ? 'var(--sapFontBoldWeight)' : 'normal',
                color: view === tab.key ? 'var(--sapSelectedColor)' : 'var(--sapContent_LabelColor)',
                padding: '0.75rem 1.25rem',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: view === tab.key ? '2px solid var(--sapSelectedColor)' : '2px solid transparent',
                transition: 'color 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem 2rem' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            {view === 'what-is-hitl' && <WhatIsHITLPage />}
            {view === 'anatomy' && <HITLAnatomyPage />}
            {view === 'library' && <LibraryPage expandedCard={expandedCard} setExpandedCard={setExpandedCard} />}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

// ─── Legacy named exports for PGEProjectDetailPage ───────────────────────────

import { CARDS as ALL_CARDS } from './data';
import HITLCardComponent from './HITLCard';
import { IllustratedMessage } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-fiori/dist/illustrations/SuccessHighFive.js';

// ─── Project → Card mapping (22 projects → 15 HITL cards in the merged Top 5) ─
// EVERY card shown in the prototype MUST come from the HITL Library.
const PROJECT_CARD_MAP: Record<string, string> = {
  'pge-001': 'EGI03000-010',
  'pge-002': 'EGI03000-020',
  'pge-003': 'EGI03000-030',
  'pge-004': 'EGI02200-010',
  'pge-005': 'EGI02200-020',
  'pge-006': 'EGI02200-030',
  'pge-007': 'EGI02000-090',
  'pge-008': 'EGI02000-091',
  'pge-009': 'EGI03400-040',
  'pge-010': 'EGI02000-020',
  'pge-011': 'EGI02200-040',
  'pge-012': 'EGI02200-050',
  'pge-013': 'EGI03600-010',
  'pge-014': 'EGI03600-020',
  'pge-015': 'EGI03600-030',
  'pge-016': 'EGI03000-010',
  'pge-017': 'EGI02200-010',
  'pge-018': 'EGI02200-030',
  'pge-019': 'EGI02000-020',
  'pge-020': 'EGI03600-010',
  'pge-021': 'EGI02000-090',
  'pge-022': 'EGI03000-020',
};

export function getCardForProject(projectId: string) {
  const cardId = PROJECT_CARD_MAP[projectId];
  if (!cardId) return null;
  return ALL_CARDS.find(c => c.id === cardId) ?? null;
}

export function ProjectHITLCard({ projectId }: { projectId: string }) {
  const card = getCardForProject(projectId);
  if (!card) return null;
  return <HITLCardComponent card={card} />;
}

function makeLegacyCard(cardId: string) {
  const card = ALL_CARDS.find(c => c.id === cardId);
  return ({ onDone }: { onDone?: () => void }) => {
    if (!card) return null;
    return <HITLCardComponent card={card} />;
  };
}

export const Card_pge001_Parallel = makeLegacyCard('EGI03000-010');
export const Card_pge003_GISPA = makeLegacyCard('EGI03000-030');
export const Card_pge006_Reassign = makeLegacyCard('EGI02200-030');
export const Card_pge021_StudyPath = makeLegacyCard('EGI02000-090');
export const Card_pge022_StudySequence = makeLegacyCard('EGI03000-020');

export const HealthyState: React.FC = () => (
  <div style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <IllustratedMessage
      name="SuccessHighFive"
      titleText="No action needed right now"
      subtitleText="Currently progressing through engineering studies. Everything looks on track."
    />
  </div>
);
