import type { AnimationValue } from '../../../motion/animation';
import { resetMotion } from '../../../motion/resetMotion';
import { StateMachine } from '../../../motion/states';
import { ContinuousScale } from '../../../scale/continuousScale';
import { LogScale } from '../../../scale/logScale';
import { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import type { ZIndexSubOrder } from '../../../scene/layersManager';
import type { Node, NodeWithOpacity } from '../../../scene/node';
import type { Point } from '../../../scene/point';
import { Selection } from '../../../scene/selection';
import { Path } from '../../../scene/shape/path';
import { Text } from '../../../scene/shape/text';
import type { PointLabelDatum } from '../../../scene/util/labelPlacement';
import { Debug } from '../../../util/debug';
import { isFunction } from '../../../util/type-guards';
import { STRING, Validate } from '../../../util/validation';
import { CategoryAxis } from '../../axis/categoryAxis';
import type { ChartAnimationPhase } from '../../chartAnimationPhase';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { LegendItemClickChartEvent, LegendItemDoubleClickChartEvent } from '../../interaction/chartEventManager';
import { Layers } from '../../layers';
import type { Marker } from '../../marker/marker';
import { getMarker } from '../../marker/util';
import { DataModelSeries } from '../dataModelSeries';
import type { SeriesNodeDataContext, SeriesNodeEventTypes, SeriesNodePickMatch } from '../series';
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

interface SubGroup<TNode extends Node, TDatum extends SeriesNodeDatum, TLabel = TDatum> {
    paths: Path[];
    dataNodeGroup: Group;
    labelGroup: Group;
    markerGroup?: Group;
    datumSelection: Selection<TNode, TDatum>;
    labelSelection: Selection<Text, TLabel>;
    markerSelection?: Selection<Marker, TDatum>;
}
interface SeriesOpts<TNode extends Node, TDatum extends CartesianSeriesNodeDatum, TLabel extends SeriesNodeDatum> {
    pathsPerSeries: number;
    pathsZIndexSubOrderOffset: number[];
    hasMarkers: boolean;
    hasHighlightedLabels: boolean;
    directionKeys: { [key in ChartAxisDirection]?: string[] };
    directionNames: { [key in ChartAxisDirection]?: string[] };
    datumSelectionGarbageCollection: boolean;
    markerSelectionGarbageCollection: boolean;
    animationAlwaysUpdateSelections: boolean;
    animationResetFns?: {
        path?: (path: Path) => Partial<Path>;
        datum?: (node: TNode, datum: TDatum) => AnimationValue & Partial<TNode>;
        label?: (node: Text, datum: TLabel) => AnimationValue & Partial<Text>;
        marker?: (node: Marker, datum: TDatum) => AnimationValue & Partial<Marker>;
    };
}

const DEFAULT_DIRECTION_KEYS: { [key in ChartAxisDirection]?: string[] } = {
    [ChartAxisDirection.X]: ['xKey'],
    [ChartAxisDirection.Y]: ['yKey'],
};

const DEFAULT_DIRECTION_NAMES: { [key in ChartAxisDirection]?: string[] } = {
    [ChartAxisDirection.X]: ['xName'],
    [ChartAxisDirection.Y]: ['yName'],
};

export class CartesianSeriesNodeEvent<TEvent extends string = SeriesNodeEventTypes> extends SeriesNodeEvent<
    SeriesNodeDatum,
    TEvent
> {
    readonly xKey?: string;
    readonly yKey?: string;
    constructor(
        type: TEvent,
        nativeEvent: MouseEvent,
        datum: SeriesNodeDatum,
        series: ISeries<SeriesNodeDatum> & { properties: { xKey?: string; yKey?: string } }
    ) {
        super(type, nativeEvent, datum, series);
        this.xKey = series.properties.xKey;
        this.yKey = series.properties.yKey;
    }
}

type CartesianAnimationState = 'empty' | 'ready' | 'waiting' | 'clearing';
type CartesianAnimationEvent =
    | 'update'
    | 'updateData'
    | 'highlight'
    | 'highlightMarkers'
    | 'resize'
    | 'clear'
    | 'reset'
    | 'skip';

export interface CartesianAnimationData<
    TNode extends Node,
    TDatum extends CartesianSeriesNodeDatum,
    TLabel extends SeriesNodeDatum = TDatum,
    TContext extends CartesianSeriesNodeDataContext<TDatum, TLabel> = CartesianSeriesNodeDataContext<TDatum, TLabel>,
> {
    datumSelections: Selection<TNode, TDatum>[];
    markerSelections: Selection<Marker, TDatum>[];
    labelSelections: Selection<Text, TLabel>[];
    annotationSelections: Selection<NodeWithOpacity, TDatum>[];
    contextData: TContext[];
    previousContextData?: TContext[];
    paths: Path[][];
    seriesRect?: BBox;
    duration?: number;
}

export abstract class CartesianSeriesProperties<T extends object> extends SeriesProperties<T> {
    @Validate(STRING, { optional: true })
    legendItemName?: string;
}

export interface CartesianSeriesNodeDataContext<
    TDatum extends CartesianSeriesNodeDatum = CartesianSeriesNodeDatum,
    TLabel extends SeriesNodeDatum = TDatum,
> extends SeriesNodeDataContext<TDatum, TLabel> {
    scales: { [key in ChartAxisDirection]?: Scaling };
    animationValid?: boolean;
    visible: boolean;
}

export abstract class CartesianSeries<
    TNode extends Node,
    TDatum extends CartesianSeriesNodeDatum,
    TLabel extends SeriesNodeDatum = TDatum,
    TContext extends CartesianSeriesNodeDataContext<TDatum, TLabel> = CartesianSeriesNodeDataContext<TDatum, TLabel>,
> extends DataModelSeries<TDatum, TLabel, TContext> {
    abstract override properties: CartesianSeriesProperties<any>;

    private _contextNodeData: TContext[] = [];
    get contextNodeData() {
        return this._contextNodeData.slice();
    }

    protected override readonly NodeEvent = CartesianSeriesNodeEvent;

    private highlightSelection = Selection.select(this.highlightNode, () =>
        this.opts.hasMarkers ? this.markerFactory() : this.nodeFactory()
    ) as Selection<TNode, TDatum>;
    private highlightLabelSelection = Selection.select<Text, TLabel>(this.highlightLabel, Text);

    public annotationSelections: Set<Selection<NodeWithOpacity, TDatum>> = new Set();

    private subGroups: SubGroup<any, TDatum, TLabel>[] = [];
    private subGroupId: number = 0;

    private readonly opts: SeriesOpts<TNode, TDatum, TLabel>;
    private readonly debug = Debug.create();

    protected animationState: StateMachine<CartesianAnimationState, CartesianAnimationEvent>;

    protected constructor({
        pathsPerSeries = 1,
        hasMarkers = false,
        hasHighlightedLabels = false,
        pathsZIndexSubOrderOffset = [],
        directionKeys = DEFAULT_DIRECTION_KEYS,
        directionNames = DEFAULT_DIRECTION_NAMES,
        datumSelectionGarbageCollection = true,
        markerSelectionGarbageCollection = true,
        animationAlwaysUpdateSelections = false,
        animationResetFns,
        ...otherOpts
    }: Partial<SeriesOpts<TNode, TDatum, TLabel>> & ConstructorParameters<typeof DataModelSeries>[0]) {
        super({
            directionKeys,
            directionNames,
            useSeriesGroupLayer: true,
            canHaveAxes: true,
            ...otherOpts,
        });

        this.opts = {
            pathsPerSeries,
            hasMarkers,
            hasHighlightedLabels,
            pathsZIndexSubOrderOffset,
            directionKeys,
            directionNames,
            animationResetFns,
            animationAlwaysUpdateSelections,
            datumSelectionGarbageCollection,
            markerSelectionGarbageCollection,
        };

        this.animationState = new StateMachine<CartesianAnimationState, CartesianAnimationEvent>(
            'empty',
            {
                empty: {
                    update: {
                        target: 'ready',
                        action: (data) => this.animateEmptyUpdateReady(data),
                    },
                    reset: 'empty',
                    skip: 'ready',
                },
                ready: {
                    updateData: 'waiting',
                    clear: 'clearing',
                    highlight: (data) => this.animateReadyHighlight(data),
                    highlightMarkers: (data) => this.animateReadyHighlightMarkers(data),
                    resize: (data) => this.animateReadyResize(data),
                    reset: 'empty',
                    skip: 'ready',
                },
                waiting: {
                    update: {
                        target: 'ready',
                        action: (data) => this.animateWaitingUpdateReady(data),
                    },
                    reset: 'empty',
                    skip: 'ready',
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
    }

    override resetAnimation(phase: ChartAnimationPhase): void {
        if (phase === 'initial') {
            this.animationState.transition('reset');
        } else if (phase === 'ready') {
            this.animationState.transition('skip');
        }
    }

    override addChartEventListeners(): void {
        this.destroyFns.push(
            this.ctx.chartEventManager.addListener('legend-item-click', (event) => this.onLegendItemClick(event)),
            this.ctx.chartEventManager.addListener('legend-item-double-click', (event) =>
                this.onLegendItemDoubleClick(event)
            )
        );
    }

    override destroy() {
        super.destroy();

        this._contextNodeData.splice(0, this._contextNodeData.length);
        this.subGroups.splice(0, this.subGroups.length);
    }

    async update({ seriesRect }: { seriesRect?: BBox }) {
        const { visible, _contextNodeData: previousContextData } = this;
        const { series } = this.ctx.highlightManager?.getActiveHighlight() ?? {};
        const seriesHighlighted = series === this;

        const resize = this.checkResize(seriesRect);
        const highlightItems = await this.updateHighlightSelection(seriesHighlighted);

        await this.updateSelections(visible);
        await this.updateNodes(highlightItems, seriesHighlighted, visible);

        const animationData = this.getAnimationData(seriesRect, previousContextData);
        if (resize) {
            this.animationState.transition('resize', animationData);
        }
        this.animationState.transition('update', animationData);
    }

    protected async updateSelections(anySeriesItemEnabled: boolean) {
        const animationSkipUpdate = !this.opts.animationAlwaysUpdateSelections && this.ctx.animationManager.isSkipped();
        if (!anySeriesItemEnabled && animationSkipUpdate) {
            return;
        }
        if (!this.nodeDataRefresh && !this.isPathOrSelectionDirty()) {
            return;
        }
        if (this.nodeDataRefresh) {
            this.nodeDataRefresh = false;

            this.debug(`CartesianSeries.updateSelections() - calling createNodeData() for`, this.id);

            this._contextNodeData = await this.createNodeData();
            const animationValid = this.isProcessedDataAnimatable();
            this._contextNodeData.forEach((nodeData) => {
                nodeData.animationValid ??= animationValid;
            });

            await this.updateSeriesGroups();

            const { dataModel, processedData } = this;
            if (dataModel !== undefined && processedData !== undefined) {
                this.dispatch('data-update', { dataModel, processedData });
            }
        }

        await Promise.all(this.subGroups.map((g, i) => this.updateSeriesGroupSelections(g, i)));
    }

    private async updateSeriesGroupSelections(
        subGroup: SubGroup<any, TDatum, TLabel>,
        seriesIdx: number,
        seriesHighlighted?: boolean
    ) {
        const { datumSelection, labelSelection, markerSelection, paths } = subGroup;
        const contextData = this._contextNodeData[seriesIdx];
        const { nodeData, labelData, itemId } = contextData;

        await this.updatePaths({ seriesHighlighted, itemId, contextData, paths, seriesIdx });
        subGroup.datumSelection = await this.updateDatumSelection({ nodeData, datumSelection, seriesIdx });
        subGroup.labelSelection = await this.updateLabelSelection({ labelData, labelSelection, seriesIdx });
        if (markerSelection) {
            subGroup.markerSelection = await this.updateMarkerSelection({ nodeData, markerSelection, seriesIdx });
        }
    }

    protected abstract nodeFactory(): TNode;

    protected markerFactory(): Marker {
        const MarkerShape = getMarker();
        return new MarkerShape();
    }

    private async updateSeriesGroups() {
        const {
            _contextNodeData: contextNodeData,
            contentGroup,
            subGroups,
            opts: { pathsPerSeries, hasMarkers, datumSelectionGarbageCollection, markerSelectionGarbageCollection },
        } = this;
        if (contextNodeData.length === subGroups.length) {
            return;
        }

        if (contextNodeData.length < subGroups.length) {
            subGroups.splice(contextNodeData.length).forEach(({ dataNodeGroup, markerGroup, labelGroup, paths }) => {
                contentGroup.removeChild(dataNodeGroup);
                if (markerGroup) {
                    contentGroup.removeChild(markerGroup);
                }
                if (labelGroup) {
                    contentGroup.removeChild(labelGroup);
                }
                for (const path of paths) {
                    contentGroup.removeChild(path);
                }
            });
        }

        const totalGroups = contextNodeData.length;
        while (totalGroups > subGroups.length) {
            const layer = false;
            const subGroupId = this.subGroupId++;
            const dataNodeGroup = new Group({
                name: `${this.id}-series-sub${subGroupId}-dataNodes`,
                layer,
                zIndex: Layers.SERIES_LAYER_ZINDEX,
                zIndexSubOrder: this.getGroupZIndexSubOrder('data', subGroupId),
            });
            const markerGroup = hasMarkers
                ? new Group({
                      name: `${this.id}-series-sub${this.subGroupId++}-markers`,
                      layer,
                      zIndex: Layers.SERIES_LAYER_ZINDEX,
                      zIndexSubOrder: this.getGroupZIndexSubOrder('marker', subGroupId),
                  })
                : undefined;
            const labelGroup = new Group({
                name: `${this.id}-series-sub${this.subGroupId++}-labels`,
                layer,
                zIndex: Layers.SERIES_LABEL_ZINDEX,
                zIndexSubOrder: this.getGroupZIndexSubOrder('labels', subGroupId),
            });

            contentGroup.appendChild(dataNodeGroup);
            contentGroup.appendChild(labelGroup);
            if (markerGroup) {
                contentGroup.appendChild(markerGroup);
            }

            const paths: Path[] = [];
            for (let index = 0; index < pathsPerSeries; index++) {
                paths[index] = new Path();
                paths[index].zIndex = Layers.SERIES_LAYER_ZINDEX;
                paths[index].zIndexSubOrder = this.getGroupZIndexSubOrder('paths', index);
                contentGroup.appendChild(paths[index]);
            }

            subGroups.push({
                paths,
                dataNodeGroup,
                markerGroup,
                labelGroup,
                labelSelection: Selection.select(labelGroup, Text),
                datumSelection: Selection.select(
                    dataNodeGroup,
                    () => this.nodeFactory(),
                    datumSelectionGarbageCollection
                ),
                markerSelection: markerGroup
                    ? Selection.select(markerGroup, () => this.markerFactory(), markerSelectionGarbageCollection)
                    : undefined,
            });
        }
    }

    override getGroupZIndexSubOrder(type: SeriesGroupZIndexSubOrderType, subIndex = 0): ZIndexSubOrder {
        const result = super.getGroupZIndexSubOrder(type, subIndex);
        if (type === 'paths') {
            const [superFn] = result;
            const pathOffset = this.opts.pathsZIndexSubOrderOffset[subIndex] ?? 0;
            result[0] = isFunction(superFn) ? () => Number(superFn()) + pathOffset : Number(superFn) + pathOffset;
        }
        return result;
    }

    protected async updateNodes(
        highlightedItems: TDatum[] | undefined,
        seriesHighlighted: boolean,
        anySeriesItemEnabled: boolean
    ) {
        const {
            highlightSelection,
            highlightLabelSelection,
            opts: { hasMarkers, hasHighlightedLabels },
        } = this;

        const animationEnabled = !this.ctx.animationManager.isSkipped();
        const visible = this.visible && this._contextNodeData?.length > 0 && anySeriesItemEnabled;
        this.rootGroup.visible = animationEnabled || visible;
        this.contentGroup.visible = animationEnabled || visible;
        this.highlightGroup.visible = (animationEnabled || visible) && seriesHighlighted;

        const subGroupOpacity = this.getOpacity();
        if (hasMarkers) {
            await this.updateMarkerNodes({
                markerSelection: highlightSelection as any,
                isHighlight: true,
                seriesIdx: -1,
            });
            this.animationState.transition('highlightMarkers', highlightSelection);
        } else {
            await this.updateDatumNodes({
                datumSelection: highlightSelection,
                isHighlight: true,
                seriesIdx: -1,
            });
            this.animationState.transition('highlight', highlightSelection);
        }

        if (hasHighlightedLabels) {
            await this.updateLabelNodes({ labelSelection: highlightLabelSelection, seriesIdx: -1 });
        }

        await Promise.all(
            this.subGroups.map(async (subGroup, seriesIdx) => {
                const {
                    dataNodeGroup,
                    markerGroup,
                    datumSelection,
                    labelSelection,
                    markerSelection,
                    paths,
                    labelGroup,
                } = subGroup;
                const { itemId } = this.contextNodeData[seriesIdx];

                const subGroupVisible = visible;

                dataNodeGroup.opacity = subGroupOpacity;
                dataNodeGroup.visible = animationEnabled || subGroupVisible;
                labelGroup.visible = subGroupVisible;

                if (markerGroup) {
                    markerGroup.opacity = subGroupOpacity;
                    markerGroup.zIndex =
                        dataNodeGroup.zIndex >= Layers.SERIES_LAYER_ZINDEX
                            ? dataNodeGroup.zIndex
                            : dataNodeGroup.zIndex + 1;
                    markerGroup.visible = subGroupVisible;
                }

                if (labelGroup) {
                    labelGroup.opacity = subGroupOpacity;
                }

                await this.updatePathNodes({
                    seriesHighlighted,
                    itemId,
                    paths,
                    seriesIdx,
                    opacity: subGroupOpacity,
                    visible: subGroupVisible,
                    animationEnabled,
                });

                if (!dataNodeGroup.visible) {
                    return;
                }

                await this.updateDatumNodes({ datumSelection, highlightedItems, isHighlight: false, seriesIdx });
                await this.updateLabelNodes({ labelSelection, seriesIdx });
                if (hasMarkers && markerSelection) {
                    await this.updateMarkerNodes({ markerSelection, isHighlight: false, seriesIdx });
                }
            })
        );
    }

    protected getHighlightLabelData(labelData: TLabel[], highlightedItem: TDatum): TLabel[] | undefined {
        const labelItems = labelData.filter(
            (ld) => ld.datum === highlightedItem.datum && ld.itemId === highlightedItem.itemId
        );
        return labelItems.length !== 0 ? labelItems : undefined;
    }

    protected getHighlightData(_nodeData: TDatum[], highlightedItem: TDatum): TDatum[] | undefined {
        return highlightedItem ? [highlightedItem] : undefined;
    }

    protected async updateHighlightSelection(seriesHighlighted: boolean) {
        const { highlightSelection, highlightLabelSelection, _contextNodeData: contextNodeData } = this;

        const highlightedDatum = this.ctx.highlightManager?.getActiveHighlight();
        const item = seriesHighlighted && highlightedDatum?.datum ? (highlightedDatum as TDatum) : undefined;

        let labelItems: TLabel[] | undefined;
        let highlightItems: TDatum[] | undefined;
        if (item != null) {
            const labelsEnabled = this.isLabelEnabled();
            for (const { labelData, nodeData } of contextNodeData) {
                highlightItems = this.getHighlightData(nodeData, item);
                labelItems = labelsEnabled ? this.getHighlightLabelData(labelData, item) : undefined;

                if ((!labelsEnabled || labelItems != null) && highlightItems != null) {
                    break;
                }
            }
        }

        this.highlightSelection = await this.updateHighlightSelectionItem({
            items: highlightItems,
            highlightSelection,
        });
        this.highlightLabelSelection = await this.updateHighlightSelectionLabel({
            items: labelItems,
            highlightLabelSelection,
        });

        return highlightItems;
    }

    protected override pickNodeExactShape(point: Point): SeriesNodePickMatch | undefined {
        const result = super.pickNodeExactShape(point);

        if (result) {
            return result;
        }

        const { x, y } = point;
        const {
            opts: { hasMarkers },
        } = this;

        let match: Node | undefined;
        for (const { dataNodeGroup, markerGroup } of this.subGroups) {
            let match = dataNodeGroup.pickNode(x, y);

            if (!match && hasMarkers) {
                match = markerGroup?.pickNode(x, y);
            }

            if (match) {
                break;
            }
        }

        if (match) {
            return { datum: match.datum, distance: 0 };
        } else {
            for (const mod of this.moduleMap.modules) {
                const { datum } = mod.pickNodeExact(point) ?? {};
                if (datum !== undefined) {
                    return { datum, distance: 0 };
                }
            }
        }
    }

    protected override pickNodeClosestDatum(point: Point): SeriesNodePickMatch | undefined {
        const { x, y } = point;
        const { axes, rootGroup, _contextNodeData: contextNodeData } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        const hitPoint = rootGroup.transformPoint(x, y);

        let minDistance = Infinity;
        let closestDatum: SeriesNodeDatum | undefined;

        for (const context of contextNodeData) {
            for (const datum of context.nodeData) {
                const { point: { x: datumX = NaN, y: datumY = NaN } = {} } = datum;
                if (isNaN(datumX) || isNaN(datumY)) {
                    continue;
                }

                const isInRange = xAxis?.inRange(datumX) && yAxis?.inRange(datumY);
                if (!isInRange) {
                    continue;
                }

                // No need to use Math.sqrt() since x < y implies Math.sqrt(x) < Math.sqrt(y) for
                // values > 1
                const distance = Math.max((hitPoint.x - datumX) ** 2 + (hitPoint.y - datumY) ** 2, 0);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestDatum = datum;
                }
            }
        }
        for (const mod of this.moduleMap.modules) {
            const modPick = mod.pickNodeNearest(point);
            if (modPick !== undefined && modPick.distanceSquared < minDistance) {
                minDistance = modPick.distanceSquared;
                closestDatum = modPick.datum;
                break;
            }
        }

        if (closestDatum) {
            const distance = Math.max(Math.sqrt(minDistance) - (closestDatum.point?.size ?? 0), 0);
            return { datum: closestDatum, distance };
        }
    }

    protected override pickNodeMainAxisFirst(
        point: Point,
        requireCategoryAxis: boolean
    ): SeriesNodePickMatch | undefined {
        const { x, y } = point;
        const { axes, rootGroup, _contextNodeData: contextNodeData } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        // Prefer to start search with any available category axis.
        const directions = [xAxis, yAxis]
            .filter((a): a is CategoryAxis => a instanceof CategoryAxis)
            .map((a) => a.direction);
        if (requireCategoryAxis && directions.length === 0) {
            return;
        }

        // Default to X-axis unless we found a suitable category axis.
        const [primaryDirection = ChartAxisDirection.X] = directions;

        const hitPoint = rootGroup.transformPoint(x, y);
        const hitPointCoords =
            primaryDirection === ChartAxisDirection.X ? [hitPoint.x, hitPoint.y] : [hitPoint.y, hitPoint.x];

        const minDistance = [Infinity, Infinity];
        let closestDatum: SeriesNodeDatum | undefined;

        for (const context of contextNodeData) {
            for (const datum of context.nodeData) {
                const { point: { x: datumX = NaN, y: datumY = NaN } = {} } = datum;
                if (isNaN(datumX) || isNaN(datumY)) {
                    continue;
                }

                const isInRange = xAxis?.inRange(datumX) && yAxis?.inRange(datumY);
                if (!isInRange) {
                    continue;
                }

                const point = primaryDirection === ChartAxisDirection.X ? [datumX, datumY] : [datumY, datumX];

                // Compare distances from most significant dimension to least.
                let newMinDistance = true;
                for (let i = 0; i < point.length; i++) {
                    const dist = Math.abs(point[i] - hitPointCoords[i]);
                    if (dist > minDistance[i]) {
                        newMinDistance = false;
                        break;
                    }
                    if (dist < minDistance[i]) {
                        minDistance[i] = dist;
                        minDistance.fill(Infinity, i + 1, minDistance.length);
                    }
                }

                if (newMinDistance) {
                    closestDatum = datum;
                }
            }
        }
        if (closestDatum) {
            let closestDistanceSquared = Math.max(
                minDistance[0] ** 2 + minDistance[1] ** 2 - (closestDatum.point?.size ?? 0),
                0
            );

            for (const mod of this.moduleMap.modules) {
                const modPick = mod.pickNodeMainAxisFirst(point);
                if (modPick !== undefined && modPick.distanceSquared < closestDistanceSquared) {
                    closestDatum = modPick.datum;
                    closestDistanceSquared = modPick.distanceSquared;
                    break;
                }
            }

            return { datum: closestDatum, distance: Math.sqrt(closestDistanceSquared) };
        }
    }

    onLegendItemClick(event: LegendItemClickChartEvent) {
        const { legendItemName } = this.properties;
        const { enabled, itemId, series } = event;

        const matchedLegendItemName = legendItemName != null && legendItemName === event.legendItemName;
        if (series.id === this.id || matchedLegendItemName) {
            this.toggleSeriesItem(itemId, enabled);
        }
    }

    onLegendItemDoubleClick(event: LegendItemDoubleClickChartEvent) {
        const { enabled, itemId, series, numVisibleItems } = event;
        const { legendItemName } = this.properties;

        const matchedLegendItemName = legendItemName != null && legendItemName === event.legendItemName;
        if (series.id === this.id || matchedLegendItemName) {
            // Double-clicked item should always become visible.
            this.toggleSeriesItem(itemId, true);
        } else if (enabled && numVisibleItems === 1) {
            // Other items should become visible if there is only one existing visible item.
            this.toggleSeriesItem(itemId, true);
        } else {
            // Disable other items if not exactly one enabled.
            this.toggleSeriesItem(itemId, false);
        }
    }

    protected isPathOrSelectionDirty(): boolean {
        // Override point to allow more sophisticated dirty selection detection.
        return false;
    }

    getLabelData(): PointLabelDatum[] {
        return [];
    }

    shouldFlipXY(): boolean {
        return false;
    }

    /**
     * Get the minimum bounding box that contains any adjacent two nodes. The axes are treated independently, so this
     * may not represent the same two points for both directions. The dimensions represent the greatest distance
     * between any two adjacent nodes.
     */
    override getMinRects(width: number, height: number) {
        const [context] = this._contextNodeData;

        if (!context?.nodeData.length) {
            return;
        }

        // Get the sorted midpoints for both directions
        const minRectXs = Array(context.nodeData.length);
        const minRectYs = Array(context.nodeData.length);

        for (const [i, { midPoint }] of context.nodeData.entries()) {
            minRectXs[i] = midPoint?.x ?? 0;
            minRectYs[i] = midPoint?.y ?? 0;
        }

        minRectXs.sort((a, b) => a - b);
        minRectYs.sort((a, b) => a - b);

        // Take the visible slice from the sorted data as the points >= 0 and <= width/height
        let zeroX, widthX, zeroY, heightY;

        for (let i = 1; i < context.nodeData.length; i++) {
            if (minRectXs[i] >= 0) zeroX ??= i;
            if (minRectXs[i] > width) widthX ??= i - 1;
            if (minRectYs[i] >= 0) zeroY ??= i;
            if (minRectYs[i] > height) heightY ??= i - 1;

            if (minRectXs[i] > width && minRectYs[i] > height) break;
        }

        const minVisibleRectXs = zeroX != null && widthX != null ? minRectXs.slice(zeroX, widthX + 1) : [];
        const minVisibleRectYs = zeroY != null && heightY != null ? minRectYs.slice(zeroY, heightY + 1) : [];

        // Find the max distance between adjacent points in both directions
        const reducer = (max: number, value: number, i: number, array: number[]) =>
            i > 0 ? Math.max(max, value - array[i - 1]) : max;

        const maxWidth = minRectXs.reduce(reducer, 0);
        const maxHeight = minRectYs.reduce(reducer, 0);
        const maxVisibleWidth = minVisibleRectXs.reduce(reducer, 0);
        const maxVisibleHeight = minVisibleRectYs.reduce(reducer, 0);

        const minRect = new BBox(0, 0, maxWidth, maxHeight);
        const minVisibleRect = new BBox(0, 0, maxVisibleWidth, maxVisibleHeight);

        return { minRect, minVisibleRect };
    }

    protected async updateHighlightSelectionItem(opts: {
        items?: TDatum[];
        highlightSelection: Selection<TNode, TDatum>;
    }): Promise<Selection<TNode, TDatum>> {
        const {
            opts: { hasMarkers },
        } = this;

        const { items, highlightSelection } = opts;
        const nodeData = items ?? [];

        if (hasMarkers) {
            const markerSelection = highlightSelection as any;
            return this.updateMarkerSelection({ nodeData, markerSelection, seriesIdx: -1 }) as any;
        } else {
            return this.updateDatumSelection({
                nodeData,
                datumSelection: highlightSelection,
                seriesIdx: -1,
            });
        }
    }

    protected async updateHighlightSelectionLabel(opts: {
        items?: TLabel[];
        highlightLabelSelection: Selection<Text, TLabel>;
    }): Promise<Selection<Text, TLabel>> {
        return this.updateLabelSelection({
            labelData: opts.items ?? [],
            labelSelection: opts.highlightLabelSelection,
            seriesIdx: -1,
        });
    }

    protected async updateDatumSelection(opts: {
        nodeData: TDatum[];
        datumSelection: Selection<TNode, TDatum>;
        seriesIdx: number;
    }): Promise<Selection<TNode, TDatum>> {
        // Override point for sub-classes.
        return opts.datumSelection;
    }
    protected async updateDatumNodes(_opts: {
        datumSelection: Selection<TNode, TDatum>;
        highlightedItems?: TDatum[];
        isHighlight: boolean;
        seriesIdx: number;
    }): Promise<void> {
        // Override point for sub-classes.
    }

    protected async updateMarkerSelection(opts: {
        nodeData: TDatum[];
        markerSelection: Selection<Marker, TDatum>;
        seriesIdx: number;
    }): Promise<Selection<Marker, TDatum>> {
        // Override point for sub-classes.
        return opts.markerSelection;
    }
    protected async updateMarkerNodes(_opts: {
        markerSelection: Selection<Marker, TDatum>;
        isHighlight: boolean;
        seriesIdx: number;
    }): Promise<void> {
        // Override point for sub-classes.
    }

    protected async updatePaths(opts: {
        seriesHighlighted?: boolean;
        itemId?: string;
        contextData: TContext;
        paths: Path[];
        seriesIdx: number;
    }): Promise<void> {
        // Override point for sub-classes.
        opts.paths.forEach((p) => (p.visible = false));
    }

    protected async updatePathNodes(opts: {
        seriesHighlighted?: boolean;
        itemId?: string;
        paths: Path[];
        seriesIdx: number;
        opacity: number;
        visible: boolean;
        animationEnabled: boolean;
    }): Promise<void> {
        const { paths, opacity, visible } = opts;
        for (const path of paths) {
            path.opacity = opacity;
            path.visible = visible;
        }
    }

    protected resetAllAnimation(data: CartesianAnimationData<TNode, TDatum, TLabel, TContext>) {
        const { path, datum, label, marker } = this.opts?.animationResetFns ?? {};

        // Stop any running animations by prefix convention.
        this.ctx.animationManager.stopByAnimationGroupId(this.id);

        if (path) {
            data.paths.forEach((paths) => {
                resetMotion(paths, path);
            });
        }
        if (datum) {
            resetMotion(data.datumSelections, datum);
        }
        if (label) {
            resetMotion(data.labelSelections, label);
        }
        if (marker) {
            resetMotion(data.markerSelections, marker);
        }

        if (data.contextData.some((d) => d.animationValid === false)) {
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

    protected animateReadyHighlightMarkers(data: Selection<Marker, TDatum>) {
        const { marker } = this.opts?.animationResetFns ?? {};
        if (marker) {
            resetMotion([data], marker);
        }
    }

    protected animateReadyResize(data: CartesianAnimationData<TNode, TDatum, TLabel, TContext>) {
        this.resetAllAnimation(data);
    }

    protected animateClearingUpdateEmpty(data: CartesianAnimationData<TNode, TDatum, TLabel, TContext>) {
        this.ctx.animationManager.skipCurrentBatch();
        this.resetAllAnimation(data);
    }

    protected animationTransitionClear() {
        this.animationState.transition('clear', this.getAnimationData());
    }

    private getAnimationData(seriesRect?: BBox, previousContextData?: TContext[]) {
        const animationData: CartesianAnimationData<TNode, TDatum, TLabel, TContext> = {
            datumSelections: this.subGroups.map(({ datumSelection }) => datumSelection),
            markerSelections: this.subGroups
                .filter(({ markerSelection }) => markerSelection !== undefined)
                .map(({ markerSelection }) => markerSelection!),
            labelSelections: this.subGroups.map(({ labelSelection }) => labelSelection),
            annotationSelections: [...this.annotationSelections],
            contextData: this._contextNodeData,
            previousContextData,
            paths: this.subGroups.map(({ paths }) => paths),
            seriesRect,
        };

        return animationData;
    }

    protected abstract updateLabelSelection(opts: {
        labelData: TLabel[];
        labelSelection: Selection<Text, TLabel>;
        seriesIdx: number;
    }): Promise<Selection<Text, TLabel>>;

    protected abstract updateLabelNodes(opts: {
        labelSelection: Selection<Text, TLabel>;
        seriesIdx: number;
    }): Promise<void>;

    protected abstract isLabelEnabled(): boolean;

    protected calculateScaling(): TContext['scales'] {
        const result: TContext['scales'] = {};

        const addScale = (direction: ChartAxisDirection) => {
            const axis = this.axes[direction];
            if (!axis) return;

            if (axis.scale instanceof LogScale) {
                const { range, domain } = axis.scale;

                result[direction] = {
                    type: 'log',
                    convert: (domain) => axis.scale.convert(domain),
                    domain: [domain[0], domain[1]],
                    range: [range[0], range[1]],
                };
            } else if (axis.scale instanceof ContinuousScale) {
                const { range } = axis.scale;
                const domain = axis.scale.getDomain();

                result[direction] = {
                    type: 'continuous',
                    domain: [domain[0], domain[1]],
                    range: [range[0], range[1]],
                };
            } else if (axis.scale) {
                const { domain } = axis.scale;

                result[direction] = {
                    type: 'category',
                    domain,
                    range: domain.map((d) => axis.scale.convert(d)),
                };
            }
        };

        addScale(ChartAxisDirection.X);
        addScale(ChartAxisDirection.Y);

        return result;
    }
}
