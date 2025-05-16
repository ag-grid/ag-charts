import type { TimeInterval, TimeIntervalUnit } from 'ag-charts-types';

import { unitEncoding } from './encoding';

interface TimeIntervalParams {
    unit: TimeIntervalUnit;
    step: number;
    epoch: Date | undefined;
    utc: boolean;
}

function timeInterval(interval: TimeInterval | TimeIntervalUnit): TimeIntervalParams {
    return typeof interval === 'string'
        ? { unit: interval, step: 1, epoch: undefined, utc: false }
        : {
              unit: interval.unit,
              step: interval.step ?? 1,
              epoch: interval.epoch,
              utc: interval.utc ?? false,
          };
}

function getOffset(unit: TimeIntervalUnit, step: number, epoch: Date | undefined, utc: boolean) {
    if (epoch == null) return 0;

    const encoding = unitEncoding[unit];
    return Math.floor(encoding.encode(new Date(epoch), utc)) % step;
}

function encode(d: Date | number, unit: TimeIntervalUnit, step: number, utc: boolean, offset: number) {
    const encoding = unitEncoding[unit];
    return Math.floor((encoding.encode(new Date(d), utc) - offset) / step);
}

function decode(encoded: number, unit: TimeIntervalUnit, step: number, utc: boolean, offset: number) {
    const encoding = unitEncoding[unit];
    return encoding.decode(encoded * step + offset, utc);
}

function encodingFloor(date: Date | number, unit: TimeIntervalUnit, step: number, utc: boolean, offset: number) {
    const d = new Date(date);
    const e = encode(d, unit, step, utc, offset);
    return decode(e, unit, step, utc, offset);
}

function encodingCeil(date: Date | number, unit: TimeIntervalUnit, step: number, utc: boolean, offset: number) {
    const d = new Date(Number(date) - 1);
    const e = encode(d, unit, step, utc, offset);
    return decode(e + 1, unit, step, utc, offset);
}

export function intervalFloor(interval: TimeInterval | TimeIntervalUnit, date: Date | number): Date {
    const { unit, step, epoch, utc } = timeInterval(interval);
    const offset = getOffset(unit, step, epoch, utc);
    return encodingFloor(date, unit, step, utc, offset);
}

export function intervalCeil(interval: TimeInterval | TimeIntervalUnit, date: Date | number): Date {
    const { unit, step, epoch, utc } = timeInterval(interval);
    const offset = getOffset(unit, step, epoch, utc);
    return encodingCeil(date, unit, step, utc, offset);
}

export function intervalPrevious(interval: TimeInterval | TimeIntervalUnit, date: Date) {
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

export function intervalNext(interval: TimeInterval | TimeIntervalUnit, date: Date) {
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

export function intervalRange(
    interval: TimeInterval | TimeIntervalUnit,
    start: Date,
    stop: Date,
    { extend = false, visibleRange = [0, 1], limit, defaultAlignment = 'start' }: RangeParams = {}
): Date[] {
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

    [start, stop] = intervalExtent(start, stop, visibleRange);

    const offset = getOffset(params.unit, params.step, epoch, params.utc);

    const d0 = extend ? encodingFloor(start, unit, step, utc, offset) : encodingCeil(start, unit, step, utc, offset);
    const e0 = encode(d0, unit, step, utc, offset);
    const d1 = extend ? encodingCeil(stop, unit, step, utc, offset) : encodingFloor(stop, unit, step, utc, offset);
    let e1 = encode(d1, unit, step, utc, offset);

    if (limit != null && e1 - e0 > limit) {
        e1 = e0 + limit;
    }

    const range: Date[] = [];
    for (let e = e0; e <= e1; e += 1) {
        const d = decode(e, unit, step, utc, offset);
        range.push(d);
    }

    return range;
}
