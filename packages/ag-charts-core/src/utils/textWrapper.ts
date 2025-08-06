import type { OverflowStrategy, TextWrap } from 'ag-charts-types';

import { type ITextMeasurer, cachedTextMeasurer } from './textMeasurer';
import { EllipsisChar, type FontOptions, LineSplitter } from './textUtils';

// Extended measurement options including wrapping behaviour.
export interface WrapOptions {
    font: string | FontOptions;
    maxWidth: number;
    maxHeight?: number;
    lineHeight?: number;
    textWrap?: TextWrap;
    overflow?: OverflowStrategy;
    avoidOrphans?: boolean;
}

export function wrapText(text: string, options: WrapOptions) {
    return wrapLines(text, options).join('\n');
}

export function wrapLines(text: string, options: WrapOptions) {
    const clippedResult = textWrap(text, options);

    if (options.overflow === 'hide' && clippedResult.some((l) => l.endsWith(EllipsisChar))) {
        return [];
    }
    return clippedResult;
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
        return ellipsisForce ? text + EllipsisChar : text;
    }
    text = text.slice(0, i).trimEnd();
    while (text.length && measurer.textWidth(text) + ellipsisWidth > maxWidth) {
        text = text.slice(0, -1).trimEnd();
    }
    return text.length ? text + EllipsisChar : '';
}

function textWrap(text: string, options: WrapOptions) {
    const lines: string[] = text.split(LineSplitter);
    const measurer = cachedTextMeasurer(options.font);

    if (options.textWrap === 'never') {
        return lines.map((line) => truncateLine(line.trimEnd(), measurer, options.maxWidth));
    }

    const result: string[] = [];
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
        while (i < line.length) {
            const char = line.charAt(i);

            estimatedWidth += measurer.textWidth(char);

            if (char === ' ') {
                lastSpaceIndex = i;
            }

            if (estimatedWidth > options.maxWidth) {
                // char width is greater than options.maxWidth
                if (i === 0) {
                    line = '';
                    break;
                }

                // check actual width in case estimation is off
                const actualWidth = measurer.textWidth(line.slice(0, i + 1));
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
                result.push(newLine + postfix);

                if (!newLine.length) {
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
    return clipLines(result, measurer, options);
}

function getWordAt(text: string, position: number) {
    const nextSpaceIndex = text.indexOf(' ', position);
    return nextSpaceIndex === -1 ? text.slice(position) : text.slice(position, nextSpaceIndex);
}

export function clipLines(lines: string[], measurer: ITextMeasurer, options: WrapOptions) {
    if (!options.maxHeight) {
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
                lastLine.endsWith(EllipsisChar) ? lastLine : truncateLine(lastLine, measurer, options.maxWidth, true)
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
