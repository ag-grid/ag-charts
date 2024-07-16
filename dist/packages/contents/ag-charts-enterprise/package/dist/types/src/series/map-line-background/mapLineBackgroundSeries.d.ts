import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';
import { MapLineBackgroundNodeDatum, MapLineBackgroundSeriesProperties } from './mapLineBackgroundSeriesProperties';
declare const DataModelSeries: typeof _ModuleSupport.DataModelSeries;
export interface MapLineNodeDataContext extends _ModuleSupport.SeriesNodeDataContext<MapLineBackgroundNodeDatum> {
}
export declare class MapLineBackgroundSeries extends DataModelSeries<MapLineBackgroundNodeDatum, MapLineBackgroundSeriesProperties, MapLineBackgroundNodeDatum, MapLineNodeDataContext> implements _ModuleSupport.TopologySeries {
    static readonly className = "MapLineBackgroundSeries";
    static readonly type: "map-line-background";
    scale: _ModuleSupport.MercatorScale | undefined;
    topologyBounds: _ModuleSupport.LonLatBBox | undefined;
    properties: MapLineBackgroundSeriesProperties;
    private _chartTopology?;
    getNodeData(): MapLineBackgroundNodeDatum[] | undefined;
    private get topology();
    setOptionsData(): void;
    setChartData(): void;
    get hasData(): boolean;
    private itemGroup;
    private datumSelection;
    private contextNodeData?;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    setChartTopology(topology: any): void;
    private nodeFactory;
    processData(): Promise<void>;
    createNodeData(): Promise<{
        itemId: string;
        nodeData: MapLineBackgroundNodeDatum[];
        labelData: never[];
    } | undefined>;
    updateSelections(): Promise<void>;
    update(): Promise<void>;
    private updateDatumSelection;
    private updateDatumNodes;
    resetAnimation(): void;
    getLabelData(): _Util.PointLabelDatum[];
    getSeriesDomain(): number[];
    getLegendData<T extends _ModuleSupport.ChartLegendType>(): _ModuleSupport.ChartLegendDatum<T>[];
    getTooltipHtml(): _ModuleSupport.TooltipContent;
    protected computeFocusBounds(_opts: _ModuleSupport.PickFocusInputs): _Scene.BBox | undefined;
}
export {};
