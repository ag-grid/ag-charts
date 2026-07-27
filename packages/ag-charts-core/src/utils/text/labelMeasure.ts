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
    const fittedText = fitLabelText(labelText, ctx.labelFit, font);
    let { width, height } = isArray(fittedText)
        ? measureTextSegments(fittedText, font)
        : ctx.labelTextMeasurer.measureLines(String(fittedText));
    width += ctx.labelPadding.left + ctx.labelPadding.right;
    height += ctx.labelPadding.top + ctx.labelPadding.bottom;
    return { text: fittedText, width, height };
}
