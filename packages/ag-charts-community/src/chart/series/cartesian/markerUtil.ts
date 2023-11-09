import { QUICK_TRANSITION } from '../../../motion/animation';
import type { NodeUpdateState } from '../../../motion/fromToMotion';
import { FROM_TO_MIXINS, fromToMotion, staticFromToMotion } from '../../../motion/fromToMotion';
import type { Node } from '../../../scene/node';
import type { Selection } from '../../../scene/selection';
import type { AnimationManager } from '../../interaction/animationManager';
import type { Marker } from '../../marker/marker';
import * as easing from './../../../motion/easing';
import type { CartesianSeriesNodeDatum } from './cartesianSeries';
import type { PathNodeDatumLike, PathPoint, PathPointMap } from './pathUtil';

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

export function prepareMarkerAnimation(pairMap: PathPointMap<any>, parentStatus: NodeUpdateState) {
    const readFirstPair = (xValue: string, type: keyof typeof pairMap) => {
        const val = pairMap[type][xValue];
        return Array.isArray(val) ? val[0] : val;
    };
    const markerStatus = (datum: PathNodeDatumLike): { point?: PathPoint; status: NodeUpdateState } => {
        const { xValue } = datum;

        if (pairMap.moved[xValue]) {
            return { point: readFirstPair(xValue, 'moved'), status: 'updated' };
        } else if (pairMap.removed[xValue]) {
            return { point: readFirstPair(xValue, 'removed'), status: 'removed' };
        } else if (pairMap.added[xValue]) {
            return { point: readFirstPair(xValue, 'added'), status: 'added' };
        }

        return { status: 'unknown' };
    };
    const fromFn = (marker: Marker, datum: PathNodeDatumLike) => {
        const { status, point } = markerStatus(datum);
        if (status === 'unknown') return { opacity: 0 };

        const defaults = {
            translationX: point?.from?.x ?? marker.translationX,
            translationY: point?.from?.y ?? marker.translationY,
            opacity: marker.opacity,
            ...FROM_TO_MIXINS[status],
        };

        if (parentStatus === 'added') {
            return {
                ...defaults,
                opacity: 0,
                translationX: point?.to?.x,
                translationY: point?.to?.y,
                ...FROM_TO_MIXINS['added'],
            };
        }
        if (status === 'added') {
            defaults.opacity = 0;
        }

        return defaults;
    };

    const toFn = (_marker: Marker, datum: PathNodeDatumLike) => {
        const { status, point } = markerStatus(datum);
        if (status === 'unknown') return { opacity: 0 };

        const defaults = {
            translationX: datum.point.x,
            translationY: datum.point.y,
            opacity: 1,
            ...FROM_TO_MIXINS[status],
        };

        if (status === 'removed' || parentStatus === 'removed') {
            return {
                ...defaults,
                translationX: point?.to?.x,
                translationY: point?.to?.y,
                opacity: 0,
                ...FROM_TO_MIXINS['removed'],
            };
        }

        return defaults;
    };

    return { fromFn, toFn };
}
