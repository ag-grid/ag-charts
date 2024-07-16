import type { AgMapShapeBackgroundOptions } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
declare const SeriesProperties: typeof _ModuleSupport.SeriesProperties;
export interface MapShapeBackgroundNodeDatum extends _ModuleSupport.SeriesNodeDatum {
    readonly index: number;
    readonly projectedGeometry: _ModuleSupport.Geometry;
}
export declare class MapShapeBackgroundSeriesProperties extends SeriesProperties<AgMapShapeBackgroundOptions> {
    topology?: _ModuleSupport.FeatureCollection;
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeOpacity: number;
    strokeWidth: number;
    lineDash: number[];
    lineDashOffset: number;
    readonly tooltip: _ModuleSupport.SeriesTooltip<never>;
}
export {};
