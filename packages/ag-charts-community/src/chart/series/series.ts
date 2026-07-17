import type {
    BoxBounds,
    ChartAnimationPhase,
    DomainWithMetadata,
    DynamicContext,
    NormalisedColorType,
    NormalisedSeriesMarkerStyle,
    NormalisedTextOrSegments,
    PlacedLabel,
    PointLabelDatum,
    SeriesLabelDefaults,
} from 'ag-charts-core';
import {
    ActionOnSet,
    type Callback,
    type CallbackParam,
    ChartAxisDirection,
    CleanupRegistry,
    type DistantObject,
    EventEmitter,
    LRUCache,
    Logger,
    type Point,
    type RequireOptional,
    SeriesContentZIndexMap,
    type SeriesPluginModuleInstance,
    SeriesZIndexMap,
    boxCollides,
    boxContains,
    callWithContext,
    createId,
    isEmptyObject,
    isGradientFill,
    isPatternFill,
    jsonDiff,
    nearestSquared,
    without,
} from 'ag-charts-core';
import type {
    AgActiveItemState,
    AgChartLabelFormatterParams,
    AgDrawingMode,
    AgInitialStateLegendOptions,
    AgNumericValue,
    AgSeriesTooltipRendererParams,
    AgSeriesVisibilityChange,
    FormatterParams,
    FormatterPropertyType,
    HighlightState as PublicHighlightState,
    SelectionState as PublicSelectionState,
    SeriesType,
} from 'ag-charts-types';

import type {
    HighlightChangeEvent,
    HighlightNodeDatum,
    LegendItemClickEvent,
    LegendItemDoubleClickEvent,
} from '../../core/eventsHub';
import type { AxisFormattableLabel } from '../../module/axisContext';
import type { ChartRegistry, ChartSeriesRegistry } from '../../module/moduleContext';
import { ModuleMap } from '../../module/moduleMap';
import type { SeriesGrouping } from '../../module/seriesGrouping';
import { BBox } from '../../scene/bbox';
import { Group, TranslatableGroup } from '../../scene/group';
import { type Node, PointerEvents } from '../../scene/node';
import type { Selection } from '../../scene/selection';
import type { Path } from '../../scene/shape/path';
import { Transformable } from '../../scene/transformable';
import type { TypedEvent, TypedEventListener } from '../../util/observable';
import { Observable } from '../../util/observable';
import type { ChartAxis } from '../chartAxis';
import type { ChartMode } from '../chartMode';
import type { DataController } from '../data/dataController';
import type { DataModel, ProcessedData } from '../data/dataModel';
import { DataSet } from '../data/dataSet';
import type { ChartLegendDatum, ChartLegendType } from '../legend/legendDatum';
import type { Marker } from '../marker/marker';
import type { TooltipContent, TooltipStructuredContent } from '../tooltip/tooltip';
import { getItemId } from './pickManager';
import { mergeMarkerStyles, mergeMarkerStylesPair } from './seriesMarker';
import type { SeriesMarker } from './seriesMarker';
import { isUnselected, stagedSelectionState, toHighlightString, toSelectionString } from './seriesProperties';
import type { SeriesProperties } from './seriesProperties';
import type { SeriesTooltip } from './seriesTooltip';
import {
    type BucketLookupFeature,
    type DatumIndex,
    HighlightState,
    type INodeEvent,
    type ISeries,
    type ISeriesProperties,
    type NodeDataDependencies,
    SelectionState,
    type SeriesNodeDatum,
    type SeriesNodeEventTypes,
} from './seriesTypes';
import { type ShapeFillBBox } from './shapeUtil';
import { hasDimmedOpacity, resolveMarkerDrawingMode } from './util';

export interface SeriesDataEvent {
    readonly dataModel: DataModel<any, any, any>;
    readonly processedData: ProcessedData<any>;
}

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
    /**
     * The scene-node hit under the pointer, as accurate as possible. Exact-shape and
     * nearest-object picks report the matched leaf; modes that match on datum geometry (e.g.
     * "closest") cannot resolve the leaf efficiently and fall back to the series `contentGroup`.
     */
    target: Node<unknown>;
};

export type PickFocusInputs = {
    // datum delta is strictly +ve/-ve when changing datum focus, or 0 when changing series focus.
    readonly datumIndex: number;
    readonly datumIndexDelta: number;
    // 'other' means 'depth' for hierarchical charts, or 'series' for all other charts
    readonly otherIndex: number;
    readonly otherIndexDelta: number;
    readonly seriesRect?: BBox;
};

export type PickViewportFocusInputs = {
    readonly otherIndex: number;
    readonly where: 'data-start' | 'data-end' | 'viewport-start' | 'viewport-end';
    readonly hoverRect: Readonly<BoxBounds>;
};

export type PickFocusOutputs = {
    datumIndex: number;
    datum: SeriesNodeDatum;
    otherIndex?: number;
    bounds: BBox | Path;
    movedBounds?: BBox;
    clipFocusBox: boolean;
};

export type PickResult = {
    pickMode: SeriesNodePickMode;
    picks: SeriesNodePickMatch[];
};

export type PickNodesInBBoxPredicate = (selectionBox: BoxBounds, node: Node<unknown>) => boolean;

export type INodeEventConstructor<
    TDatum extends SeriesNodeDatum,
    TSeries extends Series<TDatum, object, any>,
    TEvent extends string = SeriesNodeEventTypes,
> = new <T extends TEvent>(
    type: T,
    event: Event,
    nodeDatum: TDatum,
    series: TSeries,
    selectionState: PublicSelectionState | undefined,
    isCollapsed: boolean
) => INodeEvent<T>;

const CROSS_FILTER_MARKER_FILL_OPACITY_FACTOR = 0.25;
const CROSS_FILTER_MARKER_STROKE_OPACITY_FACTOR = 0.125;

export class SeriesNodeEvent<
    TDatum extends SeriesNodeDatum,
    TEvent extends string = SeriesNodeEventTypes,
> implements INodeEvent<TEvent> {
    readonly datum: unknown;
    readonly datums?: unknown[];
    readonly totalValue?: AgNumericValue;
    readonly seriesId: string;
    readonly itemId: string | number;
    readonly dataIdKey: string | undefined;
    readonly selectionState: PublicSelectionState | undefined;
    readonly isCollapsed: boolean;
    defaultPrevented = false;

    constructor(
        readonly type: TEvent,
        readonly event: Event,
        nodeDatum: TDatum,
        series: ISeries<TDatum, ISeriesProperties, unknown>,
        selectionState: PublicSelectionState | undefined,
        isCollapsed: boolean
    ) {
        this.datum = nodeDatum.datum;
        this.datums = nodeDatum.datums;
        this.totalValue = nodeDatum.totalValue;
        this.seriesId = series.id;
        this.dataIdKey = series.data?.dataIdKey;
        this.itemId = getItemId(nodeDatum, this.dataIdKey);
        this.selectionState = selectionState;
        this.isCollapsed = isCollapsed;
    }

    public preventDefault() {
        this.defaultPrevented = true;
    }
}

export type SeriesNodeDataContext<S = SeriesNodeDatum, L = S> = {
    itemId: string;
    nodeData: S[];
    labelData: L[];
};

