import type { ExtendedPath2D } from '../../../scene/extendedPath2D';
import type { Point } from '../../../scene/point';
import { solveBezier, splitBezier } from '../../../scene/util/bezier';

export type Span =
    | {
          type: 'linear';
          moveTo: boolean;
          x0: number;
          y0: number;
          x1: number;
          y1: number;
      }
    | {
          type: 'cubic';
          moveTo: boolean;
          cp0x: number;
          cp0y: number;
          cp1x: number;
          cp1y: number;
          cp2x: number;
          cp2y: number;
          cp3x: number;
          cp3y: number;
      }
    | {
          type: 'step';
          moveTo: boolean;
          x0: number;
          y0: number;
          x1: number;
          y1: number;
          stepX: number;
      };

export function spanRange(span: Span): [Point, Point] {
    switch (span.type) {
        case 'linear':
        case 'step':
            return [
                { x: span.x0, y: span.y0 },
                { x: span.x1, y: span.y1 },
            ];
        case 'cubic':
            return [
                { x: span.cp0x, y: span.cp0y },
                { x: span.cp3x, y: span.cp3y },
            ];
    }
}

export function reverseSpan(span: Span): Span {
    switch (span.type) {
        case 'linear':
            return {
                type: 'linear',
                moveTo: span.moveTo,
                x0: span.x1,
                y0: span.y1,
                x1: span.x0,
                y1: span.y0,
            };
        case 'cubic':
            return {
                type: 'cubic',
                moveTo: span.moveTo,
                cp0x: span.cp3x,
                cp0y: span.cp3y,
                cp1x: span.cp2x,
                cp1y: span.cp2y,
                cp2x: span.cp1x,
                cp2y: span.cp1y,
                cp3x: span.cp0x,
                cp3y: span.cp0y,
            };
        case 'step':
            return {
                type: 'step',
                moveTo: span.moveTo,
                x0: span.x1,
                y0: span.y1,
                x1: span.x0,
                y1: span.y0,
                stepX: span.stepX,
            };
    }
}

export function collapseSpanToPoint(span: Span, point: Point): Span {
    const { x, y } = point;
    switch (span.type) {
        case 'linear':
            return {
                type: 'linear',
                moveTo: span.moveTo,
                x0: x,
                y0: y,
                x1: x,
                y1: y,
            };
        case 'step':
            return {
                type: 'step',
                moveTo: span.moveTo,
                x0: x,
                y0: y,
                x1: x,
                y1: y,
                stepX: x,
            };
        case 'cubic':
            return {
                type: 'cubic',
                moveTo: span.moveTo,
                cp0x: x,
                cp0y: y,
                cp1x: x,
                cp1y: y,
                cp2x: x,
                cp2y: y,
                cp3x: x,
                cp3y: y,
            };
    }
}

export function rescaleSpan(span: Span, nextStart: Point, nextEnd: Point): Span {
    const [prevStart, prevEnd] = spanRange(span);
    const widthScale = prevEnd.x !== prevStart.x ? (nextEnd.x - nextStart.x) / (prevEnd.x - prevStart.x) : 0;
    const heightScale = prevEnd.y !== prevStart.y ? (nextEnd.y - nextStart.y) / (prevEnd.y - prevStart.y) : 0;

    switch (span.type) {
        case 'linear':
            return {
                type: 'linear',
                moveTo: span.moveTo,
                x0: nextStart.x,
                y0: nextStart.y,
                x1: nextEnd.x,
                y1: nextEnd.y,
            };
        case 'cubic':
            return {
                type: 'cubic',
                moveTo: span.moveTo,
                cp0x: nextStart.x,
                cp0y: nextStart.y,
                cp1x: nextEnd.x - (span.cp2x - prevStart.x) * widthScale,
                cp1y: nextEnd.y - (span.cp2y - prevStart.y) * heightScale,
                cp2x: nextEnd.x - (span.cp1x - prevStart.x) * widthScale,
                cp2y: nextEnd.y - (span.cp1y - prevStart.y) * heightScale,
                cp3x: nextEnd.x,
                cp3y: nextEnd.y,
            };
        case 'step':
            return {
                type: 'step',
                moveTo: span.moveTo,
                x0: nextStart.x,
                y0: nextStart.y,
                x1: nextEnd.x,
                y1: nextEnd.y,
                stepX: nextEnd.x - (span.stepX - prevStart.x) * widthScale,
            };
    }
}

function setMoveTo(span: Span, moveTo: boolean) {
    return span.moveTo !== moveTo ? { ...span, moveTo } : span;
}

