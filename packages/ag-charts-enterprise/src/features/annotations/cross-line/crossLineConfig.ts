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
    copy: (node, datum, copiedDatum, context, offset) => {
        if (HorizontalLineProperties.is(datum) && HorizontalLineProperties.is(copiedDatum) && CrossLineScene.is(node)) {
            return node.copy(datum, copiedDatum, context, offset) as HorizontalLineProperties;
        }
    },
    update: (node, datum, context) => {
        if (HorizontalLineProperties.is(datum) && CrossLineScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum, getNode }) =>
        new CrossLineStateMachine('horizontal', {
            ...ctx,
            create: createDatum(AnnotationType.HorizontalLine),
            node: getNode(CrossLineScene.is),
        }),
    dragState: (ctx, { getDatum, getNode }) =>
        new DragStateMachine<HorizontalLineProperties, CrossLineScene>({
            ...ctx,
            datum: getDatum(HorizontalLineProperties.is),
            node: getNode(CrossLineScene.is),
        }),
};

export const verticalLineConfig: AnnotationTypeConfig<VerticalLineProperties, CrossLineScene> = {
    type: AnnotationType.VerticalLine,
    datum: VerticalLineProperties,
    scene: CrossLineScene,
    isDatum: VerticalLineProperties.is,
    copy: (node, datum, copiedDatum, context, offset) => {
        if (VerticalLineProperties.is(datum) && VerticalLineProperties.is(copiedDatum) && CrossLineScene.is(node)) {
            return node.copy(datum, copiedDatum, context, offset) as VerticalLineProperties;
        }
    },
    update: (node, datum, context) => {
        if (VerticalLineProperties.is(datum) && CrossLineScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum, getNode }) =>
        new CrossLineStateMachine('vertical', {
            ...ctx,
            create: createDatum(AnnotationType.VerticalLine),
            node: getNode(CrossLineScene.is),
        }),
    dragState: (ctx, { getDatum, getNode }) =>
        new DragStateMachine<VerticalLineProperties, CrossLineScene>({
            ...ctx,
            datum: getDatum(VerticalLineProperties.is),
            node: getNode(CrossLineScene.is),
        }),
};
