import type { AgBaseChartOptions } from '../../agChartOptions';
import type { AgChartBaseLegendOptions } from '../../options/legendOptions';
import type { AgSeriesTooltipRendererParams } from '../../options/tooltipOptions';
import type { AgPieSeriesOptions, AgPieSeriesTheme } from './pieOptions';

export type AgPolarSeriesOptions<TAddon = never> = AgPieSeriesOptions | TAddon;

export interface AgPolarChartOptions<TAddonType = never, TAddonSeries = never> extends AgBaseChartOptions {
    /** If specified overrides the default series type. */
    type?: 'pie' | TAddonType;
    /** Series configurations. */
    series?: AgPolarSeriesOptions<TAddonSeries>[];
    /** Configuration for the chart legend. */
    legend?: AgPolarChartLegendOptions;
}

export interface AgPolarThemeOptions<S = AgPolarSeriesTheme> extends AgBaseChartOptions {
    /** Series configurations. */
    series?: S;
    /** Configuration for the chart legend. */
    legend?: AgPolarChartLegendOptions;
}

export interface AgPolarSeriesTheme {
    pie?: AgPieSeriesTheme;
}

export interface AgPolarChartLegendOptions extends AgChartBaseLegendOptions {
    /** Whether or not to show the legend. The legend is shown by default. */
    enabled?: boolean;
}

export interface AgPolarSeriesTooltipRendererParams extends AgSeriesTooltipRendererParams {
    /** angleKey as specified on series options. */
    readonly angleKey: string;
    /** angleValue as read from series data via the angleKey property. */
    readonly angleValue?: any;
    /** angleName as specified on series options. */
    readonly angleName?: string;

    /** radiusKey as specified on series options. */
    readonly radiusKey?: string;
    /** radiusValue as read from series data via the radiusKey property. */
    readonly radiusValue?: any;
    /** radiusName as specified on series options. */
    readonly radiusName?: string;
}
