import React from 'react';
import {
  FlexBox,
  Title,
  Text,
  Button,
  ObjectStatus,
  BusyIndicator,
  Icon,
  MessageStrip,
} from '@ui5/webcomponents-react';
import type { TechRecommendation } from '../types';
import { SP } from '../../synthetic-data-v2/constants';

interface Props {
  recommendation: TechRecommendation | null;
  onAccept: () => void;
  onCustomize: () => void;
  onAskDifferent?: () => void;
  loading: boolean;
  progressStep?: string;
}

const TASK_TYPE_ICONS: Record<string, string> = {
  'Binary Classification': 'decision',
  'Multiclass Classification': 'decision',
  'Regression': 'bar-chart',
  'Ranking': 'sort',
  'Forecasting': 'trend-up',
  'Rules/Decisioning': 'role',
};

const TARGET_STATE: Record<string, 'Positive' | 'Information' | 'Critical'> = {
  Available: 'Positive',
  Derivable: 'Information',
  Missing: 'Critical',
};

const CONFIDENCE_STATE: Record<string, 'Positive' | 'Information' | 'Critical'> = {
  High: 'Positive',
  Medium: 'Information',
  Low: 'Critical',
};

const APPROACH_STATE: Record<string, 'Positive' | 'Information' | 'Critical'> = {
  REAL: 'Positive',
  'DEMO MODEL': 'Information',
  'DEMO ADAPTER': 'Critical',
};

