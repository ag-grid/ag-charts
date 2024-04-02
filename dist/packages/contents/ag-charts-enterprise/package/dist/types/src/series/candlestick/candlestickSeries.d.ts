import { _ModuleSupport, _Scene } from 'ag-charts-community';
import { ActiveCandlestickGroupStyles, CandlestickGroup } from './candlestickGroup';
import { CandlestickSeriesProperties } from './candlestickSeriesProperties';
import type { CandlestickNodeDatum } from './candlestickTypes';
declare class CandlestickSeriesNodeEvent<TEvent extends string = _ModuleSupport.SeriesNodeEventTypes> extends _ModuleSupport.SeriesNodeEvent<CandlestickNodeDatum, TEvent> {
    readonly xKey?: string;
    readonly openKey?: string;
    readonly closeKey?: string;
    readonly highKey?: string;
    readonly lowKey?: string;
    constructor(type: TEvent, nativeEvent: MouseEvent, datum: CandlestickNodeDatum, series: CandlestickSeries);
}
export declare class CandlestickSeries extends _ModuleSupport.AbstractBarSeries<CandlestickGroup, CandlestickSeriesProperties, CandlestickNodeDatum> {
    static readonly className = "CandleStickSeries";
    static readonly type: "candlestick";
    properties: CandlestickSeriesProperties;
    protected readonly NodeEvent: typeof CandlestickSeriesNodeEvent;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    processData(dataController: _ModuleSupport.DataController): Promise<void>;
    getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): any[];
    createNodeData(): Promise<{
        itemId: string;
        nodeData: CandlestickNodeDatum[];
        labelData: never[];
        scales: {
            x?: import("ag-charts-community/dist/types/src/chart/series/cartesian/scaling").Scaling | undefined;
            y?: import("ag-charts-community/dist/types/src/chart/series/cartesian/scaling").Scaling | undefined;
        };
        visible: boolean;
    }[]>;
    private getSeriesItemType;
    private getItemConfig;
    getLegendData(_legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[];
    getTooltipHtml(nodeDatum: CandlestickNodeDatum): string;
    protected animateEmptyUpdateReady({ datumSelections, }: _ModuleSupport.CartesianAnimationData<CandlestickGroup, CandlestickNodeDatum>): void;
    protected isVertical(): boolean;
    protected isLabelEnabled(): boolean;
    protected updateDatumSelection(opts: {
        nodeData: CandlestickNodeDatum[];
        datumSelection: _Scene.Selection<CandlestickGroup, CandlestickNodeDatum>;
        seriesIdx: number;
    }): Promise<_Scene.Selection<CandlestickGroup, CandlestickNodeDatum>>;
    protected updateDatumNodes({ datumSelection, isHighlight: highlighted, }: {
        datumSelection: _Scene.Selection<CandlestickGroup, CandlestickNodeDatum>;
        isHighlight: boolean;
    }): Promise<void>;
    protected updateLabelNodes(_opts: {
        labelSelection: _Scene.Selection<_Scene.Text, CandlestickNodeDatum>;
        seriesIdx: number;
    }): Promise<void>;
    protected updateLabelSelection(opts: {
        labelData: CandlestickNodeDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, CandlestickNodeDatum>;
        seriesIdx: number;
    }): Promise<_Scene.Selection<_Scene.Text, CandlestickNodeDatum>>;
    protected nodeFactory(): CandlestickGroup;
    getFormattedStyles(nodeDatum: CandlestickNodeDatum, highlighted?: boolean): ActiveCandlestickGroupStyles;
}
export {};
