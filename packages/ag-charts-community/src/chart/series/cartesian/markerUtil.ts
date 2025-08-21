import { type Point, clamp } from 'ag-charts-core';
import type { AgMarkerShape, AgSeriesMarkerStyle } from 'ag-charts-types';

import { QUICK_TRANSITION } from '../../../motion/animation';
import type { NodeUpdateState } from '../../../motion/fromToMotion';
import { NODE_UPDATE_STATE_TO_PHASE_MAPPING, fromToMotion, staticFromToMotion } from '../../../motion/fromToMotion';
import type { Scale } from '../../../scale/scale';
import { BBox } from '../../../scene/bbox';
import type { Node } from '../../../scene/node';
import type { SizedPoint } from '../../../scene/point';
import type { Selection } from '../../../scene/selection';
import { Transformable } from '../../../scene/transformable';
import { findRangeExtent } from '../../../util/number';
import type { AnimationManager } from '../../interaction/animationManager';
import { Marker } from '../../marker/marker';
import type { PickFocusInputs } from '../series';
import type { SeriesMarker } from '../seriesMarker';
import { HighlightState, highlightStates } from '../seriesProperties';
import type { ISeries, NodeDataDependant, SeriesNodeDatum } from '../seriesTypes';
import * as easing from './../../../motion/easing';
import type { CartesianSeriesNodeDatum } from './cartesianSeries';

type NodeWithOpacity = Node & { opacity: number };
export function markerFadeInAnimation<T>(
    { id }: { id: string },
    animationManager: AnimationManager,
    status?: NodeUpdateState,
    ...markerSelections: Selection<NodeWithOpacity, T>[]
) {
    const params = { phase: status ? NODE_UPDATE_STATE_TO_PHASE_MAPPING[status] : 'trailing' };
    staticFromToMotion(id, 'markers', animationManager, markerSelections, { opacity: 0 }, { opacity: 1 }, params);
    markerSelections.forEach((s) => s.cleanup());
}

export function markerScaleInAnimation<T>(
    { id }: { id: string },
    animationManager: AnimationManager,
    ...markerSelections: Selection<Node, T>[]
) {
    staticFromToMotion(
        id,
        'markers',
        animationManager,
        markerSelections,
        { scalingX: 0, scalingY: 0 },
        { scalingX: 1, scalingY: 1 },
        { phase: 'initial' }
    );
    markerSelections.forEach((s) => s.cleanup());
}

export function markerSwipeScaleInAnimation<T extends CartesianSeriesNodeDatum>(
    { id, nodeDataDependencies }: { id: string } & NodeDataDependant,
    animationManager: AnimationManager,
    ...markerSelections: Selection<Node, T>[]
) {
    const seriesWidth: number = nodeDataDependencies.seriesRectWidth;
    const fromFn = (_: Node, datum: T) => {
        const x = datum.midPoint?.x ?? seriesWidth;
        // Calculate a delay that depends on the X position of the datum, so that nodes appear
        // gradually from left to right.
        //
        // Parallel swipe animations use the function x = easeOut(time). But in this case, we
        // know the x value and need to calculate the time delay. So use the inverse function:
        let delay = clamp(0, easing.inverseEaseOut(x / seriesWidth), 1);
        if (isNaN(delay)) {
            delay = 0;
        }
        return { scalingX: 0, scalingY: 0, delay, duration: QUICK_TRANSITION, phase: 'initial' as const };
    };
    const toFn = () => {
        return { scalingX: 1, scalingY: 1 };
    };

    fromToMotion(id, 'markers', animationManager, markerSelections, { fromFn, toFn });
}

export function resetMarkerFn(_node: NodeWithOpacity & Node) {
    return { opacity: 1, scalingX: 1, scalingY: 1 };
}

export function resetMarkerPositionFn<T extends CartesianSeriesNodeDatum>(_node: Node, datum: T) {
    return {
        x: datum.point?.x ?? NaN,
        y: datum.point?.y ?? NaN,
        scalingCenterX: datum.point?.x ?? NaN,
        scalingCenterY: datum.point?.y ?? NaN,
    };
}

interface MarkerNodeDatum extends SeriesNodeDatum<unknown> {
    readonly point: Point & SizedPoint;
}

interface MarkerSeries<TDatum extends MarkerNodeDatum> extends ISeries<number, TDatum, unknown, unknown> {
    getNodeData(): { [index: number]: TDatum | undefined } | undefined;
    getFormattedMarkerStyle(datum: TDatum): { size: number; shape?: AgMarkerShape };
}

