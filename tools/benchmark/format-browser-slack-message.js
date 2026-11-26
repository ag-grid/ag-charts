#!/usr/bin/env node

/**
 * Format browser benchmark comparison results as a Slack Block Kit message.
 *
 * Reads JSON output from compare-browser-results.js and produces Slack webhook JSON.
 *
 * Usage:
 *   node format-browser-slack-message.js > slack-message.json
 *   node format-browser-slack-message.js --input ./reports/browser-benchmark.json
 *
 * Test with Slack Block Kit Builder:
 *   SLACK_CHANNEL='a' SLACK_ICON='a' SLACK_USERNAME='a' node format-browser-slack-message.js | pbcopy
 */

const fs = require('fs');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

const {
    SLACK_ATTACHMENT_TEXT_LIMIT,
    SLACK_SECTION_TEXT_LIMIT,
    countByGroup,
    fitItems,
    formatTable,
    listNames,
    requireSlackEnv,
} = require('./format-utils');

/** Entries a footer note names before it summarises the rest. */
const MAX_NAMES = 3;
const MAX_GROUPS = 5;

const argv = yargs(hideBin(process.argv))
    .option('input', {
        type: 'string',
        default: './reports/browser-benchmark.json',
        describe: 'Path to the browser benchmark comparison JSON',
    })
    .help()
    .parse();

const { channel, username, icon_url } = requireSlackEnv();

const {
    base,
    compare,
    rankedByTime,
    added = [],
    newHeadOnly = [],
    removed = [],
    errors = [],
    excluded = [],
    skippedBelowMinVersion = [],
} = JSON.parse(fs.readFileSync(argv.input, 'utf8'));

// --- Build Slack message ---

/** A section of `items` joined by `separator`, dropping items from the end to fit Slack's section text limit. */
const section = (items, separator = '\n') => ({
    type: 'section',
    text: { type: 'mrkdwn', text: fitItems(items, SLACK_SECTION_TEXT_LIMIT, { separator }) },
});

/**
 * `table` (as `formatTable` returns it) in a code block after `heading`, dropping rows from the middle to fit in
 * `limit`, so the header, the biggest improvements and the biggest regressions stay.
 */
const codeBlock = (table, limit, heading = '') =>
    fitItems(table.trimEnd().split('\n'), limit, {
        head: `${heading}\`\`\`\n`,
        tail: '\n```',
        more: (n) => `…and ${n} more rows`,
        dropFrom: 'middle',
    });

const tableSection = (heading, table) => ({
    type: 'section',
    text: { type: 'mrkdwn', text: codeBlock(table, SLACK_SECTION_TEXT_LIMIT, `${heading}\n`) },
});

const timingColumns = [
    ['pctTimeChange', 'beforeMs', 'afterMs'],
    ['%', 'Before (ms)', 'After (ms)'],
];

const timeImprovements = rankedByTime.filter((r) => r.pctTimeChange !== null && r.pctTimeChange < 0).length;
const timeRegressions = rankedByTime.filter((r) => r.pctTimeChange !== null && r.pctTimeChange > 0).length;
const notable = rankedByTime.filter((r) => r.pctTimeChange !== null && r.pctTimeChange > 10);

const blocks = [
    section([
        `*Browser benchmark results* for \`${base}\` vs \`${compare}\`.`,
        `Timing: ${timeImprovements} improved, ${timeRegressions} regressed (${rankedByTime.length} total)`,
    ]),
    { type: 'divider' },
];

// Notable regressions section
if (notable.length > 0) {
    blocks.push(tableSection('*Notable Regressions (>10%)*', formatTable(notable, ...timingColumns)), {
        type: 'divider',
    });
}

// Timings section (top 5/bottom 5)
blocks.push(tableSection('*Timings* (top 5/bottom 5)', formatTable(rankedByTime, ...timingColumns)));

// Added/removed/errors summary
const notes = [];
if (newHeadOnly.length > 0) {
    // A newly gated benchmark can add dozens of long variant names, so past a few, count them per benchmark
    const names =
        newHeadOnly.length <= MAX_NAMES
            ? newHeadOnly.map(({ test }) => test).join(', ')
            : countByGroup(
                  newHeadOnly.map(({ test, exampleName }) => exampleName ?? test.split(' / ')[0]),
                  MAX_GROUPS
              );
    notes.push(`${newHeadOnly.length} new (head only: ${names})`);
} else if (added.length > 0) {
    notes.push(`${added.length} added`);
}
if (removed.length > 0) notes.push(`${removed.length} removed`);
if (errors.length > 0) notes.push(`${errors.length} errors`);
if (excluded.length > 0)
    notes.push(
        `${excluded.length} excluded (failed or timed out: ${listNames(
            excluded.map((e) => e.split(':')[0]),
            MAX_GROUPS
        )})`
    );
if (skippedBelowMinVersion.length > 0) notes.push(`${skippedBelowMinVersion.length} skipped (base below min version)`);
if (notes.length > 0) {
    blocks.push({ type: 'divider' });
    blocks.push(section(notes, ' | '));
}

// Full results in collapsed attachment
const fullTimingTable = formatTable(rankedByTime, ...timingColumns, { maxWidth: 77, truncate: false });

const slackMessage = {
    channel,
    username,
    icon_url,
    blocks,
    attachments: [
        {
            color: '#36a64f',
            title: `Full Timing Results (${rankedByTime.length} benchmarks)`,
            text: codeBlock(fullTimingTable, SLACK_ATTACHMENT_TEXT_LIMIT),
            fallback: 'Full browser benchmark timing results',
            mrkdwn_in: ['text'],
            collapsed: true,
        },
    ],
};

console.log(JSON.stringify(slackMessage, null, 2));
