import {
    Debug,
    type Point,
    Property,
    type Scale,
    findMaxIndex,
    findMinIndex,
    findMinMax,
    isFiniteNumber,
} from 'ag-charts-core';
import type { AgDrawingMode, AgSeriesSegmentation } from 'ag-charts-types';

import type { HighlightNodeDatum } from '../../../core/eventsHub';
import type { AnimationValue } from '../../../motion/animation';
import { resetMotion } from '../../../motion/resetMotion';
import { BandScale } from '../../../scale/bandScale';
import { ContinuousScale } from '../../../scale/continuousScale';
import { LogScale } from '../../../scale/logScale';
import { UnitTimeScale } from '../../../scale/unitTimeScale';
import { BBox } from '../../../scene/bbox';
import { Group, TranslatableGroup } from '../../../scene/group';
import type { Node, NodeWithOpacity } from '../../../scene/node';
import { SegmentedGroup } from '../../../scene/segmentedGroup';
import { Selection } from '../../../scene/selection';
import { Path } from '../../../scene/shape/path';
import { type Segment, SegmentedPath } from '../../../scene/shape/segmentedPath';
import { Text } from '../../../scene/shape/text';
import { QuadtreeNearest } from '../../../scene/util/quadtree';
import { StateMachine } from '../../../util/stateMachine';
import { NumberAxis } from '../../axis/numberAxis';
import { TimeAxis } from '../../axis/timeAxis';
import type { ChartAnimationPhase } from '../../chartAnimationPhase';
import type { ChartAxis } from '../../chartAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';
import {
    DataModelSeries,
    type DataModelSeriesConstructorOpts,
    type DataModelSeriesNodeDataContext,
    type DataModelSeriesNodeDatum,
} from '../dataModelSeries';
import type { SeriesDirectionKeysMapping, SeriesNodePickMatch } from '../series';
import { SeriesNodeEvent } from '../series';
import { Segmentation, SeriesProperties } from '../seriesProperties';
import type { DatumIndexType, ISeries, SeriesNodeDatum, SeriesNodeEventTypes } from '../seriesTypes';
import { type ShapeFillBBox } from '../shapeUtil';
import { countExpandingSearch, visibleRangeIndices } from '../util';
import type { Scaling } from './scaling';

export interface CartesianSeriesNodeDatum extends DataModelSeriesNodeDatum {
    readonly xKey: string;
    readonly yKey?: string;
    readonly xValue?: any;
    readonly yValue?: any;
}

type CartesianSeriesOpts<
    TNode extends Node<TDatum>,
    TProps extends CartesianSeriesProperties<any>,
    TDatum extends CartesianSeriesNodeDatum,
    TLabel extends SeriesNodeDatum<number>,
> = {
    pathsPerSeries: string[];
    pathsZIndexSubOrderOffset: number[];
    propertyKeys: SeriesDirectionKeysMapping<TProps>;
    propertyNames: SeriesDirectionKeysMapping<TProps>;
    datumSelectionGarbageCollection: boolean;
    animationAlwaysUpdateSelections: boolean;
    segmentedDataNodes: boolean;
    animationResetFns?: {
        path?: (path: Path<TDatum>) => Partial<Path<TDatum>>;
        datum?: (node: TNode, datum: TDatum) => AnimationValue & Partial<TNode>;
        label?: (node: Text, datum: TLabel) => AnimationValue & Partial<Text>;
    };
};

export const DEFAULT_CARTESIAN_DIRECTION_KEYS = {
    [ChartAxisDirection.X]: ['xKey' as const],
    [ChartAxisDirection.Y]: ['yKey' as const],
};

export const DEFAULT_CARTESIAN_DIRECTION_NAMES = {
    [ChartAxisDirection.X]: ['xName' as const],
    [ChartAxisDirection.Y]: ['yName' as const],
};

export class CartesianSeriesNodeEvent<TEvent extends string = SeriesNodeEventTypes> extends SeriesNodeEvent<
    SeriesNodeDatum<number>,
    TEvent
> {
    readonly xKey?: string;
    readonly yKey?: string;
    constructor(
        type: TEvent,
        nativeEvent: Event,
        datum: SeriesNodeDatum<number>,
        series: ISeries<number, SeriesNodeDatum<number>, { xKey?: string; yKey?: string }>
    ) {
        super(type, nativeEvent, datum, series);
        this.xKey = series.properties.xKey;
        this.yKey = series.properties.yKey;
    }
}

type CartesianAnimationState = 'empty' | 'ready' | 'waiting' | 'clearing' | 'disabled';
type CartesianAnimationEvent<
    TNode extends Node,
    TDatum extends CartesianSeriesNodeDatum,
    TLabel extends SeriesNodeDatum<number> = TDatum,
    TContext extends CartesianSeriesNodeDataContext<TDatum, TLabel> = CartesianSeriesNodeDataContext<TDatum, TLabel>,
> = {
    update: CartesianAnimationData<TNode, TDatum, TLabel, TContext>;
    updateData: undefined;
    highlight: Selection<TNode, TDatum>;
    resize: CartesianAnimationData<TNode, TDatum, TLabel, TContext>;
    clear: CartesianAnimationData<TNode, TDatum, TLabel, TContext>;
    reset: undefined;
    skip: undefined;
    disable: undefined;
};

export interface CartesianAnimationData<
    TNode extends Node,
    TDatum extends CartesianSeriesNodeDatum,
    TLabel extends SeriesNodeDatum<number> = TDatum,
    TContext extends CartesianSeriesNodeDataContext<TDatum, TLabel> = CartesianSeriesNodeDataContext<TDatum, TLabel>,
> {
    datumSelection: Selection<TNode, TDatum>;
    labelSelection: Selection<Text, TLabel>;
    annotationSelections: Selection<NodeWithOpacity, TDatum>[];
    contextData: TContext;
    previousContextData?: TContext;
    paths: Path[];
    seriesRect?: BBox;
    duration?: number;
}

export abstract class CartesianSeriesProperties<T extends object> extends SeriesProperties<T> {
    @Property
    legendItemName?: string;

    @Property
    pickOutsideVisibleMinorAxis = false;

