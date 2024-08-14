import type { ExtendedPath2D } from '../../../scene/extendedPath2D';
import { solveBezier, splitBezier } from '../../../scene/util/bezier';
import { type CubicSpan, type LinearSpan, type Span, SpanJoin, type StepSpan, spanRange } from './lineInterpolation';

type SpanSupertype = {
    leftCp1x: number;
    leftCp1y: number;
    leftCp2x: number;
    leftCp2y: number;
    stepX: number;
    stepY0: number;
    stepY1: number;
    rightCp1x: number;
    rightCp1y: number;
    rightCp2x: number;
    rightCp2y: number;
};

function lerp(a: number, b: number, ratio: number) {
    return (b - a) * ratio + a;
}

function linearSupertype(span: LinearSpan, stepX: number): SpanSupertype {
    const { x0, y0, x1, y1 } = span;
    const m = (y1 - y0) / (x1 - x0);
    const stepY = m * (stepX - x0) + y0;
    return {
        leftCp1x: x0,
        leftCp1y: y0,
        leftCp2x: stepX,
        leftCp2y: stepY,
        stepX,
        stepY0: stepY,
        stepY1: stepY,
        rightCp1x: stepX,
        rightCp1y: stepY,
        rightCp2x: x1,
        rightCp2y: y1,
    };
}

function bezierSupertype(span: CubicSpan, stepX: number): SpanSupertype {
    const { cp0x, cp0y, cp1x, cp1y, cp2x, cp2y, cp3x, cp3y } = span;
    const t = solveBezier(cp0x, cp1x, cp2x, cp3x, stepX);
    const [left, right] = splitBezier(cp0x, cp0y, cp1x, cp1y, cp2x, cp2y, cp3x, cp3y, t);
    const stepY = left[3].y;
    return {
        leftCp1x: left[1].x,
        leftCp1y: left[1].y,
        leftCp2x: left[2].x,
        leftCp2y: left[2].y,
        stepX,
        stepY0: stepY,
        stepY1: stepY,
        rightCp1x: right[1].x,
        rightCp1y: right[1].y,
        rightCp2x: right[2].x,
        rightCp2y: right[2].y,
    };
}

function stepSupertype(span: StepSpan): SpanSupertype {
    const { x0, y0, x1, y1, stepX } = span;
    return {
        leftCp1x: (x0 + stepX) / 2,
        leftCp1y: y0,
        leftCp2x: (x0 + stepX) / 2,
        leftCp2y: y0,
        stepX,
        stepY0: y0,
        stepY1: y1,
        rightCp1x: (stepX + x1) / 2,
        rightCp1y: y1,
        rightCp2x: (stepX + x1) / 2,
        rightCp2y: y1,
    };
}

function spanSupertype(span: Span, stepX: number): SpanSupertype {
    if (span.type === 'linear') {
        return linearSupertype(span, stepX);
    } else if (span.type === 'cubic') {
        return bezierSupertype(span, stepX);
    } else {
        return stepSupertype(span);
    }
}

function plotStart(
    path: ExtendedPath2D,
    moveTo: SpanJoin,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    reversed: boolean
) {
    switch (moveTo) {
        case SpanJoin.MoveTo:
            if (reversed) {
                path.moveTo(x1, y1);
            } else {
                path.moveTo(x0, y0);
            }
            break;
        case SpanJoin.LineTo:
            if (reversed) {
                path.lineTo(x1, y1);
            } else {
                path.lineTo(x0, y0);
            }
            break;
    }
}

function plotLinear(path: ExtendedPath2D, x0: number, y0: number, x1: number, y1: number, reversed: boolean) {
    if (reversed) {
        path.lineTo(x0, y0);
    } else {
        path.lineTo(x1, y1);
    }
}

function plotCubic(
    path: ExtendedPath2D,
    cp0x: number,
    cp0y: number,
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    cp3x: number,
    cp3y: number,
    reversed: boolean
) {
    if (reversed) {
        path.cubicCurveTo(cp2x, cp2y, cp1x, cp1y, cp0x, cp0y);
    } else {
        path.cubicCurveTo(cp1x, cp1y, cp2x, cp2y, cp3x, cp3y);
    }
}

function plotStep(
    path: ExtendedPath2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    stepX: number,
    reversed: boolean
) {
    if (reversed) {
        path.lineTo(stepX, y1);
        path.lineTo(stepX, y0);
        path.lineTo(x0, y0);
    } else {
        path.lineTo(stepX, y0);
        path.lineTo(stepX, y1);
        path.lineTo(x1, y1);
    }
}

