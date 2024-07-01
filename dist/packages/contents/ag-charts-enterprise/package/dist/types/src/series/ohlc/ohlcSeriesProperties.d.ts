import type { AgCandlestickSeriesItemOptions, AgOhlcSeriesItemStylerParams, AgOhlcSeriesOptions, AgOhlcSeriesStyles, Styler } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import { type CandlestickSeriesBaseItems, CandlestickSeriesProperties } from '../candlestick/candlestickSeriesProperties';
declare const BaseProperties: typeof _ModuleSupport.BaseProperties;
export declare class OhlcSeriesItem extends BaseProperties {
    stroke: string;
    strokeWidth: number;
    strokeOpacity: number;
    lineDash: number[];
    lineDashOffset: number;
    itemStyler?: Styler<AgOhlcSeriesItemStylerParams<any>, AgOhlcSeriesStyles>;
}
declare class OhlcSeriesItems extends BaseProperties implements CandlestickSeriesBaseItems<OhlcSeriesItem> {
    readonly up: OhlcSeriesItem;
    readonly down: OhlcSeriesItem;
}
export declare class OhlcSeriesProperties extends CandlestickSeriesProperties<AgOhlcSeriesOptions> {
    readonly item: OhlcSeriesItems;
    itemStyler?: Styler<AgOhlcSeriesItemStylerParams<unknown>, AgCandlestickSeriesItemOptions>;
}
export {};
