import type { Toggleable } from '../series/cartesian/commonOptions';

export interface AgToolbarOptions extends Toggleable {
    ranges?: AgToolbarRangesSection;
}

export interface AgToolbarSection extends Toggleable {
    /** Position of the toolbar section on the outside of the chart. */
    position?: 'top' | 'left' | 'right' | 'bottom';
    // floating?: boolean;
    buttons?: AgToolbarButton[];
}

export interface AgToolbarButton {
    /** Text label to display on the button. */
    label: string;
    value: any;
}

export interface AgToolbarRangesSection extends AgToolbarSection {
    buttons?: AgToolbarRangesButton[];
}

export interface AgToolbarRangesButton extends AgToolbarButton {
    /** Timestamp range on which to focus the chart, as either a single start time, a pair of times or a function that returns a pair of times. */
    value: AgToolbarRangesButtonValue;
}

export type AgToolbarRangesButtonValue =
    | number
    | [Date | number, Date | number]
    | ((start: Date | number, end: Date | number) => [Date | number, Date | number]);
