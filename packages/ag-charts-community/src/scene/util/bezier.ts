import { type LinkedList, insertListItemsSorted } from 'ag-charts-core';

import type { Point } from '../point';

export function evaluateBezier(p0: number, p1: number, p2: number, p3: number, t: number): number {
    return (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3;
}

export function solveBezier(p0: number, p1: number, p2: number, p3: number, value: number) {
    if (value <= Math.min(p0, p3)) {
        return p0 < p3 ? 0 : 1;
    } else if (value >= Math.max(p0, p3)) {
        return p0 < p3 ? 1 : 0;
    }

    let t0 = 0;
    let t1 = 1;
    let t = NaN;
    for (let i = 0; i < 12; i += 1) {
        t = (t0 + t1) / 2;
        const curveValue = evaluateBezier(p0, p1, p2, p3, t);
        if (curveValue < value) {
            t0 = t;
        } else {
            t1 = t;
        }
    }

    return t;
}

export function splitBezier2D(
    p0x: number,
    p0y: number,
    p1x: number,
    p1y: number,
    p2x: number,
    p2y: number,
    p3x: number,
    p3y: number,
    t: number
): [[Point, Point, Point, Point], [Point, Point, Point, Point]] {
    const x01 = (1 - t) * p0x + t * p1x;
    const y01 = (1 - t) * p0y + t * p1y;
    const x12 = (1 - t) * p1x + t * p2x;
    const y12 = (1 - t) * p1y + t * p2y;
    const x23 = (1 - t) * p2x + t * p3x;
    const y23 = (1 - t) * p2y + t * p3y;
    const x012 = (1 - t) * x01 + t * x12;
    const y012 = (1 - t) * y01 + t * y12;
    const x123 = (1 - t) * x12 + t * x23;
    const y123 = (1 - t) * y12 + t * y23;
    const x0123 = (1 - t) * x012 + t * x123;
    const y0123 = (1 - t) * y012 + t * y123;

    return [
        [
            { x: p0x, y: p0y },
            { x: x01, y: y01 },
            { x: x012, y: y012 },
            { x: x0123, y: y0123 },
        ],
        [
            { x: x0123, y: y0123 },
            { x: x123, y: y123 },
            { x: x23, y: y23 },
            { x: p3x, y: p3y },
        ],
    ];
}

// Find the extreme points where the derivative is zero
function calculateDerivativeExtrema(p0: number, p1: number, p2: number, p3: number): number[] {
    const a = -p0 + 3 * p1 - 3 * p2 + p3;
    const b = 2 * (p0 - 2 * p1 + p2);
    const c = -p0 + p1;

    if (a === 0) {
        if (b !== 0) {
            const t = -c / b;
            if (t > 0 && t < 1) {
                return [t];
            }
        }
        return [];
    }

    const discriminant = b * b - 4 * a * c;
    if (discriminant >= 0) {
        const sqrtDiscriminant = Math.sqrt(discriminant);
        const t1 = (-b + sqrtDiscriminant) / (2 * a);
        const t2 = (-b - sqrtDiscriminant) / (2 * a);
        return [t1, t2].filter((t) => t > 0 && t < 1);
    }

    return [];
}

export function bezier2DExtrema(
    cp0x: number,
    cp0y: number,
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    cp3x: number,
    cp3y: number
): number[] {
    const tx = calculateDerivativeExtrema(cp0x, cp1x, cp2x, cp3x);
    const ty = calculateDerivativeExtrema(cp0y, cp1y, cp2y, cp3y);
    return [...tx, ...ty];
}

interface BezierCandidate {
    points: readonly [Point, Point, Point, Point];
    distanceSquared: number;
    minDistanceSquared: number;
    maxDistanceSquared: number;
}

function bezierCandidate(points: readonly [Point, Point, Point, Point], x: number, y: number): BezierCandidate {
    const midX = evaluateBezier(points[0].x, points[1].x, points[2].x, points[3].x, 0.5);
    const midY = evaluateBezier(points[0].y, points[1].y, points[2].y, points[3].y, 0.5);
    const distanceSquared = (midX - x) ** 2 + (midY - y) ** 2;

    const d0 = (points[0].x - x) ** 2 + (points[0].y - y) ** 2;
    const d1 = (points[1].x - x) ** 2 + (points[1].y - y) ** 2;
    const d2 = (points[2].x - x) ** 2 + (points[2].y - y) ** 2;
    const d3 = (points[3].x - x) ** 2 + (points[3].y - y) ** 2;
    const minDistanceSquared = Math.min(d0, d1, d2, d3);
    const maxDistanceSquared = Math.max(d0, d1, d2, d3);

    return { points, distanceSquared, minDistanceSquared, maxDistanceSquared };
}

export function bezier2DDistanceSquared(
    cp0x: number,
    cp0y: number,
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    cp3x: number,
    cp3y: number,
    x: number,
    y: number,
    precision = 1,
    best = Infinity
) {
    const points0 = [
        { x: cp0x, y: cp0y },
        { x: cp1x, y: cp1y },
        { x: cp2x, y: cp2y },
        { x: cp3x, y: cp3y },
    ] as const;
    let queue: LinkedList<BezierCandidate> = {
        value: bezierCandidate(points0, x, y),
        next: null,
    };

    let bestResult: { distanceSquared: number; minDistanceSquared: number } | undefined;

    while (queue != null) {
        const { points, distanceSquared, minDistanceSquared, maxDistanceSquared } = queue.value;
        queue = queue.next;

        if (maxDistanceSquared >= best) {
            continue;
        }

        if (bestResult == null || distanceSquared < bestResult.distanceSquared) {
            bestResult = { distanceSquared, minDistanceSquared };
        }

        if (bestResult != null && bestResult.distanceSquared - minDistanceSquared <= precision) {
            continue;
        }

        const [leftPoints, rightPoints] = splitBezier2D(
            points[0].x,
            points[0].y,
            points[1].x,
            points[1].y,
            points[2].x,
            points[2].y,
            points[3].x,
            points[3].y,
            0.5
        );

        const newCandidates = [bezierCandidate(leftPoints, x, y), bezierCandidate(rightPoints, x, y)].sort(
            bezierCandidateCmp
        );

        queue = insertListItemsSorted(queue, newCandidates, bezierCandidateCmp);
    }

    return Math.min(best, bestResult?.distanceSquared ?? Infinity);
}

const bezierCandidateCmp = (a: BezierCandidate, b: BezierCandidate) => b.minDistanceSquared - a.minDistanceSquared;
