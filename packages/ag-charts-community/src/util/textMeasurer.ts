import type { FontFamily, FontSize, FontStyle, FontWeight, Ratio } from 'ag-charts-types';

import { createCanvasContext } from './canvas.util';

// Allows for mutation of a readonly type by making all properties writable.
export type Writeable<T> = { -readonly [P in keyof T]: T[P] };

// Configuration options create a font string.
export interface FontOptions {
    fontSize?: FontSize;
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    fontFamily?: FontFamily;
    lineHeight?: Ratio;
}

// Configuration options for measuring text.
export interface MeasureOptions {
    font: string | FontOptions;
    textAlign?: CanvasTextAlign;
    textBaseline?: CanvasTextBaseline;
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
    static readonly defaultLineHeight = 1.15; // Normally between 1.1 and 1.2

    private static readonly instanceMap = new Map<string, TextMeasurer>();
    protected static readonly lineSplitter = /\r?\n/g;

    static toFontString({ fontSize = 10, fontStyle, fontWeight, fontFamily, lineHeight }: FontOptions) {
        let fontString = '';
        if (fontStyle) {
            fontString += `${fontStyle} `;
        }
        if (fontWeight) {
            fontString += `${fontWeight} `;
        }
        fontString += `${fontSize}px`;
        if (lineHeight) {
            fontString += `/${lineHeight}px`;
        }
        fontString += ` ${fontFamily}`;
        return fontString.trim();
    }

    static getLineHeight(fontSize: number) {
        return Math.ceil(fontSize * TextMeasurer.defaultLineHeight);
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

    // Determines vertical offset modifier based on text baseline.
    static getVerticalModifier(textBaseline?: CanvasTextBaseline): number {
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

    // Gets a TextMeasurer instance, configuring text alignment and baseline if provided.
    static getFontMeasurer(options: MeasureOptions) {
        const font = typeof options.font === 'string' ? options.font : TextMeasurer.toFontString(options.font);
        const measurer = this.instanceMap.get(font) ?? this.createFontMeasurer(font);
        if (options.textAlign) {
            measurer.ctx.textAlign = options.textAlign;
        }
        if (options.textBaseline) {
            measurer.ctx.textBaseline = options.textBaseline;
        }
        return measurer;
    }

    // Creates or retrieves a TextMeasurer instance for a specific font.
    private static createFontMeasurer(font: string) {
        const ctx = createCanvasContext();
        const measurer = new this(ctx);
        this.instanceMap.set(font, measurer);
        ctx.font = font;
        return measurer;
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
