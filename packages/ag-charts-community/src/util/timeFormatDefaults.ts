import { day } from '../util/time/day';
import { hour } from '../util/time/hour';
import { minute } from '../util/time/minute';
import { month } from '../util/time/month';
import { second } from '../util/time/second';
import { sunday as week } from '../util/time/week';
import { year } from '../util/time/year';
import { durationDay, durationHour, durationMinute, durationSecond, durationWeek, durationYear } from './time/duration';
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

export function defaultTimeTickFormat(ticks?: any[], domain?: any[], formatOffset?: number) {
    const formatString = calculateDefaultTimeTickFormat(ticks, domain, formatOffset);
    const formatter = buildFormatter(formatString);
    return (date: Date) => formatter(date);
}

export function calculateDefaultTimeTickFormat(ticks: any[] = [], domain = ticks, formatOffset = 0) {
    let minInterval: number = Infinity;
    for (let i = 1; i < ticks.length; i++) {
        minInterval = Math.min(minInterval, Math.abs(ticks[i] - ticks[i - 1]));
    }

    const startYear = new Date(domain[0]).getFullYear();
    const stopYear = new Date(domain.at(-1)).getFullYear();
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
    if (second.floor(value) < value) {
        return DefaultTimeFormats.MILLISECOND;
    } else if (minute.floor(value) < value) {
        return DefaultTimeFormats.SECOND;
    } else if (hour.floor(value) < value) {
        return DefaultTimeFormats.MINUTE;
    } else if (day.floor(value) < value) {
        return DefaultTimeFormats.HOUR;
    } else if (month.floor(value) < value) {
        if (week.floor(value) < value) {
            return DefaultTimeFormats.WEEK_DAY;
        }
        return DefaultTimeFormats.SHORT_MONTH;
    } else if (year.floor(value) < value) {
        return DefaultTimeFormats.MONTH;
    }

    return DefaultTimeFormats.YEAR;
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
