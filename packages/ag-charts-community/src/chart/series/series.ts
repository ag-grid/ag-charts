import type { BoxBounds, ChartAnimationPhase, DomainWithMetadata, PlacedLabel, PointLabelDatum } from 'ag-charts-core';
import {
    ActionOnSet,
    type Callback,
    type CallbackParam,
    ChartAxisDirection,
    CleanupRegistry,
    type DistantObject,
    EventEmitter,
    type InternalAgColorType,
    LRUCache,
    Logger,
    type Point,
    type RequireOptional,
    SeriesContentZIndexMap,
    type SeriesPluginModuleInstance,
    SeriesZIndexMap,
    callWithContext,
    createId,
    isEmptyObject,
    isGradientFill,
    isPatternFill,
    jsonDiff,
    mergeDefaults,
    nearestSquared,
    without,
} from 'ag-charts-core';
import type {
    AgActiveItemState,
    AgChartLabelFormatterParams,
    AgColorType,
    AgDrawingMode,
    AgInitialStateLegendOptions,
    AgSeriesMarkerStyle,
    AgSeriesTooltipRendererParams,
    AgSeriesVisibilityChange,
    FormatterParams,
    FormatterPropertyType,
    HighlightState as PublicHighlightState,
    SeriesType,
    TextOrSegments,
} from 'ag-charts-types';

import type {
    HighlightChangeEvent,
    HighlightNodeDatum,
    LegendItemClickEvent,
    LegendItemDoubleClickEvent,
} from '../../core/eventsHub';
import type { AxisFormattableLabel } from '../../module/axisContext';
import type { ModuleContext, SeriesContext } from '../../module/moduleContext';
import { ModuleMap } from '../../module/moduleMap';
import { BBox } from '../../scene/bbox';
import { Group, TranslatableGroup } from '../../scene/group';
import { type Node, PointerEvents } from '../../scene/node';
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
import type { SeriesMarker } from './seriesMarker';
import { HighlightState, type SeriesProperties, toHighlightString } from './seriesProperties';
import type { SeriesGrouping } from './seriesStateManager';
import type { SeriesTooltip } from './seriesTooltip';
import type {
    DatumIndexType,
    INodeEvent,
    ISeries,
    NodeDataDependencies,
    SeriesNodeDatum,
    SeriesNodeEventTypes,
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
    datum: SeriesNodeDatum<DatumIndexType>;
    distance: number;
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
    readonly where: 'viewport-start' | 'viewport-end';
    readonly hoverRect: Readonly<BoxBounds>;
};

export type PickFocusOutputs = {
    datumIndex: number;
    datum: SeriesNodeDatum<DatumIndexType>;
    otherIndex?: number;
    bounds: BBox | Path;
    movedBounds?: BBox;
    clipFocusBox: boolean;
};

export type PickResult = {
    pickMode: SeriesNodePickMode;
    datums: SeriesNodeDatum<DatumIndexType>[];
    distance: number;
};

export type INodeEventConstructor<
    TDatum extends SeriesNodeDatum<DatumIndexType>,
    TSeries extends Series<any, TDatum, object, any>,
    TEvent extends string = SeriesNodeEventTypes,
> = new <T extends TEvent>(type: T, event: Event, { datum }: TDatum, series: TSeries) => INodeEvent<T>;

const CROSS_FILTER_MARKER_FILL_OPACITY_FACTOR = 0.25;
const CROSS_FILTER_MARKER_STROKE_OPACITY_FACTOR = 0.125;

export class SeriesNodeEvent<
    TDatum extends SeriesNodeDatum<DatumIndexType>,
    TEvent extends string = SeriesNodeEventTypes,
> implements INodeEvent<TEvent>
{
    readonly datum: unknown;
    readonly seriesId: string;
    readonly itemId: string | number;
    defaultPrevented = false;

    constructor(
        readonly type: TEvent,
        readonly event: Event,
        nodeDatum: TDatum,
        series: ISeries<DatumIndexType, TDatum, unknown, unknown>
    ) {
        this.datum = nodeDatum.datum;
        this.seriesId = series.id;
        this.itemId = getItemId(nodeDatum);
    }

    public preventDefault() {
        this.defaultPrevented = true;
    }
}

