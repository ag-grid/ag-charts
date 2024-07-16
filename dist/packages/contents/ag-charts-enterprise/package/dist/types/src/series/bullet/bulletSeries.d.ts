import { _ModuleSupport, _Scene } from 'ag-charts-community';
import { BulletSeriesProperties } from './bulletSeriesProperties';
interface BulletNodeDatum extends _ModuleSupport.CartesianSeriesNodeDatum {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly cumulativeValue: number;
    readonly opacity: number;
    readonly clipBBox?: _Scene.BBox;
    readonly target?: {
        readonly value: number;
        readonly x1: number;
        readonly y1: number;
        readonly x2: number;
        readonly y2: number;
    };
}
type BulletAnimationData = _ModuleSupport.CartesianAnimationData<_Scene.Rect, BulletNodeDatum>;
export declare class BulletSeries extends _ModuleSupport.AbstractBarSeries<_Scene.Rect, BulletSeriesProperties, BulletNodeDatum> {
    properties: BulletSeriesProperties;
    private normalizedColorRanges;
    private colorRangesGroup;
    private colorRangesSelection;
    private targetLinesSelection;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    destroy(): void;
    processData(dataController: _ModuleSupport.DataController): Promise<void>;
    getBandScalePadding(): {
        inner: number;
        outer: number;
    };
    private getMaxValue;
    getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): number[] | string[];
    getKeys(direction: _ModuleSupport.ChartAxisDirection): string[];
    createNodeData(): Promise<_ModuleSupport.CartesianSeriesNodeDataContext<BulletNodeDatum, BulletNodeDatum> | undefined>;
    private getColorRanges;
    getLegendData(_legendType: _ModuleSupport.ChartLegendType): never[];
    getTooltipHtml(nodeDatum: BulletNodeDatum): _ModuleSupport.TooltipContent;
    protected isLabelEnabled(): boolean;
    protected nodeFactory(): _Scene.Rect;
    protected updateDatumSelection(opts: {
        nodeData: BulletNodeDatum[];
        datumSelection: _Scene.Selection<_Scene.Rect, BulletNodeDatum>;
    }): Promise<_Scene.Selection<_Scene.Rect, BulletNodeDatum>>;
    protected updateDatumNodes(opts: {
        datumSelection: _Scene.Selection<_Scene.Rect, BulletNodeDatum>;
        isHighlight: boolean;
    }): Promise<void>;
    private updateColorRanges;
    protected updateNodes(highlightedItems: BulletNodeDatum[] | undefined, seriesHighlighted: boolean, anySeriesItemEnabled: boolean): Promise<void>;
    protected updateLabelSelection(opts: {
        labelData: BulletNodeDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, BulletNodeDatum>;
    }): Promise<_Scene.Selection<_Scene.Text, BulletNodeDatum>>;
    protected updateLabelNodes(_opts: {
        labelSelection: _Scene.Selection<_Scene.Text, BulletNodeDatum>;
    }): Promise<void>;
    animateEmptyUpdateReady(data: BulletAnimationData): void;
    animateWaitingUpdateReady(data: BulletAnimationData): void;
    protected computeFocusBounds({ datumIndex, seriesRect }: _ModuleSupport.PickFocusInputs): _Scene.BBox | undefined;
}
export {};
