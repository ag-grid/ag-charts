import type { FontStyle, FontWeight } from 'ag-charts-types';

import type { NodeUpdateState } from '../../../motion/fromToMotion';
import type { Point, SizedPoint } from '../../../scene/point';
import type { Path } from '../../../scene/shape/path';
import type { SeriesNodeDatum } from '../seriesTypes';
import type { CartesianSeriesNodeDataContext, CartesianSeriesNodeDatum } from './cartesianSeries';
import { type Span, SpanJoin } from './lineInterpolation';
import { plotInterpolatedSpans } from './lineInterpolationPlotting';
import { type SpanInterpolation, pairUpSpans } from './lineInterpolationUtil';
import { prepareLinePathPropertyAnimation } from './lineUtil';
import { isScaleValid } from './scaling';

export interface AreaPathPoint {
    point: {
        x: number;
        y: number;
        moveTo: boolean;
    };
    size?: number;
    xValue?: string | number;
    yValue?: number;
    itemId?: string;
}

export type AreaPathSpan = {
    span: Span;
    xValue0: any;
    yValue0: any;
    xValue1: any;
    yValue1: any;
};

export type AreaFillPathDatum = {
    readonly spans: AreaPathSpan[];
    readonly phantomSpans: AreaPathSpan[];
    readonly itemId: string;
};

export type AreaStrokePathDatum = {
    readonly spans: AreaPathSpan[];
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
    readonly label?: {
        readonly text: string;
        readonly fontStyle?: FontStyle;
        readonly fontWeight?: FontWeight;
        readonly fontSize: number;
        readonly fontFamily: string;
        readonly textAlign: CanvasTextAlign;
        readonly textBaseline: CanvasTextBaseline;
        readonly fill?: string;
    };
}

export interface AreaSeriesNodeDataContext
    extends CartesianSeriesNodeDataContext<MarkerSelectionDatum, LabelSelectionDatum> {
    fillData: AreaFillPathDatum;
    strokeData: AreaStrokePathDatum;
    stackVisible: boolean;
    crossFiltering: boolean;
}

interface SpanAnimation {
    added: SpanInterpolation[];
    moved: SpanInterpolation[];
    removed: SpanInterpolation[];
}

function plotFillSpans(ratio: number, path: Path, spans: SpanInterpolation[], fillPhantomSpans: SpanInterpolation[]) {
    for (let i = 0; i < spans.length; i += 1) {
        const span = spans[i];
        const reversedPhantomSpan = fillPhantomSpans[i];

        plotInterpolatedSpans(path.path, span.from, span.to, ratio, SpanJoin.MoveTo, false);
        plotInterpolatedSpans(
            path.path,
            reversedPhantomSpan.from,
            reversedPhantomSpan.to,
            ratio,
            SpanJoin.LineTo,
            true
        );
        path.path.closePath();
    }
}

function prepareAreaFillAnimationFns(
    status: NodeUpdateState,
    spans: SpanAnimation,
    fillPhantomSpans: SpanAnimation,
    visibleToggleMode: 'fade' | 'none'
) {
    const removePhaseFn = (ratio: number, path: Path) =>
        plotFillSpans(ratio, path, spans.removed, fillPhantomSpans.removed);
    const updatePhaseFn = (ratio: number, path: Path) =>
        plotFillSpans(ratio, path, spans.moved, fillPhantomSpans.moved);
    const addPhaseFn = (ratio: number, path: Path) => plotFillSpans(ratio, path, spans.added, fillPhantomSpans.added);
    const pathProperties = prepareLinePathPropertyAnimation(status, visibleToggleMode);

    return { status, path: { addPhaseFn, updatePhaseFn, removePhaseFn }, pathProperties };
}

function plotStrokeSpans(ratio: number, path: Path, spans: SpanInterpolation[]) {
    for (const span of spans) {
        plotInterpolatedSpans(path.path, span.from, span.to, ratio, SpanJoin.MoveTo, false);
    }
}

function prepareAreaStrokeAnimationFns(
    status: NodeUpdateState,
    spans: SpanAnimation,
    visibleToggleMode: 'fade' | 'none'
) {
    const removePhaseFn = (ratio: number, path: Path) => plotStrokeSpans(ratio, path, spans.removed);
    const updatePhaseFn = (ratio: number, path: Path) => plotStrokeSpans(ratio, path, spans.moved);
    const addPhaseFn = (ratio: number, path: Path) => plotStrokeSpans(ratio, path, spans.added);
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
        { scales: newData.scales, data: newData.fillData.spans, visible: newData.visible },
        { scales: oldData.scales, data: oldData.fillData.spans, visible: oldData.visible }
    );
    const fillPhantomSpans = pairUpSpans(
        { scales: newData.scales, data: newData.fillData.phantomSpans, visible: newData.visible },
        { scales: oldData.scales, data: oldData.fillData.phantomSpans, visible: oldData.visible }
    );
    const strokeSpans = pairUpSpans(
        { scales: newData.scales, data: newData.strokeData.spans, visible: newData.visible },
        { scales: oldData.scales, data: oldData.strokeData.spans, visible: oldData.visible }
    );

    const fadeMode = 'none';
    const fill = prepareAreaFillAnimationFns(status, fillSpans, fillPhantomSpans, fadeMode);
    const stroke = prepareAreaStrokeAnimationFns(status, strokeSpans, fadeMode);
    return { status, fill, stroke };
}
