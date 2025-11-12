import type { FontFamily, FontSize, FontStyle, FontWeight, TextSegment, TextValue } from 'ag-charts-types';

export const EllipsisChar = '\u2026';
export const LineSplitter = /\r?\n/g;
export const TrimEdgeGuard = '\u200B'; // zero-width space, not trimmed, zero width

export interface FontOptions {
    fontSize: FontSize;
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    fontFamily?: FontFamily;
}
export function toFontString({ fontSize, fontStyle, fontWeight, fontFamily }: FontOptions) {
    let fontString = '';
    if (fontStyle && fontStyle !== 'normal') {
        fontString += `${fontStyle} `;
    }
    if (fontWeight && fontWeight !== 'normal' && fontWeight !== 400) {
        fontString += `${fontWeight} `;
    }
    fontString += `${fontSize}px`;
    fontString += ` ${fontFamily}`;
    return fontString;
}

export function calcLineHeight(fontSize: number, lineHeightRatio = 1.15) {
    return Math.round(fontSize * lineHeightRatio);
}

export function toTextString(value: TextValue | undefined): string {
    return String(value ?? '');
}

const TrimCharsRegex = /[\s.,;:-]{1,5}$/;
export function appendEllipsis(text: string) {
    return text.replace(TrimCharsRegex, '') + EllipsisChar;
}

export function guardTextEdges(str: string) {
    return TrimEdgeGuard + str + TrimEdgeGuard;
}

export function unguardTextEdges(str: string) {
    return str.replaceAll(TrimEdgeGuard, '');
}

export function isTextTruncated(str: string) {
    return str.endsWith(EllipsisChar);
}

export function isSegmentTruncated(segment: TextSegment | undefined) {
    return toTextString(segment?.text).endsWith(EllipsisChar);
}
