import type { Direction } from './enums';

/** Alias to denote that a value should be a CSS-compliant color string, such as `#FFFFFF` or `rgb(255, 255, 255)` or `white`. */
export type CssColor = string;

/** Alias to denote that a value reflects an alpha opacity in the range [0, 1]. */
export type Opacity = number;

/** Alias to denote that a value is a measurement in pixels. */
export type PixelSize = number;

/** Alias to denote that a value is a ratio, usually in the range [0, 1]. */
export type Ratio = number;

/** Alias to denote that a value is a duration in milliseconds */
export type DurationMs = number;

/** Alias to denote that a value is an angle in degrees */
export type Degree = number;

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

export interface FillOptions {
    fill?: CssColor;
    fillOpacity?: Ratio;
}

export interface StrokeOptions {
    stroke?: CssColor;
    strokeOpacity?: Ratio;
    strokeWidth?: number;
}

export interface FontOptions {
    fontFamily?: string;
    fontSize?: PixelSize;
    fontStyle?: 'normal' | 'italic' | 'oblique';
    fontWeight?: 'normal' | 'bold' | number;
}

export interface TextOptions {
    textAlign?: CanvasTextAlign;
    textBaseline?: CanvasTextBaseline;
}
