import type { ImageSegment, OverflowStrategy, TextWrap } from 'ag-charts-types';

import {
    BLOCK_IMAGE_SPACING,
    blockStripWidth,
    cachedTextMeasurer,
    imageSegmentBox,
    isBlockBoundary,
    measureTextSegments,
} from '../../rendering/textMeasurer';
import type {
    NormalisedContentSegment,
    NormalisedTextOrSegments,
} from '../../types/normalised-options/normalisedCommonOptions';
import type { ITextMeasurer, MeasuredImageSegment, MeasuredSegment, MeasuredTextSegment } from '../../types/text';
import { findMaxValue } from '../data/binarySearch';
import { type FitRegion, regionWidthAt } from '../geometry/fitRegion';
import { isArray, isFiniteNumber } from '../types/typeGuards';
import {
    EllipsisChar,
    type FontOptions,
    LineSplitter,
    TrimEdgeGuard,
    appendEllipsis,
    graphemeSegments,
    guardTextEdges,
    isTextTruncated,
    preserveArabicJoining,
    toTextString,
    unguardTextEdges,
} from './textUtils';

/**
 * How a label's text adapts to the region produced by its placement. `maxWidth`/`maxHeight` bound the
 * region explicitly; when omitted the fit step derives a budget from the series or an estimate.
 */
export interface LabelFit {
    readonly maxWidth?: number;
    readonly maxHeight?: number;
    readonly wrapping?: TextWrap;
    readonly overflowStrategy?: OverflowStrategy;
    /**
     * Smallest font size the label may shrink to so its text fits the region. Shrinking is tried before
     * {@link overflowStrategy} applies, which it does only once the minimum size still does not fit.
     */
    readonly minimumFontSize?: number;
    /**
     * The shape the label sits in, when it is not a rectangle. Each line is then wrapped to the width the
     * shape offers where that line lands, instead of every line sharing one inscribed rectangle's width.
     * Set by the series from its own geometry; `maxWidth`/`maxHeight` still cap the result.
     */
    readonly region?: FitRegion;
    /**
     * Where the block of text sits against the anchor when a {@link region} bounds it: `'center'` for a
     * label centred on its anchor, `'start'` for one drawn downwards from it, `'end'` for one drawn up to
     * it. The shape offers different room at different heights, so this decides which room the text gets.
     */
    readonly regionAlign?: RegionAlign;
}

/** Where a region-bounded block of text sits against its anchor; see {@link LabelFit.regionAlign}. */
export type RegionAlign = 'start' | 'center' | 'end';

/** A region-fitted label: the text, and where it has to be drawn to sit in the room it was fitted to. */
export interface FittedRegionText {
    text: NormalisedTextOrSegments;
    /** Horizontal offset from the anchor, for a shape with more room on one side of it than the other. */
    offsetX: number;
}

/** `'preserve'` is engine-internal: text still wraps to `maxWidth`, but nothing is ever dropped or ellipsised. */
export type WrapOverflow = OverflowStrategy | 'preserve';

export interface WrapOptions {
    font: FontOptions;
    maxWidth: number;
    maxHeight?: number;
    lineHeight?: number;
    textWrap?: TextWrap;
    overflow?: WrapOverflow;
    avoidOrphans?: boolean;
    /**
     * Width available to the line spanning `[top, bottom]` of the text block, for a label bounded by a
     * shape rather than a box. Never wider than {@link maxWidth}, which still caps every line. Unset
     * keeps every line on `maxWidth`, so a box-bounded label is unaffected.
     */
    maxWidthAt?: (top: number, bottom: number) => number;
}

/** Width the line spanning `[top, bottom]` of the block may use, capped by the label's own `maxWidth`. */
function lineMaxWidth(options: WrapOptions, top: number, bottom: number) {
    if (options.maxWidthAt == null) return options.maxWidth;
    return Math.min(options.maxWidth, options.maxWidthAt(top, bottom));
}

function shouldHideOverflow(clippedResult: string[], options: WrapOptions) {
    return options.overflow === 'hide' && clippedResult.some(isTextTruncated);
}

function preservesText(options: WrapOptions) {
    return options.overflow === 'preserve';
}

export function wrapTextOrSegments(text: string, options: WrapOptions): string;
export function wrapTextOrSegments(segments: NormalisedContentSegment[], options: WrapOptions): MeasuredSegment[];
export function wrapTextOrSegments(input: NormalisedTextOrSegments, options: WrapOptions): string | MeasuredSegment[];
export function wrapTextOrSegments(input: NormalisedTextOrSegments, options: WrapOptions) {
    return isArray(input) ? wrapTextSegments(input, options) : wrapLines(toTextString(input), options).join('\n');
}

export function wrapText(text: string, options: WrapOptions) {
    return wrapLines(text, options).join('\n');
}

/**
 * Adapts a label's text to its fit policy (wrap/truncate), mirroring how the caption fits its own text.
 * Returns the input unchanged when the policy sets no width or height bound, so an unset policy is a
 * no-op and callers can apply it unconditionally.
 */
export function fitLabelText(
    text: NormalisedTextOrSegments,
    fit: LabelFit | undefined,
    font: FontOptions
): NormalisedTextOrSegments {
    if (fit == null) return text;
    const { maxWidth, maxHeight, wrapping, overflowStrategy, region } = fit;
    if (maxWidth == null && maxHeight == null && region == null) return text;
    const overflow = overflowStrategy ?? 'preserve';
    const options: WrapOptions = {
        font,
        maxWidth: maxWidth ?? Infinity,
        // A height bound can only be honoured by dropping lines, which 'preserve' forbids.
        maxHeight: overflow === 'preserve' ? undefined : maxHeight,
        textWrap: wrapping,
        overflow,
    };
    // This caller writes the text where it already is, so the fit has to be the one the anchor can draw:
    // an offset chosen to exploit an asymmetric shape would be discarded here and the text overflow it.
    // A caller that can move the label as well calls {@link fitLabelTextToRegion} instead.
    return region == null
        ? wrapTextOrSegments(text, options)
        : wrapTextToRegion(text, options, region, fit.regionAlign ?? 'center', true).text;
}

