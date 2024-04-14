import type { IModule } from '../modules/modulesTypes';
import type { Direction } from '../types/enums';

export interface IAxis extends IModule {}
export interface IScale {}

export interface ChartAxisOptions<T extends string> {
    type: T;
}

export enum CartesianCoordinate {
    Horizontal = 'x',
    Vertical = 'y',
}

export interface CartesianAxisOptions<T extends string> extends ChartAxisOptions<T> {
    position: `${Direction}`;
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
