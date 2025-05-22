import type { TimeInterval, TimeIntervalUnit } from 'ag-charts-types';

import { findMinMax } from './number';
import { durationMonth, intervalFloor, intervalMilliseconds, intervalUnit } from './time';
import { durationDay, durationHour, durationMinute, durationSecond, durationWeek, durationYear } from './time';
import { buildFormatter } from './timeFormat';

enum DefaultTimeFormats {
    MILLISECOND,
    SECOND,
    MINUTE,
    HOUR,
    WEEK_DAY,
    SHORT_MONTH,
    MONTH,
    YEAR,
}

export function dateToNumber(value: any) {
    return value instanceof Date ? value.getTime() : value;
}

export function defaultTimeTickFormat(ticks: (Date | number)[], domain: (Date | number)[], formatOffset?: number) {
    const formatString = calculateDefaultTimeTickFormat(ticks, domain, formatOffset);
    const formatter = buildFormatter(formatString);
    return (date: Date) => formatter(date);
}

export function calculateDefaultTimeTickFormat(ticks: (Date | number)[], domain: (Date | number)[], formatOffset = 0) {
    let minInterval: number = Infinity;
    for (let i = 1; i < ticks.length; i++) {
        minInterval = Math.min(minInterval, Math.abs(ticks[i].valueOf() - ticks[i - 1].valueOf()));
    }

    const [d0, d1] =
        domain.length === 0 ? [0, 0] : findMinMax([domain[0].valueOf(), domain[domain.length - 1].valueOf()]);
    const startYear = new Date(d0).getFullYear();
    const stopYear = new Date(d1).getFullYear();
    const yearChange = stopYear - startYear > 0;
    const timeFormat = isFinite(minInterval)
        ? getIntervalLowestGranularityFormat(minInterval, ticks)
        : getLowestGranularityFormat(ticks[0]);

    return formatStringBuilder(Math.max(timeFormat - formatOffset, 0), yearChange, ticks);
}

function getIntervalLowestGranularityFormat(value: number, ticks: any[]): DefaultTimeFormats {
    if (value < durationSecond) {
        return DefaultTimeFormats.MILLISECOND;
    } else if (value < durationMinute) {
        return DefaultTimeFormats.SECOND;
    } else if (value < durationHour) {
        return DefaultTimeFormats.MINUTE;
    } else if (value < durationDay) {
        return DefaultTimeFormats.HOUR;
    } else if (value < durationWeek) {
        return DefaultTimeFormats.WEEK_DAY;
    } else if (value < durationDay * 28 || (value < durationDay * 31 && hasDuplicateMonth(ticks))) {
        return DefaultTimeFormats.SHORT_MONTH;
    } else if (value < durationYear) {
        return DefaultTimeFormats.MONTH;
    }
    return DefaultTimeFormats.YEAR;
}

function getLowestGranularityFormat(value: Date | number): DefaultTimeFormats {
    if (intervalFloor('second', value) < value) {
        return DefaultTimeFormats.MILLISECOND;
    } else if (intervalFloor('minute', value) < value) {
        return DefaultTimeFormats.SECOND;
    } else if (intervalFloor('hour', value) < value) {
        return DefaultTimeFormats.MINUTE;
    } else if (intervalFloor('day', value) < value) {
        return DefaultTimeFormats.HOUR;
    } else if (intervalFloor('month', value) < value) {
        if (intervalFloor({ unit: 'day', step: 7 }, value) < value) {
            return DefaultTimeFormats.WEEK_DAY;
        }
        return DefaultTimeFormats.SHORT_MONTH;
    } else if (intervalFloor('year', value) < value) {
        return DefaultTimeFormats.MONTH;
    }

    return DefaultTimeFormats.YEAR;
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
        } else if (minInterval < durationMonth) {
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

export function domainSpansMultipleYears(domain: (Date | number)[]): boolean {
    const [d0, d1] =
        domain.length === 0 ? [0, 0] : findMinMax([domain[0].valueOf(), domain[domain.length - 1].valueOf()]);
    const startYear = new Date(d0).getFullYear();
    const stopYear = new Date(d1).getFullYear();
    return stopYear - startYear > 0;
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

function hasDuplicateMonth(ticks: any[]) {
    let prevMonth = new Date(ticks[0]).getMonth();
    for (let i = 1; i < ticks.length; i++) {
        const tickMonth = new Date(ticks[i]).getMonth();
        if (prevMonth === tickMonth) {
            return true;
        }
        prevMonth = tickMonth;
    }
    return false;
}

function formatStringBuilder(defaultTimeFormat: DefaultTimeFormats, yearChange: boolean, ticks: any[]): string {
    const firstTick = dateToNumber(ticks[0]);
    const lastTick = dateToNumber(ticks.at(-1));
    const extent = Math.abs(lastTick - firstTick);

    const activeYear = yearChange || defaultTimeFormat === DefaultTimeFormats.YEAR;
    const activeDate = extent === 0;
    const parts: ([string, number, number, DefaultTimeFormats, string] | string)[] = [
        ['hour', 6 * durationHour, 14 * durationDay, DefaultTimeFormats.HOUR, '%I %p'],
        ['hour', durationMinute, 6 * durationHour, DefaultTimeFormats.HOUR, '%I:%M'],
        ['second', 1_000, 6 * durationHour, DefaultTimeFormats.SECOND, ':%S'],
        ['ms', 0, 6 * durationHour, DefaultTimeFormats.MILLISECOND, '.%L'],
        ['am/pm', durationMinute, 6 * durationHour, DefaultTimeFormats.HOUR, '%p'],
        ' ',
        ['day', durationDay, durationWeek, DefaultTimeFormats.WEEK_DAY, '%a'],
        ['month', activeDate ? 0 : durationWeek, 52 * durationWeek, DefaultTimeFormats.SHORT_MONTH, '%b %d'],
        ['month', 5 * durationWeek, 10 * durationYear, DefaultTimeFormats.MONTH, '%B'],
        ' ',
        ['year', activeYear ? 0 : durationYear, Infinity, DefaultTimeFormats.YEAR, '%Y'],
    ];

    const formatParts = parts
        // Retain relevant parts.
        .filter((v) => {
            if (typeof v === 'string') {
                return true;
            }
            const [_, min, max, format] = v;
            return format >= defaultTimeFormat && min <= extent && extent < max;
        })
        // Deduplicate overlapping parts (earlier declaration wins).
        .reduce(
            (r, next) => {
                if (typeof next === 'string') {
                    r.result.push(next);
                } else if (!r.used.has(next[0])) {
                    r.result.push(next);
                    r.used.add(next[0]);
                }
                return r;
            },
            { result: [] as typeof parts, used: new Set<string>() }
        ).result;

    // Strip redundant leading/trailing separators.
    const firstFormat = formatParts.findIndex((v) => typeof v !== 'string');
    const lastFormat = formatParts.findLastIndex((v) => typeof v !== 'string');

    return formatParts
        .slice(firstFormat, lastFormat + 1)
        .map((v) => (typeof v === 'string' ? v : v[4]))
        .join('')
        .replaceAll(/\s+/g, ' ')
        .trim();
}