/**
 * {@link fitLabelText} for a caller that can place the label as well as write it: a shape with more room
 * on one side of the anchor than the other is only worth fitting to if the text is drawn where that room
 * is, so the offset it was fitted at comes back with the text.
 */
export function fitLabelTextToRegion(
    text: NormalisedTextOrSegments,
    fit: LabelFit | undefined,
    font: FontOptions
): FittedRegionText {
    if (fit?.region == null) return { text: fitLabelText(text, fit, font), offsetX: 0 };
    const overflow = fit.overflowStrategy ?? 'preserve';
    return wrapTextToRegion(
        text,
        {
            font,
            maxWidth: fit.maxWidth ?? Infinity,
            maxHeight: overflow === 'preserve' ? undefined : fit.maxHeight,
            textWrap: fit.wrapping,
            overflow,
        },
        fit.region,
        fit.regionAlign ?? 'center'
    );
}

// A pass over a narrowing shape discovers at most one more line than the last one, so a segmented block's
// fixed point takes as many passes as it ends with lines. This caps a shape that oscillates instead.
const MAX_REGION_REFINEMENTS = 12;

function measureText(text: NormalisedTextOrSegments, font: FontOptions) {
    return isArray(text) ? measureTextSegments(text, font) : cachedTextMeasurer(font).measureLines(toTextString(text));
}

/** Characters of the source that survived a fit, ignoring the layout and the ellipsis marking the loss. */
function survivingCharacters(text: string) {
    return text.replaceAll(EllipsisChar, '').replace(/\s/g, '').length;
}

/** Where the top of a block of `height` sits against the anchor, kept inside the room the shape has. */
function blockTopFor(align: RegionAlign, height: number, region: FitRegion, limit: number) {
    if (height >= limit) return -region.extentAbove;
    let top = -height / 2;
    if (align === 'start') {
        top = 0;
    } else if (align === 'end') {
        top = -height;
    }
    return Math.min(Math.max(top, -region.extentAbove), region.extentBelow - height);
}

/**
 * Where to centre the block so its lines get the most room. Centred text only reaches half as far as its
 * nearer edge allows, so the offset that suits the block is not the anchor unless the shape is symmetric
 * about it. Each band's own centre is a candidate, and the one giving the most width across the block wins.
 */
function blockOffsetX(region: FitRegion, bands: (readonly [number, number])[]) {
    const spans = bands.map(([top, bottom]) => region.spanAt(top, bottom));
    const candidates = [0];
    for (const [left, right] of spans) {
        if (left < right) candidates.push((left + right) / 2);
    }
    let best = 0;
    let bestTotal = -1;
    for (const offset of candidates) {
        let total = 0;
        for (const [left, right] of spans) {
            total += Math.max(0, 2 * Math.min(offset - left, right - offset));
        }
        if (total > bestTotal) {
            bestTotal = total;
            best = offset;
        }
    }
    return best;
}

/** One candidate layout: the text wrapped into a block of `lines`, and how much of the source it kept. */
function wrapBlockToRegion(
    text: string,
    options: WrapOptions,
    region: FitRegion,
    align: RegionAlign,
    limit: number,
    lineHeight: number,
    lines: number,
    anchored: boolean
) {
    const height = Math.min(lines * lineHeight, limit);
    const blockTop = blockTopFor(align, height, region, limit);
    const bands: (readonly [number, number])[] = [];
    for (let i = 0; i < lines; i += 1) {
        bands.push([blockTop + i * lineHeight, blockTop + (i + 1) * lineHeight] as const);
    }
    const offsetX = anchored ? 0 : blockOffsetX(region, bands);
    const widthAt = (top: number, bottom: number) => regionWidthAt(region, blockTop + top, blockTop + bottom, offsetX);
    const wrapped = wrapTextOrSegments(text, {
        ...options,
        // The band a line occupies must be the one it will be drawn in, so the width the shape offers is
        // asked for the same rows the renderer will fill; the font's own line height is shorter.
        lineHeight,
        // The shape's own room bounds the block, so a caller need not restate it as maxHeight.
        maxHeight: height,
        maxWidthAt: widthAt,
    });
    const marked = markLostText(String(wrapped), text, options, widthAt, lineHeight);
    // A candidate whose text did not wrap into the block it was measured for was fitted to the wrong
    // bands, so it only stands until a line count that agrees with itself keeps as much.
    return { text: marked, offsetX, consistent: marked.split('\n').length === lines };
}

/**
 * A shape can narrow a band to nothing, and the wrap simply stops there. Text lost that way has to be
 * marked like any other overflow, or the label reads as the whole value when it is only the start of it.
 */
function markLostText(
    wrapped: string,
    source: string,
    options: WrapOptions,
    widthAt: (top: number, bottom: number) => number,
    lineHeight: number
) {
    // Nothing placed at all is not overflow but erasure: the caller decides whether to drop the label or
    // let it overflow, and an ellipsis conjured here would rob it of that choice.
    if (wrapped === '' || options.overflow !== 'ellipsis' || isTextTruncated(wrapped)) return wrapped;
    if (survivingCharacters(wrapped) >= survivingCharacters(source)) return wrapped;
    const lines = wrapped.split('\n');
    const last = lines.length - 1;
    const width = widthAt(last * lineHeight, (last + 1) * lineHeight);
    lines[last] = truncateLine(lines[last], cachedTextMeasurer(options.font), width, true);
    return lines.join('\n');
}

/**
 * Wraps `text` to the room `region` offers. The block's height decides which bands its lines land in, and
 * those bands decide how the text wraps, so the two are settled by trying each line count the shape has
 * room for and keeping the layout that loses the least text — fewest lines first, so a block that fits
 * whole never spreads itself out.
 */
