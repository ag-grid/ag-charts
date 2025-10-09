import type { ContextCallbackParams, SeriesCallbackParams, Styler } from '../../chart/callbackOptions';
import type { AgDropShadowOptions } from '../../chart/dropShadowOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { ContextDefault, CssColor, DatumDefault, DatumKey, Opacity, PixelSize } from '../../chart/types';
import type { AgInterpolationType } from '../interpolationOptions';
import type { AgSeriesMarkerOptions, AgSeriesMarkerStyle } from '../markerOptions';
import type {
    AgBaseCartesianThemeableOptions,
    AgBaseSeriesOptions,
    AgHighlightStyleOptions,
    AgMultiSeriesHighlightOptions,
    AgSeriesHighlightStyle,
    AgSeriesSegmentation,
    AgSeriesShapeSegmentOptions,
} from '../seriesOptions';
import type { AgCartesianSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';
import type { FillOptions, LineDashOptions, StrokeOptions } from './commonOptions';

interface DeprecatedRangeAreaSeriesStyleOptions<TMarker extends AgSeriesMarkerStyle> {
    /** @deprecated Use `item` styling. Configuration for the markers used in the series.  */
    marker?: TMarker;
    /** @deprecated Use `item` styling. The colour for the stroke. */
    stroke?: CssColor;
    /** @deprecated Use `item` styling. The width of the stroke in pixels. */
    strokeWidth?: PixelSize;
    /** @deprecated Use `item` styling. The opacity of the stroke colour. */
    strokeOpacity?: Opacity;
    /** @deprecated Use `item` styling. An array specifying the length in pixels of alternating dashes and gaps. */
    lineDash?: PixelSize[];
    /** @deprecated Use `item` styling. The initial offset of the dashed line in pixels. */
    lineDashOffset?: PixelSize;
}

export interface AgRangeAreaSeriesStylerParams<TDatum, TContext>
    extends SeriesCallbackParams,
        ContextCallbackParams<TContext>,
        AgRangeAreaSeriesOptionsKeys<TDatum>,
        Required<AgRangeAreaSeriesStyle> {}

export interface AgRangeAreaSeriesLineStyle extends StrokeOptions, LineDashOptions {
    /** Styling for the markers used in the item.  */
    marker?: AgSeriesMarkerStyle;
}

export interface AgRangeAreaSeriesStyle extends FillOptions {
    /** Configuration used for the range area series high & low lines. */
    item?: {
        /** Configuration for the bottom line (defined by the `yLowKey`). */
        low?: AgRangeAreaSeriesLineStyle;
        /** Configuration for the top line (defined by the `yHighKey`). */
        high?: AgRangeAreaSeriesLineStyle;
    };
}

export type AgRangeAreaSeriesItemType = 'low' | 'high';

export interface AgRangeAreaSeriesTooltipRendererParams<TDatum = DatumDefault, TContext = ContextDefault>
    extends Omit<AgCartesianSeriesTooltipRendererParams<TDatum, TContext>, 'xKey' | 'xName' | 'yKey' | 'yName'>,
        AgRangeAreaSeriesOptionsKeys<TDatum>,
        AgRangeAreaSeriesOptionsNames,
        Omit<AgSeriesMarkerStyle, 'shape'> {
    /** The Id to distinguish the type of datum. This can be `up` or `down`. */
    itemId: AgRangeAreaSeriesItemType;
}

export interface AgRangeAreaSeriesItemStylerParams<TDatum> extends AgRangeAreaSeriesOptionsKeys<TDatum> {
    /** The Id to distinguish the type of datum. This can be `up` or `down`. */
    itemId: AgRangeAreaSeriesItemType;
}

export interface AgRangeAreaSeriesLabelOptions<TDatum, TParams, TContext = ContextDefault>
    extends AgChartLabelOptions<TDatum, TParams, TContext> {
    /** Where to render series labels relative to the area. */
    placement?: AgRangeAreaSeriesLabelPlacement;
    /** Spacing in pixels between the label and the edge of the marker. */
    spacing?: PixelSize;
}

export type AgRangeAreaSeriesLabelPlacement = 'inside' | 'outside';

export type AgRangeAreaSeriesLabelFormatterParams<TDatum = DatumDefault> = AgRangeAreaSeriesOptionsKeys<TDatum> &
    AgRangeAreaSeriesOptionsNames;

type RangeAreaMarker<TDatum, TContext> = AgSeriesMarkerOptions<
    TDatum,
    AgRangeAreaSeriesItemStylerParams<TDatum>,
    TContext
>;

export interface AgRangeAreaSeriesLineThemeableOptions<TDatum, TContext> extends StrokeOptions, LineDashOptions {
    /** Styling configuration for the markers used in the series.  */
    marker?: RangeAreaMarker<TDatum, TContext>;
}

export interface AgRangeAreaSeriesThemeableOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends DeprecatedRangeAreaSeriesStyleOptions<RangeAreaMarker<TDatum, TContext>>,
        FillOptions,
        AgBaseCartesianThemeableOptions<TDatum, TContext> {
    /** Configuration used for the range area series high & low lines. */
    item?: {
        /** Configuration for the bottom line (defined by the `yLowKey`). */
        low?: AgRangeAreaSeriesLineThemeableOptions<TDatum, TContext>;
        /** Configuration for the top line (defined by the `yHighKey`). */
        high?: AgRangeAreaSeriesLineThemeableOptions<TDatum, TContext>;
    };
    /** Configuration for the line used in the series. */
    interpolation?: AgInterpolationType;
    /** @deprecated Configuration for the range series items when they are hovered over. */
    highlightStyle?: AgSeriesHighlightStyle;
    /** Configuration for the labels shown on top of data points. */
    label?: AgRangeAreaSeriesLabelOptions<TDatum, AgRangeAreaSeriesLabelFormatterParams<TDatum>, TContext>;
    /** Configuration for the shadow used behind the series items. */
    shadow?: AgDropShadowOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgRangeAreaSeriesTooltipRendererParams<TDatum, TContext>>;
    /** Set to `true` to connect across missing data points. */
    connectMissingData?: boolean;
    /** Function used to return formatting for entire series, based on the given parameters. If the current bar is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    styler?: Styler<AgRangeAreaSeriesStylerParams<TDatum, TContext>, AgRangeAreaSeriesStyle>;
    /** Configuration for highlighting when a series or legend item is hovered over. */
    highlight?: AgMultiSeriesHighlightOptions<AgHighlightStyleOptions, AgHighlightStyleOptions>;
    /** Configuration for styling series as separate segments. */
    segmentation?: AgSeriesSegmentation<AgSeriesShapeSegmentOptions>;
    /** Style options for the area when the yHigh value is lower than the yLow value, when the area is inverted. */
    invertedStyle?: AgRangeAreaSeriesInvertedStyle;
}

export type AgRangeAreaSeriesInvertedStyle = FillOptions & {
    enabled?: boolean;
};

export interface AgRangeAreaSeriesOptionsKeys<TDatum = DatumDefault> {
    /** The key to use to retrieve x-values from the data. */
    xKey: DatumKey<TDatum>;
    /** The key to use to retrieve y-low-values from the data. */
    yLowKey: DatumKey<TDatum>;
    /** The key to use to retrieve y-high-values from the data. */
    yHighKey: DatumKey<TDatum>;
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

export interface AgRangeAreaSeriesOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends Omit<AgBaseSeriesOptions<TDatum, TContext>, 'highlight'>,
        AgRangeAreaSeriesOptionsKeys<TDatum>,
        AgRangeAreaSeriesOptionsNames,
        AgRangeAreaSeriesThemeableOptions<TDatum, TContext> {
    /** Configuration for the Range Area Series. */
    type: 'range-area';
}
