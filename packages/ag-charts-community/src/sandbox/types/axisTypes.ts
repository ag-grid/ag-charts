import type { Position } from './enums';

export interface ChartAxisOptions<T extends string> {
    type: T;
}

export enum CartesianCoordinate {
    Horizontal = 'x',
    Vertical = 'y',
}

export interface CartesianAxisOptions<T extends string> extends ChartAxisOptions<T> {
    position: `${Position}`;
}

export type CartesianChartAxes =
    | CartesianAxisOptions<'category'>
    | CartesianAxisOptions<'log'>
    | CartesianAxisOptions<'number'>
    | CartesianAxisOptions<'ordinal-time'>
    | CartesianAxisOptions<'time'>;

export enum PolarCoordinate {
    Radial = 'radius',
    Angular = 'angle',
}

export type PolarChartAxes =
    | ChartAxisOptions<'angle-category'>
    | ChartAxisOptions<'angle-number'>
    | ChartAxisOptions<'radius-category'>
    | ChartAxisOptions<'radius-number'>;
