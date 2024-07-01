import { _ModuleSupport, _Scene } from 'ag-charts-community';
export declare enum AnnotationType {
    Line = "line",
    DisjointChannel = "disjoint-channel",
    ParallelChannel = "parallel-channel",
    HorizontalLine = "horizontal-line",
    VerticalLine = "vertical-line"
}
export declare const ANNOTATION_TYPES: AnnotationType[];
export declare const ANNOTATION_BUTTONS: readonly [AnnotationType.Line, AnnotationType.DisjointChannel, AnnotationType.ParallelChannel, AnnotationType.HorizontalLine, AnnotationType.VerticalLine];
export declare function stringToAnnotationType(value: string): AnnotationType | undefined;
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
export interface StateDragEvent<Annotation, Scene> extends StateClickEvent<Annotation, Scene> {
}
export interface AnnotationAxisContext extends Pick<_ModuleSupport.AxisContext, 'continuous' | 'direction' | 'position' | 'scaleBandwidth' | 'scaleConvert' | 'scaleDomain' | 'scaleInvert' | 'scaleInvertNearest' | 'scaleValueFormatter' | 'attachLabel' | 'inRange'> {
    bounds: _Scene.BBox;
    labelPadding: number;
}
export type AnnotationContext = {
    seriesRect: _Scene.BBox;
    xAxis: AnnotationAxisContext;
    yAxis: AnnotationAxisContext;
};
