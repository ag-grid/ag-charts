#!/usr/bin/env node

/**
 * Compare two browser benchmark JSON reports and produce a comparison table or JSON.
 *
 * Usage:
 *   node compare-browser-results.js --base base.json --compare head.json
 *   node compare-browser-results.js --base base.json --compare head.json --format json
 */

const fs = require('fs');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

const { formatPercentageChange } = require('./format-utils');

const argv = yargs(hideBin(process.argv))
    .option('base', {
        type: 'string',
        array: true,
        demandOption: true,
        describe:
            'Path(s) to base (baseline) browser benchmark JSON report(s). Pass multiple to ' +
            'aggregate independent runs (median across runs; cross-run variance flags noisy results).',
    })
    .option('compare', {
        type: 'string',
        array: true,
        demandOption: true,
        describe: 'Path(s) to compare (head) browser benchmark JSON report(s). Multiple = independent runs.',
    })
    .option('min-pct', {
        type: 'number',
        default: 10,
        describe: 'Minimum % regression to flag as notable.',
    })
    .option('min-abs-ms', {
        type: 'number',
        default: 2,
        describe: 'Minimum absolute ms regression to flag as notable (guards micro-timing quantisation).',
    })
    .option('base-label', {
        type: 'string',
        default: 'base',
        describe: 'Display name for the base version',
    })
    .option('compare-label', {
        type: 'string',
        default: 'compare',
        describe: 'Display name for the compare version',
    })
    .option('base-version', {
        type: 'string',
        describe:
            'Semantic version of the base library (e.g. 13.3.1). Used to exclude examples whose ' +
            'minVersion is newer than the base. Falls back to the version recorded in the base report.',
    })
    .option('format', {
        type: 'string',
        choices: ['table', 'json'],
        default: 'table',
        describe: 'Output format',
    })
    .option('report-only', {
        type: 'boolean',
        default: false,
        describe: 'Only report results, do not exit with a failure code on regressions',
    })
    .help()
    .parse();

// --- Helpers ---

function loadReport(filePath) {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
}

/**
 * Build a unique comparison key for a benchmark result within an example.
 * Mirrors benchmarkHarness.ts resultKey() but prefixed with the example name
 * to avoid collisions across examples.
 */
