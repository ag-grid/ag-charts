import type { TimeInterval } from './time/interval';
export type NumericTicks = number[] & {
    fractionDigits: number;
};
export declare const createNumericTicks: (fractionDigits: number, takingValues?: number[]) => NumericTicks;
export default function (start: number, stop: number, count: number, minCount?: number, maxCount?: number): NumericTicks;
export declare function tickStep(a: number, b: number, count: number, minCount?: number, maxCount?: number): number;
export declare function singleTickDomain(a: number, b: number): number[];
export declare function range(start: number, stop: number, step: number): NumericTicks;
export declare function isDenseInterval({ start, stop, interval, count, availableRange, }: {
    start: number;
    stop: number;
    interval: number | TimeInterval;
    count?: number;
    availableRange: number;
}): boolean;
