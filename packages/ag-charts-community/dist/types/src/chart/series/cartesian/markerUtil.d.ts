import type { NodeUpdateState } from '../../../motion/fromToMotion';
import { BBox } from '../../../scene/bbox';
import type { Group } from '../../../scene/group';
import type { Node } from '../../../scene/node';
import type { Point } from '../../../scene/point';
import type { Selection } from '../../../scene/selection';
import type { AnimationManager } from '../../interaction/animationManager';
import type { Marker } from '../../marker/marker';
import type { PickFocusInputs } from '../series';
import type { NodeDataDependant } from '../seriesTypes';
import type { CartesianSeriesNodeDatum } from './cartesianSeries';
import type { PathNodeDatumLike, PathPointMap } from './pathUtil';
type NodeWithOpacity = Node & {
    opacity: number;
};
export declare function markerFadeInAnimation<T>({ id }: {
    id: string;
}, animationManager: AnimationManager, status?: NodeUpdateState, ...markerSelections: Selection<NodeWithOpacity, T>[]): void;
export declare function markerScaleInAnimation<T>({ id }: {
    id: string;
}, animationManager: AnimationManager, ...markerSelections: Selection<Node, T>[]): void;
export declare function markerSwipeScaleInAnimation<T extends CartesianSeriesNodeDatum>({ id, nodeDataDependencies }: {
    id: string;
} & NodeDataDependant, animationManager: AnimationManager, ...markerSelections: Selection<Node, T>[]): void;
export declare function resetMarkerFn(_node: NodeWithOpacity & Node): {
    opacity: number;
    scalingX: number;
    scalingY: number;
};
export declare function resetMarkerPositionFn<T extends CartesianSeriesNodeDatum>(_node: Node, datum: T): {
    translationX: number;
    translationY: number;
};
export declare function prepareMarkerAnimation(pairMap: PathPointMap<any>, parentStatus: NodeUpdateState): {
    fromFn: (marker: Marker, datum: PathNodeDatumLike) => {
        opacity: number;
    } | {
        opacity: number;
        translationX: number | undefined;
        translationY: number | undefined;
        phase: "none" | "trailing" | "initial" | "remove" | "update" | "add" | "end";
    };
    toFn: (_marker: Marker, datum: PathNodeDatumLike) => {
        opacity: number;
    } | {
        translationX: number | undefined;
        translationY: number | undefined;
        opacity: number;
        phase: "none" | "trailing" | "initial" | "remove" | "update" | "add" | "end";
    };
};
type MarkerSeries<TDatum> = {
    getNodeData(): TDatum[] | undefined;
    getFormattedMarkerStyle(datum: TDatum): {
        size: number;
    };
    contentGroup: Group;
};
export declare function computeMarkerFocusBounds<TDatum extends {
    point: Point;
}>(series: MarkerSeries<TDatum>, { datumIndex }: PickFocusInputs): BBox | undefined;
export {};
