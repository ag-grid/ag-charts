import { AnnotationType } from '../annotationTypes';
import type { AnnotationTypeConfig } from '../annotationsSuperTypes';
import { DragStateMachine } from '../states/dragState';
import { type ParallelChannelDatum, parallelChannelDatum } from './parallelChannelDatum';
import { ParallelChannelScene } from './parallelChannelScene';
import { ParallelChannelStateMachine } from './parallelChannelState';

export const parallelChannelConfig: AnnotationTypeConfig<ParallelChannelDatum, ParallelChannelScene> = {
    scene: ParallelChannelScene,
    translate: (node, datum, transition, context) => {
        if (parallelChannelDatum.is(datum) && ParallelChannelScene.is(node)) {
            node.translate(datum, transition, context);
        }
    },
    copy: (node, datum, copiedDatum, context) => {
        if (parallelChannelDatum.is(datum) && parallelChannelDatum.is(copiedDatum) && ParallelChannelScene.is(node)) {
            return node.copy(datum, copiedDatum, context);
        }
    },
    update: (node, datum, context) => {
        if (parallelChannelDatum.is(datum) && ParallelChannelScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new ParallelChannelStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.ParallelChannel),
        }),
    dragState: (ctx) => new DragStateMachine<ParallelChannelDatum, ParallelChannelScene>(ctx),
};
