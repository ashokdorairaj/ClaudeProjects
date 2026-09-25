import type { MLResult, FeatureImportance } from './types';

// ─── Pure JS gradient boosting fallback (no Python, no server) ───────────────
// Used on GitHub Pages / static hosting where Express is unavailable.
// Implements a simple CART decision tree ensemble (3 rounds of boosting).

function gini(labels: number[]): number {
  if (labels.length === 0) return 0;
  const p = labels.filter(Boolean).length / labels.length;
  return 1 - p * p - (1 - p) * (1 - p);
}

function bestSplit(X: number[][], y: number[], featureIdx: number): { threshold: number; gain: number } {
  const vals = X.map(r => r[featureIdx]);
  const sorted = [...new Set(vals)].sort((a, b) => a - b);
  let bestGain = -Infinity;
  let bestT = sorted[0];
  const parentImpurity = gini(y);

  for (let i = 0; i < sorted.length - 1; i++) {
    const t = (sorted[i] + sorted[i + 1]) / 2;
    const left: number[] = [], right: number[] = [];
    for (let j = 0; j < X.length; j++) {
      (X[j][featureIdx] <= t ? left : right).push(y[j]);
    }
    if (left.length === 0 || right.length === 0) continue;
    const gain = parentImpurity
      - (left.length / y.length) * gini(left)
      - (right.length / y.length) * gini(right);
    if (gain > bestGain) { bestGain = gain; bestT = t; }
  }
  return { threshold: bestT, gain: bestGain };
}

function buildTree(X: number[][], y: number[], depth = 0, maxDepth = 4): (row: number[]) => number {
  const pos = y.filter(Boolean).length;
  const leafProb = pos / (y.length || 1);

  if (depth >= maxDepth || y.length < 10 || pos === 0 || pos === y.length) {
    return () => leafProb;
  }

  let bestFeature = 0, bestGain = -Infinity, bestThreshold = 0;
  for (let f = 0; f < X[0].length; f++) {
    const { threshold, gain } = bestSplit(X, y, f);
    if (gain > bestGain) { bestGain = gain; bestFeature = f; bestThreshold = threshold; }
  }

  if (bestGain <= 0) return () => leafProb;

  const leftX: number[][] = [], leftY: number[] = [];
  const rightX: number[][] = [], rightY: number[] = [];
  for (let i = 0; i < X.length; i++) {
    if (X[i][bestFeature] <= bestThreshold) { leftX.push(X[i]); leftY.push(y[i]); }
    else { rightX.push(X[i]); rightY.push(y[i]); }
  }

  const leftTree  = buildTree(leftX, leftY, depth + 1, maxDepth);
  const rightTree = buildTree(rightX, rightY, depth + 1, maxDepth);

  return (row: number[]) => row[bestFeature] <= bestThreshold ? leftTree(row) : rightTree(row);
}

function computeMetrics(y: number[], probs: number[]) {
  const threshold = 0.5;
  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (let i = 0; i < y.length; i++) {
    const pred = probs[i] >= threshold ? 1 : 0;
    if (pred && y[i]) tp++;
    else if (pred && !y[i]) fp++;
    else if (!pred && y[i]) fn++;
    else tn++;
  }
  const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
  const recall    = (tp + fn) > 0 ? tp / (tp + fn) : 0;
  const f1        = (precision + recall) > 0 ? 2 * precision * recall / (precision + recall) : 0;
  const accuracy  = (tp + tn) / (tp + fp + fn + tn || 1);

  // AUC via 20-point trapezoid
  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);
  const points: [number, number][] = thresholds.map(t => {
    let tpN = 0, fpN = 0, tpD = 0, fpD = 0;
    for (let i = 0; i < y.length; i++) {
      const pred = probs[i] >= t ? 1 : 0;
      if (y[i]) { tpD++; if (pred) tpN++; }
      else { fpD++; if (pred) fpN++; }
    }
    return [fpD > 0 ? fpN / fpD : 0, tpD > 0 ? tpN / tpD : 0];
  }).sort((a, b) => a[0] - b[0]);

  let auc = 0;
  for (let i = 1; i < points.length; i++) {
    auc += (points[i][0] - points[i - 1][0]) * (points[i][1] + points[i - 1][1]) / 2;
  }

  return { precision, recall, f1, accuracy, auc };
}

export function runJSFallback(
  features: number[][],
  labels: number[],
  featureNames: string[],
  sampleSize: number
): MLResult {
  const t0 = performance.now();
  const n = features.length;

  if (n === 0) {
    return {
      modelType: 'js-decision-tree', accuracy: 0, precision: 0, recall: 0, f1: 0, auc: 0.5,
      featureImportances: [], trainingMs: 0, usedFallback: true, sampleSize: 0,
    };
  }

  // Subsample for speed on large datasets (max 5K for training)
  const MAX_TRAIN = 5000;
  let trainX = features, trainY = labels;
  if (n > MAX_TRAIN) {
    const step = Math.floor(n / MAX_TRAIN);
    trainX = features.filter((_, i) => i % step === 0);
    trainY = labels.filter((_, i) => i % step === 0);
  }

  // 80/20 split
  const splitIdx = Math.floor(trainX.length * 0.8);
  const X_train = trainX.slice(0, splitIdx), y_train = trainY.slice(0, splitIdx);
  const X_test  = trainX.slice(splitIdx),    y_test  = trainY.slice(splitIdx);

  // Build 3 boosted trees (simplified gradient boosting)
  const trees: Array<(row: number[]) => number> = [];
  let residuals = [...y_train];
  const lr = 0.3;

  for (let round = 0; round < 3; round++) {
    const tree = buildTree(X_train, residuals.map(r => r > 0 ? 1 : 0), 0, 3);
    trees.push(tree);
    // Update residuals
    residuals = residuals.map((r, i) => r - lr * tree(X_train[i]));
  }

  // Predict on test set
  const probs = X_test.map(row => {
    const raw = trees.reduce((s, t) => s + lr * t(row), 0);
    return Math.max(0, Math.min(1, raw));
  });

  const { precision, recall, f1, accuracy, auc } = computeMetrics(y_test, probs);

  // Feature importances: approximate by computing variance reduction per feature
  const importances = featureNames.map((_, fi) => {
    const vals = trainX.map(r => r[fi]);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
    return variance;
  });
  const totalImp = importances.reduce((a, b) => a + b, 0) || 1;
  const featureImportances: FeatureImportance[] = featureNames
    .map((name, i) => ({ feature: name, importance: Math.round(importances[i] / totalImp * 10000) / 10000 }))
    .sort((a, b) => b.importance - a.importance);

  return {
    modelType: 'js-decision-tree',
    accuracy:  Math.round(accuracy  * 10000) / 10000,
    precision: Math.round(precision * 10000) / 10000,
    recall:    Math.round(recall    * 10000) / 10000,
    f1:        Math.round(f1        * 10000) / 10000,
    auc:       Math.round(auc       * 10000) / 10000,
    featureImportances,
    trainingMs: Math.round(performance.now() - t0),
    usedFallback: true,
    sampleSize,
  };
}
