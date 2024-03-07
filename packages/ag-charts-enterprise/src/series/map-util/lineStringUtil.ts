// import type { Position } from 'geojson';
type Position = any;

const delta = 1e-9;

export function lineSegmentDistanceToPointSquared(a: Position, b: Position, x: number, y: number): number {
    const [ax, ay] = a;
    const [bx, by] = b;
    const abx = bx - ax;
    const aby = by - ay;
    const l = abx * abx + aby * aby;

    let x0: number;
    let y0: number;
    if (Math.abs(l) < delta) {
        x0 = ax;
        y0 = ay;
    } else {
        let t = ((x - ax) * abx + (y - ay) * aby) / l;
        t = Math.max(0, Math.min(1, t));
        x0 = ax + t * (bx - ax);
        y0 = ay + t * (by - ay);
    }

    const dx = x - x0;
    const dy = y - y0;

    return dx * dx + dy * dy;
}

export function lineSegmentDistanceToRectSquared(
    a: Position,
    b: Position,
    center: Position,
    size: { width: number; height: number }
): number {
    const [ax, ay] = a;
    const [bx, by] = b;
    const abx = bx - ax;
    const aby = by - ay;
    const l = abx * abx + aby * aby;

    const [cx, cy] = center;
    const rx0 = cx - size.width / 2;
    const ry0 = cy - size.height / 2;
    const rx1 = cx + size.width / 2;
    const ry1 = cy + size.height / 2;

    let minDistanceSquared = Infinity;

    // Iterate over each corner
    // This might look like an over-engineered way to do this,
    // But it had a **significant** perf improvement (10x)
    // Probably something to do with a loop unrolling optimisation by the engine
    for (let i = 0; i < 4; i += 1) {
        const x = i % 2 ? rx0 : rx1;
        const y = i < 2 ? ry0 : ry1;

        let x0;
        let y0;
        if (Math.abs(l) < delta) {
            x0 = ax;
            y0 = ay;
        } else {
            let t = ((x - ax) * abx + (y - ay) * aby) / l;
            t = Math.max(0, Math.min(1, t));
            x0 = ax + t * (bx - ax);
            y0 = ay + t * (by - ay);
        }

        const rectContainsPoint = x0 >= rx0 && x0 <= rx1 && y0 >= ry0 && y0 <= ry1;
        if (rectContainsPoint) return 0;

        const dx = x - x0;
        const dy = y - y0;
        const distanceSquared = dx * dx + dy * dy;
        minDistanceSquared = Math.min(minDistanceSquared, distanceSquared);
    }

    return minDistanceSquared;
}

export function lineStringDistance(lineString: Position[], x: number, y: number) {
    let minDistanceSquared = Infinity;
    let p0 = lineString[lineString.length - 1];

    for (const p1 of lineString) {
        minDistanceSquared = Math.min(minDistanceSquared, lineSegmentDistanceToPointSquared(p0, p1, x, y));
        p0 = p1;
    }

    return Math.sqrt(minDistanceSquared);
}

export function lineStringCenter(lineSegment: Position[]): { point: Position; angle: number } | undefined {
    if (lineSegment.length === 0) return;

    let [x0, y0] = lineSegment[0];
    let totalDistance = 0;
    for (let i = 1; i < lineSegment.length; i += 1) {
        const [x1, y1] = lineSegment[i];
        const distance = Math.hypot(x1 - x0, y1 - y0);
        totalDistance += distance;
        x0 = x1;
        y0 = y1;
    }

    const targetDistance = totalDistance / 2;

    [x0, y0] = lineSegment[0];
    totalDistance = 0;
    for (let i = 1; i < lineSegment.length; i += 1) {
        const [x1, y1] = lineSegment[i];
        const distance = Math.hypot(x1 - x0, y1 - y0);
        const nextDistance = totalDistance + distance;

        if (nextDistance > targetDistance) {
            const ratio = (targetDistance - distance) / totalDistance;
            const point = [x0 + (x1 - x0) * ratio, y0 + (y1 - y0) * ratio];
            const angle = Math.atan2(y1 - y0, x1 - x0);

            return { point, angle };
        }

        totalDistance = nextDistance;
        x0 = x1;
        y0 = y1;
    }
}
