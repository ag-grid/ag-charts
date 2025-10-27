import { findMinMax } from 'ag-charts-core';
import type { AgTimeIntervalUnit } from 'ag-charts-types';

import { durationDay, durationHour, durationMinute, durationSecond, durationYear, intervalFloor } from './time';

export function dateToNumber(value: any) {
    return value instanceof Date ? value.getTime() : value;
}

export function lowestGranularityForInterval(interval: number) {
    if (interval < durationSecond) {
        return 'millisecond';
    } else if (interval < durationMinute) {
        return 'second';
    } else if (interval < durationHour) {
        return 'minute';
    } else if (interval < durationHour * 23) {
        // Handle DST change
        return 'hour';
    } else if (interval < 28 * durationDay) {
        // Note durationMonth is the average month duration
        return 'day';
    } else if (interval < durationYear) {
        return 'month';
    } else {
        return 'year';
    }
}

export function lowestGranularityUnitForTicks(ticks: (Date | number)[]): AgTimeIntervalUnit {
    if (ticks.length === 0) {
        return 'millisecond';
    } else if (ticks.length === 1) {
        return lowestGranularityUnitForValue(ticks[0]);
    }

    let minInterval: number = Infinity;
    for (let i = 1; i < ticks.length; i++) {
        minInterval = Math.min(minInterval, Math.abs(ticks[i].valueOf() - ticks[i - 1].valueOf()));
    }

    return lowestGranularityForInterval(minInterval);
}

export function lowestGranularityUnitForValue(value: Date | number): AgTimeIntervalUnit {
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

export function dateTruncationForDomain(domain: (Date | number)[]): 'year' | 'month' | 'day' | undefined {
    const [d0, d1] = domain.length === 0 ? [0, 0] : findMinMax([domain[0].valueOf(), domain.at(-1)!.valueOf()]);
    const startYear = new Date(d0).getFullYear();
    const stopYear = new Date(d1).getFullYear();
    if (startYear !== stopYear) return;

    const startMonth = new Date(d0).getMonth();
    const stopMonth = new Date(d1).getMonth();
    if (startMonth !== stopMonth) return 'year';

    const startDate = new Date(d0).getDate();
    const stopDate = new Date(d1).getDate();
    if (startDate !== stopDate) return 'month';

    return 'day';
}
