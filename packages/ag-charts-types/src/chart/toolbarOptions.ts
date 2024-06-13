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
    buttons?: AgToolbarButton[];
}

export type AgToolbarGroupAlignment = 'start' | 'center' | 'end';
export type AgToolbarGroupPosition =
    | 'top'
    | 'left'
    | 'right'
    | 'bottom'
    | 'floating'
    | 'floating-top'
    | 'floating-bottom';

export interface AgToolbarButton {
    /** Section in which to group the button. */
    section?: string;
    /** Icon to display on the button. */
    icon?: AgIconName;
    /** Text label to display on the button. */
    label?: string;
    /** Tooltip text to display on hover over the button. */
    tooltip?: string;
    /** Value provided to caller when the button is pressed. */
    value: any;
}

export type AgIconName = IconNameAnnotation | IconNameZoom;
type IconNameAnnotation =
    | 'trend-line'
    | 'parallel-channel'
    | 'disjoint-channel'
    | 'color'
    | 'delete'
    | 'lock'
    | 'reset'
    | 'unlock';
type IconNameZoom = 'pan-end' | 'pan-left' | 'pan-right' | 'pan-start' | 'reset' | 'zoom-in' | 'zoom-out';

/* Annotations */
export interface AgToolbarAnnotationsGroup extends AgToolbarGroup {
    buttons?: AgToolbarAnnotationsButton[];
}

export interface AgToolbarAnnotationsButton extends AgToolbarButton {
    section?: 'create' | 'tools';
    /** An annotation type or action. */
    value: AgToolbarAnnotationsButtonValue;
}

export type AgToolbarAnnotationsButtonValue = 'line' | 'parallel-channel' | 'disjoint-channel' | 'clear';

/* Annotation Options */
export interface AgToolbarAnnotationOptionsGroup extends AgToolbarGroup {
    buttons?: AgToolbarAnnotationOptionsButton[];
}

export interface AgToolbarAnnotationOptionsButton extends AgToolbarButton {
    value: AgToolbarAnnotationOptionsButtonValue;
}

export type AgToolbarAnnotationOptionsButtonValue = 'color' | 'delete' | 'lock' | 'unlock';

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

/* Zoom */
export interface AgToolbarZoomGroup extends AgToolbarGroup {
    buttons?: AgToolbarZoomButton[];
}

export interface AgToolbarZoomButton extends AgToolbarButton {
    value: AgToolbarZoomButtonValue;
}

export type AgToolbarZoomButtonValue =
    | 'reset'
    | 'zoom-in'
    | 'zoom-out'
    | 'pan-left'
    | 'pan-right'
    | 'pan-start'
    | 'pan-end';
