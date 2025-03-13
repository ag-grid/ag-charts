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
    .demandOption('base')
    .help()
    .parse();

const summaryExampleDataFile = 'packages/ag-charts-website/src/content/docs/benchmarks/_examples/summary/data.ts';
function loadDataFile() {
    let dataFile = fs.readFileSync(summaryExampleDataFile).toString();
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
    console.error('Known bases: ' + data.map(({ name }) => name));
    process.exit(1);
}

if (compareData == null) {
    console.error('Unknown version of: ' + argv.compare);
    console.error('Known bases: ' + data.map(({ name }) => name));
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

console.log(`Comparing ${argv.base} (baseline) vs. ${argv.compare}`);
const result = [];
for (const test of Object.keys(baseData.results)) {
    const base = baseData.results[test];
    const compare = compareData.results[test];

    if (!compare) continue;

    result.push({
        test,
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

console.log('Top 5 by time');
console.table(rankedByTime.slice(0, 5), ['test', 'pctTimeChange', 'beforeMs', 'afterMs']);
console.log('Bottom 5 by time');
console.table(rankedByTime.slice(-5), ['test', 'pctTimeChange', 'beforeMs', 'afterMs']);

console.log('Top 5 by memory');
console.table(rankedByMemory.slice(0, 5), ['test', 'pctMemoryChange', 'beforeMB', 'afterMB']);
console.log('Bottom 5 by memory');
console.table(rankedByMemory.slice(-5), ['test', 'pctMemoryChange', 'beforeMB', 'afterMB']);
