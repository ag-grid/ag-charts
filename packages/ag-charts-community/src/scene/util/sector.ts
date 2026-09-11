import { type BoxBounds, angleBetween, isBetweenAngles, normalizeAngle180, normalizeAngle360 } from 'ag-charts-core';

import { BBox } from '../bbox';
import { boxCrossesSegment, segmentIntersection } from '../intersection';

export interface SectorBoundaries {
    startAngle: number;
    endAngle: number;
    innerRadius: number;
    outerRadius: number;
}

export function sectorBox({ startAngle, endAngle, innerRadius, outerRadius }: SectorBoundaries) {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;

    const addPoint = (x: number, y: number) => {
        x0 = Math.min(x, x0);
        y0 = Math.min(y, y0);
        x1 = Math.max(x, x1);
        y1 = Math.max(y, y1);
    };

    addPoint(innerRadius * Math.cos(startAngle), innerRadius * Math.sin(startAngle));
    addPoint(innerRadius * Math.cos(endAngle), innerRadius * Math.sin(endAngle));
    addPoint(outerRadius * Math.cos(startAngle), outerRadius * Math.sin(startAngle));
    addPoint(outerRadius * Math.cos(endAngle), outerRadius * Math.sin(endAngle));

    if (isBetweenAngles(0, startAngle, endAngle)) {
        addPoint(outerRadius, 0);
    }
    if (isBetweenAngles(Math.PI * 0.5, startAngle, endAngle)) {
        addPoint(0, outerRadius);
    }
    if (isBetweenAngles(Math.PI, startAngle, endAngle)) {
        addPoint(-outerRadius, 0);
    }
    if (isBetweenAngles(Math.PI * 1.5, startAngle, endAngle)) {
        addPoint(0, -outerRadius);
    }

    return new BBox(x0, y0, x1 - x0, y1 - y0);
}

/**
 * True when the whole of `box` lies inside the sector. The outer radius is settled by the corners, and so
 * is the angular range while the sector holds no more than half a turn; the hole and a reflex sector's
 * excluded wedge are not, since a box reaching across the centre line comes closest to the origin at the
 * middle of an edge, and one straddling the wedge can keep every corner inside the range.
 */
export function isBoxInSector(box: BoxBounds, sector: SectorBoundaries) {
    const x1 = box.x + box.width;
    const y1 = box.y + box.height;
    if (
        !isPointInSector(box.x, box.y, sector) ||
        !isPointInSector(x1, box.y, sector) ||
        !isPointInSector(x1, y1, sector) ||
        !isPointInSector(box.x, y1, sector)
    ) {
        return false;
    }
    const nearestX = Math.min(Math.max(0, box.x), x1);
    const nearestY = Math.min(Math.max(0, box.y), y1);
    const innerRadius = Math.min(sector.innerRadius, sector.outerRadius);
    if (nearestX ** 2 + nearestY ** 2 < innerRadius ** 2) return false;
    // Nor is the angular range settled by the corners once the sector is wider than half a turn: the wedge
    // it excludes can pass between them, so the box has to be clear of both boundary edges as well.
    if (angleBetween(sector.startAngle, sector.endAngle) <= Math.PI) return true;
    const radius = Math.max(sector.innerRadius, sector.outerRadius);
    return !edgeCrossesBox(box, sector.startAngle, radius) && !edgeCrossesBox(box, sector.endAngle, radius);
}

/** True when the sector edge at `angle`, from the centre out to `radius`, crosses `box`. */
function edgeCrossesBox(box: BoxBounds, angle: number, radius: number) {
    return boxCrossesSegment(box, 0, 0, radius * Math.cos(angle), radius * Math.sin(angle));
}

export function isPointInSector(x: number, y: number, sector: SectorBoundaries) {
    const radius = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    const { innerRadius, outerRadius } = sector;

    if (
        sector.startAngle === sector.endAngle ||
        radius < Math.min(innerRadius, outerRadius) ||
        radius > Math.max(innerRadius, outerRadius)
    ) {
        return false;
    }

    const startAngle = normalizeAngle180(sector.startAngle);
    const endAngle = normalizeAngle180(sector.endAngle);
    const angle = Math.atan2(y, x);
    // Sector can cross axis start
    return startAngle < endAngle
        ? angle <= endAngle && angle >= startAngle
        : (angle <= endAngle && angle >= -Math.PI) || (angle >= startAngle && angle <= Math.PI);
}

