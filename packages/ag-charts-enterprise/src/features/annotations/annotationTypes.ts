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
    Text = 'text',
}
export const ANNOTATION_TYPES = Object.values(AnnotationType);
export const ANNOTATION_BUTTONS = [
    // Drawings
    AnnotationType.Line,
    AnnotationType.DisjointChannel,
    AnnotationType.ParallelChannel,
    AnnotationType.HorizontalLine,
    AnnotationType.VerticalLine,

    // Annotations (Texts)
    AnnotationType.Text,
] as const;

export function stringToAnnotationType(value: string) {
    switch (value) {
        // Trend lines
        case 'line':
            return AnnotationType.Line;
        case 'horizontal-line':
            return AnnotationType.HorizontalLine;
        case 'vertical-line':
            return AnnotationType.VerticalLine;

        // Channels
        case 'disjoint-channel':
            return AnnotationType.DisjointChannel;
        case 'parallel-channel':
            return AnnotationType.ParallelChannel;

        // Texts
        case 'text':
            return AnnotationType.Text;
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

export interface Point {
    x?: number | string | Date;
    y?: number;
}

export interface StateHoverEvent<Annotation, Scene> {
    datum: Annotation;
    node: Scene;
    point: Coords;
    region?: _ModuleSupport.RegionName;
}

export interface StateClickEvent<Annotation, Scene> {
    datum?: Annotation;
    node?: Scene;
    point: Coords;
    region?: _ModuleSupport.RegionName;
}

export interface StateInputEvent<Annotation> {
    datum: Annotation;
    value?: string;
}

export interface StateDragEvent<Annotation, Scene> extends StateClickEvent<Annotation, Scene> {}

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
