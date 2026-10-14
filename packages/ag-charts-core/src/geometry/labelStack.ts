import type { PaddingOptions } from 'ag-charts-types';

import { isArray } from '../data/typeGuards';
import type { NormalisedTextOrSegments } from '../options/normalised/normalisedCommonOptions';
import { cachedTextMeasurer, measureLabelText } from '../rendering/textMeasurer';
import {
    type LabelFit,
    type RegionAlign,
    findLargestFittingStep,
    fitLabelText,
    fontWithSize,
    hasRealChars,
    isErased,
    keptCharacters,
    resolveMinimumFontSize,
} from '../text/textWrapper';
import type { FontOptions } from '../types/text';
import { type FitRegion, regionWidthAt } from './fitRegion';

/** What a block is fitted with; a label's fit descriptor already carries it. */
export interface LabelStackBlockFit {
    readonly text: NormalisedTextOrSegments;
    readonly policy: LabelFit;
    readonly font: FontOptions;
    /** Per-side extent of the drawn box around the glyph. */
    readonly boxPadding?: Required<PaddingOptions>;
    /** Applied at the minimum size when {@link policy} leaves nothing to draw, so the block overruns its room. */
    readonly fitOverflow?: LabelFit;
}

/** One block of a {@link LabelStack}: its own text, font, drawn box and fit policy. */
export interface LabelStackBlock {
    readonly fit: LabelStackBlockFit;
    /** Dropped, last first, when the stack cannot hold it whole; the stack is never left empty. */
    readonly optional?: boolean;
}

/**
 * Several labels drawn one above the other and fitted as one: their sizes shrink together, so no block
 * keeps its full size while another is reduced to its minimum.
 */
export interface LabelStack {
    readonly blocks: readonly LabelStackBlock[];
    /** Vertical gap between consecutive blocks. */
    readonly spacing: number;
}

/** A block as fitted: `width`/`height` are its glyph, without the drawn box around it. */
export interface FittedLabelBlock {
    readonly text: NormalisedTextOrSegments;
    readonly width: number;
    readonly height: number;
    readonly fontSize: number;
}

export interface FittedLabelStack {
    /** Index-parallel with {@link LabelStack.blocks}; a block dropped to make the rest fit is `undefined`. */
    readonly blocks: readonly (FittedLabelBlock | undefined)[];
    /** Drawn extent of the whole stack: the widest block's box, and every box plus the gaps between them. */
    readonly width: number;
    readonly height: number;
    /** Characters truncation removed, including those of dropped blocks. */
    readonly dropped: number;
    /** How much of the stack's unfitted area the fit gave up, in `[0, 1)`. */
    readonly shrink: number;
}

const ZERO_PADDING: Required<PaddingOptions> = { top: 0, right: 0, bottom: 0, left: 0 };

/** Keeps any amount of shrinking cheaper than losing a character when candidates are ranked. */
const MAX_SHRINK = 0.999;

interface StackFit {
    readonly blocks: (FittedLabelBlock | undefined)[];
    readonly width: number;
    readonly height: number;
    readonly dropped: number;
    /** Total glyph area of the fitted blocks. */
    readonly area: number;
    /** A block that must always show was drawn overrunning its room. */
    readonly overflows: boolean;
}

type Container = { readonly width: number; readonly height: number } | undefined;

/**
 * Fits a stack within `container`, narrowed by `shape` when set: blocks shrink together, truncate only at
 * their minimum, then optional blocks drop last first. `undefined` when no block can be held.
 */
export function fitLabelStack(
    stack: LabelStack,
    container: Container,
    shape?: FitRegion,
    shapeAlign: RegionAlign = 'center'
): FittedLabelStack | undefined {
    const included = stack.blocks.map((_, index) => index);
    for (;;) {
        const fitted = fitStackBlocks(stack, included, container, shape, shapeAlign);
        if (fitted != null) return fitted;
        if (included.length <= 1) return undefined;
        const droppable = included.findLastIndex((index) => stack.blocks[index].optional === true);
        if (droppable < 0) return undefined;
        included.splice(droppable, 1);
    }
}

