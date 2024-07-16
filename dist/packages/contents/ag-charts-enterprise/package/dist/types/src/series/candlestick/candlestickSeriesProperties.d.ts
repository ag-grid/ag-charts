import type { AgCandlestickSeriesBaseFormatterParams, AgCandlestickSeriesBaseOptions, AgCandlestickSeriesFormatterParams, AgCandlestickSeriesItemOptions, AgCandlestickSeriesOptions, AgCandlestickSeriesStyles, AgCandlestickSeriesTooltipRendererParams } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type { CandlestickNodeDatum } from './candlestickTypes';
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
declare class CandlestickSeriesItems extends BaseProperties implements CandlestickSeriesBaseItems<CandlestickSeriesItem> {
    readonly up: CandlestickSeriesItem;
    readonly down: CandlestickSeriesItem;
}
export interface CandlestickSeriesBaseItems<T> {
    readonly up: T;
    readonly down: T;
}
export declare class CandlestickSeriesBaseProperties<T extends Omit<AgCandlestickSeriesBaseOptions, 'openKey'>, TItem extends AgCandlestickSeriesItemOptions, TItems extends CandlestickSeriesBaseItems<TItem>, TFormatterParams extends AgCandlestickSeriesBaseFormatterParams<unknown>> extends AbstractBarSeriesProperties<T> {
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
    readonly tooltip: _ModuleSupport.SeriesTooltip<AgCandlestickSeriesTooltipRendererParams>;
    readonly item: TItems;
    formatter?: ((params: TFormatterParams) => AgCandlestickSeriesItemOptions) | undefined;
    constructor(item: TItems, formatter?: (params: TFormatterParams) => AgCandlestickSeriesItemOptions);
}
export declare class CandlestickSeriesProperties extends CandlestickSeriesBaseProperties<AgCandlestickSeriesOptions, AgCandlestickSeriesItemOptions, CandlestickSeriesItems, AgCandlestickSeriesFormatterParams<CandlestickNodeDatum>> {
    openKey: string;
    constructor();
}
export {};
