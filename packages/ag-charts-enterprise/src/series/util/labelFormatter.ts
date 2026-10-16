import {
    type FontOptions,
    type NormalisedTextOrSegments,
    cachedTextMeasurer,
    drawnLineHeight,
    findLargestFittingFontSize,
    findLargestFittingStep,
    fontWithSize,
    measureLabelText,
    resolveMinimumFontSize,
    wrapLines,
} from 'ag-charts-core';
import type {
    AgChartAutoSizedBaseLabelOptions,
    AgChartAutoSizedLabelOptions,
    AgChartAutoSizedSecondaryLabelOptions,
    AgChartLabelFitOptions,
    FontSize,
    OverflowStrategy,
    TextWrap,
} from 'ag-charts-types';

interface AutoSizedBaseLabelOptions
    extends AgChartAutoSizedBaseLabelOptions<unknown, any>, Pick<AgChartLabelFitOptions, 'maxWidth' | 'maxHeight'> {
    fontSize: FontSize;
}

interface AutoSizedLabelOptions
    extends AgChartAutoSizedLabelOptions<unknown, any>, Pick<AgChartLabelFitOptions, 'maxWidth' | 'maxHeight'> {
    fontSize: FontSize;
}

interface AutoSizedSecondaryLabelOptions
    extends
        AgChartAutoSizedSecondaryLabelOptions<unknown, any>,
        Pick<AgChartLabelFitOptions, 'maxWidth' | 'maxHeight'> {
    fontSize: FontSize;
}

function capWidth(props: Pick<AgChartLabelFitOptions, 'maxWidth'>, width: number) {
    return props.maxWidth == null ? width : Math.min(width, props.maxWidth);
}

function capHeight(props: Pick<AgChartLabelFitOptions, 'maxHeight'>, height: number) {
    return props.maxHeight == null ? height : Math.min(height, props.maxHeight);
}

/** The label's font at `fontSize`, with its `lineHeight` kept in proportion. */
function labelFontAt(props: AutoSizedBaseLabelOptions, fontSize: number): FontOptions {
    const { fontFamily, fontStyle, fontWeight, lineHeight } = props;
    return fontWithSize({ fontFamily, fontStyle, fontWeight, fontSize: props.fontSize, lineHeight }, fontSize);
}

function overflowAtFloor(props: AgChartAutoSizedBaseLabelOptions<unknown, any>): OverflowStrategy {
    return props.truncate ? 'ellipsis' : 'hide';
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

    // The font size candidates will repeat some font sizes, so cache the results, so we don't do extra text measuring
    let label: LabelFormatting | undefined;
    let secondaryLabel: LabelFormatting | undefined;

    return findLargestFittingStep<StackedLabelFormatting<Meta>>(fontSizeCandidates.length, (index) => {
        const { labelFontSize, secondaryLabelFontSize } = fontSizeCandidates[index];
        const allowTruncation = index === 0;
        const labelFont = labelFontAt(labelProps, labelFontSize);
        const secondaryLabelFont = labelFontAt(secondaryLabelProps, secondaryLabelFontSize);
        const labelLineHeight = drawnLineHeight(labelFont);
        const secondaryLabelLineHeight = drawnLineHeight(secondaryLabelFont);
        const sizeFitting = sizeFittingHeight(
            labelLineHeight + secondaryLabelLineHeight + heightAdjust,
            allowTruncation
        );
        const availableWidth = sizeFitting.width - widthAdjust;
        const availableHeight = sizeFitting.height - heightAdjust;

        if (labelLineHeight + secondaryLabelLineHeight > availableHeight) return;

        const labelWidth = capWidth(labelProps, availableWidth);
        const labelHeight = capHeight(labelProps, availableHeight);
        if (label?.fontSize !== labelFontSize) {
            label = wrapLabel(
                labelValue,
                labelWidth,
                labelHeight,
                labelFont,
                labelProps.wrapping,
                allowTruncation ? overflowAtFloor(labelProps) : 'hide'
            );
        }

        if (label == null || label.width > labelWidth || label.height > labelHeight) return;

        const secondaryLabelWidth = capWidth(secondaryLabelProps, availableWidth);
        const secondaryLabelHeight = capHeight(secondaryLabelProps, availableHeight);
        if (secondaryLabel?.fontSize !== secondaryLabelFontSize) {
            secondaryLabel = wrapLabel(
                secondaryLabelValue,
                secondaryLabelWidth,
                secondaryLabelHeight,
                secondaryLabelFont,
                secondaryLabelProps.wrapping,
                allowTruncation ? overflowAtFloor(secondaryLabelProps) : 'hide'
            );
        }

        if (secondaryLabel == null) return;

        const totalLabelHeight = label.height + secondaryLabel.height;

        if (
            secondaryLabel.width > secondaryLabelWidth ||
            secondaryLabel.height > secondaryLabelHeight ||
            totalLabelHeight > availableHeight
        ) {
            return;
        }

        return {
            width: Math.max(label.width, secondaryLabel.width),
            height: totalLabelHeight + spacing,
            meta: sizeFitting.meta,
            label,
            secondaryLabel,
        };
    });
}

