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

const { formatTable, requireSlackEnv } = require('./format-utils');

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
    removed = [],
    errors = [],
} = JSON.parse(fs.readFileSync(argv.input, 'utf8'));

// --- Build Slack message ---

const timeImprovements = rankedByTime.filter((r) => r.pctTimeChange !== null && r.pctTimeChange < 0).length;
const timeRegressions = rankedByTime.filter((r) => r.pctTimeChange !== null && r.pctTimeChange > 0).length;
const notable = rankedByTime.filter((r) => r.pctTimeChange !== null && r.pctTimeChange > 10);

const blocks = [
    {
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: `*Browser benchmark results* for \`${base}\` vs \`${compare}\`.\nTiming: ${timeImprovements} improved, ${timeRegressions} regressed (${rankedByTime.length} total)`,
        },
    },
    { type: 'divider' },
];

// Notable regressions section
if (notable.length > 0) {
    blocks.push(
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*Notable Regressions (>10%)*\n\`\`\`\n${formatTable(notable, ['pctTimeChange', 'beforeMs', 'afterMs'], ['%', 'Before (ms)', 'After (ms)'])}\`\`\``,
            },
        },
        { type: 'divider' }
    );
}

// Timings section (top 5/bottom 5)
blocks.push({
    type: 'section',
    text: {
        type: 'mrkdwn',
        text: `*Timings* (top 5/bottom 5)\n\`\`\`\n${formatTable(rankedByTime, ['pctTimeChange', 'beforeMs', 'afterMs'], ['%', 'Before (ms)', 'After (ms)'])}\`\`\``,
    },
});

// Added/removed/errors summary
const notes = [];
if (added.length > 0) notes.push(`${added.length} added`);
if (removed.length > 0) notes.push(`${removed.length} removed`);
if (errors.length > 0) notes.push(`${errors.length} errors`);
if (notes.length > 0) {
    blocks.push({ type: 'divider' });
    blocks.push({
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: notes.join(' | '),
        },
    });
}

// Full results in collapsed attachment
const fullTimingTable = formatTable(
    rankedByTime,
    ['pctTimeChange', 'beforeMs', 'afterMs'],
    ['%', 'Before (ms)', 'After (ms)'],
    { maxWidth: 77, truncate: false }
);

const slackMessage = {
    channel,
    username,
    icon_url,
    blocks,
    attachments: [
        {
            color: '#36a64f',
            title: `Full Timing Results (${rankedByTime.length} benchmarks)`,
            text: `\`\`\`\n${fullTimingTable}\`\`\``,
            fallback: 'Full browser benchmark timing results',
            mrkdwn_in: ['text'],
            collapsed: true,
        },
    ],
};

console.log(JSON.stringify(slackMessage, null, 2));
