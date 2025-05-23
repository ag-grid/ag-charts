import type { TimeInterval, TimeIntervalUnit } from 'ag-charts-types';

import { unitEncoding } from './encoding';

export {
    durationSecond,
    durationMinute,
    durationHour,
    durationDay,
    durationWeek,
    durationMonth,
    durationYear,
} from './duration';
export {
    intervalFloor,
    intervalCeil,
    intervalPrevious,
    intervalNext,
    intervalExtent,
    intervalRangeCount,
    intervalRange,
} from './range';

export function intervalUnit(interval: TimeInterval | TimeIntervalUnit): TimeIntervalUnit {
    return typeof interval === 'string' ? interval : interval.unit;
}

export function intervalStep(interval: TimeInterval | TimeIntervalUnit): number {
    return typeof interval === 'string' ? 1 : interval.step ?? 1;
}

export function intervalEpoch(interval: TimeInterval | TimeIntervalUnit): Date | undefined {
    return typeof interval === 'string' ? undefined : interval.epoch;
}

export function intervalHierarchy(interval: TimeInterval | TimeIntervalUnit): TimeIntervalUnit | undefined {
    return unitEncoding[intervalUnit(interval)].hierarchy;
}

export function intervalMilliseconds(interval: TimeInterval | TimeIntervalUnit): number {
    const step = intervalStep(interval);
    return step * unitEncoding[intervalUnit(interval)].milliseconds;
}
