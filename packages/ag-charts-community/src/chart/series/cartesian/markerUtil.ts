import type { NormalisedSeriesMarkerStyle, Point, Scale, SizedPoint } from 'ag-charts-core';
import { ChartAxisDirection, clamp, findRangeExtent, inverseEaseOut } from 'ag-charts-core';
import type { AgDrawingMode, AgMarkerShape } from 'ag-charts-types';

import { QUICK_TRANSITION } from '../../../motion/animation';
import type { ExtraOpts, NodeUpdateState } from '../../../motion/fromToMotion';
import { NODE_UPDATE_STATE_TO_PHASE_MAPPING, fromToMotion, staticFromToMotion } from '../../../motion/fromToMotion';
import { BBox } from '../../../scene/bbox';
import type { Node } from '../../../scene/node';
import type { Selection } from '../../../scene/selection';
import { Transformable } from '../../../scene/transformable';
import type { AnimationManager } from '../../interaction/animationManager';
import type { MarkerStrokePickStyle } from '../../marker/marker';
import { Marker, markerStrokePickInflation } from '../../marker/marker';
import type { PickFocusInputs } from '../series';
import type { SeriesMarker } from '../seriesMarker';
import { highlightStates } from '../seriesProperties';
import type { HighlightState, ISeries, ISeriesProperties, NodeDataDependant, SeriesNodeDatum } from '../seriesTypes';
import type { CartesianSeriesNodeDatum } from './cartesianSeriesTypes';

type NodeWithDrawingMode<D> = Node<D> & { drawingMode?: AgDrawingMode };
type NodeWithOpacity<D> = Node<D> & { opacity: number };
type MarkerFadeInOptions<D> = Partial<ExtraOpts<NodeWithDrawingMode<D>>>;
type MarkerSwipeScaleInOptions<D> = Partial<ExtraOpts<NodeWithDrawingMode<D>>>;

export function markerFadeInAnimation<D>(
    { id }: { id: string },
    animationManager: AnimationManager,
    status?: NodeUpdateState,
    options?: MarkerFadeInOptions<D>,
    ...markerSelections: Selection<D, NodeWithOpacity<D>>[]
) {
    const params = {
        ...options,
        phase: options?.phase ?? (status ? NODE_UPDATE_STATE_TO_PHASE_MAPPING[status] : 'trailing'),
    };
    staticFromToMotion(id, 'markers', animationManager, markerSelections, { opacity: 0 }, { opacity: 1 }, params);
    for (const s of markerSelections) {
        s.cleanup();
    }
}

export function markerScaleInAnimation<D>(
    { id }: { id: string },
    animationManager: AnimationManager,
    ...markerSelections: Selection<D, Node<D>>[]
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
    for (const s of markerSelections) {
        s.cleanup();
    }
}

export function markerSwipeScaleInAnimation<D extends CartesianSeriesNodeDatum>(
    { id, nodeDataDependencies }: { id: string } & NodeDataDependant,
    animationManager: AnimationManager,
    options?: MarkerSwipeScaleInOptions<D>,
    ...markerSelections: Selection<D, NodeWithDrawingMode<D>>[]
) {
    const seriesWidth: number = nodeDataDependencies.seriesRectWidth;
    const fromFn = (_: Node, datum: D) => {
        const x = datum.midPoint?.x ?? seriesWidth;
        // Calculate a delay that depends on the X position of the datum, so that nodes appear
        // gradually from left to right.
        //
        // Parallel swipe animations use the function x = easeOut(time). But in this case, we
        // know the x value and need to calculate the time delay. So use the inverse function:
        let delay = clamp(0, inverseEaseOut(x / seriesWidth), 1);
        if (Number.isNaN(delay)) {
            delay = 0;
        }
        return {
            scalingX: 0,
            scalingY: 0,
            delay: options?.delay ?? delay,
            duration: options?.duration ?? QUICK_TRANSITION,
            phase: options?.phase ?? ('initial' as const),
            start: options?.start,
            finish: options?.finish,
        };
    };
    const toFn = () => {
        return { scalingX: 1, scalingY: 1 };
    };

    fromToMotion(id, 'markers', animationManager, markerSelections, { fromFn, toFn });
}

export function resetMarkerFn(_node: NodeWithOpacity<unknown>) {
    return { opacity: 1, scalingX: 1, scalingY: 1 };
}

/**
 * Optimised reset for marker selections that bypasses resetMotion callback overhead.
 * Uses direct backing field writes via Marker.resetAnimationProperties().
 *
 * @param selections - Marker selections to reset
 */
