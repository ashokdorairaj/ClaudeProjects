import React from 'react';
import {
  FlexBox,
  Title,
  Text,
  Button,
  Card,
  CardHeader,
  ObjectStatus,
  Icon,
} from '@ui5/webcomponents-react';
import type { Engagement, SyntheticView } from '../types';
import { SP } from '../../synthetic-data-v2/constants';

interface Props {
  nav: (v: SyntheticView) => void;
  onNewEngagement: () => void;
  engagements: Engagement[];
}

const STAGE_LABELS: Record<string, string> = {
  'use-case': 'Use Case',
  'prototype-data': 'Prototype Data',
  'recommendation': 'Recommendation',
  'experiment': 'Experiment',
  'handoff': 'Handoff',
};

const STAGE_STATE: Record<string, 'Positive' | 'Information' | 'Critical' | 'None'> = {
  'use-case': 'None',
  'prototype-data': 'Information',
  'recommendation': 'Critical',
  'experiment': 'Critical',
  'handoff': 'Positive',
};

const HomePage: React.FC<Props> = ({ nav, onNewEngagement, engagements }) => {
  const recent = engagements.slice(-3).reverse();

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: SP.l }}>

      {/* Hero */}
      <div style={{
        background: 'var(--sapBaseColor)',
        border: '1px solid var(--sapGroup_TitleBorderColor)',
        borderRadius: 12,
        padding: `${SP.xl} ${SP.xl}`,
        marginBottom: SP.l,
        textAlign: 'center',
      }}>
        <Title level="H1" style={{ marginBottom: SP.s, fontSize: '1.75rem' }}>
          SAP Enterprise Synthetic Data &amp; Experiment Accelerator
        </Title>
        <Text style={{
          display: 'block',
          color: 'var(--sapContent_LabelColor)',
          fontSize: '1.0625rem',
          marginBottom: SP.l,
          maxWidth: 640,
          margin: `0 auto ${SP.l}`,
          lineHeight: 1.6,
        }}>
          Move an approved use case from prototype data to technical recommendation.
        </Text>
        <FlexBox justifyContent="Center" gap={SP.s} style={{ flexWrap: 'wrap' }}>
          <Button design="Emphasized" icon="journey-arrive" onClick={onNewEngagement}>
            Start New Engagement
          </Button>
          <Button design="Default" icon="customer" onClick={() => nav('engagements')}>
            Open Existing Engagement
          </Button>
        </FlexBox>
        <FlexBox justifyContent="Center" gap={SP.l} style={{ marginTop: SP.m, flexWrap: 'wrap' }}>
          <Button design="Transparent" icon="course-book" onClick={() => nav('packs')}>
            Browse Experiment Packs
          </Button>
          <Button design="Transparent" icon="add-document" onClick={() => nav('datasets')}>
            Browse Datasets
          </Button>
        </FlexBox>
      </div>

      {/* Recent Engagements */}
      {recent.length > 0 && (
        <div style={{ marginBottom: SP.l }}>
          <FlexBox justifyContent="SpaceBetween" alignItems="Center" style={{ marginBottom: SP.s }}>
            <Title level="H3">Recent Engagements</Title>
            <Button design="Transparent" icon="arrow-right" onClick={() => nav('engagements')}>
              View All
            </Button>
          </FlexBox>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: SP.m }}>
            {recent.map(eng => (
              <Card
                key={eng.id}
                header={
                  <CardHeader
                    titleText={eng.name}
                    subtitleText={eng.customer}
                    interactive
                    onClick={() => nav('engagements')}
                  />
                }
                style={{ cursor: 'pointer' }}
                onClick={() => nav('engagements')}
              >
                <div style={{ padding: `${SP.s} ${SP.m} ${SP.m}`, display: 'flex', flexDirection: 'column', gap: SP.xs }}>
                  <ObjectStatus
                    state={STAGE_STATE[eng.stage] ?? 'None'}
                    style={{ fontSize: '0.875rem', alignSelf: 'flex-start' }}
                  >
                    {STAGE_LABELS[eng.stage] ?? eng.stage}
                  </ObjectStatus>
                  {eng.packId && eng.packId !== 'none' && (
                    <Text style={{ fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)' }}>
                      Pack: Collections &amp; Disputes {eng.packVersion}
                    </Text>
                  )}
                  {eng.currentDatasetId ? (
                    <Text style={{ fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)' }}>
                      Dataset: {eng.currentDatasetId.replace('ds-northstar-', '').replace('-v1', ' v1').toUpperCase()}
                    </Text>
                  ) : (
                    <Text style={{ fontSize: '0.8125rem', color: 'var(--sapNeutralColor, #6a6d70)' }}>
                      No dataset yet
                    </Text>
                  )}
                  <Text style={{ fontSize: '0.75rem', color: 'var(--sapContent_LabelColor)' }}>
                    {eng.createdAt?.slice(0, 10)}
                  </Text>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* How it works */}
      <Card header={<CardHeader titleText="How it works" />}>
        <div style={{ padding: SP.m }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: SP.m }}>
            {[
              { step: '1', label: 'Start or Open an Engagement', desc: 'Select a use case from an existing engagement or start a new one.' },
              { step: '2', label: 'Get Prototype Data', desc: 'Use a ready-made reference dataset instantly — no customer data needed to start.' },
              { step: '3', label: 'Get a Technical Recommendation', desc: 'Enter the business question. The system uses all your engagement context to recommend an approach.' },
              { step: '4', label: 'Run Experiments', desc: 'Compare approaches with real data. Evidence informs your engineering discussion.' },
              { step: '5', label: 'Generate Engineering Handoff', desc: 'Export a complete handoff with requirements, data, evidence, and open questions.' },
            ].map(item => (
              <div key={item.step} style={{ display: 'flex', gap: SP.s }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--sapHighlightColor)',
                  color: '#fff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '0.875rem',
                  fontWeight: 700, flexShrink: 0,
                }}>
                  {item.step}
                </div>
                <div>
                  <Text style={{ display: 'block', fontWeight: 700, fontSize: '0.9375rem', marginBottom: 2 }}>
                    {item.label}
                  </Text>
                  <Text style={{ fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)', lineHeight: 1.5 }}>
                    {item.desc}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

    </div>
  );
};

export default HomePage;
