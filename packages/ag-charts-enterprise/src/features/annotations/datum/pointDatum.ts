import {
    type AnnotationDatumBase,
    type PointFields,
    createAnnotationDatumBase,
    createPointFields,
} from '../annotationDatum';

export interface PointDatum extends AnnotationDatumBase, PointFields {}

export function createPointDatum(): Omit<PointDatum, 'type'> {
    return { ...createAnnotationDatumBase(), ...createPointFields() };
}
