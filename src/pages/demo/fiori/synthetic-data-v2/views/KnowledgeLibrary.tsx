// @ts-nocheck
import React, { useState, useCallback } from 'react';
import {
  Title, Text, Button, ObjectStatus, Tag, Icon, MessageStrip, Toast,
} from '@ui5/webcomponents-react';
import { SP } from '../constants';
import type { SyntheticView, ReusableLearning, PackVersion } from '../types';

interface KnowledgeItem {
  id: string;
  title: string;
  category: 'Data' | 'Feature' | 'Approach' | 'Business Constraint' | 'Evaluation' | 'Process' | 'Experiment Pattern';
  domain: string;
  confidence: 'High' | 'Medium' | 'Low';
  text: string;
  experimentId: string | null;
  runIds: string[];
  f1Delta: string | null;
  aucDelta: string | null;
  reviewStatus: 'Candidate' | 'Validated' | 'Customer-Specific';
  capturedAt: string;
  source: string;
}

const CAT_COLOR: Record<string, string> = {
  Feature: '5', Data: '8', Approach: '3', 'Business Constraint': '2',
  Evaluation: '6', Process: '7', 'Experiment Pattern': '1',
};

interface Props {
  nav: (v: SyntheticView) => void;
  learnings: ReusableLearning[];
  setLearnings: (fn: (prev: ReusableLearning[]) => ReusableLearning[]) => void;
  packVersions: PackVersion[];
  setPackVersions: (fn: (prev: PackVersion[]) => PackVersion[]) => void;
  showToast: (msg: string) => void;
  runIds?: string[];
}

// Seed knowledge items from existing learnings
const seedKnowledge = (learnings: ReusableLearning[]): KnowledgeItem[] => {
  const base: KnowledgeItem[] = [
    { id: 'K001', title: 'Historical late-payment count is consistently predictive', category: 'Feature', domain: 'Collections', confidence: 'High', text: 'Historical late-payment count is consistently the strongest predictor across customer engagements. Adding it to the Behavioral feature set improved F1 from 0.70 to 0.83.', experimentId: 'exp-001', runIds: ['run-006', 'run-007'], f1Delta: '+0.13', aucDelta: '+0.13', reviewStatus: 'Candidate', capturedAt: '2025-09-04', source: 'experiment-derived' },
    { id: 'K002', title: 'Risk segment provides meaningful late-payment separation', category: 'Feature', domain: 'Collections', confidence: 'High', text: 'Risk segment shows meaningful separation: HIGH-risk accounts are 2.5× more likely to pay late than LOW-risk. Useful as a standalone rule trigger and as a feature.', experimentId: 'exp-001', runIds: ['run-001', 'run-002'], f1Delta: null, aucDelta: null, reviewStatus: 'Validated', capturedAt: '2025-09-01', source: 'experiment-derived' },
    { id: 'K003', title: 'Payment terms ≥60 days + invoice >€10K is a reliable rule trigger', category: 'Business Constraint', domain: 'Collections', confidence: 'High', text: 'Payment terms ≥ 60 days combined with invoice amount > €10K is a reliable rule trigger for late payment across multiple engagements.', experimentId: null, runIds: [], f1Delta: null, aucDelta: null, reviewStatus: 'Validated', capturedAt: '2025-08-15', source: 'pre-seeded' },
    { id: 'K004', title: 'Recall should be prioritized over precision for collections', category: 'Evaluation', domain: 'Collections', confidence: 'High', text: 'Missing a high-risk late payer is more costly than reviewing an extra receivable. For collections prioritization, Recall and F1 should be the primary metrics, not Accuracy.', experimentId: 'exp-001', runIds: ['run-007'], f1Delta: null, aucDelta: null, reviewStatus: 'Candidate', capturedAt: '2025-09-04', source: 'experiment-derived' },
    { id: 'K005', title: 'Gradient Boosting outperforms Logistic Regression on L3 data', category: 'Approach', domain: 'Collections', confidence: 'Medium', text: 'On Northstar L3 dataset with Behavioral features, Gradient Boosting (F1: 0.83) outperforms Logistic Regression (F1: 0.77). Consistent with published literature on structured tabular data.', experimentId: 'exp-001', runIds: ['run-005', 'run-007'], f1Delta: '+0.06', aucDelta: '+0.05', reviewStatus: 'Candidate', capturedAt: '2025-09-04', source: 'experiment-derived' },
    { id: 'K006', title: 'Northstar payment-channel distribution is customer-specific', category: 'Data', domain: 'Collections', confidence: 'High', text: 'Northstar Manufacturing: 60% bank transfer, 30% check, 10% direct debit. This distribution reflects Northstar\'s specific payment infrastructure and should NOT be applied to other customers.', experimentId: 'exp-001', runIds: [], f1Delta: null, aucDelta: null, reviewStatus: 'Customer-Specific', capturedAt: '2025-09-03', source: 'customer-profile' },
    { id: 'K007', title: 'Minimum 90-day receivable history needed for reliable predictions', category: 'Data', domain: 'Collections', confidence: 'Medium', text: 'Collections assistant requires minimum 90-day receivable history for reliable late-payment predictions. Experiments on shorter windows show significantly degraded recall.', experimentId: 'exp-001', runIds: ['run-001', 'run-002', 'run-003'], f1Delta: null, aucDelta: null, reviewStatus: 'Candidate', capturedAt: '2025-09-03', source: 'experiment-derived' },
    { id: 'K008', title: 'Customer tenure adds marginal value over risk segment alone', category: 'Feature', domain: 'Collections', confidence: 'Low', text: 'Customer tenure shows weak correlation with late-payment after controlling for risk segment. May add marginal AUC improvement in some datasets but is not consistently useful.', experimentId: 'exp-001', runIds: ['run-006', 'run-007'], f1Delta: null, aucDelta: null, reviewStatus: 'Candidate', capturedAt: '2025-09-04', source: 'experiment-derived' },
  ];
  // Add any experiment-derived learnings from the existing learnings array
  const extra = learnings.filter(l => l.source === 'experiment-derived' || l.source === 'user-added').map(l => ({
    id: l.learningId,
    title: l.text.length > 60 ? l.text.slice(0, 60) + '…' : l.text,
    category: 'Data' as const,
    domain: l.domain,
    confidence: 'Medium' as const,
    text: l.text,
    experimentId: null,
    runIds: [],
    f1Delta: null,
    aucDelta: null,
    reviewStatus: l.proposedForPack ? 'Validated' : 'Candidate' as any,
    capturedAt: l.capturedAt,
    source: l.source,
  }));
  return [...base, ...extra];
};

