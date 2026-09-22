import { isObject } from 'ag-charts-core';

import type { AnnotationDatumType, FillFields, StrokeFields } from '../annotationDatum';
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

export const commentDatum: AnnotationDatumType<CommentDatum> = {
    create: () => ({ ...createTextualPointDatum(), type: AnnotationType.Comment }),
    is: (value): value is CommentDatum => isObject(value) && value.type === AnnotationType.Comment,
    getDefaultColor: getFilledTextualDefaultColor,
    getDefaultOpacity: getFilledTextualDefaultOpacity,
};
