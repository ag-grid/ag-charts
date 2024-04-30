import type { AnimationValue } from '../../../motion/animation';
import { StateMachine } from '../../../motion/states';
import { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import type { ZIndexSubOrder } from '../../../scene/layersManager';
import type { Node, NodeWithOpacity } from '../../../scene/node';
import type { Point } from '../../../scene/point';
import { Selection } from '../../../scene/selection';
import { Path } from '../../../scene/shape/path';
import { Text } from '../../../scene/shape/text';
import type { PointLabelDatum } from '../../../scene/util/labelPlacement';
import { QuadtreeNearest } from '../../../scene/util/quadtree';
import type { ChartAnimationPhase } from '../../chartAnimationPhase';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { LegendItemClickChartEvent, LegendItemDoubleClickChartEvent } from '../../interaction/chartEventManager';
import type { Marker } from '../../marker/marker';
import { DataModelSeries } from '../dataModelSeries';
import type { SeriesConstructorOpts, SeriesDirectionKeysMapping, SeriesNodeDataContext, SeriesNodeEventTypes, SeriesNodePickMatch } from '../series';
import { SeriesNodeEvent } from '../series';
import type { SeriesGroupZIndexSubOrderType } from '../seriesLayerManager';
import { SeriesProperties } from '../seriesProperties';
import type { ISeries, SeriesNodeDatum } from '../seriesTypes';
import type { Scaling } from './scaling';
export interface CartesianSeriesNodeDatum extends SeriesNodeDatum {
    readonly xKey: string;
    readonly yKey?: string;
    readonly xValue?: any;
    readonly yValue?: any;
}
type CartesianSeriesOpts<TNode extends Node, TProps extends CartesianSeriesProperties<any>, TDatum extends CartesianSeriesNodeDatum, TLabel extends SeriesNodeDatum> = {
    pathsPerSeries: number;
    pathsZIndexSubOrderOffset: number[];
    hasMarkers: boolean;
    hasHighlightedLabels: boolean;
    directionKeys: SeriesDirectionKeysMapping<TProps>;
    directionNames: SeriesDirectionKeysMapping<TProps>;
    datumSelectionGarbageCollection: boolean;
    markerSelectionGarbageCollection: boolean;
    animationAlwaysUpdateSelections: boolean;
    animationResetFns?: {
        path?: (path: Path) => Partial<Path>;
        datum?: (node: TNode, datum: TDatum) => AnimationValue & Partial<TNode>;
        label?: (node: Text, datum: TLabel) => AnimationValue & Partial<Text>;
        marker?: (node: Marker, datum: TDatum) => AnimationValue & Partial<Marker>;
    };
};
export declare const DEFAULT_CARTESIAN_DIRECTION_KEYS: {
    x: "xKey"[];
    y: "yKey"[];
};
export declare const DEFAULT_CARTESIAN_DIRECTION_NAMES: {
    x: "xName"[];
    y: "yName"[];
};
export declare class CartesianSeriesNodeEvent<TEvent extends string = SeriesNodeEventTypes> extends SeriesNodeEvent<SeriesNodeDatum, TEvent> {
    readonly xKey?: string;
    readonly yKey?: string;
    constructor(type: TEvent, nativeEvent: Event, datum: SeriesNodeDatum, series: ISeries<SeriesNodeDatum, {
        xKey?: string;
        yKey?: string;
    }>);
}
type CartesianAnimationState = 'empty' | 'ready' | 'waiting' | 'clearing' | 'disabled';
type CartesianAnimationEvent = 'update' | 'updateData' | 'highlight' | 'highlightMarkers' | 'resize' | 'clear' | 'reset' | 'skip' | 'disable';
export interface CartesianAnimationData<TNode extends Node, TDatum extends CartesianSeriesNodeDatum, TLabel extends SeriesNodeDatum = TDatum, TContext extends CartesianSeriesNodeDataContext<TDatum, TLabel> = CartesianSeriesNodeDataContext<TDatum, TLabel>> {
    datumSelection: Selection<TNode, TDatum>;
    markerSelection: Selection<Marker, TDatum>;
    labelSelection: Selection<Text, TLabel>;
    annotationSelections: Selection<NodeWithOpacity, TDatum>[];
    contextData: TContext;
    previousContextData?: TContext;
    paths: Path[];
    seriesRect?: BBox;
    duration?: number;
}
export declare abstract class CartesianSeriesProperties<T extends object> extends SeriesProperties<T> {
    legendItemName?: string;
}
export interface CartesianSeriesNodeDataContext<TDatum extends CartesianSeriesNodeDatum = CartesianSeriesNodeDatum, TLabel extends SeriesNodeDatum = TDatum> extends SeriesNodeDataContext<TDatum, TLabel> {
    scales: {
        [key in ChartAxisDirection]?: Scaling;
    };
    animationValid?: boolean;
    visible: boolean;
}
export declare abstract class CartesianSeries<TNode extends Node, TProps extends CartesianSeriesProperties<any>, TDatum extends CartesianSeriesNodeDatum, TLabel extends SeriesNodeDatum = TDatum, TContext extends CartesianSeriesNodeDataContext<TDatum, TLabel> = CartesianSeriesNodeDataContext<TDatum, TLabel>> extends DataModelSeries<TDatum, TProps, TLabel, TContext> {
    private _contextNodeData?;
    get contextNodeData(): TContext | undefined;
    getNodeData(): TDatum[] | undefined;
    protected readonly NodeEvent: typeof CartesianSeriesNodeEvent;
    private readonly paths;
    private readonly dataNodeGroup;
    private readonly markerGroup;
    readonly labelGroup: Group;
    private datumSelection;
    private markerSelection;
    private labelSelection;
    private highlightSelection;
    private highlightLabelSelection;
    annotationSelections: Set<Selection<NodeWithOpacity, TDatum>>;
    private minRectsCache;
    private readonly opts;
    private readonly debug;
    protected quadtree?: QuadtreeNearest<TDatum>;
    protected animationState: StateMachine<CartesianAnimationState, CartesianAnimationEvent>;
    protected constructor({ pathsPerSeries, hasMarkers, hasHighlightedLabels, pathsZIndexSubOrderOffset, datumSelectionGarbageCollection, markerSelectionGarbageCollection, animationAlwaysUpdateSelections, animationResetFns, directionKeys, directionNames, ...otherOpts }: Partial<CartesianSeriesOpts<TNode, TProps, TDatum, TLabel>> & Pick<CartesianSeriesOpts<TNode, TProps, TDatum, TLabel>, 'directionKeys' | 'directionNames'> & SeriesConstructorOpts<TProps>);
    resetAnimation(phase: ChartAnimationPhase): void;
    addChartEventListeners(): void;
    destroy(): void;
    update({ seriesRect }: {
        seriesRect?: BBox;
    }): Promise<void>;
    protected updateSelections(anySeriesItemEnabled: boolean): Promise<void>;
    private updateSeriesSelections;
    protected abstract nodeFactory(): TNode;
    protected markerFactory(): Marker;
    getGroupZIndexSubOrder(type: SeriesGroupZIndexSubOrderType, subIndex?: number): ZIndexSubOrder;
    protected updateNodes(highlightedItems: TDatum[] | undefined, seriesHighlighted: boolean, anySeriesItemEnabled: boolean): Promise<void>;
    protected getHighlightLabelData(labelData: TLabel[], highlightedItem: TDatum): TLabel[] | undefined;
    protected getHighlightData(_nodeData: TDatum[], highlightedItem: TDatum): TDatum[] | undefined;
    protected updateHighlightSelection(seriesHighlighted: boolean): Promise<TDatum[] | undefined>;
    protected markQuadtreeDirty(): void;
    protected datumNodesIter(): Iterable<TNode>;
    getQuadTree(): QuadtreeNearest<TDatum>;
    protected initQuadTree(_quadtree: QuadtreeNearest<TDatum>): void;
    protected pickNodeExactShape(point: Point): SeriesNodePickMatch | undefined;
    protected pickNodeClosestDatum(point: Point): SeriesNodePickMatch | undefined;
    protected pickNodeMainAxisFirst(point: Point, requireCategoryAxis: boolean): SeriesNodePickMatch | undefined;
    onLegendItemClick(event: LegendItemClickChartEvent): void;
    onLegendItemDoubleClick(event: LegendItemDoubleClickChartEvent): void;
    protected isPathOrSelectionDirty(): boolean;
    getLabelData(): PointLabelDatum[];
    shouldFlipXY(): boolean;
    /**
     * Get the minimum bounding box that contains any adjacent two nodes. The axes are treated independently, so this
     * may not represent the same two points for both directions. The dimensions represent the greatest distance
     * between any two adjacent nodes.
     */
    getMinRects(width: number, height: number): {
        minRect: BBox;
        minVisibleRect: BBox;
    } | undefined;
    private computeMinRects;
    protected updateHighlightSelectionItem(opts: {
        items?: TDatum[];
        highlightSelection: Selection<TNode, TDatum>;
    }): Promise<Selection<TNode, TDatum>>;
    protected updateHighlightSelectionLabel(opts: {
        items?: TLabel[];
        highlightLabelSelection: Selection<Text, TLabel>;
    }): Promise<Selection<Text, TLabel>>;
    protected updateDatumSelection(opts: {
        nodeData: TDatum[];
        datumSelection: Selection<TNode, TDatum>;
    }): Promise<Selection<TNode, TDatum>>;
    protected updateDatumNodes(_opts: {
        datumSelection: Selection<TNode, TDatum>;
        highlightedItems?: TDatum[];
        isHighlight: boolean;
    }): Promise<void>;
    protected updateMarkerSelection(opts: {
        nodeData: TDatum[];
        markerSelection: Selection<Marker, TDatum>;
    }): Promise<Selection<Marker, TDatum>>;
    protected updateMarkerNodes(_opts: {
        markerSelection: Selection<Marker, TDatum>;
        isHighlight: boolean;
    }): Promise<void>;
    protected updatePaths(opts: {
        seriesHighlighted?: boolean;
        itemId?: string;
        contextData: TContext;
        paths: Path[];
    }): Promise<void>;
    protected updatePathNodes(opts: {
        seriesHighlighted?: boolean;
        itemId?: string;
        paths: Path[];
        opacity: number;
        visible: boolean;
        animationEnabled: boolean;
    }): Promise<void>;
    protected resetAllAnimation(data: CartesianAnimationData<TNode, TDatum, TLabel, TContext>): void;
    protected animateEmptyUpdateReady(data: CartesianAnimationData<TNode, TDatum, TLabel, TContext>): void;
    protected animateWaitingUpdateReady(data: CartesianAnimationData<TNode, TDatum, TLabel, TContext>): void;
    protected animateReadyHighlight(data: Selection<TNode, TDatum>): void;
    protected animateReadyHighlightMarkers(data: Selection<Marker, TDatum>): void;
    protected animateReadyResize(data: CartesianAnimationData<TNode, TDatum, TLabel, TContext>): void;
    protected animateClearingUpdateEmpty(data: CartesianAnimationData<TNode, TDatum, TLabel, TContext>): void;
    protected animationTransitionClear(): void;
    private getAnimationData;
    protected abstract updateLabelSelection(opts: {
        labelData: TLabel[];
        labelSelection: Selection<Text, TLabel>;
    }): Promise<Selection<Text, TLabel>>;
    protected abstract updateLabelNodes(opts: {
        labelSelection: Selection<Text, TLabel>;
    }): Promise<void>;
    protected abstract isLabelEnabled(): boolean;
    protected calculateScaling(): {
        x?: Scaling | undefined;
        y?: Scaling | undefined;
    };
}
export {};
