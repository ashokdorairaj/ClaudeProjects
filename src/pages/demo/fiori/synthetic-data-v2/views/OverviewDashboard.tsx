// @ts-nocheck
import React from 'react';
import {
  DynamicPage, DynamicPageTitle, DynamicPageHeader,
  Title, Text, FlexBox, Button, Tag, ObjectStatus, Icon,
} from '@ui5/webcomponents-react';
import type { SyntheticView, PackVersion, GeneratedDataset, RulesResult, MLResult } from '../types';
import { SP, FLYWHEEL_STEPS, NORTHSTAR, PROCUREMENT_PACK } from '../constants';
import KpiTile from '../components/KpiTile';

interface Props {
  nav: (v: SyntheticView) => void;
  dataset: GeneratedDataset | null;
  packVersions: PackVersion[];
  datasetsGenerated: number;
  experimentsRun: number;
  rulesResult: RulesResult | null;
  mlResult: MLResult | null;
}

const OverviewDashboard: React.FC<Props> = ({ nav, dataset, packVersions, datasetsGenerated, experimentsRun }) => {
  const validatedPacks = packVersions.filter(v => v.status === 'Validated').length;

  return (
    <DynamicPage
      style={{ flex: 1, overflow: 'hidden', '--ui5_dynamic_page_background': 'var(--sapObjectHeader_Background)' } as React.CSSProperties}
      headerTitle={
        <DynamicPageTitle style={{ paddingLeft: SP.m }}>
          <Title slot="heading" level="H3" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>
            Synthetic Data & Experiment Accelerator
          </Title>
          <Text slot="subheading" style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)' }}>
            SAP enterprise experiment foundation — start from a known assistant, not from zero
          </Text>
          <div slot="actionsBar" style={{ display: 'flex', gap: SP.s, flexShrink: 0 }}>
            <Button design="Emphasized" icon="journey-arrive" onClick={() => nav('generate')}>
              Start New Experiment
            </Button>
          </div>
        </DynamicPageTitle>
      }
      headerContent={
        <DynamicPageHeader>
          <div style={{ paddingTop: SP.m, paddingBottom: SP.m, paddingLeft: SP.g, paddingRight: SP.g }}>
            <FlexBox wrap="Wrap" style={{ gap: SP.m }}>
              <KpiTile label="Experiment Packs" value="2" sub="Collections validated · Procurement in draft" />
              <KpiTile label="Validated Packs" value={validatedPacks.toString()} sub="Ready for customer engagements" />
              <KpiTile label="Synthetic Datasets" value={datasetsGenerated.toString()} sub={datasetsGenerated > 0 ? 'Generated this session' : 'None yet — generate one below'} subColor={datasetsGenerated > 0 ? 'var(--sapPositiveColor)' : 'var(--sapContent_LabelColor)'} />
              <KpiTile label="Experiments Run" value={experimentsRun.toString()} sub={experimentsRun > 0 ? 'Rules / XGBoost / RPT' : 'Run from Dataset Preview'} subColor={experimentsRun > 0 ? 'var(--sapPositiveColor)' : 'var(--sapContent_LabelColor)'} />
            </FlexBox>
          </div>
        </DynamicPageHeader>
      }
    >
      <div style={{ paddingTop: SP.m, paddingBottom: SP.l, paddingLeft: SP.g, paddingRight: SP.g }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60fr 40fr', gap: SP.m }}>

          {/* ── Pack Cards ──────────────────────────────────────────────── */}
          <div>
            <div style={{ paddingTop: SP.l, paddingBottom: SP.s, borderBottom: '1px solid var(--sapList_BorderColor)', marginBottom: SP.m }}>
              <Title level="H4" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>Experiment Packs</Title>
            </div>

            {/* AR Collections Pack — clickable */}
            <div
              role="button"
              tabIndex={0}
              aria-label="Open Collections & Disputes pack"
              onClick={() => nav('packDetail')}
              onKeyDown={(e) => e.key === 'Enter' && nav('packDetail')}
              style={{
                background: 'var(--sapTile_Background)',
                borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)',
                boxShadow: 'var(--sapContent_Shadow0)',
                borderLeft: '4px solid var(--sapPositiveColor)',
                overflow: 'hidden',
                marginBottom: SP.m,
                cursor: 'pointer',
                transition: 'box-shadow 0.15s',
              }}
            >
              <div style={{ paddingTop: SP.m, paddingBottom: SP.m, paddingLeft: SP.m, paddingRight: SP.m }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SP.s }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: SP.s, marginBottom: SP.xs }}>
                      <Icon name="course-book" tooltip="Experiment Pack" style={{ width: '1rem', height: '1rem', color: 'var(--sapPositiveColor)' }} />
                      <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontLargeSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>
                        Collections & Disputes
                      </span>
                      <Tag design="Positive">v1.0</Tag>
                    </div>
                    <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', marginBottom: SP.s }}>
                      Late payment prediction · Dispute prediction · Collections prioritization
                    </span>
                  </div>
                  <ObjectStatus state="Positive" style={{ flexShrink: 0 }}>Validated</ObjectStatus>
                </div>
                <div style={{ display: 'flex', gap: SP.s, flexWrap: 'wrap' }}>
                  <Tag design="Set1" colorScheme="5">AR & Collections</Tag>
                  <Tag design="Set1" colorScheme="3">FSCM</Tag>
                  <Tag design="Set1" colorScheme="3">S/4 AR</Tag>
                  <Tag design="Set1" colorScheme="8">6 entities</Tag>
                  <Tag design="Set1" colorScheme="8">L1–L4</Tag>
                </div>
                <div style={{ marginTop: SP.s, display: 'flex', alignItems: 'center', gap: SP.xs }}>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapBrandColor)' }}>
                    Click to view pack definition and generate data →
                  </span>
                </div>
              </div>
            </div>

            {/* Procurement Pack — view only */}
            <div style={{
              background: 'var(--sapTile_Background)',
              borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)',
              boxShadow: 'var(--sapContent_Shadow0)',
              borderLeft: '4px solid var(--sapNeutralColor, #d8d8d8)',
              overflow: 'hidden',
              opacity: 0.85,
            }}>
              <div style={{ paddingTop: SP.m, paddingBottom: SP.m, paddingLeft: SP.m, paddingRight: SP.m }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SP.s }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: SP.s, marginBottom: SP.xs }}>
                      <Icon name="course-book" tooltip="Experiment Pack" style={{ width: '1rem', height: '1rem', color: 'var(--sapNeutralColor, #d8d8d8)' }} />
                      <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontLargeSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>
                        {PROCUREMENT_PACK.name}
                      </span>
                      <Tag>{PROCUREMENT_PACK.version}</Tag>
                    </div>
                    <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', marginBottom: SP.s }}>
                      {PROCUREMENT_PACK.note}
                    </span>
                  </div>
                  <ObjectStatus state="None">Draft</ObjectStatus>
                </div>
                <div style={{ display: 'flex', gap: SP.s, flexWrap: 'wrap' }}>
                  <Tag design="Set1" colorScheme="7">Procurement</Tag>
                  <Tag design="Set1" colorScheme="7">Ariba</Tag>
                  {PROCUREMENT_PACK.entities.map(e => (
                    <Tag key={e} design="Set1" colorScheme="8">{e}</Tag>
                  ))}
                </div>
                <div style={{ marginTop: SP.s }}>
                  <Tag design="Critical">Coming Next</Tag>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', marginLeft: SP.s }}>
                    Validates the pack pattern outside Finance
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Flywheel ──────────────────────────────────────────────────── */}
          <div>
            <div style={{ paddingTop: SP.l, paddingBottom: SP.s, borderBottom: '1px solid var(--sapList_BorderColor)', marginBottom: SP.m }}>
              <Title level="H4" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>The Enterprise Flywheel</Title>
            </div>

            <div style={{
              background: 'var(--sapTile_Background)',
              borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)',
              boxShadow: 'var(--sapContent_Shadow0)',
              paddingTop: SP.m,
              paddingBottom: SP.m,
              paddingLeft: SP.m,
              paddingRight: SP.m,
            }}>
              {FLYWHEEL_STEPS.map((step, i) => (
                <React.Fragment key={step.label}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: SP.s }}>
                    <div style={{
                      background: 'var(--sapBrandColor)',
                      borderRadius: '50%',
                      width: '1.75rem',
                      height: '1.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon name={step.icon} tooltip={step.label} style={{ width: '1rem', height: '1rem', color: 'var(--sapButton_Emphasized_TextColor, #fff)' }} />
                    </div>
                    <div>
                      <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>
                        {step.label}
                      </span>
                      <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>
                        {step.desc}
                      </span>
                    </div>
                  </div>
                  {i < FLYWHEEL_STEPS.length - 1 && (
                    <div style={{ marginLeft: '0.875rem', width: 2, height: '1.25rem', background: 'var(--sapBrandColor)', opacity: 0.3, marginTop: 2, marginBottom: 2 }} />
                  )}
                </React.Fragment>
              ))}

              <div style={{ marginTop: SP.m, paddingTop: SP.m, borderTop: '1px solid var(--sapList_BorderColor)', textAlign: 'center' }}>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapBrandColor)', fontStyle: 'italic' }}>
                  "Every engagement makes the next one faster."
                </span>
                <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', marginTop: SP.xs }}>
                  Customer data stays isolated. Reusable learnings improve the pack.
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DynamicPage>
  );
};

export default OverviewDashboard;