const TechRecommendationPanel: React.FC<Props> = ({
  recommendation, onAccept, onCustomize, onAskDifferent, loading, progressStep,
}) => {
  if (loading) {
    return (
      <FlexBox direction="Column" alignItems="Center" justifyContent="Center"
        style={{ padding: SP.xl, gap: SP.m }}>
        <BusyIndicator active size="L" />
        <Text style={{ color: 'var(--sapContent_LabelColor)', fontSize: '0.9375rem' }}>
          {progressStep ?? 'Generating recommendation…'}
        </Text>
      </FlexBox>
    );
  }

  if (!recommendation) return null;

  const section = (icon: string, title: string, children: React.ReactNode) => (
    <div style={{
      background: 'var(--sapBaseColor)',
      border: '1px solid var(--sapGroup_TitleBorderColor)',
      borderRadius: 8,
      padding: SP.m,
      marginBottom: SP.m,
    }}>
      <FlexBox gap={SP.s} alignItems="Center" style={{ marginBottom: SP.s }}>
        <Icon name={icon} style={{ color: 'var(--sapHighlightColor)', fontSize: '1rem' }} />
        <Text style={{ fontWeight: 700, fontSize: '0.9375rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--sapContent_LabelColor)' }}>
          {title}
        </Text>
      </FlexBox>
      {children}
    </div>
  );

  return (
    <div>
      {/* What I Understood */}
      {section('customer', 'What I Understood', (
        <div style={{
          borderLeft: `3px solid var(--sapHighlightColor)`,
          paddingLeft: SP.m,
          marginLeft: SP.xs,
        }}>
          <Text style={{ fontSize: '1rem', lineHeight: 1.6 }}>{recommendation.understoodAs}</Text>
        </div>
      ))}

      {/* Experiment Type */}
      {section(TASK_TYPE_ICONS[recommendation.taskType] ?? 'activities', 'Recommended Experiment Type', (
        <FlexBox direction="Column" gap={SP.s}>
          <ObjectStatus state="Information" style={{ fontSize: '1rem', fontWeight: 700 }}>
            {recommendation.taskType}
          </ObjectStatus>
          <Text style={{ lineHeight: 1.6, color: 'var(--sapContent_LabelColor)' }}>
            {recommendation.taskTypeExplanation}
          </Text>
        </FlexBox>
      ))}

      {/* Suggested Target */}
      {section('target-group', 'Suggested Target', (
        <FlexBox direction="Column" gap={SP.s}>
          <FlexBox gap={SP.s} alignItems="Center">
            <code style={{
              background: 'var(--sapField_Background)',
              border: '1px solid var(--sapField_BorderColor)',
              borderRadius: 4, padding: '2px 8px',
              fontFamily: 'monospace', fontSize: '0.9375rem',
            }}>
              {recommendation.target}
            </code>
            <ObjectStatus state={TARGET_STATE[recommendation.targetStatus]}>
              {recommendation.targetStatus}
            </ObjectStatus>
          </FlexBox>
          <Text style={{ lineHeight: 1.6, color: 'var(--sapContent_LabelColor)' }}>
            {recommendation.targetExplanation}
          </Text>
        </FlexBox>
      ))}

      {/* Information Fields */}
      {section('table-chart', 'Information That May Help Answer This Question', (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: SP.s, marginBottom: SP.m }}>
            {recommendation.informationFields.map(f => {
              const accessColors: Record<string, string> = { 'Candidate': 'var(--sapInformationColor)', 'Customer-Specific': 'var(--sapCriticalColor)', 'Unresolved': 'var(--sapNegativeColor)', 'Validated': 'var(--sapPositiveColor)' };
              return (
                <div key={f.name} style={{
                  background: 'var(--sapField_Background)',
                  border: `1px solid ${f.available ? 'var(--sapPositiveBorderColor)' : 'var(--sapField_BorderColor)'}`,
                  borderRadius: 6, padding: SP.s,
                  opacity: f.available ? 1 : 0.65,
                }}>
                  <FlexBox gap={SP.xs} alignItems="Center" style={{ marginBottom: 2 }}>
                    <Icon
                      name={f.available ? 'accept' : 'warning'}
                      style={{ fontSize: '0.875rem', color: f.available ? 'var(--sapPositiveColor)' : 'var(--sapCriticalColor)' }}
                    />
                    <code style={{ fontFamily: 'monospace', fontSize: '0.8125rem', fontWeight: 600 }}>
                      {f.name}
                    </code>
                  </FlexBox>
                  <FlexBox gap={SP.xs} style={{ marginBottom: 4, flexWrap: 'wrap' }}>
                    <ObjectStatus state={f.category === 'historical' ? 'Information' : 'None'} style={{ fontSize: '0.75rem' }}>
                      {f.category === 'historical' ? 'Historical' : 'Current State'}
                    </ObjectStatus>
                    {f.accessStatus && (
                      <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 700, background: `${accessColors[f.accessStatus] ?? 'var(--sapContent_LabelColor)'}22`, color: accessColors[f.accessStatus] ?? 'var(--sapContent_LabelColor)' }}>
                        {f.accessStatus}
                      </span>
                    )}
                  </FlexBox>
                  <Text style={{ fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)', lineHeight: 1.4 }}>
                    {f.description}
                  </Text>
                  {f.sapProduct && (
                    <Text style={{ fontSize: '0.75rem', color: 'var(--sapContent_LabelColor)', marginTop: 2 }}>
                      Source: {f.sapProduct}
                    </Text>
                  )}
                </div>
              );
            })}
          </div>

          {/* Data Availability & Access summary */}
          {(() => {
            const total = recommendation.informationFields.length;
            const inDataset = recommendation.informationFields.filter(f => f.available).length;
            const candidate = recommendation.informationFields.filter(f => f.accessStatus === 'Candidate').length;
            const customerSpecific = recommendation.informationFields.filter(f => f.accessStatus === 'Customer-Specific').length;
            const unresolved = recommendation.informationFields.filter(f => f.accessStatus === 'Unresolved').length;
            const productionGaps = customerSpecific + unresolved;
            return (
              <div style={{ background: 'var(--sapField_Background)', border: '1px solid var(--sapGroup_TitleBorderColor)', borderRadius: 8, padding: SP.m }}>
                <Text style={{ fontWeight: 700, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--sapContent_LabelColor)', display: 'block', marginBottom: SP.s }}>
                  Data Availability &amp; Access
                </Text>
                <div style={{ display: 'flex', gap: SP.l, flexWrap: 'wrap', marginBottom: SP.s }}>
                  {[
                    { label: 'In dataset', value: `${inDataset}/${total}`, color: 'var(--sapPositiveColor)' },
                    { label: 'Candidate access', value: `${candidate}/${total}`, color: 'var(--sapInformationColor)' },
                    { label: 'Customer-specific', value: `${customerSpecific}/${total}`, color: 'var(--sapCriticalColor)' },
                    { label: 'Unresolved', value: `${unresolved}/${total}`, color: 'var(--sapNegativeColor)' },
                  ].map(s => (
                    <div key={s.label}>
                      <Text style={{ display: 'block', fontWeight: 700, fontSize: '0.9375rem', color: s.color }}>{s.value}</Text>
                      <Text style={{ display: 'block', fontSize: '0.75rem', color: 'var(--sapContent_LabelColor)' }}>{s.label}</Text>
                    </div>
                  ))}
                </div>
                <Text style={{ fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)', lineHeight: 1.5 }}>
                  {productionGaps === 0
                    ? `Experiment can be prototyped now. All ${candidate} production access paths have illustrative candidate mappings.`
                    : `Experiment can be prototyped now. ${productionGaps} signal${productionGaps > 1 ? 's' : ''} still require a production data-access decision before go-live.`}
                  {' '}<span style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>Candidate mappings are illustrative — confirm with SAP product team.</span>
                </Text>
              </div>
            );
          })()}
        </>
      ))}

      {/* Approaches */}
      {section('process', 'Approaches Worth Evaluating', (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SP.s }}>
          {recommendation.approaches.map(a => (
            <div key={a.approachId} style={{
              background: 'var(--sapField_Background)',
              border: '1px solid var(--sapGroup_TitleBorderColor)',
              borderRadius: 6, padding: SP.m,
            }}>
              <div style={{ marginBottom: SP.xs }}>
                <Text style={{ fontWeight: 700, fontSize: '0.9375rem', display: 'block', marginBottom: 4 }}>{a.name}</Text>
                <ObjectStatus state={APPROACH_STATE[a.label] ?? 'None'} style={{ fontSize: '0.75rem' }}>
                  {a.label}
                </ObjectStatus>
              </div>
              <Text style={{ lineHeight: 1.6, color: 'var(--sapContent_LabelColor)', fontSize: '0.875rem' }}>
                {a.why}
              </Text>
            </div>
          ))}
        </div>
      ))}

      {/* Metrics */}
      {section('bar-chart', 'How to Measure Success', (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: SP.s }}>
          {recommendation.metrics.map(m => (
            <div key={m.metricKey} style={{
              background: m.recommended ? 'var(--sapSuccessBackground)' : 'var(--sapField_Background)',
              border: `1px solid ${m.recommended ? 'var(--sapPositiveBorderColor)' : 'var(--sapField_BorderColor)'}`,
              borderRadius: 6, padding: SP.s,
            }}>
              <FlexBox gap={SP.xs} alignItems="Center" style={{ marginBottom: SP.xs }}>
                <Text style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{m.label}</Text>
                {m.recommended && (
                  <ObjectStatus state="Positive" style={{ fontSize: '0.75rem' }}>Recommended</ObjectStatus>
                )}
              </FlexBox>
              <Text style={{ fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)', lineHeight: 1.5 }}>
                {m.businessExplanation}
              </Text>
            </div>
          ))}
        </div>
      ))}

      {/* Engineering Questions */}
      {section('chain-link', 'Questions for Engineering', (
        <ul style={{ margin: 0, paddingLeft: SP.l }}>
          {recommendation.engineeringQuestions.map((q, i) => (
            <li key={i} style={{ marginBottom: SP.xs }}>
              <Text style={{ lineHeight: 1.6 }}>{q}</Text>
            </li>
          ))}
        </ul>
      ))}

      {/* Confidence */}
      {section('status-positive', 'Recommendation Confidence', (
        <FlexBox direction="Column" gap={SP.s}>
          <ObjectStatus state={CONFIDENCE_STATE[recommendation.confidence]} style={{ fontSize: '1rem', fontWeight: 700 }}>
            {recommendation.confidence}
          </ObjectStatus>
          <ul style={{ margin: 0, paddingLeft: SP.l }}>
            {recommendation.confidenceReasons.map((r, i) => (
              <li key={i}><Text style={{ fontSize: '0.875rem', color: 'var(--sapContent_LabelColor)' }}>{r}</Text></li>
            ))}
          </ul>
        </FlexBox>
      ))}

      {/* Actions */}
      <MessageStrip design="Information" hideCloseButton style={{ marginBottom: SP.m }}>
        These results are based on synthetic data and should be validated against approved customer data before production model selection.
      </MessageStrip>
      <FlexBox gap={SP.m} style={{ flexWrap: 'wrap' }}>
        <Button design="Emphasized" icon="accept" onClick={onAccept}>
          Accept Recommendation
        </Button>
        <Button design="Default" icon="customize" onClick={onCustomize}>
          Customize
        </Button>
        {onAskDifferent && (
          <Button design="Transparent" icon="question-mark" onClick={onAskDifferent}>
            Ask a Different Question
          </Button>
        )}
      </FlexBox>
    </div>
  );
};

export default TechRecommendationPanel;
