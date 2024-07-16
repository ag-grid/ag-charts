import type { AgWaterfallSeriesItemType } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
import { WaterfallSeriesProperties } from './waterfallSeriesProperties';
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
    readonly opacity: number;
    readonly clipBBox?: _Scene.BBox;
}
interface WaterfallContext extends _ModuleSupport.CartesianSeriesNodeDataContext<WaterfallNodeDatum> {
    pointData?: WaterfallNodePointDatum[];
}
type WaterfallAnimationData = _ModuleSupport.CartesianAnimationData<_Scene.Rect, WaterfallNodeDatum, WaterfallNodeDatum, WaterfallContext>;
export declare class WaterfallSeries extends _ModuleSupport.AbstractBarSeries<_Scene.Rect, WaterfallSeriesProperties, WaterfallNodeDatum, WaterfallNodeDatum, WaterfallContext> {
    static readonly className = "WaterfallSeries";
    static readonly type: "waterfall";
    properties: WaterfallSeriesProperties;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    private seriesItemTypes;
    processData(dataController: _ModuleSupport.DataController): Promise<void>;
    getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): any[];
    createNodeData(): Promise<WaterfallContext | undefined>;
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
    getTooltipHtml(nodeDatum: WaterfallNodeDatum): _ModuleSupport.TooltipContent;
    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[];
    protected toggleSeriesItem(): void;
    animateEmptyUpdateReady({ datumSelection, labelSelection, contextData, paths }: WaterfallAnimationData): void;
    protected animateConnectorLinesHorizontal(lineNode: _Scene.Path, pointData: WaterfallNodePointDatum[]): void;
    protected animateConnectorLinesVertical(lineNode: _Scene.Path, pointData: WaterfallNodePointDatum[]): void;
    animateReadyResize(data: WaterfallAnimationData): void;
    protected updatePaths(opts: {
        seriesHighlighted?: boolean | undefined;
        itemId?: string | undefined;
        contextData: WaterfallContext;
        paths: _Scene.Path[];
        seriesIdx: number;
    }): Promise<void>;
    resetConnectorLinesPath({ contextData, paths }: {
        contextData: WaterfallContext;
        paths: Array<_Scene.Path>;
    }): void;
    protected updateLineNode(lineNode: _Scene.Path): void;
    protected isLabelEnabled(): boolean;
    protected onDataChange(): void;
    protected computeFocusBounds({ datumIndex, seriesRect }: _ModuleSupport.PickFocusInputs): _Scene.BBox | undefined;
}
export {};
