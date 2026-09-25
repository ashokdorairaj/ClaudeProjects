// @ts-nocheck
import React, { useState } from 'react';
import {
  FlexBox,
  MessageStrip,
  Panel,
  Button,
} from '@ui5/webcomponents-react';
import type { HITLCardData } from './data';

// ─── Shared tokens ────────────────────────────────────────────────────────────

const ff = 'var(--sapFontFamily,"72",Arial,sans-serif)';

const s = {
  label: { fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' } as React.CSSProperties,
  body: { fontFamily: ff, fontSize: 'var(--sapFontSize)', color: 'var(--sapTextColor)' } as React.CSSProperties,
  bold: { fontFamily: ff, fontSize: 'var(--sapFontSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' } as React.CSSProperties,
  title: { fontFamily: ff, fontSize: 'var(--sapFontHeader3Size,1.125rem)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' } as React.CSSProperties,
  cardWrap: { overflow: 'hidden' } as React.CSSProperties,
  inner: { padding: '0.75rem 1rem' } as React.CSSProperties,
};

// ── Shared keyframes ──────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('hitl-card-styles')) {
  const el = document.createElement('style');
  el.id = 'hitl-card-styles';
  el.textContent = `
    @keyframes hitl-fade-in   { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes hitl-fade-out  { from { opacity: 1; transform: translateY(0);   } to { opacity: 0; transform: translateY(-6px); } }
    @keyframes hitl-spin      { to { transform: rotate(360deg); } }
    @keyframes hitl-scrim-in  { from { opacity: 0; } to { opacity: 1; } }
    .hitl-entering { animation: hitl-fade-in  0.32s cubic-bezier(0.16,1,0.3,1) both; }
    .hitl-exiting  { animation: hitl-fade-out 0.22s cubic-bezier(0.4,0,1,1)    both; pointer-events: none; }
  `;
  document.head.appendChild(el);
}

// ── Phase transition hook ─────────────────────────────────────────────────────
type CardPhase = 'idle' | 'resolved' | 'dismissed';

function usePhaseTransition(initial: CardPhase): [CardPhase, string, (next: CardPhase) => void, () => void] {
  const [displayPhase, setDisplayPhase] = useState<CardPhase>(initial);
  const [animClass, setAnimClass] = useState('hitl-entering');
  const pending = React.useRef<CardPhase | null>(null);

  const transitionTo = React.useCallback((next: CardPhase) => {
    pending.current = next;
    setAnimClass('hitl-exiting');
  }, []);

  const onAnimationEnd = React.useCallback(() => {
    if (animClass === 'hitl-exiting' && pending.current !== null) {
      setDisplayPhase(pending.current);
      pending.current = null;
      setAnimClass('hitl-entering');
    } else if (animClass === 'hitl-entering') {
      setAnimClass('');
    }
  }, [animClass]);

  return [displayPhase, animClass, transitionTo, onAnimationEnd];
}

