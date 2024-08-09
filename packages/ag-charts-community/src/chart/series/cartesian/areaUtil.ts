import type { FontStyle, FontWeight } from 'ag-charts-types';

import type { NodeUpdateState } from '../../../motion/fromToMotion';
import type { Point, SizedPoint } from '../../../scene/point';
import type { Path } from '../../../scene/shape/path';
import type { ProcessedOutputDiff } from '../../data/dataModel';
import type { SeriesNodeDatum } from '../seriesTypes';
import type { CartesianSeriesNodeDataContext, CartesianSeriesNodeDatum } from './cartesianSeries';
import { type Span, SpanJoin, interpolateSpans, plotSpan, reverseSpan } from './lineInterpolation';
import { type SpanInterpolation, SplitMode, pairUpSpans } from './lineInterpolationUtil';
import { pairCategoryData, pairContinuousData, prepareLinePathPropertyAnimation } from './lineUtil';
import { prepareMarkerAnimation } from './markerUtil';
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
}

interface SpanAnimation {
    added: SpanInterpolation[];
    moved: SpanInterpolation[];
    removed: SpanInterpolation[];
}

function plotFillSpans(ratio: number, path: Path, spans: SpanInterpolation[], phantomSpans: SpanInterpolation[]) {
    for (let i = 0; i < spans.length; i += 1) {
        const span = spans[i];
        const phantomSpan = phantomSpans[i];

        plotSpan(path.path, interpolateSpans(span.from, span.to, ratio), SpanJoin.MoveTo);
        plotSpan(path.path, reverseSpan(interpolateSpans(phantomSpan.from, phantomSpan.to, ratio)), SpanJoin.LineTo);
        path.path.closePath();
    }
}

function prepareAreaFillAnimationFns(
    status: NodeUpdateState,
    spans: SpanAnimation,
    phantomSpans: SpanAnimation,
    visibleToggleMode: 'fade' | 'none'
) {
    const removePhaseFn = (ratio: number, path: Path) =>
        plotFillSpans(ratio, path, spans.removed, phantomSpans.removed);
    const updatePhaseFn = (ratio: number, path: Path) => plotFillSpans(ratio, path, spans.moved, phantomSpans.moved);
    const addPhaseFn = (ratio: number, path: Path) => plotFillSpans(ratio, path, spans.added, phantomSpans.added);
    const pathProperties = prepareLinePathPropertyAnimation(status, visibleToggleMode);

    return { status, path: { addPhaseFn, updatePhaseFn, removePhaseFn }, pathProperties };
}

function plotStrokeSpans(ratio: number, path: Path, spans: SpanInterpolation[]) {
    for (const span of spans) {
        plotSpan(path.path, interpolateSpans(span.from, span.to, ratio));
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

export function prepareAreaPathAnimation(
    newData: AreaSeriesNodeDataContext,
    oldData: AreaSeriesNodeDataContext,
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

    const spans = pairUpSpans(
        { scales: newData.scales, data: newData.fillData.spans, visible: newData.visible },
        { scales: oldData.scales, data: oldData.fillData.spans, visible: oldData.visible },
        SplitMode.Zero
    );
    const phantomSpans = pairUpSpans(
        { scales: newData.scales, data: newData.fillData.phantomSpans, visible: newData.visible },
        { scales: oldData.scales, data: oldData.fillData.phantomSpans, visible: oldData.visible },
        SplitMode.Zero
    );
    const prepareMarkerPairs = () => {
        if (isCategoryBased) {
            return pairCategoryData(newData, oldData, diff, { backfillSplitMode: 'static', multiDatum: true });
        }
        return pairContinuousData(newData, oldData, { backfillSplitMode: 'static' });
    };
    const { resultMap: markerPairMap } = prepareMarkerPairs();
    if (markerPairMap === undefined) return;

    const fadeMode = 'none';
    const fill = prepareAreaFillAnimationFns(status, spans, phantomSpans, fadeMode);
    const stroke = prepareAreaStrokeAnimationFns(status, spans, fadeMode);
    const marker = prepareMarkerAnimation(markerPairMap, status);
    return { status, fill, stroke, marker };
}
