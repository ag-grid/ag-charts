import { defineAnnotationDatum } from '../annotationDatum';
import { AnnotationType } from '../annotationTypes';
import { type FibonacciDatum, createFibonacciDatum, getFibonacciDefaultColor } from '../datum/fibonacciDatum';
import { getLineDefaultOpacity } from '../line/lineDatum';

export interface FibonacciRetracementDatum extends FibonacciDatum {
    type: AnnotationType.FibonacciRetracement;
}

export const fibonacciRetracementDatum = defineAnnotationDatum<FibonacciRetracementDatum>(
    AnnotationType.FibonacciRetracement,
    createFibonacciDatum,
    {
        getDefaultColor: getFibonacciDefaultColor,
        getDefaultOpacity: getLineDefaultOpacity,
    }
);
