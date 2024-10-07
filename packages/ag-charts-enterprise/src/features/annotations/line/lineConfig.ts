import { AnnotationType } from '../annotationTypes';
import type { AnnotationTypeConfig } from '../annotationsSuperTypes';
import { DragStateMachine } from '../states/dragState';
import { ArrowProperties, LineProperties } from './lineProperties';
import { LineScene } from './lineScene';
import { ArrowStateMachine, LineStateMachine } from './lineState';

export const lineConfig: AnnotationTypeConfig<LineProperties, LineScene> = {
    type: AnnotationType.Line,
    datum: LineProperties,
    scene: LineScene,
    isDatum: LineProperties.is,
    translate: (node, datum, transition, context) => {
        if (LineProperties.is(datum) && LineScene.is(node)) node.translate(datum, transition, context);
    },
    copy: (node, datum, copiedDatum, context) => {
        if (LineProperties.is(datum) && LineProperties.is(copiedDatum) && LineScene.is(node)) {
            return node.copy(datum, copiedDatum, context) as LineProperties;
        }
    },
    update: (node, datum, context) => {
        if (LineProperties.is(datum) && LineScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum, getDatum, getNode }) =>
        new LineStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.Line),
            datum: getDatum(LineProperties.is),
            node: getNode(LineScene.is),
        }),
    dragState: (ctx, { getDatum, getNode }) =>
        new DragStateMachine<LineProperties, LineScene>({
            ...ctx,
            datum: getDatum(LineProperties.is),
            node: getNode(LineScene.is),
        }),
};

export const arrowConfig: AnnotationTypeConfig<ArrowProperties, LineScene> = {
    type: AnnotationType.Arrow,
    datum: ArrowProperties,
    scene: LineScene,
    isDatum: ArrowProperties.is,
    translate: (node, datum, transition, context) => {
        if (LineProperties.is(datum) && LineScene.is(node)) node.translate(datum, transition, context);
    },
    copy: (node, datum, copiedDatum, context) => {
        if (ArrowProperties.is(datum) && ArrowProperties.is(copiedDatum) && LineScene.is(node)) {
            return node.copy(datum, copiedDatum, context) as ArrowProperties;
        }
    },
    update: (node, datum, context) => {
        if (ArrowProperties.is(datum) && LineScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum, getDatum, getNode }) =>
        new ArrowStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.Arrow),
            datum: getDatum(ArrowProperties.is),
            node: getNode(LineScene.is),
        }),
    dragState: (ctx, { getDatum, getNode }) =>
        new DragStateMachine<ArrowProperties, LineScene>({
            ...ctx,
            datum: getDatum(ArrowProperties.is),
            node: getNode(LineScene.is),
        }),
};
