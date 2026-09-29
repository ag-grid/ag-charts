import { defineAnnotationDatum } from '../annotationDatum';
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

export const arrowUpDatum = defineAnnotationDatum<ArrowUpDatum>(AnnotationType.ArrowUp, createShapePointDatum, {
    getDefaultColor: getShapeDefaultColor,
    getDefaultOpacity: getShapeDefaultOpacity,
});
