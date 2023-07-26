import type { BBox } from '../scene/bbox';
import { segmentIntersection, arcIntersections } from '../scene/intersection';

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
    if (radius < Math.min(innerRadius, outerRadius) || radius > Math.max(innerRadius, outerRadius)) {
        return false;
    }
    // Start and End angles are expected to be [-90, 270]
    // while Math.atan2 returns [-180, 180]
    const pi_2 = Math.PI / 2;
    let angle = Math.atan2(y, x);
    if (angle < -pi_2) {
        angle += 2 * Math.PI;
    }
    // Start is actually bigger than End clock-wise
    let { startAngle, endAngle } = sector;
    if (startAngle < -pi_2) {
        startAngle += 2 * Math.PI;
    }
    if (endAngle < -pi_2) {
        endAngle += 2 * Math.PI;
    }
    if (endAngle === -pi_2) {
        return angle < startAngle;
    }
    if (startAngle === 3 * pi_2) {
        return angle > endAngle;
    }
    // Sector can cross axis start
    return startAngle < endAngle
        ? angle <= endAngle && angle >= startAngle
        : (angle <= endAngle && angle >= -pi_2) || (angle >= startAngle && angle <= 3 * pi_2);
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
        ) != null ||
        segmentIntersection(
            line.start.x,
            line.start.y,
            line.end.x,
            line.end.y,
            outerEnd.x,
            outerEnd.y,
            innerEnd.x,
            innerEnd.y
        ) != null ||
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
        ).length > 0
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
