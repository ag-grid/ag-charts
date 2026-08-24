import type { ContextCallbackParams, DatumCallbackParams, HighlightState, Styler } from '../../chart/callbackOptions';
import type { AgFunnelSeriesLabelPlacement } from '../../chart/collisionAvoidanceOptions';
import type { AgDropShadowOptions } from '../../chart/dropShadowOptions';
import type {
    AgChartLabelCollisionFitOptions,
    AgChartLabelOptions,
    AgSeriesLabelPlacementStyleOptions,
} from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { ContextDefault, CssColor, DatumDefault, DatumKey, Opacity, PixelSize } from '../../chart/types';
import type { AgColorType, FillOptions, LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';

export interface AgPyramidSeriesLabelOptions<TDatum, TParams, TContext = ContextDefault>
    extends
        AgChartLabelOptions<TDatum, TParams, TContext>,
        AgChartLabelCollisionFitOptions,
        AgSeriesLabelPlacementStyleOptions {
    /**
     * Where to render series labels relative to the stages. Either a single placement or an ordered
     * fallback list tried in turn until one fits.
     */
    placement?: AgFunnelSeriesLabelPlacement | AgFunnelSeriesLabelPlacement[];
    /** Distance between the stage edges and the text. */
    spacing?: PixelSize;
}

export interface AgPyramidSeriesStageLabelOptions<
    TDatum,
    TParams,
    TContext = ContextDefault,
> extends AgChartLabelOptions<TDatum, TParams, TContext> {
    /** Placement of the label in relation to the chart. */
    placement?: 'before' | 'after';
    /** Spacing of the label in relation to the chart. */
    spacing?: number;
}

export interface AgPyramidSeriesItemStylerParams<TDatum, TContext = ContextDefault>
    extends
        DatumCallbackParams<TDatum, HighlightState>,
        ContextCallbackParams<TContext>,
        AgPyramidSeriesOptionsKeys<TDatum>,
        Required<AgPyramidSeriesStyle> {}

export interface AgPyramidSeriesStyle extends FillOptions, StrokeOptions, LineDashOptions {}

export interface AgPyramidSeriesLabelFormatterParams<
    TDatum = DatumDefault,
> extends AgPyramidSeriesOptionsKeys<TDatum> {}

export interface AgPyramidSeriesTooltipRendererParams<TDatum = DatumDefault, TContext = ContextDefault>
    extends
        AgPyramidSeriesOptionsKeys<TDatum>,
        AgPyramidSeriesOptionsNames,
        AgSeriesTooltipRendererParams<TDatum, TContext>,
        AgPyramidSeriesStyle {}

export interface AgPyramidSeriesThemeableOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends Omit<AgBaseSeriesThemeableOptions<TDatum, TContext>, 'selection'>, LineDashOptions {
    /** The colours to cycle through for the fills of the stages. An array of colour strings, or fill objects for gradients, patterns, or images. */
    fills?: AgColorType[];
    /** The colours to cycle through for the strokes of the stages. */
    strokes?: CssColor[];
    /** The opacity of the fill for the stages. */
    fillOpacity?: Opacity;
    /** The opacity of the stroke for the stages. */
    strokeOpacity?: Opacity;
    /** The width in pixels of the stroke for the stages. */
    strokeWidth?: PixelSize;
    /** Stage rendering direction. */
    direction?: 'horizontal' | 'vertical';
    /** Reverse the order of the stages. */
    reverse?: boolean;
    /** Spacing between the stages. */
    spacing?: number;
    /** Ratio of the triangle width to its height. When unset, the triangle will fill the available space. */
    aspectRatio?: number;
    /** Configuration for the labels shown on stages. */
    label?: AgPyramidSeriesLabelOptions<TDatum, AgPyramidSeriesLabelFormatterParams<TDatum>, TContext>;
    /** Configuration for the stage labels. */
    stageLabel?: AgPyramidSeriesStageLabelOptions<TDatum, AgPyramidSeriesLabelFormatterParams<TDatum>, TContext>;
    /** Configuration for the shadow used behind the series items. */
    shadow?: AgDropShadowOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgPyramidSeriesTooltipRendererParams<TDatum, TContext>>;
    /** Function used to return formatting for individual bars, based on the given parameters.*/
    itemStyler?: Styler<AgPyramidSeriesItemStylerParams<TDatum, TContext>, AgPyramidSeriesStyle>;
}

export interface AgPyramidSeriesOptionsKeys<TDatum = DatumDefault> {
    /** The key to use to retrieve stage values from the data. */
    stageKey: DatumKey<TDatum>;
    /** The key to use to retrieve values from the data. */
    valueKey: DatumKey<TDatum>;
}

export interface AgPyramidSeriesOptionsNames {}

export interface AgPyramidSeriesOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends
        Omit<AgBaseSeriesOptions<TDatum, TContext>, 'selection'>,
        AgPyramidSeriesOptionsKeys<TDatum>,
        AgPyramidSeriesOptionsNames,
        AgPyramidSeriesThemeableOptions<TDatum, TContext> {
    /** Configuration for the Pyramid Series. */
    type: 'pyramid';
}
