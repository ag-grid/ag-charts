import type { _ModuleSupport } from 'ag-charts-community';

const delta = 1e-9;

export function lineSegmentDistanceToPointSquared(
    a: _ModuleSupport.Position,
    b: _ModuleSupport.Position,
    x: number,
    y: number
): number {
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

export function lineStringDistance(lineString: _ModuleSupport.Position[], x: number, y: number) {
    let minDistanceSquared = Infinity;
    let p0 = lineString[lineString.length - 1];

    for (const p1 of lineString) {
        minDistanceSquared = Math.min(minDistanceSquared, lineSegmentDistanceToPointSquared(p0, p1, x, y));
        p0 = p1;
    }

    return Math.sqrt(minDistanceSquared);
}

export function lineStringLength(lineSegment: _ModuleSupport.Position[]): number {
    let [x0, y0] = lineSegment[0];
    let totalDistance = 0;
    for (let i = 1; i < lineSegment.length; i += 1) {
        const [x1, y1] = lineSegment[i];
        const distance = Math.hypot(x1 - x0, y1 - y0);
        totalDistance += distance;
        x0 = x1;
        y0 = y1;
    }

    return totalDistance;
}

export function lineStringCenter(
    lineSegment: _ModuleSupport.Position[]
): { point: _ModuleSupport.Position; angle: number } | undefined {
    if (lineSegment.length === 0) return;

    const targetDistance = lineStringLength(lineSegment) / 2;

    let [x0, y0] = lineSegment[0];
    let totalDistance = 0;
    for (let i = 1; i < lineSegment.length; i += 1) {
        const [x1, y1] = lineSegment[i];
        const segmentDistance = Math.hypot(x1 - x0, y1 - y0);
        const nextDistance = totalDistance + segmentDistance;

        if (nextDistance > targetDistance) {
            const ratio = (targetDistance - totalDistance) / segmentDistance;
            const point: _ModuleSupport.Position = [x0 + (x1 - x0) * ratio, y0 + (y1 - y0) * ratio];
            const angle = Math.atan2(y1 - y0, x1 - x0);

            return { point, angle };
        }

        totalDistance = nextDistance;
        x0 = x1;
        y0 = y1;
    }
}
