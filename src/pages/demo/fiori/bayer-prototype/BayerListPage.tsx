// @ts-nocheck
import React, { useState, useMemo } from 'react';
import {
  ThemeProvider,
  ShellBar,
  Avatar,
  ResponsivePopover,
  List,
  ListItemStandard,
  Bar,
  DynamicPage,
  DynamicPageTitle,
  Toolbar,
  ToolbarSpacer,
  Button,
  Input,
  Select,
  Option,
  Table,
  TableHeaderRow,
  TableHeaderCell,
  TableRow,
  TableCell,
  ObjectStatus,
  FlexBox,
  Icon,
  Text,
  Title,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-react/styles.css';
import '@ui5/webcomponents-icons/dist/AllIcons.js';
import { CUSTOMERS, type BayerCustomer } from './data';

interface Props {
  onSelectCustomer: (c: BayerCustomer) => void;
}

function fmtAmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + ' ' + currency;
}

const BayerListPage: React.FC<Props> = ({ onSelectCustomer }) => {
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverOpener, setPopoverOpener] = useState<HTMLElement | null>(null);
  const [variantOpen, setVariantOpen] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  const filtered = useMemo(() => {
    let rows = [...CUSTOMERS];
    if (filterPriority !== 'All') rows = rows.filter(c => String(c.priority) === filterPriority);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(c =>
        c.customerName.toLowerCase().includes(q) ||
        c.customerNumber.includes(q)
      );
    }
    rows.sort((a, b) => a.priority - b.priority);
    return rows;
  }, [search, filterPriority]);

  return (
    <ThemeProvider>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--sapBackgroundColor)' }}>

        {/* Shell Bar */}
        <ShellBar
          primaryTitle="Collection Assistant"
          logo={
            <img
              src="https://www.sap.com/dam/application/shared/logos/sap-logo-svg.svg/sap-logo-svg.svg"
              alt="SAP"
              style={{ height: 28 }}
            />
          }
          profile={
            <Avatar slot="profile" colorScheme="6" shape="Circle" size="XS" initials="JL" accessibleName="Jordan Lee — profile" />
          }
          onProfileClick={(e) => {
            setPopoverOpener(e.detail.targetRef as HTMLElement);
            setPopoverOpen(true);
          }}
        />
        <ResponsivePopover
          open={popoverOpen}
          opener={popoverOpener ?? undefined}
          placement="Bottom"
          onClose={() => setPopoverOpen(false)}
        >
          <List>
            <ListItemStandard icon="person-placeholder">Jordan Lee</ListItemStandard>
            <ListItemStandard icon="log">Sign Out</ListItemStandard>
          </List>
        </ResponsivePopover>

        {/* Dynamic Page */}
        <DynamicPage
          style={{ flex: 1, overflow: 'hidden' }}
          showHideHeaderButton={false}
          headerContentPinnable={false}
          titleArea={
            <DynamicPageTitle
              style={{ paddingLeft: '48px', paddingRight: '48px' }}
              heading={
                <div
                  id="variantOpenerV2"
                  onClick={() => setVariantOpen(!variantOpen)}
                  style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                >
                  <h2 style={{
                    fontFamily: '"72Black", "72Blackfull", "72", "72full", Arial, Helvetica, sans-serif',
                    fontSize: '24px',
                    fontWeight: 400,
                    color: 'var(--sapButton_TextColor, #0064d9)',
                    margin: 0,
                  }}>Standard</h2>
                  <svg width="12" height="12" viewBox="0 0 16 16" style={{ marginLeft: '6px', fill: 'var(--sapButton_TextColor, #0064d9)' }}>
                    <path d="M12.83 6.273a.75.75 0 0 1-.104 1.056l-4.247 3.5a.75.75 0 0 1-.954 0l-4.252-3.5a.75.75 0 0 1 .954-1.158l3.775 3.107 3.771-3.107a.75.75 0 0 1 1.056.102Z" />
                  </svg>
                </div>
              }
              actionsBar={
                <Toolbar>
                  <ToolbarSpacer />
                  <div id="shareMenuOpenerV2" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShareMenuOpen(!shareMenuOpen)}>
                    <Icon name="action" style={{ color: 'var(--sapButton_TextColor)', fontSize: '1rem' }} />
                    <svg width="10" height="10" viewBox="0 0 16 16" style={{ marginLeft: '4px', fill: 'var(--sapButton_TextColor)' }}>
                      <path d="M12.83 6.273a.75.75 0 0 1-.104 1.056l-4.247 3.5a.75.75 0 0 1-.954 0l-4.252-3.5a.75.75 0 0 1 .954-1.158l3.775 3.107 3.771-3.107a.75.75 0 0 1 1.056.102Z" />
                    </svg>
                  </div>
                </Toolbar>
              }
            />
          }
        >
          {/* Table toolbar */}
          <Toolbar style={{ background: 'var(--sapList_HeaderBackground)', borderBottom: '1px solid var(--sapList_BorderColor)', height: '2.75rem' }}>
            <Title level="H5" wrappingType="Normal">Customers ({filtered.length})</Title>
            <ToolbarSpacer />
            <Input
              placeholder="Search..."
              value={search}
              onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
              style={{ width: 200 }}
            />
            <Select
              onChange={(e) => setFilterPriority(e.detail.selectedOption.value ?? 'All')}
              style={{ width: 150 }}
            >
              <Option value="All">All Priorities</Option>
              <Option value="1">High</Option>
              <Option value="2">Medium</Option>
              <Option value="3">Low</Option>
            </Select>
            <Button icon="action-settings" design="Transparent" tooltip="Settings" />
          </Toolbar>

          {/* Table — sap.m.Table equivalent */}
          <Table
            noDataText="No accounts match this filter"
            headerRow={
              <TableHeaderRow sticky>
                <TableHeaderCell width="100px"><span>Customer Number</span></TableHeaderCell>
                <TableHeaderCell><span>Customer Name</span></TableHeaderCell>
                <TableHeaderCell width="140px"><span>Overdue Amount</span></TableHeaderCell>
                <TableHeaderCell width="140px"><span>Amount in EUR</span></TableHeaderCell>
                <TableHeaderCell width="80px"><span>DSO</span></TableHeaderCell>
                <TableHeaderCell width="100px"><span>Max Arrears Days</span></TableHeaderCell>
                <TableHeaderCell width="110px"><span>Max Pred. Delayed</span></TableHeaderCell>
                <TableHeaderCell width="110px"><span>Last Comm. Date</span></TableHeaderCell>
                <TableHeaderCell width="90px"><span>Priority</span></TableHeaderCell>
                <TableHeaderCell width="200px"><span>AI Recommended Action</span></TableHeaderCell>
                <TableHeaderCell width="32px" />
              </TableHeaderRow>
            }
          >
            {filtered.map(c => (
              <TableRow
                key={c.id}
                rowKey={c.id}
                interactive
                onClick={() => onSelectCustomer(c)}
              >
                <TableCell><Text>{c.customerNumber}</Text></TableCell>
                <TableCell>
                  <Text style={{ color: 'var(--sapLinkColor)', fontWeight: 'var(--sapFontBoldWeight)' }}>
                    {c.customerName}
                  </Text>
                </TableCell>
                <TableCell><Text>{fmtAmt(c.amountOutstanding, c.currency)}</Text></TableCell>
                <TableCell><Text>{fmtAmt(c.amountOutstandingEur, 'EUR')}</Text></TableCell>
                <TableCell><Text>{c.dsoPerCustomer > 0 ? c.dsoPerCustomer : 0}</Text></TableCell>
                <TableCell>
                  <Text style={{ color: c.maxArrearsDays > 60 ? 'var(--sapNegativeTextColor)' : undefined }}>
                    {c.maxArrearsDays}
                  </Text>
                </TableCell>
                <TableCell>
                  <Text style={{ color: c.maxPredDelayed > 30 ? 'var(--sapCriticalTextColor)' : undefined }}>
                    {c.maxPredDelayed}
                  </Text>
                </TableCell>
                <TableCell><Text>{c.lastCommDate}</Text></TableCell>
                <TableCell>
                  <ObjectStatus
                    state={c.priority === 1 ? 'Negative' : c.priority === 2 ? 'Critical' : 'Positive'}
                    inverted
                    showDefaultIcon
                  >
                    {c.priority === 1 ? 'High' : c.priority === 2 ? 'Medium' : 'Low'}
                  </ObjectStatus>
                </TableCell>
                <TableCell>
                  {c.recommendedAction !== '—' ? (
                    <FlexBox alignItems="Center" style={{ gap: '0.375rem' }}>
                      <Icon name="ai" style={{ color: 'var(--sapInformativeColor)', width: '1rem', height: '1rem' }} />
                      <Text>{c.recommendedAction}</Text>
                    </FlexBox>
                  ) : (
                    <Text style={{ color: 'var(--sapContent_LabelColor)' }}>—</Text>
                  )}
                </TableCell>
                <TableCell>
                  <Icon name="slim-arrow-right" style={{ color: 'var(--sapContent_LabelColor)' }} />
                </TableCell>
              </TableRow>
            ))}
          </Table>
        </DynamicPage>

        <ResponsivePopover
          open={variantOpen}
          opener="variantOpenerV2"
          placement="Bottom"
          onClose={() => setVariantOpen(false)}
          headerText="My Views"
          style={{ minWidth: '20rem' }}
        >
          <List selectionMode="Single">
            <ListItemStandard selected>Standard</ListItemStandard>
          </List>
          <Bar
            slot="footer"
            endContent={
              <FlexBox style={{ gap: '0.5rem' }}>
                <Button design="Emphasized">Save As</Button>
                <Button design="Transparent">Manage</Button>
              </FlexBox>
            }
          />
        </ResponsivePopover>

        <ResponsivePopover
          open={shareMenuOpen}
          opener="shareMenuOpenerV2"
          placement="Bottom"
          onClose={() => setShareMenuOpen(false)}
        >
          <List>
            <ListItemStandard icon="email">Send E-Mail</ListItemStandard>
            <ListItemStandard icon="add-favorite">Save as Tile</ListItemStandard>
          </List>
        </ResponsivePopover>

      </div>
    </ThemeProvider>
  );
};

export default BayerListPage;
