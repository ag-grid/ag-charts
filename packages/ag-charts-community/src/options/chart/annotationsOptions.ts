import type {
    FillOptions,
    LineDashOptions,
    StrokeOptions,
    Toggleable,
    Visible,
} from '../series/cartesian/commonOptions';

// --- Theme ---
export interface AgAnnotationsThemeableOptions {
    line?: AgLineAnnotationStyles;
    'cross-line'?: AgLineAnnotationStyles;
    'disjoint-channel'?: AgChannelAnnotationStyles;
    'parallel-channel'?: AgChannelAnnotationStyles;
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
    /** The initial set of annotations to display. */
    initial?: AgAnnotation[];
}

export type AgAnnotation = AgLineAnnotation | AgDisjointChannelAnnotation | AgParallelChannelAnnotation;

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
    x: string | number | Date;
    /** The y-value of the point. */
    y: number;
}

interface Lockable {
    /**
     * Whether the annotation should be locked to prevent editing.
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