function wrapTextToRegion(
    text: NormalisedTextOrSegments,
    options: WrapOptions,
    region: FitRegion,
    align: RegionAlign,
    anchored = false
): FittedRegionText {
    const limit = Math.min(options.maxHeight ?? Infinity, region.extentAbove + region.extentBelow);
    if (isArray(text)) {
        return { text: refineSegmentsToRegion(text, options, region, align, limit), offsetX: 0 };
    }

    // One line's height, not the measured block's: a source carrying its own line breaks would otherwise
    // size every band to the whole block and wrap each line against a row it never occupies.
    const lineHeight = cachedTextMeasurer(options.font).lineHeight();
    const source = toTextString(text);
    const wanted = survivingCharacters(source);
    // A line holds at least one character, so more lines than the source has cannot keep more of it —
    // and that also bounds the search when a region reports an unbounded extent.
    const roomForLines = Math.floor(limit / Math.max(1, lineHeight));
    const maxLines = Math.max(1, Math.min(roomForLines, source.length));
    let best: { text: string; offsetX: number; consistent: boolean } | undefined;
    let bestKept = -1;
    for (let lines = 1; lines <= maxLines; lines += 1) {
        const candidate = wrapBlockToRegion(source, options, region, align, limit, lineHeight, lines, anchored);
        const kept = survivingCharacters(candidate.text);
        if (kept > bestKept || (kept === bestKept && candidate.consistent && best?.consistent === false)) {
            bestKept = kept;
            best = candidate;
        }
        if (bestKept >= wanted && best?.consistent === true) break;
    }
    return best == null ? { text, offsetX: 0 } : { text: best.text, offsetX: best.offsetX };
}

/**
 * The segmented path, where a line's height is the tallest segment on it and cannot be predicted from the
 * block's line count. It converges on the block's height instead, one line per pass.
 */
function refineSegmentsToRegion(
    text: NormalisedContentSegment[],
    options: WrapOptions,
    region: FitRegion,
    align: RegionAlign,
    limit: number
) {
    let height = measureText(text, options.font).height;
    let lines = 1;
    let result: NormalisedTextOrSegments = text;
    for (let i = 0; i < MAX_REGION_REFINEMENTS; i += 1) {
        const blockTop = blockTopFor(align, Math.min(height, limit), region, limit);
        result = wrapTextOrSegments(text, {
            ...options,
            lineHeight: height / lines,
            maxHeight: limit,
            maxWidthAt: (top, bottom) => regionWidthAt(region, blockTop + top, blockTop + bottom),
        });
        const next = measureText(result, options.font).height;
        lines = Math.max(1, Math.round(next / (height / lines)));
        if (next === height) break;
        height = next;
    }
    return result;
}

/** Attaches the shape a label is bounded by to its fit policy; see {@link LabelFit.region}. */
export function withFitRegion(fit: LabelFit | undefined, region: FitRegion | undefined): LabelFit | undefined {
    if (fit == null || region == null) return fit;
    return { ...fit, region };
}

/** A fit can bound the text away to nothing, which the placement engine treats as no label at all. */
export function isErased(text: NormalisedTextOrSegments): boolean {
    return isArray(text) ? text.length === 0 : String(text).length === 0;
}

/**
 * Whether a fitted label still shows a character, ignoring the ellipsis and whitespace it can be reduced
 * to. A budget too narrow for any real character leaves a bare `…`, which reads as an artefact rather than
 * a label, so callers shrinking a budget treat that as erased.
 */
export function hasRealChars(text: NormalisedTextOrSegments): boolean {
    if (!isArray(text)) return survivingCharacters(toTextString(text)) > 0;
    for (const segment of text) {
        if (segment.type !== 'image' && survivingCharacters(toTextString(segment.text)) > 0) return true;
    }
    return false;
}

/**
 * Fits `text` to `fit`, falling back to `fitOverflow` when that leaves nothing to draw. An erased label is
 * dropped by the placement engine, so one that must always show overflows its bound rather than vanishing.
 */
export function fitLabelTextOrOverflow(
    text: NormalisedTextOrSegments,
    fit: LabelFit | undefined,
    fitOverflow: LabelFit | undefined,
    font: FontOptions
): NormalisedTextOrSegments {
    const fitted = fitLabelText(text, fit, font);
    if (fitOverflow == null || !isErased(fitted) || isErased(text)) return fitted;
    return fitLabelText(text, fitOverflow, font);
}

/** A label's fitted text, with the reduced font size it was fitted at when {@link LabelFit.minimumFontSize} applied. */
export interface AutoSizedLabelText {
    readonly text: NormalisedTextOrSegments;
    /** Reduced font size the text fits at; `undefined` when the configured size was kept. */
    readonly fontSize?: number;
}

/**
 * `font` at `fontSize`, or `font` itself when the size is unchanged. Fields are copied by name because a
 * label's font is often a `@Property` instance, whose prototype accessors a spread would silently drop.
 */
export function fontWithSize(font: FontOptions, fontSize: number | undefined): FontOptions {
    if (fontSize == null || fontSize === font.fontSize) return font;
    return { fontSize, fontStyle: font.fontStyle, fontWeight: font.fontWeight, fontFamily: font.fontFamily };
}

/**
 * The size an auto-sizing search may shrink to. Validation rejects a minimum above the configured
 * size, but an `itemStyler` resolves its size per datum, downstream of that check.
 */
export function resolveMinimumFontSize(minimumFontSize: number | undefined, fontSize: number): number {
    return minimumFontSize == null ? fontSize : Math.min(minimumFontSize, fontSize);
}

/**
 * Largest of `steps` candidates that `probe` accepts, smallest-first so index `0` is the floor.
 * Bisects, so a candidate that fits must imply every smaller one does.
 */
export function findLargestFittingStep<T>(steps: number, probe: (index: number) => T | undefined): T | undefined {
    const top = steps - 1;
    if (top < 0) return undefined;
    // Most labels need no reduction at all, so the configured size earns a probe before the bisection.
    return probe(top) ?? findMaxValue(0, top - 1, probe);
}

/**
 * The size ladder between two bounds, smallest-first so index `0` is the floor: both bounds exactly, and
 * every whole size strictly between them. Returns the step count and the size at each index.
 */
