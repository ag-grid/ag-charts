import { AnnotationType } from '../annotationTypes';
import type { AnnotationTypeConfig } from '../annotationsSuperTypes';
import { DragStateMachine } from '../states/dragState';
import { type DisjointChannelDatum, disjointChannelDatum } from './disjointChannelDatum';
import { DisjointChannelScene } from './disjointChannelScene';
import { DisjointChannelStateMachine } from './disjointChannelState';

export const disjointChannelConfig: AnnotationTypeConfig<DisjointChannelDatum, DisjointChannelScene> = {
    type: AnnotationType.DisjointChannel,
    datum: disjointChannelDatum,
    scene: DisjointChannelScene,
    translate: (node, datum, transition, context) => {
        if (disjointChannelDatum.is(datum) && DisjointChannelScene.is(node)) {
            node.translate(datum, transition, context);
        }
    },
    copy: (node, datum, copiedDatum, context) => {
        if (disjointChannelDatum.is(datum) && disjointChannelDatum.is(copiedDatum) && DisjointChannelScene.is(node)) {
            return node.copy(datum, copiedDatum, context);
        }
    },
    update: (node, datum, context) => {
        if (disjointChannelDatum.is(datum) && DisjointChannelScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new DisjointChannelStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.DisjointChannel),
        }),
    dragState: (ctx) => new DragStateMachine<DisjointChannelDatum, DisjointChannelScene>(ctx),
};
