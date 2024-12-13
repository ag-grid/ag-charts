import { AnnotationType } from '../annotationTypes';
import type { AnnotationTypeConfig } from '../annotationsSuperTypes';
import { DragStateMachine } from '../states/dragState';
import { FibonacciRetracementTrendBasedProperties } from './fibonacciRetracementTrendBasedProperties';
import { FibonacciRetracementTrendBasedScene } from './fibonacciRetracementTrendBasedScene';
import { FibonacciRetracementTrendBasedStateMachine } from './fibonacciRetracementTrendBasedState';

export const fibonacciRetracementTrendBasedConfig: AnnotationTypeConfig<
    FibonacciRetracementTrendBasedProperties,
    FibonacciRetracementTrendBasedScene
> = {
    type: AnnotationType.FibonacciRetracementTrendBased,
    datum: FibonacciRetracementTrendBasedProperties,
    scene: FibonacciRetracementTrendBasedScene,
    isDatum: FibonacciRetracementTrendBasedProperties.is,
    translate: (node, datum, transition, context) => {
        if (FibonacciRetracementTrendBasedProperties.is(datum) && FibonacciRetracementTrendBasedScene.is(node))
            node.translate(datum, transition, context);
    },
    copy: (node, datum, copiedDatum, context) => {
        if (
            FibonacciRetracementTrendBasedProperties.is(datum) &&
            FibonacciRetracementTrendBasedProperties.is(copiedDatum) &&
            FibonacciRetracementTrendBasedScene.is(node)
        ) {
            return node.copy(datum, copiedDatum, context) as FibonacciRetracementTrendBasedProperties;
        }
    },
    update: (node, datum, context) => {
        if (FibonacciRetracementTrendBasedProperties.is(datum) && FibonacciRetracementTrendBasedScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new FibonacciRetracementTrendBasedStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.FibonacciRetracementTrendBased),
        }),
    dragState: (ctx) =>
        new DragStateMachine<FibonacciRetracementTrendBasedProperties, FibonacciRetracementTrendBasedScene>(ctx),
};
