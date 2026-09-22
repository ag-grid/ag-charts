import { isObject } from 'ag-charts-core';

import {
    type AnnotationDatumType,
    type ExtendableFields,
    type LineStyleFields,
    type LineTextDatum,
    type StrokeFields,
    createLineTextDatum,
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

export const lineDatum: AnnotationDatumType<LineDatum> = {
    create: () => ({ ...createLineTypeDatum(), type: AnnotationType.Line }),
    is: (value): value is LineDatum => isObject(value) && value.type === AnnotationType.Line,
    getDefaultColor: getLineDefaultColor,
    getDefaultOpacity: getLineDefaultOpacity,
};

export const arrowDatum: AnnotationDatumType<ArrowDatum> = {
    create: () => ({ ...createLineTypeDatum(), type: AnnotationType.Arrow }),
    is: (value): value is ArrowDatum => isObject(value) && value.type === AnnotationType.Arrow,
    getDefaultColor: getLineDefaultColor,
    getDefaultOpacity: getLineDefaultOpacity,
};
