import type { FontFamily, FontSize, FontStyle, FontWeight, TextSegment } from 'ag-charts-types';

import type { Writeable } from './global';
import type { Size } from './scene';

export const EllipsisChar = '\u2026';
export const LineSplitter = /\r?\n/g;
export const TrimEdgeGuard = '\u200B'; // zero-width space, not trimmed
export const TrimCharsRegex = /[\s.,;:-]{1,5}$/;

export interface FontOptions {
    fontSize: FontSize;
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    fontFamily?: FontFamily;
}

export interface TextMetricsBox {
    width: number;
    height: number;
    ascent: number;
    descent: number;
}

export interface LineMetricsBox extends TextMetricsBox {
    text: string;
}

export interface MultilineTextMetricsBox {
    width: number;
    height: number;
    lineMetrics: LineMetricsBox[];
}

export interface MeasuredSegment extends Omit<TextSegment, 'text'> {
    text: string;
    fontSize: number;
    textMetrics: TextMetricsBox;
}

export interface SegmentsLineMetrics extends Size {
    ascent: number;
    descent: number;
    segments: MeasuredSegment[];
}

export interface MultilineSegmentsMetricsBox {
    width: number;
    height: number;
    lineMetrics: SegmentsLineMetrics[];
}

export interface LegacyTextMetrics extends Writeable<TextMetrics> {
    emHeightAscent: number;
    emHeightDescent: number;
}

export interface ITextMeasurer {
    measureText(text: string): TextMetricsBox;
    measureLines(text: string | string[]): MultilineTextMetricsBox;
    baselineDistance(textBaseline: CanvasTextBaseline): number;
    textWidth(text: string, estimate?: boolean): number;
    lineHeight(): number;
}
