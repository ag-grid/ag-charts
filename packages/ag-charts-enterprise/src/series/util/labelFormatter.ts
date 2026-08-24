import {
    type FontOptions,
    type NormalisedContentSegment,
    type NormalisedTextOrSegments,
    cachedTextMeasurer,
    findLargestFittingFontSize,
    findLargestFittingStep,
    isArray,
    measureTextSegments,
    resolveMinimumFontSize,
    wrapLines,
    wrapTextSegments,
} from 'ag-charts-core';
import type {
    AgChartAutoSizedBaseLabelOptions,
    AgChartAutoSizedLabelOptions,
    AgChartAutoSizedSecondaryLabelOptions,
    FontSize,
    OverflowStrategy,
    TextWrap,
} from 'ag-charts-types';

interface AutoSizedBaseLabelOptions extends AgChartAutoSizedBaseLabelOptions<unknown, any> {
    fontSize: FontSize;
}

interface AutoSizedLabelOptions extends AgChartAutoSizedLabelOptions<unknown, any> {
    fontSize: FontSize;
}

interface AutoSizedSecondaryLabelOptions extends AgChartAutoSizedSecondaryLabelOptions<unknown, any> {
    fontSize: FontSize;
}

type FontSizeCandidate = {
    labelFontSize: number;
    secondaryLabelFontSize: number;
};

export function generateLabelSecondaryLabelFontSizeCandidates(
    label: AutoSizedBaseLabelOptions,
    secondaryLabel: AutoSizedBaseLabelOptions
): FontSizeCandidate[] {
    const { fontSize: labelFontSize } = label;
    const { fontSize: secondaryLabelFontSize } = secondaryLabel;
    const labelMinimumFontSize = resolveMinimumFontSize(label.minimumFontSize, labelFontSize);
    const secondaryLabelMinimumFontSize = resolveMinimumFontSize(
        secondaryLabel.minimumFontSize,
        secondaryLabelFontSize
    );

    const labelTracks = labelFontSize - labelMinimumFontSize;
    const secondaryLabelTracks = secondaryLabelFontSize - secondaryLabelMinimumFontSize;

    let currentLabelFontSize = label.fontSize;
    let currentSecondaryLabelFontSize = secondaryLabel.fontSize;
    const out: FontSizeCandidate[] = [{ labelFontSize, secondaryLabelFontSize }];
    while (
        currentLabelFontSize > labelMinimumFontSize ||
        currentSecondaryLabelFontSize > secondaryLabelMinimumFontSize
    ) {
        const labelProgress = labelTracks > 0 ? (currentLabelFontSize - labelMinimumFontSize) / labelTracks : -1;
        const secondaryLabelProgress =
            secondaryLabelTracks > 0
                ? (currentSecondaryLabelFontSize - secondaryLabelMinimumFontSize) / secondaryLabelTracks
                : -1;

        // Clamped so the last step lands exactly on the minimum, rather than stepping past the smallest permitted size.
        if (labelProgress > secondaryLabelProgress) {
            currentLabelFontSize = Math.max(labelMinimumFontSize, currentLabelFontSize - 1);
        } else {
            currentSecondaryLabelFontSize = Math.max(secondaryLabelMinimumFontSize, currentSecondaryLabelFontSize - 1);
        }

        out.push({
            labelFontSize: currentLabelFontSize,
            secondaryLabelFontSize: currentSecondaryLabelFontSize,
        });
    }

    out.reverse();

    return out;
}

type LayoutParams = {
    padding: number;
};

export type LabelFormatting = {
    text: NormalisedTextOrSegments;
    fontSize: number;
    lineHeight: number;
    width: number;
    height: number;
};

type StackedLabelFormatting<Meta> = {
    width: number;
    height: number;
    meta: Meta;
} & (
    | {
          label: LabelFormatting;
          secondaryLabel: LabelFormatting;
      }
    | {
          label: LabelFormatting;
          secondaryLabel: LabelFormatting | undefined;
      }
    | {
          label: LabelFormatting | undefined;
          secondaryLabel: LabelFormatting;
      }
);

type SizeFittingHeightFn<Meta> = (
    height: number,
    canTruncate: boolean
) => {
    width: number;
    height: number;
    meta: Meta;
};

