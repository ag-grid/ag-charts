import type { AgDropShadowOptions } from '../../options/dropShadowOptions';
import type { AgSeriesTooltip } from '../../options/tooltipOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';
import type { AgCartesianSeriesMarker } from './cartesianSeriesMarkerOptions';
import type { AgCartesianSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';
import type { AgCartesianSeriesLabelOptions } from './cartesianLabelOptions';
import type { FillOptions, LineDashOptions, StrokeOptions } from './commonOptions';

export interface AgAreaSeriesMarker<DatumType> extends AgCartesianSeriesMarker<DatumType> {}

export interface AgAreaSeriesThemeableOptions<DatumType = any>
    extends StrokeOptions,
        FillOptions,
        LineDashOptions,
        AgBaseSeriesThemeableOptions {
    /** Configuration for the markers used in the series. */
    marker?: AgAreaSeriesMarker<DatumType>;
    /** Configuration for the shadow used behind the chart series. */
    shadow?: AgDropShadowOptions;
    /** Configuration for the labels shown on top of data points. */
    label?: AgCartesianSeriesLabelOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgCartesianSeriesTooltipRendererParams>;
}

/** Configuration for area series. */
export interface AgAreaSeriesOptions<DatumType = any>
    extends AgAreaSeriesThemeableOptions<DatumType>,
        AgBaseSeriesOptions<DatumType> {
    type: 'area';
    /** The number to normalise the area stacks to. For example, if `normalizedTo` is set to `100`, the stacks will all be scaled proportionally so that their total height is always 100. */
    normalizedTo?: number;
    /** The key to use to retrieve x-values from the data. */
    xKey: string;
    /** The key to use to retrieve y-values from the data. */
    yKey: string;
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** A human-readable description of the y-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yName?: string;
    /** An option indicating if the areas should be stacked. */
    stacked?: boolean;
    /** An ID to be used to group stacked items. */
    stackGroup?: string;
}
