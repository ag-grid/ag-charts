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
    copy: (node, datum, copiedDatum, context, offset) => {
        if (NoteProperties.is(datum) && NoteProperties.is(copiedDatum) && NoteScene.is(node)) {
            return node.copy(datum, copiedDatum, context, offset);
        }
    },
    update: (node, datum, context) => {
        if (NoteProperties.is(datum) && NoteScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum, getDatum, getNode }) =>
        new NoteStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.Note),
            datum: getDatum(NoteProperties.is),
            node: getNode(NoteScene.is),
        }),
    dragState: (ctx, { getDatum, getNode }) =>
        new DragStateMachine<NoteProperties, NoteScene>({
            ...ctx,
            datum: getDatum(NoteProperties.is),
            node: getNode(NoteScene.is),
        }),
};
