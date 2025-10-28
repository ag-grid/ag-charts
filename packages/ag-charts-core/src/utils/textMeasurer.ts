import type { TextSegment } from 'ag-charts-types';

import { LRUCache } from '../classes/lruCache';
import type { Writeable } from '../interfaces/globalTypes';
import type { Size } from '../interfaces/sceneTypes';
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

export interface MeasuredSegment extends TextSegment {
    fontSize: number;
    textMetrics: TextMetricsBox;
}

export interface SegmentsLineMetrics extends Size {
    ascent: number;
    descent: number;
    segments: MeasuredSegment[];
}

export interface MultilineSegmentsMetricsBox {
    width: number;
    height: number;
    lineMetrics: SegmentsLineMetrics[];
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
    lineHeight(): number;
}

// Manages text measurement and wrapping functionalities.
export class TextMeasurer implements ITextMeasurer {
    private readonly baselineMap = new Map<string, number>();
    private readonly charMap = new Map<string, number>();
    private lineHeightCache: number | null = null;

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

    lineHeight() {
        this.lineHeightCache ??= this.measureText('').height;
        return this.lineHeightCache;
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

export function measureTextSegments(
    textSegments: TextSegment[],
    defaultFont: FontOptions
): MultilineSegmentsMetricsBox {
    let currentLine: SegmentsLineMetrics = { segments: [], width: 0, height: 0, ascent: 0, descent: 0 };
    const lineMetrics: SegmentsLineMetrics[] = [currentLine];

    for (const segment of textSegments) {
        const {
            text,
            fontSize = defaultFont.fontSize,
            fontStyle = defaultFont.fontStyle,
            fontWeight = defaultFont.fontWeight,
            fontFamily = defaultFont.fontFamily,
            ...rest
        } = segment;

        const font = { fontSize, fontStyle, fontWeight, fontFamily };
        const measurer = cachedTextMeasurer(font);
        const textLines = text.split(LineSplitter);

        for (let i = 0; i < textLines.length; i++) {
            const textLine = textLines[i];
            const textMetrics = measurer.measureText(textLine);
            // On new line, push a new line metrics object
            if (i > 0) {
                currentLine = { segments: [], width: 0, height: 0, ascent: 0, descent: 0 };
                lineMetrics.push(currentLine);
            }
            if (textLine) {
                currentLine.width += textMetrics.width;
                currentLine.ascent = Math.max(currentLine.ascent, textMetrics.ascent);
                currentLine.descent = Math.max(currentLine.descent, textMetrics.descent);
                currentLine.height = Math.max(currentLine.height, currentLine.ascent + currentLine.descent);
                currentLine.segments.push({ ...font, ...rest, text: textLine, textMetrics });
            }
        }
    }

    let maxWidth = 0;
    let totalHeight = 0;
    for (const line of lineMetrics) {
        maxWidth = Math.max(maxWidth, line.width);
        totalHeight += line.height;
    }

    return { width: maxWidth, height: totalHeight, lineMetrics };
}
