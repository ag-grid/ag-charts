import type { Point } from 'ag-charts-core';
import type { AgAnnotationMagnet, AgAnnotationMagnetRange } from 'ag-charts-types';

/** The magnet options when none are set, which the theme repeats so that they are themeable. */
export const DEFAULT_MAGNET: Readonly<Required<AgAnnotationMagnet>> = { enabled: false, range: 20 };

/** The range to snap within, or `undefined` for none: the magnet is on when enabled, which holding Ctrl or Cmd inverts. */
export function resolveMagnetRange(
    enabled: boolean,
    range: AgAnnotationMagnetRange,
    invert: boolean
): AgAnnotationMagnetRange | undefined {
    return enabled === invert ? undefined : range;
}

/**
 * The point of `candidates` nearest to `point`, if it is within the range: `'nearest'` always is, and a number only
 * within that many pixels.
 */
export function nearestMagnetPoint(
    point: Point,
    candidates: Iterable<Point>,
    range: AgAnnotationMagnetRange
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
    return range === 'nearest' || nearestDistance <= range ? nearest : undefined;
}

/** Snaps `offset` to the nearest of `candidates`, as both its x and y positions are the datum's. */
export function applyMagnet(
    offset: Point,
    candidates: Iterable<Point>,
    range: AgAnnotationMagnetRange | undefined
): Point {
    if (range == null) return offset;
    return nearestMagnetPoint(offset, candidates, range) ?? offset;
}
