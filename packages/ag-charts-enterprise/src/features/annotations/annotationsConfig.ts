import { type AnnotationContext, type AnnotationOptionsColorPickerType, AnnotationType } from './annotationTypes';
import type { AnnotationProperties, AnnotationScene } from './annotationsSuperTypes';
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

export function isTextType(datum: unknown) {
    return (
        CalloutProperties.is(datum) ||
        CommentProperties.is(datum) ||
        NoteProperties.is(datum) ||
        TextProperties.is(datum)
    );
}

export function hasLineColor(datum?: AnnotationProperties) {
    return isLineType(datum) || isChannelType(datum) || CalloutProperties.is(datum);
}

export function hasFillColor(datum?: AnnotationProperties) {
    return (
        isChannelType(datum) || CalloutProperties.is(datum) || CommentProperties.is(datum) || NoteProperties.is(datum)
    );
}

export function hasTextColor(datum?: AnnotationProperties) {
    return isTextType(datum) && !NoteProperties.is(datum);
}

export function colorDatum(
    datum: AnnotationProperties,
    colorPickerType: AnnotationOptionsColorPickerType,
    color: string
) {
    switch (colorPickerType) {
        case `fill-color`: {
            if ('fill' in datum) datum.fill = color;
            if ('background' in datum && !NoteProperties.is(datum)) datum.background.fill = color;
            break;
        }
        case `line-color`: {
            if ('stroke' in datum) datum.stroke = color;
            if ('axisLabel' in datum) {
                datum.axisLabel.fill = color;
                datum.axisLabel.stroke = color;
            }
            break;
        }
        case `text-color`: {
            if ('color' in datum) datum.color = color;
            break;
        }
    }
}
