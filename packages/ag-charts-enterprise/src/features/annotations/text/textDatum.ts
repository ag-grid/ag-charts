import { isObject } from 'ag-charts-core';

import type { AnnotationDatumType } from '../annotationDatum';
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

export const textDatum: AnnotationDatumType<TextDatum> = {
    create: () => ({ ...createTextualPointDatum(), type: AnnotationType.Text }),
    is: (value): value is TextDatum => isObject(value) && value.type === AnnotationType.Text,
    getDefaultColor: getTextualDefaultColor,
    getDefaultOpacity: getTextualDefaultOpacity,
};
