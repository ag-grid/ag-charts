import type { FontFamily, FontSize, FontStyle, FontWeight, OverflowStrategy, TextWrap } from '../../options/chart/types';
import { BBox } from '../bbox';
import type { RenderContext } from '../node';
import { Shape } from './shape';
export interface TextSizeProperties {
    fontFamily?: FontFamily;
    fontSize?: FontSize;
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    lineHeight?: number;
    textBaseline?: CanvasTextBaseline;
    textAlign?: CanvasTextAlign;
}
export declare class Text extends Shape {
    static readonly className = "Text";
    static defaultLineHeightRatio: number;
    static defaultStyles: {
        fill: string;
        stroke: undefined;
        strokeWidth: number;
        lineDash: undefined;
        lineDashOffset: number;
        lineCap: undefined;
        lineJoin: undefined;
        opacity: number;
        fillShadow: undefined;
    } & {
        textAlign: CanvasTextAlign;
        fontStyle: undefined;
        fontWeight: undefined;
        fontSize: number;
        fontFamily: string;
        textBaseline: CanvasTextBaseline;
    };
    static ellipsis: string;
    x: number;
    y: number;
    private lines;
    private onTextChange;
    text?: string;
    private _dirtyFont;
    private _font?;
    get font(): string;
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    fontSize?: number;
    fontFamily?: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    lineHeight?: number;
    computeBBox(): BBox;
    private getLineHeight;
    isPointInPath(x: number, y: number): boolean;
    render(renderCtx: RenderContext): void;
    private renderLines;
    static wrapLines(text: string, maxWidth: number, maxHeight: number, textProps: TextSizeProperties, wrapping: TextWrap, overflow: OverflowStrategy): {
        lines: string[] | undefined;
        truncated: boolean;
    };
    static wrap(text: string, maxWidth: number, maxHeight: number, textProps: TextSizeProperties, wrapping: TextWrap, overflow?: OverflowStrategy): {
        text: string;
        truncated: boolean;
    };
    private static wrapLine;
    private static punctuationMarks;
    private static breakWord;
    private static truncateLine;
    private static wrapLineSequentially;
    private static wrapLineBalanced;
    setFont(props: TextSizeProperties): void;
    setAlign(props: {
        textAlign: CanvasTextAlign;
        textBaseline: CanvasTextBaseline;
    }): void;
    protected static getVerticalModifier(textBaseline: CanvasTextBaseline): number;
    private static _textContext;
    private static get textContext();
    private static _measureText;
    private static _getTextSize;
    static measureText(text: string, font: string, textBaseline: CanvasTextBaseline, textAlign: CanvasTextAlign): TextMetrics;
    /**
     * Returns the width and height of the measured text.
     * @param text The single-line text to measure.
     * @param font The font shorthand string.
     */
    static getTextSize(text: string, font: string): {
        width: number;
        height: number;
    };
    static getTextSizeMultiline(lines: string[], font: string, textBaseline?: CanvasTextBaseline, textAlign?: CanvasTextAlign, lineHeight?: number): {
        top: number;
        left: number;
        width: number;
        height: number;
    };
}
export declare class TextMeasurer {
    protected font: string;
    constructor(font: string | TextSizeProperties);
    size(text: string): {
        width: number;
        height: number;
    };
    width(text: string): number;
}
export declare function getFont(fontProps: TextSizeProperties): string;
