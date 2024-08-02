import { _ModuleSupport } from 'ag-charts-community';

import {
    type AnnotationContext,
    type AnnotationOptionsColorPickerType,
    AnnotationType,
    TextualAnnotationType,
} from './annotationTypes';
import type { AnnotationProperties, AnnotationScene, TextualPropertiesType } from './annotationsSuperTypes';
import { CalloutProperties } from './callout/calloutProperties';
import { CalloutScene } from './callout/calloutScene';
import { CommentProperties } from './comment/commentProperties';
import { CommentScene } from './comment/commentScene';
import { HorizontalLineProperties, VerticalLineProperties } from './cross-line/crossLineProperties';
import { CrossLineScene } from './cross-line/crossLineScene';
import { DisjointChannelProperties } from './disjoint-channel/disjointChannelProperties';
import { DisjointChannelScene } from './disjoint-channel/disjointChannelScene';
import { LineProperties } from './line/lineProperties';
import { LineScene } from './line/lineScene';
import { NoteProperties } from './note/noteProperties';
import { NoteScene } from './note/noteScene';
import { ParallelChannelProperties } from './parallel-channel/parallelChannelProperties';
import { ParallelChannelScene } from './parallel-channel/parallelChannelScene';
import { TextProperties } from './text/textProperties';
import { TextScene } from './text/textScene';

type Constructor<T = {}> = new (...args: any[]) => T;

export const annotationDatums: Record<AnnotationType, Constructor<AnnotationProperties>> = {
    // Lines
    [AnnotationType.Line]: LineProperties,
    [AnnotationType.HorizontalLine]: HorizontalLineProperties,
    [AnnotationType.VerticalLine]: VerticalLineProperties,

    // Channels
    [AnnotationType.ParallelChannel]: ParallelChannelProperties,
    [AnnotationType.DisjointChannel]: DisjointChannelProperties,

    // Texts
    [AnnotationType.Callout]: CalloutProperties,
    [AnnotationType.Comment]: CommentProperties,
    [AnnotationType.Note]: NoteProperties,
    [AnnotationType.Text]: TextProperties,
};

export const annotationScenes: Record<AnnotationType, Constructor<AnnotationScene>> = {
    // Lines
    [AnnotationType.Line]: LineScene,
    [AnnotationType.HorizontalLine]: CrossLineScene,
    [AnnotationType.VerticalLine]: CrossLineScene,

    // Channels
    [AnnotationType.DisjointChannel]: DisjointChannelScene,
    [AnnotationType.ParallelChannel]: ParallelChannelScene,

    // Texts
    [AnnotationType.Callout]: CalloutScene,
    [AnnotationType.Comment]: CommentScene,
    [AnnotationType.Note]: NoteScene,
    [AnnotationType.Text]: TextScene,
};

export function updateAnnotation(node: AnnotationScene, datum: AnnotationProperties, context: AnnotationContext) {
    // Lines
    if (LineProperties.is(datum) && LineScene.is(node)) {
        node.update(datum, context);
    }

    if ((HorizontalLineProperties.is(datum) || VerticalLineProperties.is(datum)) && CrossLineScene.is(node)) {
        node.update(datum, context);
    }

    // Channels
    if (DisjointChannelProperties.is(datum) && DisjointChannelScene.is(node)) {
        node.update(datum, context);
    }

    if (ParallelChannelProperties.is(datum) && ParallelChannelScene.is(node)) {
        node.update(datum, context);
    }

    // Texts
    if (CalloutProperties.is(datum) && CalloutScene.is(node)) {
        node.update(datum, context);
    }

    if (CommentProperties.is(datum) && CommentScene.is(node)) {
        node.update(datum, context);
    }

    if (NoteProperties.is(datum) && NoteScene.is(node)) {
        node.update(datum, context);
    }

    if (TextProperties.is(datum) && TextScene.is(node)) {
        node.update(datum, context);
    }
}

export function getTypedDatum(datum: unknown) {
    if (
        // Lines
        LineProperties.is(datum) ||
        HorizontalLineProperties.is(datum) ||
        VerticalLineProperties.is(datum) ||
        // Channels
        DisjointChannelProperties.is(datum) ||
        ParallelChannelProperties.is(datum) ||
        // Texts
        CalloutProperties.is(datum) ||
        CommentProperties.is(datum) ||
        NoteProperties.is(datum) ||
        TextProperties.is(datum)
    ) {
        return datum;
    }
}

export function isLineType(datum: unknown) {
    return LineProperties.is(datum) || HorizontalLineProperties.is(datum) || VerticalLineProperties.is(datum);
}

export function isChannelType(datum: unknown) {
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

export function hasFontSize(datum?: AnnotationProperties) {
    return isTextType(datum) && !NoteProperties.is(datum);
}

export function hasLineColor(datum?: AnnotationProperties) {
    return isLineType(datum) || isChannelType(datum) || CalloutProperties.is(datum) || NoteProperties.is(datum);
}

export function hasFillColor(datum?: AnnotationProperties) {
    return isChannelType(datum) || CalloutProperties.is(datum) || CommentProperties.is(datum);
}

export function hasTextColor(datum?: AnnotationProperties) {
    return isTextType(datum) && !NoteProperties.is(datum);
}
export function setDefaults({
    datum,
    defaultColors,
    defaultFontSizes,
}: {
    datum: AnnotationProperties;
    defaultColors: Map<
        AnnotationType | TextualAnnotationType,
        Map<AnnotationOptionsColorPickerType, [string, string, number] | undefined>
    >;
    defaultFontSizes: Map<TextualAnnotationType, number | undefined>;
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

    if (!isTextType(datum)) {
        return;
    }

    for (const [annotationType, size] of defaultFontSizes) {
        if (size) {
            setFontsize(datum, annotationType, size);
        }
    }
}

export function setFontsize(datum: TextualPropertiesType, annotationType: TextualAnnotationType, fontSize: number) {
    if (datum.type === annotationType && 'fontSize' in datum) {
        datum.fontSize = fontSize;
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
