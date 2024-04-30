import type { FontStyle, FontWeight, TextAlign, VerticalAlign } from 'ag-charts-community';
import { _ModuleSupport, _Scale, _Scene } from 'ag-charts-community';
import { HeatmapSeriesProperties } from './heatmapSeriesProperties';
interface HeatmapNodeDatum extends _ModuleSupport.CartesianSeriesNodeDatum {
    readonly point: Readonly<_Scene.SizedPoint>;
    midPoint: Readonly<_Scene.Point>;
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
    constructor(type: TEvent, nativeEvent: Event, datum: HeatmapNodeDatum, series: HeatmapSeries);
}
export declare class HeatmapSeries extends _ModuleSupport.CartesianSeries<_Scene.Rect, HeatmapSeriesProperties, HeatmapNodeDatum, HeatmapLabelDatum> {
    static readonly className = "HeatmapSeries";
    static readonly type: "heatmap";
    properties: HeatmapSeriesProperties;
    protected readonly NodeEvent: typeof HeatmapSeriesNodeEvent;
    readonly colorScale: _Scale.ColorScale;
    private seriesItemEnabled;
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
    } | undefined>;
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
    getTooltipHtml(nodeDatum: HeatmapNodeDatum): _ModuleSupport.TooltipContent;
    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.GradientLegendDatum[];
    protected isLabelEnabled(): boolean;
    getBandScalePadding(): {
        inner: number;
        outer: number;
    };
    protected computeFocusBounds({ datumIndex, seriesRect }: _ModuleSupport.PickFocusInputs): _Scene.BBox | undefined;
}
export {};
