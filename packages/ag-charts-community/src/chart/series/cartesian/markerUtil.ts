import { QUICK_TRANSITION } from '../../../motion/animation';
import type { NodeUpdateState } from '../../../motion/fromToMotion';
import { FROM_TO_MIXINS, fromToMotion, staticFromToMotion } from '../../../motion/fromToMotion';
import type { AgSeriesMarkerFormatterParams } from '../../../options/agChartOptions';
import type { Node } from '../../../scene/node';
import type { Selection } from '../../../scene/selection';
import type { AnimationManager } from '../../interaction/animationManager';
import * as easing from './../../../motion/easing';
import type { CartesianSeriesNodeDatum } from './cartesianSeries';

type NodeWithOpacity = Node & { opacity: number };
export function markerFadeInAnimation<T>(
    { id }: { id: string },
    animationManager: AnimationManager,
    markerSelections: Selection<NodeWithOpacity, T>[],
    status: NodeUpdateState = 'unknown'
) {
    const params = { ...FROM_TO_MIXINS[status] };
    staticFromToMotion(id, 'markers', animationManager, markerSelections, { opacity: 0 }, { opacity: 1 }, params);
    markerSelections.forEach((s) => s.cleanup());
}

export function markerScaleInAnimation<T>(
    { id }: { id: string },
    animationManager: AnimationManager,
    markerSelections: Selection<Node, T>[]
) {
    staticFromToMotion(
        id,
        'markers',
        animationManager,
        markerSelections,
        { scalingX: 0, scalingY: 0 },
        { scalingX: 1, scalingY: 1 }
    );
    markerSelections.forEach((s) => s.cleanup());
}

export function markerSwipeScaleInAnimation<T extends CartesianSeriesNodeDatum>(
    { id }: { id: string },
    animationManager: AnimationManager,
    markerSelections: Selection<Node, T>[],
    seriesWidth: number
) {
    // Improves consistency with matching parallel animations.
    const tweakFactor = 0.1;

    const fromFn = (_: Node, datum: T) => {
        const x = datum.midPoint?.x ?? seriesWidth;
        // Calculate a delay that depends on the X position of the datum, so that nodes appear
        // gradually from left to right. Use easeInOut to match any parallel swipe animations.
        const delayRatio = easing.easeInOut(x / seriesWidth) - tweakFactor;
        const delay = Math.max(Math.min(delayRatio, 1), 0);
        return { scalingX: 0, scalingY: 0, animationDelay: delay, animationDuration: QUICK_TRANSITION };
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
