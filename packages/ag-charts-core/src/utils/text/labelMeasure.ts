import type { PaddingOptions } from 'ag-charts-types';

import { measureTextSegments } from '../../rendering/textMeasurer';
import type { NormalisedTextOrSegments } from '../../types/normalised-options/normalisedCommonOptions';
import type { FontOptions } from '../../types/text';
import type { LabelFit, LabelFitDescriptor, MeasuredLabel } from '../geometry/labelPlacement';
import { isArray } from '../types/typeGuards';
import { fitLabelTextOrOverflow } from './textWrapper';

/** Per-render measurement inputs a placed-label series caches once and reuses for every datum. */
export interface LabelMeasureContext {
    readonly labelPadding: Required<PaddingOptions>;
    readonly labelTextMeasurer: { measureLines: (text: string) => { width: number; height: number } };
    readonly labelFit: LabelFit | undefined;
    /**
     * Policy without the series' implicit container, applied when {@link labelFit} leaves nothing to draw.
     * Set only when the label must survive that, so leaving it unset keeps an erased label erased.
     */
    readonly labelFitOverflow?: LabelFit;
    /**
     * The label's geometry is resolved per candidate placement by an `itemStyler`, so each datum carries
     * the inputs the engine re-measures with rather than relying on the up-front measurement below.
     */
    readonly labelStyled?: boolean;
}

/**
 * Per-candidate fit inputs for a point label: the placement engine re-fits its text under the font the
 * styler resolves at each candidate, and to the room each candidate leaves once obstacles have taken
 * their share. `policy` is overridden by series that bound the text per datum (a marker container scaled
 * by that datum's size). `undefined` for an absent label, or for one whose fit policy leaves nothing to
 * adapt, leaving the up-front {@link measurePlacedLabel} measurement authoritative.
 */
export function labelFitDescriptor(
    labelText: NormalisedTextOrSegments | undefined,
    font: FontOptions,
    ctx: LabelMeasureContext,
    policy = ctx.labelFit
): LabelFitDescriptor | undefined {
    if (labelText == null || (!ctx.labelStyled && policy == null)) return undefined;
    return {
        text: labelText,
        policy: policy ?? {},
        font,
        boxPadding: ctx.labelPadding,
        fitOverflow: ctx.labelFitOverflow,
        // A point label's region is the plotting area, which contains it rather than truncating it: the
        // descriptor is here to re-measure under the styled font, not to introduce a new bound.
        boundByRegion: false,
    };
}

/** Fits `labelText` to the label's policy and measures it, inflated by the label's drawn box padding. */
export function measurePlacedLabel(
    labelText: NormalisedTextOrSegments | undefined,
    font: FontOptions,
    ctx: LabelMeasureContext
): MeasuredLabel {
    if (labelText == null) {
        return { text: '', width: 0, height: 0 };
    }
    const fittedText = fitLabelTextOrOverflow(labelText, ctx.labelFit, ctx.labelFitOverflow, font);
    let { width, height } = isArray(fittedText)
        ? measureTextSegments(fittedText, font)
        : ctx.labelTextMeasurer.measureLines(String(fittedText));
    width += ctx.labelPadding.left + ctx.labelPadding.right;
    height += ctx.labelPadding.top + ctx.labelPadding.bottom;
    return { text: fittedText, width, height };
}