export function plotSpan(path: ExtendedPath2D, span: Span, moveTo: SpanJoin, reversed: boolean) {
    const [start, end] = spanRange(span);

    plotStart(path, moveTo, start.x, start.y, end.x, end.y, reversed);

    switch (span.type) {
        case 'linear':
            plotLinear(path, span.x0, span.y0, span.x1, span.y1, reversed);
            break;
        case 'cubic':
            plotCubic(
                path,
                span.cp0x,
                span.cp0y,
                span.cp1x,
                span.cp1y,
                span.cp2x,
                span.cp2y,
                span.cp3x,
                span.cp3y,
                reversed
            );
            break;
        case 'step':
            plotStep(path, span.x0, span.y0, span.x1, span.y1, span.stepX, reversed);
            break;
    }
}

export function plotInterpolatedSpans(
    path: ExtendedPath2D,
    a: Span,
    b: Span,
    ratio: number,
    moveTo: SpanJoin,
    reversed: boolean
) {
    const [aStart, aEnd] = spanRange(a);
    const [bStart, bEnd] = spanRange(b);
    const x0 = lerp(aStart.x, bStart.x, ratio);
    const y0 = lerp(aStart.y, bStart.y, ratio);
    const x1 = lerp(aEnd.x, bEnd.x, ratio);
    const y1 = lerp(aEnd.y, bEnd.y, ratio);
    plotStart(path, moveTo, x0, y0, x1, y1, reversed);

    if (a.type === 'cubic' && b.type === 'cubic') {
        const cp1x = lerp(a.cp1x, b.cp1x, ratio);
        const cp1y = lerp(a.cp1y, b.cp1y, ratio);
        const cp2x = lerp(a.cp2x, b.cp2x, ratio);
        const cp2y = lerp(a.cp2y, b.cp2y, ratio);
        plotCubic(path, x0, y0, cp1x, cp1y, cp2x, cp2y, x1, y1, reversed);
    } else if (a.type === 'step' && b.type === 'step') {
        const stepX = lerp(a.stepX, b.stepX, ratio);
        plotStep(path, x0, y0, x1, y1, stepX, reversed);
    } else if (a.type === 'linear' && b.type === 'linear') {
        plotLinear(path, x0, y0, x1, y1, reversed);
    } else {
        let defaultStepX: number;
        if (a.type === 'step') {
            defaultStepX = a.stepX;
        } else if (b.type === 'step') {
            defaultStepX = b.stepX;
        } else {
            defaultStepX = (x0 + x1) / 2;
        }

        const as = spanSupertype(a, defaultStepX);
        const bs = spanSupertype(b, defaultStepX);

        const leftCp1x = lerp(as.leftCp1x, bs.leftCp1x, ratio);
        const leftCp1y = lerp(as.leftCp1y, bs.leftCp1y, ratio);
        const leftCp2x = lerp(as.leftCp2x, bs.leftCp2x, ratio);
        const leftCp2y = lerp(as.leftCp2y, bs.leftCp2y, ratio);
        const stepX = lerp(as.stepX, bs.stepX, ratio);
        const stepY0 = lerp(as.stepY0, bs.stepY0, ratio);
        const stepY1 = lerp(as.stepY1, bs.stepY1, ratio);
        const rightCp1x = lerp(as.rightCp1x, bs.rightCp1x, ratio);
        const rightCp1y = lerp(as.rightCp1y, bs.rightCp1y, ratio);
        const rightCp2x = lerp(as.rightCp2x, bs.rightCp2x, ratio);
        const rightCp2y = lerp(as.rightCp2y, bs.rightCp2y, ratio);

        if (reversed) {
            path.cubicCurveTo(rightCp2x, rightCp2y, rightCp1x, rightCp1y, stepX, stepY1);
            path.lineTo(stepX, stepY0);
            path.cubicCurveTo(leftCp2x, leftCp2y, leftCp1x, leftCp1y, x0, y0);
        } else {
            path.cubicCurveTo(leftCp1x, leftCp1y, leftCp2x, leftCp2y, stepX, stepY0);
            path.lineTo(stepX, stepY1);
            path.cubicCurveTo(rightCp1x, rightCp1y, rightCp2x, rightCp2y, x1, y1);
        }
    }
}
