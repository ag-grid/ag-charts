import { _ModuleSupport, _Scene } from 'ag-charts-community';
import { RangeAreaMarkerDatum, RangeAreaProperties } from './rangeAreaProperties';
type RangeAreaLabelDatum = Readonly<_Scene.Point> & {
    text: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    datum: any;
    itemId?: string;
    series: _ModuleSupport.CartesianSeriesNodeDatum['series'];
};
interface RangeAreaContext extends _ModuleSupport.CartesianSeriesNodeDataContext<RangeAreaMarkerDatum, RangeAreaLabelDatum> {
    fillData: RadarAreaPathDatum;
    strokeData: RadarAreaPathDatum;
}
declare class RangeAreaSeriesNodeEvent<TEvent extends string = _ModuleSupport.SeriesNodeEventTypes> extends _ModuleSupport.SeriesNodeEvent<RangeAreaMarkerDatum, TEvent> {
    readonly xKey?: string;
    readonly yLowKey?: string;
    readonly yHighKey?: string;
    constructor(type: TEvent, nativeEvent: Event, datum: RangeAreaMarkerDatum, series: RangeAreaSeries);
}
type RadarAreaPoint = _ModuleSupport.AreaPathPoint & {
    size: number;
};
type RadarAreaPathDatum = {
    readonly points: RadarAreaPoint[];
    readonly itemId: string;
};
export declare class RangeAreaSeries extends _ModuleSupport.CartesianSeries<_Scene.Group, RangeAreaProperties, RangeAreaMarkerDatum, RangeAreaLabelDatum, RangeAreaContext> {
    static readonly className = "RangeAreaSeries";
    static readonly type: "range-area";
    properties: RangeAreaProperties;
    protected readonly NodeEvent: typeof RangeAreaSeriesNodeEvent;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    processData(dataController: _ModuleSupport.DataController): Promise<void>;
    getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): any[];
    createNodeData(): Promise<RangeAreaContext | undefined>;
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
    getTooltipHtml(nodeDatum: RangeAreaMarkerDatum): _ModuleSupport.TooltipContent;
    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[];
    protected isLabelEnabled(): boolean;
    onDataChange(): void;
    protected nodeFactory(): _Scene.Group;
    animateEmptyUpdateReady(animationData: _ModuleSupport.CartesianAnimationData<_Scene.Group, RangeAreaMarkerDatum, RangeAreaLabelDatum, RangeAreaContext>): void;
    protected animateReadyResize(animationData: _ModuleSupport.CartesianAnimationData<_Scene.Group, RangeAreaMarkerDatum, RangeAreaLabelDatum, RangeAreaContext>): void;
    animateWaitingUpdateReady(animationData: _ModuleSupport.CartesianAnimationData<_Scene.Group, RangeAreaMarkerDatum, RangeAreaLabelDatum, RangeAreaContext>): void;
    getFormattedMarkerStyle(datum: RangeAreaMarkerDatum): import("ag-charts-community").AgSeriesMarkerStyle & {
        size: number;
    };
    protected computeFocusBounds(opts: _ModuleSupport.PickFocusInputs): _Scene.BBox | undefined;
}
export {};
