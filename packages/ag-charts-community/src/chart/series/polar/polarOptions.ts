import type { AgBaseChartOptions } from '../../agChartOptions';
import type { AgAnimationOptions } from '../../interaction/animationOptions';
import type { AgContextMenuOptions } from '../../options/contextOptions';
import type { AgChartBaseLegendOptions } from '../../options/legendOptions';
import type { AgSeriesTooltipRendererParams } from '../../options/tooltipOptions';
import type { AgPieSeriesOptions, AgPieSeriesTheme } from './pieOptions';
import type { AgAngleCategoryAxisOptions } from '../../options/polarAxisOptions';
import type { AgRadiusNumberAxisOptions } from '../../options/radiusAxisOptions';
import type { AgRadarLineSeriesOptions } from './radarLineOptions';
import type { AgRadarAreaSeriesOptions } from './radarAreaOptions';
import type { AgRadialColumnSeriesOptions } from './radialColumnOptions';
import type { AgNightingaleSeriesOptions } from './nightingaleOptions';

export type AgPolarSeriesOptions =
    | AgPieSeriesOptions
    | AgRadarLineSeriesOptions
    | AgRadarAreaSeriesOptions
    | AgRadialColumnSeriesOptions
    | AgNightingaleSeriesOptions;
export type AgPolarAxisOptions = AgAngleCategoryAxisOptions | AgRadiusNumberAxisOptions;

export interface AgPolarChartOptions extends AgBaseChartOptions {
    /** If specified overrides the default series type. */
    type?: 'pie' | 'radar-line' | 'radar-area' | 'radial-column' | 'nightingale';
    /** Series configurations. */
    series?: AgPolarSeriesOptions[];
    /** Configuration for the chart legend. */
    legend?: AgPolarChartLegendOptions;

    animation?: AgAnimationOptions;
    contextMenu?: AgContextMenuOptions;
    /** Axis configurations. */
    axes?: AgPolarAxisOptions[];
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
