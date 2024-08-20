import type { Toggleable } from '../series/cartesian/commonOptions';

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

export type AgIconName =
    | 'arrow-drawing'
    | 'callout-annotation'
    | 'candlestick-series'
    | 'comment-annotation'
    | 'delete'
    | 'disjoint-channel-drawing'
    | 'fill-color'
    | 'line-style-solid'
    | 'line-style-dashed'
    | 'line-style-dotted'
    | 'high-low-series'
    | 'hlc-series'
    | 'hollow-candlestick-series'
    | 'horizontal-line-drawing'
    | 'line-color'
    | 'line-series'
    | 'line-with-markers-series'
    | 'locked'
    | 'note-annotation'
    | 'ohlc-series'
    | 'pan-end'
    | 'pan-left'
    | 'pan-right'
    | 'pan-start'
    | 'parallel-channel-drawing'
    | 'price-label-annotation'
    | 'reset'
    | 'step-line-series'
    | 'text-annotation'
    | 'trend-line-drawing'
    | 'unlocked'
    | 'vertical-line-drawing'
    | 'zoom-in'
    | 'zoom-out'
    | AgIconLegacyName;

/** @deprecated */
export type AgIconLegacyName =
    | 'delete-legacy'
    | 'disjoint-channel'
    | 'disjoint-channel-legacy'
    | 'horizontal-line'
    | 'horizontal-line-legacy'
    | 'line-color-legacy'
    | 'lock'
    | 'lock-legacy'
    | 'pan-end-legacy'
    | 'pan-left-legacy'
    | 'pan-right-legacy'
    | 'pan-start-legacy'
    | 'parallel-channel'
    | 'parallel-channel-legacy'
    | 'reset-legacy'
    | 'trend-line'
    | 'trend-line-legacy'
    | 'unlock'
    | 'unlock-legacy'
    | 'vertical-line'
    | 'vertical-line-legacy'
    | 'zoom-in-legacy'
    | 'zoom-in-alt'
    | 'zoom-in-alt-legacy'
    | 'zoom-out-legacy'
    | 'zoom-out-alt'
    | 'zoom-out-alt-legacy';

// Duplicated as docs can not handle `type AgIconLegacyName = typeof ICONS_LEGACY`, but need the array for validation.
export const ICONS_LEGACY = [
    'delete-legacy',
    'disjoint-channel',
    'disjoint-channel-legacy',
    'horizontal-line-legacy',
    'line-color-legacy',
    'lock',
    'lock-legacy',
    'pan-end-legacy',
    'pan-left-legacy',
    'pan-right-legacy',
    'pan-start-legacy',
    'parallel-channel',
    'parallel-channel-legacy',
    'reset-legacy',
    'trend-line',
    'trend-line-legacy',
    'unlock',
    'unlock-legacy',
    'vertical-line',
    'vertical-line-legacy',
    'zoom-in-legacy',
    'zoom-in-alt',
    'zoom-in-alt-legacy',
    'zoom-out-legacy',
    'zoom-out-alt',
    'zoom-out-alt-legacy',
] as Array<AgIconLegacyName>;

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

/* Series Type Options */
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
    | 'lock';

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
