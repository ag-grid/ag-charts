import { QUICK_TRANSITION } from '../../../motion/animation';
import type { NodeUpdateState } from '../../../motion/fromToMotion';
import { FROM_TO_MIXINS, fromToMotion, staticFromToMotion } from '../../../motion/fromToMotion';
import type { Node } from '../../../scene/node';
import type { Selection } from '../../../scene/selection';
import { Debug } from '../../../util/debug';
import { clamp } from '../../../util/number';
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
    const fromFn = (_: Node, datum: T) => {
        const x = datum.midPoint?.x ?? seriesWidth;
        // Calculate a delay that depends on the X position of the datum, so that nodes appear
        // gradually from left to right.
        //
        // Parallel swipe animations use the function x = easeOut(time). But in this case, we
        // know the x value and need to calculate the time delay. So use the inverse function:
        const delay = clamp(0, easing.inverseEaseOut(x / seriesWidth), 1);
        const animationDuration = Debug.check('animationImmediateMarkerSwipeScaleIn') ? 0 : QUICK_TRANSITION;
        return { scalingX: 0, scalingY: 0, animationDelay: delay, animationDuration };
    };
    const toFn = () => {
        return { scalingX: 1, scalingY: 1 };
    };

    fromToMotion(id, 'markers', animationManager, markerSelections, { fromFn, toFn });
}

export function resetMarkerFn(_node: NodeWithOpacity & Node) {
    return { opacity: 1, scalingX: 1, scalingY: 1 };
}

// FIXME - take into account axis line width
const alignToAxis = (value: number | undefined) => (value != null ? Math.round(value) + 0.5 : undefined);

export function resetMarkerPositionFn<T extends CartesianSeriesNodeDatum>(_node: Node, datum: T) {
    return {
        translationX: alignToAxis(datum.point?.x ?? NaN),
        translationY: alignToAxis(datum.point?.y ?? NaN),
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
            translationX: point?.from != null ? alignToAxis(point?.from?.x) : marker.translationX,
            translationY: point?.from != null ? alignToAxis(point?.from?.y) : marker.translationY,
            opacity: marker.opacity,
            ...FROM_TO_MIXINS[status],
        };

        if (parentStatus === 'added') {
            return {
                ...defaults,
                opacity: 0,
                translationX: alignToAxis(point?.to?.x),
                translationY: alignToAxis(point?.to?.y),
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
            translationX: alignToAxis(datum.point.x),
            translationY: alignToAxis(datum.point.y),
            opacity: 1,
            ...FROM_TO_MIXINS[status],
        };

        if (status === 'removed' || parentStatus === 'removed') {
            return {
                ...defaults,
                translationX: alignToAxis(point?.to?.x),
                translationY: alignToAxis(point?.to?.y),
                opacity: 0,
                ...FROM_TO_MIXINS['removed'],
            };
        }

        return defaults;
    };

    return { fromFn, toFn };
}
