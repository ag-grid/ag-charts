import { isObject } from 'ag-charts-core';

import type { AnnotationDatumType } from '../annotationDatum';
import { AnnotationType } from '../annotationTypes';
import {
    type ShapePointDatum,
    createShapePointDatum,
    getShapeDefaultColor,
    getShapeDefaultOpacity,
} from '../datum/shapePointDatum';

export interface ArrowDownDatum extends ShapePointDatum {
    type: AnnotationType.ArrowDown;
}

export const arrowDownDatum: AnnotationDatumType<ArrowDownDatum> = {
    create: () => ({ ...createShapePointDatum(), type: AnnotationType.ArrowDown }),
    is: (value): value is ArrowDownDatum => isObject(value) && value.type === AnnotationType.ArrowDown,
    getDefaultColor: getShapeDefaultColor,
    getDefaultOpacity: getShapeDefaultOpacity,
};
