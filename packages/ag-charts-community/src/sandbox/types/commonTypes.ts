export enum Position {
    TOP = 'top',
    RIGHT = 'right',
    BOTTOM = 'bottom',
    LEFT = 'left',
}

export type BoxPosition = { [K in Position]?: number };

export interface SeriesAreaOptions {
    clip?: boolean;
    padding?: BoxPosition;
}
