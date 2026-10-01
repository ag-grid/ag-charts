import type {
    AnnotationLineStyle,
    AnnotationOptionsColorPickerType,
    ChannelTextPosition,
    LineTextPosition,
} from '../annotationTypes';
import type {
    AnnotationDatum,
    ChannelDatumType,
    EphemeralDatumType,
    LineDatumType,
    MeasurerDatumType,
} from '../annotationsSuperTypes';
import { hasBackground, hasFillField, hasIconColor, hasLineText, hasStroke } from './has';
import { getLineStyle } from './line';
import { isChannelType, isCrossLineType, isFibonacciType, isTextType } from './types';

export function setFontSize(datum: AnnotationDatum, fontSize: number) {
    if (isTextType(datum)) datum.fontSize = fontSize;
    if (hasLineText(datum)) datum.text.fontSize = fontSize;
}

export function setLineStyle(
    datum: Exclude<LineDatumType | ChannelDatumType | MeasurerDatumType, EphemeralDatumType>,
    style?: AnnotationLineStyle
) {
    const lineType = style?.type ?? datum.lineStyle;

    datum.strokeWidth = style?.strokeWidth ?? datum.strokeWidth ?? 1;
    datum.lineStyle = lineType ?? getLineStyle(datum.lineDash, lineType);

    // An explicit style choice replaces any custom dash pattern.
    if (style?.type != null) datum.lineDash = undefined;
}

export function setLineTextPosition(
    datum: Exclude<LineDatumType | ChannelDatumType | MeasurerDatumType, EphemeralDatumType>,
    position: LineTextPosition | ChannelTextPosition
) {
    if (isChannelType(datum)) {
        datum.text.position = position === 'center' ? 'inside' : position;
    } else {
        datum.text.position = position === 'inside' ? 'center' : position;
    }
}

export function setColor(
    datum: AnnotationDatum,
    colorPickerType: AnnotationOptionsColorPickerType,
    colorOpacity: string,
    color: string,
    opacity: number,
    isMultiColor: boolean
) {
    switch (colorPickerType) {
        case `fill-color`: {
            if (hasFillField(datum)) {
                datum.fill = color;
                datum.fillOpacity = opacity;
            }
            if (hasBackground(datum)) {
                datum.background.fill = color;
                datum.background.fillOpacity = opacity;
            }
            break;
        }

        case `line-color`: {
            if (isCrossLineType(datum)) {
                datum.axisLabel.fill = color;
                datum.axisLabel.fillOpacity = opacity;
                datum.axisLabel.stroke = color;
                datum.axisLabel.strokeOpacity = opacity;
            }

            if (hasIconColor(datum)) {
                datum.fill = color;
                datum.fillOpacity = opacity;
            } else if (hasStroke(datum)) {
                datum.strokeOpacity = opacity;
                if (isFibonacciType(datum)) {
                    datum.isMultiColor = isMultiColor;
                    datum.rangeStroke = color;
                } else {
                    datum.stroke = color;
                }
            }

            break;
        }

        case `text-color`: {
            if (isTextType(datum)) datum.color = colorOpacity;
            if (hasLineText(datum)) datum.text.color = color;
            break;
        }
    }
}
