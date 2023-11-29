import type { AgRangeBarSeriesFormat, AgRangeBarSeriesFormatterParams, AgRangeBarSeriesLabelFormatterParams, AgRangeBarSeriesLabelPlacement, AgRangeBarSeriesTooltipRendererParams } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
type RangeBarNodeLabelDatum = Readonly<_Scene.Point> & {
    text: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    datum: any;
    itemId: string;
    series: _ModuleSupport.CartesianSeriesNodeDatum['series'];
};
interface RangeBarNodeDatum extends Omit<_ModuleSupport.CartesianSeriesNodeDatum, 'yKey' | 'yValue'>, Readonly<_Scene.Point> {
    readonly index: number;
    readonly itemId: string;
    readonly yLowKey: string;
    readonly yHighKey: string;
    readonly yLowValue: number;
    readonly yHighValue: number;
    readonly width: number;
    readonly height: number;
    readonly labels: RangeBarNodeLabelDatum[];
    readonly fill: string;
    readonly stroke: string;
    readonly strokeWidth: number;
}
type RangeBarContext = _ModuleSupport.CartesianSeriesNodeDataContext<RangeBarNodeDatum, RangeBarNodeLabelDatum>;
type RangeBarAnimationData = _ModuleSupport.CartesianAnimationData<_Scene.Rect, RangeBarNodeDatum, RangeBarNodeLabelDatum>;
declare class RangeBarSeriesNodeClickEvent<TEvent extends string = _ModuleSupport.SeriesNodeEventTypes> extends _ModuleSupport.SeriesNodeClickEvent<RangeBarNodeDatum, TEvent> {
    readonly xKey?: string;
    readonly yLowKey?: string;
    readonly yHighKey?: string;
    constructor(type: TEvent, nativeEvent: MouseEvent, datum: RangeBarNodeDatum, series: RangeBarSeries);
}
declare class RangeBarSeriesLabel extends _Scene.Label<AgRangeBarSeriesLabelFormatterParams> {
    placement: AgRangeBarSeriesLabelPlacement;
    padding: number;
}
export declare class RangeBarSeries extends _ModuleSupport.AbstractBarSeries<_Scene.Rect, RangeBarNodeDatum, RangeBarNodeLabelDatum> {
    static className: string;
    static type: "range-bar";
    protected readonly NodeClickEvent: typeof RangeBarSeriesNodeClickEvent;
    readonly label: RangeBarSeriesLabel;
    tooltip: _ModuleSupport.SeriesTooltip<AgRangeBarSeriesTooltipRendererParams>;
    formatter?: (params: AgRangeBarSeriesFormatterParams<any>) => AgRangeBarSeriesFormat;
    shadow?: _Scene.DropShadow;
    fill: string;
    stroke: string;
    fillOpacity: number;
    strokeOpacity: number;
    lineDash?: number[];
    lineDashOffset: number;
    strokeWidth: number;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    /**
     * Used to get the position of bars within each group.
     */
    private groupScale;
    protected resolveKeyDirection(direction: _ModuleSupport.ChartAxisDirection): _ModuleSupport.ChartAxisDirection;
    xKey?: string;
    xName?: string;
    yLowKey?: string;
    yLowName?: string;
    yHighKey?: string;
    yHighName?: string;
    yName?: string;
    protected smallestDataInterval?: {
        x: number;
        y: number;
    };
    processData(dataController: _ModuleSupport.DataController): Promise<void>;
    getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): any[];
    createNodeData(): Promise<RangeBarContext[]>;
    private createLabelData;
    protected nodeFactory(): _Scene.Rect;
    protected updateDatumSelection(opts: {
        nodeData: RangeBarNodeDatum[];
        datumSelection: _Scene.Selection<_Scene.Rect, RangeBarNodeDatum>;
    }): Promise<_Scene.Selection<_Scene.Rect, RangeBarNodeDatum>>;
    protected updateDatumNodes(opts: {
        datumSelection: _Scene.Selection<_Scene.Rect, RangeBarNodeDatum>;
        isHighlight: boolean;
    }): Promise<void>;
    protected getHighlightLabelData(labelData: RangeBarNodeLabelDatum[], highlightedItem: RangeBarNodeDatum): RangeBarNodeLabelDatum[] | undefined;
    protected updateLabelSelection(opts: {
        labelData: RangeBarNodeLabelDatum[];
        labelSelection: RangeBarAnimationData['labelSelections'][number];
    }): Promise<_Scene.Selection<_Scene.Text, RangeBarNodeLabelDatum>>;
    protected updateLabelNodes(opts: {
        labelSelection: _Scene.Selection<_Scene.Text, any>;
    }): Promise<void>;
    getTooltipHtml(nodeDatum: RangeBarNodeDatum): string;
    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[];
    animateEmptyUpdateReady({ datumSelections, labelSelections }: RangeBarAnimationData): void;
    animateWaitingUpdateReady(data: RangeBarAnimationData): void;
    private getDatumId;
    protected isLabelEnabled(): boolean;
    protected onDataChange(): void;
}
export {};
