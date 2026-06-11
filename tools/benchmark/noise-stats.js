#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * TEMPORARY — noise-validation spike analysis (AG-16452).
 *
 * Analyses repeated browser-benchmark runs of the SAME commit on the same
 * machine to quantify CI runner noise. For each test-case variant it reports:
 *   - within-run CV: coefficient of variation of the raw iteration timings
 *   - across-run spread: CV and max pairwise % delta of per-run medians,
 *     i.e. the A/A comparison error a head-vs-base run would observe.
 *
 * Usage:
 *   node noise-stats.js run1.json run2.json run3.json ...
 *
 * Acceptance gates on the MEAN pairwise |delta| per test case (the expected
 * error of a single head-vs-base comparison), restricted to test cases with a
 * median >= 10ms — sub-10ms timings are dominated by timer quantisation and
 * are not meaningful regression signals in relative terms.
 *
 * Exit code 1 if acceptance criteria are breached:
 *   - median of per-case mean A/A |delta| < 3%
 *   - p95 of per-case mean A/A |delta| < 8%
 */

const fs = require('fs');

const inputPaths = process.argv.slice(2);
if (inputPaths.length < 2) {
    console.error('Usage: noise-stats.js <run1.json> <run2.json> [...]');
    process.exit(2);
}

function median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function cv(values) {
    if (values.length < 2) return null;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    if (mean === 0) return null;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
    return Math.sqrt(variance) / mean;
}

function resultKey(exampleName, result) {
    const sortedParams = Object.entries(result.params || {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`);
    return [exampleName, result.testCase, ...sortedParams].join('|');
}

// key -> per-run stats
const byKey = new Map();

for (const [runIdx, p] of inputPaths.entries()) {
    const report = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const [exampleName, example] of Object.entries(report.examples ?? {})) {
        if (example.status !== 'success' || !example.data?.results) continue;
        for (const result of example.data.results) {
            const key = resultKey(exampleName, result);
            if (!byKey.has(key)) byKey.set(key, []);
            byKey.get(key).push({
                runIdx,
                median: median(result.timings ?? [result.averageTime]),
                withinCv: cv(result.timings ?? []),
            });
        }
    }
}

// Test cases faster than this are excluded from acceptance gating: relative
// deltas on sub-10ms timings reflect timer quantisation, not runner noise.
const MIN_GATED_MEDIAN_MS = 10;

const rows = [];
const acrossRunDeltas = [];

for (const [key, runs] of byKey) {
    if (runs.length < 2) continue;
    const medians = runs.map((r) => r.median);
    const acrossCv = cv(medians);
    const caseMedian = median(medians);

    // Mean pairwise % |delta| between runs' medians — the expected error of a
    // single A/B comparison on this runner class.
    const pairDeltas = [];
    for (let i = 0; i < medians.length; i++) {
        for (let j = i + 1; j < medians.length; j++) {
            const lo = Math.min(medians[i], medians[j]);
            if (lo === 0) continue;
            pairDeltas.push((Math.abs(medians[i] - medians[j]) / lo) * 100);
        }
    }
    const meanDeltaPct = pairDeltas.length ? pairDeltas.reduce((s, v) => s + v, 0) / pairDeltas.length : null;
    const maxDeltaPct = pairDeltas.length ? Math.max(...pairDeltas) : null;

    const gated = caseMedian >= MIN_GATED_MEDIAN_MS;
    if (gated && meanDeltaPct !== null) acrossRunDeltas.push(meanDeltaPct);

    const withinCvs = runs.map((r) => r.withinCv).filter((v) => v !== null);
    rows.push({
        test: key,
        runs: runs.length,
        'median (ms)': Math.round(caseMedian * 100) / 100,
        'within-run CV %': withinCvs.length ? Math.round(Math.max(...withinCvs) * 1000) / 10 : null,
        'across-run CV %': acrossCv === null ? null : Math.round(acrossCv * 1000) / 10,
        'mean A/A delta %': meanDeltaPct === null ? null : Math.round(meanDeltaPct * 10) / 10,
        'max A/A delta %': maxDeltaPct === null ? null : Math.round(maxDeltaPct * 10) / 10,
        gated,
    });
}

rows.sort((a, b) => (b['mean A/A delta %'] ?? 0) - (a['mean A/A delta %'] ?? 0));
console.table(rows);

if (acrossRunDeltas.length === 0) {
    console.error('No comparable results found across runs');
    process.exit(2);
}

const sortedDeltas = [...acrossRunDeltas].sort((a, b) => a - b);
const medianDelta = median(sortedDeltas);
const p95Delta = sortedDeltas[Math.min(sortedDeltas.length - 1, Math.floor(sortedDeltas.length * 0.95))];

console.log(
    `\nMean A/A deltas over ${sortedDeltas.length} gated test cases (median >= ${MIN_GATED_MEDIAN_MS}ms; ${inputPaths.length} runs):`
);
console.log(`  median: ${medianDelta.toFixed(1)}%  (acceptance: < 3%)`);
console.log(`  p95:    ${p95Delta.toFixed(1)}%  (acceptance: < 8%)`);

const pass = medianDelta < 3 && p95Delta < 8;
console.log(`\nAcceptance criteria: ${pass ? 'PASS' : 'FAIL'}`);
process.exit(pass ? 0 : 1);
