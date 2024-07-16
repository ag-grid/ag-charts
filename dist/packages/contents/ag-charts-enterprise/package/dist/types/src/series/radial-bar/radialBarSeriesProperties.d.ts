import type { AgRadialBarSeriesOptions, AgRadialSeriesFormat, AgRadialSeriesFormatterParams, AgRadialSeriesLabelFormatterParams, AgRadialSeriesTooltipRendererParams } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
declare const SeriesProperties: typeof _ModuleSupport.SeriesProperties;
export declare class RadialBarSeriesProperties<T extends AgRadialBarSeriesOptions> extends SeriesProperties<T> {
    angleKey: string;
    radiusKey: string;
    angleName?: string;
    radiusName?: string;
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeWidth: number;
    strokeOpacity: number;
    lineDash: number[];
    lineDashOffset: number;
    cornerRadius: number;
    formatter?: (params: AgRadialSeriesFormatterParams<any>) => AgRadialSeriesFormat;
    rotation: number;
    stackGroup?: string;
    normalizedTo?: number;
    readonly label: _Scene.Label<AgRadialSeriesLabelFormatterParams, any>;
    readonly tooltip: _ModuleSupport.SeriesTooltip<AgRadialSeriesTooltipRendererParams>;
}
export {};
