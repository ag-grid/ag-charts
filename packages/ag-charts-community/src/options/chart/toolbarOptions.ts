import type { Toggleable } from '../series/cartesian/commonOptions';

export interface AgToolbarOptions extends Toggleable {
    annotations?: AgToolbarAnnotationsGroup;
    ranges?: AgToolbarRangesGroup;
}

export interface AgToolbarGroup extends Toggleable {
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

export interface AgToolbarAnnotationsGroup extends AgToolbarGroup {
    buttons?: AgToolbarAnnotationsButton[];
}

export interface AgToolbarAnnotationsButton extends AgToolbarButton {
    // TODO: fix docs to use this type
    // value: AgAnnotation['type'];
    /** An annotation type. */
    value: 'line' | 'parallel-channel';
}

export interface AgToolbarRangesGroup extends AgToolbarGroup {
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