    @Property
    segmentation: AgSeriesSegmentation = new Segmentation();
}

export interface CartesianSeriesNodeDataContext<
    TDatum extends CartesianSeriesNodeDatum = CartesianSeriesNodeDatum,
    TLabel extends SeriesNodeDatum<number> = TDatum,
> extends DataModelSeriesNodeDataContext<TDatum, TLabel> {
    scales: { [key in ChartAxisDirection]?: Scaling };
    animationValid?: boolean;
    visible: boolean;
    segments?: Segment[];
}

export const RENDER_TO_OFFSCREEN_CANVAS_THRESHOLD = 100;

export abstract class CartesianSeries<
    TNode extends Node<any>,
    TOpts extends object,
    TProps extends CartesianSeriesProperties<TOpts>,
    TDatum extends CartesianSeriesNodeDatum,
    TLabel extends SeriesNodeDatum<number> = TDatum,
    TContext extends CartesianSeriesNodeDataContext<TDatum, TLabel> = CartesianSeriesNodeDataContext<TDatum, TLabel>,
    TStackContext = never,
> extends DataModelSeries<TDatum, TOpts, TProps, TLabel, TContext> {
    private _contextNodeData?: TContext;
    get contextNodeData() {
        return this._contextNodeData;
    }

    public override getNodeData(): TDatum[] | undefined {
        return this.contextNodeData?.nodeData;
    }

    protected override readonly NodeEvent = CartesianSeriesNodeEvent;

    private readonly paths: SegmentedPath[];
    protected readonly dataNodeGroup = this.contentGroup.appendChild(
        new SegmentedGroup({ name: `${this.id}-series-dataNodes`, zIndex: 1 })
    );
    override readonly labelGroup = this.contentGroup.appendChild(
        new TranslatableGroup({ name: `${this.id}-series-labels` })
    );
    private datumSelection: Selection<TNode, TDatum>;
    protected labelSelection: Selection<Text, TLabel> = Selection.select(this.labelGroup, Text);

    private highlightSelection = Selection.select(this.highlightNodeGroup, () => this.nodeFactory());
    protected highlightLabelSelection: Selection<Text, TLabel> = Selection.select(this.highlightLabelGroup, Text);

    public annotationSelections: Set<Selection<NodeWithOpacity, TDatum>> = new Set();

    public seriesBelowStackContext: TStackContext | undefined = undefined;

    private readonly opts: CartesianSeriesOpts<TNode, TProps, TDatum, TLabel>;
    private readonly debug = Debug.create();

    protected quadtree?: QuadtreeNearest<TDatum>;

    protected animationState: StateMachine<
        CartesianAnimationState,
        CartesianAnimationEvent<TNode, TDatum, TLabel, TContext>
    >;

    constructor({
        pathsPerSeries = ['path'],
        pathsZIndexSubOrderOffset = [],
        datumSelectionGarbageCollection = true,
        animationAlwaysUpdateSelections = false,
        segmentedDataNodes = true,
        animationResetFns,
        propertyKeys,
        propertyNames,
        ...otherOpts
    }: Partial<CartesianSeriesOpts<TNode, TProps, TDatum, TLabel>> &
        Pick<CartesianSeriesOpts<TNode, TProps, TDatum, TLabel>, 'propertyKeys' | 'propertyNames'> &
        DataModelSeriesConstructorOpts<TProps>) {
        super({
            propertyKeys,
            propertyNames,
            canHaveAxes: true,
            ...otherOpts,
        });

        if (!propertyKeys || !propertyNames) throw new Error(`Unable to initialise series type ${this.type}`);

        this.opts = {
            pathsPerSeries,
            pathsZIndexSubOrderOffset,
            propertyKeys,
            propertyNames,
            animationResetFns,
            animationAlwaysUpdateSelections,
            datumSelectionGarbageCollection,
            segmentedDataNodes,
        };

        this.paths = pathsPerSeries.map((path) => {
            return new SegmentedPath({ name: `${this.id}-${path}` });
        });

        this.datumSelection = Selection.select(
            this.dataNodeGroup,
            () => this.nodeFactory(),
            datumSelectionGarbageCollection
        );

        this.animationState = new StateMachine<
            CartesianAnimationState,
            CartesianAnimationEvent<TNode, TDatum, TLabel, TContext>
        >(
            'empty',
            {
                empty: {
                    update: {
                        target: 'ready',
                        action: (data) => this.animateEmptyUpdateReady(data),
                    },
                    reset: 'empty',
                    skip: 'ready',
                    disable: 'disabled',
                },
                ready: {
                    updateData: 'waiting',
                    clear: 'clearing',
                    highlight: (data) => this.animateReadyHighlight(data),
                    resize: (data) => this.animateReadyResize(data),
                    reset: 'empty',
                    skip: 'ready',
                    disable: 'disabled',
                },
                waiting: {
                    update: {
                        target: 'ready',
                        action: (data) => {
                            if (this.ctx.animationManager.isSkipped()) {
                                this.resetAllAnimation(data);
                            } else {
                                this.animateWaitingUpdateReady(data);
                            }
                        },
                    },
                    reset: 'empty',
                    skip: 'ready',
                    disable: 'disabled',
                },
                disabled: {
                    update: (data) => this.resetAllAnimation(data),
                    reset: 'empty',
                },
                clearing: {
                    update: {
                        target: 'empty',
                        action: (data) => this.animateClearingUpdateEmpty(data),
                    },
                    reset: 'empty',
                    skip: 'ready',
                },
            },
            () => this.checkProcessedDataAnimatable()
        );

        this.cleanup.register(
            this.ctx.eventsHub.on('legend:item-click', (event) => this.onLegendItemClick(event)),
            this.ctx.eventsHub.on('legend:item-double-click', (event) => this.onLegendItemDoubleClick(event))
        );
    }

    override attachSeries(seriesContentNode: Group, seriesNode: Group, annotationNode: Group | undefined): void {
        super.attachSeries(seriesContentNode, seriesNode, annotationNode);

        this.attachPaths(this.paths);
    }

    override detachSeries(
        seriesContentNode: Group | undefined,
        seriesNode: Group,
        annotationNode: Group | undefined
    ): void {
        super.detachSeries(seriesContentNode, seriesNode, annotationNode);

        this.detachPaths(this.paths);
    }

    override updatedDomains(): void {
        this.animationState.transition('updateData');
    }

    protected attachPaths(paths: Path[]) {
        for (const path of paths) {
            this.contentGroup.appendChild(path);
        }
    }

    protected detachPaths(paths: Path[]) {
        for (const path of paths) {
            path.remove();
        }
    }

    override renderToOffscreenCanvas(): boolean {
        const nodeData = this.getNodeData();
        return nodeData != null && nodeData.length > RENDER_TO_OFFSCREEN_CANVAS_THRESHOLD;
    }

    override resetAnimation(phase: ChartAnimationPhase): void {
        if (phase === 'initial') {
            this.animationState.transition('reset');
        } else if (phase === 'ready') {
            this.animationState.transition('skip');
        } else if (phase === 'disabled') {
            this.animationState.transition('disable');
        }
    }

    override destroy() {
        super.destroy();

        this._contextNodeData = undefined;
    }

    public override isSeriesHighlighted(highlightedDatum: HighlightNodeDatum | undefined) {
        const { series, legendItemName: activeLegendItemName } = highlightedDatum ?? {};

        const { legendItemName } = this.properties;

        return series === this || (legendItemName != null && legendItemName === activeLegendItemName);
    }

    protected strokewidthChange() {
        const unhighlightedStrokeWidth = ('strokeWidth' in this.properties && this.properties.strokeWidth) ?? 0;
        const highlightedSeriesStrokeWidth =
            this.properties.highlight.highlightedSeries.strokeWidth ?? unhighlightedStrokeWidth;
        const highlightedItemStrokeWidth =
            this.properties.highlight.highlightedItem?.strokeWidth ?? unhighlightedStrokeWidth;
        return (
            unhighlightedStrokeWidth > highlightedItemStrokeWidth ||
            highlightedSeriesStrokeWidth > highlightedItemStrokeWidth
        );
    }

    update({ seriesRect }: { seriesRect?: BBox }) {
        const { _contextNodeData: previousContextData } = this;

        const resize = this.checkResize(seriesRect);
        const itemHighlighted = this.updateHighlightSelection();

        this.contentGroup.batchedUpdate(() => {
            const dataChanged = this.updateSelections();
            const segments = this.contextNodeData?.segments;
            if (this.opts.segmentedDataNodes) {
                this.dataNodeGroup.segments = segments ?? this.dataNodeGroup.segments;
            } else {
                this.dataNodeGroup.segments = undefined;
            }

            this.updateNodes(itemHighlighted, resize || dataChanged);
        });

        const animationData = this.getAnimationData(seriesRect, previousContextData);
        if (!animationData) return;

        if (resize) {
            this.animationState.transition('resize', animationData);
        }
        this.animationState.transition('update', animationData);
        this.processedDataUpdated = false;
    }

    public createStackContext(): TStackContext | undefined {
        // Override point for subclasses to create a stack context.
        return undefined;
    }

    protected updateSelections() {
        const animationSkipUpdate = !this.opts.animationAlwaysUpdateSelections && this.ctx.animationManager.isSkipped();
        if (!this.visible && animationSkipUpdate) {
            return false;
        }
        const { nodeDataRefresh } = this;
        if (!nodeDataRefresh && !this.isPathOrSelectionDirty()) {
            return false;
        }
        if (nodeDataRefresh) {
            this.nodeDataRefresh = false;

            this.debug(`CartesianSeries.updateSelections() - calling createNodeData() for`, this.id);

            this.markQuadtreeDirty();
            this._contextNodeData = this.createNodeData();
            const animationValid = this.isProcessedDataAnimatable();
            if (this._contextNodeData) {
                this._contextNodeData.animationValid ??= animationValid;
            }

            const { dataModel, processedData } = this;
            if (dataModel !== undefined && processedData !== undefined) {
                this.events.emit('data-update', { dataModel, processedData });
            }
            this.updateSeriesSelections();
        }

        return nodeDataRefresh;
    }

    private updateSeriesSelections() {
        const { datumSelection, labelSelection, paths } = this;
        const contextData = this._contextNodeData;
        if (!contextData) return;

        const { nodeData, labelData, itemId } = contextData;

        this.updatePaths({ itemId, contextData, paths });
        this.datumSelection = this.updateDatumSelection({ nodeData, datumSelection });
        this.labelGroup.batchedUpdate(() => {
            this.labelSelection = this.updateLabelSelection({ labelData, labelSelection }) ?? labelSelection;
        });
    }

    protected abstract nodeFactory(): TNode;

    protected getShapeFillBBox(): ShapeFillBBox {
        const { axes } = this;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        const [axisX1, axisX2] = findMinMax(xAxis?.range ?? [0, 1]);
        const [axisY1, axisY2] = findMinMax(yAxis?.range ?? [0, 1]);

        const xSeriesDomain = this.getSeriesDomain(ChartAxisDirection.X);
        const xSeriesRange = [xAxis?.scale.convert(xSeriesDomain.at(0)), xAxis?.scale.convert(xSeriesDomain.at(-1))];
        const ySeriesDomain = this.getSeriesDomain(ChartAxisDirection.Y);
        const ySeriesRange = [yAxis?.scale.convert(ySeriesDomain.at(0)), yAxis?.scale.convert(ySeriesDomain.at(-1))];
        const [seriesX1, seriesX2] = findMinMax(xSeriesRange);
        const [seriesY1, seriesY2] = findMinMax(ySeriesRange);

        return {
            axis: new BBox(axisX1, axisY1, axisX2 - axisX1, axisY2 - axisY1),
            series: new BBox(seriesX1, seriesY1, seriesX2 - seriesX1, seriesY2 - seriesY1),
        };
    }

    protected updateNodes(itemHighlighted: boolean, nodeRefresh: boolean) {
        const { highlightSelection, datumSelection } = this;

        const animationEnabled = !this.ctx.animationManager.isSkipped();
        const visible = this.visible && this._contextNodeData != null;
        this.contentGroup.visible = animationEnabled || visible;

        this.highlightGroup.visible = (animationEnabled || visible) && itemHighlighted;

        this.updateDatumStyles({ datumSelection: highlightSelection, isHighlight: true });
        const drawingMode = this.ctx.chartService.highlight?.drawingMode ?? 'overlay';

        this.updateDatumNodes({
            datumSelection: highlightSelection,
            isHighlight: true,
            drawingMode,
        });
        this.highlightLabelGroup.batchedUpdate(() => {
            this.updateLabelNodes({ labelSelection: this.highlightLabelSelection, isHighlight: true });
        });

        this.animationState.transition('highlight', highlightSelection);

        const { dataNodeGroup, labelSelection, paths, labelGroup } = this;
        const { itemId } = this.contextNodeData ?? {};

        this.updatePathNodes({ itemId, paths, visible, animationEnabled });

        dataNodeGroup.visible = animationEnabled || visible;
        labelGroup.visible = visible;
        if (!dataNodeGroup.visible) {
            return;
        }

        if (this.hasItemStylers()) {
            this.updateDatumStyles({ datumSelection, isHighlight: false });
        }

        const redrawAll = this.strokewidthChange() || this.hasChangesOnHighlight;

        if (nodeRefresh || redrawAll) {
            this.updateDatumNodes({ datumSelection, isHighlight: false, drawingMode: 'overlay' });
            if (!this.usesPlacedLabels) {
                this.labelGroup.batchedUpdate(() => {
                    this.updateLabelNodes({ labelSelection, isHighlight: false });
                });
            }
        }
    }

    protected getHighlightData(_nodeData: TDatum[], highlightedItem: TDatum): TDatum[] | undefined {
        return highlightedItem ? [{ ...highlightedItem }] : undefined;
    }

    protected getHighlightLabelData(labelData: TLabel[], highlightedItem: TDatum): TLabel[] | undefined {
        const labelItems = labelData.filter(
            (ld) => ld.datum === highlightedItem.datum && ld.itemId === highlightedItem.itemId
        );
        return labelItems.length === 0 ? undefined : labelItems;
    }

    protected updateHighlightSelection(): boolean {
        const { highlightSelection, highlightLabelSelection, _contextNodeData: contextNodeData } = this;
        if (!contextNodeData) return false;

        const highlightedDatum = this.ctx.highlightManager?.getActiveHighlight();
        const seriesHighlighted = this.isSeriesHighlighted(highlightedDatum);
        const item = seriesHighlighted && highlightedDatum?.datum ? (highlightedDatum as TDatum) : undefined;

        if (item == null) return false;

        const { nodeData, labelData } = contextNodeData;
        const highlightItems = this.getHighlightData(nodeData, item);
        this.highlightSelection = this.updateHighlightSelectionItem({
            items: highlightItems,
            highlightSelection,
        });
        const highlightLabelItems = this.getHighlightLabelData(labelData, item) ?? [];
        this.highlightLabelSelection =
            this.updateLabelSelection({
                labelData: highlightLabelItems,
                labelSelection: highlightLabelSelection,
            }) ?? highlightLabelSelection;

        return true;
    }

    protected markQuadtreeDirty() {
        this.quadtree = undefined;
    }

    protected *datumNodesIter(): Iterable<TNode> {
        for (const { node } of this.datumSelection) {
            if (node.datum.missing === true) continue;

            yield node;
        }
    }

    public getQuadTree(): QuadtreeNearest<TDatum> {
        if (this.quadtree === undefined) {
            const { width, height } = this.ctx.scene.canvas;
            const canvasRect = new BBox(0, 0, width, height);
            this.quadtree = new QuadtreeNearest<TDatum>(100, 10, canvasRect);
            this.initQuadTree(this.quadtree);
        }
        return this.quadtree;
    }

    protected initQuadTree(_quadtree: QuadtreeNearest<TDatum>) {
        // Override point for subclasses
    }

    protected pickNodeDataExactShape(point: Point): SeriesNodeDatum<DatumIndexType>[] | undefined {
        const { x, y } = point;

        const { dataNodeGroup } = this;
        const matches = dataNodeGroup.pickNodes(x, y).filter((match) => match.datum.missing !== true);

        if (matches.length !== 0) {
            const datums = matches.map((match) => match.datum);
            return datums;
        }
    }

    protected pickModulesExactShape(point: Point): SeriesNodeDatum<DatumIndexType>[] | undefined {
        for (const mod of this.moduleMap.modules()) {
            const { datum } = mod.pickNodeExact(point) ?? {};
            if (datum == null) continue;
            if (datum?.missing === true) continue;

            return [datum];
        }
    }

    protected override pickNodesExactShape(point: Point): SeriesNodeDatum<DatumIndexType>[] {
        const result = super.pickNodesExactShape(point);

        if (result.length !== 0) {
            return result;
        }

        return this.pickNodeDataExactShape(point) ?? this.pickModulesExactShape(point) ?? [];
    }

    protected pickNodeDataClosestDatum(point: Point) {
        const { x, y } = point;
        const { axes, _contextNodeData: contextNodeData } = this;
        if (!contextNodeData) return;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        const hitPoint = { x, y };

        let minDistanceSquared = Infinity;
        let closestDatum: SeriesNodeDatum<DatumIndexType> | undefined;

        for (const datum of contextNodeData.nodeData) {
            const { point: { x: datumX = Number.NaN, y: datumY = Number.NaN } = {} } = datum;
            if (Number.isNaN(datumX) || Number.isNaN(datumY)) {
                continue;
            }

            const isInRange = xAxis?.inRange(datumX) && yAxis?.inRange(datumY);
            if (!isInRange) {
                continue;
            }

            // No need to use Math.sqrt() since x < y implies Math.sqrt(x) < Math.sqrt(y) for
            // values > 1
            const distanceSquared = Math.max((hitPoint.x - datumX) ** 2 + (hitPoint.y - datumY) ** 2, 0);
            if (distanceSquared < minDistanceSquared) {
                minDistanceSquared = distanceSquared;
                closestDatum = datum;
            }
        }

        if (minDistanceSquared != null) {
            return { datum: closestDatum, distance: Math.sqrt(minDistanceSquared) };
        }
    }

    private pickModulesClosestDatum(point: Point) {
        let minDistanceSquared = Infinity;
        let closestDatum: SeriesNodeDatum<DatumIndexType> | undefined;

        for (const mod of this.moduleMap.modules()) {
            const modPick = mod.pickNodeNearest(point);
            if (modPick !== undefined && modPick.distanceSquared < minDistanceSquared) {
                minDistanceSquared = modPick.distanceSquared;
                closestDatum = modPick.datum;
            }
        }

        if (minDistanceSquared != null) {
            return { datum: closestDatum, distance: Math.sqrt(minDistanceSquared) };
        }
    }

    protected override pickNodeClosestDatum(point: Point): SeriesNodePickMatch | undefined {
        let minDistance = Infinity;
        let closestDatum: SeriesNodeDatum<DatumIndexType> | undefined;

        const pick = this.pickNodeDataClosestDatum(point);
        if (pick != null && pick.distance < minDistance) {
            minDistance = pick.distance;
            closestDatum = pick.datum;
        }

        const modPick = this.pickModulesClosestDatum(point);
        if (modPick != null && modPick.distance < minDistance) {
            minDistance = modPick.distance;
            closestDatum = modPick.datum;
        }

        if (closestDatum) {
            const distance = Math.max(minDistance - (closestDatum.point?.size ?? 0) / 2, 0);
            return { datum: closestDatum, distance };
        }
    }

    protected override pickNodeMainAxisFirst(
        point: Point,
        requireCategoryAxis: boolean
    ): SeriesNodePickMatch | undefined {
        const { x, y } = point;
        const { axes, _contextNodeData: contextNodeData } = this;
        const { pickOutsideVisibleMinorAxis } = this.properties;
        if (!contextNodeData) return;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];
        if (xAxis == null || yAxis == null) return;

        // Prefer to start search with any available category axis.
        const directions = [xAxis, yAxis].filter((axis) => axis.isCategoryLike()).map((a) => a.direction);
        if (requireCategoryAxis && directions.length === 0) return;

        // Default to X-axis unless we found a suitable category axis.
        const [majorDirection = ChartAxisDirection.X] = directions;

        const hitPointCoords = [x, y];
        if (majorDirection !== ChartAxisDirection.X) hitPointCoords.reverse();

        const minDistance = [Infinity, Infinity];
        let closestDatum: SeriesNodeDatum<DatumIndexType> | undefined;

        for (const datum of contextNodeData.nodeData) {
            const { x: datumX = Number.NaN, y: datumY = Number.NaN } = datum.point ?? datum.midPoint ?? {};
            if (Number.isNaN(datumX) || Number.isNaN(datumY) || datum.missing === true) continue;

            const visible = [xAxis?.inRange(datumX, 1), yAxis?.inRange(datumY, 1)];
            if (majorDirection !== ChartAxisDirection.X) {
                visible.reverse();
            }
            if (!visible[0] || (!pickOutsideVisibleMinorAxis && !visible[1])) continue;

            const datumPoint = [datumX, datumY];
            if (majorDirection !== ChartAxisDirection.X) {
                datumPoint.reverse();
            }

            // Compare distances from most significant dimension to least.
            let newMinDistance = true;
            for (let i = 0; i < datumPoint.length; i++) {
                const dist = Math.abs(datumPoint[i] - hitPointCoords[i]);
                if (dist > minDistance[i]) {
                    newMinDistance = false;
                    break;
                } else if (dist < minDistance[i]) {
                    minDistance[i] = dist;
                    minDistance.fill(Infinity, i + 1, minDistance.length);
                }
            }

            if (newMinDistance) {
                closestDatum = datum;
            }
        }

        if (closestDatum) {
            let closestDistanceSquared = Math.max(
                minDistance[0] ** 2 + minDistance[1] ** 2 - (closestDatum.point?.size ?? 0),
                0
            );

            for (const mod of this.moduleMap.modules()) {
                const modPick = mod.pickNodeMainAxisFirst(point, majorDirection);
                if (modPick != null && modPick.distanceSquared < closestDistanceSquared) {
                    closestDatum = modPick.datum;
                    closestDistanceSquared = modPick.distanceSquared;
                    break;
                }
            }

            return {
                datum: closestDatum!,
                distance: Math.sqrt(closestDistanceSquared),
            };
        }
    }

    protected isPathOrSelectionDirty(): boolean {
        // Override point to allow more sophisticated dirty selection detection.
        return false;
    }

    shouldFlipXY(): boolean {
        return false;
    }

    protected abstract xCoordinateRange(xValue: any, pixelSize: number, index: number): [number, number];
    protected abstract yCoordinateRange(yValues: any[], pixelSize: number, index: number): [number, number];

    visibleRangeIndices(
        axisKey: string,
        visibleRange: [any, any],
        indices?: number[],
        sortOrderParams?: { sortOrder: 1 | -1 }
    ): [number, number] {
        let sortOrder: 1 | -1;
        if (sortOrderParams == null) {
            const { processedData, dataModel } = this;
            sortOrder = dataModel!.getColumnSortOrder(this, axisKey, processedData!) ?? 1;
        } else {
            sortOrder = sortOrderParams.sortOrder;
        }

        const xValues = this.keysOrValues(axisKey);
        // @todo(AG-7083) - figure out how to determine this
        const pixelSize = 0;
        const [start, end] = visibleRangeIndices(
            sortOrder,
            indices?.length ?? xValues.length,
            visibleRange,
            (topIndex) => {
                const datumIndex = indices?.[topIndex] ?? topIndex;
                return this.xCoordinateRange(xValues[datumIndex], pixelSize, datumIndex);
            }
        );

        return start < end ? [start, end] : [end, start];
    }

    protected domainForVisibleRange(
        _direction: ChartAxisDirection,
        axisKeys: string[],
        crossAxisKey: string,
        visibleRange: [any, any],
        indices?: number[]
    ) {
        const { processedData, dataModel } = this;

        const [r0, r1] = visibleRange;
        const crossAxisValues = this.keysOrValues(crossAxisKey);

        const sortOrder = this.sortOrder(crossAxisKey);
        if (sortOrder != null) {
            const crossAxisRange = this.visibleRangeIndices(crossAxisKey, visibleRange, indices, { sortOrder });
            return dataModel!.getDomainBetweenRange(this, axisKeys, crossAxisRange, processedData!);
        }

        const allAxisValues = axisKeys.map((axisKey) => this.keysOrValues(axisKey));

        let axisMin = Infinity;
        let axisMax = -Infinity;
        for (const [i, crossAxisValue] of crossAxisValues.entries()) {
            const [x0, x1] = this.xCoordinateRange(crossAxisValue, 0, i);
            if (x1 < r0 || x0 > r1) continue;

            for (let j = 0; j < axisKeys.length; j++) {
                const axisValue = allAxisValues[j][i];
                axisMin = Math.min(axisMin, axisValue);
                axisMax = Math.max(axisMax, axisValue);
            }
        }

        if (axisMin > axisMax) return [Number.NaN, Number.NaN];

        return [axisMin, axisMax];
    }

    protected domainForClippedRange(direction: ChartAxisDirection, axisKeys: string[], crossAxisKey: string) {
        const { processedData, dataModel, axes } = this;

        const crossDirection = direction === ChartAxisDirection.X ? ChartAxisDirection.Y : ChartAxisDirection.X;
        const crossAxisRange = axisExtent(axes[crossDirection]!);

        if (!crossAxisRange) {
            return axisKeys.flatMap((axisKey) => dataModel!.getDomain(this, axisKey, 'value', processedData!));
        }

        const crossAxisValues = this.keysOrValues(crossAxisKey);
        const sortOrder = dataModel!.getColumnSortOrder(this, crossAxisKey, processedData!);
        if (sortOrder != null) {
            const crossRange = clippedRangeIndices(
                sortOrder,
                crossAxisValues.length,
                crossAxisRange,
                (index) => crossAxisValues[index]
            );
            return dataModel!.getDomainBetweenRange(this, axisKeys, crossRange, processedData!);
        }

        const allAxisValues = axisKeys.map((axisKey) => this.keysOrValues(axisKey));
        const range0 = crossAxisRange[0].valueOf();
        const range1 = crossAxisRange[1].valueOf();
        const axisValues: any[] = [];
        for (const [i, crossAxisValue] of crossAxisValues.entries()) {
            const c = crossAxisValue.valueOf();
            if (c < range0 || c > range1) continue;

            const values = allAxisValues.map((v) => v[i]);
            if (c >= range0) {
                axisValues.push(...values);
            }
            if (c <= range1) {
                axisValues.push(...values);
            }
        }

        return axisValues;
    }

    protected zoomFittingVisibleItems(
        crossAxisKey: string,
        _axisKeys: string[],
        xVisibleRange: [number, number],
        yVisibleRange: [number, number] | undefined,
        minVisibleItems: number
    ): { x: [number, number]; y: [number, number] | undefined } | undefined {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) return;

        // The provided visible ranges `[xy]VisibleRange` are relative to the unzoomed axis ranges `[xy]Axis.range`.
        // `[xy]Axis.visibleRange` are relative to the zoomed scale ranges `[xy]Axis.scale.range`.
        // So we need to scale the provided visible ranges relative to the zoomed scale range to find the min and max
        // position in pixels that the visible range ratio covers.
        const crossAxis = this.axes[ChartAxisDirection.X]!;

        if (yVisibleRange != null) return;

        const sortOrder = this.sortOrder(crossAxisKey);
        if (sortOrder == null) return;

        const xValues = this.keysOrValues(crossAxisKey);

        if (minVisibleItems > xValues.length) {
            return { x: [0, 1], y: undefined };
        }

        // Fast path if we only need to look at the x axis
        const crossScale = crossAxis.scale;
        const crossScaleRange = crossScale.range;
        crossScale.range = [0, 1];

        let [r0, r1] = this.visibleRangeIndices(crossAxisKey, xVisibleRange, undefined, { sortOrder });
        r1 -= 1;

        // @todo(AG-7083) - figure out how to determine this
        const pixelSize = 0;
        if (this.xCoordinateRange(xValues[r0], pixelSize, r0)[0] < xVisibleRange[0]) {
            r0 += 1;
        }
        if (this.xCoordinateRange(xValues[r1], pixelSize, r1)[1] > xVisibleRange[1]) {
            r1 -= 1;
        }

        let xZoom: [number, number] | undefined;
        if (Math.abs(r1 - r0) >= minVisibleItems - 1) {
            xZoom = xVisibleRange;
        } else {
            const midPoint = (xVisibleRange[0] + xVisibleRange[1]) / 2;
            while (Math.abs(r1 - r0) < minVisibleItems - 1 && (r0 > 0 || r1 < xValues.length - 1)) {
                if (r0 === 0) {
                    r1 += 1;
                } else if (r1 === xValues.length - 1) {
                    r0 -= 1;
                } else {
                    const nextR0X = this.xCoordinateRange(xValues[r0 - 1], pixelSize, r0 - 1)[0];
                    const nextR1X = this.xCoordinateRange(xValues[r1 + 1], pixelSize, r1 + 1)[1];

                    if (Math.abs(nextR0X - midPoint) < Math.abs(nextR1X - midPoint)) {
                        r0 -= 1;
                    } else {
                        r1 += 1;
                    }
                }
            }

            const x0 = this.xCoordinateRange(xValues[r0], pixelSize, r0)[0];
            const x1 = this.xCoordinateRange(xValues[r1], pixelSize, r1)[1];
            xZoom = [Math.min(xVisibleRange[0], x0), Math.max(xVisibleRange[1], x1)];
        }

        crossScale.range = crossScaleRange;

        return { x: xZoom, y: undefined };
    }

    protected countVisibleItems(
        crossAxisKey: string,
        axisKeys: string[],
        xVisibleRange: [number, number],
        yVisibleRange: [number, number] | undefined,
        minVisibleItems: number
    ): number {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) return Infinity;

        const crossValues = this.keysOrValues(crossAxisKey);
        const allAxisValues = axisKeys.map((axisKey) => dataModel.resolveColumnById(this, axisKey, processedData));

        const shouldFlipXY = this.shouldFlipXY();

        // The provided visible ranges `[xy]VisibleRange` are relative to the unzoomed axis ranges `[xy]Axis.range`.
        // `[xy]Axis.visibleRange` are relative to the zoomed scale ranges `[xy]Axis.scale.range`.
        // So we need to scale the provided visible ranges relative to the zoomed scale range to find the min and max
        // position in pixels that the visible range ratio covers.
        const crossAxis = shouldFlipXY ? this.axes[ChartAxisDirection.Y]! : this.axes[ChartAxisDirection.X]!;
        const axis = shouldFlipXY ? this.axes[ChartAxisDirection.X]! : this.axes[ChartAxisDirection.Y]!;

        const crossVisibleRange = shouldFlipXY ? yVisibleRange ?? [0, 1] : xVisibleRange;
        const axisVisibleRange = shouldFlipXY ? xVisibleRange : yVisibleRange ?? [0, 1];

        if (yVisibleRange == null) {
            const sortOrder = this.sortOrder(crossAxisKey);
            if (sortOrder != null) {
                // Fast path if we only need to look at the x axis
                const crossScale = crossAxis.scale;
                const crossScaleRange = crossScale.range;
                crossScale.range = [0, 1];

                const xValues = this.keysOrValues(crossAxisKey);

                let [r0, r1] = this.visibleRangeIndices(crossAxisKey, crossVisibleRange, undefined, { sortOrder });
                r1 -= 1;

                // @todo(AG-7083) - figure out how to determine this
                const pixelSize = 0;
                if (this.xCoordinateRange(xValues[r0], pixelSize, r0)[0] < crossVisibleRange[0]) {
                    r0 += 1;
                }
                if (this.xCoordinateRange(xValues[r1], pixelSize, r1)[1] > crossVisibleRange[1]) {
                    r1 -= 1;
                }

                const xItemsVisible = Math.abs(r1 - r0) + 1;

                crossScale.range = crossScaleRange;

                return xItemsVisible;
            }
        }

        const convert = (d: number[], r: number[], v: number) => {
            return d[0] + ((v - r[0]) / (r[1] - r[0])) * (d[1] - d[0]);
        };

        const crossAxisRange = crossAxis.range.toSorted();
        const axisRange = axis.range.toSorted();

        const crossMin = convert(crossAxisRange, crossAxis.visibleRange, crossVisibleRange[0]);
        const crossMax = convert(crossAxisRange, crossAxis.visibleRange, crossVisibleRange[1]);
        const axisMin = convert(axisRange, axis.visibleRange, Math.min(...axisVisibleRange));
        const axisMax = convert(axisRange, axis.visibleRange, Math.max(...axisVisibleRange));

        const startIndex = Math.round(
            (crossVisibleRange[0] + (crossVisibleRange[1] - crossVisibleRange[0]) / 2) * crossValues.length
        );
        const pixelSize = 0;

        return countExpandingSearch(0, crossValues.length - 1, startIndex, minVisibleItems, (index) => {
            const [cross0, cross1] = this.xCoordinateRange(crossValues[index], pixelSize, index);
            const [axis0, axis1] = this.yCoordinateRange(
                allAxisValues.map((axisValues) => axisValues[index]),
                pixelSize,
                index
            );
            if (
                !isFiniteNumber(cross0) ||
                !isFiniteNumber(cross1) ||
                !isFiniteNumber(axis0) ||
                !isFiniteNumber(axis1)
            ) {
                return false;
            }
            return cross0 >= crossMin && cross1 <= crossMax && axis0 >= axisMin && axis1 <= axisMax;
        });
    }

    // @todo(AG-13777) - Remove this function.
    // We need data model updates to know if a data set is sorted & unique - and at the same time
    // it should generate the equivalent of `SMALLEST_KEY_INTERVAL`. We'll use that value here
    override minTimeInterval() {
        // eslint-disable-next-line sonarjs/use-type-alias
        let xValues: Array<Date | number | undefined> | undefined;
        try {
            xValues = this.keysOrValues<Date | number | undefined>('xValue');
        } catch {
            // No xValue key - ignore
        }

        if (xValues == null || xValues.length > 1e3) return;

        let minInterval = Infinity;
        let x0 = xValues[0];
        let sortOrder: 1 | -1 | undefined;
        for (let i = 1; i < xValues.length; i++) {
            const x1 = xValues[i];

            if (x1 != null && x0 != null) {
                const interval = x1.valueOf() - x0.valueOf();
                const sign = Math.sign(interval) as 1 | 0 | -1;
                if (sign === 0) continue;
                if (sortOrder !== undefined && sign !== sortOrder) return; // Unsorted
                minInterval = Math.min(minInterval, Math.abs(interval));
                sortOrder = sign;
            }

            x0 = x1;
        }

        if (Number.isFinite(minInterval)) return minInterval;
    }

    protected updateHighlightSelectionItem(opts: {
        items?: TDatum[];
        highlightSelection: Selection<TNode, TDatum>;
    }): Selection<TNode, TDatum> {
        const { items, highlightSelection } = opts;
        const nodeData = items ?? [];

        return this.updateDatumSelection({
            nodeData,
            datumSelection: highlightSelection,
        });
    }

    protected updateDatumSelection(opts: {
        nodeData: TDatum[];
        datumSelection: Selection<TNode, TDatum>;
    }): Selection<TNode, TDatum> {
        // Override point for sub-classes.
        return opts.datumSelection;
    }
    protected updateDatumNodes(_opts: {
        datumSelection: Selection<TNode, TDatum>;
        isHighlight: boolean;
        drawingMode: AgDrawingMode;
    }): void {
        // Override point for sub-classes.
    }

    protected updateDatumStyles(_opts: { datumSelection: Selection<TNode, TDatum>; isHighlight: boolean }): void {
        // Override point for sub-classes.
    }

    protected updatePaths(opts: { itemId?: string; contextData: TContext; paths: Path[] }): void {
        // Override point for sub-classes.
        for (const p of opts.paths) {
            p.visible = false;
        }
    }

    protected updatePathNodes(opts: {
        itemId?: string;
        paths: Path[];
        visible: boolean;
        animationEnabled: boolean;
    }): void {
        const { paths, visible } = opts;
        for (const path of paths) {
            path.visible = visible;
        }
    }

    protected resetPathAnimation(data: CartesianAnimationData<TNode, TDatum, TLabel, TContext>) {
        const { path } = this.opts?.animationResetFns ?? {};

        if (path) {
            for (const paths of data.paths) {
                resetMotion([paths], path);
            }
        }
    }

    protected resetDatumAnimation(data: CartesianAnimationData<TNode, TDatum, TLabel, TContext>) {
        const { datum } = this.opts?.animationResetFns ?? {};

        if (datum) {
            resetMotion([data.datumSelection], datum);
        }
    }

    protected resetLabelAnimation(data: CartesianAnimationData<TNode, TDatum, TLabel, TContext>) {
        const { label } = this.opts?.animationResetFns ?? {};

        if (label) {
            resetMotion([data.labelSelection], label);
        }
    }

    protected resetAllAnimation(data: CartesianAnimationData<TNode, TDatum, TLabel, TContext>) {
        // Stop any running animations by prefix convention.
        this.ctx.animationManager.stopByAnimationGroupId(this.id);

        this.resetPathAnimation(data);
        this.resetDatumAnimation(data);
        this.resetLabelAnimation(data);

        if (data.contextData?.animationValid === false) {
            this.ctx.animationManager.skipCurrentBatch();
        }
    }

    protected animateEmptyUpdateReady(data: CartesianAnimationData<TNode, TDatum, TLabel, TContext>) {
        this.ctx.animationManager.skipCurrentBatch();
        this.resetAllAnimation(data);
    }

    protected animateWaitingUpdateReady(data: CartesianAnimationData<TNode, TDatum, TLabel, TContext>) {
        this.ctx.animationManager.skipCurrentBatch();
        this.resetAllAnimation(data);
    }

    protected animateReadyHighlight(data: Selection<TNode, TDatum>) {
        const { datum } = this.opts?.animationResetFns ?? {};
        if (datum) {
            resetMotion([data], datum);
        }
    }

    protected animateReadyResize(data: CartesianAnimationData<TNode, TDatum, TLabel, TContext>) {
        this.resetAllAnimation(data);
    }

    protected animateClearingUpdateEmpty(data: CartesianAnimationData<TNode, TDatum, TLabel, TContext>) {
        this.ctx.animationManager.skipCurrentBatch();
        this.resetAllAnimation(data);
    }

    private getAnimationData(seriesRect?: BBox, previousContextData?: TContext) {
        const { _contextNodeData: contextData } = this;
        if (!contextData) return;

        const animationData: CartesianAnimationData<TNode, TDatum, TLabel, TContext> = {
            datumSelection: this.datumSelection,
            labelSelection: this.labelSelection,
            annotationSelections: [...this.annotationSelections],
            contextData,
            previousContextData,
            paths: this.paths,
            seriesRect,
        };

        return animationData;
    }

    protected updateLabelSelection(opts: {
        labelData: TLabel[];
        labelSelection: Selection<Text, TLabel>;
    }): Selection<Text, TLabel> {
        return opts.labelSelection;
    }

    protected abstract updateLabelNodes(opts: { labelSelection: Selection<Text, TLabel>; isHighlight?: boolean }): void;

    protected abstract isLabelEnabled(): boolean;

    protected getScaling(scale: Scale<any, any>): Scaling | undefined {
        if (scale instanceof LogScale) {
            const { range, domain } = scale;

            return {
                type: 'log',
                convert: (d) => scale.convert(d),
                domain: [domain[0], domain[1]],
                range: [range[0], range[1]],
            };
        } else if (scale instanceof ContinuousScale) {
            const { range, domain } = scale;

            return {
                type: 'continuous',
                domain: [domain[0], domain[1]],
                range: [range[0], range[1]],
            };
        } else if (scale instanceof BandScale) {
            const domain = scale instanceof UnitTimeScale ? scale.bands : scale.domain;

            return {
                type: 'category',
                domain,
                inset: scale.inset,
                step: scale.step,
            };
        }
    }

    protected calculateScaling() {
        const result: { [key in ChartAxisDirection]?: Scaling } = {};

        for (const direction of Object.values(ChartAxisDirection)) {
            const axis = this.axes[direction];
            if (!axis) continue;

            const scalingResult = this.getScaling(axis.scale);
            if (scalingResult != null) {
                result[direction] = scalingResult;
            }
        }

        return result;
    }
}