function fontSizeLadder(minimumFontSize: number, fontSize: number) {
    // First whole size strictly inside the range at either end, so neither bound is probed twice.
    const lowest = Math.floor(minimumFontSize) === minimumFontSize ? minimumFontSize + 1 : Math.ceil(minimumFontSize);
    const highest = Math.ceil(fontSize) === fontSize ? fontSize - 1 : Math.floor(fontSize);
    const steps = 2 + Math.max(0, highest - lowest + 1);
    const sizeAt = (index: number) => {
        if (index === 0) return minimumFontSize;
        return index === steps - 1 ? fontSize : lowest + index - 1;
    };
    return { steps, sizeAt };
}

/**
 * Largest font size between `minimumFontSize` and `fontSize` that `probe` accepts. Only the minimum
 * is probed with `atFloor` set, so a label shrinks as far as it can before its overflow strategy may
 * truncate or hide it. Sizes between the bounds are whole, but both bounds are probed exactly.
 */
export function findLargestFittingFontSize<T>(
    minimumFontSize: number,
    fontSize: number,
    probe: (fontSize: number, atFloor: boolean) => T | undefined
): T | undefined {
    if (minimumFontSize >= fontSize) return probe(fontSize, true);
    const { steps, sizeAt } = fontSizeLadder(minimumFontSize, fontSize);
    return findLargestFittingStep(steps, (index) => probe(sizeAt(index), index === 0));
}

/**
 * {@link findLargestFittingFontSize} over the same ladder, but scanning down from `fontSize` instead of
 * bisecting. For a predicate that is not monotonic in the font size — collision clearance, where a smaller
 * size can reflow the text into a box wider than the one it replaces — a bisection can step past the
 * largest accepted size, so the scan is the only search that honours the contract.
 */
export function findLargestFontSizeDescending<T>(
    minimumFontSize: number,
    fontSize: number,
    probe: (fontSize: number, atFloor: boolean) => T | undefined
): T | undefined {
    if (minimumFontSize >= fontSize) return probe(fontSize, true);
    const { steps, sizeAt } = fontSizeLadder(minimumFontSize, fontSize);
    for (let index = steps - 1; index >= 0; index--) {
        const found = probe(sizeAt(index), index === 0);
        if (found !== undefined) return found;
    }
    return undefined;
}

/** The size the search bottoms out at, or `undefined` when the label cannot shrink. */
function autoSizeFloor(fit: LabelFit, font: FontOptions): number | undefined {
    const { minimumFontSize, maxWidth, maxHeight } = fit;
    if (minimumFontSize == null || (maxWidth == null && maxHeight == null)) return undefined;
    const resolved = resolveMinimumFontSize(minimumFontSize, font.fontSize);
    return resolved < font.fontSize ? resolved : undefined;
}

/**
 * Fits a label's text at the largest size between {@link LabelFit.minimumFontSize} and `font.fontSize` that
 * holds it whole; only at the minimum may the configured overflow strategy truncate or hide, so a label
 * always shrinks before it ellipsises or vanishes.
 */
export function fitLabelTextAutoSize(
    text: NormalisedTextOrSegments,
    fit: LabelFit | undefined,
    font: FontOptions
): AutoSizedLabelText {
    const minimumFontSize = fit == null ? undefined : autoSizeFloor(fit, font);
    if (fit == null || minimumFontSize == null) return { text: fitLabelText(text, fit, font) };
    // Above the floor the text must fit whole; 'hide' erases it otherwise so the search steps down.
    const wholeTextFit: LabelFit = { ...fit, overflowStrategy: 'hide' };
    const found = findLargestFittingFontSize<AutoSizedLabelText>(
        minimumFontSize,
        font.fontSize,
        (fontSize, atFloor) => {
            const fitted = fitLabelText(text, atFloor ? fit : wholeTextFit, fontWithSize(font, fontSize));
            if (isErased(fitted)) return undefined;
            return { text: fitted, fontSize: fontSize === font.fontSize ? undefined : fontSize };
        }
    );
    // Not even the floor holds anything, so the label is whatever its overflow strategy leaves: nothing.
    return found ?? { text: fitLabelText(text, fit, fontWithSize(font, minimumFontSize)) };
}

/** {@link fitLabelTextAutoSize} with the never-erase fallback of {@link fitLabelTextOrOverflow}. */
export function fitLabelTextOrOverflowAutoSize(
    text: NormalisedTextOrSegments,
    fit: LabelFit | undefined,
    fitOverflow: LabelFit | undefined,
    font: FontOptions
): AutoSizedLabelText {
    const fitted = fitLabelTextAutoSize(text, fit, font);
    if (fitOverflow == null || !isErased(fitted.text) || isErased(text)) return fitted;
    return fitLabelTextAutoSize(text, fitOverflow, font);
}

export function wrapLines(text: string, options: WrapOptions) {
    return textWrap(text, options);
}

export function truncateLine(text: string, measurer: ITextMeasurer, maxWidth: number, ellipsisForce?: boolean) {
    const ellipsisWidth = measurer.textWidth(EllipsisChar);
    const graphemes = graphemeSegments(text);
    let estimatedWidth = 0;
    let charOffset = 0;
    for (const grapheme of graphemes) {
        const charWidth = measurer.textWidth(grapheme);
        if (estimatedWidth + charWidth > maxWidth) break;
        estimatedWidth += charWidth;
        charOffset += grapheme.length;
    }
    if (charOffset === text.length && (!ellipsisForce || estimatedWidth + ellipsisWidth <= maxWidth)) {
        return ellipsisForce ? appendEllipsis(text) : text;
    }
    text = text.slice(0, charOffset).trimEnd();
    const g = graphemeSegments(text);
    while (g.length && measurer.textWidth(text) + ellipsisWidth > maxWidth) {
        g.pop();
        while (g.length && g.at(-1)!.trim() === '') {
            g.pop();
        }
        text = g.join('');
    }
    return appendEllipsis(text);
}

