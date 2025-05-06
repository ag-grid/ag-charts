import type { TimeIntervalUnit } from 'ag-charts-types';

import * as time from './time';
import type { TimeInterval } from './time/interval';

function intervalInstance(interval: TimeInterval | TimeIntervalUnit): TimeInterval {
    return typeof interval === 'string' ? time[interval] : interval;
}

export function intervalUnit(interval: TimeInterval | TimeIntervalUnit) {
    return intervalInstance(interval).unit;
}

export function intervalStep(interval: TimeInterval | TimeIntervalUnit) {
    return intervalInstance(interval).step;
}

export function intervalHierarchy(interval: TimeInterval | TimeIntervalUnit) {
    return intervalInstance(interval).hierarchy;
}

export function intervalMilliseconds(interval: TimeInterval | TimeIntervalUnit) {
    return intervalInstance(interval).milliseconds;
}

export function intervalRange(
    interval: TimeInterval | TimeIntervalUnit,
    start: Date,
    stop: Date,
    options?: { visibleRange?: [number, number]; extend?: boolean; limit?: number }
) {
    return intervalInstance(interval).range(start, stop, options);
}

export function intervalFloor(interval: TimeInterval | TimeIntervalUnit, date: Date) {
    return intervalInstance(interval).floor(date);
}

export function intervalCeil(interval: TimeInterval | TimeIntervalUnit, date: Date) {
    return intervalInstance(interval).ceil(date);
}
