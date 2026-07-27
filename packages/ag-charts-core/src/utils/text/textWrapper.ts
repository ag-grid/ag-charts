import type { ImageSegment, OverflowStrategy, TextWrap } from 'ag-charts-types';

import {
    BLOCK_IMAGE_SPACING,
    blockStripWidth,
    cachedTextMeasurer,
    imageSegmentBox,
    isBlockBoundary,
    measureTextSegments,
} from '../../rendering/textMeasurer';
import type {
    NormalisedContentSegment,
    NormalisedTextOrSegments,
} from '../../types/normalised-options/normalisedCommonOptions';
import type { ITextMeasurer, MeasuredImageSegment, MeasuredSegment, MeasuredTextSegment } from '../../types/text';
import { isArray, isFiniteNumber } from '../types/typeGuards';
import {
    EllipsisChar,
    type FontOptions,
    LineSplitter,
    TrimEdgeGuard,
    appendEllipsis,
    graphemeSegments,
    guardTextEdges,
    isTextTruncated,
    preserveArabicJoining,
    toTextString,
    unguardTextEdges,
} from './textUtils';

/**
 * How a label's text adapts to the region produced by its placement. `maxWidth`/`maxHeight` bound the
 * region explicitly; when omitted the fit step derives a budget from the series or an estimate.
 */
export interface LabelFit {
    readonly maxWidth?: number;
    readonly maxHeight?: number;
    readonly wrapping?: TextWrap;
    readonly overflowStrategy?: OverflowStrategy;
}

// Extended measurement options including wrapping behaviour.
export interface WrapOptions {
    font: FontOptions;
    maxWidth: number;
    maxHeight?: number;
    lineHeight?: number;
    textWrap?: TextWrap;
    overflow?: OverflowStrategy;
    avoidOrphans?: boolean;
}

function shouldHideOverflow(clippedResult: string[], options: WrapOptions) {
    return options.overflow === 'hide' && clippedResult.some(isTextTruncated);
}

export function wrapTextOrSegments(text: string, options: WrapOptions): string;
export function wrapTextOrSegments(segments: NormalisedContentSegment[], options: WrapOptions): MeasuredSegment[];
export function wrapTextOrSegments(input: NormalisedTextOrSegments, options: WrapOptions): string | MeasuredSegment[];
export function wrapTextOrSegments(input: NormalisedTextOrSegments, options: WrapOptions) {
    return isArray(input) ? wrapTextSegments(input, options) : wrapLines(toTextString(input), options).join('\n');
}

export function wrapText(text: string, options: WrapOptions) {
    return wrapLines(text, options).join('\n');
}

/**
 * Adapts a label's text to its fit policy (wrap/truncate), mirroring how the caption fits its own text.
 * Returns the input unchanged when the policy sets no width or height bound, so an unset policy is a
 * no-op and callers can apply it unconditionally.
 */
export function fitLabelText(
    text: NormalisedTextOrSegments,
    fit: LabelFit | undefined,
    font: FontOptions
): NormalisedTextOrSegments {
    if (fit == null) return text;
    const { maxWidth, maxHeight, wrapping, overflowStrategy } = fit;
    if (maxWidth == null && maxHeight == null) return text;
    return wrapTextOrSegments(text, {
        font,
        maxWidth: maxWidth ?? Infinity,
        maxHeight,
        textWrap: wrapping,
        overflow: overflowStrategy,
    });
}

export function wrapLines(text: string, options: WrapOptions) {
    return textWrap(text, options);
}

