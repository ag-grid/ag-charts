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

// Approximate the strong bidi classes: R/AL is the RTL scripts and explicit RTL marks, L any other
// letter. The R/AL ranges skip the Arabic-Indic digits (U+0660-9, U+06F0-9) and the Arabic number
// formatting characters (U+066A-C) \u2014 those are numeric, not strong.
const StrongRtlRegex = /[\u0590-\u065F\u066D-\u06EF\u06FA-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF\u200F\u202B\u202E\u2067]/u;
const StrongLtrRegex = /[\p{L}\u200E\u202A\u202D\u2066]/u;

// A string with no strong character takes its order from the paragraph direction alone, so it can be
// given its own left-to-right paragraph without changing how any surrounding text reads.
export function isDirectionNeutral(text: string): boolean {
    return !StrongRtlRegex.test(text) && !StrongLtrRegex.test(text);
}

const DigitRegex = /\p{Nd}/u;
// A suffix or unit belongs to the number only while attached to it: `+90Kb` is one value, `+90 Kb`
// is a value and a word. A run therefore never reaches across a space into adjacent text.
const NumberSign = /[+\-\u2212]\s?/u;
const NumberPrefix = /\p{Sc}\s?/u;
const NumberBody = /\p{Nd}+(?:[.,:'\u2019/\u066B\u066C\u00A0\u202F]\p{Nd}+)*(?:[eE][+\-\u2212]?\p{Nd}+)?/u;
const NumberSuffix = /[%\u066A\u2030\u00B0]|\p{Sc}/u;
const NumberUnit = /[A-Za-z\u00B5\u03BC]+/u;
// A dash between two values is a range: the halves must share one run, or they reorder against each
// other and `5-10` reads as `10-5`.
const NumberRange = /\s?[-\u2012-\u2015\u2212]\s?/u;
const NumberValue = `(?:${NumberPrefix.source})?${NumberBody.source}(?:${NumberSuffix.source})?(?:${NumberUnit.source})?`;
const NumberRunRegex = new RegExp(
    `(?:${NumberSign.source})?${NumberValue}(?:${NumberRange.source}${NumberValue})*`,
    'gu'
);

// Whether the nearest strong character before `offset` is left-to-right, in which case the bidi
// algorithm already carries a following number along that run.
function followsLtrText(text: string, offset: number): boolean {
    for (let i = offset - 1; i >= 0; i -= 1) {
        const char = text[i];
        if (StrongRtlRegex.test(char)) {
            return false;
        }
        if (StrongLtrRegex.test(char)) {
            return true;
        }
    }
    return false;
}

// In an RTL paragraph the neutrals attached to a number (sign, separators, unit) take the paragraph
// direction, so `-5` renders as `5-`. A number preceded by LTR text already reads correctly.
export function forceLtrNumbers(text: string): string {
    if (!DigitRegex.test(text)) return text;
    return text.replace(NumberRunRegex, (run: string, offset: number) =>
        followsLtrText(text, offset) ? run : LtrEmbedding + run + PopDirectionalFormatting
    );
}

// A DOM node cannot swap paragraph direction per line, so neutral text needs the marks once the paragraph is RTL.
// Without RTL on either side there is nothing to reorder, and marking would only pollute the text content.
export function forceLtrNumbersIn(text: string, paragraphIsRtl: boolean): string {
    return paragraphIsRtl || StrongRtlRegex.test(text) ? forceLtrNumbers(text) : text;
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

/** A `TextAlign` with the direction-relative values already resolved against the chart direction. */
export type ResolvedTextAlign = 'left' | 'center' | 'right';

/**
 * Resolve the direction-relative alignments `'start'`/`'end'` against the chart direction.
 *
 * The canvas resolves them against `ctx.direction`, which an individual text run may override, so
 * pinning them to a side keeps geometry (anchors, bounding boxes) in step with what gets painted.
 * The mapping is the identity on `'left'`/`'center'`/`'right'`, and therefore idempotent.
 */
export function resolveTextAlign(textAlign: CanvasTextAlign, isRtl: boolean | undefined): ResolvedTextAlign {
    switch (textAlign) {
        case 'start':
            return isRtl ? 'right' : 'left';
        case 'end':
            return isRtl ? 'left' : 'right';
        default:
            return textAlign;
    }
}

export { EllipsisChar, LineSplitter, TrimEdgeGuard, TrimCharsRegex } from '../../types/text';
export type { FontOptions } from '../../types/text';
