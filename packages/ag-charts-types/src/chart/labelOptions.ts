import type { FillOptions, LabelBoxOptions, TextOptions, Toggleable } from '../series/cartesian/commonOptions';
import type {
    AgChartCallbackParams,
    HierarchyHighlightState,
    HighlightState,
    RichFormatter,
    SelectionState,
    Styler,
} from './callbackOptions';
import type { ContextDefault, FontSize, OverflowStrategy, PixelSize, TextWrap } from './types';

export interface AgChartLabelStyleOptions extends Toggleable, TextOptions, LabelBoxOptions {}

/**
 * Colour overrides applied to a label depending on its resolved inside/outside placement: `color` sets
 * the text colour, `fill`/`fillOpacity` set the label box fill. An explicit top-level `label` value
 * always wins, and any property left unset here falls back to the built-in placement default.
 */
export interface AgChartLabelPlacementStyleOptions extends Pick<TextOptions, 'color'>, FillOptions {}

/**
 * Placement-reactive colour overrides for a single label whose inside/outside placement is resolved at
 * layout time. Applied per property: an explicit top-level `label.<property>` takes precedence,
 * otherwise the matching `insideStyle`/`outsideStyle` value applies for the resolved placement.
 */
export interface AgSeriesLabelPlacementStyleOptions {
    /** Style overrides applied only when the label's resolved placement is inside the shape. */
    insideStyle?: AgChartLabelPlacementStyleOptions;
    /** Style overrides applied only when the label's resolved placement is outside the shape. */
    outsideStyle?: AgChartLabelPlacementStyleOptions;
}

export interface AgChartLabelStylerParams<TDatum, TContext>
    extends AgChartCallbackParams<TDatum, TContext>, AgChartLabelStyleOptions {
    /** The specific highlight state of the element. */
    highlightState?: HighlightState | HierarchyHighlightState;
    /** The specific selection state of the element. Undefined if the selection module is disabled. */
    selectionState?: SelectionState;
    /** The specific candidate state of the element. Undefined if the selection module is disabled or if no drag motion is in progress. */
    candidateState?: SelectionState;
}

/**
 * Represents the configuration options for labels in an AgCharts.
 *
 * Labels are used to display textual information alongside data points in a chart.
 *
 * @typeparam TDatum - The type of data associated with the chart.
 * @typeparam TParams - The type of parameters expected by the label formatter function.
 */
export interface AgChartLabelOptions<TDatum, TParams, TContext = ContextDefault> extends AgChartLabelStyleOptions {
    /** A custom formatting function used to convert data values into text for display by labels. */
    formatter?: RichFormatter<AgChartLabelFormatterParams<TDatum, TContext> & TParams>;
    /** Format string used when rendering labels. */
    format?: string;
    /** Function used to style individual datum labels. */
    itemStyler?: Styler<AgChartLabelStylerParams<TDatum, TContext> & TParams, AgChartLabelStyleOptions>;
}

export interface AgChartLabelFormatterParams<TDatum, TContext = ContextDefault> extends AgChartCallbackParams<
    TDatum,
    TContext
> {
    /** The default label value that would have been used without a formatter. */
    value: any;
}

// New auto-sized labels
export interface AgChartAutoSizedBaseLabelOptions<
    TDatum,
    TParams,
    TContext = ContextDefault,
> extends AgChartLabelOptions<TDatum, TParams, TContext> {
    /**
     * Line height to use for the label.
     */
    lineHeight?: FontSize;

    /**
     * If the label does not fit in the container, setting this will allow the label to pick a font size between its normal `fontSize` and `minimumFontSize` to fit within the container.
     */
    minimumFontSize?: FontSize;

    /**
     * Text wrapping strategy for labels.
     * - `'always'` will always wrap text to fit within the tile.
     * - `'hyphenate'` is similar to `'always'`, but inserts a hyphen (`-`) if forced to wrap in the middle of a word.
     * - `'on-space'` will only wrap on white space. If there is no possibility to wrap a line on space and satisfy the tile dimensions, the text will be truncated.
     * - `'never'` disables text wrapping.
     *
     * Default: `'on-space'`
     */
    wrapping?: TextWrap;

    /**
     * Adjusts the behaviour of labels when they overflow
     * - `'ellipsis'` will truncate the text to fit, appending an ellipsis (...)
     * - `'hide'` only displays the label if it completely fits within its bounds, and removes it if it would overflow
     */
    overflowStrategy?: OverflowStrategy;
}

export interface AgChartAutoSizedLabelOptions<
    TDatum,
    TParams,
    TContext = ContextDefault,
> extends AgChartAutoSizedBaseLabelOptions<TDatum, TParams, TContext> {
    /** The distance between the label and secondary label, if both are present */
    spacing?: PixelSize;
}

export interface AgChartAutoSizedSecondaryLabelOptions<
    TDatum,
    TParams,
    TContext = ContextDefault,
> extends AgChartAutoSizedBaseLabelOptions<TDatum, TParams, TContext> {}
