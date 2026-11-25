import {
    type ExtendableFields,
    type LineStyleFields,
    type LineTextDatum,
    type StrokeFields,
    createLineTextDatum,
    defineAnnotationDatum,
} from '../annotationDatum';
import { type AnnotationOptionsColorPickerType, AnnotationType } from '../annotationTypes';
import { type StartEndDatum, createStartEndDatum } from '../datum/startEndDatum';

export interface LineTypeDatum extends StartEndDatum, StrokeFields, LineStyleFields, ExtendableFields {
    text: LineTextDatum;
}

export interface LineDatum extends LineTypeDatum {
    type: AnnotationType.Line;
}

export interface ArrowDatum extends LineTypeDatum {
    type: AnnotationType.Arrow;
}

export function createLineTypeDatum(): Omit<LineTypeDatum, 'type'> {
    return { ...createStartEndDatum(), text: createLineTextDatum() };
}

export function getLineDefaultColor(datum: LineTypeDatum, colorPickerType: AnnotationOptionsColorPickerType) {
    switch (colorPickerType) {
        case 'line-color':
            return datum.stroke;
        case 'text-color':
            return datum.text.color;
    }
}

export function getLineDefaultOpacity(datum: LineTypeDatum) {
    return datum.strokeOpacity;
}

export const lineDatum = defineAnnotationDatum<LineDatum>(AnnotationType.Line, createLineTypeDatum, {
    getDefaultColor: getLineDefaultColor,
    getDefaultOpacity: getLineDefaultOpacity,
});

export const arrowDatum = defineAnnotationDatum<ArrowDatum>(AnnotationType.Arrow, createLineTypeDatum, {
    getDefaultColor: getLineDefaultColor,
    getDefaultOpacity: getLineDefaultOpacity,
});
