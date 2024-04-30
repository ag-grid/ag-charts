import type { AgBarSeriesStyle, AgCandlestickSeriesItemType, LineDashOptions, StrokeOptions, _ModuleSupport } from 'ag-charts-community';
export interface CandlestickNodeDatum extends CandlestickNodeBaseDatum, Readonly<AgBarSeriesStyle> {
    readonly wick?: StrokeOptions & LineDashOptions;
}
export interface CandlestickNodeBaseDatum extends Omit<_ModuleSupport.CartesianSeriesNodeDatum, 'yKey' | 'yValue'> {
    readonly itemId: AgCandlestickSeriesItemType;
    readonly bandwidth: number;
    readonly openKey?: string;
    readonly closeKey?: string;
    readonly highKey?: string;
    readonly lowKey?: string;
    readonly openValue: number;
    readonly closeValue: number;
    readonly highValue?: number;
    readonly lowValue?: number;
    readonly aggregatedValue: number;
    readonly scaledValues: {
        readonly xValue: number;
        readonly openValue: number;
        readonly closeValue: number;
        readonly highValue: number;
        readonly lowValue: number;
    };
}
