import type { ModuleContext } from '../../../module/moduleContext';
import { StateMachine } from '../../../motion/states';
import type {
    AgCartesianSeriesMarkerFormat,
    AgCartesianSeriesMarkerFormatterParams,
} from '../../../options/agChartOptions';
import type { BBox } from '../../../scene/bbox';
import { RedrawType, SceneChangeDetection } from '../../../scene/changeDetectable';
import { Group } from '../../../scene/group';
import type { Node, ZIndexSubOrder } from '../../../scene/node';
import type { Point } from '../../../scene/point';
import { Selection } from '../../../scene/selection';
import { Path } from '../../../scene/shape/path';
import { Text } from '../../../scene/shape/text';
import { Debug } from '../../../util/debug';
import { jsonDiff } from '../../../util/json';
import type { PointLabelDatum } from '../../../util/labelPlacement';
import { OPT_FUNCTION, OPT_STRING, Validate } from '../../../util/validation';
import { CategoryAxis } from '../../axis/categoryAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataModel, ProcessedData } from '../../data/dataModel';
import type { LegendItemClickChartEvent, LegendItemDoubleClickChartEvent } from '../../interaction/chartEventManager';
import { Layers } from '../../layers';
import type { Marker } from '../../marker/marker';
import { getMarker } from '../../marker/util';
import type {
    SeriesNodeDataContext,
    SeriesNodeDatum,
    SeriesNodeEventTypes,
    SeriesNodePickMatch,
    SeriesNodePickMode,
} from '../series';
import { Series, SeriesNodeClickEvent } from '../series';
import type { SeriesGroupZIndexSubOrderType } from '../seriesLayerManager';
import { SeriesMarker } from '../seriesMarker';

export interface CartesianSeriesNodeDatum extends SeriesNodeDatum {
    readonly xKey: string;
    readonly yKey?: string;
    readonly xValue?: any;
    readonly yValue?: any;
}

interface SubGroup<SceneNodeType extends Node, TDatum extends SeriesNodeDatum, TLabel = TDatum> {
    paths: Path[];
    dataNodeGroup: Group;
    labelGroup: Group;
    markerGroup?: Group;
    datumSelection: Selection<SceneNodeType, TDatum>;
    labelSelection: Selection<Text, TLabel>;
    markerSelection?: Selection<Marker, TDatum>;
}
interface SeriesOpts {
    pathsPerSeries: number;
    pathsZIndexSubOrderOffset: number[];
    hasMarkers: boolean;
    hasHighlightedLabels: boolean;
    directionKeys: { [key in ChartAxisDirection]?: string[] };
    directionNames: { [key in ChartAxisDirection]?: string[] };
}

const DEFAULT_DIRECTION_KEYS: { [key in ChartAxisDirection]?: string[] } = {
    [ChartAxisDirection.X]: ['xKey'],
    [ChartAxisDirection.Y]: ['yKey'],
};

const DEFAULT_DIRECTION_NAMES: { [key in ChartAxisDirection]?: string[] } = {
    [ChartAxisDirection.X]: ['xName'],
    [ChartAxisDirection.Y]: ['yName'],
};

export class CartesianSeriesNodeClickEvent<
    TDatum extends CartesianSeriesNodeDatum,
    TSeries extends CartesianSeries<any, any, any, any> & { xKey?: string; yKey?: string },
    TEvent extends string = SeriesNodeEventTypes,
> extends SeriesNodeClickEvent<TDatum, TEvent> {
    readonly xKey?: string;
    readonly yKey?: string;

    constructor(type: TEvent, nativeEvent: MouseEvent, datum: TDatum, series: TSeries) {
        super(type, nativeEvent, datum, series);
        this.xKey = series.xKey;
        this.yKey = series.yKey;
    }
}

type CartesianAnimationState = 'empty' | 'ready' | 'waiting' | 'clearing';
type CartesianAnimationEvent = 'update' | 'updateData' | 'highlight' | 'highlightMarkers' | 'resize' | 'clear';

export interface CartesianAnimationData<
    TNode extends Node,
    TDatum extends CartesianSeriesNodeDatum,
    TLabel = TDatum,
    TContext extends SeriesNodeDataContext<TDatum, TLabel> = SeriesNodeDataContext<TDatum, TLabel>,
> {
    datumSelections: Selection<TNode, TDatum>[];
    markerSelections: Selection<Marker, TDatum>[];
    labelSelections: Selection<Text, TLabel>[];
    contextData: TContext[];
    paths: Path[][];
    seriesRect?: BBox;
    duration?: number;
}

