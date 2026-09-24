import { defineAnnotationDatum } from '../annotationDatum';
import { AnnotationType } from '../annotationTypes';
import {
    type TextualPointDatum,
    createTextualPointDatum,
    getTextualDefaultColor,
    getTextualDefaultOpacity,
} from '../datum/textualDatum';

export interface TextDatum extends TextualPointDatum {
    type: AnnotationType.Text;
}

export const textDatum = defineAnnotationDatum<TextDatum>(AnnotationType.Text, createTextualPointDatum, {
    getDefaultColor: getTextualDefaultColor,
    getDefaultOpacity: getTextualDefaultOpacity,
});
