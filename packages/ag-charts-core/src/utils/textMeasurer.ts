import { type Writeable, createCanvasContext } from 'ag-charts-core';

import { LRUCache } from '../classes/lruCache';
import { type FontOptions, LineSplitter, toFontString } from './textUtils';

export interface TextBounds {
    width: number;
    height: number;
    ascent: number;
    descent: number;
}

export interface MultilineTextBounds {
    width: number;
    height: number;
    lineBounds: TextBounds[];
}

export interface LegacyTextMetrics extends Writeable<TextMetrics> {
    emHeightAscent: number;
    emHeightDescent: number;
}

export interface ITextMeasurer {
    measureText(text: string): TextBounds;
    measureLines(text: string | string[]): MultilineTextBounds;
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

    cachedMeasurer = new TextMeasurer((text, useCache = true) => {
        if (!useCache) return ctx.measureText(text);
        let textMetrics = cachedTextMetrics.get(text);
        if (textMetrics) return textMetrics;
        textMetrics = ctx.measureText(text);
        cachedTextMetrics.set(text, textMetrics);
        return textMetrics;
    });
    instanceMap.set(font, cachedMeasurer);
    return cachedMeasurer;
}

// Manages text measurement and wrapping functionalities.
export class TextMeasurer implements ITextMeasurer {
    private readonly charMap = new Map<string, number>();

    constructor(private readonly measureTextFn: (text: string, useCache?: boolean) => LegacyTextMetrics) {}

    measureText(text: string): TextBounds {
        const m = this.measureTextFn(text);
        const {
            width,
            // Apply fallbacks for environments like `node-canvas` where some metrics may be missing.
            fontBoundingBoxAscent: ascent = m.emHeightAscent,
            fontBoundingBoxDescent: descent = m.emHeightDescent,
        } = m;
        const height = ascent + descent;
        return { width, height, ascent, descent };
    }

    measureLines(text: string | string[]): MultilineTextBounds {
        const lines = typeof text === 'string' ? text.split(LineSplitter) : text;
        let width = 0;
        let height = 0;
        const lineBounds = lines.map((line) => {
            const b = this.measureText(line);
            if (width < b.width) {
                width = b.width;
            }
            height += b.height;
            return b;
        });
        return { width, height, lineBounds };
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
            return this.measureTextFn(text, false).width;
        }
        return this.charMap.get(text) ?? this.charWidth(text);
    }

    private charWidth(char: string) {
        const { width } = this.measureTextFn(char, false);
        this.charMap.set(char, width);
        return width;
    }
}
