import type { ImageSegment, Padding, PaddingOptions, Segment } from 'ag-charts-types';

import { LRUCache } from '../structures/lruCache';
import {
    type FontOptions,
    type ITextMeasurer,
    type LegacyTextMetrics,
    LineSplitter,
    type MeasuredImageSegment,
    type MultilineSegmentsMetricsBox,
    type MultilineTextMetricsBox,
    type SegmentsLineMetrics,
    type TextMetricsBox,
} from '../types/text';
import { createCanvasContext } from '../utils/canvas';
import { toFontString, toTextString } from '../utils/text/textUtils';

// Manages text measurement and wrapping functionalities.
export class TextMeasurer implements ITextMeasurer {
    private readonly baselineMap = new Map<string, number>();
    private readonly charMap = new Map<string, number>();
    private lineHeightCache: number | null = null;

    constructor(
        private readonly ctx: CanvasRenderingContext2D,
        private readonly measureTextCached?: (text: string, useCache?: boolean) => LegacyTextMetrics
    ) {}

    baselineDistance(textBaseline: CanvasTextBaseline): number {
        if (textBaseline === 'alphabetic') return 0;
        if (this.baselineMap.has(textBaseline)) {
            return this.baselineMap.get(textBaseline)!;
        }
        this.ctx.textBaseline = textBaseline;
        const { alphabeticBaseline } = this.ctx.measureText('');
        this.baselineMap.set(textBaseline, alphabeticBaseline);
        this.ctx.textBaseline = 'alphabetic';
        return alphabeticBaseline; // Distance from the alphabetic baseline to the specified baseline.
    }

    lineHeight() {
        this.lineHeightCache ??= this.measureText('').height;
        return this.lineHeightCache;
    }

    measureText(text: string): TextMetricsBox {
        const m = this.measureTextCached?.(text) ?? this.ctx.measureText(text);
        const {
            width,
            // Apply fallbacks for environments like `node-canvas` where some metrics may be missing.
            fontBoundingBoxAscent: ascent = m.emHeightAscent,
            fontBoundingBoxDescent: descent = m.emHeightDescent,
        } = m;
        const height = ascent + descent;
        return { width, height, ascent, descent };
    }

    measureLines(text: string | string[]): MultilineTextMetricsBox {
        const lines = typeof text === 'string' ? text.split(LineSplitter) : text;
        let width = 0;
        let height = 0;
        const lineMetrics = lines.map((line) => {
            const b = this.measureText(line);
            if (width < b.width) {
                width = b.width;
            }
            height += b.height;
            return { text: line, ...b };
        });
        return { width, height, lineMetrics };
    }

    textWidth(text: string, estimate?: boolean): number {
        if (estimate) {
            let estimatedWidth = 0;
            for (let i = 0; i < text.length; i++) {
                estimatedWidth += this.textWidth(text.charAt(i));
            }
            return estimatedWidth;
        }
        if (text.length > 1) {
            return this.ctx.measureText(text).width;
        }
        return this.charMap.get(text) ?? this.charWidth(text);
    }

    private charWidth(char: string) {
        const { width } = this.ctx.measureText(char);
        this.charMap.set(char, width);
        return width;
    }
}

const instanceMap = new LRUCache<TextMeasurer>(50);
export function cachedTextMeasurer(font: string | FontOptions): TextMeasurer {
    if (typeof font === 'object') {
        font = toFontString(font);
    }

    let cachedMeasurer = instanceMap.get(font);
    if (cachedMeasurer) return cachedMeasurer;

    const cachedTextMetrics = new LRUCache<LegacyTextMetrics>(10_000);
    const ctx = createCanvasContext();
    ctx.font = font;

    cachedMeasurer = new TextMeasurer(ctx, (text) => {
        let textMetrics = cachedTextMetrics.get(text);
        if (textMetrics) return textMetrics;
        textMetrics = ctx.measureText(text);
        cachedTextMetrics.set(text, textMetrics);
        return textMetrics;
    });
    instanceMap.set(font, cachedMeasurer);
    return cachedMeasurer;
}

cachedTextMeasurer.clear = () => instanceMap.clear();

