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
    createState: (ctx, { createDatum, getDatum, getNode }) =>
        new DisjointChannelStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.DisjointChannel),
            datum: getDatum(DisjointChannelProperties.is),
            node: getNode(DisjointChannelScene.is),
        }),
    dragState: (ctx, { getDatum, getNode }) =>
        new DragStateMachine<DisjointChannelProperties, DisjointChannelScene>({
            ...ctx,
            datum: getDatum(DisjointChannelProperties.is),
            node: getNode(DisjointChannelScene.is),
        }),
};