/**
 * Returns intersection points of the arc and the line segment.
 * Takes in arc parameters and line segment start/end points.
 */
function arcIntersections(
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number,
    counterClockwise: boolean,
    x1: number,
    y1: number,
    x2: number,
    y2: number
): number {
    if (Number.isNaN(cx) || Number.isNaN(cy)) {
        return 0;
    }
    if (counterClockwise) {
        [endAngle, startAngle] = [startAngle, endAngle];
    }

    // Intersection points of the line segment and the circle (cx, cy, r).
    const points: { x: number; y: number }[] = [];
    if (x1 === x2) {
        // Vertical segment: parametrising as y = k * x + y0 is impossible (infinite slope), so
        // solve (x1 - cx)^2 + (y - cy)^2 = r^2 for y directly.
        const dd = Math.pow(r, 2) - Math.pow(x1 - cx, 2);
        if (dd < 0) {
            return 0;
        }
        const root = Math.sqrt(dd);
        points.push({ x: x1, y: cy + root }, { x: x1, y: cy - root });
    } else {
        // Solving the quadratic equation:
        // 1. y = k * x + y0
        // 2. (x - cx)^2 + (y - cy)^2 = r^2
        const k = (y2 - y1) / (x2 - x1);
        const y0 = y1 - k * x1;

        const a = Math.pow(k, 2) + 1;
        const b = 2 * (k * (y0 - cy) - cx);
        const c = Math.pow(cx, 2) + Math.pow(y0 - cy, 2) - Math.pow(r, 2);
        const d = Math.pow(b, 2) - 4 * a * c;
        if (d < 0) {
            return 0;
        }

        const i1x = (-b + Math.sqrt(d)) / 2 / a;
        const i2x = (-b - Math.sqrt(d)) / 2 / a;
        points.push({ x: i1x, y: k * i1x + y0 }, { x: i2x, y: k * i2x + y0 });
    }

    let intersections = 0;
    for (const { x, y } of points) {
        const isInsideLine =
            x >= Math.min(x1, x2) && x <= Math.max(x1, x2) && y >= Math.min(y1, y2) && y <= Math.max(y1, y2);
        if (!isInsideLine) {
            continue;
        }

        const angle = Math.atan2(y - cy, x - cx);
        if (isBetweenAngles(angle, startAngle, endAngle)) {
            intersections++;
        }
    }

    return intersections;
}

/** The sector's two straight edges, as endpoint coordinates. Invariant while only the box moves. */
export interface SectorEdges {
    startX0: number;
    startY0: number;
    startX1: number;
    startY1: number;
    endX0: number;
    endY0: number;
    endX1: number;
    endY1: number;
}

export function sectorEdges({ startAngle, endAngle, innerRadius, outerRadius }: SectorBoundaries): SectorEdges {
    const sinStartAngle = Math.sin(startAngle);
    const cosStartAngle = Math.cos(startAngle);
    const sinEndAngle = Math.sin(endAngle);
    const cosEndAngle = Math.cos(endAngle);

    return {
        startX0: innerRadius * cosStartAngle,
        startY0: innerRadius * sinStartAngle,
        startX1: outerRadius * cosStartAngle,
        startY1: outerRadius * sinStartAngle,
        endX0: innerRadius * cosEndAngle,
        endY0: innerRadius * sinEndAngle,
        endX1: outerRadius * cosEndAngle,
        endY1: outerRadius * sinEndAngle,
    };
}

/**
 * Tests whether an axis-aligned `box` overlaps the filled area of a `sector` (annular wedge).
 *
 * Pre-condition: the sector is centred at the origin (0, 0). A `Sector.centerX` / `Sector.centerY`
 * offset is intentionally NOT applied here — the only callers pass origin-centred sectors, so the
 * centre is assumed to be (0, 0) to avoid redundant arithmetic. `box` must be supplied in the same
 * (sector-local) coordinate space.
 *
 * @returns `true` when `box` and the sector overlap; a shared edge or single touching point counts.
 */
