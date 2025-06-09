import type { DatumCallbackParams } from '../../chart/callbackOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { TContextDefault, TDatumDefault } from '../../chart/types';
import type { LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgSeriesMarkerOptions, AgSeriesMarkerStyle } from '../markerOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';
import type { AgRadialSeriesOptionsKeys, AgRadialSeriesOptionsNames } from './radialOptions';

export interface AgRadarSeriesThemeableOptions<TDatum = TDatumDefault>
    extends StrokeOptions,
        LineDashOptions,
        AgBaseSeriesThemeableOptions<TDatum> {
    /** Configuration for the markers used in the series. */
    marker?: AgSeriesMarkerOptions<TDatum, AgRadialSeriesOptionsKeys<TDatum>>;
    /** Configuration for the labels shown on top of data points. */
    label?: AgChartLabelOptions<TDatum, AgRadarSeriesLabelFormatterParams<TDatum>>;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgRadarSeriesTooltipRendererParams<TDatum>>;
    /** Set to `true` to connect across missing data points. */
    connectMissingData?: boolean;
}

export interface AgBaseRadarSeriesOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseSeriesOptions<TDatum, TContext>,
        AgRadialSeriesOptionsKeys<TDatum>,
        AgRadialSeriesOptionsNames,
        AgRadarSeriesThemeableOptions<TDatum> {
    type: 'radar-line' | 'radar-area';
}

export type AgRadarSeriesTooltipRendererParams<TDatum = TDatumDefault> = AgSeriesTooltipRendererParams<TDatum> &
    AgRadialSeriesOptionsKeys<TDatum> &
    AgRadialSeriesOptionsNames &
    Omit<AgSeriesMarkerStyle, 'shape'>;

export type AgRadarSeriesItemStylerParams<TDatum = TDatumDefault> = DatumCallbackParams<TDatum> &
    AgRadialSeriesOptionsKeys<TDatum> &
    StrokeOptions &
    LineDashOptions;

export type AgRadarSeriesLabelFormatterParams<TDatum = TDatumDefault> = AgRadialSeriesOptionsKeys<TDatum> &
    AgRadialSeriesOptionsNames;
