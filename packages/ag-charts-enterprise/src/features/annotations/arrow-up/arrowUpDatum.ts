import { isObject } from 'ag-charts-core';

import type { AnnotationDatumType } from '../annotationDatum';
import { AnnotationType } from '../annotationTypes';
import {
    type ShapePointDatum,
    createShapePointDatum,
    getShapeDefaultColor,
    getShapeDefaultOpacity,
} from '../datum/shapePointDatum';

export interface ArrowUpDatum extends ShapePointDatum {
    type: AnnotationType.ArrowUp;
}

export const arrowUpDatum: AnnotationDatumType<ArrowUpDatum> = {
    create: () => ({ ...createShapePointDatum(), type: AnnotationType.ArrowUp }),
    is: (value): value is ArrowUpDatum => isObject(value) && value.type === AnnotationType.ArrowUp,
    getDefaultColor: getShapeDefaultColor,
    getDefaultOpacity: getShapeDefaultOpacity,
};
