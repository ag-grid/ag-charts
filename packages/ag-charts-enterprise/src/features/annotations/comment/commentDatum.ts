import { type FillFields, type StrokeFields, defineAnnotationDatum } from '../annotationDatum';
import { AnnotationType } from '../annotationTypes';
import {
    type TextualPointDatum,
    createTextualPointDatum,
    getFilledTextualDefaultColor,
    getFilledTextualDefaultOpacity,
} from '../datum/textualDatum';

export interface CommentDatum extends TextualPointDatum, FillFields, StrokeFields {
    type: AnnotationType.Comment;
}

export const commentDatum = defineAnnotationDatum<CommentDatum>(AnnotationType.Comment, createTextualPointDatum, {
    getDefaultColor: getFilledTextualDefaultColor,
    getDefaultOpacity: getFilledTextualDefaultOpacity,
});