export function truncateLine(text: string, measurer: ITextMeasurer, maxWidth: number, ellipsisForce?: boolean) {
    const ellipsisWidth = measurer.textWidth(EllipsisChar);
    const graphemes = graphemeSegments(text);
    let estimatedWidth = 0;
    let charOffset = 0;
    for (const grapheme of graphemes) {
        const charWidth = measurer.textWidth(grapheme);
        if (estimatedWidth + charWidth > maxWidth) break;
        estimatedWidth += charWidth;
        charOffset += grapheme.length;
    }
    if (charOffset === text.length && (!ellipsisForce || estimatedWidth + ellipsisWidth <= maxWidth)) {
        return ellipsisForce ? appendEllipsis(text) : text;
    }
    text = text.slice(0, charOffset).trimEnd();
    const g = graphemeSegments(text);
    while (g.length && measurer.textWidth(text) + ellipsisWidth > maxWidth) {
        g.pop();
        while (g.length && g.at(-1)!.trim() === '') {
            g.pop();
        }
        text = g.join('');
    }
    return appendEllipsis(text);
}

function textWrap(text: string, options: WrapOptions, widthOffset = 0) {
    const lines: string[] = text.split(LineSplitter);
    const measurer = cachedTextMeasurer(options.font);
    const result: string[] = [];

    if (options.textWrap === 'never') {
        for (const line of lines) {
            const truncatedLine = truncateLine(line.trimEnd(), measurer, Math.max(0, options.maxWidth - widthOffset));
            if (!truncatedLine) break;
            result.push(truncatedLine);
            widthOffset = 0;
        }
        return shouldHideOverflow(result, options) ? [] : result;
    }

    const wrapHyphenate = options.textWrap === 'hyphenate';
    const wrapOnSpace = options.textWrap == null || options.textWrap === 'on-space';

    for (const untrimmedLine of lines) {
        let line = untrimmedLine.trimEnd();

        if (line === '') {
            result.push(line);
            continue;
        }

        let graphemes = graphemeSegments(line);
        let i = 0;
        let charOffset = 0;
        let estimatedWidth = 0;
        let lastSpaceIndex = 0;

        if (!result.length) {
            estimatedWidth = widthOffset;
        }

        while (i < graphemes.length) {
            const char = graphemes[i];

            if (char === ' ') {
                lastSpaceIndex = charOffset;
            }

            estimatedWidth += measurer.textWidth(char);

            if (estimatedWidth > options.maxWidth) {
                // char width is greater than options.maxWidth
                if (i === 0) {
                    line = '';
                    break;
                }

                // check actual width in case estimation is off
                let actualWidth = measurer.textWidth(line.slice(0, charOffset + char.length));
                if (!result.length) {
                    actualWidth += widthOffset;
                }
                if (actualWidth <= options.maxWidth) {
                    estimatedWidth = actualWidth;
                    charOffset += char.length;
                    i++;
                    continue;
                }

                if (lastSpaceIndex) {
                    const nextWord = getWordAt(line, lastSpaceIndex + 1);
                    const textWidth = measurer.textWidth(nextWord);

                    if (textWidth <= options.maxWidth) {
                        result.push(line.slice(0, lastSpaceIndex).trimEnd());
                        line = line.slice(lastSpaceIndex).trimStart();
                        graphemes = graphemeSegments(line);

                        i = 0; // reset the index after cutting the line
                        charOffset = 0;
                        estimatedWidth = 0; // reset the width
                        lastSpaceIndex = 0; // reset last space index
                        continue;
                    } else if (wrapOnSpace && textWidth > options.maxWidth) {
                        result.push(
                            line.slice(0, lastSpaceIndex).trimEnd(),
                            truncateLine(line.slice(lastSpaceIndex).trimStart(), measurer, options.maxWidth, true)
                        );
                    }
                } else if (wrapOnSpace) {
                    const newLine = truncateLine(line, measurer, options.maxWidth, true);
                    if (newLine) {
                        result.push(newLine);
                    }
                }

                if (wrapOnSpace) {
                    line = '';
                    break;
                }

                const postfix = wrapHyphenate ? '-' : '';
                let newLine = line.slice(0, charOffset).trim();
                const g = graphemeSegments(newLine);
                while (g.length && measurer.textWidth(newLine + postfix) > options.maxWidth) {
                    g.pop();
                    while (g.length && g.at(-1)!.trim() === '') {
                        g.pop();
                    }
                    newLine = g.join('');
                }

                if (newLine && newLine !== TrimEdgeGuard) {
                    result.push(preserveArabicJoining(newLine) + postfix);
                } else {
                    line = '';
                    break;
                }

                line = line.slice(newLine.length).trimStart();
                graphemes = graphemeSegments(line);

                i = 0; // reset the index after cutting the line
                charOffset = 0;
                estimatedWidth = 0; // reset the width
                lastSpaceIndex = 0; // reset last space index
                continue;
            }

            charOffset += char.length;
            i++;
        }

        if (line) {
            result.push(line);
        }
    }

    avoidOrphans(result, measurer, options);
    const clippedResult = clipLines(result, measurer, options);
    return shouldHideOverflow(clippedResult, options) ? [] : clippedResult;
}

