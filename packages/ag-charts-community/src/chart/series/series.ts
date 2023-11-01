import type { ModuleContext, SeriesContext } from '../../module/moduleContext';
import type { ModuleContextInitialiser } from '../../module/moduleMap';
import { ModuleMap } from '../../module/moduleMap';
import type { SeriesOptionInstance, SeriesOptionModule } from '../../module/optionModules';
import type { AgChartLabelFormatterParams, AgChartLabelOptions } from '../../options/chart/labelOptions';
import type { InteractionRange } from '../../options/chart/types';
import type {
    AgSeriesMarkerFormatterParams,
    AgSeriesMarkerStyle,
    ISeriesMarker,
} from '../../options/series/markerOptions';
import type { BBox } from '../../scene/bbox';
import { Group } from '../../scene/group';
import type { ZIndexSubOrder } from '../../scene/node';
import type { Point } from '../../scene/point';
import { createId } from '../../util/id';
import type { PlacedLabel, PointLabelDatum } from '../../util/labelPlacement';
import { Listeners } from '../../util/listeners';
import { mergeDefaults } from '../../util/object';
import type { TypedEvent } from '../../util/observable';
import { ActionOnSet } from '../../util/proxy';
import {
    BOOLEAN,
    INTERACTION_RANGE,
    OPT_BOOLEAN,
    OPT_COLOR_STRING,
    OPT_LINE_DASH,
    OPT_NUMBER,
    STRING,
    Validate,
} from '../../util/validation';
import { checkDatum } from '../../util/value';
import type { ChartAxis } from '../chartAxis';
import { ChartAxisDirection } from '../chartAxisDirection';
import { accumulatedValue, trailingAccumulatedValue } from '../data/aggregateFunctions';
import type { DataController } from '../data/dataController';
import type { DatumPropertyDefinition, ScopeProvider } from '../data/dataModel';
import { accumulateGroup } from '../data/processors';
import { Layers } from '../layers';
import type { ChartLegendDatum, ChartLegendType } from '../legendDatum';
import type { Marker } from '../marker/marker';
import type { SeriesEventType, SeriesNodeEventTypes } from './seriesEvents';
import type { SeriesGroupZIndexSubOrderType } from './seriesLayerManager';
import type { SeriesGrouping } from './seriesStateManager';
import type { SeriesTooltip } from './seriesTooltip';
import type { ISeries, SeriesNodeDatum } from './seriesTypes';

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

function basicContinuousCheckDatumValidation(v: any) {
    return checkDatum(v, true) != null;
}

function basicDiscreteCheckDatumValidation(v: any) {
    return checkDatum(v, false) != null;
}

export function keyProperty<K>(
    scope: ScopeProvider,
    propName: K,
    continuous: boolean,
    opts: Partial<DatumPropertyDefinition<K>> = {}
) {
    const result: DatumPropertyDefinition<K> = {
        scopes: [scope.id],
        property: propName,
        type: 'key',
        valueType: continuous ? 'range' : 'category',
        validation: continuous ? basicContinuousCheckDatumValidation : basicDiscreteCheckDatumValidation,
        ...opts,
    };
    return result;
}

export function valueProperty<K>(
    scope: ScopeProvider,
    propName: K,
    continuous: boolean,
    opts: Partial<DatumPropertyDefinition<K>> = {}
) {
    const result: DatumPropertyDefinition<K> = {
        scopes: [scope.id],
        property: propName,
        type: 'value',
        valueType: continuous ? 'range' : 'category',
        validation: continuous ? basicContinuousCheckDatumValidation : basicDiscreteCheckDatumValidation,
        ...opts,
    };
    return result;
}

export function rangedValueProperty<K>(
    scope: ScopeProvider,
    propName: K,
    opts: Partial<DatumPropertyDefinition<K>> & { min?: number; max?: number } = {}
): DatumPropertyDefinition<K> {
    const { min = -Infinity, max = Infinity, ...defOpts } = opts;
    return {
        scopes: [scope.id],
        type: 'value',
        property: propName,
        valueType: 'range',
        validation: basicContinuousCheckDatumValidation,
        processor: () => (datum) => {
            if (typeof datum !== 'number') return datum;
            if (isNaN(datum)) return datum;

            return Math.min(Math.max(datum, min), max);
        },
        ...defOpts,
    };
}

