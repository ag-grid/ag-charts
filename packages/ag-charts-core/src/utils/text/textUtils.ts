import type { TextOrSegments, TextSegment, TextValue } from 'ag-charts-types';

import { EllipsisChar, type FontOptions, TrimCharsRegex, TrimEdgeGuard } from '../../types/text';
import { isArray } from '../types/typeGuards';

export function toFontString({ fontSize, fontStyle, fontWeight, fontFamily }: FontOptions) {
    let fontString = '';
    if (fontStyle && fontStyle !== 'normal') {
        fontString += `${fontStyle} `;
    }
    if (fontWeight && fontWeight !== 'normal' && fontWeight !== 400) {
        fontString += `${fontWeight === 700 ? 'bold' : fontWeight} `;
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

export function appendEllipsis(text: string) {
    return text.replace(TrimCharsRegex, '') + EllipsisChar;
}

export function guardTextEdges(str: string) {
    return TrimEdgeGuard + str + TrimEdgeGuard;
}

export function unguardTextEdges(str: string) {
    return str.replaceAll(TrimEdgeGuard, '');
}

export function isTruncated(value: TextOrSegments) {
    return isArray(value) ? isSegmentTruncated(value.at(-1)) : isTextTruncated(toTextString(value));
}

export function isTextTruncated(str: string) {
    return str.endsWith(EllipsisChar);
}

export function isSegmentTruncated(segment: TextSegment | undefined) {
    return toTextString(segment?.text).endsWith(EllipsisChar);
}

// Segment a string into grapheme clusters, ensuring surrogate pairs,
// combining marks, and ZWJ sequences are never split.
const graphemeSegmenter =
    typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
        ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
        : undefined;

export function graphemeSegments(text: string): string[] {
    if (graphemeSegmenter) {
        return Array.from(graphemeSegmenter.segment(text), (s) => s.segment);
    }
    // Fallback: codepoint-level iteration (handles surrogate pairs, not combining marks)
    return Array.from(text);
}

export { EllipsisChar, LineSplitter, TrimEdgeGuard, TrimCharsRegex } from '../../types/text';
export type { FontOptions } from '../../types/text';
