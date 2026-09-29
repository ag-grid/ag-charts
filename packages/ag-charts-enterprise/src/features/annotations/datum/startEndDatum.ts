import {
    type AnnotationDatumBase,
    type StartEndFields,
    createAnnotationDatumBase,
    createStartEndFields,
} from '../annotationDatum';

export interface StartEndDatum extends AnnotationDatumBase, StartEndFields {}

export function createStartEndDatum(): Omit<StartEndDatum, 'type'> {
    return { ...createAnnotationDatumBase(), ...createStartEndFields() };
}
