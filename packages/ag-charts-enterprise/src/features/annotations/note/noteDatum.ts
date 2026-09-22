import { isObject } from 'ag-charts-core';

import type { AnnotationDatumType, FillFields, StrokeFields } from '../annotationDatum';
import { type AnnotationOptionsColorPickerType, AnnotationType } from '../annotationTypes';
import { type TextualPointDatum, createTextualPointDatum } from '../datum/textualDatum';

export interface NoteBackgroundDatum extends FillFields, StrokeFields {}

export interface NoteDatum extends TextualPointDatum, FillFields, StrokeFields {
    type: AnnotationType.Note;
    background: NoteBackgroundDatum;
}

export const noteDatum: AnnotationDatumType<NoteDatum> = {
    create: () => ({ ...createTextualPointDatum(), type: AnnotationType.Note, background: {} }),
    is: (value): value is NoteDatum => isObject(value) && value.type === AnnotationType.Note,
    getDefaultColor: (datum: NoteDatum, colorPickerType: AnnotationOptionsColorPickerType) => {
        switch (colorPickerType) {
            case 'line-color':
                return datum.fill;
            case 'text-color':
                return datum.color;
        }
    },
    getDefaultOpacity: (datum: NoteDatum, colorPickerType: AnnotationOptionsColorPickerType) => {
        switch (colorPickerType) {
            case 'line-color':
                return datum.fillOpacity;
            case 'text-color':
                return undefined;
        }
    },
    // Always allow hovering so the note text can be made visible
    isHoverable: () => true,
};
