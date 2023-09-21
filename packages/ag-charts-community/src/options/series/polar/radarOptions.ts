import type { AgChartLabelOptions } from '../../chart//labelOptions';
import type { AgSeriesListeners } from '../../chart//eventOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart//tooltipOptions';
import type { CssColor, PixelSize } from '../../chart//types';
import type {
    AgBaseSeriesOptions,
    AgBaseSeriesThemeableOptions,
    AgSeriesMarker,
    AgSeriesMarkerFormatterParams,
} from '../seriesOptions';
import type { LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';

export interface AgRadarSeriesThemeableOptions<DatumType = any>
    extends StrokeOptions,
        LineDashOptions,
        AgBaseSeriesThemeableOptions {
    marker?: AgRadarSeriesMarker<DatumType>;
    /** Configuration for the labels shown on top of data points. */
    label?: AgRadarSeriesLabelOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgRadarSeriesTooltipRendererParams>;
}

export interface AgBaseRadarSeriesOptions<DatumType = any>
    extends AgRadarSeriesThemeableOptions<DatumType>,
        AgBaseSeriesOptions<DatumType> {
    type: 'radar-line' | 'radar-area';
    /** The key to use to retrieve angle values from the data. */
    angleKey: string;
    /** A human-readable description of the angle values. If supplied, this will be passed to the tooltip renderer as one of the parameters. */
    angleName?: string;
    /** The key to use to retrieve radius values from the data. */
    radiusKey: string;
    /** A human-readable description of the radius values. If supplied, this will be passed to the tooltip renderer as one of the parameters. */
    radiusName?: string;

    /** A map of event names to event listeners. */
    listeners?: AgSeriesListeners<DatumType>;
}

export interface AgRadarSeriesTooltipRendererParams extends AgSeriesTooltipRendererParams {
    /** xKey as specified on series options. */
    readonly angleKey: string;
    /** xValue as read from series data via the xKey property. */
    readonly angleValue?: any;
    /** xName as specified on series options. */
    readonly angleName?: string;

    /** yKey as specified on series options. */
    readonly radiusKey: string;
    /** yValue as read from series data via the yKey property. */
    readonly radiusValue?: any;
    /** yName as specified on series options. */
    readonly radiusName?: string;
}

export interface AgRadarSeriesMarkerFormatterParams<DatumType> extends AgSeriesMarkerFormatterParams<DatumType> {
    angleKey: string;
    radiusKey: string;
}

export interface AgRadarSeriesMarkerFormat {
    fill?: CssColor;
    stroke?: CssColor;
    strokeWidth?: PixelSize;
    size?: PixelSize;
}

export interface AgRadarSeriesMarker<DatumType> extends AgSeriesMarker {
    /** Function used to return formatting for individual markers, based on the supplied information. If the current marker is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    formatter?: AgRadarSeriesMarkerFormatter<DatumType>;
}

export type AgRadarSeriesMarkerFormatter<DatumType> = (
    params: AgRadarSeriesMarkerFormatterParams<DatumType>
) => AgRadarSeriesMarkerFormat | undefined;

export interface AgRadarSeriesLabelFormatterParams {
    /** The ID of the series. */
    readonly seriesId: string;
    /** The value of radiusKey as specified on series options. */
    readonly value: number;
}

export interface AgRadarSeriesLabelOptions extends AgChartLabelOptions {
    /** Function used to turn 'yKey' values into text to be displayed by a label. By default the values are simply stringified. */
    formatter?: (params: AgRadarSeriesLabelFormatterParams) => string;
}

/**
 * Internal Use Only: Used to ensure this file is treated as a module until we can use moduleDetection flag in Ts v4.7
 */
export const __FORCE_MODULE_DETECTION = 0;
