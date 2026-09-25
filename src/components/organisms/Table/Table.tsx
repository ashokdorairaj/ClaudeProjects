import React, { useState } from 'react';
import type { ValueState } from '../../../tokens';
import './Table.css';

export interface TableColumn {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
}

export interface TableRow {
  key: string;
  cells: Record<string, React.ReactNode>;
  selected?: boolean;
  /** Visual state highlight for the row — matches ValueState semantics */
  rowState?: Exclude<ValueState, 'None'>;
  disabled?: boolean;
  navigatable?: boolean;
}

export interface TableToolbarAction {
  key: string;
  label?: string;
  icon?: React.ReactNode;
  type?: 'button' | 'separator';
  onClick?: () => void;
}

export interface TableToolbarProps {
  title?: string;
  count?: number;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  actions?: TableToolbarAction[];
}

/**
 * Structured data grid for displaying, sorting, and selecting tabular records.
 * Built-in toolbar with search and action buttons.
 *
 * @see src/pages/docs/table.md
 *
 * @constraints
 * - `selectionMode="Multi"` renders checkboxes; `"Single"` renders radio-style row selection. `"None"` is read-only.
 * - `selectedKeys` is controlled — always sync with `onRowSelect` to keep selection state consistent.
 * - `rowState` on `TableRow` accepts any `ValueState` except `"None"` — use `"Negative"` for errors, `"Critical"` for warnings, `"Positive"` for confirmed.
 * - `stickyHeader=true` requires the Table parent to have a bounded height (e.g. `height: 400px; overflow: auto`).
 * - For read-only flat lists without row actions, prefer `List` over `Table`.
 *
 * @example
 * <Table
 *   columns={[{ key: 'id', label: 'Order #', sortable: true }, { key: 'status', label: 'Status' }]}
 *   rows={orders.map(o => ({ key: o.id, cells: { id: o.id, status: o.status } }))}
 *   selectionMode="Multi"
 *   selectedKeys={selected}
 *   onRowSelect={toggleRow}
 *   toolbar={{ title: 'Orders', count: orders.length, actions: [{ key: 'add', label: 'New', onClick: openNew }] }}
 * />
 */
export interface TableProps {
  columns: TableColumn[];
  rows: TableRow[];
  selectionMode?: 'None' | 'Single' | 'Multi';
  selectedKeys?: string[];
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  formFactor?: 'cozy' | 'compact';
  stickyHeader?: boolean;
  navigatable?: boolean;
  toolbar?: TableToolbarProps;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  onRowSelect?: (key: string) => void;
  onRowNavigate?: (key: string) => void;
  className?: string;
}

/* ── Search icon SVG ──────────────────────────────────────── */
const SearchIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.2" />
    <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