export function boxOverlapsSector(box: BoxBounds, sector: SectorBoundaries, edges = sectorEdges(sector)): boolean {
    const { startAngle, endAngle, outerRadius, innerRadius } = sector;
    const { startX0, startY0, startX1, startY1, endX0, endY0, endX1, endY1 } = edges;
    const top = box.y;
    const bottom = box.y + box.height;
    const left = box.x;
    const right = box.x + box.width;

    // Check if any corner of `sector` is in `box`:
    const pointInBox = (x: number, y: number): boolean => x >= left && x <= right && y >= top && y <= bottom;
    if (
        pointInBox(startX0, startY0) ||
        pointInBox(startX1, startY1) ||
        pointInBox(endX0, endY0) ||
        pointInBox(endX1, endY1)
    ) {
        return true;
    }

    // Check if any corner of `box` is in `sector`:
    if (
        isPointInSector(left, top, sector) ||
        isPointInSector(right, top, sector) ||
        isPointInSector(left, bottom, sector) ||
        isPointInSector(right, bottom, sector)
    ) {
        return true;
    }
    // Check if the lines of `box` and the lines of `sector` cross-over:
    if (
        segmentIntersection(left, top, right, top, startX0, startY0, startX1, startY1) ||
        segmentIntersection(left, top, right, top, endX0, endY0, endX1, endY1) ||
        segmentIntersection(left, bottom, right, bottom, startX0, startY0, startX1, startY1) ||
        segmentIntersection(left, bottom, right, bottom, endX0, endY0, endX1, endY1) ||
        segmentIntersection(left, top, left, bottom, startX0, startY0, startX1, startY1) ||
        segmentIntersection(left, top, left, bottom, endX0, endY0, endX1, endY1) ||
        segmentIntersection(right, top, right, bottom, startX0, startY0, startX1, startY1) ||
        segmentIntersection(right, top, right, bottom, endX0, endY0, endX1, endY1)
    ) {
        return true;
    }
    // Check if the lines of `box` and the arcs of `sector` cross over:
    if (
        arcIntersections(0, 0, outerRadius, startAngle, endAngle, false, left, top, right, top) ||
        arcIntersections(0, 0, outerRadius, startAngle, endAngle, false, left, bottom, right, bottom) ||
        arcIntersections(0, 0, outerRadius, startAngle, endAngle, false, left, top, left, bottom) ||
        arcIntersections(0, 0, outerRadius, startAngle, endAngle, false, right, top, right, bottom)
    ) {
        return true;
    }
    if (innerRadius > 0) {
        if (
            arcIntersections(0, 0, innerRadius, startAngle, endAngle, false, left, top, right, top) ||
            arcIntersections(0, 0, innerRadius, startAngle, endAngle, false, left, bottom, right, bottom) ||
            arcIntersections(0, 0, innerRadius, startAngle, endAngle, false, left, top, left, bottom) ||
            arcIntersections(0, 0, innerRadius, startAngle, endAngle, false, right, top, right, bottom)
        ) {
            return true;
        }
    }
    return false;
}

// https://ag-grid.atlassian.net/wiki/spaces/AG/pages/3090087939/Sector+Corner+Radii
// Interval bisection over [0, 1]; no analytic solution is known.
// Pass in negative values for outer radius, positive for inner.
export function radiiScalingFactor(r: number, sweep: number, a: number, b: number) {
    if (a === 0 && b === 0) return 0;

    const fs1 = Math.asin(Math.abs(1 * a) / (r + 1 * a)) + Math.asin(Math.abs(1 * b) / (r + 1 * b)) - sweep;
    if (fs1 < 0) return 1;

    let start = 0;
    let end = 1;
    for (let i = 0; i < 8; i += 1) {
        const s = (start + end) / 2;
        const fs = Math.asin(Math.abs(s * a) / (r + s * a)) + Math.asin(Math.abs(s * b) / (r + s * b)) - sweep;
        if (fs < 0) {
            start = s;
        } else {
            end = s;
        }
    }

    // Ensure we aren't returning scaling values that are too large
    return start;
}

