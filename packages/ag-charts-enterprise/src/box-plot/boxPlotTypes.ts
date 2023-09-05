import type { _ModuleSupport } from 'ag-charts-community';
export interface BoxPlotNodeDatum extends _ModuleSupport.CartesianSeriesNodeDatum {
    readonly bandwidth: number;

    readonly xValue: number;
    readonly minValue: number;
    readonly q1Value: number;
    readonly medianValue: number;
    readonly q3Value: number;
    readonly maxValue: number;

    readonly fill: string;
    readonly fillOpacity: number;
    readonly stroke: string;
    readonly strokeWidth: number;
    readonly strokeOpacity: number;
    readonly lineDash: number[];
    readonly lineDashOffset: number;
}
