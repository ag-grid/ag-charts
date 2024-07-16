import { _ModuleSupport, _Util } from 'ag-charts-community';
import { MapShapeBackgroundNodeDatum, MapShapeBackgroundSeriesProperties } from './mapShapeBackgroundSeriesProperties';
declare const Series: typeof _ModuleSupport.Series;
export interface MapShapeBackgroundNodeDataContext extends _ModuleSupport.SeriesNodeDataContext<MapShapeBackgroundNodeDatum> {
}
export declare class MapShapeBackgroundSeries extends Series<MapShapeBackgroundNodeDatum, MapShapeBackgroundSeriesProperties, MapShapeBackgroundNodeDatum, MapShapeBackgroundNodeDataContext> implements _ModuleSupport.TopologySeries {
    static readonly className = "MapShapeBackgroundSeries";
    static readonly type: "map-shape-background";
    scale: _ModuleSupport.MercatorScale | undefined;
    topologyBounds: _ModuleSupport.LonLatBBox | undefined;
    properties: MapShapeBackgroundSeriesProperties;
    private _chartTopology?;
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
        nodeData: MapShapeBackgroundNodeDatum[];
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
    pickFocus(_opts: _ModuleSupport.PickFocusInputs): undefined;
}
export {};
