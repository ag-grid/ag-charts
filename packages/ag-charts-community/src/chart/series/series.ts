import type {
    AgChartLabelFormatterParams,
    AgChartLabelOptions,
    AgSeriesMarkerStyle,
    AgSeriesMarkerStylerParams,
    ISeriesMarker,
} from 'ag-charts-types';

import type { ModuleContext, SeriesContext } from '../../module/moduleContext';
import { ModuleMap } from '../../module/moduleMap';
import type { SeriesOptionInstance, SeriesOptionModule, SeriesType } from '../../module/optionsModuleTypes';
import type { BBox } from '../../scene/bbox';
import { Group, TranslatableGroup } from '../../scene/group';
import type { Node } from '../../scene/node';
import type { Point } from '../../scene/point';
import type { Path } from '../../scene/shape/path';
import type { PlacedLabel, PointLabelDatum } from '../../scene/util/labelPlacement';
import { createId } from '../../util/id';
import { jsonDiff } from '../../util/json';
import { Listeners } from '../../util/listeners';
import { LRUCache } from '../../util/lruCache';
import { type DistantObject, nearestSquared } from '../../util/nearest';
import { mergeDefaults } from '../../util/object';
import type { TypedEvent } from '../../util/observable';
import { Observable } from '../../util/observable';
import { ActionOnSet } from '../../util/proxy';
import type { ChartAnimationPhase } from '../chartAnimationPhase';
import type { ChartAxis } from '../chartAxis';
import { ChartAxisDirection } from '../chartAxisDirection';
import type { ChartMode } from '../chartMode';
import type { DataController } from '../data/dataController';
import type { ChartLegendDatum, ChartLegendType } from '../legendDatum';
import type { Marker } from '../marker/marker';
import type { TooltipContent } from '../tooltip/tooltip';
import type { BaseSeriesEvent, SeriesEventType } from './seriesEvents';
import type { SeriesGroupZIndexSubOrderType } from './seriesLayerManager';
import type { SeriesProperties } from './seriesProperties';
import type { SeriesGrouping } from './seriesStateManager';
import type { ISeries, NodeDataDependencies, SeriesNodeDatum } from './seriesTypes';
import { SeriesContentZIndexMap, SeriesZIndexMap } from './seriesZIndexMap';

/** Modes of matching user interactions to rendered nodes (e.g. hover or click) */
export enum SeriesNodePickMode {
    /** Pick matches based upon pick coordinates being inside a matching shape/marker. */
    EXACT_SHAPE_MATCH,
    /** Pick matches based upon distance to ideal position */
    NEAREST_NODE,
    /** Pick matches based upon distance from axis */
    AXIS_ALIGNED,
}

export type SeriesNodePickIntent = 'tooltip' | 'highlight' | 'highlight-tooltip' | 'context-menu' | 'event';

export type SeriesNodePickMatch = {
    datum: SeriesNodeDatum;
    distance: number;
};

export type PickFocusInputs = {
    // datum delta is strictly +ve/-ve when changing datum focus, or 0 when changing series focus.
    readonly datumIndex: number;
    readonly datumIndexDelta: number;
    // 'other' means 'depth' for hierarchical charts, or 'series' for all other charts
    readonly otherIndex: number;
    readonly otherIndexDelta: number;
    readonly seriesRect?: Readonly<BBox>;
};

export type PickFocusOutputs = {
    datumIndex: number;
    datum: SeriesNodeDatum;
    otherIndex?: number;
    bounds: BBox | Path;
    showFocusBox: boolean;
};

export type PickResult = { pickMode: SeriesNodePickMode; match: SeriesNodeDatum; distance: number };

export type SeriesNodeEventTypes = 'nodeClick' | 'nodeDoubleClick' | 'nodeContextMenuAction' | 'groupingChanged';

