// @ts-nocheck
import React, { useState } from 'react';
import {
  ThemeProvider,
  ShellBar,
  Avatar,
  ResponsivePopover,
  List,
  ListItemStandard,
  ObjectPage,
  ObjectPageTitle,
  ObjectPageHeader,
  ObjectPageSection,
  Title,
  Label,
  Text,
  Link,
  Icon,
  Button,
  FlexBox,
  ObjectStatus,
  Toolbar,
  ToolbarSpacer,
  MessageStrip,
  Panel,
  TabContainer,
  Tab,
  SegmentedButton,
  SegmentedButtonItem,
  Table,
  TableHeaderRow,
  TableHeaderCell,
  TableRow,
  TableCell,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-react/styles.css';
import '@ui5/webcomponents-icons/dist/AllIcons.js';
import {
  COMMUNICATIONS,
  INVOICES,
  ACTIVITIES,
  type BayerCustomer,
} from './data';

interface Props {
  customer: BayerCustomer;
  onBack: () => void;
}

function fmtAmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + ' ' + currency;
}

const BayerObjectPage: React.FC<Props> = ({ customer, onBack }) => {
  const [sidebarTab, setSidebarTab] = useState('agentRuns');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverOpener, setPopoverOpener] = useState<HTMLElement | null>(null);
  const [hitlDismissed, setHitlDismissed] = useState(false);

  const customerComms = COMMUNICATIONS.filter(c => c.customerId === customer.id);
  const customerInvoices = INVOICES.filter(i => i.customerId === customer.id);
  const customerActivities = ACTIVITIES.filter(a => a.customerId === customer.id);

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
          startButton={
            <Button icon="nav-back" design="Transparent" tooltip="Back to list" onClick={onBack} />
          }
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

        {/* Object Page */}
        <ObjectPage
          style={{ flex: 1, overflow: 'hidden' }}
          titleArea={
            <ObjectPageTitle
              actionsBar={
                <Toolbar design="Transparent">
                  <ToolbarSpacer />
                  <Button icon="action" design="Transparent" tooltip="Share" />
                  <Button icon="slim-arrow-down" design="Transparent" tooltip="More" />
                </Toolbar>
              }
            >
              <span slot="heading" style={{
                fontFamily: '"72Black", "72Blackfull", "72", "72full", Arial, Helvetica, sans-serif',
                fontSize: 'var(--sapFontHeader2Size)',
                fontWeight: 'var(--sapFontBoldWeight)',
                color: 'var(--sapTextColor)',
              }}>{customer.customerName}</span>
            </ObjectPageTitle>
          }
          headerArea={
            <ObjectPageHeader>
              <FlexBox alignItems="Center" wrap="Wrap" style={{ gap: '0.5rem' }}>
                <Label>Customer Number:</Label>
                <Text>{customer.customerNumber}</Text>
                <Text style={{ color: 'var(--sapContent_ForegroundBorderColor)', padding: '0 0.25rem' }}>|</Text>
                <Label>Contact:</Label>
                <Link href={`mailto:${customer.contactEmail}`}>{customer.customerContact}</Link>
                <Text style={{ color: 'var(--sapContent_ForegroundBorderColor)', padding: '0 0.25rem' }}>|</Text>
                <Label>Outstanding:</Label>
                <Text style={{ fontWeight: 'var(--sapFontBoldWeight)' }}>
                  {fmtAmt(customer.amountOutstanding, customer.currency)}
                </Text>
                <Text style={{ color: 'var(--sapContent_ForegroundBorderColor)', padding: '0 0.25rem' }}>|</Text>
                <Label>Priority:</Label>
                <ObjectStatus
                  state={customer.priority === 1 ? 'Negative' : customer.priority === 2 ? 'Critical' : 'Positive'}
                  inverted
                  showDefaultIcon
                >
                  {customer.priority === 1 ? 'High' : customer.priority === 2 ? 'Medium' : 'Low'}
                </ObjectStatus>
              </FlexBox>
            </ObjectPageHeader>
          }
        >
          <ObjectPageSection id="content" titleText="Content" hideTitleText>

            {/* Two-column layout */}
            <FlexBox style={{ gap: '1rem', alignItems: 'flex-start' }}>

              {/* LEFT COLUMN — 2/3 width */}
              <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>

                {/* AI Generated Summary Panel */}
                <Panel headerText="AI Generated Summary" style={{ width: '100%' }}>
                  <div style={{ padding: '1rem' }}>
                    {customer.accountSummary ? (
                      <Text>{customer.accountSummary}</Text>
                    ) : (
                      <MessageStrip design="Information" hideCloseButton>
                        No AI summary available. Run the agent to generate one.
                      </MessageStrip>
                    )}

                    {/* HITL Approval Card */}
                    {customer.hitlPending && !hitlDismissed && (
                      <div style={{
                        marginTop: '1rem',
                        background: '#d1efff',
                        borderRadius: '8px',
                        padding: '12px',
                      }}>
                        <Text style={{
                          fontSize: '16px',
                          fontWeight: 'var(--sapFontBoldWeight)',
                          display: 'block',
                          marginBottom: '0.5rem',
                        }}>
                          Action for you to take - {customer.recommendedAction || 'Email the Customer'}
                        </Text>
                        <FlexBox alignItems="Center" style={{ gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <Icon name="email" style={{ width: '1rem', height: '1rem' }} />
                          <Text>
                            {customer.hitlSubject || 'Payment Reminder — ' + customer.customerName}
                          </Text>
                        </FlexBox>
                        <FlexBox alignItems="Center" style={{ gap: '0.75rem' }}>
                          <Button icon="paper-plane" design="Ghost">Email customer</Button>
                          <Link onClick={() => setHitlDismissed(true)}>Discard suggestion</Link>
                        </FlexBox>
                      </div>
                    )}
                  </div>
                </Panel>

                {/* Tabbed content */}
                <Panel style={{ width: '100%', overflow: 'hidden' }}>
                  <TabContainer style={{ width: '100%' }}>
                    <Tab text="Account Overview">
                      <div style={{ padding: '1rem' }}>
                        <KpiGrid customer={customer} />
                      </div>
                    </Tab>
                    <Tab text="Open Items">
                      <div style={{ padding: '1rem' }}>
                        {customerInvoices.length > 0 ? (
                          <Table
                            noDataText="No open items"
                            headerRow={
                              <TableHeaderRow>
                                <TableHeaderCell width="120px"><span>Document #</span></TableHeaderCell>
                                <TableHeaderCell width="100px"><span>Type</span></TableHeaderCell>
                                <TableHeaderCell width="140px"><span>Amount</span></TableHeaderCell>
                                <TableHeaderCell width="110px"><span>Due Date</span></TableHeaderCell>
                                <TableHeaderCell width="120px"><span>Days Overdue</span></TableHeaderCell>
                                <TableHeaderCell width="100px"><span>Status</span></TableHeaderCell>
                              </TableHeaderRow>
                            }
                          >
                            {customerInvoices.map(inv => (
                              <TableRow key={inv.id} rowKey={inv.id}>
                                <TableCell><Text>{inv.documentNumber}</Text></TableCell>
                                <TableCell><Text>{inv.documentTypeText}</Text></TableCell>
                                <TableCell><Text>{fmtAmt(inv.amount, inv.currency)}</Text></TableCell>
                                <TableCell><Text>{inv.dueDate}</Text></TableCell>
                                <TableCell>
                                  {inv.isOverdue
                                    ? <ObjectStatus state="Negative">{inv.daysOverdue} days</ObjectStatus>
                                    : <Text>—</Text>
                                  }
                                </TableCell>
                                <TableCell>
                                  <ObjectStatus state={inv.isOverdue ? 'Negative' : 'Positive'}>
                                    {inv.isOverdue ? 'Overdue' : 'On time'}
                                  </ObjectStatus>
                                </TableCell>
                              </TableRow>
                            ))}
                          </Table>
                        ) : (
                          <Text style={{ color: 'var(--sapContent_LabelColor)' }}>No open items on record.</Text>
                        )}
                      </div>
                    </Tab>
                    <Tab text="Payments / Reimbursements">
                      <div style={{ padding: '1rem' }}>
                        <Text style={{ color: 'var(--sapContent_LabelColor)' }}>No payment or reimbursement records.</Text>
                      </div>
                    </Tab>
                    <Tab text="Disputes">
                      <div style={{ padding: '1rem' }}>
                        {customer.disputesCount > 0 ? (
                          <Text>
                            {customer.disputesCount} open dispute(s) totaling {fmtAmt(customer.disputesAmount, customer.currency)}
                          </Text>
                        ) : (
                          <Text style={{ color: 'var(--sapContent_LabelColor)' }}>No open disputes.</Text>
                        )}
                      </div>
                    </Tab>
                  </TabContainer>
                </Panel>
              </div>

              {/* RIGHT COLUMN — 1/3 width */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <Panel style={{ width: '100%', overflow: 'hidden' }}>
                  <TabContainer
                    style={{ width: '100%' }}
                    onTabSelect={(e: any) => {
                      const text = e.detail?.tab?.getAttribute('text');
                      if (text === 'AGENT RUNS') setSidebarTab('agentRuns');
                      else if (text === 'ACCOUNT HISTORY') setSidebarTab('history');
                      else if (text === 'NOTES') setSidebarTab('notes');
                    }}
                  >
                    <Tab text="AGENT RUNS" />
                    <Tab text="ACCOUNT HISTORY" />
                    <Tab text="NOTES" />
                  </TabContainer>

                  <div style={{ padding: '0.75rem 1rem' }}>

                    {sidebarTab === 'agentRuns' && (
                      <div>
                        <FlexBox alignItems="Center" style={{ gap: '0.25rem', marginBottom: '1rem' }}>
                          <SegmentedButton>
                            <SegmentedButtonItem selected>All</SegmentedButtonItem>
                            <SegmentedButtonItem>Completed</SegmentedButtonItem>
                            <SegmentedButtonItem>Failed</SegmentedButtonItem>
                            <SegmentedButtonItem>Running</SegmentedButtonItem>
                          </SegmentedButton>
                        </FlexBox>

                        {customerActivities.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {customerActivities.map((activity, idx) => {
                              const isError = activity.description.toLowerCase().includes('failed');
                              const isSuccess = activity.description.toLowerCase().includes('sent') || activity.description.toLowerCase().includes('success');
                              const dotColor = isError
                                ? 'var(--sapNegativeColor)'
                                : isSuccess
                                  ? 'var(--sapPositiveColor)'
                                  : 'var(--sapInformativeColor)';
                              const statusText = isError ? 'Error' : isSuccess ? 'Completed' : 'No Action';
                              const dateStr = new Date(activity.timestamp).toLocaleString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric',
                                hour: 'numeric', minute: '2-digit', hour12: true,
                              });
                              return (
                                <div key={activity.id} style={{ display: 'flex', gap: '0.75rem', paddingBottom: '1rem' }}>
                                  {/* Timeline dot + connecting line */}
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '1rem', flexShrink: 0 }}>
                                    <div style={{
                                      width: '0.625rem',
                                      height: '0.625rem',
                                      borderRadius: '50%',
                                      background: dotColor,
                                      flexShrink: 0,
                                      marginTop: '0.25rem',
                                    }} />
                                    {idx < customerActivities.length - 1 && (
                                      <div style={{
                                        width: '1px',
                                        flex: 1,
                                        background: 'var(--sapContent_ForegroundBorderColor)',
                                        marginTop: '0.25rem',
                                      }} />
                                    )}
                                  </div>
                                  {/* Content */}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block' }}>
                                      {dateStr}
                                    </span>
                                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', color: 'var(--sapTextColor)', display: 'block', marginTop: '0.2rem' }}>
                                      {activity.description}
                                    </span>
                                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginTop: '0.1rem' }}>
                                      {statusText} · {activity.performedBy}
                                    </span>
                                    <Link style={{ fontSize: 'var(--sapFontSmallSize)' }}>View Details</Link>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <Text style={{ color: 'var(--sapContent_LabelColor)' }}>No agent runs recorded.</Text>
                        )}
                      </div>
                    )}

                    {sidebarTab === 'history' && (
                      <div>
                        {customerComms.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                            {customerComms.map((comm, idx) => (
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
                                  {idx < customerComms.length - 1 && (
                                    <div style={{ width: '1px', flex: 1, background: 'var(--sapContent_ForegroundBorderColor)', marginTop: '0.25rem' }} />
                                  )}
                                </div>
                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <FlexBox alignItems="Center" style={{ gap: '0.375rem' }}>
                                    <Icon name={comm.direction === 'outbound' ? 'email' : 'incoming-call'} style={{ fontSize: '0.75rem', color: 'var(--sapContent_LabelColor)' }} />
                                    <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>
                                      {new Date(comm.sentDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  </FlexBox>
                                  <div style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', fontWeight: 'var(--sapFontBoldWeight)', marginTop: '0.25rem' }}>
                                    {comm.subject}
                                  </div>
                                  <div style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', marginTop: '0.125rem' }}>
                                    {comm.summary}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <Text style={{ color: 'var(--sapContent_LabelColor)' }}>No communications recorded.</Text>
                        )}
                      </div>
                    )}

                    {sidebarTab === 'notes' && (
                      <Text style={{ color: 'var(--sapContent_LabelColor)' }}>Notes feature coming soon.</Text>
                    )}
                  </div>
                </Panel>
              </div>

            </FlexBox>
          </ObjectPageSection>
        </ObjectPage>

      </div>
    </ThemeProvider>
  );
};

/* KPI grid — Account Overview tab */
const KpiGrid: React.FC<{ customer: BayerCustomer }> = ({ customer }) => {
  const tiles = [
    { label: 'Overdue Invoices', value: String(customer.overdueCount), negative: customer.overdueCount > 0 },
    { label: 'Due in 7 Days', value: String(customer.due7DaysCount), negative: false },
    { label: 'Dispute Cases', value: String(customer.disputesCount), negative: customer.disputesCount > 0 },
    { label: 'Overdue Amount', value: fmtAmt(customer.overdueAmount, customer.currency), negative: customer.overdueAmount > 0 },
    { label: 'Due in 7 Days Amount', value: fmtAmt(customer.due7DaysAmount, customer.currency), negative: false },
    { label: 'Disputes Amount', value: fmtAmt(customer.disputesAmount, customer.currency), negative: customer.disputesAmount > 0 },
    { label: 'DSO', value: String(customer.dsoPerCustomer > 0 ? customer.dsoPerCustomer : 0), negative: customer.dsoPerCustomer > 60 },
    { label: 'Max Arrears Days', value: String(customer.maxArrearsDays), negative: customer.maxArrearsDays > 60 },
    { label: 'Credit Utilization', value: customer.creditUtilizationRate.toFixed(1) + '%', negative: customer.creditUtilizationRate > 80 },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '0.75rem',
    }}>
      {tiles.map(tile => (
        <div key={tile.label} style={{
          padding: '0.75rem',
          background: 'var(--sapBackgroundColor)',
          border: '1px solid var(--sapList_BorderColor)',
          borderRadius: '0.5rem',
        }}>
          <span style={{
            fontFamily: 'var(--sapFontFamily)',
            fontSize: 'var(--sapFontLargeSize)',
            fontWeight: 'var(--sapFontBoldWeight)',
            display: 'block',
            color: tile.negative ? 'var(--sapNegativeTextColor)' : 'var(--sapTextColor)',
          }}>
            {tile.value}
          </span>
          <span style={{
            fontFamily: 'var(--sapFontFamily)',
            fontSize: 'var(--sapFontSmallSize)',
            color: 'var(--sapContent_LabelColor)',
            display: 'block',
            marginTop: '0.25rem',
          }}>
            {tile.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default BayerObjectPage;
