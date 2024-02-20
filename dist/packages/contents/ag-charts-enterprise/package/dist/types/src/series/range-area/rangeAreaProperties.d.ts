import type { AgRangeAreaSeriesLabelFormatterParams, AgRangeAreaSeriesLabelPlacement, AgRangeAreaSeriesOptions, AgRangeAreaSeriesOptionsKeys, AgRangeAreaSeriesTooltipRendererParams } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
import type { RangeAreaMarkerDatum } from './rangeArea';
declare const Label: typeof _Scene.Label;
declare const CartesianSeriesProperties: typeof _ModuleSupport.CartesianSeriesProperties;
declare class RangeAreaSeriesLabel extends Label<AgRangeAreaSeriesLabelFormatterParams> {
    placement: AgRangeAreaSeriesLabelPlacement;
    padding: number;
}
export declare class RangeAreaProperties extends CartesianSeriesProperties<AgRangeAreaSeriesOptions> {
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
    readonly shadow: _Scene.DropShadow;
    readonly marker: _ModuleSupport.SeriesMarker<AgRangeAreaSeriesOptionsKeys, RangeAreaMarkerDatum>;
    readonly label: RangeAreaSeriesLabel;
    readonly tooltip: _ModuleSupport.SeriesTooltip<AgRangeAreaSeriesTooltipRendererParams>;
    connectMissingData: boolean;
}
export {};
