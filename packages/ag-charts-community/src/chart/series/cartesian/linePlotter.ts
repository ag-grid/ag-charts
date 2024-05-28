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

const flatnessRatio = 0.05;
export function plotSmoothPoints(path: ExtendedPath2D, iPoints: Iterable<Point>, tension: number) {
    const points = Array.isArray(iPoints) ? iPoints : Array.from(iPoints);
    if (points.length === 0) return;

    path.moveTo(points[0].x, points[0].y);
    if (points.length <= 1) return;

    const gradients = points.map((c, i) => {
        const p = i === 0 ? c : points[i - 1];
        const n = i === points.length - 1 ? c : points[i + 1];
        const isTerminalPoint = i === 0 || i === points.length - 1;

        if (Math.sign(p.y - c.y) === Math.sign(n.y - c.y)) {
            // Local maxima/minima
            return 0;
        }

        if (!isTerminalPoint) {
            // Point is very close to either the previous point or next point
            const range = Math.abs(p.y - n.y);
            const prevRatio = Math.abs(c.y - p.y) / range;
            const nextRatio = Math.abs(c.y - n.y) / range;

            if (
                prevRatio <= flatnessRatio ||
                1 - prevRatio <= flatnessRatio ||
                nextRatio <= flatnessRatio ||
                1 - nextRatio <= flatnessRatio
            ) {
                return 0;
            }
        }

        return (n.y - p.y) / (n.x - p.x);
    });

    // If the start/end point are adjacent to a flat point,
    // Increase the gradient so the line is convex
    if (gradients[1] === 0) {
        gradients[0] *= 2;
    }
    if (gradients[gradients.length - 2] === 0) {
        gradients[gradients.length - 1] *= 2;
    }

    for (let i = 1; i < points.length; i += 1) {
        const prev = points[i - 1];
        const prevM = gradients[i - 1];
        const cur = points[i];
        const curM = gradients[i];

        const dx = cur.x - prev.x;
        const dy = cur.y - prev.y;

        let dcp1x = (dx * tension) / 3;
        let dcp1y = (dx * prevM * tension) / 3;
        let dcp2x = (dx * tension) / 3;
        let dcp2y = (dx * curM * tension) / 3;

        // Ensure the control points do not exceed the y value of a flat point
        if (curM === 0 && Math.abs(dcp1y) > Math.abs(dy)) {
            dcp1x *= Math.abs(dy / dcp1y);
            dcp1y = Math.sign(dcp1y) * Math.abs(dy);
        }
        if (prevM === 0 && Math.abs(dcp2y) > Math.abs(dy)) {
            dcp2x *= Math.abs(dy / dcp2y);
            dcp2y = Math.sign(dcp2y) * Math.abs(dy);
        }

        path.cubicCurveTo(prev.x + dcp1x, prev.y + dcp1y, cur.x - dcp2x, cur.y - dcp2y, cur.x, cur.y);
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
