import type { AgChartCaptionOptions, PixelSize } from 'ag-charts-types';

import type { EventEmitter } from '../../util/eventEmitter';
import { AxesCoordinator } from '../axes/axesCoordinator';
import type { CartesianChartAxes, PolarChartAxes } from '../axes/axesTypes';
import type { IStage } from '../drawing/drawingTypes';
import type {
    CartesianChartSeries,
    HierarchyChartSeries,
    PolarChartSeries,
    TopologyChartSeries,
} from '../series/seriesTypes';
import type { DirectionMetrics } from '../types/commonTypes';
import type { ChartType } from '../types/enums';
import type { PipelineQueue } from '../util/pipelineQueue';

export interface IChartOptions<T extends AgChartOptions> {
    fullOptions: T;
    userOptions: Partial<T>;
    lastOptions?: IChartOptions<T>;
    optionsDiff: Partial<T> | null;
    readonly chartType: ChartType;
    validate(options: Partial<T>): boolean;
}

export interface IChart<T extends AgChartOptions, TCoordinate = any> {
    events: EventEmitter<ChartEventMap<T>>;
    options: IChartOptions<T>;
    stage: IStage;
    pipeline: PipelineQueue;
    axesCoordinator?: AxesCoordinator<any, TCoordinate>;
    setOptions(options: IChartOptions<T>): void;
    waitForUpdate(): Promise<void>;
    remove(): void;
}

export type IChartConstructor = new (stage: IStage, options: IChartOptions<any>) => IChart<any>;

export interface ChartEventMap<T extends AgChartOptions> {
    change: IChartOptions<T>;
}

export type AgChartOptions = CartesianChartOptions | PolarChartOptions | HierarchyChartOptions | TopologyChartOptions;

export interface CommonChartOptions {
    container?: HTMLElement;
    data?: object[];

    theme?: string | object;

    width?: number;
    height?: number;

    padding?: DirectionMetrics;
    seriesArea?: SeriesAreaOptions;

    title?: AgChartCaptionOptions;
    subtitle?: AgChartCaptionOptions;
    footnote?: AgChartCaptionOptions;

    axes?: { type: string }[];
    series: { type: string }[];

    // legend?: {
    //     enabled?: boolean;
    //     position?: `${Direction}`;
    //     padding?: DirectionMetrics;
    //     pointerEvents?: boolean;
    //     allowEmpty?: boolean;
    //     item?: {
    //         padding?: DirectionMetrics;
    //         marker?: {
    //             size?: number;
    //             padding?: DirectionMetrics;
    //         };
    //         label?: {};
    //     };
    //     pagination?: {};
    // };
    //
    // overlays?: {
    //     isEmpty?: string | (() => HTMLElement | string);
    //     isLoading?: string | (() => HTMLElement | string);
    //     noData?: string | (() => HTMLElement | string);
    // };
    //
    // background?: {
    //     enabled?: boolean;
    //     fill?: CssColor | CanvasGradient | CanvasPattern;
    // };
}

export interface CartesianChartOptions extends CommonChartOptions {
    data: object[];
    axes?: CartesianChartAxes[];
    series: CartesianChartSeries[];
    // series: Exclude<CartesianChartSeries, ChartSeries<'bullet'>>[] | [ChartSeries<'bullet'>];
}

export interface PolarChartOptions extends CommonChartOptions {
    data: object[];
    axes?: PolarChartAxes[];
    series: PolarChartSeries[];
}

export interface HierarchyChartOptions extends CommonChartOptions {
    data: [object];
    series: HierarchyChartSeries[];
}

export interface TopologyChartOptions extends CommonChartOptions {
    data?: object[];
    series: TopologyChartSeries[];
}

export interface DownloadOptions extends ImageUrlOptions {
    fileName?: string;
}

export interface ImageUrlOptions {
    width?: PixelSize;
    height?: PixelSize;
    fileFormat?: string;
}

export interface SeriesAreaOptions {
    clip?: boolean;
    padding?: DirectionMetrics;
}
