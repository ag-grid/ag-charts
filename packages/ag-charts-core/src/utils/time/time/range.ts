import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import { unitEncoding } from './encoding';

interface TimeIntervalParams {
    unit: AgTimeIntervalUnit;
    step: number;
    epoch: Date | undefined;
    utc: boolean;
}

function timeInterval(interval: AgTimeInterval | AgTimeIntervalUnit): TimeIntervalParams {
    return typeof interval === 'string'
        ? { unit: interval, step: 1, epoch: undefined, utc: false }
        : {
              unit: interval.unit,
              step: interval.step ?? 1,
              epoch: interval.epoch,
              utc: interval.utc ?? false,
          };
}

function getOffset(unit: AgTimeIntervalUnit, step: number, epoch: Date | undefined, utc: boolean) {
    if (epoch == null) return 0;

    const encoding = unitEncoding[unit];
    return Math.floor(encoding.encode(new Date(epoch), utc)) % step;
}

function encode(d: Date | number, unit: AgTimeIntervalUnit, step: number, utc: boolean, offset: number) {
    const encoding = unitEncoding[unit];
    return Math.floor((encoding.encode(new Date(d), utc) - offset) / step);
}

function decode(encoded: number, unit: AgTimeIntervalUnit, step: number, utc: boolean, offset: number) {
    const encoding = unitEncoding[unit];
    return encoding.decode(encoded * step + offset, utc);
}

function encodingFloor(date: Date | number, unit: AgTimeIntervalUnit, step: number, utc: boolean, offset: number) {
    const d = new Date(date);
    const e = encode(d, unit, step, utc, offset);
    return decode(e, unit, step, utc, offset);
}

function encodingCeil(date: Date | number, unit: AgTimeIntervalUnit, step: number, utc: boolean, offset: number) {
    const d = new Date(Number(date) - 1);
    const e = encode(d, unit, step, utc, offset);
    return decode(e + 1, unit, step, utc, offset);
}

export function intervalFloor(interval: AgTimeInterval | AgTimeIntervalUnit, date: Date | number): Date {
    const { unit, step, epoch, utc } = timeInterval(interval);
    const offset = getOffset(unit, step, epoch, utc);
    return encodingFloor(date, unit, step, utc, offset);
}

export function intervalCeil(interval: AgTimeInterval | AgTimeIntervalUnit, date: Date | number): Date {
    const { unit, step, epoch, utc } = timeInterval(interval);
    const offset = getOffset(unit, step, epoch, utc);
    return encodingCeil(date, unit, step, utc, offset);
}

export function intervalPrevious(interval: AgTimeInterval | AgTimeIntervalUnit, date: Date) {
    const { unit, step, epoch, utc } = timeInterval(interval);
    const offset = getOffset(unit, step, epoch, utc);
    return decode(
        encode(encodingCeil(date, unit, step, utc, offset), unit, step, utc, offset) - 1,
        unit,
        step,
        utc,
        offset
    );
}

export function intervalNext(interval: AgTimeInterval | AgTimeIntervalUnit, date: Date) {
    const { unit, step, epoch, utc } = timeInterval(interval);
    const offset = getOffset(unit, step, epoch, utc);
    return decode(
        encode(encodingFloor(date, unit, step, utc, offset), unit, step, utc, offset) + 1,
        unit,
        step,
        utc,
        offset
    );
}

interface RangeParams {
    defaultAlignment?: 'start' | 'interval';
    extend?: boolean;
    visibleRange?: [number, number];
    limit?: number;
}

export function intervalExtent(
    start: Date | number,
    stop: Date | number,
    visibleRange?: [number, number]
): [Date, Date] {
    if (start.valueOf() > stop.valueOf()) {
        [start, stop] = [stop, start];

        if (visibleRange != null) {
            visibleRange = [1 - visibleRange[1], 1 - visibleRange[0]];
        }
    }

    if (visibleRange != null) {
        const delta = stop.valueOf() - start.valueOf();
        const t0 = start.valueOf();

        start = new Date(t0 + visibleRange[0] * delta);
        stop = new Date(t0 + visibleRange[1] * delta);
    }

    return [new Date(start), new Date(stop)];
}

function rangeData(
    interval: AgTimeInterval | AgTimeIntervalUnit,
    start: Date,
    stop: Date,
    { extend = false, visibleRange = [0, 1], limit, defaultAlignment = 'start' }: RangeParams = {}
) {
    const params = timeInterval(interval);
    const { unit, step, utc } = params;
    let epoch: Date | undefined;
    if (params.epoch != null) {
        epoch = params.epoch;
    } else if (defaultAlignment === 'interval') {
        epoch = undefined;
    } else if (start.valueOf() > stop.valueOf()) {
        epoch = stop;
    } else {
        epoch = start;
    }

    const offset = getOffset(params.unit, params.step, epoch, params.utc);

    let [d0, d1] = intervalExtent(start, stop, visibleRange);
    d0 = extend ? encodingFloor(d0, unit, step, utc, offset) : encodingCeil(d0, unit, step, utc, offset);
    d1 = extend ? encodingCeil(d1, unit, step, utc, offset) : encodingFloor(d1, unit, step, utc, offset);

    const e0 = encode(d0, unit, step, utc, offset);
    let e1 = encode(d1, unit, step, utc, offset);

    if (limit != null && e1 - e0 > limit) {
        e1 = e0 + limit;
    }

    return {
        range: [e0, e1],
        unit,
        step,
        utc,
        offset,
    };
}

