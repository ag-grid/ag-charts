import type { _ModuleSupport } from 'ag-charts-community';
import { roundToMultiple } from 'ag-charts-core';

/**
 * The multiple of `interval` nearest to the pointer `position` that lies within the axis range. A bigint value
 * is returned unsnapped, as `interval` is a number.
 */
export function snapPositionToInterval(
    axisCtx: Pick<_ModuleSupport.AxisContext, 'scale' | 'scaleInvert' | 'inRange'>,
    position: number,
    interval: number
): { value: unknown; position: number } | undefined {
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
}