export function computeMarkerFocusBounds<TDatum extends MarkerNodeDatum>(
    series: MarkerSeries<TDatum>,
    { datumIndex }: PickFocusInputs
): BBox | undefined {
    const nodeData = series.getNodeData();
    if (nodeData === undefined) return undefined;

    const datum = nodeData[datumIndex];
    const { point } = datum ?? {};
    if (datum == null || point == null) return undefined;

    const style = series.getFormattedMarkerStyle(datum);
    const anchor = Marker.anchor(style.shape);
    const size = point.focusSize ?? style.size;
    const paddedSize = 4 + size; // AG-13067 Add 2px padding on all sides:
    const paddedRadius = paddedSize / 2;
    const anchorX = (anchor.x - 0.5) * size;
    const anchorY = (anchor.y - 0.5) * size;
    const x = datum.point.x - paddedRadius - anchorX;
    const y = datum.point.y - paddedRadius - anchorY;
    return Transformable.toCanvas(series.contentGroup, new BBox(x, y, paddedSize, paddedSize));
}

export function markerEnabled(
    dataCount: number,
    scale: Scale<unknown, number, unknown>,
    marker: Pick<SeriesMarker<unknown>, 'enabled' | 'size'>,
    markerStyle: { enabled?: boolean; size: number } = marker
) {
    const enabled = markerStyle.enabled ?? marker.enabled;
    if (!enabled) return false;

    const minSpacing = 1;

    const step = scale.step ?? findRangeExtent(scale.range) / Math.max(1, dataCount);
    return step > minSpacing;
}

type SeriesStyler<TStylerParams, TStylerResult> = (params: TStylerParams) => TStylerResult;
type DefaultOverrideStyle = AgSeriesMarkerStyle & { size: number };

interface MarkerSeriesStylerProps<TStylerParams, TStylerResult> {
    properties: { styler?: SeriesStyler<TStylerParams, TStylerResult> };
    callWithContext(styler: SeriesStyler<TStylerParams, TStylerResult>, params: TStylerParams): TStylerResult;
    getMarkerStyle<TParams>(
        marker: SeriesMarker<TParams>,
        nodeDatum: object,
        params?: TParams,
        opts?: { highlightState?: HighlightState },
        defaultOverrideStyle?: DefaultOverrideStyle,
        inheritedStyle?: AgSeriesMarkerStyle
    ): AgSeriesMarkerStyle & { size: number };
    makeStylerParams(highlighted: boolean, highlightStateEnum?: HighlightState): TStylerParams;
}

// Bubble/Scatter series do not include `.marker` styling like other marker-based series (line, area, ...), because they
// do not include other scene nodes like lines/fills; therefore the styler result contains the marker styling properties
// at the root of the object. That's why we use `readResult` callbacks to convert the callback result to a marker style.
function getMarkerStylesImpl<TStylerParams, TStylerResult, TItemStylerParams>(
    readResult: (result: TStylerResult) => DefaultOverrideStyle | undefined,
    series: MarkerSeriesStylerProps<TStylerParams, TStylerResult>,
    marker: SeriesMarker<TItemStylerParams>,
    inheritedStyle?: AgSeriesMarkerStyle
) {
    return highlightStates.reduce(
        (styles, state) => {
            let defaultOverrideStyle: DefaultOverrideStyle | undefined;
            if (series.properties.styler) {
                const params = series.makeStylerParams(state === HighlightState.None, state);
                const result = series.callWithContext(series.properties.styler, params);
                defaultOverrideStyle = readResult(result);
            }

            styles[state] = series.getMarkerStyle(
                marker,
                {},
                undefined,
                { highlightState: state },
                defaultOverrideStyle,
                inheritedStyle
            );
            return styles;
        },
        {} as Record<HighlightState, AgSeriesMarkerStyle>
    );
}

type MarkerStylerResult = { marker?: AgSeriesMarkerStyle } | undefined;
export function getMarkerStyles<TStylerParams, TItemStylerParams>(
    series: MarkerSeriesStylerProps<TStylerParams, MarkerStylerResult>,
    marker: SeriesMarker<TItemStylerParams>,
    inheritedStyle?: AgSeriesMarkerStyle
) {
    function readResult(result: MarkerStylerResult): DefaultOverrideStyle | undefined {
        if (result?.marker != null) {
            return { ...result.marker, size: result.marker.size ?? marker.size };
        }
    }
    return getMarkerStylesImpl(readResult, series, marker, inheritedStyle);
}

type MarkerOnlyStylerResult = AgSeriesMarkerStyle | undefined;
export function getMarkerOnlyStyles<TStylerParams, TItemStylerParams>(
    series: MarkerSeriesStylerProps<TStylerParams, MarkerOnlyStylerResult>,
    marker: SeriesMarker<TItemStylerParams>,
    inheritedStyle?: AgSeriesMarkerStyle
) {
    function readResult(result: MarkerOnlyStylerResult): DefaultOverrideStyle | undefined {
        if (result != null) {
            return { ...result, size: result.size ?? marker.size };
        }
    }
    return getMarkerStylesImpl(readResult, series, marker, inheritedStyle);
}