/* ── Navigate arrow SVG ───────────────────────────────────── */
const SlimArrowRight: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M4.5 2.5L7.5 6l-3 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Sort icons ───────────────────────────────────────────── */
const SortAscIcon: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M6 2.5V9.5M3 5.5L6 2.5L9 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const SortDescIcon: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M6 9.5V2.5M3 6.5L6 9.5L9 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const SortNoneIcon: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M3 4.5L6 2L9 4.5M3 7.5L6 10L9 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Toolbar ──────────────────────────────────────────────── */
const TableToolbar: React.FC<TableToolbarProps> = ({
  title,
  count,
  searchPlaceholder = 'Search',
  onSearch,
  actions = [],
}) => {
  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <div className="fd-table__toolbar">
      <div className="fd-table__toolbar-left">
        {title && (
          <span className="fd-table__toolbar-title">
            {title}
            {count !== undefined && (
              <span className="fd-table__toolbar-count"> ({count})</span>
            )}
          </span>
        )}
      </div>
      <div className="fd-table__toolbar-right">
        {onSearch && (
          <div className="fd-table__toolbar-search">
            <input
              className="fd-table__toolbar-search-input"
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={handleSearchChange}
              aria-label={searchPlaceholder}
            />
            <span className="fd-table__toolbar-search-icon">
              <SearchIcon />
            </span>
          </div>
        )}
        {actions.map((action) => {
          if (action.type === 'separator') {
            return <div key={action.key} className="fd-table__toolbar-separator" />;
          }
          return (
            <button
              key={action.key}
              className={`fd-table__toolbar-btn${action.label ? ' fd-table__toolbar-btn--text' : ''}`}
              onClick={action.onClick}
              type="button"
              aria-label={action.label}
            >
              {action.icon && <span className="fd-table__toolbar-btn-icon">{action.icon}</span>}
              {action.label && <span>{action.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ── Table ────────────────────────────────────────────────── */
export const Table: React.FC<TableProps> = ({
  columns,
  rows,
  selectionMode = 'None',
  selectedKeys = [],
  sortKey,
  sortDirection = 'asc',
  formFactor = 'cozy',
  stickyHeader = false,
  navigatable = false,
  toolbar,
  onSort,
  onRowSelect,
  onRowNavigate,
  className = '',
}) => {
  const handleSort = (colKey: string, sortable?: boolean) => {
    if (!sortable || !onSort) return;
    const newDirection =
      sortKey === colKey && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(colKey, newDirection);
  };

  const handleRowClick = (row: TableRow) => {
    if (row.disabled || selectionMode === 'None') return;
    onRowSelect?.(row.key);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, rowKey: string) => {
    e.stopPropagation();
    onRowSelect?.(rowKey);
  };

  const isRowSelected = (row: TableRow) =>
    selectedKeys.includes(row.key) || !!row.selected;

  const tableClass = [
    'fd-table',
    formFactor === 'compact' ? 'fd-table--compact' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={tableClass}>
      {toolbar && <TableToolbar {...toolbar} />}
      <table role="grid" aria-multiselectable={selectionMode === 'Multi' ? 'true' : undefined}>
        <thead
          className={`fd-table__header${stickyHeader ? ' fd-table__header--sticky' : ''}`}
        >
          <tr>
            {selectionMode === 'Single' && (
              <th
                className="fd-table__header-cell fd-table__cell--checkbox"
                scope="col"
                aria-label="Selection"
              />
            )}
            {selectionMode === 'Multi' && (
              <th
                className="fd-table__header-cell fd-table__cell--checkbox"
                scope="col"
              >
                <input
                  type="checkbox"
                  aria-label="Select all rows"
                  onChange={() => {
                    rows
                      .filter((r) => !r.disabled)
                      .forEach((r) => onRowSelect?.(r.key));
                  }}
                  checked={
                    rows.length > 0 &&
                    rows.filter((r) => !r.disabled).every((r) => isRowSelected(r))
                  }
                />
              </th>
            )}
            {columns.map((col) => {
              const isSorted = sortKey === col.key;
              const headerClass = [
                'fd-table__header-cell',
                col.sortable ? 'fd-table__header-cell--sortable' : '',
                isSorted ? 'fd-table__header-cell--sorted' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <th
                  key={col.key}
                  className={headerClass}
                  scope="col"
                  style={{
                    width: col.width,
                    textAlign:
                      col.align === 'center' ? 'center' : col.align === 'end' ? 'right' : 'left',
                  }}
                  aria-sort={
                    isSorted
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                  onClick={() => handleSort(col.key, col.sortable)}
                >
                  <span className="fd-table__header-cell-content">
                    {col.label}
                    {col.sortable && (
                      <span className="fd-table__sort-icon">
                        {isSorted
                          ? sortDirection === 'asc'
                            ? <SortAscIcon />
                            : <SortDescIcon />
                          : <SortNoneIcon />}
                      </span>
                    )}
                  </span>
                </th>
              );
            })}
            {navigatable && (
              <th className="fd-table__header-cell fd-table__cell--navigate" scope="col" aria-label="Navigate" />
            )}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const selected = isRowSelected(row);
            const rowNavigatable = navigatable || row.navigatable;
            const rowClass = [
              'fd-table__row',
              selected ? 'fd-table__row--selected' : '',
              row.disabled ? 'fd-table__row--disabled' : '',
              row.rowState ? `fd-table__row--highlight-${row.rowState.toLowerCase()}` : '',
              rowNavigatable ? 'fd-table__row--navigatable' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <tr
                key={row.key}
                className={rowClass}
                aria-selected={selected ? 'true' : undefined}
                onClick={() => handleRowClick(row)}
                tabIndex={selectionMode !== 'None' && !row.disabled ? 0 : undefined}
                style={
                  (selectionMode === 'Single' || selectionMode === 'Multi') && !row.disabled
                    ? { cursor: 'pointer' }
                    : undefined
                }
              >
                {selectionMode === 'Single' && (
                  <td className="fd-table__cell fd-table__cell--checkbox">
                    <input
                      type="radio"
                      checked={selected}
                      disabled={row.disabled}
                      aria-label={`Select row ${row.key}`}
                      onChange={() => onRowSelect?.(row.key)}
                      onClick={(e) => e.stopPropagation()}
                      name="table-row-selection"
                    />
                  </td>
                )}
                {selectionMode === 'Multi' && (
                  <td className="fd-table__cell fd-table__cell--checkbox">
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={row.disabled}
                      aria-label={`Select row ${row.key}`}
                      onChange={(e) => handleCheckboxChange(e, row.key)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="fd-table__cell"
                    style={{
                      textAlign:
                        col.align === 'center' ? 'center' : col.align === 'end' ? 'right' : 'left',
                    }}
                  >
                    {row.cells[col.key] ?? null}
                  </td>
                ))}
                {rowNavigatable && (
                  <td className="fd-table__cell fd-table__cell--navigate">
                    <button
                      className="fd-table__navigate-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowNavigate?.(row.key);
                      }}
                      aria-label="Navigate to row"
                      type="button"
                    >
                      <SlimArrowRight />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}

          {rows.length === 0 && (
            <tr>
              <td
                className="fd-table__cell fd-table__cell--no-data"
                colSpan={
                  columns.length +
                  (selectionMode !== 'None' ? 1 : 0) +
                  (navigatable ? 1 : 0)
                }
              >
                No data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
