import * as fs from 'fs';
import * as path from 'path';

import type { SizeMetadata } from './size-of';

export interface BenchmarkMeasurement {
    timeMs: number;
    runCount: number;
    memory: {
        before: NodeJS.MemoryUsage;
        after: NodeJS.MemoryUsage;
        nativeAllocations: Record<string, { count: number; bytes: number }>;
    };
    retainedSize?: SizeMetadata;
    initialRetainedSize?: number;
}

type SuiteName = string;
type TestName = string;

const records: Map<SuiteName, Map<TestName, BenchmarkMeasurement>> = new Map();

export function recordTiming(suitePath: string, name: string, measurement: BenchmarkMeasurement) {
    suitePath = suitePath.replace(process.cwd(), '');
    if (!records.has(suitePath)) {
        records.set(suitePath, new Map());
    }
    records.get(suitePath)?.set(name, measurement);

    const nativeMemory = measurement.memory.nativeAllocations
        ? Object.values(measurement.memory.nativeAllocations).reduce((total, { bytes }) => total + bytes, 0)
        : 0;

    return {
        retainedSize: measurement.retainedSize?.size ?? 0,
        canvasMemory: nativeMemory,
        totalMemoryUse: getTotalMemoryUsage(measurement.memory),
    };
}

function memoryUse(memory: BenchmarkMeasurement['memory'], format = false) {
    return Object.fromEntries(
        (memory?.nativeAllocations ? Object.keys(memory.nativeAllocations) : []).flatMap((objectName) => {
            const value = memory.nativeAllocations[objectName];
            return [
                [`${objectName}Count`, value.count],
                [`${objectName}Bytes`, format ? formatBytes(value.bytes) : value.bytes],
            ];
        })
    );
}

export function logTimings() {
    const timings = collectTimings((measurement) => {
        const memoryAnalysis = measurement.memory ? analyzeMemoryUsage(measurement.memory) : null;
        const nativeMemory = memoryAnalysis ? memoryAnalysis.nativeMemory : 0;

        return {
            time: formatMillis(measurement.timeMs),
            retainedSize: measurement.retainedSize ? formatBytes(measurement.retainedSize.size) : null,
            canvasBytes: nativeMemory > 0 ? formatBytes(nativeMemory) : null,
            confidence: memoryAnalysis?.confidence,
            reliable: memoryAnalysis?.isReliable,
            runCount: measurement.runCount,
        };
    });
    for (const [suitePath, results] of timings) {
        console.log(suitePath);
        console.table(results);
    }
}

export function flushTimings() {
    const timings = collectTimings((measurement) => {
        const memoryAnalysis = measurement.memory ? analyzeMemoryUsage(measurement.memory) : null;
        return {
            timeMs: measurement.timeMs,
            memoryUsage: measurement.memory ? getTotalMemoryUsage(measurement.memory) : null,
            heapUsed: measurement.memory ? measurement.memory.after.heapUsed : null,
            relativeUsage: memoryAnalysis ? memoryAnalysis.relativeMemoryUse : null,
            jsHeapDiff: memoryAnalysis ? memoryAnalysis.jsHeapDiff : null,
            nativeMemory: memoryAnalysis ? memoryAnalysis.nativeMemory : null,
            retainedSize: measurement.retainedSize?.size ?? null,
            retainedBreakdown: measurement.retainedSize ?? null,
            isReliable: memoryAnalysis ? memoryAnalysis.isReliable : null,
            confidence: memoryAnalysis ? memoryAnalysis.confidence : null,
            ...memoryUse(measurement.memory),
        };
    });
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

function getTotalMemoryUsage(memoryStats: NonNullable<BenchmarkMeasurement['memory']>): number {
    const jsHeapSize = memoryStats.after.heapUsed;
    if (!memoryStats.nativeAllocations) return jsHeapSize;
    return Object.values(memoryStats.nativeAllocations).reduce(
        (totalBytes, { bytes }) => totalBytes + bytes,
        jsHeapSize
    );
}

interface MemoryAnalysis {
    relativeMemoryUse: number;
    jsHeapDiff: number;
    nativeMemory: number;
    isReliable: boolean;
    confidence: 'high' | 'medium' | 'low';
}

function analyzeMemoryUsage(memoryStats: NonNullable<BenchmarkMeasurement['memory']>): MemoryAnalysis {
    const jsHeapDiff = memoryStats.after.heapUsed - memoryStats.before.heapUsed;
    const nativeMemory = memoryStats.nativeAllocations
        ? Object.values(memoryStats.nativeAllocations).reduce((total, { bytes }) => total + bytes, 0)
        : 0;

    // Use absolute value of heap difference plus native allocations for relative memory
    const relativeMemoryUse = Math.abs(jsHeapDiff) + nativeMemory;

    // Determine measurement reliability
    const totalMemoryBefore = memoryStats.before.heapUsed;
    const isReliable = Math.abs(jsHeapDiff) < totalMemoryBefore * 0.5; // Not reliable if heap changed by >50%

    let confidence: 'high' | 'medium' | 'low' = 'high';
    if (jsHeapDiff < -10 * 1024 * 1024) {
        // More than 10MB decrease
        confidence = 'low';
    } else if (jsHeapDiff < 0) {
        confidence = 'medium';
    }

    return {
        relativeMemoryUse,
        jsHeapDiff,
        nativeMemory,
        isReliable,
        confidence,
    };
}

function formatMillis(ms: number) {
    return `${ms.toFixed(2)}ms`;
}

function formatBytes(bytes: number) {
    const kb = bytes / 1024;
    return kb < 1024 ? `${kb.toFixed(2)}KB` : `${(kb / 1024).toFixed(2)}MB`;
}

process.on('beforeExit', () => {
    flushTimings();
});
