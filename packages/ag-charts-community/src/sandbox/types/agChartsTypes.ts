import type { AgChartCaptionOptions } from '../../options/chart/chartOptions';
import type { CartesianChartAxes, PolarChartAxes } from './axisTypes';
import type { BoxPosition, SeriesAreaOptions } from './commonTypes';
import type {
    CartesianChartSeries,
    ChartSeries,
    HierarchyChartSeries,
    PolarChartSeries,
    TopologyChartSeries,
} from './seriesTypes';

export type AgChartOptions = CartesianChartOptions | PolarChartOptions | HierarchyChartOptions | TopologyChartOptions;

export interface CommonChartOptions {
    container: HTMLElement;
    data?: object[];

    theme?: string | object;

    width?: number;
    height?: number;

    padding?: BoxPosition;
    seriesArea?: SeriesAreaOptions;

    title?: AgChartCaptionOptions;
    subtitle?: AgChartCaptionOptions;
    footnote?: AgChartCaptionOptions;

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

export interface HierarchyChartOptions extends CommonChartOptions {
    data: [object];
    series: HierarchyChartSeries[];
}

export interface TopologyChartOptions extends CommonChartOptions {
    data?: object[];
    series: TopologyChartSeries[];
}

export interface DownloadOptions {}

export interface ImageUrlOptions {}
