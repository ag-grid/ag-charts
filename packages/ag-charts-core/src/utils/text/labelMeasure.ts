import type { PaddingOptions } from 'ag-charts-types';

import type { NormalisedTextOrSegments } from '../../types/normalised-options/normalisedCommonOptions';
import type { FontOptions } from '../../types/text';
import {
    type LabelFit,
    type LabelFitDescriptor,
    type MeasuredLabel,
    measureLabelText,
} from '../geometry/labelPlacement';
import { isArray } from '../types/typeGuards';
import { fitLabelTextOrOverflowAutoSize, fontWithSize } from './textWrapper';

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
 * Per-candidate fit inputs, so the placement engine re-fits a label's text at each candidate rather than
 * reusing the up-front {@link measurePlacedLabel} measurement, and to the room each candidate leaves once
 * obstacles have taken their share. Produced for a label whose font varies per candidate (one an
 * `itemStyler` restyles) or whose text can adapt to the room it has. `policy` is overridden by series that
 * bound the text per datum (a marker container scaled by that datum's size).
 */
export function placedLabelFit(
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

/**
 * Fits `labelText` to the label's policy and measures it, inflated by the label's drawn box padding.
 * `policy` is overridden by series that bound the text per datum, as for {@link placedLabelFit}.
 */
export function measurePlacedLabel(
    labelText: NormalisedTextOrSegments | undefined,
    font: FontOptions,
    ctx: LabelMeasureContext,
    policy = ctx.labelFit
): MeasuredLabel {
    if (labelText == null) {
        return { text: '', width: 0, height: 0 };
    }
    const { text, fontSize } = fitLabelTextOrOverflowAutoSize(labelText, policy, ctx.labelFitOverflow, font);
    // The context's measurer is bound to the configured font, so a shrunken label measures on its own.
    let { width, height } =
        fontSize == null && !isArray(text)
            ? ctx.labelTextMeasurer.measureLines(String(text))
            : measureLabelText(text, fontWithSize(font, fontSize));
    width += ctx.labelPadding.left + ctx.labelPadding.right;
    height += ctx.labelPadding.top + ctx.labelPadding.bottom;
    return { text, width, height, fontSize };
}
