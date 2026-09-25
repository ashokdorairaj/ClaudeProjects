// @ts-nocheck
import React from 'react';
import { FlexBox, Text, ObjectStatus } from '@ui5/webcomponents-react';

import type { BayerCustomer } from '../data';

interface Props {
  customer: BayerCustomer;
}

function fmtAmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + ' ' + currency;
}

interface TileProps {
  label: string;
  value: string | number;
  state?;
}

const KpiTile: React.FC<TileProps> = ({ label, value, state }) => (
  <div style={{
    flex: '1 1 30%',
    minWidth: '140px',
    padding: '0.75rem',
    background: 'var(--sapBackgroundColor)',
    borderRadius: '0.5rem',
  }}>
    <Text style={{
      fontFamily: 'var(--sapFontFamily)',
      fontSize: '1.25rem',
      fontWeight: 700,
      display: 'block',
      color: state === 'Negative' ? 'var(--sapNegativeTextColor)' : 'var(--sapTextColor)',
    }}>
      {value}
    </Text>
    <Text style={{
      fontFamily: 'var(--sapFontFamily)',
      fontSize: '0.75rem',
      color: 'var(--sapContent_LabelColor)',
      display: 'block',
      marginTop: '0.25rem',
    }}>
      {label}
    </Text>
  </div>
);

const SummaryTiles: React.FC<Props> = ({ customer }) => {
  return (
    <FlexBox wrap="Wrap" style={{ gap: '0.75rem' }}>
      <KpiTile label="Number of Overdue Invoices" value={customer.overdueCount} state={'Negative'} />
      <KpiTile label="Number of Invoices Due in 7 Days" value={customer.due7DaysCount} />
      <KpiTile label="Number of Dispute Cases" value={customer.disputesCount} />
      <KpiTile label="Total Value of Overdue Invoices" value={fmtAmt(customer.overdueAmount, customer.currency)} state={'Negative'} />
      <KpiTile label="Total Value of Invoices Due in 7 Days" value={fmtAmt(customer.due7DaysAmount, customer.currency)} />
      <KpiTile label="Total Value of Dispute Cases" value={fmtAmt(customer.disputesAmount, customer.currency)} />
    </FlexBox>
  );
};

export default SummaryTiles;
