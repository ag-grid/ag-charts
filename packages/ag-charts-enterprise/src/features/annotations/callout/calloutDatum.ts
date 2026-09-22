import { isObject } from 'ag-charts-core';

import type { AnnotationDatumType, FillFields, StrokeFields } from '../annotationDatum';
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

export const calloutDatum: AnnotationDatumType<CalloutDatum> = {
    create: () => ({ ...createTextualStartEndDatum(), type: AnnotationType.Callout }),
    is: (value): value is CalloutDatum => isObject(value) && value.type === AnnotationType.Callout,
    getDefaultColor: getFilledTextualDefaultColor,
    getDefaultOpacity: getFilledTextualDefaultOpacity,
};
