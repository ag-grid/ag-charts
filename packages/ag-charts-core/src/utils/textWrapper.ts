import type { OverflowStrategy, TextOrSegments, TextSegment, TextWrap } from 'ag-charts-types';

import { type ITextMeasurer, type MeasuredSegment, cachedTextMeasurer, measureTextSegments } from './textMeasurer';
import {
    EllipsisChar,
    type FontOptions,
    LineSplitter,
    TrimEdgeGuard,
    appendEllipsis,
    guardTextEdges,
    isTextTruncated,
    toTextString,
    unguardTextEdges,
} from './textUtils';
import { isArray, isFiniteNumber } from './typeGuards';

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
export function wrapTextOrSegments(segments: TextSegment[], options: WrapOptions): MeasuredSegment[];
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
    let estimatedWidth = 0;
    let i = 0;
    for (; i < text.length; i++) {
        const charWidth = measurer.textWidth(text.charAt(i));
        if (estimatedWidth + charWidth > maxWidth) break;
        estimatedWidth += charWidth;
    }
    if (text.length === i && (!ellipsisForce || estimatedWidth + ellipsisWidth <= maxWidth)) {
        return ellipsisForce ? appendEllipsis(text) : text;
    }
    text = text.slice(0, i).trimEnd();
    while (text.length && measurer.textWidth(text) + ellipsisWidth > maxWidth) {
        text = text.slice(0, -1).trimEnd();
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

        let i = 0;
        let estimatedWidth = 0;
        let lastSpaceIndex = 0;

        if (!result.length) {
            estimatedWidth = widthOffset;
        }

        while (i < line.length) {
            const char = line.charAt(i);

            if (char === ' ') {
                lastSpaceIndex = i;
            }

            estimatedWidth += measurer.textWidth(char);

            if (estimatedWidth > options.maxWidth) {
                // char width is greater than options.maxWidth
                if (i === 0) {
                    line = '';
                    break;
                }

                // check actual width in case estimation is off
                let actualWidth = measurer.textWidth(line.slice(0, i + 1));
                if (!result.length) {
                    actualWidth += widthOffset;
                }
                if (actualWidth <= options.maxWidth) {
                    estimatedWidth = actualWidth;
                    i++;
                    continue;
                }

                if (lastSpaceIndex) {
                    const nextWord = getWordAt(line, lastSpaceIndex + 1);
                    const textWidth = measurer.textWidth(nextWord);

                    if (textWidth <= options.maxWidth) {
                        result.push(line.slice(0, lastSpaceIndex).trimEnd());
                        line = line.slice(lastSpaceIndex).trimStart();

                        i = 0; // reset the index after cutting the line
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
                let newLine = line.slice(0, i).trim();
                while (newLine.length && measurer.textWidth(newLine + postfix) > options.maxWidth) {
                    newLine = newLine.slice(0, -1).trimEnd();
                }

                if (newLine && newLine !== TrimEdgeGuard) {
                    result.push(newLine + postfix);
                } else {
                    line = '';
                    break;
                }

                line = line.slice(newLine.length).trimStart();

                i = -1; // reset the index after cutting the line
                estimatedWidth = 0; // reset the width
                lastSpaceIndex = 0; // reset last space index
            }

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

    if (beforeLast.length < lastLine.length) return;

    const lastSpaceIndex = beforeLast.lastIndexOf(' ');
    // If the last line has an orphan, and the previous line has more than one space
    if (lastSpaceIndex === -1 || lastSpaceIndex === beforeLast.indexOf(' ') || lastLine.includes(' ')) return;

    const lastWord = beforeLast.slice(lastSpaceIndex + 1);
    if (measurer.textWidth(lastLine + lastWord) <= options.maxWidth) {
        lines[length - 2] = beforeLast.slice(0, lastSpaceIndex);
        lines[length - 1] = lastWord + ' ' + lastLine;
    }
}

export function wrapTextSegments(textSegments: TextSegment[], options: WrapOptions): MeasuredSegment[] {
    const { maxHeight = Infinity } = options;
    const result: MeasuredSegment[] = [];

    let lineWidth = 0;
    let totalHeight = 0;

    function truncateLastSegment() {
        const lastSegment = result.pop();
        if (!lastSegment) return;
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
                    if (lastSegment) {
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
