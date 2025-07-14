import type { AgTimeIntervalUnit } from 'ag-charts-types';

import { durationDay, durationHour, durationMinute, durationMonth, durationSecond, durationYear } from './duration';

export interface IntervalEncoder {
    milliseconds: number;
    hierarchy: AgTimeIntervalUnit | undefined;
    encode(this: void, date: Date, utc: boolean): number;
    decode(this: void, encoded: number, utc: boolean): Date;
}

const tzOffset = new Date().getTimezoneOffset() * durationMinute;

export const unitEncoding: Record<AgTimeIntervalUnit, IntervalEncoder> = {
    millisecond: {
        milliseconds: 1,
        hierarchy: 'day',
        encode(date: Date) {
            return date.getTime();
        },
        decode(encoded: number) {
            return new Date(encoded);
        },
    },
    second: {
        milliseconds: durationSecond,
        hierarchy: 'day',
        encode(date: Date, utc: boolean) {
            const offset = utc ? 0 : tzOffset;
            return Math.floor((date.getTime() - offset) / durationSecond);
        },
        decode(encoded: number, utc: boolean) {
            const offset = utc ? 0 : tzOffset;
            return new Date(offset + encoded * durationSecond);
        },
    },
    minute: {
        milliseconds: durationMinute,
        hierarchy: 'day',
        encode(date: Date, utc: boolean) {
            const offset = utc ? 0 : tzOffset;
            return Math.floor((date.getTime() - offset) / durationMinute);
        },
        decode(encoded: number, utc: boolean) {
            const offset = utc ? 0 : tzOffset;
            return new Date(offset + encoded * durationMinute);
        },
    },
    hour: {
        milliseconds: durationHour,
        hierarchy: 'day',
        encode(date: Date, utc: boolean) {
            const offset = utc ? 0 : tzOffset;
            return Math.floor((date.getTime() - offset) / durationHour);
        },
        decode(encoded: number, utc: boolean) {
            const offset = utc ? 0 : tzOffset;
            return new Date(offset + encoded * durationHour);
        },
    },
    day: {
        milliseconds: durationDay,
        hierarchy: 'month',
        encode(date: Date, utc: boolean) {
            const tzOffsetMs = utc ? 0 : date.getTimezoneOffset() * durationMinute;
            return Math.floor((date.getTime() - tzOffsetMs) / durationDay);
        },
        decode(encoded: number, utc: boolean) {
            let d: Date;
            if (utc) {
                d = new Date(0);
                d.setUTCDate(d.getUTCDate() + encoded);
                d.setUTCHours(0, 0, 0, 0);
            } else {
                d = new Date(1970, 0, 1);
                d.setDate(d.getDate() + encoded);
            }
            return d;
        },
    },
    month: {
        milliseconds: durationMonth,
        hierarchy: 'year',
        encode(date: Date, utc: boolean) {
            if (utc) {
                return date.getUTCFullYear() * 12 + date.getUTCMonth();
            } else {
                return date.getFullYear() * 12 + date.getMonth();
            }
        },
        decode(encoded: number, utc: boolean) {
            if (utc) {
                const year = Math.floor(encoded / 12);
                const m = encoded - year * 12;
                return new Date(Date.UTC(year, m, 1));
            } else {
                const y = Math.floor(encoded / 12);
                const month = encoded - y * 12;
                return new Date(y, month, 1);
            }
        },
    },
    year: {
        milliseconds: durationYear,
        hierarchy: undefined,
        encode(date: Date, utc: boolean) {
            if (utc) {
                return date.getUTCFullYear();
            } else {
                return date.getFullYear();
            }
        },
        decode(encoded: number, utc: boolean) {
            // Note: assigning years through the constructor
            // will break for years 0 - 99 AD (will turn 1900's).
            // const d = new Date();
            let d: Date;
            if (utc) {
                d = new Date();
                d.setUTCFullYear(encoded);
                d.setUTCMonth(0, 1);
                d.setUTCHours(0, 0, 0, 0);
            } else {
                d = new Date(encoded, 0, 1, 0, 0, 0, 0);
            }
            return d;
        },
    },
};
