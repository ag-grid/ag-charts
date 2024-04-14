import type { DirectionType } from '../types/enums';

export interface ChartSeries<T extends string> extends CommonSeriesOptions {
    type: T;
}

export type CartesianChartSeries =
    | ChartSeries<'area'>
    | BarSeriesOptions
    | ChartSeries<'bubble'>
    | ChartSeries<'bullet'>
    | ChartSeries<'line'>
    | ChartSeries<'scatter'>;

export type PolarChartSeries = ChartSeries<'donut'> | ChartSeries<'pie'>;

export type HierarchyChartSeries = ChartSeries<'sunburst'> | ChartSeries<'treemap'>;

export type TopologyChartSeries =
    | ChartSeries<'map-line'>
    | ChartSeries<'map-marker'>
    | ChartSeries<'map-shape'>
    | ChartSeries<'map-line-background'>
    | ChartSeries<'map-shape-background'>;

export interface CommonSeriesOptions {
    visible?: boolean;
    showInLegend?: boolean;
    cursor?: string;
    onNodeClick?: (event: object) => void;
    onNodeDoubleClick?: (event: object) => void;
}

export interface BarSeriesOptions extends ChartSeries<'bar'> {
    xKey: string;
    yKey: string;
    xName?: string;
    yName?: string;
    normalizedTo?: number;
    direction?: `${DirectionType}`;
    grouped?: boolean;
    stacked?: boolean;
    stackGroup?: string;
}
