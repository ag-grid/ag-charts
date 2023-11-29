import type { AgRadialSeriesFormat, AgRadialSeriesFormatterParams, AgRadialSeriesLabelFormatterParams, AgRadialSeriesTooltipRendererParams } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
declare class RadialBarSeriesNodeClickEvent<TEvent extends string = _ModuleSupport.SeriesNodeEventTypes> extends _ModuleSupport.SeriesNodeClickEvent<RadialBarNodeDatum, TEvent> {
    readonly angleKey?: string;
    readonly radiusKey?: string;
    constructor(type: TEvent, nativeEvent: MouseEvent, datum: RadialBarNodeDatum, series: RadialBarSeries);
}
interface RadialBarLabelNodeDatum {
    text: string;
    x: number;
    y: number;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
}
export interface RadialBarNodeDatum extends _ModuleSupport.SeriesNodeDatum {
    readonly label?: RadialBarLabelNodeDatum;
    readonly angleValue: any;
    readonly radiusValue: any;
    readonly innerRadius: number;
    readonly outerRadius: number;
    readonly startAngle: number;
    readonly endAngle: number;
    readonly index: number;
}
export declare class RadialBarSeries extends _ModuleSupport.PolarSeries<RadialBarNodeDatum, _Scene.Sector> {
    static className: string;
    static type: "radial-bar";
    protected readonly NodeClickEvent: typeof RadialBarSeriesNodeClickEvent;
    readonly label: _Scene.Label<AgRadialSeriesLabelFormatterParams, any>;
    protected nodeData: RadialBarNodeDatum[];
    tooltip: _ModuleSupport.SeriesTooltip<AgRadialSeriesTooltipRendererParams>;
    angleKey: string;
    angleName?: string;
    radiusKey: string;
    radiusName?: string;
    fill?: string;
    fillOpacity: number;
    stroke?: string;
    strokeOpacity: number;
    lineDash?: number[];
    lineDashOffset: number;
    formatter?: (params: AgRadialSeriesFormatterParams<any>) => AgRadialSeriesFormat;
    rotation: number;
    strokeWidth: number;
    stackGroup?: string;
    normalizedTo?: number;
    readonly highlightStyle: _ModuleSupport.HighlightStyle;
    private groupScale;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    protected nodeFactory(): _Scene.Sector;
    addChartEventListeners(): void;
    getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): any[];
    processData(dataController: _ModuleSupport.DataController): Promise<void>;
    protected circleCache: {
        r: number;
        cx: number;
        cy: number;
    };
    protected didCircleChange(): boolean;
    protected maybeRefreshNodeData(): Promise<void>;
    protected getAxisInnerRadius(): number;
    createNodeData(): Promise<{
        itemId: string;
        nodeData: RadialBarNodeDatum[];
        labelData: RadialBarNodeDatum[];
    }[]>;
    update({ seriesRect }: {
        seriesRect?: _Scene.BBox;
    }): Promise<void>;
    protected updateSectorSelection(selection: _Scene.Selection<_Scene.Sector, RadialBarNodeDatum>, highlight: boolean): void;
    protected updateLabels(): void;
    protected animateEmptyUpdateReady(): void;
    animateClearingUpdateEmpty(): void;
    getTooltipHtml(nodeDatum: RadialBarNodeDatum): string;
    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[];
    onLegendItemClick(event: _ModuleSupport.LegendItemClickChartEvent): void;
    onLegendItemDoubleClick(event: _ModuleSupport.LegendItemDoubleClickChartEvent): void;
    computeLabelsBBox(): null;
    protected getStackId(): string;
}
export {};
