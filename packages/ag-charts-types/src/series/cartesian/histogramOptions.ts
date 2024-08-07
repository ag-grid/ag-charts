import type { AgDropShadowOptions } from '../../chart/dropShadowOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { PixelSize } from '../../chart/types';
import type { AgBaseCartesianThemeableOptions, AgBaseSeriesOptions } from '../seriesOptions';
import type { AgCartesianSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';
import type { FillOptions, LineDashOptions, StrokeOptions } from './commonOptions';

export interface AgHistogramSeriesTooltipRendererParams<TDatum>
    extends Omit<AgCartesianSeriesTooltipRendererParams<AgHistogramBinDatum<TDatum>>, 'yKey'> {
    /** yKey as specified on series options. */
    readonly yKey?: string;
}

export type AgHistogramSeriesLabelFormatterParams = AgHistogramSeriesOptionsKeys & AgHistogramSeriesOptionsNames;

export interface AgHistogramBinDatum<TDatum> {
    data: TDatum[];
    aggregatedValue: number;
    frequency: number;
    domain: [number, number];
}

export interface AgHistogramSeriesThemeableOptions<TDatum = any>
    extends AgBaseCartesianThemeableOptions<TDatum>,
        FillOptions,
        StrokeOptions,
        LineDashOptions {
    /** Configuration for the shadow used behind the chart series. */
    shadow?: AgDropShadowOptions;
    /** Configuration for the labels shown on bars. */
    label?: AgChartLabelOptions<TDatum, AgHistogramSeriesLabelFormatterParams>;
    /** Apply rounded corners to each bar. */
    cornerRadius?: PixelSize;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgHistogramSeriesTooltipRendererParams<TDatum>>;
}

export interface AgHistogramSeriesOptionsKeys {
    /** The key to use to retrieve x-values from the data. */
    xKey: string;
    /** The key to use to retrieve y-values from the data. */
    yKey?: string;
}

export interface AgHistogramSeriesOptionsNames {
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** A human-readable description of the y-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yName?: string;
}

export interface AgHistogramSeriesOptions<TDatum = any>
    extends AgBaseSeriesOptions<TDatum>,
        AgHistogramSeriesOptionsKeys,
        AgHistogramSeriesOptionsNames,
        AgHistogramSeriesThemeableOptions<TDatum> {
    /** Configuration for Histogram Series. */
    type: 'histogram';
    /** For variable width bins.
     *
     * If `true`, the histogram will represent the aggregated `yKey` values using the area of the bar, instead of just the height. */
    areaPlot?: boolean;
    /** Set the bin sizes explicitly.
     *
     * __Note:__ `bins` is ignored if `binCount` is also supplied.
     */
    bins?: [number, number][];
    /** The number of bins to try to split the x-axis into.  */
    binCount?: number;
    /** Dictates how the `yKey` values are aggregated within each bin.
     *
     * Default: `sum`
     */
    aggregation?: 'count' | 'sum' | 'mean';
}
