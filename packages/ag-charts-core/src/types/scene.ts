export interface Size {
    width: number;
    height: number;
}

export interface Point {
    x: number;
    y: number;
}

export interface SizedPoint extends Point {
    size: number;
    focusSize?: number;
}

export interface Bounds4 {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}
