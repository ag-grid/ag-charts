import type { AgDropShadowOptions } from '../../chart/dropShadowOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesListeners } from '../../chart/eventOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { CssColor, Opacity, PixelSize } from '../../chart/types';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions, AgSeriesHighlightStyle } from '../seriesOptions';
import type { AgCartesianSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';
import type { AgCartesianSeriesLabelFormatterParams } from './cartesianLabelOptions';

export interface AgRangeBarSeriesFormatterParams<DatumType> {
    readonly datum: DatumType;
    readonly lowValue: number;
    readonly highValue: number;
    readonly fill?: CssColor;
    readonly stroke?: CssColor;
    readonly strokeWidth: PixelSize;
    readonly highlighted: boolean;
    readonly xKey: string;
    readonly yLowKey: string;
    readonly yHighKey: string;
    readonly labelKey?: string;
    readonly seriesId: string;
    readonly itemId: string;
}

export interface AgRangeBarSeriesFormat {
    fill?: CssColor;
    stroke?: CssColor;
    strokeWidth?: PixelSize;
}

export interface AgRangeBarSeriesTooltipRendererParams
    extends Omit<AgCartesianSeriesTooltipRendererParams, 'yKey' | 'yValue'> {
    /** The Id to distinguish the type of datum. This can be `low` or `high`. */
    itemId: string;

    /** yKey as specified on series options. */
    readonly yLowKey: string;
    /** yLowValue as read from series data via the yLowKey property. */
    readonly yLowValue?: any;
    /** yLowName as specified on series options. */
    readonly yLowName?: string;

    /** yKey as specified on series options. */
    readonly yHighKey: string;
    /** yHighValue as read from series data via the yHighKey property. */
    readonly yHighValue?: any;
    /** yHighName as specified on series options. */
    readonly yHighName?: string;
}

export interface AgRangeBarSeriesLabelOptions extends AgChartLabelOptions {
    /** Function used to turn 'yKey' values into text to be displayed by a label. By default the values are simply stringified. */
    formatter?: (params: AgRangeBarSeriesLabelFormatterParams) => string;
    /** Where to render series labels relative to the bars. */
    placement?: AgRangeBarSeriesLabelPlacement;
    /** Padding in pixels between the label and the edge of the bar. */
    padding?: PixelSize;
}

export interface AgRangeBarSeriesLabelFormatterParams extends AgCartesianSeriesLabelFormatterParams {
    /** The Id to distinguish the type of datum. This can be `low` or `high`. */
    readonly itemId: string;
    /** yLowValue as read from series data via the yLowKey property. */
    readonly yLowValue?: any;
    /** yHighValue as read from series data via the yHighKey property. */
    readonly yHighValue?: any;
}

export type AgRangeBarSeriesLabelPlacement = 'inside' | 'outside';

export interface AgRangeBarSeriesThemeableOptions<DatumType = any> extends AgBaseSeriesThemeableOptions {
    /** Bar rendering direction. NOTE: This option affects the layout direction of X and Y data values. */
    direction?: 'horizontal' | 'vertical';
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgRangeBarSeriesTooltipRendererParams>;
    /** Configuration for the range series items when they are hovered over. */
    highlightStyle?: AgSeriesHighlightStyle;
    /** Configuration for the labels shown on top of data points. */
    label?: AgRangeBarSeriesLabelOptions;
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
    /** Function used to return formatting for individual RangeBar series item cells, based on the given parameters. If the current cell is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    formatter?: (params: AgRangeBarSeriesFormatterParams<DatumType>) => AgRangeBarSeriesFormat;
}

/** Configuration for RangeBar series. */
export interface AgRangeBarSeriesOptions<DatumType = any>
    extends AgRangeBarSeriesThemeableOptions<DatumType>,
        AgBaseSeriesOptions<DatumType> {
    /** Configuration for the RangeBar series. */
    type: 'range-bar';
    /** The key to use to retrieve x-values from the data. */
    xKey: string;
    /** The key to use to retrieve y-low-values from the data. */
    yLowKey: string;
    /** The key to use to retrieve y-high-values from the data. */
    yHighKey: string;
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** A human-readable description of the y-low-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yLowName?: string;
    /** A human-readable description of the y-high-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yHighName?: string;
    /** A human-readable description of the y-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yName?: string;
    /** A map of event names to event listeners. */
    listeners?: AgSeriesListeners<DatumType>;
}

/**
 * Internal Use Only: Used to ensure this file is treated as a module until we can use moduleDetection flag in Ts v4.7
 */
export const __FORCE_MODULE_DETECTION = 0;
