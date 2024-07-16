import type { Toggleable } from '../series/cartesian/commonOptions';
export interface AgToolbarOptions extends Toggleable {
    annotations?: AgToolbarAnnotationsGroup;
    ranges?: AgToolbarRangesGroup;
    zoom?: AgToolbarZoomGroup;
}
export interface AgToolbarGroup extends Toggleable {
    /** Alignment of the toolbar group. */
    align?: AgToolbarGroupAlignment;
    /** Position of the toolbar group on the outside of the chart. */
    position?: AgToolbarGroupPosition;
    buttons?: AgToolbarButton[];
}
export type AgToolbarGroupAlignment = 'start' | 'center' | 'end';
export type AgToolbarGroupPosition = 'top' | 'left' | 'right' | 'bottom' | 'floating-top' | 'floating-bottom';
export interface AgToolbarButton {
    /** Icon to display on the button. */
    icon?: AgIconName;
    /** Text label to display on the button. */
    label?: string;
    /** Tooltip text to display on hover over the button. */
    tooltip?: string;
    /** Value provided to caller when the button is pressed. */
    value: any;
}
export type AgIconName = 'pan-end' | 'pan-left' | 'pan-right' | 'pan-start' | 'reset' | 'zoom-in' | 'zoom-out';
export interface AgToolbarAnnotationsGroup extends AgToolbarGroup {
    buttons?: AgToolbarAnnotationsButton[];
}
export interface AgToolbarAnnotationsButton extends AgToolbarButton {
    /** An annotation type. */
    value: AgToolbarAnnotationsButtonValue;
}
export type AgToolbarAnnotationsButtonValue = 'line' | 'parallel-channel';
export interface AgToolbarRangesGroup extends AgToolbarGroup {
    buttons?: AgToolbarRangesButton[];
}
export interface AgToolbarRangesButton extends AgToolbarButton {
    /** Timestamp range on which to focus the chart, as either a single start time, a pair of times or a function that returns a pair of times. */
    value: AgToolbarRangesButtonValue;
}
export type AgToolbarRangesButtonValue = number | [Date | number, Date | number] | ((start: Date | number, end: Date | number) => [Date | number, Date | number]);
export interface AgToolbarZoomGroup extends AgToolbarGroup {
    buttons?: AgToolbarZoomButton[];
}
export interface AgToolbarZoomButton extends AgToolbarButton {
    value: AgToolbarZoomButtonValue;
}
export type AgToolbarZoomButtonValue = 'reset' | 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'pan-start' | 'pan-end';
