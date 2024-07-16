/// <reference types="node" />
export interface BenchmarkMeasurement {
    timeMs: number;
    memory?: {
        before: NodeJS.MemoryUsage;
        after: NodeJS.MemoryUsage;
        nativeAllocations?: Record<string, {
            count: number;
            bytes: number;
        }>;
    };
}
export declare function recordTiming(suitePath: string, name: string, measurement: BenchmarkMeasurement): number | undefined;
export declare function logTimings(): void;
export declare function flushTimings(): void;
