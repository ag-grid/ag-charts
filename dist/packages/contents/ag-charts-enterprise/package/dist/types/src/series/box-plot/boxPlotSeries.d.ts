import { type AgBoxPlotSeriesStyles, _ModuleSupport, _Scene } from 'ag-charts-community';
import { BoxPlotGroup } from './boxPlotGroup';
import { BoxPlotSeriesProperties } from './boxPlotSeriesProperties';
import type { BoxPlotNodeDatum } from './boxPlotTypes';
declare class BoxPlotSeriesNodeEvent<TEvent extends string = _ModuleSupport.SeriesNodeEventTypes> extends _ModuleSupport.SeriesNodeEvent<BoxPlotNodeDatum, TEvent> {
    readonly xKey?: string;
    readonly minKey?: string;
    readonly q1Key?: string;
    readonly medianKey?: string;
    readonly q3Key?: string;
    readonly maxKey?: string;
    constructor(type: TEvent, nativeEvent: Event, datum: BoxPlotNodeDatum, series: BoxPlotSeries);
}
export declare class BoxPlotSeries extends _ModuleSupport.AbstractBarSeries<BoxPlotGroup, BoxPlotSeriesProperties, BoxPlotNodeDatum> {
    static readonly className = "BoxPlotSeries";
    static readonly type: "box-plot";
    properties: BoxPlotSeriesProperties;
    protected readonly NodeEvent: typeof BoxPlotSeriesNodeEvent;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    processData(dataController: _ModuleSupport.DataController): Promise<void>;
    getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): any[];
    createNodeData(): Promise<{
        itemId: string;
        nodeData: BoxPlotNodeDatum[];
        labelData: never[];
        scales: {
            x?: import("ag-charts-community/dist/types/src/chart/series/cartesian/scaling").Scaling | undefined;
            y?: import("ag-charts-community/dist/types/src/chart/series/cartesian/scaling").Scaling | undefined;
        };
        visible: boolean;
    } | undefined>;
    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[];
    getTooltipHtml(nodeDatum: BoxPlotNodeDatum): _ModuleSupport.TooltipContent;
    protected animateEmptyUpdateReady({ datumSelection, }: _ModuleSupport.CartesianAnimationData<BoxPlotGroup, BoxPlotNodeDatum>): void;
    protected isLabelEnabled(): boolean;
    protected updateDatumSelection(opts: {
        nodeData: BoxPlotNodeDatum[];
        datumSelection: _Scene.Selection<BoxPlotGroup, BoxPlotNodeDatum>;
        seriesIdx: number;
    }): Promise<_Scene.Selection<BoxPlotGroup, BoxPlotNodeDatum>>;
    protected updateDatumNodes({ datumSelection, isHighlight: highlighted, }: {
        datumSelection: _Scene.Selection<BoxPlotGroup, BoxPlotNodeDatum>;
        isHighlight: boolean;
    }): Promise<void>;
    protected updateLabelNodes(_opts: {
        labelSelection: _Scene.Selection<_Scene.Text, BoxPlotNodeDatum>;
        seriesIdx: number;
    }): Promise<void>;
    protected updateLabelSelection(opts: {
        labelData: BoxPlotNodeDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, BoxPlotNodeDatum>;
        seriesIdx: number;
    }): Promise<_Scene.Selection<_Scene.Text, BoxPlotNodeDatum>>;
    protected nodeFactory(): BoxPlotGroup;
    getFormattedStyles(nodeDatum: BoxPlotNodeDatum, highlighted?: boolean): AgBoxPlotSeriesStyles;
    protected computeFocusBounds({ datumIndex, seriesRect }: _ModuleSupport.PickFocusInputs): _Scene.BBox | undefined;
}
export {};
