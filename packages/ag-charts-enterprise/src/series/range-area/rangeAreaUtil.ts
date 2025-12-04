import {
    type AgRangeAreaSeriesItemType,
    type AgSeriesMarkerStyle,
    type TextOrSegments,
    _ModuleSupport,
} from 'ag-charts-community';
import { type Point, areScalingEqual, isScaleValid } from 'ag-charts-core';

import { type RangeAreaMarkerDatum } from './rangeAreaProperties';

const {
    CollapseMode,
    pairUpSpans,
    prepareAreaFillAnimationFns,
    plotInterpolatedLinePathStroke,
    prepareLinePathPropertyAnimation,
} = _ModuleSupport;

export interface RangeAreaLabelDatum extends Readonly<Point> {
    datumIndex: number;
    text: TextOrSegments;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    datum: any;
    readonly itemId?: never;
    readonly itemType: AgRangeAreaSeriesItemType;
    series: _ModuleSupport.CartesianSeriesNodeDatum['series'];
    style?: AgSeriesMarkerStyle;
}

interface RangeAreaFillPathDatum {
    readonly spans: _ModuleSupport.LinePathSpan[];
    readonly phantomSpans: _ModuleSupport.LinePathSpan[];
    readonly itemType: AgRangeAreaSeriesItemType;
}

interface RangeAreaStrokePathDatum {
    readonly spans: _ModuleSupport.LinePathSpan[];
    readonly itemType: AgRangeAreaSeriesItemType;
}

export type RangeAreaItemId = `${string}-${string}`;

export interface RangeAreaContext
    extends _ModuleSupport.CartesianSeriesNodeDataContext<RangeAreaMarkerDatum, RangeAreaLabelDatum> {
    readonly itemId: RangeAreaItemId;
    fillData: RangeAreaFillPathDatum;
    highStrokeData: RangeAreaStrokePathDatum;
    lowStrokeData: RangeAreaStrokePathDatum;
    styles: {
        low: _ModuleSupport.SeriesNodeStyleContext<AgSeriesMarkerStyle>;
        high: _ModuleSupport.SeriesNodeStyleContext<AgSeriesMarkerStyle>;
    };
    intersectionSegments?: _ModuleSupport.Segment[];
}

function prepareRangeAreaPathStrokeAnimationFns(
    status: _ModuleSupport.NodeUpdateState,
    highSpans: _ModuleSupport.SpanAnimation,
    lowSpans: _ModuleSupport.SpanAnimation,
    visibleToggleMode: 'fade' | 'none'
) {
    const removePhaseFn = (ratio: number, path: _ModuleSupport.Path) => {
        plotInterpolatedLinePathStroke(ratio, path, highSpans.removed);
        plotInterpolatedLinePathStroke(ratio, path, lowSpans.removed);
    };
    const updatePhaseFn = (ratio: number, path: _ModuleSupport.Path) => {
        plotInterpolatedLinePathStroke(ratio, path, highSpans.moved);
        plotInterpolatedLinePathStroke(ratio, path, lowSpans.moved);
    };
    const addPhaseFn = (ratio: number, path: _ModuleSupport.Path) => {
        plotInterpolatedLinePathStroke(ratio, path, highSpans.added);
        plotInterpolatedLinePathStroke(ratio, path, lowSpans.added);
    };
    const pathProperties = prepareLinePathPropertyAnimation(status, visibleToggleMode);

    return { status, path: { addPhaseFn, updatePhaseFn, removePhaseFn }, pathProperties };
}

export function prepareRangeAreaPathAnimation(
    newData: RangeAreaContext,
    oldData: RangeAreaContext,
    diff: _ModuleSupport.ProcessedOutputDiff | undefined
) {
    const isCategoryBased = newData.scales.x?.type === 'category';
    const wasCategoryBased = oldData.scales.x?.type === 'category';
    if (isCategoryBased !== wasCategoryBased || !isScaleValid(newData.scales.x) || !isScaleValid(oldData.scales.x)) {
        // Not comparable.
        return;
    }
    let status: _ModuleSupport.NodeUpdateState = 'updated' as _ModuleSupport.NodeUpdateState;
    if (oldData.visible && !newData.visible) {
        status = 'removed';
    } else if (!oldData.visible && newData.visible) {
        status = 'added';
    }

    const fillSpans = pairUpSpans(
        { scales: newData.scales, data: newData.fillData.spans },
        { scales: oldData.scales, data: oldData.fillData.spans },
        CollapseMode.Split
    );
    if (fillSpans == null) return;
    const fillPhantomSpans = pairUpSpans(
        { scales: newData.scales, data: newData.fillData.phantomSpans },
        { scales: oldData.scales, data: oldData.fillData.phantomSpans },
        CollapseMode.Split
    );
    if (fillPhantomSpans == null) return;
    const highStrokeSpans = pairUpSpans(
        { scales: newData.scales, data: newData.highStrokeData.spans },
        { scales: oldData.scales, data: oldData.highStrokeData.spans },
        CollapseMode.Split
    );
    if (highStrokeSpans == null) return;
    const lowStrokeSpans = pairUpSpans(
        { scales: newData.scales, data: newData.lowStrokeData.spans },
        { scales: oldData.scales, data: oldData.lowStrokeData.spans },
        CollapseMode.Split
    );
    if (lowStrokeSpans == null) return;

    const fadeMode = 'fade';
    const fill = prepareAreaFillAnimationFns(status, fillSpans, fillPhantomSpans, fadeMode);
    const stroke = prepareRangeAreaPathStrokeAnimationFns(status, highStrokeSpans, lowStrokeSpans, fadeMode);

    const hasMotion =
        (diff?.changed ?? true) ||
        !areScalingEqual(newData.scales.x, oldData.scales.x) ||
        !areScalingEqual(newData.scales.y, oldData.scales.y) ||
        status !== 'updated';

    return { status, fill, stroke, hasMotion };
}
