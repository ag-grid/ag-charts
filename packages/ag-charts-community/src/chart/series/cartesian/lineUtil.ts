import type { InterpolationProperties, Point, Span } from 'ag-charts-core';
import {
    SpanJoin,
    areScalingEqual,
    isScaleValid,
    linearPoints,
    smoothPoints,
    spanRange,
    stepPoints,
} from 'ag-charts-core';
import type { AgSeriesMarkerStyle, TextOrSegments } from 'ag-charts-types';

import { type FromToFns, NODE_UPDATE_STATE_TO_PHASE_MAPPING, type NodeUpdateState } from '../../../motion/fromToMotion';
import type { Path } from '../../../scene/shape/path';
import type { Segment } from '../../../scene/shape/segmentedPath';
import type { ProcessedOutputDiff } from '../../data/dataModel';
import type { SeriesNodeStyleContext } from '../series';
import type { ErrorBoundSeriesNodeDatum } from '../seriesTypes';
import type {
    CartesianMarkerLikeContext,
    CartesianSeriesNodeDataContext,
    CartesianSeriesNodeDatum,
} from './cartesianSeriesTypes';
import { interpolatedSpanRange, plotInterpolatedSpans, plotSpan } from './lineInterpolationPlotting';
import { CollapseMode, type SpanInterpolation, pairUpSpans } from './lineInterpolationUtil';

export interface LinePathSpan {
    span: Span;
    xValue0: any;
    yValue0: any;
    xValue1: any;
    yValue1: any;
}

export interface LineStrokePathDatum {
    readonly spans: LinePathSpan[];
    readonly itemId: string;
}

export interface SpanAnimation {
    added: SpanInterpolation[];
    moved: SpanInterpolation[];
    removed: SpanInterpolation[];
}

export interface LineSpanPointDatum {
    point: Point;
    xDatum: any;
    yDatum: any;
}

export interface LineNodeDatum extends CartesianSeriesNodeDatum, ErrorBoundSeriesNodeDatum {
    readonly itemId?: never;
    readonly xValue: NonNullable<CartesianSeriesNodeDatum['xValue']>;
    readonly yValue: NonNullable<CartesianSeriesNodeDatum['yValue']>;
    readonly point: NonNullable<CartesianSeriesNodeDatum['point']>;
    readonly labelText?: TextOrSegments;
    readonly selected: boolean | undefined;
    style?: AgSeriesMarkerStyle;
}

export interface LineSeriesNodeDataContext extends CartesianSeriesNodeDataContext<LineNodeDatum> {
    strokeData: LineStrokePathDatum;
    crossFiltering: boolean;
    styles: SeriesNodeStyleContext<AgSeriesMarkerStyle>;
    segments?: Segment[];
}

/**
 * Context object for efficient node datum creation.
 * Caches expensive-to-compute values that are reused across all datum iterations
 * to minimize memory allocations. Only caches values that are expensive to
 * compute - cheap property lookups use `this` directly in methods.
 *
 * Extends CartesianMarkerLikeContext to satisfy the template method pattern.
 */
export interface LineSeriesDatumContext extends CartesianMarkerLikeContext<LineNodeDatum> {
    // Override yKey to be required (base interface has it optional)
    readonly yKey: string;

    // Additional data arrays specific to line series
    readonly yRawValues: any[];
    readonly yCumulativeValues: any[];
    readonly selectionValues: any[] | undefined;

    // Pre-computed values (computed once, reused for all datums)
    readonly size: number;
    readonly yDomain: any[];
    readonly labelsEnabled: boolean;
    readonly dataAggregationFilter: { indices: Uint32Array } | undefined;
    readonly range: number;

    // Property lookups (constant across all datums - worth caching)
    readonly legendItemName: string | undefined;
    readonly connectMissingData: boolean;

    // Cap defaults for error bounds
    readonly capDefaults: { lengthRatioMultiplier: number; lengthMax: number };

    // Mutable working state (arrays and counters that change during node creation)
    spanPoints: Array<LineSpanPointDatum[] | { skip: number }>;
}

/**
 * Scratch object for temporary datum state during node creation.
 * Reused across iterations to avoid per-datum allocations.
 */
export interface LineNodeDatumScratch {
    datum: any;
    xDatum: any;
    yDatum: any;
    yCumulative: number;
    selected: boolean | undefined;
    x: number;
    y: number;
}

export function interpolatePoints(
    points: LineSpanPointDatum[],
    interpolation: InterpolationProperties
): LinePathSpan[] {
    const pointsIter = points.map((point) => point.point);
    let spans: Span[] = linearPoints(pointsIter);
    switch (interpolation.type) {
        case 'linear':
            break;
        case 'smooth':
            spans = smoothPoints(pointsIter, interpolation.tension);
            break;
        case 'step':
            spans = stepPoints(pointsIter, interpolation.position);
            break;
    }
    return spans.map(function spanToLinePathSpan(span, i) {
        return {
            span,
            xValue0: points[i].xDatum,
            yValue0: points[i].yDatum,
            xValue1: points[i + 1].xDatum,
            yValue1: points[i + 1].yDatum,
        };
    });
}

