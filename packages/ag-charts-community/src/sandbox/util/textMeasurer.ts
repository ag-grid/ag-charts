import type { Writeable } from '../types/generics';

interface LineMetrics {
    width: number;
    height: number;
    offsetTop: number;
    offsetLeft: number;
    lineHeight: number;
}

interface MultilineMetrics {
    width: number;
    height: number;
    offsetTop: number;
    offsetLeft: number;
    lineMetrics: ({ text: string } & LineMetrics)[];
}

interface LegacyTextMetrics extends Writeable<TextMetrics> {
    emHeightAscent: number;
    emHeightDescent: number;
}

export class TextMeasurer {
    // Stores 2D contexts per font to avoid expensive re-creation.
    private static ctxMap = new Map<string, CanvasRenderingContext2D>();

    // Initializes and caches 2D context for the specified font.
    constructor(
        private readonly font: string,
        public textAlign: CanvasTextAlign = 'start',
        public textBaseline: CanvasTextBaseline = 'alphabetic'
    ) {
        if (!TextMeasurer.ctxMap.has(font)) {
            TextMeasurer.ctxMap.set(font, TextMeasurer.createContext());
        }
    }

    // Measures the dimensions of the provided text, handling multiline if needed.
    measureText(text: string) {
        const ctx = TextMeasurer.ctxMap.get(this.font)!;
        if (ctx.textBaseline !== this.textBaseline) {
            ctx.textBaseline = this.textBaseline;
        }
        if (ctx.textAlign !== this.textAlign) {
            ctx.textAlign = this.textAlign;
        }
        return text.includes('\n') ? this.getMultilineMetrics(ctx, text) : this.getMetrics(ctx, text);
    }

    // Measures metrics for a single line of text.
    private getMetrics(ctx: CanvasRenderingContext2D, text: string): LineMetrics {
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
    private getMultilineMetrics(ctx: CanvasRenderingContext2D, text: string): MultilineMetrics {
        let width = 0;
        let height = 0;
        let offsetTop = 0;
        let offsetLeft = 0;
        let baselineDistance = 0; // Distance between first and last baselines.

        const verticalModifier = TextMeasurer.getVerticalModifier(this.textBaseline);
        const lineMetrics = text.split('\n').map((line, index, { length }) => {
            const m = ctx.measureText(line.trim()) as LegacyTextMetrics;
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
    private static getVerticalModifier(textBaseline: CanvasTextBaseline): number {
        switch (textBaseline) {
            case 'top':
            case 'hanging':
                return 0;
            case 'bottom':
            case 'alphabetic':
            case 'ideographic':
                return 1;
            case 'middle':
                return 0.5;
        }
    }

    // Creates and returns a new 2D rendering context.
    private static createContext() {
        return new OffscreenCanvas(0, 0).getContext('2d') as unknown as CanvasRenderingContext2D;
    }
}
