import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { CssColor, PixelSize } from '../../chart/types';
import type { LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type {
    AgBaseSeriesOptions,
    AgBaseSeriesThemeableOptions,
    AgSeriesMarker,
    AgSeriesMarkerFormatterParams,
} from '../seriesOptions';

export interface AgRadarSeriesThemeableOptions<TDatum = any>
    extends StrokeOptions,
        LineDashOptions,
        AgBaseSeriesThemeableOptions {
    marker?: AgRadarSeriesMarker<TDatum>;
    /** Configuration for the labels shown on top of data points. */
    label?: AgChartLabelOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgRadarSeriesTooltipRendererParams>;
}

export interface AgBaseRadarSeriesOptions<TDatum = any>
    extends AgRadarSeriesThemeableOptions<TDatum>,
        AgBaseSeriesOptions<TDatum> {
    type: 'radar-line' | 'radar-area';
    /** The key to use to retrieve angle values from the data. */
    angleKey: string;
    /** A human-readable description of the angle values. If supplied, this will be passed to the tooltip renderer as one of the parameters. */
    angleName?: string;
    /** The key to use to retrieve radius values from the data. */
    radiusKey: string;
    /** A human-readable description of the radius values. If supplied, this will be passed to the tooltip renderer as one of the parameters. */
    radiusName?: string;
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

export interface AgRadarSeriesMarkerFormatterParams<TDatum> extends AgSeriesMarkerFormatterParams<TDatum> {
    angleKey: string;
    radiusKey: string;
}

export interface AgRadarSeriesMarkerFormat {
    fill?: CssColor;
    stroke?: CssColor;
    strokeWidth?: PixelSize;
    size?: PixelSize;
}

export interface AgRadarSeriesMarker<TDatum> extends AgSeriesMarker {
    /** Function used to return formatting for individual markers, based on the supplied information. If the current marker is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    formatter?: AgRadarSeriesMarkerFormatter<TDatum>;
}

export type AgRadarSeriesMarkerFormatter<TDatum> = (
    params: AgRadarSeriesMarkerFormatterParams<TDatum>
) => AgRadarSeriesMarkerFormat | undefined;

/**
 * Internal Use Only: Used to ensure this file is treated as a module until we can use moduleDetection flag in Ts v4.7
 */
export const __FORCE_MODULE_DETECTION = 0;
