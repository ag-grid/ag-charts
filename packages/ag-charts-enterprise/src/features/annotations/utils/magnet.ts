import type { Point } from 'ag-charts-core';
import type { AgAnnotationMagnet, AgAnnotationMagnetMode, PixelSize } from 'ag-charts-types';

/** The magnet options when none are set, which the theme repeats so that they are themeable. */
export const DEFAULT_MAGNET: Readonly<Required<AgAnnotationMagnet>> = { enabled: false, mode: 'weak', range: 20 };

/** The mode to snap by, or `undefined` for none: the magnet is on when enabled, which holding Ctrl or Cmd inverts. */
export function resolveMagnetMode(
    enabled: boolean,
    mode: AgAnnotationMagnetMode,
    invert: boolean
): AgAnnotationMagnetMode | undefined {
    return enabled === invert ? undefined : mode;
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

/**
 * Snaps the vertical position of `offset` to the nearest of `positions`. The horizontal position is left alone, as
 * annotation points already snap to the nearest datum along the x-axis.
 */
export function applyMagnet(
    offset: Point,
    positions: Iterable<number>,
    mode: AgAnnotationMagnetMode | undefined,
    range: PixelSize
): Point {
    if (mode == null) return offset;

    const y = nearestMagnetPosition(offset.y, positions, mode, range);
    return y == null ? offset : { x: offset.x, y };
}
