import { type FillFields, type StrokeFields, defineAnnotationDatum } from '../annotationDatum';
import { AnnotationType } from '../annotationTypes';
import {
    type TextualStartEndDatum,
    createTextualStartEndDatum,
    getFilledTextualDefaultColor,
    getFilledTextualDefaultOpacity,
} from '../datum/textualDatum';

export interface CalloutDatum extends TextualStartEndDatum, FillFields, StrokeFields {
    type: AnnotationType.Callout;
}

export const calloutDatum = defineAnnotationDatum<CalloutDatum>(AnnotationType.Callout, createTextualStartEndDatum, {
    getDefaultColor: getFilledTextualDefaultColor,
    getDefaultOpacity: getFilledTextualDefaultOpacity,
});
