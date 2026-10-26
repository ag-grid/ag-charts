#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Refresh benchmark-costs.json from a nightly's shard reports.
 *
 * benchmark-examples.js balances the CI shards with these costs. They go stale as examples change, so
 * refresh them from recent `schedule` runs of the Benchmark workflow, one directory per run:
 *
 *   gh run download <run-id> --repo ag-grid/ag-charts --dir /tmp/nightly-1 -p 'bench-results-*'
 *   gh run download <run-id> --repo ag-grid/ag-charts --dir /tmp/nightly-2 -p 'bench-results-*'
 *   node tools/benchmark/update-benchmark-costs.js /tmp/nightly-1 /tmp/nightly-2 --source '<note>'
 *
 * A run's cost for an example is the sum of its durationMs over every shard report in that run's
 * directory (both sides, every timing pass and the memory pass), in seconds. An example's cost is the
 * mean of its per-run costs, so one noisy nightly doesn't skew the table. An example that errored or
 * timed out in a run is left out of that run's mean, because the durations of a failed pass don't
 * represent a healthy run. One that failed in every run keeps its previous cost, as does one the runs
 * don't cover. Examples that no longer exist are dropped.
 */

const fs = require('node:fs');
const path = require('node:path');

const { COSTS_PATH, discoverExamples } = require('./benchmark-examples');

function findReports(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return findReports(full);
        }
        return entry.name.endsWith('.json') ? [full] : [];
    });
}

/**
 * Fold one run's shard reports into per-example seconds.
 * Returns { seconds, failed } where `failed` holds the examples left out of `seconds` because a pass failed.
 */
function sumSeconds(reports) {
    const totals = new Map();
    const failed = new Set();
    for (const report of reports) {
        for (const [name, result] of Object.entries(report.examples ?? {})) {
            if (result.status !== 'success') {
                failed.add(name);
            }
            totals.set(name, (totals.get(name) ?? 0) + (result.durationMs ?? 0) / 1000);
        }
    }
    const seconds = new Map([...totals].filter(([name, total]) => !failed.has(name) && total > 0));
    return { seconds, failed };
}

/** A cost is whole seconds, never zero, which loadCosts would reject. */
const toCost = (seconds) => Math.max(1, Math.round(seconds));

/**
 * Fold one run's shard reports into per-example costs.
 * Returns { costs, failed } where `failed` lists the examples left out of `costs` because a pass failed.
 */
function sumCosts(reports) {
    return meanCosts([reports]);
}

/**
 * Fold several runs (each an array of shard reports) into per-example costs: the mean of the per-run
 * sums. An example that failed in a run is left out of that run's mean, and out of `costs` when it
 * failed in every run it appeared in. `failed` lists the examples that failed in at least one run.
 */
function meanCosts(runs) {
    const perRun = runs.map(sumSeconds);
    const failed = new Set(perRun.flatMap((run) => [...run.failed]));
    const samples = new Map();
    for (const { seconds } of perRun) {
        for (const [name, total] of seconds) {
            samples.set(name, [...(samples.get(name) ?? []), total]);
        }
    }
    const costs = {};
    for (const [name, totals] of samples) {
        costs[name] = toCost(totals.reduce((sum, total) => sum + total, 0) / totals.length);
    }
    return { costs, failed: [...failed].sort() };
}

/** Merge fresh costs over the previous table, keeping only examples that still exist. */
function mergeCosts(previous, fresh, available) {
    const merged = {};
    for (const name of available) {
        const cost = fresh[name] ?? previous[name];
        if (cost !== undefined) {
            merged[name] = cost;
        }
    }
    return merged;
}

module.exports = { sumCosts, meanCosts, mergeCosts };

if (require.main === module) {
    const { argv } = process;
    const sourceIndex = argv.indexOf('--source');
    const dirs = argv
        .slice(2)
        .filter((_, i) => sourceIndex === -1 || (i + 2 !== sourceIndex && i + 2 !== sourceIndex + 1));
    if (dirs.length === 0 || (sourceIndex !== -1 && argv[sourceIndex + 1] === undefined)) {
        console.error('Usage: update-benchmark-costs.js <directory of shard reports>... [--source <note>]');
        process.exit(1);
    }
    const runs = dirs.map((dir) => {
        const reports = findReports(path.resolve(dir)).map((file) => JSON.parse(fs.readFileSync(file, 'utf8')));
        if (reports.length === 0) {
            console.error(`No JSON reports found under ${dir}`);
            process.exit(1);
        }
        return reports;
    });

    const previous = JSON.parse(fs.readFileSync(COSTS_PATH, 'utf8'));
    const { costs: fresh, failed } = meanCosts(runs);
    const available = discoverExamples();
    const costs = mergeCosts(previous.costs ?? {}, fresh, available);

    const uncovered = available.filter((name) => fresh[name] === undefined);
    if (failed.length > 0) {
        console.warn(
            `Example(s) that failed in at least one run were left out of that run's mean (previous cost kept if every run failed): ${failed.join(', ')}`
        );
    }
    const stillMissing = uncovered.filter((name) => costs[name] === undefined);
    if (stillMissing.length > 0) {
        console.warn(
            `No cost for ${stillMissing.join(', ')}; sharding will use the median until a nightly covers them`
        );
    }

    const source = sourceIndex !== -1 ? argv[sourceIndex + 1] : previous.source;
    const sorted = Object.fromEntries(Object.entries(costs).sort(([a], [b]) => (a < b ? -1 : 1)));
    fs.writeFileSync(COSTS_PATH, JSON.stringify({ ...previous, source, costs: sorted }, null, 4) + '\n');
    console.log(`Wrote ${Object.keys(sorted).length} cost(s) to ${COSTS_PATH}`);
}