export abstract class CartesianSeries<
    TNode extends Node,
    TDatum extends CartesianSeriesNodeDatum,
    TLabel extends SeriesNodeDatum = TDatum,
    TContext extends SeriesNodeDataContext<TDatum, TLabel> = SeriesNodeDataContext<TDatum, TLabel>,
> extends Series<TDatum, TLabel, TContext> {
    @Validate(OPT_STRING)
    legendItemName?: string = undefined;

    private _contextNodeData: TContext[] = [];
    get contextNodeData() {
        return this._contextNodeData.slice();
    }

    private nodeDataDependencies: { seriesRectWidth?: number; seriesRectHeight?: number } = {};

    private highlightSelection = Selection.select(this.highlightNode, () =>
        this.opts.hasMarkers ? this.markerFactory() : this.nodeFactory()
    ) as Selection<TNode, TDatum>;
    private highlightLabelSelection = Selection.select<Text, TLabel>(this.highlightLabel, Text);

    private subGroups: SubGroup<any, TDatum, TLabel>[] = [];
    private subGroupId: number = 0;

    private readonly opts: SeriesOpts;
    private readonly debug = Debug.create();

    protected animationState: StateMachine<CartesianAnimationState, CartesianAnimationEvent>;
    protected datumSelectionGarbageCollection = true;
    protected markerSelectionGarbageCollection = true;

    protected dataModel?: DataModel<any, any, any>;
    protected processedData?: ProcessedData<any>;

    protected constructor({
        pathsPerSeries = 1,
        hasMarkers = false,
        hasHighlightedLabels = false,
        pathsZIndexSubOrderOffset = [],
        directionKeys = DEFAULT_DIRECTION_KEYS,
        directionNames = DEFAULT_DIRECTION_NAMES,
        moduleCtx,
        pickModes,
    }: Partial<SeriesOpts> & {
        moduleCtx: ModuleContext;
        pickModes?: SeriesNodePickMode[];
    }) {
        const opts = {
            pathsPerSeries,
            hasMarkers,
            hasHighlightedLabels,
            pathsZIndexSubOrderOffset,
            directionKeys,
            directionNames,
            moduleCtx,
            pickModes,
        };

        super({
            ...opts,
            useSeriesGroupLayer: true,
            canHaveAxes: true,
        });

        this.opts = opts;

        this.animationState = new StateMachine('empty', {
            empty: {
                update: {
                    target: 'ready',
                    action: (data) => this.animateEmptyUpdateReady(data),
                },
            },
            ready: {
                updateData: {
                    target: 'waiting',
                },
                update: {
                    target: 'ready',
                    action: (data) => this.animateReadyUpdate(data),
                },
                highlight: {
                    target: 'ready',
                    action: (data) => this.animateReadyHighlight(data),
                },
                highlightMarkers: {
                    target: 'ready',
                    action: (data) => this.animateReadyHighlightMarkers(data),
                },
                resize: {
                    target: 'ready',
                    action: (data) => this.animateReadyResize(data),
                },
                clear: {
                    target: 'clearing',
                },
            },
            waiting: {
                update: {
                    target: 'ready',
                    action: (data) => this.animateWaitingUpdateReady(data),
                },
            },
            clearing: {
                update: {
                    target: 'empty',
                    action: (data) => this.animateClearingUpdateEmpty(data),
                },
            },
        });
    }

    addChartEventListeners(): void {
        this.ctx.chartEventManager?.addListener('legend-item-click', (event) => this.onLegendItemClick(event));
        this.ctx.chartEventManager?.addListener('legend-item-double-click', (event) =>
            this.onLegendItemDoubleClick(event)
        );
    }

    destroy() {
        super.destroy();

        this._contextNodeData.splice(0, this._contextNodeData.length);
        this.subGroups.splice(0, this.subGroups.length);
    }

    async update({ seriesRect }: { seriesRect?: BBox }) {
        const { visible } = this;
        const { series } = this.ctx.highlightManager?.getActiveHighlight() ?? {};
        const seriesHighlighted = series ? series === this : undefined;

        const newNodeDataDependencies = {
            seriesRectWidth: seriesRect?.width,
            seriesRectHeight: seriesRect?.height,
        };
        const resize = jsonDiff(this.nodeDataDependencies, newNodeDataDependencies) != null;
        if (resize) {
            this.nodeDataDependencies = newNodeDataDependencies;
            this.markNodeDataDirty();
        }

        const highlightItems = await this.updateHighlightSelection(seriesHighlighted);

        await this.updateSelections(visible);
        await this.updateNodes(highlightItems, seriesHighlighted, visible);

        const animationData = this.getAnimationData(seriesRect);
        if (resize) {
            this.animationState.transition('resize', animationData);
        }
        this.animationState.transition('update', animationData);
    }

    protected async updateSelections(anySeriesItemEnabled: boolean) {
        if (!anySeriesItemEnabled) {
            return;
        }
        if (!this.nodeDataRefresh && !this.isPathOrSelectionDirty()) {
            return;
        }
        if (this.nodeDataRefresh) {
            this.nodeDataRefresh = false;

            this.debug(`CartesianSeries.updateSelections() - calling createNodeData() for`, this.id);

            this._contextNodeData = await this.createNodeData();
            await this.updateSeriesGroups();

            const { dataModel, processedData } = this;
            if (dataModel !== undefined && processedData !== undefined) {
                this.dispatch('data-update', { dataModel, processedData });
            }
        }

        await Promise.all(this.subGroups.map((g, i) => this.updateSeriesGroupSelections(g, i)));
    }

    private async updateSeriesGroupSelections(subGroup: SubGroup<any, TDatum, TLabel>, seriesIdx: number) {
        const { datumSelection, labelSelection, markerSelection } = subGroup;
        const contextData = this._contextNodeData[seriesIdx];
        const { nodeData, labelData } = contextData;

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
            opts: { pathsPerSeries, hasMarkers },
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
                    this.datumSelectionGarbageCollection
                ),
                markerSelection: markerGroup
                    ? Selection.select(markerGroup, () => this.markerFactory(), this.markerSelectionGarbageCollection)
                    : undefined,
            });
        }
    }

    getGroupZIndexSubOrder(type: SeriesGroupZIndexSubOrderType, subIndex = 0): ZIndexSubOrder {
        const result = super.getGroupZIndexSubOrder(type, subIndex);
        if (type === 'paths') {
            const pathOffset = this.opts.pathsZIndexSubOrderOffset[subIndex] ?? 0;
            const superFn = result[0];
            if (typeof superFn === 'function') {
                result[0] = () => +superFn() + pathOffset;
            } else {
                result[0] = +superFn + pathOffset;
            }
        }
        return result;
    }

    protected async updateNodes(
        highlightedItems: TDatum[] | undefined,
        seriesHighlighted: boolean | undefined,
        anySeriesItemEnabled: boolean
    ) {
        const {
            highlightSelection,
            highlightLabelSelection,
            opts: { hasMarkers, hasHighlightedLabels },
        } = this;

        const visible = this.visible && this._contextNodeData?.length > 0 && anySeriesItemEnabled;
        this.rootGroup.visible = visible;
        this.contentGroup.visible = visible;
        this.highlightGroup.visible = visible && !!seriesHighlighted;

        const subGroupOpacities = this.subGroups.map(() => {
            return this.getOpacity();
        });

        if (hasMarkers) {
            await this.updateMarkerNodes({
                markerSelection: highlightSelection as any,
                isHighlight: true,
                seriesIdx: -1,
            });
            this.animationState.transition('highlightMarkers', highlightSelection);
        } else {
            await this.updateDatumNodes({ datumSelection: highlightSelection, isHighlight: true, seriesIdx: -1 });
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

                const subGroupVisible = visible;
                const subGroupOpacity = subGroupOpacities[seriesIdx];

                dataNodeGroup.opacity = subGroupOpacity;
                dataNodeGroup.visible = subGroupVisible;
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

                for (const path of paths) {
                    path.opacity = subGroupOpacity;
                    path.visible = subGroupVisible;
                }

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
        const labelItem = labelData.find(
            (ld) => ld.datum === highlightedItem.datum && ld.itemId === highlightedItem.itemId
        );
        return labelItem ? [labelItem] : undefined;
    }

    protected getHighlightData(_nodeData: TDatum[], highlightedItem: TDatum): TDatum[] | undefined {
        return highlightedItem ? [highlightedItem] : undefined;
    }

    protected async updateHighlightSelection(seriesHighlighted?: boolean) {
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

    protected pickNodeExactShape(point: Point): SeriesNodePickMatch | undefined {
        const result = super.pickNodeExactShape(point);

        if (result) {
            return result;
        }

        const { x, y } = point;
        const {
            opts: { hasMarkers },
        } = this;

        for (const { dataNodeGroup, markerGroup } of this.subGroups) {
            let match = dataNodeGroup.pickNode(x, y);

            if (!match && hasMarkers) {
                match = markerGroup?.pickNode(x, y);
            }

            if (match) {
                return { datum: match.datum, distance: 0 };
            }
        }
    }

    protected pickNodeClosestDatum(point: Point): SeriesNodePickMatch | undefined {
        const { x, y } = point;
        const { axes, rootGroup, _contextNodeData: contextNodeData } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        const hitPoint = rootGroup.transformPoint(x, y);

        let minDistance = Infinity;
        let closestDatum: TDatum | undefined;

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

        if (closestDatum) {
            const distance = Math.max(Math.sqrt(minDistance) - (closestDatum.point?.size ?? 0), 0);
            return { datum: closestDatum, distance };
        }
    }

    protected pickNodeMainAxisFirst(
        point: Point,
        requireCategoryAxis: boolean
    ): { datum: TDatum; distance: number } | undefined {
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
        let closestDatum: TDatum | undefined;

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
            const distance = Math.max(
                Math.sqrt(minDistance[0] ** 2 + minDistance[1] ** 2) - (closestDatum.point?.size ?? 0),
                0
            );
            return { datum: closestDatum, distance };
        }
    }

    onLegendItemClick(event: LegendItemClickChartEvent) {
        const { enabled, itemId, series, legendItemName } = event;

        const matchedLegendItemName = this.legendItemName != null && this.legendItemName === legendItemName;
        if (series.id === this.id || matchedLegendItemName) {
            this.toggleSeriesItem(itemId, enabled);
        }
    }

    onLegendItemDoubleClick(event: LegendItemDoubleClickChartEvent) {
        const { enabled, itemId, series, numVisibleItems, legendItemName } = event;

        const totalVisibleItems = Object.values(numVisibleItems).reduce((p, v) => p + v, 0);

        const matchedLegendItemName = this.legendItemName != null && this.legendItemName === legendItemName;
        if (series.id === this.id || matchedLegendItemName) {
            // Double-clicked item should always become visible.
            this.toggleSeriesItem(itemId, true);
        } else if (enabled && totalVisibleItems === 1) {
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
            return this.updateDatumSelection({ nodeData, datumSelection: highlightSelection, seriesIdx: -1 });
        }
    }

    protected async updateHighlightSelectionLabel(opts: {
        items?: TLabel[];
        highlightLabelSelection: Selection<Text, TLabel>;
    }): Promise<Selection<Text, TLabel>> {
        const { items, highlightLabelSelection } = opts;
        const labelData = items ?? [];

        return this.updateLabelSelection({ labelData, labelSelection: highlightLabelSelection, seriesIdx: -1 });
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

    protected animateEmptyUpdateReady(_data: CartesianAnimationData<TNode, TDatum, TLabel, TContext>) {
        // Override point for sub-classes.
    }

    protected animateReadyUpdate(_data: CartesianAnimationData<TNode, TDatum, TLabel, TContext>) {
        // Override point for sub-classes.
    }

    protected animateWaitingUpdateReady(_data: CartesianAnimationData<TNode, TDatum, TLabel, TContext>) {
        // Override point for sub-classes.
    }

    protected animateReadyHighlight(_data: Selection<TNode, TDatum>) {
        // Override point for sub-classes.
    }

    protected animateReadyHighlightMarkers(_data: Selection<Marker, TDatum>) {
        // Override point for sub-classes.
    }

    protected animateReadyResize(_data: CartesianAnimationData<TNode, TDatum, TLabel, TContext>) {
        // Override point for sub-classes.
    }

    protected animateClearingUpdateEmpty(_data: CartesianAnimationData<TNode, TDatum, TLabel, TContext>) {
        // Override point for sub-classes.
    }

    protected animationTransitionClear() {
        this.animationState.transition('clear', this.getAnimationData());
    }

    private getAnimationData(seriesRect?: BBox) {
        const animationData: CartesianAnimationData<TNode, TDatum, TLabel, TContext> = {
            datumSelections: this.subGroups.map(({ datumSelection }) => datumSelection),
            markerSelections: this.subGroups
                .filter(({ markerSelection }) => markerSelection !== undefined)
                .map(({ markerSelection }) => markerSelection!),
            labelSelections: this.subGroups.map(({ labelSelection }) => labelSelection),
            contextData: this._contextNodeData,
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
}

export class CartesianSeriesMarker extends SeriesMarker {
    @Validate(OPT_FUNCTION)
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    formatter?: (params: AgCartesianSeriesMarkerFormatterParams<any>) => AgCartesianSeriesMarkerFormat = undefined;
}
