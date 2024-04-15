import type { Toggleable } from '../series/cartesian/commonOptions';

export interface AgToolbarOptions extends Toggleable {
    annotations?: AgToolbarAnnotationsGroup;
    ranges?: AgToolbarRangesGroup;
}

export interface AgToolbarGroup extends Toggleable {
    /** Alignment of the toolbar group. */
    align?: 'start' | 'middle' | 'end';
    /** Position of the toolbar group on the outside of the chart. */
    position?: 'top' | 'left' | 'right' | 'bottom';
    buttons?: AgToolbarButton[];
}

export interface AgToolbarButton {
    /** Text label to display on the button. */
    label: string;
    value: any;
}

/* Annotations */
export interface AgToolbarAnnotationsGroup extends AgToolbarGroup {
    buttons?: AgToolbarAnnotationsButton[];
}

export interface AgToolbarAnnotationsButton extends AgToolbarButton {
    // TODO: fix docs to use this type - AgAnnotation['type']
    /** An annotation type. */
    value: 'line' | 'parallel-channel';
}

/* Ranges */
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
