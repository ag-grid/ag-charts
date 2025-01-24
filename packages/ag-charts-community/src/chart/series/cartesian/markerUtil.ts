import { QUICK_TRANSITION } from '../../../motion/animation';
import type { NodeUpdateState } from '../../../motion/fromToMotion';
import { NODE_UPDATE_STATE_TO_PHASE_MAPPING, fromToMotion, staticFromToMotion } from '../../../motion/fromToMotion';
import { BBox } from '../../../scene/bbox';
import type { Node } from '../../../scene/node';
import type { Point, SizedPoint } from '../../../scene/point';
import type { Selection } from '../../../scene/selection';
import { Transformable } from '../../../scene/transformable';
import { clamp } from '../../../util/number';
import type { AnimationManager } from '../../interaction/animationManager';
import type { PickFocusInputs } from '../series';
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
        translationX: datum.point?.x ?? NaN,
        translationY: datum.point?.y ?? NaN,
    };
}

interface MarkerNodeDatum extends SeriesNodeDatum<unknown> {
    readonly point: Point & SizedPoint;
}

interface MarkerSeries<TDatum extends MarkerNodeDatum> extends ISeries<TDatum, unknown, unknown> {
    getNodeData(): TDatum[] | undefined;
    getFormattedMarkerStyle(datum: TDatum): { size: number };
}

export function computeMarkerFocusBounds<TDatum extends MarkerNodeDatum>(
    series: MarkerSeries<TDatum>,
    { datumIndex }: PickFocusInputs
): BBox | undefined {
    const nodeData = series.getNodeData();
    if (nodeData === undefined) return undefined;

    const datum = nodeData[datumIndex];
    const { point } = datum;
    if (datum == null || point == null) return undefined;

    // AG-13067 Add 2px padding on all sides:
    const size = 4 + (point.focusSize ?? series.getFormattedMarkerStyle(datum).size);
    const radius = size / 2;
    const x = datum.point.x - radius;
    const y = datum.point.y - radius;
    return Transformable.toCanvas(series.contentGroup, new BBox(x, y, size, size));
}
