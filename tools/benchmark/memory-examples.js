#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Which of a shard's examples get the heap-sampling memory pass.
 *
 *   node memory-examples.js --event <github event> --candidates a,b,c [--requested x,y]
 *
 * `high-perf-*` always gets the pass. The zoom family is costly to set up, so it gets the pass on the
 * scheduled, release-branch and manual runs, and on a `/benchmarks` PR comment (`issue_comment`) only
 * when the comment names it. `--requested` is the comment's example list; a bare `/benchmarks` has none.
 */

const { parseExamplesArg } = require('./benchmark-examples');
const { option: cliOption } = require('./cli-option');

const ALWAYS = /^high-perf-/;
const UNLESS_BARE_COMMENT = /^data-selection-zoom-/;

/** `candidates` that get the memory pass, in their original order. */
function selectMemoryExamples(candidates, { event, requested = [] }) {
    const named = new Set(requested);
    return candidates.filter(
        (name) =>
            ALWAYS.test(name) || (UNLESS_BARE_COMMENT.test(name) && (event !== 'issue_comment' || named.has(name)))
    );
}

module.exports = { selectMemoryExamples };

if (require.main === module) {
    const { argv } = process;
    const option = (name) => cliOption(argv, name);
    const event = option('--event');
    if (!event || option('--candidates') === undefined) {
        console.error('Usage: memory-examples.js --event <github event> --candidates <names> [--requested <names>]');
        process.exit(1);
    }
    const candidates = parseExamplesArg(option('--candidates'));
    const requested = parseExamplesArg(option('--requested'));
    console.log(selectMemoryExamples(candidates, { event, requested }).join(','));
}
