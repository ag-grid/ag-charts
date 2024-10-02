import { AnnotationType } from '../annotationTypes';
import type { AnnotationTypeConfig } from '../annotationsSuperTypes';
import { DragStateMachine } from '../states/dragState';
import { TextProperties } from './textProperties';
import { TextScene } from './textScene';
import { TextStateMachine } from './textState';

export const textConfig: AnnotationTypeConfig<TextProperties, TextScene> = {
    type: AnnotationType.Text,
    datum: TextProperties,
    scene: TextScene,
    isDatum: TextProperties.is,
    copy: (node, datum, copiedDatum, context) => {
        if (TextProperties.is(datum) && TextProperties.is(copiedDatum) && TextScene.is(node)) {
            return node.copy(datum, copiedDatum, context);
        }
    },
    update: (node, datum, context) => {
        if (TextProperties.is(datum) && TextScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum, getDatum, getNode }) =>
        new TextStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.Text),
            datum: getDatum(TextProperties.is),
            node: getNode(TextScene.is),
        }),
    dragState: (ctx, { getDatum, getNode }) =>
        new DragStateMachine<TextProperties, TextScene>({
            ...ctx,
            datum: getDatum(TextProperties.is),
            node: getNode(TextScene.is),
        }),
};
