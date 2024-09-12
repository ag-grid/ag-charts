import type { AnnotationLineStyle, AnnotationOptionsColorPickerType } from '../annotationTypes';
import type { AnnotationProperties, ChannelPropertiesType, LinePropertiesType } from '../annotationsSuperTypes';
import { hasIconColor, hasLineText } from './has';
import { getComputedLineDash, getLineStyle } from './line';

export function setFontSize(datum: AnnotationProperties, fontSize: number) {
    if ('fontSize' in datum) datum.fontSize = fontSize;
    if (hasLineText(datum)) datum.text.fontSize = fontSize;
}

export function setLineStyle(datum: LinePropertiesType | ChannelPropertiesType, style?: AnnotationLineStyle) {
    const strokeWidth = style?.strokeWidth ?? datum.strokeWidth ?? 1;
    const lineType = style?.type ?? datum.lineStyle;
    const lineStyle = lineType ?? getLineStyle(datum.lineDash, lineType);
    const computedLineDash = getComputedLineDash(strokeWidth, lineStyle);

    datum.strokeWidth = strokeWidth;
    datum.computedLineDash = computedLineDash;
    datum.lineStyle = lineStyle;
    datum.lineCap = lineStyle === 'dotted' ? 'round' : undefined;
}

export function setColor(
    datum: AnnotationProperties,
    colorPickerType: AnnotationOptionsColorPickerType,
    colorOpacity: string,
    color: string,
    opacity: number
) {
    switch (colorPickerType) {
        case `fill-color`: {
            if ('fill' in datum) datum.fill = color;
            if ('fillOpacity' in datum) datum.fillOpacity = opacity;
            if ('background' in datum) {
                datum.background.fill = color;
                datum.background.fillOpacity = opacity;
            }
            break;
        }

        case `line-color`: {
            if ('axisLabel' in datum) {
                datum.axisLabel.fill = color;
                datum.axisLabel.fillOpacity = opacity;
                datum.axisLabel.stroke = color;
                datum.axisLabel.strokeOpacity = opacity;
            }

            if ('fill' in datum && 'fillOpacity' in datum && hasIconColor(datum)) {
                datum.fill = color;
                datum.fillOpacity = opacity;
            } else {
                if ('stroke' in datum) datum.stroke = color;
                if ('strokeOpacity' in datum) datum.strokeOpacity = opacity;
            }

            break;
        }

        case `text-color`: {
            if ('color' in datum) datum.color = colorOpacity;
            if (hasLineText(datum)) datum.text.color = color;
            break;
        }
    }
}