function getWordAt(text: string, position: number) {
    const nextSpaceIndex = text.indexOf(' ', position);
    return nextSpaceIndex === -1 ? text.slice(position) : text.slice(position, nextSpaceIndex);
}

export function clipLines(lines: string[], measurer: ITextMeasurer, options: WrapOptions) {
    if (!isFiniteNumber(options.maxHeight)) {
        return lines;
    }

    const { height, lineMetrics } = measurer.measureLines(lines);

    if (height <= options.maxHeight) {
        return lines;
    }

    for (let i = 0, cumulativeHeight = 0; i < lineMetrics.length; i++) {
        cumulativeHeight += lineMetrics[i].height;
        if (cumulativeHeight > options.maxHeight) {
            if (options.overflow === 'hide' || i === 0) return [];
            const clippedResults = lines.slice(0, i);
            const lastLine = clippedResults.pop()!;
            return clippedResults.concat(
                isTextTruncated(lastLine) ? lastLine : truncateLine(lastLine, measurer, options.maxWidth, true)
            );
        }
    }

    return lines;
}

function avoidOrphans(lines: string[], measurer: ITextMeasurer, options: WrapOptions) {
    if (options.avoidOrphans === false || lines.length < 2) return;

    const { length } = lines;
    const lastLine = lines[length - 1];
    const beforeLast = lines[length - 2];

    if (graphemeSegments(beforeLast).length < graphemeSegments(lastLine).length) return;

    const lastSpaceIndex = beforeLast.lastIndexOf(' ');
    // If the last line has an orphan, and the previous line has more than one space
    if (lastSpaceIndex === -1 || lastSpaceIndex === beforeLast.indexOf(' ') || lastLine.includes(' ')) return;

    const lastWord = beforeLast.slice(lastSpaceIndex + 1);
    if (measurer.textWidth(lastLine + lastWord) <= options.maxWidth) {
        lines[length - 2] = beforeLast.slice(0, lastSpaceIndex);
        lines[length - 1] = lastWord + ' ' + lastLine;
    }
}

interface SegmentGroup {
    /** Leading block-image strip for the row. Multiple images render side-by-side at the left. */
    blockImages: ImageSegment[];
    segments: NormalisedContentSegment[];
}

function splitIntoBlockGroups(textSegments: NormalisedContentSegment[]): SegmentGroup[] {
    const groups: SegmentGroup[] = [];
    let current: SegmentGroup | null = null;
    for (let i = 0; i < textSegments.length; i++) {
        const seg = textSegments[i];
        if (isBlockBoundary(textSegments, i)) {
            // A block boundary either opens a new row or extends the leading strip of the row
            // already being built. The strip extends when the previous segment was itself a block
            // image (and therefore part of the same strip).
            const extendsStrip =
                i > 0 && textSegments[i - 1].type === 'image' && (textSegments[i - 1] as ImageSegment).block === true;
            if (extendsStrip && current) {
                current.blockImages.push(seg as ImageSegment);
            } else {
                if (current) groups.push(current);
                current = { blockImages: [seg as ImageSegment], segments: [] };
            }
        } else {
            current ??= { blockImages: [], segments: [] };
            current.segments.push(seg);
        }
    }
    if (current) groups.push(current);
    return groups;
}

