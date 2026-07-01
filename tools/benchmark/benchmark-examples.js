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
 *
 * The --examples value accepts names separated by commas and/or whitespace, so
 * the `/benchmarks [name...]` PR comment body can be forwarded verbatim. Unknown
 * names are rejected (see resolveExamples) so a typo fails the run loudly rather
 * than silently benchmarking the wrong subset.
 */

const fs = require('node:fs');
const path = require('node:path');

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
 * Partition examples into shards round-robin over the sorted names. Heavy
 * example families share a common prefix (high-freq-*, high-perf-*, axes-1M-*,
 * data-selection-zoom-*), so round-robin spreads each family evenly across
 * shards.
 *
 * `requested` narrows the input set to the named examples (see resolveExamples);
 * an empty request shards every runnable example.
 */
function shardExamples(shardCount, requested = []) {
    const names = resolveExamples(requested);
    const shards = Array.from({ length: shardCount }, () => []);
    names.forEach((name, i) => shards[i % shardCount].push(name));
    return shards.filter((shard) => shard.length > 0);
}

module.exports = { discoverExamples, parseExamplesArg, resolveExamples, shardExamples, EXCLUDED_EXAMPLES };

if (require.main === module) {
    const { argv } = process;
    const examplesArgIndex = argv.indexOf('--examples');
    const requested = examplesArgIndex !== -1 ? parseExamplesArg(argv[examplesArgIndex + 1] ?? '') : [];

    const shardsArgIndex = argv.indexOf('--shards');
    try {
        if (shardsArgIndex !== -1) {
            const shardCount = Number(argv[shardsArgIndex + 1]);
            if (!Number.isInteger(shardCount) || shardCount < 1) {
                console.error('Usage: benchmark-examples.js [--shards <count>] [--examples <names>]');
                process.exit(1);
            }
            console.log(JSON.stringify(shardExamples(shardCount, requested).map((shard) => shard.join(','))));
        } else {
            console.log(resolveExamples(requested).join('\n'));
        }
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}
