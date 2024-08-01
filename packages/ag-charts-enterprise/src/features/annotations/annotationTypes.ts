import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

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
}
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
] as const;
export const ANNOTATION_BUTTON_GROUPS = ['line-menu', 'text-menu'] as const;

export function stringToAnnotationType(value: string) {
    for (const t of ANNOTATION_TYPES) {
        if (t === value) return t;
    }
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
