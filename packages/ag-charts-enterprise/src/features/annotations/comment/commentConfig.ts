import { AnnotationType } from '../annotationTypes';
import type { AnnotationTypeConfig } from '../annotationsSuperTypes';
import { DragStateMachine } from '../states/dragState';
import { CommentProperties } from './commentProperties';
import { CommentScene } from './commentScene';
import { CommentStateMachine } from './commentState';

export const commentConfig: AnnotationTypeConfig<CommentProperties, CommentScene> = {
    type: AnnotationType.Comment,
    datum: CommentProperties,
    scene: CommentScene,
    isDatum: CommentProperties.is,
    translate: (node, datum, translation, context) => {
        if (CommentProperties.is(datum) && CommentScene.is(node)) node.translate(datum, translation, context);
    },
    copy: (node, datum, copiedDatum, context) => {
        if (CommentProperties.is(datum) && CommentProperties.is(copiedDatum) && CommentScene.is(node)) {
            return node.copy(datum, copiedDatum, context);
        }
    },
    update: (node, datum, context) => {
        if (CommentProperties.is(datum) && CommentScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum, getDatum, getNode }) =>
        new CommentStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.Comment),
            datum: getDatum(CommentProperties.is),
            node: getNode(CommentScene.is),
        }),
    dragState: (ctx, { getDatum, getNode }) =>
        new DragStateMachine<CommentProperties, CommentScene>({
            ...ctx,
            datum: getDatum(CommentProperties.is),
            node: getNode(CommentScene.is),
        }),
};
