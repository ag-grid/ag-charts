import type { Toggleable } from '../series/cartesian/commonOptions';
import type { AgIconName } from './icons';

export interface AgToolbarOptions extends Toggleable {
    seriesType?: AgToolbarSeriesTypeGroup;
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
    /** whether the toolbar can be dragged */
    draggable?: boolean;
    /** Size of the toolbar group buttons, defaults to 'normal'. */
    size?: AgToolbarGroupSize;
    buttons?: (AgToolbarButton | AgToolbarSwitch)[];
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

export type AgToolbarGroupSize = 'small' | 'normal';

interface AgToolbarButtonConfig {
    /** Icon to display on the button. */
    icon?: AgIconName;
    /** Text label to display on the button. */
    label?: string;
    /** Text label to announce in screen readers. */
    ariaLabel?: string;
    /** Tooltip text to display on hover over the button. */
    tooltip?: string;
}

interface AgBaseToolbarButton extends AgToolbarButtonConfig {
    /** Section name used for grouping of buttons.
     *
     * Adjacent buttons with the same section are grouped together.*/
    section?: string;
    /** Value provided to caller when the button is pressed. */
    value: any;
    /** ID of the button (must be set when value is not a primitive) */
    id?: string;
    /** The button type (default: `'button'`); `'switch'` is the same but also have an on/off state like checkboxes. */
    role?: 'button' | 'switch';
}

export interface AgToolbarButton extends AgBaseToolbarButton {
    /** The button type (default: `'button'`); `'switch'` is the same but also have an on/off state like checkboxes. */
    role?: 'button';
}

export interface AgToolbarSwitch extends AgBaseToolbarButton {
    /** The button type (default: `'button'`); `'switch'` is the same but also have an on/off state like checkboxes. */
    role: 'switch';
    /** Overrides for the switch-button when checked. */
    checkedOverrides?: AgToolbarButtonConfig;
}

/* Annotations */
export interface AgToolbarAnnotationsGroup extends AgToolbarGroup {
    buttons?: AgToolbarAnnotationsButton[];
}

export interface AgToolbarChartGroup extends AgToolbarGroup {}

export interface AgToolbarAnnotationsButton extends AgToolbarButton {
    /** An annotation type or action. */
    value: AgToolbarAnnotationsButtonValue;
}

export type AgToolbarAnnotationsButtonValue =
    | 'line-menu'
    | 'text-menu'
    | 'shape-menu'
    | 'measurer-menu'
    | 'line'
    | 'horizontal-line'
    | 'vertical-line'
    | 'parallel-channel'
    | 'disjoint-channel'
    | 'text'
    | 'comment'
    | 'callout'
    | 'note'
    | 'clear';

/* Series Type */
export interface AgToolbarSeriesTypeGroup extends AgToolbarGroup {}

/* Annotation Options */
export interface AgToolbarAnnotationOptionsGroup extends AgToolbarGroup {
    buttons?: (AgToolbarAnnotationOptionsButton | AgToolbarAnnotationOptionsSwitch)[];
}

export interface AgToolbarAnnotationOptionsButton extends AgToolbarButton {
    value: AgToolbarAnnotationOptionsButtonValue;
}
export interface AgToolbarAnnotationOptionsSwitch extends AgToolbarSwitch {
    value: AgToolbarAnnotationOptionsButtonValue;
}

export type AgToolbarAnnotationOptionsButtonValue =
    | 'line-stroke-width'
    | 'line-style-type'
    | 'line-color'
    | 'fill-color'
    | 'text-color'
    | 'text-size'
    | 'delete'
    | 'lock'
    | 'settings';

/* Ranges */
export interface AgToolbarRangesGroup extends AgToolbarGroup {
    buttons?: AgToolbarRangesButton[];
}

export interface AgToolbarRangesButton extends AgToolbarButton {
    /** Timestamp range on which to focus the chart, as either a single start time, a pair of times or a function that returns a pair of times. */
    value: AgToolbarRangesButtonValue;
}

export type AgToolbarRangesButtonValue = number | AgToolbarRangesButtonValuePair | AgToolbarRangesButtonValueFunction;
export type AgToolbarRangesButtonValuePair = [Date | number, Date | number];
export type AgToolbarRangesButtonValueFunction = (
    start: Date | number,
    end: Date | number
) => [Date | number, Date | number];

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
