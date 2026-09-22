import { AnnotationType } from '../annotationTypes';
import type { AnnotationTypeConfig } from '../annotationsSuperTypes';
import { DragStateMachine } from '../states/dragState';
import { type NoteDatum, noteDatum } from './noteDatum';
import { NoteScene } from './noteScene';
import { NoteStateMachine } from './noteState';

export const noteConfig: AnnotationTypeConfig<NoteDatum, NoteScene> = {
    type: AnnotationType.Note,
    datum: noteDatum,
    scene: NoteScene,
    translate: (node, datum, transition, context) => {
        if (noteDatum.is(datum) && NoteScene.is(node)) node.translate(datum, transition, context);
    },
    copy: (node, datum, copiedDatum, context) => {
        if (noteDatum.is(datum) && noteDatum.is(copiedDatum) && NoteScene.is(node)) {
            return node.copy(datum, copiedDatum, context);
        }
    },
    update: (node, datum, context) => {
        if (noteDatum.is(datum) && NoteScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new NoteStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.Note),
        }),
    dragState: (ctx) => new DragStateMachine<NoteDatum, NoteScene>(ctx),
};
