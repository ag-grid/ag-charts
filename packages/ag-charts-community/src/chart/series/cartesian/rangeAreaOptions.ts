import type { AgChartLabelOptions, AgDropShadowOptions } from '../../options/chartOptions';
import type { AgSeriesListeners } from '../../options/eventOptions';
import type { AgSeriesTooltip } from '../../options/tooltipOptions';
import type { CssColor, Opacity, PixelSize } from '../../options/types';
import type { AgBaseSeriesOptions, AgSeriesHighlightStyle, AgSeriesMarker } from '../seriesOptions';
import type { AgCartesianSeriesLabelFormatterParams, AgCartesianSeriesTooltipRendererParams } from './cartesianOptions';

export interface AgRangeAreaSeriesMarkerFormatterParams<DatumType> {
    readonly datum: DatumType;
    readonly lowValue: number;
    readonly highValue: number;
    readonly size: number;
    readonly fill?: CssColor;
    readonly stroke?: CssColor;
    readonly strokeWidth: PixelSize;
    readonly highlighted: boolean;
    readonly xKey: string;
    readonly yLowKey: string;
    readonly yHighKey: string;
    readonly seriesId: string;
    readonly itemId: string;
}

export interface AgRangeAreaSeriesFormat {
    fill?: CssColor;
    stroke?: CssColor;
    strokeWidth?: PixelSize;
}

export interface AgRangeAreaSeriesTooltipRendererParams
    extends Omit<AgCartesianSeriesTooltipRendererParams, 'yKey' | 'yValue'> {
    /** The Id to distinguish the type of datum. This can be `positive`, `negative`, `total` or `subtotal`. */
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

export interface AgRangeAreaSeriesLabelOptions extends AgChartLabelOptions {
    /** Function used to turn 'yKey' values into text to be displayed by a label. By default the values are simply stringified. */
    formatter?: (params: AgRangeAreaSeriesLabelFormatterParams) => string;
    /** Padding in pixels between the label and the edge of the marker. */
    padding?: PixelSize;
}

export interface AgRangeAreaSeriesLabelFormatterParams extends AgCartesianSeriesLabelFormatterParams {
    /** The Id to distinguish the type of datum. This can be `low` or `high`. */
    readonly itemId: string;
    /** yLowValue as read from series data via the yLowKey property. */
    readonly yLowValue?: any;
    /** yHighValue as read from series data via the yHighKey property. */
    readonly yHighValue?: any;
}

export type AgRangeAreaSeriesLabelPlacement = 'inside' | 'outside';

/** Configuration for RangeArea series. */
export interface AgRangeAreaSeriesOptions<DatumType = any> extends AgBaseSeriesOptions<DatumType> {
    /** Configuration for the RangeArea series. */
    type?: 'range-area';
    /** The key to use to retrieve x-values from the data. */
    xKey?: string;
    /** The key to use to retrieve y-low-values from the data. */
    yLowKey?: string;
    /** The key to use to retrieve y-high-values from the data. */
    yHighKey?: string;
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** A human-readable description of the y-low-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yLowName?: string;
    /** A human-readable description of the y-high-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yHighName?: string;
    /** A human-readable description of the y-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yName?: string;
    /** The title to use for the series. Defaults to `yName` if it exists, or `yKey` if not. */
    title?: string;
    /** Configuration for the markers used in the series.  */
    marker?: AgRangeAreaSeriesMarker<DatumType>;
    /** Configuration for the range series items when they are hovered over. */
    highlightStyle?: AgSeriesHighlightStyle;
    /** Configuration for the labels shown on top of data points. */
    label?: AgRangeAreaSeriesLabelOptions;
    /** The fill colour to use for the area. */
    fill?: CssColor;
    /** Opacity of the area. */
    fillOpacity?: Opacity;
    /** The colour to use for the line. */
    stroke?: CssColor;
    /** The width in pixels of the stroke. */
    strokeWidth?: PixelSize;
    /** Opacity of the stroke. */
    strokeOpacity?: Opacity;
    /** Defines how the strokes are rendered. Every number in the array specifies the length in pixels of alternating dashes and gaps. For example, `[6, 3]` means dashes with a length of `6` pixels with gaps between of `3` pixels. */
    lineDash?: PixelSize[];
    /** The initial offset of the dashed line in pixels. */
    lineDashOffset?: PixelSize;
    /** Configuration for the shadow used behind the series items. */
    shadow?: AgDropShadowOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgRangeAreaSeriesTooltipRendererParams>;
    /** A map of event names to event listeners. */
    listeners?: AgSeriesListeners<DatumType>;
}
export interface AgRangeAreaSeriesMarker<DatumType> extends AgSeriesMarker {
    /** Function used to return formatting for individual RangeArea series markers, based on the given parameters. If the current marker is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    formatter?: (params: AgRangeAreaSeriesMarkerFormatterParams<DatumType>) => AgRangeAreaSeriesFormat;
}

/**
 * Internal Use Only: Used to ensure this file is treated as a module until we can use moduleDetection flag in Ts v4.7
 */
export const __FORCE_MODULE_DETECTION = 0;
