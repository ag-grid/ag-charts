import type { FontFamily, FontSize, FontStyle, FontWeight, ImageSegment } from 'ag-charts-types';

import type { Writeable } from './global';
import type { NormalisedTextSegment } from './normalised-options/normalisedCommonOptions';
import type { Size } from './scene';

export const EllipsisChar = '\u2026';
export const LineSplitter = /\r?\n/g;
export const TrimEdgeGuard = '\u200B'; // zero-width space, not trimmed
export const TrimCharsRegex = /[\s.,;:-]{1,5}$/;
// The legacy embedding pair rather than the modern isolates (U+2066/U+2069): Safari's canvas
// ignores the isolate characters. Both are zero-width.
export const LtrEmbedding = '\u202A'; // LRE
export const PopDirectionalFormatting = '\u202C'; // PDF

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

export interface MeasuredTextSegment extends Omit<NormalisedTextSegment, 'text'> {
    text: string;
    fontSize: number;
    textMetrics: TextMetricsBox;
}

export interface MeasuredImageSegment extends ImageSegment {
    /** Box equivalent for layout: width + horizontal padding, height + vertical padding, ascent = height. */
    textMetrics: TextMetricsBox;
}

export type MeasuredSegment = MeasuredTextSegment | MeasuredImageSegment;

export interface SegmentsLineMetrics extends Size {
    ascent: number;
    descent: number;
    /**
     * Ascent/descent of the line's text segments alone, ignoring inline images. Inline image boxes
     * are positioned relative to these (not the full `ascent`/`descent`, which the image itself may
     * have inflated), so an image aligns to the text rather than to the line box. Equal to
     * `ascent`/`descent` on a line with no inline images.
     */
    textAscent: number;
    textDescent: number;
    segments: MeasuredSegment[];
    /**
     * Present on the first line of a block row: the leading block-image strip, anchored to the left
     * of the row. Multiple images are laid out side-by-side in the order given, separated by
     * `BLOCK_IMAGE_SPACING`. The next `blockRowSpan` line metrics describe the text column that
     * wraps to the right of the entire strip.
     */
    blockImages?: MeasuredImageSegment[];
    /** Number of consecutive line-metric entries that belong to this block row. Always ≥ 1 when `blockImages` is set. */
    blockRowSpan?: number;
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
