export interface Point {
    x: number;
    y: number;
}

export interface SizedPoint extends Point {
    size: number;
    focusSize?: number;
}