function fitStackBlocks(
    stack: LabelStack,
    included: readonly number[],
    container: Container,
    shape: FitRegion | undefined,
    shapeAlign: RegionAlign
): FittedLabelStack | undefined {
    const ladder = stackLadder(stack.blocks, included);
    let fullArea = 0;
    for (const index of included) {
        const { text, font } = stack.blocks[index].fit;
        const full = measureLabelText(text, font);
        fullArea += full.width * full.height;
    }
    return findLargestFittingStep(ladder.length, function probeStackStep(step) {
        const fitted = fitStackAtSizes(stack, included, ladder[step], step === 0, container, shape, shapeAlign);
        if (fitted == null) return undefined;
        const shrink = fullArea <= 0 ? 0 : Math.min(Math.max(0, 1 - fitted.area / fullArea), MAX_SHRINK);
        return { blocks: fitted.blocks, width: fitted.width, height: fitted.height, dropped: fitted.dropped, shrink };
    });
}

/** Block sizes per step, smallest first; each step shrinks the block proportionally furthest from its minimum. */
function stackLadder(blocks: readonly LabelStackBlock[], included: readonly number[]): number[][] {
    const sizes: number[] = [];
    const floors: number[] = [];
    const ranges: number[] = [];
    for (const index of included) {
        const { font, policy } = blocks[index].fit;
        const floor = resolveMinimumFontSize(policy.minimumFontSize, font.fontSize);
        sizes.push(font.fontSize);
        floors.push(floor);
        ranges.push(font.fontSize - floor);
    }
    const ladder = [sizes.slice()];
    for (;;) {
        let next = -1;
        let nextProgress = -Infinity;
        for (let i = 0; i < sizes.length; i++) {
            if (ranges[i] <= 0 || sizes[i] <= floors[i]) continue;
            const progress = (sizes[i] - floors[i]) / ranges[i];
            if (progress > nextProgress) {
                next = i;
                nextProgress = progress;
            }
        }
        if (next < 0) break;
        sizes[next] = Math.max(floors[next], sizes[next] - 1);
        ladder.push(sizes.slice());
    }
    return ladder.reverse();
}

function fitStackAtSizes(
    stack: LabelStack,
    included: readonly number[],
    sizes: readonly number[],
    atFloor: boolean,
    container: Container,
    shape: FitRegion | undefined,
    shapeAlign: RegionAlign
): StackFit | undefined {
    const { blocks, spacing } = stack;
    const maxHeight = container?.height ?? Infinity;
    let maxWidth = container?.width ?? Infinity;
    if (shape != null) {
        let estimate = spacing * (included.length - 1);
        for (let i = 0; i < included.length; i++) {
            const { fit } = blocks[included[i]];
            const lineHeight =
                fit.policy.lineHeight ?? cachedTextMeasurer(fontWithSize(fit.font, sizes[i])).lineHeight();
            estimate += lineHeight + boxHeight(fit.boxPadding);
        }
        maxWidth = Math.min(maxWidth, shapeWidthAt(shape, shapeAlign, estimate));
    }
    const fitted = fitBlocksToWidth(stack, included, sizes, atFloor, maxWidth, maxHeight);
    // An overflowing block already overruns its room, so the shape cannot bound it.
    if (fitted == null || shape == null || fitted.overflows) return fitted;
    // A wrapped block can make the stack taller than the estimate, and a shape narrower where it ends.
    const width = shapeWidthAt(shape, shapeAlign, fitted.height);
    if (fitted.width <= width) return fitted;
    const refitted = fitBlocksToWidth(stack, included, sizes, atFloor, width, maxHeight);
    if (refitted == null || refitted.overflows) return refitted;
    return refitted.width > shapeWidthAt(shape, shapeAlign, refitted.height) ? undefined : refitted;
}

