import type { AgDropShadowOptions } from '../../chart/dropShadowOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { PixelSize, TContextDefault, TDatumDefault } from '../../chart/types';
import type { AgInterpolationType } from '../interpolationOptions';
import type { AgSeriesMarkerOptions, AgSeriesMarkerStyle } from '../markerOptions';
import type { AgBaseCartesianThemeableOptions, AgBaseSeriesOptions, AgSeriesHighlightStyle } from '../seriesOptions';
import type { AgCartesianSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';
import type { FillOptions, LineDashOptions, StrokeOptions } from './commonOptions';

export interface AgRangeAreaSeriesTooltipRendererParams<TDatum = TDatumDefault>
    extends Omit<AgCartesianSeriesTooltipRendererParams<TDatum>, 'xKey' | 'xName' | 'yKey' | 'yName'>,
        AgRangeAreaSeriesOptionsKeys<TDatum>,
        AgRangeAreaSeriesOptionsNames,
        Omit<AgSeriesMarkerStyle, 'shape'> {
    /** Hovered marker */
    itemId: 'up' | 'down' | 'unknown';
}

export interface AgRangeAreaSeriesLabelOptions<TDatum, TParams> extends AgChartLabelOptions<TDatum, TParams> {
    /** Padding in pixels between the label and the edge of the marker. */
    padding?: PixelSize;
    /** Where to render series labels relative to the area. */
    placement?: AgRangeAreaSeriesLabelPlacement;
}

export type AgRangeAreaSeriesLabelPlacement = 'inside' | 'outside';

export type AgRangeAreaSeriesLabelFormatterParams<TDatum = TDatumDefault> = AgRangeAreaSeriesOptionsKeys<TDatum> &
    AgRangeAreaSeriesOptionsNames;

export interface AgRangeAreaSeriesThemeableOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends StrokeOptions,
        FillOptions,
        LineDashOptions,
        AgBaseCartesianThemeableOptions<TDatum, TContext> {
    /** Configuration for the markers used in the series.  */
    marker?: AgSeriesMarkerOptions<TDatum, AgRangeAreaSeriesOptionsKeys<TDatum>>;
    /** Configuration for the line used in the series. */
    interpolation?: AgInterpolationType;
    /** Configuration for the range series items when they are hovered over. */
    highlightStyle?: AgSeriesHighlightStyle;
    /** Configuration for the labels shown on top of data points. */
    label?: AgRangeAreaSeriesLabelOptions<TDatum, AgRangeAreaSeriesLabelFormatterParams<TDatum>>;
    /** Configuration for the shadow used behind the series items. */
    shadow?: AgDropShadowOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgRangeAreaSeriesTooltipRendererParams<TDatum>>;
    /** Set to `true` to connect across missing data points. */
    connectMissingData?: boolean;
}

export interface AgRangeAreaSeriesOptionsKeys<TDatum = TDatumDefault> {
    /** The key to use to retrieve x-values from the data. */
    xKey: TDatum extends object ? keyof TDatum & string : string;
    /** The key to use to retrieve y-low-values from the data. */
    yLowKey: TDatum extends object ? keyof TDatum & string : string;
    /** The key to use to retrieve y-high-values from the data. */
    yHighKey: TDatum extends object ? keyof TDatum & string : string;
}

export interface AgRangeAreaSeriesOptionsNames {
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** A human-readable description of the y-low-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yLowName?: string;
    /** A human-readable description of the y-high-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yHighName?: string;
    /** A human-readable description of the y-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yName?: string;
}

export interface AgRangeAreaSeriesOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseSeriesOptions<TDatum, TContext>,
        AgRangeAreaSeriesOptionsKeys<TDatum>,
        AgRangeAreaSeriesOptionsNames,
        AgRangeAreaSeriesThemeableOptions<TDatum, TContext> {
    /** Configuration for the Range Area Series. */
    type: 'range-area';
}
