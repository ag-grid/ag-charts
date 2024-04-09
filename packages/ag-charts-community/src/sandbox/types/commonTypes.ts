import type { Direction } from './enums';

export type DirectionMetrics = { [K in Direction]?: number };

export interface SeriesAreaOptions {
    clip?: boolean;
    padding?: DirectionMetrics;
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
