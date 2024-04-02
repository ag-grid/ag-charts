import type { AgMapLineSeriesFormatterParams, AgMapLineSeriesLabelFormatterParams, AgMapLineSeriesOptions, AgMapLineSeriesStyle, AgMapLineSeriesTooltipRendererParams } from 'ag-charts-community';
import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';
declare const SeriesProperties: typeof _ModuleSupport.SeriesProperties;
export interface MapLineNodeLabelDatum extends _Util.PointLabelDatum {
}
export interface MapLineNodeDatum extends _ModuleSupport.SeriesNodeDatum {
    readonly stroke: string | undefined;
    readonly strokeWidth: number | undefined;
    readonly idValue: string;
    readonly labelValue: string | undefined;
    readonly colorValue: number | undefined;
    readonly sizeValue: number | undefined;
    readonly projectedGeometry: _ModuleSupport.Geometry | undefined;
}
export declare class MapLineSeriesProperties extends SeriesProperties<AgMapLineSeriesOptions> {
    topology?: _ModuleSupport.FeatureCollection;
    title?: string;
    legendItemName?: string;
    idKey: string;
    topologyIdKey: string;
    idName?: string;
    labelKey?: string;
    labelName?: string;
    sizeKey?: string;
    sizeName?: string;
    colorKey?: string;
    colorName?: string;
    sizeDomain?: [number, number];
    colorRange: string[] | undefined;
    maxStrokeWidth?: number;
    stroke: string;
    strokeOpacity: number;
    strokeWidth: number;
    lineDash: number[];
    lineDashOffset: number;
    formatter?: (params: AgMapLineSeriesFormatterParams<any>) => AgMapLineSeriesStyle;
    readonly label: _Scene.Label<AgMapLineSeriesLabelFormatterParams, any>;
    readonly tooltip: _ModuleSupport.SeriesTooltip<AgMapLineSeriesTooltipRendererParams<any>>;
}
export {};
