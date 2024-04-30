import type { IModule } from '../modules/modulesTypes';
import type { Direction } from '../types/enums';

export interface IScale {}

export interface IAxis extends IModule {
    // reverse: boolean;
}

export interface ChartAxisOptions<T extends string> {
    type: T;

    // label?: object;
    // ticks?: object;
    //
    // reverse?: boolean;
    //
    // line?: boolean;
    // lineColor?: CssColor;
    // lineWidth?: PixelSize;
    //
    // gridLines?: boolean;
    // gridLinesStyle?: { color?: CssColor; width?: PixelSize; lineDash?: number[] }[];
}

export enum CartesianCoordinate {
    Horizontal = 'x',
    Vertical = 'y',
}

export interface CartesianAxisOptions<T extends string> extends ChartAxisOptions<T> {
    position: `${Direction}`;
    title?: object;
    keys?: string[];
}

export interface ContinuousCartesianAxisOptions<T extends string> extends CartesianAxisOptions<T> {
    min?: number;
    max?: number;
    nice?: boolean;
}

export type CartesianChartAxes =
    | CartesianAxisOptions<'category'>
    | CartesianAxisOptions<'ordinal-time'>
    | ContinuousCartesianAxisOptions<'log'>
    | ContinuousCartesianAxisOptions<'number'>
    | ContinuousCartesianAxisOptions<'time'>;

export enum PolarCoordinate {
    Radial = 'radius',
    Angular = 'angle',
}

export interface PolarAxisOptions<T extends string> extends ChartAxisOptions<T> {}

export type PolarChartAxes =
    | PolarAxisOptions<'angle-category'>
    | PolarAxisOptions<'angle-number'>
    | PolarAxisOptions<'radius-category'>
    | PolarAxisOptions<'radius-number'>;
