import { defineAnnotationDatum } from '../annotationDatum';
import { AnnotationType, type DataPoint } from '../annotationTypes';
import { type FibonacciDatum, createFibonacciDatum, getFibonacciDefaultColor } from '../datum/fibonacciDatum';
import { getLineDefaultOpacity } from '../line/lineDatum';

export interface FibonacciRetracementTrendBasedDatum extends FibonacciDatum {
    type: AnnotationType.FibonacciRetracementTrendBased;
    endRetracement: DataPoint;
}

export const fibonacciRetracementTrendBasedDatum = defineAnnotationDatum<FibonacciRetracementTrendBasedDatum>(
    AnnotationType.FibonacciRetracementTrendBased,
    () => ({ ...createFibonacciDatum(), endRetracement: {} }),
    {
        getDefaultColor: getFibonacciDefaultColor,
        getDefaultOpacity: getLineDefaultOpacity,
    }
);
