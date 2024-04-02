import { _ModuleSupport } from 'ag-charts-community';
import type { AgCandlestickSeriesFormatterParams, AgCandlestickSeriesOptions, AgCandlestickSeriesStyles, AgCandlestickSeriesTooltipRendererParams } from 'ag-charts-community/src/options/next';
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
    formatter?: (params: AgCandlestickSeriesFormatterParams<any>) => AgCandlestickSeriesStyles;
    readonly wick: CandlestickSeriesWick;
}
declare class CandlestickSeriesItems extends BaseProperties {
    readonly up: CandlestickSeriesItem;
    readonly down: CandlestickSeriesItem;
}
export declare class CandlestickSeriesProperties extends AbstractBarSeriesProperties<AgCandlestickSeriesOptions> {
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
    formatter?: (params: AgCandlestickSeriesFormatterParams<unknown>) => AgCandlestickSeriesStyles;
    readonly item: CandlestickSeriesItems;
    readonly tooltip: _ModuleSupport.SeriesTooltip<AgCandlestickSeriesTooltipRendererParams>;
}
export {};
