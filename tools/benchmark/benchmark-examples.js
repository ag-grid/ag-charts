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
 *   node benchmark-examples.js                # list runnable examples, one per line
 *   node benchmark-examples.js --shards 4     # JSON array of comma-separated example lists
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

// Examples whose runtime dwarfs the rest — each gets a dedicated shard so it
// doesn't drag a whole shard's worth of other examples onto the critical path.
const ISOLATED_EXAMPLES = ['data-selection-zoom'];

/**
 * Partition examples into shards. Isolated (heavy) examples each take a
 * dedicated shard; the rest are assigned round-robin over the sorted names.
 * Heavy example families share a common prefix (high-freq-*, high-perf-*,
 * axes-1M-*), so round-robin spreads each family evenly across shards.
 */
function shardExamples(shardCount) {
    const names = discoverExamples();
    const isolated = ISOLATED_EXAMPLES.filter((name) => names.includes(name));
    const rest = names.filter((name) => !isolated.includes(name));
    const restShardCount = Math.max(1, shardCount - isolated.length);

    const shards = isolated.map((name) => [name]);
    const restShards = Array.from({ length: restShardCount }, () => []);
    rest.forEach((name, i) => restShards[i % restShardCount].push(name));
    return [...shards, ...restShards].filter((shard) => shard.length > 0);
}

module.exports = { discoverExamples, shardExamples, EXCLUDED_EXAMPLES };

if (require.main === module) {
    const shardsArgIndex = process.argv.indexOf('--shards');
    if (shardsArgIndex !== -1) {
        const shardCount = Number(process.argv[shardsArgIndex + 1]);
        if (!Number.isInteger(shardCount) || shardCount < 1) {
            console.error('Usage: benchmark-examples.js [--shards <count>]');
            process.exit(1);
        }
        console.log(JSON.stringify(shardExamples(shardCount).map((shard) => shard.join(','))));
    } else {
        console.log(discoverExamples().join('\n'));
    }
}
