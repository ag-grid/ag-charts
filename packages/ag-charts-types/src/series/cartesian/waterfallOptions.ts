import type { ContextCallbackParams, DatumItemCallbackParams, Renderer, Styler } from '../../chart/callbackOptions';
import type { AgDropShadowOptions } from '../../chart/dropShadowOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgTooltipRendererResult } from '../../chart/tooltipOptions';
import type { CssColor, Opacity, PixelSize, TContextDefault, TDatumDefault } from '../../chart/types';
import type { AgBaseCartesianThemeableOptions, AgBaseSeriesOptions, AgSeriesHighlightStyle } from '../seriesOptions';
import type { AgCartesianSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';
import type { FillOptions, LineDashOptions, StrokeOptions } from './commonOptions';

export type AgWaterfallSeriesItemType = 'positive' | 'negative' | 'total' | 'subtotal';

export type AgWaterfallSeriesItemStylerParams<
    TDatum = TDatumDefault,
    TContext = TContextDefault,
> = DatumItemCallbackParams<AgWaterfallSeriesItemType, TDatum> &
    ContextCallbackParams<TContext> &
    AgWaterfallSeriesOptionsKeys<TDatum> &
    Required<AgWaterfallSeriesStyle>;

export type AgWaterfallSeriesLabelFormatterParams<TDatum = TDatumDefault> = AgWaterfallSeriesOptionsKeys<TDatum> &
    AgWaterfallSeriesOptionsNames & { itemId: AgWaterfallSeriesItemType };

export interface AgWaterfallSeriesStyle extends FillOptions, StrokeOptions, LineDashOptions {
    /** Apply rounded corners to each bar. */
    cornerRadius?: PixelSize;
}

export interface AgWaterfallSeriesTooltipRendererParams<TDatum = TDatumDefault>
    extends AgCartesianSeriesTooltipRendererParams<TDatum>,
        AgWaterfallSeriesStyle {
    /** The Id to distinguish the type of datum. This can be `positive`, `negative`, `total` or `subtotal`. */
    itemId: AgWaterfallSeriesItemType;
}

export interface AgWaterfallSeriesItemTooltip<TDatum = TDatumDefault> {
    /** Function used to create the content for tooltips. */
    renderer?: Renderer<AgWaterfallSeriesTooltipRendererParams<TDatum>, AgTooltipRendererResult>;
}

export interface AgWaterfallSeriesLabelOptions<TDatum, TParams> extends AgChartLabelOptions<TDatum, TParams> {
    /** Where to render series labels relative to the bars. */
    placement?: AgWaterfallSeriesLabelPlacement;
    /** Padding in pixels between the label and the edge of the bar. */
    padding?: PixelSize;
}

export type AgWaterfallSeriesLabelPlacement =
    | 'inside-center'
    | 'inside-start'
    | 'inside-end'
    | 'outside-start'
    | 'outside-end';

export interface AgWaterfallSeriesThemeableOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseCartesianThemeableOptions<TDatum, TContext> {
    /**
     * Bar rendering direction.
     *
     * __Note:__ This option affects the layout direction of X and Y data values.
     */
    direction?: 'horizontal' | 'vertical';
    /** Configuration used for the waterfall series item types. */
    item?: AgWaterfallSeriesItem<TDatum, TContext>;
    /** Configuration for the connector lines. */
    line?: AgWaterfallSeriesLineOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgWaterfallSeriesTooltipRendererParams<TDatum>>;
    /** Configuration for the waterfall series items when they are hovered over. */
    highlightStyle?: AgSeriesHighlightStyle;
}

export interface AgWaterfallSeriesOptionsKeys<TDatum = TDatumDefault> {
    /** The key to use to retrieve x-values from the data. */
    xKey: TDatum extends object ? keyof TDatum & string : string;
    /** The key to use to retrieve y-values from the data. */
    yKey: TDatum extends object ? keyof TDatum & string : string;
}

export interface AgWaterfallSeriesOptionsNames {
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** A human-readable description of the y-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yName?: string;
}

export interface AgWaterfallSeriesOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseSeriesOptions<TDatum, TContext>,
        AgWaterfallSeriesOptionsKeys<TDatum>,
        AgWaterfallSeriesOptionsNames,
        AgWaterfallSeriesThemeableOptions<TDatum, TContext> {
    /** Configuration for the Waterfall Series. */
    type: 'waterfall';
    /** Configuration of total and subtotal values. */
    totals?: WaterfallSeriesTotalMeta[];
}

export interface AgWaterfallSeriesItem<TDatum, TContext = TContextDefault> {
    /** Configuration for the negative series items. */
    negative?: AgWaterfallSeriesItemOptions<TDatum, TContext>;
    /** Configuration for the positive series items. */
    positive?: AgWaterfallSeriesItemOptions<TDatum, TContext>;
    /** Configuration for the total and subtotal series items. */
    total?: AgWaterfallSeriesItemOptions<TDatum, TContext>;
}

export interface WaterfallSeriesTotalMeta {
    /** Configuration for the calculation of the value. This can be `total` or `subtotal`, `total` shows the cumulative value from `0` to the current data position, while `subtotal` shows the cumulative value from the previous subtotal value to the current position.
     */
    totalType: 'subtotal' | 'total';
    /** The index after which the total item will be displayed. */
    index: number;
    /** The label to display at the axis position where the total value is positioned. */
    axisLabel: string;
}

export interface AgWaterfallSeriesItemOptions<TDatum, TContext = TContextDefault> extends AgWaterfallSeriesStyle {
    /** A human-readable description of the y-values. If supplied, this will be shown in the legend and default tooltip and passed to the tooltip renderer as one of the parameters. */
    name?: string;
    /** Configuration for the labels shown on top of data points. */
    label?: AgWaterfallSeriesLabelOptions<TDatum, AgWaterfallSeriesLabelFormatterParams<TDatum>>;
    /** Configuration for the shadow used behind the series items. */
    shadow?: AgDropShadowOptions;
    /** Function used to return formatting for individual Waterfall series item cells, based on the given parameters. If the current cell is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    itemStyler?: Styler<AgWaterfallSeriesItemStylerParams<TDatum, TContext>, AgWaterfallSeriesStyle>;
    /** Series item specific tooltip configuration. */
    tooltip?: AgWaterfallSeriesItemTooltip<TDatum>;
}

export interface AgWaterfallSeriesLineOptions {
    /** Whether the connector lines should be shown. */
    enabled?: boolean;
    /** The colour to use for the connector lines. */
    stroke?: CssColor;
    /** The width in pixels of the connector lines. */
    strokeWidth?: PixelSize;
    /** Opacity of the line stroke. */
    strokeOpacity?: Opacity;
    /** Defines how the strokes are rendered. Every number in the array specifies the length in pixels of alternating dashes and gaps. For example, `[6, 3]` means dashes with a length of `6` pixels with gaps between of `3` pixels. */
    lineDash?: PixelSize[];
    /** The initial offset of the dashed line in pixels. */
    lineDashOffset?: PixelSize;
}
