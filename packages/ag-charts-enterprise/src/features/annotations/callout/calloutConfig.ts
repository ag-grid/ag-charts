import { AnnotationType } from '../annotationTypes';
import type { AnnotationTypeConfig } from '../annotationsSuperTypes';
import { DragStateMachine } from '../states/dragState';
import { type CalloutDatum, calloutDatum } from './calloutDatum';
import { CalloutScene } from './calloutScene';
import { CalloutStateMachine } from './calloutState';

export const calloutConfig: AnnotationTypeConfig<CalloutDatum, CalloutScene> = {
    scene: CalloutScene,
    translate: (node, datum, transition, context) => {
        if (calloutDatum.is(datum) && CalloutScene.is(node)) return node.translate(datum, transition, context);
    },
    copy: (node, datum, copiedDatum, context) => {
        if (calloutDatum.is(datum) && calloutDatum.is(copiedDatum) && CalloutScene.is(node)) {
            return node.copy(datum, copiedDatum, context);
        }
    },
    update: (node, datum, context) => {
        if (calloutDatum.is(datum) && CalloutScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new CalloutStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.Callout),
        }),
    dragState: (ctx) => new DragStateMachine<CalloutDatum, CalloutScene>(ctx),
};
