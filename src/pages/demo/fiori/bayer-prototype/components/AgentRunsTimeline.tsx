// @ts-nocheck
import React from 'react';
import { FlexBox, Text, Icon, ObjectStatus } from '@ui5/webcomponents-react';

import type { BayerActivity } from '../data';

interface Props {
  activities: BayerActivity[];
}

const AgentRunsTimeline: React.FC<Props> = ({ activities }) => {
  if (activities.length === 0) {
    return <Text style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)' }}>No agent runs recorded.</Text>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {activities.map((activity, idx) => (
        <div key={activity.id} style={{ display: 'flex', gap: '0.75rem', paddingBottom: '1rem' }}>
          {/* Timeline dot + line */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '1.5rem' }}>
            <div style={{
              width: '0.625rem',
              height: '0.625rem',
              borderRadius: '50%',
              background: 'var(--sapInformativeColor)',
              flexShrink: 0,
              marginTop: '0.25rem',
            }} />
            {idx < activities.length - 1 && (
              <div style={{
                width: '1px',
                flex: 1,
                background: 'var(--sapContent_ForegroundBorderColor)',
                marginTop: '0.25rem',
              }} />
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1 }}>
            <Text style={{
              fontFamily: 'var(--sapFontFamily)',
              fontSize: '0.75rem',
              color: 'var(--sapContent_LabelColor)',
              display: 'block',
            }}>
              {new Date(activity.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={{
              fontFamily: 'var(--sapFontFamily)',
              fontSize: '0.8125rem',
              display: 'block',
              marginTop: '0.25rem',
            }}>
              {activity.description}
            </Text>
            <Text style={{
              fontFamily: 'var(--sapFontFamily)',
              fontSize: '0.75rem',
              color: 'var(--sapContent_LabelColor)',
              display: 'block',
              marginTop: '0.125rem',
            }}>
              {activity.performedBy}
            </Text>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AgentRunsTimeline;
