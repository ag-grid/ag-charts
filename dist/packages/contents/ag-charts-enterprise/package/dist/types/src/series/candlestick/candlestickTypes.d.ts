import type { AgBarSeriesStyle, LineDashOptions, StrokeOptions, _ModuleSupport } from 'ag-charts-community';
export interface CandlestickNodeDatum extends Readonly<Required<AgBarSeriesStyle>>, Omit<_ModuleSupport.CartesianSeriesNodeDatum, 'yKey' | 'yValue'> {
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
    readonly wick: Readonly<StrokeOptions & LineDashOptions>;
}
