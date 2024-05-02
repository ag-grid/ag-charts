import type { TextWrap } from '../options/chart/types';
import { createCanvasContext } from './canvas.util';

export type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export interface MeasureOptions {
    font: string;
    textAlign?: CanvasTextAlign;
    textBaseline?: CanvasTextBaseline;
}

export interface WrapOptions extends MeasureOptions {
    maxWidth: number;
    maxLines?: number;
    // maxHeight?: number;
    lineHeight?: number;
    textWrap: TextWrap;
}

export interface LineMetrics {
    width: number;
    height: number;
    offsetTop: number;
    offsetLeft: number;
    lineHeight: number;
}

export interface MultilineMetrics {
    width: number;
    height: number;
    offsetTop: number;
    offsetLeft: number;
    lineMetrics: ({ text: string } & LineMetrics)[];
}

export interface LegacyTextMetrics extends Writeable<TextMetrics> {
    emHeightAscent: number;
    emHeightDescent: number;
}

export class TextMeasurer {
    static readonly EllipsisChar = '\u2026';
    static readonly DefaultLineHeight = 1.15;

    // Caches 2D contexts and character widths by font to optimize performance.
    private static instanceMap = new Map<string, TextMeasurer>();
    // private static punctuation = new Set('.,-:;!?\'"()'.split(''));
    private static newLineRegexp = /\r?\n/g;

    private static createFontMeasurer(font: string) {
        const ctx = createCanvasContext();
        const measurer = new TextMeasurer(ctx);
        TextMeasurer.instanceMap.set(font, measurer);
        ctx.font = font;
        return measurer;
    }

    private static getFontMeasurer(options: MeasureOptions) {
        const measurer = TextMeasurer.instanceMap.get(options.font) ?? TextMeasurer.createFontMeasurer(options.font);
        if (options.textAlign) {
            measurer.ctx.textAlign = options.textAlign;
        }
        if (options.textBaseline) {
            measurer.ctx.textBaseline = options.textBaseline;
        }
        return measurer;
    }

    static wrapText(text: string, options: WrapOptions) {
        const measurer = TextMeasurer.getFontMeasurer(options);
        const lines: string[] = text.split(TextMeasurer.newLineRegexp);

        if (options.textWrap === 'never') {
            return lines.map((line) => this.truncateLine(line.trimEnd(), measurer, options.maxWidth));
        }

        const result = [];
        for (const line of lines) {
            result.push(...this.wrapLine(line.trimEnd(), measurer, options));
            if (options.maxLines && result.length >= options.maxLines) {
                return result.slice(0, options.maxLines);
            }
        }
        return result;
    }

    private static wrapLine(text: string, measurer: TextMeasurer, options: WrapOptions): string[] {
        let estimatedWidth = 0;
        let i = 0;
        for (; i < text.length; i++) {
            const charWidth = measurer.textWidth(text.charAt(i));
            if (estimatedWidth + charWidth > options.maxWidth) break;
            estimatedWidth += charWidth;
        }
        if (text.length === i) {
            return [text];
        }
        return [text];
    }

    private static truncateLine(text: string, measurer: TextMeasurer, maxWidth: number, ellipsisForce?: boolean) {
        const ellipsisWidth = measurer.textWidth(TextMeasurer.EllipsisChar);
        let estimatedWidth = 0;
        let i = 0;
        for (; i < text.length; i++) {
            const charWidth = measurer.textWidth(text.charAt(i));
            if (estimatedWidth + charWidth > maxWidth) break;
            estimatedWidth += charWidth;
        }
        if (text.length === i && (!ellipsisForce || estimatedWidth + ellipsisWidth <= maxWidth)) {
            return ellipsisForce ? text + TextMeasurer.EllipsisChar : text;
        }
        text = text.slice(0, i);
        while (text.length && measurer.textWidth(text) + ellipsisWidth > maxWidth) {
            text = text.slice(0, -1);
        }
        return text + TextMeasurer.EllipsisChar;
    }

    // Measures the dimensions of the provided text, handling multiline if needed.
    static measureText(text: string, options: MeasureOptions): LineMetrics | MultilineMetrics;
    static measureText(text: string[], options: MeasureOptions): MultilineMetrics;
    static measureText(text: string | string[], options: MeasureOptions) {
        const { ctx } = TextMeasurer.getFontMeasurer(options);
        if (typeof text === 'string' && !text.includes('\n')) {
            return this.getMetrics(ctx, text);
        }
        const lines = Array.isArray(text) ? text : text.split(TextMeasurer.newLineRegexp);
        return this.getMultilineMetrics(ctx, lines);
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

        const verticalModifier = TextMeasurer.getVerticalModifier(ctx.textBaseline);
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
    private charMap = new Map<string, number>();

    constructor(private readonly ctx: CanvasRenderingContext2D) {}

    textWidth(text: string): number {
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

export const TextMeasurerV2 = TextMeasurer;