export function formatSingleLabel<Meta>(
    value: string,
    props: AutoSizedBaseLabelOptions,
    { padding }: LayoutParams,
    sizeFittingHeight: SizeFittingHeightFn<Meta>
): [LabelFormatting, Meta] | undefined {
    const sizeAdjust = 2 * padding;
    const minimumFontSize = resolveMinimumFontSize(props.minimumFontSize, props.fontSize);

    const fitted = findLargestFittingFontSize<[LabelFormatting, Meta]>(
        minimumFontSize,
        props.fontSize,
        (fontSize, allowTruncation) => {
            const currentFont = labelFontAt(props, fontSize);
            const measurer = cachedTextMeasurer(currentFont);
            const lineHeight = currentFont.lineHeight ?? measurer.lineHeight();
            const sizeFitting = sizeFittingHeight(lineHeight + sizeAdjust, allowTruncation);
            const availableWidth = capWidth(props, sizeFitting.width - sizeAdjust);
            const availableHeight = capHeight(props, sizeFitting.height - sizeAdjust);

            if (lineHeight > availableHeight || availableWidth < 0) return;

            const lines = wrapLines(value, {
                maxWidth: availableWidth,
                maxHeight: availableHeight,
                lineHeight: currentFont.lineHeight,
                font: currentFont,
                textWrap: props.wrapping,
                overflow: allowTruncation ? overflowAtFloor(props) : 'hide',
            });

            if (lines.length === 0) return;

            const { width } = measurer.measureLines(lines);
            const height = lines.length * lineHeight;
            // `'never'` keeps every manual line whatever the height, so it can still be too tall here.
            if (height > availableHeight) return;
            const text = lines.join('\n');

            return [{ width, height, text, fontSize, lineHeight }, sizeFitting.meta];
        }
    );
    if (fitted != null || !props.collision?.alwaysShow) return fitted;
    return formatOverflowingLabel(value, props, minimumFontSize, padding, sizeFittingHeight);
}

/** A label `collision.alwaysShow` keeps although it does not fit: drawn at its floor size, overflowing its bounds. */
function formatOverflowingLabel<Meta>(
    value: string,
    props: AutoSizedBaseLabelOptions,
    fontSize: number,
    padding: number,
    sizeFittingHeight: SizeFittingHeightFn<Meta>
): [LabelFormatting, Meta] {
    const font = labelFontAt(props, fontSize);
    const measurer = cachedTextMeasurer(font);
    const lineHeight = font.lineHeight ?? measurer.lineHeight();
    const sizeFitting = sizeFittingHeight(lineHeight + 2 * padding, true);
    const maxWidth = capWidth(props, sizeFitting.width - 2 * padding);
    let lines =
        maxWidth > 0
            ? wrapLines(value, {
                  maxWidth,
                  lineHeight: font.lineHeight,
                  font,
                  textWrap: props.wrapping,
                  overflow: overflowAtFloor(props),
              })
            : [];
    if (lines.length === 0) lines = value.split('\n');
    const { width, height } = measureLabelText(lines.join('\n'), font);
    return [{ width, height, text: lines.join('\n'), fontSize, lineHeight }, sizeFitting.meta];
}

function wrapLabel(
    text: string,
    maxWidth: number,
    maxHeight: number,
    font: FontOptions,
    textWrap?: TextWrap,
    overflow?: OverflowStrategy
) {
    const lines = wrapLines(text, { maxWidth, maxHeight, lineHeight: font.lineHeight, font, textWrap, overflow });

    if (lines.length === 0) return;

    const measurer = cachedTextMeasurer(font);
    const lineHeight = font.lineHeight ?? measurer.lineHeight();
    const { width } = measurer.measureLines(lines);

    return {
        width,
        lineHeight,
        text: lines.join('\n'),
        height: lines.length * lineHeight,
        fontSize: font.fontSize,
    };
}
