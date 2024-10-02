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
    createState: (ctx, { createDatum, getDatum, getNode }) =>
        new ParallelChannelStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.ParallelChannel),
            datum: getDatum(ParallelChannelProperties.is),
            node: getNode(ParallelChannelScene.is),
        }),
    dragState: (ctx, { getDatum, getNode }) =>
        new DragStateMachine<ParallelChannelProperties, ParallelChannelScene>({
            ...ctx,
            datum: getDatum(ParallelChannelProperties.is),
            node: getNode(ParallelChannelScene.is),
        }),
};
