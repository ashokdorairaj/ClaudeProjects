// @ts-nocheck
import React, { useState, useCallback } from 'react';
import {
  DynamicPage, DynamicPageTitle, DynamicPageHeader,
  Title, Text, Button, Tag, Icon, Switch, MessageStrip, FlexBox,
  Form, FormGroup, FormItem, Label, Input, Select, Option,
} from '@ui5/webcomponents-react';
import type { SyntheticView, ReusableLearning, PackVersion, RulesResult, MLResult } from '../types';
import { SP, SEED_LEARNINGS } from '../constants';
import KpiTile from '../components/KpiTile';
import SectionHead from '../components/SectionHead';

interface Props {
  nav: (v: SyntheticView) => void;
  learnings: ReusableLearning[];
  setLearnings: (l: ReusableLearning[]) => void;
  packVersions: PackVersion[];
  setPackVersions: (pv: PackVersion[]) => void;
  showToast: (msg: string) => void;
  rulesResult: RulesResult | null;
  mlResult: MLResult | null;
}

const DOMAINS = ['AR Collections', 'O2C', 'Procurement', 'Inventory', 'General'];

const ReusableLearnings: React.FC<Props> = ({
  nav, learnings, setLearnings, packVersions, setPackVersions, showToast, rulesResult, mlResult,
}) => {
  const [newText, setNewText] = useState('');
  const [newDomain, setNewDomain] = useState('AR Collections');
  const [v11Created, setV11Created] = useState(packVersions.some(v => v.version === 'v1.1'));

  const proposedCount = learnings.filter(l => l.proposedForPack).length;

  const toggleProposed = useCallback((id: string) => {
    setLearnings(learnings.map(l => l.learningId === id ? { ...l, proposedForPack: !l.proposedForPack } : l));
  }, [learnings, setLearnings]);

  const addLearning = useCallback(() => {
    if (!newText.trim()) return;
    const learning: ReusableLearning = {
      learningId: `L${Date.now()}`,
      domain: newDomain,
      text: newText.trim(),
      capturedAt: new Date().toISOString().split('T')[0],
      source: 'user-added',
      proposedForPack: false,
    };
    setLearnings([...learnings, learning]);
    setNewText('');
    showToast('Learning captured');
  }, [newText, newDomain, learnings, setLearnings, showToast]);

  const proposeV11 = useCallback(() => {
    const proposed = learnings.filter(l => l.proposedForPack);
    if (proposed.length === 0) return;

    const newVersion: PackVersion = {
      version: 'v1.1',
      status: 'Draft',
      createdAt: new Date().toISOString().split('T')[0],
      validatedAt: null,
      learningsIncorporated: proposed.length,
      entityCount: 6,
      changes: proposed.map((l, i) => ({
        changeId: `CHG-${String(i + 1).padStart(3, '0')}`,
        description: `Incorporated: "${l.text.slice(0, 80)}${l.text.length > 80 ? '…' : ''}"`,
        changeType: 'rule_updated',
        linkedLearningId: l.learningId,
      })),
    };

    setPackVersions([...packVersions.filter(v => v.version !== 'v1.1'), newVersion]);
    setV11Created(true);
    showToast(`Pack v1.1 Draft created with ${proposed.length} learnings`);
    nav('versioning');
  }, [learnings, packVersions, setPackVersions, showToast, nav]);

  // Auto-generate experiment-derived learnings
  const experimentLearnings: ReusableLearning[] = [];
  if (mlResult && rulesResult) {
    const diff = mlResult.auc - rulesResult.auc;
    experimentLearnings.push({
      learningId: 'EXP-1',
      domain: 'AR Collections',
      text: `${mlResult.usedFallback ? 'Decision Tree' : mlResult.modelType === 'xgboost' ? 'XGBoost' : 'GradientBoosting'} improved AUC by ${(diff * 100).toFixed(1)} points over the rules baseline on this dataset.`,
      capturedAt: new Date().toISOString().split('T')[0],
      source: 'experiment-derived',
      proposedForPack: false,
    });
    if (mlResult.featureImportances.length > 0) {
      const top = mlResult.featureImportances[0];
      experimentLearnings.push({
        learningId: 'EXP-2',
        domain: 'AR Collections',
        text: `"${top.feature}" was the top feature (${(top.importance * 100).toFixed(1)}% importance) in this experiment.`,
        capturedAt: new Date().toISOString().split('T')[0],
        source: 'experiment-derived',
        proposedForPack: false,
      });
    }
  }

  // Merge experiment learnings that aren't already in state
  const allLearnings = [
    ...experimentLearnings.filter(el => !learnings.find(l => l.learningId === el.learningId)),
    ...learnings,
  ];

  const domainColors: Record<string, string> = {
    'AR Collections': '5',
    'O2C': '3',
    'Procurement': '7',
    'Inventory': '8',
    'General': '2',
  };

  return (
    <DynamicPage
      style={{ flex: 1, overflow: 'hidden', '--ui5_dynamic_page_background': 'var(--sapObjectHeader_Background)' } as React.CSSProperties}
      headerTitle={
        <DynamicPageTitle style={{ paddingLeft: SP.m }}>
          <Title slot="heading" level="H3" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>
            Reusable Learnings
          </Title>
          <Text slot="subheading" style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)' }}>
            Generalized knowledge that improves the pack for the next engagement
          </Text>
          <div slot="actionsBar" style={{ display: 'flex', gap: SP.s, flexShrink: 0 }}>
            <Button
              design="Emphasized"
              icon="version"
              onClick={proposeV11}
              disabled={proposedCount === 0 || v11Created}
            >
              {v11Created ? 'Pack v1.1 Created' : `Propose Pack v1.1 (${proposedCount} selected)`}
            </Button>
          </div>
        </DynamicPageTitle>
      }
      headerContent={
        <DynamicPageHeader>
          <div style={{ paddingTop: SP.m, paddingBottom: SP.m, paddingLeft: SP.g, paddingRight: SP.g }}>
            <FlexBox wrap="Wrap" style={{ gap: SP.m }}>
              <KpiTile label="Total Learnings" value={allLearnings.length.toString()} />
              <KpiTile label="Proposed for Pack v1.1" value={proposedCount.toString()} sub={proposedCount > 0 ? 'Ready to incorporate' : 'Toggle switches below'} subColor={proposedCount > 0 ? 'var(--sapPositiveColor)' : 'var(--sapContent_LabelColor)'} />
              <KpiTile label="Source" value="Pre-seeded + Experiments" sub="Customer data NOT included" />
            </FlexBox>
          </div>
        </DynamicPageHeader>
      }
    >
      <div style={{ paddingTop: SP.m, paddingBottom: SP.l, paddingLeft: SP.g, paddingRight: SP.g }}>

        <MessageStrip design="Information" hideCloseButton style={{ marginBottom: SP.m }}>
          <strong>Customer transactional data is NOT copied into the pack.</strong> Only generalized, reviewed learnings can be proposed. Toggle the switches below to select which learnings to incorporate into Pack v1.1.
        </MessageStrip>

        {proposedCount >= 3 && !v11Created && (
          <MessageStrip design="Success" hideCloseButton style={{ marginBottom: SP.m }}>
            {proposedCount} learnings selected — ready to create Pack v1.1 Draft. Click "Propose Pack v1.1" above.
          </MessageStrip>
        )}

        {/* ── Add Learning Form ────────────────────────────────────────────── */}
        <SectionHead title="Add Learning" />
        <div style={{ maxWidth: 700, marginBottom: SP.l }}>
          <Form layout="S1 M2 L2 XL2" labelSpan="S12 M3 L3 XL3">
            <FormGroup headerText="">
              <FormItem labelContent={<Label showColon>Learning Text</Label>}>
                <Input
                  value={newText}
                  placeholder="Describe a generalized finding…"
                  onInput={e => setNewText(e.target.value)}
                  style={{ width: '100%', display: 'block' }}
                />
              </FormItem>
              <FormItem labelContent={<Label showColon>Domain</Label>}>
                <Select onChange={e => setNewDomain(e.detail.selectedOption.textContent?.trim() ?? 'AR Collections')}>
                  {DOMAINS.map(d => <Option key={d} selected={d === newDomain}>{d}</Option>)}
                </Select>
              </FormItem>
            </FormGroup>
          </Form>
          <Button design="Transparent" icon="add" onClick={addLearning} disabled={!newText.trim()}>
            Capture Learning
          </Button>
        </div>

        {/* ── Learnings List ───────────────────────────────────────────────── */}
        <SectionHead title="Knowledge Library" />
        <div style={{ background: 'var(--sapTile_Background)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', boxShadow: 'var(--sapContent_Shadow0)', overflow: 'hidden' }}>
          {allLearnings.map((l, i) => (
            <div key={l.learningId} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: SP.m,
              paddingTop: SP.m,
              paddingBottom: SP.m,
              paddingLeft: SP.m,
              paddingRight: SP.m,
              borderBottom: i < allLearnings.length - 1 ? '1px solid var(--sapList_BorderColor)' : 'none',
              background: l.proposedForPack ? 'var(--sapSuccessBackground, rgba(50,200,100,0.04))' : 'transparent',
            }}>
              <Icon
                name="learning-assistant"
                tooltip="Learning"
                style={{ width: '1rem', height: '1rem', color: 'var(--sapBrandColor)', marginTop: 2, flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: SP.s, marginBottom: SP.xs, flexWrap: 'wrap' }}>
                  <Tag design="Set1" colorScheme={domainColors[l.domain] ?? '2'}>{l.domain}</Tag>
                  {l.source === 'experiment-derived' && <Tag design="Information">From Experiment</Tag>}
                  {l.source === 'user-added' && <Tag>User Added</Tag>}
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{l.capturedAt}</span>
                </div>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', color: 'var(--sapTextColor)' }}>{l.text}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SP.xs, flexShrink: 0 }}>
                <Switch
                  checked={l.proposedForPack}
                  onChange={() => {
                    // For experiment-derived learnings, we need to add them to the state first
                    const existing = learnings.find(ex => ex.learningId === l.learningId);
                    if (!existing) {
                      setLearnings([...learnings, { ...l, proposedForPack: true }]);
                    } else {
                      toggleProposed(l.learningId);
                    }
                  }}
                />
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: l.proposedForPack ? 'var(--sapPositiveColor)' : 'var(--sapContent_LabelColor)' }}>
                  {l.proposedForPack ? 'Proposed' : 'Propose'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DynamicPage>
  );
};

export default ReusableLearnings;