export function resetMarkerSelectionsDirect<D extends CartesianSeriesNodeDatum>(
    selections: { nodes(): Iterable<Marker>; cleanup(): void; batchedUpdate(fn: () => void): void }[]
): void {
    for (const selection of selections) {
        const nodes = selection.nodes();
        selection.batchedUpdate(function resetMarkerNodes() {
            for (const node of nodes) {
                const datum = node.datum as D | undefined;
                if (datum?.point == null) continue;

                const { x, y } = datum.point;
                if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

                // Direct method bypasses decorators - writes to __x, __y, etc.
                // Preserves current size (node.size) to match original resetMotion behaviour
                node.resetAnimationProperties(x, y, node.size, 1, 1, 1);
            }
            // Important: cleanup garbage-collected nodes (same as resetMotion does)
            selection.cleanup();
        });
    }
}

export function resetMarkerPositionFn<D extends CartesianSeriesNodeDatum>(_node: Node<D>, datum: D) {
    return {
        x: datum.point?.x ?? Number.NaN,
        y: datum.point?.y ?? Number.NaN,
        scalingCenterX: datum.point?.x ?? Number.NaN,
        scalingCenterY: datum.point?.y ?? Number.NaN,
    };
}

interface MarkerNodeDatum extends SeriesNodeDatum {
    readonly point: Point & SizedPoint;
}

interface MarkerSeries<TDatum extends MarkerNodeDatum> extends ISeries<TDatum, ISeriesProperties, unknown> {
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

function markerEnabled(
    dataCount: number,
    scale: Scale<unknown, number, unknown>,
    marker: { enabled: boolean },
    markerStyle: { enabled?: boolean }
) {
    const enabled = markerStyle.enabled ?? marker.enabled;
    if (!enabled) return false;

    const minSpacing = 1;

    const step = scale.step ?? findRangeExtent(scale.range) / Math.max(1, dataCount);
    return step > minSpacing;
}

export type MarkerDrawMode = {
    needsNodeData: boolean;
    hideWithSize0: boolean;
};
export function cartesianMarkerDrawMode(
    properties: { selection: { enabled: boolean } },
    contextNodeData: { crossFiltering?: boolean } | undefined,
    processedData: { input: { count: number } },
    axes: { [ChartAxisDirection.X]?: { scale: Scale<unknown, number, unknown> } },
    marker: { enabled: boolean },
    markerStyle: { enabled?: boolean } = marker,
    isMiniChart: boolean = false
): MarkerDrawMode {
    const markersEnabled =
        contextNodeData?.crossFiltering === true ||
        markerEnabled(processedData.input.count, axes[ChartAxisDirection.X]!.scale, marker, markerStyle);

    if (properties.selection.enabled && !isMiniChart) {
        // selection.enabled needs NodeData for the selected-style overrides; mini-charts never render selection.
        return { needsNodeData: true, hideWithSize0: !markersEnabled };
    } else {
        return { needsNodeData: markersEnabled, hideWithSize0: false };
    }
}

type SeriesStyler<TStylerParams, TStylerResult> = (params: TStylerParams) => TStylerResult;
type DefaultOverrideStyle = NormalisedSeriesMarkerStyle & { size: number };

interface MarkerSeriesStylerProps<TStylerParams, TStylerResult> {
    properties: {
        styler?: SeriesStyler<TStylerParams, TStylerResult>;
    };
    getMarkerStyle<TParams>(
        marker: SeriesMarker<TParams>,
        nodeDatum: object,
        params?: TParams,
        opts?: { highlightState?: HighlightState },
        defaultOverrideStyle?: DefaultOverrideStyle,
        inheritedStyle?: NormalisedSeriesMarkerStyle
    ): NormalisedSeriesMarkerStyle & { size: number };
}

type LineProperties = {
    stroke?: string;
    strokeWidth: number;
    strokeOpacity: number;
};

export function getMarkerStyles<TStylerParams, TStylerResult, TItemStylerParams>(
    series: MarkerSeriesStylerProps<TStylerParams, TStylerResult>,
    line: LineProperties,
    marker: SeriesMarker<TItemStylerParams>,
    inheritedStyle?: NormalisedSeriesMarkerStyle
) {
    inheritedStyle ??= {
        stroke: line.stroke,
        strokeOpacity: line.strokeOpacity,
        strokeWidth: line.strokeWidth,
    };

    return highlightStates.reduce(
        (styles, state) => {
            styles[state] = series.getMarkerStyle(
                marker,
                {},
                undefined,
                { highlightState: state },
                undefined,
                inheritedStyle
            );
            return styles;
        },
        {} as Record<HighlightState, NormalisedSeriesMarkerStyle>
    );
}

/**
 * The widest {@link markerStrokePickInflation} across every highlight state the marker can be drawn
 * in. Highlight styles are drawn by a node in `highlightGroup`, which picking never traverses, so
 * the *base* node has to carry the widest region the user can ever see — which also keeps the pick
 * region invariant to the current highlight state (nothing to invalidate in `Series._pickNodeCache`).
 */
export function maxMarkerStrokePickInflation(
    styles: Record<HighlightState, MarkerStrokePickStyle> | undefined
): number {
    if (styles == null) return 0;
    let inflation = 0;
    for (const state of highlightStates) {
        inflation = Math.max(inflation, markerStrokePickInflation(styles[state]));
    }
    return inflation;
}
