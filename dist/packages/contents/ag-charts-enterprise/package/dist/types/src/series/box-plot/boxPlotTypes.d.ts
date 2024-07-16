import type { FillOptions, LineDashOptions, Ratio, StrokeOptions, _ModuleSupport } from 'ag-charts-community';
export interface BoxPlotNodeDatum extends Readonly<Required<FillOptions & StrokeOptions & LineDashOptions>>, Omit<_ModuleSupport.CartesianSeriesNodeDatum, 'xValue' | 'yKey' | 'yValue'> {
    readonly bandwidth: number;
    readonly scaledValues: {
        readonly xValue: number;
        readonly minValue: number;
        readonly q1Value: number;
        readonly medianValue: number;
        readonly q3Value: number;
        readonly maxValue: number;
    };
    readonly cap: {
        readonly lengthRatio: Ratio;
    };
    readonly whisker: Readonly<StrokeOptions & LineDashOptions>;
    readonly focusRect: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
