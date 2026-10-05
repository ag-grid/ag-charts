import {
    type AgHlcSeriesItemStylerParams,
    type AgHlcSeriesItemType,
    type AgSeriesMarkerStyle,
    _ModuleSupport,
} from 'ag-charts-community';
import { type SizedPoint, areScalingEqual, isScaleValid } from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

export interface HlcMarkerDatum extends Omit<_ModuleSupport.CartesianSeriesNodeDatum, 'yKey' | 'yValue'> {
    readonly itemId?: never;
    readonly itemType: AgHlcSeriesItemType;
    readonly index: number;
    readonly highKey: string;
    readonly lowKey: string;
    readonly closeKey: string;
    readonly highValue: AgNumericValue;
    readonly lowValue: AgNumericValue;
    readonly closeValue: AgNumericValue;
    readonly point: Readonly<SizedPoint>;
    readonly enabled: boolean;
    style?: AgSeriesMarkerStyle;
}

export type HlcSeriesParams = Pick<
    AgHlcSeriesItemStylerParams<unknown, unknown>,
    'xKey' | 'highKey' | 'lowKey' | 'closeKey' | 'itemType'
>;

const { CollapseMode, pairUpSpans, prepareAreaFillAnimationFns, prepareLinePathStrokeAnimationFns } = _ModuleSupport;

/** A band's fill: its outer edge as `spans`, closed back along the band edge as `phantomSpans`. */
interface HlcFillPathDatum {
    readonly spans: _ModuleSupport.LinePathSpan[];
    readonly phantomSpans: _ModuleSupport.LinePathSpan[];
}

export interface HlcContext extends _ModuleSupport.CartesianSeriesNodeDataContext<HlcMarkerDatum, HlcMarkerDatum> {
    readonly itemId: string;
    highFillData: HlcFillPathDatum;
    lowFillData: HlcFillPathDatum;
    /** The line the two bands meet along: the close, clamped to the high-low range. */
    bandEdgeData: _ModuleSupport.LinePathSpan[];
    strokeData: Record<AgHlcSeriesItemType, _ModuleSupport.LinePathSpan[]>;
    styles: Record<AgHlcSeriesItemType, _ModuleSupport.SeriesNodeStyleContext<AgSeriesMarkerStyle>>;
}

export function prepareHlcPathAnimation(
    newData: HlcContext,
    oldData: HlcContext,
    diff: _ModuleSupport.ProcessedOutputDiff | undefined
) {
    const isCategoryBased = newData.scales.x?.type === 'category';
    const wasCategoryBased = oldData.scales.x?.type === 'category';
    if (isCategoryBased !== wasCategoryBased || !isScaleValid(newData.scales.x) || !isScaleValid(oldData.scales.x)) {
        return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- widen literal so callers can still narrow against the full NodeUpdateState (incl. 'no-op')
    let status: _ModuleSupport.NodeUpdateState = 'updated' as _ModuleSupport.NodeUpdateState;
    if (oldData.visible && !newData.visible) {
        status = 'removed';
    } else if (!oldData.visible && newData.visible) {
        status = 'added';
    }

    const pair = (next: _ModuleSupport.LinePathSpan[], previous: _ModuleSupport.LinePathSpan[]) =>
        pairUpSpans(
            { scales: newData.scales, data: next },
            { scales: oldData.scales, data: previous },
            CollapseMode.Split
        );

    const highSpans = pair(newData.strokeData.high, oldData.strokeData.high);
    const lowSpans = pair(newData.strokeData.low, oldData.strokeData.low);
    const closeSpans = pair(newData.strokeData.close, oldData.strokeData.close);
    const bandEdgeSpans = pair(newData.bandEdgeData, oldData.bandEdgeData);
    if (highSpans == null || lowSpans == null || closeSpans == null || bandEdgeSpans == null) return;

    // The bands share their outer edges' pairings with the strokes.
    const highFill = prepareAreaFillAnimationFns(status, highSpans, bandEdgeSpans, 'fade');
    const lowFill = prepareAreaFillAnimationFns(status, bandEdgeSpans, lowSpans, 'fade');
    const highStroke = prepareLinePathStrokeAnimationFns(status, highSpans, 'fade');
    const lowStroke = prepareLinePathStrokeAnimationFns(status, lowSpans, 'fade');
    const closeStroke = prepareLinePathStrokeAnimationFns(status, closeSpans, 'fade');

    const hasMotion =
        (diff?.changed ?? true) ||
        !areScalingEqual(newData.scales.x, oldData.scales.x) ||
        !areScalingEqual(newData.scales.y, oldData.scales.y) ||
        status !== 'updated';

    return {
        status,
        highFill,
        lowFill,
        highStroke,
        lowStroke,
        closeStroke,
        hasMotion,
    };
}
