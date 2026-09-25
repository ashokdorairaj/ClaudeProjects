import React from 'react';
import {
  Card,
  CardHeader,
  FlexBox,
  Text,
  Icon,
  Link,
  Button,
  MessageStrip,
} from '@ui5/webcomponents-react';
import type { BayerCustomer } from '../data';

interface Props {
  customer: BayerCustomer;
}

const AISummaryCard: React.FC<Props> = ({ customer }) => {
  return (
    <Card
      header={
        <CardHeader
          titleText="AI Generated Summary"
        />
      }
      style={{ borderRadius: 'var(--sapTile_BorderCornerRadius, 12px)', overflow: 'hidden' }}
    >
      <div style={{ padding: '1rem' }}>

        {/* Summary text — or info strip if none */}
        {customer.accountSummary ? (
          <Text style={{ display: 'block', marginBottom: customer.hitlPending ? '1rem' : 0 }}>
            {customer.accountSummary}
          </Text>
        ) : (
          <MessageStrip
            design="Information"
            hideCloseButton
            style={{ marginBottom: customer.hitlPending ? '1rem' : 0 }}
          >
            No AI summary available. Run the agent to generate one.
          </MessageStrip>
        )}

        {/* HITL Action card — light blue bg #d1efff, radius 8px, padding 12px */}
        {customer.hitlPending && (
          <div style={{
            background: '#d1efff',
            borderRadius: '8px',
            padding: '12px',
          }}>
            <Text style={{
              fontWeight: 'var(--sapFontBoldWeight)',
              display: 'block',
              marginBottom: '0.5rem',
            }}>
              Action for you to take - Email the Customer
            </Text>
            <FlexBox alignItems="Center" style={{ gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Icon name="email" style={{ width: '1rem', height: '1rem' }} />
              <Text>
                {customer.hitlSubject || 'Agent wants to send an email: Follow-up: Payment Plan Discussion'}
              </Text>
            </FlexBox>
            <FlexBox alignItems="Center" style={{ gap: '0.75rem' }}>
              <Button icon="paper-plane" design="Default">Email customer</Button>
              <Link>Discard suggestion</Link>
            </FlexBox>
          </div>
        )}

      </div>
    </Card>
  );
};

export default AISummaryCard;
