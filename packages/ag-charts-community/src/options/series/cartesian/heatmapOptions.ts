import type { AgChartLabelFormatterParams, AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { CssColor, PixelSize } from '../../chart/types';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';
import type { AgCartesianSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';
import type { StrokeOptions } from './commonOptions';

export interface AgHeatmapSeriesFormatterParams<TDatum> {
    readonly datum: TDatum;
    readonly fill?: CssColor;
    readonly stroke?: CssColor;
    readonly strokeWidth: PixelSize;
    readonly highlighted: boolean;
    readonly xKey: string;
    readonly yKey: string;
    readonly colorKey?: string;
    readonly seriesId: string;
}

export interface AgHeatmapSeriesFormat {
    fill?: CssColor;
    stroke?: CssColor;
    strokeWidth?: PixelSize;
}

export interface AgHeatmapSeriesLabelFormatterParams<TDatum> extends AgChartLabelFormatterParams<TDatum> {
    /** colorKey as specified on series options. */
    readonly colorKey?: string;
    /** colorName as specified on series options. */
    readonly colorName?: string;
}

export interface AgHeatmapSeriesTooltipRendererParams extends AgCartesianSeriesTooltipRendererParams {
    /** colorKey as specified on series options. */
    readonly colorKey?: string;
    /** colorName as specified on series options. */
    readonly colorName?: string;
}

export interface AgHeatmapSeriesThemeableOptions<TDatum = any> extends StrokeOptions, AgBaseSeriesThemeableOptions {
    /** Configuration for the labels shown on top of data points. */
    label?: AgChartLabelOptions<TDatum, AgHeatmapSeriesLabelFormatterParams<TDatum>>;
    /** The title to use for the series. Defaults to `yName` if it exists, or `yKey` if not. */
    title?: string;
    /** Function used to return formatting for individual heatmap cells, based on the given parameters. If the current cell is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    formatter?: (params: AgHeatmapSeriesFormatterParams<TDatum>) => AgHeatmapSeriesFormat;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgHeatmapSeriesTooltipRendererParams>;
}

/** Configuration for heatmap series. */
export interface AgHeatmapSeriesOptions<TDatum = any>
    extends AgHeatmapSeriesThemeableOptions<TDatum>,
        AgBaseSeriesOptions<TDatum> {
    /** Configuration for the heatmap series. */
    type: 'heatmap';
    /** The key to use to retrieve x-values from the data. */
    xKey: string;
    /** The key to use to retrieve y-values from the data. */
    yKey: string;
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** A human-readable description of the y-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yName?: string;
    /** The name of the node key containing the colour value. This value (along with `colorRange` configs) will be used to determine the tile colour. */
    colorKey?: string;
    /** A human-readable description of the colour values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    colorName?: string;
    /** The color range to interpolate the numeric color domain (min and max `colorKey` values) into. For example, if the color domain is `[-5, 5]` and `colorRange` is `['red', 'green']`, a `colorKey` value of `-5` will be assigned the 'red' color, `5` - 'green' color and `0` a blend of 'red' and 'green'. */
    colorRange?: string[];
}

/**
 * Internal Use Only: Used to ensure this file is treated as a module until we can use moduleDetection flag in Ts v4.7
 */
export const __FORCE_MODULE_DETECTION = 0;
