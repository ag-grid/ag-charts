import type {
    FillCssOptions,
    FontOptions,
    Padding,
    StrokeOptions,
    Toggleable,
} from '../series/cartesian/commonOptions';
import type { AgTimeInterval, AgTimeIntervalUnit } from './axisOptions';
import type { ToolbarButton } from './buttonOptions';
import type { AgZoomEventSource } from './eventOptions';
import type { CssColor, PixelSize } from './types';

export interface AgRangesOptions extends Toggleable, AgRangesStyles {
    /**
     * Whether out of range buttons should be enabled.
     *
     * Default: `false`
     */
    enableOutOfRange?: boolean;
    /**
     * The gap between each button.
     *
     * Default: `0`
     */
    gap?: PixelSize;
    /**
     * The position of the range buttons on the chart.
     *
     * Default: `'top-right'`
     */
    position?: AgRangesPosition;
    /**
     * The spacing between the range buttons and the series area or axis when positioned at the top or bottom, respectively.
     *
     * Default: `10`
     */
    spacing?: PixelSize;
    button?: AgRangesButtonStyles;
    dropdown?: AgRangesDropdown;
    /** The buttons to display. */
    buttons?: AgRangesButton[];
}

export interface AgRangesStyles extends FillCssOptions, FontOptions, Omit<StrokeOptions, 'strokeOpacity'> {
    cornerRadius?: PixelSize;
    padding?: Padding;
    textColor?: CssColor;
    active?: AgRangesStateStyles;
    disabled?: AgRangesStateStyles;
    hover?: AgRangesStateStyles;
}

export interface AgRangesStateStyles extends FillCssOptions, Pick<StrokeOptions, 'stroke'> {
    textColor?: CssColor;
}

export interface AgRangesButtonStyles extends AgRangesStyles {}

export interface AgRangesDropdownStyles extends AgRangesStyles {}

export interface AgRangesDropdown extends AgRangesDropdownStyles {
    /**
     * When to swap out the range buttons for a dropdown.
     *
     * Default: `'auto'`
     */
    visible?: AgRangesDropdownVisible;
}

export type AgRangesDropdownVisible = 'auto' | 'always' | 'never';

export type AgRangesPosition = 'top-left' | 'top' | 'top-right' | 'bottom-left' | 'bottom' | 'bottom-right';

export interface AgRangesButton extends Omit<ToolbarButton, 'iconPosition'> {
    /** Set to force this button to be enabled or disabled. */
    enabled?: boolean;
    /** Timestamp range on which to focus the chart, as either a single start time, a pair of times or a function that returns a pair of times. */
    value: AgRangesButtonValue;
}

export type AgRangesButtonValue =
    | number
    | AgRangesButtonValuePair
    | AgRangesButtonValueFunction
    | AgTimeInterval
    | AgTimeIntervalUnit
    | undefined;

export type AgRangesButtonValuePair = [Date | number, Date | number];
export type AgRangesButtonValueSource = AgZoomEventSource;

export interface AgRangesButtonValueFunctionParams {
    /** The start of the full data domain. */
    start: Date | number;
    /** The end of the full data domain. */
    end: Date | number;
    /** The start of the currently visible range. */
    windowStart: Date | number;
    /** The end of the currently visible range. */
    windowEnd: Date | number;
    /** What triggered the function call, such as a button press or an out-of-range check. */
    source: AgRangesButtonValueSource;
}

export type AgRangesButtonValueFunction = (
    params: AgRangesButtonValueFunctionParams
) => [Date | number | undefined, Date | number | undefined];
