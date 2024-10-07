import { AnnotationType } from '../annotationTypes';
import type { AnnotationTypeConfig } from '../annotationsSuperTypes';
import { DragStateMachine } from '../states/dragState';
import { CalloutProperties } from './calloutProperties';
import { CalloutScene } from './calloutScene';
import { CalloutStateMachine } from './calloutState';

export const calloutConfig: AnnotationTypeConfig<CalloutProperties, CalloutScene> = {
    type: AnnotationType.Callout,
    datum: CalloutProperties,
    scene: CalloutScene,
    isDatum: CalloutProperties.is,
    translate: (node, datum, transition, context) => {
        if (CalloutProperties.is(datum) && CalloutScene.is(node)) return node.translate(datum, transition, context);
    },
    copy: (node, datum, copiedDatum, context) => {
        if (CalloutProperties.is(datum) && CalloutProperties.is(copiedDatum) && CalloutScene.is(node)) {
            return node.copy(datum, copiedDatum, context);
        }
    },
    update: (node, datum, context) => {
        if (CalloutProperties.is(datum) && CalloutScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum, getDatum, getNode }) =>
        new CalloutStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.Callout),
            datum: getDatum(CalloutProperties.is),
            node: getNode(CalloutScene.is),
        }),
    dragState: (ctx, { getDatum, getNode }) =>
        new DragStateMachine<CalloutProperties, CalloutScene>({
            ...ctx,
            datum: getDatum(CalloutProperties.is),
            node: getNode(CalloutScene.is),
        }),
};
