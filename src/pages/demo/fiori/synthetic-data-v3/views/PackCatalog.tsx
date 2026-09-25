import React from 'react';
import {
  FlexBox, Title, Text, Button, ObjectStatus, Card, CardHeader, Icon,
} from '@ui5/webcomponents-react';
import type { SyntheticView } from '../types';
import { SP } from '../../synthetic-data-v2/constants';

interface Props {
  nav: (v: SyntheticView) => void;
  onDefineNewPack: () => void;
  onProposeUpdate: (packId: string) => void;
}

const PACKS = [
  {
    id: 'collections-v1',
    name: 'Collections & Disputes',
    domain: 'Finance',
    description: 'Identify receivables at risk of late payment or dispute. Improve collections prioritization, reduce manual triage, and accelerate cash recovery.',
    experiments: [
      'Late Payment Prediction',
      'Collections Prioritization',
      'Dispute Prediction',
      'Propensity to Pay',
      'Expected Collections Amount',
    ],
    sapProducts: ['FSCM', 'S/4 Accounts Receivable'],
    version: 'v1.0',
    status: 'Validated',
    entityCount: 6,
    icon: 'finance',
    available: true,
  },
  {
    id: 'procurement-v09',
    name: 'Procurement Assistant',
    domain: 'Procurement',
    description: 'Improve purchase order processing, supplier risk assessment, and 3-way match automation. Reduce invoice holds and speed up goods receipt.',
    experiments: [
      'PO Approval Risk',
      'Supplier Risk Scoring',
      '3-Way Match Automation',
    ],
    sapProducts: ['Ariba', 'S/4 Procurement'],
    version: 'v0.9',
    status: 'Draft',
    entityCount: 5,
    icon: 'supplier',
    available: false,
  },
  {
    id: 'tm-v08',
    name: 'Transportation Management',
    domain: 'Supply Chain',
    description: 'Optimize freight planning, carrier selection, and on-time delivery prediction. Reduce unplanned stops and improve transport utilization.',
    experiments: [
      'Delivery Delay Prediction',
      'Carrier Performance Scoring',
      'Freight Cost Optimization',
      'Unplanned Stop Detection',
    ],
    sapProducts: ['SAP TM', 'S/4 Logistics'],
    version: 'v0.8',
    status: 'Draft',
    entityCount: 7,
    icon: 'shipping-status',
    available: false,
  },
];

const STATUS_STATE: Record<string, 'Positive' | 'Information' | 'Critical'> = {
  Validated: 'Positive',
  Draft: 'Information',
};

const PackCatalog: React.FC<Props> = ({ nav, onDefineNewPack, onProposeUpdate }) => {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: SP.l }}>
      <FlexBox justifyContent="SpaceBetween" alignItems="Center" style={{ marginBottom: SP.m }}>
        <div>
          <Title level="H2">Experiment Packs</Title>
          <Text style={{ display: 'block', color: 'var(--sapContent_LabelColor)', marginTop: 4 }}>
            Reusable SAP domain knowledge — schemas, business rules, and validated experiment patterns.
          </Text>
        </div>
        <Button design="Emphasized" icon="add" onClick={onDefineNewPack}>
          Define New Pack
        </Button>
      </FlexBox>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: SP.m }}>
        {PACKS.map(pack => (
          <Card
            key={pack.id}
            header={
              <CardHeader
                titleText={pack.name}
                subtitleText={pack.domain}
                action={
                  <FlexBox gap={SP.xs} alignItems="Center">
                    <ObjectStatus state={STATUS_STATE[pack.status] ?? 'Information'}>
                      {pack.status}
                    </ObjectStatus>
                    <Text style={{ fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)' }}>
                      {pack.version}
                    </Text>
                  </FlexBox>
                }
              />
            }
          >
            <div style={{ padding: `0 ${SP.m} ${SP.m}` }}>
              <Text style={{
                display: 'block', fontSize: '0.875rem',
                color: 'var(--sapContent_LabelColor)', lineHeight: 1.6,
                marginBottom: SP.m,
              }}>
                {pack.description}
              </Text>

              {/* SAP Products */}
              <FlexBox gap={SP.xs} style={{ marginBottom: SP.m, flexWrap: 'wrap' }}>
                {pack.sapProducts.map(p => (
                  <div key={p} style={{
                    background: 'var(--sapHighlightBackground)',
                    color: 'var(--sapHighlightColor)',
                    borderRadius: 4, padding: '2px 8px',
                    fontSize: '0.75rem', fontWeight: 600,
                  }}>
                    {p}
                  </div>
                ))}
              </FlexBox>

              {/* Supported Experiments */}
              <div style={{ marginBottom: SP.m }}>
                <Text style={{
                  display: 'block', fontSize: '0.75rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  color: 'var(--sapContent_LabelColor)', marginBottom: SP.xs,
                }}>
                  Supported Experiments ({pack.experiments.length})
                </Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {pack.experiments.map(exp => (
                    <FlexBox key={exp} gap="6px" alignItems="Center">
                      <Icon name="activities" style={{ fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)', flexShrink: 0 }} />
                      <Text style={{ fontSize: '0.875rem' }}>{exp}</Text>
                    </FlexBox>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <FlexBox justifyContent="SpaceBetween" alignItems="Center">
                <Text style={{ fontSize: '0.75rem', color: 'var(--sapContent_LabelColor)' }}>
                  {pack.entityCount} entities
                </Text>
                <FlexBox gap={SP.s}>
                  {pack.available ? (
                    <>
                      <Button design="Default" onClick={() => onProposeUpdate(pack.id)}>
                        Propose Update
                      </Button>
                      <Button design="Emphasized" onClick={() => nav('packDetail')}>
                        Open Pack
                      </Button>
                    </>
                  ) : (
                    <Button design="Default" disabled>Coming Soon</Button>
                  )}
                </FlexBox>
              </FlexBox>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PackCatalog;
