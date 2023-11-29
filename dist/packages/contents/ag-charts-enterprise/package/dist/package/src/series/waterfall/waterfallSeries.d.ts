import type { AgTooltipRendererResult, AgWaterfallSeriesFormat, AgWaterfallSeriesFormatterParams, AgWaterfallSeriesItemType, AgWaterfallSeriesLabelFormatterParams, AgWaterfallSeriesLabelPlacement, AgWaterfallSeriesTooltipRendererParams } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
type WaterfallNodeLabelDatum = Readonly<_Scene.Point> & {
    readonly text: string;
    readonly textAlign: CanvasTextAlign;
    readonly textBaseline: CanvasTextBaseline;
};
type WaterfallNodePointDatum = _ModuleSupport.SeriesNodeDatum['point'] & {
    readonly x2: number;
    readonly y2: number;
};
interface WaterfallNodeDatum extends _ModuleSupport.CartesianSeriesNodeDatum, Readonly<_Scene.Point> {
    readonly index: number;
    readonly itemId: AgWaterfallSeriesItemType;
    readonly cumulativeValue: number;
    readonly width: number;
    readonly height: number;
    readonly label: WaterfallNodeLabelDatum;
    readonly fill: string;
    readonly stroke: string;
    readonly strokeWidth: number;
}
interface WaterfallContext extends _ModuleSupport.CartesianSeriesNodeDataContext<WaterfallNodeDatum> {
    pointData?: WaterfallNodePointDatum[];
}
type WaterfallAnimationData = _ModuleSupport.CartesianAnimationData<_Scene.Rect, WaterfallNodeDatum, WaterfallNodeDatum, WaterfallContext>;
declare class WaterfallSeriesItemTooltip {
    renderer?: (params: AgWaterfallSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
}
declare class WaterfallSeriesLabel extends _Scene.Label<AgWaterfallSeriesLabelFormatterParams> {
    placement: AgWaterfallSeriesLabelPlacement;
    padding: number;
}
declare class WaterfallSeriesItem {
    readonly label: WaterfallSeriesLabel;
    tooltip: WaterfallSeriesItemTooltip;
    formatter?: (params: AgWaterfallSeriesFormatterParams<any>) => AgWaterfallSeriesFormat;
    shadow?: _Scene.DropShadow;
    name?: string;
    fill: string;
    stroke: string;
    fillOpacity: number;
    strokeOpacity: number;
    lineDash?: number[];
    lineDashOffset: number;
    strokeWidth: number;
}
declare class WaterfallSeriesConnectorLine {
    enabled: boolean;
    stroke: string;
    strokeOpacity: number;
    lineDash?: number[];
    lineDashOffset: number;
    strokeWidth: number;
}
declare class WaterfallSeriesItems {
    readonly positive: WaterfallSeriesItem;
    readonly negative: WaterfallSeriesItem;
    readonly total: WaterfallSeriesItem;
}
interface TotalMeta {
    totalType: 'subtotal' | 'total';
    index: number;
    axisLabel: any;
}
export declare class WaterfallSeries extends _ModuleSupport.AbstractBarSeries<_Scene.Rect, WaterfallNodeDatum, WaterfallNodeDatum, WaterfallContext> {
    static className: string;
    static type: "waterfall";
    readonly item: WaterfallSeriesItems;
    readonly line: WaterfallSeriesConnectorLine;
    readonly totals: TotalMeta[];
    tooltip: _ModuleSupport.SeriesTooltip<AgWaterfallSeriesTooltipRendererParams<any>>;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    protected resolveKeyDirection(direction: _ModuleSupport.ChartAxisDirection): _ModuleSupport.ChartAxisDirection;
    xKey?: string;
    xName?: string;
    yKey?: string;
    yName?: string;
    private seriesItemTypes;
    processData(dataController: _ModuleSupport.DataController): Promise<void>;
    getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): any[];
    createNodeData(): Promise<WaterfallContext[]>;
    private updateSeriesItemTypes;
    private isSubtotal;
    private isTotal;
    protected nodeFactory(): _Scene.Rect;
    private getSeriesItemType;
    private getItemConfig;
    protected updateDatumSelection(opts: {
        nodeData: WaterfallNodeDatum[];
        datumSelection: _Scene.Selection<_Scene.Rect, WaterfallNodeDatum>;
    }): Promise<_Scene.Selection<_Scene.Rect, WaterfallNodeDatum>>;
    protected updateDatumNodes(opts: {
        datumSelection: _Scene.Selection<_Scene.Rect, WaterfallNodeDatum>;
        isHighlight: boolean;
    }): Promise<void>;
    protected updateLabelSelection(opts: {
        labelData: WaterfallNodeDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, WaterfallNodeDatum>;
    }): Promise<_Scene.Selection<_Scene.Text, WaterfallNodeDatum>>;
    protected updateLabelNodes(opts: {
        labelSelection: _Scene.Selection<_Scene.Text, WaterfallNodeDatum>;
    }): Promise<void>;
    getTooltipHtml(nodeDatum: WaterfallNodeDatum): string;
    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[];
    protected toggleSeriesItem(): void;
    animateEmptyUpdateReady({ datumSelections, labelSelections, contextData, paths }: WaterfallAnimationData): void;
    protected animateConnectorLinesHorizontal(lineNode: _Scene.Path, pointData: WaterfallNodePointDatum[]): void;
    protected animateConnectorLinesVertical(lineNode: _Scene.Path, pointData: WaterfallNodePointDatum[]): void;
    animateReadyResize(data: WaterfallAnimationData): void;
    resetConnectorLinesPath({ contextData, paths, }: {
        contextData: Array<WaterfallContext>;
        paths: Array<Array<_Scene.Path>>;
    }): void;
    protected updateLineNode(lineNode: _Scene.Path): void;
    protected isLabelEnabled(): boolean;
    protected onDataChange(): void;
}
export {};