function axisExtent(axis: ChartAxis): [number | Date, number | Date] | undefined {
    let min: number | Date | undefined;
    let max: number | Date | undefined;

    if (axis instanceof NumberAxis || axis instanceof TimeAxis) {
        ({ min, max } = axis);
    }

    if (min == null && max == null) return;

    min ??= -Infinity;
    max ??= Infinity;

    return [min, max];
}

function clippedRangeIndices(
    sortOrder: 1 | -1,
    length: number,
    range: [any, any],
    xValue: (index: number) => any
): [number, number] {
    const range0 = range[0].valueOf();
    const range1 = range[1].valueOf();

    let xMinIndex = findMinIndex(0, length - 1, (i) => {
        const index = sortOrder === 1 ? i : length - i;
        const x = xValue(index)?.valueOf();
        return !Number.isFinite(x) || x >= range0;
    });

    let xMaxIndex = findMaxIndex(0, length - 1, (i) => {
        const index = sortOrder === 1 ? i : length - i;
        const x = xValue(index)?.valueOf();
        return !Number.isFinite(x) || x! <= range1;
    });

    if (xMinIndex == null || xMaxIndex == null) return [0, 0];

    if (sortOrder === -1) {
        [xMinIndex, xMaxIndex] = [length - xMaxIndex, length - xMinIndex];
    }

    xMinIndex = Math.max(xMinIndex, 0);
    xMaxIndex = Math.min(xMaxIndex + 1, length);

    return [xMinIndex, xMaxIndex];
}
