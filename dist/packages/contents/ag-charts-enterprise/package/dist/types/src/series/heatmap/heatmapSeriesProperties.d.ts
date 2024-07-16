import type { AgHeatmapSeriesFormat, AgHeatmapSeriesFormatterParams, AgHeatmapSeriesLabelFormatterParams, AgHeatmapSeriesOptions, AgHeatmapSeriesTooltipRendererParams, TextAlign, VerticalAlign } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import { AutoSizedLabel } from '../util/labelFormatter';
declare const CartesianSeriesProperties: typeof _ModuleSupport.CartesianSeriesProperties;
export declare class HeatmapSeriesProperties extends CartesianSeriesProperties<AgHeatmapSeriesOptions> {
    title?: string;
    xKey: string;
    yKey: string;
    colorKey?: string;
    xName?: string;
    yName?: string;
    colorName?: string;
    colorRange: string[];
    stroke: string;
    strokeOpacity?: number;
    strokeWidth: number;
    textAlign: TextAlign;
    verticalAlign: VerticalAlign;
    itemPadding: number;
    formatter?: (params: AgHeatmapSeriesFormatterParams<any>) => AgHeatmapSeriesFormat;
    readonly label: AutoSizedLabel<AgHeatmapSeriesLabelFormatterParams>;
    readonly tooltip: _ModuleSupport.SeriesTooltip<AgHeatmapSeriesTooltipRendererParams>;
}
export {};
