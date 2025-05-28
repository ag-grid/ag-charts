import type { TimeInterval, TimeIntervalUnit } from 'ag-charts-types';

import { findMinMax } from './number';
import {
    durationDay,
    durationHour,
    durationMinute,
    durationSecond,
    durationYear,
    intervalFloor,
    intervalMilliseconds,
    intervalUnit,
} from './time';

export function dateToNumber(value: any) {
    return value instanceof Date ? value.getTime() : value;
}

export function lowestGranularityUnitForTicks(
    ticks: (Date | number)[],
    timeInterval?: TimeInterval | TimeIntervalUnit
): TimeIntervalUnit {
    let targetInterval: TimeIntervalUnit;
    if (ticks.length === 0) {
        targetInterval = 'millisecond';
    } else if (ticks.length === 1) {
        targetInterval = lowestGranularityUnitForValue(ticks[0]);
    } else {
        let minInterval: number = Infinity;
        for (let i = 1; i < ticks.length; i++) {
            minInterval = Math.min(minInterval, Math.abs(ticks[i].valueOf() - ticks[i - 1].valueOf()));
        }

        if (minInterval < durationSecond) {
            targetInterval = 'millisecond';
        } else if (minInterval < durationMinute) {
            targetInterval = 'second';
        } else if (minInterval < durationHour) {
            targetInterval = 'minute';
        } else if (minInterval < durationDay) {
            targetInterval = 'hour';
            // Note durationMonth is the average month duration
        } else if (minInterval < 28 * durationDay) {
            targetInterval = 'day';
        } else if (minInterval < durationYear) {
            targetInterval = 'month';
        } else {
            targetInterval = 'year';
        }
    }

    if (timeInterval != null && intervalMilliseconds(targetInterval) < intervalMilliseconds(timeInterval)) {
        return intervalUnit(timeInterval);
    }

    return targetInterval;
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
