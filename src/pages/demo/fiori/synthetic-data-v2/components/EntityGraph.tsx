import React, { useState } from 'react';
import { Tag, Select, Option, Title, Text } from '@ui5/webcomponents-react';
import { ENTITY_SCHEMAS, SP } from '../constants';

type EntityName = keyof typeof ENTITY_SCHEMAS;

interface EntityGraphProps {
  onEntityClick?: (entity: EntityName) => void;
}

const NODES: Array<{ id: EntityName; label: string; x: number; y: number; color: string }> = [
  { id: 'BUSINESS_PARTNER',     label: 'Business Partner',  x: 50,  y: 20,  color: 'var(--sapInformativeColor)' },
  { id: 'RECEIVABLE',           label: 'Receivable',        x: 50,  y: 48,  color: 'var(--sapBrandColor)' },
  { id: 'PAYMENT',              label: 'Payment',           x: 15,  y: 76,  color: 'var(--sapPositiveColor)' },
  { id: 'DUNNING',              label: 'Dunning',           x: 50,  y: 76,  color: 'var(--sapCriticalColor)' },
  { id: 'DISPUTE',              label: 'Dispute',           x: 84,  y: 76,  color: 'var(--sapNegativeColor)' },
  { id: 'Z_COLLECTION_HISTORY', label: 'Collection History',x: 50,  y: 104, color: 'var(--sapNeutralColor)' },
];

const EDGES = [
  { from: 'BUSINESS_PARTNER', to: 'RECEIVABLE' },
  { from: 'RECEIVABLE', to: 'PAYMENT' },
  { from: 'RECEIVABLE', to: 'DUNNING' },
  { from: 'RECEIVABLE', to: 'DISPUTE' },
  { from: 'BUSINESS_PARTNER', to: 'Z_COLLECTION_HISTORY' },
];

