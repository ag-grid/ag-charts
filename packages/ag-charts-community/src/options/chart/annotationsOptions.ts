import type {
    FillOptions,
    LineDashOptions,
    StrokeOptions,
    Toggleable,
    Visible,
} from '../series/cartesian/commonOptions';

// --- Theme ---
export interface AgAnnotationsThemeableOptions extends AgLineAnnotationsTheme, AgChannelAnnotationTheme {
    handle?: AgAnnotationHandleStyles;
}

type AgLineAnnotationsTheme = {
    // TODO: can this work in the docs?
    // [key in AgLineAnnotation['type']]?: AgLineAnnotationStyles;
    line?: AgLineAnnotationStyles;
};

type AgChannelAnnotationTheme = {
    // TODO: can this work in the docs?
    // [key in AgChannelAnnotation['type']]?: AgChannelAnnotationStyles;
    'parallel-channel'?: AgChannelAnnotationStyles;
};

// --- Options ---
export interface AgAnnotationsOptions extends Toggleable {
    /** The initial set of annotations to display. */
    initial?: AgAnnotation[];
}

export interface AgAnnotationHandleStyles extends FillOptions, StrokeOptions, LineDashOptions {}
export interface AgLineAnnotationStyles extends StrokeOptions, LineDashOptions {}
export interface AgChannelAnnotationStyles extends StrokeOptions, LineDashOptions {
    middle?: AgChannelAnnotationMiddleStyles;
    background?: AgChannelAnnotationBackgroundStyles;
}
export interface AgChannelAnnotationMiddleStyles extends StrokeOptions, LineDashOptions {}
export interface AgChannelAnnotationBackgroundStyles extends FillOptions {}

export type AgAnnotation = AgLineAnnotation | AgChannelAnnotation; // | AgCrossLineAnnotation

export interface AgLineAnnotation
    extends AnnotationLinePoints,
        Extendable,
        Lockable,
        Visible,
        StrokeOptions,
        LineDashOptions {
    type: 'line';
    // startCap?: 'arrow' | 'circle';
    // endCap?: 'arrow' | 'circle';
}

export interface AgChannelAnnotation extends Extendable, Lockable, Visible, StrokeOptions, LineDashOptions {
    type: 'parallel-channel';
    top: AgAnnotationLine;
    bottom: AgAnnotationLine;
    middle?: AgChannelAnnotationMiddle;
    background?: AgChannelAnnotationBackground;
}

export interface AgAnnotationLine extends AnnotationLinePoints {}
export interface AgChannelAnnotationMiddle extends Visible, StrokeOptions, LineDashOptions {}
export interface AgChannelAnnotationBackground extends FillOptions {}

interface AnnotationLinePoints {
    start: AgAnnotationPoint;
    end: AgAnnotationPoint;
}

export interface AgAnnotationPoint {
    /** The x-value of the point. */
    x: string | number | Date;
    /** The y-value of the point. */
    y: string | number | Date;
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
