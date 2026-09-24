import { AnnotationType } from '../annotationTypes';
import type { AnnotationTypeConfig } from '../annotationsSuperTypes';
import { DragStateMachine } from '../states/dragState';
import { type ArrowDownDatum, arrowDownDatum } from './arrowDownDatum';
import { ArrowDownScene } from './arrowDownScene';
import { ArrowDownStateMachine } from './arrowDownState';

export const arrowDownConfig: AnnotationTypeConfig<ArrowDownDatum, ArrowDownScene> = {
    scene: ArrowDownScene,
    translate: (node, datum, translation, context) => {
        if (arrowDownDatum.is(datum) && ArrowDownScene.is(node)) node.translate(datum, translation, context);
    },
    copy: (node, datum, copiedDatum, context) => {
        if (arrowDownDatum.is(datum) && arrowDownDatum.is(copiedDatum) && ArrowDownScene.is(node)) {
            return node.copy(datum, copiedDatum, context);
        }
    },
    update: (node, datum, context) => {
        if (arrowDownDatum.is(datum) && ArrowDownScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new ArrowDownStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.ArrowDown),
        }),
    dragState: (ctx) => new DragStateMachine<ArrowDownDatum, ArrowDownScene>(ctx),
};
