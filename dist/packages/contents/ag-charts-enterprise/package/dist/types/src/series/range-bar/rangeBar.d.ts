import { _ModuleSupport, _Scene } from 'ag-charts-community';
import { RangeBarProperties } from './rangeBarProperties';
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
    readonly opacity: number;
}
type RangeBarContext = _ModuleSupport.CartesianSeriesNodeDataContext<RangeBarNodeDatum, RangeBarNodeLabelDatum>;
type RangeBarAnimationData = _ModuleSupport.CartesianAnimationData<_Scene.Rect, RangeBarNodeDatum, RangeBarNodeLabelDatum>;
declare class RangeBarSeriesNodeClickEvent<TEvent extends string = _ModuleSupport.SeriesNodeEventTypes> extends _ModuleSupport.SeriesNodeClickEvent<RangeBarNodeDatum, TEvent> {
    readonly xKey?: string;
    readonly yLowKey?: string;
    readonly yHighKey?: string;
    constructor(type: TEvent, nativeEvent: MouseEvent, datum: RangeBarNodeDatum, series: RangeBarSeries);
}
export declare class RangeBarSeries extends _ModuleSupport.AbstractBarSeries<_Scene.Rect, RangeBarNodeDatum, RangeBarNodeLabelDatum> {
    static className: string;
    static type: "range-bar";
    properties: RangeBarProperties;
    protected readonly NodeClickEvent: typeof RangeBarSeriesNodeClickEvent;
    /**
     * Used to get the position of bars within each group.
     */
    private groupScale;
    protected smallestDataInterval?: {
        x: number;
        y: number;
    };
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    protected resolveKeyDirection(direction: _ModuleSupport.ChartAxisDirection): _ModuleSupport.ChartAxisDirection;
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
