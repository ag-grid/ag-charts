import type { ContextCallbackParams } from '../../chart/callbackOptions';
import type { AgDropShadowOptions } from '../../chart/dropShadowOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { TContextDefault, TDatumDefault } from '../../chart/types';
import type { AgInterpolationType } from '../interpolationOptions';
import type { AgSeriesMarkerOptions } from '../markerOptions';
import type { AgBaseCartesianThemeableOptions, AgBaseSeriesOptions } from '../seriesOptions';
import type { AgCartesianSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';
import type { FillOptions, LineDashOptions, StrokeOptions } from './commonOptions';

export type AgAreaSeriesLabelFormatterParams<TDatum = TDatumDefault> = AgAreaSeriesOptionsKeys<TDatum> &
    AgAreaSeriesOptionsNames;

export interface AgAreaSeriesTooltipRendererParams<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgCartesianSeriesTooltipRendererParams<TDatum, TContext>,
        FillOptions,
        StrokeOptions {}

export interface AgAreaSeriesThemeableOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends StrokeOptions,
        FillOptions,
        LineDashOptions,
        AgBaseCartesianThemeableOptions<TDatum, TContext> {
    /** Configuration for the markers used in the series. */
    marker?: AgSeriesMarkerOptions<TDatum, AgAreaSeriesMarkerItemStylerParams<TDatum, TContext>>;
    /** Configuration for the line used in the series. */
    interpolation?: AgInterpolationType;
    /** Configuration for the shadow used behind the chart series. */
    shadow?: AgDropShadowOptions;
    /** Configuration for the labels shown on top of data points. */
    label?: AgChartLabelOptions<TDatum, AgAreaSeriesLabelFormatterParams<TDatum>, TContext>;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgAreaSeriesTooltipRendererParams<TDatum, TContext>>;
    /** Set to `true` to connect across missing data points. */
    connectMissingData?: boolean;
}

export interface AgAreaSeriesOptionsKeys<TDatum = TDatumDefault> {
    /** The key to use to retrieve x-values from the data. */
    xKey: TDatum extends object ? keyof TDatum & string : string;
    /** The key to use to retrieve y-values from the data. */
    yKey: TDatum extends object ? keyof TDatum & string : string;
}

export interface AgAreaSeriesMarkerItemStylerParams<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgAreaSeriesOptionsKeys<TDatum>,
        ContextCallbackParams<TContext> {
    /** The x value of the datum. */
    xValue: any;
    /** The y value of the datum. */
    yValue: any;
    /** Whether the item's x value is the first in the data domain. */
    first: boolean;
    /** Whether the item's x value is the last in the data domain. */
    last: boolean;
    /** Whether the item's y value is the lowest in the data. */
    min: boolean;
    /** Whether the item's y value is the highest in the data. */
    max: boolean;
}

export interface AgAreaSeriesOptionsNames {
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** A human-readable description of the y-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yName?: string;
}

export interface AgAreaSeriesOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseSeriesOptions<TDatum, TContext>,
        AgAreaSeriesOptionsKeys<TDatum>,
        AgAreaSeriesOptionsNames,
        AgAreaSeriesThemeableOptions<TDatum, TContext> {
    /** Configuration for the Area Series. */
    type: 'area';
    /** The number to normalise the area stacks to. For example, if `normalizedTo` is set to `100`, the stacks will all be scaled proportionally so that their total height is always 100. */
    normalizedTo?: number;
    /** An option indicating if the areas should be stacked. */
    stacked?: boolean;
    /** An ID to be used to group stacked items. */
    stackGroup?: string;
}
