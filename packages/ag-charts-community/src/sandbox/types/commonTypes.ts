export enum Position {
    Top = 'top',
    Right = 'right',
    Bottom = 'bottom',
    Left = 'left',
}

export enum Direction {
    Horizontal = 'horizontal',
    Vertical = 'vertical',
}

export type BoxPosition = { [K in Position]?: number };

export interface SeriesAreaOptions {
    clip?: boolean;
    padding?: BoxPosition;
}
