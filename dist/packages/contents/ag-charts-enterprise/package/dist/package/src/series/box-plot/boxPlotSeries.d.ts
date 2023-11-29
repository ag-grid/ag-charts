import { type AgBoxPlotSeriesFormatterParams, type AgBoxPlotSeriesStyles, type AgBoxPlotSeriesTooltipRendererParams, _ModuleSupport, _Scene } from 'ag-charts-community';
import { BoxPlotGroup } from './boxPlotGroup';
import type { BoxPlotNodeDatum } from './boxPlotTypes';
declare class BoxPlotSeriesNodeClickEvent<TEvent extends string = _ModuleSupport.SeriesNodeEventTypes> extends _ModuleSupport.SeriesNodeClickEvent<BoxPlotNodeDatum, TEvent> {
    readonly xKey?: string;
    readonly minKey?: string;
    readonly q1Key?: string;
    readonly medianKey?: string;
    readonly q3Key?: string;
    readonly maxKey?: string;
    constructor(type: TEvent, nativeEvent: MouseEvent, datum: BoxPlotNodeDatum, series: BoxPlotSeries);
}
declare class BoxPlotSeriesCap {
    lengthRatio: number;
}
declare class BoxPlotSeriesWhisker {
    stroke?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
    lineDash?: number[];
    lineDashOffset?: number;
}
export declare class BoxPlotSeries extends _ModuleSupport.AbstractBarSeries<BoxPlotGroup, BoxPlotNodeDatum> {
    xKey?: string;
    xName?: string;
    yName?: string;
    minKey?: string;
    minName?: string;
    q1Key?: string;
    q1Name?: string;
    medianKey?: string;
    medianName?: string;
    q3Key?: string;
    q3Name?: string;
    maxKey?: string;
    maxName?: string;
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeWidth: number;
    strokeOpacity: number;
    lineDash: number[];
    lineDashOffset: number;
    formatter?: (params: AgBoxPlotSeriesFormatterParams<unknown>) => AgBoxPlotSeriesStyles;
    protected readonly NodeClickEvent: typeof BoxPlotSeriesNodeClickEvent;
    readonly cap: BoxPlotSeriesCap;
    readonly whisker: BoxPlotSeriesWhisker;
    readonly tooltip: _ModuleSupport.SeriesTooltip<AgBoxPlotSeriesTooltipRendererParams>;
    /**
     * Used to get the position of items within each group.
     */
    private groupScale;
    protected smallestDataInterval?: {
        x: number;
        y: number;
    };
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    processData(dataController: _ModuleSupport.DataController): Promise<void>;
    getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): any[];
    createNodeData(): Promise<{
        itemId: string;
        nodeData: BoxPlotNodeDatum[];
        labelData: never[];
        scales: {
            x?: _ModuleSupport.Scaling | undefined;
            y?: _ModuleSupport.Scaling | undefined;
        };
        visible: boolean;
    }[]>;
    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[];
    getTooltipHtml(nodeDatum: BoxPlotNodeDatum): string;
    protected animateEmptyUpdateReady({ datumSelections, }: _ModuleSupport.CartesianAnimationData<BoxPlotGroup, BoxPlotNodeDatum>): void;
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
    convertValuesToScaleByDefs<T extends string>(defs: [string, _ModuleSupport.ProcessedDataDef[]][], values: Record<T, unknown>): Record<T, number>;
}
export {};
