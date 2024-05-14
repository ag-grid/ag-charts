import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { AgBaseSeriesOptions } from '../seriesOptions';

export interface AgSankeySeriesOptions<TDatum = any>
    extends AgBaseSeriesOptions<TDatum>,
        AgSankeySeriesOptionsKeys,
        AgSankeySeriesThemeableOptions<TDatum> {
    /** Configuration for the Sankey Series. */
    type: 'sankey';
}

export interface AgSankeySeriesThemeableOptions<_TDatum = any> {}

export interface AgSankeySeriesOptionsKeys {
    /** The name of the node key containing the from id. */
    fromIdKey?: string;
    /** The name of the node key containing the to id. */
    toIdKey?: string;
    /** The name of the node key containing the size. */
    sizeKey?: string;
}

export interface AgSankeySeriesOptionsNames {
    /** The name of the node key containing the from id. */
    fromIdName?: string;
    /** The name of the node key containing the to id. */
    toIdName?: string;
    /** The name of the node key containing the size. */
    sizeName?: string;
}

export interface AgSankeyNodeOptions {
    /** The name of the node key containing the id. */
    idKey?: string;
    /** The name of the node key containing the id. */
    labelKey?: string;
}

export interface AgSankeySeriesTooltipRendererParams
    extends AgSeriesTooltipRendererParams,
        AgSankeySeriesOptionsKeys,
        AgSankeySeriesOptionsNames {}

export interface AgBaseSankeyChartOptions {
    /** Series configurations. */
    series?: AgSankeySeriesOptions[];
    /** Node options */
    nodes?: AgSankeyNodeOptions[];
}

export interface AgBaseSankeyThemeOptions extends AgBaseThemeableChartOptions {}
