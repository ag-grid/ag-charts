import {
    type AgTreemapSeriesLabelFormatterParams,
    type TextOverflow,
    type TextWrap,
    _ModuleSupport,
    _Scene,
} from 'ag-charts-community';

const { Validate, OPT_NUMBER, TEXT_WRAP, TEXT_OVERFLOW } = _ModuleSupport;
const { Text, Label, BBox } = _Scene;

export class TreemapSeriesTileLabel extends Label<AgTreemapSeriesLabelFormatterParams> {
    @Validate(TEXT_WRAP)
    wrapping: TextWrap = 'on-space';

    @Validate(TEXT_OVERFLOW)
    overflow: TextOverflow = 'ellipsis';

    @Validate(OPT_NUMBER())
    minimumFontSize?: number = undefined;
}

type FontSizeCandidate = {
    labelFontSize: number;
    secondaryLabelFontSize: number;
};

export function generateLabelSecondaryLabelFontSizeCandidates(
    label: TreemapSeriesTileLabel,
    secondaryLabel: TreemapSeriesTileLabel
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
            currentLabelFontSize -= 1;
        } else {
            currentSecondaryLabelFontSize -= 1;
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
        return undefined;
    }
    let min = from;
    let max = to;
    let found: T | undefined;

    while (max >= min) {
        const index = ((max + min) / 2) | 0;
        const value = iteratee(index);
        if (value != null) {
            found = value;
            min = index + 1;
        } else {
            max = index - 1;
        }
    }

    return found;
}

type LayoutParams = {
    spacing: number;
    padding: number;
};

type LabelFormatting = {
    text: string;
    fontSize: number;
    width: number;
    height: number;
};

type StackedLabelFormatting = {
    label: LabelFormatting;
    secondaryLabel: LabelFormatting | undefined;
};

export function formatStackedLabels(
    labelValue: string,
    labelProps: TreemapSeriesTileLabel,
    secondaryLabelValue: string,
    secondaryLabelProps: TreemapSeriesTileLabel,
    { width, height }: _Scene.BBox,
    { spacing, padding }: LayoutParams
) {
    const availableWidth = width - 2 * padding;
    const availableHeight = height - 2 * padding - spacing;

    const minimumHeight =
        (labelProps.minimumFontSize ?? labelProps.fontSize) +
        (secondaryLabelProps.minimumFontSize ?? secondaryLabelProps.fontSize);
    if (minimumHeight > availableHeight) {
        return undefined;
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

    const infiniteBBox = new BBox(-Infinity, -Infinity, Infinity, Infinity);

    return maximumValueSatisfying<StackedLabelFormatting>(0, fontSizeCandidates.length - 1, (index) => {
        const { labelFontSize, secondaryLabelFontSize } = fontSizeCandidates[index];
        const allowTruncation = index === 0;

        if (labelFontSize + secondaryLabelFontSize > availableHeight) {
            return undefined;
        }

        if (label == null || label.fontSize !== labelFontSize) {
            labelTextSizeProps.fontSize = labelFontSize;
            const labelText = Text.wrap(
                labelValue,
                availableWidth,
                availableHeight,
                labelTextSizeProps,
                labelProps.wrapping,
                allowTruncation ? labelProps.overflow : 'never'
            );

            const hasValidText = labelText.length !== 0;

            labelTextNode.text = labelText;
            labelTextNode.fontSize = labelFontSize;
            const { width, height } = hasValidText ? labelTextNode.computeBBox() : infiniteBBox;
            const labelWidth = width;
            const labelHeight = Math.max(height, labelFontSize);

            label = { text: labelText, fontSize: labelFontSize, width: labelWidth, height: labelHeight };
        }

        if (label.width > availableWidth || label.height > availableHeight) {
            return undefined;
        }

        if (secondaryLabel == null || secondaryLabel.fontSize !== secondaryLabelFontSize) {
            secondaryLabelTextSizeProps.fontSize = secondaryLabelFontSize;
            const secondaryLabelText = Text.wrap(
                secondaryLabelValue,
                availableWidth,
                availableHeight,
                secondaryLabelTextSizeProps,
                secondaryLabelProps.wrapping,
                allowTruncation ? secondaryLabelProps.overflow : 'never'
            );

            const hasValidText = secondaryLabelText.length !== 0;

            secondaryLabelTextNode.text = secondaryLabelText;
            secondaryLabelTextNode.fontSize = secondaryLabelFontSize;
            const { width, height } = hasValidText ? secondaryLabelTextNode.computeBBox() : infiniteBBox;
            const secondaryLabelWidth = width;
            const secondaryLabelHeight = Math.max(height, secondaryLabelFontSize);

            secondaryLabel = {
                text: secondaryLabelText,
                fontSize: secondaryLabelFontSize,
                width: secondaryLabelWidth,
                height: secondaryLabelHeight,
            };
        }

        const totalLabelHeight = label.height + secondaryLabel.height;

        if (secondaryLabel.width > availableWidth || totalLabelHeight > availableHeight) {
            return undefined;
        }

        return { label, secondaryLabel };
    });
}

export function formatSingleLabel(
    value: string,
    props: TreemapSeriesTileLabel,
    { width, height }: _Scene.BBox,
    { padding }: LayoutParams
) {
    const minimumFontSize = props.minimumFontSize ?? props.fontSize;

    const availableWidth = width - 2 * padding;
    const availableHeight = height - 2 * padding;

    const textNode = new Text();
    textNode.setFont(props);

    const textSizeProps = {
        fontFamily: props.fontFamily,
        fontSize: props.fontSize,
        fontStyle: props.fontStyle,
        fontWeight: props.fontWeight,
    };

    return maximumValueSatisfying<StackedLabelFormatting>(minimumFontSize, props.fontSize, (fontSize) => {
        if (fontSize > availableHeight) {
            return undefined;
        }

        const allowTruncation = fontSize === minimumFontSize;

        textSizeProps.fontSize = fontSize;
        const text = Text.wrap(
            value,
            availableWidth,
            availableHeight,
            textSizeProps,
            props.wrapping,
            allowTruncation ? props.overflow : 'never'
        );

        if (text.length === 0) {
            return undefined;
        }

        textNode.text = text;
        textNode.fontSize = fontSize;
        const size = textNode.computeBBox();
        const width = size.width;
        const height = Math.max(size.height, fontSize);

        if (size.width > availableWidth || height > availableHeight) {
            return undefined;
        }

        return {
            label: { text, fontSize, width, height },
            secondaryLabel: undefined,
        };
    });
}

export function formatLabels(
    labelValue: string,
    label: TreemapSeriesTileLabel,
    secondaryLabelValue: string | undefined,
    secondaryLabel: TreemapSeriesTileLabel,
    bbox: _Scene.BBox,
    layoutParams: LayoutParams
): StackedLabelFormatting | undefined {
    let value: StackedLabelFormatting | undefined;

    if (secondaryLabelValue != null) {
        value = formatStackedLabels(labelValue, label, secondaryLabelValue, secondaryLabel, bbox, layoutParams);
    }

    value ??= formatSingleLabel(labelValue, label, bbox, layoutParams);

    return value;
}
