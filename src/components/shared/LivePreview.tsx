/**
 * LivePreview — renders generated TSX inline inside the running app.
 *
 * Works in both dev (Vite) and production (CF) because it transforms
 * TSX client-side using Babel standalone, then evaluates it with React
 * and all @ui5/webcomponents-react exports already in scope.
 *
 * No iframe needed. No server round-trip. No Vite required.
 */
import React, { useState, useEffect, useRef } from 'react';
import * as UI5 from '@ui5/webcomponents-react';

// Error boundary — catches runtime crashes inside the generated component
// so they don't propagate up and blank the whole app.
class PreviewErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: string | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(e: Error) {
    return { error: e.message + (e.stack ? '\n\n' + e.stack : '') };
  }
  render() {
    if (this.state.error) {
      return (
        <pre style={{
          color: '#aa0808', background: '#fff4f4', border: '1px solid #aa0808',
          borderRadius: 8, padding: '1rem', margin: '1rem',
          fontFamily: 'ui-monospace, monospace', fontSize: 12, whiteSpace: 'pre-wrap', overflow: 'auto',
        }}>
          {'Preview error:\n' + this.state.error}
        </pre>
      );
    }
    return this.props.children;
  }
}

// Babel standalone is loaded once lazily and cached on window.Babel
let _babelLoading: Promise<void> | null = null;

function ensureBabel(): Promise<void> {
  if (typeof window !== 'undefined' && (window as any).Babel) return Promise.resolve();
  if (_babelLoading) return _babelLoading;
  _babelLoading = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/@babel/standalone@7/babel.min.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Babel standalone'));
    document.head.appendChild(s);
  });
  return _babelLoading;
}


interface Props {
  tsxCode: string;
}

const LivePreview: React.FC<Props> = ({ tsxCode }) => {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const keyRef = useRef(0);

  useEffect(() => {
    if (!tsxCode) return;
    keyRef.current += 1;
    const myKey = keyRef.current;
    setLoading(true);
    setError('');
    setComponent(null);

    (async () => {
      try {
        await ensureBabel();
        if (myKey !== keyRef.current) return; // stale

        const Babel = (window as any).Babel;

        // Strip all import/export statements before Babel sees the code.
        // We inject React + UI5 as pre-declared variables instead, so there
        // are no duplicate const declarations when components import the same
        // module multiple times (e.g. both `import * as UI5` and named imports).
        const stripped = tsxCode
          // Remove multi-line and single-line: import ... from '...'
          .replace(/import\s+(?:type\s+)?(?:\*\s+as\s+\w+|\{[^}]*\}|\w+(?:\s*,\s*(?:\{[^}]*\}|\w+))*)\s+from\s+['"][^'"]+['"]\s*;?/gs, '')
          // Remove: import '...' (side-effect imports)
          .replace(/import\s+['"][^'"]+['"]\s*;?/g, '')
          // Remove: export default — replace with assignment so we capture the component
          .replace(/^export\s+default\s+/gm, 'module.exports.default = ')
          // Remove bare named re-exports: export { Foo, Bar }
          .replace(/^export\s+\{[^}]*\}\s*;?\s*$/gm, '');

        // Transpile TSX + TS syntax only — no module transform needed since
        // imports are already stripped above.
        const result = Babel.transform(stripped, {
          presets: [
            ['react', { runtime: 'classic' }],
            ['typescript', { allExtensions: true, isTSX: true }],
          ],
          filename: 'component.tsx',
        });

        if (myKey !== keyRef.current) return;

        // Inject React + the full UI5 namespace so generated code can reference
        // any UI5 component by name (they were imported but we stripped those
        // imports — re-inject everything as local variables).
        const UI5Spread = Object.keys(UI5)
          .filter(k => /^[A-Z]/.test(k))
          .map(k => `var ${k} = UI5.${k};`)
          .join('\n');

        const preamble = `var React = _React;\nvar UI5 = _UI5;\n` +
          // React hooks and common APIs as bare names
          `var useState = _React.useState;\n` +
          `var useEffect = _React.useEffect;\n` +
          `var useRef = _React.useRef;\n` +
          `var useCallback = _React.useCallback;\n` +
          `var useMemo = _React.useMemo;\n` +
          `var useContext = _React.useContext;\n` +
          `var useReducer = _React.useReducer;\n` +
          `var useId = _React.useId;\n` +
          `var createContext = _React.createContext;\n` +
          `var Fragment = _React.Fragment;\n` +
          UI5Spread + '\n';

        // Wrap in a CommonJS module factory
        const moduleFactory = new Function(
          '_React', '_UI5', 'module', 'exports',
          preamble + result.code + '\n//# sourceURL=generated-component.js'
        );

        const mod = { exports: {} as any };
        moduleFactory(React, UI5, mod, mod.exports);

        const Comp: React.ComponentType = mod.exports.default || mod.exports;
        if (typeof Comp !== 'function') {
          throw new Error('Generated component has no default export');
        }

        if (myKey !== keyRef.current) return;
        setComponent(() => Comp);
        setLoading(false);
      } catch (e: any) {
        if (myKey !== keyRef.current) return;
        setError(e.message + (e.stack ? '\n\n' + e.stack : ''));
        setLoading(false);
      }
    })();
  }, [tsxCode]);

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: 'var(--sapContent_LabelColor)', fontSize: '0.875rem', gap: 8,
      }}>
        <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>◌</span>
        Rendering preview…
      </div>
    );
  }

  if (error) {
    return (
      <pre style={{
        color: '#aa0808', background: '#fff4f4', border: '1px solid #aa0808',
        borderRadius: 8, padding: '1rem', margin: '1rem',
        fontFamily: 'ui-monospace, monospace', fontSize: 12, whiteSpace: 'pre-wrap', overflow: 'auto',
      }}>
        {'Preview error:\n' + error}
      </pre>
    );
  }

  if (!Component) return null;

  return (
    <PreviewErrorBoundary>
      <UI5.ThemeProvider>
        <div style={{ height: '100%', overflow: 'hidden' }}>
          <Component />
        </div>
      </UI5.ThemeProvider>
    </PreviewErrorBoundary>
  );
};

export default LivePreview;
