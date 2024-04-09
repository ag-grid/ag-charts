import type { Position } from './enums';

export type BoxPosition = { [K in Position]?: number };

export interface SeriesAreaOptions {
    clip?: boolean;
    padding?: BoxPosition;
}

export interface Point {
    x: number;
    y: number;
}

export interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}
