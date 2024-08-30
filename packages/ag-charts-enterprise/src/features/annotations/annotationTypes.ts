import type { _ModuleSupport, _Scene } from 'ag-charts-community';

export type Constructor<T = object> = new (...args: any[]) => T;

export enum AnnotationType {
    // Lines
    Line = 'line',
    HorizontalLine = 'horizontal-line',
    VerticalLine = 'vertical-line',

    // Channels
    DisjointChannel = 'disjoint-channel',
    ParallelChannel = 'parallel-channel',

    // Texts
    Callout = 'callout',
    Comment = 'comment',
    Note = 'note',
    Text = 'text',

    // Shapes
    Arrow = 'arrow',
    ArrowUp = 'arrow-up',
    ArrowDown = 'arrow-down',
}

export type TextualAnnotationType =
    | AnnotationType.Callout
    | AnnotationType.Comment
    | AnnotationType.Note
    | AnnotationType.Text;

export type LineAnnotationType =
    | AnnotationType.Line
    | AnnotationType.HorizontalLine
    | AnnotationType.VerticalLine
    | AnnotationType.Arrow;

export type ChannelAnnotationType = AnnotationType.DisjointChannel | AnnotationType.ParallelChannel;

export const ANNOTATION_TYPES = Object.values(AnnotationType);
export const ANNOTATION_BUTTONS = [
    // Lines
    AnnotationType.Line,
    AnnotationType.HorizontalLine,
    AnnotationType.VerticalLine,

    // Channels
    AnnotationType.DisjointChannel,
    AnnotationType.ParallelChannel,

    // Texts
    AnnotationType.Callout,
    AnnotationType.Comment,
    AnnotationType.Note,
    AnnotationType.Text,

    // Shapes
    AnnotationType.Arrow,
    AnnotationType.ArrowUp,
    AnnotationType.ArrowDown,
] as const;
export const ANNOTATION_BUTTON_GROUPS = ['line-menu', 'text-menu', 'shape-menu'] as const;

export function stringToAnnotationType(value: string) {
    for (const t of ANNOTATION_TYPES) {
        if (t === value) return t;
    }
}

export interface Anchor extends Coords {
    position?: 'above' | 'above-left' | 'right' | 'below';
}

export interface Coords {
    x: number;
    y: number;
}

export interface LineCoords {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Point {
    x?: number | string | Date;
    y?: number;
}

export interface Padding {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface AnnotationAxisContext
    extends Pick<
        _ModuleSupport.AxisContext,
        | 'continuous'
        | 'direction'
        | 'position'
        | 'scaleBandwidth'
        | 'scaleConvert'
        | 'scaleDomain'
        | 'scaleInvert'
        | 'scaleInvertNearest'
        | 'scaleValueFormatter'
        | 'attachLabel'
        | 'inRange'
    > {
    bounds: _Scene.BBox;
    labelPadding: number;
}

export type AnnotationContext = {
    seriesRect: _Scene.BBox;
    xAxis: AnnotationAxisContext;
    yAxis: AnnotationAxisContext;
};

export interface GuardDragClickDoubleEvent {
    guard: () => boolean;
    hover: () => void;
    reset: () => void;
}

export type AnnotationOptionsColorPickerType = 'line-color' | 'fill-color' | 'text-color';

export type AnnotationLineStyle = {
    type?: AnnotationLineStyleType;
    strokeWidth?: number;
};

export type AnnotationLineStyleType = 'solid' | 'dashed' | 'dotted';