export function formatStackedLabels<Meta>(
    labelValue: string,
    labelProps: AutoSizedLabelOptions,
    secondaryLabelValue: string,
    secondaryLabelProps: AutoSizedSecondaryLabelOptions,
    { padding }: LayoutParams,
    sizeFittingHeight: SizeFittingHeightFn<Meta>
) {
    const { spacing = 0 } = labelProps;

    const widthAdjust = 2 * padding;
    const heightAdjust = 2 * padding + spacing;

    const fontSizeCandidates = generateLabelSecondaryLabelFontSizeCandidates(labelProps, secondaryLabelProps);
    const smallest = fontSizeCandidates[0];
    const minimumHeight = smallest.labelFontSize + smallest.secondaryLabelFontSize;

    if (minimumHeight > sizeFittingHeight(minimumHeight + heightAdjust, false).height - heightAdjust) return;

    const labelTextSizeProps = {
        fontFamily: labelProps.fontFamily,
        fontStyle: labelProps.fontStyle,
        fontWeight: labelProps.fontWeight,
    };

    const secondaryLabelTextSizeProps = {
        fontFamily: secondaryLabelProps.fontFamily,
        fontStyle: secondaryLabelProps.fontStyle,
        fontWeight: secondaryLabelProps.fontWeight,
    };

    // The font size candidates will repeat some font sizes, so cache the results, so we don't do extra text measuring
    let label: LabelFormatting | undefined;
    let secondaryLabel: LabelFormatting | undefined;

    return findLargestFittingStep<StackedLabelFormatting<Meta>>(fontSizeCandidates.length, (index) => {
        const { labelFontSize, secondaryLabelFontSize } = fontSizeCandidates[index];
        const allowTruncation = index === 0;
        const labelFont = { ...labelTextSizeProps, fontSize: labelFontSize };
        const secondaryLabelFont = { ...secondaryLabelTextSizeProps, fontSize: secondaryLabelFontSize };
        const labelLineHeight = cachedTextMeasurer(labelFont).lineHeight();
        const secondaryLabelLineHeight = cachedTextMeasurer(secondaryLabelFont).lineHeight();
        const sizeFitting = sizeFittingHeight(
            labelLineHeight + secondaryLabelLineHeight + heightAdjust,
            allowTruncation
        );
        const availableWidth = sizeFitting.width - widthAdjust;
        const availableHeight = sizeFitting.height - heightAdjust;

        if (labelLineHeight + secondaryLabelLineHeight > availableHeight) return;

        if (label?.fontSize !== labelFontSize) {
            label = wrapLabel(
                labelProps,
                labelValue,
                availableWidth,
                availableHeight,
                labelFont,
                labelProps.wrapping,
                allowTruncation ? labelProps.overflowStrategy : 'hide'
            );
        }

        if (label == null || label.width > availableWidth || label.height > availableHeight) return;

        if (secondaryLabel?.fontSize !== secondaryLabelFontSize) {
            secondaryLabel = wrapLabel(
                secondaryLabelProps,
                secondaryLabelValue,
                availableWidth,
                availableHeight,
                secondaryLabelFont,
                secondaryLabelProps.wrapping,
                allowTruncation ? secondaryLabelProps.overflowStrategy : 'hide'
            );
        }

        if (secondaryLabel == null) return;

        const totalLabelHeight = label.height + secondaryLabel.height;

        if (secondaryLabel.width > availableWidth || totalLabelHeight > availableHeight) return;

        return {
            width: Math.max(label.width, secondaryLabel.width),
            height: totalLabelHeight + spacing,
            meta: sizeFitting.meta,
            label,
            secondaryLabel,
        };
    });
}

function formatSingleSegmentsLabel<Meta>(
    segments: NormalisedContentSegment[],
    props: AutoSizedBaseLabelOptions,
    { padding }: LayoutParams,
    sizeFittingHeight: SizeFittingHeightFn<Meta>
): [LabelFormatting, Meta] | undefined {
    // Per-segment fontSize overrides rule out binary-searching a base fontSize, so `minimumFontSize`
    // is not honoured for segment arrays; sizing instead relies on segment overflow handling.
    const sizeAdjust = 2 * padding;
    const baseFont = toBaseFont(props);
    const measurer = cachedTextMeasurer(baseFont);
    const lineHeight = props.lineHeight ?? measurer.lineHeight();

    const unconstrained = measureTextSegments(segments, baseFont);
    const sizeFitting = sizeFittingHeight(unconstrained.height + sizeAdjust, true);
    const availableWidth = sizeFitting.width - sizeAdjust;
    const availableHeight = sizeFitting.height - sizeAdjust;

    if (availableWidth <= 0 || availableHeight <= 0) return;

    const wrapped = wrapTextSegments(segments, {
        maxWidth: availableWidth,
        maxHeight: availableHeight,
        font: baseFont,
        textWrap: props.wrapping,
        overflow: props.overflowStrategy ?? 'hide',
    });

    if (!wrapped.length) return;

    const { width, height } = measureTextSegments(wrapped, baseFont);

    return [{ width, height, text: wrapped, fontSize: baseFont.fontSize, lineHeight }, sizeFitting.meta];
}