export type SeriesNodeStyleContext<TStyle> = {
    [HighlightState.None]: TStyle;
    [HighlightState.Item]: TStyle;
    [HighlightState.Series]: TStyle;
    [HighlightState.OtherSeries]: TStyle;
    [HighlightState.OtherItem]: TStyle;
};

/** Cache-miss callback for `runMarkerStylePass` — computes a value keyed by (highlight, selection[, keyExtra]). */
export type MarkerStyleCompute<TSeries, TCtx, TDatum, TCache> = (
    this: void,
    series: TSeries,
    ctx: TCtx,
    highlightState: HighlightState,
    selectionState: SelectionState | undefined,
    datum: TDatum
) => TCache;

/** Per-non-garbage-datum callback for `runMarkerStylePass`. */
export type MarkerStyleApply<TSeries, TCtx, TDatum, TCache> = (
    this: void,
    series: TSeries,
    ctx: TCtx,
    datum: TDatum,
    highlightState: HighlightState,
    selectionState: SelectionState | undefined,
    cached: TCache
) => void;

export type SeriesDirectionKeysMapping<P extends SeriesProperties<any>> = {
    [key in ChartAxisDirection | FormatterPropertyType]?: (keyof P & string)[];
};

export class SeriesGroupingChangedEvent implements TypedEvent {
    type = 'groupingChanged';

    constructor(
        public series: Series<any, object, any>,
        public seriesGrouping: SeriesGrouping | undefined
    ) {}
}

export type SeriesConstructorOpts<TProps extends SeriesProperties<any>> = {
    moduleCtx: DynamicContext<ChartRegistry>;
    pickModes: SeriesNodePickMode[];
    propertyKeys?: SeriesDirectionKeysMapping<TProps>;
    propertyNames?: SeriesDirectionKeysMapping<TProps>;
    canHaveAxes?: boolean;
    usesPlacedLabels?: boolean;
    alwaysClip?: boolean;
    supportsStandaloneZoom?: boolean;
};

function propertyAxisDirection(property: 'x' | 'y' | 'angle' | 'radius'): ChartAxisDirection;
function propertyAxisDirection(property: FormatterPropertyType): ChartAxisDirection | undefined;
function propertyAxisDirection(property: FormatterPropertyType): ChartAxisDirection | undefined {
    switch (property) {
        case 'x':
            return ChartAxisDirection.X;
        case 'y':
            return ChartAxisDirection.Y;
        case 'angle':
            return ChartAxisDirection.Angle;
        case 'radius':
            return ChartAxisDirection.Radius;
    }
}

function axisDirectionProperty(direction: ChartAxisDirection): FormatterPropertyType {
    switch (direction) {
        case ChartAxisDirection.X:
            return 'x';
        case ChartAxisDirection.Y:
            return 'y';
        case ChartAxisDirection.Angle:
            return 'angle';
        case ChartAxisDirection.Radius:
            return 'radius';
        default:
            return 'x';
    }
}

export type UnknownSeries = Series<SeriesNodeDatum, object, SeriesProperties<object>>;

export abstract class Series<
    TDatum extends SeriesNodeDatum,
    TOpts extends object,
    TProps extends SeriesProperties<TOpts>,
    TLabel = TDatum,
    TContext extends SeriesNodeDataContext<TDatum, TLabel> = SeriesNodeDataContext<TDatum, TLabel>,
