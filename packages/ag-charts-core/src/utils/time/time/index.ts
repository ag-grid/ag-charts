import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import { isPlainObject, isString } from '../../types/typeGuards';
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
    intervalAgo,
    intervalFloor,
    intervalCeil,
    intervalPrevious,
    intervalNext,
    intervalExtent,
    intervalRangeCount,
    intervalRange,
    intervalRangeNumeric,
    intervalRangeStartIndex,
    decodeIntervalValue,
    encodedToTimestamp,
} from './range';
export type { IntervalRangeNumericResult } from './range';

export function intervalUnit(interval: AgTimeInterval | AgTimeIntervalUnit): AgTimeIntervalUnit {
    return typeof interval === 'string' ? interval : interval.unit;
}

export function intervalStep(interval: AgTimeInterval | AgTimeIntervalUnit): number {
    return typeof interval === 'string' ? 1 : interval.step ?? 1;
}

export function intervalEpoch(interval: AgTimeInterval | AgTimeIntervalUnit): Date | undefined {
    return typeof interval === 'string' ? undefined : interval.epoch;
}

export function intervalHierarchy(interval: AgTimeInterval | AgTimeIntervalUnit): AgTimeIntervalUnit | undefined {
    return unitEncoding[intervalUnit(interval)].hierarchy;
}

export function intervalMilliseconds(interval: AgTimeInterval | AgTimeIntervalUnit): number {
    const step = intervalStep(interval);
    return step * unitEncoding[intervalUnit(interval)].milliseconds;
}

const intervals = ['millisecond', 'second', 'minute', 'hour', 'day', 'month', 'year'];
export function isTimeInterval(value: unknown): value is AgTimeInterval {
    if (!isPlainObject(value)) return false;
    return 'unit' in value && intervals.includes(value.unit);
}

export function isTimeIntervalUnit(value: unknown): value is AgTimeIntervalUnit {
    return isString(value) && intervals.includes(value);
}
