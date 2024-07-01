import type { Toggleable } from '../series/cartesian/commonOptions';
export interface AgToolbarOptions extends Toggleable {
    annotations?: AgToolbarAnnotationsGroup;
    annotationOptions?: AgToolbarAnnotationOptionsGroup;
    ranges?: AgToolbarRangesGroup;
    zoom?: AgToolbarZoomGroup;
}
export interface AgToolbarGroup extends Toggleable {
    /** Alignment of the toolbar group. */
    align?: AgToolbarGroupAlignment;
    /** Position of the toolbar group on the outside of the chart. */
    position?: AgToolbarGroupPosition;
    /** Size of the toolbar group buttons, defaults to 'normal'. */
    size?: AgToolbarGroupSize;
    buttons?: AgToolbarButton[];
}
export type AgToolbarGroupAlignment = 'start' | 'center' | 'end';
export type AgToolbarGroupPosition = 'top' | 'left' | 'right' | 'bottom' | 'floating' | 'floating-top' | 'floating-bottom';
export type AgToolbarGroupSize = 'small' | 'normal';
export interface AgToolbarButton {
    /** Section name used for grouping of buttons.
     *
     * Adjacent buttons with the same section are grouped together.*/
    section?: string;
    /** Icon to display on the button. */
    icon?: AgIconName;
    /** Text label to display on the button. */
    label?: string;
    /** Text label to announce in screen readers. */
    ariaLabel?: string;
    /** Tooltip text to display on hover over the button. */
    tooltip?: string;
    /** Value provided to caller when the button is pressed. */
    value: any;
}
export type AgIconName = IconNameAnnotation | IconNameZoom;
type IconNameAnnotation = 'horizontal-line' | 'vertical-line' | 'trend-line' | 'parallel-channel' | 'disjoint-channel' | 'delete' | 'line-color' | 'lock' | 'reset' | 'unlock';
type IconNameZoom = 'pan-end' | 'pan-left' | 'pan-right' | 'pan-start' | 'reset' | 'zoom-in' | 'zoom-in-alt' | 'zoom-out' | 'zoom-out-alt';
export interface AgToolbarAnnotationsGroup extends AgToolbarGroup {
    buttons?: AgToolbarAnnotationsButton[];
}
export interface AgToolbarAnnotationsButton extends AgToolbarButton {
    section?: 'create' | 'tools';
    /** An annotation type or action. */
    value: AgToolbarAnnotationsButtonValue;
}
export type AgToolbarAnnotationsButtonValue = 'horizontal-line' | 'vertical-line' | 'line' | 'parallel-channel' | 'disjoint-channel' | 'clear';
export interface AgToolbarAnnotationOptionsGroup extends AgToolbarGroup {
    buttons?: AgToolbarAnnotationOptionsButton[];
}
export interface AgToolbarAnnotationOptionsButton extends AgToolbarButton {
    value: AgToolbarAnnotationOptionsButtonValue;
}
export type AgToolbarAnnotationOptionsButtonValue = 'line-color' | 'delete' | 'lock' | 'unlock';
export interface AgToolbarRangesGroup extends AgToolbarGroup {
    buttons?: AgToolbarRangesButton[];
}
export interface AgToolbarRangesButton extends AgToolbarButton {
    /** Timestamp range on which to focus the chart, as either a single start time, a pair of times or a function that returns a pair of times. */
    value: AgToolbarRangesButtonValue;
}
export type AgToolbarRangesButtonValue = number | AgToolbarRangesButtonValuePair | AgToolbarRangesButtonValueFunction;
export type AgToolbarRangesButtonValuePair = [Date | number, Date | number];
export type AgToolbarRangesButtonValueFunction = (start: Date | number, end: Date | number) => [Date | number, Date | number];
export interface AgToolbarZoomGroup extends AgToolbarGroup {
    buttons?: AgToolbarZoomButton[];
}
export interface AgToolbarZoomButton extends AgToolbarButton {
    value: AgToolbarZoomButtonValue;
}
export type AgToolbarZoomButtonValue = 'reset' | 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'pan-start' | 'pan-end';
export {};
