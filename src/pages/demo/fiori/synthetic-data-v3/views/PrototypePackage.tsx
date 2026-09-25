import React, { useCallback } from 'react';
import {
  FlexBox,
  Title,
  Text,
  Button,
  ObjectStatus,
  Card,
  CardHeader,
  MessageStrip,
} from '@ui5/webcomponents-react';
import type { Engagement, SyntheticView } from '../types';
import type { DatasetRecord, GeneratedDataset } from '../../synthetic-data-v2/types';
import { SP } from '../../synthetic-data-v2/constants';

interface Props {
  nav: (v: SyntheticView) => void;
  engagement: Engagement | null;
  dataset: DatasetRecord | null;
  generatedDataset: GeneratedDataset | null;
}

const FIDELITY_STATE: Record<string, 'Positive' | 'Information' | 'Critical'> = {
  L1: 'Information',
  L2: 'Information',
  L3: 'Positive',
  L4: 'Positive',
};

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const PrototypePackage: React.FC<Props> = ({ nav, engagement, dataset, generatedDataset }) => {
  const handleCopyBrief = useCallback(() => {
    if (!engagement) return;
    const brief = [
      `PROTOTYPE BRIEF — ${engagement.name}`,
      `Customer: ${engagement.customer}`,
      `Use Case: ${engagement.useCaseName || engagement.businessProblem}`,
      `Pack: Collections & Disputes ${engagement.packVersion}`,
      `Dataset: ${dataset?.name ?? 'Not selected'}`,
      `Fidelity: ${dataset?.fidelityLevel ?? 'L1'}`,
      `Quality: ${dataset?.qualityStatus ?? '—'}`,
      ``,
      `Business Problem:`,
      engagement.businessProblem,
      ``,
      `Dataset Assumptions:`,
      dataset ? Object.entries(dataset.recordCounts).map(([k, v]) => `  ${k}: ${v.toLocaleString()}`).join('\n') : '  Not generated',
      ``,
      dataset?.lineage ? `Lineage: ${dataset.lineage}` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard?.writeText(brief);
  }, [engagement, dataset]);

  const handleDownloadDataset = useCallback(() => {
    if (!generatedDataset) return;
    const rows = generatedDataset.receivables.slice(0, 500);
    const headers = Object.keys(rows[0] ?? {});
    const csv = [
      headers.join(','),
      ...rows.map(r => headers.map(h => {
        const v = (r as Record<string, unknown>)[h];
        return typeof v === 'string' && v.includes(',') ? `"${v}"` : String(v ?? '');
      }).join(',')),
    ].join('\n');
    downloadBlob(csv, `${dataset?.name ?? 'dataset'}-sample.csv`, 'text/csv');
  }, [generatedDataset, dataset]);

  const handleExportPackage = useCallback(() => {
    if (!engagement) return;
    const pkg = {
      engagementName: engagement.name,
      customer: engagement.customer,
      useCaseName: engagement.useCaseName,
      businessProblem: engagement.businessProblem,
      pack: { id: engagement.packId, version: engagement.packVersion, name: 'Collections & Disputes' },
      dataset: dataset ? {
        id: dataset.id,
        name: dataset.name,
        fidelityLevel: dataset.fidelityLevel,
        qualityStatus: dataset.qualityStatus,
        recordCounts: dataset.recordCounts,
        lineage: dataset.lineage,
      } : null,
      customerContext: engagement.customerContextAnalysis?.summary ?? null,
      exportedAt: new Date().toISOString(),
    };
    downloadBlob(JSON.stringify(pkg, null, 2), `${engagement.name.replace(/\s+/g, '-')}-package.json`, 'application/json');
  }, [engagement, dataset]);

  if (!engagement) {
    return (
      <div style={{ padding: SP.l }}>
        <Text>No engagement selected.</Text>
        <Button design="Default" onClick={() => nav('engagements')} style={{ marginTop: SP.m }}>
          Back to Engagements
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: SP.l }}>
      <FlexBox justifyContent="SpaceBetween" alignItems="Center" style={{ marginBottom: SP.m }}>
        <Title level="H2">Prototype Package</Title>
        <Button design="Transparent" icon="nav-back" onClick={() => nav('engagementDetail')}>
          Back to Engagement
        </Button>
      </FlexBox>

      <MessageStrip design="Information" hideCloseButton style={{ marginBottom: SP.m }}>
        This package contains everything needed to build a customer prototype. Download the dataset, copy the brief, or export the full package.
      </MessageStrip>

      {/* Package Summary */}
      <Card header={<CardHeader titleText="Package Summary" />} style={{ marginBottom: SP.m }}>
        <div style={{ padding: SP.m, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SP.m }}>
          {[
            ['Engagement', engagement.name],
            ['Customer', engagement.customer || '—'],
            ['Use Case', engagement.useCaseName || '—'],
            ['Pack', `Collections & Disputes ${engagement.packVersion}`],
          ].map(([label, value]) => (
            <div key={label}>
              <Text style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--sapContent_LabelColor)', fontWeight: 700 }}>
                {label}
              </Text>
              <Text style={{ display: 'block', marginTop: 2 }}>{value}</Text>
            </div>
          ))}
        </div>
      </Card>

      {/* Dataset */}
      <Card header={<CardHeader titleText="Dataset" />} style={{ marginBottom: SP.m }}>
        <div style={{ padding: SP.m }}>
          {dataset ? (
            <>
              <FlexBox gap={SP.s} alignItems="Center" style={{ marginBottom: SP.s }}>
                <Title level="H4">{dataset.name}</Title>
                <ObjectStatus state={FIDELITY_STATE[dataset.fidelityLevel] ?? 'Information'}>
                  {dataset.fidelityLevel}
                </ObjectStatus>
                <ObjectStatus state="Positive">{dataset.qualityStatus}</ObjectStatus>
              </FlexBox>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: SP.s, marginBottom: SP.s }}>
                {Object.entries(dataset.recordCounts).map(([k, v]) => (
                  <div key={k} style={{ textAlign: 'center', background: 'var(--sapField_Background)', borderRadius: 6, padding: SP.s }}>
                    <Text style={{ display: 'block', fontWeight: 700, fontSize: '1.125rem' }}>{v.toLocaleString()}</Text>
                    <Text style={{ fontSize: '0.75rem', color: 'var(--sapContent_LabelColor)', textTransform: 'capitalize' }}>{k}</Text>
                  </div>
                ))}
              </div>
              <Text style={{ fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor)' }}>{dataset.lineage}</Text>
            </>
          ) : (
            <FlexBox direction="Column" alignItems="Center" gap={SP.m} style={{ padding: SP.m }}>
              <Text style={{ color: 'var(--sapContent_LabelColor)' }}>No dataset selected yet.</Text>
              <Button design="Default" onClick={() => nav('engagementDetail')}>
                Select Dataset
              </Button>
            </FlexBox>
          )}
        </div>
      </Card>

      {/* Business Problem */}
      <Card header={<CardHeader titleText="Business Problem" />} style={{ marginBottom: SP.m }}>
        <div style={{ padding: SP.m }}>
          <div style={{ borderLeft: `3px solid var(--sapHighlightColor)`, paddingLeft: SP.m }}>
            <Text style={{ lineHeight: 1.7 }}>{engagement.businessProblem || 'Not defined yet.'}</Text>
          </div>
        </div>
      </Card>

      {/* Customer Context */}
      {engagement.customerContextAnalysis && (
        <Card header={<CardHeader titleText="Customer Context Applied" />} style={{ marginBottom: SP.m }}>
          <div style={{ padding: SP.m }}>
            <Text style={{ marginBottom: SP.s, display: 'block' }}>
              {engagement.customerContextAnalysis.summary}
            </Text>
            <FlexBox gap={SP.s} style={{ flexWrap: 'wrap' }}>
              {engagement.customerContextAnalysis.items.map((item, i) => (
                <ObjectStatus key={i} state="Information" style={{ fontSize: '0.8125rem' }}>
                  {item.label}
                </ObjectStatus>
              ))}
            </FlexBox>
          </div>
        </Card>
      )}

      {/* Actions */}
      <FlexBox gap={SP.m} style={{ flexWrap: 'wrap' }}>
        <Button
          design="Emphasized"
          icon="download"
          onClick={handleDownloadDataset}
          disabled={!generatedDataset}
        >
          Download Dataset (CSV)
        </Button>
        <Button design="Default" icon="copy" onClick={handleCopyBrief}>
          Copy Prototype Brief
        </Button>
        <Button design="Default" icon="share" onClick={handleExportPackage}>
          Export Package (JSON)
        </Button>
      </FlexBox>
    </div>
  );
};

export default PrototypePackage;