const delta = 1e-6;
export function clockwiseAngle(angle: number, relativeToStartAngle: number) {
    if (angleBetween(angle, relativeToStartAngle) < delta) {
        // Handle floating point errors
        return relativeToStartAngle;
    } else {
        return normalizeAngle360(angle - relativeToStartAngle) + relativeToStartAngle;
    }
}

export function clockwiseAngles(startAngle: number, endAngle: number, relativeToStartAngle = 0) {
    const fullPie = Math.abs(endAngle - startAngle) >= 2 * Math.PI - delta;
    const sweepAngle = fullPie ? 2 * Math.PI : normalizeAngle360(endAngle - startAngle);
    startAngle = clockwiseAngle(startAngle, relativeToStartAngle);
    endAngle = startAngle + sweepAngle;
    return { startAngle, endAngle };
}

export function arcRadialLineIntersectionAngle(
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number,
    clipAngle: number
) {
    // y = x tan a
    // (x - cx)^2 + (y - cy)^2 - r^2 = 0
    // x^2 - 2 x cx + cx ^2 + y^2 - 2 y cy + cy ^2 - r^2 = 0
    // x^2 (1 + tan^2 a) + x * -2 (cx + cy tan a) + (cx^2 + cy^2 - r^2)
    // OR
    // y^2 (1 + cot^2 a) + y * -2 (cy + cx cot a) + (cy^2 + cx^2 - r^2)
    const sinA = Math.sin(clipAngle);
    const cosA = Math.cos(clipAngle);
    const c = cx ** 2 + cy ** 2 - r ** 2;

    let p0x;
    let p0y;
    let p1x;
    let p1y;
    if (cosA > 0.5) {
        const tanA = sinA / cosA;
        const a = 1 + tanA ** 2;
        const b = -2 * (cx + cy * tanA);
        const d = b ** 2 - 4 * a * c;
        if (d < 0) return;

        const x0 = (-b + Math.sqrt(d)) / (2 * a);
        const x1 = (-b - Math.sqrt(d)) / (2 * a);

        p0x = x0;
        p0y = x0 * tanA;
        p1x = x1;
        p1y = x1 * tanA;
    } else {
        const cotA = cosA / sinA;
        const a = 1 + cotA ** 2;
        const b = -2 * (cy + cx * cotA);
        const d = b ** 2 - 4 * a * c;
        if (d < 0) return;

        const y0 = (-b + Math.sqrt(d)) / (2 * a);
        const y1 = (-b - Math.sqrt(d)) / (2 * a);

        p0x = y0 * cotA;
        p0y = y0;
        p1x = y1 * cotA;
        p1y = y1;
    }

    // We're checking the intersection on a whole line rather than just
    // a line segment starting at the origin going off to infinity.
    // We need to add a check that the intersection was on the correct side of the line
    const normalisedX = cosA;
    const normalisedY = sinA;
    const p0DotNormalized = p0x * normalisedX + p0y * normalisedY;
    const p1DotNormalized = p1x * normalisedX + p1y * normalisedY;

    const a0 = p0DotNormalized > 0 ? clockwiseAngle(Math.atan2(p0y - cy, p0x - cx), startAngle) : Number.NaN;
    const a1 = p1DotNormalized > 0 ? clockwiseAngle(Math.atan2(p1y - cy, p1x - cx), startAngle) : Number.NaN;

    if (a0 >= startAngle && a0 <= endAngle) {
        return a0;
    } else if (a1 >= startAngle && a1 <= endAngle) {
        return a1;
    }
}

export function arcCircleIntersectionAngle(
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number,
    circleR: number
) {
    const d = Math.hypot(cx, cy);

    const d1 = (d ** 2 - r ** 2 + circleR ** 2) / (2 * d);
    const d2 = d - d1;

    const theta = Math.atan2(cy, cx);
    const deltaTheta = Math.acos(-d2 / r);

    const a0 = clockwiseAngle(theta + deltaTheta, startAngle);
    const a1 = clockwiseAngle(theta - deltaTheta, startAngle);

    if (a0 >= startAngle && a0 <= endAngle) {
        return a0;
    } else if (a1 >= startAngle && a1 <= endAngle) {
        return a1;
    }
}