function textWrap(text: string, options: WrapOptions, widthOffset = 0, blockTop = 0) {
    const lines: string[] = text.split(LineSplitter);
    const measurer = cachedTextMeasurer(options.font);
    const result: string[] = [];
    const preserveText = preservesText(options);
    // A shape-bounded label narrows per line, so every width test below asks for the line being built.
    // Lines are uniform height here: one font per call, with segments driving their own offset in.
    const lineHeight = options.maxWidthAt == null ? 0 : (options.lineHeight ?? measurer.lineHeight());
    const maxWidth = () => {
        const top = blockTop + result.length * lineHeight;
        return lineMaxWidth(options, top, top + lineHeight);
    };

    if (options.textWrap === 'never') {
        if (preserveText) {
            return lines.map((line) => line.trimEnd());
        }
        for (const line of lines) {
            const truncatedLine = truncateLine(line.trimEnd(), measurer, Math.max(0, maxWidth() - widthOffset));
            if (!truncatedLine) break;
            result.push(truncatedLine);
            widthOffset = 0;
        }
        return shouldHideOverflow(result, options) ? [] : result;
    }

    const wrapHyphenate = options.textWrap === 'hyphenate';
    const wrapOnSpace = options.textWrap == null || options.textWrap === 'on-space';

    for (const untrimmedLine of lines) {
        let line = untrimmedLine.trimEnd();

        if (line === '') {
            result.push(line);
            continue;
        }

        let graphemes = graphemeSegments(line);
        let i = 0;
        let charOffset = 0;
        let estimatedWidth = 0;
        let lastSpaceIndex = 0;

        // Cut `line` at `breakIndex` and restart the scan at the head of what remains.
        const resumeAfterBreak = (breakIndex: number) => {
            line = line.slice(breakIndex).trimStart();
            graphemes = graphemeSegments(line);
            i = 0;
            charOffset = 0;
            estimatedWidth = 0;
            lastSpaceIndex = 0;
        };

        if (!result.length) {
            estimatedWidth = widthOffset;
        }

        while (i < graphemes.length) {
            const char = graphemes[i];

            if (char === ' ') {
                lastSpaceIndex = charOffset;
            }

            estimatedWidth += measurer.textWidth(char);

            if (estimatedWidth > maxWidth()) {
                // char width is greater than the line's max width
                if (i === 0) {
                    if (!preserveText) {
                        line = '';
                    }
                    break;
                }

                // check actual width in case estimation is off
                let actualWidth = measurer.textWidth(line.slice(0, charOffset + char.length));
                if (!result.length) {
                    actualWidth += widthOffset;
                }
                if (actualWidth <= maxWidth()) {
                    estimatedWidth = actualWidth;
                    charOffset += char.length;
                    i++;
                    continue;
                }

                if (preserveText && wrapOnSpace) {
                    // A word with no space to break at overhangs whole rather than being cut short.
                    const breakIndex = lastSpaceIndex || line.indexOf(' ', 1);
                    if (breakIndex < 1) break;
                    result.push(line.slice(0, breakIndex).trimEnd());
                    resumeAfterBreak(breakIndex);
                    continue;
                }

                if (lastSpaceIndex) {
                    const nextWord = getWordAt(line, lastSpaceIndex + 1);
                    const textWidth = measurer.textWidth(nextWord);

                    if (textWidth <= maxWidth()) {
                        result.push(line.slice(0, lastSpaceIndex).trimEnd());
                        resumeAfterBreak(lastSpaceIndex);
                        continue;
                    } else if (wrapOnSpace && textWidth > maxWidth()) {
                        result.push(
                            line.slice(0, lastSpaceIndex).trimEnd(),
                            truncateLine(line.slice(lastSpaceIndex).trimStart(), measurer, maxWidth(), true)
                        );
                    }
                } else if (wrapOnSpace) {
                    const newLine = truncateLine(line, measurer, maxWidth(), true);
                    if (newLine) {
                        result.push(newLine);
                    }
                }

                if (wrapOnSpace) {
                    line = '';
                    break;
                }

                const postfix = wrapHyphenate ? '-' : '';
                let newLine = line.slice(0, charOffset).trim();
                const g = graphemeSegments(newLine);
                while (g.length && measurer.textWidth(newLine + postfix) > maxWidth()) {
                    g.pop();
                    while (g.length && g.at(-1)!.trim() === '') {
                        g.pop();
                    }
                    newLine = g.join('');
                }

                if (newLine && newLine !== TrimEdgeGuard) {
                    result.push(preserveArabicJoining(newLine) + postfix);
                } else {
                    if (!preserveText) {
                        line = '';
                    }
                    break;
                }

                resumeAfterBreak(newLine.length);
                continue;
            }

            charOffset += char.length;
            i++;
        }

        if (line) {
            result.push(line);
        }
    }

    avoidOrphans(result, measurer, options);
    const clippedResult = clipLines(result, measurer, options);
    return shouldHideOverflow(clippedResult, options) ? [] : clippedResult;
}

function getWordAt(text: string, position: number) {
    const nextSpaceIndex = text.indexOf(' ', position);
    return nextSpaceIndex === -1 ? text.slice(position) : text.slice(position, nextSpaceIndex);
}

export function clipLines(lines: string[], measurer: ITextMeasurer, options: WrapOptions) {
    if (!isFiniteNumber(options.maxHeight)) {
        return lines;
    }

    const { height, lineMetrics } = measurer.measureLines(lines);

    if (height <= options.maxHeight) {
        return lines;
    }

    for (let i = 0, cumulativeHeight = 0; i < lineMetrics.length; i++) {
        const lineTop = cumulativeHeight;
        cumulativeHeight += lineMetrics[i].height;
        if (cumulativeHeight > options.maxHeight) {
            if (options.overflow === 'hide' || i === 0) return [];
            const clippedResults = lines.slice(0, i);
            const lastLine = clippedResults.pop()!;
            const last = lineMetrics[i - 1];
            const maxWidth = lineMaxWidth(options, lineTop - last.height, lineTop);
            return clippedResults.concat(
                isTextTruncated(lastLine) ? lastLine : truncateLine(lastLine, measurer, maxWidth, true)
            );
        }
    }

    return lines;
}

