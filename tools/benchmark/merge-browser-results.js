#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Merge multiple browser benchmark JSON reports (one per CI shard) into a
 * single report consumable by compare-browser-results.js.
 *
 * Each shard runs a disjoint subset of examples, so merging is a union of the
 * `examples` maps with the `summary` recomputed.
 *
 * Usage:
 *   node merge-browser-results.js --output merged.json shard1.json shard2.json ...
 */

const fs = require('fs');
const path = require('path');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
    .option('output', {
        type: 'string',
        demandOption: true,
        describe: 'Path to write the merged JSON report',
    })
    .demandCommand(1, 'At least one input report is required')
    .help()
    .parse();

const inputPaths = argv._.map(String);
const reports = inputPaths.map((p) => JSON.parse(fs.readFileSync(p, 'utf8')));

const merged = {
    timestamp: reports[0].timestamp,
    environment: reports[0].environment,
    summary: { total: 0, success: 0, error: 0, timeout: 0, totalDurationMs: 0 },
    examples: {},
};

for (const [i, report] of reports.entries()) {
    for (const [name, result] of Object.entries(report.examples ?? {})) {
        if (merged.examples[name]) {
            console.error(`Duplicate example "${name}" in ${inputPaths[i]} — shards must run disjoint example sets`);
            process.exit(1);
        }
        merged.examples[name] = result;
        merged.summary.total++;
        merged.summary[result.status] = (merged.summary[result.status] ?? 0) + 1;
        merged.summary.totalDurationMs += result.durationMs ?? 0;
    }
}

fs.mkdirSync(path.dirname(path.resolve(argv.output)), { recursive: true });
fs.writeFileSync(argv.output, JSON.stringify(merged, null, 2) + '\n');
console.log(`Merged ${inputPaths.length} report(s), ${merged.summary.total} example(s) -> ${argv.output}`);