export function intervalRangeCount(
    interval: AgTimeInterval | AgTimeIntervalUnit,
    start: Date,
    stop: Date,
    params?: RangeParams
) {
    const {
        range: [e0, e1],
    } = rangeData(interval, start, stop, params);
    return Math.abs(e1 - e0);
}

export function intervalRange(
    interval: AgTimeInterval | AgTimeIntervalUnit,
    start: Date,
    stop: Date,
    params?: RangeParams
): Date[] {
    const {
        range: [e0, e1],
        unit,
        step,
        utc,
        offset,
    } = rangeData(interval, start, stop, params);

    const values: Date[] = [];
    for (let e = e0; e <= e1; e += 1) {
        const d = decode(e, unit, step, utc, offset);
        values.push(d);
    }

    return values;
}

export interface IntervalRangeNumericResult {
    /** Encoded band values (not timestamps - internal encoding) */
    encodedValues: number[];
    /** Encoding parameters needed to decode back to Date objects */
    encodingParams: {
        unit: AgTimeIntervalUnit;
        step: number;
        utc: boolean;
        offset: number;
    };
}

/**
 * Returns encoded numeric values instead of Date objects.
 * Use this for performance-critical paths where Date objects aren't needed.
 * Call decodeIntervalValue() to convert individual values back to Date when needed.
 */
export function intervalRangeNumeric(
    interval: AgTimeInterval | AgTimeIntervalUnit,
    start: Date,
    stop: Date,
    params?: RangeParams
): IntervalRangeNumericResult {
    const {
        range: [e0, e1],
        unit,
        step,
        utc,
        offset,
    } = rangeData(interval, start, stop, params);

    // Pre-allocate array for better performance
    const count = Math.max(0, e1 - e0 + 1);
    const encodedValues = new Array<number>(count);
    for (let i = 0; i < count; i++) {
        encodedValues[i] = e0 + i;
    }

    return {
        encodedValues,
        encodingParams: { unit, step, utc, offset },
    };
}

/**
 * Decode a single encoded value back to a Date object.
 */
export function decodeIntervalValue(
    encoded: number,
    encodingParams: { unit: AgTimeIntervalUnit; step: number; utc: boolean; offset: number }
): Date {
    return decode(encoded, encodingParams.unit, encodingParams.step, encodingParams.utc, encodingParams.offset);
}

// Cache timezone offset to avoid repeated lookups
const tzOffsetMs = new Date().getTimezoneOffset() * 60000;

// Duration constants for direct timestamp computation
const DURATION_SECOND = 1000;
const DURATION_MINUTE = 60000;
const DURATION_HOUR = 3600000;

/**
 * Convert encoded value to milliseconds timestamp.
 * Optimized to avoid Date object creation for linear time units (ms, sec, min, hour).
 */
export function encodedToTimestamp(
    encoded: number,
    encodingParams: { unit: AgTimeIntervalUnit; step: number; utc: boolean; offset: number }
): number {
    const { unit, step, utc, offset } = encodingParams;
    const rawEncoded = encoded * step + offset;

    // For linear units, compute timestamp directly without Date creation
    switch (unit) {
        case 'millisecond':
            // millisecond encoding: timestamp = rawEncoded
            return rawEncoded;
        case 'second': {
            // second encoding: timestamp = tzOffset + rawEncoded * 1000
            const tzOffset = utc ? 0 : tzOffsetMs;
            return tzOffset + rawEncoded * DURATION_SECOND;
        }
        case 'minute': {
            // minute encoding: timestamp = tzOffset + rawEncoded * 60000
            const tzOffset = utc ? 0 : tzOffsetMs;
            return tzOffset + rawEncoded * DURATION_MINUTE;
        }
        case 'hour': {
            // hour encoding: timestamp = tzOffset + rawEncoded * 3600000
            const tzOffset = utc ? 0 : tzOffsetMs;
            return tzOffset + rawEncoded * DURATION_HOUR;
        }
        default: {
            // For day/month/year, we need Date creation due to DST and variable-length periods
            const encoding = unitEncoding[unit];
            return encoding.decode(rawEncoded, utc).valueOf();
        }
    }
}

export function intervalRangeStartIndex(
    interval: AgTimeInterval | AgTimeIntervalUnit,
    start: Date,
    stop: Date,
    { extend, visibleRange, limit, defaultAlignment }: RangeParams = {}
) {
    const {
        range: [s],
    } = rangeData(interval, start, stop, { extend, visibleRange, limit, defaultAlignment });
    const {
        range: [s0],
    } = rangeData(interval, start, stop, { extend, limit, defaultAlignment });
    return s - s0;
}
