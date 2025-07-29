import type { FontFamily, FontSize, FontStyle, FontWeight } from 'ag-charts-types';

export const EllipsisChar = '\u2026';
export const LineSplitter = /\r?\n/g;

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
    return Math.ceil(fontSize * lineHeightRatio);
}

export function appendEllipsis(text: string) {
    return text.replace(/[.,]{1,5}$/, '') + EllipsisChar;
}
