import type { ModuleContext, SeriesContext } from '../../module/moduleContext';
import { ModuleMap } from '../../module/moduleMap';
import type { SeriesOptionInstance, SeriesOptionModule, SeriesType } from '../../module/optionsModuleTypes';
import type { AgChartLabelFormatterParams, AgChartLabelOptions } from '../../options/agChartOptions';
import type { AgSeriesMarkerFormatterParams, AgSeriesMarkerStyle, ISeriesMarker } from '../../options/series/markerOptions';
import type { ScaleType } from '../../scale/scale';
import type { BBox } from '../../scene/bbox';
import { Group } from '../../scene/group';
import type { ZIndexSubOrder } from '../../scene/layersManager';
import { DistantObject } from '../../scene/nearest';
import type { Node } from '../../scene/node';
import type { Point } from '../../scene/point';
import type { PlacedLabel, PointLabelDatum } from '../../scene/util/labelPlacement';
import type { TypedEvent } from '../../util/observable';
import { Observable } from '../../util/observable';
import type { ChartAnimationPhase } from '../chartAnimationPhase';
import type { ChartAxis } from '../chartAxis';
import { ChartAxisDirection } from '../chartAxisDirection';
import type { ChartMode } from '../chartMode';
import type { DataController } from '../data/dataController';
import type { DatumPropertyDefinition } from '../data/dataModel';
import type { ChartLegendDatum, ChartLegendType } from '../legendDatum';
import type { Marker } from '../marker/marker';
import type { TooltipContent } from '../tooltip/tooltip';
import type { BaseSeriesEvent, SeriesEventType } from './seriesEvents';
import type { SeriesGroupZIndexSubOrderType } from './seriesLayerManager';
import type { SeriesProperties } from './seriesProperties';
import type { SeriesGrouping } from './seriesStateManager';
import type { ISeries, NodeDataDependencies, SeriesNodeDatum } from './seriesTypes';
/** Modes of matching user interactions to rendered nodes (e.g. hover or click) */
export declare enum SeriesNodePickMode {
    /** Pick matches based upon pick coordinates being inside a matching shape/marker. */
    EXACT_SHAPE_MATCH = 0,
    /** Pick matches by nearest category/X-axis value, then distance within that category/X-value. */
    NEAREST_BY_MAIN_AXIS_FIRST = 1,
    /** Pick matches by nearest category value, then distance within that category. */
    NEAREST_BY_MAIN_CATEGORY_AXIS_FIRST = 2,
    /** Pick matches based upon distance to ideal position */
    NEAREST_NODE = 3
}
export type SeriesNodePickMatch = {
    datum: SeriesNodeDatum;
    distance: number;
};
export type PickFocusInputs = {
    readonly datumIndex: number;
    readonly datumIndexDelta: number;
    readonly seriesRect?: Readonly<BBox>;
};
export type PickFocusOutputs<TDatum> = {
    datumIndex: number;
    datum: TDatum;
    bbox: BBox;
    showFocusBox: boolean;
};
export declare function basicContinuousCheckDatumValidation(value: any): boolean;
export declare function keyProperty<K>(propName: K, scaleType?: ScaleType, opts?: Partial<DatumPropertyDefinition<K>>): DatumPropertyDefinition<K>;
export declare function valueProperty<K>(propName: K, scaleType?: ScaleType, opts?: Partial<DatumPropertyDefinition<K>>): DatumPropertyDefinition<K>;
export declare function rangedValueProperty<K>(propName: K, opts?: Partial<DatumPropertyDefinition<K>> & {
    min?: number;
    max?: number;
}): DatumPropertyDefinition<K>;
export declare function accumulativeValueProperty<K>(propName: K, scaleType?: ScaleType, opts?: Partial<DatumPropertyDefinition<K>> & {
    onlyPositive?: boolean;
}): DatumPropertyDefinition<K>;
export declare function trailingAccumulatedValueProperty<K>(propName: K, scaleType?: ScaleType, opts?: Partial<DatumPropertyDefinition<K>>): DatumPropertyDefinition<K>;
export declare function groupAccumulativeValueProperty<K>(propName: K, mode: 'normal' | 'trailing' | 'window' | 'window-trailing', sum: "current" | "last" | undefined, opts: Partial<DatumPropertyDefinition<K>> & {
    rangeId?: string;
    groupId: string;
}, scaleType?: ScaleType): (import("../data/dataModel").GroupValueProcessorDefinition<any, any> | import("../data/dataModel").AggregatePropertyDefinition<any, any, [number, number], [number, number]> | DatumPropertyDefinition<K>)[];
export type SeriesNodeEventTypes = 'nodeClick' | 'nodeDoubleClick' | 'nodeContextMenuAction' | 'groupingChanged';
interface INodeEvent<TEvent extends string = SeriesNodeEventTypes> extends TypedEvent {
    readonly type: TEvent;
    readonly event: Event;
    readonly datum: unknown;
    readonly seriesId: string;
}
export interface INodeEventConstructor<TDatum extends SeriesNodeDatum, TSeries extends Series<TDatum, any>, TEvent extends string = SeriesNodeEventTypes> {
    new (type: TEvent, event: Event, { datum }: TDatum, series: TSeries): INodeEvent<TEvent>;
}
export declare class SeriesNodeEvent<TDatum extends SeriesNodeDatum, TEvent extends string = SeriesNodeEventTypes> implements INodeEvent<TEvent> {
    readonly type: TEvent;
    readonly event: Event;
    readonly datum: unknown;
    readonly seriesId: string;
    constructor(type: TEvent, event: Event, { datum }: TDatum, series: ISeries<TDatum, unknown>);
}
export type SeriesNodeDataContext<S = SeriesNodeDatum, L = S> = {
    itemId: string;
    nodeData: S[];
    labelData: L[];
};
declare enum SeriesHighlight {
    None = 0,
    This = 1,
    Other = 2
}
export type SeriesModuleMap = ModuleMap<SeriesOptionModule, SeriesOptionInstance, SeriesContext>;
export type SeriesDirectionKeysMapping<P extends SeriesProperties<any>> = {
    [key in ChartAxisDirection]?: (keyof P & string)[];
};
export declare class SeriesGroupingChangedEvent implements TypedEvent {
    series: Series<any, any>;
    seriesGrouping: SeriesGrouping | undefined;
    oldGrouping: SeriesGrouping | undefined;
    type: string;
    constructor(series: Series<any, any>, seriesGrouping: SeriesGrouping | undefined, oldGrouping: SeriesGrouping | undefined);
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
export declare abstract class Series<TDatum extends SeriesNodeDatum, TProps extends SeriesProperties<any>, TLabel = TDatum, TContext extends SeriesNodeDataContext<TDatum, TLabel> = SeriesNodeDataContext<TDatum, TLabel>> extends Observable implements ISeries<TDatum, TProps> {
    protected destroyFns: (() => void)[];
    abstract readonly properties: TProps;
    pickModes: SeriesNodePickMode[];
    seriesGrouping?: SeriesGrouping;
    protected static readonly highlightedZIndex = 1000000000000;
    protected readonly NodeEvent: INodeEventConstructor<TDatum, any>;
    readonly internalId: string;
    get id(): string;
    readonly canHaveAxes: boolean;
    get type(): SeriesType;
    readonly rootGroup: Group;
    readonly contentGroup: Group;
    readonly highlightGroup: Group;
    readonly highlightNode: Group;
    readonly highlightLabel: Group;
    readonly labelGroup: Group;
    readonly annotationGroup: Group;
    chart?: {
        mode: ChartMode;
        isMiniChart: boolean;
        placeLabels(): Map<Series<any, any>, PlacedLabel[]>;
        seriesRect?: BBox;
    };
    axes: Record<ChartAxisDirection, ChartAxis | undefined>;
    directions: ChartAxisDirection[];
    private readonly directionKeys;
    private readonly directionNames;
    protected nodeDataRefresh: boolean;
    protected readonly moduleMap: SeriesModuleMap;
    protected _data?: any[];
    protected _chartData?: any[];
    protected get data(): any[] | undefined;
    set visible(value: boolean);
    get visible(): boolean;
    get hasData(): boolean;
    get tooltipEnabled(): boolean;
    protected onDataChange(): void;
    setOptionsData(input: unknown[]): void;
    setChartData(input: unknown[]): void;
    private onSeriesGroupingChange;
    getBandScalePadding(): {
        inner: number;
        outer: number;
    };
    _declarationOrder: number;
    protected readonly ctx: ModuleContext;
    constructor(seriesOpts: SeriesConstructorOpts<TProps>);
    getGroupZIndexSubOrder(type: SeriesGroupZIndexSubOrderType, subIndex?: number): ZIndexSubOrder;
    private seriesListeners;
    addListener<T extends SeriesEventType, E extends BaseSeriesEvent<T>>(type: T, listener: (event: E) => void): () => void;
    protected dispatch<T extends SeriesEventType, E extends BaseSeriesEvent<T>>(type: T, event: E): void;
    addChartEventListeners(): void;
    destroy(): void;
    abstract resetAnimation(chartAnimationPhase: ChartAnimationPhase): void;
    private getDirectionValues;
    getKeys(direction: ChartAxisDirection): string[];
    getKeyProperties(direction: ChartAxisDirection): (keyof TProps & string)[];
    getNames(direction: ChartAxisDirection): (string | undefined)[];
    protected resolveKeyDirection(direction: ChartAxisDirection): ChartAxisDirection;
    getDomain(direction: ChartAxisDirection): any[];
    abstract getSeriesDomain(direction: ChartAxisDirection): any[];
    abstract processData(dataController: DataController): Promise<void>;
    abstract createNodeData(): Promise<TContext | undefined>;
    markNodeDataDirty(): void;
    visibleChanged(): void;
    abstract update(opts: {
        seriesRect?: BBox;
    }): Promise<void>;
    getOpacity(): number;
    protected getStrokeWidth(defaultStrokeWidth: number): number;
    protected isItemIdHighlighted(): SeriesHighlight;
    protected getModuleTooltipParams(): object;
    abstract getTooltipHtml(seriesDatum: any): TooltipContent;
    pickNode(point: Point, limitPickModes?: SeriesNodePickMode[]): {
        pickMode: SeriesNodePickMode;
        match: SeriesNodeDatum;
        distance: number;
    } | undefined;
    protected pickNodeExactShape(point: Point): SeriesNodePickMatch | undefined;
    protected pickNodeClosestDatum(_point: Point): SeriesNodePickMatch | undefined;
    protected pickNodeNearestDistantObject<T extends Node & DistantObject>(point: Point, items: Iterable<T>): {
        datum: any;
        distance: number;
    } | undefined;
    protected pickNodeMainAxisFirst(_point: Point, _requireCategoryAxis: boolean): SeriesNodePickMatch | undefined;
    abstract getLabelData(): PointLabelDatum[];
    fireNodeClickEvent(event: Event, datum: TDatum): void;
    fireNodeDoubleClickEvent(event: Event, datum: TDatum): void;
    createNodeContextMenuActionEvent(event: Event, datum: TDatum): INodeEvent;
    abstract getLegendData<T extends ChartLegendType>(legendType: T): ChartLegendDatum<T>[];
    abstract getLegendData(legendType: ChartLegendType): ChartLegendDatum<ChartLegendType>[];
    protected toggleSeriesItem(itemId: any, enabled: boolean): void;
    isEnabled(): boolean;
    getModuleMap(): SeriesModuleMap;
    createModuleContext(): SeriesContext;
    protected getLabelText<TParams>(label: AgChartLabelOptions<any, TParams>, params: TParams & Omit<AgChartLabelFormatterParams<any>, 'seriesId'>, defaultFormatter?: (value: any) => string): string;
    getMarkerStyle<TParams>(marker: ISeriesMarker<TDatum, TParams>, params: TParams & Omit<AgSeriesMarkerFormatterParams<TDatum>, 'seriesId'>, defaultStyle?: AgSeriesMarkerStyle): AgSeriesMarkerStyle & {
        size: number;
    };
    protected updateMarkerStyle<TParams>(markerNode: Marker, marker: ISeriesMarker<TDatum, TParams>, params: TParams & Omit<AgSeriesMarkerFormatterParams<TDatum>, 'seriesId'>, defaultStyle?: AgSeriesMarkerStyle, { applyTranslation }?: {
        applyTranslation?: boolean | undefined;
    }): void;
    getMinRects(_width: number, _height: number): {
        minRect: BBox;
        minVisibleRect: BBox;
    } | undefined;
    protected _nodeDataDependencies?: NodeDataDependencies;
    get nodeDataDependencies(): NodeDataDependencies;
    protected checkResize(newSeriesRect?: BBox): boolean;
    pickFocus(_opts: PickFocusInputs): PickFocusOutputs<TDatum> | undefined;
}
export {};
