#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const logFile = './reports/benchmark.json';
const {
    base,
    compare,
    expectationBreaches = [],
    critical,
    rankedByTime,
    rankedByMemory,
} = JSON.parse(fs.readFileSync(logFile, 'utf8').toString());

let channel = process.env.SLACK_CHANNEL;
let username = process.env.SLACK_USERNAME;
let icon_url = process.env.SLACK_ICON;

if (!channel) throw new Error('SLACK_CHANNEL is not set');
if (!username) throw new Error('SLACK_USERNAME is not set');
if (!icon_url) throw new Error('SLACK_ICON is not set');

function formatSection(data, headers, headerLabels) {
    const rows = [...data.slice(0, 5)];
    if (data.length >= 10) {
        // Include gap then the last 5 rows.
        rows.push({}, ...data.slice(-5));
    } else if (data.length > 5) {
        // Include all remaining rows.
        rows.push(...data.slice(5));
    }
    const dataKeys = ['test', ...headers];
    const labels = ['Test', ...(headerLabels || dataKeys)];

    // Calculate column widths
    const maxWidth = 80;
    const padding = 2; // Space between columns
    const colWidths = labels.map((h) => h.length);
    for (const row of rows) {
        if (Object.keys(row).length > 0) {
            dataKeys.forEach((key, i) => {
                const val = String(row[key] ?? '');
                colWidths[i] = Math.max(colWidths[i], val.length);
            });
        }
    }

    // Adjust first column width to fit within max width
    const otherColsWidth = colWidths.slice(1).reduce((sum, w) => sum + w, 0);
    const spacingWidth = (labels.length - 1) * padding;
    const maxFirstColWidth = maxWidth - otherColsWidth - spacingWidth;
    colWidths[0] = Math.min(colWidths[0], maxFirstColWidth);

    // Create header row
    let table =
        labels
            .map((h, i) => {
                const text = i === 0 ? h.slice(0, colWidths[0]) : h;
                return i === 0 ? text.padEnd(colWidths[i]) : text.padStart(colWidths[i]);
            })
            .join('  ') + '\n';
    table += labels.map((_, i) => '='.repeat(colWidths[i])).join('==') + '\n';

    // Create data rows
    for (const row of rows) {
        if (Object.keys(row).length === 0) {
            table += labels.map((_, i) => '.'.repeat(colWidths[i])).join('..') + '\n';
        } else {
            table +=
                dataKeys
                    .map((key, i) => {
                        const val = String(row[key] ?? '');
                        const text =
                            i === 0 ? (val.length > colWidths[0] ? val.slice(0, colWidths[0] - 3) + '...' : val) : val;
                        return i === 0 ? text.padEnd(colWidths[i]) : text.padStart(colWidths[i]);
                    })
                    .join('  ') + '\n';
        }
    }

    return table;
}

function formatPercentageChange(pctChange) {
    if (pctChange === null || pctChange === undefined) {
        return 'N/A';
    }
    return `${pctChange > 0 ? '+' : ''}${pctChange}%`;
}

function formatFullSection(data, headers, headerLabels) {
    // Include all rows (no truncation)
    const rows = data;
    const dataKeys = ['test', ...headers];
    const labels = ['Test', ...(headerLabels || dataKeys)];

    // Calculate column widths
    // Reduced from 80 to 77 to fit within Slack attachment display width
    const maxWidth = 77;
    const padding = 2; // Space between columns
    const colWidths = labels.map((h) => h.length);
    for (const row of rows) {
        if (Object.keys(row).length > 0) {
            dataKeys.forEach((key, i) => {
                let val;
                // Format percentage changes properly
                if (key === 'pctTimeChange' || key === 'pctMemoryChange') {
                    val = formatPercentageChange(row[key]);
                } else {
                    val = String(row[key] ?? '');
                }
                colWidths[i] = Math.max(colWidths[i], val.length);
            });
        }
    }

    // Adjust first column width to fit within max width
    const otherColsWidth = colWidths.slice(1).reduce((sum, w) => sum + w, 0);
    const spacingWidth = (labels.length - 1) * padding;
    const maxFirstColWidth = maxWidth - otherColsWidth - spacingWidth;
    colWidths[0] = Math.min(colWidths[0], maxFirstColWidth);

    // Create header row
    let table =
        labels
            .map((h, i) => {
                const text = i === 0 ? h.slice(0, colWidths[0]) : h;
                return i === 0 ? text.padEnd(colWidths[i]) : text.padStart(colWidths[i]);
            })
            .join('  ') + '\n';
    table += labels.map((_, i) => '='.repeat(colWidths[i])).join('==') + '\n';

    // Create data rows
    for (const row of rows) {
        table +=
            dataKeys
                .map((key, i) => {
                    let val;
                    // Format percentage changes properly
                    if (key === 'pctTimeChange' || key === 'pctMemoryChange') {
                        val = formatPercentageChange(row[key]);
                    } else {
                        val = String(row[key] ?? '');
                    }
                    const text =
                        i === 0 ? (val.length > colWidths[0] ? val.slice(0, colWidths[0] - 3) + '...' : val) : val;
                    return i === 0 ? text.padEnd(colWidths[i]) : text.padStart(colWidths[i]);
                })
                .join('  ') + '\n';
    }

    return table;
}

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
                text: `*⚠️  Expectation Breaches*\n\`\`\`\n${formatSection(breachData, ['type', 'expected', 'actual', 'exceeded'], ['Type', 'Expected', 'Actual', 'Exceeded'])}\`\`\``,
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
                text: `*Critical Cases* (regressions)\n\`\`\`\n${formatSection(critical, ['beforeMs', 'afterMs', 'beforeMB', 'afterMB'], ['Before (ms)', 'After (ms)', 'Before (MB)', 'After (MB)'])}\`\`\``,
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
            text: `*Timings* (top 5/bottom 5)\n\`\`\`\n${formatSection(rankedByTime, ['pctTimeChange', 'beforeMs', 'afterMs'], ['%', 'Before (ms)', 'After (ms)'])}\`\`\``,
        },
    },
    { type: 'divider' },
    {
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: `*Memory* (top 5/bottom 5)\n\`\`\`\n${formatSection(rankedByMemory, ['pctMemoryChange', 'beforeMB', 'afterMB'], ['%', 'Before (MB)', 'After (MB)'])}\`\`\``,
        },
    }
);

// See https://api.slack.com/methods/chat.postMessage
//
// Testable with: https://app.slack.com/block-kit-builder/
// ```bash
// SLACK_CHANNEL='a' SLACK_ICON='a' SLACK_USERNAME='a' ./tools/benchmark/format-slack-message.js | pbcopy
// ```
const fullTimingTable = formatFullSection(
    rankedByTime,
    ['pctTimeChange', 'beforeMs', 'afterMs'],
    ['%', 'Before (ms)', 'After (ms)']
);
const fullMemoryTable = formatFullSection(
    rankedByMemory,
    ['pctMemoryChange', 'beforeMB', 'afterMB'],
    ['%', 'Before (MB)', 'After (MB)']
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
