import type { FillOptions, LineDashOptions, StrokeOptions, _ModuleSupport } from 'ag-charts-community';

export interface CandlestickNodeDatum
    extends Readonly<Required<FillOptions & StrokeOptions & LineDashOptions>>,
        Omit<_ModuleSupport.CartesianSeriesNodeDatum, 'yKey' | 'yValue'> {
    readonly bandwidth: number;
    readonly openKey?: string;
    readonly closeKey?: string;
    readonly highKey?: string;
    readonly lowKey?: string;

    readonly scaledValues: {
        readonly xValue: number;
        readonly openValue: number;
        readonly closeValue: number;
        readonly highValue: number;
        readonly lowValue: number;
    };

    readonly wick: Readonly<StrokeOptions & LineDashOptions>;
}
