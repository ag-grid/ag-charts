import { AnnotationType } from '../annotationTypes';
import type { AnnotationTypeConfig } from '../annotationsSuperTypes';
import { DragStateMachine } from '../states/dragState';
import { type ArrowDatum, type LineDatum, arrowDatum, lineDatum } from './lineDatum';
import { LineScene } from './lineScene';
import { ArrowStateMachine, LineStateMachine } from './lineState';

export const lineConfig: AnnotationTypeConfig<LineDatum, LineScene> = {
    scene: LineScene,
    translate: (node, datum, transition, context) => {
        if (lineDatum.is(datum) && LineScene.is(node)) node.translate(datum, transition, context);
    },
    copy: (node, datum, copiedDatum, context) => {
        if (lineDatum.is(datum) && lineDatum.is(copiedDatum) && LineScene.is(node)) {
            return node.copy(datum, copiedDatum, context);
        }
    },
    update: (node, datum, context) => {
        if (lineDatum.is(datum) && LineScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new LineStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.Line),
        }),
    dragState: (ctx) => new DragStateMachine<LineDatum, LineScene>(ctx),
};

export const arrowConfig: AnnotationTypeConfig<ArrowDatum, LineScene> = {
    scene: LineScene,
    translate: (node, datum, transition, context) => {
        if (arrowDatum.is(datum) && LineScene.is(node)) node.translate(datum, transition, context);
    },
    copy: (node, datum, copiedDatum, context) => {
        if (arrowDatum.is(datum) && arrowDatum.is(copiedDatum) && LineScene.is(node)) {
            return node.copy(datum, copiedDatum, context);
        }
    },
    update: (node, datum, context) => {
        if (arrowDatum.is(datum) && LineScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new ArrowStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.Arrow),
        }),
    dragState: (ctx) => new DragStateMachine<ArrowDatum, LineScene>(ctx),
};
