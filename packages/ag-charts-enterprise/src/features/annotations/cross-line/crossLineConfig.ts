import { AnnotationType } from '../annotationTypes';
import type { AnnotationTypeConfig } from '../annotationsSuperTypes';
import { DragStateMachine } from '../states/dragState';
import { HorizontalLineProperties, VerticalLineProperties } from './crossLineProperties';
import { CrossLineScene } from './crossLineScene';
import { CrossLineStateMachine } from './crossLineState';

export const horizontalLineConfig: AnnotationTypeConfig<HorizontalLineProperties, CrossLineScene> = {
    type: AnnotationType.HorizontalLine,
    datum: HorizontalLineProperties,
    scene: CrossLineScene,
    isDatum: HorizontalLineProperties.is,
    translate: (node, datum, translation, context) => {
        if (HorizontalLineProperties.is(datum) && CrossLineScene.is(node)) node.translate(datum, translation, context);
    },
    copy: (node, datum, copiedDatum, context) => {
        if (HorizontalLineProperties.is(datum) && HorizontalLineProperties.is(copiedDatum) && CrossLineScene.is(node)) {
            return node.copy(datum, copiedDatum, context) as HorizontalLineProperties;
        }
    },
    update: (node, datum, context) => {
        if (HorizontalLineProperties.is(datum) && CrossLineScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new CrossLineStateMachine('horizontal', {
            ...ctx,
            create: createDatum(AnnotationType.HorizontalLine),
        }),
    dragState: (ctx) => new DragStateMachine<HorizontalLineProperties, CrossLineScene>(ctx),
};

export const verticalLineConfig: AnnotationTypeConfig<VerticalLineProperties, CrossLineScene> = {
    type: AnnotationType.VerticalLine,
    datum: VerticalLineProperties,
    scene: CrossLineScene,
    isDatum: VerticalLineProperties.is,
    translate: (node, datum, translation, context) => {
        if (VerticalLineProperties.is(datum) && CrossLineScene.is(node)) node.translate(datum, translation, context);
    },
    copy: (node, datum, copiedDatum, context) => {
        if (VerticalLineProperties.is(datum) && VerticalLineProperties.is(copiedDatum) && CrossLineScene.is(node)) {
            return node.copy(datum, copiedDatum, context) as VerticalLineProperties;
        }
    },
    update: (node, datum, context) => {
        if (VerticalLineProperties.is(datum) && CrossLineScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new CrossLineStateMachine('vertical', {
            ...ctx,
            create: createDatum(AnnotationType.VerticalLine),
        }),
    dragState: (ctx) => new DragStateMachine<VerticalLineProperties, CrossLineScene>(ctx),
};