function lastLineMaxWidth(lines: string[], measurer: ITextMeasurer, options: WrapOptions) {
    const { lineMetrics } = measurer.measureLines(lines);
    let top = 0;
    for (let i = 0; i < lineMetrics.length - 1; i += 1) {
        top += lineMetrics[i].height;
    }
    return lineMaxWidth(options, top, top + lineMetrics.at(-1)!.height);
}

function avoidOrphans(lines: string[], measurer: ITextMeasurer, options: WrapOptions) {
    if (options.avoidOrphans === false || lines.length < 2) return;

    const { length } = lines;
    const lastLine = lines[length - 1];
    const beforeLast = lines[length - 2];

    if (graphemeSegments(beforeLast).length < graphemeSegments(lastLine).length) return;

    const lastSpaceIndex = beforeLast.lastIndexOf(' ');
    // If the last line has an orphan, and the previous line has more than one space
    if (lastSpaceIndex === -1 || lastSpaceIndex === beforeLast.indexOf(' ') || lastLine.includes(' ')) return;

    const lastWord = beforeLast.slice(lastSpaceIndex + 1);
    const maxWidth = options.maxWidthAt == null ? options.maxWidth : lastLineMaxWidth(lines, measurer, options);
    if (measurer.textWidth(lastLine + lastWord) <= maxWidth) {
        lines[length - 2] = beforeLast.slice(0, lastSpaceIndex);
        lines[length - 1] = lastWord + ' ' + lastLine;
    }
}

interface SegmentGroup {
    /** Leading block-image strip for the row. Multiple images render side-by-side at the left. */
    blockImages: ImageSegment[];
    segments: NormalisedContentSegment[];
}

function splitIntoBlockGroups(textSegments: NormalisedContentSegment[]): SegmentGroup[] {
    const groups: SegmentGroup[] = [];
    let current: SegmentGroup | null = null;
    for (let i = 0; i < textSegments.length; i++) {
        const seg = textSegments[i];
        if (isBlockBoundary(textSegments, i)) {
            // Consecutive block images belong to the same leading strip; otherwise a new row opens.
            const extendsStrip =
                i > 0 && textSegments[i - 1].type === 'image' && (textSegments[i - 1] as ImageSegment).block === true;
            if (extendsStrip && current) {
                current.blockImages.push(seg as ImageSegment);
            } else {
                if (current) groups.push(current);
                current = { blockImages: [seg as ImageSegment], segments: [] };
            }
        } else {
            current ??= { blockImages: [], segments: [] };
            current.segments.push(seg);
        }
    }
    if (current) groups.push(current);
    return groups;
}

export function wrapTextSegments(textSegments: NormalisedContentSegment[], options: WrapOptions): MeasuredSegment[] {
    const groups = splitIntoBlockGroups(textSegments);
    if (groups.length === 0) return [];

    // Fast path: single inline group with no images.
    if (
        groups.length === 1 &&
        groups[0].blockImages.length === 0 &&
        !groups[0].segments.some((s) => s.type === 'image')
    ) {
        return fitMeasuredSegments(groups[0].segments, options);
    }

    let remainingMaxHeight = options.maxHeight ?? Infinity;
    const result: MeasuredSegment[] = [];

    for (const group of groups) {
        if (remainingMaxHeight <= 0) break;
        const groupOptions = Number.isFinite(remainingMaxHeight)
            ? { ...options, maxHeight: remainingMaxHeight }
            : options;
        const groupResult = wrapGroup(group, groupOptions);
        if (groupResult.length === 0) continue;

        result.push(...groupResult);

        if (Number.isFinite(remainingMaxHeight)) {
            remainingMaxHeight -= measureTextSegments(groupResult, options.font).height;
        }
    }

    return result;
}

function wrapGroup(group: SegmentGroup, options: WrapOptions): MeasuredSegment[] {
    if (group.blockImages.length === 0) {
        return wrapInlineSegments(group.segments, options);
    }
    return wrapBlockGroup(group.blockImages, group.segments, options);
}

function wrapInlineSegments(segments: NormalisedContentSegment[], options: WrapOptions): MeasuredSegment[] {
    if (segments.length === 0) return [];
    if (!segments.some((s) => s.type === 'image')) {
        return fitMeasuredSegments(segments, options);
    }
    return wrapInlineSegmentsWithOverflow(segments, options);
}

function wrapInlineSegmentsWithOverflow(segments: NormalisedContentSegment[], options: WrapOptions): MeasuredSegment[] {
    const maxHeight = options.maxHeight ?? Infinity;
    // Drop any image that exceeds the width or height budget on its own; no strategy can keep it.
    // Build a single working array we mutate in place to avoid allocating a fresh array per drop.
    const working: NormalisedContentSegment[] = [];
    for (const s of segments) {
        if (s.type === 'image') {
            const box = imageSegmentBox(s);
            if (box.width > options.maxWidth || box.height > maxHeight) continue;
        }
        working.push(s);
    }

    let result = fitMeasuredSegments(working, options);
    // 'hide' images yield to text first.
    result = dropUntilFits(working, options, result, () => dropLastMatching(working, isImageWithStrategy('hide')));
    // 'keep' images take priority over text: drop trailing text rightmost-first.
    result = dropUntilFits(working, options, result, () => {
        return hasImageWithStrategy(working, 'keep') && dropLastMatching(working, isText);
    });
    // Last resort: drop 'keep' images that still can't fit alongside anything.
    result = dropUntilFits(working, options, result, () => dropLastMatching(working, isImageWithStrategy('keep')));
    return result;
}

// Re-fit after each successful drop until either everything fits or `drop` has nothing left to
// remove. `drop` mutates `working` in place and returns whether it removed a segment.
function dropUntilFits(
    working: NormalisedContentSegment[],
    options: WrapOptions,
    result: MeasuredSegment[],
    drop: () => boolean
): MeasuredSegment[] {
    while (!resultFitsAllSegments(working, result) && drop()) {
        result = fitMeasuredSegments(working, options);
    }
    return result;
}

