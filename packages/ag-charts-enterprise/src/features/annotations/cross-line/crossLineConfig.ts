import { AnnotationType } from '../annotationTypes';
import type { AnnotationTypeConfig } from '../annotationsSuperTypes';
import { DragStateMachine } from '../states/dragState';
import {
    type HorizontalLineDatum,
    type VerticalLineDatum,
    horizontalLineDatum,
    verticalLineDatum,
} from './crossLineDatum';
import { CrossLineScene } from './crossLineScene';
import { CrossLineStateMachine } from './crossLineState';

export const horizontalLineConfig: AnnotationTypeConfig<HorizontalLineDatum, CrossLineScene> = {
    type: AnnotationType.HorizontalLine,
    datum: horizontalLineDatum,
    scene: CrossLineScene,
    translate: (node, datum, translation, context) => {
        if (horizontalLineDatum.is(datum) && CrossLineScene.is(node)) node.translate(datum, translation, context);
    },
    copy: (node, datum, copiedDatum, context) => {
        if (horizontalLineDatum.is(datum) && horizontalLineDatum.is(copiedDatum) && CrossLineScene.is(node)) {
            return node.copy(datum, copiedDatum, context);
        }
    },
    update: (node, datum, context) => {
        if (horizontalLineDatum.is(datum) && CrossLineScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new CrossLineStateMachine('horizontal', {
            ...ctx,
            create: createDatum(AnnotationType.HorizontalLine),
        }),
    dragState: (ctx) => new DragStateMachine<HorizontalLineDatum, CrossLineScene>(ctx),
};

export const verticalLineConfig: AnnotationTypeConfig<VerticalLineDatum, CrossLineScene> = {
    type: AnnotationType.VerticalLine,
    datum: verticalLineDatum,
    scene: CrossLineScene,
    translate: (node, datum, translation, context) => {
        if (verticalLineDatum.is(datum) && CrossLineScene.is(node)) node.translate(datum, translation, context);
    },
    copy: (node, datum, copiedDatum, context) => {
        if (verticalLineDatum.is(datum) && verticalLineDatum.is(copiedDatum) && CrossLineScene.is(node)) {
            return node.copy(datum, copiedDatum, context);
        }
    },
    update: (node, datum, context) => {
        if (verticalLineDatum.is(datum) && CrossLineScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new CrossLineStateMachine('vertical', {
            ...ctx,
            create: createDatum(AnnotationType.VerticalLine),
        }),
    dragState: (ctx) => new DragStateMachine<VerticalLineDatum, CrossLineScene>(ctx),
};
