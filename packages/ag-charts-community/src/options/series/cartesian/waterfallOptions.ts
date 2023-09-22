import type { AgDropShadowOptions } from '../../chart/dropShadowOptions';
import type { AgSeriesListeners } from '../../chart/eventOptions';
import type { AgSeriesTooltip, AgTooltipRendererResult } from '../../chart/tooltipOptions';
import type { CssColor, Opacity, PixelSize } from '../../chart/types';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions, AgSeriesHighlightStyle } from '../seriesOptions';
import type { AgCartesianSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';
import type { AgCartesianSeriesLabelOptions } from './cartesianLabelOptions';

export interface AgWaterfallSeriesFormatterParams<DatumType> {
    readonly datum: DatumType;
    readonly value: number;
    readonly fill?: CssColor;
    readonly stroke?: CssColor;
    readonly strokeWidth: PixelSize;
    readonly highlighted: boolean;
    readonly xKey: string;
    readonly yKey: string;
    readonly labelKey?: string;
    readonly seriesId: string;
    readonly itemId: string;
}

export interface AgWaterfallSeriesFormat {
    fill?: CssColor;
    stroke?: CssColor;
    strokeWidth?: PixelSize;
}

export interface AgWaterfallSeriesTooltipRendererParams extends AgCartesianSeriesTooltipRendererParams {
    /** The Id to distinguish the type of datum. This can be `positive`, `negative`, `total` or `subtotal`. */
    itemId: string;
}

export interface AgWaterfallSeriesItemTooltip {
    /** Function used to create the content for tooltips. */
    renderer?: (params: AgWaterfallSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
}

export interface AgWaterfallSeriesLabelOptions extends AgCartesianSeriesLabelOptions {
    /** Where to render series labels relative to the bars. */
    placement?: AgWaterfallSeriesLabelPlacement;
    /** Padding in pixels between the label and the edge of the bar. */
    padding?: PixelSize;
}

export type AgWaterfallSeriesLabelPlacement = 'start' | 'end' | 'inside';

export interface AgWaterfallSeriesThemeableOptions<DatumType = any> extends AgBaseSeriesThemeableOptions {
    /**
     * Sets the bar orientation. When `vertical` (default), bars are vertical with categories on the x-axis.
     * When set to `horizontal`, bars run horizontally with categories on the y-axis.
     */
    direction?: 'horizontal' | 'vertical';
    /** Configuration used for the waterfall series item types. */
    item?: AgWaterfallSeriesItem<DatumType>;
    /** Configuration for the connector lines. */
    line?: AgWaterfallSeriesLineOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgWaterfallSeriesTooltipRendererParams>;
    /** Configuration for the waterfall series items when they are hovered over. */
    highlightStyle?: AgSeriesHighlightStyle;
}

/** Configuration for Waterfall series. */
export interface AgWaterfallSeriesOptions<DatumType = any>
    extends AgWaterfallSeriesThemeableOptions<DatumType>,
        AgBaseSeriesOptions<DatumType> {
    /** Configuration for the Waterfall series. */
    type: 'waterfall';
    /** The key to use to retrieve x-values from the data. */
    xKey: string;
    /** The key to use to retrieve y-values from the data. */
    yKey: string;
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** A human-readable description of the y-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yName?: string;
    /** Configuration of total and subtotal values. */
    totals?: WaterfallSeriesTotalMeta[];
    /** A map of event names to event listeners. */
    listeners?: AgSeriesListeners<DatumType>;
}

export interface AgWaterfallSeriesItem<DatumType> {
    /** Configuration for the negative series items. */
    negative?: AgWaterfallSeriesItemOptions<DatumType>;
    /** Configuration for the positive series items. */
    positive?: AgWaterfallSeriesItemOptions<DatumType>;
    /** Configuration for the total and subtotal series items. */
    total?: AgWaterfallSeriesItemOptions<DatumType>;
}

export interface WaterfallSeriesTotalMeta {
    /** Configuration for the calculation of the value. This can be `total` or `subtotal`, `total` shows the cumulative value from `0` to the current data position, while `subtotal` shows the cumulative value from the previous subtotal value to the current position.
     */
    totalType: 'subtotal' | 'total';
    /** The index after which the total item will be displayed. */
    index: number;
    /** The label to display at the axis position where the total value is positioned. */
    axisLabel: any;
}

export interface AgWaterfallSeriesItemOptions<DatumType> {
    /** A human-readable description of the y-values. If supplied, this will be shown in the legend and default tooltip and passed to the tooltip renderer as one of the parameters. */
    name?: string;
    /** Configuration for the labels shown on top of data points. */
    label?: AgWaterfallSeriesLabelOptions;
    /** The fill colour to use for the bars. */
    fill?: CssColor;
    /** Opacity of the bars. */
    fillOpacity?: Opacity;
    /** The colour to use for the bars. */
    stroke?: CssColor;
    /** The width in pixels of the bars. */
    strokeWidth?: PixelSize;
    /** Opacity of the bars. */
    strokeOpacity?: Opacity;
    /** Defines how the strokes are rendered. Every number in the array specifies the length in pixels of alternating dashes and gaps. For example, `[6, 3]` means dashes with a length of `6` pixels with gaps between of `3` pixels. */
    lineDash?: PixelSize[];
    /** The initial offset of the dashed line in pixels. */
    lineDashOffset?: PixelSize;
    /** Configuration for the shadow used behind the series items. */
    shadow?: AgDropShadowOptions;
    /** Function used to return formatting for individual Waterfall series item cells, based on the given parameters. If the current cell is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    formatter?: (params: AgWaterfallSeriesFormatterParams<DatumType>) => AgWaterfallSeriesFormat;
    /** Series item specific tooltip configuration. */
    tooltip?: AgWaterfallSeriesItemTooltip;
}

export interface AgWaterfallSeriesLineOptions {
    /** Whether or not the connector lines should be shown. */
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

/**
 * Internal Use Only: Used to ensure this file is treated as a module until we can use moduleDetection flag in Ts v4.7
 */
export const __FORCE_MODULE_DETECTION = 0;
