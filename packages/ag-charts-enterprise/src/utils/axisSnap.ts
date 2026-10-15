import { roundToMultiple } from 'ag-charts-core';

/**
 * The multiple of `interval` nearest to the pointer `position` that lies within the axis range. The pointer value is
 * returned unsnapped when it is not a number (e.g. a bigint) or no multiple lies within the range.
 */
export function snapPositionToInterval(
    axisCtx: {
        scale: { convert(value: number): number };
        scaleInvert(position: number): unknown;
        inRange(position: number): boolean;
    },
    position: number,
    interval: number
): { value: unknown; position: number } {
    const value: unknown = axisCtx.scaleInvert(position);
    if (typeof value !== 'number') return { value, position };

    const snapped = roundToMultiple(value, interval);
    // Near the edge of the range the nearest multiple can fall outside it; the one on the other side may not.
    const fallback = roundToMultiple(snapped + (snapped > value ? -interval : interval), interval);
    for (const candidate of [snapped, fallback]) {
        const candidatePosition = axisCtx.scale.convert(candidate);
        if (axisCtx.inRange(candidatePosition)) {
            return { value: candidate, position: candidatePosition };
        }
    }
    return { value, position };
}
