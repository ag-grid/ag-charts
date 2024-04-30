import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';
import { MapMarkerNodeDatum, MapMarkerNodeLabelDatum, MapMarkerSeriesProperties } from './mapMarkerSeriesProperties';
declare const DataModelSeries: typeof _ModuleSupport.DataModelSeries;
export interface MapMarkerNodeDataContext extends _ModuleSupport.SeriesNodeDataContext<MapMarkerNodeDatum, MapMarkerNodeLabelDatum> {
}
export declare class MapMarkerSeries extends DataModelSeries<MapMarkerNodeDatum, MapMarkerSeriesProperties, MapMarkerNodeLabelDatum, MapMarkerNodeDataContext> implements _ModuleSupport.TopologySeries {
    static readonly className = "MapMarkerSeries";
    static readonly type: "map-marker";
    scale: _ModuleSupport.MercatorScale | undefined;
    topologyBounds: _ModuleSupport.LonLatBBox | undefined;
    properties: MapMarkerSeriesProperties;
    private _chartTopology?;
    getNodeData(): MapMarkerNodeDatum[] | undefined;
    private get topology();
    get hasData(): boolean;
    private readonly colorScale;
    private readonly sizeScale;
    private markerGroup;
    private labelSelection;
    private markerSelection;
    private highlightMarkerSelection;
    private contextNodeData?;
    private animationState;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    setChartTopology(topology: any): void;
    addChartEventListeners(): void;
    private isLabelEnabled;
    private markerFactory;
    processData(dataController: _ModuleSupport.DataController): Promise<void>;
    private isColorScaleValid;
    private getLabelDatum;
    createNodeData(): Promise<{
        itemId: string;
        nodeData: MapMarkerNodeDatum[];
        labelData: MapMarkerNodeLabelDatum[];
    } | undefined>;
    updateSelections(): Promise<void>;
    update({ seriesRect }: {
        seriesRect?: _Scene.BBox;
    }): Promise<void>;
    private updateLabelSelection;
    private updateLabelNodes;
    private updateMarkerSelection;
    private updateMarkerNodes;
    onLegendItemClick(event: _ModuleSupport.LegendItemClickChartEvent): void;
    onLegendItemDoubleClick(event: _ModuleSupport.LegendItemDoubleClickChartEvent): void;
    isProcessedDataAnimatable(): boolean;
    resetAnimation(phase: _ModuleSupport.ChartAnimationPhase): void;
    private resetAllAnimation;
    private animateMarkers;
    getLabelData(): _Util.PointLabelDatum[];
    getSeriesDomain(): number[];
    pickNodeClosestDatum(p: _Scene.Point): _ModuleSupport.SeriesNodePickMatch | undefined;
    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] | _ModuleSupport.GradientLegendDatum[];
    getTooltipHtml(nodeDatum: MapMarkerNodeDatum): _ModuleSupport.TooltipContent;
    getFormattedMarkerStyle(markerDatum: MapMarkerNodeDatum): {
        size: number;
    };
    protected computeFocusBounds(opts: _ModuleSupport.PickFocusInputs): _Scene.BBox | undefined;
}
export {};