function fitBlocksToWidth(
    stack: LabelStack,
    included: readonly number[],
    sizes: readonly number[],
    atFloor: boolean,
    maxWidth: number,
    maxHeight: number
): StackFit | undefined {
    const { blocks, spacing } = stack;
    const fitted: (FittedLabelBlock | undefined)[] = blocks.map(() => undefined);
    const gaps = spacing * (included.length - 1);
    let remaining = maxHeight - gaps;
    let width = 0;
    let height = gaps;
    let dropped = 0;
    let area = 0;
    let anyOverflows = false;
    for (let i = 0; i < included.length; i++) {
        const block = blocks[included[i]];
        const { fit } = block;
        const { policy, text } = fit;
        const padding = fit.boxPadding ?? ZERO_PADDING;
        const font = fontWithSize(fit.font, sizes[i]);
        const glyphWidth = Math.min(policy.maxWidth ?? Infinity, maxWidth - boxWidth(padding));
        const glyphHeight = Math.min(policy.maxHeight ?? Infinity, remaining - boxHeight(padding));
        // Truncating is the last resort, once every block is at its minimum size.
        const overflowStrategy = atFloor ? policy.overflowStrategy : 'hide';
        const blockFit: LabelFit = {
            maxWidth: Math.max(0, glyphWidth),
            maxHeight: Math.max(0, glyphHeight),
            wrapping: policy.wrapping,
            overflowStrategy,
            lineHeight: policy.lineHeight,
        };
        let fittedText = glyphWidth <= 0 || glyphHeight <= 0 ? '' : fitLabelText(text, blockFit, font);
        // A bare ellipsis reads as an artefact rather than a label.
        if (!showsContent(fittedText) && keptCharacters(text) > 0) fittedText = '';
        const { fitOverflow } = fit;
        const overflows = isErased(fittedText) && atFloor && fitOverflow != null;
        if (overflows) {
            // A block that must always show overruns its room at its smallest size rather than vanishing.
            const overflowWidth = Math.min(fitOverflow.maxWidth ?? Infinity, glyphWidth > 0 ? glyphWidth : Infinity);
            fittedText = fitLabelText(text, { ...fitOverflow, maxWidth: overflowWidth }, font);
            // A word too long to wrap into the room is kept whole rather than lost.
            if (isErased(fittedText)) fittedText = fitLabelText(text, fitOverflow, font);
        }
        if (isErased(fittedText)) return undefined;
        const size = measureLabelText(fittedText, font);
        // Text that is preserved rather than truncated may overrun its room, which only the floor accepts.
        const overruns = size.width > glyphWidth || size.height > glyphHeight;
        if (!overflows && overflowStrategy != null && overruns) return undefined;
        fitted[included[i]] = { text: fittedText, width: size.width, height: size.height, fontSize: font.fontSize };
        const blockHeight = size.height + boxHeight(padding);
        remaining -= blockHeight;
        height += blockHeight;
        width = Math.max(width, size.width + boxWidth(padding));
        dropped += keptCharacters(text) - keptCharacters(fittedText);
        area += size.width * size.height;
        anyOverflows ||= overflows || overruns;
    }
    for (let index = 0; index < blocks.length; index++) {
        if (fitted[index] == null) dropped += keptCharacters(blocks[index].fit.text);
    }
    return { blocks: fitted, width, height, dropped: Math.max(0, dropped), area, overflows: anyOverflows };
}

function showsContent(text: NormalisedTextOrSegments): boolean {
    return hasRealChars(text) || (isArray(text) && text.some((segment) => segment.type === 'image'));
}

function shapeWidthAt(shape: FitRegion, align: RegionAlign, height: number): number {
    let top: number;
    if (align === 'start') {
        top = 0;
    } else if (align === 'end') {
        top = -height;
    } else {
        top = -height / 2;
    }
    return regionWidthAt(shape, top, top + height);
}

function boxWidth(padding: Required<PaddingOptions> | undefined) {
    return padding == null ? 0 : padding.left + padding.right;
}

function boxHeight(padding: Required<PaddingOptions> | undefined) {
    return padding == null ? 0 : padding.top + padding.bottom;
}