export function wrapTextSegments(textSegments: NormalisedContentSegment[], options: WrapOptions): MeasuredSegment[] {
    const groups = splitIntoBlockGroups(textSegments);
    if (groups.length === 0) return [];

    // Fast path: single inline group with no images.
    if (
        groups.length === 1 &&
        groups[0].blockImages.length === 0 &&
        !groups[0].segments.some((s) => s.type === 'image')
    ) {
        return fitMeasuredSegments(groups[0].segments, options);
    }

    let remainingMaxHeight = options.maxHeight ?? Infinity;
    const result: MeasuredSegment[] = [];

    for (const group of groups) {
        if (remainingMaxHeight <= 0) break;
        const groupOptions = Number.isFinite(remainingMaxHeight)
            ? { ...options, maxHeight: remainingMaxHeight }
            : options;
        const groupResult = wrapGroup(group, groupOptions);
        if (groupResult.length === 0) continue;

        result.push(...groupResult);

        if (Number.isFinite(remainingMaxHeight)) {
            remainingMaxHeight -= measureTextSegments(groupResult, options.font).height;
        }
    }

    return result;
}

function wrapGroup(group: SegmentGroup, options: WrapOptions): MeasuredSegment[] {
    if (group.blockImages.length === 0) {
        return wrapInlineSegments(group.segments, options);
    }
    return wrapBlockGroup(group.blockImages, group.segments, options);
}

function wrapInlineSegments(segments: NormalisedContentSegment[], options: WrapOptions): MeasuredSegment[] {
    if (segments.length === 0) return [];
    if (!segments.some((s) => s.type === 'image')) {
        return fitMeasuredSegments(segments, options);
    }
    return wrapInlineSegmentsWithOverflow(segments, options);
}

function wrapInlineSegmentsWithOverflow(segments: NormalisedContentSegment[], options: WrapOptions): MeasuredSegment[] {
    const maxHeight = options.maxHeight ?? Infinity;
    // Drop any image that exceeds the width or height budget on its own; no strategy can keep it.
    // Build a single working array we mutate in place to avoid allocating a fresh array per drop.
    const working: NormalisedContentSegment[] = [];
    for (const s of segments) {
        if (s.type === 'image') {
            const box = imageSegmentBox(s);
            if (box.width > options.maxWidth || box.height > maxHeight) continue;
        }
        working.push(s);
    }

    let result = fitMeasuredSegments(working, options);
    // 'hide' images yield to text first.
    result = dropUntilFits(working, options, result, () => dropLastMatching(working, isImageWithStrategy('hide')));
    // 'keep' images take priority over text: drop trailing text rightmost-first.
    result = dropUntilFits(working, options, result, () => {
        return hasImageWithStrategy(working, 'keep') && dropLastMatching(working, isText);
    });
    // Last resort: drop 'keep' images that still can't fit alongside anything.
    result = dropUntilFits(working, options, result, () => dropLastMatching(working, isImageWithStrategy('keep')));
    return result;
}

// Re-fit after each successful drop until either everything fits or `drop` has nothing left to
// remove. `drop` mutates `working` in place and returns whether it removed a segment.
function dropUntilFits(
    working: NormalisedContentSegment[],
    options: WrapOptions,
    result: MeasuredSegment[],
    drop: () => boolean
): MeasuredSegment[] {
    while (!resultFitsAllSegments(working, result) && drop()) {
        result = fitMeasuredSegments(working, options);
    }
    return result;
}

