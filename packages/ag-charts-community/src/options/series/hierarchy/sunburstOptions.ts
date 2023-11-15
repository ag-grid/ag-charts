import type { AgChartCallbackParams } from '../../chart/callbackOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { CssColor, FontSize, Opacity, PixelSize, TextOverflow, TextWrap } from '../../chart/types';
import type { FillOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions, AgSeriesHighlightStyle } from '../seriesOptions';

/* All the label properties that can be changed without affecting the layout */
export type AgSunburstSeriesLabelHighlightOptions<TDatum> = Pick<
    AgChartLabelOptions<TDatum, AgSunburstSeriesLabelFormatterParams<TDatum>>,
    'color'
>;

export interface AgSunburstSeriesTooltipRendererParams<TDatum>
    extends AgChartCallbackParams<TDatum>,
        AgSunburstSeriesOptionsKeys {
    /** The depth of the datum in the hierarchy. */
    depth: number;
    /** The title of the sunburst segment.ß */
    title?: string;
    /** The computed fill color of the sunburst segment. */
    color?: CssColor;
}

export interface AgSunburstSeriesHighlightStyle<TDatum> extends AgSeriesHighlightStyle, FillOptions, StrokeOptions {
    /** Options for the label in a sector */
    label?: AgSunburstSeriesLabelHighlightOptions<TDatum>;
    /* Options for a secondary, smaller label in a sector - displayed under the primary label */
    secondaryLabel?: AgSunburstSeriesLabelHighlightOptions<TDatum>;
}

export interface AgSunburstSeriesBaseLabelOptions<TDatum>
    extends AgChartLabelOptions<TDatum, AgSunburstSeriesLabelFormatterParams<TDatum>> {
    minimumFontSize?: FontSize;

    wrapping?: TextWrap;

    overflow?: TextOverflow;
}

export interface AgSunburstSeriesLabelOptions<TDatum> extends AgSunburstSeriesBaseLabelOptions<TDatum> {
    /** The distance between the label and secondary label, if both are present */
    spacing?: PixelSize;
}

export interface AgSunburstSeriesThemeableOptions<TDatum = any>
    extends Omit<AgBaseSeriesThemeableOptions, 'highlightStyle'> {
    /** Options for the label in a sector */
    label?: AgSunburstSeriesBaseLabelOptions<TDatum>;
    /* Options for a secondary, smaller label in a sector - displayed under the primary label */
    secondaryLabel?: AgSunburstSeriesBaseLabelOptions<TDatum>;
    /** Spacing between the sectors */
    sectorSpacing?: number;
    /** Minimum distance between text and the edges of the sectors */
    padding?: number;
    /** The colours to cycle through for the fills of the sectors. */
    fills?: CssColor[];
    /** The colours to cycle through for the strokes of the sectors. */
    strokes?: CssColor[];
    /** The opacity of the fill for the sectors. */
    fillOpacity?: Opacity;
    /** The opacity of the stroke for the sectors. */
    strokeOpacity?: Opacity;
    /** The width in pixels of the stroke for the sectors. */
    strokeWidth?: PixelSize;
    /** The color range to interpolate. */
    colorRange?: CssColor[];
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgSunburstSeriesTooltipRendererParams<TDatum>>;
    /** A callback function for adjusting the styles of a particular sunburst tile based on the input parameters */
    formatter?: (params: AgSunburstSeriesFormatterParams<TDatum>) => AgSunburstSeriesStyle;
    /** */
    highlightStyle?: AgSunburstSeriesHighlightStyle<TDatum>;
}

export interface AgSunburstSeriesOptions<TDatum = any>
    extends Omit<AgBaseSeriesOptions<TDatum>, 'highlightStyle'>,
        AgSunburstSeriesOptionsKeys,
        AgSunburstSeriesThemeableOptions<TDatum> {
    /** Configuration for the sunburst series. */
    type: 'sunburst';
}

export interface AgSunburstSeriesOptionsKeys {
    /** The name of the node key containing the label. */
    labelKey?: string;
    /** The name of the node key containing a secondary label. */
    secondaryLabelKey?: string;
    /** The name of the node key containing the children. Defaults to `children`. */
    childrenKey?: string;
    /** The name of the node key containing the size value. */
    sizeKey?: string;
    /** The name of the node key containing the color value. This value (along with `colorRange` config) will be used to determine the segment color. */
    colorKey?: string;
}

/** The parameters of the sunburst series formatter function */
export interface AgSunburstSeriesFormatterParams<TDatum = any>
    extends AgChartCallbackParams<TDatum>,
        AgSunburstSeriesOptionsKeys,
        AgSunburstSeriesStyle {
    /** The depth of the datum in the hierarchy. */
    depth: number;
    /** `true` if the tile is highlighted by hovering */
    readonly highlighted: boolean;
}

export interface AgSunburstSeriesLabelFormatterParams<_TDatum = any> extends AgSunburstSeriesOptionsKeys {
    /** The depth of the datum in the hierarchy. */
    depth: number;
}

/** The formatted style of a sunburst sector */
export interface AgSunburstSeriesStyle extends FillOptions, StrokeOptions {}
