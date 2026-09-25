import React from 'react';

const projects = [
  {
    key: 'aldi',
    label: 'ALDI',
    description: 'Transport Management planning refinement — AI-powered rules engine surfaces optimization recommendations for freight planners and admins.',
    pages: [
      { key: 'demo/fiori/aldi-tm-planning', label: 'TM Planning Refinement' },
      { key: 'demo/fiori/aldi-tm-post-optimization', label: 'TM Post-Optimization v1' },
      { key: 'demo/fiori/aldi-tm-post-optimization-v2', label: 'TM Post-Optimization V2' },
    ],
  },
  {
    key: 'synthetic',
    label: 'Synthetic Data Accelerator',
    description: 'SAP enterprise experiment foundation — reusable synthetic data packs with FK integrity, XGBoost ML, 4-level fidelity ramp, and PM-first engagement flow.',
    pages: [
      { key: 'demo/fiori/synthetic-data-accelerator', label: 'Accelerator (Overview)' },
      { key: 'demo/fiori/synthetic-data-v2', label: 'Accelerator v2' },
      { key: 'demo/fiori/synthetic-data-v3', label: 'Accelerator v3' },
    ],
  },
  {
    key: 'pge',
    label: "PG&E",
    description: 'AI-powered Rule 21 interconnection workflow — worklist and project detail screens with HITL recommendation cards for grid connection decisions.',
    pages: [
      { key: 'demo/fiori/pge-interconnection', label: 'Interconnection Intelligence' },
    ],
  },
  {
    key: 'bayer',
    label: 'Bayer',
    description: 'AI-powered Accounts Receivable collections — customer prioritization, account history, autonomous agent runs timeline, and CDO executive dashboard.',
    pages: [
      { key: 'demo/fiori/bayer-collections', label: 'AR Collections Assistant' },
      { key: 'demo/fiori/bayer-ar-account', label: 'AR Account' },
      { key: 'demo/fiori/bayer-ar-collections', label: 'AR Collections' },
      { key: 'demo/fiori/bayer-ar-collections-cdo', label: 'AR Collections CDO' },
      { key: 'demo/fiori/bayer-collection-agent', label: 'Collection Agent' },
    ],
  },
];

const HomePage: React.FC = () => {
  const navigate = (key: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', key);
    window.history.pushState(null, '', url.toString());
    window.dispatchEvent(new CustomEvent('fiori:navigate', { detail: key }));
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--sapBackgroundColor, #f5f6f7)', fontFamily: 'var(--sapFontFamily, 72, sans-serif)' }}>
      {/* Header */}
      <div style={{ background: 'var(--sapShell_Background, #354a5e)', color: '#fff', padding: '3rem 2rem 2.5rem' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7, marginBottom: '0.5rem' }}>Claude-built SAP Fiori Prototypes</div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#fff' }}>Demo Gallery</h1>
          <p style={{ margin: '0.75rem 0 0', fontSize: '1rem', opacity: 0.8, maxWidth: 560 }}>
            Production-grade SAP Fiori demos built with @ui5/webcomponents-react, exploring AI-assisted enterprise workflows.
          </p>
        </div>
      </div>

      {/* Project cards */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))' }}>
          {projects.map(project => (
            <div key={project.key} style={{
              background: 'var(--sapBaseColor, #fff)',
              border: '1px solid var(--sapList_BorderColor, #e5e5e5)',
              borderRadius: 'var(--sapGroup_BorderCornerRadius, 8px)',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '1.25rem 1.5rem 1rem', borderBottom: '1px solid var(--sapList_BorderColor, #e5e5e5)' }}>
                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--sapTextColor, #1d2d3e)' }}>{project.label}</h2>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.8125rem', color: 'var(--sapContent_LabelColor, #556b82)', lineHeight: 1.5 }}>{project.description}</p>
              </div>
              <div style={{ padding: '0.75rem 1rem' }}>
                {project.pages.map(page => (
                  <button
                    key={page.key}
                    onClick={() => navigate(page.key)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '0.6rem 0.75rem', marginBottom: '0.25rem',
                      background: 'none', border: 'none', borderRadius: 6,
                      cursor: 'pointer', fontSize: '0.875rem',
                      color: 'var(--sapLinkColor, #0064d9)',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--sapList_Hover_Background, #f0f4f9)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    → {page.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
