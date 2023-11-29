import type { AgHeatmapSeriesFormat, AgHeatmapSeriesFormatterParams, AgHeatmapSeriesLabelFormatterParams, AgHeatmapSeriesTooltipRendererParams } from 'ag-charts-community';
import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';
interface HeatmapNodeDatum extends Required<_ModuleSupport.CartesianSeriesNodeDatum> {
    readonly label: _Util.MeasuredLabel;
    readonly width: number;
    readonly height: number;
    readonly fill: string;
    readonly colorValue: any;
}
declare class HeatmapSeriesNodeClickEvent<TEvent extends string = _ModuleSupport.SeriesNodeEventTypes> extends _ModuleSupport.CartesianSeriesNodeClickEvent<TEvent> {
    readonly colorKey?: string;
    constructor(type: TEvent, nativeEvent: MouseEvent, datum: HeatmapNodeDatum, series: HeatmapSeries);
}
export declare class HeatmapSeries extends _ModuleSupport.CartesianSeries<_Scene.Rect, HeatmapNodeDatum> {
    static className: string;
    static type: "heatmap";
    protected readonly NodeClickEvent: typeof HeatmapSeriesNodeClickEvent;
    readonly label: _Scene.Label<AgHeatmapSeriesLabelFormatterParams, any>;
    title?: string;
    xKey?: string;
    xName?: string;
    yKey?: string;
    yName?: string;
    colorKey?: string;
    colorName?: string;
    colorRange: string[];
    stroke: string;
    strokeWidth: number;
    formatter?: (params: AgHeatmapSeriesFormatterParams<any>) => AgHeatmapSeriesFormat;
    readonly colorScale: _Scale.ColorScale;
    readonly tooltip: _ModuleSupport.SeriesTooltip<AgHeatmapSeriesTooltipRendererParams>;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    processData(dataController: _ModuleSupport.DataController): Promise<void>;
    private isColorScaleValid;
    getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): any[];
    createNodeData(): Promise<{
        itemId: string;
        nodeData: HeatmapNodeDatum[];
        labelData: HeatmapNodeDatum[];
        scales: {
            x?: _ModuleSupport.Scaling | undefined;
            y?: _ModuleSupport.Scaling | undefined;
        };
        visible: boolean;
    }[]>;
    getLabelData(): _Util.PointLabelDatum[];
    protected nodeFactory(): _Scene.Rect;
    protected updateDatumSelection(opts: {
        nodeData: HeatmapNodeDatum[];
        datumSelection: _Scene.Selection<_Scene.Rect, HeatmapNodeDatum>;
    }): Promise<_Scene.Selection<_Scene.Rect, HeatmapNodeDatum>>;
    protected updateDatumNodes(opts: {
        datumSelection: _Scene.Selection<_Scene.Rect, HeatmapNodeDatum>;
        isHighlight: boolean;
    }): Promise<void>;
    protected updateLabelSelection(opts: {
        labelData: HeatmapNodeDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, HeatmapNodeDatum>;
    }): Promise<_Scene.Selection<_Scene.Text, HeatmapNodeDatum>>;
    protected updateLabelNodes(opts: {
        labelSelection: _Scene.Selection<_Scene.Text, HeatmapNodeDatum>;
    }): Promise<void>;
    getTooltipHtml(nodeDatum: HeatmapNodeDatum): string;
    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.GradientLegendDatum[];
    protected isLabelEnabled(): boolean;
    getBandScalePadding(): {
        inner: number;
        outer: number;
    };
}
export {};