function wrapBlockGroup(
    blockImages: ImageSegment[],
    segments: NormalisedContentSegment[],
    options: WrapOptions
): MeasuredSegment[] {
    const maxHeight = options.maxHeight ?? Infinity;

    const strip = buildBlockStrip(blockImages, options);
    if (strip.length === 0) {
        // No images survived — re-wrap text full-width as if no block strip was requested.
        return wrapInlineSegments(segments, options);
    }

    // The text column is `keep` only when every surviving image is `keep` — otherwise text
    // truncation is allowed (the looser of the strategies governs the column).
    const allKeep = strip.every((img) => (img.overflowStrategy ?? 'hide') === 'keep');
    const stripWidth = blockStripWidth(strip);

    if (segments.length === 0) {
        return strip;
    }

    const innerMaxWidth = options.maxWidth - stripWidth - BLOCK_IMAGE_SPACING;
    if (innerMaxWidth <= 0) {
        // No room for a text column to the right. Under 'hide' prefer dropping the strip so text
        // gets the full width; under 'keep' preserve the strip alone.
        return allKeep ? strip : wrapInlineSegments(segments, options);
    }

    // The inner text column is bounded by the overall block-height budget. Block row height
    // then becomes max(stripHeight, textColumnHeight) — strip images are already filtered to
    // fit within maxHeight above, so the row never exceeds the allotted height.
    const innerOptions = { ...options, maxWidth: innerMaxWidth, maxHeight: Math.max(0, maxHeight) };
    const innerResult = wrapBlockTextColumn(segments, innerOptions, allKeep);

    // Inner wrap can occasionally emit a single ellipsis/orphan segment that itself exceeds the
    // column budget when `innerMaxWidth` is sub-character. If that happens, the centered label
    // ends up wider than the tile and the strip is pushed past the tile edge — drop the column.
    if (innerResult.length > 0 && measureTextSegments(innerResult, options.font).width > innerMaxWidth) {
        return strip;
    }
    return [...strip, ...innerResult];
}

// Measure and drop block-leading images until the strip fits `maxWidth`: filter images that
// can't fit on their own, then drop 'hide' images right-to-left, then 'keep' images as a last
// resort. Returns the surviving images measured (widest-relevant geometry already attached).
function buildBlockStrip(blockImages: ImageSegment[], options: WrapOptions): MeasuredImageSegment[] {
    const maxHeight = options.maxHeight ?? Infinity;
    const strip: MeasuredImageSegment[] = [];
    for (const img of blockImages) {
        const textMetrics = imageSegmentBox(img);
        if (textMetrics.width > options.maxWidth || textMetrics.height > maxHeight) continue;
        strip.push({ ...img, textMetrics });
    }

    const stripFitsWidth = () => blockStripWidth(strip) <= options.maxWidth;
    while (!stripFitsWidth() && dropLastMatching(strip, isImageWithStrategy('hide'))) {
        // keep dropping 'hide' images until the strip fits
    }
    while (!stripFitsWidth() && dropLastMatching(strip, isImageWithStrategy('keep'))) {
        // last-resort: drop 'keep' images
    }
    return strip;
}

// Wrap the text column that flows to the right of a block-image strip. Under 'hide' the column
// is allowed to truncate; under all-'keep' trailing text is dropped rightmost-first until the
// column wraps whole.
function wrapBlockTextColumn(
    segments: NormalisedContentSegment[],
    innerOptions: WrapOptions,
    allKeep: boolean
): MeasuredSegment[] {
    if (!allKeep) {
        return wrapInlineSegments(segments, innerOptions);
    }
    const working = segments.slice();
    let result = wrapInlineSegments(working, innerOptions);
    while ((hasTruncatedText(result) || lostTextSegments(working, result)) && dropLastMatching(working, isText)) {
        result = wrapInlineSegments(working, innerOptions);
    }
    return result;
}

