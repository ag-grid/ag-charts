#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

function currentBranchName() {
    return spawnSync('git rev-parse --abbrev-ref HEAD', { shell: true })
        .output?.map((b) => b?.toString('utf-8') ?? '')
        .join('')
        .trim();
}

const summaryExampleDataFile = 'packages/ag-charts-website/src/content/docs/benchmarks/_examples/summary/data.ts';
const argv = yargs(hideBin(process.argv))
    .option('base', {
        alias: 'b',
        type: 'string',
        default: 'latest',
        description: 'Base version to compare against.',
    })
    .option('compare', {
        alias: 'c',
        type: 'string',
        default: currentBranchName() ?? 'latest',
        description: 'Version to compare.',
    })
    .option('full', {
        alias: 'F',
        type: 'boolean',
        default: false,
        description: 'Include all tests results.',
    })
    .option('report-only', {
        type: 'boolean',
        default: false,
        description: 'Only report the results, do not exit with a failure code.',
    })
    .option('data-file', {
        alias: 'f',
        type: 'string',
        default: summaryExampleDataFile,
        description: 'data.ts file to read stats from.',
    })
    .option('format', {
        type: 'choice',
        choices: ['table', 'json'],
        default: 'table',
        description: 'Format to output the results in.',
    })
    .demandOption('base')
    .help()
    .parse();

function loadDataFile() {
    let dataFile = fs.readFileSync(argv['data-file']).toString();
    dataFile = dataFile.replace('export function', 'function');

    return eval(`${dataFile}; getData()`);
}

const dataFile = loadDataFile();
let unmodifiedDataFile = dataFile;

if (argv.base === argv.compare) {
    const { output, ...result } = spawnSync(`git`, [
        'stash',
        '-m',
        'Temp stash results',
        '--',
        'packages/ag-charts-website/src/content/docs/benchmarks/_examples/summary/data.ts',
    ]);
    if (output?.some((b) => b?.toString().indexOf('No local changes to save') >= 0)) {
        output?.filter((b) => b != null && b.length > 0).forEach((b) => console.log(`git: ${b.toString()}`));
        console.error('Comparing same version, nothing to do!');
        process.exit(1);
    }

    try {
        unmodifiedDataFile = loadDataFile();
    } finally {
        spawnSync(`git`, ['stash', 'pop']);
    }
}

const baseData = unmodifiedDataFile.find(({ name }) => name === argv.base);
const compareData = dataFile.find(({ name }) => name === argv.compare);

if (baseData == null) {
    console.error('Unknown base of: ' + argv.base);
    console.error('Known bases: ' + unmodifiedDataFile.map(({ name }) => name));
    process.exit(1);
}

if (compareData == null) {
    console.error('Unknown version of: ' + argv.compare);
    console.error('Known bases: ' + dataFile.map(({ name }) => name));
    process.exit(1);
}

function timeFormat(timeMs) {
    if (Math.abs(timeMs) > 10) {
        return Math.floor(timeMs);
    } else if (Math.abs(timeMs) > 1) {
        return Math.floor(timeMs * 10) / 10;
    } else if (Math.abs(timeMs) > 0.1) {
        return Math.floor(timeMs * 100) / 100;
    } else if (Math.abs(timeMs) > 0.01) {
        return Math.floor(timeMs * 1000) / 1000;
    }

    return timeMs;
}

function cleanTestName(name) {
    if (name.indexOf(' after ') >= 0) {
        name = name.replace(' after ', ' (');
        name += ')';
    }

    return name.replace(' benchmark', '');
}

function isBaseline(result) {
    return result.test.startsWith('baseline');
}

function isCritical(result) {
    const { test, beforeMB, afterMB, beforeMs, afterMs } = result;
    if (test.indexOf('sparkline') < 0) {
        return false;
    }

    if (argv.full) return true;
    if (afterMs > beforeMs) return true;
    if (afterMB > beforeMB) return true;

    return false;
}

function calculatePercentageChange(before, after, minThreshold = 5 * 1024 * 1024) {
    // Return null if the base is below minimum threshold (5MB by default)
    if (Math.abs(before) < minThreshold) {
        return null;
    }
    return Math.round(((after - before) / before) * 1000) / 10;
}

function formatPercentageChange(pctChange) {
    if (pctChange === null) {
        return 'N/A';
    }
    return `${pctChange > 0 ? '+' : ''}${pctChange}%`;
}

let result = [];
for (const test of Object.keys(baseData.results)) {
    const base = baseData.results[test];
    const compare = compareData.results[test];

    if (!compare) continue;

    const pctMemoryChange = calculatePercentageChange(base.relativeUsage, compare.relativeUsage);
    const memoryDiffMB = Math.floor(compare.relativeUsage / 1024 ** 2) - Math.floor(base.relativeUsage / 1024 ** 2);

    result.push({
        test: cleanTestName(test),
        pctTimeChange: Math.round(((compare.timeMs - base.timeMs) / base.timeMs) * 1000) / 10,
        pctMemoryChange,
        memoryDiffMB,
        base,
        compare,
        beforeMB: Math.floor(base.relativeUsage / 1024 ** 2),
        afterMB: Math.floor(compare.relativeUsage / 1024 ** 2),
        beforeMs: timeFormat(base.timeMs),
        afterMs: timeFormat(compare.timeMs),
        isReliable: base.relativeUsage >= 5 * 1024 * 1024 && compare.relativeUsage >= 5 * 1024 * 1024,
    });
}

