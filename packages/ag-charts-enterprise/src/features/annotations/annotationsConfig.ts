import type { _Util } from 'ag-charts-community';

import type { TextInput } from '../text-input/textInput';
import { type AnnotationContext, AnnotationType } from './annotationTypes';
import type { AnnotationProperties } from './annotationsSuperTypes';
import { HorizontalLineProperties, VerticalLineProperties } from './cross-line/crossLineProperties';
import { CrossLineScene } from './cross-line/crossLineScene';
import { DisjointChannelProperties } from './disjoint-channel/disjointChannelProperties';
import { DisjointChannelScene } from './disjoint-channel/disjointChannelScene';
import { LineProperties } from './line/lineProperties';
import { LineScene } from './line/lineScene';
import { ParallelChannelProperties } from './parallel-channel/parallelChannelProperties';
import { ParallelChannelScene } from './parallel-channel/parallelChannelScene';
import type { AnnotationScene } from './scenes/annotationScene';
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
    [AnnotationType.Text]: TextScene,
};

export function updateAnnotation(
    node: AnnotationScene,
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

export function colorDatum(datum: AnnotationProperties, color: string) {
    if ('stroke' in datum) datum.stroke = color;

    if ('axisLabel' in datum) {
        datum.axisLabel.fill = color;
        datum.axisLabel.stroke = color;
    }

    if ('background' in datum) datum.background.fill = color;
}
