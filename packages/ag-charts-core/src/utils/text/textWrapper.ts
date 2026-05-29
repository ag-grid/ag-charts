import type { ImageSegment, OverflowStrategy, Segment, TextOrSegments, TextWrap } from 'ag-charts-types';

import {
    BLOCK_IMAGE_SPACING,
    blockStripHeight,
    blockStripWidth,
    cachedTextMeasurer,
    imageSegmentBox,
    isBlockBoundary,
    measureTextSegments,
} from '../../rendering/textMeasurer';
import type { ITextMeasurer, MeasuredImageSegment, MeasuredSegment } from '../../types/text';
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
export function wrapTextOrSegments(segments: Segment[], options: WrapOptions): MeasuredSegment[];
export function wrapTextOrSegments(input: TextOrSegments, options: WrapOptions): string | MeasuredSegment[];
export function wrapTextOrSegments(input: TextOrSegments, options: WrapOptions) {
    return isArray(input) ? wrapTextSegments(input, options) : wrapLines(toTextString(input), options).join('\n');
}

export function wrapText(text: string, options: WrapOptions) {
    return wrapLines(text, options).join('\n');
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
    segments: Segment[];
}

function splitIntoBlockGroups(textSegments: Segment[]): SegmentGroup[] {
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

export function wrapTextSegments(textSegments: Segment[], options: WrapOptions): MeasuredSegment[] {
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

function wrapInlineSegments(segments: Segment[], options: WrapOptions): MeasuredSegment[] {
    if (segments.length === 0) return [];
    if (!segments.some((s) => s.type === 'image')) {
        return fitMeasuredSegments(segments, options);
    }
    return wrapInlineSegmentsWithOverflow(segments, options);
}

function wrapInlineSegmentsWithOverflow(segments: Segment[], options: WrapOptions): MeasuredSegment[] {
    const maxHeight = options.maxHeight ?? Infinity;
    // Drop any image that exceeds the width or height budget on its own; no strategy can keep it.
    let working = segments.filter((s) => {
        if (s.type !== 'image') return true;
        const box = imageSegmentBox(s);
        return box.width <= options.maxWidth && box.height <= maxHeight;
    });

    let result = fitMeasuredSegments(working, options);

    // 'hide' images yield to text first.
    while (!resultFitsAllSegments(working, result)) {
        const next = dropRightmostImage(working, 'hide');
        if (!next) break;
        working = next;
        result = fitMeasuredSegments(working, options);
    }

    // 'keep' images take priority over text: drop trailing text rightmost-first.
    while (!resultFitsAllSegments(working, result) && hasImageWithStrategy(working, 'keep')) {
        const next = dropRightmostText(working);
        if (!next) break;
        working = next;
        result = fitMeasuredSegments(working, options);
    }

    // Last resort: drop 'keep' images that still can't fit alongside anything.
    while (!resultFitsAllSegments(working, result)) {
        const next = dropRightmostImage(working, 'keep');
        if (!next) break;
        working = next;
        result = fitMeasuredSegments(working, options);
    }

    return result;
}

function wrapBlockGroup(blockImages: ImageSegment[], segments: Segment[], options: WrapOptions): MeasuredSegment[] {
    const maxHeight = options.maxHeight ?? Infinity;

    // Filter individual images that cannot fit on their own (by width or height) and measure the
    // survivors. The aggregate strip width is then checked against `maxWidth`; if it still
    // doesn't fit, drop `hide`-strategy images right-to-left, then drop `keep` images last.
    type Candidate = { source: ImageSegment; measured: MeasuredImageSegment };
    let strip: Candidate[] = [];
    for (const img of blockImages) {
        const textMetrics = imageSegmentBox(img);
        if (textMetrics.width > options.maxWidth || textMetrics.height > maxHeight) continue;
        strip.push({ source: img, measured: { ...img, textMetrics } });
    }

    const stripFitsWidth = () => blockStripWidth(strip.map((c) => c.measured)) <= options.maxWidth;
    const dropRightmost = (kind: 'hide' | 'keep'): boolean => {
        for (let i = strip.length - 1; i >= 0; i--) {
            const s = strip[i].source.overflowStrategy ?? 'hide';
            if (s === kind) {
                strip = [...strip.slice(0, i), ...strip.slice(i + 1)];
                return true;
            }
        }
        return false;
    };
    while (!stripFitsWidth() && dropRightmost('hide')) {
        // keep dropping 'hide' images until the strip fits
    }
    while (!stripFitsWidth() && dropRightmost('keep')) {
        // last-resort: drop 'keep' images
    }

    if (strip.length === 0) {
        // No images survived — re-wrap text full-width as if no block strip was requested.
        return wrapInlineSegments(segments, options);
    }

    // The text column is `keep` only when every surviving image is `keep` — otherwise text
    // truncation is allowed (the looser of the strategies governs the column).
    const allKeep = strip.every((c) => (c.source.overflowStrategy ?? 'hide') === 'keep');
    const measuredStrip = strip.map((c) => c.measured);
    const stripWidth = blockStripWidth(measuredStrip);
    const stripHeightVal = blockStripHeight(measuredStrip);

    if (segments.length === 0) {
        return measuredStrip;
    }

    const innerMaxWidth = options.maxWidth - stripWidth - BLOCK_IMAGE_SPACING;
    if (innerMaxWidth <= 0) {
        // No room for a text column to the right. Under 'hide' prefer dropping the strip so text
        // gets the full width; under 'keep' preserve the strip alone.
        return allKeep ? measuredStrip : wrapInlineSegments(segments, options);
    }

    // The inner column is bounded by the row height, which is at least the tallest strip image.
    // Constraining `maxHeight` here keeps text from growing the block row past what was allotted.
    const innerMaxHeight = Math.max(0, Math.min(maxHeight, Math.max(stripHeightVal, maxHeight)));
    const innerOptions = { ...options, maxWidth: innerMaxWidth, maxHeight: innerMaxHeight };

    // Inner wrap can occasionally emit a single ellipsis/orphan segment that itself exceeds the
    // column budget when `innerMaxWidth` is sub-character. If that happens, the centered label
    // ends up wider than the tile and the strip is pushed past the tile edge. Re-measure and
    // discard the inner column if it overflows.
    const innerColumnFits = (inner: MeasuredSegment[]): boolean => {
        if (inner.length === 0) return true;
        return measureTextSegments(inner, options.font).width <= innerMaxWidth;
    };

    if (!allKeep) {
        // Strip alone fits; let the inner column handle its own overflow (text truncation is OK).
        const innerResult = wrapInlineSegments(segments, innerOptions);
        if (!innerColumnFits(innerResult)) return measuredStrip;
        return [...measuredStrip, ...innerResult];
    }

    // All-'keep': drop trailing text rightmost-first until the inner column is whole.
    let innerWorking = segments;
    let innerResult = wrapInlineSegments(innerWorking, innerOptions);
    while (hasTruncatedText(innerResult) || lostTextSegments(innerWorking, innerResult)) {
        const next = dropRightmostText(innerWorking);
        if (!next) break;
        innerWorking = next;
        innerResult = wrapInlineSegments(innerWorking, innerOptions);
    }
    if (!innerColumnFits(innerResult)) return measuredStrip;
    return [...measuredStrip, ...innerResult];
}

function resultFitsAllSegments(input: Segment[], output: MeasuredSegment[]): boolean {
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

function lostTextSegments(input: Segment[], output: MeasuredSegment[]): boolean {
    const inputText = input.reduce((n, s) => (s.type === 'image' ? n : n + 1), 0);
    const outputText = output.reduce((n, s) => (s.type === 'image' ? n : n + 1), 0);
    return outputText < inputText;
}

function hasImageWithStrategy(segments: Segment[], strategy: 'hide' | 'keep'): boolean {
    return segments.some((s) => s.type === 'image' && (s.overflowStrategy ?? 'hide') === strategy);
}

function dropRightmostImage(segments: Segment[], strategy: 'hide' | 'keep'): Segment[] | null {
    for (let i = segments.length - 1; i >= 0; i--) {
        const s = segments[i];
        if (s.type === 'image' && (s.overflowStrategy ?? 'hide') === strategy) {
            return [...segments.slice(0, i), ...segments.slice(i + 1)];
        }
    }
    return null;
}

function dropRightmostText(segments: Segment[]): Segment[] | null {
    for (let i = segments.length - 1; i >= 0; i--) {
        if (segments[i].type !== 'image') {
            return [...segments.slice(0, i), ...segments.slice(i + 1)];
        }
    }
    return null;
}

function fitMeasuredSegments(textSegments: Segment[], options: WrapOptions): MeasuredSegment[] {
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

    let isFirstLine = true;
    for (const { width, height, segments } of measureTextSegments(textSegments, options.font).lineMetrics) {
        if (!isFirstLine) {
            // Carry the input line break into the wrapped output. The renderer treats a trailing
            // \n on a text segment as a line break; if the previous segment is an image, push a
            // synthetic newline-only text segment so the break is preserved.
            const last = result.at(-1);
            if (last && last.type !== 'image') {
                last.text += '\n';
            } else if (last) {
                const measurer = cachedTextMeasurer(options.font);
                result.push({ ...options.font, text: '\n', textMetrics: measurer.measureText('') });
            }
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

        for (const segment of segments) {
            if (lineWidth + segment.textMetrics.width <= options.maxWidth) {
                lineWidth += segment.textMetrics.width;
                result.push(segment);
                continue;
            }

            // An image segment that doesn't fit cannot be subdivided. Stop fitting this label;
            // overflow-strategy-based dropping is handled by the caller (see wrapSegmentsWithOverflow).
            if (segment.type === 'image') {
                truncateLastSegment();
                return result;
            }

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
                break;
            }

            const truncationIndex = wrappedLines.findIndex(isTextTruncated);

            if (truncationIndex !== -1) {
                wrappedLines = wrappedLines.slice(0, truncationIndex + 1);
            }

            const lastLine = wrappedLines.at(-1);
            for (const wrappedLine of wrappedLines) {
                const cleanLine = unguardTextEdges(wrappedLine);
                const textMetrics = measurer.measureText(cleanLine);
                const subSegment = { ...segment, text: cleanLine, textMetrics };
                if (wrappedLine === lastLine) {
                    lineWidth += textMetrics.width;
                } else {
                    subSegment.text += '\n';
                    lineWidth = 0;
                }
                totalHeight += textMetrics.height;
                result.push(subSegment);
            }

            if (truncationIndex !== -1) break;
        }
    }

    return result;
}
