import { AnnotationType } from '../annotationTypes';
import type { AnnotationTypeConfig } from '../annotationsSuperTypes';
import { DragStateMachine } from '../states/dragState';
import { type CommentDatum, commentDatum } from './commentDatum';
import { CommentScene } from './commentScene';
import { CommentStateMachine } from './commentState';

export const commentConfig: AnnotationTypeConfig<CommentDatum, CommentScene> = {
    type: AnnotationType.Comment,
    datum: commentDatum,
    scene: CommentScene,
    translate: (node, datum, translation, context) => {
        if (commentDatum.is(datum) && CommentScene.is(node)) node.translate(datum, translation, context);
    },
    copy: (node, datum, copiedDatum, context) => {
        if (commentDatum.is(datum) && commentDatum.is(copiedDatum) && CommentScene.is(node)) {
            return node.copy(datum, copiedDatum, context);
        }
    },
    update: (node, datum, context) => {
        if (commentDatum.is(datum) && CommentScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new CommentStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.Comment),
        }),
    dragState: (ctx) => new DragStateMachine<CommentDatum, CommentScene>(ctx),
};
