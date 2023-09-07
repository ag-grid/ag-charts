import type { _ModuleSupport, FillOptions, LineDashOptions, Ratio, StrokeOptions } from 'ag-charts-community';

export interface BoxPlotNodeDatum
    extends Readonly<Required<FillOptions>>,
        Readonly<Required<StrokeOptions>>,
        Readonly<Required<LineDashOptions>>,
        Omit<_ModuleSupport.CartesianSeriesNodeDatum, 'yKey'> {
    readonly xValue: number;
    readonly minValue: number;
    readonly q1Value: number;
    readonly medianValue: number;
    readonly q3Value: number;
    readonly maxValue: number;
    readonly bandwidth: number;

    readonly cap: {
        readonly lengthRatio: Ratio;
    };
    readonly whisker: Readonly<StrokeOptions & LineDashOptions>;
}
