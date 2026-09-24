import type { BoxBounds } from 'ag-charts-core';

/**
 * Returns the intersection point for the given pair of line segments, or null,
 * if the segments are parallel or don't intersect.
 * Based on http://paulbourke.net/geometry/pointlineplane/
 */
export function segmentIntersection(
    ax1: number,
    ay1: number,
    ax2: number,
    ay2: number,
    bx1: number,
    by1: number,
    bx2: number,
    by2: number
): number {
    const d = (ax2 - ax1) * (by2 - by1) - (ay2 - ay1) * (bx2 - bx1);

    if (d === 0) {
        // The lines are parallel.
        return 0;
    }

    const ua = ((bx2 - bx1) * (ay1 - by1) - (ax1 - bx1) * (by2 - by1)) / d;
    const ub = ((ax2 - ax1) * (ay1 - by1) - (ay2 - ay1) * (ax1 - bx1)) / d;

    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
        return 1;
    }

    return 0; // The intersection point is outside either or both segments.
}

/** True when the segment crosses one of the box's edges. A segment wholly inside the box crosses none. */
export function boxCrossesSegment(box: BoxBounds, x1: number, y1: number, x2: number, y2: number) {
    const right = box.x + box.width;
    const bottom = box.y + box.height;
    return (
        segmentIntersection(x1, y1, x2, y2, box.x, box.y, right, box.y) === 1 ||
        segmentIntersection(x1, y1, x2, y2, right, box.y, right, bottom) === 1 ||
        segmentIntersection(x1, y1, x2, y2, right, bottom, box.x, bottom) === 1 ||
        segmentIntersection(x1, y1, x2, y2, box.x, bottom, box.x, box.y) === 1
    );
}
