import type { InternalAgColorType, Point, SizedPoint } from 'ag-charts-core';
import { SpanJoin, isScaleValid, spanRange } from 'ag-charts-core';
import type { AgSeriesMarkerStyle, TextOrSegments } from 'ag-charts-types';

import type { NodeUpdateState } from '../../../motion/fromToMotion';
import type { Path } from '../../../scene/shape/path';
import type { Segment } from '../../../scene/shape/segmentedPath';
import type { SeriesNodeStyleContext } from '../series';
import type { SeriesNodeDatum } from '../seriesTypes';
import type { CartesianSeriesNodeDataContext, CartesianSeriesNodeDatum } from './cartesianSeries';
import { plotInterpolatedSpans, plotSpan } from './lineInterpolationPlotting';
import { CollapseMode, type SpanInterpolation, pairUpSpans } from './lineInterpolationUtil';
import {
    type LinePathSpan,
    type SpanAnimation,
    pointsEq,
    prepareLinePathPropertyAnimation,
    prepareLinePathStrokeAnimationFns,
} from './lineUtil';

export type AreaFillPathDatum = {
    readonly spans: LinePathSpan[];
    readonly phantomSpans: LinePathSpan[];
};

export type AreaStrokePathDatum = {
    readonly spans: LinePathSpan[];
};

export interface MarkerSelectionDatum extends CartesianSeriesNodeDatum {
    readonly itemId: string;
    readonly xValue: NonNullable<CartesianSeriesNodeDatum['xValue']>;
    readonly yValue: NonNullable<CartesianSeriesNodeDatum['yValue']>;
    readonly point: Readonly<SizedPoint>;
    readonly yKey: string;
    readonly fill?: InternalAgColorType;
    readonly stroke?: string;
    readonly strokeWidth: number;
    readonly cumulativeValue: number;
    readonly selected: boolean | undefined;
    style?: AgSeriesMarkerStyle;
}

export interface LabelSelectionDatum extends Readonly<Point>, SeriesNodeDatum<number> {
    readonly itemId: string;
    readonly labelText: TextOrSegments;
}

export interface AreaSeriesNodeDataContext
    extends CartesianSeriesNodeDataContext<MarkerSelectionDatum, LabelSelectionDatum> {
    fillData: AreaFillPathDatum;
    strokeData: AreaStrokePathDatum;
    stackVisible: boolean;
    crossFiltering: boolean;
    styles: SeriesNodeStyleContext<AgSeriesMarkerStyle>;
    segments?: Segment[];
}

export function plotAreaPathFill({ path }: Path, { spans, phantomSpans }: AreaFillPathDatum) {
    let phantomSpanIndex = 0;
    let sp = { x: Number.NaN, y: Number.NaN };
    let pp = { x: Number.NaN, y: Number.NaN };
    for (let i = 0; i < spans.length; i += 1) {
        const { span } = spans[i];
        const { span: phantomSpan } = phantomSpans[i];
        const { 0: sp0, 1: sp1 } = spanRange(span);
        const { 0: pp0, 1: pp1 } = spanRange(phantomSpan);
        if (pointsEq(sp, sp0) && pointsEq(pp, pp0)) {
            plotSpan(path, span, SpanJoin.Skip, false);
        } else {
            for (let j = i - 1; j >= phantomSpanIndex; j -= 1) {
                plotSpan(path, phantomSpans[j].span, SpanJoin.LineTo, true);
            }
            path.closePath();

            plotSpan(path, span, SpanJoin.MoveTo, false);

            phantomSpanIndex = i;
        }

        sp = sp1;
        pp = pp1;
    }

    for (let j = spans.length - 1; j >= phantomSpanIndex; j -= 1) {
        plotSpan(path, phantomSpans[j].span, SpanJoin.LineTo, true);
    }
    path.closePath();
}

export function plotInterpolatedAreaSeriesFillSpans(
    ratio: number,
    { path }: Path,
    spans: SpanInterpolation[],
    fillPhantomSpans: SpanInterpolation[]
) {
    for (let i = 0; i < spans.length; i += 1) {
        const span = spans[i];
        const reversedPhantomSpan = fillPhantomSpans[i];

        plotInterpolatedSpans(path, span.from, span.to, ratio, SpanJoin.MoveTo, false);
        plotInterpolatedSpans(path, reversedPhantomSpan.from, reversedPhantomSpan.to, ratio, SpanJoin.LineTo, true);
        path.closePath();
    }
}

export function prepareAreaFillAnimationFns(
    status: NodeUpdateState,
    spans: SpanAnimation,
    fillPhantomSpans: SpanAnimation,
    visibleToggleMode: 'fade' | 'none'
) {
    const removePhaseFn = (ratio: number, path: Path) =>
        plotInterpolatedAreaSeriesFillSpans(ratio, path, spans.removed, fillPhantomSpans.removed);
    const updatePhaseFn = (ratio: number, path: Path) =>
        plotInterpolatedAreaSeriesFillSpans(ratio, path, spans.moved, fillPhantomSpans.moved);
    const addPhaseFn = (ratio: number, path: Path) =>
        plotInterpolatedAreaSeriesFillSpans(ratio, path, spans.added, fillPhantomSpans.added);
    const pathProperties = prepareLinePathPropertyAnimation(status, visibleToggleMode);

    return { status, path: { addPhaseFn, updatePhaseFn, removePhaseFn }, pathProperties };
}

export function prepareAreaPathAnimation(newData: AreaSeriesNodeDataContext, oldData: AreaSeriesNodeDataContext) {
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

    const fillSpans = pairUpSpans(
        { scales: newData.scales, data: newData.fillData.spans },
        { scales: oldData.scales, data: oldData.fillData.spans },
        CollapseMode.Zero
    );
    if (fillSpans == null) return;
    const fillPhantomSpans = pairUpSpans(
        { scales: newData.scales, data: newData.fillData.phantomSpans },
        { scales: oldData.scales, data: oldData.fillData.phantomSpans },
        CollapseMode.Zero
    );
    if (fillPhantomSpans == null) return;
    const strokeSpans = pairUpSpans(
        {
            scales: newData.scales,
            data: newData.strokeData.spans,
            zeroData: newData.fillData.phantomSpans,
        },
        {
            scales: oldData.scales,
            data: oldData.strokeData.spans,
            zeroData: oldData.fillData.phantomSpans,
        },
        CollapseMode.Zero
    );
    if (strokeSpans == null) return;

    const fadeMode = 'none';
    const fill = prepareAreaFillAnimationFns(status, fillSpans, fillPhantomSpans, fadeMode);
    const stroke = prepareLinePathStrokeAnimationFns(status, strokeSpans, fadeMode);
    return { status, fill, stroke };
}
