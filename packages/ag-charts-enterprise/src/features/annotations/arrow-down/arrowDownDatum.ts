import { defineAnnotationDatum } from '../annotationDatum';
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

export const arrowDownDatum = defineAnnotationDatum<ArrowDownDatum>(AnnotationType.ArrowDown, createShapePointDatum, {
    getDefaultColor: getShapeDefaultColor,
    getDefaultOpacity: getShapeDefaultOpacity,
});
