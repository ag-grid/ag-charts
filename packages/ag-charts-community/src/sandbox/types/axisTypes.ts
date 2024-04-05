export interface ChartAxis<T extends string> {
    type: T;
}

export type CartesianChartAxes =
    | ChartAxis<'category'>
    | ChartAxis<'log'>
    | ChartAxis<'number'>
    | ChartAxis<'ordinal-time'>
    | ChartAxis<'time'>;

export type PolarChartAxes =
    | ChartAxis<'angle-category'>
    | ChartAxis<'angle-number'>
    | ChartAxis<'radius-category'>
    | ChartAxis<'radius-number'>;
