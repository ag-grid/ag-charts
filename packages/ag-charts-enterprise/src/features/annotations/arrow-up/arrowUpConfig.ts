import { AnnotationType } from '../annotationTypes';
import type { AnnotationTypeConfig } from '../annotationsSuperTypes';
import { DragStateMachine } from '../states/dragState';
import { type ArrowUpDatum, arrowUpDatum } from './arrowUpDatum';
import { ArrowUpScene } from './arrowUpScene';
import { ArrowUpStateMachine } from './arrowUpState';

export const arrowUpConfig: AnnotationTypeConfig<ArrowUpDatum, ArrowUpScene> = {
    type: AnnotationType.ArrowUp,
    datum: arrowUpDatum,
    scene: ArrowUpScene,
    translate: (node, datum, translation, context) => {
        if (arrowUpDatum.is(datum) && ArrowUpScene.is(node)) node.translate(datum, translation, context);
    },
    copy: (node, datum, copiedDatum, context) => {
        if (arrowUpDatum.is(datum) && arrowUpDatum.is(copiedDatum) && ArrowUpScene.is(node)) {
            return node.copy(datum, copiedDatum, context);
        }
    },
    update: (node, datum, context) => {
        if (arrowUpDatum.is(datum) && ArrowUpScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new ArrowUpStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.ArrowUp),
        }),
    dragState: (ctx) => new DragStateMachine<ArrowUpDatum, ArrowUpScene>(ctx),
};
