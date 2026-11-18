import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-community';
import { alignedTimeInterval, intervalCeil, intervalFloor, roundToMultiple } from 'ag-charts-core';

export type SnapInterval = AgTimeInterval | AgTimeIntervalUnit | number;

interface SnapAxis {
    scale: { convert(value: unknown): number; domain: unknown[] };
    scaleInvert(position: number): unknown;
    inRange(position: number): boolean;
}

function finiteNumber(value: unknown): number | undefined {
    const n = value instanceof Date ? value.getTime() : value;
    return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
}

/** The interval multiples either side of `value`, nearest first, or `undefined` when `value` cannot be rounded. */
function nearestMultiples(
    value: number,
    interval: SnapInterval,
    isTime: boolean,
    domainStart: number
): [number, number] | undefined {
    if (!isTime) {
        if (typeof interval !== 'number') return undefined;
        const snapped = roundToMultiple(value, interval);
        return [snapped, roundToMultiple(snapped + (snapped > value ? -interval : interval), interval)];
    }

    // Axis ticks without an `epoch` start from the domain start, so the snap grid does too.
    const timeInterval = typeof interval === 'number' ? (alignedTimeInterval(interval) ?? interval) : interval;
    let floor: number;
    let ceil: number;
    if (typeof timeInterval === 'number') {
        floor = domainStart + Math.floor((value - domainStart) / timeInterval) * timeInterval;
        ceil = domainStart + Math.ceil((value - domainStart) / timeInterval) * timeInterval;
    } else {
        const anchored =
            typeof timeInterval === 'string'
                ? { unit: timeInterval, epoch: new Date(domainStart) }
                : { ...timeInterval, epoch: timeInterval.epoch ?? new Date(domainStart) };
        floor = intervalFloor(anchored, value).getTime();
        ceil = intervalCeil(anchored, value).getTime();
    }
    return ceil - value < value - floor ? [ceil, floor] : [floor, ceil];
}

/**
 * The interval multiple nearest `value` that lies within the axis domain and range, or `undefined` when `value`
 * cannot be rounded (e.g. a bigint) or no multiple either side of it qualifies.
 */
function snapValueToInterval(
    axis: SnapAxis,
    value: unknown,
    interval: SnapInterval,
    isTime: boolean
): { value: unknown; position: number } | undefined {
    const n = finiteNumber(value);
    const [d0, d1] = [finiteNumber(axis.scale.domain[0]), finiteNumber(axis.scale.domain.at(-1))];
    if (n == null || d0 == null || d1 == null) return undefined;

    const [min, max] = d0 < d1 ? [d0, d1] : [d1, d0];
    for (const multiple of nearestMultiples(n, interval, isTime, min) ?? []) {
        // Log scales map some values outside the domain, such as zero, onto the range edge, so check the value too.
        if (multiple < min || multiple > max) continue;
        const candidate = isTime ? new Date(multiple) : multiple;
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
