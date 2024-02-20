import type { AgRangeBarSeriesFormat, AgRangeBarSeriesFormatterParams, AgRangeBarSeriesLabelFormatterParams, AgRangeBarSeriesLabelPlacement, AgRangeBarSeriesOptions, AgRangeBarSeriesTooltipRendererParams } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
declare const Label: typeof _Scene.Label;
declare const AbstractBarSeriesProperties: typeof _ModuleSupport.AbstractBarSeriesProperties;
declare class RangeBarSeriesLabel extends Label<AgRangeBarSeriesLabelFormatterParams> {
    placement: AgRangeBarSeriesLabelPlacement;
    padding: number;
}
export declare class RangeBarProperties extends AbstractBarSeriesProperties<AgRangeBarSeriesOptions> {
    xKey: string;
    yLowKey: string;
    yHighKey: string;
    xName?: string;
    yName?: string;
    yLowName?: string;
    yHighName?: string;
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeWidth: number;
    strokeOpacity: number;
    lineDash: number[];
    lineDashOffset: number;
    cornerRadius: number;
    formatter?: (params: AgRangeBarSeriesFormatterParams<any>) => AgRangeBarSeriesFormat;
    readonly shadow: _Scene.DropShadow;
    readonly label: RangeBarSeriesLabel;
    readonly tooltip: _ModuleSupport.SeriesTooltip<AgRangeBarSeriesTooltipRendererParams>;
}
export {};
