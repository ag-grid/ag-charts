import type {
    BorderOptions,
    FillOptions,
    LabelBoxOptions,
    Padding,
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
    AgChartLabelCollisionOptions,
    AgChartLabelCollisionPlacement,
    AgChartLabelOrientation,
    AgChartLabelRegionPlacement,
} from './collisionAvoidanceOptions';
import type { ContextDefault, FontSize, OverflowStrategy, PixelSize, TextWrap } from './types';

export interface AgChartLabelStyleOptions extends Toggleable, TextOptions, LabelBoxOptions {}

/** Label style overrides taking precedence over the top-level `label` options for a given placement. */
export interface AgChartLabelPlacementStyleOptions extends Pick<TextOptions, 'color'>, FillOptions {
    /** Rounded corners of the label box. */
    cornerRadius?: PixelSize;
    /** Padding between the label text and the box edge. */
    padding?: Padding;
    /** Border applied to the label box for this placement. */
    border?: BorderOptions;
}

/** Label style overrides applied according to the placement resolved at layout time. */
export interface AgSeriesLabelPlacementStyleOptions {
    /** Styles applied when the label is placed inside the shape. */
    insideStyle?: AgChartLabelPlacementStyleOptions;
    /** Styles applied when the label is placed outside the shape. */
    outsideStyle?: AgChartLabelPlacementStyleOptions;
}

export interface AgChartLabelStylerParams<TDatum, TContext>
    extends AgChartCallbackParams<TDatum, TContext>, AgChartLabelStyleOptions {
    /** The resolved placement actually used to render this label. */
    placement?: AgChartLabelCollisionPlacement | AgBarSeriesLabelPlacement | AgChartLabelRegionPlacement;
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
 * Controls how a series label is fitted to the region produced by its placement: bounding its size
 * and wrapping or truncating overflow. Only series that reserve a region for their labels honour
 * these options.
 */
export interface AgChartLabelFitOptions {
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

/** Font reduction applied to a label that does not fit the region produced by its placement. */
export interface AgChartLabelAutoFontSizeOptions {
    /**
     * If the label does not fit within its bounds, setting this will allow the label to pick a font size
     * between its normal `fontSize` and `minimumFontSize` to fit. The label is only truncated or hidden
     * when it still does not fit at `minimumFontSize`.
     */
    minimumFontSize?: FontSize;
}

/** Label-fit options extended with collision handling. */
export interface AgChartLabelCollisionFitOptions extends AgChartLabelFitOptions {
    /**
     * Configuration controlling the spacing kept from obstacles and whether a label that cannot be
     * placed clear of every obstacle is kept at its least-overflowing placement or hidden.
     */
    collision?: AgChartLabelCollisionOptions;
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
