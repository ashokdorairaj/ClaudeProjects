// @ts-nocheck
import React from 'react';
import { Title, Text, Button, ObjectStatus, Tag, Icon } from '@ui5/webcomponents-react';
import { SP } from '../constants';
import type { SyntheticView, Experiment } from '../types';

interface Props {
  nav: (v: SyntheticView) => void;
  experiments: Experiment[];
  onSelectExperiment: (id: string) => void;
}

const STATUS_STATE: Record<string, 'Positive' | 'Negative' | 'Critical' | 'Information' | 'None'> = {
  Draft: 'None', Running: 'Critical', Evaluating: 'Information', Validated: 'Positive', Archived: 'None',
};

export default function ExperimentsList({ nav, experiments, onSelectExperiment }: Props) {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: SP.m }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SP.m }}>
        <div>
          <Title level="H3" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>Experiments</Title>
          <Text style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)', display: 'block', marginTop: 4 }}>
            Each experiment is a specific question answered using an Experiment Pack, dataset, and selected approaches.
          </Text>
        </div>
        <Button design="Emphasized" icon="add" onClick={() => nav('experimentCreate')}>Create Experiment</Button>
      </div>

      {experiments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--sapTile_Background)', borderRadius: 8 }}>
          <Icon name="lab" style={{ width: '3rem', height: '3rem', color: 'var(--sapContent_LabelColor)', marginBottom: SP.m }} />
          <Title level="H5" wrappingType="Normal" style={{ color: 'var(--sapContent_LabelColor)' }}>No experiments yet</Title>
          <Button design="Emphasized" icon="add" onClick={() => nav('experimentCreate')} style={{ marginTop: SP.m }}>Create First Experiment</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SP.s }}>
          {experiments.map(exp => (
            <div
              key={exp.id}
              style={{ padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)', border: '1px solid var(--sapList_BorderColor)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SP.s }}>
                <div>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', fontSize: 'var(--sapFontLargeSize)', color: 'var(--sapTextColor)', display: 'block' }}>{exp.name}</span>
                  <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginTop: 2 }}>
                    {exp.customer} · Pack {exp.packVersion} · {exp.taskType} · Target: {exp.target}
                  </Text>
                </div>
                <div style={{ display: 'flex', gap: SP.s, alignItems: 'center' }}>
                  <ObjectStatus state={STATUS_STATE[exp.status] || 'None'}>{exp.status}</ObjectStatus>
                  <Button design="Emphasized" onClick={() => { onSelectExperiment(exp.id); nav('experimentWorkspace'); }}>Open</Button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: SP.m, flexWrap: 'wrap' }}>
                {[
                  ['Datasets', exp.datasetIds.length],
                  ['Runs', exp.runIds.length],
                  ['Approaches', exp.approachIds.length],
                  ['Feature Sets', exp.featureSetIds.length],
                  ['Created', exp.createdAt.slice(0,10)],
                ].map(([k, v]) => (
                  <div key={String(k)} style={{ display: 'flex', gap: 4 }}>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{k}:</span>
                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)', fontWeight: 'var(--sapFontBoldWeight)' }}>{String(v)}</span>
                  </div>
                ))}
              </div>
              {exp.question && (
                <div style={{ marginTop: SP.s, paddingTop: SP.s, borderTop: '1px solid var(--sapList_BorderColor)' }}>
                  <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', fontStyle: 'italic' }}>
                    "{exp.question}"
                  </Text>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
