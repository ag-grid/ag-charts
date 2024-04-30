import type { AgBoxPlotSeriesFormatterParams, AgBoxPlotSeriesOptions, AgBoxPlotSeriesStyles, AgBoxPlotSeriesTooltipRendererParams } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
declare const BaseProperties: typeof _ModuleSupport.BaseProperties, AbstractBarSeriesProperties: typeof _ModuleSupport.AbstractBarSeriesProperties;
declare class BoxPlotSeriesCap extends BaseProperties {
    lengthRatio: number;
}
declare class BoxPlotSeriesWhisker extends BaseProperties {
    stroke?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
    lineDash?: number[];
    lineDashOffset?: number;
}
export declare class BoxPlotSeriesProperties extends AbstractBarSeriesProperties<AgBoxPlotSeriesOptions> {
    xKey: string;
    minKey: string;
    q1Key: string;
    medianKey: string;
    q3Key: string;
    maxKey: string;
    xName?: string;
    yName?: string;
    minName?: string;
    q1Name?: string;
    medianName?: string;
    q3Name?: string;
    maxName?: string;
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeWidth: number;
    strokeOpacity: number;
    lineDash: number[];
    lineDashOffset: number;
    cornerRadius: number;
    formatter?: (params: AgBoxPlotSeriesFormatterParams<unknown>) => AgBoxPlotSeriesStyles;
    readonly cap: BoxPlotSeriesCap;
    readonly whisker: BoxPlotSeriesWhisker;
    readonly tooltip: _ModuleSupport.SeriesTooltip<AgBoxPlotSeriesTooltipRendererParams>;
    toJson(): AgBoxPlotSeriesOptions<any>;
}
export {};
