import type { TextWrap } from '../options/chart/types';
import type { Writeable } from '../sandbox/types/generics';
import { createCanvasContext } from './canvas.util';

// Configuration options for measuring text.
export interface MeasureOptions {
    font: string;
    textAlign?: CanvasTextAlign;
    textBaseline?: CanvasTextBaseline;
}

// Extended measurement options including wrapping behavior.
export interface WrapOptions extends MeasureOptions {
    maxWidth: number;
    maxLines?: number;
    maxHeight?: number;
    lineHeight?: number;
    textWrap: TextWrap;
}

// Metrics for a single line of text.
export interface LineMetrics {
    width: number;
    height: number;
    offsetTop: number;
    offsetLeft: number;
    lineHeight: number;
}

// Metrics for multiple lines of text.
export interface MultilineMetrics {
    width: number;
    height: number;
    offsetTop: number;
    offsetLeft: number;
    lineMetrics: ({ text: string } & LineMetrics)[];
}

// TextMetrics adjusted for compatibility and extensibility.
export interface LegacyTextMetrics extends Writeable<TextMetrics> {
    emHeightAscent: number;
    emHeightDescent: number;
}

// Manages text measurement and wrapping functionalities.
export class TextMeasurer {
    static readonly EllipsisChar = '\u2026'; // Representation for text clipping.

    private static readonly instanceMap = new Map<string, TextMeasurer>();
    private static readonly lineSplitter = /\r?\n/g;

    // Creates or retrieves a TextMeasurer instance for a specific font.
    private static createFontMeasurer(font: string) {
        const ctx = createCanvasContext();
        const measurer = new this(ctx);
        this.instanceMap.set(font, measurer);
        ctx.font = font;
        return measurer;
    }

    // Gets a TextMeasurer instance, configuring text alignment and baseline if provided.
    private static getFontMeasurer(options: MeasureOptions) {
        const measurer = this.instanceMap.get(options.font) ?? this.createFontMeasurer(options.font);
        if (options.textAlign) {
            measurer.ctx.textAlign = options.textAlign;
        }
        if (options.textBaseline) {
            measurer.ctx.textBaseline = options.textBaseline;
        }
        return measurer;
    }

    // Measures the dimensions of the provided text, handling multiline if needed.
    static measureText(text: string, options: MeasureOptions) {
        const { ctx } = this.getFontMeasurer(options);
        return this.getMetrics(ctx, text);
    }

    static measureLines(text: string | string[], options: MeasureOptions) {
        const { ctx } = this.getFontMeasurer(options);
        const lines = typeof text === 'string' ? text.split(this.lineSplitter) : text;
        return this.getMultilineMetrics(ctx, lines);
    }

    static wrapText(text: string, options: WrapOptions) {
        return this.wrapLines(text, options).join('\n');
    }

