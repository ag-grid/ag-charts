import { type PixelSize, _ModuleSupport } from 'ag-charts-community';

import type {
    AnnotationContext,
    AnnotationLineStyle,
    AnnotationLineStyleType,
    AnnotationOptionsColorPickerType,
    ChannelAnnotationType,
    LineAnnotationType,
    TextualAnnotationType,
} from './annotationTypes';
import { AnnotationType } from './annotationTypes';
import type {
    AnnotationProperties,
    AnnotationScene,
    ChannelPropertiesType,
    LinePropertiesType,
    TextualPropertiesType,
} from './annotationsSuperTypes';
import { arrowDownConfig } from './arrow-down/arrowDownConfig';
import { arrowUpConfig } from './arrow-up/arrowUpConfig';
import { calloutConfig } from './callout/calloutConfig';
import { CalloutProperties } from './callout/calloutProperties';
import { commentConfig } from './comment/commentConfig';
import { CommentProperties } from './comment/commentProperties';
import { horizontalLineConfig, verticalLineConfig } from './cross-line/crossLineConfig';
import { HorizontalLineProperties, VerticalLineProperties } from './cross-line/crossLineProperties';
import { disjointChannelConfig } from './disjoint-channel/disjointChannelConfig';
import { DisjointChannelProperties } from './disjoint-channel/disjointChannelProperties';
import { arrowConfig, lineConfig } from './line/lineConfig';
import { ArrowProperties, LineProperties } from './line/lineProperties';
import { noteConfig } from './note/noteConfig';
import { NoteProperties } from './note/noteProperties';
import { parallelChannelConfig } from './parallel-channel/parallelChannelConfig';
import { ParallelChannelProperties } from './parallel-channel/parallelChannelProperties';
import { ShapePointProperties } from './properties/shapePointProperties';
import { textConfig } from './text/textConfig';
import { TextProperties } from './text/textProperties';

const { isObject } = _ModuleSupport;

export const annotationConfigs = {
    // Lines
    [lineConfig.type]: lineConfig,
    [horizontalLineConfig.type]: horizontalLineConfig,
    [verticalLineConfig.type]: verticalLineConfig,

    // Channels
    [parallelChannelConfig.type]: parallelChannelConfig,
    [disjointChannelConfig.type]: disjointChannelConfig,

    // Texts
    [calloutConfig.type]: calloutConfig,
    [commentConfig.type]: commentConfig,
    [noteConfig.type]: noteConfig,
    [textConfig.type]: textConfig,

    // Shapes
    [arrowConfig.type]: arrowConfig,
    [arrowUpConfig.type]: arrowUpConfig,
    [arrowDownConfig.type]: arrowDownConfig,
};

export function updateAnnotation(node: AnnotationScene, datum: AnnotationProperties, context: AnnotationContext) {
    for (const { update } of Object.values(annotationConfigs)) {
        update(node, datum, context);
    }
}

export function getTypedDatum(datum: unknown) {
    for (const { isDatum } of Object.values(annotationConfigs)) {
        if (isDatum(datum)) {
            return datum;
        }
    }
}

export function isLineType(datum: unknown): datum is LinePropertiesType {
    return (
        LineProperties.is(datum) ||
        HorizontalLineProperties.is(datum) ||
        VerticalLineProperties.is(datum) ||
        ArrowProperties.is(datum)
    );
}

export function isChannelType(datum: unknown): datum is ChannelPropertiesType {
    return DisjointChannelProperties.is(datum) || ParallelChannelProperties.is(datum);
}

export function isTextType(datum: unknown): datum is TextualPropertiesType {
    return (
        CalloutProperties.is(datum) ||
        CommentProperties.is(datum) ||
        NoteProperties.is(datum) ||
        TextProperties.is(datum)
    );
}

export function hasFontSize(datum?: AnnotationProperties): datum is TextualPropertiesType {
    return isTextType(datum) && !NoteProperties.is(datum);
}

export function hasLineStyle(datum?: AnnotationProperties): datum is LinePropertiesType | ChannelPropertiesType {
    return isLineType(datum) || isChannelType(datum);
}

