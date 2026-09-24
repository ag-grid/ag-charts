import { type FillFields, type StrokeFields, defineAnnotationDatum } from '../annotationDatum';
import { type AnnotationOptionsColorPickerType, AnnotationType } from '../annotationTypes';
import { type TextualPointDatum, createTextualPointDatum } from '../datum/textualDatum';

export interface NoteBackgroundDatum extends FillFields, StrokeFields {}

export interface NoteDatum extends TextualPointDatum, FillFields, StrokeFields {
    type: AnnotationType.Note;
    background: NoteBackgroundDatum;
}

function getNoteDefaultColor(datum: NoteDatum, colorPickerType: AnnotationOptionsColorPickerType) {
    switch (colorPickerType) {
        case 'line-color':
            return datum.fill;
        case 'text-color':
            return datum.color;
    }
}

function getNoteDefaultOpacity(datum: NoteDatum, colorPickerType: AnnotationOptionsColorPickerType) {
    switch (colorPickerType) {
        case 'line-color':
            return datum.fillOpacity;
        case 'text-color':
            return undefined;
    }
}

export const noteDatum = defineAnnotationDatum<NoteDatum>(
    AnnotationType.Note,
    () => ({ ...createTextualPointDatum(), background: {} }),
    {
        getDefaultColor: getNoteDefaultColor,
        getDefaultOpacity: getNoteDefaultOpacity,
        // Always hoverable so the note text can be revealed.
        isHoverable: () => true,
    }
);
