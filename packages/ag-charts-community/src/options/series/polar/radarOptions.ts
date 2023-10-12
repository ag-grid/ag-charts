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
import type { AgRadialSeriesOptionsKeys, AgRadialSeriesOptionsNames } from './radialOptions';

export interface AgRadarSeriesThemeableOptions<TDatum = any>
    extends StrokeOptions,
        LineDashOptions,
        AgBaseSeriesThemeableOptions {
    marker?: AgRadarSeriesMarker<TDatum>;
    /** Configuration for the labels shown on top of data points. */
    label?: AgChartLabelOptions<TDatum, AgRadarSeriesLabelFormatterParams>;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgRadarSeriesTooltipRendererParams>;
}

export interface AgBaseRadarSeriesOptions<TDatum = any>
    extends AgBaseSeriesOptions<TDatum>,
        AgRadialSeriesOptionsKeys,
        AgRadialSeriesOptionsNames,
        AgRadarSeriesThemeableOptions<TDatum> {
    type: 'radar-line' | 'radar-area';
}

export type AgRadarSeriesTooltipRendererParams = AgSeriesTooltipRendererParams &
    AgRadialSeriesOptionsKeys &
    AgRadialSeriesOptionsNames;

export type AgRadarSeriesLabelFormatterParams = AgRadialSeriesOptionsKeys & AgRadialSeriesOptionsNames;

export type AgRadarSeriesMarkerFormatterParams<TDatum> = AgSeriesMarkerFormatterParams<TDatum> &
    AgRadialSeriesOptionsKeys;

export interface AgRadarSeriesMarkerFormat {
    fill?: CssColor;
    stroke?: CssColor;
    strokeWidth?: PixelSize;
    size?: PixelSize;
}

export interface AgRadarSeriesMarker<TDatum> extends AgSeriesMarker {
    /** Function used to return formatting for individual markers, based on the supplied information. If the current marker is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    formatter?: (params: AgRadarSeriesMarkerFormatterParams<TDatum>) => AgRadarSeriesMarkerFormat | undefined;
}

/**
 * Internal Use Only: Used to ensure this file is treated as a module until we can use moduleDetection flag in Ts v4.7
 */
export const __FORCE_MODULE_DETECTION = 0;