export function resolvePadding(padding: Padding | undefined): Required<PaddingOptions> {
    if (padding == null) return { top: 0, right: 0, bottom: 0, left: 0 };
    if (typeof padding === 'number') return { top: padding, right: padding, bottom: padding, left: padding };
    return {
        top: padding.top ?? 0,
        right: padding.right ?? 0,
        bottom: padding.bottom ?? 0,
        left: padding.left ?? 0,
    };
}

export function imageSegmentBox(segment: ImageSegment): TextMetricsBox {
    const pad = resolvePadding(segment.padding);
    const width = segment.width + pad.left + pad.right;
    const height = segment.height + pad.top + pad.bottom;
    return { width, height, ascent: height, descent: 0 };
}

/** Horizontal gap between a block-leading image and the text column to its right, and between
 * adjacent images in a leading block-image strip. */
export const BLOCK_IMAGE_SPACING = 4;

/** Total width of a leading block-image strip, including inter-image spacing. */
export function blockStripWidth(images: { textMetrics: TextMetricsBox }[]): number {
    if (images.length === 0) return 0;
    let total = 0;
    for (let i = 0; i < images.length; i++) {
        total += images[i].textMetrics.width;
        if (i > 0) total += BLOCK_IMAGE_SPACING;
    }
    return total;
}

/** Maximum height across a leading block-image strip. */
export function blockStripHeight(images: { textMetrics: TextMetricsBox }[]): number {
    let max = 0;
    for (const img of images) max = Math.max(max, img.textMetrics.height);
    return max;
}

/**
 * Returns true when the segment at `i` is a `block: true` image that opens, or extends, a leading
 * block-image strip on the current row. A new row opens at index 0 or when the immediately
 * preceding text segment ends with `\n`. Once a row is open, subsequent `block: true` images
 * adjacent to the strip (with no intervening text or inline image) are appended to the strip;
 * the text column flows to the right of the entire strip. Block images sitting mid-line
 * (preceded by inline content with no `\n`) keep the inline-image behaviour.
 */
export function isBlockBoundary(segments: Segment[], i: number): boolean {
    const seg = segments[i];
    if (seg?.type !== 'image' || seg.block !== true) return false;
    if (i === 0) return true;
    const prev = segments[i - 1];
    if (prev.type === 'image') return prev.block === true;
    return toTextString(prev.text).endsWith('\n');
}

function emptyLine(): SegmentsLineMetrics {
    return { segments: [], width: 0, height: 0, ascent: 0, descent: 0 };
}

