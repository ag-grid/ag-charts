import { LRUCache } from '../classes/lruCache';
import type { Writeable } from '../interfaces/globalTypes';
import { createCanvasContext } from './canvas';
import { type FontOptions, LineSplitter, toFontString } from './textUtils';

export interface TextMetricsBox {
    width: number;
    height: number;
    ascent: number;
    descent: number;
}

export interface LineMetricsBox extends TextMetricsBox {
    text: string;
}

export interface MultilineTextMetricsBox {
    width: number;
    height: number;
    lineMetrics: LineMetricsBox[];
}

export interface LegacyTextMetrics extends Writeable<TextMetrics> {
    emHeightAscent: number;
    emHeightDescent: number;
}

export interface ITextMeasurer {
    measureText(text: string): TextMetricsBox;
    measureLines(text: string | string[]): MultilineTextMetricsBox;
    baselineDistance(textBaseline: CanvasTextBaseline): number;
    textWidth(text: string, estimate?: boolean): number;
}

const instanceMap = new LRUCache<TextMeasurer>(50);
export function cachedTextMeasurer(font: string | FontOptions): TextMeasurer {
    if (typeof font === 'object') {
        font = toFontString(font);
    }

    let cachedMeasurer = instanceMap.get(font);
    if (cachedMeasurer) return cachedMeasurer;

    const cachedTextMetrics = new LRUCache<LegacyTextMetrics>(10_000);
    const ctx = createCanvasContext();
    ctx.font = font;

    cachedMeasurer = new TextMeasurer(ctx, (text) => {
        let textMetrics = cachedTextMetrics.get(text);
        if (textMetrics) return textMetrics;
        textMetrics = ctx.measureText(text);
        cachedTextMetrics.set(text, textMetrics);
        return textMetrics;
    });
    instanceMap.set(font, cachedMeasurer);
    return cachedMeasurer;
}

cachedTextMeasurer.clear = () => instanceMap.clear();

// Manages text measurement and wrapping functionalities.
export class TextMeasurer implements ITextMeasurer {
    private readonly baselineMap = new Map<string, number>();
    private readonly charMap = new Map<string, number>();

    constructor(
        private readonly ctx: CanvasRenderingContext2D,
        private readonly measureTextCached?: (text: string, useCache?: boolean) => LegacyTextMetrics
    ) {}

    baselineDistance(textBaseline: CanvasTextBaseline): number {
        if (textBaseline === 'alphabetic') return 0;
        if (this.baselineMap.has(textBaseline)) {
            return this.baselineMap.get(textBaseline)!;
        }
        this.ctx.textBaseline = textBaseline;
        const { alphabeticBaseline } = this.ctx.measureText('');
        this.baselineMap.set(textBaseline, alphabeticBaseline);
        this.ctx.textBaseline = 'alphabetic';
        return alphabeticBaseline; // Distance from the alphabetic baseline to the specified baseline.
    }

    measureText(text: string): TextMetricsBox {
        const m = this.measureTextCached?.(text) ?? this.ctx.measureText(text);
        const {
            width,
            // Apply fallbacks for environments like `node-canvas` where some metrics may be missing.
            fontBoundingBoxAscent: ascent = m.emHeightAscent,
            fontBoundingBoxDescent: descent = m.emHeightDescent,
        } = m;
        const height = ascent + descent;
        return { width, height, ascent, descent };
    }

    measureLines(text: string | string[]): MultilineTextMetricsBox {
        const lines = typeof text === 'string' ? text.split(LineSplitter) : text;
        let width = 0;
        let height = 0;
        const lineMetrics = lines.map((line) => {
            const b = this.measureText(line);
            if (width < b.width) {
                width = b.width;
            }
            height += b.height;
            return { text: line, ...b };
        });
        return { width, height, lineMetrics };
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
