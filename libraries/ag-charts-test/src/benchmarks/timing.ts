/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';

const records: Map<string, Map<string, number>> = new Map();

export function recordTiming(suitePath: string, name: string, timeMs: number) {
    suitePath = suitePath.replace(process.cwd(), '');
    if (!records.has(suitePath)) {
        records.set(suitePath, new Map());
    }
    records.get(suitePath)!.set(name, timeMs);
}

export function logTimings() {
    for (const [suitePath, suiteRecords] of records) {
        const result: Record<string, number> = {};
        for (const [name, value] of suiteRecords) {
            result[name] = value;
        }

        console.log(suitePath);
        console.table(result);
    }
}

export function flushTimings() {
    const mkdir = (dir: string) => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    };

    for (const [suitePath, suiteRecords] of records) {
        const result: Record<string, number> = {};
        for (const [name, value] of suiteRecords) {
            result[name] = value;
        }

        const filename = `./reports${suitePath.replace(/.ts$/, '.json')}`;
        mkdir(path.dirname(filename));
        fs.writeFileSync(filename, JSON.stringify(result));
        console.log(`Wrote timings to ${filename}`);
    }
}

process.on('beforeExit', () => {
    flushTimings();
});
