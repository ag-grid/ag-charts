import type { RichFormatter, Styler } from '../../chart/callbackOptions';
import type {
    AgCartesianAxisCrossAtPlacement,
    AgNumberAxisOptions,
    AgSeriesAreaBackgroundRegion,
    AgSeriesAreaBackgroundRegionLabel,
} from '../../chart/cartesianOptions';
import type { AgNumericValue } from '../../chart/dataValues';
import type { AgErrorBarOptions } from '../../chart/errorBarOptions';
import type {
    AgChartLabelFormatterParams,
    AgChartLabelStyleOptions,
    AgChartLabelStylerParams,
} from '../../chart/labelOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { DatumKey, PixelSize } from '../../chart/types';
import type {
    AgScatterSeriesItemStylerParams,
    AgScatterSeriesLabel,
    AgScatterSeriesLabelFormatterParams,
    AgScatterSeriesOptionsKeys,
    AgScatterSeriesOptionsNames,
    AgScatterSeriesThemeableOptions,
    AgScatterSeriesTooltipRendererParams,
} from '../../series/cartesian/scatterOptions';
import type { AgSeriesMarkerStyle } from '../../series/markerOptions';

export type AgQuadrantChartPresets<TDatum, TContext> = AgQuadrantPreset<TDatum, TContext>;

export interface AgQuadrantPreset<TDatum, TContext>
    extends
        Omit<AgScatterSeriesOptionsKeys<TDatum>, 'colorKey'>,
        Omit<AgScatterSeriesOptionsNames, 'colorName' | 'legendItemName'>,
        Omit<
            AgScatterSeriesThemeableOptions<TDatum, TContext>,
            | 'colorScale'
            | 'errorBar'
            | 'itemStyler'
            | 'label'
            | 'showInLegend'
            | 'showInMiniChart'
            | 'title'
            | 'tooltip'
        > {
    /** Whether to move the axis lines so that they cross at the pivot, with the axis titles remaining at the edge of
     * the chart. When `false`, the axes stay at the bottom and left of the chart. The regions are divided at the
     * pivot either way.
     *
     * Default: `true`
     */
    alignAxesToPivot?: boolean;
    /** Configuration for placement of axis titles and labels. */
    axisPlacement?: AgQuadrantAxisPlacementOptions;
    /** Configuration for the Error Bars. */
    errorBar?: AgErrorBarOptions<TDatum, TContext>;
    /** Function used to return formatting for individual markers, based on the supplied information.*/
    itemStyler?: Styler<AgQuadrantItemStylerParams<TDatum, TContext>, AgQuadrantRegionMarkerStyle>;
    /** Configuration for the labels shown on top of data points. */
    label?: AgQuadrantLabelOptions<TDatum, TContext>;
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
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgQuadrantTooltipRendererParams<TDatum, TContext>>;
    /** Configuration for the horizontal axis, which is always a number axis. Its ticks are hidden by default. */
    xAxis?: AgQuadrantAxisOptions<TContext>;
    /** Configuration for the vertical axis, which is always a number axis. Its ticks are hidden by default. */
    yAxis?: AgQuadrantAxisOptions<TContext>;
}

export interface AgQuadrantAxisPlacementOptions {
    /**
     * Whether the axis title is placed at the crossing point, or at the axis' `position` edge.
     *
     * Default: `'edge'`
     */
    title?: AgCartesianAxisCrossAtPlacement;
    /**
     * Whether the axis labels are placed at the crossing point, or at the axis' `position` edge.
     *
     * Default: `'edge'`
     */
    label?: AgCartesianAxisCrossAtPlacement;
    /**
     * Whether the crosshair label is placed at the crossing point, or at the axis' `position` edge.
     *
     * Default: `'edge'`
     */
    crosshairLabel?: AgCartesianAxisCrossAtPlacement;
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
    /** Configuration for labels shared across every region. */
    label?: AgQuadrantRegionsLabelOptions;
    /** Configuration for the region containing values below the pivot on the x-axis and above it on the y-axis. */
    topLeft?: AgQuadrantRegionOptions;
    /** Configuration for the region containing values above the pivot on both axes. */
    topRight?: AgQuadrantRegionOptions;
    /** Configuration for the region containing values below the pivot on both axes. */
    bottomLeft?: AgQuadrantRegionOptions;
    /** Configuration for the region containing values above the pivot on the x-axis and below it on the y-axis. */
    bottomRight?: AgQuadrantRegionOptions;
}

export interface AgQuadrantRegionsLabelOptions extends Omit<
    AgSeriesAreaBackgroundRegionLabel,
    'position' | 'text' | 'xOffset' | 'yOffset'
> {
    /** The placement of the label within its region, resolved relative to the pivot so that one value places all
     * four region labels symmetrically.
     *
     * Default: `'inside-outer-outer'`
     */
    position?: AgQuadrantRegionLabelPosition;
    /** The distance in pixels between the label and the region edges its `position` places it against, moving it
     * away from those edges.
     *
     * Default: `10`
     */
    spacing?: PixelSize;
}

export interface AgQuadrantRegionLabelOptions extends AgQuadrantRegionsLabelOptions {
    /** The text to show in the label. */
    text?: string;
}

/** A region label placement, in which `inner` is towards the pivot, `outer` towards the edge of the series area,
 * and `center` midway between them. The first token of an `inside` placement places the label vertically,
 * against the top or bottom edge, and the second horizontally, against the left or right edge.
 */
export type AgQuadrantRegionLabelPosition =
    | 'outside-outer'
    | 'outside-center'
    | 'outside-inner'
    | 'inside-outer-outer'
    | 'inside-outer-center'
    | 'inside-outer-inner'
    | 'inside-center-outer'
    | 'inside-center'
    | 'inside-center-inner'
    | 'inside-inner-outer'
    | 'inside-inner-center'
    | 'inside-inner-inner';

export interface AgQuadrantRegionOptions extends Omit<AgSeriesAreaBackgroundRegion, 'label' | 'xRange' | 'yRange'> {
    /** Configuration for the label displayed with the region. */
    label?: AgQuadrantRegionLabelOptions;
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

export interface AgQuadrantTooltipRendererParams<TDatum, TContext> extends AgScatterSeriesTooltipRendererParams<
    TDatum,
    TContext
> {
    /** The region the marker falls in, determined by comparing its x- and y-values against the pivot. */
    region: AgQuadrantRegion;
}

export interface AgQuadrantLabelOptions<TDatum, TContext> extends Omit<
    AgScatterSeriesLabel<TDatum, TContext>,
    'formatter' | 'itemStyler'
> {
    /** A custom formatting function used to convert data values into text for display by labels. */
    formatter?: RichFormatter<AgChartLabelFormatterParams<TDatum, TContext> & AgQuadrantLabelFormatterParams<TDatum>>;
    /** Function used to style individual datum labels. */
    itemStyler?: Styler<
        AgChartLabelStylerParams<TDatum, TContext> & AgQuadrantLabelFormatterParams<TDatum>,
        AgChartLabelStyleOptions
    >;
}

export interface AgQuadrantLabelFormatterParams<TDatum> extends AgScatterSeriesLabelFormatterParams<TDatum> {
    /** The region the marker falls in, determined by comparing its x- and y-values against the pivot. */
    region: AgQuadrantRegion;
}

export type AgQuadrantRegion = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
