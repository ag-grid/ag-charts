/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';

export interface BenchmarkMeasurement {
    timeMs: number;
    memory?: {
        before: NodeJS.MemoryUsage;
        after: NodeJS.MemoryUsage;
    };
}

type SuiteName = string;
type TestName = string;

const records: Map<SuiteName, Map<TestName, BenchmarkMeasurement>> = new Map();

export function recordTiming(suitePath: string, name: string, measurement: number | BenchmarkMeasurement) {
    suitePath = suitePath.replace(process.cwd(), '');
    if (!records.has(suitePath)) {
        records.set(suitePath, new Map());
    }
    records.get(suitePath)!.set(name, typeof measurement === 'number' ? { timeMs: measurement } : measurement);
}

export function logTimings() {
    const timings = collectTimings((measurement) => ({
        time: formatMillis(measurement.timeMs),
        heapUsed: measurement.memory ? formatBytes(measurement.memory.after.heapUsed) : null,
    }));
    for (const [suitePath, results] of timings) {
        console.log(suitePath);
        console.table(results);
    }
}

function formatMillis(ms: number) {
    return `${ms.toFixed(2)}ms`;
}

function formatBytes(bytes: number) {
    const kb = bytes / 1024;
    return kb < 1024 ? `${kb.toFixed(2)}KB` : `${(kb / 1024).toFixed(2)}MB`;
}

export function flushTimings() {
    const timings = collectTimings((measurement) => ({
        timeMs: measurement.timeMs,
        heapUsed: measurement.memory ? measurement.memory.after.heapUsed - measurement.memory.before.heapUsed : null,
    }));
    for (const [suitePath, results] of timings) {
        const filename = `./reports${suitePath.replace(/.ts$/, '.json')}`;
        fs.mkdirSync(path.dirname(filename), { recursive: true });
        fs.writeFileSync(filename, JSON.stringify(results));
        console.log(`Wrote timings to ${filename}`);
    }
}

function collectTimings<T>(format: (measurement: BenchmarkMeasurement) => T): Map<SuiteName, { [K in TestName]: T }> {
    return new Map(
        Array.from(records).map(([suitePath, suiteRecords]) => [
            suitePath,
            Object.fromEntries(Array.from(suiteRecords).map(([name, measurement]) => [name, format(measurement)])),
        ])
    );
}

process.on('beforeExit', () => {
    flushTimings();
});