    static wrapLines(text: string, options: WrapOptions) {
        const lines: string[] = text.split(this.lineSplitter);
        const measurer = this.getFontMeasurer(options);

        if (options.textWrap === 'never') {
            return lines.map((line) => this.truncateLine(line.trimEnd(), measurer, options.maxWidth));
        }

        const result: string[] = [];
        const wrapHyphenate = options.textWrap === 'hyphenate';
        const wrapOnSpace = options.textWrap === 'on-space';

        for (let line of lines) {
            line = line.trimEnd();

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

        const { height, lineMetrics } = this.measureLines(lines, options);

        if (height <= options.maxHeight) {
            return lines;
        }

        for (let i = 0, cumulativeHeight = 0; i < lineMetrics.length; i++) {
            const { lineHeight } = lineMetrics[i];
            cumulativeHeight += lineHeight;
            if (cumulativeHeight > options.maxHeight) {
                const clippedResults = lines.slice(0, Math.max(i, 1));
                const lastLine = clippedResults.pop()!;
                return clippedResults.concat(this.truncateLine(lastLine, measurer, options.maxWidth, true));
            }
        }

        return lines;
    }

    private static avoidOrphans(lines: string[], measurer: TextMeasurer, options: WrapOptions) {
        if (lines.length < 2) return;

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

    private static truncateLine(text: string, measurer: TextMeasurer, maxWidth: number, ellipsisForce?: boolean) {
        const ellipsisWidth = measurer.textWidth(this.EllipsisChar);
        let estimatedWidth = 0;
        let i = 0;
        for (; i < text.length; i++) {
            const charWidth = measurer.textWidth(text.charAt(i));
            if (estimatedWidth + charWidth > maxWidth) break;
            estimatedWidth += charWidth;
        }
        if (text.length === i && (!ellipsisForce || estimatedWidth + ellipsisWidth <= maxWidth)) {
            return ellipsisForce ? text + this.EllipsisChar : text;
        }
        text = text.slice(0, i).trimEnd();
        while (text.length && measurer.textWidth(text) + ellipsisWidth > maxWidth) {
            text = text.slice(0, -1).trimEnd();
        }
        return text + this.EllipsisChar;
    }

    // Measures metrics for a single line of text.
    private static getMetrics(ctx: CanvasRenderingContext2D, text: string): LineMetrics {
        const m = ctx.measureText(text) as LegacyTextMetrics;
        // Apply fallbacks for environments like `node-canvas` where some metrics may be missing.
        m.fontBoundingBoxAscent ??= m.emHeightAscent;
        m.fontBoundingBoxDescent ??= m.emHeightDescent;
        return {
            width: m.width,
            height: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent,
            lineHeight: m.fontBoundingBoxAscent + m.fontBoundingBoxDescent,
            offsetTop: m.actualBoundingBoxAscent,
            offsetLeft: m.actualBoundingBoxLeft,
        };
    }

    // Calculates aggregated metrics for multiline text.
    private static getMultilineMetrics(ctx: CanvasRenderingContext2D, lines: string[]): MultilineMetrics {
        let width = 0;
        let height = 0;
        let offsetTop = 0;
        let offsetLeft = 0;
        let baselineDistance = 0; // Distance between first and last baselines.

        const verticalModifier = this.getVerticalModifier(ctx.textBaseline);
        const lineMetrics = lines.map((line, index, { length }) => {
            const m = ctx.measureText(line) as LegacyTextMetrics;
            // Apply fallbacks for environments like `node-canvas` where some metrics may be missing.
            m.fontBoundingBoxAscent ??= m.emHeightAscent;
            m.fontBoundingBoxDescent ??= m.emHeightDescent;

            if (width < m.width) {
                width = m.width;
            }
            if (offsetLeft < m.actualBoundingBoxLeft) {
                offsetLeft = m.actualBoundingBoxLeft;
            }
            if (index === 0) {
                height += m.actualBoundingBoxAscent;
                offsetTop += m.actualBoundingBoxAscent;
            } else {
                baselineDistance += m.fontBoundingBoxAscent;
            }
            if (index === length - 1) {
                height += m.actualBoundingBoxDescent;
            } else {
                baselineDistance += m.fontBoundingBoxDescent;
            }

            return {
                text: line,
                width: m.width,
                height: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent,
                lineHeight: m.fontBoundingBoxAscent + m.fontBoundingBoxDescent,
                offsetTop: m.actualBoundingBoxAscent,
                offsetLeft: m.actualBoundingBoxLeft,
            };
        });

        height += baselineDistance;
        offsetTop += baselineDistance * verticalModifier;

        return { width, height, offsetTop, offsetLeft, lineMetrics };
    }

    // Determines vertical offset modifier based on text baseline.
    private static getVerticalModifier(textBaseline?: CanvasTextBaseline): number {
        switch (textBaseline) {
            case 'hanging':
            case 'top':
                return 0;
            case 'middle':
                return 0.5;
            case 'alphabetic':
            case 'bottom':
            case 'ideographic':
            default:
                return 1;
        }
    }

    // local chars width cache per TextMeasurer
    private readonly charMap = new Map<string, number>();

    constructor(private readonly ctx: CanvasRenderingContext2D) {}

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