function wrapBlockGroup(
    blockImages: ImageSegment[],
    segments: NormalisedContentSegment[],
    options: WrapOptions
): MeasuredSegment[] {
    const maxHeight = options.maxHeight ?? Infinity;

    const strip = buildBlockStrip(blockImages, options);
    if (strip.length === 0) {
        // No images survived — re-wrap text full-width as if no block strip was requested.
        return wrapInlineSegments(segments, options);
    }

    // The text column is `keep` only when every surviving image is `keep` — otherwise text
    // truncation is allowed (the looser of the strategies governs the column).
    const allKeep = strip.every((img) => (img.overflowStrategy ?? 'hide') === 'keep');
    const stripWidth = blockStripWidth(strip);

    if (segments.length === 0) {
        return strip;
    }

    const innerMaxWidth = options.maxWidth - stripWidth - BLOCK_IMAGE_SPACING;
    if (innerMaxWidth <= 0) {
        // No room for a text column to the right. Under 'hide' prefer dropping the strip so text
        // gets the full width; under 'keep' preserve the strip alone.
        return allKeep ? strip : wrapInlineSegments(segments, options);
    }

    // Row height is max(stripHeight, textColumnHeight); strip images are already filtered to maxHeight.
    const innerOptions = { ...options, maxWidth: innerMaxWidth, maxHeight: Math.max(0, maxHeight) };
    const innerResult = wrapBlockTextColumn(segments, innerOptions, allKeep);

    // A sub-character `innerMaxWidth` can emit an orphan wider than the column, pushing the strip past the tile edge.
    if (
        !preservesText(options) &&
        innerResult.length > 0 &&
        measureTextSegments(innerResult, options.font).width > innerMaxWidth
    ) {
        return strip;
    }
    return [...strip, ...innerResult];
}

// Drops block-leading images right-to-left ('hide' first, then 'keep') until the strip fits `maxWidth`.
function buildBlockStrip(blockImages: ImageSegment[], options: WrapOptions): MeasuredImageSegment[] {
    const maxHeight = options.maxHeight ?? Infinity;
    const strip: MeasuredImageSegment[] = [];
    for (const img of blockImages) {
        const textMetrics = imageSegmentBox(img);
        if (textMetrics.width > options.maxWidth || textMetrics.height > maxHeight) continue;
        strip.push({ ...img, textMetrics });
    }

    const stripFitsWidth = () => blockStripWidth(strip) <= options.maxWidth;
    while (!stripFitsWidth() && dropLastMatching(strip, isImageWithStrategy('hide'))) {
        // keep dropping 'hide' images until the strip fits
    }
    while (!stripFitsWidth() && dropLastMatching(strip, isImageWithStrategy('keep'))) {
        // last-resort: drop 'keep' images
    }
    return strip;
}

// Wraps the column right of a block-image strip: 'hide' may truncate, all-'keep' drops trailing text instead.
function wrapBlockTextColumn(
    segments: NormalisedContentSegment[],
    innerOptions: WrapOptions,
    allKeep: boolean
): MeasuredSegment[] {
    if (!allKeep) {
        return wrapInlineSegments(segments, innerOptions);
    }
    const working = segments.slice();
    let result = wrapInlineSegments(working, innerOptions);
    while ((hasTruncatedText(result) || lostTextSegments(working, result)) && dropLastMatching(working, isText)) {
        result = wrapInlineSegments(working, innerOptions);
    }
    return result;
}

// Remove the last item matching `predicate` (right-to-left), mutating `arr` in place. Returns
// whether an item was removed.
function dropLastMatching<T>(arr: T[], predicate: (item: T) => boolean): boolean {
    for (let i = arr.length - 1; i >= 0; i--) {
        if (predicate(arr[i])) {
            arr.splice(i, 1);
            return true;
        }
    }
    return false;
}

const isText = (s: NormalisedContentSegment): boolean => s.type !== 'image';

function isImageWithStrategy(strategy: 'hide' | 'keep') {
    return (s: NormalisedContentSegment): boolean => s.type === 'image' && (s.overflowStrategy ?? 'hide') === strategy;
}

function resultFitsAllSegments(input: NormalisedContentSegment[], output: MeasuredSegment[]): boolean {
    // Result is "fit" when no text segment was ellipsis-truncated AND every image in input
    // is present in the output.
    if (hasTruncatedText(output)) return false;
    const inputImageCount = input.reduce((n, s) => n + (s.type === 'image' ? 1 : 0), 0);
    const outputImageCount = output.reduce((n, s) => n + (s.type === 'image' ? 1 : 0), 0);
    return outputImageCount >= inputImageCount;
}

function hasTruncatedText(output: MeasuredSegment[]): boolean {
    return output.some((s) => s.type !== 'image' && isTextTruncated(s.text));
}

function lostTextSegments(input: NormalisedContentSegment[], output: MeasuredSegment[]): boolean {
    const inputText = input.reduce((n, s) => (s.type === 'image' ? n : n + 1), 0);
    const outputText = output.reduce((n, s) => (s.type === 'image' ? n : n + 1), 0);
    return outputText < inputText;
}

function hasImageWithStrategy(segments: NormalisedContentSegment[], strategy: 'hide' | 'keep'): boolean {
    return segments.some(isImageWithStrategy(strategy));
}

