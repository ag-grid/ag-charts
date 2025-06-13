import type { ContextCallbackParams, DatumCallbackParams, Styler } from '../../chart/callbackOptions';
import type { AgDropShadowOptions } from '../../chart/dropShadowOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { Opacity, PixelSize, TContextDefault, TDatumDefault } from '../../chart/types';
import type {
    AgBaseCartesianThemeableOptions,
    AgBaseSeriesOptions,
    AgMultiSeriesHighlightOptions,
    AgSeriesHighlightStyle,
} from '../seriesOptions';
import type { FillOptions, LineDashOptions, StrokeOptions } from './commonOptions';

export type AgRangeBarSeriesItemStylerParams<
    TDatum = TDatumDefault,
    TContext = TContextDefault,
> = DatumCallbackParams<TDatum> &
    ContextCallbackParams<TContext> &
    AgRangeBarSeriesOptionsKeys<TDatum> &
    Required<AgRangeBarSeriesStyle>;

export interface AgRangeBarSeriesStyle extends FillOptions, StrokeOptions, LineDashOptions {
    /** Apply rounded corners to each bar. */
    cornerRadius?: PixelSize;
}

export type AgRangeBarSeriesTooltipRendererParams<
    TDatum = TDatumDefault,
    TContext = TContextDefault,
> = AgSeriesTooltipRendererParams<TDatum, TContext> &
    AgRangeBarSeriesOptionsKeys<TDatum> &
    AgRangeBarSeriesOptionsNames &
    AgRangeBarSeriesStyle;

export interface AgRangeBarSeriesLabelOptions<TDatum, TContext = TContextDefault>
    extends AgChartLabelOptions<TDatum, AgRangeBarSeriesLabelFormatterParams<TDatum>, TContext> {
    /** Where to render series labels relative to the bars. */
    placement?: AgRangeBarSeriesLabelPlacement;
    /** Padding in pixels between the label and the edge of the bar. */
    padding?: PixelSize;
}

export type AgRangeBarSeriesLabelPlacement = 'inside' | 'outside';

export interface AgRangeBarSeriesThemeableOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseCartesianThemeableOptions<TDatum, TContext>,
        AgRangeBarSeriesStyle {
    /**
     * Bar rendering direction.
     *
     * __Note:__ This option affects the layout direction of X and Y data values.
     */
    direction?: 'horizontal' | 'vertical';
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgRangeBarSeriesTooltipRendererParams<TDatum, TContext>>;
    /** Configuration for the range series items when they are hovered over. */
    highlightStyle?: AgSeriesHighlightStyle;
    /** Configuration for the labels shown on top of data points. */
    label?: AgRangeBarSeriesLabelOptions<TDatum, TContext>;
    /** Configuration for the shadow used behind the series items. */
    shadow?: AgDropShadowOptions;
    /** Function used to return formatting for individual RangeBar series item cells, based on the given parameters. If the current cell is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    itemStyler?: Styler<AgRangeBarSeriesItemStylerParams<TDatum, TContext>, AgRangeBarSeriesStyle>;
    /** Configuration for highlighting when a series or legend item is hovered over. */
    highlight?: AgMultiSeriesHighlightOptions<AgRangeBarHighlightStyleOptions>;
}

export interface AgRangeBarHighlightStyleOptions extends AgRangeBarSeriesStyle {
    /** The opacity of the whole series (line, fill, labels and markers, if any) */
    opacity?: Opacity;
}
export type AgRangeBarSeriesLabelFormatterParams<TDatum = TDatumDefault> = AgRangeBarSeriesOptionsKeys<TDatum> &
    AgRangeBarSeriesOptionsNames;

export interface AgRangeBarSeriesOptionsKeys<TDatum = TDatumDefault> {
    /** The key to use to retrieve x-values from the data. */
    xKey: TDatum extends object ? keyof TDatum & string : string;
    /** The key to use to retrieve y-low-values from the data. */
    yLowKey: TDatum extends object ? keyof TDatum & string : string;
    /** The key to use to retrieve y-high-values from the data. */
    yHighKey: TDatum extends object ? keyof TDatum & string : string;
}

export interface AgRangeBarSeriesOptionsNames {
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** A human-readable description of the y-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yName?: string;
    /** A human-readable description of the y-low-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yLowName?: string;
    /** A human-readable description of the y-high-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yHighName?: string;
}

export interface AgRangeBarSeriesOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgRangeBarSeriesOptionsKeys<TDatum>,
        AgRangeBarSeriesOptionsNames,
        AgRangeBarSeriesThemeableOptions<TDatum, TContext>,
        Omit<AgBaseSeriesOptions<TDatum, TContext>, 'highlight'> {
    /** Configuration for the Range Bar Series. */
    type: 'range-bar';
}