interface INodeEvent<TEvent extends string = SeriesNodeEventTypes> extends TypedEvent {
    readonly type: TEvent;
    // Note: this is typically a MouseEvent, but it can be a TouchEvent or KeyboardEvent too.
    readonly event: Event;
    readonly datum: unknown;
    readonly seriesId: string;
}

export interface INodeEventConstructor<
    TDatum extends SeriesNodeDatum,
    TSeries extends Series<TDatum, any>,
    TEvent extends string = SeriesNodeEventTypes,
> {
    new <T extends TEvent>(type: T, event: Event, { datum }: TDatum, series: TSeries): INodeEvent<T>;
}

const CROSS_FILTER_MARKER_FILL_OPACITY_FACTOR = 0.25;
const CROSS_FILTER_MARKER_STROKE_OPACITY_FACTOR = 0.125;

export class SeriesNodeEvent<TDatum extends SeriesNodeDatum, TEvent extends string = SeriesNodeEventTypes>
    implements INodeEvent<TEvent>
{
    readonly datum: unknown;
    readonly seriesId: string;

    constructor(
        readonly type: TEvent,
        readonly event: Event,
        { datum }: TDatum,
        series: ISeries<TDatum, unknown>
    ) {
        this.datum = datum;
        this.seriesId = series.id;
    }
}

export type SeriesNodeDataContext<S = SeriesNodeDatum, L = S> = {
    itemId: string;
    nodeData: S[];
    labelData: L[];
};

enum SeriesHighlight {
    None,
    This,
    Other,
}

export type SeriesModuleMap = ModuleMap<SeriesOptionModule, SeriesOptionInstance, SeriesContext>;

export type SeriesDirectionKeysMapping<P extends SeriesProperties<any>> = {
    [key in ChartAxisDirection]?: (keyof P & string)[];
};

export class SeriesGroupingChangedEvent implements TypedEvent {
    type = 'groupingChanged';

    constructor(
        public series: Series<any, any>,
        public seriesGrouping: SeriesGrouping | undefined,
        public oldGrouping: SeriesGrouping | undefined
    ) {}
}

export type SeriesConstructorOpts<TProps extends SeriesProperties<any>> = {
    moduleCtx: ModuleContext;
    useLabelLayer?: boolean;
    pickModes: SeriesNodePickMode[];
    directionKeys?: SeriesDirectionKeysMapping<TProps>;
    directionNames?: SeriesDirectionKeysMapping<TProps>;
    canHaveAxes?: boolean;
};

