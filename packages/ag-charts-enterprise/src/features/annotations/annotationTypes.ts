import { type AgCartesianAxisPosition, _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

export enum AnnotationType {
    Line = 'line',
    CrossLine = 'cross-line',
    DisjointChannel = 'disjoint-channel',
    ParallelChannel = 'parallel-channel',
}
export const ANNOTATION_TYPES = Object.values(AnnotationType);
export const ANNOTATION_BUTTONS = [
    AnnotationType.Line,
    AnnotationType.DisjointChannel,
    AnnotationType.ParallelChannel,
] as const;

export function stringToAnnotationType(value: string) {
    switch (value) {
        case 'line':
            return AnnotationType.Line;
        case 'cross-line':
            return AnnotationType.CrossLine;
        case 'disjoint-channel':
            return AnnotationType.DisjointChannel;
        case 'parallel-channel':
            return AnnotationType.ParallelChannel;
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

export interface StateDragEvent<Annotation, Scene> extends StateClickEvent<Annotation, Scene> {}

export type AnnotationAxisContext = {
    direction: _ModuleSupport.ChartAxisDirection;
    continuous: boolean;
    position?: AgCartesianAxisPosition;
    scaleDomain: _ModuleSupport.AxisContext['scaleDomain'];
    scaleBandwidth: _ModuleSupport.AxisContext['scaleBandwidth'];
    scaleConvert: _ModuleSupport.AxisContext['scaleConvert'];
    scaleInvert: _ModuleSupport.AxisContext['scaleInvert'];
    scaleInvertNearest: _ModuleSupport.AxisContext['scaleInvertNearest'];
    scaleValueFormatter: _ModuleSupport.AxisContext['scaleValueFormatter'];
    bounds: _Scene.BBox;
    labelPadding: number;
};
export type AnnotationContext = {
    seriesRect: _Scene.BBox;
    xAxis: AnnotationAxisContext;
    yAxis: AnnotationAxisContext;
};
