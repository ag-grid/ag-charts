import type { AgSeriesTooltip } from '../../agChartOptions';
import type { AgChartCallbackParams } from '../../chart/callbackOptions';
import type { CssColor } from '../../chart/types';
import type { FillOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions, AgSeriesHighlightStyle } from '../seriesOptions';

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

export interface AgSunburstSeriesHighlightStyle<_TDatum> extends AgSeriesHighlightStyle, FillOptions, StrokeOptions {}

export interface AgSunburstSeriesThemeableOptions<TDatum = any>
    extends Omit<AgBaseSeriesThemeableOptions, 'highlightStyle'>,
        FillOptions,
        StrokeOptions {
    /** Spacing between the sectors */
    spacing?: number;
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

/** The formatted style of a sunburst sector */
export interface AgSunburstSeriesStyle extends FillOptions, StrokeOptions {}
