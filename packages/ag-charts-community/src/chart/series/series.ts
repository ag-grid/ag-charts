import type { ModuleContext, SeriesContext } from '../../module/moduleContext';
import { ModuleMap } from '../../module/moduleMap';
import type { SeriesOptionInstance, SeriesOptionModule, SeriesType } from '../../module/optionsModuleTypes';
import type { AgChartLabelFormatterParams, AgChartLabelOptions } from '../../options/agChartOptions';
import type {
    AgSeriesMarkerFormatterParams,
    AgSeriesMarkerStyle,
    ISeriesMarker,
} from '../../options/series/markerOptions';
import type { BBox } from '../../scene/bbox';
import { Group } from '../../scene/group';
import type { ZIndexSubOrder } from '../../scene/layersManager';
import type { Point } from '../../scene/point';
import type { PlacedLabel, PointLabelDatum } from '../../scene/util/labelPlacement';
import { createId } from '../../util/id';
import { jsonDiff } from '../../util/json';
import { Listeners } from '../../util/listeners';
import { mergeDefaults } from '../../util/object';
import type { TypedEvent } from '../../util/observable';
import { Observable } from '../../util/observable';
import { ActionOnSet } from '../../util/proxy';
import type { ChartAnimationPhase } from '../chartAnimationPhase';
import type { ChartAxis } from '../chartAxis';
import { ChartAxisDirection } from '../chartAxisDirection';
import type { ChartMode } from '../chartMode';
import type { DataController } from '../data/dataController';
import { Layers } from '../layers';
import type { ChartLegendDatum, ChartLegendType } from '../legendDatum';
import type { Marker } from '../marker/marker';
import type { BaseSeriesEvent, SeriesEventType } from './seriesEvents';
import type { SeriesGroupZIndexSubOrderType } from './seriesLayerManager';
import type { SeriesProperties } from './seriesProperties';
import type { SeriesGrouping } from './seriesStateManager';
import type { ISeries, NodeDataDependencies, SeriesNodeDatum } from './seriesTypes';

/** Modes of matching user interactions to rendered nodes (e.g. hover or click) */
export enum SeriesNodePickMode {
    /** Pick matches based upon pick coordinates being inside a matching shape/marker. */
    EXACT_SHAPE_MATCH,
    /** Pick matches by nearest category/X-axis value, then distance within that category/X-value. */
    NEAREST_BY_MAIN_AXIS_FIRST,
    /** Pick matches by nearest category value, then distance within that category. */
    NEAREST_BY_MAIN_CATEGORY_AXIS_FIRST,
    /** Pick matches based upon distance to ideal position */
    NEAREST_NODE,
}

export type SeriesNodePickMatch = {
    datum: SeriesNodeDatum;
    distance: number;
};

export type SeriesNodeEventTypes = 'nodeClick' | 'nodeDoubleClick' | 'nodeContextMenuAction' | 'groupingChanged';

interface INodeEvent<TEvent extends string = SeriesNodeEventTypes> extends TypedEvent {
    readonly type: TEvent;
    readonly event: MouseEvent;
    readonly datum: unknown;
    readonly seriesId: string;
}

export interface INodeEventConstructor<
    TDatum extends SeriesNodeDatum,
    TSeries extends Series<TDatum, any>,
    TEvent extends string = SeriesNodeEventTypes,
> {
    new (type: TEvent, event: MouseEvent, { datum }: TDatum, series: TSeries): INodeEvent<TEvent>;
}

