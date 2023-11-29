import type { AgPieSeriesFormat, AgPieSeriesFormatterParams, AgPieSeriesTooltipRendererParams, AgRadarSeriesLabelFormatterParams, AgRadialSeriesOptionsKeys } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
export interface RadarLinePoint {
    x: number;
    y: number;
    moveTo: boolean;
}
declare class RadarSeriesNodeClickEvent<TEvent extends string = _ModuleSupport.SeriesNodeEventTypes> extends _ModuleSupport.SeriesNodeClickEvent<RadarNodeDatum, TEvent> {
    readonly angleKey?: string;
    readonly radiusKey?: string;
    constructor(type: TEvent, nativeEvent: MouseEvent, datum: RadarNodeDatum, series: RadarSeries);
}
interface RadarNodeDatum extends _ModuleSupport.SeriesNodeDatum {
    readonly label?: {
        text: string;
        x: number;
        y: number;
        textAlign: CanvasTextAlign;
        textBaseline: CanvasTextBaseline;
    };
    readonly angleValue: any;
    readonly radiusValue: any;
}
export declare abstract class RadarSeries extends _ModuleSupport.PolarSeries<RadarNodeDatum, _Scene.Marker> {
    static className: string;
    protected readonly NodeClickEvent: typeof RadarSeriesNodeClickEvent;
    readonly marker: _ModuleSupport.SeriesMarker<AgRadialSeriesOptionsKeys, RadarNodeDatum>;
    readonly label: _Scene.Label<AgRadarSeriesLabelFormatterParams, any>;
    protected lineSelection: _Scene.Selection<_Scene.Path, boolean>;
    protected nodeData: RadarNodeDatum[];
    tooltip: _ModuleSupport.SeriesTooltip<AgPieSeriesTooltipRendererParams>;
    /**
     * The key of the numeric field to use to determine the angle (for example,
     * a pie sector angle).
     */
    angleKey: string;
    angleName?: string;
    /**
     * The key of the numeric field to use to determine the radii of pie sectors.
     * The largest value will correspond to the full radius and smaller values to
     * proportionally smaller radii.
     */
    radiusKey: string;
    radiusName?: string;
    stroke?: string;
    strokeOpacity: number;
    lineDash?: number[];
    lineDashOffset: number;
    formatter?: (params: AgPieSeriesFormatterParams<any>) => AgPieSeriesFormat;
    /**
     * The series rotation in degrees.
     */
    rotation: number;
    strokeWidth: number;
    readonly highlightStyle: _ModuleSupport.HighlightStyle;
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
    }[]>;
    update({ seriesRect }: {
        seriesRect?: _Scene.BBox;
    }): Promise<void>;
    protected updatePathSelections(): void;
    protected getMarkerFill(highlightedStyle?: _ModuleSupport.SeriesItemHighlightStyle): string | undefined;
    protected updateMarkers(selection: _Scene.Selection<_Scene.Marker, RadarNodeDatum>, highlight: boolean): void;
    protected updateLabels(): void;
    getTooltipHtml(nodeDatum: RadarNodeDatum): string;
    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[];
    onLegendItemClick(event: _ModuleSupport.LegendItemClickChartEvent): void;
    onLegendItemDoubleClick(event: _ModuleSupport.LegendItemDoubleClickChartEvent): void;
    protected pickNodeClosestDatum(point: _Scene.Point): _ModuleSupport.SeriesNodePickMatch | undefined;
    computeLabelsBBox(): Promise<_Scene.BBox | null>;
    protected getLineNode(): _Scene.Path;
    protected beforePathAnimation(): void;
    protected getLinePoints(options: {
        breakMissingPoints: boolean;
    }): RadarLinePoint[];
    protected animateSinglePath(pathNode: _Scene.Path, points: RadarLinePoint[], ratio: number): void;
    protected animatePaths(ratio: number): void;
    animateEmptyUpdateReady(): void;
    animateWaitingUpdateReady(data: _ModuleSupport.PolarAnimationData): void;
    animateReadyResize(data: _ModuleSupport.PolarAnimationData): void;
    protected resetPaths(): void;
}
export {};
