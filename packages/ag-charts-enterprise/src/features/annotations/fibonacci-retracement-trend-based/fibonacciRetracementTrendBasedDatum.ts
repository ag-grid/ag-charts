import { isObject } from 'ag-charts-core';

import type { AnnotationDatumType } from '../annotationDatum';
import { AnnotationType, type DataPoint } from '../annotationTypes';
import { type FibonacciDatum, createFibonacciDatum, getFibonacciDefaultColor } from '../datum/fibonacciDatum';
import { getLineDefaultOpacity } from '../line/lineDatum';

export interface FibonacciRetracementTrendBasedDatum extends FibonacciDatum {
    type: AnnotationType.FibonacciRetracementTrendBased;
    endRetracement: DataPoint;
}

export const fibonacciRetracementTrendBasedDatum: AnnotationDatumType<FibonacciRetracementTrendBasedDatum> = {
    create: () => ({
        ...createFibonacciDatum(),
        type: AnnotationType.FibonacciRetracementTrendBased,
        endRetracement: {},
    }),
    is: (value): value is FibonacciRetracementTrendBasedDatum =>
        isObject(value) && value.type === AnnotationType.FibonacciRetracementTrendBased,
    getDefaultColor: getFibonacciDefaultColor,
    getDefaultOpacity: getLineDefaultOpacity,
};
