import type { EventEmitter } from '../util/eventEmitter';
import type { StageQueue } from '../util/stageQueue';
import type { ChartOptions } from './chartOptions';

/**
 * Split options API navigation into sections:
 * - Common options
 * - Per chart type
 * - Modules config
 */

export enum ChartType {
    Cartesian,
    Polar,
    Hierarchy,
    Topology,
}

export interface IChart<T extends object = any> {
    events: EventEmitter<ChartEventMap>;
    options: ChartOptions<T>;
    scene: IScene;
    stageQueue: StageQueue;
    setOptions(options: ChartOptions<T>): void;
    remove(): void;
}

export interface ChartEventMap<T extends object = any> {
    change: ChartOptions<T>;
}

export interface IScene {
    readonly canvas: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
    readonly events: EventEmitter<SceneEventMap>;
    readonly rootElement: HTMLDivElement;
    readonly rootNode: object;

    resize(width: number, height: number): void;
    update(): void;
}

export interface SceneEventMap {
    resize: { width: number; height: number };
    update: {};
}

export interface IModule {}

export interface ISeries extends IModule {}

export interface IAxis extends IModule {}

export type AgChartOptions = CartesianChartOptions | PolarChartOptions;

export interface ChartSeries<T extends string> {
    type: T;
    visible?: boolean;
}

export interface ChartAxis<T extends string> {
    type: T;
    visible?: boolean;
}

export type CartesianChartAxes = ChartAxis<'category'> | ChartAxis<'number'>;
export type CartesianChartSeries =
    | ChartSeries<'area'>
    | ChartSeries<'bar'>
    | ChartSeries<'bullet'>
    | ChartSeries<'column'>
    | ChartSeries<'line'>;

export type PolarChartAxes = ChartAxis<'angle-category'> | ChartAxis<'angle-number'>;
export type PolarChartSeries = ChartSeries<'donut'> | ChartSeries<'pie'>;

export type Padding = { top?: number; right?: number; bottom?: number; left?: number };

export interface CaptionOptions {
    enabled?: boolean;
    text?: string;
}

export interface SeriesAreaOptions {
    clip?: boolean;
    padding?: Padding;
}

export interface CommonChartOptions {
    container: HTMLElement;
    data: any;

    theme?: string | object;

    width?: number;
    height?: number;

    padding?: Padding;
    seriesArea?: SeriesAreaOptions;

    title?: CaptionOptions;
    subtitle?: CaptionOptions;
    footnote?: CaptionOptions;

    axes?: object[];
    series: object[];
}

export interface CartesianChartOptions extends CommonChartOptions {
    data: object[];
    axes?: CartesianChartAxes[];
    series: Exclude<CartesianChartSeries, ChartSeries<'bullet'>>[] | [ChartSeries<'bullet'>];
}

export interface PolarChartOptions extends CommonChartOptions {
    data: object[];
    axes?: PolarChartAxes[];
    series: PolarChartSeries[];
}
