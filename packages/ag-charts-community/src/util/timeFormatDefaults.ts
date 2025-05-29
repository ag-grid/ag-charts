import type { TimeIntervalUnit } from 'ag-charts-types';

import { findMinMax } from './number';
import {
    durationDay,
    durationHour,
    durationMinute,
    durationSecond,
    durationYear,
    intervalFloor,
    intervalMilliseconds,
} from './time';

export function dateToNumber(value: any) {
    return value instanceof Date ? value.getTime() : value;
}

const intervalUnits: TimeIntervalUnit[] = ['millisecond', 'second', 'minute', 'hour', 'day', 'month', 'year'];
export function highestGranularityForInterval(interval: number) {
    return intervalUnits.findLast((u) => intervalMilliseconds(u) <= interval) ?? 'millisecond';
}

export function lowestGranularityUnitForTicks(ticks: (Date | number)[]): TimeIntervalUnit {
    if (ticks.length === 0) {
        return 'millisecond';
    } else if (ticks.length === 1) {
        return lowestGranularityUnitForValue(ticks[0]);
    }

    let minInterval: number = Infinity;
    for (let i = 1; i < ticks.length; i++) {
        minInterval = Math.min(minInterval, Math.abs(ticks[i].valueOf() - ticks[i - 1].valueOf()));
    }

    if (minInterval < durationSecond) {
        return 'millisecond';
    } else if (minInterval < durationMinute) {
        return 'second';
    } else if (minInterval < durationHour) {
        return 'minute';
    } else if (minInterval < durationDay) {
        return 'hour';
        // Note durationMonth is the average month duration
    } else if (minInterval < 28 * durationDay) {
        return 'day';
    } else if (minInterval < durationYear) {
        return 'month';
    } else {
        return 'year';
    }
}

export function lowestGranularityUnitForValue(value: Date | number): TimeIntervalUnit {
    if (intervalFloor('second', value) < value) {
        return 'millisecond';
    } else if (intervalFloor('minute', value) < value) {
        return 'second';
    } else if (intervalFloor('hour', value) < value) {
        return 'minute';
    } else if (intervalFloor('day', value) < value) {
        return 'hour';
    } else if (intervalFloor('month', value) < value) {
        return 'day';
    } else if (intervalFloor('year', value) < value) {
        return 'month';
    }

    return 'year';
}

export function domainSpansMultipleYears(domain: (Date | number)[]): boolean {
    const [d0, d1] =
        domain.length === 0 ? [0, 0] : findMinMax([domain[0].valueOf(), domain[domain.length - 1].valueOf()]);
    const startYear = new Date(d0).getFullYear();
    const stopYear = new Date(d1).getFullYear();
    return stopYear - startYear > 0;
}