export abstract class Series<
        TDatum extends SeriesNodeDatum,
        TProps extends SeriesProperties<any>,
        TLabel = TDatum,
        TContext extends SeriesNodeDataContext<TDatum, TLabel> = SeriesNodeDataContext<TDatum, TLabel>,
    >
    extends Observable
    implements ISeries<TDatum, TProps>
{
    protected destroyFns: (() => void)[] = [];
    abstract readonly properties: TProps;

    pickModes: SeriesNodePickMode[];

    get pickModeAxis(): 'main' | 'main-category' | undefined {
        return 'main';
    }

    @ActionOnSet<Series<TDatum, TProps, TLabel>>({
        changeValue: function (newVal, oldVal) {
            this.onSeriesGroupingChange(oldVal, newVal);
        },
    })
    seriesGrouping?: SeriesGrouping = undefined;

    protected static readonly highlightedZIndex = 1000000000000;

    protected readonly NodeEvent: INodeEventConstructor<TDatum, any> = SeriesNodeEvent;

    readonly internalId = createId(this);

    get id() {
        return this.properties?.id ?? this.internalId;
    }

    readonly canHaveAxes: boolean;

    get type(): SeriesType {
        return (this.constructor as any).type ?? '';
    }

    // The group node that contains the series rendering in its default (non-highlighted) state.
    readonly contentGroup = new TranslatableGroup({
        name: `${this.internalId}-content`,
        zIndex: SeriesZIndexMap.ANY_CONTENT,
    });

    // The group node that contains all highlighted series items. This is a performance optimisation
    // for large-scale data-sets, where the only thing that routinely varies is the currently
    // highlighted node.
    readonly highlightGroup = new TranslatableGroup({
        name: `${this.internalId}-highlight`,
        zIndex: SeriesZIndexMap.ANY_CONTENT,
    });

    // Error bars etc.
    readonly annotationGroup = new TranslatableGroup({
        name: `${this.internalId}-annotation`,
    });

    // Lazily initialised labelGroup for label presentation.
    readonly labelGroup = new TranslatableGroup({
        name: `${this.internalId}-series-labels`,
    });

    readonly highlightNode: Group;
    readonly highlightLabel: Group;

    // Package-level visibility, not meant to be set by the user.
    chart?: {
        mode: ChartMode;
        isMiniChart: boolean;
        placeLabels(padding?: number): Map<Series<any, any>, PlacedLabel[]>;
        seriesRect?: BBox;
    };

    axes: Record<ChartAxisDirection, ChartAxis | undefined> = {
        [ChartAxisDirection.X]: undefined,
        [ChartAxisDirection.Y]: undefined,
    };

    directions: ChartAxisDirection[] = [ChartAxisDirection.X, ChartAxisDirection.Y];
    private readonly directionKeys: SeriesDirectionKeysMapping<TProps>;
    private readonly directionNames: SeriesDirectionKeysMapping<TProps>;

    // Flag to determine if we should recalculate node data.
    protected nodeDataRefresh = true;

    protected readonly moduleMap: SeriesModuleMap = new ModuleMap();

    protected _data?: any[];
    protected _chartData?: any[];

    get data() {
        return this._data ?? this._chartData;
    }

    set visible(value: boolean) {
        this.properties.visible = value;
        this.visibleMaybeChanged();
    }

    get visible() {
        return this.properties.visible;
    }

    get hasData() {
        return this.data != null && this.data.length > 0;
    }

    get tooltipEnabled() {
        return this.properties.tooltip?.enabled ?? false;
    }

    protected onDataChange() {
        this.nodeDataRefresh = true;
        this._pickNodeCache.clear();
    }

    setOptionsData(input: unknown[]) {
        this._data = input;
        this.onDataChange();
    }

    setChartData(input: unknown[]) {
        this._chartData = input;
        if (this.data === input) {
            this.onDataChange();
        }
    }

    private onSeriesGroupingChange(prev?: SeriesGrouping, next?: SeriesGrouping) {
        const { internalId, type, visible } = this;

        if (prev) {
            this.ctx.seriesStateManager.deregisterSeries({ id: internalId, type });
        }
        if (next) {
            this.ctx.seriesStateManager.registerSeries({ id: internalId, type, visible, seriesGrouping: next });
        }

        this.fireEvent(new SeriesGroupingChangedEvent(this, next, prev));
    }

    getBandScalePadding() {
        return { inner: 1, outer: 0 };
    }

    protected readonly ctx: ModuleContext;

    constructor(seriesOpts: SeriesConstructorOpts<TProps>) {
        super();

        const { moduleCtx, pickModes, directionKeys = {}, directionNames = {}, canHaveAxes = false } = seriesOpts;

        this.ctx = moduleCtx;
        this.directionKeys = directionKeys;
        this.directionNames = directionNames;
        this.canHaveAxes = canHaveAxes;

        this.highlightGroup = new TranslatableGroup({
            name: `${this.internalId}-highlight`,
        });
        this.highlightNode = this.highlightGroup.appendChild(new Group({ name: 'highlightNode', zIndex: 0 }));
        this.highlightLabel = this.highlightGroup.appendChild(new Group({ name: 'highlightLabel', zIndex: 10 }));

        this.pickModes = pickModes;
    }

    attachSeries(seriesNode: Node, annotationNode: Node | undefined) {
        seriesNode.appendChild(this.contentGroup);
        seriesNode.appendChild(this.highlightGroup);
        seriesNode.appendChild(this.labelGroup);
        annotationNode?.appendChild(this.annotationGroup);
    }

    detachSeries(seriesNode: Node, annotationNode: Node | undefined) {
        seriesNode.removeChild(this.contentGroup);
        seriesNode.removeChild(this.highlightGroup);
        seriesNode.removeChild(this.labelGroup);
        annotationNode?.removeChild(this.annotationGroup);
    }

    _declarationOrder: number = -1;
    setSeriesIndex(index: number) {
        if (index === this._declarationOrder) return false;

        this._declarationOrder = index;

        this.contentGroup.zIndex = [SeriesZIndexMap.ANY_CONTENT, index, SeriesContentZIndexMap.FOREGROUND];
        this.highlightGroup.zIndex = [SeriesZIndexMap.ANY_CONTENT, index, SeriesContentZIndexMap.HIGHLIGHT];
        this.labelGroup.zIndex = [SeriesZIndexMap.ANY_CONTENT, index, SeriesContentZIndexMap.LABEL];
        this.annotationGroup.zIndex = index;
        // this.labelGroup.zIndex = index;

        return true;
    }

    getGroupZIndexSubOrder(type: SeriesGroupZIndexSubOrderType, subIndex = 0): number[] {
        let mainAdjust = 0;
        switch (type) {
            case 'data':
            case 'paths':
                break;
            case 'labels':
                mainAdjust += 20000;
                break;
            case 'marker':
                mainAdjust += 10000;
                break;
            // Following cases are in their own layer, so need to be careful to respect declarationOrder.
            case 'highlight':
                subIndex += 15000;
                break;
            case 'annotation':
                mainAdjust += 15000;
                break;
        }

        return [mainAdjust, this._declarationOrder, subIndex];
    }

    private readonly seriesListeners = new Listeners<SeriesEventType, (event: any) => void>();

    public addListener<T extends SeriesEventType, E extends BaseSeriesEvent<T>>(type: T, listener: (event: E) => void) {
        return this.seriesListeners.addListener(type, listener);
    }

    protected dispatch<T extends SeriesEventType, E extends BaseSeriesEvent<T>>(type: T, event: E): void {
        this.seriesListeners.dispatch(type, event);
    }

    addChartEventListeners(): void {
        return;
    }

    destroy(): void {
        this.destroyFns.forEach((f) => f());
        this.destroyFns = [];
        this.ctx.seriesStateManager.deregisterSeries(this);
    }

    abstract resetAnimation(chartAnimationPhase: ChartAnimationPhase): void;

    private getDirectionValues(
        direction: ChartAxisDirection,
        properties: { [key in ChartAxisDirection]?: string[] }
    ): string[] {
        const resolvedDirection = this.resolveKeyDirection(direction);
        const keys = properties?.[resolvedDirection];
        const values: string[] = [];

        if (!keys) {
            return values;
        }

        const addValues = (...items: any[]) => {
            for (const value of items) {
                if (Array.isArray(value)) {
                    addValues(...value);
                } else if (typeof value === 'object') {
                    addValues(...Object.values(value));
                } else {
                    values.push(value);
                }
            }
        };

        addValues(...keys.map((key) => (this.properties as any)[key]));

        return values;
    }

    getKeys(direction: ChartAxisDirection): string[] {
        return this.getDirectionValues(direction, this.directionKeys);
    }

    getKeyProperties(direction: ChartAxisDirection): (keyof TProps & string)[] {
        return this.directionKeys[this.resolveKeyDirection(direction)] ?? [];
    }

    getNames(direction: ChartAxisDirection): (string | undefined)[] {
        return this.getDirectionValues(direction, this.directionNames);
    }

    protected resolveKeyDirection(direction: ChartAxisDirection): ChartAxisDirection {
        return direction;
    }

    // The union of the series domain ('community') and series-option domains ('enterprise').
    getDomain(direction: ChartAxisDirection): any[] {
        const seriesDomain: any[] = this.getSeriesDomain(direction);
        const moduleDomains: any[][] = this.moduleMap.mapModules((module) => module.getDomain(direction));
        // Flatten the 2D moduleDomains into a 1D array and concatenate it with seriesDomain
        return seriesDomain.concat(moduleDomains.flat());
    }

    // Get the 'community' domain (excluding any additional data from series-option modules).
    abstract getSeriesDomain(direction: ChartAxisDirection): any[];

    // Fetch required values from the `chart.data` or `series.data` objects and process them.
    abstract processData(dataController: DataController): Promise<void>;

    // Using processed data, create data that backs visible nodes.
    abstract createNodeData(): Promise<TContext | undefined>;

    // Indicate that something external changed and we should recalculate nodeData.
    markNodeDataDirty() {
        this.nodeDataRefresh = true;
        this._pickNodeCache.clear();
        this.visibleMaybeChanged();
    }

    private visibleMaybeChanged() {
        this.ctx.seriesStateManager.registerSeries(this);
    }

    // Produce data joins and update selection's nodes using node data.
    abstract update(opts: { seriesRect?: BBox }): Promise<void>;

    public getOpacity(): number {
        const defaultOpacity = 1;
        const { dimOpacity = 1, enabled = true } = this.properties.highlightStyle.series;

        if (!enabled || dimOpacity === defaultOpacity) {
            return defaultOpacity;
        }

        switch (this.isItemIdHighlighted()) {
            case SeriesHighlight.None:
            case SeriesHighlight.This:
                return defaultOpacity;
            case SeriesHighlight.Other:
            default:
                return dimOpacity;
        }
    }

    protected getStrokeWidth(defaultStrokeWidth: number): number {
        const { strokeWidth, enabled = true } = this.properties.highlightStyle.series;

        if (!enabled || strokeWidth === undefined) {
            // No change in styling for highlight cases.
            return defaultStrokeWidth;
        }

        switch (this.isItemIdHighlighted()) {
            case SeriesHighlight.This:
                return strokeWidth;
            case SeriesHighlight.None:
            case SeriesHighlight.Other:
                return defaultStrokeWidth;
        }
    }

    protected isItemIdHighlighted(): SeriesHighlight {
        const series = this.ctx.highlightManager?.getActiveHighlight()?.series;

        // Highlighting not active.
        if (series == null) {
            return SeriesHighlight.None;
        }

        // Highlighting active, this series not highlighted.
        if (series !== this) {
            return SeriesHighlight.Other;
        }

        return SeriesHighlight.This;
    }

    protected getModuleTooltipParams() {
        return this.moduleMap
            .mapModules((module) => module.getTooltipParams())
            .reduce((total, current) => Object.assign(total, current), {});
    }

    abstract getTooltipHtml(seriesDatum: any): TooltipContent;

    protected _pickNodeCache = new LRUCache<string, PickResult | undefined>();
    pickNode(point: Point, intent: SeriesNodePickIntent, exactMatchOnly = false): PickResult | undefined {
        const { pickModes, pickModeAxis, visible, contentGroup } = this;

        if (!visible || !contentGroup.visible) return;
        if (intent === 'highlight' && !this.properties.highlight.enabled) return;
        if (intent === 'highlight-tooltip' && !this.properties.highlight.enabled) return;

        let maxDistance = Infinity;
        if (intent === 'tooltip' || intent === 'highlight-tooltip') {
            const { tooltip } = this.properties;
            maxDistance = typeof tooltip.range === 'number' ? tooltip.range : Infinity;
            exactMatchOnly ||= tooltip.range === 'exact';
        } else if (intent === 'event' || intent === 'context-menu') {
            const { nodeClickRange } = this.properties;
            maxDistance = typeof nodeClickRange === 'number' ? nodeClickRange : Infinity;
            exactMatchOnly ||= nodeClickRange === 'exact';
        }

        const selectedPickModes = pickModes.filter(
            (m) => !exactMatchOnly || m === SeriesNodePickMode.EXACT_SHAPE_MATCH
        );

        const { x, y } = point;
        const key = JSON.stringify({ x, y, maxDistance, selectedPickModes });
        if (this._pickNodeCache.has(key)) {
            return this._pickNodeCache.get(key);
        }

        for (const pickMode of selectedPickModes) {
            let match: SeriesNodePickMatch | undefined;

            switch (pickMode) {
                case SeriesNodePickMode.EXACT_SHAPE_MATCH:
                    match = this.pickNodeExactShape(point);
                    break;

                case SeriesNodePickMode.NEAREST_NODE:
                    match = this.pickNodeClosestDatum(point);
                    break;

                case SeriesNodePickMode.AXIS_ALIGNED:
                    match =
                        pickMode != null
                            ? this.pickNodeMainAxisFirst(point, pickModeAxis === 'main-category')
                            : undefined;
                    break;
            }

            if (match && match.distance <= maxDistance) {
                return this._pickNodeCache.set(key, { pickMode, match: match.datum, distance: match.distance });
            }
        }

        return this._pickNodeCache.set(key, undefined);
    }

    protected pickNodeExactShape(point: Point): SeriesNodePickMatch | undefined {
        const match = this.contentGroup.pickNode(point.x, point.y);
        if (match && match.datum.missing !== true) {
            return { datum: match.datum, distance: 0 };
        }

        return undefined;
    }

    protected pickNodeClosestDatum(_point: Point): SeriesNodePickMatch | undefined {
        // Override point for subclasses - but if this is invoked, the subclass specified it wants
        // to use this feature.
        throw new Error('AG Charts - Series.pickNodeClosestDatum() not implemented');
    }

    protected pickNodeNearestDistantObject<T extends Node & DistantObject>(point: Point, items: Iterable<T>) {
        const match = nearestSquared(point.x, point.y, items);
        if (match.nearest !== undefined && match.nearest.datum.missing !== true) {
            return { datum: match.nearest.datum, distance: Math.sqrt(match.distanceSquared) };
        }
        return undefined;
    }

    protected pickNodeMainAxisFirst(_point: Point, _requireCategoryAxis: boolean): SeriesNodePickMatch | undefined {
        // Override point for subclasses - but if this is invoked, the subclass specified it wants
        // to use this feature.
        throw new Error('AG Charts - Series.pickNodeMainAxisFirst() not implemented');
    }

    abstract getLabelData(): PointLabelDatum[];

    fireNodeClickEvent(event: Event, datum: TDatum): void {
        this.fireEvent(new this.NodeEvent('nodeClick', event, datum, this));
    }

    fireNodeDoubleClickEvent(event: Event, datum: TDatum): void {
        this.fireEvent(new this.NodeEvent('nodeDoubleClick', event, datum, this));
    }

    createNodeContextMenuActionEvent(event: Event, datum: TDatum): INodeEvent<'nodeContextMenuAction'> {
        return new this.NodeEvent('nodeContextMenuAction', event, datum, this);
    }

    abstract getLegendData<T extends ChartLegendType>(legendType: T): ChartLegendDatum<T>[];
    abstract getLegendData(legendType: ChartLegendType): ChartLegendDatum<ChartLegendType>[];

    protected toggleSeriesItem(itemId: any, enabled: boolean): void {
        this.visible = enabled;
        this.nodeDataRefresh = true;
        this._pickNodeCache.clear();
        this.dispatch('visibility-changed', { itemId, enabled });
    }

    isEnabled() {
        return this.visible;
    }

    getModuleMap(): SeriesModuleMap {
        return this.moduleMap;
    }

    createModuleContext(): SeriesContext {
        return { ...this.ctx, series: this };
    }

    protected getLabelText<TParams>(
        label: AgChartLabelOptions<any, TParams>,
        params: TParams & Omit<AgChartLabelFormatterParams<any>, 'seriesId'>,
        defaultFormatter: (value: any) => string = String
    ) {
        if (label.formatter) {
            return (
                this.ctx.callbackCache.call(label.formatter, { seriesId: this.id, ...params }) ??
                defaultFormatter(params.value)
            );
        }
        return defaultFormatter(params.value);
    }

    public getMarkerStyle<TParams>(
        marker: ISeriesMarker<TParams>,
        params: TParams & Omit<AgSeriesMarkerStylerParams<TDatum>, 'seriesId'>,
        defaultStyle: AgSeriesMarkerStyle = marker.getStyle()
    ) {
        const defaultSize = { size: params.datum.point?.size ?? 0 };
        const markerStyle = mergeDefaults(defaultSize, defaultStyle);
        if (marker.itemStyler) {
            const style = this.ctx.callbackCache.call(marker.itemStyler, {
                seriesId: this.id,
                ...markerStyle,
                ...params,
                datum: params.datum.datum,
            });
            return mergeDefaults(style, markerStyle);
        }
        return markerStyle;
    }

    protected updateMarkerStyle<TParams>(
        markerNode: Marker,
        marker: ISeriesMarker<TParams>,
        params: TParams & Omit<AgSeriesMarkerStylerParams<TDatum>, 'seriesId'>,
        defaultStyle: AgSeriesMarkerStyle = marker.getStyle(),
        { applyTranslation = true, selected = true } = {}
    ) {
        const { point } = params.datum;
        const activeStyle = this.getMarkerStyle(marker, params, defaultStyle);
        const visible = this.visible && activeStyle.size > 0 && point && !isNaN(point.x) && !isNaN(point.y);

        if (applyTranslation) {
            markerNode.setProperties({ visible, ...activeStyle, translationX: point?.x, translationY: point?.y });
        } else {
            markerNode.setProperties({ visible, ...activeStyle });
        }

        if (!selected) {
            markerNode.fillOpacity *= CROSS_FILTER_MARKER_FILL_OPACITY_FACTOR;
            markerNode.strokeOpacity *= CROSS_FILTER_MARKER_STROKE_OPACITY_FACTOR;
        }

        // Only for custom marker shapes
        if (typeof marker.shape === 'function' && !markerNode.dirtyPath) {
            markerNode.path.clear(true);
            markerNode.updatePath();
            markerNode.checkPathDirty();

            // AG-12745 Calculate the marker size to ensure that the focus indicator is correct.
            const bb = markerNode.getBBox();
            if (point !== undefined && bb.isFinite()) {
                const center = bb.computeCenter();
                const [dx, dy] = (['x', 'y'] satisfies (keyof Point)[]).map(
                    (key) => (activeStyle.strokeWidth ?? 0) + Math.abs(center[key] - point[key])
                );
                const customSize = Math.max(bb.width + dx, bb.height + dy);
                point.focusSize = customSize;
            }
        }
    }

    getMinRects(_width: number, _height: number): { minRect: BBox; minVisibleRect: BBox } | undefined {
        return;
    }

    protected _nodeDataDependencies?: NodeDataDependencies;

    public get nodeDataDependencies(): NodeDataDependencies {
        return this._nodeDataDependencies ?? { seriesRectWidth: NaN, seriesRectHeight: NaN };
    }

    protected checkResize(newSeriesRect?: BBox) {
        const { width: seriesRectWidth, height: seriesRectHeight } = newSeriesRect ?? { width: NaN, height: NaN };
        const newNodeDataDependencies = newSeriesRect ? { seriesRectWidth, seriesRectHeight } : undefined;
        const resize = jsonDiff(this.nodeDataDependencies, newNodeDataDependencies) != null;
        if (resize) {
            this._nodeDataDependencies = newNodeDataDependencies;
            this.markNodeDataDirty();
        }

        return resize;
    }

    public pickFocus(_opts: PickFocusInputs): PickFocusOutputs | undefined {
        return undefined;
    }
}
