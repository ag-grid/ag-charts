import type { FontWeight } from '../../options/chart/types';
import type { Direction } from './enums';

/** Alias to denote that a value should be a CSS-compliant color string, such as `#FFFFFF` or `rgb(255, 255, 255)` or `white`. */
export type CssColor = string;

/** Alias to denote that a value is an angle in degrees */
export type Degree = number;

/** Alias to denote that a value is a duration in milliseconds */
export type DurationMs = number;

/** Alias to denote that a value is a measurement in pixels. */
export type PixelSize = number;

/** Alias to denote that a value is a ratio, in the range [0, 1]. */
export type Ratio = number;

export type DirectionMetrics = { [K in Direction]?: number };

export interface Point {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface BBox extends Point, Size {}

export interface FillOptions {
    fill?: CssColor | CanvasGradient | CanvasPattern;
    fillOpacity?: Ratio;
}

export interface StrokeOptions {
    stroke?: CssColor | CanvasGradient | CanvasPattern;
    strokeOpacity?: Ratio;
    strokeWidth?: number;
}

export interface LineDashOptions {
    lineDash?: number[];
    lineDashOffset?: number;
}

export interface LineOptions extends LineDashOptions {
    lineCap?: CanvasLineCap;
    lineJoin?: CanvasLineJoin;
    miterLimit?: number;
}

export interface FontOptions {
    fontFamily?: string;
    fontSize?: PixelSize;
    fontStyle?: string;
    fontWeight?: FontWeight;
}

export interface TextOptions {
    textAlign?: CanvasTextAlign;
    textBaseline?: CanvasTextBaseline;
}
