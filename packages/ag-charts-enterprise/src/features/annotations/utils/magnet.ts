import type { Point } from 'ag-charts-core';
import type { AgAnnotationMagnetMode, PixelSize } from 'ag-charts-types';

export const DEFAULT_MAGNET_RANGE: PixelSize = 20;

/** The mode that holding Ctrl or Cmd swaps `off` for, as `onMode`, and every other mode for `off`. */
export function resolveMagnetMode(
    mode: AgAnnotationMagnetMode,
    onMode: Exclude<AgAnnotationMagnetMode, 'off'>,
    invert: boolean
): AgAnnotationMagnetMode {
    if (!invert) return mode;
    return mode === 'off' ? onMode : 'off';
}

/**
 * The candidate nearest to `position`, if the mode lets the point snap to it: `'strong'` always does, and `'weak'` only
 * within `range` pixels.
 */
export function nearestMagnetPosition(
    position: number,
    candidates: Iterable<number>,
    mode: AgAnnotationMagnetMode,
    range: PixelSize
): number | undefined {
    if (mode === 'off') return;

    let nearest: number | undefined;
    let nearestDistance = Infinity;
    for (const candidate of candidates) {
        if (!Number.isFinite(candidate)) continue;
        const distance = Math.abs(candidate - position);
        if (distance < nearestDistance) {
            nearest = candidate;
            nearestDistance = distance;
        }
    }

    if (nearest == null) return;
    return mode === 'strong' || nearestDistance <= range ? nearest : undefined;
}

/** The part of a series that the magnet reads, so that it can be tested without a chart. */
export interface MagnetSeries<TDatum> {
    /** The datum nearest to `point` along the x-axis, as the series picks it for highlighting. */
    pickNearest(point: Point): TDatum | undefined;
    /** The y positions in the series area at which `datum` has a value. */
    yPositions(datum: TDatum): Iterable<number>;
}

/**
 * Snaps the vertical position of `offset` to the nearest value of the nearest datum of any of `series`. The horizontal
 * position is left alone, as annotation points already snap to the nearest datum along the x-axis.
 */
export function applyMagnet<TDatum>(
    offset: Point,
    series: Iterable<MagnetSeries<TDatum>>,
    mode: AgAnnotationMagnetMode,
    range: PixelSize = DEFAULT_MAGNET_RANGE
): Point {
    if (mode === 'off') return offset;

    const positions: number[] = [];
    for (const candidate of series) {
        const datum = candidate.pickNearest(offset);
        if (datum == null) continue;
        positions.push(...candidate.yPositions(datum));
    }

    const y = nearestMagnetPosition(offset.y, positions, mode, range);
    return y == null ? offset : { x: offset.x, y };
}
