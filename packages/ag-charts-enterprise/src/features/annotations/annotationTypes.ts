export enum AnnotationType {
    Line = 'line',
    DisjointChannel = 'disjoint-channel',
    ParallelChannel = 'parallel-channel',
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
}

export interface StateClickEvent<Annotation, Scene> {
    datum?: Annotation;
    node?: Scene;
    point: Coords;
}
