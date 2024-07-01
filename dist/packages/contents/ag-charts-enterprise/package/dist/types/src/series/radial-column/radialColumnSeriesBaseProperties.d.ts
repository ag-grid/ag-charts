import type { AgBaseRadialColumnSeriesOptions, AgRadialSeriesItemStylerParams, AgRadialSeriesLabelFormatterParams, AgRadialSeriesStyle, AgRadialSeriesTooltipRendererParams, Styler } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
declare const SeriesProperties: typeof _ModuleSupport.SeriesProperties;
export declare class RadialColumnSeriesBaseProperties<T extends AgBaseRadialColumnSeriesOptions> extends SeriesProperties<T> {
    angleKey: string;
    angleName?: string;
    radiusKey: string;
    radiusName?: string;
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeWidth: number;
    strokeOpacity: number;
    lineDash: number[];
    lineDashOffset: number;
    cornerRadius: number;
    itemStyler?: Styler<AgRadialSeriesItemStylerParams<unknown>, AgRadialSeriesStyle>;
    rotation: number;
    stackGroup?: string;
    normalizedTo?: number;
    readonly label: _Scene.Label<AgRadialSeriesLabelFormatterParams, any>;
    readonly tooltip: _ModuleSupport.SeriesTooltip<AgRadialSeriesTooltipRendererParams<any>>;
}
export {};
