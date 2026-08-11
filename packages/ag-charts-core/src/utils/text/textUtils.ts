import type { TextValue } from 'ag-charts-types';

import type {
    NormalisedContentSegment,
    NormalisedTextOrSegments,
} from '../../types/normalised-options/normalisedCommonOptions';
import {
    EllipsisChar,
    type FontOptions,
    LtrEmbedding,
    PopDirectionalFormatting,
    TrimCharsRegex,
    TrimEdgeGuard,
} from '../../types/text';
import { isArray, isDate, isNumber } from '../types/typeGuards';

// CSS generic family keywords — must remain unquoted; quoting changes their
// meaning from keyword to literal family-name lookup.
export const CSS_GENERIC_FAMILIES = new Set([
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

// toFontString runs per text render/measure with a handful of distinct font families, so the
// split/regex quoting is memoised by input. Soft-capped to bound pathological distinct-family
// workloads; on overflow the whole cache is cleared (steady-state hit rate stays ~100%).
const quotedFontFamilyCache = new Map<string, string>();
const MAX_QUOTED_FONT_FAMILY_ENTRIES = 256;

// Quote multi-word / digit-containing family names so canvas font shorthand
// parses correctly; preserve already-quoted tokens and CSS generic keywords.
function quoteFontFamily(fontFamily: string | undefined): string {
    if (!fontFamily) return '';
    const cached = quotedFontFamilyCache.get(fontFamily);
    if (cached !== undefined) return cached;
    const quoted = fontFamily
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
    if (quotedFontFamilyCache.size >= MAX_QUOTED_FONT_FAMILY_ENTRIES) quotedFontFamilyCache.clear();
    quotedFontFamilyCache.set(fontFamily, quoted);
    return quoted;
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

// Approximate the strong bidi classes. R/AL: Hebrew, Arabic, Syriac, Thaana, NKo, Samaritan,
// Mandaic, the Hebrew/Arabic presentation forms and the explicit RTL marks; L: any other letter.
// The Arabic-Indic digit ranges (U+0660-U+0669, U+06F0-U+06F9) are excluded from R/AL: they are
// numbers, not strong directional characters.
const StrongRtlRegex = /[\u0590-\u065F\u066A-\u06EF\u06FA-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF\u200F\u202B\u202E\u2067]/u;
const StrongLtrRegex = /[\p{L}\u200E\u202A\u202D\u2066]/u;

// A string with no strong directional character takes its order entirely from the paragraph
// direction, so its digits, signs and separators reorder in an RTL paragraph. Such a run can be
// given its own left-to-right paragraph without affecting how any surrounding text reads.
export function isDirectionNeutral(text: string): boolean {
    return !StrongRtlRegex.test(text) && !StrongLtrRegex.test(text);
}

const DigitRegex = /\p{Nd}/u;
// A number run: an optional sign and currency prefix, digit groups with their internal
// separators and exponent, then an optional percent/degree/currency suffix and unit token. Unit
// letters are Latin-only so an adjacent RTL word is never absorbed, and a token followed by
// another number is a word between two values rather than a unit.
const NumberSign = /[+\-\u2212]\s?/u;
const NumberPrefix = /\p{Sc}\s?/u;
const NumberBody = /\p{Nd}+(?:[.,:'\u2019/\u00A0\u202F]\p{Nd}+)*(?:[eE][+\-\u2212]?\p{Nd}+)?/u;
const NumberSuffix = /\s?[%\u2030\u00B0]|\s?\p{Sc}/u;
const NumberUnit = /\s?[A-Za-z\u00B5\u03BC]{1,4}(?![A-Za-z\u00B5\u03BC]|\s*\p{Nd})/u;
const NumberRunRegex = new RegExp(
    `(?:${NumberSign.source})?(?:${NumberPrefix.source})?${NumberBody.source}(?:${NumberSuffix.source})?(?:${NumberUnit.source})?`,
    'gu'
);

// Whether the nearest strong character before `offset` is left-to-right, in which case the bidi
// algorithm already carries a following number along that run.
function followsLtrText(text: string, offset: number): boolean {
    for (let i = offset - 1; i >= 0; i -= 1) {
        const char = text[i];
        if (StrongRtlRegex.test(char)) return false;
        if (StrongLtrRegex.test(char)) return true;
    }
    return false;
}

// Inside an RTL paragraph the neutral characters attached to a number (its sign, separators and
// unit) take the paragraph direction and reorder, so `-5` renders as `5-`. Embedding the number in
// its own left-to-right run keeps it readable while the surrounding text stays RTL. A number already
// carried by preceding LTR text is left alone, since embedding it would detach it from that run.
export function forceLtrNumbers(text: string): string {
    if (!DigitRegex.test(text)) return text;
    return text.replace(NumberRunRegex, (run: string, offset: number) =>
        followsLtrText(text, offset) ? run : LtrEmbedding + run + PopDirectionalFormatting
    );
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
