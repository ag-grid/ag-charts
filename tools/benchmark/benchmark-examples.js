#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Discovery and sharding of browser benchmark examples.
 *
 * Single source of truth for which benchmark examples are runnable — consumed
 * by browser-benchmark.ts and by CI to compute the shard matrix. Zero
 * dependencies so CI can invoke it before `yarn install`.
 *
 * CLI usage:
 *   node benchmark-examples.js                            # list runnable examples, one per line
 *   node benchmark-examples.js --shards 4                 # JSON array of comma-separated example lists
 *   node benchmark-examples.js --shards 4 --examples a,b  # shard only the named examples
 *   node benchmark-examples.js --shards 4 --costs c.json  # balance with a different cost table
 *
 * Shards are balanced by cost, not by name: each example's cost comes from the checked-in
 * benchmark-costs.json (see loadCosts), and shardExamples packs them longest-first onto the
 * least-loaded shard. The estimated load per shard is printed to stderr.
 *
 * The --examples value accepts names separated by commas and/or whitespace, so
 * the `/benchmarks [name...]` PR comment body can be forwarded verbatim. Unknown
 * names are rejected (see resolveExamples) so a typo fails the run loudly rather
 * than silently benchmarking the wrong subset.
 */

const fs = require('node:fs');
const path = require('node:path');

const COSTS_PATH = path.resolve(__dirname, 'benchmark-costs.json');

const EXAMPLES_DIR = path.resolve(__dirname, '../../packages/ag-charts-website/src/content/docs/benchmarks/_examples');

// Examples that don't use the standard benchmark harness
const EXCLUDED_EXAMPLES = new Set([
    'summary', // Static comparison dashboard — no getBenchmarkConfig()
    'high-freq-high-volume', // Streaming demo using animation-loop pattern — no initBenchmark()
]);

function discoverExamples() {
    const entries = fs.readdirSync(EXAMPLES_DIR, { withFileTypes: true });
    return entries
        .filter((e) => e.isDirectory() && !EXCLUDED_EXAMPLES.has(e.name))
        .map((e) => e.name)
        .sort();
}

/** Split an --examples value (or `/benchmarks` comment remainder) into example names. */
function parseExamplesArg(value = '') {
    return value.split(/[\s,]+/).filter(Boolean);
}

/**
 * Resolve a requested subset of example names against the runnable set.
 *
 * An empty request resolves to every runnable example — the default
 * `/benchmarks` behaviour. Naming a subset narrows the run to those examples,
 * preserving discovery (sorted) order. Unknown names throw, so a mistyped
 * `/benchmarks <name>` comment fails the run rather than silently producing an
 * empty or partial comparison.
 */
function resolveExamples(requested = []) {
    const available = discoverExamples();
    const names = requested.map((name) => name.trim()).filter(Boolean);
    if (names.length === 0) {
        return available;
    }
    const requestedSet = new Set(names);
    const unknown = [...requestedSet].filter((name) => !available.includes(name));
    if (unknown.length > 0) {
        throw new Error(`Unknown benchmark example(s): ${unknown.join(', ')}\nAvailable: ${available.join(', ')}`);
    }
    return available.filter((name) => requestedSet.has(name));
}

/**
 * Load the per-example cost table: seconds of runner time one example takes across a full shard job
 * (every timing pass plus the memory pass, as observed in a nightly). Only the relative sizes matter.
 * Refresh it from a nightly's `bench-results-*` artifacts with update-benchmark-costs.js.
 */
function loadCosts(costsPath = COSTS_PATH) {
    const { costs } = JSON.parse(fs.readFileSync(costsPath, 'utf8'));
    for (const [name, cost] of Object.entries(costs ?? {})) {
        if (!Number.isFinite(cost) || cost <= 0) {
            throw new Error(`Invalid cost for benchmark example "${name}" in ${costsPath}: ${cost}`);
        }
    }
    return costs ?? {};
}

function median(values) {
    if (values.length === 0) {
        return 1;
    }
    const sorted = [...values].sort((a, b) => a - b);
    const mid = sorted.length >> 1;
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Partition examples into `shardCount` shards of near-equal total cost (longest-processing-time first:
 * the costliest remaining example goes to the least-loaded shard). Round-robin over names ignored how
 * unevenly the examples cost, and reshuffled every later name whenever one was added.
 *
 * An example missing from `costs` (new, or the table is stale) costs the table's median, so a new
 * example is never free and sharding never fails for want of a cost. Ties break on name, then shard
 * index, so the same names and costs always produce the same shards.
 *
 * `requested` narrows the input set to the named examples (see resolveExamples); an empty request
 * shards every runnable example. Each shard lists its examples in discovery (sorted) order, and shards
 * left empty (fewer examples than shards) are dropped.
 */
function shardExamples(shardCount, requested = [], costs = loadCosts()) {
    return planShards(shardCount, requested, costs).map(({ examples }) => examples);
}

/** shardExamples plus each shard's estimated load, for reporting. */
function planShards(shardCount, requested = [], costs = loadCosts()) {
    const names = resolveExamples(requested);
    const fallback = median(Object.values(costs));
    const costOf = (name) => costs[name] ?? fallback;

    const shards = Array.from({ length: shardCount }, () => ({ examples: [], load: 0 }));
    const byCostDesc = [...names].sort((a, b) => costOf(b) - costOf(a) || (a < b ? -1 : a > b ? 1 : 0));
    for (const name of byCostDesc) {
        const lightest = shards.reduce((best, shard) => (shard.load < best.load ? shard : best));
        lightest.examples.push(name);
        lightest.load += costOf(name);
    }
    for (const shard of shards) {
        shard.examples.sort();
    }
    return shards.filter((shard) => shard.examples.length > 0);
}

module.exports = {
    discoverExamples,
    parseExamplesArg,
    resolveExamples,
    loadCosts,
    planShards,
    shardExamples,
    EXCLUDED_EXAMPLES,
};

if (require.main === module) {
    const { argv } = process;
    const examplesArgIndex = argv.indexOf('--examples');
    const requested = examplesArgIndex !== -1 ? parseExamplesArg(argv[examplesArgIndex + 1] ?? '') : [];

    const costsArgIndex = argv.indexOf('--costs');
    const shardsArgIndex = argv.indexOf('--shards');
    try {
        if (shardsArgIndex !== -1) {
            const shardCount = Number(argv[shardsArgIndex + 1]);
            if (!Number.isInteger(shardCount) || shardCount < 1) {
                console.error('Usage: benchmark-examples.js [--shards <count>] [--examples <names>] [--costs <file>]');
                process.exit(1);
            }
            const costs = loadCosts(costsArgIndex !== -1 ? path.resolve(argv[costsArgIndex + 1]) : COSTS_PATH);
            const plan = planShards(shardCount, requested, costs);
            plan.forEach(({ examples, load }, i) =>
                console.error(`Shard ${i}: ${examples.length} example(s), estimated ${(load / 60).toFixed(1)} min`)
            );
            console.log(JSON.stringify(plan.map(({ examples }) => examples.join(','))));
        } else {
            console.log(resolveExamples(requested).join('\n'));
        }
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}
