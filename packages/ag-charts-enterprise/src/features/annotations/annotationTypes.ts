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
