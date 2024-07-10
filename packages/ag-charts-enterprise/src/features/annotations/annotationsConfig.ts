import type { _Util } from 'ag-charts-community';

import type { TextInput } from '../text-input/textInput';
import { type AnnotationContext, AnnotationType } from './annotationTypes';
import { HorizontalLineProperties, VerticalLineProperties } from './cross-line/crossLineProperties';
import { CrossLineScene } from './cross-line/crossLineScene';
import { DisjointChannelProperties } from './disjoint-channel/disjointChannelProperties';
import { DisjointChannelScene } from './disjoint-channel/disjointChannelScene';
import { LineProperties } from './line/lineProperties';
import { LineScene } from './line/lineScene';
import { ParallelChannelProperties } from './parallel-channel/parallelChannelProperties';
import { ParallelChannelScene } from './parallel-channel/parallelChannelScene';
import type { Annotation } from './scenes/annotationScene';
import { TextProperties } from './text/textProperties';
import { TextScene } from './text/textScene';

type Constructor<T = {}> = new (...args: any[]) => T;

export type AnnotationProperties =
    | LineProperties
    | HorizontalLineProperties
    | VerticalLineProperties
    | ParallelChannelProperties
    | DisjointChannelProperties
    | TextProperties;

export const annotationDatums: Record<AnnotationType, Constructor<AnnotationProperties>> = {
    // Lines
    [AnnotationType.Line]: LineProperties,
    [AnnotationType.HorizontalLine]: HorizontalLineProperties,
    [AnnotationType.VerticalLine]: VerticalLineProperties,

    // Channels
    [AnnotationType.ParallelChannel]: ParallelChannelProperties,
    [AnnotationType.DisjointChannel]: DisjointChannelProperties,

    // Texts
    [AnnotationType.Text]: TextProperties,
};

export const annotationScenes: Record<AnnotationType, Constructor<Annotation>> = {
    // Lines
    [AnnotationType.Line]: LineScene,
    [AnnotationType.HorizontalLine]: CrossLineScene,
    [AnnotationType.VerticalLine]: CrossLineScene,

    // Channels
    [AnnotationType.DisjointChannel]: DisjointChannelScene,
    [AnnotationType.ParallelChannel]: ParallelChannelScene,

    // Texts
    [AnnotationType.Text]: TextScene,
};

export function updateAnnotation(
    node: Annotation,
    datum: AnnotationProperties,
    context: AnnotationContext,
    isActive: boolean,
    textInput: TextInput
) {
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
    if (TextProperties.is(datum) && TextScene.is(node)) {
        node.update(datum, context);

        if (isActive) {
            // TODO: remove this from here
            textInput.setLayout({
                bbox: node.getTextRect(),
                position: datum.position,
                alignment: datum.alignment,
            });
        }
    }
}

export function dragStartAnnotation(
    node: Annotation,
    datum: AnnotationProperties,
    context: AnnotationContext,
    offset: _Util.Vec2
) {
    // Lines
    if (LineProperties.is(datum) && LineScene.is(node)) {
        node.dragStart(datum, offset, context);
    }

    if ((HorizontalLineProperties.is(datum) || VerticalLineProperties.is(datum)) && CrossLineScene.is(node)) {
        node.dragStart(datum, offset, context);
    }

    // Channels
    if (DisjointChannelProperties.is(datum) && DisjointChannelScene.is(node)) {
        node.dragStart(datum, offset, context);
    }

    if (ParallelChannelProperties.is(datum) && ParallelChannelScene.is(node)) {
        node.dragStart(datum, offset, context);
    }

    // Texts
    // ...
}

export function dragAnnotation(
    node: Annotation,
    datum: AnnotationProperties,
    context: AnnotationContext,
    offset: _Util.Vec2,
    onDragInvalid: () => void
) {
    // Lines
    if (LineProperties.is(datum) && LineScene.is(node)) {
        node.drag(datum, offset, context, onDragInvalid);
    }

    if ((HorizontalLineProperties.is(datum) || VerticalLineProperties.is(datum)) && CrossLineScene.is(node)) {
        node.drag(datum, offset, context, onDragInvalid);
    }

    // Channels
    if (DisjointChannelProperties.is(datum) && DisjointChannelScene.is(node)) {
        node.drag(datum, offset, context, onDragInvalid);
    }

    if (ParallelChannelProperties.is(datum) && ParallelChannelScene.is(node)) {
        node.drag(datum, offset, context, onDragInvalid);
    }

    // Texts
    if (TextProperties.is(datum) && TextScene.is(node)) {
        node.drag(datum, offset, context, onDragInvalid);
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
        TextProperties.is(datum)
    ) {
        return datum;
    }
}
