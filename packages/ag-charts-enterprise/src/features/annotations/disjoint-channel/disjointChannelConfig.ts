import { AnnotationType } from '../annotationTypes';
import type { AnnotationTypeConfig } from '../annotationsSuperTypes';
import { DragStateMachine } from '../states/dragState';
import { DisjointChannelProperties } from './disjointChannelProperties';
import { DisjointChannelScene } from './disjointChannelScene';
import { DisjointChannelStateMachine } from './disjointChannelState';

export const disjointChannelConfig: AnnotationTypeConfig<DisjointChannelProperties, DisjointChannelScene> = {
    type: AnnotationType.DisjointChannel,
    datum: DisjointChannelProperties,
    scene: DisjointChannelScene,
    isDatum: DisjointChannelProperties.is,
    translate: (node, datum, transition, context) => {
        if (DisjointChannelProperties.is(datum) && DisjointChannelScene.is(node))
            node.translate(datum, transition, context);
    },
    copy: (node, datum, copiedDatum, context) => {
        if (
            DisjointChannelProperties.is(datum) &&
            DisjointChannelProperties.is(copiedDatum) &&
            DisjointChannelScene.is(node)
        ) {
            return node.copy(datum, copiedDatum, context);
        }
    },
    update: (node, datum, context) => {
        if (DisjointChannelProperties.is(datum) && DisjointChannelScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new DisjointChannelStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.DisjointChannel),
        }),
    dragState: (ctx) => new DragStateMachine<DisjointChannelProperties, DisjointChannelScene>(ctx),
};
