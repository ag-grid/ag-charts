import type { AgBaseRadarSeriesOptions, AgRadarSeriesItemStylerParams, AgRadarSeriesLabelFormatterParams, AgRadarSeriesTooltipRendererParams, AgRadialSeriesOptionsKeys, FillOptions, StrokeOptions, Styler } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
export interface RadarNodeDatum extends _ModuleSupport.SeriesNodeDatum {
    readonly label?: {
        text: string;
        x: number;
        y: number;
        textAlign: CanvasTextAlign;
        textBaseline: CanvasTextBaseline;
    };
    readonly point: Readonly<_Scene.SizedPoint>;
    readonly angleValue: any;
    readonly radiusValue: any;
}
declare const SeriesProperties: typeof _ModuleSupport.SeriesProperties;
export type AgRadarSeriesFormat = FillOptions & StrokeOptions;
export declare class RadarSeriesProperties<T extends AgBaseRadarSeriesOptions> extends SeriesProperties<T> {
    angleKey: string;
    radiusKey: string;
    angleName?: string;
    radiusName?: string;
    stroke: string;
    strokeWidth: number;
    strokeOpacity: number;
    lineDash: number[];
    lineDashOffset: number;
    itemStyler?: Styler<AgRadarSeriesItemStylerParams<unknown>, AgRadarSeriesFormat>;
    rotation: number;
    readonly marker: _ModuleSupport.SeriesMarker<AgRadialSeriesOptionsKeys>;
    readonly label: _Scene.Label<AgRadarSeriesLabelFormatterParams, any>;
    readonly tooltip: _ModuleSupport.SeriesTooltip<AgRadarSeriesTooltipRendererParams<any>>;
    connectMissingData: boolean;
}
export {};