export function hasLineColor(datum?: AnnotationProperties) {
    return isLineType(datum) || isChannelType(datum) || CalloutProperties.is(datum) || NoteProperties.is(datum);
}

export function hasFillColor(datum?: AnnotationProperties) {
    return (
        isChannelType(datum) ||
        CalloutProperties.is(datum) ||
        CommentProperties.is(datum) ||
        ShapePointProperties.is(datum)
    );
}

export function hasTextColor(datum?: AnnotationProperties) {
    return isTextType(datum) && !NoteProperties.is(datum);
}

export function hasLineText(datum?: AnnotationProperties): datum is LinePropertiesType | ChannelPropertiesType {
    return (isLineType(datum) || isChannelType(datum)) && isObject(datum.text);
}

export function setDefaults({
    datum,
    defaultColors,
    defaultFontSizes,
    defaultLineStyles,
}: {
    datum: AnnotationProperties;
    defaultColors: Map<AnnotationType, Map<AnnotationOptionsColorPickerType, [string, string, number] | undefined>>;
    defaultFontSizes: Map<TextualAnnotationType, number | undefined>;
    defaultLineStyles: Map<LineAnnotationType | ChannelAnnotationType, AnnotationLineStyle | undefined>;
}) {
    for (const [annotationType, colors] of defaultColors) {
        if (datum.type !== annotationType) {
            continue;
        }

        for (const [colorPickerType, [colorOpacity, color, opacity] = []] of colors) {
            if (colorOpacity && color && opacity != null) {
                setColor(datum, colorPickerType, colorOpacity, color, opacity);
            }
        }
    }

    if (hasFontSize(datum)) {
        for (const [annotationType, size] of defaultFontSizes) {
            if (size) {
                setFontSize(datum, annotationType, size);
            }
        }
    }

    if (hasLineStyle(datum)) {
        for (const [annotationType, style] of defaultLineStyles) {
            if (style) {
                setLineStyle(datum, annotationType, style);
            }
        }
    }
}

export function setFontSize(datum: TextualPropertiesType, annotationType: TextualAnnotationType, fontSize: number) {
    if (datum.type === annotationType && 'fontSize' in datum) {
        datum.fontSize = fontSize;
    }
}

export function setLineStyle(
    datum: LinePropertiesType | ChannelPropertiesType,
    annotationType: LineAnnotationType | ChannelAnnotationType,
    style: AnnotationLineStyle
) {
    if (!(datum.type === annotationType)) {
        return;
    }

    const strokeWidth = style.strokeWidth ?? datum.strokeWidth ?? 1;
    const styleType = getLineStyle(datum.lineDash, style.type ?? datum.lineStyle);
    const computedLineDash = getComputedLineDash(strokeWidth, styleType);

    datum.strokeWidth = strokeWidth;
    datum.computedLineDash = computedLineDash;
    datum.lineStyle = styleType;
    datum.lineCap = styleType === 'dotted' ? 'round' : undefined;
}

export function getLineStyle(lineDash?: PixelSize[], lineStyle?: AnnotationLineStyleType) {
    return lineDash ? 'dashed' : lineStyle ?? 'solid';
}

export function getComputedLineDash(strokeWidth: number, styleType: AnnotationLineStyleType): PixelSize[] {
    switch (styleType) {
        case 'solid':
            return [];
        case 'dashed':
            return [strokeWidth * 4, strokeWidth * 2];
        case 'dotted':
            return [0, strokeWidth * 2];
    }
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
            if ('stroke' in datum && !NoteProperties.is(datum)) datum.stroke = color;
            if ('strokeOpacity' in datum && !NoteProperties.is(datum)) datum.strokeOpacity = opacity;
            if ('axisLabel' in datum) {
                datum.axisLabel.fill = color;
                datum.axisLabel.fillOpacity = opacity;
                datum.axisLabel.stroke = color;
                datum.axisLabel.strokeOpacity = opacity;
            }
            if (NoteProperties.is(datum)) {
                datum.fill = color;
                datum.fillOpacity = opacity;
            }
            break;
        }
        case `text-color`: {
            if ('color' in datum) datum.color = colorOpacity;
            break;
        }
    }
}
