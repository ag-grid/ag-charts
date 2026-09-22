import { AnnotationType } from '../annotationTypes';
import type { AnnotationTypeConfig } from '../annotationsSuperTypes';
import { DragStateMachine } from '../states/dragState';
import {
    type FibonacciRetracementTrendBasedDatum,
    fibonacciRetracementTrendBasedDatum,
} from './fibonacciRetracementTrendBasedDatum';
import { FibonacciRetracementTrendBasedScene } from './fibonacciRetracementTrendBasedScene';
import { FibonacciRetracementTrendBasedStateMachine } from './fibonacciRetracementTrendBasedState';

export const fibonacciRetracementTrendBasedConfig: AnnotationTypeConfig<
    FibonacciRetracementTrendBasedDatum,
    FibonacciRetracementTrendBasedScene
> = {
    type: AnnotationType.FibonacciRetracementTrendBased,
    datum: fibonacciRetracementTrendBasedDatum,
    scene: FibonacciRetracementTrendBasedScene,
    translate: (node, datum, transition, context) => {
        if (fibonacciRetracementTrendBasedDatum.is(datum) && FibonacciRetracementTrendBasedScene.is(node))
            node.translate(datum, transition, context);
    },
    copy: (node, datum, copiedDatum, context) => {
        if (
            fibonacciRetracementTrendBasedDatum.is(datum) &&
            fibonacciRetracementTrendBasedDatum.is(copiedDatum) &&
            FibonacciRetracementTrendBasedScene.is(node)
        ) {
            return node.copy(datum, copiedDatum, context);
        }
    },
    update: (node, datum, context) => {
        if (fibonacciRetracementTrendBasedDatum.is(datum) && FibonacciRetracementTrendBasedScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum }) =>
        new FibonacciRetracementTrendBasedStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.FibonacciRetracementTrendBased),
        }),
    dragState: (ctx) =>
        new DragStateMachine<FibonacciRetracementTrendBasedDatum, FibonacciRetracementTrendBasedScene>(ctx),
};
