import type { DatumCallbackParams, Styler } from '../../chart/callbackOptions';
import type { AgChartAutoSizedSecondaryLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { PixelSize, TContextDefault, TDatumDefault, TextAlign, VerticalAlign } from '../../chart/types';
import type { AgBaseCartesianThemeableOptions, AgBaseSeriesOptions } from '../seriesOptions';
import type { FillOptions, StrokeOptions } from './commonOptions';

export type AgHeatmapSeriesItemStylerParams<TDatum = TDatumDefault> = DatumCallbackParams<TDatum> &
    AgHeatmapSeriesOptionsKeys<TDatum> &
    Required<AgHeatmapSeriesStyle>;

export type AgHeatmapSeriesStyle = FillOptions & StrokeOptions;

export type AgHeatmapSeriesLabelFormatterParams<TDatum = TDatumDefault> = AgHeatmapSeriesOptionsKeys<TDatum> &
    AgHeatmapSeriesOptionsNames;

export type AgHeatmapSeriesTooltipRendererParams<TDatum = TDatumDefault> = AgSeriesTooltipRendererParams<TDatum> &
    AgHeatmapSeriesOptionsKeys<TDatum> &
    AgHeatmapSeriesOptionsNames &
    AgHeatmapSeriesStyle;

export interface AgHeatmapSeriesThemeableOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends StrokeOptions,
        AgBaseCartesianThemeableOptions<TDatum, TContext> {
    /** Options for the label in each cell. */
    label?: AgChartAutoSizedSecondaryLabelOptions<TDatum, AgHeatmapSeriesLabelFormatterParams<TDatum>>;
    /** Minimum distance between the label text and the edges of the cell. */
    itemPadding?: PixelSize;
    /** Horizontal position of the label. */
    textAlign?: TextAlign;
    /** Vertical position of the label. */
    verticalAlign?: VerticalAlign;
    /** The title to use for the series. Defaults to `yName` if it exists, or `yKey` if not. */
    title?: string;
    /** Function used to return formatting for individual heatmap cells, based on the given parameters. If the current cell is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    itemStyler?: Styler<AgHeatmapSeriesItemStylerParams<TDatum>, AgHeatmapSeriesStyle>;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgHeatmapSeriesTooltipRendererParams<TDatum>>;
}

export interface AgHeatmapSeriesOptionsKeys<TDatum = TDatumDefault> {
    /** The key to use to retrieve x-values from the data. */
    xKey: TDatum extends object ? keyof TDatum & string : string;
    /** The key to use to retrieve y-values from the data. */
    yKey: TDatum extends object ? keyof TDatum & string : string;
    /** The name of the node key containing the colour value. This value (along with `colorRange` configs) will be used to determine the cell colour. */
    colorKey?: TDatum extends object ? keyof TDatum & string : string;
}

export interface AgHeatmapSeriesOptionsNames {
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** A human-readable description of the y-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yName?: string;
    /** A human-readable description of the colour values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    colorName?: string;
}

export interface AgHeatmapSeriesOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseSeriesOptions<TDatum, TContext>,
        AgHeatmapSeriesOptionsKeys<TDatum>,
        AgHeatmapSeriesOptionsNames,
        AgHeatmapSeriesThemeableOptions<TDatum, TContext> {
    /** Configuration for the Heatmap Series. */
    type: 'heatmap';
    /** The colour range to interpolate the numeric colour domain (min and max `colorKey` values) into. For example, if the colour domain is `[-5, 5]` and `colorRange` is `['red', 'green']`, a `colorKey` value of `-5` will be assigned the 'red' colour, `5` - 'green' colour and `0` a blend of 'red' and 'green'. */
    colorRange?: string[];
}
