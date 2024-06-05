import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

export enum AnnotationType {
    Line = 'line',
    CrossLine = 'cross-line',
    DisjointChannel = 'disjoint-channel',
    ParallelChannel = 'parallel-channel',
}

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

export type Domain = any[];
export type Scale = _Scene.Scale<any, number, number | _Util.TimeInterval>;

export interface ValidationContext {
    domainX?: Domain;
    domainY?: Domain;
    scaleX?: Scale;
    scaleY?: Scale;
}

export interface UpdateContext {
    scaleX?: Scale;
    scaleY?: Scale;
    seriesRect?: _Scene.BBox;
}
