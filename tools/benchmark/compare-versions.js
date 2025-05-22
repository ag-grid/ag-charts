#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require('fs');
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

function isCritical(result) {
    const { test, beforeMB, afterMB, beforeMs, afterMs } = result;
    if (test.indexOf('sparkline') < 0) {
        return false;
    }

    if (afterMs > beforeMs) return true;
    if (afterMB > beforeMB) return true;

    return false;
}

const result = [];
for (const test of Object.keys(baseData.results)) {
    const base = baseData.results[test];
    const compare = compareData.results[test];

    if (!compare) continue;

    result.push({
        test: cleanTestName(test),
        pctTimeChange: Math.round(((compare.timeMs - base.timeMs) / base.timeMs) * 1000) / 10,
        pctMemoryChange: Math.round(((compare.memoryUsage - base.memoryUsage) / base.memoryUsage) * 1000) / 10,
        base,
        compare,
        beforeMB: Math.floor(base.memoryUsage / 1024 ** 2),
        afterMB: Math.floor(compare.memoryUsage / 1024 ** 2),
        beforeMs: timeFormat(base.timeMs),
        afterMs: timeFormat(compare.timeMs),
    });
}

const rankedByTime = result.toSorted((a, b) => a.pctTimeChange - b.pctTimeChange);
const rankedByMemory = result.toSorted((a, b) => a.pctMemoryChange - b.pctMemoryChange);
const critical = result.filter(isCritical);

if (argv.format === 'table') {
    console.log(`Comparing ${argv.base} (baseline) vs. ${argv.compare}`);
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

    console.log('Time');
    console.table(
        [...rankedByTime.slice(0, 5), {}, ...rankedByTime.slice(-5)],
        ['test', 'pctTimeChange', 'beforeMs', 'afterMs']
    );

    console.log('Memory');
    console.table(
        [...rankedByMemory.slice(0, 5), {}, ...rankedByMemory.slice(-5)],
        ['test', 'pctMemoryChange', 'beforeMB', 'afterMB']
    );
} else if (argv.format === 'json') {
    console.log(
        JSON.stringify(
            {
                base: argv.base,
                compare: argv.compare,
                critical,
                rankedByTime,
                rankedByMemory,
            },
            null,
            2
        )
    );
}
