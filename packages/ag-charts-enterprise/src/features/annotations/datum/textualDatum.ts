import {
    type FillFields,
    type FontFields,
    type LabelFields,
    type StrokeFields,
    createFontFields,
    createLabelFields,
} from '../annotationDatum';
import type { AnnotationOptionsColorPickerType } from '../annotationTypes';
import { type PointDatum, createPointDatum } from './pointDatum';
import { type StartEndDatum, createStartEndDatum } from './startEndDatum';

export interface TextualFields extends FontFields, LabelFields {
    text: string;
}

export interface TextualPointDatum extends PointDatum, TextualFields {}

export interface TextualStartEndDatum extends StartEndDatum, TextualFields {}

function createTextualFields(): TextualFields {
    return { ...createFontFields(), ...createLabelFields(), text: '' };
}

export function createTextualPointDatum(): Omit<TextualPointDatum, 'type'> {
    return { ...createPointDatum(), ...createTextualFields() };
}

export function createTextualStartEndDatum(): Omit<TextualStartEndDatum, 'type'> {
    return { ...createStartEndDatum(), ...createTextualFields() };
}

export function getTextualDefaultColor(datum: TextualFields) {
    return datum.color;
}

export function getTextualDefaultOpacity(): number | undefined {
    return undefined;
}

export function getFilledTextualDefaultColor(
    datum: TextualFields & FillFields & StrokeFields,
    colorPickerType: AnnotationOptionsColorPickerType
) {
    switch (colorPickerType) {
        case 'fill-color':
            return datum.fill;
        case 'line-color':
            return datum.stroke;
        case 'text-color':
            return datum.color;
    }
}

export function getFilledTextualDefaultOpacity(
    datum: FillFields & StrokeFields,
    colorPickerType: AnnotationOptionsColorPickerType
) {
    switch (colorPickerType) {
        case 'fill-color':
            return datum.fillOpacity;
        case 'line-color':
            return datum.strokeOpacity;
        case 'text-color':
            return undefined;
    }
}
