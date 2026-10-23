#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Containment of failed benchmark examples across the passes of a CI shard. Zero dependencies, so CI
 * can invoke it before `yarn install`.
 *
 *   node shard-failures.js remaining --examples a,b,c [report.json ...]
 *   node shard-failures.js excluded --shards-dir <dir> --output <excluded.json>
 */

const fs = require('node:fs');
const path = require('node:path');

const { option: cliOption } = require('./cli-option');

const TIMING_PASS = /^(head|base)-(\d+)\.(r\d+)\.json$/;

/** Examples that timed out in any of the given report files. Missing files are ignored. An `error` does not count: only a hang costs the whole timeout each pass. */
function timedOutExamples(reportPaths) {
    const timedOut = new Set();
    for (const file of reportPaths) {
        if (!fs.existsSync(file)) {
            continue;
        }
        const report = JSON.parse(fs.readFileSync(file, 'utf8'));
        for (const [name, result] of Object.entries(report.examples ?? {})) {
            if (result.status === 'timeout') {
                timedOut.add(name);
            }
        }
    }
    return timedOut;
}

/** `examples` without those that timed out in `reportPaths`, in their original order, so a later pass skips a hang. */
function remainingExamples(examples, reportPaths) {
    const timedOut = timedOutExamples(reportPaths);
    return examples.filter((name) => !timedOut.has(name));
}

/**
 * Examples that did not succeed in every timing pass of the shard directory.
 *
 * Only timing passes (`<side>-<shard>.r<run>.json`) count; a memory pass is advisory. An example is
 * `skipped` in a pass whose report lacks it while another pass of the same shard has it, which is how
 * remainingExamples leaves a hung example out of later passes.
 */
function collectExcluded(shardsDir) {
    // No shards directory means no shard ran, so there is nothing to exclude.
    const files = fs.existsSync(shardsDir) ? fs.readdirSync(shardsDir) : [];
    const reports = files
        .map((file) => ({ file, match: TIMING_PASS.exec(file) }))
        .filter(({ match }) => match)
        .map(({ file, match: [, side, shard, pass] }) => ({
            side,
            shard,
            pass,
            examples: JSON.parse(fs.readFileSync(path.join(shardsDir, file), 'utf8')).examples ?? {},
        }));

    const excluded = new Map();
    for (const { side, shard, pass, examples } of reports) {
        for (const [example, result] of Object.entries(examples)) {
            if (result.status === 'success') {
                continue;
            }
            const entry = excluded.get(example) ?? { example, shard, failed: [], skipped: [] };
            entry.failed.push({ side, pass, status: result.status, error: firstLine(result.error) });
            excluded.set(example, entry);
        }
    }

    for (const entry of excluded.values()) {
        for (const { side, shard, pass, examples } of reports) {
            if (shard === entry.shard && !(entry.example in examples)) {
                entry.skipped.push({ side, pass });
            }
        }
    }
    return [...excluded.values()].sort((a, b) => (a.example < b.example ? -1 : 1));
}

function firstLine(text) {
    return typeof text === 'string' ? text.split('\n')[0] : undefined;
}

/** One line per excluded example, e.g. `data-selection-zoom-bar: head r1 timeout; skipped: base r1, head r2`. */
function formatExcluded(excluded) {
    return excluded.map(({ example, failed, skipped }) => {
        const failures = failed.map(({ side, pass, status }) => `${side} ${pass} ${status}`).join(', ');
        const skips = skipped.map(({ side, pass }) => `${side} ${pass}`).join(', ');
        return `${example}: ${failures}${skips ? `; skipped: ${skips}` : ''}`;
    });
}

module.exports = { timedOutExamples, remainingExamples, collectExcluded, formatExcluded };

if (require.main === module) {
    const { argv } = process;
    const [command] = argv.slice(2);
    const option = (name) => cliOption(argv, name);

    if (command === 'remaining') {
        const examples = (option('--examples') ?? '').split(/[\s,]+/).filter(Boolean);
        const reports = argv.slice(2).filter((arg, i, all) => arg.endsWith('.json') && all[i - 1] !== '--examples');
        console.log(remainingExamples(examples, reports).join(','));
    } else if (command === 'excluded' && option('--shards-dir') && option('--output')) {
        const excluded = collectExcluded(option('--shards-dir'));
        fs.writeFileSync(option('--output'), JSON.stringify(excluded, null, 2) + '\n');
        formatExcluded(excluded).forEach((line) => console.log(line));
    } else {
        console.error(
            'Usage: shard-failures.js remaining --examples <names> [report.json ...]\n' +
                '       shard-failures.js excluded --shards-dir <dir> --output <excluded.json>'
        );
        process.exit(1);
    }
}