export type SeriesNodeDataContext<I extends DatumIndexType, S = SeriesNodeDatum<I>, L = S> = {
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

export type SeriesDirectionKeysMapping<P extends SeriesProperties<any>> = {
    [key in ChartAxisDirection | FormatterPropertyType]?: (keyof P & string)[];
};

export class SeriesGroupingChangedEvent implements TypedEvent {
    type = 'groupingChanged';

    constructor(
        public series: Series<DatumIndexType, any, object, any>,
        public seriesGrouping: SeriesGrouping | undefined
    ) {}
}

export type SeriesConstructorOpts<TProps extends SeriesProperties<any>> = {
    moduleCtx: ModuleContext;
    pickModes: SeriesNodePickMode[];
    propertyKeys?: SeriesDirectionKeysMapping<TProps>;
    propertyNames?: SeriesDirectionKeysMapping<TProps>;
    canHaveAxes?: boolean;
    usesPlacedLabels?: boolean;
    alwaysClip?: boolean;
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

export type UnknownSeries = Series<DatumIndexType, SeriesNodeDatum<DatumIndexType>, object, SeriesProperties<object>>;

export abstract class Series<
        TDatumIndex extends DatumIndexType,
        TDatum extends SeriesNodeDatum<TDatumIndex>,
        TOpts extends object,
        TProps extends SeriesProperties<TOpts>,
        TLabel = TDatum,
        TContext extends SeriesNodeDataContext<TDatumIndex, TDatum, TLabel> = SeriesNodeDataContext<
            TDatumIndex,
            TDatum,
            TLabel
        >,
    >
    extends Observable
    implements ISeries<TDatumIndex, TDatum, TProps, TLabel>
{
    static readonly className: string = 'Series';
    protected cleanup = new CleanupRegistry();
    abstract readonly properties: TProps;

    pickModes: SeriesNodePickMode[];
    usesPlacedLabels: boolean = false;
    readonly alwaysClip: boolean = false;

    protected hasChangesOnHighlight: boolean = false;

    get pickModeAxis(): 'main' | 'main-category' | undefined {
        return 'main';
    }

    @ActionOnSet<Series<TDatumIndex, TDatum, TOpts, TProps, TLabel>>({
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
        new Group({ name: `${this.internalId}-highlight-node` })
    );

    readonly highlightLabelGroup = this.highlightGroup.appendChild(
        new Group({
            name: `${this.internalId}-highlight-label`,
            zIndex: SeriesContentZIndexMap.LABEL,
        })
    );

    // Error bars etc.
    readonly annotationGroup = new TranslatableGroup({
        name: `${this.internalId}-annotation`,
    });

    // Lazily initialised labelGroup for label presentation.
    readonly labelGroup = new TranslatableGroup({
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
        this.ctx.legendManager.toggleItem(newVisibility, this.id);
        this.ctx.legendManager.update();
        this.visibleMaybeChanged();
    }

    get visible() {
        // @ts-expect-error(2341) Ensure properties.visible is only accessed from here
        return this.ctx.legendManager.getSeriesEnabled(this.id) ?? this.properties.visible;
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

    public readonly ctx: ModuleContext;

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
        } = seriesOpts;

        this.ctx = moduleCtx;
        this.propertyKeys = propertyKeys;
        this.propertyNames = propertyNames;
        this.canHaveAxes = canHaveAxes;
        this.usesPlacedLabels = usesPlacedLabels;
        this.pickModes = pickModes;
        this.alwaysClip = alwaysClip;
        this.highlightLabelGroup.pointerEvents = PointerEvents.None;

        this.cleanup.register(
            this.ctx.eventsHub.on('data:update', (data) => this.setChartData(data)),
            this.ctx.eventsHub.on('highlight:change', (event) => this.onChangeHighlight(event))
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

    protected hasHighlightOpacity() {
        if (!this.properties.highlight.enabled) return false;
        if (this.ctx.highlightManager.getActiveHighlight() == null) return false;

        const { unhighlightedItem, unhighlightedSeries } = this.properties.highlight;
        return hasDimmedOpacity(unhighlightedItem) || hasDimmedOpacity(unhighlightedSeries);
    }

    protected getDrawingMode(isHighlight?: boolean, highlightDrawingMode: AgDrawingMode = 'cutout'): AgDrawingMode {
        if (isHighlight) {
            return highlightDrawingMode;
        }
        return this.hasHighlightOpacity() ? this.ctx.chartService.highlight?.drawingMode ?? 'overlay' : 'overlay';
    }

    protected getAnimationDrawingModes() {
        const drawingMode = this.getDrawingMode(false);
        return {
            start: { drawingMode: 'overlay' as AgDrawingMode },
            finish: { drawingMode },
        };
    }

    readonly events = new EventEmitter<{ 'data-update': SeriesDataEvent; 'data-processed': SeriesDataEvent }>();

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

    abstract findNodeDatum(itemIdOrIndex: AgActiveItemState['itemId']): SeriesNodeDatum<DatumIndexType> | undefined;

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

        const { opacity = defaultOpacity } = this.getHighlightStyle();
        return opacity;
    }

    public getHighlightState(
        highlightedDatum: HighlightNodeDatum | undefined,
        isHighlight?: boolean,
        datumIndex?: TDatumIndex,
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

        if (this.isSeriesHighlighted(highlightedDatum, legendItemValues)) {
            const itemHighlighted = this.isItemHighlighted(highlightedDatum, datumIndex);
            if (itemHighlighted == null) {
                return HighlightState.Series;
            }
            return HighlightState.OtherItem;
        }

        return HighlightState.OtherSeries;
    }

    public getHighlightStateString(
        datum: HighlightNodeDatum | undefined,
        isHighlight?: boolean,
        datumIndex?: TDatumIndex,
        legendItemValues?: string[]
    ): PublicHighlightState {
        return toHighlightString(this.getHighlightState(datum, isHighlight, datumIndex, legendItemValues));
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

    protected isItemHighlighted(highlightedDatum?: HighlightNodeDatum, datumIndex?: TDatumIndex) {
        // If this function is being invoked, we have already determined that the series is highlighted.
        if (highlightedDatum?.datumIndex == null || datumIndex == null) return;
        return highlightedDatum.datumIndex === datumIndex;
    }

    public getHighlightStyle(
        isHighlight?: boolean,
        datumIndex?: TDatumIndex,
        highlightState?: HighlightState,
        legendItemValues?: string[]
    ) {
        const highlightedDatum = this.ctx.highlightManager?.getActiveHighlight();
        highlightState ??= this.getHighlightState(highlightedDatum, isHighlight, datumIndex, legendItemValues);
        return this.properties.highlight.getStyle(highlightState);
    }

    protected resolveMarkerDrawingModeForState(drawingMode: AgDrawingMode, style?: AgSeriesMarkerStyle): AgDrawingMode {
        return resolveMarkerDrawingMode(drawingMode, style);
    }

    protected abstract hasItemStylers(): boolean;
    public filterItemStylerFillParams(fill: AgColorType | undefined): InternalAgColorType | undefined {
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
    abstract getTooltipContent(
        datumIndex: TDatumIndex,
        removeThisDatum: TDatum | undefined
    ): TooltipContent | undefined;

    protected _pickNodeCache = new LRUCache<PickResult | undefined>(5);
    pickNodes(point: Point, intent: SeriesNodePickIntent, exactMatchOnly = false): PickResult | undefined {
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
            let result: { datums: SeriesNodeDatum<DatumIndexType>[]; distance: number } | undefined;

            switch (pickMode) {
                case SeriesNodePickMode.EXACT_SHAPE_MATCH: {
                    const exact = this.pickNodesExactShape(point);
                    result = exact.length === 0 ? undefined : { datums: exact, distance: 0 };
                    break;
                }

                case SeriesNodePickMode.NEAREST_NODE: {
                    const closest = this.pickNodeClosestDatum(point);
                    const exact = closest?.distance === 0 ? this.pickNodesExactShape(point) : undefined;
                    if (exact != null && exact.length !== 0) {
                        result = { datums: exact, distance: 0 };
                    } else if (closest) {
                        result = { datums: [closest.datum], distance: closest.distance };
                    } else {
                        result = undefined;
                    }
                    break;
                }

                case SeriesNodePickMode.AXIS_ALIGNED: {
                    const closest =
                        pickModeAxis == null
                            ? undefined
                            : this.pickNodeMainAxisFirst(point, pickModeAxis === 'main-category');
                    result = closest == null ? undefined : { datums: [closest.datum], distance: closest.distance };
                    break;
                }
            }

            if (result && result.distance <= maxDistance) {
                return this._pickNodeCache.set(key, { pickMode, datums: result.datums, distance: result.distance });
            }
        }

        return this._pickNodeCache.set(key, undefined);
    }

    protected pickNodesExactShape(point: Point): SeriesNodeDatum<DatumIndexType>[] {
        const datums: SeriesNodeDatum<DatumIndexType>[] = [];
        for (const node of this.contentGroup.pickNodes(point.x, point.y)) {
            const datum = node.closestDatum();
            if (datum != null && datum.missing !== true) {
                datums.push(datum);
            }
        }
        return datums;
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
        const match = nearestSquared(point.x, point.y, items);
        const datum = match.nearest?.closestDatum();
        if (datum != null && datum.missing !== true) {
            return { datum, distance: Math.sqrt(match.distanceSquared) };
        }
    }

    protected pickNodeMainAxisFirst(_point: Point, _requireCategoryAxis: boolean): SeriesNodePickMatch | undefined {
        // Override point for subclasses - but if this is invoked, the subclass specified it wants
        // to use this feature.
        throw new Error('AG Charts - Series.pickNodeMainAxisFirst() not implemented');
    }

    isPointInArea?(x: number, y: number): boolean;

    public getLabelData(): (TLabel & PointLabelDatum)[] {
        return [];
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
        const clickEvent = new this.NodeEvent('seriesNodeClick', event, datum, this);
        this.fireEvent(clickEvent);
        return !clickEvent.defaultPrevented;
    }

    fireNodeDoubleClickEvent(event: Event, datum: TDatum): boolean {
        const clickEvent = new this.NodeEvent('seriesNodeDoubleClick', event, datum, this);
        this.fireEvent(clickEvent);
        return !clickEvent.defaultPrevented;
    }

    createNodeContextMenuActionEvent(event: Event, datum: TDatum): INodeEvent<'nodeContextMenuAction'> {
        return new this.NodeEvent('nodeContextMenuAction', event, datum, this);
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

        this.ctx.legendManager.toggleItem(enabled, seriesId, itemId, legendItemName);
    }

    isEnabled() {
        return this.visible;
    }

    getModuleMap() {
        return this.moduleMap;
    }

    createModuleContext(): SeriesContext {
        return { ...this.ctx, series: this };
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
    ): TextOrSegments {
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
            isHighlight?: boolean;
            checkForHighlight?: boolean;
            resolveMarkerSubPath?: string[];
            resolveStyler?: boolean;
        },
        defaultOverrideStyle: AgSeriesMarkerStyle & { size: number } = { size: point?.size ?? marker.size ?? 0 },
        inheritedStyle?: AgSeriesMarkerStyle
    ) {
        const { itemStyler } = marker;
        const {
            highlightState,
            isHighlight = false,
            checkForHighlight = true,
            resolveMarkerSubPath = ['marker'],
            resolveStyler = false,
        } = opts ?? {};
        const resolvePath = ['series', `${this.declarationOrder}`, ...resolveMarkerSubPath];

        if (resolveStyler) {
            const resolveOpt = { permissivePath: true };
            const resolved = this.ctx.optionsGraphService.resolvePartial(resolvePath, defaultOverrideStyle, resolveOpt);
            if (resolved) {
                defaultOverrideStyle = { ...resolved, size: resolved.size ?? defaultOverrideStyle.size };
            }
        }

        const highlightStyle: AgSeriesMarkerStyle | undefined = checkForHighlight
            ? this.getHighlightStyle(isHighlight, datumIndex, highlightState)
            : undefined;
        const baseStyle = mergeDefaults(highlightStyle, defaultOverrideStyle, marker.getStyle(), inheritedStyle);

        let markerStyle = baseStyle;

        if (itemStyler && params) {
            const highlight = this.ctx.highlightManager?.getActiveHighlight();
            const highlightStateString = this.getHighlightStateString(highlight, isHighlight, datumIndex);
            const fill = this.filterItemStylerFillParams(markerStyle.fill);

            const style = this.cachedCallWithContext(itemStyler, {
                seriesId: this.id,
                ...markerStyle,
                fill,
                ...params,
                highlightState: highlightStateString,
                datum,
            });
            const resolved = this.ctx.optionsGraphService.resolvePartial(resolvePath, style);

            markerStyle = mergeDefaults(resolved, markerStyle);
        }

        return markerStyle;
    }

    protected applyMarkerStyle(
        style: AgSeriesMarkerStyle,
        markerNode: Marker,
        point: { x: number; y: number; size?: number; focusSize?: number } | undefined,
        fillBBox?: ShapeFillBBox,
        { applyTranslation = true, selected = true } = {}
    ) {
        const { shape, size = 0 } = style;
        const visible = this.visible && size > 0 && point && !Number.isNaN(point.x) && !Number.isNaN(point.y);

        markerNode.setStyleProperties(style, fillBBox);

        if (applyTranslation) {
            markerNode.setProperties({
                visible,
                shape,
                size,
                x: point?.x,
                y: point?.y,
                scalingCenterX: point?.x,
                scalingCenterY: point?.y,
            });
        } else {
            markerNode.setProperties({ visible, shape, size });
        }

        if (!selected) {
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

    public cachedCallWithContext<F extends Callback>(fn: F, params: CallbackParam<F>): ReturnType<F> | undefined {
        return this.ctx.callbackCache.call([this.properties, this.ctx.chartService], fn, params);
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

    abstract getCategoryValue(datumIndex: TDatumIndex): any;

    abstract datumIndexForCategoryValue(categoryValue: any): TDatumIndex | undefined;

    // @todo(AG-13777) - Remove this function (see CartesianSeries.ts)
    minTimeInterval(): number | undefined {
        return;
    }

    needsDataModelDiff(): boolean {
        return !this.ctx.animationManager.isSkipped() || !!this.chart?.flashOnUpdateEnabled;
    }
}
