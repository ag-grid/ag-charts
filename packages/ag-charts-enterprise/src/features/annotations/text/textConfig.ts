import { AnnotationType } from '../annotationTypes';
import type { AnnotationTypeConfig } from '../annotationsSuperTypes';
import { DragStateMachine } from '../states/dragState';
import { type TextDatum, textDatum } from './textDatum';
import { TextScene } from './textScene';
import { TextStateMachine } from './textState';

export const textConfig: AnnotationTypeConfig<TextDatum, TextScene> = {
    type: AnnotationType.Text,
    datum: textDatum,
    scene: TextScene,
    translate: (node, datum, transition, context) => {
        if (textDatum.is(datum) && TextScene.is(node)) node.translate(datum, transition, context);
    },
    copy: (node, datum, copiedDatum, context) => {
        if (textDatum.is(datum) && textDatum.is(copiedDatum) && TextScene.is(node)) {
            return node.copy(datum, copiedDatum, context);
        }
    },
    update: (node, datum, context) => {
        if (textDatum.is(datum) && TextScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new TextStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.Text),
        }),
    dragState: (ctx) => new DragStateMachine<TextDatum, TextScene>(ctx),
};
