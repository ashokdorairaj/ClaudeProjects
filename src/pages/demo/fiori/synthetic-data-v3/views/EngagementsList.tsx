import React from 'react';
import {
  FlexBox,
  Title,
  Text,
  Button,
  ObjectStatus,
  Icon,
  IllustratedMessage,
} from '@ui5/webcomponents-react';
import type { Engagement, SyntheticView, EngagementStage } from '../types';
import { SP } from '../../synthetic-data-v2/constants';

interface Props {
  nav: (v: SyntheticView) => void;
  engagements: Engagement[];
  onNewEngagement: () => void;
  onOpenEngagement: (id: string) => void;
}

const STAGES: EngagementStage[] = [
  'use-case', 'prototype-data', 'recommendation', 'experiment', 'handoff',
];

const STAGE_SHORT: Record<EngagementStage, string> = {
  'use-case': 'Use Case',
  'prototype-data': 'Data',
  'recommendation': 'Recommendation',
  'experiment': 'Experiment',
  'handoff': 'Handoff',
};

const DEMO_STATUS_STATE: Record<string, 'Positive' | 'Information' | 'Critical' | 'None'> = {
  'Accepted': 'Positive',
  'Customer Review': 'Information',
  'In Progress': 'None',
  'Not Started': 'None',
};

function StageDots({ current }: { current: EngagementStage }) {
  const idx = STAGES.indexOf(current);
  return (
    <FlexBox gap="4px" alignItems="Center">
      {STAGES.map((s, i) => (
        <div
          key={s}
          title={STAGE_SHORT[s]}
          style={{
            width: i === idx ? 10 : 8,
            height: i === idx ? 10 : 8,
            borderRadius: '50%',
            background: i < idx
              ? 'var(--sapPositiveColor)'
              : i === idx
                ? 'var(--sapHighlightColor)'
                : 'var(--sapField_BorderColor)',
            transition: 'all 0.2s',
          }}
        />
      ))}
      <Text style={{ fontSize: '0.75rem', color: 'var(--sapContent_LabelColor)', marginLeft: 4 }}>
        {STAGE_SHORT[current]}
      </Text>
    </FlexBox>
  );
}

const EngagementsList: React.FC<Props> = ({ nav, engagements, onNewEngagement, onOpenEngagement }) => {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: SP.l }}>
      <FlexBox justifyContent="SpaceBetween" alignItems="Center" style={{ marginBottom: SP.m }}>
        <Title level="H2">Engagements</Title>
        <Button design="Emphasized" icon="add" onClick={onNewEngagement}>
          New Engagement
        </Button>
      </FlexBox>

      {engagements.length === 0 ? (
        <IllustratedMessage name="EmptyList" titleText="No engagements yet" subtitleText="Start by creating your first engagement.">
          <Button slot="action" design="Emphasized" onClick={onNewEngagement}>
            Create First Engagement
          </Button>
        </IllustratedMessage>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SP.s }}>
          {/* Header row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.2fr 2fr 1.2fr 1fr',
            gap: SP.m,
            padding: `${SP.xs} ${SP.m}`,
            borderBottom: '1px solid var(--sapGroup_TitleBorderColor)',
          }}>
            {['Engagement', 'Customer', 'Progress', 'Demo Status', 'Created'].map(h => (
              <Text key={h} style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--sapContent_LabelColor)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {h}
              </Text>
            ))}
          </div>

          {engagements.map(eng => (
            <div
              key={eng.id}
              onClick={() => onOpenEngagement(eng.id)}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.2fr 2fr 1.2fr 1fr',
                gap: SP.m,
                padding: SP.m,
                background: 'var(--sapBaseColor)',
                border: '1px solid var(--sapGroup_TitleBorderColor)',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'box-shadow 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--sapHighlightColor)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--sapGroup_TitleBorderColor)';
              }}
            >
              <div>
                <Text style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>{eng.name}</Text>
                <Text style={{ fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)' }}>
                  {eng.useCaseName || eng.businessProblem.slice(0, 50) + (eng.businessProblem.length > 50 ? '…' : '')}
                </Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <FlexBox gap={SP.xs} alignItems="Center">
                  <Icon name="customer" style={{ fontSize: '0.875rem', color: 'var(--sapContent_LabelColor)' }} />
                  <Text style={{ fontSize: '0.875rem' }}>{eng.customer || '—'}</Text>
                </FlexBox>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <StageDots current={eng.stage} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <ObjectStatus state={DEMO_STATUS_STATE[eng.demoStatus] ?? 'None'} style={{ fontSize: '0.875rem' }}>
                  {eng.demoStatus}
                </ObjectStatus>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Text style={{ fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)' }}>
                  {eng.createdAt.slice(0, 10)}
                </Text>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EngagementsList;
