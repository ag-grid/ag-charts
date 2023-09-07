import type { AgAnimationOptions } from '../../interaction/animationOptions';
import type { AgContextMenuOptions } from '../../options/contextOptions';
import type { AgChartBaseLegendOptions } from '../../options/legendOptions';
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

export interface AgBasePolarChartOptions {
    /** Series configurations. */
    series?: AgPolarSeriesOptions[];
    /** Configuration for the chart legend. */
    legend?: AgPolarChartLegendOptions;

    animation?: AgAnimationOptions;
    contextMenu?: AgContextMenuOptions;
    /** Axis configurations. */
    axes?: AgPolarAxisOptions[];
}

export interface AgBasePolarThemeOptions<S> {
    /** Series configurations. */
    series?: S extends AgPieSeriesOptions ? AgPieSeriesTheme : S;
    /** Configuration for the chart legend. */
    legend?: AgPolarChartLegendOptions;
}

export interface AgPolarChartLegendOptions extends AgChartBaseLegendOptions {
    /** Whether or not to show the legend. The legend is shown by default. */
    enabled?: boolean;
}