export function formatSingleLabel<Meta>(
    value: string,
    props: AutoSizedBaseLabelOptions,
    { padding }: LayoutParams,
    sizeFittingHeight: SizeFittingHeightFn<Meta>
): [LabelFormatting, Meta] | undefined {
    const sizeAdjust = 2 * padding;
    const minimumFontSize = resolveMinimumFontSize(props.minimumFontSize, props.fontSize);

    const textSizeProps = {
        fontFamily: props.fontFamily,
        fontStyle: props.fontStyle,
        fontWeight: props.fontWeight,
    };

    return findLargestFittingFontSize<[LabelFormatting, Meta]>(
        minimumFontSize,
        props.fontSize,
        (fontSize, allowTruncation) => {
            const currentFont = { ...textSizeProps, fontSize };
            const measurer = cachedTextMeasurer(currentFont);
            const lineHeight = props.lineHeight ?? measurer.lineHeight();
            const sizeFitting = sizeFittingHeight(lineHeight + sizeAdjust, allowTruncation);
            const availableWidth = sizeFitting.width - sizeAdjust;
            const availableHeight = sizeFitting.height - sizeAdjust;

            if (lineHeight > availableHeight || availableWidth < 0) return;

            const lines = wrapLines(value, {
                maxWidth: availableWidth,
                maxHeight: availableHeight,
                font: currentFont,
                textWrap: props.wrapping,
                overflow: (allowTruncation ? props.overflowStrategy : null) ?? 'hide',
            });

            if (!lines.length) return;

            const { width, height } = measurer.measureLines(lines);
            const text = lines.join('\n');

            return [{ width, height, text, fontSize, lineHeight }, sizeFitting.meta];
        }
    );
}

function formatSingleAny<Meta>(
    value: NormalisedTextOrSegments,
    props: AutoSizedBaseLabelOptions,
    layoutParams: LayoutParams,
    sizeFittingHeight: SizeFittingHeightFn<Meta>
): [LabelFormatting, Meta] | undefined {
    if (isArray(value)) {
        return formatSingleSegmentsLabel(value, props, layoutParams, sizeFittingHeight);
    }
    return formatSingleLabel(String(value), props, layoutParams, sizeFittingHeight);
}

function toBaseFont(props: AutoSizedBaseLabelOptions): FontOptions {
    return {
        fontFamily: props.fontFamily,
        fontStyle: props.fontStyle,
        fontWeight: props.fontWeight,
        fontSize: props.fontSize,
    };
}

// Height is `usable + 2*padding` so the nested consumer, which subtracts its own `2*padding`, can
// derive its canvas budget without a special case.
function fixedFitting<Meta>(
    width: number,
    usableHeight: number,
    padding: number,
    meta: Meta
): SizeFittingHeightFn<Meta> {
    return () => ({ width, height: usableHeight + 2 * padding, meta });
}

// Segments measure once at their declared font (no bin-search), so the stacked plain-text path doesn't apply here.
function formatStackedAnyLabels<Meta>(
    labelValue: NormalisedTextOrSegments,
    labelProps: AutoSizedLabelOptions,
    secondaryLabelValue: NormalisedTextOrSegments,
    secondaryLabelProps: AutoSizedSecondaryLabelOptions,
    layoutParams: LayoutParams,
    sizeFittingHeight: SizeFittingHeightFn<Meta>
): StackedLabelFormatting<Meta> | undefined {
    const { padding } = layoutParams;
    const { spacing = 0 } = labelProps;
    const widthAdjust = 2 * padding;
    const heightAdjust = 2 * padding + spacing;

    const labelBaseFont = toBaseFont(labelProps);
    const secondaryBaseFont = toBaseFont(secondaryLabelProps);

    const labelNaturalHeight = naturalStackHeight(labelValue, labelBaseFont);
    const secondaryNaturalHeight = naturalStackHeight(secondaryLabelValue, secondaryBaseFont);

    const sizeFitting = sizeFittingHeight(labelNaturalHeight + secondaryNaturalHeight + heightAdjust, true);
    const availableWidth = sizeFitting.width - widthAdjust;
    const availableHeight = sizeFitting.height - heightAdjust;

    if (availableWidth <= 0 || availableHeight <= 0) return;

    const labelOnly = (label: LabelFormatting): StackedLabelFormatting<Meta> => ({
        width: label.width,
        height: label.height,
        meta: sizeFitting.meta,
        label,
        secondaryLabel: undefined,
    });

    const labelAllottedHeight = Math.min(labelNaturalHeight, Math.max(0, availableHeight - secondaryNaturalHeight));
    // If the secondary's natural height already swallows the budget, give the primary the full availableHeight rather than starving it to zero.
    const labelHeightBudget = labelAllottedHeight > 0 ? labelAllottedHeight : availableHeight;
    const labelFormatted = formatSingleAny(
        labelValue,
        labelProps,
        layoutParams,
        fixedFitting(sizeFitting.width, labelHeightBudget, padding, sizeFitting.meta)
    );
    if (labelFormatted == null) return;
    const [label] = labelFormatted;

    const remainingHeight = availableHeight - label.height;
    if (remainingHeight <= 0) return labelOnly(label);

    const secondaryFormatted = formatSingleAny(
        secondaryLabelValue,
        secondaryLabelProps,
        layoutParams,
        fixedFitting(sizeFitting.width, remainingHeight, padding, sizeFitting.meta)
    );
    if (secondaryFormatted == null) return labelOnly(label);
    const [secondaryLabel] = secondaryFormatted;

    return {
        width: Math.max(label.width, secondaryLabel.width),
        height: label.height + secondaryLabel.height + spacing,
        meta: sizeFitting.meta,
        label,
        secondaryLabel,
    };
}

