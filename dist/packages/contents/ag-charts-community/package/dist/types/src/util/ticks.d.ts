import { type CountableTimeInterval, TimeInterval } from './time/interval';
export declare const TickIntervals: {
    duration: number;
    timeInterval: CountableTimeInterval;
    step: number;
}[];
export declare const TickMultipliers: number[];
export declare function createTicks(start: number, stop: number, count: number, minCount?: number, maxCount?: number): number[];
export declare function getTickInterval(start: number, stop: number, count: number, minCount?: number, maxCount?: number, targetInterval?: number): TimeInterval;
export declare function tickStep(start: number, end: number, count: number, minCount?: number, maxCount?: number): number;
export declare function tickFormat(ticks: any[], format?: string): (n: number | {
    valueOf(): number;
}) => string;
export declare function range(start: number, end: number, step: number): number[];
export declare function isDenseInterval(count: number, availableRange: number): boolean;
export declare function niceTicksDomain(start: number, end: number): number[];
