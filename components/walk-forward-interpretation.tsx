'use client'

import React from 'react';

type VerdictKind = 'profitable' | 'unprofitable' | 'inconclusive' | 'insufficient';

interface Verdict {
  kind: VerdictKind;
  headline: string;
  detail: string;
  /** The test behind the verdict, in one line; absent when there was no test. */
  test: string | null;
}

const finite = (value: any): number | null => {
  const num = typeof value === 'number' ? value : value == null || value === '' ? NaN : Number(value);
  return Number.isFinite(num) ? num : null;
};

// Fold returns are percent and can be as small as -0.0005%.
const signedPercent = (value: number) =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(Math.abs(value) < 0.1 && value !== 0 ? 4 : 2)}%`;

const formatP = (p: number) => (p < 0.0001 ? 'p < 0.0001' : `p = ${p.toFixed(4)}`);

/**
 * The backend's verdict, restated for a reader who doesn't know the statistics.
 *
 * Mirrors helper/walk_forward_report.py `hypothesis_test`: a two-tailed z-test
 * that the mean per-fold validation return is zero, at `alpha_level`. The kind
 * is re-derived from p and the sign rather than read off `hypothesis_decision`,
 * because rows saved before that fix say "profitable" for any rejection,
 * including a significantly negative mean.
 */
export function walkForwardVerdict(result: any): Verdict {
  const folds: any[] = Array.isArray(result?.fold_results) ? result.fold_results : [];
  const foldReturns = folds.map((fold) => finite(fold?.validation_return)).filter((v): v is number => v !== null);
  const mean = foldReturns.length > 0
    ? foldReturns.reduce((sum, v) => sum + v, 0) / foldReturns.length
    : finite(result?.avg_validation_return);
  const n = foldReturns.length || folds.length;
  const z = finite(result?.z_statistic);
  const p = finite(result?.p_value);
  const alpha = finite(result?.alpha_level) ?? 0.05;
  const foldsText = n > 0 ? `${n} fold${n === 1 ? '' : 's'}` : 'the folds';

  // The backend skips the test with fewer than two folds or identical returns.
  if (z === null || p === null || mean === null) {
    const noTrades = folds.length > 0 && folds.every((fold) => finite(fold?.validation_trades) === 0);
    let detail: string;
    if (mean === null) {
      detail = 'This run reported no validation returns, so there is nothing to test.';
    } else if (n < 2) {
      detail = `The significance test needs at least two folds; this run has ${foldsText}. `
        + 'Use a longer date range or fewer validation bars to get more folds.';
    } else if (noTrades) {
      detail = `The strategy made no trades in any of the ${foldsText}' validation windows, so there is nothing to test. `
        + 'Check that the uploaded data matches what the strategy expects.';
    } else {
      detail = `Every one of the ${foldsText} returned ${signedPercent(mean)}, and the test needs returns that vary between folds.`;
    }
    return { kind: 'insufficient', headline: 'Not enough evidence to judge.', detail, test: null };
  }

  const rejected = p < alpha;
  const test = `Two-tailed z-test on mean per-fold validation return · H₀: mean return = 0 · `
    + `z = ${z.toFixed(2)}, ${formatP(p)} · H₀ ${rejected ? 'rejected' : 'not rejected'} at α = ${alpha}`;

  if (rejected && mean > 0) {
    return {
      kind: 'profitable',
      headline: 'Evidence of out-of-sample profitability.',
      detail: `Mean validation return across ${foldsText} was ${signedPercent(mean)}, significantly above zero: `
        + 'the optimised parameters kept making money on data they were not fitted to.',
      test,
    };
  }
  if (rejected) {
    return {
      kind: 'unprofitable',
      headline: 'No evidence of out-of-sample profitability.',
      detail: `Mean validation return across ${foldsText} was ${signedPercent(mean)}, significantly below zero: `
        + 'the strategy reliably lost money on data it was not optimised on.',
      test,
    };
  }
  return {
    kind: 'inconclusive',
    headline: 'Inconclusive: no evidence of out-of-sample profitability.',
    detail: `Mean validation return across ${foldsText} was ${signedPercent(mean)}, not significantly different from zero: `
      + 'the out-of-sample results could be chance, so any edge seen in training is unproven.',
    test,
  };
}

const KIND_STYLES: Record<VerdictKind, string> = {
  profitable: 'border-green-500/60 text-green-500',
  unprofitable: 'border-red-500/60 text-red-500',
  inconclusive: 'border-yellow-500/60 text-yellow-500',
  insufficient: 'border-gray-600 text-gray-300',
};

interface WalkForwardInterpretationProps {
  /** A walk-forward detail, local or cloud. */
  result: any;
}

/** The plain-language verdict on a walk-forward run, and how to read the rest of it. */
export function WalkForwardInterpretation({ result }: WalkForwardInterpretationProps) {
  const verdict = walkForwardVerdict(result);
  const alpha = finite(result?.alpha_level) ?? 0.05;

  return (
    <div className="mb-8">
      <div className="mb-4 text-lg font-semibold text-[#85e1fe]">What this means</div>
      <div className={`bg-[#141721] rounded-lg p-4 border-l-4 ${KIND_STYLES[verdict.kind]}`}>
        <div className="font-semibold text-base">{verdict.headline}</div>
        <div className="text-white text-sm mt-1">{verdict.detail}</div>
        {verdict.test && <div className="text-gray-400 text-xs italic mt-2">{verdict.test}</div>}
      </div>

      <details className="mt-3 bg-[#141721] rounded-lg p-4 text-sm text-gray-300">
        <summary className="cursor-pointer text-white font-medium">How to read these results</summary>
        <div className="mt-3 space-y-3">
          <p>
            A walk-forward splits the history into folds. In each fold the optimiser picks the best parameters on a
            <span className="text-white"> training</span> window, then those parameters trade the next
            <span className="text-white"> validation</span> window, which the optimiser never saw. Only the validation
            numbers say how the strategy might do on new data.
          </p>
          <p>
            <span className="text-white">Training vs validation.</span> Training results always look good, because the
            optimiser chose them. A large gap between training and validation returns is a sign of overfitting.
          </p>
          <p>
            <span className="text-white">Fold Results.</span> One row per fold. Validation returns that are positive in
            most folds are more convincing than one large winning fold. Parameters that change a lot from fold to fold
            suggest a fragile edge.
          </p>
          <p>
            <span className="text-white">z-statistic.</span> How many standard errors the mean validation return sits
            from zero. Positive means above zero, negative below; beyond roughly ±2 is unlikely to be chance.
          </p>
          <p>
            <span className="text-white">p-value.</span> The chance of a mean at least this far from zero if the
            strategy had no edge at all. Below {alpha} counts as significant.
          </p>
          <p>
            <span className="text-white">Limits.</span> With only a few folds the test is weak, and a significant result
            is evidence, not a guarantee of future returns.
          </p>
        </div>
      </details>
    </div>
  );
}
