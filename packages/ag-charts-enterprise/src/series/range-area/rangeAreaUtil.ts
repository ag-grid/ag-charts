import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { type RangeAreaMarkerDatum } from './rangeAreaProperties';

const {
    CollapseMode,
    isScaleValid,
    pairUpSpans,
    prepareAreaFillAnimationFns,
    plotInterpolatedLinePathStroke,
    prepareLinePathPropertyAnimation,
} = _ModuleSupport;

export interface RangeAreaLabelDatum extends Readonly<_Scene.Point> {
    text: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    datum: any;
    itemId?: string;
    series: _ModuleSupport.CartesianSeriesNodeDatum['series'];
}

export interface RangeAreaFillPathDatum {
    readonly spans: _ModuleSupport.LinePathSpan[];
    readonly phantomSpans: _ModuleSupport.LinePathSpan[];
    readonly itemId: string;
}

export interface RangeAreaStrokePathDatum {
    readonly spans: _ModuleSupport.LinePathSpan[];
    readonly itemId: string;
}

export interface RangeAreaContext
    extends _ModuleSupport.CartesianSeriesNodeDataContext<RangeAreaMarkerDatum, RangeAreaLabelDatum> {
    fillData: RangeAreaFillPathDatum;
    highStrokeData: RangeAreaStrokePathDatum;
    lowStrokeData: RangeAreaStrokePathDatum;
}

export function prepareRangeAreaPathStrokeAnimationFns(
    status: _ModuleSupport.NodeUpdateState,
    highSpans: _ModuleSupport.SpanAnimation,
    lowSpans: _ModuleSupport.SpanAnimation,
    visibleToggleMode: 'fade' | 'none'
) {
    const removePhaseFn = (ratio: number, path: _Scene.Path) => {
        plotInterpolatedLinePathStroke(ratio, path, highSpans.removed);
        plotInterpolatedLinePathStroke(ratio, path, lowSpans.removed);
    };
    const updatePhaseFn = (ratio: number, path: _Scene.Path) => {
        plotInterpolatedLinePathStroke(ratio, path, highSpans.moved);
        plotInterpolatedLinePathStroke(ratio, path, lowSpans.moved);
    };
    const addPhaseFn = (ratio: number, path: _Scene.Path) => {
        plotInterpolatedLinePathStroke(ratio, path, highSpans.added);
        plotInterpolatedLinePathStroke(ratio, path, lowSpans.added);
    };
    const pathProperties = prepareLinePathPropertyAnimation(status, visibleToggleMode);

    return { status, path: { addPhaseFn, updatePhaseFn, removePhaseFn }, pathProperties };
}

export function prepareRangeAreaPathAnimation(newData: RangeAreaContext, oldData: RangeAreaContext) {
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
    const fillPhantomSpans = pairUpSpans(
        { scales: newData.scales, data: newData.fillData.phantomSpans },
        { scales: oldData.scales, data: oldData.fillData.phantomSpans },
        CollapseMode.Split
    );
    const highStrokeSpans = pairUpSpans(
        { scales: newData.scales, data: newData.highStrokeData.spans },
        { scales: oldData.scales, data: oldData.highStrokeData.spans },
        CollapseMode.Split
    );
    const lowStrokeSpans = pairUpSpans(
        { scales: newData.scales, data: newData.lowStrokeData.spans },
        { scales: oldData.scales, data: oldData.lowStrokeData.spans },
        CollapseMode.Split
    );

    const fadeMode = 'none';
    const fill = prepareAreaFillAnimationFns(status, fillSpans, fillPhantomSpans, fadeMode);
    const stroke = prepareRangeAreaPathStrokeAnimationFns(status, highStrokeSpans, lowStrokeSpans, fadeMode);
    return { status, fill, stroke };
}
