import type { AgAxisBoundSeries, AgTimeInterval, AgTimeIntervalUnit } from './axisOptions';
import type { Formatter, Renderer } from './callbackOptions';
import type { AgCssColorOrRef } from './themeParamsOptions';
import type { ContextDefault, CssColor, Opacity, PixelSize } from './types';

/** Whether the crosshair snaps to every value in `crosshairSnapTo`, or only the one nearest the pointer. */
export type AgCrosshairSnapMode = 'all' | 'nearest';

export interface AgCrosshairOptions<LabelType = AgCrosshairLabel<string, ContextDefault>> {
    /**
     * Whether to show the crosshair.
     *
     * Default: `true` on number, log, time, unit-time and ordinal-time axes when the chart's first series is candlestick, OHLC or HLC, and on the price and date axes of the Financial Charts presets; `false` otherwise.
     */
    enabled?: boolean;
    /**
     * Whether the crosshair snaps to the highlighted data point. When unset, the crosshair snaps if the highlighted series has a single value on this axis or a `crosshairSnapTo` list, and follows the pointer otherwise.
     */
    snap?: boolean;
    /** The colour of the stroke for the lines. A colour string, or a theme-colour reference object. */
    stroke?: AgCssColorOrRef;
    /** The width in pixels of the stroke for the lines. */
    strokeWidth?: PixelSize;
    /** The opacity of the stroke for the lines. */
    strokeOpacity?: Opacity;
    /** Defines how the line stroke is rendered. Every number in the array specifies the length in pixels of alternating dashes and gaps. For example, `[6, 3]` means dashes with a length of `6` pixels with gaps between of `3` pixels. */
    lineDash?: PixelSize[];
    /** The initial offset of the dashed line in pixels. */
    lineDashOffset?: PixelSize;
    /** The crosshair label configuration */
    label?: LabelType;
}

export interface AgNumericAxisCrosshairOptions<
    LabelType = AgCrosshairLabel<string, ContextDefault>,
> extends AgCrosshairOptions<LabelType> {
    /**
     * Rounds the crosshair to the nearest multiple of this step, in the units of the axis. Turns snapping on when `snap` is unset.
     */
    snapInterval?: number;
}

export interface AgTimeAxisCrosshairOptions<
    LabelType = AgCrosshairLabel<string, ContextDefault>,
> extends AgCrosshairOptions<LabelType> {
    /**
     * Rounds the crosshair to the nearest interval, aligned the same way as the axis `interval.step`. A unit keyword, an object describing the interval, or a number of milliseconds. Turns snapping on when `snap` is unset.
     */
    snapInterval?: AgTimeInterval | AgTimeIntervalUnit | number;
}

export interface AgCrosshairLabelFormatterParams<TContext> {
    readonly value: any;
    readonly fractionDigits?: number;
    readonly unit?: AgTimeIntervalUnit;
    readonly step?: number;
    readonly boundSeries: AgAxisBoundSeries[];
    readonly domain: any[];
    readonly context?: TContext;
}

export interface AgCrosshairLabel<TFormat, TContext = ContextDefault> extends AgBaseCrosshairLabel<TContext> {
    /** Format string used when rendering labels. */
    format?: TFormat;
}

export interface AgBaseCrosshairLabel<TContext = ContextDefault> {
    /** Whether to show label when the crosshair is visible. */
    enabled?: boolean;
    /** The horizontal offset in pixels for the label. */
    xOffset?: PixelSize;
    /** The vertical offset in pixels for the label. */
    yOffset?: PixelSize;
    /** Function used to render crosshair labels. If `value` is a number, `fractionDigits` will also be provided, which indicates the number of fractional digits used in the step between ticks; for example, a tick step of `0.0005` would have `fractionDigits` set to `4`. The result is displayed as text. */
    formatter?: Formatter<AgCrosshairLabelFormatterParams<TContext>>;
    /** Function used to create the content for the label. A returned string, or the `text` of a returned object, is inserted as HTML, so escape any values derived from chart data. */
    renderer?: Renderer<AgCrosshairLabelRendererParams, AgCrosshairLabelRendererResult>;
}

export interface AgCrosshairLabelRendererParams {
    /** Axis value that the label is being rendered for. */
    readonly value: any;
    /** If the axis value is a number, the fractional digits used to format the value. */
    readonly fractionDigits?: number;
}

export interface AgCrosshairLabelRendererResult {
    /** Content for the label, inserted as HTML. */
    text?: string;
    /** Label text colour. */
    color?: CssColor;
    /** Label background colour. */
    backgroundColor?: CssColor;
    /** Opacity of the label. */
    opacity?: Opacity;
}