// Remove the last item matching `predicate` (right-to-left), mutating `arr` in place. Returns
// whether an item was removed.
function dropLastMatching<T>(arr: T[], predicate: (item: T) => boolean): boolean {
    for (let i = arr.length - 1; i >= 0; i--) {
        if (predicate(arr[i])) {
            arr.splice(i, 1);
            return true;
        }
    }
    return false;
}

const isText = (s: NormalisedContentSegment): boolean => s.type !== 'image';

function isImageWithStrategy(strategy: 'hide' | 'keep') {
    return (s: NormalisedContentSegment): boolean => s.type === 'image' && (s.overflowStrategy ?? 'hide') === strategy;
}

function resultFitsAllSegments(input: NormalisedContentSegment[], output: MeasuredSegment[]): boolean {
    // Result is "fit" when no text segment was ellipsis-truncated AND every image in input
    // is present in the output.
    if (hasTruncatedText(output)) return false;
    const inputImageCount = input.reduce((n, s) => n + (s.type === 'image' ? 1 : 0), 0);
    const outputImageCount = output.reduce((n, s) => n + (s.type === 'image' ? 1 : 0), 0);
    return outputImageCount >= inputImageCount;
}

function hasTruncatedText(output: MeasuredSegment[]): boolean {
    return output.some((s) => s.type !== 'image' && isTextTruncated(s.text));
}

function lostTextSegments(input: NormalisedContentSegment[], output: MeasuredSegment[]): boolean {
    const inputText = input.reduce((n, s) => (s.type === 'image' ? n : n + 1), 0);
    const outputText = output.reduce((n, s) => (s.type === 'image' ? n : n + 1), 0);
    return outputText < inputText;
}

function hasImageWithStrategy(segments: NormalisedContentSegment[], strategy: 'hide' | 'keep'): boolean {
    return segments.some(isImageWithStrategy(strategy));
}

