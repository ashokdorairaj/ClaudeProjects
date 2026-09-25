// @ts-nocheck
import React, { useState } from 'react';
import {
  DynamicPage, DynamicPageTitle, DynamicPageHeader,
  Title, Text, Button, ObjectStatus, Tag, Icon, MessageStrip, FlexBox,
  SegmentedButton, SegmentedButtonItem,
  Table, TableHeaderRow, TableHeaderCell, TableRow, TableCell,
} from '@ui5/webcomponents-react';
import type { SyntheticView, PackVersion } from '../types';
import { SP } from '../constants';
import KpiTile from '../components/KpiTile';
import SectionHead from '../components/SectionHead';

interface Props {
  nav: (v: SyntheticView) => void;
  packVersions: PackVersion[];
  setPackVersions: (pv: PackVersion[]) => void;
  showToast: (msg: string) => void;
}

const PackVersioning: React.FC<Props> = ({ nav, packVersions, setPackVersions, showToast }) => {
  const [activeVersion, setActiveVersion] = useState(packVersions[packVersions.length - 1]?.version ?? 'v1.0');

  const current = packVersions.find(v => v.version === activeVersion);
  const v11 = packVersions.find(v => v.version === 'v1.1');

  const validateV11 = () => {
    setPackVersions(packVersions.map(v =>
      v.version === 'v1.1'
        ? { ...v, status: 'Validated', validatedAt: new Date().toISOString().split('T')[0] }
        : v
    ));
    showToast('Pack v1.1 validated — now the default for new Collections engagements');
  };

  if (!current) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: SP.l }}>
        <MessageStrip design="Warning" hideCloseButton>No pack versions found.</MessageStrip>
      </div>
    );
  }

  return (
    <DynamicPage
      style={{ flex: 1, overflow: 'hidden', '--ui5_dynamic_page_background': 'var(--sapObjectHeader_Background)' } as React.CSSProperties}
      headerTitle={
        <DynamicPageTitle style={{ paddingLeft: SP.m }}>
          <Title slot="heading" level="H3" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>
            Pack Versioning
          </Title>
          <Text slot="subheading" style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)' }}>
            Collections &amp; Disputes — version history and change management
          </Text>
          <div slot="actionsBar" style={{ display: 'flex', gap: SP.s, flexShrink: 0 }}>
            {v11 && v11.status === 'Draft' ? (
              <Button design="Emphasized" icon="accept" onClick={validateV11}>
                Validate Pack v1.1
              </Button>
            ) : (
              <Button design="Transparent" icon="add-document" onClick={() => nav('learnings')}>
                Add Learnings
              </Button>
            )}
          </div>
        </DynamicPageTitle>
      }
      headerContent={
        <DynamicPageHeader>
          <div style={{ paddingTop: SP.m, paddingBottom: SP.m, paddingLeft: SP.g, paddingRight: SP.g }}>
            <FlexBox wrap="Wrap" style={{ gap: SP.m }}>
              <KpiTile label="Validated Version" value={packVersions.find(v => v.status === 'Validated')?.version ?? '—'} />
              <KpiTile label="Draft Version" value={v11 ? 'v1.1' : 'None'} sub={v11 ? `${v11.learningsIncorporated} learnings incorporated` : 'Create from Reusable Learnings'} subColor={v11 ? 'var(--sapInformativeColor)' : 'var(--sapContent_LabelColor)'} />
              <KpiTile label="Total Versions" value={packVersions.length.toString()} />
            </FlexBox>
          </div>
        </DynamicPageHeader>
      }
    >
      <div style={{ paddingTop: SP.m, paddingBottom: SP.l, paddingLeft: SP.g, paddingRight: SP.g }}>

        <MessageStrip design="Information" hideCloseButton style={{ marginBottom: SP.m }}>
          <strong>Customer transactional data is never stored in the pack.</strong> Only generalized, domain-level learnings can be promoted. Each version can be used to generate synthetic data independently.
        </MessageStrip>

        {/* Version Selector */}
        <div style={{ marginBottom: SP.m }}>
          <SegmentedButton onSelectionChange={e => setActiveVersion(e.detail.selectedItem.getAttribute('data-key'))}>
            {packVersions.map(v => (
              <SegmentedButtonItem
                key={v.version}
                data-key={v.version}
                pressed={activeVersion === v.version}
              >
                {v.version} {v.status === 'Validated' ? '✓' : '(Draft)'}
              </SegmentedButtonItem>
            ))}
          </SegmentedButton>
        </div>

        {/* Version Detail Card */}
        <div style={{
          background: 'var(--sapTile_Background)',
          borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)',
          boxShadow: 'var(--sapContent_Shadow0)',
          borderLeft: `4px solid ${current.status === 'Validated' ? 'var(--sapPositiveColor)' : 'var(--sapInformativeColor)'}`,
          overflow: 'hidden',
          marginBottom: SP.l,
          paddingTop: SP.m,
          paddingBottom: SP.m,
          paddingLeft: SP.m,
          paddingRight: SP.m,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP.m }}>
            <div>
              <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontLargeSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginRight: SP.s }}>
                Collections &amp; Disputes {current.version}
              </span>
              <ObjectStatus state={current.status === 'Validated' ? 'Positive' : 'Information'}>
                {current.status}
              </ObjectStatus>
            </div>
            {current.status === 'Draft' && (
              <Tag design="Critical">Pending Validation</Tag>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: SP.m }}>
            {[
              ['Created', current.createdAt],
              ['Validated', current.validatedAt ?? 'Not yet'],
              ['Entities', current.entityCount.toString()],
              ['Learnings Incorporated', current.learningsIncorporated.toString()],
              ['Changes', current.changes.length.toString()],
            ].map(([k, v]) => (
              <div key={k}>
                <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{k}</span>
                <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Change History */}
        {current.changes.length > 0 && (
          <>
            <SectionHead title={`Change History — ${current.version}`} />
            <div className="ui5-content-density-compact">
              <Table
                headerRow={
                  <TableHeaderRow sticky>
                    <TableHeaderCell>Change ID</TableHeaderCell>
                    <TableHeaderCell>Description</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                  </TableHeaderRow>
                }
                noDataText="No changes"
              >
                {current.changes.map(c => (
                  <TableRow key={c.changeId} rowKey={c.changeId}>
                    <TableCell><Text maxLines={1}>{c.changeId}</Text></TableCell>
                    <TableCell><Text>{c.description}</Text></TableCell>
                    <TableCell>
                      <Tag design="Set1" colorScheme="3">{c.changeType.replace('_', ' ')}</Tag>
                    </TableCell>
                    <TableCell>
                      <ObjectStatus state={current.status === 'Validated' ? 'Positive' : 'Information'}>
                        {current.status === 'Validated' ? 'Validated' : 'Pending Validation'}
                      </ObjectStatus>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            </div>
          </>
        )}

        {current.changes.length === 0 && current.version === 'v1.0' && (
          <div style={{ marginTop: SP.m }}>
            <MessageStrip design="Information" hideCloseButton>
              v1.0 is the initial validated pack. Run experiments and capture learnings to propose Pack v1.1.
            </MessageStrip>
          </div>
        )}

        {/* Flywheel confirmation */}
        {v11 && v11.status === 'Validated' && (
          <div style={{ marginTop: SP.l, background: 'var(--sapSuccessBackground, #f5fae5)', borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)', borderLeft: '4px solid var(--sapPositiveColor)', overflow: 'hidden', paddingTop: SP.m, paddingBottom: SP.m, paddingLeft: SP.m, paddingRight: SP.m }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: SP.s, marginBottom: SP.xs }}>
              <Icon name="journey-arrive" tooltip="Flywheel" style={{ width: '1.5rem', height: '1.5rem', color: 'var(--sapPositiveColor)' }} />
              <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontLargeSize)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapPositiveColor)' }}>
                Flywheel complete for this cycle
              </span>
            </div>
            <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSize)', color: 'var(--sapTextColor)' }}>
              Pack v1.1 is validated. The next Collections engagement starts with {v11.learningsIncorporated} incorporated learnings. Customer data stays isolated. The pack is better.
            </span>
          </div>
        )}

      </div>
    </DynamicPage>
  );
};

export default PackVersioning;
