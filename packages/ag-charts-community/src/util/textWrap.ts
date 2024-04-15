import type { OverflowStrategy, TextWrap } from '../options/chart/types';
import { TextMeasurer, type TextSizeProperties } from '../scene/shape/text';

// The default line spacing for document editors is usually 1.15
const DefaultLineHeightRatio = 1.15;
const EllipsisChar = '\u2026';

export function calcLineHeight(fontSize: number): number {
    return Math.ceil(fontSize * DefaultLineHeightRatio);
}

export function wrapLines(
    text: string,
    maxWidth: number,
    maxHeight: number,
    textProps: TextSizeProperties,
    wrapping: TextWrap,
    overflow: OverflowStrategy
): { lines: string[] | undefined; truncated: boolean } {
    const canOverflow = overflow !== 'hide';
    const measurer = new TextMeasurer(textProps);
    const lines: string[] = text.split(/\r?\n/g);

    if (lines.length === 0) {
        return { lines: undefined, truncated: false };
    }
    if (wrapping === 'never') {
        const { text: truncText, truncated } = truncateLine(
            lines[0],
            maxWidth,
            measurer,
            canOverflow ? 'auto' : 'never'
        );
        return { lines: truncText != null ? [truncText] : undefined, truncated };
    }

    const wrappedLines: string[] = [];
    let cumulativeHeight = 0;
    let truncated = false;
    for (const line of lines) {
        const wrappedLine = wrapLine(
            line,
            maxWidth,
            maxHeight,
            measurer,
            textProps,
            wrapping,
            cumulativeHeight,
            canOverflow
        );

        if (wrappedLine == null) {
            return { lines: undefined, truncated: false };
        }

        wrappedLines.push(...wrappedLine.result);
        cumulativeHeight = wrappedLine.cumulativeHeight;
        if (wrappedLine.truncated) {
            truncated = true;
            break;
        }
    }
    return { lines: wrappedLines, truncated };
}

export function wrapText(
    text: string,
    maxWidth: number,
    maxHeight: number,
    textProps: TextSizeProperties,
    wrapping: TextWrap,
    overflow: OverflowStrategy = 'ellipsis'
): { text: string; truncated: boolean } {
    const { lines, truncated } = wrapLines(text, maxWidth, maxHeight, textProps, wrapping, overflow);
    return { text: lines?.join('\n').trim() ?? '', truncated };
}

function wrapLine(
    text: string,
    maxWidth: number,
    maxHeight: number,
    measurer: TextMeasurer,
    textProps: TextSizeProperties,
    wrapping: TextWrap,
    cumulativeHeight: number,
    canOverflow: boolean
): { result: string[]; truncated: boolean; cumulativeHeight: number } | undefined {
    text = text.trim();
    if (!text) {
        return { result: [], truncated: false, cumulativeHeight };
    }

    const initialSize = measurer.size(text);
    if (initialSize.width <= maxWidth) {
        // Text fits into a single line
        return {
            result: [text],
            truncated: false,
            cumulativeHeight: cumulativeHeight + initialSize.height,
        };
    }
    if (initialSize.height > maxHeight || measurer.width('W') > maxWidth) {
        // Not enough space for a single line or character
        return canOverflow ? { result: [], truncated: true, cumulativeHeight } : undefined;
    }

    const words = text.split(/\s+/g);
    const wrapResult = wrapLineSequentially(
        words,
        maxWidth,
        maxHeight,
        measurer,
        textProps,
        wrapping,
        cumulativeHeight,
        canOverflow
    );

    if (wrapResult == null) {
        return;
    }

    cumulativeHeight = wrapResult.cumulativeHeight;

    let { lines } = wrapResult;
    if (!(wrapResult.wordsBrokenOrTruncated || wrapResult.linesTruncated)) {
        // If no word breaks or truncations, try the balanced wrapping
        const linesCount = wrapResult.lines.length;
        const balanced = wrapLineBalanced(words, maxWidth, measurer, linesCount);
        if (balanced.length === lines.length) {
            // Some lines can't be balanced properly because of unusually long words
            lines = balanced;
        }
    }

    const wrappedText = lines.map((ln) => ln.join(' '));
    return { result: wrappedText, truncated: wrapResult.linesTruncated, cumulativeHeight };
}

const punctuationMarks = ['.', ',', '-', ':', ';', '!', '?', `'`, '"', '(', ')'];

function breakWordFn(
    word: string,
    firstLineWidth: number,
    maxWidth: number,
    hyphens: boolean,
    measurer: TextMeasurer
): string[] {
    const isPunctuationAt = (index: number) => punctuationMarks.includes(word[index]);
    const h = hyphens ? measurer.width('-') : 0;
    const breaks: number[] = [];
    let partWidth = 0;
    let p = 0;
    for (let i = 0; i < word.length; i++) {
        const c = word[i];
        const w = measurer.width(c);
        const limit = p === 0 ? firstLineWidth : maxWidth;
        if (partWidth + w + h > limit) {
            breaks.push(i);
            partWidth = 0;
            p++;
        }
        partWidth += w;
    }
    const parts: string[] = [];
    let start = 0;
    for (const index of breaks) {
        let part = word.substring(start, index);
        if (hyphens && part.length > 0 && !isPunctuationAt(index - 1) && !isPunctuationAt(index)) {
            part += '-';
        }
        parts.push(part);
        start = index;
    }
    parts.push(word.substring(start));
    return parts;
}

