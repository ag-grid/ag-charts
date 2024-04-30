import { _ModuleSupport, _Scene } from 'ag-charts-community';
import { RadarNodeDatum, RadarSeriesProperties } from './radarSeriesProperties';
export interface RadarPathPoint {
    x: number;
    y: number;
    moveTo: boolean;
    radius?: number;
    startAngle?: number;
    endAngle?: number;
    arc?: boolean;
}
declare class RadarSeriesNodeEvent<TEvent extends string = _ModuleSupport.SeriesNodeEventTypes> extends _ModuleSupport.SeriesNodeEvent<RadarNodeDatum, TEvent> {
    readonly angleKey?: string;
    readonly radiusKey?: string;
    constructor(type: TEvent, nativeEvent: Event, datum: RadarNodeDatum, series: RadarSeries);
}
export declare abstract class RadarSeries extends _ModuleSupport.PolarSeries<RadarNodeDatum, RadarSeriesProperties<any>, _Scene.Marker> {
    static readonly className: string;
    properties: RadarSeriesProperties<import("ag-charts-community").AgBaseRadarSeriesOptions<any>>;
    protected readonly NodeEvent: typeof RadarSeriesNodeEvent;
    protected lineSelection: _Scene.Selection<_Scene.Path, boolean>;
    protected resetInvalidToZero: boolean;
    private seriesItemEnabled;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    protected nodeFactory(): _Scene.Marker;
    addChartEventListeners(): void;
    getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): any[];
    processData(dataController: _ModuleSupport.DataController): Promise<void>;
    protected circleCache: {
        r: number;
        cx: number;
        cy: number;
    };
    protected didCircleChange(): boolean;
    protected getAxisInnerRadius(): number;
    maybeRefreshNodeData(): Promise<void>;
    createNodeData(): Promise<{
        itemId: string;
        nodeData: RadarNodeDatum[];
        labelData: RadarNodeDatum[];
    } | undefined>;
    update({ seriesRect }: {
        seriesRect?: _Scene.BBox;
    }): Promise<void>;
    protected updatePathSelections(): void;
    protected updateMarkerSelection(): void;
    protected getMarkerFill(highlightedStyle?: _ModuleSupport.SeriesItemHighlightStyle): string | undefined;
    protected updateMarkers(selection: _Scene.Selection<_Scene.Marker, RadarNodeDatum>, highlight: boolean): void;
    protected updateLabels(): void;
    getTooltipHtml(nodeDatum: RadarNodeDatum): _ModuleSupport.TooltipContent;
    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[];
    onLegendItemClick(event: _ModuleSupport.LegendItemClickChartEvent): void;
    onLegendItemDoubleClick(event: _ModuleSupport.LegendItemDoubleClickChartEvent): void;
    protected pickNodeClosestDatum(point: _Scene.Point): _ModuleSupport.SeriesNodePickMatch | undefined;
    computeLabelsBBox(): Promise<_Scene.BBox | null>;
    protected getLineNode(): _Scene.Path;
    protected beforePathAnimation(): void;
    protected getLinePoints(): RadarPathPoint[];
    protected animateSinglePath(pathNode: _Scene.Path, points: RadarPathPoint[], ratio: number): void;
    protected animatePaths(ratio: number): void;
    animateEmptyUpdateReady(): void;
    animateWaitingUpdateReady(data: _ModuleSupport.PolarAnimationData): void;
    animateReadyResize(data: _ModuleSupport.PolarAnimationData): void;
    protected resetPaths(): void;
    getFormattedMarkerStyle(datum: RadarNodeDatum): import("ag-charts-community").AgSeriesMarkerStyle & {
        size: number;
    };
    protected computeFocusBounds(opts: _ModuleSupport.PickFocusInputs): _Scene.BBox | undefined;
}
export {};
