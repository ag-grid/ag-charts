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
export type AgToolbarGroupPosition =
    | 'top'
    | 'left'
    | 'right'
    | 'bottom'
    | 'floating'
    | 'floating-top'
    | 'floating-bottom';
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

export type AgIconName =
    | 'area'
    | 'callout'
    | 'candles'
    | 'comment'
    | 'delete'
    | 'disjoint-channel'
    | 'fill'
    | 'hollow-candles'
    | 'horizontal-line'
    | 'line-color'
    | 'line-markers'
    | 'line'
    | 'lock'
    | 'note'
    | 'ohlc'
    | 'pan-end'
    | 'pan-left'
    | 'pan-right'
    | 'pan-start'
    | 'parallel-channel'
    | 'price-label'
    | 'reset'
    | 'step-line'
    | 'text'
    | 'trend-line'
    | 'unlock'
    | 'vertical-line'
    | 'zoom-in'
    | 'zoom-out'
    | AgIconLegacyName;

export type AgIconLegacyName =
    | 'crossline-add-line-legacy'
    | 'delete-legacy'
    | 'disjoint-channel-legacy'
    | 'horizontal-line-legacy'
    | 'line-color-legacy'
    | 'line-markers-legacy'
    | 'line-legacy'
    | 'lock-legacy'
    | 'note-legacy'
    | 'ohlc-legacy'
    | 'pan-end-legacy'
    | 'pan-left-legacy'
    | 'pan-right-legacy'
    | 'pan-start-legacy'
    | 'parallel-channel-legacy'
    | 'price-label-legacy'
    | 'reset-legacy'
    | 'step-line-legacy'
    | 'text-legacy'
    | 'trend-line-legacy'
    | 'unlock-legacy'
    | 'vertical-line-legacy'
    | 'zoom-in-legacy'
    | 'zoom-out-legacy'
    | 'zoom-in-alt'
    | 'zoom-in-alt-legacy'
    | 'zoom-out-alt'
    | 'zoom-out-alt-legacy';

/* Annotations */
export interface AgToolbarAnnotationsGroup extends AgToolbarGroup {
    buttons?: AgToolbarAnnotationsButton[];
}

export interface AgToolbarAnnotationsButton extends AgToolbarButton {
    /** An annotation type or action. */
    value: AgToolbarAnnotationsButtonValue;
}

export type AgToolbarAnnotationsButtonValue =
    | 'line'
    | 'horizontal-line'
    | 'vertical-line'
    | 'parallel-channel'
    | 'disjoint-channel'
    | 'text'
    | 'clear';

/* Annotation Options */
export interface AgToolbarAnnotationOptionsGroup extends AgToolbarGroup {
    buttons?: AgToolbarAnnotationOptionsButton[];
}

export interface AgToolbarAnnotationOptionsButton extends AgToolbarButton {
    value: AgToolbarAnnotationOptionsButtonValue;
}

export type AgToolbarAnnotationOptionsButtonValue = 'line-color' | 'text-color' | 'delete' | 'lock' | 'unlock';

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
