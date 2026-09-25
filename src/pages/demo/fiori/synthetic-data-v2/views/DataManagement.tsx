// @ts-nocheck
import React, { useState } from 'react';
import { Title, Text, Button, ObjectStatus, Tag, Icon, MessageStrip, Input, Label, Select, Option } from '@ui5/webcomponents-react';
import { SP, SEED_FEATURE_SETS } from '../constants';
import type { SyntheticView, DatasetRecord, FeatureSet } from '../types';

// ─── Datasets List ─────────────────────────────────────────────────────────────
interface DatasetsProps {
  nav: (v: SyntheticView) => void;
  datasets: DatasetRecord[];
  onOpenDataset?: (id: string) => void;
}

const QS_STATE: Record<string, 'Positive' | 'Information' | 'Critical' | 'None'> = {
  'Ready for Early ML Experimentation': 'Information',
  'Ready for Prototyping': 'Positive',
  'Needs Calibration': 'Critical',
  'Generated': 'None',
};

export function DatasetsList({ nav, datasets, onOpenDataset }: DatasetsProps) {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: SP.m }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SP.m }}>
        <div>
          <Title level="H3" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>Datasets</Title>
          <Text style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)', display: 'block', marginTop: 4 }}>
            Versioned, immutable datasets. Each generation creates a new record.
          </Text>
        </div>
        <Button design="Emphasized" icon="add-document" onClick={() => nav('generate')}>Create Dataset</Button>
      </div>

      <MessageStrip design="Information" hideCloseButton style={{ marginBottom: SP.m }}>
        Dataset quality status reflects whether the data passed all critical checks. "Needs Calibration" means a critical distribution or rule check failed.
      </MessageStrip>

      <div style={{ display: 'flex', flexDirection: 'column', gap: SP.s }}>
        {datasets.map(ds => (
          <div key={ds.id} style={{ padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)', border: '1px solid var(--sapList_BorderColor)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SP.s }}>
              <div>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', fontSize: 'var(--sapFontLargeSize)', color: onOpenDataset ? 'var(--sapBrandColor)' : 'var(--sapTextColor)', display: 'block', cursor: onOpenDataset ? 'pointer' : 'default', textDecoration: onOpenDataset ? 'underline' : 'none' }} onClick={() => onOpenDataset && onOpenDataset(ds.id)}>{ds.name}</span>
                <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginTop: 2 }}>
                  ID: {ds.id} · Pack {ds.packVersion} · Fidelity: {ds.fidelityLevel} · {ds.customer}
                </Text>
              </div>
              <ObjectStatus state={QS_STATE[ds.qualityStatus] || 'None'}>{ds.qualityStatus}</ObjectStatus>
            </div>
            <div style={{ display: 'flex', gap: SP.m, flexWrap: 'wrap', marginBottom: SP.s }}>
              {[['Business Partners', ds.recordCounts.bp.toLocaleString()], ['Receivables', ds.recordCounts.receivables.toLocaleString()], ['Payments', ds.recordCounts.payments.toLocaleString()], ['Dunning', ds.recordCounts.dunning.toLocaleString()], ['Disputes', ds.recordCounts.disputes.toLocaleString()], ['Seed', String(ds.seed)], ['Created', ds.createdAt.slice(0,10)]].map(([k,v]) => (
                <div key={k} style={{ display: 'flex', gap: 4 }}>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{k}:</span>
                  <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)', fontWeight: 'var(--sapFontBoldWeight)' }}>{v}</span>
                </div>
              ))}
            </div>
            <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block' }}>
              Lineage: {ds.lineage}
            </Text>
            {onOpenDataset && (
              <Button design="Transparent" icon="arrow-right" onClick={() => onOpenDataset(ds.id)} style={{ marginTop: SP.xs }}>Open Dataset Detail</Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Feature Sets ──────────────────────────────────────────────────────────────
interface FeatureSetsProps {
  nav: (v: SyntheticView) => void;
  featureSets: FeatureSet[];
  onAddFeatureSet: (fs: FeatureSet) => void;
}

const ALL_FIELDS = [
  'invoice_amount', 'payment_terms_days', 'risk_segment', 'customer_tenure_days',
  'historical_late_payment_count', 'historical_dispute_count', 'days_outstanding',
  'credit_segment', 'annual_revenue_log', 'country_code', 'dunning_level',
  'ZZ_RISK_CATEGORY', 'ZZ_PAYMENT_CHANNEL',
];

export function FeatureSets({ nav, featureSets, onAddFeatureSet }: FeatureSetsProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [fsName, setFsName] = useState('');
  const [fsDesc, setFsDesc] = useState('');
  const [fsFields, setFsFields] = useState<string[]>([]);

  const toggleField = (f: string) => setFsFields(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  const handleCreate = () => {
    if (!fsName || fsFields.length === 0) return;
    onAddFeatureSet({
      id: `fs-${fsName.toLowerCase().replace(/\s+/g, '-')}-v1`,
      name: fsName,
      version: 'v1',
      description: fsDesc,
      fields: fsFields,
      createdAt: new Date().toISOString(),
    });
    setShowCreate(false);
    setFsName(''); setFsDesc(''); setFsFields([]);
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: SP.m }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SP.m }}>
        <div>
          <Title level="H3" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>Feature Sets</Title>
          <Text style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)', display: 'block', marginTop: 4 }}>
            Named, versioned groups of features. Use the same feature set across multiple runs for reproducible comparison.
          </Text>
        </div>
        <Button design="Emphasized" icon="add" onClick={() => setShowCreate(!showCreate)}>Create Feature Set</Button>
      </div>

      {showCreate && (
        <div style={{ padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8, border: '1px solid var(--sapBrandColor)', marginBottom: SP.m }}>
          <Title level="H5" wrappingType="Normal" style={{ color: 'var(--sapTextColor)', marginBottom: SP.m }}>New Feature Set</Title>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SP.m, marginBottom: SP.m }}>
            <div><Label showColon required>Name</Label><Input value={fsName} onInput={e => setFsName(e.target.value)} style={{ display: 'block', marginTop: 4 }} /></div>
            <div><Label showColon>Description</Label><Input value={fsDesc} onInput={e => setFsDesc(e.target.value)} style={{ display: 'block', marginTop: 4 }} /></div>
          </div>
          <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: SP.s }}>Select Fields</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: SP.xs, marginBottom: SP.m }}>
            {ALL_FIELDS.map(f => (
              <div key={f} onClick={() => toggleField(f)} style={{ padding: '4px 10px', border: fsFields.includes(f) ? '2px solid var(--sapBrandColor)' : '1px solid var(--sapList_BorderColor)', borderRadius: 4, background: fsFields.includes(f) ? 'var(--sapHighlightBackground, #e8f4fd)' : 'var(--sapTile_Background)', cursor: 'pointer', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: fsFields.includes(f) ? 'var(--sapBrandColor)' : 'var(--sapTextColor)', fontWeight: fsFields.includes(f) ? 'var(--sapFontBoldWeight)' : 'normal' }}>
                {f}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: SP.s }}>
            <Button design="Emphasized" onClick={handleCreate} disabled={!fsName || fsFields.length === 0}>Create</Button>
            <Button design="Transparent" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: SP.s }}>
        {featureSets.map(fs => (
          <div key={fs.id} style={{ padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)' }}>
            <div style={{ marginBottom: SP.s }}>
              <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', fontSize: 'var(--sapFontLargeSize)', color: 'var(--sapTextColor)' }}>{fs.name}</span>
              <Tag design="Set2" colorScheme="1" style={{ marginLeft: SP.s }}>{fs.version}</Tag>
            </div>
            <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginBottom: SP.s }}>{fs.description}</Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: SP.xs }}>
              {fs.fields.map(f => <Tag key={f} design="Set2" colorScheme="5">{f}</Tag>)}
            </div>
            <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginTop: SP.xs }}>{fs.fields.length} features · Created {fs.createdAt.slice(0,10)}</Text>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Approach Catalog ──────────────────────────────────────────────────────────
