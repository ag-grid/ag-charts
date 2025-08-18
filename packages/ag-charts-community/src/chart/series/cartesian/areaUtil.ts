import type { InternalAgColorType, Point } from 'ag-charts-core';
import type { AgSeriesMarkerStyle, AgSeriesSegment } from 'ag-charts-types';

import type { NodeUpdateState } from '../../../motion/fromToMotion';
import { BBox } from '../../../scene/bbox';
import type { SizedPoint } from '../../../scene/point';
import type { Path } from '../../../scene/shape/path';
import type { Segment } from '../../../scene/shape/segmentedPath';
import { findRangeExtent } from '../../../util/number';
import type { ChartAxisDirection } from '../../chartAxisDirection';
import type { SeriesNodeStyleContext } from '../series';
import type { SeriesNodeDatum } from '../seriesTypes';
import type { CartesianSeriesNodeDataContext, CartesianSeriesNodeDatum } from './cartesianSeries';
import { SpanJoin, spanRange } from './lineInterpolation';
import { plotInterpolatedSpans, plotSpan } from './lineInterpolationPlotting';
import { CollapseMode, type SpanInterpolation, pairUpSpans } from './lineInterpolationUtil';
import {
    type LinePathSpan,
    type SpanAnimation,
    pointsEq,
    prepareLinePathPropertyAnimation,
    prepareLinePathStrokeAnimationFns,
} from './lineUtil';
import { type Scaling, isScaleValid } from './scaling';

export type AreaFillPathDatum = {
    readonly spans: LinePathSpan[];
    readonly phantomSpans: LinePathSpan[];
    readonly itemId: string;
};

export type AreaStrokePathDatum = {
    readonly spans: LinePathSpan[];
    readonly itemId: string;
};

export interface MarkerSelectionDatum extends CartesianSeriesNodeDatum {
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
    readonly itemId: any;
    readonly labelText: string;
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
    let sp = { x: NaN, y: NaN };
    let pp = { x: NaN, y: NaN };
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

export function calculateSegments(segmentation: AgSeriesSegment, scales: { [key in ChartAxisDirection]?: Scaling }) {
    const { key } = segmentation;

    const yScale = scales['y'];
    const xScale = scales['x'];

    if (!yScale || !xScale) {
        return;
    }

    const seriesHeight = findRangeExtent(yScale.range);
    const seriesWidth = findRangeExtent(xScale.range);

    const isXDirection = key === 'x';
    const scale = isXDirection ? xScale : yScale;

    return calculateStopStart(segmentation, scale).map(({ stop, start, ...style }) => {
        let x = isXDirection ? scale.convert(start) : 0;
        let y = isXDirection ? 0 : scale.convert(start);
        let width = isXDirection ? scale.convert(stop) - x : seriesWidth;
        let height = isXDirection ? seriesHeight : scale.convert(stop) - y;

        if (width < 0) {
            x += width;
            width = -width;
        }
        if (height < 0) {
            y += height;
            height = -height;
        }

        return { clipRect: new BBox(x, y, width, height), ...style };
    });
}

function calculateStopStart(segmentation: AgSeriesSegment, scale: Scaling) {
    const domainStart = scale.domain[0];
    const domainEnd = scale.domain.at(-1);

    return segmentation.segments.map((segment) => {
        const { start = domainStart, stop = domainEnd, ...styles } = segment;

        return { ...styles, stop, start };
    });
}
