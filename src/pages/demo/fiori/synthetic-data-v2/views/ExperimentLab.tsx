// @ts-nocheck
import React, { useState, useCallback, useEffect } from 'react';
import {
  DynamicPage, DynamicPageTitle, DynamicPageHeader,
  Title, Text, Button, Panel, MessageStrip, Tag, ObjectStatus,
  FlexBox, BusyIndicator, Icon, ProgressIndicator,
  Table, TableHeaderRow, TableHeaderCell, TableRow, TableCell,
} from '@ui5/webcomponents-react';
import type { SyntheticView, GeneratedDataset, RulesResult, MLResult, RPTResult } from '../types';
import { SP } from '../constants';
import KpiTile from '../components/KpiTile';
import MetricBadge from '../components/MetricBadge';
import { runRulesBaseline } from '../rulesEngine';
import { runRPTAdapter } from '../rptEngine';
import { trainXGBoost, getHealth } from '../api';

interface Props {
  nav: (v: SyntheticView) => void;
  dataset: GeneratedDataset | null;
  rulesResult: RulesResult | null;
  mlResult: MLResult | null;
  rptResult: RPTResult | null;
  setRulesResult: (r: RulesResult) => void;
  setMlResult: (r: MLResult) => void;
  setRptResult: (r: RPTResult) => void;
  showToast: (msg: string) => void;
}

