import * as fs from 'fs';

const records = new Map();

export function recordTiming(name: string, timeMs: number) {
    records.set(name, timeMs);
}

export function logTimings() {
    const result = {};
    for (const [name, value] of records) {
        result[name] = value;
    }
    // eslint-disable-next-line no-console
    console.table(result);
}

export function flushTimings() {
    const result = {};
    for (const [name, value] of records) {
        result[name] = value;
    }

    if (!fs.existsSync('./reports')) {
        fs.mkdirSync('./reports');
    }
    fs.writeFileSync('./reports/ag-charts-community-benchmarks.json', JSON.stringify(result));
}

process.on('beforeExit', () => {
    flushTimings();
});
