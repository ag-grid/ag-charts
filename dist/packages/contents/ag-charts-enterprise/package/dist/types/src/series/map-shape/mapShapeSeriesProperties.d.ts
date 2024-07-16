import type { AgMapShapeSeriesFormatterParams, AgMapShapeSeriesLabelFormatterParams, AgMapShapeSeriesOptions, AgMapShapeSeriesStyle, AgMapShapeSeriesTooltipRendererParams } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import { AutoSizeableSecondaryLabel } from '../util/labelFormatter';
declare const SeriesProperties: typeof _ModuleSupport.SeriesProperties;
export interface MapShapeNodeLabelDatum {
    readonly x: number;
    readonly y: number;
    readonly text: string;
    readonly fontSize: number;
    readonly lineHeight: number;
}
export interface MapShapeNodeDatum extends _ModuleSupport.SeriesNodeDatum {
    readonly idValue: string;
    readonly colorValue: number | undefined;
    readonly labelValue: string | undefined;
    readonly fill: string;
    readonly projectedGeometry: _ModuleSupport.Geometry | undefined;
}
export declare class MapShapeSeriesProperties extends SeriesProperties<AgMapShapeSeriesOptions> {
    topology?: _ModuleSupport.FeatureCollection;
    title?: string;
    legendItemName?: string;
    idKey: string;
    idName: string | undefined;
    topologyIdKey: string;
    labelKey: string | undefined;
    labelName: string | undefined;
    colorKey?: string;
    colorName?: string;
    colorRange: string[] | undefined;
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeOpacity: number;
    strokeWidth: number;
    lineDash: number[];
    lineDashOffset: number;
    padding: number;
    formatter?: (params: AgMapShapeSeriesFormatterParams<any>) => AgMapShapeSeriesStyle;
    readonly label: AutoSizeableSecondaryLabel<AgMapShapeSeriesLabelFormatterParams>;
    readonly tooltip: _ModuleSupport.SeriesTooltip<AgMapShapeSeriesTooltipRendererParams<any>>;
}
export {};
