import type { OverflowStrategy, TextWrap } from 'ag-charts-types';

import { CachedTextMeasurerPool, type MeasureOptions, type TextMeasurer, TextUtils } from './textMeasurer';

// Extended measurement options including wrapping behavior.
export interface WrapOptions extends MeasureOptions {
    maxWidth: number;
    maxHeight?: number;
    lineHeight?: number;
    textWrap?: TextWrap;
    overflow?: OverflowStrategy;
    avoidOrphans?: boolean;
}

export class TextWrapper {
    static wrapText(text: string, options: WrapOptions) {
        return this.wrapLines(text, options).join('\n');
    }

    static wrapLines(text: string, options: WrapOptions) {
        const clippedResult = this.textWrap(text, options);
        if (options.overflow === 'hide' && clippedResult.some((l) => l.endsWith(TextUtils.EllipsisChar))) {
            return [];
        }
        return clippedResult;
    }

    static appendEllipsis(text: string) {
        return text.replace(/[.,]{1,5}$/, '') + TextUtils.EllipsisChar;
    }

    static truncateLine(text: string, measurer: TextMeasurer, maxWidth: number, ellipsisForce?: boolean) {
        const ellipsisWidth = measurer.textWidth(TextUtils.EllipsisChar);
        let estimatedWidth = 0;
        let i = 0;
        for (; i < text.length; i++) {
            const charWidth = measurer.textWidth(text.charAt(i));
            if (estimatedWidth + charWidth > maxWidth) break;
            estimatedWidth += charWidth;
        }
        if (text.length === i && (!ellipsisForce || estimatedWidth + ellipsisWidth <= maxWidth)) {
            return ellipsisForce ? text + TextUtils.EllipsisChar : text;
        }
        text = text.slice(0, i).trimEnd();
        while (text.length && measurer.textWidth(text) + ellipsisWidth > maxWidth) {
            text = text.slice(0, -1).trimEnd();
        }
        return text + TextUtils.EllipsisChar;
    }

    private static textWrap(text: string, options: WrapOptions) {
        const lines: string[] = text.split(TextUtils.lineSplitter);
        const measurer = CachedTextMeasurerPool.getMeasurer(options);

        if (options.textWrap === 'never') {
            return lines.map((line) => this.truncateLine(line.trimEnd(), measurer, options.maxWidth));
        }

        const result: string[] = [];
        const wrapHyphenate = options.textWrap === 'hyphenate';
        const wrapOnSpace = options.textWrap == null || options.textWrap === 'on-space';

        for (let line of lines) {
            line = line.trimEnd();

            if (line === '') {
                result.push(line);
                continue;
            }

            for (let i = 0, estimatedWidth = 0, lastSpaceIndex = 0; i < line.length; i++) {
                const char = line.charAt(i);

                estimatedWidth += measurer.textWidth(char);

                if (char === ' ') {
                    lastSpaceIndex = i;
                }

                if (estimatedWidth > options.maxWidth) {
                    if (i === 0) break; // char width is greater than options.maxWidth
                    if (lastSpaceIndex) {
                        const nextWord = this.getWordAt(line, lastSpaceIndex + 1);
                        const textWidth = measurer.textWidth(nextWord);

                        if (textWidth <= options.maxWidth) {
                            result.push(line.slice(0, lastSpaceIndex).trimEnd());
                            line = line.slice(lastSpaceIndex).trimStart();

                            i = -1; // reset the index after cutting the line
                            estimatedWidth = 0; // reset the width
                            lastSpaceIndex = 0; // reset last space index
                            continue;
                        } else if (wrapOnSpace && textWidth > options.maxWidth) {
                            result.push(
                                line.slice(0, lastSpaceIndex).trimEnd(),
                                this.truncateLine(
                                    line.slice(lastSpaceIndex).trimStart(),
                                    measurer,
                                    options.maxWidth,
                                    true
                                )
                            );
                        }
                    } else if (wrapOnSpace) {
                        result.push(this.truncateLine(line, measurer, options.maxWidth, true));
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
            }

            if (line) {
                result.push(line);
            }
        }

        this.avoidOrphans(result, measurer, options);
        return this.clipLines(result, measurer, options);
    }

    private static getWordAt(text: string, position: number) {
        const nextSpaceIndex = text.indexOf(' ', position);
        return nextSpaceIndex === -1 ? text.slice(position) : text.slice(position, nextSpaceIndex);
    }

    private static clipLines(lines: string[], measurer: TextMeasurer, options: WrapOptions) {
        if (!options.maxHeight) {
            return lines;
        }

        const { height, lineMetrics } = measurer.measureLines(lines);

        if (height <= options.maxHeight) {
            return lines;
        }

        for (let i = 0, cumulativeHeight = 0; i < lineMetrics.length; i++) {
            const { lineHeight } = lineMetrics[i];
            cumulativeHeight += lineHeight;
            if (cumulativeHeight > options.maxHeight) {
                if (options.overflow === 'hide') {
                    return [];
                }
                const clippedResults = lines.slice(0, i || 1);
                const lastLine = clippedResults.pop()!;
                return clippedResults.concat(this.truncateLine(lastLine, measurer, options.maxWidth, true));
            }
        }

        return lines;
    }

    private static avoidOrphans(lines: string[], measurer: TextMeasurer, options: WrapOptions) {
        if (options.avoidOrphans === false || lines.length < 2) return;

        const { length } = lines;
        const lastLine = lines[length - 1];
        const beforeLast = lines[length - 2];

        if (beforeLast.length < lastLine.length) return;

        const lastSpaceIndex = beforeLast.lastIndexOf(' ');
        // If last line has an orphan and previous line has more than one space
        if (lastSpaceIndex === -1 || lastSpaceIndex === beforeLast.indexOf(' ') || lastLine.includes(' ')) return;

        const lastWord = beforeLast.slice(lastSpaceIndex + 1);
        if (measurer.textWidth(lastLine + lastWord) <= options.maxWidth) {
            lines[length - 2] = beforeLast.slice(0, lastSpaceIndex);
            lines[length - 1] = lastWord + ' ' + lastLine;
        }
    }
}
