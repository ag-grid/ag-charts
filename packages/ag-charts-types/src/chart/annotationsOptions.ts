import type {
    FillOptions,
    FontOptions,
    LineDashOptions,
    StrokeOptions,
    Toggleable,
    Visible,
} from '../series/cartesian/commonOptions';
import type { Formatter } from './callbackOptions';
import type { PixelSize } from './types';

// --- Theme ---
export interface AgAnnotationsThemeableOptions {
    axesButtons?: AgAnnotationAxesButtons;
    line?: AgLineAnnotationStyles;
    'horizontal-line'?: AgLineAnnotationStyles;
    'vertical-line'?: AgLineAnnotationStyles;
    'disjoint-channel'?: AgChannelAnnotationStyles;
    'parallel-channel'?: AgChannelAnnotationStyles;
}

export interface AgAnnotationAxesButtons extends Toggleable {
    /** Axes which the buttons belong to. */
    axes?: 'x' | 'y' | 'xy';
}

export interface AgAnnotationHandleStyles extends FillOptions, StrokeOptions, LineDashOptions {}
export interface AgLineAnnotationStyles extends Extendable, Lockable, Visible, StrokeOptions, LineDashOptions {
    handle?: AgAnnotationHandleStyles;
}
export interface AgChannelAnnotationStyles extends Extendable, Lockable, Visible, StrokeOptions, LineDashOptions {
    handle?: AgAnnotationHandleStyles;
    middle?: AgChannelAnnotationMiddle;
    background?: AgChannelAnnotationBackground;
}

// --- Options ---
export interface AgAnnotationsOptions extends Toggleable {
    /** The options for the axes buttons */
    axesButtons?: AgAnnotationAxesButtons;
}

export type AgAnnotation =
    | AgLineAnnotation
    | AgHorizontalLineAnnotation
    | AgVerticalLineAnnotation
    | AgDisjointChannelAnnotation
    | AgParallelChannelAnnotation;

export interface AgLineAnnotation
    extends AnnotationLinePoints,
        Cappable,
        Extendable,
        Lockable,
        Visible,
        StrokeOptions,
        LineDashOptions {
    type: 'line';
}

export interface AgHorizontalLineAnnotation extends AgCrossLineAnnotation {
    type: 'horizontal-line';
}

export interface AgVerticalLineAnnotation extends AgCrossLineAnnotation {
    type: 'vertical-line';
}

export interface AgCrossLineAnnotation extends Lockable, Visible, StrokeOptions, LineDashOptions {
    value: AgAnnotationValue;
    axisLabel?: AgAnnotationAxisLabel;
}

export interface AgAnnotationAxisLabel extends FillOptions, StrokeOptions, LineDashOptions, AgAnnotationLabelOptions {
    /** Apply rounded corners to the axis label container. */
    cornerRadius?: PixelSize;
}

export interface AgAnnotationLabelOptions extends Toggleable, FontOptions {
    /** A custom formatting function used to convert values into text for display by labels. */
    formatter?: Formatter<AgAnnotationLabelFormatterParams>;
}

export interface AgAnnotationLabelFormatterParams {
    /** The default label value that would have been used without a formatter. */
    value: any;
}

export interface AgParallelChannelAnnotation
    extends AnnotationLinePoints,
        Extendable,
        Lockable,
        Visible,
        StrokeOptions,
        LineDashOptions {
    type: 'parallel-channel';
    /* The height of the annotation along the y-axis. */
    height: number;
    middle?: AgChannelAnnotationMiddle;
    background?: AgChannelAnnotationBackground;
}

export interface AgDisjointChannelAnnotation
    extends AnnotationLinePoints,
        Extendable,
        Lockable,
        Visible,
        StrokeOptions,
        LineDashOptions {
    type: 'disjoint-channel';
    /** The height of the annotation along the y-axis at the start. */
    startHeight: number;
    /** The height of the annotation along the y-axis at the end. */
    endHeight: number;
    background?: AgChannelAnnotationBackground;
}

// --- Components ---
export interface AgChannelAnnotationMiddle extends Visible, StrokeOptions, LineDashOptions {}
export interface AgChannelAnnotationBackground extends FillOptions {}

interface AnnotationLinePoints {
    /** The starting point of a linear annotation. */
    start: AgAnnotationPoint;
    /** The end point of a linear annotation. */
    end: AgAnnotationPoint;
}

export interface AgAnnotationPoint {
    /** The x-value of the point. */
    x: AgAnnotationValue;
    /** The y-value of the point. */
    y: number;
}

interface Lockable {
    /**
     * Whether the annotation should be locked to prevent editing.
     *
     * Default: `false`
     */
    locked?: boolean;
}

interface Extendable {
    // extendLeft?: boolean;
    // extendRight?: boolean;
}

interface Cappable {
    // startCap?: Cap;
    // endCap?: Cap;
}

export type Cap = 'arrow' | 'circle';

export type AgAnnotationValue = string | number | AgStateSerializableDate;

export interface AgStateSerializableDate {
    __type: 'date';
    value: string | number;
}