export class SeriesNodeEvent<TDatum extends SeriesNodeDatum, TEvent extends string = SeriesNodeEventTypes>
    implements INodeEvent<TEvent>
{
    readonly datum: unknown;
    readonly seriesId: string;

    constructor(
        readonly type: TEvent,
        readonly event: MouseEvent,
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
    pickModes?: SeriesNodePickMode[];
    contentGroupVirtual?: boolean;
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

    // The group node that contains all the nodes used to render this series.
    readonly rootGroup: Group = new Group({ name: 'seriesRoot', isVirtual: true });

    // The group node that contains the series rendering in its default (non-highlighted) state.
    readonly contentGroup: Group;

    // The group node that contains all highlighted series items. This is a performance optimisation
    // for large-scale data-sets, where the only thing that routinely varies is the currently
    // highlighted node.
    readonly highlightGroup: Group;
    readonly highlightNode: Group;
    readonly highlightLabel: Group;

    // Lazily initialised labelGroup for label presentation.
    readonly labelGroup: Group;

    readonly annotationGroup: Group;

    // Package-level visibility, not meant to be set by the user.
    chart?: {
        mode: ChartMode;
        isMiniChart: boolean;
        placeLabels(): Map<Series<any, any>, PlacedLabel[]>;
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

    protected get data() {
        return this._data ?? this._chartData;
    }

    set visible(value: boolean) {
        this.properties.visible = value;
        this.visibleChanged();
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

    _declarationOrder: number = -1;

    protected readonly ctx: ModuleContext;

    constructor(seriesOpts: SeriesConstructorOpts<TProps>) {
        super();

        const {
            moduleCtx,
            useLabelLayer = false,
            pickModes = [SeriesNodePickMode.NEAREST_BY_MAIN_AXIS_FIRST],
            directionKeys = {},
            directionNames = {},
            contentGroupVirtual = true,
            canHaveAxes = false,
        } = seriesOpts;

        this.ctx = moduleCtx;
        this.directionKeys = directionKeys;
        this.directionNames = directionNames;
        this.canHaveAxes = canHaveAxes;

        this.contentGroup = this.rootGroup.appendChild(
            new Group({
                name: `${this.internalId}-content`,
                layer: !contentGroupVirtual,
                isVirtual: contentGroupVirtual,
                zIndex: Layers.SERIES_LAYER_ZINDEX,
                zIndexSubOrder: this.getGroupZIndexSubOrder('data'),
            })
        );

        this.highlightGroup = new Group({
            name: `${this.internalId}-highlight`,
            layer: !contentGroupVirtual,
            isVirtual: contentGroupVirtual,
            zIndex: Layers.SERIES_LAYER_ZINDEX,
            zIndexSubOrder: this.getGroupZIndexSubOrder('highlight'),
        });
        this.highlightNode = this.highlightGroup.appendChild(new Group({ name: 'highlightNode', zIndex: 0 }));
        this.highlightLabel = this.highlightGroup.appendChild(new Group({ name: 'highlightLabel', zIndex: 10 }));

        this.pickModes = pickModes;

        this.labelGroup = this.rootGroup.appendChild(
            new Group({
                name: `${this.internalId}-series-labels`,
                layer: useLabelLayer,
                zIndex: Layers.SERIES_LABEL_ZINDEX,
            })
        );

        this.annotationGroup = new Group({
            name: `${this.id}-annotation`,
            layer: !contentGroupVirtual,
            isVirtual: contentGroupVirtual,
            zIndex: Layers.SERIES_LAYER_ZINDEX,
            zIndexSubOrder: this.getGroupZIndexSubOrder('annotation'),
        });
    }

    getGroupZIndexSubOrder(type: SeriesGroupZIndexSubOrderType, subIndex = 0): ZIndexSubOrder {
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
        const main = () => this._declarationOrder + mainAdjust;
        return [main, subIndex];
    }

    private seriesListeners = new Listeners<SeriesEventType, (event: any) => void>();

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
    abstract createNodeData(): Promise<TContext[]>;

    // Indicate that something external changed and we should recalculate nodeData.
    markNodeDataDirty() {
        this.nodeDataRefresh = true;
    }

    visibleChanged() {
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

    protected getModuleTooltipParams(): object {
        const params: object[] = this.moduleMap.mapModules((module) => module.getTooltipParams());
        return params.reduce((total, current) => ({ ...current, ...total }), {});
    }

    abstract getTooltipHtml(seriesDatum: any): string;

    pickNode(
        point: Point,
        limitPickModes?: SeriesNodePickMode[]
    ): { pickMode: SeriesNodePickMode; match: SeriesNodeDatum; distance: number } | undefined {
        const { pickModes, visible, rootGroup } = this;

        if (!visible || !rootGroup.visible) {
            return;
        }

        for (const pickMode of pickModes) {
            if (limitPickModes && !limitPickModes.includes(pickMode)) {
                continue;
            }

            let match: SeriesNodePickMatch | undefined;

            switch (pickMode) {
                case SeriesNodePickMode.EXACT_SHAPE_MATCH:
                    match = this.pickNodeExactShape(point);
                    break;

                case SeriesNodePickMode.NEAREST_BY_MAIN_AXIS_FIRST:
                case SeriesNodePickMode.NEAREST_BY_MAIN_CATEGORY_AXIS_FIRST:
                    match = this.pickNodeMainAxisFirst(
                        point,
                        pickMode === SeriesNodePickMode.NEAREST_BY_MAIN_CATEGORY_AXIS_FIRST
                    );
                    break;

                case SeriesNodePickMode.NEAREST_NODE:
                    match = this.pickNodeClosestDatum(point);
                    break;
            }

            if (match) {
                return { pickMode, match: match.datum, distance: match.distance };
            }
        }
    }

    protected pickNodeExactShape(point: Point): SeriesNodePickMatch | undefined {
        const match = this.contentGroup.pickNode(point.x, point.y);
        return match && { datum: match.datum, distance: 0 };
    }

    protected pickNodeClosestDatum(_point: Point): SeriesNodePickMatch | undefined {
        // Override point for subclasses - but if this is invoked, the subclass specified it wants
        // to use this feature.
        throw new Error('AG Charts - Series.pickNodeClosestDatum() not implemented');
    }

    protected pickNodeMainAxisFirst(_point: Point, _requireCategoryAxis: boolean): SeriesNodePickMatch | undefined {
        // Override point for subclasses - but if this is invoked, the subclass specified it wants
        // to use this feature.
        throw new Error('AG Charts - Series.pickNodeMainAxisFirst() not implemented');
    }

    abstract getLabelData(): PointLabelDatum[];

    fireNodeClickEvent(event: MouseEvent, datum: TDatum): void {
        this.fireEvent(new this.NodeEvent('nodeClick', event, datum, this));
    }

    fireNodeDoubleClickEvent(event: MouseEvent, datum: TDatum): void {
        this.fireEvent(new this.NodeEvent('nodeDoubleClick', event, datum, this));
    }

    createNodeContextMenuActionEvent(event: MouseEvent, datum: TDatum): INodeEvent {
        return new this.NodeEvent('nodeContextMenuAction', event, datum, this);
    }

    abstract getLegendData<T extends ChartLegendType>(legendType: T): ChartLegendDatum<T>[];
    abstract getLegendData(legendType: ChartLegendType): ChartLegendDatum<ChartLegendType>[];

    protected toggleSeriesItem(itemId: any, enabled: boolean): void {
        this.visible = enabled;
        this.nodeDataRefresh = true;
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

    protected getMarkerStyle<TParams>(
        marker: ISeriesMarker<TDatum, TParams>,
        params: TParams & Omit<AgSeriesMarkerFormatterParams<TDatum>, 'seriesId'>,
        defaultStyle: AgSeriesMarkerStyle = marker.getStyle()
    ) {
        const defaultSize = { size: params.datum.point?.size ?? 0 };
        const markerStyle = mergeDefaults(defaultSize, defaultStyle);
        if (marker.formatter) {
            const style = this.ctx.callbackCache.call(marker.formatter, {
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
        marker: ISeriesMarker<TDatum, TParams>,
        params: TParams & Omit<AgSeriesMarkerFormatterParams<TDatum>, 'seriesId'>,
        defaultStyle: AgSeriesMarkerStyle = marker.getStyle(),
        { applyTranslation = true } = {}
    ) {
        const { point } = params.datum;
        const activeStyle = this.getMarkerStyle(marker, params, defaultStyle);
        const visible = this.visible && activeStyle.size > 0 && point && !isNaN(point.x) && !isNaN(point.y);

        if (applyTranslation) {
            markerNode.setProperties({ visible, ...activeStyle, translationX: point?.x, translationY: point?.y });
        } else {
            markerNode.setProperties({ visible, ...activeStyle });
        }

        // Only for custom marker shapes
        if (typeof marker.shape === 'function' && !markerNode.dirtyPath) {
            markerNode.path.clear({ trackChanges: true });
            markerNode.updatePath();
            markerNode.checkPathDirty();
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
}
