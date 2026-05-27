import type { OverflowStrategy, Segment, TextOrSegments, TextWrap } from 'ag-charts-types';

import { cachedTextMeasurer, measureTextSegments } from '../../rendering/textMeasurer';
import type { ITextMeasurer, MeasuredSegment } from '../../types/text';
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

export function wrapTextSegments(textSegments: Segment[], options: WrapOptions): MeasuredSegment[] {
    // Fast path: no images, use the text-only fitting pipeline directly.
    if (!textSegments.some((s) => s.type === 'image')) {
        return fitMeasuredSegments(textSegments, options);
    }

    // Drop sequence per AG-15933: (1) shed 'hide' images rightmost-first, (2) truncate text,
    // (3) shed 'keep' images rightmost-first, (4) hide entire label. Steps 2 and 4 fall out of
    // the existing fitMeasuredSegments behaviour; image dropping happens here.
    let working = textSegments;
    let result = fitMeasuredSegments(working, options);

    for (const strategy of ['hide', 'keep'] as const) {
        while (!resultFitsAllSegments(working, result)) {
            const next = dropRightmostImage(working, strategy);
            if (!next) break;
            working = next;
            result = fitMeasuredSegments(working, options);
        }
    }

    return result;
}

function resultFitsAllSegments(input: Segment[], output: MeasuredSegment[]): boolean {
    // Result is "fit" when no text segment was ellipsis-truncated AND every image in input
    // is present in the output.
    for (const seg of output) {
        if (seg.type !== 'image' && isTextTruncated(seg.text)) return false;
    }
    const inputImageCount = input.reduce((n, s) => n + (s.type === 'image' ? 1 : 0), 0);
    const outputImageCount = output.reduce((n, s) => n + (s.type === 'image' ? 1 : 0), 0);
    return outputImageCount >= inputImageCount;
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

    for (const { width, height, segments } of measureTextSegments(textSegments, options.font).lineMetrics) {
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
