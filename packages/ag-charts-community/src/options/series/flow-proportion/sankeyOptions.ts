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
    /** The name of the node key containing the node id. */
    nodeIdKey?: string;
    /** The name of the node key containing the node label. */
    labelKey?: string;
    /** The name of the node key containing the node size. */
    nodeSizeKey?: string;
    /** The name of the node key containing the node position. */
    positionKey?: string;
}

export interface AgSankeySeriesOptionsNames {
    /** The name of the node key containing the from id. */
    fromIdName?: string;
    /** The name of the node key containing the to id. */
    toIdName?: string;
    /** The name of the node key containing the size. */
    sizeName?: string;
    /** The name of the node key containing the node id. */
    nodeIdName?: string;
    /** The name of the node key containing the label. */
    labelName?: string;
    /** The name of the node key containing the node size. */
    nodeSizeName?: string;
    /** The name of the node key containing the node position. */
    positionName?: string;
}

export interface AgSankeySeriesTooltipRendererParams
    extends AgSeriesTooltipRendererParams,
        AgSankeySeriesOptionsKeys,
        AgSankeySeriesOptionsNames {
    /** Node options */
    nodes?: any[];
}

export interface AgBaseFlowRatioChartOptions {
    /** Series configurations. */
    series?: AgSankeySeriesOptions[];
    /** Node options */
    nodes?: any[];
}

export interface AgBaseFlowProportionThemeOptions extends AgBaseThemeableChartOptions {}
