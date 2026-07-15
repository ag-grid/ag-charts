import type {
    FillOptions,
    LabelBoxOptions,
    Padding,
    StrokeOptions,
    TextOptions,
    Toggleable,
} from '../series/cartesian/commonOptions';
import type {
    AgChartCallbackParams,
    HierarchyHighlightState,
    HighlightState,
    RichFormatter,
    SelectionState,
    Styler,
} from './callbackOptions';
import type {
    AgBarSeriesLabelPlacement,
    AgChartLabelCollisionAvoidanceOptions,
    AgChartLabelCollisionPlacement,
    AgChartLabelOrientation,
} from './collisionAvoidanceOptions';
import type { ContextDefault, FontSize, OverflowStrategy, PixelSize, TextWrap } from './types';

export interface AgChartLabelStyleOptions extends Toggleable, TextOptions, LabelBoxOptions {}

/**
 * Style overrides applied to a label depending on its resolved inside/outside placement: `color` sets
 * the text colour, `fill`/`fillOpacity` the box fill, `cornerRadius` and `padding` the box geometry, and
 * `border` the box stroke. A placement-specific value set here wins over the top-level `label` value, and
 * both fall back to the theme default. Whether a border is shown is controlled once by the top-level
 * `label.border.enabled`; only the border's stroke, width and opacity are placement-reactive.
 */
export interface AgChartLabelPlacementStyleOptions extends Pick<TextOptions, 'color'>, FillOptions {
    /** Rounded corners applied to the label box for this placement. */
    cornerRadius?: PixelSize;
    /** Distance between the label text and the box edge for this placement. */
    padding?: Padding;
    /** Border stroke applied to the label box for this placement. */
    border?: StrokeOptions;
}

/**
 * Placement-reactive colour overrides for a single label whose inside/outside placement is resolved at
 * layout time. Applied per property: the matching `insideStyle`/`outsideStyle` value for the resolved
 * placement takes precedence, falling back to the top-level `label.<property>` and then the theme default.
 */
export interface AgSeriesLabelPlacementStyleOptions {
    /** Style overrides applied only when the label's resolved placement is inside the shape. */
    insideStyle?: AgChartLabelPlacementStyleOptions;
    /** Style overrides applied only when the label's resolved placement is outside the shape. */
    outsideStyle?: AgChartLabelPlacementStyleOptions;
}

export interface AgChartLabelStylerParams<TDatum, TContext>
    extends AgChartCallbackParams<TDatum, TContext>, AgChartLabelStyleOptions {
    /** The resolved placement actually used to render this label. */
    placement?: AgChartLabelCollisionPlacement | AgBarSeriesLabelPlacement;
    /** The resolved orientation actually used to render this label (bar series only). */
    orientation?: AgChartLabelOrientation;
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

/**
 * Controls how a series label is fitted to the region produced by its placement: bounding its size,
 * wrapping or truncating overflow, and opting into collision avoidance. Only series that reserve a
 * region for their labels honour these options.
 */
export interface AgChartLabelFitOptions {
    /**
     * Configuration controlling how the label is repositioned or dropped to avoid overlapping other
     * labels, markers or series geometry. The `minSpacing` and `collideWith` sub-options only apply to
     * point-based series (line, area, scatter, bubble and map markers/lines); elsewhere only whether
     * avoidance is enabled is honoured.
     */
    collisionAvoidance?: AgChartLabelCollisionAvoidanceOptions;
    /** Maximum width, in pixels, the label may occupy before it is wrapped or truncated to fit. */
    maxWidth?: PixelSize;
    /** Maximum height, in pixels, the label may occupy before it is wrapped or truncated to fit. */
    maxHeight?: PixelSize;
    /**
     * Text wrapping strategy applied when the label is constrained by `maxWidth` or `maxHeight`.
     * - `'always'` will always wrap text to fit within the bounds.
     * - `'hyphenate'` is similar to `'always'`, but inserts a hyphen (`-`) if forced to wrap in the middle of a word.
     * - `'on-space'` will only wrap on white space. If there is no possibility to wrap a line on space and satisfy the bounds, the text will be truncated.
     * - `'never'` disables text wrapping.
     */
    wrapping?: TextWrap;
    /** Whether to truncate the label with an ellipsis when it does not fit within its bounds. */
    truncate?: boolean;
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
