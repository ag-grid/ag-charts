import type { NodeUpdateState } from '../../../motion/fromToMotion';
import type { Point, SizedPoint } from '../../../scene/point';
import type { Path } from '../../../scene/shape/path';
import type { SeriesNodeDatum } from '../seriesTypes';
import type { CartesianSeriesNodeDataContext, CartesianSeriesNodeDatum } from './cartesianSeries';
import { SpanJoin } from './lineInterpolation';
import { plotInterpolatedSpans, plotSpan } from './lineInterpolationPlotting';
import { CollapseMode, type SpanInterpolation, pairUpSpans } from './lineInterpolationUtil';
import {
    type LinePathSpan,
    type SpanAnimation,
    prepareLinePathPropertyAnimation,
    prepareLinePathStrokeAnimationFns,
} from './lineUtil';
import { isScaleValid } from './scaling';

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
    readonly point: Readonly<SizedPoint>;
    readonly yKey: string;
    readonly index: number;
    readonly fill?: string;
    readonly stroke?: string;
    readonly strokeWidth: number;
    readonly cumulativeValue: number;
    readonly selected: boolean | undefined;
}

export interface LabelSelectionDatum extends Readonly<Point>, SeriesNodeDatum {
    readonly index: number;
    readonly itemId: any;
    readonly labelText: string;
}

export interface AreaSeriesNodeDataContext
    extends CartesianSeriesNodeDataContext<MarkerSelectionDatum, LabelSelectionDatum> {
    fillData: AreaFillPathDatum;
    strokeData: AreaStrokePathDatum;
    stackVisible: boolean;
    crossFiltering: boolean;
}

export function plotAreaPathFill({ path }: Path, { spans, phantomSpans }: AreaFillPathDatum) {
    for (let i = 0; i < spans.length; i += 1) {
        const { span } = spans[i];
        const phantomSpan = phantomSpans[i].span;
        plotSpan(path, span, SpanJoin.MoveTo, false);
        plotSpan(path, phantomSpan, SpanJoin.LineTo, true);
        path.closePath();
    }
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
    const fillPhantomSpans = pairUpSpans(
        { scales: newData.scales, data: newData.fillData.phantomSpans },
        { scales: oldData.scales, data: oldData.fillData.phantomSpans },
        CollapseMode.Zero
    );
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

    const fadeMode = 'none';
    const fill = prepareAreaFillAnimationFns(status, fillSpans, fillPhantomSpans, fadeMode);
    const stroke = prepareLinePathStrokeAnimationFns(status, strokeSpans, fadeMode);
    return { status, fill, stroke };
}