>
    extends Observable
    implements ISeries<TDatum, TProps, TLabel>
{
    static readonly className: string = 'Series';
    protected cleanup = new CleanupRegistry();
    abstract readonly properties: TProps;

    pickModes: SeriesNodePickMode[];
    usesPlacedLabels: boolean = false;
    readonly alwaysClip: boolean = false;
    /** Opts into StandaloneChart zoom (axis registration + scale/translate viewport). */
    readonly supportsStandaloneZoom: boolean = false;

    protected hasChangesOnHighlight: boolean = false;
    protected hasChangesOnSelection: boolean = false;

    get pickModeAxis(): 'main' | 'main-category' | undefined {
        return 'main';
    }

    @ActionOnSet<Series<TDatum, TOpts, TProps, TLabel>>({
        changeValue: function (newVal, oldVal) {
            this.onSeriesGroupingChange(oldVal, newVal);
        },
    })
    seriesGrouping: SeriesGrouping | undefined = undefined;

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

    readonly highlightNodeGroup = this.highlightGroup.appendChild(
        new Group<TDatum>({ name: `${this.internalId}-highlight-node` })
    );

    readonly highlightLabelGroup = this.highlightGroup.appendChild(
        new Group<TLabel>({
            name: `${this.internalId}-highlight-label`,
            zIndex: SeriesContentZIndexMap.LABEL,
        })
    );

    // Error bars etc.
    readonly annotationGroup = new TranslatableGroup({
        name: `${this.internalId}-annotation`,
    });

    // Lazily initialised labelGroup for label presentation.
    readonly labelGroup = new TranslatableGroup<TLabel>({
        name: `${this.internalId}-series-labels`,
    });

    // Package-level visibility, not meant to be set by the user.
    chart?: {
        mode: ChartMode;
        isMiniChart: boolean;
        flashOnUpdateEnabled: boolean;
        seriesRect?: BBox;
    };

    axes: { [K in ChartAxisDirection]?: ChartAxis } = {};
    directions: ChartAxisDirection[] = [ChartAxisDirection.X, ChartAxisDirection.Y];

    private readonly propertyKeys: SeriesDirectionKeysMapping<TProps>;
    private readonly propertyNames: SeriesDirectionKeysMapping<TProps>;

    // Flag to determine if we should recalculate node data.
    protected nodeDataRefresh = true;
    protected processedDataUpdated = true;

    protected readonly moduleMap = new ModuleMap<SeriesPluginModuleInstance>();

    protected _data?: DataSet<any>;
    protected _chartData?: DataSet<any>;
    private _dataConnected = true;

    private readonly datumCallbackCache = new Map<any, any>();

    connectsToYAxis = false;

    get focusable() {
        return true; // See CRT-692
    }

    get data() {
        return this._data ?? this._chartData;
    }

    set visible(newVisibility: boolean) {
        // @ts-expect-error(2341) Ensure properties.visible is only accessed from here
        this.properties.visible = newVisibility;
        this.ctx.legendManager?.toggleItem(newVisibility, this.id);
        this.visibleMaybeChanged();
    }

    get visible() {
        // @ts-expect-error(2341) Ensure properties.visible is only accessed from here
        return this.ctx.legendManager?.getSeriesEnabled(this.id) ?? this.properties.visible;
    }

    get hasData() {
        const dataSet = this.data;
        if (dataSet == null) return false;
        return dataSet.netSize() > 0;
    }

    get tooltipEnabled() {
        return this.properties.tooltip?.enabled;
    }

    protected onDataChange() {
        this.nodeDataRefresh = true;
        this.processedDataUpdated = true;
        this._pickNodeCache.clear();
    }

    setOptionsData(input: DataSet | undefined) {
        this._data = input;
        this.onDataChange();
    }

    public isHighlightEnabled(): boolean {
        return this.properties.highlight.enabled;
    }

    public isSelectionEnabled(): boolean {
        return this.properties.selection.enabled;
    }

    public isDatumSelectable(_datumIndex: DatumIndex): boolean {
        // Override point for subclasses
        return true;
    }

    setChartData(input: DataSet | undefined) {
        this._chartData = input;
        if (this.data === input) {
            this.onDataChange();
        }
    }

    private onSeriesGroupingChange(prev?: SeriesGrouping, next?: SeriesGrouping) {
        const { internalId, type, visible } = this;

        if (prev) {
            this.ctx.seriesStateManager.deregisterSeries(this);
        }
        if (next) {
            this.ctx.seriesStateManager.registerSeries({
                internalId,
                type,
                visible,
                seriesGrouping: next,
                // TODO: is there a better way to pass width through here?
                width: 'width' in this.properties ? (this.properties.width as number) : 0,
            });
        }

        this.fireEvent(new SeriesGroupingChangedEvent(this, next));
    }

    getBandScalePadding() {
        return { inner: 1, outer: 0 };
    }

    public readonly ctx: DynamicContext<ChartRegistry>;
    private moduleContext?: DynamicContext<ChartSeriesRegistry>;

    constructor(seriesOpts: SeriesConstructorOpts<TProps>) {
        super();

        const {
            moduleCtx,
            pickModes,
            propertyKeys = {},
            propertyNames = {},
            canHaveAxes = false,
            usesPlacedLabels = false,
            alwaysClip = false,
            supportsStandaloneZoom = false,
        } = seriesOpts;

        this.ctx = moduleCtx;
        this.propertyKeys = propertyKeys;
        this.propertyNames = propertyNames;
        this.canHaveAxes = canHaveAxes;
        this.usesPlacedLabels = usesPlacedLabels;
        this.pickModes = pickModes;
        this.alwaysClip = alwaysClip;
        this.supportsStandaloneZoom = supportsStandaloneZoom;
        this.highlightLabelGroup.pointerEvents = PointerEvents.None;

        this.cleanup.register(
            this.ctx.eventsHub.on('data:update', (data) => {
                if (this._dataConnected) this.setChartData(data);
            }),
            this.ctx.eventsHub.on('highlight:change', (event) => this.onChangeHighlight(event)),
            this.events.on('data-selection-change', () => {
                this.hasChangesOnSelection = true;
                this.bucketLookup?.refresh();
            })
        );
    }

    attachSeries(seriesContentNode: Group, seriesNode: Group, annotationNode: Group | undefined) {
        seriesContentNode.appendChild(this.contentGroup);
        seriesNode.appendChild(this.highlightGroup);
        seriesNode.appendChild(this.labelGroup);
        annotationNode?.appendChild(this.annotationGroup);
    }

    detachSeries(_seriesContentNode: Group | undefined, _seriesNode: Group, _annotationNode: Group | undefined) {
        this.contentGroup.remove();
        this.highlightGroup.remove();
        this.labelGroup.remove();
        this.annotationGroup.remove();
    }

    declarationOrder: number = -1;
    private _broughtToFront = false;
    setSeriesIndex(index: number, forceUpdate = false) {
        const bringToFront = this.bringToFront();
        if (!forceUpdate && index === this.declarationOrder && bringToFront === this._broughtToFront) return false;

        this.declarationOrder = index;
        this._broughtToFront = bringToFront;
        this.setZIndex(bringToFront ? Number.MAX_VALUE : index);

        this.fireEvent(new SeriesGroupingChangedEvent(this, this.seriesGrouping));

        return true;
    }

    setZIndex(zIndex: number) {
        this.contentGroup.zIndex = [SeriesZIndexMap.ANY_CONTENT, zIndex, SeriesContentZIndexMap.FOREGROUND];
        this.highlightGroup.zIndex = [SeriesZIndexMap.ANY_CONTENT, zIndex, SeriesContentZIndexMap.HIGHLIGHT];
        this.labelGroup.zIndex = [SeriesZIndexMap.ANY_CONTENT, zIndex, SeriesContentZIndexMap.LABEL];
        this.annotationGroup.zIndex = zIndex;
    }

    renderToOffscreenCanvas() {
        return false;
    }

    disconnectData() {
        this._dataConnected = false;
    }

    reconnectData() {
        this._dataConnected = true;
    }

    protected hasHighlightOpacity() {
        if (!this.properties.highlight.enabled) return false;
        const activeHighlight = this.ctx.highlightManager.getActiveHighlight();
        if (activeHighlight == null) return false;
        if (activeHighlight.series?.isHighlightEnabled() === false) return false;

        const { unhighlightedItem, unhighlightedSeries } = this.properties.highlight;
        return hasDimmedOpacity(unhighlightedItem) || hasDimmedOpacity(unhighlightedSeries);
    }

    protected getDrawingMode(isHighlight?: boolean, highlightDrawingMode: AgDrawingMode = 'cutout'): AgDrawingMode {
        if (isHighlight) {
            return highlightDrawingMode;
        }
        return this.hasHighlightOpacity() ? (this.ctx.chartService.highlight?.drawingMode ?? 'overlay') : 'overlay';
    }

    protected getAnimationDrawingModes() {
        const drawingMode = this.getDrawingMode(false);
        return {
            start: { drawingMode: 'overlay' as AgDrawingMode },
            finish: { drawingMode },
        };
    }

    readonly events = new EventEmitter<{
        'data-update': SeriesDataEvent;
        'data-processed': SeriesDataEvent;
        'data-selection-change': null;
    }>();

    override addEventListener(type: 'seriesVisibilityChange', listener: (e: AgSeriesVisibilityChange) => void): void;
    override addEventListener(type: 'seriesNodeClick', listener: (e: SeriesNodeEvent<any>) => void): void;
    override addEventListener(type: 'seriesNodeDoubleClick', listener: (e: SeriesNodeEvent<any>) => void): void;
    override addEventListener(type: string, listener: TypedEventListener): void;
    override addEventListener(type: string, listener: TypedEventListener | ((e: unknown) => void)): void {
        return super.addEventListener(type, listener);
    }

    override removeEventListener(type: 'seriesVisibilityChange', listener: (e: AgSeriesVisibilityChange) => void): void;
    override removeEventListener(type: 'seriesNodeClick', listener: (e: SeriesNodeEvent<any>) => void): void;
    override removeEventListener(type: 'seriesNodeDoubleClick', listener: (e: SeriesNodeEvent<any>) => void): void;
    override removeEventListener(type: string, listener: TypedEventListener): void;
    override removeEventListener(type: string, listener: TypedEventListener | ((e: unknown) => void)): void {
        return super.removeEventListener(type, listener);
    }

    override hasEventListener(type: 'seriesVisibilityChange'): boolean;
    override hasEventListener(type: 'seriesNodeClick'): boolean;
    override hasEventListener(type: 'seriesNodeDoubleClick'): boolean;
    override hasEventListener(type: string): boolean;
    override hasEventListener(type: string): boolean {
        return super.hasEventListener(type);
    }

    updatedDomains() {
        // For override by subclasses.
    }

    destroy(): void {
        this.cleanup.flush();
        this.resetDatumCallbackCache();
        this.ctx.seriesStateManager.deregisterSeries(this);
        this.moduleContext?.destroy();
    }

    abstract resetAnimation(chartAnimationPhase: ChartAnimationPhase): void;

    private getPropertyValues(
        property: FormatterPropertyType,
        properties: { [key in FormatterPropertyType]?: string[] }
    ): string[] {
        const direction = propertyAxisDirection(property);
        const resolvedProperty =
            direction == null ? property : axisDirectionProperty(this.resolveKeyDirection(direction));
        const keys = properties?.[resolvedProperty];
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

    getKeyAxis(_direction: ChartAxisDirection): string | undefined {
        return undefined;
    }

    getKeys(direction: ChartAxisDirection): string[] {
        return this.getPropertyValues(axisDirectionProperty(direction), this.propertyKeys);
    }

    getKeyProperties(direction: ChartAxisDirection): (keyof TProps & string)[] {
        return this.propertyKeys[this.resolveKeyDirection(direction)] ?? [];
    }

    getNames(direction: ChartAxisDirection): (string | undefined)[] {
        return this.getPropertyValues(axisDirectionProperty(direction), this.propertyNames);
    }

    getFormatterContext(
        property: FormatterPropertyType
    ): Array<{ seriesId: string; key: string; name: string | undefined }> {
        const { id: seriesId } = this;
        const keys = this.getPropertyValues(property, this.propertyKeys);
        const names = this.getPropertyValues(property, this.propertyNames);
        const out: Array<{ seriesId: string; key: string; name: string | undefined }> = [];
        for (let idx = 0; idx < keys.length; idx++) {
            out.push({ seriesId, key: keys[idx], name: names[idx] });
        }
        return out;
    }

    public resolveKeyDirection(direction: ChartAxisDirection): ChartAxisDirection {
        return direction;
    }

    // The union of the series domain ('community') and series-option domains ('enterprise').
    getDomain(direction: ChartAxisDirection): DomainWithMetadata<any> {
        const seriesDomain = this.getSeriesDomain(direction);
        const moduleDomains: any[] = this.moduleMap.mapModules((module) => module.getDomain(direction)).flat();

        if (moduleDomains.length === 0) {
            // No module domains - preserve metadata from series domain
            return seriesDomain;
        }

        // When merging with module domains, metadata is invalidated
        return { domain: seriesDomain.domain.concat(moduleDomains) };
    }

    getRange(direction: ChartAxisDirection, visibleRange: [number, number]): [number, number] | [] {
        return this.getSeriesRange(direction, visibleRange);
    }

    getMinimumRangeSeries(_range: number[]) {
        // Not implemented here.
    }

    getMinimumRangeChart(_ranges: number[]): number {
        return 0;
    }

    getZoomRangeFittingItems(
        _xVisibleRange: [number, number],
        _yVisibleRange: [number, number] | undefined,
        _minVisibleItems: number
    ): { x: [number, number]; y: [number, number] | undefined } | undefined {
        return undefined;
    }

    getVisibleItems(
        _xVisibleRange: [number, number],
        _yVisibleRange: [number, number] | undefined,
        _minVisibleItems: number
    ): number {
        return Infinity;
    }

    abstract dataCount(): number;

    // Get the 'community' domain (excluding any additional data from series-option modules).
    // Returns DomainWithMetadata which may include sort metadata for optimization.
    abstract getSeriesDomain(direction: ChartAxisDirection): DomainWithMetadata<any>;

    // Needed for auto-scaling zoom
    abstract getSeriesRange(direction: ChartAxisDirection, visibleRange: [number, number]): [number, number] | [];

    // Fetch required values from the `chart.data` or `series.data` objects and process them.
    abstract processData(dataController: DataController): Promise<void> | void;

    // Using processed data, create data that backs visible nodes.
    abstract createNodeData(): TContext | undefined;

    abstract findNodeDatum(itemIdOrIndex: AgActiveItemState['itemId']): SeriesNodeDatum | undefined;

    toCanvasFromMidPoint(nodeDatum: { midPoint?: Point }): Point {
        const { x = 0, y = 0 } = nodeDatum.midPoint ?? {};
        return Transformable.toCanvasPoint(this.contentGroup, x, y);
    }

    // Indicate that something external changed and we should recalculate nodeData.
    markNodeDataDirty() {
        this.nodeDataRefresh = true;
        this._pickNodeCache.clear();
        this.visibleMaybeChanged();
    }

    private visibleMaybeChanged() {
        const { internalId, seriesGrouping, type, visible } = this;

        this.ctx.seriesStateManager.updateSeries({
            internalId,
            type,
            visible,
            seriesGrouping,
            // TODO: is there a better way to pass width through here?
            width: 'width' in this.properties ? (this.properties.width as number) : 0,
        });
    }

    // Produce data joins and update selection's nodes using node data.
    abstract update(opts: { seriesRect?: BBox }): Promise<void> | void;

    public getOpacity(): number {
        const defaultOpacity = 1;

        if (!this.properties.highlight) {
            return defaultOpacity;
        }

        return this.getSelectionStyle()?.opacity ?? this.getHighlightStyle().opacity ?? defaultOpacity;
    }

    public getHighlightState(
        highlightedDatum: HighlightNodeDatum | undefined,
        isHighlight?: boolean,
        datumIndex?: DatumIndex,
        legendItemValues?: string[]
    ): HighlightState {
        if (!this.properties.highlight.enabled) {
            return HighlightState.None;
        }

        if (isHighlight) {
            return HighlightState.Item;
        }

        if (highlightedDatum?.series == null) {
            return HighlightState.None;
        }

        if (highlightedDatum.series.isHighlightEnabled() === false) {
            return HighlightState.None;
        }

        if (this.isSeriesHighlighted(highlightedDatum, legendItemValues)) {
            const itemHighlighted = this.isItemHighlighted(highlightedDatum, datumIndex);
            if (itemHighlighted == null) {
                return HighlightState.Series;
            }
            return HighlightState.OtherItem;
        }

        return HighlightState.OtherSeries;
    }

    public getDataSelectionState(datumIndex: DatumIndex | undefined): SelectionState | undefined {
        return this.ctx.dataSelectionService?.getDataSelectionState(this, datumIndex);
    }

    public getDataCandidacyState(datumIndex: DatumIndex | undefined): SelectionState | undefined {
        return this.ctx.dataSelectionService?.getDataCandidateState(this, datumIndex);
    }

    /**
     * Per-series aggregation-aware bucket lookup. Optional — populated
     * lazily for aggregating series only. Owns both the per-bucket SELECTED
     * roll-up and the bucket→datum-range mapping used by the data-selection
     * drag handler. `DataModelSeries.getDataSelectionState` consults this
     * for marker styling; `data-selection-change` and aggregation rebuilds
     * keep the roll-up in sync.
     */
    protected bucketLookup?: BucketLookupFeature;

    /**
     * Construct the series-specific {@link BucketLookupFeature}. Default
     * `undefined` for non-aggregating series. Aggregating series override to
     * return either {@link BucketLookupManager} (single `indexData`) or
     * {@link SplitBucketLookupManager} (split positive/negative).
     */
    protected createBucketLookupFeature(): BucketLookupFeature | undefined {
        return undefined;
    }

    /**
     * Lazy-init `bucketLookup` on first access. The just-created feature is
     * refreshed once so it reflects the current selection bitset and
     * aggregation filters — without this any `filtersChanged` events emitted
     * before the lazy-init would have been missed.
     */
    public ensureBucketLookupFeature(): BucketLookupFeature | undefined {
        if (this.bucketLookup === undefined) {
            const feature = this.createBucketLookupFeature();
            if (feature) {
                this.bucketLookup = feature;
                feature.refresh();
            }
        }
        return this.bucketLookup;
    }

    public getHighlightStateString(
        datum: HighlightNodeDatum | undefined,
        isHighlight?: boolean,
        datumIndex?: DatumIndex,
        legendItemValues?: string[]
    ): PublicHighlightState {
        return toHighlightString(this.getHighlightState(datum, isHighlight, datumIndex, legendItemValues));
    }

    public getSelectionStateString(
        datumIndex: DatumIndex | undefined,
        selectionState?: SelectionState
    ): PublicSelectionState | undefined {
        selectionState ??= this.getDataSelectionState(datumIndex);
        if (selectionState === undefined) return undefined;
        return toSelectionString(selectionState);
    }

    public getCandidateStateString(
        datumIndex: DatumIndex | undefined,
        candidateState?: SelectionState
    ): PublicSelectionState | undefined {
        candidateState ??= this.getDataCandidacyState(datumIndex);
        if (candidateState === undefined) return undefined;
        return toSelectionString(candidateState);
    }

    protected onChangeHighlight(event: HighlightChangeEvent) {
        const previousHighlightedDatum = event.previousHighlight;
        const currentHighlightedDatum = event.currentHighlight;

        const currentHighlightState = this.getHighlightState(currentHighlightedDatum);
        const previousHighlightState = this.getHighlightState(previousHighlightedDatum);

        // Force re-check of layer z-index
        this.setSeriesIndex(this.declarationOrder);

        // Check if there are any itemStylers that might need to react to highlight changes
        const hasItemStylers = this.hasItemStylers();

        if (!hasItemStylers && currentHighlightState === previousHighlightState) {
            this.hasChangesOnHighlight = false;
            return;
        }

        const { highlightedSeries, unhighlightedItem, unhighlightedSeries } = this.properties.highlight;

        this.hasChangesOnHighlight =
            hasItemStylers ||
            !isEmptyObject(highlightedSeries) ||
            !isEmptyObject(unhighlightedItem) ||
            !isEmptyObject(unhighlightedSeries);
    }

    public bringToFront() {
        if (this.hasDataSelection()) return true;
        return (
            this.properties.highlight.enabled &&
            this.properties.highlight.bringToFront &&
            this.isSeriesHighlighted(this.ctx.highlightManager.getActiveHighlight())
        );
    }

    public isSeriesHighlighted(highlightedDatum: HighlightNodeDatum | undefined, _legendItemValues?: string[]) {
        if (!this.properties.highlight.enabled) {
            return false;
        }

        return highlightedDatum?.series === this;
    }

    protected isItemHighlighted(highlightedDatum?: HighlightNodeDatum, datumIndex?: DatumIndex) {
        // If this function is being invoked, we have already determined that the series is highlighted.
        if (highlightedDatum == null || Number.isNaN(highlightedDatum.datumIndex) || datumIndex == null) return;
        return highlightedDatum.datumIndex === datumIndex;
    }

    private hasDataSelection(): boolean {
        const count: number = this.ctx.dataSelectionService?.getDataSetSelection(this)?.getSelectedCount() ?? 0;
        return count > 0;
    }

    public getHighlightStyle(
        isHighlight?: boolean,
        datumIndex?: DatumIndex,
        highlightState?: HighlightState,
        legendItemValues?: string[]
    ) {
        // Caller-provided highlightState skips the highlightManager + getHighlightState resolution.
        if (highlightState === undefined) {
            const highlightedDatum = this.ctx.highlightManager?.getActiveHighlight();
            highlightState = this.getHighlightState(highlightedDatum, isHighlight, datumIndex, legendItemValues);
        }
        return this.properties.highlight.getStyle(highlightState);
    }

    public getSelectionStyle(
        datumIndex?: DatumIndex,
        selectionState?: SelectionState,
        candidateState?: SelectionState
    ) {
        candidateState ??= this.getDataCandidacyState(datumIndex);
        selectionState ??= this.getDataSelectionState(datumIndex);
        const staged = stagedSelectionState(selectionState, candidateState);
        if (staged === undefined) return undefined;
        return this.properties.selection.getStyle(staged);
    }

    protected resolveMarkerDrawingModeForState(
        drawingMode: AgDrawingMode,
        style?: NormalisedSeriesMarkerStyle
    ): AgDrawingMode {
        return resolveMarkerDrawingMode(drawingMode, style);
    }

    protected abstract hasItemStylers(): boolean;
    public filterItemStylerFillParams(fill: NormalisedColorType | undefined): NormalisedColorType | undefined {
        if (isGradientFill(fill)) {
            return without(fill, ['bounds', 'colorSpace', 'gradient', 'reverse']);
        } else if (isPatternFill(fill)) {
            return without(fill, ['padding']);
        }
        return fill;
    }

    protected getModuleTooltipParams() {
        return this.moduleMap
            .mapModules((module) => module.getTooltipParams())
            .reduce((total, current) => Object.assign(total, current), {});
    }

    // @todo(AG-7126) - removeThisDatum
    abstract getTooltipContent(datumIndex: DatumIndex, removeThisDatum: TDatum | undefined): TooltipContent | undefined;

    protected _pickNodeCache = new LRUCache<PickResult | undefined>(5);
    pickNodes(point: Point, intent: SeriesNodePickIntent, exactMatchOnly = false): PickResult | undefined {
        const { pickModes, pickModeAxis, visible, contentGroup } = this;

        if (!visible || !contentGroup.visible) return;

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
            let picks: SeriesNodePickMatch[] | undefined;

            switch (pickMode) {
                case SeriesNodePickMode.EXACT_SHAPE_MATCH: {
                    const exact = this.pickNodesExactShape(point);
                    if (exact.length !== 0) picks = exact;
                    break;
                }

                case SeriesNodePickMode.NEAREST_NODE: {
                    const closest = this.pickNodeClosestDatum(point);
                    const exact = closest?.distance === 0 ? this.pickNodesExactShape(point) : undefined;
                    if (exact != null && exact.length !== 0) {
                        picks = exact;
                    } else if (closest) {
                        picks = [closest];
                    }
                    break;
                }

                case SeriesNodePickMode.AXIS_ALIGNED: {
                    const closest =
                        pickModeAxis == null
                            ? undefined
                            : this.pickNodeMainAxisFirst(point, pickModeAxis === 'main-category');
                    if (closest != null) picks = [closest];
                    break;
                }
            }

            if (picks && picks[0].distance <= maxDistance) {
                return this._pickNodeCache.set(key, { pickMode, picks });
            }
        }

        return this._pickNodeCache.set(key, undefined);
    }

    protected pickNodesExactShape(point: Point): SeriesNodePickMatch[] {
        const picks: SeriesNodePickMatch[] = [];
        for (const node of this.contentGroup.pickNodes(point.x, point.y)) {
            const datum = node.unsafeClosestDatum();
            if (typeof datum === 'object' && datum != null && datum.missing !== true) {
                picks.push({ datum, distance: 0, target: node });
            }
        }
        return picks;
    }

    protected pickNodeClosestDatum(_point: Point): SeriesNodePickMatch | undefined {
        // Override point for subclasses - but if this is invoked, the subclass specified it wants
        // to use this feature.
        throw new Error('AG Charts - Series.pickNodeClosestDatum() not implemented');
    }

    public pickNodeNearestDistantObject<T extends Node & DistantObject>(
        point: Point,
        items: Iterable<T>
    ): SeriesNodePickMatch | undefined {
        const { nearest, distanceSquared } = nearestSquared(point.x, point.y, items);
        const datum = nearest?.unsafeClosestDatum();
        if (nearest != null && typeof datum === 'object' && datum != null && datum.missing !== true) {
            return { datum, distance: Math.sqrt(distanceSquared), target: nearest };
        }
    }

    protected pickNodeMainAxisFirst(_point: Point, _requireCategoryAxis: boolean): SeriesNodePickMatch | undefined {
        // Override point for subclasses - but if this is invoked, the subclass specified it wants
        // to use this feature.
        throw new Error('AG Charts - Series.pickNodeMainAxisFirst() not implemented');
    }

    hasBuiltinListener(_target: Node<unknown> | undefined): boolean {
        return false;
    }

    protected pickNodesInBBoxPredicate(): PickNodesInBBoxPredicate {
        // By default, pickNodesInBBox just used boxes for hit-testing because it's easier and faster. Series with more
        // complicated shapes (e.g. sectors or pie/donut, paths for maps) need to override this predicate to implement
        // their own hit-testing computation.
        const { containment } = this.properties.selection;
        const unreachable = (a: never): never => a;
        switch (containment) {
            case 'any':
                return (selectionBox: BoxBounds, node: Node<unknown>): boolean => {
                    const nodeBox = Transformable.toCanvas(node);
                    return boxCollides(selectionBox, nodeBox.x, nodeBox.y, nodeBox.width, nodeBox.height);
                };
            case 'all':
                return (selectionBox: BoxBounds, node: Node<unknown>): boolean => {
                    const nodeBox = Transformable.toCanvas(node);
                    return boxContains(selectionBox, nodeBox.x, nodeBox.y, nodeBox.width, nodeBox.height);
                };
            default:
                return unreachable(containment);
        }
    }

    public *pickNodesInBBox(selectionBox: BoxBounds): Iterable<TDatum> {
        function* walkNodes(node: Group, callback: (node: Node) => TDatum | undefined): Iterable<TDatum> {
            for (const child of node.children()) {
                // Check if this scene-node is interactive:
                if (!child.visible || child.pointerEvents === PointerEvents.None) {
                    continue;
                }

                // Note: Some series-type include `datum` values in the scene-graph that not assignable to `TDatum`.
                // For example: line-series `SegmentedPath` include segmentation data in `datum`). So add some basic
                // check for `datumIndex` to filter out datums that definitely not assignable to `TDatum`.
                if (typeof child.datum === 'object' && child.datum != null && 'datumIndex' in child.datum) {
                    const result = callback(child);
                    if (result !== undefined) {
                        yield result;
                    }
                } else if (child instanceof Group) {
                    yield* walkNodes(child, callback);
                }
            }
        }

        const predicate: PickNodesInBBoxPredicate = this.pickNodesInBBoxPredicate();

        yield* walkNodes(this.contentGroup, (node) => {
            if (predicate(selectionBox, node)) {
                return node.unsafeDatum;
            }
            return undefined;
        });
    }

    isPointInArea?(x: number, y: number): boolean;

    public getLabelData(): PointLabelDatum[] {
        return [];
    }
    public getLabelDefaults(): SeriesLabelDefaults | undefined {
        return undefined;
    }
    public updatePlacedLabelData(_labels: PlacedLabel<TLabel>[]) {
        return;
    }

    // Use a wrapper to comply with the @typescript-eslint/unbound-method rule.
    private readonly fireEventWrapper = (event: TypedEvent): void => super.fireEvent(event);
    protected override fireEvent<TEvent extends TypedEvent>(event: TEvent): void {
        callWithContext([this.properties, this.ctx.chartService], this.fireEventWrapper, event);
    }

    fireNodeClickEvent(event: Event, datum: TDatum): boolean {
        const selectionState = this.getSelectionStateString(datum.datumIndex);
        const isCollapsed = datum.itemId == null ? false : this.ctx.collapsedManager.isCollapsed(datum.itemId);
        const clickEvent = new this.NodeEvent('seriesNodeClick', event, datum, this, selectionState, isCollapsed);
        this.fireEvent(clickEvent);
        return !clickEvent.defaultPrevented;
    }

    fireNodeDoubleClickEvent(event: Event, datum: TDatum): boolean {
        const selectionState = this.getSelectionStateString(datum.datumIndex);
        const isCollapsed = datum.itemId == null ? false : this.ctx.collapsedManager.isCollapsed(datum.itemId);
        const clickEvent = new this.NodeEvent('seriesNodeDoubleClick', event, datum, this, selectionState, isCollapsed);
        this.fireEvent(clickEvent);
        return !clickEvent.defaultPrevented;
    }

    createNodeContextMenuActionEvent(event: Event, datum: TDatum): INodeEvent<'nodeContextMenuAction'> {
        const selectionState = this.getSelectionStateString(datum.datumIndex);
        const isCollapsed = datum.itemId == null ? false : this.ctx.collapsedManager.isCollapsed(datum.itemId);
        return new this.NodeEvent('nodeContextMenuAction', event, datum, this, selectionState, isCollapsed);
    }

    onLegendInitialState(legendType: ChartLegendType, initialState: AgInitialStateLegendOptions | undefined) {
        const { visible = true, itemId, legendItemName } = initialState ?? {};
        this.toggleSeriesItem(visible, legendType, itemId, legendItemName);
    }

    onLegendItemClick(event: LegendItemClickEvent) {
        const { enabled, itemId, series, legendType } = event;
        const legendItemName =
            'legendItemName' in this.properties ? (this.properties.legendItemName as string) : undefined;
        const legendItemKey = 'legendItemKey' in this.properties ? this.properties.legendItemKey : undefined;

        const matchedLegendItemName = legendItemName != undefined && legendItemName === event.legendItemName;
        if (series.id === this.id || matchedLegendItemName || legendItemKey != undefined) {
            this.toggleSeriesItem(enabled, legendType, itemId, legendItemName, event);
        }
    }

    onLegendItemDoubleClick(event: LegendItemDoubleClickEvent) {
        const { enabled, itemId, series, numVisibleItems, legendType } = event;
        const legendItemName =
            'legendItemName' in this.properties ? (this.properties.legendItemName as string) : undefined;
        const legendItemKey = 'legendItemKey' in this.properties ? this.properties.legendItemKey : undefined;

        const matchedLegendItemName = legendItemName != undefined && legendItemName === event.legendItemName;
        if (series.id === this.id || matchedLegendItemName || legendItemKey != undefined) {
            // Double-clicked item should always become visible.
            this.toggleSeriesItem(true, legendType, itemId, legendItemName, event);
        } else if (enabled && numVisibleItems === 1) {
            // Other items should become visible if there is only one existing visible item.
            this.toggleSeriesItem(true, legendType, undefined, legendItemName);
        } else {
            // Disable other items if not exactly one enabled.
            this.toggleSeriesItem(false, legendType, undefined, legendItemName);
        }
    }

    abstract getLegendData<T extends ChartLegendType>(legendType: T): ChartLegendDatum<T>[];
    abstract getLegendData(legendType: ChartLegendType): ChartLegendDatum<ChartLegendType>[];

    protected toggleSeriesItem(
        enabled: boolean,
        legendType: ChartLegendType,
        itemId: string | number | undefined,
        legendItemName: string | undefined,
        legendEvent?: { legendItemName?: string }
    ): void {
        const seriesId = this.id;
        if (enabled || legendType !== 'category') {
            this.visible = enabled;
        }
        this.nodeDataRefresh = true;
        this._pickNodeCache.clear();

        const event: AgSeriesVisibilityChange = {
            type: 'seriesVisibilityChange',
            seriesId,
            itemId,
            legendItemName: legendEvent?.legendItemName ?? legendItemName,
            visible: enabled,
        };
        this.fireEvent(event);

        this.ctx.legendManager?.toggleItem(enabled, seriesId, itemId, legendItemName);
    }

    isEnabled() {
        return this.visible;
    }

    getModuleMap() {
        return this.moduleMap;
    }

    createModuleContext(): DynamicContext<ChartSeriesRegistry> {
        this.moduleContext ??= this.ctx.child<{ series: { type: string } }>().constant('series', this);
        return this.moduleContext;
    }

    protected getAxisValueText(
        axis: ChartAxis,
        source: 'tooltip',
        value: any,
        datum: any,
        key: string,
        legendItemName: string | undefined,
        allowNull?: boolean
    ) {
        const { id: seriesId, properties } = this;

        return axis.formatDatum(
            properties,
            value,
            source,
            seriesId,
            legendItemName,
            datum,
            key,
            undefined,
            undefined,
            undefined,
            allowNull
        );
    }

    protected getLabelText<TParams extends object>(
        value: any,
        datum: any,
        key: string,
        property: FormatterPropertyType,
        domain: any[],
        label: AxisFormattableLabel<AgChartLabelFormatterParams<any> & RequireOptional<TParams>>,
        baseParams: RequireOptional<TParams> & Omit<AgChartLabelFormatterParams<any>, 'seriesId'>,
        allowNullValue: boolean = false
    ): NormalisedTextOrSegments {
        if (value == null && !allowNullValue) return '';

        const { axes, canHaveAxes, ctx, id: seriesId, properties } = this;
        const source = 'series-label';
        const legendItemName = 'legendItemName' in properties ? (properties.legendItemName as string) : undefined;
        const params: AgChartLabelFormatterParams<any> & RequireOptional<TParams> = {
            seriesId: this.id,
            ...baseParams,
        };

        const direction = canHaveAxes ? propertyAxisDirection(property) : undefined;
        const axis = direction == null ? undefined : axes[this.resolveKeyDirection(direction)];
        if (axis != null) {
            return axis.formatDatum(
                properties,
                value,
                source,
                seriesId,
                legendItemName,
                datum,
                key,
                domain,
                label,
                params,
                allowNullValue
            );
        }

        const { formatManager } = ctx;
        const formatInContext = this.callWithContext.bind(this);

        const format = (formatParams: FormatterParams<any>) =>
            label.formatValue(formatInContext, formatParams.type, formatParams.value, params) ??
            formatManager.format(formatInContext, formatParams) ??
            (value == null ? '' : String(value));

        const boundSeries = this.getFormatterContext(property);
        switch (property) {
            case 'y':
            case 'color':
            case 'size': {
                const fractionDigits = undefined;
                return format({
                    type: 'number',
                    value,
                    datum,
                    seriesId,
                    legendItemName,
                    key,
                    source,
                    property,
                    domain,
                    boundSeries,
                    fractionDigits,
                    visibleDomain: undefined,
                });
            }

            case 'x':
            case 'radius':
            case 'angle':
            case 'label':
            case 'secondaryLabel':
            case 'calloutLabel':
            case 'sectorLabel':
            case 'legendItem':
                return format({
                    type: 'category',
                    value,
                    datum,
                    seriesId,
                    legendItemName,
                    key,
                    source,
                    property,
                    domain,
                    boundSeries,
                });
        }
    }

    public getMarkerStyle<TParams>(
        marker: SeriesMarker<TParams>,
        { datumIndex, datum, point }: Partial<TDatum>,
        params?: TParams,
        opts?: {
            highlightState?: HighlightState;
            /** Pre-resolved by per-datum hot paths to skip the getDataSelectionState() lookup. */
            selectionState?: SelectionState;
            isHighlight?: boolean;
            checkForHighlight?: boolean;
            resolveMarkerSubPath?: string[];
            resolveStyler?: boolean;
            hideWithSize0?: boolean;
        },
        defaultOverrideStyle: NormalisedSeriesMarkerStyle & { size: number } = {
            size: point?.size ?? marker.size ?? 0,
        },
        inheritedStyle?: NormalisedSeriesMarkerStyle
    ) {
        const { itemStyler } = marker;
        const {
            highlightState,
            isHighlight = false,
            checkForHighlight = true,
            resolveMarkerSubPath = ['marker'],
            resolveStyler = false,
            hideWithSize0 = false,
        } = opts ?? {};
        const selectionState: SelectionState | undefined =
            opts?.selectionState ?? this.getDataSelectionState(datumIndex);
        const candidateState: SelectionState | undefined = this.getDataCandidacyState(datumIndex);

        if (hideWithSize0 && isUnselected(stagedSelectionState(selectionState, candidateState))) {
            return { size: 0 } satisfies NormalisedSeriesMarkerStyle;
        }

        // Lazy resolvePath — only the resolveStyler/itemStyler branches consume it.
        let resolvePath: string[] | undefined;
        const getResolvePath = () => (resolvePath ??= ['series', `${this.declarationOrder}`, ...resolveMarkerSubPath]);

        if (resolveStyler) {
            const resolveOpt = { permissivePath: true };
            const resolved = this.ctx.optionsGraphService.resolvePartial(
                getResolvePath(),
                defaultOverrideStyle,
                resolveOpt
            );
            if (resolved) {
                defaultOverrideStyle = { ...resolved, size: resolved.size ?? defaultOverrideStyle.size };
            }
        }

        const highlightStyle: NormalisedSeriesMarkerStyle | undefined = checkForHighlight
            ? this.getHighlightStyle(isHighlight, datumIndex, highlightState)
            : undefined;
        const selectionStyle: NormalisedSeriesMarkerStyle | undefined =
            checkForHighlight && this.isSelectionEnabled()
                ? this.getSelectionStyle(datumIndex, selectionState, candidateState)
                : undefined;
        let markerStyle = mergeMarkerStyles(
            selectionStyle,
            highlightStyle,
            defaultOverrideStyle,
            marker.getStyle(),
            inheritedStyle
        );

        if (itemStyler && params) {
            const highlightStateString =
                highlightState === undefined
                    ? this.getHighlightStateString(
                          this.ctx.highlightManager?.getActiveHighlight(),
                          isHighlight,
                          datumIndex
                      )
                    : toHighlightString(highlightState);
            const selectionStateString = selectionState === undefined ? undefined : toSelectionString(selectionState);
            const candidateStateString = candidateState === undefined ? undefined : toSelectionString(candidateState);
            const fill = this.filterItemStylerFillParams(markerStyle.fill);

            const style = this.cachedCallWithContext(itemStyler, {
                seriesId: this.id,
                ...markerStyle,
                fill,
                ...params,
                highlightState: highlightStateString,
                selectionState: selectionStateString,
                candidateState: candidateStateString,
                datum,
            });
            const resolved = this.ctx.optionsGraphService.resolvePartial(getResolvePath(), style);

            markerStyle = mergeMarkerStylesPair(resolved, markerStyle);
        }

        return markerStyle;
    }

    protected applyMarkerStyle(
        style: NormalisedSeriesMarkerStyle,
        markerNode: Marker,
        point: { x: number; y: number; size?: number; focusSize?: number } | undefined,
        fillBBox: ShapeFillBBox | undefined,
        opts: { applyPosition?: boolean; crossFilterSelected?: boolean; hideWithSize0: boolean }
    ) {
        const { shape, size = 0 } = style;
        const { applyPosition = true, crossFilterSelected = true, hideWithSize0 } = opts;
        const visible =
            this.visible &&
            (hideWithSize0 || (this.visible && size > 0 && point && !Number.isNaN(point.x) && !Number.isNaN(point.y)));

        markerNode.setStyleProperties(style, fillBBox);
        markerNode.setVisibilityAndPosition(!!visible, shape!, size, applyPosition ? point : undefined);

        if (!crossFilterSelected) {
            markerNode.fillOpacity *= CROSS_FILTER_MARKER_FILL_OPACITY_FACTOR;
            markerNode.strokeOpacity *= CROSS_FILTER_MARKER_STROKE_OPACITY_FACTOR;
        }

        // Only for custom marker shapes
        if (typeof shape === 'function' && !markerNode.dirtyPath) {
            markerNode.path.clear(true);
            markerNode.updatePath();
            markerNode.checkPathDirty();

            // AG-12745 Calculate the marker size to ensure that the focus indicator is correct.
            const bb = markerNode.getBBox();
            if (point != null && bb.isFinite()) {
                const center = bb.computeCenter();
                const [dx, dy] = (['x', 'y'] as const).map(
                    (key) => (style.strokeWidth ?? 0) + Math.abs(center[key] - point[key])
                );
                point.focusSize = Math.max(bb.width + dx, bb.height + dy);
            }
        }
    }

    /**
     * Per-datum marker-style pass with a state-keyed cache, shared across all marker-rendering series.
     * Callbacks take `series` and `ctx` explicitly so callers pass static methods (stable function
     * identity) and keep V8's inline cache monomorphic across series sharing this helper.
     *
     * @param opts.keyExtra - optional extra cache-key dimension (e.g. range-area's `datum.itemType`)
     * @param opts.cacheable - set false when `compute` returns a value mutated per datum (e.g. bubble + colorScale)
     * @param opts.compute - called once per distinct (highlight, selection[, keyExtra]) tuple
     * @param opts.apply - called per non-garbage datum with the cached value
     */
    protected runMarkerStylePass<TCtx, TPassDatum extends SeriesNodeDatum, TCache, TSeries = this>(
        datumSelection: Selection<TPassDatum, Marker<TPassDatum>>,
        isHighlight: boolean,
        ctx: TCtx,
        opts: {
            keyExtra?: (datum: TPassDatum) => string;
            cacheable?: boolean;
            compute: MarkerStyleCompute<TSeries, TCtx, TPassDatum, TCache>;
            apply: MarkerStyleApply<TSeries, TCtx, TPassDatum, TCache>;
        }
    ): void {
        const { keyExtra, cacheable = true, compute, apply } = opts;
        const cache = cacheable ? new Map<string, TCache>() : null;
        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();
        const self = this;
        const seriesArg = self as unknown as TSeries;
        datumSelection.each(function runMarkerStylePass(node, datum) {
            if (datumSelection.isGarbage(node)) return;
            const highlightState = self.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex);
            const selectionState = self.getDataSelectionState(datum.datumIndex);
            const candidateState = self.getDataCandidacyState(datum.datumIndex);
            const extra = keyExtra === undefined ? '' : `:${keyExtra(datum)}`;
            const stateKey = `${highlightState}:${selectionState ?? '-'}:${candidateState ?? '-'}${extra}`;
            let cached = cache?.get(stateKey);
            if (cached === undefined) {
                cached = compute(seriesArg, ctx, highlightState, selectionState, datum);
                cache?.set(stateKey, cached);
            }
            apply(seriesArg, ctx, datum, highlightState, selectionState, cached);
        });
    }

    /** Default `apply` for the no-itemStyler path — writes the cached style straight onto the datum. */
    protected static readonly assignCachedStyle: MarkerStyleApply<unknown, unknown, { style?: unknown }, unknown> = (
        _series,
        _ctx,
        datum,
        _highlightState,
        _selectionState,
        cached
    ) => {
        datum.style = cached;
    };

    protected _nodeDataDependencies?: NodeDataDependencies;

    public get nodeDataDependencies(): NodeDataDependencies {
        return this._nodeDataDependencies ?? { seriesRectWidth: Number.NaN, seriesRectHeight: Number.NaN };
    }

    protected checkResize(newSeriesRect?: BBox) {
        const { width: seriesRectWidth, height: seriesRectHeight } = newSeriesRect ?? {
            width: Number.NaN,
            height: Number.NaN,
        };
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

    public pickViewportFocus(_opts: PickViewportFocusInputs): PickFocusOutputs | undefined {
        return undefined;
    }

    // Override in y-up series (network/org) to mirror y so `calcPanToBBoxRatios` (y-down) pans
    // the right direction. Default identity.
    public mapFocusBBoxToPanTarget(_seriesRect: BoxBounds, focusBBox: Readonly<BBox>): BoxBounds {
        return focusBBox;
    }

    public resetDatumCallbackCache() {
        this.datumCallbackCache.clear();
    }

    public cachedDatumCallback<T>(id: any, fn: () => T): T | undefined {
        const { datumCallbackCache } = this;
        const existing = datumCallbackCache.get(id) as T;
        if (existing != null) return existing;

        try {
            const value = fn();
            datumCallbackCache.set(id, value);
            return value;
        } catch (error) {
            Logger.error(String(error));
        }
    }

    public cachedCallWithContext<F extends Callback>(
        fn: F,
        params: CallbackParam<F>,
        cacheKey?: string
    ): ReturnType<F> | undefined {
        return this.ctx.callbackCache.call([this.properties, this.ctx.chartService], fn, params, cacheKey);
    }

    public callWithContext<F extends Callback>(fn: F, params: CallbackParam<F>): ReturnType<F> {
        return callWithContext([this.properties, this.ctx.chartService], fn, params);
    }

    protected formatTooltipWithContext<P extends AgSeriesTooltipRendererParams<any>, Tooltip extends SeriesTooltip<P>>(
        tooltip: Tooltip,
        content: TooltipStructuredContent,
        params: RequireOptional<P>
    ) {
        return tooltip.formatTooltip([this.properties, this.ctx.chartService], content, params);
    }

    abstract getCategoryValue(datumIndex: DatumIndex): any;

    abstract datumIndexForCategoryValue(categoryValue: any): DatumIndex | undefined;

    // @todo(AG-13777) - Remove this function (see CartesianSeries.ts)
    minTimeInterval(): number | undefined {
        return;
    }

    needsDataModelDiff(): boolean {
        return !this.ctx.animationManager.isSkipped() || !!this.chart?.flashOnUpdateEnabled;
    }
}