const ExperimentLab: React.FC<Props> = ({
  nav, dataset, rulesResult, mlResult, rptResult,
  setRulesResult, setMlResult, setRptResult, showToast,
}) => {
  const [runningRules, setRunningRules] = useState(false);
  const [runningML, setRunningML] = useState(false);
  const [runningRPT, setRunningRPT] = useState(false);
  const [pythonAvailable, setPythonAvailable] = useState<boolean | null>(null);
  const [mlError, setMlError] = useState('');

  useEffect(() => {
    // On static hosting (GitHub Pages), skip the health check entirely
    const isStatic = !window.location.hostname.includes('localhost') &&
                     !window.location.hostname.includes('127.0.0.1');
    if (isStatic) { setPythonAvailable(false); return; }
    getHealth().then(h => setPythonAvailable(h.pythonAvailable));
  }, []);

  const handleRules = useCallback(() => {
    if (!dataset) return;
    setRunningRules(true);
    setTimeout(() => {
      const result = runRulesBaseline(dataset);
      setRulesResult(result);
      setRunningRules(false);
      showToast(`Rules baseline complete — F1: ${(result.f1 * 100).toFixed(1)}%`);
    }, 50);
  }, [dataset, setRulesResult, showToast]);

  const handleML = useCallback(async () => {
    if (!dataset) return;
    setRunningML(true);
    setMlError('');
    try {
      const result = await trainXGBoost(dataset);
      setMlResult(result);
      showToast(`${result.usedFallback ? 'JS Decision Tree' : result.modelType === 'xgboost' ? 'XGBoost' : 'GradientBoosting'} complete — AUC: ${(result.auc * 100).toFixed(1)}%`);
    } catch (e) {
      setMlError(String(e));
      showToast('ML training failed — check console');
    }
    setRunningML(false);
  }, [dataset, setMlResult, showToast]);

  const handleRPT = useCallback(() => {
    if (!dataset) return;
    setRunningRPT(true);
    setTimeout(() => {
      const result = runRPTAdapter(dataset);
      setRptResult(result);
      setRunningRPT(false);
      showToast(`RPT adapter complete — F1: ${(result.f1 * 100).toFixed(1)}%`);
    }, 50);
  }, [dataset, setRptResult, showToast]);

  const anyRunning = runningRules || runningML || runningRPT;
  const allDone = rulesResult && mlResult && rptResult;

  // Recommendation logic
  const recommendation = (() => {
    if (!rulesResult || !mlResult) return null;
    const bestAUC = Math.max(mlResult.auc, rulesResult.auc);
    const diff = mlResult.auc - rulesResult.auc;
    if (diff > 0.05) {
      return { model: mlResult.usedFallback ? 'Decision Tree' : (mlResult.modelType === 'xgboost' ? 'XGBoost' : 'GradientBoosting'), reason: `${(diff * 100).toFixed(1)} AUC points above Rules baseline — meaningful improvement.` };
    }
    return { model: 'Rules Baseline', reason: `ML improvement (${(diff * 100).toFixed(1)} AUC pts) is within 5 points. Rules are simpler and easier to explain.` };
  })();

  const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

  if (!dataset) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: SP.l }}>
        <MessageStrip design="Warning" hideCloseButton>
          No dataset generated yet. Go to Generate Data first.
        </MessageStrip>
      </div>
    );
  }

  return (
    <DynamicPage
      style={{ flex: 1, overflow: 'hidden', '--ui5_dynamic_page_background': 'var(--sapObjectHeader_Background)' } as React.CSSProperties}
      headerTitle={
        <DynamicPageTitle style={{ paddingLeft: SP.m }}>
          <Title slot="heading" level="H3" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>
            Experiment Lab
          </Title>
          <Text slot="subheading" style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)' }}>
            What approach is worth taking forward? · Target: late_payment_flag
          </Text>
          <div slot="actionsBar" style={{ display: 'flex', gap: SP.s, flexShrink: 0 }}>
            {allDone ? (
              <Button design="Emphasized" icon="learning-assistant" onClick={() => nav('learnings')}>
                Save Results &amp; Capture Learnings
              </Button>
            ) : !rulesResult ? (
              <Button design="Emphasized" icon="process" onClick={handleRules} disabled={anyRunning}>
                Run Rules Baseline
              </Button>
            ) : !mlResult ? (
              <Button design="Emphasized" icon="machine-learning" onClick={handleML} disabled={anyRunning}>
                Train XGBoost
              </Button>
            ) : (
              <Button design="Emphasized" icon="learning-assistant" onClick={() => nav('learnings')}>
                Save Results
              </Button>
            )}
          </div>
        </DynamicPageTitle>
      }
      headerContent={
        <DynamicPageHeader>
          <div style={{ paddingTop: SP.m, paddingBottom: SP.m, paddingLeft: SP.g, paddingRight: SP.g }}>
            <FlexBox wrap="Wrap" style={{ gap: SP.m }}>
              <KpiTile label="Dataset" value={`${dataset.receivables.length.toLocaleString()} records`} />
              <KpiTile label="Target Variable" value="late_payment_flag" sub="Binary classification" />
              <KpiTile label="Feature Count" value="8" sub="prior_late_count, risk_segment, ..." />
              <KpiTile label="Models Run" value={[rulesResult, mlResult, rptResult].filter(Boolean).length.toString()} sub="of 3" />
            </FlexBox>
          </div>
        </DynamicPageHeader>
      }
    >
      <div style={{ paddingTop: SP.m, paddingBottom: SP.l, paddingLeft: SP.g, paddingRight: SP.g }}>

        {/* ── Rules Baseline ──────────────────────────────────────────────── */}
        <Panel headerText="Rules Baseline" collapsed={!!rulesResult} style={{ marginBottom: SP.m }}>
          <div style={{ paddingTop: SP.m, paddingBottom: SP.m, paddingLeft: SP.m, paddingRight: SP.m }}>
            <MessageStrip design="Information" hideCloseButton style={{ marginBottom: SP.m }}>
              Predict late if: risk_segment = HIGH · OR · historical_late_payments ≥ 3 · OR · (payment_terms ≥ 60 AND invoice_amount &gt; €10,000)
            </MessageStrip>

            {!rulesResult && (
              <Button design={!anyRunning && !rulesResult ? 'Default' : 'Transparent'} icon="process" onClick={handleRules} disabled={anyRunning}>
                {runningRules ? 'Running…' : 'Run Rules Baseline'}
              </Button>
            )}

            {runningRules && <BusyIndicator active size="M" text="Computing predictions…" style={{ marginTop: SP.m }} />}

            {rulesResult && (
              <div>
                <FlexBox wrap="Wrap" style={{ gap: SP.s, marginBottom: SP.m }}>
                  <MetricBadge label="Accuracy"  value={rulesResult.accuracy} />
                  <MetricBadge label="Precision" value={rulesResult.precision} />
                  <MetricBadge label="Recall"    value={rulesResult.recall} />
                  <MetricBadge label="F1 Score"  value={rulesResult.f1} />
                  <MetricBadge label="AUC"       value={rulesResult.auc} />
                </FlexBox>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>
                  Sample: {rulesResult.sampleSize.toLocaleString()} records · Computed in {rulesResult.executionMs}ms
                </span>
              </div>
            )}
          </div>
        </Panel>

        {/* ── XGBoost ─────────────────────────────────────────────────────── */}
        <Panel headerText="XGBoost / Gradient Boosting" collapsed={!!mlResult} style={{ marginBottom: SP.m }}>
          <div style={{ paddingTop: SP.m, paddingBottom: SP.m, paddingLeft: SP.m, paddingRight: SP.m }}>
            {pythonAvailable === false && (
              <MessageStrip design="Information" hideCloseButton style={{ marginBottom: SP.m }}>
                {window.location.hostname.includes('localhost')
                  ? 'Python not detected. Using JavaScript decision tree. Install Python + scikit-learn/xgboost for full XGBoost results.'
                  : 'Running in browser mode — using JavaScript decision tree. Real XGBoost is available when running locally with npm run dev + Python installed.'}
              </MessageStrip>
            )}
            {pythonAvailable === true && (
              <MessageStrip design="Success" hideCloseButton style={{ marginBottom: SP.m }}>
                Python available — will train real XGBoost model via Express API.
              </MessageStrip>
            )}

            <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', marginBottom: SP.m }}>
              Features: prior_late_count · days_outstanding · risk_segment · invoice_amount · payment_terms · credit_segment · country_code · annual_revenue
            </span>

            {!mlResult && (
              <Button design="Transparent" icon="machine-learning" onClick={handleML} disabled={anyRunning}>
                {runningML ? 'Training…' : 'Train XGBoost'}
              </Button>
            )}

            {runningML && <BusyIndicator active size="M" text="Training model via Express API…" style={{ marginTop: SP.m }} />}
            {mlError && <MessageStrip design="Negative" hideCloseButton>{mlError}</MessageStrip>}

            {mlResult && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: SP.s, marginBottom: SP.m }}>
                  {mlResult.usedFallback
                    ? <Tag design="Set1" colorScheme="3">JS Decision Tree Fallback</Tag>
                    : mlResult.modelType === 'xgboost'
                      ? <Tag design="Positive">Python XGBoost</Tag>
                      : <Tag design="Information">Python GradientBoosting</Tag>
                  }
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>
                    Trained on {mlResult.sampleSize.toLocaleString()} records in {mlResult.trainingMs}ms
                  </span>
                </div>

                <FlexBox wrap="Wrap" style={{ gap: SP.s, marginBottom: SP.m }}>
                  <MetricBadge label="Accuracy"  value={mlResult.accuracy} highlight />
                  <MetricBadge label="Precision" value={mlResult.precision} highlight />
                  <MetricBadge label="Recall"    value={mlResult.recall} highlight />
                  <MetricBadge label="F1 Score"  value={mlResult.f1} highlight />
                  <MetricBadge label="AUC"       value={mlResult.auc} highlight />
                </FlexBox>

                {mlResult.featureImportances.length > 0 && (
                  <div>
                    <Title level="H6" wrappingType="Normal" style={{ color: 'var(--sapTextColor)', marginBottom: SP.s }}>Top Feature Importances</Title>
                    {mlResult.featureImportances.slice(0, 5).map(fi => (
                      <div key={fi.feature} style={{ marginBottom: SP.s }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: SP.xs }}>
                          <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{fi.feature}</span>
                          <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapBrandColor)' }}>
                            {(fi.importance * 100).toFixed(1)}%
                          </span>
                        </div>
                        <ProgressIndicator value={Math.round(fi.importance * 100)} displayValue={`${(fi.importance * 100).toFixed(1)}%`} state="Information" style={{ width: '100%' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Panel>

        {/* ── RPT Adapter ─────────────────────────────────────────────────── */}
        <Panel headerText="RPT — Regression Probability (Demo Adapter)" collapsed={!!rptResult} style={{ marginBottom: SP.m }}>
          <div style={{ paddingTop: SP.m, paddingBottom: SP.m, paddingLeft: SP.m, paddingRight: SP.m }}>
            <MessageStrip design="Warning" hideCloseButton style={{ marginBottom: SP.m }}>
              <strong>Simulated RPT Adapter.</strong> This uses a logistic regression approximation, not a live SAP-RPT endpoint. Live SAP-RPT integration is outside V0 scope. Results are real metrics computed from the generated data, but the model is not RPT.
            </MessageStrip>

            {!rptResult && (
              <Button design="Transparent" icon="simulate" onClick={handleRPT} disabled={anyRunning}>
                {runningRPT ? 'Running…' : 'Run RPT Adapter (Demo)'}
              </Button>
            )}

            {runningRPT && <BusyIndicator active size="M" text="Running RPT adapter…" style={{ marginTop: SP.m }} />}

            {rptResult && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: SP.s, marginBottom: SP.m }}>
                  <Tag design="Critical">Demo Adapter</Tag>
                  <Tag design="Set1" colorScheme="3">Logistic Regression Proxy</Tag>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>
                    {rptResult.sampleSize.toLocaleString()} records · {rptResult.executionMs}ms
                  </span>
                </div>
                <FlexBox wrap="Wrap" style={{ gap: SP.s, marginBottom: SP.m }}>
                  <MetricBadge label="Accuracy"  value={rptResult.accuracy} />
                  <MetricBadge label="Precision" value={rptResult.precision} />
                  <MetricBadge label="Recall"    value={rptResult.recall} />
                  <MetricBadge label="F1 Score"  value={rptResult.f1} />
                  <MetricBadge label="AUC"       value={rptResult.auc} />
                </FlexBox>
              </div>
            )}
          </div>
        </Panel>

        {/* ── Comparison Table ─────────────────────────────────────────────── */}
        {(rulesResult || mlResult || rptResult) && (
          <div>
            <div style={{ paddingTop: SP.l, paddingBottom: SP.s, borderBottom: '1px solid var(--sapList_BorderColor)', marginBottom: SP.m }}>
              <Title level="H4" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>Model Comparison</Title>
            </div>

            <div className="ui5-content-density-compact">
              <Table
                headerRow={
                  <TableHeaderRow sticky>
                    <TableHeaderCell>Approach</TableHeaderCell>
                    <TableHeaderCell>Accuracy</TableHeaderCell>
                    <TableHeaderCell>Precision</TableHeaderCell>
                    <TableHeaderCell>Recall</TableHeaderCell>
                    <TableHeaderCell>F1 Score</TableHeaderCell>
                    <TableHeaderCell>AUC</TableHeaderCell>
                    <TableHeaderCell>Time</TableHeaderCell>
                    <TableHeaderCell>Recommended</TableHeaderCell>
                  </TableHeaderRow>
                }
                noDataText="No results yet"
              >
                {rulesResult && (() => {
                  const isRec = recommendation?.model === 'Rules Baseline';
                  return (
                    <TableRow rowKey="rules" style={isRec ? { background: 'var(--sapSuccessBackground, #f5fae5)' } : {}}>
                      <TableCell><Text maxLines={1}>Rules Baseline</Text></TableCell>
                      <TableCell><Text maxLines={1}>{fmtPct(rulesResult.accuracy)}</Text></TableCell>
                      <TableCell><Text maxLines={1}>{fmtPct(rulesResult.precision)}</Text></TableCell>
                      <TableCell><Text maxLines={1}>{fmtPct(rulesResult.recall)}</Text></TableCell>
                      <TableCell><Text maxLines={1}>{fmtPct(rulesResult.f1)}</Text></TableCell>
                      <TableCell><Text maxLines={1}>{fmtPct(rulesResult.auc)}</Text></TableCell>
                      <TableCell><Text maxLines={1}>{rulesResult.executionMs}ms</Text></TableCell>
                      <TableCell>{isRec ? <ObjectStatus state="Positive">★ Recommended</ObjectStatus> : <Text>—</Text>}</TableCell>
                    </TableRow>
                  );
                })()}

                {mlResult && (() => {
                  const label = mlResult.usedFallback ? 'Decision Tree (JS)' : mlResult.modelType === 'xgboost' ? 'XGBoost' : 'GradientBoosting';
                  const isRec = recommendation && recommendation.model !== 'Rules Baseline';
                  return (
                    <TableRow rowKey="ml" style={isRec ? { background: 'var(--sapSuccessBackground, #f5fae5)' } : {}}>
                      <TableCell><Text maxLines={1}>{label}</Text></TableCell>
                      <TableCell><Text maxLines={1}>{fmtPct(mlResult.accuracy)}</Text></TableCell>
                      <TableCell><Text maxLines={1}>{fmtPct(mlResult.precision)}</Text></TableCell>
                      <TableCell><Text maxLines={1}>{fmtPct(mlResult.recall)}</Text></TableCell>
                      <TableCell><Text maxLines={1}>{fmtPct(mlResult.f1)}</Text></TableCell>
                      <TableCell><Text maxLines={1}>{fmtPct(mlResult.auc)}</Text></TableCell>
                      <TableCell><Text maxLines={1}>{mlResult.trainingMs}ms</Text></TableCell>
                      <TableCell>{isRec ? <ObjectStatus state="Positive">★ Recommended</ObjectStatus> : <Text>—</Text>}</TableCell>
                    </TableRow>
                  );
                })()}

                {rptResult && (
                  <TableRow rowKey="rpt">
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: SP.xs }}>
                        <Text maxLines={1}>RPT Adapter</Text>
                        <Tag design="Critical">Simulated</Tag>
                      </div>
                    </TableCell>
                    <TableCell><Text maxLines={1}>{fmtPct(rptResult.accuracy)}</Text></TableCell>
                    <TableCell><Text maxLines={1}>{fmtPct(rptResult.precision)}</Text></TableCell>
                    <TableCell><Text maxLines={1}>{fmtPct(rptResult.recall)}</Text></TableCell>
                    <TableCell><Text maxLines={1}>{fmtPct(rptResult.f1)}</Text></TableCell>
                    <TableCell><Text maxLines={1}>{fmtPct(rptResult.auc)}</Text></TableCell>
                    <TableCell><Text maxLines={1}>{rptResult.executionMs}ms</Text></TableCell>
                    <TableCell><Text>—</Text></TableCell>
                  </TableRow>
                )}
              </Table>
            </div>

            {recommendation && (
              <MessageStrip design="Information" hideCloseButton style={{ marginTop: SP.m }}>
                <strong>Recommended Starting Approach: {recommendation.model}</strong> — {recommendation.reason}
                <br />
                <em style={{ fontSize: 'var(--sapFontSmallSize)' }}>This is an experiment recommendation, not a production model decision. Validate with real customer data before production use.</em>
              </MessageStrip>
            )}
          </div>
        )}

      </div>
    </DynamicPage>
  );
};

export default ExperimentLab;
