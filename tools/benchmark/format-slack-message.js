#!/usr/bin/env node

const fs = require('fs');

const { formatPercentageChange, formatTable, requireSlackEnv } = require('./format-utils');

const logFile = './reports/benchmark.json';
const {
    base,
    compare,
    expectationBreaches = [],
    critical,
    rankedByTime,
    rankedByMemory,
} = JSON.parse(fs.readFileSync(logFile, 'utf8').toString());

const { channel, username, icon_url } = requireSlackEnv();

// Count improvements and regressions
const timeImprovements = rankedByTime.filter((r) => r.pctTimeChange < 0).length;
const timeRegressions = rankedByTime.filter((r) => r.pctTimeChange > 0).length;
const memoryImprovements = rankedByMemory.filter((r) => r.pctMemoryChange !== null && r.pctMemoryChange < 0).length;
const memoryRegressions = rankedByMemory.filter((r) => r.pctMemoryChange !== null && r.pctMemoryChange > 0).length;

const blocks = [
    {
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: `Benchmark results for \`${base}\` vs \`${compare}\`.\nTiming: ${timeImprovements} improved, ${timeRegressions} regressed | Memory: ${memoryImprovements} improved, ${memoryRegressions} regressed`,
        },
    },
    { type: 'divider' },
];

// Add expectation breaches section if any exist
if (expectationBreaches.length > 0) {
    const breachData = expectationBreaches.map((breach) => ({
        test: breach.testName,
        type: breach.type === 'memory' ? 'Memory' : 'Canvas',
        expected: breach.type === 'memory' ? breach.expected.toFixed(1) + ' MB' : breach.expected,
        actual: breach.type === 'memory' ? breach.actual.toFixed(1) + ' MB' : breach.actual,
        exceeded:
            breach.type === 'memory'
                ? `+${(breach.actual - breach.expected).toFixed(1)} MB`
                : `+${breach.actual - breach.expected}`,
    }));

    blocks.push(
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*⚠️  Expectation Breaches*\n\`\`\`\n${formatTable(breachData, ['type', 'expected', 'actual', 'exceeded'], ['Type', 'Expected', 'Actual', 'Exceeded'])}\`\`\``,
            },
        },
        { type: 'divider' }
    );
}

if (critical.length > 0) {
    blocks.push(
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*Critical Cases* (regressions)\n\`\`\`\n${formatTable(critical, ['beforeMs', 'afterMs', 'beforeMB', 'afterMB'], ['Before (ms)', 'After (ms)', 'Before (MB)', 'After (MB)'])}\`\`\``,
            },
        },
        { type: 'divider' }
    );
}

blocks.push(
    {
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: `*Timings* (top 5/bottom 5)\n\`\`\`\n${formatTable(rankedByTime, ['pctTimeChange', 'beforeMs', 'afterMs'], ['%', 'Before (ms)', 'After (ms)'])}\`\`\``,
        },
    },
    { type: 'divider' },
    {
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: `*Memory* (top 5/bottom 5)\n\`\`\`\n${formatTable(rankedByMemory, ['pctMemoryChange', 'beforeMB', 'afterMB'], ['%', 'Before (MB)', 'After (MB)'])}\`\`\``,
        },
    }
);

// See https://api.slack.com/methods/chat.postMessage
//
// Testable with: https://app.slack.com/block-kit-builder/
// ```bash
// SLACK_CHANNEL='a' SLACK_ICON='a' SLACK_USERNAME='a' ./tools/benchmark/format-slack-message.js | pbcopy
// ```
const fullTimingTable = formatTable(
    rankedByTime,
    ['pctTimeChange', 'beforeMs', 'afterMs'],
    ['%', 'Before (ms)', 'After (ms)'],
    { maxWidth: 77, truncate: false }
);
const fullMemoryTable = formatTable(
    rankedByMemory,
    ['pctMemoryChange', 'beforeMB', 'afterMB'],
    ['%', 'Before (MB)', 'After (MB)'],
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
            fallback: 'Full timing benchmark results',
            mrkdwn_in: ['text'],
            collapsed: true,
        },
        {
            color: '#2196F3',
            title: `Full Memory Results (${rankedByMemory.length} benchmarks)`,
            text: `\`\`\`\n${fullMemoryTable}\`\`\``,
            fallback: 'Full memory benchmark results',
            mrkdwn_in: ['text'],
            collapsed: true,
        },
    ],
};

console.log(JSON.stringify(slackMessage, null, 2));
