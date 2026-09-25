import React from 'react';
import { AnalyticalTable, ObjectStatus, Text } from '@ui5/webcomponents-react';

import type { BayerInvoice } from '../data';

interface Props {
  invoices: BayerInvoice[];
  currency: string;
}

function fmtAmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + ' ' + currency;
}

const InvoicesTable: React.FC<Props> = ({ invoices, currency }) => {
  const columns = [
    { Header: 'Document #', accessor: 'documentNumber', width: 120 },
    { Header: 'Type', accessor: 'documentTypeText', width: 120 },
    {
      Header: 'Amount',
      accessor: 'amount',
      width: 140,
      Cell: ({ value, row }: any) => (
        <Text style={{ fontFamily: 'var(--sapFontFamily)' }}>{fmtAmt(value, row.original.currency || currency)}</Text>
      ),
    },
    { Header: 'Due Date', accessor: 'dueDate', width: 110 },
    {
      Header: 'Days Overdue',
      accessor: 'daysOverdue',
      width: 110,
      Cell: ({ value, row }: any) => (
        row.original.isOverdue
          ? <ObjectStatus state={'Negative'}>{value} days</ObjectStatus>
          : <Text style={{ fontFamily: 'var(--sapFontFamily)' }}>—</Text>
      ),
    },
    {
      Header: 'Status',
      accessor: 'isOverdue',
      width: 100,
      Cell: ({ value }: any) => (
        <ObjectStatus state={value ? 'Negative' : 'Positive'}>
          {value ? 'Overdue' : 'On time'}
        </ObjectStatus>
      ),
    },
  ];

  return (
    <AnalyticalTable
      columns={columns}
      data={invoices}
      selectionMode="None"
      visibleRows={Math.max(invoices.length, 3)}
      minRows={3}
      alternateRowColor
      sortable
      scaleWidthMode="Smart"
      noDataText="No open items"
    />
  );
};

export default InvoicesTable;
