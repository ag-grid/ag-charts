import type { Position } from './commonTypes';

export interface ChartAxisOptions<T extends string> {
    type: T;
}

export interface CartesianAxisOptions<T extends string> extends ChartAxisOptions<T> {
    position: Position;
}

export type CartesianChartAxes =
    | CartesianAxisOptions<'category'>
    | CartesianAxisOptions<'log'>
    | CartesianAxisOptions<'number'>
    | CartesianAxisOptions<'ordinal-time'>
    | CartesianAxisOptions<'time'>;

export type PolarChartAxes =
    | ChartAxisOptions<'angle-category'>
    | ChartAxisOptions<'angle-number'>
    | ChartAxisOptions<'radius-category'>
    | ChartAxisOptions<'radius-number'>;
