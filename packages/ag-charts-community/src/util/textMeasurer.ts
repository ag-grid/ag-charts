import type { FontFamily, FontSize, FontStyle, FontWeight, Ratio } from 'ag-charts-types';

import { createCanvasContext } from './canvas.util';
import { LRUCache } from './lruCache';

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

export interface TextMeasurer {
    textWidth(text: string, estimate?: boolean): number;
    measureText(text: string): LineMetrics;
    measureLines(text: string | string[]): MultilineMetrics;
}

export class CachedTextMeasurerPool {
    private static readonly instanceMap = new LRUCache<string, CachedTextMeasurer>(10);

    // Measures the dimensions of the provided text, handling multiline if needed.
    static measureText(text: string, options: MeasureOptions) {
        const textMeasurer = this.getMeasurer(options);
        return textMeasurer.measureText(text);
    }

    static measureLines(text: string | string[], options: MeasureOptions) {
        const textMeasurer = this.getMeasurer(options);
        return textMeasurer.measureLines(text);
    }

    // Gets a TextMeasurer instance, configuring text alignment and baseline if provided.
    static getMeasurer(options: MeasureOptions) {
        const font = typeof options.font === 'string' ? options.font : TextUtils.toFontString(options.font);
        const key = `${font}-${options.textAlign ?? 'start'}-${options.textBaseline ?? 'alphabetic'}`;
        return this.instanceMap.get(key) ?? this.createFontMeasurer(font, options, key);
    }

    // Creates or retrieves a TextMeasurer instance for a specific font.
    private static createFontMeasurer(font: string, options: MeasureOptions, key: string) {
        const ctx = createCanvasContext();
        ctx.font = font;
        ctx.textAlign = options.textAlign ?? 'start';
        ctx.textBaseline = options.textBaseline ?? 'alphabetic';

        const measurer = new CachedTextMeasurer(ctx, options);
        this.instanceMap.set(key, measurer);
        return measurer;
    }
}

export class CachedTextMeasurer implements TextMeasurer {
    // cached text measurements
    private readonly measureMap = new LRUCache<string, LegacyTextMetrics>(100);

    private readonly textMeasurer: TextMeasurer;

    constructor(
        private readonly ctx: CanvasRenderingContext2D,
        options: MeasureOptions
    ) {
        if (options.textAlign) {
            ctx.textAlign = options.textAlign;
        }
        if (options.textBaseline) {
            ctx.textBaseline = options.textBaseline;
        }
        ctx.font = typeof options.font === 'string' ? options.font : TextUtils.toFontString(options.font);

        this.textMeasurer = new SimpleTextMeasurer(
            (t) => this.cachedCtxMeasureText(t),
            options.textBaseline ?? 'alphabetic'
        );
    }

    textWidth(text: string, estimate?: boolean): number {
        return this.textMeasurer.textWidth(text, estimate);
    }

    measureText(text: string) {
        return this.textMeasurer.measureText(text);
    }

    measureLines(text: string | string[]) {
        return this.textMeasurer.measureLines(text);
    }

    private cachedCtxMeasureText(text: string): LegacyTextMetrics {
        if (!this.measureMap.has(text)) {
            const rawResult = this.ctx.measureText(text);

            // Copy results so we don't call through to canvas context on later uses.
            this.measureMap.set(text, {
                actualBoundingBoxAscent: rawResult.actualBoundingBoxAscent,
                emHeightAscent: rawResult.emHeightAscent,
                emHeightDescent: rawResult.emHeightDescent,
                actualBoundingBoxDescent: rawResult.actualBoundingBoxDescent,
                actualBoundingBoxLeft: rawResult.actualBoundingBoxLeft,
                actualBoundingBoxRight: rawResult.actualBoundingBoxRight,
                alphabeticBaseline: rawResult.alphabeticBaseline,
                fontBoundingBoxAscent: rawResult.fontBoundingBoxAscent,
                fontBoundingBoxDescent: rawResult.fontBoundingBoxDescent,
                hangingBaseline: rawResult.hangingBaseline,
                ideographicBaseline: rawResult.ideographicBaseline,
                width: rawResult.width,
            });
        }

        return this.measureMap.get(text)!;
    }
}

export class TextUtils {
    static readonly EllipsisChar = '\u2026'; // Representation for text clipping.
    static readonly defaultLineHeight = 1.15; // Normally between 1.1 and 1.2
    static readonly lineSplitter = /\r?\n/g;

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
        return Math.ceil(fontSize * this.defaultLineHeight);
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
}

// Manages text measurement and wrapping functionalities.
export class SimpleTextMeasurer implements TextMeasurer {
    // local chars width cache per TextMeasurer
    private readonly charMap = new Map<string, number>();

    constructor(
        private readonly measureTextFn: (text: string) => LegacyTextMetrics,
        private readonly textBaseline: CanvasTextBaseline = 'alphabetic'
    ) {}

    // Measures metrics for a single line of text.
    private getMetrics(text: string): LineMetrics {
        const m = this.measureTextFn(text);
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
    private getMultilineMetrics(lines: string[]): MultilineMetrics {
        let width = 0;
        let height = 0;
        let offsetTop = 0;
        let offsetLeft = 0;
        let baselineDistance = 0; // Distance between first and last baselines.

        const verticalModifier = TextUtils.getVerticalModifier(this.textBaseline);
        const lineMetrics = [];

        let index = 0;
        const length = lines.length;
        for (const line of lines) {
            const m = this.measureTextFn(line);
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

            lineMetrics.push({
                text: line,
                width: m.width,
                height: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent,
                lineHeight: m.fontBoundingBoxAscent + m.fontBoundingBoxDescent,
                offsetTop: m.actualBoundingBoxAscent,
                offsetLeft: m.actualBoundingBoxLeft,
            });
            index++;
        }

        height += baselineDistance;
        offsetTop += baselineDistance * verticalModifier;

        return { width, height, offsetTop, offsetLeft, lineMetrics };
    }

    textWidth(text: string, estimate?: boolean): number {
        if (estimate) {
            let estimatedWidth = 0;
            for (let i = 0; i < text.length; i++) {
                estimatedWidth += this.textWidth(text.charAt(i));
            }
            return estimatedWidth;
        }
        if (text.length > 1) {
            return this.measureTextFn(text).width;
        }
        return this.charMap.get(text) ?? this.charWidth(text);
    }

    measureText(text: string) {
        return this.getMetrics(text);
    }

    // Measures the dimensions of the provided text, handling multiline if needed.
    measureLines(text: string | string[]) {
        const lines = typeof text === 'string' ? text.split(TextUtils.lineSplitter) : text;
        return this.getMultilineMetrics(lines);
    }

    private charWidth(char: string) {
        const { width } = this.measureTextFn(char);
        this.charMap.set(char, width);
        return width;
    }
}
