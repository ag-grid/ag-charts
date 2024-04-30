import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';
import { GeoGeometry } from '../map-util/geoGeometry';
import { MapLineNodeDatum, MapLineNodeLabelDatum, MapLineSeriesProperties } from './mapLineSeriesProperties';
declare const DataModelSeries: typeof _ModuleSupport.DataModelSeries;
export interface MapLineNodeDataContext extends _ModuleSupport.SeriesNodeDataContext<MapLineNodeDatum, MapLineNodeLabelDatum> {
}
export declare class MapLineSeries extends DataModelSeries<MapLineNodeDatum, MapLineSeriesProperties, MapLineNodeLabelDatum, MapLineNodeDataContext> implements _ModuleSupport.TopologySeries {
    static readonly className = "MapLineSeries";
    static readonly type: "map-line";
    scale: _ModuleSupport.MercatorScale | undefined;
    topologyBounds: _ModuleSupport.LonLatBBox | undefined;
    properties: MapLineSeriesProperties;
    private _chartTopology?;
    getNodeData(): MapLineNodeDatum[] | undefined;
    private get topology();
    get hasData(): boolean;
    private readonly colorScale;
    private readonly sizeScale;
    datumSelection: _Scene.Selection<GeoGeometry, MapLineNodeDatum>;
    private labelSelection;
    private highlightDatumSelection;
    contextNodeData?: MapLineNodeDataContext;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    setChartTopology(topology: any): void;
    addChartEventListeners(): void;
    private isLabelEnabled;
    private nodeFactory;
    processData(dataController: _ModuleSupport.DataController): Promise<void>;
    private isColorScaleValid;
    private getLabelDatum;
    createNodeData(): Promise<{
        itemId: string;
        nodeData: MapLineNodeDatum[];
        labelData: MapLineNodeLabelDatum[];
    } | undefined>;
    updateSelections(): Promise<void>;
    update(): Promise<void>;
    private updateDatumSelection;
    private updateDatumNodes;
    private updateLabelSelection;
    private updateLabelNodes;
    onLegendItemClick(event: _ModuleSupport.LegendItemClickChartEvent): void;
    onLegendItemDoubleClick(event: _ModuleSupport.LegendItemDoubleClickChartEvent): void;
    resetAnimation(): void;
    getLabelData(): _Util.PointLabelDatum[];
    getSeriesDomain(): number[];
    pickNodeClosestDatum({ x, y }: _Scene.Point): _ModuleSupport.SeriesNodePickMatch | undefined;
    private _previousDatumMidPoint;
    datumMidPoint(datum: _ModuleSupport.SeriesNodeDatum): _Scene.Point | undefined;
    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] | _ModuleSupport.GradientLegendDatum[];
    getTooltipHtml(nodeDatum: MapLineNodeDatum): _ModuleSupport.TooltipContent;
    protected computeFocusBounds(opts: _ModuleSupport.PickFocusInputs): _Scene.BBox | undefined;
}
export {};
