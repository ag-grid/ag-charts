import type { TextWrap } from 'ag-charts-types';
export type Writeable<T> = {
    -readonly [P in keyof T]: T[P];
};
export interface MeasureOptions {
    font: string;
    textAlign?: CanvasTextAlign;
    textBaseline?: CanvasTextBaseline;
}
export interface WrapOptions extends MeasureOptions {
    maxWidth: number;
    maxLines?: number;
    maxHeight?: number;
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
    lineMetrics: ({
        text: string;
    } & LineMetrics)[];
}
export interface LegacyTextMetrics extends Writeable<TextMetrics> {
    emHeightAscent: number;
    emHeightDescent: number;
}
export declare class TextMeasurer {
    private readonly ctx;
    static readonly EllipsisChar = "\u2026";
    private static readonly instanceMap;
    private static readonly lineSplitter;
    private static createFontMeasurer;
    private static getFontMeasurer;
    static measureText(text: string, options: MeasureOptions): LineMetrics;
    static measureLines(text: string | string[], options: MeasureOptions): MultilineMetrics;
    static wrapText(text: string, options: WrapOptions): string;
    static wrapLines(text: string, options: WrapOptions): string[];
    private static getWordAt;
    private static clipLines;
    private static avoidOrphans;
    private static truncateLine;
    private static getMetrics;
    private static getMultilineMetrics;
    private static getVerticalModifier;
    private readonly charMap;
    constructor(ctx: CanvasRenderingContext2D);
    textWidth(text: string, estimate?: boolean): number;
    private charWidth;
}
