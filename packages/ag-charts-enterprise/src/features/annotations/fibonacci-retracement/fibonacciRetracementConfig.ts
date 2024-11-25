import { AnnotationType } from '../annotationTypes';
import type { AnnotationTypeConfig } from '../annotationsSuperTypes';
import { DragStateMachine } from '../states/dragState';
import { FibonacciRetracementProperties } from './fibonacciRetracementProperties';
import { FibonacciRetracementScene } from './fibonacciRetracementScene';
import { FibonacciRetracementStateMachine } from './fibonacciRetracementState';

export const fibonacciRetracementConfig: AnnotationTypeConfig<
    FibonacciRetracementProperties,
    FibonacciRetracementScene
> = {
    type: AnnotationType.FibonacciRetracement,
    datum: FibonacciRetracementProperties,
    scene: FibonacciRetracementScene,
    isDatum: FibonacciRetracementProperties.is,
    translate: (node, datum, transition, context) => {
        if (FibonacciRetracementProperties.is(datum) && FibonacciRetracementScene.is(node))
            node.translate(datum, transition, context);
    },
    copy: (node, datum, copiedDatum, context) => {
        if (
            FibonacciRetracementProperties.is(datum) &&
            FibonacciRetracementProperties.is(copiedDatum) &&
            FibonacciRetracementScene.is(node)
        ) {
            return node.copy(datum, copiedDatum, context) as FibonacciRetracementProperties;
        }
    },
    update: (node, datum, context) => {
        if (FibonacciRetracementProperties.is(datum) && FibonacciRetracementScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new FibonacciRetracementStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.FibonacciRetracement),
        }),
    dragState: (ctx) => new DragStateMachine<FibonacciRetracementProperties, FibonacciRetracementScene>(ctx),
};