export default function KnowledgeLibrary({ nav, learnings, setLearnings, packVersions, setPackVersions, showToast }: Props) {
  const [items, setItems] = useState<KnowledgeItem[]>(() => seedKnowledge(learnings));
  const [activeTab, setActiveTab] = useState<'candidate' | 'validated' | 'customerSpecific'>('candidate');
  const [toastMsg, setToastMsg] = useState('');
  const [toastOpen, setToastOpen] = useState(false);

  const candidates = items.filter(i => i.reviewStatus === 'Candidate');
  const validated = items.filter(i => i.reviewStatus === 'Validated');
  const customerSpecific = items.filter(i => i.reviewStatus === 'Customer-Specific');

  const moveToValidated = useCallback((id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, reviewStatus: 'Validated' } : i));
    setToastMsg('Learning moved to Validated Knowledge');
    setToastOpen(true);
  }, []);

  const markCustomerSpecific = useCallback((id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, reviewStatus: 'Customer-Specific' } : i));
    setToastMsg('Marked as Customer-Specific — will not be reused');
    setToastOpen(true);
  }, []);

  const proposePack = useCallback((item: KnowledgeItem) => {
    const alreadyDraft = packVersions.some(v => v.version === '1.1' && v.status === 'Draft');
    if (!alreadyDraft) {
      setPackVersions(prev => [...prev, {
        version: '1.1',
        status: 'Draft',
        createdAt: new Date().toISOString(),
        validatedAt: null,
        changes: [
          { changeId: `C-${item.id}`, description: item.title, changeType: 'field_added', linkedLearningId: item.id },
        ],
        entityCount: 6,
        learningsIncorporated: 1,
      }]);
    } else {
      setPackVersions(prev => prev.map(v => v.version === '1.1' ? {
        ...v,
        changes: [...v.changes, { changeId: `C-${item.id}`, description: item.title, changeType: 'field_added', linkedLearningId: item.id }],
        learningsIncorporated: v.learningsIncorporated + 1,
      } : v));
    }
    setToastMsg(`Pack v1.1 Draft updated — "${item.title}". Customer data: NO.`);
    setToastOpen(true);
  }, [packVersions, setPackVersions]);

  const TABS: Array<{ key: typeof activeTab; label: string; count: number }> = [
    { key: 'candidate', label: 'Candidate Learnings', count: candidates.length },
    { key: 'validated', label: 'Validated Knowledge', count: validated.length },
    { key: 'customerSpecific', label: 'Customer-Specific', count: customerSpecific.length },
  ];

  const displayItems = activeTab === 'candidate' ? candidates : activeTab === 'validated' ? validated : customerSpecific;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toast open={toastOpen} duration={3000} placement="BottomCenter" onClose={() => setToastOpen(false)}>{toastMsg}</Toast>

      {/* Header */}
      <div style={{ padding: `${SP.m} ${SP.m} 0`, borderBottom: '1px solid var(--sapList_BorderColor)', background: 'var(--sapObjectHeader_Background)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SP.s }}>
          <div>
            <Title level="H4" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>Knowledge Library</Title>
            <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginTop: 2 }}>
              Reusable learnings supported by experiment evidence. Validated knowledge can be proposed as Pack improvements.
            </Text>
          </div>
          <Button design="Transparent" icon="versions" onClick={() => nav('versioning')}>Pack Versions →</Button>
        </div>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ padding: `${SP.s} ${SP.m}`, background: 'none', border: 'none', borderBottom: activeTab === t.key ? '3px solid var(--sapBrandColor)' : '3px solid transparent', cursor: 'pointer', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: activeTab === t.key ? 'var(--sapFontBoldWeight)' : 'normal', color: activeTab === t.key ? 'var(--sapBrandColor)' : 'var(--sapTextColor)', marginBottom: -1, whiteSpace: 'nowrap' }}>
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: SP.m }}>
        {activeTab === 'candidate' && (
          <MessageStrip design="Information" hideCloseButton style={{ marginBottom: SP.m }}>
            Candidate learnings have supporting evidence but have not yet been reviewed. Move to "Validated Knowledge" when confirmed, or "Customer-Specific" if not reusable.
          </MessageStrip>
        )}
        {activeTab === 'validated' && (
          <MessageStrip design="Positive" hideCloseButton style={{ marginBottom: SP.m }}>
            Validated knowledge has been reviewed and confirmed as reusable across engagements. These can be proposed as Pack changes.
          </MessageStrip>
        )}
        {activeTab === 'customerSpecific' && (
          <MessageStrip design="Warning" hideCloseButton style={{ marginBottom: SP.m }}>
            Customer-specific knowledge reflects one customer's unique context. It must NOT be applied to other customers or promoted to the Pack.
          </MessageStrip>
        )}

        {displayItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--sapTile_Background)', borderRadius: 8 }}>
            <Text style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)' }}>No items in this category yet.</Text>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: SP.s }}>
          {displayItems.map(item => (
            <div key={item.id} style={{ padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)', border: '1px solid var(--sapList_BorderColor)', borderLeft: `4px solid ${item.reviewStatus === 'Validated' ? 'var(--sapPositiveColor)' : item.reviewStatus === 'Customer-Specific' ? 'var(--sapCriticalColor)' : 'var(--sapBrandColor)'}` }}>
              {/* Title row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SP.s }}>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', fontSize: 'var(--sapFontSize)', flex: 1, marginRight: SP.m }}>{item.title}</span>
                <div style={{ display: 'flex', gap: SP.xs, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <Tag design="Set1" colorScheme={CAT_COLOR[item.category] || '1'}>{item.category}</Tag>
                  <Tag design="Set2" colorScheme="5">{item.domain}</Tag>
                  <ObjectStatus state={item.confidence === 'High' ? 'Positive' : item.confidence === 'Medium' ? 'Critical' : 'None'}>{item.confidence}</ObjectStatus>
                </div>
              </div>

              {/* Body text */}
              <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)', display: 'block', marginBottom: SP.s }}>{item.text}</Text>

              {/* Evidence */}
              {(item.experimentId || item.runIds.length > 0) && (
                <div style={{ padding: `${SP.xs} ${SP.s}`, background: 'var(--sapBackgroundColor)', borderRadius: 4, border: '1px solid var(--sapList_BorderColor)', marginBottom: SP.s }}>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapContent_LabelColor)' }}>Evidence: </span>
                  {item.experimentId && <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{item.experimentId}</span>}
                  {item.runIds.length > 0 && <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}> · Runs: {item.runIds.join(', ')}</span>}
                  {item.f1Delta && <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapPositiveColor)', marginLeft: SP.s }}>F1 {item.f1Delta}</span>}
                  {item.aucDelta && <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapPositiveColor)', marginLeft: SP.xs }}>AUC {item.aucDelta}</span>}
                </div>
              )}

              {/* Meta */}
              <div style={{ display: 'flex', gap: SP.m, marginBottom: SP.s }}>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>Captured: {item.capturedAt}</span>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>Source: {item.source}</span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: SP.s, flexWrap: 'wrap' }}>
                {item.reviewStatus === 'Candidate' && (
                  <>
                    <Button design="Emphasized" onClick={() => moveToValidated(item.id)}>Move to Validated</Button>
                    <Button design="Transparent" onClick={() => markCustomerSpecific(item.id)}>Mark Customer-Specific</Button>
                  </>
                )}
                {item.reviewStatus === 'Validated' && (
                  <Button design="Emphasized" icon="versions" onClick={() => proposePack(item)}>Propose Pack Change</Button>
                )}
                {item.reviewStatus === 'Customer-Specific' && (
                  <Button design="Transparent" onClick={() => moveToValidated(item.id)}>Reconsider — Move to Candidate</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