function truncateLine(
    text: string,
    maxWidth: number,
    measurer: TextMeasurer,
    ellipsisMode: 'force' | 'never' | 'auto'
): { text: string | undefined; truncated: boolean } {
    text = text.trimEnd();

    const lineWidth = measurer.width(text);
    if (lineWidth > maxWidth && ellipsisMode === 'never') {
        return { text: undefined, truncated: false };
    } else if (lineWidth <= maxWidth && ellipsisMode !== 'force') {
        return { text, truncated: false };
    }

    const ellipsisWidth = measurer.width(EllipsisChar);
    let trunc = text;
    let truncWidth = lineWidth;
    while (trunc.length > 0 && truncWidth + ellipsisWidth > maxWidth) {
        // Ensure there is no space between the ellipsis and last letter
        trunc = trunc.slice(0, -1).trimEnd();
        truncWidth = measurer.width(trunc);
    }
    if (truncWidth + ellipsisWidth <= maxWidth) {
        return { text: `${trunc}${EllipsisChar}`, truncated: true };
    } else {
        return { text: undefined, truncated: false };
    }
}

function wrapLineSequentially(
    words: string[],
    maxWidth: number,
    maxHeight: number,
    measurer: TextMeasurer,
    textProps: TextSizeProperties,
    wrapping: TextWrap,
    cumulativeHeight: number,
    canOverflow: boolean
) {
    const { fontSize = 0, lineHeight = fontSize * DefaultLineHeightRatio } = textProps;
    const breakWord = wrapping === 'always' || wrapping === 'hyphenate';
    const hyphenate = wrapping === 'hyphenate';
    const spaceWidth = measurer.width(' ');

    let wordsBrokenOrTruncated = false;
    let linesTruncated = false;

    const lines: string[][] = [];
    let currentLine: string[] = [];
    let lineWidth = 0;

    const getReturnValue = () => ({
        lines,
        linesTruncated,
        wordsBrokenOrTruncated,
        cumulativeHeight,
    });

    const truncateLastLine = () => {
        if (!canOverflow) {
            return;
        }

        const lastLine = currentLine.join(' ');
        const { text } = truncateLine(lastLine, maxWidth, measurer, 'force');
        if (text == null) {
            return;
        }

        currentLine.splice(0, currentLine.length, text);
        linesTruncated = true;
        return getReturnValue();
    };

    const addNewLine = () => {
        const expectedHeight = cumulativeHeight + lineHeight;
        if (expectedHeight >= maxHeight) {
            return false;
        }
        // Add new line
        currentLine = [];
        lineWidth = 0;
        cumulativeHeight = expectedHeight;
        lines.push(currentLine);
        return true;
    };

    if (!addNewLine()) {
        return truncateLastLine();
    }

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const wordWidth = measurer.width(word);
        const expectedSpaceWidth = currentLine.length === 0 ? 0 : spaceWidth;
        const expectedLineWidth = lineWidth + expectedSpaceWidth + wordWidth;

        if (expectedLineWidth <= maxWidth) {
            // If the word fits, add it to the current line
            currentLine.push(word);
            lineWidth = expectedLineWidth;
            continue;
        }

        if (wordWidth <= maxWidth) {
            // If the word is not too long, put it onto new line
            if (!addNewLine()) {
                return truncateLastLine();
            }
            currentLine.push(word);
            lineWidth = wordWidth;
            continue;
        }

        // Handle a long word
        wordsBrokenOrTruncated = true;
        if (breakWord) {
            // Break the word into parts
            const availWidth = maxWidth - lineWidth - expectedSpaceWidth;
            const parts = breakWordFn(word, availWidth, maxWidth, hyphenate, measurer);
            for (let p = 0; p < parts.length; p++) {
                const part = parts[p];
                part && currentLine.push(part);
                if (p === parts.length - 1) {
                    lineWidth = measurer.width(part);
                } else if (!addNewLine()) {
                    return truncateLastLine();
                }
            }
        } else if (canOverflow) {
            // Truncate the word
            if (!addNewLine()) {
                return truncateLastLine();
            }
            const { text } = truncateLine(word, maxWidth, measurer, 'force');
            if (text == null) {
                return;
            }
            currentLine.push(text);
            if (i < words.length - 1) {
                linesTruncated = true;
            }
            break;
        } else {
            return;
        }
    }

    return getReturnValue();
}

function wrapLineBalanced(words: string[], maxWidth: number, measurer: TextMeasurer, linesCount: number) {
    const totalWordsWidth = words.reduce((sum, w) => sum + measurer.width(w), 0);
    const spaceWidth = measurer.width(' ');
    const totalSpaceWidth = spaceWidth * (words.length - linesCount - 2);
    const averageLineWidth = (totalWordsWidth + totalSpaceWidth) / linesCount;

    const lines: string[][] = [];

    let currentLine: string[] = [];
    let lineWidth = measurer.width(words[0]);
    let newLine = true;
    for (const word of words) {
        const width = measurer.width(word);
        if (newLine) {
            // New line
            currentLine = [];
            currentLine.push(word);
            lineWidth = width;
            newLine = false;
            lines.push(currentLine);
            continue;
        }
        const expectedLineWidth = lineWidth + spaceWidth + width;
        if (expectedLineWidth <= averageLineWidth) {
            // Keep adding words to the line
            currentLine.push(word);
            lineWidth = expectedLineWidth;
        } else if (expectedLineWidth <= maxWidth) {
            // Add the last word to the line
            currentLine.push(word);
            newLine = true;
        } else {
            // Put the word onto the next line
            currentLine = [word];
            lineWidth = width;
            lines.push(currentLine);
        }
    }

    return lines;
}
