import type {
    FillOptions,
    LineDashOptions,
    StrokeOptions,
    Toggleable,
    Visible,
} from '../series/cartesian/commonOptions';

export interface AgAnnotationsOptions extends Toggleable {
    enableInteractions?: boolean;
    initial?: AgAnnotation[];
    // listeners?: {
    //     annotationsChange?: (event: AgAnnotationsChangeEvent) => void;
    // };
}

// export interface AgAnnotationsChangeEvent {
//     annotations: AgAnnotation[];
// }

export type AgAnnotation = AgLineAnnotation | AgChannelAnnotation; // | AgCrossLineAnnotation

export interface AgLineAnnotation extends AnnotationLinePoints, Visible, Extendable, StrokeOptions, LineDashOptions {
    type: 'line';
    // direction?: 'horizontal' | 'vertical';
    // startCap?: 'arrow' | 'circle';
    // endCap?: 'arrow' | 'circle';
}

// export interface AgCrossLineAnnotation extends Visible, FillOptions, StrokeOptions, LineDashOptions {
//     type: 'crossline';
//     point: AgAnnotationPoint;
// }

export interface AgChannelAnnotation extends Visible, Extendable, StrokeOptions, LineDashOptions {
    type: 'parallel-channel' | 'disjoint-channel';
    top: AgChannelLine;
    bottom: AgChannelLine;
    middle?: Visible & StrokeOptions & LineDashOptions;
    background?: FillOptions;
}

export interface AgChannelLine extends AnnotationLinePoints {}

interface AnnotationLinePoints {
    start: AgAnnotationPoint;
    end: AgAnnotationPoint;
}

interface AgAnnotationPoint {
    x: string | number | Date;
    y: string | number | Date;
}

interface Extendable {
    // extendLeft?: boolean;
    // extendRight?: boolean;
}
