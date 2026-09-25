// @ts-nocheck
import React from 'react';
import {
  DynamicPage, DynamicPageTitle, DynamicPageHeader,
  Title, Text, Button, ObjectStatus, Tag, Icon, MessageStrip, FlexBox, ProgressIndicator,
  Table, TableHeaderRow, TableHeaderCell, TableRow, TableCell,
} from '@ui5/webcomponents-react';
import type { SyntheticView, GeneratedDataset, QualityCheck } from '../types';
import { SP } from '../constants';
import KpiTile from '../components/KpiTile';
import SectionHead from '../components/SectionHead';
import DistributionBar from '../components/DistributionBar';
import { overallScore, readinessLabel } from '../qualityEngine';

interface Props {
  nav: (v: SyntheticView) => void;
  dataset: GeneratedDataset | null;
  qualityChecks: QualityCheck[];
}

const QualityReport: React.FC<Props> = ({ nav, dataset, qualityChecks }) => {
  if (!dataset || qualityChecks.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: SP.l }}>
        <MessageStrip design="Warning" hideCloseButton>
          No dataset available. Generate a dataset first, then run quality checks from the Dataset Preview screen.
        </MessageStrip>
      </div>
    );
  }

  const score = overallScore(qualityChecks);
  const readiness = readinessLabel(qualityChecks, dataset.config.fidelityLevel);
  const fkChecks   = qualityChecks.filter(c => c.category === 'referential_integrity');
  const brChecks   = qualityChecks.filter(c => c.category === 'business_rule');
  const distChecks = qualityChecks.filter(c => c.category === 'distribution');

  const fkScore   = Math.round(fkChecks.reduce((s, c) => s + c.score, 0) / (fkChecks.length || 1));
  const brScore   = Math.round(brChecks.reduce((s, c) => s + c.score, 0) / (brChecks.length || 1));

  const scoreState = score >= 95 ? 'Positive' : score >= 80 ? 'Critical' : 'Negative';

  const CheckTable: React.FC<{ checks: QualityCheck[] }> = ({ checks }) => (
    <div className="ui5-content-density-compact">
      <Table
        headerRow={
          <TableHeaderRow sticky>
            <TableHeaderCell>Check</TableHeaderCell>
            <TableHeaderCell>Result</TableHeaderCell>
            <TableHeaderCell>Violations</TableHeaderCell>
            <TableHeaderCell>Total Checked</TableHeaderCell>
            <TableHeaderCell>Score</TableHeaderCell>
          </TableHeaderRow>
        }
        noDataText="No checks"
      >
        {checks.map(c => (
          <TableRow key={c.checkId} rowKey={c.checkId}>
            <TableCell>
              <div style={{ display: 'flex', alignItems: 'center', gap: SP.s }}>
                <Icon
                  name={c.passed ? 'accept' : 'decline'}
                  tooltip={c.passed ? 'Passed' : 'Failed'}
                  style={{ width: '1rem', height: '1rem', color: c.passed ? 'var(--sapPositiveColor)' : 'var(--sapNegativeColor)' }}
                />
                <Text maxLines={1}>{c.label}</Text>
              </div>
            </TableCell>
            <TableCell>
              <ObjectStatus state={c.passed ? 'Positive' : 'Negative'}>
                {c.passed ? 'Passed' : 'Failed'}
              </ObjectStatus>
            </TableCell>
            <TableCell><Text maxLines={1}>{c.failCount.toLocaleString()}</Text></TableCell>
            <TableCell><Text maxLines={1}>{c.totalChecked.toLocaleString()}</Text></TableCell>
            <TableCell>
              <div style={{ display: 'flex', alignItems: 'center', gap: SP.s }}>
                <ProgressIndicator value={c.score} displayValue={`${c.score}%`} state={c.score === 100 ? 'Positive' : c.score >= 90 ? 'Critical' : 'Negative'} style={{ width: 80 }} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );

  return (
    <DynamicPage
      style={{ flex: 1, overflow: 'hidden', '--ui5_dynamic_page_background': 'var(--sapObjectHeader_Background)' } as React.CSSProperties}
      headerTitle={
        <DynamicPageTitle style={{ paddingLeft: SP.m }}>
          <Title slot="heading" level="H3" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>
            Quality Report
          </Title>
          <Text slot="subheading" style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)' }}>
            Collections &amp; Disputes · {dataset.config.fidelityLevel} · {dataset.receivables.length.toLocaleString()} receivables
          </Text>
          <div slot="actionsBar" style={{ display: 'flex', gap: SP.s, flexShrink: 0 }}>
            <Button design="Emphasized" icon="activities" onClick={() => nav('experiment')}>
              Run Experiments
            </Button>
          </div>
        </DynamicPageTitle>
      }
      headerContent={
        <DynamicPageHeader>
          <div style={{ paddingTop: SP.m, paddingBottom: SP.m, paddingLeft: SP.g, paddingRight: SP.g }}>
            <FlexBox wrap="Wrap" style={{ gap: SP.m }}>
              <KpiTile label="Overall Quality Score" value={`${score}%`} sub={readiness} subColor={score >= 90 ? 'var(--sapPositiveColor)' : 'var(--sapCriticalColor)'} />
              <KpiTile label="FK Integrity" value={`${fkScore}%`} />
              <KpiTile label="Business Rules" value={`${brScore}%`} />
              <KpiTile label="Checks Passed" value={`${qualityChecks.filter(c => c.passed).length}/${qualityChecks.length}`} />
            </FlexBox>
          </div>
        </DynamicPageHeader>
      }
    >
      <div style={{ paddingTop: SP.m, paddingBottom: SP.l, paddingLeft: SP.g, paddingRight: SP.g }}>

        {/* Readiness Banner */}
        <MessageStrip
          design={score >= 90 ? 'Positive' : score >= 75 ? 'Critical' : 'Negative'}
          hideCloseButton
          style={{ marginBottom: SP.m }}
        >
          <strong>{readiness}</strong> — Overall score {score}%. {score >= 90 ? 'Data meets quality threshold for this fidelity level.' : 'Review violations below before proceeding to experimentation.'}
        </MessageStrip>

        {/* FK Integrity */}
        <SectionHead title="Referential Integrity" />
        <CheckTable checks={fkChecks} />

        {/* Business Rules */}
        <SectionHead title="Business Rule Validation" />
        <CheckTable checks={brChecks} />

        {/* Distribution Comparison */}
        <SectionHead title="Distribution Comparison" />
        <div style={{ maxWidth: 600 }}>
          {distChecks.map(c => (
            <div key={c.checkId}>
              <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: SP.xs }}>
                {c.label}
              </span>
              <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', marginBottom: SP.s }}>
                {c.detail}
              </span>
              <ObjectStatus state={c.passed ? 'Positive' : 'Negative'} style={{ marginBottom: SP.m }}>
                {c.passed ? 'Within tolerance (±5%)' : 'Outside tolerance'}
              </ObjectStatus>
            </div>
          ))}

          <DistributionBar
            label="Late Payment Rate"
            target={dataset.config.latePaymentRate}
            actual={dataset.stats.actualLatePaymentRate}
          />
          <DistributionBar
            label="Dispute Rate"
            target={dataset.config.disputeRate}
            actual={dataset.stats.actualDisputeRate}
          />
        </div>

        {/* Country Distribution */}
        <SectionHead title="Country Distribution" />
        <div style={{ maxWidth: 600 }}>
          {Object.entries(dataset.config.countryWeights).map(([country, target]) => (
            <DistributionBar
              key={country}
              label={country}
              target={target}
              actual={dataset.stats.countryDistribution[country] ?? 0}
            />
          ))}
        </div>

      </div>
    </DynamicPage>
  );
};

export default QualityReport;
