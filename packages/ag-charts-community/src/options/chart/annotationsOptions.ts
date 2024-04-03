import type {
    FillOptions,
    LineDashOptions,
    StrokeOptions,
    Toggleable,
    Visible,
} from '../series/cartesian/commonOptions';

export interface AgAnnotationsOptions extends Toggleable {
    initial?: AgAnnotation[];
    // listeners?: {
    //     annotationsChange?: (event: AgAnnotationsChangeEvent) => void;
    // };
}

// export interface AgAnnotationsChangeEvent {
//     annotations: AgAnnotation[];
// }

export type AgAnnotation = AgLineAnnotation | AgChannelAnnotation; // | AgCrossLineAnnotation

export interface AgLineAnnotation
    extends AnnotationLinePoints,
        Extendable,
        Lockable,
        Visible,
        StrokeOptions,
        LineDashOptions {
    type: 'line';
    // direction?: 'horizontal' | 'vertical';
    // startCap?: 'arrow' | 'circle';
    // endCap?: 'arrow' | 'circle';
}

// export interface AgCrossLineAnnotation extends Visible, FillOptions, StrokeOptions, LineDashOptions {
//     type: 'crossline';
//     point: AgAnnotationPoint;
// }

export interface AgChannelAnnotation extends Extendable, Lockable, Visible, StrokeOptions, LineDashOptions {
    type: 'parallel-channel';
    top: AgChannelLine;
    bottom: AgChannelLine;
    middle?: Visible & StrokeOptions & LineDashOptions;
    background?: FillOptions;
}

export interface AgChannelLine extends AnnotationLinePoints {}

interface AnnotationLinePoints {
    start: AnnotationPoint;
    end: AnnotationPoint;
}

interface AnnotationPoint {
    x: string | number | Date;
    y: string | number | Date;
}

interface Lockable {
    locked?: boolean;
}

interface Extendable {
    // extendLeft?: boolean;
    // extendRight?: boolean;
}
