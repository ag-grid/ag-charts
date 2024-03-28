import type { FontStyle, FontWeight, TextAlign, VerticalAlign } from 'ag-charts-community';
import { _ModuleSupport, _Scale, _Scene } from 'ag-charts-community';
import { HeatmapSeriesProperties } from './heatmapSeriesProperties';
interface HeatmapNodeDatum extends Required<_ModuleSupport.CartesianSeriesNodeDatum> {
    readonly width: number;
    readonly height: number;
    readonly fill: string;
    readonly colorValue: any;
}
interface HeatmapLabelDatum extends _Scene.Point {
    series: _ModuleSupport.CartesianSeriesNodeDatum['series'];
    datum: any;
    itemId?: string;
    text: string;
    fontSize: number;
    lineHeight: number;
    fontStyle: FontStyle | undefined;
    fontFamily: string;
    fontWeight: FontWeight | undefined;
    color: string | undefined;
    textAlign: TextAlign;
    verticalAlign: VerticalAlign;
}
declare class HeatmapSeriesNodeEvent<TEvent extends string = _ModuleSupport.SeriesNodeEventTypes> extends _ModuleSupport.CartesianSeriesNodeEvent<TEvent> {
    readonly colorKey?: string;
    constructor(type: TEvent, nativeEvent: MouseEvent, datum: HeatmapNodeDatum, series: HeatmapSeries);
}
export declare class HeatmapSeries extends _ModuleSupport.CartesianSeries<_Scene.Rect, HeatmapSeriesProperties, HeatmapNodeDatum, HeatmapLabelDatum> {
    static readonly className = "HeatmapSeries";
    static readonly type: "heatmap";
    properties: HeatmapSeriesProperties;
    protected readonly NodeEvent: typeof HeatmapSeriesNodeEvent;
    readonly colorScale: _Scale.ColorScale;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    processData(dataController: _ModuleSupport.DataController): Promise<void>;
    private isColorScaleValid;
    getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): any[];
    createNodeData(): Promise<{
        itemId: string;
        nodeData: HeatmapNodeDatum[];
        labelData: HeatmapLabelDatum[];
        scales: {
            x?: import("ag-charts-community/dist/types/src/chart/series/cartesian/scaling").Scaling | undefined;
            y?: import("ag-charts-community/dist/types/src/chart/series/cartesian/scaling").Scaling | undefined;
        };
        visible: boolean;
    }[]>;
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
        labelData: HeatmapLabelDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, HeatmapLabelDatum>;
    }): Promise<_Scene.Selection<_Scene.Text, HeatmapLabelDatum>>;
    protected updateLabelNodes(opts: {
        labelSelection: _Scene.Selection<_Scene.Text, HeatmapLabelDatum>;
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
