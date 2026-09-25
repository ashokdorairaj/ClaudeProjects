import type { GeneratedDataset, HealthResponse, MLResult } from './types';
import { buildFeatureMatrix } from './dataEngine';
import { runJSFallback } from './mlFallback';

const BASE = '';

// Detect GitHub Pages / static hosting — no Express API available
const IS_STATIC = !window.location.hostname.includes('localhost') &&
                  !window.location.hostname.includes('127.0.0.1');

// ─── Health Check ─────────────────────────────────────────────────────────────
export async function getHealth(): Promise<HealthResponse> {
  if (IS_STATIC) {
    return { ok: true, pythonAvailable: false, xgboostAvailable: false, pythonVersion: null };
  }
  try {
    const res = await fetch(`${BASE}/api/synthetic/health`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { ok: false, pythonAvailable: false, xgboostAvailable: false, pythonVersion: null };
    return res.json();
  } catch {
    return { ok: false, pythonAvailable: false, xgboostAvailable: false, pythonVersion: null };
  }
}

// ─── Train XGBoost via Express/Python (or JS fallback on static hosting) ─────
export async function trainXGBoost(dataset: GeneratedDataset): Promise<MLResult> {
  const { features, labels, featureNames } = buildFeatureMatrix(dataset);

  // On GitHub Pages / static hosting: skip API entirely, run JS fallback
  if (IS_STATIC) {
    return runJSFallback(features, labels, featureNames, dataset.receivables.length);
  }

  const body = {
    features: features.map(row => {
      const obj: Record<string, number> = {};
      featureNames.forEach((n, i) => { obj[n] = row[i]; });
      return obj;
    }),
    labels,
  };

  try {
    const res = await fetch(`${BASE}/api/synthetic/train-model`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(180000),
    });

    if (!res.ok) {
      // Server returned non-JSON (e.g. static 404) — fall back to JS
      return runJSFallback(features, labels, featureNames, dataset.receivables.length);
    }

    const data = await res.json();
    if (!data.ok) return runJSFallback(features, labels, featureNames, dataset.receivables.length);

    return {
      modelType: data.modelType,
      accuracy: data.accuracy,
      precision: data.precision,
      recall: data.recall,
      f1: data.f1,
      auc: data.auc,
      featureImportances: data.featureImportances ?? [],
      trainingMs: data.trainingMs ?? 0,
      usedFallback: data.usedFallback ?? false,
      sampleSize: labels.length,
    };
  } catch {
    return runJSFallback(features, labels, featureNames, dataset.receivables.length);
  }
}

// ─── CSV Download (client-side, no server round-trip) ─────────────────────────
export function downloadCSV(rows: Record<string, unknown>[], entityName: string): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const v = row[h];
        const s = v === null || v === undefined ? '' : String(v);
        return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(',')
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${entityName}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── ZIP Download (local only — not available on static hosting) ──────────────
export async function downloadZip(dataset: GeneratedDataset): Promise<void> {
  if (IS_STATIC) {
    throw new Error('ZIP download requires the local dev server. Use individual CSV downloads instead.');
  }
  const res = await fetch(`${BASE}/api/synthetic/download-zip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataset }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error('ZIP download failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'northstar-synthetic-data.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
