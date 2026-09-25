import React, { useState } from 'react';
import './Tree.css';

export interface TreeNode {
  key: string;
  label: string;
  icon?: React.ReactNode;
  children?: TreeNode[];
  disabled?: boolean;
}

export interface TreeProps {
  nodes: TreeNode[];
  selectedKey?: string;
  /** Controlled expanded keys. When provided the component is fully controlled. */
  expandedKeys?: string[];
  /** Initial expanded keys for uncontrolled mode. */
  defaultExpandedKeys?: string[];
  formFactor?: 'cozy' | 'compact';
  selection?: 'none' | 'single' | 'multi';
  /** Keys of selected nodes – required for multi selection, optional for single. */
  selectedKeys?: Set<string>;
  onSelect?: (key: string) => void;
  onExpand?: (key: string, expanded: boolean) => void;
  className?: string;
}

/** SAP Fiori slim-arrow chevron — rotates via CSS for expand/collapse */
const ChevronRight: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M4.5 2.5 L8 6 L4.5 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface TreeNodeProps {
  node: TreeNode;
  level: number;
  selectedKey?: string;
  selectedKeys?: Set<string>;
  expandedKeys: Set<string>;
  formFactor?: 'cozy' | 'compact';
  selection?: 'none' | 'single' | 'multi';
  onSelect?: (key: string) => void;
  onToggleExpand: (key: string, expanded: boolean) => void;
}

const TreeNodeItem: React.FC<TreeNodeProps> = ({
  node,
  level,
  selectedKey,
  selectedKeys,
  expandedKeys,
  formFactor,
  selection,
  onSelect,
  onToggleExpand,
}) => {
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const isExpanded = expandedKeys.has(node.key);
  const isSelected =
    selection === 'multi'
      ? (selectedKeys?.has(node.key) ?? false)
      : selectedKey === node.key;
  const indent = level * 20;

  const classNames = [
    'fd-tree__item',
    isSelected ? 'fd-tree__item--selected' : '',
    node.disabled ? 'fd-tree__item--disabled' : '',
    formFactor === 'compact' ? 'fd-tree__item--compact' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!node.disabled) {
      onToggleExpand(node.key, !isExpanded);
    }
  };

  const handleItemClick = () => {
    if (node.disabled) return;
    if (selection !== 'none') {
      onSelect?.(node.key);
    }
    if (hasChildren) {
      onToggleExpand(node.key, !isExpanded);
    }
  };

  return (
    <li role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined} aria-selected={isSelected} aria-disabled={node.disabled}>
      <div
        className={classNames}
        style={{ paddingLeft: `${8 + indent}px` }}
        onClick={handleItemClick}
        tabIndex={node.disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleItemClick();
          }
        }}
      >
        {hasChildren ? (
          <button
            className={`fd-tree__expand-btn${isExpanded ? ' fd-tree__expand-btn--open' : ''}`}
            onClick={handleExpandClick}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            type="button"
            tabIndex={-1}
          >
            <ChevronRight />
          </button>
        ) : (
          <span className="fd-tree__expand-placeholder" aria-hidden="true" />
        )}

        {selection === 'multi' && (
          <span
            className={`fd-tree__checkbox${isSelected ? ' fd-tree__checkbox--checked' : ''}`}
            aria-hidden="true"
          />
        )}

        {node.icon && (
          <span className="fd-tree__icon" aria-hidden="true">
            {node.icon}
          </span>
        )}

        <span className="fd-tree__label">{node.label}</span>
      </div>

      {hasChildren && isExpanded && (
        <ul className="fd-tree__children" role="group">
          {node.children!.map((child) => (
            <TreeNodeItem
              key={child.key}
              node={child}
              level={level + 1}
              selectedKey={selectedKey}
              selectedKeys={selectedKeys}
              expandedKeys={expandedKeys}
              formFactor={formFactor}
              selection={selection}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export const Tree: React.FC<TreeProps> = ({
  nodes,
  selectedKey,
  selectedKeys,
  expandedKeys: controlledExpandedKeys,
  defaultExpandedKeys = [],
  formFactor = 'cozy',
  selection = 'single',
  onSelect,
  onExpand,
  className = '',
}) => {
  const [internalExpandedKeys, setInternalExpandedKeys] = useState<Set<string>>(
    new Set(defaultExpandedKeys)
  );

  const isControlled = controlledExpandedKeys !== undefined;
  const expandedKeys = isControlled
    ? new Set(controlledExpandedKeys)
    : internalExpandedKeys;

  const handleToggleExpand = (key: string, expanded: boolean) => {
    if (!isControlled) {
      setInternalExpandedKeys((prev) => {
        const next = new Set(prev);
        if (expanded) {
          next.add(key);
        } else {
          next.delete(key);
        }
        return next;
      });
    }
    onExpand?.(key, expanded);
  };

  const classNames = [
    'fd-tree',
    formFactor === 'compact' ? 'fd-tree--compact' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <ul className={classNames} role="tree">
      {nodes.map((node) => (
        <TreeNodeItem
          key={node.key}
          node={node}
          level={0}
          selectedKey={selectedKey}
          selectedKeys={selectedKeys}
          expandedKeys={expandedKeys}
          formFactor={formFactor}
          selection={selection}
          onSelect={onSelect}
          onToggleExpand={handleToggleExpand}
        />
      ))}
    </ul>
  );
};

export default Tree;
