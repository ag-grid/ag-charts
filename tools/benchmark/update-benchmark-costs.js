#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Refresh benchmark-costs.json from a nightly's shard reports.
 *
 * benchmark-examples.js balances the CI shards with these costs. They go stale as examples change, so
 * refresh them from a recent `schedule` run of the Benchmark workflow:
 *
 *   gh run download <run-id> --repo ag-grid/ag-charts --dir /tmp/nightly -p 'bench-results-*'
 *   node tools/benchmark/update-benchmark-costs.js /tmp/nightly
 *
 * An example's cost is the sum of its durationMs over every shard report in the directory (both sides,
 * every timing pass and the memory pass), in seconds. An example that errored or timed out in any
 * report keeps its previous cost, because the durations of a failed pass don't represent a healthy run;
 * so does an example the reports don't cover. Examples that no longer exist are dropped.
 */

const fs = require('node:fs');
const path = require('node:path');

const { discoverExamples } = require('./benchmark-examples');

const COSTS_PATH = path.resolve(__dirname, 'benchmark-costs.json');

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
 * Fold shard reports into per-example costs.
 * Returns { costs, failed } where `failed` lists the examples left out of `costs` because a pass failed.
 */
function sumCosts(reports) {
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
    const costs = {};
    for (const [name, seconds] of totals) {
        if (!failed.has(name) && seconds > 0) {
            costs[name] = Math.round(seconds);
        }
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

module.exports = { sumCosts, mergeCosts };

if (require.main === module) {
    const dir = process.argv[2];
    if (!dir) {
        console.error('Usage: update-benchmark-costs.js <directory of shard reports> [--source <note>]');
        process.exit(1);
    }
    const sourceIndex = process.argv.indexOf('--source');
    const reports = findReports(path.resolve(dir)).map((file) => JSON.parse(fs.readFileSync(file, 'utf8')));
    if (reports.length === 0) {
        console.error(`No JSON reports found under ${dir}`);
        process.exit(1);
    }

    const previous = JSON.parse(fs.readFileSync(COSTS_PATH, 'utf8'));
    const { costs: fresh, failed } = sumCosts(reports);
    const available = discoverExamples();
    const costs = mergeCosts(previous.costs ?? {}, fresh, available);

    const uncovered = available.filter((name) => fresh[name] === undefined);
    if (failed.length > 0) {
        console.warn(`Kept previous cost for example(s) that failed in the reports: ${failed.join(', ')}`);
    }
    const stillMissing = uncovered.filter((name) => costs[name] === undefined);
    if (stillMissing.length > 0) {
        console.warn(
            `No cost for ${stillMissing.join(', ')}; sharding will use the median until a nightly covers them`
        );
    }

    const source = sourceIndex !== -1 ? process.argv[sourceIndex + 1] : previous.source;
    const sorted = Object.fromEntries(Object.entries(costs).sort(([a], [b]) => (a < b ? -1 : 1)));
    fs.writeFileSync(COSTS_PATH, JSON.stringify({ ...previous, source, costs: sorted }, null, 4) + '\n');
    console.log(`Wrote ${Object.keys(sorted).length} cost(s) to ${COSTS_PATH}`);
}
