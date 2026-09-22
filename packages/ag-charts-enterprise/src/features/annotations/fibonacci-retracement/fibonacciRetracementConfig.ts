import { AnnotationType } from '../annotationTypes';
import type { AnnotationTypeConfig } from '../annotationsSuperTypes';
import { DragStateMachine } from '../states/dragState';
import { type FibonacciRetracementDatum, fibonacciRetracementDatum } from './fibonacciRetracementDatum';
import { FibonacciRetracementScene } from './fibonacciRetracementScene';
import { FibonacciRetracementStateMachine } from './fibonacciRetracementState';

export const fibonacciRetracementConfig: AnnotationTypeConfig<FibonacciRetracementDatum, FibonacciRetracementScene> = {
    type: AnnotationType.FibonacciRetracement,
    datum: fibonacciRetracementDatum,
    scene: FibonacciRetracementScene,
    translate: (node, datum, transition, context) => {
        if (fibonacciRetracementDatum.is(datum) && FibonacciRetracementScene.is(node))
            node.translate(datum, transition, context);
    },
    copy: (node, datum, copiedDatum, context) => {
        if (
            fibonacciRetracementDatum.is(datum) &&
            fibonacciRetracementDatum.is(copiedDatum) &&
            FibonacciRetracementScene.is(node)
        ) {
            return node.copy(datum, copiedDatum, context);
        }
    },
    update: (node, datum, context) => {
        if (fibonacciRetracementDatum.is(datum) && FibonacciRetracementScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new FibonacciRetracementStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.FibonacciRetracement),
        }),
    dragState: (ctx) => new DragStateMachine<FibonacciRetracementDatum, FibonacciRetracementScene>(ctx),
};
