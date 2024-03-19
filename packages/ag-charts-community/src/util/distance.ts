import { isBetweenAngles } from './angle';

function pointsDistanceSquared(x1: number, y1: number, x2: number, y2: number) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return dx * dx + dy * dy;
}

export function lineDistanceSquared(
    x: number,
    y: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    best: number
): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    // Find the normalised [0,1] position on the input line ((x1,y1),(x2,y2)) which is perdendicular
    // to (px,py). Clip to [0,1] if the perdendicular line does not cross the input line.
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
    const ix = x1 + t * dx;
    const iy = y1 + t * dy;
    return Math.min(best, pointsDistanceSquared(x, y, ix, iy));
}

export function arcDistanceSquared(
    x: number,
    y: number,
    cx: number,
    cy: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    counterClockwise: boolean,
    best: number
): number {
    if (counterClockwise) {
        [endAngle, startAngle] = [startAngle, endAngle];
    }

    // Calculate the angle between the point and the center of the arc
    const angle = Math.atan2(y - cy, x - cx);
    if (!isBetweenAngles(angle, startAngle, endAngle)) {
        // If the input point's angle is not in the arc, then the nearest point is the arc's start or end.
        const startX = cx + Math.cos(startAngle) * radius;
        const startY = cy + Math.sin(startAngle) * radius;
        const endX = cx + Math.cos(startAngle) * radius;
        const endY = cy + Math.sin(startAngle) * radius;
        return Math.min(best, pointsDistanceSquared(x, y, startX, startY), pointsDistanceSquared(x, y, endX, endY));
    }

    const distToArc = radius - Math.sqrt(pointsDistanceSquared(x, y, cx, cy));
    return Math.min(best, distToArc * distToArc);
}
