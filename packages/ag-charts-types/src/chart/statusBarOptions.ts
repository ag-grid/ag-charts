import type { BorderOptions, FillOptions, FontOptions, Padding, TextOptions } from '../series/cartesian/commonOptions';
import type { AgCollectedValue } from '../series/seriesCollectorOptions';
import type { NormalisedTextOrSegments, Renderer } from './callbackOptions';
import type { AgChartLegendPosition } from './legendOptions';
import type { ContextDefault, DatumDefault, PixelSize, TextWrap } from './types';

export type AgStatusBarInactiveMode = 'last' | 'recent' | 'hidden';

export interface AgStatusBarRendererParams<TDatum = DatumDefault, TContext = ContextDefault> {
    /** The values collected from every series at the hovered category, in series order. */
    readonly values: readonly AgCollectedValue<TDatum>[];
    /** Whether the values come from a hovered datum, rather than the `inactive` fallback. */
    readonly active: boolean;
    /** Context for this callback. */
    readonly context?: TContext;
}

export interface AgStatusBarRendererItem {
    /** The label shown before the value. */
    label?: NormalisedTextOrSegments;
    /** The value text. */
    value: NormalisedTextOrSegments;
}

export interface AgStatusBarOptions<TDatum = DatumDefault, TContext = ContextDefault> extends FillOptions {
    /**
     * Whether to show the status bar.
     *
     * Default: `false`
     */
    enabled?: boolean;
    /** Where the status bar is positioned. When not set, it is shown above the series area, aligned to its start. */
    position?: AgChartLegendPosition;
    /** Used to constrain the width of the status bar. */
    maxWidth?: PixelSize;
    /** Used to constrain the height of the status bar. */
    maxHeight?: PixelSize;
    /** The border around the status bar. */
    border?: BorderOptions;
    /** The corner radius of the status bar. */
    cornerRadius?: PixelSize;
    /** The padding between the border and the items. A number applies uniform padding; an object sets each side. */
    padding?: Padding;
    /** The text style of the item labels. */
    label?: TextOptions;
    /** The font of the item values. Each value is coloured as its series draws the datum. */
    value?: FontOptions;
    /**
     * Text wrapping strategy when the items exceed `maxWidth`.
     *
     * Default: `'on-space'`
     */
    wrapping?: TextWrap;
    /**
     * Whether to add an ellipsis to text that exceeds `maxWidth` or `maxHeight`. When `false`, the text is clipped.
     *
     * Default: `true`
     */
    truncate?: boolean;
    /**
     * What the status bar shows when no datum is hovered.
     *
     * - `'last'`: the last datum of each series.
     * - `'recent'`: the most recently hovered datum, or the last datum before any hover.
     * - `'hidden'`: nothing; the status bar is hidden.
     *
     * Default: `'last'`
     */
    inactive?: AgStatusBarInactiveMode;
    /** Function used to create the status bar items from the collected values. Return text to show a single value. */
    renderer?: Renderer<AgStatusBarRendererParams<TDatum, TContext>, AgStatusBarRendererItem[]>;
}