function fitMeasuredSegments(textSegments: NormalisedContentSegment[], options: WrapOptions): MeasuredSegment[] {
    const { maxHeight = Infinity } = options;
    const result: MeasuredSegment[] = [];

    let lineWidth = 0;
    let totalHeight = 0;

    function truncateLastSegment() {
        const lastSegment = result.pop();
        if (!lastSegment) return;
        // Images cannot be truncated with an ellipsis; drop them entirely.
        if (lastSegment.type === 'image') return;
        const measurer = cachedTextMeasurer(lastSegment);
        const truncatedText = truncateLine(lastSegment.text, measurer, options.maxWidth, true);
        const textMetrics = measurer.measureText(truncatedText);
        result.push({ ...lastSegment, text: truncatedText, textMetrics });
    }

    // Wrap a text segment that overflows the current line into sub-segments, advancing
    // lineWidth/totalHeight. Returns true when the label is full and the line should stop.
    function wrapOverflowingTextSegment(segment: MeasuredTextSegment): boolean {
        const measurer = cachedTextMeasurer(segment);
        const guardedText = guardTextEdges(segment.text);
        const wrapOptions = { ...options, font: segment, maxHeight: maxHeight - totalHeight };

        let wrappedLines = textWrap(guardedText, { ...wrapOptions, overflow: 'hide' }, lineWidth);
        if (wrappedLines.length === 0) {
            if (options.textWrap === 'never') {
                wrappedLines = textWrap(guardedText, wrapOptions, lineWidth);
            } else {
                wrappedLines = textWrap(guardedText, wrapOptions);
                const lastSegment = result.at(-1);
                if (lastSegment && lastSegment.type !== 'image') {
                    lastSegment.text += '\n';
                    lineWidth = 0;
                }
            }
        }

        if (wrappedLines.length === 0) {
            truncateLastSegment();
            return true;
        }

        const truncationIndex = wrappedLines.findIndex(isTextTruncated);
        if (truncationIndex !== -1) {
            wrappedLines = wrappedLines.slice(0, truncationIndex + 1);
        }

        // A text segment's edge whitespace is the gap to an adjacent image (e.g. flag then " Germany ").
        // A wrap break can trim it, so restore it onto the first/last content line of the output.
        const leadingWs = segment.text.slice(0, segment.text.length - segment.text.trimStart().length);
        const trailingWs = segment.text.slice(segment.text.trimEnd().length);
        const cleanLines = wrappedLines.map(unguardTextEdges);
        const firstContentIndex = cleanLines.findIndex((line) => line.trim() !== '');
        const lastContentIndex = cleanLines.findLastIndex((line) => line.trim() !== '');

        const lastIndex = cleanLines.length - 1;
        for (let i = 0; i < cleanLines.length; i++) {
            let cleanLine = cleanLines[i];
            if (leadingWs && i === firstContentIndex) {
                cleanLine = leadingWs + cleanLine.trimStart();
            }
            if (trailingWs && i === lastContentIndex) {
                cleanLine = cleanLine.trimEnd() + trailingWs;
            }
            const textMetrics = measurer.measureText(cleanLine);
            const subSegment = { ...segment, text: cleanLine, textMetrics };
            if (i === lastIndex) {
                lineWidth += textMetrics.width;
            } else {
                subSegment.text += '\n';
                lineWidth = 0;
            }
            totalHeight += textMetrics.height;
            result.push(subSegment);
        }

        return truncationIndex !== -1;
    }

    let isFirstLine = true;
    for (const { width, height, segments } of measureTextSegments(textSegments, options.font).lineMetrics) {
        if (!isFirstLine) {
            appendLineBreak(result, options.font);
            lineWidth = 0;
        }
        isFirstLine = false;

        if (totalHeight + height > maxHeight) {
            if (result.length) {
                truncateLastSegment();
            }
            break;
        }

        if (lineWidth + width <= options.maxWidth) {
            lineWidth += width;
            totalHeight += height;
            result.push(...segments);
            continue;
        }

        // Height of the in-progress line's inline content not yet added to totalHeight. The fit and
        // text-wrap paths account their own height; only the image-wrap below leaves a line behind.
        let lineHeight = 0;
        for (const segment of segments) {
            if (lineWidth + segment.textMetrics.width <= options.maxWidth) {
                lineWidth += segment.textMetrics.width;
                lineHeight = Math.max(lineHeight, segment.textMetrics.height);
                result.push(segment);
                continue;
            }

            if (segment.type === 'image') {
                const imageWidth = segment.textMetrics.width;
                const imageHeight = segment.textMetrics.height;
                // Wrap the overflowing image to its own line rather than drop it (keeps width-shrinking
                // monotonic). The text line it leaves behind must also fit, so count it under maxHeight.
                if (
                    options.textWrap !== 'never' &&
                    lineWidth > 0 &&
                    imageWidth <= options.maxWidth &&
                    totalHeight + lineHeight + imageHeight <= maxHeight
                ) {
                    appendLineBreak(result, options.font);
                    lineWidth = imageWidth;
                    totalHeight += lineHeight + imageHeight;
                    lineHeight = 0;
                    result.push(segment);
                    continue;
                }

                // No line to wrap to and images can't be subdivided, so stop fitting. The caller
                // (wrapInlineSegmentsWithOverflow) handles overflow-strategy-based dropping.
                truncateLastSegment();
                return result;
            }

            if (wrapOverflowingTextSegment(segment)) break;
            lineHeight = 0;
        }
    }

    return result;
}

// Carry an input line break into the wrapped output. The renderer treats a trailing \n on a
// text segment as a line break; if the previous segment is an image, push a synthetic
// newline-only text segment so the break is preserved.
function appendLineBreak(result: MeasuredSegment[], font: FontOptions): void {
    const last = result.at(-1);
    if (last && last.type !== 'image') {
        last.text += '\n';
    } else if (last) {
        const measurer = cachedTextMeasurer(font);
        result.push({ ...font, text: '\n', textMetrics: measurer.measureText('') });
    }
}
