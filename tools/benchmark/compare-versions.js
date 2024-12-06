const fs = require('fs');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
    .option('base', {
        alias: 'b',
        type: 'string',
        description: 'Base version to compare against.',
    })
    .option('compare', {
        alias: 'c',
        type: 'string',
        default: 'latest',
        description: 'Version to compare.',
    })
    .demandOption('base')
    .help()
    .parse();

const summaryExampleDataFile = 'packages/ag-charts-website/src/content/docs/benchmarks/_examples/summary/data.ts';
let dataFile = fs.readFileSync(summaryExampleDataFile).toString();
dataFile = dataFile.replace('export function', 'function');

const data = eval(`${dataFile}; getData()`);
const baseData = data.find(({ name }) => name === argv.base);
const compareData = data.find(({ name }) => name === argv.compare);

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
        memoryUsageMB: Math.floor(compare.memoryUsage / 1024 ** 2),
        timeMs: Math.floor(compare.timeMs),
    });
}

const rankedByTime = result.toSorted((a, b) => a.pctTimeChange - b.pctTimeChange);
const rankedByMemory = result.toSorted((a, b) => a.pctMemoryChange - b.pctMemoryChange);

console.log('Top 5 by time');
console.table(rankedByTime.slice(0, 5), ['test', 'pctTimeChange', 'timeMs']);
console.log('Bottom 5 by time');
console.table(rankedByTime.slice(-5), ['test', 'pctTimeChange', 'timeMs']);

console.log('Top 5 by memory');
console.table(rankedByMemory.slice(0, 5), ['test', 'pctMemoryChange', 'memoryUsageMB']);
console.log('Bottom 5 by memory');
console.table(rankedByMemory.slice(-5), ['test', 'pctMemoryChange', 'memoryUsageMB']);
