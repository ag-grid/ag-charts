import type { Toggleable } from '../series/cartesian/commonOptions';
import type { AgTimeInterval, AgTimeIntervalUnit } from './axisOptions';
import type { ToolbarButton } from './buttonOptions';

export interface AgRangesOptions extends Toggleable {
    /**
     * When to swap out the range buttons for a dropdown.
     *
     * Default: `'auto'`
     */
    dropdown?: AgRangesDropdown;
    /**
     * Whether out of range buttons should be enabled.
     *
     * Default: `false`
     */
    enableOutOfRange?: boolean;
    /**
     * The position of the range buttons on the chart.
     *
     * Default: `'top-right'`
     */
    position?: AgRangesPosition;
    buttons?: AgRangesButton[];
}

export type AgRangesDropdown = 'auto' | 'always' | 'never';

export type AgRangesPosition = 'top-left' | 'top' | 'top-right' | 'bottom-left' | 'bottom' | 'bottom-right';

export interface AgRangesButton extends ToolbarButton {
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
export type AgRangesButtonValueFunction = (
    start: Date | number,
    end: Date | number,
    windowStart: Date | number,
    windowEnd: Date | number
) => [Date | number, Date | number];
