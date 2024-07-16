import type { AgOhlcSeriesFormatterParams, AgOhlcSeriesItemOptions, AgOhlcSeriesOptions, AgOhlcSeriesStyles } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import { CandlestickSeriesBaseItems, CandlestickSeriesBaseProperties } from '../candlestick/candlestickSeriesProperties';
import type { OhlcNodeDatum } from './ohlcTypes';
declare const BaseProperties: typeof _ModuleSupport.BaseProperties;
export declare class OhlcSeriesItem extends BaseProperties {
    stroke: string;
    strokeWidth: number;
    strokeOpacity: number;
    lineDash: number[];
    lineDashOffset: number;
    formatter?: (params: AgOhlcSeriesFormatterParams<any>) => AgOhlcSeriesStyles;
}
declare class OhlcSeriesItems extends BaseProperties implements CandlestickSeriesBaseItems<OhlcSeriesItem> {
    readonly up: OhlcSeriesItem;
    readonly down: OhlcSeriesItem;
}
export declare class OhlcSeriesProperties extends CandlestickSeriesBaseProperties<AgOhlcSeriesOptions, AgOhlcSeriesItemOptions, OhlcSeriesItems, AgOhlcSeriesFormatterParams<OhlcNodeDatum>> {
    constructor();
}
export {};
