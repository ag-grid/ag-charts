import type { ContextDefault, DatumDefault, Opacity } from '../../chart/types';
import type { LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseRadarSeriesOptions, AgRadarSeriesStyle, AgRadarSeriesStylerParams } from './radarOptions';

export interface AgRadarLineSeriesStyle extends AgRadarSeriesStyle {}

export interface AgRadarLineSeriesStylerParams<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgRadarSeriesStylerParams<TDatum, TContext, AgRadarLineSeriesStyle> {}

export interface AgRadarLineSeriesOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgBaseRadarSeriesOptions<TDatum, TContext> {
    /** Configuration for the Radar Line Series. */
    type: 'radar-line';
}

export interface AgRadarLineHighlightStyleOptions extends StrokeOptions, LineDashOptions {
    /** The opacity of the whole series (line, fill, labels and markers, if any) */
    opacity?: Opacity;
}
