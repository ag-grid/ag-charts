import { type FromToFns, NODE_UPDATE_STATE_TO_PHASE_MAPPING, type NodeUpdateState } from '../../../motion/fromToMotion';
import type { Point } from '../../../scene/point';
import type { Path } from '../../../scene/shape/path';
import type { ProcessedOutputDiff } from '../../data/dataModel';
import type { ErrorBoundSeriesNodeDatum } from '../seriesTypes';
import type { CartesianSeriesNodeDataContext, CartesianSeriesNodeDatum } from './cartesianSeries';
import type { InterpolationProperties } from './interpolationProperties';
import { type Span, SpanJoin, linearPoints, smoothPoints, spanRange, stepPoints } from './lineInterpolation';
import { interpolatedSpanRange, plotInterpolatedSpans, plotSpan } from './lineInterpolationPlotting';
import { CollapseMode, type SpanInterpolation, pairUpSpans } from './lineInterpolationUtil';
import { areScalingEqual, isScaleValid } from './scaling';

export type LinePathSpan = {
    span: Span;
    xValue0: any;
    yValue0: any;
    xValue1: any;
    yValue1: any;
};

export type LineStrokePathDatum = {
    readonly spans: LinePathSpan[];
    readonly itemId: string;
};

export interface SpanAnimation {
    added: SpanInterpolation[];
    moved: SpanInterpolation[];
    removed: SpanInterpolation[];
}

export type LineSpanPointDatum = {
    point: Point;
    xDatum: any;
    yDatum: any;
};

export interface LineNodeDatum extends CartesianSeriesNodeDatum, ErrorBoundSeriesNodeDatum {
    readonly point: NonNullable<CartesianSeriesNodeDatum['point']>;
    readonly labelText?: string;
    readonly selected: boolean | undefined;
}

export interface LineSeriesNodeDataContext extends CartesianSeriesNodeDataContext<LineNodeDatum> {
    strokeData: LineStrokePathDatum;
    crossFiltering: boolean;
}

export function interpolatePoints(
    points: LineSpanPointDatum[],
    interpolation: InterpolationProperties
): LinePathSpan[] {
    let spans: Span[];
    const pointsIter = points.map((point) => point.point);
    switch (interpolation.type) {
        case 'linear':
            spans = linearPoints(pointsIter);
            break;
        case 'smooth':
            spans = smoothPoints(pointsIter, interpolation.tension);
            break;
        case 'step':
            spans = stepPoints(pointsIter, interpolation.position);
            break;
    }
    return spans.map((span, i) => ({
        span,
        xValue0: points[i].xDatum,
        yValue0: points[i].yDatum,
        xValue1: points[i + 1].xDatum,
        yValue1: points[i + 1].yDatum,
    }));
}

function pointsEq(a: Point, b: Point, delta = 1e-3) {
    return Math.abs(a.x - b.x) < delta && Math.abs(a.y - b.y) < delta;
}

export function plotStroke(path: Path, spans: LinePathSpan[]) {
    let lastPoint: Point | undefined;
    for (const { span } of spans) {
        const [start, end] = spanRange(span);
        const join = lastPoint != null && pointsEq(lastPoint, start) ? SpanJoin.LineTo : SpanJoin.MoveTo;
        plotSpan(path.path, span, join, false);
        lastPoint = end;
    }
}

export function plotInterpolatedStroke(ratio: number, path: Path, spans: SpanInterpolation[]) {
    let lastPoint: Point | undefined;
    for (const span of spans) {
        const [start, end] = interpolatedSpanRange(span.from, span.to, ratio);
        const join = lastPoint != null && pointsEq(lastPoint, start) ? SpanJoin.LineTo : SpanJoin.MoveTo;
        plotInterpolatedSpans(path.path, span.from, span.to, ratio, join, false);
        lastPoint = end;
    }
}

export function prepareStrokeAnimationFns(
    status: NodeUpdateState,
    spans: SpanAnimation,
    visibleToggleMode: 'fade' | 'none'
) {
    const removePhaseFn = (ratio: number, path: Path) => plotInterpolatedStroke(ratio, path, spans.removed);
    const updatePhaseFn = (ratio: number, path: Path) => plotInterpolatedStroke(ratio, path, spans.moved);
    const addPhaseFn = (ratio: number, path: Path) => plotInterpolatedStroke(ratio, path, spans.added);
    const pathProperties = prepareLinePathPropertyAnimation(status, visibleToggleMode);

    return { status, path: { addPhaseFn, updatePhaseFn, removePhaseFn }, pathProperties };
}

export function prepareLinePathPropertyAnimation(
    status: NodeUpdateState,
    visibleToggleMode: 'fade' | 'none'
): FromToFns<Path, any, unknown> {
    const phase: NodeUpdateState = visibleToggleMode === 'none' ? 'updated' : status;

    const result = {
        fromFn: (_path: Path) => {
            let mixin;
            if (status === 'removed') {
                mixin = { finish: { visible: false } };
            } else if (status === 'added') {
                mixin = { start: { visible: true } };
            } else {
                mixin = {};
            }
            return { phase: NODE_UPDATE_STATE_TO_PHASE_MAPPING[phase], ...mixin };
        },
        toFn: (_path: Path) => {
            return { phase: NODE_UPDATE_STATE_TO_PHASE_MAPPING[phase] };
        },
    };

    if (visibleToggleMode === 'fade') {
        return {
            fromFn: (path: Path) => {
                const opacity = status === 'added' ? 0 : path.opacity;
                return { opacity, ...result.fromFn(path) };
            },
            toFn: (path: Path) => {
                const opacity = status === 'removed' ? 0 : 1;
                return { opacity, ...result.toFn(path) };
            },
        };
    }

    return result;
}

export function prepareLinePathAnimation(
    newData: LineSeriesNodeDataContext,
    oldData: LineSeriesNodeDataContext,
    diff: ProcessedOutputDiff | undefined
) {
    const isCategoryBased = newData.scales.x?.type === 'category';
    const wasCategoryBased = oldData.scales.x?.type === 'category';
    if (isCategoryBased !== wasCategoryBased || !isScaleValid(newData.scales.x) || !isScaleValid(oldData.scales.x)) {
        // Not comparable.
        return;
    }
    let status: NodeUpdateState = 'updated' as NodeUpdateState;
    if (oldData.visible && !newData.visible) {
        status = 'removed';
    } else if (!oldData.visible && newData.visible) {
        status = 'added';
    }

    const strokeSpans = pairUpSpans(
        { scales: newData.scales, data: newData.strokeData.spans },
        { scales: oldData.scales, data: oldData.strokeData.spans },
        CollapseMode.Split
    );

    const stroke = prepareStrokeAnimationFns(status, strokeSpans, 'fade');

    const hasMotion =
        (diff?.changed ?? true) ||
        !areScalingEqual(newData.scales.x, oldData.scales.x) ||
        !areScalingEqual(newData.scales.y, oldData.scales.y) ||
        status !== 'updated';

    return { status, stroke, hasMotion };
}