export function pointsEq(a: Point, b: Point, delta = 1e-3) {
    return Math.abs(a.x - b.x) < delta && Math.abs(a.y - b.y) < delta;
}

export function plotLinePathStroke({ path }: Path, spans: LinePathSpan[]) {
    let lastPoint: Point | undefined;
    for (const { span } of spans) {
        const [start, end] = spanRange(span);
        const join = lastPoint != null && pointsEq(lastPoint, start) ? SpanJoin.Skip : SpanJoin.MoveTo;
        plotSpan(path, span, join, false);
        lastPoint = end;
    }
}

export function plotInterpolatedLinePathStroke(ratio: number, path: Path, spans: SpanInterpolation[]) {
    let lastPoint: Point | undefined;
    for (const span of spans) {
        const [start, end] = interpolatedSpanRange(span.from, span.to, ratio);
        const join = lastPoint != null && pointsEq(lastPoint, start) ? SpanJoin.Skip : SpanJoin.MoveTo;
        plotInterpolatedSpans(path.path, span.from, span.to, ratio, join, false);
        lastPoint = end;
    }
}

export function prepareLinePathStrokeAnimationFns(
    status: NodeUpdateState,
    spans: SpanAnimation,
    visibleToggleMode: 'fade' | 'none',
    targetOpacity: number = 1
) {
    const removePhaseFn = (ratio: number, path: Path) => plotInterpolatedLinePathStroke(ratio, path, spans.removed);
    const updatePhaseFn = (ratio: number, path: Path) => plotInterpolatedLinePathStroke(ratio, path, spans.moved);
    const addPhaseFn = (ratio: number, path: Path) => plotInterpolatedLinePathStroke(ratio, path, spans.added);
    const pathProperties = prepareLinePathPropertyAnimation(status, visibleToggleMode, targetOpacity);

    return { status, path: { addPhaseFn, updatePhaseFn, removePhaseFn }, pathProperties };
}

interface PathAnimation {
    phase: 'none' | 'initial' | 'remove' | 'update' | 'add' | 'trailing' | 'end';
    segments?: Array<unknown>;
    start?: { visible: boolean };
    finish?: { visible: boolean };
}

export function prepareLinePathPropertyAnimation(
    status: NodeUpdateState,
    visibleToggleMode: 'fade' | 'none',
    targetOpacity: number = 1
): FromToFns<Path, any, unknown> {
    const phase: NodeUpdateState = visibleToggleMode === 'none' ? 'updated' : status;

    const result = {
        fromFn(path: Path, datum: any) {
            const out: PathAnimation = { phase: NODE_UPDATE_STATE_TO_PHASE_MAPPING[phase] };

            const segments = path.previousDatum ?? datum;
            if (segments != null) {
                out.segments = segments;
            }

            if (status === 'removed') {
                out.finish = { visible: false };
            } else if (status === 'added') {
                out.start = { visible: true };
            }

            return out;
        },
        toFn(_path: Path, datum: any) {
            const out: PathAnimation = { phase: NODE_UPDATE_STATE_TO_PHASE_MAPPING[phase] };

            const segments = datum;
            if (segments != null) {
                out.segments = segments;
            }

            return out;
        },
    };

    if (visibleToggleMode === 'fade') {
        return {
            fromFn(path: Path, datum) {
                const opacity = status === 'added' ? 0 : targetOpacity;
                const segments = status === 'removed' ? path.previousDatum ?? datum : datum;
                return { ...result.fromFn(path, datum), opacity, segments };
            },
            toFn(path: Path, datum) {
                const opacity = status === 'removed' ? 0 : targetOpacity;
                const segments = status === 'removed' ? path.previousDatum ?? datum : datum;
                return { ...result.toFn(path, datum), opacity, segments };
            },
        };
    }

    return result;
}

export function prepareLinePathAnimation(
    newData: LineSeriesNodeDataContext,
    oldData: LineSeriesNodeDataContext,
    diff: ProcessedOutputDiff | undefined,
    targetOpacity: number = 1
) {
    const isCategoryBased = newData.scales.x?.type === 'category';
    const wasCategoryBased = oldData.scales.x?.type === 'category';
    if (isCategoryBased !== wasCategoryBased || !isScaleValid(newData.scales.x) || !isScaleValid(oldData.scales.x)) {
        // Not comparable.
        return;
    }
    if (newData.strokeData == null || oldData.strokeData == null) {
        // Line drawing fast-path - not animatable
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
    if (strokeSpans == null) return;

    const stroke = prepareLinePathStrokeAnimationFns(status, strokeSpans, 'fade', targetOpacity);

    const hasMotion =
        (diff?.changed ?? true) ||
        !areScalingEqual(newData.scales.x, oldData.scales.x) ||
        !areScalingEqual(newData.scales.y, oldData.scales.y) ||
        status !== 'updated';

    return { status, stroke, hasMotion };
}