function fitMeasuredSegments(textSegments: NormalisedContentSegment[], options: WrapOptions): MeasuredSegment[] {
    const { maxHeight = Infinity } = options;
    const preserveText = preservesText(options);
    const result: MeasuredSegment[] = [];

    let lineWidth = 0;
    let totalHeight = 0;
    // The band the line being built occupies: the segment path already tracks its own vertical offset,
    // so mixed line heights need no extra bookkeeping to ask the shape for that line's width.
    const maxWidth = (height = 0) => lineMaxWidth(options, totalHeight, totalHeight + height);

    function truncateLastSegment() {
        const lastSegment = result.pop();
        if (!lastSegment) return;
        // Images cannot be truncated with an ellipsis; drop them entirely.
        if (lastSegment.type === 'image') return;
        const measurer = cachedTextMeasurer(lastSegment);
        const truncatedText = truncateLine(lastSegment.text, measurer, maxWidth(), true);
        const textMetrics = measurer.measureText(truncatedText);
        result.push({ ...lastSegment, text: truncatedText, textMetrics });
    }

    // Wrap a text segment that overflows the current line into sub-segments, advancing
    // lineWidth/totalHeight. Returns true when the label is full and the line should stop.
    function wrapOverflowingTextSegment(segment: MeasuredTextSegment): boolean {
        const measurer = cachedTextMeasurer(segment);
        const guardedText = guardTextEdges(segment.text);
        const wrapOptions = { ...options, font: segment, maxHeight: maxHeight - totalHeight };

        let wrappedLines = textWrap(guardedText, { ...wrapOptions, overflow: 'hide' }, lineWidth, totalHeight);
        if (wrappedLines.length === 0) {
            if (options.textWrap === 'never') {
                wrappedLines = textWrap(guardedText, wrapOptions, lineWidth, totalHeight);
            } else {
                wrappedLines = textWrap(guardedText, wrapOptions, 0, totalHeight);
                const lastSegment = result.at(-1);
                if (lastSegment && lastSegment.type !== 'image') {
                    lastSegment.text += '\n';
                    lineWidth = 0;
                }
            }
        }

        if (wrappedLines.length === 0) {
            truncateLastSegment();
            return true;
        }

        // Under 'preserve' a trailing ellipsis can only be the author's own text ("Loading…"), so acting
        // on it here would drop the lines and segments that follow it.
        const truncationIndex = preserveText ? -1 : wrappedLines.findIndex(isTextTruncated);
        if (truncationIndex !== -1) {
            wrappedLines = wrappedLines.slice(0, truncationIndex + 1);
        }

        // A text segment's edge whitespace is the gap to an adjacent image (e.g. flag then " Germany ").
        // A wrap break can trim it, so restore it onto the first/last content line of the output.
        const leadingWs = segment.text.slice(0, segment.text.length - segment.text.trimStart().length);
        const trailingWs = segment.text.slice(segment.text.trimEnd().length);
        const cleanLines = wrappedLines.map(unguardTextEdges);
        const firstContentIndex = cleanLines.findIndex((line) => line.trim() !== '');
        const lastContentIndex = cleanLines.findLastIndex((line) => line.trim() !== '');

        const lastIndex = cleanLines.length - 1;
        for (let i = 0; i < cleanLines.length; i++) {
            let cleanLine = cleanLines[i];
            if (leadingWs && i === firstContentIndex) {
                cleanLine = leadingWs + cleanLine.trimStart();
            }
            if (trailingWs && i === lastContentIndex) {
                cleanLine = cleanLine.trimEnd() + trailingWs;
            }
            const textMetrics = measurer.measureText(cleanLine);
            const subSegment = { ...segment, text: cleanLine, textMetrics };
            if (i === lastIndex) {
                lineWidth += textMetrics.width;
            } else {
                subSegment.text += '\n';
                lineWidth = 0;
            }
            totalHeight += textMetrics.height;
            result.push(subSegment);
        }

        return truncationIndex !== -1;
    }

    let isFirstLine = true;
    for (const { width, height, segments } of measureTextSegments(textSegments, options.font).lineMetrics) {
        if (!isFirstLine) {
            appendLineBreak(result, options.font);
            lineWidth = 0;
        }
        isFirstLine = false;

        if (totalHeight + height > maxHeight) {
            if (result.length) {
                truncateLastSegment();
            }
            break;
        }

        if (lineWidth + width <= maxWidth(height)) {
            lineWidth += width;
            totalHeight += height;
            result.push(...segments);
            continue;
        }

        // Only the image-wrap path below leaves a line unaccounted for in totalHeight.
        let lineHeight = 0;
        for (const segment of segments) {
            if (lineWidth + segment.textMetrics.width <= maxWidth(segment.textMetrics.height)) {
                lineWidth += segment.textMetrics.width;
                lineHeight = Math.max(lineHeight, segment.textMetrics.height);
                result.push(segment);
                continue;
            }

            if (segment.type === 'image') {
                const imageWidth = segment.textMetrics.width;
                const imageHeight = segment.textMetrics.height;
                // Wrap the overflowing image to its own line rather than drop it (keeps width-shrinking
                // monotonic). The text line it leaves behind must also fit, so count it under maxHeight.
                if (
                    options.textWrap !== 'never' &&
                    lineWidth > 0 &&
                    imageWidth <= maxWidth(imageHeight) &&
                    totalHeight + lineHeight + imageHeight <= maxHeight
                ) {
                    appendLineBreak(result, options.font);
                    lineWidth = imageWidth;
                    totalHeight += lineHeight + imageHeight;
                    lineHeight = 0;
                    result.push(segment);
                    continue;
                }

                if (preserveText) {
                    lineWidth += imageWidth;
                    lineHeight = Math.max(lineHeight, imageHeight);
                    result.push(segment);
                    continue;
                }

                // No line to wrap to and images can't be subdivided, so stop fitting. The caller
                // (wrapInlineSegmentsWithOverflow) handles overflow-strategy-based dropping.
                truncateLastSegment();
                return result;
            }

            if (wrapOverflowingTextSegment(segment)) break;
            lineHeight = 0;
        }
    }

    return result;
}

// The renderer only reads a trailing \n on a text segment, so a break after an image needs a synthetic one.
function appendLineBreak(result: MeasuredSegment[], font: FontOptions): void {
    const last = result.at(-1);
    if (last && last.type !== 'image') {
        last.text += '\n';
    } else if (last) {
        const measurer = cachedTextMeasurer(font);
        result.push({ ...font, text: '\n', textMetrics: measurer.measureText('') });
    }
}
