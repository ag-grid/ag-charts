import { _ModuleSupport, _Scene } from 'ag-charts-community';
import { RadialBarSeriesProperties } from './radialBarSeriesProperties';
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
    properties: RadialBarSeriesProperties<import("ag-charts-community").AgBaseRadialColumnSeriesOptions<any>>;
    protected readonly NodeClickEvent: typeof RadialBarSeriesNodeClickEvent;
    protected nodeData: RadialBarNodeDatum[];
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
    private getBarTransitionFunctions;
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
