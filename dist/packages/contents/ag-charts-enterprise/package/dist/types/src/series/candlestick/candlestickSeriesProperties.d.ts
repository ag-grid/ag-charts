import type { AgCandlestickSeriesItemOptions, AgCandlestickSeriesItemStylerParams, AgCandlestickSeriesTooltipRendererParams, AgOhlcSeriesBaseOptions, Styler } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
declare const BaseProperties: typeof _ModuleSupport.BaseProperties, AbstractBarSeriesProperties: typeof _ModuleSupport.AbstractBarSeriesProperties;
declare class CandlestickSeriesWick extends BaseProperties {
    stroke?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
    lineDash?: number[];
    lineDashOffset?: number;
}
export declare class CandlestickSeriesItem extends BaseProperties {
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeWidth: number;
    strokeOpacity: number;
    lineDash: number[];
    lineDashOffset: number;
    cornerRadius: number;
    readonly wick: CandlestickSeriesWick;
}
export interface CandlestickSeriesBaseItems<T> {
    readonly up: T;
    readonly down: T;
}
export declare class CandlestickSeriesProperties<T extends AgOhlcSeriesBaseOptions> extends AbstractBarSeriesProperties<T> {
    xKey: string;
    openKey: string;
    closeKey: string;
    highKey: string;
    lowKey: string;
    xName?: string;
    yName?: string;
    openName?: string;
    closeName?: string;
    highName?: string;
    lowName?: string;
    readonly tooltip: _ModuleSupport.SeriesTooltip<AgCandlestickSeriesTooltipRendererParams<any>>;
    readonly item: CandlestickSeriesBaseItems<any>;
    itemStyler?: Styler<AgCandlestickSeriesItemStylerParams<unknown>, AgCandlestickSeriesItemOptions>;
}
export {};
