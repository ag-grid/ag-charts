import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-community';
import { alignedTimeInterval, intervalCeil, intervalFloor, roundToMultiple } from 'ag-charts-core';

export type SnapInterval = AgTimeInterval | AgTimeIntervalUnit | number;

interface SnapAxis {
    scale: { convert(value: unknown): number; domain: unknown[] };
    scaleInvert(position: number): unknown;
    inRange(position: number): boolean;
}

function toTime(value: unknown): number | undefined {
    const time = value instanceof Date ? value.getTime() : value;
    return typeof time === 'number' && Number.isFinite(time) ? time : undefined;
}

/** The interval multiples either side of `value`, nearest first, or `undefined` when `value` cannot be rounded. */
function nearestMultiples(
    value: unknown,
    interval: SnapInterval,
    isTime: boolean,
    domain: unknown[]
): [unknown, unknown] | undefined {
    if (!isTime) {
        if (typeof value !== 'number' || typeof interval !== 'number') return undefined;
        const snapped = roundToMultiple(value, interval);
        return [snapped, roundToMultiple(snapped + (snapped > value ? -interval : interval), interval)];
    }

    const time = toTime(value);
    if (time == null) return undefined;

    // Axis ticks without an `epoch` start from the domain start, so the snap grid does too.
    const [d0, d1] = [toTime(domain[0]), toTime(domain.at(-1))];
    const origin = d0 == null || d1 == null ? 0 : Math.min(d0, d1);
    const timeInterval = typeof interval === 'number' ? (alignedTimeInterval(interval) ?? interval) : interval;
    let floor: number;
    let ceil: number;
    if (typeof timeInterval === 'number') {
        floor = origin + Math.floor((time - origin) / timeInterval) * timeInterval;
        ceil = origin + Math.ceil((time - origin) / timeInterval) * timeInterval;
    } else {
        const anchored =
            typeof timeInterval === 'string'
                ? { unit: timeInterval, epoch: new Date(origin) }
                : { ...timeInterval, epoch: timeInterval.epoch ?? new Date(origin) };
        floor = intervalFloor(anchored, time).getTime();
        ceil = intervalCeil(anchored, time).getTime();
    }
    const [near, far] = ceil - time < time - floor ? [ceil, floor] : [floor, ceil];
    return [new Date(near), new Date(far)];
}

/**
 * The interval multiple nearest `value` that lies within the axis range, or `undefined` when `value` cannot be
 * rounded (e.g. a bigint) or no multiple either side of it lies within the range.
 */
export function snapValueToInterval(
    axis: SnapAxis,
    value: unknown,
    interval: SnapInterval,
    isTime: boolean
): { value: unknown; position: number } | undefined {
    for (const candidate of nearestMultiples(value, interval, isTime, axis.scale.domain) ?? []) {
        const position = axis.scale.convert(candidate);
        if (axis.inRange(position)) return { value: candidate, position };
    }
    return undefined;
}

/** The pointer `position` snapped to the nearest interval multiple, or unsnapped when it cannot be. */
export function snapPositionToInterval(
    axis: SnapAxis,
    position: number,
    interval: SnapInterval,
    isTime = false
): { value: unknown; position: number } {
    const value = axis.scaleInvert(position);
    return snapValueToInterval(axis, value, interval, isTime) ?? { value, position };
}
