import { angleBetween, normalizeAngle180, normalizeAngle360 } from '../../util/angle';
import type { BBox } from '../bbox';
import { arcIntersections, segmentIntersection } from '../intersection';

interface SectorBoundaries {
    startAngle: number;
    endAngle: number;
    innerRadius: number;
    outerRadius: number;
}

interface LineCoordinates {
    start: { x: number; y: number };
    end: { x: number; y: number };
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

function lineCollidesSector(line: LineCoordinates, sector: SectorBoundaries) {
    const { startAngle, endAngle, innerRadius, outerRadius } = sector;
    const outerStart = { x: outerRadius * Math.cos(startAngle), y: outerRadius * Math.sin(startAngle) };
    const outerEnd = { x: outerRadius * Math.cos(endAngle), y: outerRadius * Math.sin(endAngle) };
    const innerStart =
        innerRadius === 0
            ? { x: 0, y: 0 }
            : { x: innerRadius * Math.cos(startAngle), y: innerRadius * Math.sin(startAngle) };
    const innerEnd =
        innerRadius === 0
            ? { x: 0, y: 0 }
            : { x: innerRadius * Math.cos(endAngle), y: innerRadius * Math.sin(endAngle) };
    return (
        segmentIntersection(
            line.start.x,
            line.start.y,
            line.end.x,
            line.end.y,
            outerStart.x,
            outerStart.y,
            innerStart.x,
            innerStart.y
        ) ||
        segmentIntersection(
            line.start.x,
            line.start.y,
            line.end.x,
            line.end.y,
            outerEnd.x,
            outerEnd.y,
            innerEnd.x,
            innerEnd.y
        ) ||
        arcIntersections(
            0,
            0,
            outerRadius,
            startAngle,
            endAngle,
            true,
            line.start.x,
            line.start.y,
            line.end.x,
            line.end.y
        )
    );
}

export function boxCollidesSector(box: BBox, sector: SectorBoundaries) {
    const topLeft = { x: box.x, y: box.y };
    const topRight = { x: box.x + box.width, y: box.y };
    const bottomLeft = { x: box.x, y: box.y + box.height };
    const bottomRight = { x: box.x + box.width, y: box.y + box.height };
    return (
        lineCollidesSector({ start: topLeft, end: topRight }, sector) ||
        lineCollidesSector({ start: bottomLeft, end: bottomRight }, sector)
    );
}

// https://ag-grid.atlassian.net/wiki/spaces/AG/pages/3090087939/Sector+Corner+Radii
// We only care about values between 0 and 1
// An analytic solution may exist, but I can't find it
// Instead, use interval bisection between these two values
// Pass in negative values for outer radius, positive for inner
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
    const fullPie = Math.abs(endAngle - startAngle) >= 2 * Math.PI;
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

    let p0x = NaN;
    let p0y = NaN;
    let p1x = NaN;
    let p1y = NaN;
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

    const a0 = p0DotNormalized > 0 ? clockwiseAngle(Math.atan2(p0y - cy, p0x - cx), startAngle) : NaN;
    const a1 = p1DotNormalized > 0 ? clockwiseAngle(Math.atan2(p1y - cy, p1x - cx), startAngle) : NaN;

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
