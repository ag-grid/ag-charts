import type { IModule } from '../modules/modulesTypes';
import type { IScale } from '../scales/scaleTypes';
import type { Direction } from '../types/enums';
import type { MapTypes } from '../types/generics';

export interface IAxis extends IModule {
    readonly scale: IScale<any, any>;
}

export interface AxisTickOptions {
    enabled?: boolean;
    color?: string;
    width?: number;
    length?: number;
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

export interface CartesianAxisOptions<T extends string> extends ChartAxisOptions<T> {
    position: `${Direction}`;
    title?: object;
    keys?: string[];
}

export interface ContinuousCartesianAxisOptions<T extends string> extends CartesianAxisOptions<T> {
    min?: number;
    max?: number;
    nice?: boolean;
    interval?: number;
    minSpacing?: number;
    maxSpacing?: number;
}

export type CartesianChartAxes =
    | CartesianAxisOptions<'category'>
    | CartesianAxisOptions<'ordinal-time'>
    | ContinuousCartesianAxisOptions<'log'>
    | ContinuousCartesianAxisOptions<'number'>
    | ContinuousCartesianAxisOptions<'time'>;

export interface PolarAxisOptions<T extends string> extends ChartAxisOptions<T> {}

export type PolarChartAxes =
    | PolarAxisOptions<'angle-category'>
    | PolarAxisOptions<'angle-number'>
    | PolarAxisOptions<'radius-category'>
    | PolarAxisOptions<'radius-number'>;

export type ChartAxesMap = MapTypes<CartesianChartAxes> & MapTypes<PolarChartAxes>;