import { APPROACH_CATALOG } from '../constants';
import type { ApproachConfig, TaskType } from '../types';

interface ApproachProps {
  nav: (v: SyntheticView) => void;
}

export function ApproachCatalog({ nav }: ApproachProps) {
  const [taskFilter, setTaskFilter] = useState<TaskType | 'All'>('All');
  const [selected, setSelected] = useState<ApproachConfig | null>(null);

  const filtered = taskFilter === 'All' ? APPROACH_CATALOG : APPROACH_CATALOG.filter(a => a.taskTypes.includes(taskFilter));

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: SP.m }}>
      <Title level="H3" wrappingType="Normal" style={{ color: 'var(--sapTextColor)', marginBottom: SP.s }}>Approach Catalog</Title>
      <Text style={{ fontFamily: 'var(--sapFontFamily)', color: 'var(--sapContent_LabelColor)', display: 'block', marginBottom: SP.m }}>
        Algorithms and adapters available for experimentation. All approaches implement the same interface: train, predict, evaluate, explain.
      </Text>

      <div style={{ display: 'flex', gap: SP.s, marginBottom: SP.m, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>Task Type:</span>
        {(['All', 'Binary Classification', 'Regression', 'Ranking', 'Forecasting'] as const).map(t => (
          <button key={t} onClick={() => setTaskFilter(t)} style={{ padding: '4px 12px', background: taskFilter === t ? 'var(--sapBrandColor)' : 'var(--sapTile_Background)', color: taskFilter === t ? '#fff' : 'var(--sapTextColor)', border: `1px solid ${taskFilter === t ? 'var(--sapBrandColor)' : 'var(--sapList_BorderColor)'}`, borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)' }}>{t}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: SP.m }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: SP.m }}>
          {filtered.map(a => (
            <div key={a.id} onClick={() => setSelected(selected?.id === a.id ? null : a)} style={{ padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)', borderTop: `3px solid ${a.isReal ? 'var(--sapPositiveColor)' : 'var(--sapInformationColor)'}`, border: selected?.id === a.id ? '2px solid var(--sapBrandColor)' : undefined, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: SP.s }}>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>{a.name}</span>
                <ObjectStatus state={a.isReal ? 'Positive' : 'Information'}>{a.label}</ObjectStatus>
              </div>
              <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginBottom: SP.s }}>{a.description}</Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: SP.xs }}>
                {a.taskTypes.slice(0,2).map(t => <Tag key={t} design="Set2" colorScheme="3">{t}</Tag>)}
                {a.taskTypes.length > 2 && <Tag design="Set2" colorScheme="1">+{a.taskTypes.length - 2}</Tag>}
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div style={{ padding: SP.m, background: 'var(--sapTile_Background)', borderRadius: 8, boxShadow: 'var(--sapContent_Shadow0)', alignSelf: 'start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: SP.m }}>
              <Title level="H5" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>{selected.name}</Title>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sapContent_LabelColor)', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)' }}>✕</button>
            </div>
            <ObjectStatus state={selected.isReal ? 'Positive' : 'Information'} style={{ marginBottom: SP.m }}>{selected.label}</ObjectStatus>
            <Text style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)', display: 'block', marginBottom: SP.m }}>{selected.description}</Text>
            <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginBottom: SP.s }}>Default Parameters</span>
            {Object.entries(selected.defaultParams).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4, paddingBottom: 4, borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)' }}>{k}</span>
                <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapTextColor)' }}>{String(v)}</span>
              </div>
            ))}
            <div style={{ marginTop: SP.m, padding: SP.s, background: 'var(--sapBackgroundColor)', borderRadius: 6, border: '1px solid var(--sapList_BorderColor)' }}>
              <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', marginBottom: 4 }}>Adapter Interface</span>
              {['getMetadata()', 'validateTaskType()', 'train(X, y)', 'predict(X)', 'evaluate(y_true, y_pred)', 'explain()'].map(m => (
                <div key={m} style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--sapBrandColor)', paddingTop: 2 }}>{m}</div>
              ))}
            </div>
            <span style={{ display: 'block', fontFamily: 'var(--sapFontFamily)', fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)', marginTop: SP.m, marginBottom: SP.xs }}>Compatible Task Types</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: SP.xs }}>
              {selected.taskTypes.map(t => <Tag key={t} design="Set2" colorScheme="3">{t}</Tag>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
