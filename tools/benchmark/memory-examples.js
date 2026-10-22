#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Which of a shard's examples get the heap-sampling memory pass. Zero dependencies, so CI can invoke
 * it before `yarn install`.
 *
 *   node memory-examples.js --event <github event> --candidates a,b,c [--requested x,y]
 *
 * `high-perf-*` always gets the pass. The zoom family is costly to set up, so it gets the pass on the
 * scheduled, release-branch and manual runs, and on a `/benchmarks` PR comment (`issue_comment`) only
 * when the comment names it. `--requested` is the comment's example list; a bare `/benchmarks` has none.
 */

const ALWAYS = /^high-perf-/;
const UNLESS_BARE_COMMENT = /^data-selection-zoom-/;

/** Split a comma and/or whitespace separated list of example names (as benchmark-examples.js parseExamplesArg). */
const parseNames = (value = '') => value.split(/[\s,]+/).filter(Boolean);

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
    const option = (name) => {
        const index = argv.indexOf(name);
        return index === -1 ? undefined : argv[index + 1];
    };
    const event = option('--event');
    if (!event || option('--candidates') === undefined) {
        console.error('Usage: memory-examples.js --event <github event> --candidates <names> [--requested <names>]');
        process.exit(1);
    }
    const candidates = parseNames(option('--candidates'));
    const requested = parseNames(option('--requested'));
    console.log(selectMemoryExamples(candidates, { event, requested }).join(','));
}
