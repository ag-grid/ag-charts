import type { DatumCallbackParams } from '../../chart/callbackOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { TContextDefault, TDatumDefault } from '../../chart/types';
import type { LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgSeriesMarkerOptions, AgSeriesMarkerStyle } from '../markerOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';
import type { AgRadialSeriesOptionsKeys, AgRadialSeriesOptionsNames } from './radialOptions';

export interface AgRadarSeriesThemeableOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends StrokeOptions,
        LineDashOptions,
        AgBaseSeriesThemeableOptions<TDatum, TContext> {
    /** Configuration for the markers used in the series. */
    marker?: AgSeriesMarkerOptions<TDatum, AgRadialSeriesOptionsKeys>;
    /** Configuration for the labels shown on top of data points. */
    label?: AgChartLabelOptions<TDatum, AgRadarSeriesLabelFormatterParams>;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgRadarSeriesTooltipRendererParams<TDatum>>;
    /** Set to `true` to connect across missing data points. */
    connectMissingData?: boolean;
}

export interface AgBaseRadarSeriesOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseSeriesOptions<TDatum, TContext>,
        AgRadialSeriesOptionsKeys,
        AgRadialSeriesOptionsNames,
        AgRadarSeriesThemeableOptions<TDatum, TContext> {
    type: 'radar-line' | 'radar-area';
}

export type AgRadarSeriesTooltipRendererParams<TDatum> = AgSeriesTooltipRendererParams<TDatum> &
    AgRadialSeriesOptionsKeys &
    AgRadialSeriesOptionsNames &
    Omit<AgSeriesMarkerStyle, 'shape'>;

export type AgRadarSeriesItemStylerParams<TDatum> = DatumCallbackParams<TDatum> &
    AgRadialSeriesOptionsKeys &
    StrokeOptions &
    LineDashOptions;

export type AgRadarSeriesLabelFormatterParams = AgRadialSeriesOptionsKeys & AgRadialSeriesOptionsNames;
