import timeDay from '../util/time/day';
import timeHour from '../util/time/hour';
import timeMinute from '../util/time/minute';
import timeMonth from '../util/time/month';
import timeSecond from '../util/time/second';
import timeWeek from '../util/time/week';
import timeYear from '../util/time/year';
import { durationDay, durationHour, durationMinute, durationWeek, durationYear } from './time/duration';
import { buildFormatter } from './timeFormat';

enum DefaultTimeFormats {
    MILLISECOND,
    SECOND,
    MINUTE,
    HOUR,
    WEEK_DAY,
    SHORT_MONTH,
    MONTH,
    SHORT_YEAR,
    YEAR,
}

export function dateToNumber(x: any) {
    return x instanceof Date ? x.getTime() : x;
}

export function defaultTimeTickFormat(ticks?: any[], domain?: any[]) {
    const formatString = calculateDefaultTimeTickFormat(ticks, domain);
    return (date: Date) => buildFormatter(formatString)(date);
}

export function calculateDefaultTimeTickFormat(ticks: any[] | undefined = [], domain = ticks) {
    let defaultTimeFormat = DefaultTimeFormats.YEAR;

    const updateFormat = (format: DefaultTimeFormats) => {
        if (format < defaultTimeFormat) {
            defaultTimeFormat = format;
        }
    };

    for (const value of ticks) {
        const format = getLowestGranularityFormat(value);
        updateFormat(format);
    }

    const startDomain = dateToNumber(domain[0]);
    const endDomain = dateToNumber(domain.at(-1)!);
    const startYear = new Date(startDomain).getFullYear();
    const stopYear = new Date(endDomain).getFullYear();
    const yearChange = stopYear - startYear > 0;

    return formatStringBuilder(defaultTimeFormat, yearChange, ticks);
}

function getLowestGranularityFormat(value: Date | number): DefaultTimeFormats {
    if (timeSecond.floor(value) < value) {
        return DefaultTimeFormats.MILLISECOND;
    } else if (timeMinute.floor(value) < value) {
        return DefaultTimeFormats.SECOND;
    } else if (timeHour.floor(value) < value) {
        return DefaultTimeFormats.MINUTE;
    } else if (timeDay.floor(value) < value) {
        return DefaultTimeFormats.HOUR;
    } else if (timeMonth.floor(value) < value) {
        if (timeWeek.floor(value) < value) {
            return DefaultTimeFormats.WEEK_DAY;
        }
        return DefaultTimeFormats.SHORT_MONTH;
    } else if (timeYear.floor(value) < value) {
        return DefaultTimeFormats.MONTH;
    }

    return DefaultTimeFormats.YEAR;
}

function formatStringBuilder(defaultTimeFormat: DefaultTimeFormats, yearChange: boolean, ticks: any[]): string {
    const firstTick = dateToNumber(ticks[0]);
    const lastTick = dateToNumber(ticks.at(-1)!);
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
        ['day', durationDay, 1 * durationWeek, DefaultTimeFormats.WEEK_DAY, '%a'],
        ['month', activeDate ? 0 : durationWeek, 52 * durationWeek, DefaultTimeFormats.SHORT_MONTH, '%b %d'],
        ['month', 5 * durationWeek, 10 * durationYear, DefaultTimeFormats.MONTH, '%B'],
        ' ',
        ['year', activeYear ? 0 : durationYear, Infinity, DefaultTimeFormats.YEAR, '%Y'],
    ];

    const formatParts = parts
        // Retain relevant parts.
        .filter((v) => {
            if (typeof v === 'string') return true;

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
    const lastFormat = formatParts.length - [...formatParts].reverse().findIndex((v) => typeof v !== 'string');

    return formatParts
        .slice(firstFormat, lastFormat)
        .map((v) => (typeof v === 'string' ? v : v[4]))
        .join('')
        .replaceAll(/\s+/g, ' ')
        .trim();
}
