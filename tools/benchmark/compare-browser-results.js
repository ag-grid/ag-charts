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
        demandOption: true,
        describe: 'Path to the base (baseline) browser benchmark JSON report',
    })
    .option('compare', {
        type: 'string',
        demandOption: true,
        describe: 'Path to the compare (head) browser benchmark JSON report',
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

// --- Extract results from report ---

function extractResults(report) {
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
                averageTime: result.averageTime,
                minTime: result.minTime,
                maxTime: result.maxTime,
                sampleCount: result.sampleCount,
                displayName: displayName(exampleName, result),
            });
        }
    }

    return { results, errors };
}

// --- Compare ---

const baseReport = loadReport(argv.base);
const compareReport = loadReport(argv.compare);

const base = extractResults(baseReport);
const compare = extractResults(compareReport);

const baseKeys = new Set(base.results.keys());
const compareKeys = new Set(compare.results.keys());

// Matched results
const matched = [];
for (const key of baseKeys) {
    if (compareKeys.has(key)) {
        const b = base.results.get(key);
        const c = compare.results.get(key);
        const pctTimeChange =
            b.averageTime === 0 ? null : Math.round(((c.averageTime - b.averageTime) / b.averageTime) * 1000) / 10;

        matched.push({
            test: b.displayName,
            pctTimeChange,
            beforeMs: timeFormat(b.averageTime),
            afterMs: timeFormat(c.averageTime),
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

// Notable regressions (>10%)
const notable = rankedByTime.filter((r) => r.pctTimeChange !== null && r.pctTimeChange > 10);

// --- Output ---

const baseLabel = argv['base-label'];
const compareLabel = argv['compare-label'];

if (argv.format === 'table') {
    console.log(`Comparing ${baseLabel} (baseline) vs. ${compareLabel}`);

    if (notable.length > 0) {
        if (!argv['report-only']) {
            process.exitCode = 1;
        }
        console.log('\nNotable Regressions (>10%)');
        console.table(
            notable.map((r) => ({
                test: r.test,
                '%': formatPercentageChange(r.pctTimeChange),
                'Before (ms)': r.beforeMs,
                'After (ms)': r.afterMs,
            }))
        );
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
                      '%': formatPercentageChange(r.pctTimeChange),
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
                rankedByTime,
                added,
                removed,
                errors,
            },
            null,
            2
        )
    );
}
