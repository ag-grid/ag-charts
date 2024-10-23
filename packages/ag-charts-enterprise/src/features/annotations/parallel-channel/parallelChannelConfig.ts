import { AnnotationType } from '../annotationTypes';
import type { AnnotationTypeConfig } from '../annotationsSuperTypes';
import { DragStateMachine } from '../states/dragState';
import { ParallelChannelProperties } from './parallelChannelProperties';
import { ParallelChannelScene } from './parallelChannelScene';
import { ParallelChannelStateMachine } from './parallelChannelState';

export const parallelChannelConfig: AnnotationTypeConfig<ParallelChannelProperties, ParallelChannelScene> = {
    type: AnnotationType.ParallelChannel,
    datum: ParallelChannelProperties,
    scene: ParallelChannelScene,
    isDatum: ParallelChannelProperties.is,
    translate: (node, datum, transition, context) => {
        if (ParallelChannelProperties.is(datum) && ParallelChannelScene.is(node))
            node.translate(datum, transition, context);
    },
    copy: (node, datum, copiedDatum, context) => {
        if (
            ParallelChannelProperties.is(datum) &&
            ParallelChannelProperties.is(copiedDatum) &&
            ParallelChannelScene.is(node)
        ) {
            return node.copy(datum, copiedDatum, context);
        }
    },
    update: (node, datum, context) => {
        if (ParallelChannelProperties.is(datum) && ParallelChannelScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new ParallelChannelStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.ParallelChannel),
        }),
    dragState: (ctx) => new DragStateMachine<ParallelChannelProperties, ParallelChannelScene>(ctx),
};
