import type { FillOptions, LineDashOptions, StrokeOptions, Toggleable, Visible } from '../series/cartesian/commonOptions';
export interface AgAnnotationsThemeableOptions extends AgLineAnnotationsTheme, AgChannelAnnotationTheme {
}
type AgLineAnnotationsTheme = {
    line?: AgLineAnnotationStyles & {
        handle?: AgAnnotationHandleStyles;
    };
};
type AgChannelAnnotationTheme = {
    'parallel-channel'?: AgChannelAnnotationStyles & {
        handle?: AgAnnotationHandleStyles;
    };
};
export interface AgAnnotationsOptions extends Toggleable {
    /** The initial set of annotations to display. */
    initial?: AgAnnotation[];
}
export interface AgAnnotationHandleStyles extends FillOptions, StrokeOptions, LineDashOptions {
}
export interface AgLineAnnotationStyles extends Extendable, Lockable, Visible, StrokeOptions, LineDashOptions {
}
export interface AgChannelAnnotationStyles extends Extendable, Lockable, Visible, StrokeOptions, LineDashOptions {
    middle?: AgChannelAnnotationMiddle;
    background?: AgChannelAnnotationBackground;
}
export type AgAnnotation = AgLineAnnotation | AgChannelAnnotation;
export interface AgLineAnnotation extends AnnotationLinePoints, Extendable, Lockable, Visible, StrokeOptions, LineDashOptions {
    type: 'line';
}
export interface AgChannelAnnotation extends Extendable, Lockable, Visible, StrokeOptions, LineDashOptions {
    type: 'parallel-channel';
    top: AgAnnotationLine;
    bottom: AgAnnotationLine;
    middle?: AgChannelAnnotationMiddle;
    background?: AgChannelAnnotationBackground;
}
export interface AgAnnotationLine extends AnnotationLinePoints {
}
export interface AgChannelAnnotationMiddle extends Visible, StrokeOptions, LineDashOptions {
}
export interface AgChannelAnnotationBackground extends FillOptions {
}
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
}
export {};
