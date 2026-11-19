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
 * The point of `candidates` nearest to `point`, if the mode lets it snap there: `'strong'` always does, and `'weak'` only
 * within `range` pixels.
 */
export function nearestMagnetPoint(
    point: Point,
    candidates: Iterable<Point>,
    mode: AgAnnotationMagnetMode,
    range: PixelSize
): Point | undefined {
    let nearest: Point | undefined;
    let nearestDistance = Infinity;
    for (const candidate of candidates) {
        const distance = Math.hypot(candidate.x - point.x, candidate.y - point.y);
        if (distance < nearestDistance) {
            nearest = candidate;
            nearestDistance = distance;
        }
    }

    if (nearest == null) return;
    return mode === 'strong' || nearestDistance <= range ? nearest : undefined;
}

/** Snaps `offset` to the nearest of `candidates`, as both its x and y positions are the datum's. */
export function applyMagnet(
    offset: Point,
    candidates: Iterable<Point>,
    mode: AgAnnotationMagnetMode | undefined,
    range: PixelSize
): Point {
    if (mode == null) return offset;
    return nearestMagnetPoint(offset, candidates, mode, range) ?? offset;
}
