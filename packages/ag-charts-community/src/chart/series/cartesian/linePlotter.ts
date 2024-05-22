import type { ExtendedPath2D } from '../../../scene/extendedPath2D';
import type { Point } from '../../../scene/point';

export function plotLinearPoints(path: ExtendedPath2D, points: Iterable<Point>) {
    let didMove = false;
    for (const { x, y } of points) {
        if (didMove) {
            path.lineTo(x, y);
        } else {
            path.moveTo(x, y);
            didMove = true;
        }
    }
}

export function plotSmoothPoints(path: ExtendedPath2D, iPoints: Iterable<Point>, tension: number) {
    const points = Array.isArray(iPoints) ? iPoints : Array.from(iPoints);
    if (points.length <= 1) return;

    const gradients = points.map((c, i) => {
        const p = i === 0 ? c : points[i - 1];
        const n = i === points.length - 1 ? c : points[i + 1];
        if (Math.sign(p.y - c.y) === Math.sign(n.y - c.y)) {
            // Local maxima/minima
            return 0;
        } else {
            return (n.y - p.y) / (n.x - p.x);
        }
    });

    path.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) {
        const prev = points[i - 1];
        const prevM = gradients[i - 1];
        const cur = points[i];
        const curM = gradients[i];

        const dx = cur.x - prev.x;

        path.cubicCurveTo(
            prev.x + (dx * tension) / 3,
            prev.y + (dx * prevM * tension) / 3,
            cur.x - (dx * tension) / 3,
            cur.y - (dx * curM * tension) / 3,
            cur.x,
            cur.y
        );
    }
}

export function plotStepPoints(path: ExtendedPath2D, points: Iterable<Point>, align: number) {
    let lastPoint: Point | undefined;
    for (const point of points) {
        if (lastPoint == null) {
            path.moveTo(point.x, point.y);
        } else {
            const x = lastPoint != null ? (point.x - lastPoint.x) * align + lastPoint.x : point.x;
            path.lineTo(x, lastPoint?.y ?? point.y);
            path.lineTo(x, point.y);
            path.lineTo(point.x, point.y);
        }
        lastPoint = point;
    }
}