export function trailingValueProperty<K>(
    scope: ScopeProvider,
    propName: K,
    continuous: boolean,
    opts: Partial<DatumPropertyDefinition<K>> = {}
) {
    const result: DatumPropertyDefinition<K> = {
        ...valueProperty(scope, propName, continuous, opts),
        processor: trailingValue(),
    };
    return result;
}

export function trailingValue(): DatumPropertyDefinition<any>['processor'] {
    return () => {
        let value = 0;

        return (datum: any) => {
            const trailingValue = value;
            value = datum;
            return trailingValue;
        };
    };
}

export function accumulativeValueProperty<K>(
    scope: ScopeProvider,
    propName: K,
    continuous: boolean,
    opts: Partial<DatumPropertyDefinition<K>> = {}
) {
    const result: DatumPropertyDefinition<K> = {
        ...valueProperty(scope, propName, continuous, opts),
        processor: accumulatedValue(),
    };
    return result;
}

export function trailingAccumulatedValueProperty<K>(
    scope: ScopeProvider,
    propName: K,
    continuous: boolean,
    opts: Partial<DatumPropertyDefinition<K>> = {}
) {
    const result: DatumPropertyDefinition<K> = {
        ...valueProperty(scope, propName, continuous, opts),
        processor: trailingAccumulatedValue(),
    };
    return result;
}

export function groupAccumulativeValueProperty<K>(
    scope: ScopeProvider,
    propName: K,
    continuous: boolean,
    mode: 'normal' | 'trailing' | 'window' | 'window-trailing',
    sum: 'current' | 'last' = 'current',
    opts: Partial<DatumPropertyDefinition<K>> & { groupId: string }
) {
    return [
        valueProperty(scope, propName, continuous, opts),
        accumulateGroup(scope, opts.groupId, mode, sum, opts.separateNegative),
    ];
}

interface INodeClickEvent<TEvent extends string = SeriesNodeEventTypes> extends TypedEvent {
    readonly type: TEvent;
    readonly event: MouseEvent;
    readonly datum: unknown;
    readonly seriesId: string;
}

export interface INodeClickEventConstructor<
    TDatum extends SeriesNodeDatum,
    TSeries extends Series<TDatum, any>,
    TEvent extends string = SeriesNodeEventTypes,
> {
    new (type: TEvent, event: MouseEvent, { datum }: TDatum, series: TSeries): INodeClickEvent<TEvent>;
}

export class SeriesNodeClickEvent<TDatum extends SeriesNodeDatum, TEvent extends string = SeriesNodeEventTypes>
    implements INodeClickEvent<TEvent>
{
    readonly datum: unknown;
    readonly seriesId: string;

    constructor(
        readonly type: TEvent,
        readonly event: MouseEvent,
        { datum }: TDatum,
        series: Series<TDatum, any>
    ) {
        this.datum = datum;
        this.seriesId = series.id;
    }
}

export class SeriesItemHighlightStyle {
    @Validate(OPT_COLOR_STRING)
    fill?: string = 'yellow';

    @Validate(OPT_NUMBER(0, 1))
    fillOpacity?: number = undefined;

    @Validate(OPT_COLOR_STRING)
    stroke?: string = undefined;

    @Validate(OPT_NUMBER(0))
    strokeWidth?: number = undefined;

    @Validate(OPT_NUMBER(0, 1))
    strokeOpacity?: number = undefined;

    @Validate(OPT_LINE_DASH)
    lineDash?: number[] = undefined;

    @Validate(OPT_NUMBER(0))
    lineDashOffset?: number = undefined;
}

class SeriesHighlightStyle {
    @Validate(OPT_NUMBER(0))
    strokeWidth?: number = undefined;

