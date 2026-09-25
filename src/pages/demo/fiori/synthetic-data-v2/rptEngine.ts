import type { GeneratedDataset, RPTResult, FeatureImportance } from './types';
import { buildFeatureMatrix } from './dataEngine';

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function computeMetrics(labels: number[], probs: number[]) {
  const threshold = 0.5;
  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (let i = 0; i < labels.length; i++) {
    const pred = probs[i] >= threshold ? 1 : 0;
    if (pred === 1 && labels[i] === 1) tp++;
    else if (pred === 1 && labels[i] === 0) fp++;
    else if (pred === 0 && labels[i] === 1) fn++;
    else tn++;
  }
  const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
  const recall    = (tp + fn) > 0 ? tp / (tp + fn) : 0;
  const f1        = (precision + recall) > 0 ? 2 * precision * recall / (precision + recall) : 0;
  const accuracy  = (tp + tn) / (tp + fp + fn + tn);

  // ROC AUC via 20-point trapezoid
  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);
  const points: Array<[number, number]> = [];
  for (const t of thresholds) {
    let tpr_num = 0, tpr_den = 0, fpr_num = 0, fpr_den = 0;
    for (let i = 0; i < labels.length; i++) {
      const pred = probs[i] >= t ? 1 : 0;
      if (labels[i] === 1) { tpr_den++; if (pred === 1) tpr_num++; }
      else { fpr_den++; if (pred === 1) fpr_num++; }
    }
    points.push([fpr_den > 0 ? fpr_num / fpr_den : 0, tpr_den > 0 ? tpr_num / tpr_den : 0]);
  }
  points.sort((a, b) => a[0] - b[0]);
  let auc = 0;
  for (let i = 1; i < points.length; i++) {
    auc += (points[i][0] - points[i - 1][0]) * (points[i][1] + points[i - 1][1]) / 2;
  }

  return { precision, recall, f1, accuracy, auc };
}

export function runRPTAdapter(dataset: GeneratedDataset): RPTResult {
  const t0 = performance.now();

  const { features, labels, featureNames } = buildFeatureMatrix(dataset);
  const n = features.length;
  const d = featureNames.length;

  if (n === 0) {
    return { accuracy: 0, precision: 0, recall: 0, f1: 0, auc: 0.5,
      featureImportances: [], executionMs: 0, isSimulated: true, sampleSize: 0 };
  }

  // Normalize features (z-score)
  const means = new Array<number>(d).fill(0);
  const stds  = new Array<number>(d).fill(0);
  for (const row of features) row.forEach((v, j) => { means[j] += v; });
  means.forEach((_, j) => { means[j] /= n; });
  for (const row of features) row.forEach((v, j) => { stds[j] += (v - means[j]) ** 2; });
  stds.forEach((_, j) => { stds[j] = Math.sqrt(stds[j] / n) || 1; });

  const Xn = features.map(row => row.map((v, j) => (v - means[j]) / stds[j]));

  // Logistic regression via gradient descent (50 iterations)
  let w = new Array<number>(d).fill(0);
  let b = 0;
  const lr = 0.01;

  for (let iter = 0; iter < 50; iter++) {
    const dw = new Array<number>(d).fill(0);
    let db = 0;
    for (let i = 0; i < n; i++) {
      const pred = sigmoid(Xn[i].reduce((s, x, j) => s + x * w[j], 0) + b);
      const err = pred - labels[i];
      for (let j = 0; j < d; j++) dw[j] += err * Xn[i][j];
      db += err;
    }
    for (let j = 0; j < d; j++) w[j] -= lr * dw[j] / n;
    b -= lr * db / n;
  }

  // Compute probabilities and metrics
  const probs = Xn.map(row => sigmoid(row.reduce((s, x, j) => s + x * w[j], 0) + b));
  const { precision, recall, f1, accuracy, auc } = computeMetrics(labels, probs);

  // Feature importances from absolute weight magnitudes (normalized)
  const rawImps = w.map(v => Math.abs(v));
  const totalImp = rawImps.reduce((a, b) => a + b, 0) || 1;
  const featureImportances: FeatureImportance[] = featureNames
    .map((name, j) => ({ feature: name, importance: Math.round(rawImps[j] / totalImp * 10000) / 10000 }))
    .sort((a, b) => b.importance - a.importance);

  return {
    accuracy: Math.round(accuracy * 10000) / 10000,
    precision: Math.round(precision * 10000) / 10000,
    recall: Math.round(recall * 10000) / 10000,
    f1: Math.round(f1 * 10000) / 10000,
    auc: Math.round(auc * 10000) / 10000,
    featureImportances,
    executionMs: Math.round(performance.now() - t0),
    isSimulated: true,
    sampleSize: n,
  };
}
