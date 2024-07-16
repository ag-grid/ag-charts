import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';
import { GeoGeometry } from '../map-util/geoGeometry';
import { MapShapeNodeDatum, MapShapeNodeLabelDatum, MapShapeSeriesProperties } from './mapShapeSeriesProperties';
declare const DataModelSeries: typeof _ModuleSupport.DataModelSeries;
export interface MapShapeNodeDataContext extends _ModuleSupport.SeriesNodeDataContext<MapShapeNodeDatum, MapShapeNodeLabelDatum> {
}
export declare class MapShapeSeries extends DataModelSeries<MapShapeNodeDatum, MapShapeSeriesProperties, MapShapeNodeLabelDatum, MapShapeNodeDataContext> implements _ModuleSupport.TopologySeries {
    static readonly className = "MapShapeSeries";
    static readonly type: "map-shape";
    scale: _ModuleSupport.MercatorScale | undefined;
    topologyBounds: _ModuleSupport.LonLatBBox | undefined;
    properties: MapShapeSeriesProperties;
    private _chartTopology?;
    getNodeData(): MapShapeNodeDatum[] | undefined;
    private get topology();
    get hasData(): boolean;
    private readonly colorScale;
    private itemGroup;
    private itemLabelGroup;
    datumSelection: _Scene.Selection<GeoGeometry, MapShapeNodeDatum>;
    private labelSelection;
    private highlightDatumSelection;
    contextNodeData?: MapShapeNodeDataContext;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    setChartTopology(topology: any): void;
    addChartEventListeners(): void;
    private isLabelEnabled;
    private nodeFactory;
    processData(dataController: _ModuleSupport.DataController): Promise<void>;
    private isColorScaleValid;
    private getLabelLayout;
    private getLabelDatum;
    private previousLabelLayouts;
    createNodeData(): Promise<{
        itemId: string;
        nodeData: MapShapeNodeDatum[];
        labelData: MapShapeNodeLabelDatum[];
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
    getTooltipHtml(nodeDatum: MapShapeNodeDatum): _ModuleSupport.TooltipContent;
    protected computeFocusBounds(opts: _ModuleSupport.PickFocusInputs): _Scene.BBox | undefined;
}
export {};
