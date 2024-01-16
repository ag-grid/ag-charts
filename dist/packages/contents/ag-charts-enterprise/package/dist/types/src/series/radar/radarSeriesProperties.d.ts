import type { AgBaseRadarSeriesOptions, AgPieSeriesFormat, AgPieSeriesFormatterParams, AgPieSeriesTooltipRendererParams, AgRadarSeriesLabelFormatterParams, AgRadialSeriesOptionsKeys } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
import type { RadarNodeDatum } from './radarSeries';
declare const SeriesProperties: typeof _ModuleSupport.SeriesProperties;
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
    formatter?: (params: AgPieSeriesFormatterParams<any>) => AgPieSeriesFormat;
    rotation: number;
    readonly marker: _ModuleSupport.SeriesMarker<AgRadialSeriesOptionsKeys, RadarNodeDatum>;
    readonly label: _Scene.Label<AgRadarSeriesLabelFormatterParams, any>;
    readonly tooltip: _ModuleSupport.SeriesTooltip<AgPieSeriesTooltipRendererParams>;
    connectMissingData: boolean;
}
export {};
