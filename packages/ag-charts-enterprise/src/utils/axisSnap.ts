import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-community';
import { alignedTimeInterval, intervalCeil, intervalFloor, roundToMultiple } from 'ag-charts-core';

export type SnapInterval = AgTimeInterval | AgTimeIntervalUnit | number;

interface SnapAxis {
    scale: { convert(value: unknown): number };
    scaleInvert(position: number): unknown;
    inRange(position: number): boolean;
}

/** The interval multiples either side of `value`, nearest first, or `undefined` when `value` cannot be rounded. */
function nearestMultiples(value: unknown, interval: SnapInterval, isTime: boolean): [unknown, unknown] | undefined {
    if (!isTime) {
        if (typeof value !== 'number' || typeof interval !== 'number') return undefined;
        const snapped = roundToMultiple(value, interval);
        return [snapped, roundToMultiple(snapped + (snapped > value ? -interval : interval), interval)];
    }

    const time = value instanceof Date ? value.getTime() : value;
    if (typeof time !== 'number' || !Number.isFinite(time)) return undefined;

    const timeInterval = typeof interval === 'number' ? (alignedTimeInterval(interval) ?? interval) : interval;
    const [floor, ceil] =
        typeof timeInterval === 'number'
            ? [Math.floor(time / timeInterval) * timeInterval, Math.ceil(time / timeInterval) * timeInterval]
            : [intervalFloor(timeInterval, time).getTime(), intervalCeil(timeInterval, time).getTime()];
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
    for (const candidate of nearestMultiples(value, interval, isTime) ?? []) {
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