export function splitSpanAtX(span: Span, x: number): [Span, Span] {
    const [start, end] = spanRange(span);
    let x0: number;
    let y0: number;
    let x1: number;
    let y1: number;
    if (start.x < end.x) {
        x0 = start.x;
        y0 = start.y;
        x1 = end.x;
        y1 = end.y;
    } else {
        x0 = end.x;
        y0 = end.y;
        x1 = start.x;
        y1 = start.y;
    }

    if (x < x0) {
        return [rescaleSpan(span, start, start), setMoveTo(span, false)];
    } else if (x > x1) {
        return [span, setMoveTo(rescaleSpan(span, end, end), false)];
    }

    switch (span.type) {
        case 'linear': {
            const midY = y0 === y1 ? y0 : ((y1 - y0) / (x1 - x0)) * (x - x0) + y0;
            return [
                { type: 'linear', moveTo: span.moveTo, x0, y0, x1: x, y1: midY },
                { type: 'linear', moveTo: false, x0: x, y0: midY, x1, y1 },
            ];
        }
        case 'step':
            if (x < span.stepX) {
                return [
                    { type: 'step', moveTo: span.moveTo, x0, y0, x1: x, y1: y0, stepX: x },
                    { type: 'step', moveTo: false, x0: x, y0, x1, y1, stepX: span.stepX },
                ];
            } else {
                return [
                    { type: 'step', moveTo: span.moveTo, x0, y0, x1: x, y1, stepX: span.stepX },
                    { type: 'step', moveTo: false, x0: x, y0: y1, x1, y1, stepX: x },
                ];
            }
        case 'cubic':
            const t = solveBezier(span.cp0x, span.cp1x, span.cp2x, span.cp3x, x);
            const [a, b] = splitBezier(
                span.cp0x,
                span.cp0y,
                span.cp1x,
                span.cp1y,
                span.cp2x,
                span.cp2y,
                span.cp3x,
                span.cp3y,
                t
            );
            return [
                {
                    type: 'cubic',
                    moveTo: span.moveTo,
                    cp0x: a[0].x,
                    cp0y: a[0].y,
                    cp1x: a[1].x,
                    cp1y: a[1].y,
                    cp2x: a[2].x,
                    cp2y: a[2].y,
                    cp3x: a[3].x,
                    cp3y: a[3].y,
                },
                {
                    type: 'cubic',
                    moveTo: false,
                    cp0x: b[0].x,
                    cp0y: b[0].y,
                    cp1x: b[1].x,
                    cp1y: b[1].y,
                    cp2x: b[2].x,
                    cp2y: b[2].y,
                    cp3x: b[3].x,
                    cp3y: b[3].y,
                },
            ];
    }
}

export function clipSpanX(span: Span, x0: number, x1: number): Span {
    const { moveTo } = span;
    const [start, end] = spanRange(span);
    let spanX0: number;
    let spanY0: number;
    let spanX1: number;
    let spanY1: number;
    if (start.x < end.x) {
        spanX0 = start.x;
        spanY0 = start.y;
        spanX1 = end.x;
        spanY1 = end.y;
    } else {
        spanX0 = end.x;
        spanY0 = end.y;
        spanX1 = start.x;
        spanY1 = start.y;
    }

    if (x1 < spanX0) {
        return rescaleSpan(span, start, start);
    } else if (x0 > spanX1) {
        return rescaleSpan(span, end, end);
    }

    switch (span.type) {
        case 'linear': {
            const m = spanY0 === spanY1 ? undefined : (spanY1 - spanY0) / (spanX1 - spanX0);
            const y0 = m == null ? spanY0 : m * (x0 - spanX0) + spanY0;
            const y1 = m == null ? spanY0 : m * (x1 - spanX0) + spanY0;
            return { type: 'linear', moveTo, x0, y0, x1, y1 };
        }
        case 'step':
            if (x1 <= span.stepX) {
                const y = span.y0;
                return { type: 'step', moveTo, x0, y0: y, x1, y1: y, stepX: x1 };
            } else if (x0 >= span.stepX) {
                const y = span.y1;
                return { type: 'step', moveTo, x0, y0: y, x1, y1: y, stepX: x0 };
            } else {
                const { y0, y1, stepX } = span;
                return { type: 'step', moveTo, x0, y0, x1, y1, stepX };
            }
        case 'cubic':
            const t0 = solveBezier(span.cp0x, span.cp1x, span.cp2x, span.cp3x, x0);
            let [_unused, bezier] = splitBezier(
                span.cp0x,
                span.cp0y,
                span.cp1x,
                span.cp1y,
                span.cp2x,
                span.cp2y,
                span.cp3x,
                span.cp3y,
                t0
            );
            const t1 = solveBezier(bezier[0].x, bezier[1].x, bezier[2].x, bezier[3].x, x1);
            [bezier, _unused] = splitBezier(
                bezier[0].x,
                bezier[0].y,
                bezier[1].x,
                bezier[1].y,
                bezier[2].x,
                bezier[2].y,
                bezier[3].x,
                bezier[3].y,
                t1
            );
            return {
                type: 'cubic',
                moveTo,
                cp0x: bezier[0].x,
                cp0y: bezier[0].y,
                cp1x: bezier[1].x,
                cp1y: bezier[1].y,
                cp2x: bezier[2].x,
                cp2y: bezier[2].y,
                cp3x: bezier[3].x,
                cp3y: bezier[3].y,
            };
    }
}

