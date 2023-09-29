import type { AgDropShadowOptions } from '../../chart/dropShadowOptions';
import type { AgSeriesListeners } from '../../chart/eventOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { CssColor, PixelSize } from '../../chart/types';
import type {
    AgBaseSeriesOptions,
    AgBaseSeriesThemeableOptions,
    AgSeriesHighlightStyle,
    AgSeriesMarker,
} from '../seriesOptions';
import type { AgCartesianSeriesLabelFormatterParams } from './cartesianLabelOptions';
import type { AgCartesianSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';
import type { FillOptions, LineDashOptions, StrokeOptions } from './commonOptions';

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

export interface AgRangeAreaSeriesThemeableOptions<DatumType = any>
    extends StrokeOptions,
        FillOptions,
        LineDashOptions,
        AgBaseSeriesThemeableOptions {
    /** Configuration for the markers used in the series.  */
    marker?: AgRangeAreaSeriesMarker<DatumType>;
    /** Configuration for the range series items when they are hovered over. */
    highlightStyle?: AgSeriesHighlightStyle;
    /** Configuration for the labels shown on top of data points. */
    label?: AgRangeAreaSeriesLabelOptions;
    /** Configuration for the shadow used behind the series items. */
    shadow?: AgDropShadowOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgRangeAreaSeriesTooltipRendererParams>;
}

/** Configuration for RangeArea series. */
export interface AgRangeAreaSeriesOptions<DatumType = any>
    extends AgRangeAreaSeriesThemeableOptions<DatumType>,
        AgBaseSeriesOptions<DatumType> {
    /** Configuration for the RangeArea series. */
    type: 'range-area';
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
export interface AgRangeAreaSeriesMarker<DatumType> extends AgSeriesMarker {
    /** Function used to return formatting for individual RangeArea series markers, based on the given parameters. If the current marker is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    formatter?: (params: AgRangeAreaSeriesMarkerFormatterParams<DatumType>) => AgRangeAreaSeriesFormat;
}

/**
 * Internal Use Only: Used to ensure this file is treated as a module until we can use moduleDetection flag in Ts v4.7
 */
export const __FORCE_MODULE_DETECTION = 0;