export function measureTextSegments(textSegments: Segment[], defaultFont: FontOptions): MultilineSegmentsMetricsBox {
    let currentLine = emptyLine();
    const lineMetrics: SegmentsLineMetrics[] = [currentLine];
    let currentLineUncommitted = false;

    // Tracks the currently-open block row. `startLineIndex` is the index of the marker line in
    // `lineMetrics`. The block row's text column wraps within the inner lines that follow.
    let blockStartIndex: number | null = null;

    function finalizeBlock() {
        if (blockStartIndex === null) return;
        let endIndex = lineMetrics.length;
        // Exclude a trailing line that was opened by `\n` but never had content written to it —
        // that empty line belongs outside the block row (either as a true blank line in a non-block
        // context, or as the marker for the next block row).
        if (currentLineUncommitted && endIndex > blockStartIndex + 1) {
            endIndex -= 1;
        }
        lineMetrics[blockStartIndex].blockRowSpan = endIndex - blockStartIndex;
        blockStartIndex = null;
    }

    function openNewLine() {
        currentLine = emptyLine();
        lineMetrics.push(currentLine);
        currentLineUncommitted = true;
    }

    for (let i = 0; i < textSegments.length; i++) {
        const segment = textSegments[i];

        if (isBlockBoundary(textSegments, i)) {
            // A block image either opens a new row (when index 0 / after \n) or extends the leading
            // strip on the row that is already open. The distinction is whether the previous
            // segment is itself a block image with no inline content between them.
            const extendsStrip =
                i > 0 && textSegments[i - 1].type === 'image' && (textSegments[i - 1] as ImageSegment).block === true;
            if (!extendsStrip) {
                finalizeBlock();
                // Start a new line for the block marker unless we are already on a fresh empty one
                // (which happens when the previous text segment ended with `\n`).
                if (currentLine.segments.length > 0 || currentLine.blockImages) {
                    openNewLine();
                }
            }
            const blockMetrics = imageSegmentBox(segment as ImageSegment);
            const measured: MeasuredImageSegment = { ...(segment as ImageSegment), textMetrics: blockMetrics };
            currentLine.blockImages ??= [];
            currentLine.blockImages.push(measured);
            if (!extendsStrip) {
                blockStartIndex = lineMetrics.length - 1;
            }
            currentLineUncommitted = false;
            continue;
        }

        if (segment.type === 'image') {
            // Inline image (block flag absent or non-boundary).
            const textMetrics = imageSegmentBox(segment);
            currentLine.width += textMetrics.width;
            currentLine.ascent = Math.max(currentLine.ascent, textMetrics.ascent);
            currentLine.descent = Math.max(currentLine.descent, textMetrics.descent);
            currentLine.height = Math.max(currentLine.height, currentLine.ascent + currentLine.descent);
            currentLine.segments.push({ ...segment, textMetrics });
            currentLineUncommitted = false;
            continue;
        }

        const {
            text,
            fontSize = defaultFont.fontSize,
            fontStyle = defaultFont.fontStyle,
            fontWeight = defaultFont.fontWeight,
            fontFamily = defaultFont.fontFamily,
            lineHeight,
            ...rest
        } = segment;

        const font = { fontSize, fontStyle, fontWeight, fontFamily };
        const measurer = cachedTextMeasurer(font);
        const textLines = toTextString(text).split(LineSplitter);

        for (let j = 0; j < textLines.length; j++) {
            const textLine = textLines[j];
            const textMetrics = measurer.measureText(textLine);
            // On new line, push a new line metrics object
            if (j > 0) {
                openNewLine();
            }
            if (textLine) {
                currentLine.width += textMetrics.width;
                currentLine.ascent = Math.max(currentLine.ascent, textMetrics.ascent);
                currentLine.descent = Math.max(currentLine.descent, textMetrics.descent);
                currentLine.height = Math.max(currentLine.height, currentLine.ascent + currentLine.descent);
                if (typeof lineHeight === 'number' && lineHeight > currentLine.height) {
                    // Extra space is distributed to descent so the baseline-anchored layout in the
                    // renderer (alphabetic) keeps following lines spaced by the override.
                    currentLine.descent = lineHeight - currentLine.ascent;
                    currentLine.height = lineHeight;
                }
                currentLine.segments.push({ ...font, ...rest, text: textLine, textMetrics });
                currentLineUncommitted = false;
            }
        }
    }

    finalizeBlock();

    let maxWidth = 0;
    let totalHeight = 0;
    for (let i = 0; i < lineMetrics.length; ) {
        const line = lineMetrics[i];
        if (line.blockImages?.length) {
            const span = line.blockRowSpan ?? 1;
            const stripWidth = blockStripWidth(line.blockImages);
            const stripHeight = blockStripHeight(line.blockImages);
            let innerColWidth = 0;
            let innerColHeight = 0;
            for (let k = 0; k < span; k++) {
                const inner = lineMetrics[i + k];
                innerColWidth = Math.max(innerColWidth, inner.width);
                innerColHeight += inner.height;
            }
            const rowWidth = stripWidth + (innerColWidth > 0 ? BLOCK_IMAGE_SPACING + innerColWidth : 0);
            const rowHeight = Math.max(stripHeight, innerColHeight);
            maxWidth = Math.max(maxWidth, rowWidth);
            totalHeight += rowHeight;
            i += span;
        } else {
            maxWidth = Math.max(maxWidth, line.width);
            totalHeight += line.height;
            i += 1;
        }
    }

    return { width: maxWidth, height: totalHeight, lineMetrics };
}

export type {
    ITextMeasurer,
    LineMetricsBox,
    MeasuredSegment,
    MultilineSegmentsMetricsBox,
    MultilineTextMetricsBox,
    SegmentsLineMetrics,
    TextMetricsBox,
} from '../types/text';
