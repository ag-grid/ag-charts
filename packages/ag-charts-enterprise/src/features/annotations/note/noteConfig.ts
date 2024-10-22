import { AnnotationType } from '../annotationTypes';
import type { AnnotationTypeConfig } from '../annotationsSuperTypes';
import { DragStateMachine } from '../states/dragState';
import { NoteProperties } from './noteProperties';
import { NoteScene } from './noteScene';
import { NoteStateMachine } from './noteState';

export const noteConfig: AnnotationTypeConfig<NoteProperties, NoteScene> = {
    type: AnnotationType.Note,
    datum: NoteProperties,
    scene: NoteScene,
    isDatum: NoteProperties.is,
    translate: (node, datum, transition, context) => {
        if (NoteProperties.is(datum) && NoteScene.is(node)) node.translate(datum, transition, context);
    },
    copy: (node, datum, copiedDatum, context) => {
        if (NoteProperties.is(datum) && NoteProperties.is(copiedDatum) && NoteScene.is(node)) {
            return node.copy(datum, copiedDatum, context);
        }
    },
    update: (node, datum, context) => {
        if (NoteProperties.is(datum) && NoteScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new NoteStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.Note),
        }),
    dragState: (ctx) => new DragStateMachine<NoteProperties, NoteScene>(ctx),
};
