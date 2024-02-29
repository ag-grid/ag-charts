import timeDay from '../util/time/day';
import timeHour from '../util/time/hour';
import timeMinute from '../util/time/minute';
import timeMonth from '../util/time/month';
import timeSecond from '../util/time/second';
import timeWeek from '../util/time/week';
import timeYear from '../util/time/year';
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

type FormatStringBuilderFn = (defaultTimeFormat: DefaultTimeFormats, yearChange: boolean, ticks: any[]) => string;

export function dateToNumber(x: any) {
    return x instanceof Date ? x.getTime() : x;
}

export function calculateDefaultTimeTickFormat(
    ticks: any[] | undefined = [],
    formatStringBuilder: FormatStringBuilderFn
) {
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

export function defaultTimeTickFormat(formatStringBuilder: FormatStringBuilderFn, ticks?: any[]) {
    const formatString = calculateDefaultTimeTickFormat(ticks, formatStringBuilder);
    return (date: Date) => buildFormatter(formatString)(date);
}
