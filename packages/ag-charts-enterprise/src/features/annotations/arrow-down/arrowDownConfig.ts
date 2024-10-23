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
    translate: (node, datum, translation, context) => {
        if (ArrowDownProperties.is(datum) && ArrowDownScene.is(node)) node.translate(datum, translation, context);
    },
    copy: (node, datum, copiedDatum, context) => {
        if (ArrowDownProperties.is(datum) && ArrowDownProperties.is(copiedDatum) && ArrowDownScene.is(node)) {
            return node.copy(datum, copiedDatum, context);
        }
    },
    update: (node, datum, context) => {
        if (ArrowDownProperties.is(datum) && ArrowDownScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new ArrowDownStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.ArrowDown),
        }),
    dragState: (ctx) => new DragStateMachine<ArrowDownProperties, ArrowDownScene>(ctx),
};
