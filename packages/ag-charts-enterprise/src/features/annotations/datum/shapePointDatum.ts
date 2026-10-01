import type { FillFields } from '../annotationDatum';
import type { AnnotationOptionsColorPickerType } from '../annotationTypes';
import { type PointDatum, createPointDatum } from './pointDatum';

export interface ShapePointDatum extends PointDatum, FillFields {}

export function createShapePointDatum(): Omit<ShapePointDatum, 'type'> {
    return createPointDatum();
}

export function getShapeDefaultColor(datum: ShapePointDatum, colorPickerType: AnnotationOptionsColorPickerType) {
    return colorPickerType === 'fill-color' ? datum.fill : undefined;
}

export function getShapeDefaultOpacity(datum: ShapePointDatum, colorPickerType: AnnotationOptionsColorPickerType) {
    return colorPickerType === 'fill-color' ? datum.fillOpacity : undefined;
}
