import { isObject } from 'ag-charts-core';

import type { AnnotationDatumType } from '../annotationDatum';
import { AnnotationType } from '../annotationTypes';
import { type FibonacciDatum, createFibonacciDatum, getFibonacciDefaultColor } from '../datum/fibonacciDatum';
import { getLineDefaultOpacity } from '../line/lineDatum';

export interface FibonacciRetracementDatum extends FibonacciDatum {
    type: AnnotationType.FibonacciRetracement;
}

export const fibonacciRetracementDatum: AnnotationDatumType<FibonacciRetracementDatum> = {
    create: () => ({ ...createFibonacciDatum(), type: AnnotationType.FibonacciRetracement }),
    is: (value): value is FibonacciRetracementDatum =>
        isObject(value) && value.type === AnnotationType.FibonacciRetracement,
    getDefaultColor: getFibonacciDefaultColor,
    getDefaultOpacity: getLineDefaultOpacity,
};
