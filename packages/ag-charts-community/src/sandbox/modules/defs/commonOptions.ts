import type { AgChartCaptionOptions } from '../../../options/chart/chartOptions';
import type {
    CartesianChartAxes,
    CartesianChartSeries,
    ChartSeries,
    PolarChartAxes,
    PolarChartSeries,
} from '../../chart/types';
import { type OptionsDefs, boolean, callback, string } from '../../util/validation';

export type BoxPosition = { top?: number; right?: number; bottom?: number; left?: number };

export interface SeriesAreaOptions {
    clip?: boolean;
    padding?: BoxPosition;
}

export type AgChartOptions = CartesianChartOptions | PolarChartOptions;

// Charts
export interface CommonChartOptions {
    container: HTMLElement;
    data: any;

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

// Series
export interface CommonSeriesOptions {
    visible?: boolean;
    showInLegend?: boolean;
    cursor?: string;
    onNodeClick?: (event: object) => void;
    onNodeDoubleClick?: (event: object) => void;
}

export const commonSeriesOptionsDefs: OptionsDefs<CommonSeriesOptions> = {
    visible: boolean,
    showInLegend: boolean,
    cursor: string,
    onNodeClick: callback,
    onNodeDoubleClick: callback,
};