const EntityGraph: React.FC<EntityGraphProps> = ({ onEntityClick }) => {
  const [selected, setSelected] = useState<EntityName | null>(null);

  const handleClick = (id: EntityName) => {
    setSelected(id);
    onEntityClick?.(id);
  };

  const nodeMap = new Map(NODES.map(n => [n.id, n]));

  return (
    <div>
      {/* SVG Entity Graph */}
      <div style={{ overflowX: 'auto', marginBottom: SP.m }}>
        <svg viewBox="0 0 200 130" style={{ width: '100%', maxWidth: 700, display: 'block' }} role="img" aria-label="Entity relationship diagram">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--sapContent_IconColor, #6a6d70)" />
            </marker>
          </defs>

          {/* Edges */}
          {EDGES.map(edge => {
            const from = nodeMap.get(edge.from as EntityName);
            const to   = nodeMap.get(edge.to as EntityName);
            if (!from || !to) return null;
            return (
              <line
                key={`${edge.from}-${edge.to}`}
                x1={from.x} y1={from.y + 5}
                x2={to.x}   y2={to.y - 5}
                stroke="var(--sapContent_IconColor, #6a6d70)"
                strokeWidth="0.8"
                markerEnd="url(#arrow)"
              />
            );
          })}

          {/* Nodes */}
          {NODES.map(node => {
            const isSelected = selected === node.id;
            const schema = ENTITY_SCHEMAS[node.id] ?? [];
            return (
              <g key={node.id} onClick={() => handleClick(node.id as EntityName)} style={{ cursor: 'pointer' }}>
                <rect
                  x={node.x - 22} y={node.y - 6}
                  width={44} height={12}
                  rx={2} ry={2}
                  fill={isSelected ? 'var(--sapSelected_Background, #e0f0ff)' : 'var(--sapTile_Background, #fff)'}
                  stroke={isSelected ? 'var(--sapBrandColor)' : node.color}
                  strokeWidth={isSelected ? 1.5 : 1}
                />
                <text
                  x={node.x} y={node.y + 1}
                  textAnchor="middle"
                  fontSize={3.2}
                  fontFamily="var(--sapFontFamily, Arial)"
                  fill="var(--sapTextColor, #32363a)"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                >
                  {node.label}
                </text>
                <text
                  x={node.x} y={node.y + 5}
                  textAnchor="middle"
                  fontSize={2.4}
                  fontFamily="var(--sapFontFamily, Arial)"
                  fill="var(--sapContent_LabelColor, #6a6d70)"
                >
                  {schema.length} fields
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <span style={{ fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)', color: 'var(--sapContent_LabelColor)', display: 'block', marginBottom: SP.m }}>
        Click an entity to inspect its schema
      </span>

      {/* Schema Inspector */}
      <div style={{ marginBottom: SP.s }}>
        <Title level="H5" wrappingType="Normal" style={{ color: 'var(--sapTextColor)', marginBottom: SP.s }}>Entity Schema Inspector</Title>
        <Select
          style={{ width: '100%', maxWidth: 320, display: 'block', marginBottom: SP.m }}
          onChange={(e) => setSelected(e.detail.selectedOption.getAttribute('data-key') as EntityName)}
        >
          {NODES.map(node => (
            <Option key={node.id} data-key={node.id} selected={selected === node.id}>{node.label}</Option>
          ))}
        </Select>
      </div>

      {selected && ENTITY_SCHEMAS[selected] && (
        <div style={{
          background: 'var(--sapTile_Background)',
          borderRadius: 'var(--sapTile_BorderCornerRadius, 0.75rem)',
          boxShadow: 'var(--sapContent_Shadow0)',
          overflow: 'hidden',
        }}>
          <div style={{ paddingTop: SP.s, paddingBottom: SP.s, paddingLeft: SP.m, paddingRight: SP.m, borderBottom: '1px solid var(--sapList_BorderColor)', display: 'flex', alignItems: 'center', gap: SP.s }}>
            <Title level="H5" wrappingType="Normal" style={{ color: 'var(--sapTextColor)' }}>{selected}</Title>
            <Tag design="Set1" colorScheme="5">{ENTITY_SCHEMAS[selected].length} fields</Tag>
          </div>
          <div className="ui5-content-density-compact">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--sapFontFamily)', fontSize: 'var(--sapFontSmallSize)' }}>
              <thead>
                <tr style={{ background: 'var(--sapList_HeaderBackground, var(--sapBackgroundColor))' }}>
                  {['Field Name', 'Type', 'Constraint', 'Nullable', 'Description'].map(h => (
                    <th key={h} style={{ textAlign: 'left', paddingTop: SP.xs, paddingBottom: SP.xs, paddingLeft: SP.s, paddingRight: SP.s, borderBottom: '1px solid var(--sapList_BorderColor)', color: 'var(--sapContent_LabelColor)', fontWeight: 'var(--sapFontBoldWeight)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ENTITY_SCHEMAS[selected].map((field, i) => (
                  <tr key={field.name} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--sapList_AlternatingBackground, var(--sapTile_Background))' }}>
                    <td style={{ paddingTop: SP.xs, paddingBottom: SP.xs, paddingLeft: SP.s, paddingRight: SP.s, fontWeight: 'var(--sapFontBoldWeight)', color: 'var(--sapTextColor)' }}>
                      {field.name}
                    </td>
                    <td style={{ paddingTop: SP.xs, paddingBottom: SP.xs, paddingLeft: SP.s, paddingRight: SP.s }}>
                      <Tag design="Set1" colorScheme="8">{field.type}</Tag>
                    </td>
                    <td style={{ paddingTop: SP.xs, paddingBottom: SP.xs, paddingLeft: SP.s, paddingRight: SP.s }}>
                      {field.constraint === 'PK' && <Tag design="Positive">PK</Tag>}
                      {field.constraint === 'FK' && <Tag design="Information">FK</Tag>}
                      {!field.constraint && <span style={{ color: 'var(--sapContent_LabelColor)' }}>—</span>}
                    </td>
                    <td style={{ paddingTop: SP.xs, paddingBottom: SP.xs, paddingLeft: SP.s, paddingRight: SP.s, color: field.nullable ? 'var(--sapCriticalColor)' : 'var(--sapPositiveColor)' }}>
                      {field.nullable ? 'Yes' : 'No'}
                    </td>
                    <td style={{ paddingTop: SP.xs, paddingBottom: SP.xs, paddingLeft: SP.s, paddingRight: SP.s, color: 'var(--sapContent_LabelColor)' }}>
                      {field.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntityGraph;
