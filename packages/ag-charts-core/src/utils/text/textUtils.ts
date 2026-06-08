import type { TextValue } from 'ag-charts-types';

import type {
    NormalisedContentSegment,
    NormalisedTextOrSegments,
} from '../../types/normalised-options/normalisedCommonOptions';
import { EllipsisChar, type FontOptions, TrimCharsRegex, TrimEdgeGuard } from '../../types/text';
import { isArray, isDate, isNumber } from '../types/typeGuards';

// CSS generic family keywords — must remain unquoted; quoting changes their
// meaning from keyword to literal family-name lookup.
const CSS_GENERIC_FAMILIES = new Set([
    'serif',
    'sans-serif',
    'monospace',
    'cursive',
    'fantasy',
    'system-ui',
    'ui-serif',
    'ui-sans-serif',
    'ui-monospace',
    'ui-rounded',
    'emoji',
    'math',
    'fangsong',
]);

// Quote multi-word / digit-containing family names so canvas font shorthand
// parses correctly; preserve already-quoted tokens and CSS generic keywords.
function quoteFontFamily(fontFamily: string | undefined): string {
    if (!fontFamily) return '';
    return fontFamily
        .split(',')
        .map((part) => {
            const trimmed = part.trim();
            if (!trimmed) return trimmed;
            if (trimmed.startsWith('"') || trimmed.startsWith("'")) return trimmed;
            if (CSS_GENERIC_FAMILIES.has(trimmed)) return trimmed;
            if (/\s/.test(trimmed)) return `"${trimmed}"`;
            return trimmed;
        })
        .join(', ');
}

export function toFontString({ fontSize, fontStyle, fontWeight, fontFamily }: FontOptions) {
    let fontString = '';
    if (fontStyle && fontStyle !== 'normal') {
        fontString += `${fontStyle} `;
    }
    if (fontWeight && fontWeight !== 'normal' && fontWeight !== 400) {
        fontString += `${fontWeight === 700 ? 'bold' : fontWeight} `;
    }
    fontString += `${fontSize}px`;
    fontString += ` ${quoteFontFamily(fontFamily)}`;
    return fontString;
}

export function calcLineHeight(fontSize: number, lineHeightRatio = 1.15) {
    return Math.round(fontSize * lineHeightRatio);
}

export function toTextString(value: TextValue | undefined): string {
    return String(value ?? '');
}

type CoercedTextValue<R> = string | R | undefined;

// Coerce the TextValue (number/Date) portion of a Renderer<P, R> return to a string,
// leaving R values, plain strings, and `undefined` unchanged. Centralises the contract
// shared by overlay/crosshair-style consumers that mix text and DOM/object outputs.
export function coerceTextValue<R>(value: TextValue | R): string | R;
export function coerceTextValue<R>(value: TextValue | R | undefined): CoercedTextValue<R>;
export function coerceTextValue<R>(value: TextValue | R | undefined): CoercedTextValue<R> {
    if (isNumber(value) || isDate(value)) return toTextString(value);
    return value;
}

export function appendEllipsis(text: string) {
    return preserveArabicJoining(text.replace(TrimCharsRegex, '')) + EllipsisChar;
}

// Arabic dual-joining letters: these change form based on position.
// When truncated mid-word, appending ZWJ preserves the medial/initial form.
// Excludes right-join-only letters (Alef, Teh Marbuta, Dal, Thal, Ra, Zain, Waw)
// whose final form is visually identical to isolated.
const RIGHT_JOIN_ONLY = new Set([
    0x0627, // Alef ا
    0x0629, // Teh Marbuta ة
    0x062f, // Dal د
    0x0630, // Thal ذ
    0x0631, // Ra ر
    0x0632, // Zain ز
    0x0648, // Waw و
]);

function isDualJoiningArabic(code: number) {
    return code >= 0x0620 && code <= 0x064a && !RIGHT_JOIN_ONLY.has(code);
}

export function preserveArabicJoining(text: string): string {
    if (!text) return text;
    const lastCode = text.codePointAt(text.length - 1)!;
    if (isDualJoiningArabic(lastCode)) {
        return text + '\u200D'; // ZWJ
    }
    return text;
}

export function guardTextEdges(str: string) {
    return TrimEdgeGuard + str + TrimEdgeGuard;
}

export function unguardTextEdges(str: string) {
    return str.replaceAll(TrimEdgeGuard, '');
}

export function isTruncated(value: NormalisedTextOrSegments) {
    return isArray(value) ? isSegmentTruncated(value.at(-1)) : isTextTruncated(toTextString(value));
}

export function isTextTruncated(str: string) {
    return str.endsWith(EllipsisChar);
}

export function isSegmentTruncated(segment: NormalisedContentSegment | undefined) {
    if (!segment || segment.type === 'image') return false;
    return toTextString(segment.text).endsWith(EllipsisChar);
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
