import type { PaddingOptions } from 'ag-charts-types';

import { measureTextSegments } from '../../rendering/textMeasurer';
import type { NormalisedTextOrSegments } from '../../types/normalised-options/normalisedCommonOptions';
import type { FontOptions } from '../../types/text';
import type { LabelFit, MeasuredLabel } from '../geometry/labelPlacement';
import { isArray } from '../types/typeGuards';
import { fitLabelText } from './textWrapper';

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
}

/** A fit can bound the text away to nothing, which the placement engine treats as no label at all. */
function isErased(text: NormalisedTextOrSegments): boolean {
    return isArray(text) ? text.length === 0 : String(text).length === 0;
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
