import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { AgSankeySeriesOptions } from './sankeyOptions';

type AgBaseFlowRatioSeriesOptions = AgSankeySeriesOptions;

export interface AgBaseFlowRatioChartOptions {
    /** Series configurations. */
    series?: AgBaseFlowRatioSeriesOptions[];
    /** Node options */
    nodes?: any[];
}

export interface AgBaseFlowProportionThemeOptions extends AgBaseThemeableChartOptions {}
