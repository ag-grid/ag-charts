import type { AgBulletSeriesTooltipRendererParams } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
interface BulletNodeDatum extends _ModuleSupport.CartesianSeriesNodeDatum {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly cumulativeValue: number;
    readonly target?: {
        readonly value: number;
        readonly x1: number;
        readonly y1: number;
        readonly x2: number;
        readonly y2: number;
    };
}
export declare class BulletColorRange {
    color: string;
    stop?: number;
}
type BulletAnimationData = _ModuleSupport.CartesianAnimationData<_Scene.Rect, BulletNodeDatum>;
declare class TargetStyle {
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeWidth: number;
    strokeOpacity: number;
    lineDash: number[];
    lineDashOffset: number;
    lengthRatio: number;
}
declare class BulletScale {
    max?: number;
}
export declare class BulletSeries extends _ModuleSupport.AbstractBarSeries<_Scene.Rect, BulletNodeDatum> {
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeWidth: number;
    strokeOpacity: number;
    lineDash: number[];
    lineDashOffset: number;
    widthRatio: number;
    target: TargetStyle;
    valueKey: string;
    valueName?: string;
    targetKey?: string;
    targetName?: string;
    colorRanges: BulletColorRange[];
    scale: BulletScale;
    tooltip: _ModuleSupport.SeriesTooltip<AgBulletSeriesTooltipRendererParams<any>>;
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
    createNodeData(): Promise<_ModuleSupport.CartesianSeriesNodeDataContext<BulletNodeDatum, BulletNodeDatum>[]>;
    getLegendData(_legendType: _ModuleSupport.ChartLegendType): never[];
    getTooltipHtml(nodeDatum: BulletNodeDatum): string;
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
    protected updateNodes(highlightedItems: BulletNodeDatum[] | undefined, seriesHighlighted: boolean | undefined, anySeriesItemEnabled: boolean): Promise<void>;
    protected updateLabelSelection(opts: {
        labelData: BulletNodeDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, BulletNodeDatum>;
    }): Promise<_Scene.Selection<_Scene.Text, BulletNodeDatum>>;
    protected updateLabelNodes(_opts: {
        labelSelection: _Scene.Selection<_Scene.Text, BulletNodeDatum>;
    }): Promise<void>;
    animateEmptyUpdateReady(data: BulletAnimationData): void;
    animateWaitingUpdateReady(data: BulletAnimationData): void;
}
export {};
