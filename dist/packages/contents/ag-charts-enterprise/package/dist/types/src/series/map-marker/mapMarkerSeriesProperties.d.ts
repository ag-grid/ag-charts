import type { AgMapMarkerSeriesFormatterParams, AgMapMarkerSeriesLabelFormatterParams, AgMapMarkerSeriesOptions, AgMapMarkerSeriesStyle, AgMapMarkerSeriesTooltipRendererParams } from 'ag-charts-community';
import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';
declare const SeriesProperties: typeof _ModuleSupport.SeriesProperties;
declare const Label: typeof _Scene.Label;
export interface MapMarkerNodeLabelDatum extends _Util.PointLabelDatum {
}
export interface MapMarkerNodeDatum extends _ModuleSupport.SeriesNodeDatum {
    readonly index: number;
    readonly fill: string | undefined;
    readonly idValue: string | undefined;
    readonly lonValue: number | undefined;
    readonly latValue: number | undefined;
    readonly labelValue: string | undefined;
    readonly colorValue: number | undefined;
    readonly sizeValue: number | undefined;
    readonly point: Readonly<_Scene.SizedPoint>;
}
declare class MapMarkerSeriesLabel extends Label<AgMapMarkerSeriesLabelFormatterParams> {
    placement: _Util.LabelPlacement;
}
export declare class MapMarkerSeriesProperties extends SeriesProperties<AgMapMarkerSeriesOptions> {
    isValid(): boolean;
    topology: _ModuleSupport.FeatureCollection | undefined;
    title?: string;
    legendItemName?: string;
    idKey: string | undefined;
    topologyIdKey: string;
    idName: string | undefined;
    latitudeKey: string | undefined;
    latitudeName: string | undefined;
    longitudeKey: string | undefined;
    longitudeName: string | undefined;
    labelKey: string | undefined;
    labelName: string | undefined;
    sizeKey?: string;
    sizeName?: string;
    colorKey?: string;
    colorName?: string;
    colorRange: string[] | undefined;
    /** One of the predefined marker names, or a marker constructor function (for user-defined markers). */
    shape: _Scene.MarkerShape;
    size: number;
    maxSize: number | undefined;
    sizeDomain?: [number, number];
    fill?: string;
    fillOpacity: number;
    stroke?: string;
    strokeWidth: number;
    strokeOpacity: number;
    formatter?: (params: AgMapMarkerSeriesFormatterParams<any>) => AgMapMarkerSeriesStyle;
    readonly label: MapMarkerSeriesLabel;
    readonly tooltip: _ModuleSupport.SeriesTooltip<AgMapMarkerSeriesTooltipRendererParams<any>>;
}
export {};
