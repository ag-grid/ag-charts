import timeDay from '../util/time/day';
import timeHour from '../util/time/hour';
import timeMinute from '../util/time/minute';
import timeMonth from '../util/time/month';
import timeSecond from '../util/time/second';
import timeWeek from '../util/time/week';
import timeYear from '../util/time/year';
import { durationDay, durationMinute, durationWeek, durationYear } from './time/duration';
import { buildFormatter } from './timeFormat';

export enum DefaultTimeFormats {
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

export const TIME_FORMAT_STRINGS: Record<DefaultTimeFormats, string> = {
    [DefaultTimeFormats.MILLISECOND]: '.%L',
    [DefaultTimeFormats.SECOND]: ':%S',
    [DefaultTimeFormats.MINUTE]: '%I:%M',
    [DefaultTimeFormats.HOUR]: '%I %p',
    [DefaultTimeFormats.WEEK_DAY]: '%a',
    [DefaultTimeFormats.SHORT_MONTH]: '%b %d',
    [DefaultTimeFormats.MONTH]: '%B',
    [DefaultTimeFormats.SHORT_YEAR]: '%y',
    [DefaultTimeFormats.YEAR]: '%Y',
};

export function dateToNumber(x: any) {
    return x instanceof Date ? x.getTime() : x;
}

export function defaultTimeTickFormat(ticks?: any[]) {
    const formatString = calculateDefaultTimeTickFormat(ticks);
    return (date: Date) => buildFormatter(formatString)(date);
}

export function calculateDefaultTimeTickFormat(ticks: any[] | undefined = []) {
    let defaultTimeFormat = DefaultTimeFormats.YEAR as DefaultTimeFormats;

    const updateFormat = (format: DefaultTimeFormats) => {
        if (format < defaultTimeFormat) {
            defaultTimeFormat = format;
        }
    };

    for (const value of ticks) {
        const format = getLowestGranularityFormat(value);
        updateFormat(format);
    }

    const firstTick = dateToNumber(ticks[0]);
    const lastTick = dateToNumber(ticks.at(-1)!);
    const startYear = new Date(firstTick).getFullYear();
    const stopYear = new Date(lastTick).getFullYear();
    const yearChange = stopYear - startYear > 0;

    return formatStringBuilder(defaultTimeFormat, yearChange, ticks);
}

export function getLowestGranularityFormat(value: Date | number): DefaultTimeFormats {
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

export function formatStringBuilder(defaultTimeFormat: DefaultTimeFormats, yearChange: boolean, ticks: any[]): string {
    let formatStringArray: string[] = [TIME_FORMAT_STRINGS[defaultTimeFormat]];
    let timeEndIndex = 0;

    const firstTick = dateToNumber(ticks[0]);
    const lastTick = dateToNumber(ticks.at(-1)!);
    const extent = Math.abs(lastTick - firstTick);

    switch (defaultTimeFormat) {
        case DefaultTimeFormats.SECOND:
            if (extent / durationMinute > 1) {
                formatStringArray.push(TIME_FORMAT_STRINGS[DefaultTimeFormats.MINUTE]);
            }
        // fall through deliberately
        case DefaultTimeFormats.MINUTE:
        case DefaultTimeFormats.HOUR:
            timeEndIndex = formatStringArray.length;
            if (extent / durationDay > 1) {
                formatStringArray.push(TIME_FORMAT_STRINGS[DefaultTimeFormats.WEEK_DAY]);
            }
        // fall through deliberately
        case DefaultTimeFormats.WEEK_DAY:
            if (extent / durationWeek > 1 || yearChange) {
                // if it's more than a week or there is a year change, don't show week day
                const weekDayIndex = formatStringArray.indexOf(TIME_FORMAT_STRINGS[DefaultTimeFormats.WEEK_DAY]);

                if (weekDayIndex > -1) {
                    formatStringArray.splice(weekDayIndex, 1, TIME_FORMAT_STRINGS[DefaultTimeFormats.SHORT_MONTH]);
                }
            }
        // fall through deliberately
        case DefaultTimeFormats.SHORT_MONTH:
        case DefaultTimeFormats.MONTH:
            if (extent / durationYear > 1 || yearChange) {
                formatStringArray.push(TIME_FORMAT_STRINGS[DefaultTimeFormats.YEAR]);
            }
        // fall through deliberately
        default:
            break;
    }

    if (timeEndIndex < formatStringArray.length) {
        // Insert a gap between all date components.
        formatStringArray = [
            ...formatStringArray.slice(0, timeEndIndex),
            formatStringArray.slice(timeEndIndex).join(' '),
        ];
    }
    if (timeEndIndex > 0) {
        // Reverse order of time components, since they should be displayed in descending
        // granularity.
        formatStringArray = [
            ...formatStringArray.slice(0, timeEndIndex).reverse(),
            ...formatStringArray.slice(timeEndIndex),
        ];
        if (timeEndIndex < formatStringArray.length) {
            // Insert a gap between time and date components.
            formatStringArray.splice(timeEndIndex, 0, ' ');
        }
    }

    return formatStringArray.join('');
}
