import type { Styler } from '../../chart/callbackOptions';
import type { AgNumberAxisOptions, AgSeriesAreaBackgroundRegion } from '../../chart/cartesianOptions';
import type { AgNumericValue } from '../../chart/dataValues';
import type { DatumKey, PixelSize } from '../../chart/types';
import type {
    AgScatterSeriesItemStylerParams,
    AgScatterSeriesOptionsKeys,
    AgScatterSeriesOptionsNames,
    AgScatterSeriesThemeableOptions,
} from '../../series/cartesian/scatterOptions';
import type { AgSeriesMarkerStyle } from '../../series/markerOptions';

export type AgQuadrantChartPresets<TDatum, TContext> = AgQuadrantPreset<TDatum, TContext>;

export interface AgQuadrantPreset<TDatum, TContext>
    extends
        Omit<AgScatterSeriesOptionsKeys<TDatum>, 'colorKey'>,
        Omit<AgScatterSeriesOptionsNames, 'colorName' | 'legendItemName'>,
        Omit<
            AgScatterSeriesThemeableOptions<TDatum, TContext>,
            'colorScale' | 'itemStyler' | 'showInLegend' | 'showInMiniChart' | 'title'
        > {
    /** Whether to move the axis lines so that they cross at the pivot, with the axis titles remaining at the edge of
     * the chart. When `false`, the axes stay at the bottom and left of the chart. The regions are divided at the
     * pivot either way.
     *
     * Default: `true`
     */
    alignAxesToPivot?: boolean;
    /** Function used to return formatting for individual markers, based on the supplied information.
     */
    itemStyler?: Styler<AgQuadrantItemStylerParams<TDatum, TContext>, AgQuadrantRegionMarkerStyle>;
    /** The data values at which the chart is divided into four regions. */
    pivot?: AgQuadrantPivotOptions;
    /** Configuration for each of the four regions the pivot divides the chart into. */
    regions?: AgQuadrantRegionsOptions;
    /** The key to use to retrieve size values from the data, used to control the size of the markers. */
    sizeKey?: DatumKey<TDatum>;
    /** Determines the smallest size a marker can be in pixels when `sizeKey` is present. Defaults to `size` when not set. */
    minSize?: PixelSize;
    /** Determines the largest size a marker can be in pixels when `sizeKey` is present. */
    maxSize?: PixelSize;
    /** Configuration for the horizontal axis, which is always a number axis. Its labels and ticks are hidden by
     * default, and its line is drawn more heavily than a standard axis line.
     */
    xAxis?: AgQuadrantAxisOptions<TContext>;
    /** Configuration for the vertical axis, which is always a number axis. Its labels and ticks are hidden by
     * default, and its line is drawn more heavily than a standard axis line.
     */
    yAxis?: AgQuadrantAxisOptions<TContext>;
}

export interface AgQuadrantPivotOptions {
    /** The x-value at which the chart is divided into left and right regions.
     *
     * Default: `0`
     */
    x?: AgNumericValue;
    /** The y-value at which the chart is divided into bottom and top regions.
     *
     * Default: `0`
     */
    y?: AgNumericValue;
}

export interface AgQuadrantRegionsOptions {
    /** Configuration for the region containing values below the pivot on the x-axis and above it on the y-axis. */
    topLeft?: AgQuadrantRegionOptions;
    /** Configuration for the region containing values above the pivot on both axes. */
    topRight?: AgQuadrantRegionOptions;
    /** Configuration for the region containing values below the pivot on both axes. */
    bottomLeft?: AgQuadrantRegionOptions;
    /** Configuration for the region containing values above the pivot on the x-axis and below it on the y-axis. */
    bottomRight?: AgQuadrantRegionOptions;
}

export interface AgQuadrantRegionOptions extends Omit<AgSeriesAreaBackgroundRegion, 'xRange' | 'yRange'> {
    /** Styling for the markers of the data points that fall within this region. When `fill` is omitted, markers use
     * the region's own `fill` at full opacity.
     */
    marker?: AgQuadrantRegionMarkerStyle;
}

export interface AgQuadrantRegionMarkerStyle extends AgSeriesMarkerStyle {}

export interface AgQuadrantAxisOptions<TContext> extends Omit<
    AgNumberAxisOptions<TContext>,
    'crossAt' | 'crossLines' | 'keys' | 'reverse' | 'position' | 'type'
> {}

export interface AgQuadrantItemStylerParams<TDatum, TContext> extends AgScatterSeriesItemStylerParams<
    TDatum,
    TContext
> {
    /** The region the marker falls in, determined by comparing its x- and y-values against the pivot. */
    region: AgQuadrantRegion;
}

export type AgQuadrantRegion = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