const baseline = result.filter(isBaseline);
const critical = result.filter(isCritical);
result = result.filter((r) => !isBaseline(r));

// Filter out unreliable measurements for percentage ranking, but show them separately
const reliableResults = result.filter((r) => r.isReliable);
const unreliableResults = result.filter((r) => !r.isReliable);

const rankedByTime = result.toSorted((a, b) => a.pctTimeChange - b.pctTimeChange);
const rankedByMemory =
    reliableResults.length > 0
        ? reliableResults.toSorted((a, b) => (a.pctMemoryChange || 0) - (b.pctMemoryChange || 0))
        : result.toSorted((a, b) => a.memoryDiffMB - b.memoryDiffMB);

// Load expectation breaches if they exist
let expectationBreaches = [];
const breachesPath = path.join(process.cwd(), 'reports/benchmark-breaches.json');
if (fs.existsSync(breachesPath)) {
    try {
        expectationBreaches = JSON.parse(fs.readFileSync(breachesPath, 'utf8'));
        // Clean up the file after reading
        fs.unlinkSync(breachesPath);
    } catch (e) {
        console.error('Warning: Failed to read expectation breaches:', e.message);
    }
}

if (argv.format === 'table') {
    console.log(`Comparing ${argv.base} (baseline) vs. ${argv.compare}`);

    // Report expectation breaches if any
    if (expectationBreaches.length > 0) {
        console.log('\n⚠️  Expectation Breaches');
        console.table(
            expectationBreaches.map((breach) => ({
                test: breach.testName,
                type: breach.type === 'memory' ? 'Memory (MB)' : 'Canvas Count',
                expected: breach.type === 'memory' ? breach.expected.toFixed(1) : breach.expected,
                actual: breach.type === 'memory' ? breach.actual.toFixed(1) : breach.actual,
                exceeded:
                    breach.type === 'memory'
                        ? `+${(breach.actual - breach.expected).toFixed(1)} MB`
                        : `+${breach.actual - breach.expected}`,
            }))
        );
    }

    if (critical.length > 0) {
        if (argv['report-only']) {
            console.log('Critical Cases');
            console.table(critical, ['test', 'beforeMs', 'afterMs', 'beforeMB', 'afterMB']);
        } else {
            console.error('Critical Cases');
            console.table(critical, ['test', 'beforeMs', 'afterMs', 'beforeMB', 'afterMB']);
            process.exitCode = 1;
        }
    }

    if (baseline.length > 0) {
        console.log('Baseline');
        console.table(baseline, ['test', 'pctTimeChange', 'beforeMs', 'afterMs']);
    }

    const rankedByTimeOutput = argv.full ? rankedByTime : [...rankedByTime.slice(0, 5), {}, ...rankedByTime.slice(-5)];
    console.log('Time');
    console.table(rankedByTimeOutput, ['test', 'pctTimeChange', 'beforeMs', 'afterMs']);

    const rankedByMemoryOutput = argv.full
        ? rankedByMemory
        : [...rankedByMemory.slice(0, 5), {}, ...rankedByMemory.slice(-5)];
    console.log('Memory (top 5/bottom 5)');

    // Prepare table data with formatted percentage changes
    const memoryTableData = rankedByMemoryOutput.map((row) => {
        if (!row.test) {
            return {}; // Empty row for separator
        }
        return {
            test: row.test,
            '%': formatPercentageChange(row.pctMemoryChange),
            'Before (MB)': row.beforeMB,
            'After (MB)': row.afterMB,
            ...(row.isReliable ? {} : { '⚠️': 'unreliable' }),
        };
    });

    console.table(memoryTableData, ['test', '%', 'Before (MB)', 'After (MB)', '⚠️']);

    if (unreliableResults.length > 0) {
        console.log('\n⚠️  Unreliable Memory Measurements (small baseline < 5MB)');

        const unreliableTableData = unreliableResults
            .sort((a, b) => b.memoryDiffMB - a.memoryDiffMB)
            .slice(0, 10)
            .map((row) => ({
                test: row.test,
                'Diff (MB)': row.memoryDiffMB >= 0 ? `+${row.memoryDiffMB}` : row.memoryDiffMB.toString(),
                'Before (MB)': row.beforeMB,
                'After (MB)': row.afterMB,
            }));

        console.table(unreliableTableData, ['test', 'Diff (MB)', 'Before (MB)', 'After (MB)']);
    }
} else if (argv.format === 'json') {
    console.log(
        JSON.stringify(
            {
                base: argv.base,
                compare: argv.compare,
                expectationBreaches,
                critical,
                rankedByTime,
                rankedByMemory,
            },
            null,
            2
        )
    );
}
