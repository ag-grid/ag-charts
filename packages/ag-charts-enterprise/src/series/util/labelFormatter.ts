import { type FontOptions, Logger, cachedTextMeasurer, findMaxValue, wrapLines } from 'ag-charts-core';
import type {
    AgChartAutoSizedBaseLabelOptions,
    AgChartAutoSizedLabelOptions,
    AgChartAutoSizedSecondaryLabelOptions,
    FontSize,
    OverflowStrategy,
    TextOrSegments,
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
    const { fontSize: labelFontSize, minimumFontSize: labelMinimumFontSize = labelFontSize } = label;
    const {
        fontSize: secondaryLabelFontSize,
        minimumFontSize: secondaryLabelMinimumFontSize = secondaryLabelFontSize,
    } = secondaryLabel;

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

        if (labelProgress > secondaryLabelProgress) {
            currentLabelFontSize--;
        } else {
            currentSecondaryLabelFontSize--;
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
    text: TextOrSegments;
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
    const minimumHeight =
        (labelProps.minimumFontSize ?? labelProps.fontSize) +
        (secondaryLabelProps.minimumFontSize ?? secondaryLabelProps.fontSize);

    if (minimumHeight > sizeFittingHeight(minimumHeight + heightAdjust, false).height - heightAdjust) return;

    const fontSizeCandidates = generateLabelSecondaryLabelFontSizeCandidates(labelProps, secondaryLabelProps);

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

    return findMaxValue<StackedLabelFormatting<Meta>>(0, fontSizeCandidates.length - 1, (index) => {
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

export function formatSingleLabel<Meta>(
    value: string,
    props: AutoSizedBaseLabelOptions,
    { padding }: LayoutParams,
    sizeFittingHeight: SizeFittingHeightFn<Meta>
): [LabelFormatting, Meta] | undefined {
    const sizeAdjust = 2 * padding;
    const minimumFontSize = Math.min(props.minimumFontSize ?? props.fontSize, props.fontSize);

    const textSizeProps = {
        fontFamily: props.fontFamily,
        fontStyle: props.fontStyle,
        fontWeight: props.fontWeight,
    };

    return findMaxValue<[LabelFormatting, Meta]>(minimumFontSize, props.fontSize, (fontSize) => {
        const currentFont = { ...textSizeProps, fontSize };
        const measurer = cachedTextMeasurer(currentFont);
        const allowTruncation = fontSize === minimumFontSize;
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
    });
}

function hasInvalidFontSize(label?: AutoSizedBaseLabelOptions) {
    return label?.minimumFontSize != null && label?.fontSize != null && label?.minimumFontSize > label?.fontSize;
}

export function formatLabels<Meta = never>(
    baseLabelValue: string | undefined,
    labelProps: AutoSizedLabelOptions,
    baseSecondaryLabelValue: string | undefined,
    secondaryLabelProps: AutoSizedSecondaryLabelOptions,
    layoutParams: LayoutParams,
    sizeFittingHeight: SizeFittingHeightFn<Meta>
): StackedLabelFormatting<Meta> | undefined {
    const labelValue = labelProps.enabled ? baseLabelValue : undefined;
    const secondaryLabelValue = secondaryLabelProps.enabled ? baseSecondaryLabelValue : undefined;

    if (hasInvalidFontSize(labelProps) || hasInvalidFontSize(secondaryLabelProps)) {
        Logger.warnOnce(`minimumFontSize should be set to a value less than or equal to the font size`);
    }

    let value: StackedLabelFormatting<Meta> | undefined;

    if (labelValue != null && secondaryLabelValue != null) {
        value = formatStackedLabels(
            labelValue,
            labelProps,
            secondaryLabelValue,
            secondaryLabelProps,
            layoutParams,
            sizeFittingHeight
        );
    }

    let labelMeta: [LabelFormatting, Meta] | undefined;
    if (value == null && labelValue != null) {
        labelMeta = formatSingleLabel(labelValue, labelProps, layoutParams, sizeFittingHeight);
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
    // Only print secondary label on its own if the primary label was not specified
    if (value == null && labelValue == null && secondaryLabelValue != null) {
        secondaryLabelMeta = formatSingleLabel(
            secondaryLabelValue,
            secondaryLabelProps,
            layoutParams,
            sizeFittingHeight
        );
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
