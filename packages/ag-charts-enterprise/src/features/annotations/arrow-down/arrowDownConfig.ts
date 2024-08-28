import { AnnotationType } from '../annotationTypes';
import type { AnnotationTypeConfig } from '../annotationsSuperTypes';
import { DragStateMachine } from '../states/dragState';
import { ArrowDownProperties } from './arrowDownProperties';
import { ArrowDownScene } from './arrowDownScene';
import { ArrowDownStateMachine } from './arrowDownState';

export const arrowDownConfig: AnnotationTypeConfig<ArrowDownProperties, ArrowDownScene> = {
    type: AnnotationType.ArrowDown,
    datum: ArrowDownProperties,
    scene: ArrowDownScene,
    isDatum: ArrowDownProperties.is,
    update: (node, datum, context) => {
        if (ArrowDownProperties.is(datum) && ArrowDownScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum, getNode }) =>
        new ArrowDownStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.ArrowDown),
            node: getNode(ArrowDownScene.is),
        }),
    dragState: (ctx, { getDatum, getNode }) =>
        new DragStateMachine<ArrowDownProperties, ArrowDownScene>({
            ...ctx,
            datum: getDatum(ArrowDownProperties.is),
            node: getNode(ArrowDownScene.is),
        }),
};
