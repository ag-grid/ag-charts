import type { AgTimeIntervalUnit } from 'ag-charts-types';

export const defaultTimeFormats: Record<AgTimeIntervalUnit, string> = {
    millisecond: '%H:%M:%S.%L',
    second: '%H:%M:%S',
    minute: '%H:%M',
    hour: '%H:%M',
    day: '%e',
    month: '%b',
    year: '%Y',
};

const hardCodedTimeFormats: Record<AgTimeIntervalUnit, string> = {
    millisecond: '%Y %b %e %H:%M:%S.%L',
    second: '%Y %b %e %H:%M:%S',
    minute: '%Y %b %e %H:%M',
    hour: '%Y %b %e %H:%M',
    day: '%Y %b %e',
    month: '%Y %b',
    year: '%Y',
};

const FORMAT_ORDERS: Record<AgTimeIntervalUnit, number> = {
    year: 0,
    month: 1,
    day: 2,
    hour: 3,
    minute: 4,
    second: 5,
    millisecond: 6,
};

const MILLISECOND_FORMAT = /%[-_0]?L/;
const SECOND_FORMAT = /%[-_0]?S/;
const MINUTE_FORMAT = /%[-_0]?M/;
const HOUR_FORMAT = /%[-_0]?[HI]/;
const DAY_FORMAT = /^%[-_0]?[de]$/;
const MONTH_FORMAT = /^%[-_0]?[Bbm]$/;
const YEAR_FORMAT = /^%[-_0]?[Yy]$/;

export function deriveTimeSpecifier(
    format: string | Partial<Record<string, string>> | undefined,
    unit: AgTimeIntervalUnit,
    truncateDate?: 'year' | 'month' | 'day'
): string {
    if (typeof format === 'string') return format;

    format ??= defaultTimeFormats;
    const {
        millisecond = defaultTimeFormats.millisecond,
        second = defaultTimeFormats.second,
        minute = defaultTimeFormats.minute,
        hour = defaultTimeFormats.hour,
        day = defaultTimeFormats.day,
        month = defaultTimeFormats.month,
        year = defaultTimeFormats.year,
    } = format;
    const formatOrder = FORMAT_ORDERS[unit];
    const hardcodedTimeFormat = hardCodedTimeFormats[unit];
    const truncationOrder = truncateDate ? FORMAT_ORDERS[truncateDate] : -1;

    if (
        (truncationOrder < FORMAT_ORDERS.year && formatOrder >= FORMAT_ORDERS.year && !YEAR_FORMAT.test(year)) ||
        (truncationOrder < FORMAT_ORDERS.month && formatOrder >= FORMAT_ORDERS.month && !MONTH_FORMAT.test(month)) ||
        (truncationOrder < FORMAT_ORDERS.day && formatOrder >= FORMAT_ORDERS.day && !DAY_FORMAT.test(day))
    ) {
        return hardcodedTimeFormat;
    }

    let timeFormat: string;
    switch (unit) {
        case 'year':
            return year;
        case 'month':
            return truncationOrder < FORMAT_ORDERS.year ? `${month} ${year}` : month;
        case 'day':
            // AG-15156 - no format for just days
            return truncationOrder < FORMAT_ORDERS.year ? `${month} ${day} ${year}` : `${month} ${day}`;
        case 'hour':
            timeFormat = hour;
            break;
        case 'minute':
            timeFormat = minute;
            break;
        case 'second':
            timeFormat = second;
            break;
        case 'millisecond':
            timeFormat = millisecond;
            break;
        default:
            return hardcodedTimeFormat;
    }

    if (
        (formatOrder >= FORMAT_ORDERS.hour && !HOUR_FORMAT.test(timeFormat)) ||
        (formatOrder >= FORMAT_ORDERS.minute && !MINUTE_FORMAT.test(timeFormat)) ||
        (formatOrder >= FORMAT_ORDERS.second && !SECOND_FORMAT.test(timeFormat)) ||
        (formatOrder >= FORMAT_ORDERS.millisecond && !MILLISECOND_FORMAT.test(timeFormat))
    ) {
        return hardcodedTimeFormat;
    }

    let dateFormat: string | undefined;
    if (truncationOrder < FORMAT_ORDERS.year) {
        dateFormat = `${month} ${day} ${year}`;
    } else if (truncationOrder < FORMAT_ORDERS.month) {
        dateFormat = `${month} ${day}`;
    }
    // AG-15156 - no format for just days
    return dateFormat ? `${timeFormat} ${dateFormat}` : timeFormat;
}
