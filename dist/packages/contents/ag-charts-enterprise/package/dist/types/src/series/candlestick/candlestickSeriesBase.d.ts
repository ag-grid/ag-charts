import { AgCandlestickSeriesBaseFormatterParams, AgCandlestickSeriesItemOptions, AgCandlestickSeriesItemType, _ModuleSupport, _Scene } from 'ag-charts-community';
import type { CandlestickBaseGroup } from './candlestickGroup';
import type { CandlestickSeriesBaseItems, CandlestickSeriesBaseProperties } from './candlestickSeriesProperties';
import type { CandlestickNodeBaseDatum } from './candlestickTypes';
declare class CandlestickSeriesNodeEvent<TEvent extends string = _ModuleSupport.SeriesNodeEventTypes> extends _ModuleSupport.SeriesNodeEvent<CandlestickNodeBaseDatum, TEvent> {
    readonly xKey?: string;
    readonly openKey?: string;
    readonly closeKey?: string;
    readonly highKey?: string;
    readonly lowKey?: string;
    constructor(type: TEvent, nativeEvent: Event, datum: CandlestickNodeBaseDatum, series: CandlestickSeriesBase<CandlestickBaseGroup<CandlestickNodeBaseDatum, any>, any, any, CandlestickNodeBaseDatum, AgCandlestickSeriesBaseFormatterParams<CandlestickNodeBaseDatum>>);
}
export declare abstract class CandlestickSeriesBase<TItemShapeGroup extends CandlestickBaseGroup<TNodeDatum, TItemOptions>, TItemOptions extends AgCandlestickSeriesItemOptions, TSeriesOptions extends CandlestickSeriesBaseProperties<any, TItemOptions, CandlestickSeriesBaseItems<TItemOptions>, TFormatterParams>, TNodeDatum extends CandlestickNodeBaseDatum, TFormatterParams extends AgCandlestickSeriesBaseFormatterParams<TNodeDatum>> extends _ModuleSupport.AbstractBarSeries<TItemShapeGroup, TSeriesOptions, TNodeDatum> {
    protected readonly NodeEvent: typeof CandlestickSeriesNodeEvent;
    constructor(moduleCtx: _ModuleSupport.ModuleContext, datumAnimationResetFnc: (node: TItemShapeGroup, datum: TNodeDatum) => _ModuleSupport.AnimationValue & Partial<TItemShapeGroup>);
    protected animateEmptyUpdateReady({ datumSelection, }: _ModuleSupport.CartesianAnimationData<TItemShapeGroup, TNodeDatum>): void;
    protected animateWaitingUpdateReady({ datumSelection, }: _ModuleSupport.CartesianAnimationData<TItemShapeGroup, TNodeDatum>): void;
    processData(dataController: _ModuleSupport.DataController): Promise<void>;
    getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): any[];
    createBaseNodeData(): {
        itemId: string;
        nodeData: CandlestickNodeBaseDatum[];
        labelData: never[];
        scales: {
            x?: import("ag-charts-community/dist/types/src/chart/series/cartesian/scaling").Scaling | undefined;
            y?: import("ag-charts-community/dist/types/src/chart/series/cartesian/scaling").Scaling | undefined;
        };
        visible: boolean;
    } | undefined;
    private getSeriesItemType;
    protected getItemConfig(seriesItemType: AgCandlestickSeriesItemType): TItemOptions;
    getLegendData(_legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[];
    getTooltipHtml(nodeDatum: TNodeDatum): _ModuleSupport.TooltipContent;
    protected isVertical(): boolean;
    protected isLabelEnabled(): boolean;
    protected updateDatumSelection(opts: {
        nodeData: TNodeDatum[];
        datumSelection: _Scene.Selection<TItemShapeGroup, TNodeDatum>;
        seriesIdx: number;
    }): Promise<_Scene.Selection<TItemShapeGroup, TNodeDatum>>;
    protected updateDatumNodes({ datumSelection, isHighlight: highlighted, }: {
        datumSelection: _Scene.Selection<TItemShapeGroup, TNodeDatum>;
        isHighlight: boolean;
    }): Promise<void>;
    protected updateLabelNodes(_opts: {
        labelSelection: _Scene.Selection<_Scene.Text, TNodeDatum>;
        seriesIdx: number;
    }): Promise<void>;
    protected updateLabelSelection(opts: {
        labelData: TNodeDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, TNodeDatum>;
        seriesIdx: number;
    }): Promise<_Scene.Selection<_Scene.Text, TNodeDatum>>;
    getFormattedStyles(nodeDatum: TNodeDatum, highlighted?: boolean): TItemOptions;
    protected abstract getFormatterParams(params: AgCandlestickSeriesBaseFormatterParams<TNodeDatum>): TFormatterParams;
    protected abstract getSeriesStyles(_nodeDatum: TNodeDatum): TItemOptions;
    protected abstract getActiveStyles(nodeDatum: TNodeDatum, highlighted: boolean): TItemOptions;
}
export {};