function comparisonKey(exampleName, result) {
    const sortedParams = Object.entries(result.params || {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`);
    return [exampleName, result.testCase, ...sortedParams].join('|');
}

/**
 * Build a human-readable display name for a benchmark result.
 */
function displayName(exampleName, result) {
    const parts = [exampleName, result.testCase];
    const paramStr = Object.entries(result.params || {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');
    if (paramStr) parts.push(paramStr);
    return parts.join(' / ');
}

function timeFormat(timeMs) {
    if (Math.abs(timeMs) > 10) {
        return Math.floor(timeMs * 10) / 10;
    } else if (Math.abs(timeMs) > 1) {
        return Math.floor(timeMs * 100) / 100;
    } else if (Math.abs(timeMs) > 0.1) {
        return Math.floor(timeMs * 1000) / 1000;
    }
    return timeMs;
}

// --- Statistics helpers ---

function median(values) {
    if (!values?.length) return null;
    const sorted = values.toSorted((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Coefficient of variation (stddev / mean); null when not computable. */
function coefficientOfVariation(values) {
    if (!values || values.length < 2) return null;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    if (mean === 0) return null;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
    return Math.sqrt(variance) / mean;
}

// Samples noisier than this are flagged in the output — on shared CI runners,
// changes within the noise floor should not be treated as real regressions.
const NOISY_CV_THRESHOLD = 0.1;

// --- Version gating ---

/** Parse a semver string into release parts plus a prerelease flag; null when unparseable. */
function parseSemver(version) {
    if (typeof version !== 'string') return null;
    const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/.exec(version.trim());
    if (!match) return null;
    return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]), prerelease: match[4] ?? null };
}

/** Compare release parts only (prerelease ignored): negative if a < b. */
function compareRelease(a, b) {
    return a.major - b.major || a.minor - b.minor || a.patch - b.patch;
}

/**
 * Whether an example gated at `minVersion` should be excluded against `baseVersion`.
 *
 * Fails open: an unparseable base version, or a prerelease/dev build (assumed to be a
 * `latest`-equivalent reference that already carries the feature), is never excluded —
 * only a released base strictly older than minVersion is.
 */
function baseBelowMinVersion(baseVersion, minVersion) {
    const min = parseSemver(minVersion);
    if (!min) return false;
    const base = parseSemver(baseVersion);
    if (!base || base.prerelease) return false;
    return compareRelease(base, min) < 0;
}

/** First library version recorded across a report's successful examples; null if none. */
function reportVersion(report) {
    for (const example of Object.values(report?.examples || {})) {
        const version = example?.data?.version;
        if (typeof version === 'string' && version) return version;
    }
    return null;
}

/** Map of exampleName -> declared minVersion, gathered from example metadata. */
function collectMinVersions(report) {
    const minVersions = new Map();
    for (const [exampleName, example] of Object.entries(report?.examples || {})) {
        const minVersion = example?.data?.metadata?.minVersion;
        if (typeof minVersion === 'string' && minVersion) minVersions.set(exampleName, minVersion);
    }
    return minVersions;
}

// --- Extract results from report(s) ---

/** Per-run extraction: one report -> Map(key -> single-run metrics). */
function extractRun(report) {
    const results = new Map();
    const errors = [];

    for (const [exampleName, example] of Object.entries(report.examples || {})) {
        if (example.status !== 'success' || !example.data?.results) {
            errors.push({ example: exampleName, status: example.status, error: example.error });
            continue;
        }

        for (const result of example.data.results) {
            const key = comparisonKey(exampleName, result);
            results.set(key, {
                exampleName,
                testCase: result.testCase,
                params: result.params || {},
                medianTime: median(result.timings) ?? result.averageTime,
                intraRunCv: coefficientOfVariation(result.timings),
                minTime: result.minTime,
                sampleCount: result.sampleCount,
                displayName: displayName(exampleName, result),
            });
        }
    }

    return { results, errors };
}

/**
 * Aggregate N independent runs into one metrics map per key.
 *
 * The representative time is the median of each run's median, which is robust to a single
 * slow run. Cross-run CV (variance of the per-run medians) captures run-to-run noise that
 * intra-run sample CV cannot — separate page loads drift even when a single session is stable.
 */
function extractResults(reports) {
    const perRun = reports.map(extractRun);
    const errors = perRun.flatMap((r) => r.errors);

    const keys = new Set();
    for (const { results } of perRun) for (const k of results.keys()) keys.add(k);

    const merged = new Map();
    for (const key of keys) {
        const runs = perRun.map(({ results }) => results.get(key)).filter(Boolean);
        if (runs.length === 0) continue;
        const runMedians = runs.map((r) => r.medianTime);
        const intraRunCvMax = Math.max(0, ...runs.map((r) => r.intraRunCv ?? 0));
        const crossRunCv = coefficientOfVariation(runMedians); // null for a single run
        const first = runs[0];
        // Noise measure: with multiple runs the median already absorbs intra-run sample jitter
        // (structurally high for micro-benchmarks), so run-to-run (cross-run) CV is what matters.
        // Fall back to intra-run CV only for single-run inputs.
        merged.set(key, {
            exampleName: first.exampleName,
            displayName: first.displayName,
            medianTime: median(runMedians),
            minTime: Math.min(...runs.map((r) => r.minTime ?? Infinity)),
            sampleCount: first.sampleCount,
            runCount: runs.length,
            crossRunCv,
            cv: crossRunCv ?? intraRunCvMax,
        });
    }

    return { results: merged, errors };
}

// --- Compare ---

const baseReports = argv.base.map(loadReport);
const compareReports = argv.compare.map(loadReport);

const base = extractResults(baseReports);
const compare = extractResults(compareReports);

const runCount = Math.min(baseReports.length, compareReports.length);

const baseKeys = new Set(base.results.keys());
const compareKeys = new Set(compare.results.keys());

// Effective base version: explicit flag wins, else the version recorded in the report
// (the published library version in npm-base mode, or the ref's version in git-base mode).
const baseVersion = argv['base-version'] || reportVersion(baseReports[0]);

// minVersion is declared on the head examples; only keys present in both reports are
// gated, so the compare report is always authoritative.
const minVersions = collectMinVersions(compareReports[0]);

// Matched results
const matched = [];
const skippedBelowMinVersion = [];
for (const key of baseKeys) {
    if (compareKeys.has(key)) {
        const b = base.results.get(key);
        const c = compare.results.get(key);
        const minVersion = minVersions.get(b.exampleName);
        if (minVersion && baseBelowMinVersion(baseVersion, minVersion)) {
            skippedBelowMinVersion.push({ test: b.displayName, minVersion, baseVersion: baseVersion ?? null });
            continue;
        }
        // Median is robust to outlier iterations (GC pauses, CI noise spikes);
        // it falls back to the average when raw timings are unavailable.
        const pctTimeChange =
            b.medianTime === 0 ? null : Math.round(((c.medianTime - b.medianTime) / b.medianTime) * 1000) / 10;
        const noisy = (b.cv ?? 0) > NOISY_CV_THRESHOLD || (c.cv ?? 0) > NOISY_CV_THRESHOLD;
        // Run-to-run noise band: the worse side's cross-run CV, as a percentage. A change must
        // clear NOISE_BAND_FACTOR x this to be signal rather than measurement drift.
        const crossRunCvPct = Math.max(b.crossRunCv ?? 0, c.crossRunCv ?? 0) * 100;

        matched.push({
            test: b.displayName,
            pctTimeChange,
            absDeltaMs: c.medianTime - b.medianTime,
            noisy,
            crossRunCvPct: crossRunCvPct || null,
            runCount: Math.min(b.runCount ?? 1, c.runCount ?? 1),
            beforeMs: timeFormat(b.medianTime),
            afterMs: timeFormat(c.medianTime),
            beforeMinMs: timeFormat(b.minTime),
            afterMinMs: timeFormat(c.minTime),
            beforeSamples: b.sampleCount,
            afterSamples: c.sampleCount,
        });
    }
}

// Added (in compare but not in base)
const added = [];
for (const key of compareKeys) {
    if (!baseKeys.has(key)) {
        added.push(compare.results.get(key).displayName);
    }
}

// Removed (in base but not in compare)
const removed = [];
for (const key of baseKeys) {
    if (!compareKeys.has(key)) {
        removed.push(base.results.get(key).displayName);
    }
}

// Combine errors from both reports
const errors = [];
for (const err of base.errors) {
    errors.push(`${err.example}: ${err.status} (base)${err.error ? ' - ' + err.error.split('\n')[0] : ''}`);
}
for (const err of compare.errors) {
    errors.push(`${err.example}: ${err.status} (compare)${err.error ? ' - ' + err.error.split('\n')[0] : ''}`);
}

// Rank by time change
const rankedByTime = matched.toSorted((a, b) => (a.pctTimeChange ?? -Infinity) - (b.pctTimeChange ?? -Infinity));

// Notable regressions must clear every noise filter:
//  - relative floor (default >10%): a meaningful proportional slowdown;
//  - absolute floor (default >=2ms): guards against timer quantisation on micro-timings;
//  - not noisy: intra- or cross-run CV within the acceptable band;
//  - above the run-to-run noise band: when multiple runs were aggregated, the change must
//    exceed NOISE_BAND_FACTOR x the measured cross-run CV, so drift never reads as a regression.
const MIN_PCT = argv['min-pct'];
const MIN_ABS_MS = argv['min-abs-ms'];
const NOISE_BAND_FACTOR = 2;
function isNotableRegression(r) {
    if (r.pctTimeChange === null || r.pctTimeChange <= MIN_PCT) return false;
    if (r.absDeltaMs < MIN_ABS_MS) return false;
    if (r.noisy) return false;
    if (r.crossRunCvPct != null && r.pctTimeChange <= NOISE_BAND_FACTOR * r.crossRunCvPct) return false;
    return true;
}
const notable = rankedByTime.filter(isNotableRegression);

// --- Output ---

const baseLabel = argv['base-label'];
const compareLabel = argv['compare-label'];

if (argv.format === 'table') {
    console.log(`Comparing ${baseLabel} (baseline) vs. ${compareLabel}`);
    if (runCount > 1) {
        console.log(`Aggregated across ${runCount} runs per side (median of run medians; cross-run CV gates noise).`);
    }

    if (notable.length > 0) {
        if (!argv['report-only']) {
            process.exitCode = 1;
        }
        console.log(`\nNotable Regressions (>${MIN_PCT}%, >=${MIN_ABS_MS}ms, denoised)`);
        console.table(
            notable.map((r) => ({
                test: r.test,
                '%': formatPercentageChange(r.pctTimeChange) + (r.noisy ? ' ~' : ''),
                'Before (ms)': r.beforeMs,
                'After (ms)': r.afterMs,
            }))
        );
        if (notable.some((r) => r.noisy)) {
            console.log('~ high sample variance (CV > 10%) — treat with caution');
        }
    }

    const rankedOutput =
        rankedByTime.length > 10 ? [...rankedByTime.slice(0, 5), {}, ...rankedByTime.slice(-5)] : rankedByTime;
    console.log('Time (top 5/bottom 5)');
    console.table(
        rankedOutput.map((r) =>
            Object.keys(r).length === 0
                ? {}
                : {
                      test: r.test,
                      '%': formatPercentageChange(r.pctTimeChange) + (r.noisy ? ' ~' : ''),
                      'Before (ms)': r.beforeMs,
                      'After (ms)': r.afterMs,
                  }
        )
    );

    if (added.length > 0) {
        console.log(`\nAdded (${added.length}):`);
        added.forEach((name) => console.log(`  + ${name}`));
    }
    if (removed.length > 0) {
        console.log(`\nRemoved (${removed.length}):`);
        removed.forEach((name) => console.log(`  - ${name}`));
    }
    if (errors.length > 0) {
        console.log(`\nErrors (${errors.length}):`);
        errors.forEach((err) => console.log(`  ! ${err}`));
    }
    if (skippedBelowMinVersion.length > 0) {
        console.log(`\nSkipped — base below min version (${skippedBelowMinVersion.length}):`);
        skippedBelowMinVersion.forEach((s) =>
            console.log(`  ⤬ ${s.test} (needs ≥ ${s.minVersion}, base is ${s.baseVersion ?? 'unknown'})`)
        );
    }

    // Summary line
    const improvements = rankedByTime.filter((r) => r.pctTimeChange !== null && r.pctTimeChange < 0).length;
    const regressions = rankedByTime.filter((r) => r.pctTimeChange !== null && r.pctTimeChange > 0).length;
    console.log(`\nSummary: ${improvements} improved, ${regressions} regressed, ${matched.length} total`);
} else if (argv.format === 'json') {
    console.log(
        JSON.stringify(
            {
                base: baseLabel,
                compare: compareLabel,
                runCount,
                thresholds: { minPct: MIN_PCT, minAbsMs: MIN_ABS_MS, noiseBandFactor: NOISE_BAND_FACTOR },
                notable: notable.map((r) => r.test),
                rankedByTime,
                added,
                removed,
                errors,
                skippedBelowMinVersion,
            },
            null,
            2
        )
    );
}
