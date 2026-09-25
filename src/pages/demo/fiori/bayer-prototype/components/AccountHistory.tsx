import React from 'react';
import { FlexBox, Text, Icon } from '@ui5/webcomponents-react';
import type { BayerCommunication } from '../data';

interface Props {
  communications: BayerCommunication[];
}

const AccountHistory: React.FC<Props> = ({ communications }) => {
  if (communications.length === 0) {
    return <Text style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)' }}>No communications recorded.</Text>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {communications.map((comm, idx) => (
        <div key={comm.id} style={{ display: 'flex', gap: '0.75rem', paddingBottom: '1rem' }}>
          {/* Timeline dot + line */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '1.5rem' }}>
            <div style={{
              width: '0.625rem',
              height: '0.625rem',
              borderRadius: '50%',
              background: comm.direction === 'outbound' ? 'var(--sapPositiveColor)' : 'var(--sapNeutralColor)',
              flexShrink: 0,
              marginTop: '0.25rem',
            }} />
            {idx < communications.length - 1 && (
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
            <FlexBox alignItems="Center" style={{ gap: '0.375rem' }}>
              <Icon name={comm.direction === 'outbound' ? 'email' : 'incoming-call'} style={{ fontSize: '0.75rem', color: 'var(--sapContent_LabelColor)' }} />
              <Text style={{
                fontFamily: 'var(--sapFontFamily)',
                fontSize: '0.75rem',
                color: 'var(--sapContent_LabelColor)',
              }}>
                {new Date(comm.sentDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </FlexBox>
            <Text style={{
              fontFamily: 'var(--sapFontFamily)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              display: 'block',
              marginTop: '0.25rem',
            }}>
              {comm.subject}
            </Text>
            <Text style={{
              fontFamily: 'var(--sapFontFamily)',
              fontSize: '0.75rem',
              color: 'var(--sapContent_LabelColor)',
              display: 'block',
              marginTop: '0.125rem',
            }}>
              {comm.summary}
            </Text>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AccountHistory;