// Coarse share for apportionment, not the final wrapped size — line height is a reasonable lower bound,
// and `formatSingleLabel`'s overflow path handles wrapped multi-line text within the apportioned budget.
function naturalStackHeight(value: NormalisedTextOrSegments, font: FontOptions): number {
    if (isArray(value)) {
        return measureTextSegments(value, font).height;
    }
    return cachedTextMeasurer(font).lineHeight();
}

export function formatLabels<Meta = never>(
    baseLabelValue: NormalisedTextOrSegments | undefined,
    labelProps: AutoSizedLabelOptions,
    baseSecondaryLabelValue: NormalisedTextOrSegments | undefined,
    secondaryLabelProps: AutoSizedSecondaryLabelOptions,
    layoutParams: LayoutParams,
    sizeFittingHeight: SizeFittingHeightFn<Meta>
): StackedLabelFormatting<Meta> | undefined {
    const labelValue = labelProps.enabled ? baseLabelValue : undefined;
    const secondaryLabelValue = secondaryLabelProps.enabled ? baseSecondaryLabelValue : undefined;

    let value: StackedLabelFormatting<Meta> | undefined;
    const labelIsSegments = isArray(labelValue);
    const secondaryIsSegments = isArray(secondaryLabelValue);

    // Segments measure once at the declared font size, unlike the bin-searched plain-text path, so fall back to formatting each label independently.
    if (labelValue != null && secondaryLabelValue != null) {
        if (!labelIsSegments && !secondaryIsSegments) {
            value = formatStackedLabels(
                String(labelValue),
                labelProps,
                String(secondaryLabelValue),
                secondaryLabelProps,
                layoutParams,
                sizeFittingHeight
            );
        } else {
            value = formatStackedAnyLabels(
                labelValue,
                labelProps,
                secondaryLabelValue,
                secondaryLabelProps,
                layoutParams,
                sizeFittingHeight
            );
        }
    }

    let labelMeta: [LabelFormatting, Meta] | undefined;
    if (value == null && labelValue != null) {
        labelMeta = formatSingleAny(labelValue, labelProps, layoutParams, sizeFittingHeight);
    }
    if (labelMeta != null) {
        const [label, meta] = labelMeta;
        value = {
            width: label.width,
            height: label.height,
            meta,
            label,
            secondaryLabel: undefined,
        };
    }

    let secondaryLabelMeta: [LabelFormatting, Meta] | undefined;
    if (value == null && labelValue == null && secondaryLabelValue != null) {
        secondaryLabelMeta = formatSingleAny(secondaryLabelValue, secondaryLabelProps, layoutParams, sizeFittingHeight);
    }
    if (secondaryLabelMeta != null) {
        const [secondaryLabel, meta] = secondaryLabelMeta;
        value = {
            width: secondaryLabel.width,
            height: secondaryLabel.height,
            meta,
            label: undefined,
            secondaryLabel,
        };
    }

    return value;
}

function wrapLabel(
    props: AgChartAutoSizedLabelOptions<any, any>,
    text: string,
    maxWidth: number,
    maxHeight: number,
    font: FontOptions,
    textWrap?: TextWrap,
    overflow?: OverflowStrategy
) {
    const lines = wrapLines(text, { maxWidth, maxHeight, font, textWrap, overflow });

    if (!lines.length) return;

    const measurer = cachedTextMeasurer(font);
    const lineHeight = props.lineHeight ?? measurer.lineHeight();
    const { width } = measurer.measureLines(lines);

    return {
        width,
        lineHeight,
        text: lines.join('\n'),
        height: lines.length * lineHeight,
        fontSize: font.fontSize,
    };
}
