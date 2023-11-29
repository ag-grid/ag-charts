import type { AgRangeAreaSeriesLabelFormatterParams, AgRangeAreaSeriesLabelPlacement, AgRangeAreaSeriesOptionsKeys, AgRangeAreaSeriesTooltipRendererParams } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
type RangeAreaLabelDatum = Readonly<_Scene.Point> & {
    text: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    datum: any;
    itemId?: string;
    series: _ModuleSupport.CartesianSeriesNodeDatum['series'];
};
interface RangeAreaMarkerDatum extends Required<Omit<_ModuleSupport.CartesianSeriesNodeDatum, 'yKey' | 'yValue'>> {
    readonly index: number;
    readonly yLowKey: string;
    readonly yHighKey: string;
    readonly yLowValue: number;
    readonly yHighValue: number;
}
interface RangeAreaContext extends _ModuleSupport.CartesianSeriesNodeDataContext<RangeAreaMarkerDatum, RangeAreaLabelDatum> {
    fillData: RadarAreaPathDatum;
    strokeData: RadarAreaPathDatum;
}
declare class RangeAreaSeriesNodeClickEvent<TEvent extends string = _ModuleSupport.SeriesNodeEventTypes> extends _ModuleSupport.SeriesNodeClickEvent<RangeAreaMarkerDatum, TEvent> {
    readonly xKey?: string;
    readonly yLowKey?: string;
    readonly yHighKey?: string;
    constructor(type: TEvent, nativeEvent: MouseEvent, datum: RangeAreaMarkerDatum, series: RangeAreaSeries);
}
declare class RangeAreaSeriesLabel extends _Scene.Label<AgRangeAreaSeriesLabelFormatterParams> {
    placement: AgRangeAreaSeriesLabelPlacement;
    padding: number;
}
type RadarAreaPoint = _ModuleSupport.AreaPathPoint & {
    size: number;
};
type RadarAreaPathDatum = {
    readonly points: RadarAreaPoint[];
    readonly itemId: string;
};
export declare class RangeAreaSeries extends _ModuleSupport.CartesianSeries<_Scene.Group, RangeAreaMarkerDatum, RangeAreaLabelDatum, RangeAreaContext> {
    static className: string;
    static type: "range-area";
    protected readonly NodeClickEvent: typeof RangeAreaSeriesNodeClickEvent;
    readonly marker: _ModuleSupport.SeriesMarker<AgRangeAreaSeriesOptionsKeys, RangeAreaMarkerDatum>;
    readonly label: RangeAreaSeriesLabel;
    tooltip: _ModuleSupport.SeriesTooltip<AgRangeAreaSeriesTooltipRendererParams>;
    shadow?: _Scene.DropShadow;
    fill: string;
    stroke: string;
    fillOpacity: number;
    strokeOpacity: number;
    lineDash?: number[];
    lineDashOffset: number;
    strokeWidth: number;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    xKey?: string;
    xName?: string;
    yLowKey?: string;
    yLowName?: string;
    yHighKey?: string;
    yHighName?: string;
    yName?: string;
    processData(dataController: _ModuleSupport.DataController): Promise<void>;
    getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): any[];
    createNodeData(): Promise<RangeAreaContext[]>;
    private createLabelData;
    protected isPathOrSelectionDirty(): boolean;
    protected markerFactory(): _Scene.Marker;
    protected updatePathNodes(opts: {
        paths: _Scene.Path[];
        opacity: number;
        visible: boolean;
    }): Promise<void>;
    protected updatePaths(opts: {
        contextData: RangeAreaContext;
        paths: _Scene.Path[];
    }): Promise<void>;
    private updateAreaPaths;
    private updateFillPath;
    private updateStrokePath;
    protected updateMarkerSelection(opts: {
        nodeData: RangeAreaMarkerDatum[];
        markerSelection: _Scene.Selection<_Scene.Marker, RangeAreaMarkerDatum>;
    }): Promise<_Scene.Selection<_Scene.Marker, RangeAreaMarkerDatum>>;
    protected updateMarkerNodes(opts: {
        markerSelection: _Scene.Selection<_Scene.Marker, RangeAreaMarkerDatum>;
        isHighlight: boolean;
    }): Promise<void>;
    protected updateLabelSelection(opts: {
        labelData: RangeAreaLabelDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, RangeAreaLabelDatum>;
    }): Promise<_Scene.Selection<_Scene.Text, RangeAreaLabelDatum>>;
    protected updateLabelNodes(opts: {
        labelSelection: _Scene.Selection<_Scene.Text, RangeAreaLabelDatum>;
    }): Promise<void>;
    protected getHighlightLabelData(labelData: RangeAreaLabelDatum[], highlightedItem: RangeAreaMarkerDatum): RangeAreaLabelDatum[] | undefined;
    protected getHighlightData(nodeData: RangeAreaMarkerDatum[], highlightedItem: RangeAreaMarkerDatum): RangeAreaMarkerDatum[] | undefined;
    getTooltipHtml(nodeDatum: RangeAreaMarkerDatum): string;
    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[];
    protected isLabelEnabled(): boolean;
    onDataChange(): void;
    protected nodeFactory(): _Scene.Group;
    animateEmptyUpdateReady(animationData: _ModuleSupport.CartesianAnimationData<_Scene.Group, RangeAreaMarkerDatum, RangeAreaLabelDatum, RangeAreaContext>): void;
    protected animateReadyResize(animationData: _ModuleSupport.CartesianAnimationData<_Scene.Group, RangeAreaMarkerDatum, RangeAreaLabelDatum, RangeAreaContext>): void;
    animateWaitingUpdateReady(animationData: _ModuleSupport.CartesianAnimationData<_Scene.Group, RangeAreaMarkerDatum, RangeAreaLabelDatum, RangeAreaContext>): void;
}
export {};