    @Validate(OPT_NUMBER(0, 1))
    dimOpacity?: number = undefined;

    @Validate(OPT_BOOLEAN)
    enabled?: boolean = undefined;
}

class TextHighlightStyle {
    @Validate(OPT_COLOR_STRING)
    color?: string = 'black';
}

export class HighlightStyle {
    readonly item = new SeriesItemHighlightStyle();
    readonly series = new SeriesHighlightStyle();
    readonly text = new TextHighlightStyle();
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

export type SeriesModuleMap = ModuleMap<SeriesOptionModule, SeriesContext, SeriesOptionInstance>;

export abstract class Series<
        TDatum extends SeriesNodeDatum,
        TLabel = TDatum,
        TContext extends SeriesNodeDataContext<TDatum, TLabel> = SeriesNodeDataContext<TDatum, TLabel>,
    >
    extends Listeners<SeriesEventType, (e: any) => any>
    implements ISeries<TDatum>, ModuleContextInitialiser<SeriesContext>
{
    protected static readonly highlightedZIndex = 1000000000000;

    protected readonly NodeClickEvent: INodeClickEventConstructor<TDatum, any> = SeriesNodeClickEvent;

    @Validate(STRING)
    readonly id = createId(this);

    readonly canHaveAxes: boolean;

    get type(): string {
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
        mode: 'standalone' | 'integrated';
        placeLabels(): Map<Series<any>, PlacedLabel[]>;
        getSeriesRect(): Readonly<BBox> | undefined;
    };

    axes: Record<ChartAxisDirection, ChartAxis | undefined> = {
        [ChartAxisDirection.X]: undefined,
        [ChartAxisDirection.Y]: undefined,
    };

    directions: ChartAxisDirection[] = [ChartAxisDirection.X, ChartAxisDirection.Y];
    private readonly directionKeys: { [key in ChartAxisDirection]?: string[] };
    private readonly directionNames: { [key in ChartAxisDirection]?: string[] };

    // Flag to determine if we should recalculate node data.
    protected nodeDataRefresh = true;

    abstract tooltip: SeriesTooltip<any>;

    protected _data?: any[];
    protected _chartData?: any[];

    set data(input: any[] | undefined) {
        this._data = input;
        this.onDataChange();
    }

    get data() {
        return this._data ?? this._chartData;
    }

    protected onDataChange() {
        this.nodeDataRefresh = true;
    }

    setChartData(input: unknown[]) {
        this._chartData = input;
        if (this.data === input) {
            this.onDataChange();
        }
    }

    hasData() {
        const { data } = this;
        return data && (!Array.isArray(data) || data.length > 0);
    }

    @Validate(BOOLEAN)
    protected _visible = true;
    set visible(value: boolean) {
        this._visible = value;
        this.visibleChanged();
    }
    get visible() {
        return this._visible;
    }

    @Validate(BOOLEAN)
    showInLegend = true;

    pickModes: SeriesNodePickMode[];

    @Validate(STRING)
    cursor = 'default';

    @Validate(INTERACTION_RANGE)
    nodeClickRange: InteractionRange = 'exact';

    @ActionOnSet<Series<TDatum, TLabel>>({
        changeValue: function (newVal, oldVal) {
            this.onSeriesGroupingChange(oldVal, newVal);
        },
    })
    seriesGrouping?: SeriesGrouping = undefined;

    private onSeriesGroupingChange(prev?: SeriesGrouping, next?: SeriesGrouping) {
        const { id, type, visible, rootGroup, highlightGroup, annotationGroup } = this;

        if (prev) {
            this.ctx.seriesStateManager.deregisterSeries({ id, type });
        }
        if (next) {
            this.ctx.seriesStateManager.registerSeries({ id, type, visible, seriesGrouping: next });
        }

        // Short-circuit if series isn't already attached to the scene-graph yet.
        if (this.rootGroup.parent == null) return;

        this.ctx.seriesLayerManager.changeGroup({
            id,
            type,
            rootGroup,
            highlightGroup,
            annotationGroup,
            getGroupZIndexSubOrder: (type) => this.getGroupZIndexSubOrder(type),
            seriesGrouping: next,
            oldGrouping: prev,
        });
    }

    getBandScalePadding() {
        return { inner: 1, outer: 0 };
    }

    _declarationOrder: number = -1;

    protected readonly ctx: ModuleContext;

    constructor(seriesOpts: {
        moduleCtx: ModuleContext;
        useSeriesGroupLayer?: boolean;
        useLabelLayer?: boolean;
        pickModes?: SeriesNodePickMode[];
        contentGroupVirtual?: boolean;
        directionKeys?: { [key in ChartAxisDirection]?: string[] };
        directionNames?: { [key in ChartAxisDirection]?: string[] };
        canHaveAxes?: boolean;
    }) {
        super();

        this.ctx = seriesOpts.moduleCtx;

        const {
            useLabelLayer = false,
            pickModes = [SeriesNodePickMode.NEAREST_BY_MAIN_AXIS_FIRST],
            directionKeys = {},
            directionNames = {},
            contentGroupVirtual = true,
            canHaveAxes = false,
        } = seriesOpts;

        this.directionKeys = directionKeys;
        this.directionNames = directionNames;
        this.canHaveAxes = canHaveAxes;

        this.contentGroup = this.rootGroup.appendChild(
            new Group({
                name: `${this.id}-content`,
                layer: !contentGroupVirtual,
                isVirtual: contentGroupVirtual,
                zIndex: Layers.SERIES_LAYER_ZINDEX,
                zIndexSubOrder: this.getGroupZIndexSubOrder('data'),
            })
        );

        this.highlightGroup = new Group({
            name: `${this.id}-highlight`,
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
                name: `${this.id}-series-labels`,
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

    addChartEventListeners(): void {
        return;
    }

    destroy(): void {
        this.ctx.seriesStateManager.deregisterSeries(this);
        this.ctx.seriesLayerManager.releaseGroup(this);
    }

    private getDirectionValues(
        direction: ChartAxisDirection,
        properties: { [key in ChartAxisDirection]?: string[] }
    ): string[] {
        const resolvedDirection = this.resolveKeyDirection(direction);
        const keys = properties?.[resolvedDirection];
        const values: string[] = [];

        if (!keys) return values;

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

        addValues(...keys.map((key) => (this as any)[key]));

        return values;
    }

    getKeys(direction: ChartAxisDirection): string[] {
        return this.getDirectionValues(direction, this.directionKeys);
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
        const moduleDomains: any[][] = this.dispatch('data-getDomain', { direction }) ?? [];
        // Flatten the 2D moduleDomains into a 1D array and concatenate it with seriesDomain
        return moduleDomains.reduce((total, current) => total.concat(current), seriesDomain);
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
        const { dimOpacity = 1, enabled = true } = this.highlightStyle.series;

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
        const { strokeWidth, enabled = true } = this.highlightStyle.series;

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
        const { series } = this.ctx.highlightManager?.getActiveHighlight() ?? {};

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

    protected getModuleTooltipParams(datum: object): object {
        const params: object[] = this.dispatch('tooltip-getParams', { datum }) ?? [];
        return params.reduce((total, current) => {
            return { ...current, ...total };
        }, {});
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
        this.dispatch('nodeClick', new this.NodeClickEvent('nodeClick', event, datum, this));
    }

    fireNodeDoubleClickEvent(event: MouseEvent, datum: TDatum): void {
        this.dispatch('nodeClick', new this.NodeClickEvent('nodeDoubleClick', event, datum, this));
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

    readonly highlightStyle = new HighlightStyle();

    protected readonly moduleMap: SeriesModuleMap = new ModuleMap(this);

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
        params: TParams & Omit<AgSeriesMarkerFormatterParams<TDatum['datum']>, 'seriesId'>,
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
        params: TParams & Omit<AgSeriesMarkerFormatterParams<TDatum['datum']>, 'seriesId'>,
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

    getMinRect(): BBox | undefined {
        return undefined;
    }
}