export function interpolateSpans(a: Span, b: Span, ratio: number): Span {
    if (a.type === 'cubic' && b.type === 'cubic') {
        return {
            type: 'cubic',
            moveTo: a.moveTo,
            cp0x: (b.cp0x - a.cp0x) * ratio + a.cp0x,
            cp0y: (b.cp0y - a.cp0y) * ratio + a.cp0y,
            cp1x: (b.cp1x - a.cp1x) * ratio + a.cp1x,
            cp1y: (b.cp1y - a.cp1y) * ratio + a.cp1y,
            cp2x: (b.cp2x - a.cp2x) * ratio + a.cp2x,
            cp2y: (b.cp2y - a.cp2y) * ratio + a.cp2y,
            cp3x: (b.cp3x - a.cp3x) * ratio + a.cp3x,
            cp3y: (b.cp3y - a.cp3y) * ratio + a.cp3y,
        };
    } else if (a.type === 'step' && b.type === 'step') {
        return {
            type: 'step',
            moveTo: a.moveTo,
            x0: (b.x0 - a.x0) * ratio + a.x0,
            y0: (b.y0 - a.y0) * ratio + a.y0,
            x1: (b.x1 - a.x1) * ratio + a.x1,
            y1: (b.y1 - a.y1) * ratio + a.y1,
            stepX: (b.stepX - a.stepX) * ratio + a.stepX,
        };
    }

    const [aStart, aEnd] = spanRange(a);
    const [bStart, bEnd] = spanRange(b);
    return {
        type: 'linear',
        moveTo: a.moveTo,
        x0: (bStart.x - aStart.x) * ratio + aStart.x,
        y0: (bStart.y - aStart.y) * ratio + aStart.y,
        x1: (bEnd.x - aEnd.x) * ratio + aEnd.x,
        y1: (bEnd.y - aEnd.y) * ratio + aEnd.y,
    };
}

export enum SpanJoin {
    None,
    MoveTo,
    LineTo,
}

export function plotSpan(
    path: ExtendedPath2D,
    span: Span,
    moveTo: SpanJoin = span.moveTo ? SpanJoin.MoveTo : SpanJoin.None
) {
    const [start] = spanRange(span);
    switch (moveTo) {
        case SpanJoin.MoveTo:
            path.moveTo(start.x, start.y);
            break;
        case SpanJoin.LineTo:
            path.lineTo(start.x, start.y);
            break;
    }

    switch (span.type) {
        case 'linear':
            path.lineTo(span.x1, span.y1);
            break;
        case 'cubic':
            path.cubicCurveTo(span.cp1x, span.cp1y, span.cp2x, span.cp2y, span.cp3x, span.cp3y);
            break;
        case 'step':
            path.lineTo(span.stepX, span.y0);
            path.lineTo(span.stepX, span.y1);
            path.lineTo(span.x1, span.y1);
            break;
    }
}

export function linearPoints(points: Iterable<Point>): Span[] {
    const spans: Span[] = [];
    let i = 0;
    let x0 = NaN;
    let y0 = NaN;
    for (const { x: x1, y: y1 } of points) {
        if (i > 0) {
            const moveTo = i === 1;
            spans.push({ type: 'linear', moveTo, x0, y0, x1, y1 });
        }
        i += 1;
        x0 = x1;
        y0 = y1;
    }
    return spans;
}

const lineSteps = {
    start: 0,
    middle: 0.5,
    end: 1,
};

export function stepPoints(points: Iterable<Point>, position: number | keyof typeof lineSteps): Span[] {
    const spans: Span[] = [];
    let i = 0;
    let x0 = NaN;
    let y0 = NaN;
    const p0 = typeof position === 'number' ? position : lineSteps[position];
    for (const { x: x1, y: y1 } of points) {
        if (i > 0) {
            const moveTo = i === 1;
            const stepX = x0 + (x1 - x0) * p0;
            spans.push({ type: 'step', moveTo, x0, y0, x1, y1, stepX });
        }
        i += 1;
        x0 = x1;
        y0 = y1;
    }
    return spans;
}

const flatnessRatio = 0.05;
export function smoothPoints(iPoints: Iterable<Point>, tension: number): Span[] {
    const points = Array.isArray(iPoints) ? iPoints : Array.from(iPoints);
    if (points.length <= 1) return [];

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

    const spans: Span[] = [];
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

        spans.push({
            type: 'cubic',
            moveTo: i === 1,
            cp0x: prev.x,
            cp0y: prev.y,
            cp1x: prev.x + dcp1x,
            cp1y: prev.y + dcp1y,
            cp2x: cur.x - dcp2x,
            cp2y: cur.y - dcp2y,
            cp3x: cur.x,
            cp3y: cur.y,
        });
    }

    return spans;
}