// ── Loading scrim ─────────────────────────────────────────────────────────────
const LoadingScrim: React.FC = () => (
  <div style={{
    position: 'absolute', inset: 0, borderRadius: '0.5rem',
    background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(2px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: 'hitl-scrim-in 0.18s ease both', zIndex: 2,
  }}>
    <div style={{
      width: '1.5rem', height: '1.5rem', borderRadius: '50%',
      border: '2.5px solid var(--sapNeutralBorderColor)',
      borderTopColor: 'var(--sapInformativeColor)',
      animation: 'hitl-spin 0.7s linear infinite',
    }} />
  </div>
);

// ── Confirm buttons ───────────────────────────────────────────────────────────
const ConfirmButtons: React.FC<{
  label: string;
  isLoading: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}> = ({ label, isLoading, onConfirm, onDismiss }) => {
  const [confirming, setConfirming] = useState(false);
  return (
    <div key={confirming ? 'confirm' : 'default'} style={{ flexShrink: 0, animation: 'hitl-fade-in 0.18s cubic-bezier(0.16,1,0.3,1) both' }}>
      {confirming ? (
        <FlexBox gap="0.5rem">
          <Button design="Transparent" onClick={() => setConfirming(false)}>Cancel</Button>
          <Button design="Emphasized" icon="accept" disabled={isLoading} onClick={onConfirm}>Confirm</Button>
        </FlexBox>
      ) : (
        <FlexBox gap="0.5rem">
          <Button design="Transparent" onClick={onDismiss}>Dismiss</Button>
          <Button design="Emphasized" icon="initiative" disabled={isLoading} onClick={() => setConfirming(true)}>{label}</Button>
        </FlexBox>
      )}
    </div>
  );
};

// ── Impact badge ──────────────────────────────────────────────────────────────
function ImpactBadge({ impact }: { impact: 'high' | 'medium' | 'low' }) {
  const config = {
    high: { bg: 'var(--sapErrorBackground)', color: 'var(--sapNegativeTextColor)', label: 'High Impact' },
    medium: { bg: 'var(--sapWarningBackground)', color: 'var(--sapCriticalTextColor)', label: 'Medium Impact' },
    low: { bg: 'var(--sapNeutralBackground)', color: 'var(--sapNeutralTextColor)', label: 'Low Impact' },
  };
  const c = config[impact];
  return (
    <span style={{
      fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)',
      padding: '0.125rem 0.5rem', borderRadius: '0.25rem',
      background: c.bg, color: c.color, textTransform: 'uppercase', letterSpacing: '0.03em',
    }}>
      {c.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE EMAIL COMPOSE
// ═══════════════════════════════════════════════════════════════════════════════

function InlineEmail({ card, onSend, onCancel }: { card: HITLCardData; onSend: () => void; onCancel: () => void }) {
  const [to, setTo] = useState(card.owner === 'Distribution Engineer' ? 'engineer@pge.com' : 'im@pge.com');
  const [subject, setSubject] = useState(`Follow-up: ${card.title}`);
  const [body, setBody] = useState(
    `Hi,\n\nThis is a follow-up regarding: ${card.title}\n\n${card.description}\n\nRecommended action: ${card.recommendedAction}\n\nPlease advise on status.\n\nThank you`
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ ...s.label, minWidth: '3rem', fontWeight: 'var(--sapFontBoldWeight)' }}>To</span>
        <input
          value={to}
          onChange={e => setTo(e.target.value)}
          style={{
            flex: 1, fontFamily: ff, fontSize: 'var(--sapFontSize)',
            padding: '0.375rem 0.5rem', border: '1px solid var(--sapField_BorderColor)',
            borderRadius: '0.25rem', background: 'var(--sapField_Background)', color: 'var(--sapTextColor)',
          }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ ...s.label, minWidth: '3rem', fontWeight: 'var(--sapFontBoldWeight)' }}>Subject</span>
        <input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          style={{
            flex: 1, fontFamily: ff, fontSize: 'var(--sapFontSize)',
            padding: '0.375rem 0.5rem', border: '1px solid var(--sapField_BorderColor)',
            borderRadius: '0.25rem', background: 'var(--sapField_Background)', color: 'var(--sapTextColor)',
          }}
        />
      </div>
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        rows={6}
        style={{
          fontFamily: ff, fontSize: 'var(--sapFontSize)',
          padding: '0.5rem', border: '1px solid var(--sapField_BorderColor)',
          borderRadius: '0.25rem', background: 'var(--sapField_Background)', color: 'var(--sapTextColor)',
          resize: 'vertical',
        }}
      />
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <Button design="Transparent" onClick={onCancel}>Cancel</Button>
        <Button design="Emphasized" icon="email" onClick={onSend}>Send</Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function HITLCard({ card, initialPhase = 'idle', initialConfirming = false, initialShowEmail = false }: { card: HITLCardData; initialPhase?: CardPhase; initialConfirming?: boolean; initialShowEmail?: boolean }) {
  const [displayPhase, animClass, transitionTo, onAnimationEnd] = usePhaseTransition(initialPhase);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmail, setShowEmail] = useState(initialShowEmail);
  const [confirming, setConfirming] = useState(initialConfirming);

  const handleSendEmail = () => {
    setShowEmail(false);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      transitionTo('resolved');
    }, 1200);
  };

  const handleSystemAction = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      transitionTo('resolved');
    }, 2000);
  };

  const handleAcknowledge = () => {
    transitionTo('resolved');
  };

  const handleDismiss = () => transitionTo('dismissed');

  if (displayPhase === 'dismissed') {
    return (
      <div style={{
        padding: '0.625rem 1rem', background: 'var(--sapBackgroundColor)',
        borderRadius: '0.5rem', border: '1px solid var(--sapList_BorderColor)',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        animation: 'hitl-fade-in 0.28s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        <span style={{
          fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)',
          color: 'var(--sapNeutralTextColor)', background: 'var(--sapNeutralBackground)',
          border: '1px solid var(--sapNeutralBorderColor)', borderRadius: '0.25rem',
          padding: '0.1rem 0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0,
        }}>Dismissed</span>
        <span style={{ ...s.label, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.title}</span>
        <button
          onClick={() => transitionTo('idle')}
          style={{
            fontFamily: ff, fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapLinkColor)',
            background: 'none', border: 'none', cursor: 'pointer', padding: '0', flexShrink: 0,
            textDecoration: 'underline',
          }}
        >Re-open</button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', borderRadius: '0.5rem' }}>
      {isLoading && <LoadingScrim />}
      <Panel style={s.cardWrap}>
        <div className={animClass} onAnimationEnd={onAnimationEnd} style={{ ...s.inner, position: 'relative' }}>

          {/* ── Resolved state ── */}
          {displayPhase === 'resolved' && (
            <MessageStrip design="Positive" hideCloseButton>
              <span style={{ fontFamily: ff, fontWeight: 'var(--sapFontBoldWeight)' }}>
                Action taken —
              </span>
              {card.recommendedAction}
            </MessageStrip>
          )}

          {/* ── Idle state ── */}
          {displayPhase === 'idle' && (
            <>
              {/* Header: title + CTA */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem',
                borderBottom: '1px solid var(--sapList_BorderColor)',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={s.title}>{card.title}</div>
                  <div style={{ ...s.label, marginTop: '0.25rem' }}>
                    {card.scenarioDetail}
                  </div>
                </div>
                {!showEmail && (
                  <div key={confirming ? 'confirm' : 'default'} style={{ flexShrink: 0, animation: 'hitl-fade-in 0.18s cubic-bezier(0.16,1,0.3,1) both' }}>
                    {confirming ? (
                      <FlexBox gap="0.5rem">
                        <Button design="Transparent" onClick={() => setConfirming(false)}>Cancel</Button>
                        <Button design="Emphasized" icon="accept" disabled={isLoading} onClick={() => {
                          setConfirming(false);
                          if (card.actionType === 'system') { handleSystemAction(); }
                          else { handleAcknowledge(); }
                        }}>Confirm</Button>
                      </FlexBox>
                    ) : (
                      <FlexBox gap="0.5rem">
                        <Button design="Transparent" onClick={handleDismiss}>Dismiss</Button>
                        {card.actionType === 'email' && (
                          <Button design="Emphasized" icon="email" onClick={() => setShowEmail(true)}>Send Email</Button>
                        )}
                        {card.actionType === 'escalate' && (
                          <Button design="Emphasized" icon="arrow-top" onClick={() => setShowEmail(true)}>Escalate</Button>
                        )}
                        {card.actionType === 'nudge' && (
                          <Button design="Emphasized" icon="touches" onClick={() => setShowEmail(true)}>Notify</Button>
                        )}
                        {card.actionType === 'system' && (
                          <Button design="Emphasized" icon="synchronize" onClick={() => setConfirming(true)}>Retry</Button>
                        )}
                        {card.actionType === 'acknowledge' && (
                          <Button design="Emphasized" icon="accept" onClick={() => setConfirming(true)}>Acknowledge</Button>
                        )}
                      </FlexBox>
                    )}
                  </div>
                )}
              </div>

              {/* Body: description */}
              <div style={{ ...s.body, marginBottom: '0.75rem' }}>
                {card.description}
              </div>

              {/* Recommended action */}
              {!showEmail && (
                <div style={{
                  padding: '0.625rem 0.75rem',
                  background: 'var(--sapInformationBackground)',
                  borderRadius: '0.375rem',
                  marginBottom: '0.75rem',
                }}>
                  <div style={{ ...s.label, marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 'var(--sapFontBoldWeight)' }}>
                    Recommended action
                  </div>
                  <div style={s.bold}>{card.recommendedAction}</div>
                </div>
              )}

              {/* Email/Escalation compose (shown for email, escalate, nudge types) */}
              {showEmail && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ ...s.label, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 'var(--sapFontBoldWeight)' }}>
                    {card.actionType === 'escalate' ? 'Escalate to manager' : card.actionType === 'nudge' ? 'Send notification' : 'Send follow-up email'}
                  </div>
                  <InlineEmail card={card} onSend={handleSendEmail} onCancel={() => setShowEmail(false)} />
                </div>
              )}
            </>
          )}
        </div>
      </Panel>
    </div>
  );
}
