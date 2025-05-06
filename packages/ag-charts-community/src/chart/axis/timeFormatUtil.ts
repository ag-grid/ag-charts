import { isPlainObject } from 'ag-charts-core';
import type { TimeIntervalUnit } from 'ag-charts-types';

import type { TimeInterval } from '../../util/time';
import { intervalUnit } from '../../util/timeInterop';

const hardCodedTimeFormats: Record<TimeIntervalUnit, string> = {
    millisecond: '%Y %b %e %H:%M:%S.%L',
    second: '%Y %b %e %H:%M:%S',
    minute: '%Y %b %e %H:%M',
    hour: '%Y %b %e %H:%M',
    day: '%Y %b %e',
    month: '%Y %b',
    year: '%Y',
};

const FORMAT_ORDERS: Record<TimeIntervalUnit, number> = {
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
    format: string | Record<string, string> | undefined,
    timeInterval: TimeInterval | TimeIntervalUnit
): string | undefined {
    if (!isPlainObject(format)) return format;

    const unit = intervalUnit(timeInterval);

    const { millisecond, second, minute, hour, day, month, year } = format;
    const formatOrder = FORMAT_ORDERS[unit];
    const hardcodedTimeFormat = hardCodedTimeFormats[unit];

    if (
        (formatOrder >= FORMAT_ORDERS.year && !YEAR_FORMAT.test(year)) ||
        (formatOrder >= FORMAT_ORDERS.month && !MONTH_FORMAT.test(month)) ||
        (formatOrder >= FORMAT_ORDERS.day && !DAY_FORMAT.test(day))
    ) {
        return hardcodedTimeFormat;
    }

    let specifier: string;
    switch (unit) {
        case 'year':
            return year;
        case 'month':
            return `${month} ${year}`;
        case 'day':
            return `${month} ${day} ${year}`;
        case 'hour':
            specifier = hour;
            break;
        case 'minute':
            specifier = minute;
            break;
        case 'second':
            specifier = second;
            break;
        case 'millisecond':
            specifier = millisecond;
            break;
        default:
            return hardcodedTimeFormat;
    }

    if (
        (formatOrder >= FORMAT_ORDERS.hour && !HOUR_FORMAT.test(specifier)) ||
        (formatOrder >= FORMAT_ORDERS.minute && !MINUTE_FORMAT.test(specifier)) ||
        (formatOrder >= FORMAT_ORDERS.second && !SECOND_FORMAT.test(specifier)) ||
        (formatOrder >= FORMAT_ORDERS.millisecond && !MILLISECOND_FORMAT.test(specifier))
    ) {
        return hardcodedTimeFormat;
    }

    return `${specifier} ${month} ${day} ${year}`;
}
