import type { Listener } from './callbackOptions';
import type { AgCrossLineClickEvent, AgCrossLineDoubleClickEvent } from './eventOptions';
import type { AgChartLabelStyleOptions } from './labelOptions';
import type { AgCssColorOrRef } from './themeParamsOptions';
import type { AxisValue, ContextDefault, CssColor, FontFamilyFull, Opacity, PixelSize } from './types';

/** Cross Line listeners. Cartesian charts only. */
export interface AgCrossLineListeners<TContext = ContextDefault> {
    /** The listener to call when the Cross Line is clicked. */
    click?: Listener<AgCrossLineClickEvent<TContext>>;
    /** The listener to call when the Cross Line is double-clicked. */
    doubleClick?: Listener<AgCrossLineDoubleClickEvent<TContext>>;
}

export interface AgCommonCrossLineOptions<LabelType = AgBaseCrossLineLabelOptions, TContext = ContextDefault> {
    /** A user-supplied identifier for the Cross Line, surfaced as `crossLineId` in callback and event params. Defaults to an internally generated identifier. */
    id?: string;
    /** Whether to show the Cross Line. */
    enabled?: boolean;
    /** The colour of the stroke for the lines. A colour string, or a theme-colour reference object. */
    stroke?: AgCssColorOrRef;
    /** The width in pixels of the stroke for the lines. */
    strokeWidth?: PixelSize;
    /** The opacity of the stroke for the lines. */
    strokeOpacity?: Opacity;
    /** Defines how the line stroke is rendered. Every number in the array specifies the length in pixels of alternating dashes and gaps. For example, `[6, 3]` means dashes with a length of `6` pixels with gaps between of `3` pixels. */
    lineDash?: PixelSize[];
    /** Configuration for the Cross Line label. */
    label?: LabelType;
    /** A map of event names to listeners. */
    listeners?: AgCrossLineListeners<TContext>;
}

export interface AgLineCrossLineOptions<
    TValue = AxisValue,
    LabelType = AgBaseCrossLineLabelOptions,
    TContext = ContextDefault,
> extends AgCommonCrossLineOptions<LabelType, TContext> {
    /** Renders the Cross Line as a single line positioned at `value`. */
    type: 'line';
    /** The data value at which the line should be positioned. */
    value: TValue;
}

export interface AgRangeCrossLineOptions<
    TValue = AxisValue,
    LabelType = AgBaseCrossLineLabelOptions,
    TContext = ContextDefault,
> extends AgCommonCrossLineOptions<LabelType, TContext> {
    /** Renders the Cross Line as a shaded band spanning `range`. */
    type: 'range';
    /** The `[start, end]` data values bounding the shaded region. */
    range: [TValue, TValue];
    /** The colour to use for the fill of the range. */
    fill?: CssColor;
    /** The opacity of the fill for the range. */
    fillOpacity?: Opacity;
}

export type AgBaseCrossLineOptions<
    TValue = AxisValue,
    LabelType = AgBaseCrossLineLabelOptions,
    TContext = ContextDefault,
> = AgLineCrossLineOptions<TValue, LabelType, TContext> | AgRangeCrossLineOptions<TValue, LabelType, TContext>;

// `id` and `listeners` identify and act on a single Cross Line, so they are deliberately absent from
// the themeable surface.
export interface AgCrossLineThemeOptions<LabelType = AgBaseCrossLineLabelOptions> extends Omit<
    AgCommonCrossLineOptions<LabelType, ContextDefault>,
    'id' | 'listeners'
> {
    /** The colour to use for the fill of the range. */
    fill?: CssColor;
    /** The opacity of the fill for the range. */
    fillOpacity?: Opacity;
}

export interface AgBaseCrossLineLabelOptions extends Omit<AgChartLabelStyleOptions, 'fontFamily'> {
    /** The text to show in the label. */
    text?: string;
    /** The font family to use for the label. A single family name, or an array of names used as fallbacks. */
    fontFamily?: FontFamilyFull;
    /**
     * How the label behaves when it does not fit the space available.
     *
     * - `'pad-chart'` reserves space outside the series area for the label, shrinking the series area to suit.
     * - `'realign-text'` mirrors the label back across the cross line, so it draws inside the series area.
     * - `'clip-text'` keeps the label where it is and truncates the text with an ellipsis to fit the chart.
     *
     * Polar axes have no padding to reserve, so `'pad-chart'` behaves as a no-op there and the label is
     * drawn at its configured position.
     *
     * Default: `pad-chart`
     */
    overflow?: AgCrossLineLabelOverflow;
    /**
     * Whether the label may be moved, shortened or hidden to avoid overlapping other labels.
     *
     * Default: `false`
     */
    avoidCollisions?: boolean;
}

/** How a Cross Line label behaves when it does not fit the space available. */
export type AgCrossLineLabelOverflow = 'pad-chart' | 'realign-text' | 'clip-text';

export type AgCrossLineLabelPosition =
    | 'top'
    | 'left'
    | 'right'
    | 'bottom'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | 'inside'
    | 'inside-left'
    | 'inside-right'
    | 'inside-top'
    | 'inside-bottom'
    | 'inside-top-left'
    | 'inside-bottom-left'
    | 'inside-top-right'
    | 'inside-bottom-right';
