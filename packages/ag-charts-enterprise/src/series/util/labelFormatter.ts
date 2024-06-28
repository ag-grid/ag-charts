import { type OverflowStrategy, type TextWrap, _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

const { Validate, TextMeasurer, NUMBER, TEXT_WRAP, OVERFLOW_STRATEGY } = _ModuleSupport;
const { Logger } = _Util;
const { Text, Label } = _Scene;

class BaseAutoSizedLabel<FormatterParams> extends Label<FormatterParams> {
    static lineHeight(fontSize: number): number {
        return Math.ceil(fontSize * Text.defaultLineHeightRatio);
    }

    @Validate(TEXT_WRAP)
    wrapping: TextWrap = 'on-space';

    @Validate(OVERFLOW_STRATEGY)
    overflowStrategy: OverflowStrategy = 'ellipsis';

    @Validate(NUMBER, { optional: true })
    minimumFontSize?: number;
}

export class AutoSizedLabel<FormatterParams> extends BaseAutoSizedLabel<FormatterParams> {
    @Validate(NUMBER)
    spacing: number = 0;
}

export class AutoSizeableSecondaryLabel<FormatterParams> extends BaseAutoSizedLabel<FormatterParams> {}

type FontSizeCandidate = {
    labelFontSize: number;
    secondaryLabelFontSize: number;
};

export function generateLabelSecondaryLabelFontSizeCandidates<FormatterParams>(
    label: BaseAutoSizedLabel<FormatterParams>,
    secondaryLabel: BaseAutoSizedLabel<FormatterParams>
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

export function maximumValueSatisfying<T>(
    from: number,
    to: number,
    iteratee: (value: number) => T | undefined
): T | undefined {
    // Binary search of layouts returning the largest value

    if (from > to) {
        return;
    }
    let min = from;
    let max = to;
    let found: T | undefined;

    while (max >= min) {
        const index = Math.floor((max + min) / 2);
        const value = iteratee(index);
        if (value == null) {
            max = index - 1;
        } else {
            found = value;
            min = index + 1;
        }
    }

    return found;
}

type LayoutParams = {
    padding: number;
};

type LabelFormatting = {
    text: string;
    fontSize: number;
    lineHeight: number;
    width: number;
    height: number;
};

export type StackedLabelFormatting<Meta> = {
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

export function formatStackedLabels<Meta, FormatterParams>(
    labelValue: string,
    labelProps: AutoSizedLabel<FormatterParams>,
    secondaryLabelValue: string,
    secondaryLabelProps: AutoSizeableSecondaryLabel<FormatterParams>,
    { padding }: LayoutParams,
    sizeFittingHeight: SizeFittingHeightFn<Meta>
) {
    const { spacing } = labelProps;

    const widthAdjust = 2 * padding;
    const heightAdjust = 2 * padding + spacing;
    const minimumHeight =
        (labelProps.minimumFontSize ?? labelProps.fontSize) +
        (secondaryLabelProps.minimumFontSize ?? secondaryLabelProps.fontSize);
    if (minimumHeight > sizeFittingHeight(minimumHeight + heightAdjust, false).height - heightAdjust) {
        return;
    }

    const fontSizeCandidates = generateLabelSecondaryLabelFontSizeCandidates(labelProps, secondaryLabelProps);

    const labelTextNode = new Text();
    labelTextNode.setFont(labelProps);

    const labelTextSizeProps = {
        fontFamily: labelProps.fontFamily,
        fontSize: labelProps.fontSize,
        fontStyle: labelProps.fontStyle,
        fontWeight: labelProps.fontWeight,
    };

    const secondaryLabelTextNode = new Text();
    secondaryLabelTextNode.setFont(secondaryLabelProps);

    const secondaryLabelTextSizeProps = {
        fontFamily: secondaryLabelProps.fontFamily,
        fontSize: secondaryLabelProps.fontSize,
        fontStyle: secondaryLabelProps.fontStyle,
        fontWeight: secondaryLabelProps.fontWeight,
    };

    // The font size candidates will repeat some font sizes, so cache the results so we don't do extra text measuring
    let label: LabelFormatting | undefined;
    let secondaryLabel: LabelFormatting | undefined;

    return maximumValueSatisfying<StackedLabelFormatting<Meta>>(0, fontSizeCandidates.length - 1, (index) => {
        const { labelFontSize, secondaryLabelFontSize } = fontSizeCandidates[index];
        const allowTruncation = index === 0;
        const labelLineHeight = AutoSizedLabel.lineHeight(labelFontSize);
        const secondaryLabelLineHeight = AutoSizeableSecondaryLabel.lineHeight(secondaryLabelFontSize);
        const sizeFitting = sizeFittingHeight(
            labelLineHeight + secondaryLabelLineHeight + heightAdjust,
            allowTruncation
        );
        const availableWidth = sizeFitting.width - widthAdjust;
        const availableHeight = sizeFitting.height - heightAdjust;

        if (labelLineHeight + secondaryLabelLineHeight > availableHeight) {
            return;
        }

        if (label == null || label.fontSize !== labelFontSize) {
            labelTextSizeProps.fontSize = labelFontSize;
            const labelLines = Text.wrapLines(
                labelValue,
                availableWidth,
                availableHeight,
                labelTextSizeProps,
                labelProps.wrapping,
                allowTruncation ? labelProps.overflowStrategy : 'hide'
            );

            if (labelLines == null) {
                label = undefined;
            } else {
                const labelText = labelLines.join('\n');

                labelTextNode.text = labelText;
                labelTextNode.fontSize = labelFontSize;
                labelTextNode.lineHeight = labelFontSize;
                const labelWidth = labelTextNode.computeBBox().width;
                const labelHeight = labelLines.length * labelLineHeight;

                label = {
                    text: labelText,
                    fontSize: labelFontSize,
                    lineHeight: labelLineHeight,
                    width: labelWidth,
                    height: labelHeight,
                };
            }
        }

        if (label == null || label.width > availableWidth || label.height > availableHeight) {
            return;
        }

        if (secondaryLabel == null || secondaryLabel.fontSize !== secondaryLabelFontSize) {
            secondaryLabelTextSizeProps.fontSize = secondaryLabelFontSize;
            const secondaryLabelLines = Text.wrapLines(
                secondaryLabelValue,
                availableWidth,
                availableHeight,
                secondaryLabelTextSizeProps,
                secondaryLabelProps.wrapping,
                allowTruncation ? secondaryLabelProps.overflowStrategy : 'hide'
            );

            if (secondaryLabelLines == null) {
                secondaryLabel = undefined;
            } else {
                const secondaryLabelText = secondaryLabelLines.join('\n');

                secondaryLabelTextNode.text = secondaryLabelText;
                secondaryLabelTextNode.fontSize = secondaryLabelFontSize;
                secondaryLabelTextNode.lineHeight = secondaryLabelLineHeight;
                const secondaryLabelWidth = secondaryLabelTextNode.computeBBox().width;
                const secondaryLabelHeight = secondaryLabelLines.length * secondaryLabelLineHeight;

                secondaryLabel = {
                    text: secondaryLabelText,
                    fontSize: secondaryLabelFontSize,
                    lineHeight: secondaryLabelLineHeight,
                    width: secondaryLabelWidth,
                    height: secondaryLabelHeight,
                };
            }
        }

        if (secondaryLabel == null) {
            return;
        }

        const totalLabelHeight = label.height + secondaryLabel.height;

        if (secondaryLabel.width > availableWidth || totalLabelHeight > availableHeight) {
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

export function formatSingleLabel<Meta, FormatterParams>(
    value: string,
    props: BaseAutoSizedLabel<FormatterParams>,
    { padding }: LayoutParams,
    sizeFittingHeight: SizeFittingHeightFn<Meta>
): [LabelFormatting, Meta] | undefined {
    const sizeAdjust = 2 * padding;
    const minimumFontSize = Math.min(props.minimumFontSize ?? props.fontSize, props.fontSize);

    const textNode = new Text();
    textNode.setFont(props);

    const textSizeProps = {
        fontFamily: props.fontFamily,
        fontSize: props.fontSize,
        fontStyle: props.fontStyle,
        fontWeight: props.fontWeight,
    };

    return maximumValueSatisfying<[LabelFormatting, Meta]>(minimumFontSize, props.fontSize, (fontSize) => {
        const lineHeight = AutoSizedLabel.lineHeight(fontSize);
        const allowTruncation = fontSize === minimumFontSize;
        const sizeFitting = sizeFittingHeight(lineHeight + sizeAdjust, allowTruncation);
        const availableWidth = sizeFitting.width - sizeAdjust;
        const availableHeight = sizeFitting.height - sizeAdjust;

        if (lineHeight > availableHeight) return;

        textSizeProps.fontSize = fontSize;
        const lines = Text.wrapLines(
            value,
            availableWidth,
            availableHeight,
            textSizeProps,
            props.wrapping,
            allowTruncation ? props.overflowStrategy : 'hide'
        );

        if (lines == null) return;

        textNode.fontSize = fontSize;
        textNode.lineHeight = lineHeight;
        textNode.text = lines.join('\n');

        let height = lineHeight * lines.length;
        while (height > availableHeight) {
            if (lines.length === 1) return;
            lines.pop();
            lines[lines.length - 1] += TextMeasurer.EllipsisChar;
            textNode.text = lines.join('\n');
            height = lineHeight * lines.length;
        }

        const { width } = textNode.computeBBox();
        if (width > availableWidth) return;

        return [{ text: textNode.text, fontSize, lineHeight, width, height }, sizeFitting.meta];
    });
}

function hasInvalidFontSize<FormatterParams>(label?: BaseAutoSizedLabel<FormatterParams>) {
    return label?.minimumFontSize != null && label?.fontSize && label?.minimumFontSize > label?.fontSize;
}

export function formatLabels<Meta = never, FormatterParams = any>(
    baseLabelValue: string | undefined,
    labelProps: AutoSizedLabel<FormatterParams>,
    baseSecondaryLabelValue: string | undefined,
    secondaryLabelProps: AutoSizeableSecondaryLabel<FormatterParams>,
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
            meta: meta,
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
