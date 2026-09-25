import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './ProjectsPanel.css';

export interface Project {
  id: string;
  name: string;
  updatedAt?: string;
  starred?: boolean;
}

export interface ProjectsPanelProps {
  /** Currently active project filter */
  activeFilter?: 'all' | 'starred' | 'mine' | 'shared';
  onFilterChange?: (filter: 'all' | 'starred' | 'mine' | 'shared') => void;
  /** Recent projects shown at the bottom */
  recentProjects?: Project[];
  onProjectSelect?: (project: Project) => void;
  onNewProject?: () => void;
  onToggleSidebar?: () => void;
}

/* ── Search Modal ───────────────────────────────────────────────── */

interface SearchModalProps {
  projects: Project[];
  onClose: () => void;
  onProjectSelect?: (p: Project) => void;
}

const NAV_LINKS = [
  { label: 'Dashboard', icon: '⌂', external: false },
  { label: 'Create new project', icon: '+', external: false },
  { label: 'Documentation', icon: '📖', external: true },
  { label: 'Changelog', icon: '🕐', external: true },
  { label: 'Settings', icon: '⚙', external: false },
];

const SearchModal: React.FC<SearchModalProps> = ({ projects, onClose, onProjectSelect }) => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Project | null>(projects[0] ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const filtered = query
    ? projects.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    : projects;

  return ReactDOM.createPortal(
    <div className="sm-backdrop" onClick={onClose}>
      <div className="sm-modal" onClick={e => e.stopPropagation()}>
        {/* ── Left column ── */}
        <div className="sm-left">
          <div className="sm-search-row">
            <svg className="sm-search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="#888" strokeWidth="1.3"/>
              <path d="M10 10l3.5 3.5" stroke="#888" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              ref={inputRef}
              className="sm-search-input"
              placeholder="Search..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          <div className="sm-section-label">Recent projects</div>
          <ul className="sm-list">
            {filtered.map(p => (
              <li key={p.id}>
                <button
                  className={`sm-item${selected?.id === p.id ? ' sm-item--active' : ''}`}
                  onMouseEnter={() => setSelected(p)}
                  onClick={() => { onProjectSelect?.(p); onClose(); }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                    <rect x="1" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M4 3V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                  <span>{p.name}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="sm-section-label sm-section-label--gap">Navigate to</div>
          <ul className="sm-list">
            {NAV_LINKS.map(n => (
              <li key={n.label}>
                <button className="sm-item sm-item--nav">
                  <span className="sm-nav-icon">{n.icon}</span>
                  <span>{n.label}</span>
                  {n.external && (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 'auto', opacity: 0.4 }}>
                      <path d="M2 10L10 2M5 2h5v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Right column ── */}
        {selected && (
          <div className="sm-right">
            <div className="sm-preview">
              <div className="sm-preview-placeholder">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" opacity="0.3">
                  <rect x="2" y="2" width="28" height="28" rx="4" stroke="#888" strokeWidth="1.5"/>
                  <path d="M2 10h28M10 2v28" stroke="#888" strokeWidth="1.5"/>
                </svg>
              </div>
            </div>
            <div className="sm-meta">
              <div className="sm-meta-title">{selected.name}</div>
              <div className="sm-meta-grid">
                <span className="sm-meta-label">Created by</span>
                <span className="sm-meta-value">Jennifer Wang</span>
                <span className="sm-meta-label">Status</span>
                <span className="sm-meta-value">Private</span>
                <span className="sm-meta-label">Created</span>
                <span className="sm-meta-value">{selected.updatedAt ?? '—'}</span>
                <span className="sm-meta-label">Last edited</span>
                <span className="sm-meta-value">{selected.updatedAt ?? '—'}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="sm-footer">
          <button
            className="sm-open-btn"
            onClick={() => { if (selected) { onProjectSelect?.(selected); onClose(); } }}
          >
            Open project
            <span className="sm-enter-icon">↵</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const IconHome = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M2 6.5L8 2l6 4.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    <path d="M6 15v-5h4v5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>
);

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const IconGrid = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);

const IconStar = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 2l1.6 3.3 3.6.5-2.6 2.5.6 3.6L8 10.3l-3.2 1.6.6-3.6L2.8 5.8l3.6-.5L8 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>
);

const IconPerson = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const IconPeople = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M1 14c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <circle cx="11.5" cy="5" r="2" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M13 10.2c1.2.6 2 1.9 2 3.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const DEFAULT_RECENTS: Project[] = [
  { id: 'proj-1', name: 'FioriWeb Design System', updatedAt: 'Today' },
  { id: 'proj-2', name: 'S/4HANA Homepage 2028', updatedAt: 'Yesterday' },
  { id: 'proj-3', name: 'Concur Travel Hub', updatedAt: '2 days ago' },
];

type FilterKey = 'all' | 'starred' | 'mine' | 'shared';

export const ProjectsPanel: React.FC<ProjectsPanelProps> = ({
  activeFilter: controlledFilter,
  onFilterChange,
  recentProjects = DEFAULT_RECENTS,
  onProjectSelect,
  onNewProject,
  onToggleSidebar,
}) => {
  const [internalFilter, setInternalFilter] = useState<FilterKey>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const activeFilter = controlledFilter ?? internalFilter;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const setFilter = (f: FilterKey) => {
    setInternalFilter(f);
    onFilterChange?.(f);
  };

  const filters: { key: FilterKey; label: string; icon: React.ReactNode }[] = [
    { key: 'all',     label: 'All projects',   icon: <IconGrid /> },
    { key: 'starred', label: 'Starred',         icon: <IconStar /> },
    { key: 'mine',    label: 'Created by me',  icon: <IconPerson /> },
    { key: 'shared',  label: 'Shared with me', icon: <IconPeople /> },
  ];

  return (
    <aside className="pp-panel">
      {/* ── Top nav ── */}
      <nav className="pp-top-nav" aria-label="Main navigation">
        {onToggleSidebar && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 4px', marginBottom: 4 }}>
            <button
              onClick={onToggleSidebar}
              title="Close sidebar"
              style={{
                width: 24, height: 24, borderRadius: 5,
                border: '1px solid #e0e0e0', background: 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="14" height="14" rx="2" stroke="#555" strokeWidth="1.3"/>
                <line x1="5" y1="1" x2="5" y2="15" stroke="#555" strokeWidth="1.3"/>
              </svg>
            </button>
          </div>
        )}
        <button className="pp-nav-item pp-nav-item--active" aria-current="page">
          <IconHome />
          <span>Home</span>
        </button>
        <button className="pp-nav-item" onClick={() => setSearchOpen(true)}>
          <IconSearch />
          <span>Search</span>
          <span className="pp-kbd"><kbd>⌘</kbd><kbd>K</kbd></span>
        </button>
      </nav>
      {searchOpen && (
        <SearchModal
          projects={recentProjects}
          onClose={() => setSearchOpen(false)}
          onProjectSelect={onProjectSelect}
        />
      )}

      {/* ── Projects section ── */}
      <div className="pp-section">
        <div className="pp-section-header">
          <span className="pp-section-label">Projects</span>
          <button
            className="pp-new-btn"
            onClick={onNewProject}
            title="New project"
            aria-label="New project"
          >
            <IconPlus />
          </button>
        </div>
        <ul className="pp-filter-list" role="list">
          {filters.map(f => (
            <li key={f.key}>
              <button
                className={`pp-filter-item${activeFilter === f.key ? ' pp-filter-item--active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.icon}
                <span>{f.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Recents section ── */}
      {recentProjects.length > 0 && (
        <div className="pp-section pp-section--recents">
          <div className="pp-section-header">
            <span className="pp-section-label">Recents</span>
          </div>
          <ul className="pp-recents-list" role="list">
            {recentProjects.map(p => (
              <li key={p.id}>
                <button
                  className="pp-recent-item"
                  onClick={() => onProjectSelect?.(p)}
                  title={p.name}
                >
                  <span className="pp-recent-name">{p.name}</span>
                  {p.updatedAt && (
                    <span className="pp-recent-meta">{p.updatedAt}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Spacer ── */}
      <div style={{ flex: 1 }} />
    </aside>
  );
};

export default ProjectsPanel;
